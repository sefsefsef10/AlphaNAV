import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import { db } from "../db";
import { mfaSettings, mfaBackupCodes, mfaSessions } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";
import bcrypt from "bcrypt";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { encrypt, decrypt } from "./encryption";

const APP_NAME = "AlphaNAV";
const BACKUP_CODE_COUNT = 10;
const MFA_SESSION_DURATION = 10 * 60 * 1000; // 10 minutes

export interface MFAEnrollmentData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  success: boolean;
  mfaSessionId?: string;
  error?: string;
}

/**
 * Generate TOTP secret and QR code for MFA enrollment
 */
export async function generateMFASecret(userId: string, userEmail: string): Promise<MFAEnrollmentData> {
  // Generate TOTP secret
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${userEmail})`,
    issuer: APP_NAME,
    length: 32,
  });

  if (!secret.otpauth_url) {
    throw new Error("Failed to generate OTP auth URL");
  }

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Enable MFA for a user after verifying initial TOTP code
 */
export async function enableMFA(
  userId: string,
  secret: string,
  verificationCode: string,
  backupCodes: string[],
  backupPhone?: string
): Promise<{ success: boolean; error?: string }> {
  // Verify the TOTP code
  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: verificationCode,
    window: 2, // Allow 2 time steps before/after for clock drift
  });

  if (!verified) {
    return { success: false, error: "Invalid verification code" };
  }

  // Hash backup codes before storing
  const hashedBackupCodes = await Promise.all(
    backupCodes.map(async (code) => ({
      userId,
      code: await bcrypt.hash(code, 10),
      used: false,
    }))
  );

  // Store MFA settings and backup codes in transaction
  await db.transaction(async (tx: NodePgDatabase<any>) => {
    // Encrypt TOTP secret before storing
    const encryptedSecret = encrypt(secret);
    
    // Upsert MFA settings
    await tx
      .insert(mfaSettings)
      .values({
        userId,
        enabled: true,
        totpSecret: encryptedSecret,
        backupPhone: backupPhone || null,
        smsEnabled: false,
      })
      .onConflictDoUpdate({
        target: mfaSettings.userId,
        set: {
          enabled: true,
          totpSecret: encryptedSecret,
          backupPhone: backupPhone || null,
          updatedAt: new Date(),
        },
      });

    // Delete old backup codes
    await tx.delete(mfaBackupCodes).where(eq(mfaBackupCodes.userId, userId));

    // Insert new backup codes
    await tx.insert(mfaBackupCodes).values(hashedBackupCodes);
  });

  return { success: true };
}

/**
 * Verify MFA TOTP code for login
 */
export async function verifyMFACode(
  userId: string,
  code: string,
  ipAddress?: string,
  userAgent?: string
): Promise<MFAVerificationResult> {
  // Get user's MFA settings
  const [settings] = await db
    .select()
    .from(mfaSettings)
    .where(and(eq(mfaSettings.userId, userId), eq(mfaSettings.enabled, true)));

  if (!settings || !settings.totpSecret) {
    return { success: false, error: "MFA not enabled for this user" };
  }

  // Check if it's a backup code (format: XXXX-XXXX)
  if (code.includes("-")) {
    return verifyBackupCode(userId, code, ipAddress, userAgent);
  }

  // Decrypt TOTP secret before verification
  const decryptedSecret = decrypt(settings.totpSecret);

  // Verify TOTP code
  const verified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: "base32",
    token: code,
    window: 2,
  });

  if (!verified) {
    return { success: false, error: "Invalid verification code" };
  }

  // Create MFA session
  const mfaSessionId = await createMFASession(userId, ipAddress, userAgent);

  return { success: true, mfaSessionId };
}

/**
 * Verify backup recovery code
 */
async function verifyBackupCode(
  userId: string,
  code: string,
  ipAddress?: string,
  userAgent?: string
): Promise<MFAVerificationResult> {
  // Get all unused backup codes for user
  const userBackupCodes = await db
    .select()
    .from(mfaBackupCodes)
    .where(and(eq(mfaBackupCodes.userId, userId), eq(mfaBackupCodes.used, false)));

  // Check each backup code
  for (const backupCode of userBackupCodes) {
    const matches = await bcrypt.compare(code, backupCode.code);
    
    if (matches) {
      // Mark code as used
      await db
        .update(mfaBackupCodes)
        .set({ used: true, usedAt: new Date() })
        .where(eq(mfaBackupCodes.id, backupCode.id));

      // Create MFA session
      const mfaSessionId = await createMFASession(userId, ipAddress, userAgent);

      return { success: true, mfaSessionId };
    }
  }

  return { success: false, error: "Invalid backup code" };
}

/**
 * Create MFA verification session
 */
async function createMFASession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const expiresAt = new Date(Date.now() + MFA_SESSION_DURATION);

  const [session] = await db
    .insert(mfaSessions)
    .values({
      userId,
      verified: true,
      verifiedAt: new Date(),
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    })
    .returning();

  return session.id;
}

/**
 * Verify MFA session is valid and matches client context
 */
export async function verifyMFASession(
  sessionId: string,
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  const [session] = await db
    .select()
    .from(mfaSessions)
    .where(
      and(
        eq(mfaSessions.id, sessionId),
        eq(mfaSessions.userId, userId),
        eq(mfaSessions.verified, true)
      )
    );

  if (!session) {
    return false;
  }

  // Check if expired
  if (new Date() > session.expiresAt) {
    return false;
  }

  // Bind session to client context (IP + User-Agent)
  // If either IP or User-Agent changes, invalidate the session
  if (ipAddress && session.ipAddress && ipAddress !== session.ipAddress) {
    console.warn(`MFA session ${sessionId}: IP mismatch (expected ${session.ipAddress}, got ${ipAddress})`);
    return false;
  }

  if (userAgent && session.userAgent && userAgent !== session.userAgent) {
    console.warn(`MFA session ${sessionId}: User-Agent mismatch`);
    return false;
  }

  return true;
}

/**
 * Disable MFA for a user
 */
export async function disableMFA(userId: string): Promise<void> {
  await db.transaction(async (tx: NodePgDatabase<any>) => {
    await tx
      .update(mfaSettings)
      .set({ enabled: false, updatedAt: new Date() })
      .where(eq(mfaSettings.userId, userId));

    await tx.delete(mfaBackupCodes).where(eq(mfaBackupCodes.userId, userId));
    await tx.delete(mfaSessions).where(eq(mfaSessions.userId, userId));
  });
}

/**
 * Check if user has MFA enabled
 */
export async function isMFAEnabled(userId: string): Promise<boolean> {
  const [settings] = await db
    .select({ enabled: mfaSettings.enabled })
    .from(mfaSettings)
    .where(eq(mfaSettings.userId, userId));

  return settings?.enabled || false;
}

/**
 * Get MFA status for user
 */
export async function getMFAStatus(userId: string) {
  const [settings] = await db
    .select()
    .from(mfaSettings)
    .where(eq(mfaSettings.userId, userId));

  if (!settings) {
    return {
      enabled: false,
      backupPhone: null,
      smsEnabled: false,
    };
  }

  return {
    enabled: settings.enabled,
    backupPhone: settings.backupPhone,
    smsEnabled: settings.smsEnabled,
  };
}

/**
 * Generate backup recovery codes
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // Generate 8-character code in format XXXX-XXXX
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
    codes.push(formatted);
  }

  return codes;
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  // Check if MFA is enabled
  const enabled = await isMFAEnabled(userId);
  if (!enabled) {
    throw new Error("MFA not enabled");
  }

  // Generate new codes
  const newCodes = generateBackupCodes();

  // Hash codes
  const hashedCodes = await Promise.all(
    newCodes.map(async (code) => ({
      userId,
      code: await bcrypt.hash(code, 10),
      used: false,
    }))
  );

  // Replace backup codes in transaction
  await db.transaction(async (tx: NodePgDatabase<any>) => {
    await tx.delete(mfaBackupCodes).where(eq(mfaBackupCodes.userId, userId));
    await tx.insert(mfaBackupCodes).values(hashedCodes);
  });

  return newCodes;
}

/**
 * Get count of remaining backup codes
 */
export async function getRemainingBackupCodeCount(userId: string): Promise<number> {
  const codes = await db
    .select()
    .from(mfaBackupCodes)
    .where(and(eq(mfaBackupCodes.userId, userId), eq(mfaBackupCodes.used, false)));

  return codes.length;
}

/**
 * Cleanup expired MFA sessions (called by cron job)
 */
export async function cleanupExpiredMFASessions(): Promise<number> {
  const result = await db
    .delete(mfaSessions)
    .where(lt(mfaSessions.expiresAt, new Date()))
    .returning();

  return result.length;
}
