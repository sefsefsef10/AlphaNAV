import { Router } from "express";
import { z } from "zod";
import type { User } from "@shared/schema";
import {
  generateMFASecret,
  enableMFA,
  verifyMFACode,
  disableMFA,
  isMFAEnabled,
  getMFAStatus,
  regenerateBackupCodes,
  getRemainingBackupCodeCount,
} from "../services/mfaService";
import {
  mfaVerifyLimiter,
  mfaEnrollLimiter,
  mfaRegenerateLimiter,
  mfaGeneralLimiter,
} from "../middleware/mfaRateLimiting";

export const mfaRouter = Router();

// Apply general rate limiting to all MFA endpoints
mfaRouter.use(mfaGeneralLimiter);

/**
 * GET /api/mfa/status
 * Get MFA status for current user
 */
mfaRouter.get("/status", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const status = await getMFAStatus(req.user.id);
    const backupCodeCount = status.enabled 
      ? await getRemainingBackupCodeCount(req.user.id)
      : 0;

    res.json({
      ...status,
      backupCodeCount,
    });
  } catch (error) {
    console.error("Error getting MFA status:", error);
    res.status(500).json({ error: "Failed to get MFA status" });
  }
});

/**
 * POST /api/mfa/generate
 * Generate MFA secret and QR code for enrollment
 */
mfaRouter.post("/generate", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as User;
    
    if (!user.email) {
      return res.status(400).json({ error: "User email is required" });
    }

    const enrollmentData = await generateMFASecret(user.id, user.email);

    res.json(enrollmentData);
  } catch (error) {
    console.error("Error generating MFA secret:", error);
    res.status(500).json({ error: "Failed to generate MFA secret" });
  }
});

/**
 * POST /api/mfa/enable
 * Enable MFA after verifying initial code
 */
const enableMFASchema = z.object({
  secret: z.string(),
  verificationCode: z.string().length(6),
  backupCodes: z.array(z.string()).length(10),
  backupPhone: z.string().optional(),
});

mfaRouter.post("/enable", mfaEnrollLimiter, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validation = enableMFASchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.issues,
      });
    }

    const { secret, verificationCode, backupCodes, backupPhone } = validation.data;

    const result = await enableMFA(
      req.user.id,
      secret,
      verificationCode,
      backupCodes,
      backupPhone
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ 
      success: true,
      message: "MFA enabled successfully",
    });
  } catch (error) {
    console.error("Error enabling MFA:", error);
    res.status(500).json({ error: "Failed to enable MFA" });
  }
});

/**
 * POST /api/mfa/verify
 * Verify MFA code during login
 */
const verifyMFASchema = z.object({
  code: z.string().min(6),
});

mfaRouter.post("/verify", mfaVerifyLimiter, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validation = verifyMFASchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.issues,
      });
    }

    const { code } = validation.data;
    const ipAddress = req.ip;
    const userAgent = req.get("user-agent");

    const result = await verifyMFACode(
      req.user.id,
      code,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Store MFA session ID in session
    if (req.session && result.mfaSessionId) {
      (req.session as any).mfaSessionId = result.mfaSessionId;
      (req.session as any).mfaVerified = true;
    }

    res.json({ 
      success: true,
      message: "MFA verification successful",
    });
  } catch (error) {
    console.error("Error verifying MFA:", error);
    res.status(500).json({ error: "Failed to verify MFA code" });
  }
});

/**
 * POST /api/mfa/disable
 * Disable MFA for current user (requires re-verification)
 */
const disableMFASchema = z.object({
  verificationCode: z.string().min(6), // Require fresh MFA code
});

mfaRouter.post("/disable", mfaVerifyLimiter, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validation = disableMFASchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Verification code required to disable MFA",
        details: validation.error.issues,
      });
    }

    const { verificationCode } = validation.data;

    // Verify MFA code before allowing disable
    const verifyResult = await verifyMFACode(
      req.user.id,
      verificationCode,
      req.ip,
      req.get("user-agent")
    );

    if (!verifyResult.success) {
      return res.status(403).json({
        error: "Invalid verification code",
        message: "You must verify your identity before disabling MFA",
      });
    }

    await disableMFA(req.user.id);

    // Clear MFA session data
    if (req.session) {
      delete (req.session as any).mfaSessionId;
      delete (req.session as any).mfaVerified;
    }

    res.json({ 
      success: true,
      message: "MFA disabled successfully",
    });
  } catch (error) {
    console.error("Error disabling MFA:", error);
    res.status(500).json({ error: "Failed to disable MFA" });
  }
});

/**
 * POST /api/mfa/regenerate-codes
 * Regenerate backup recovery codes (requires re-verification)
 */
const regenerateCodesSchema = z.object({
  verificationCode: z.string().min(6), // Require fresh MFA code
});

mfaRouter.post("/regenerate-codes", mfaRegenerateLimiter, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validation = regenerateCodesSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Verification code required to regenerate backup codes",
        details: validation.error.issues,
      });
    }

    const { verificationCode } = validation.data;

    // Verify MFA code before allowing regeneration
    const verifyResult = await verifyMFACode(
      req.user.id,
      verificationCode,
      req.ip,
      req.get("user-agent")
    );

    if (!verifyResult.success) {
      return res.status(403).json({
        error: "Invalid verification code",
        message: "You must verify your identity before regenerating backup codes",
      });
    }

    const newCodes = await regenerateBackupCodes(req.user.id);

    res.json({ 
      success: true,
      backupCodes: newCodes,
      message: "Backup codes regenerated successfully",
    });
  } catch (error) {
    console.error("Error regenerating backup codes:", error);
    res.status(500).json({ error: "Failed to regenerate backup codes" });
  }
});

/**
 * GET /api/mfa/backup-codes/count
 * Get remaining backup code count
 */
mfaRouter.get("/backup-codes/count", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const count = await getRemainingBackupCodeCount(req.user.id);

    res.json({ count });
  } catch (error) {
    console.error("Error getting backup code count:", error);
    res.status(500).json({ error: "Failed to get backup code count" });
  }
});
