import crypto from "crypto";
import bcrypt from "bcrypt";
import { db } from "../db";
import { apiClients, accessTokens, apiUsageLogs } from "@shared/schema";
import { eq, and, gt, gte, sql } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

const BCRYPT_ROUNDS = 10;

// Generate secure random tokens
export function generateToken(length: number = 64): string {
  return crypto.randomBytes(length).toString("hex");
}

// Hash client secrets using bcrypt (10 rounds)
export async function hashSecret(secret: string): Promise<string> {
  return await bcrypt.hash(secret, BCRYPT_ROUNDS);
}

// Verify client secret against bcrypt hash
export async function verifySecret(secret: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(secret, hash);
}

// Generate client credentials
export async function generateClientCredentials() {
  const clientId = `api_${generateToken(16)}`;
  const clientSecret = generateToken(32);
  const hashedSecret = await hashSecret(clientSecret);
  
  return {
    clientId,
    clientSecret, // Return raw secret only once for user to save
    hashedSecret, // Store this in database
  };
}

// OAuth2 access token generation (1 hour expiry)
export async function generateAccessToken(
  clientId: string,
  scopes: string[],
  userId?: string
): Promise<string> {
  const token = `alphanav_${generateToken(48)}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(accessTokens).values({
    token,
    tokenType: "access",
    clientId,
    userId,
    scopes: JSON.stringify(scopes),
    expiresAt,
    revoked: false,
  });

  return token;
}

// OAuth2 refresh token generation (30 day expiry)
export async function generateRefreshToken(
  clientId: string,
  scopes: string[],
  userId?: string
): Promise<string> {
  const token = `refresh_${generateToken(48)}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(accessTokens).values({
    token,
    tokenType: "refresh",
    clientId,
    userId,
    scopes: JSON.stringify(scopes),
    expiresAt,
    revoked: false,
  });

  return token;
}

// Verify access token (for bearer authentication)
export async function verifyAccessToken(token: string): Promise<{
  valid: boolean;
  clientId?: string;
  userId?: string;
  scopes?: string[];
  error?: string;
}> {
  const [tokenRecord] = await db
    .select()
    .from(accessTokens)
    .where(eq(accessTokens.token, token))
    .limit(1);

  if (!tokenRecord) {
    return { valid: false, error: "Invalid token" };
  }

  if (tokenRecord.revoked) {
    return { valid: false, error: "Token revoked" };
  }

  if (new Date() > tokenRecord.expiresAt) {
    return { valid: false, error: "Token expired" };
  }

  // Reject refresh tokens when verifying access (bearer auth)
  if (tokenRecord.tokenType === "refresh") {
    return { valid: false, error: "Refresh token cannot be used for API access" };
  }

  const scopes = JSON.parse(tokenRecord.scopes as string) as string[];

  return {
    valid: true,
    clientId: tokenRecord.clientId,
    userId: tokenRecord.userId || undefined,
    scopes,
  };
}

// Verify refresh token (for token rotation)
export async function verifyRefreshToken(token: string): Promise<{
  valid: boolean;
  clientId?: string;
  userId?: string;
  scopes?: string[];
  error?: string;
}> {
  const [tokenRecord] = await db
    .select()
    .from(accessTokens)
    .where(eq(accessTokens.token, token))
    .limit(1);

  if (!tokenRecord) {
    return { valid: false, error: "Invalid token" };
  }

  if (tokenRecord.revoked) {
    return { valid: false, error: "Token revoked" };
  }

  if (new Date() > tokenRecord.expiresAt) {
    return { valid: false, error: "Token expired" };
  }

  // Only accept refresh tokens
  if (tokenRecord.tokenType !== "refresh") {
    return { valid: false, error: "Token is not a refresh token" };
  }

  const scopes = JSON.parse(tokenRecord.scopes as string) as string[];

  return {
    valid: true,
    clientId: tokenRecord.clientId,
    userId: tokenRecord.userId || undefined,
    scopes,
  };
}

// OAuth2 middleware for protecting public API routes
export function requireOAuth(requiredScopes: string[] = []) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "unauthorized",
        error_description: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const verification = await verifyAccessToken(token);

    if (!verification.valid) {
      return res.status(401).json({
        error: "unauthorized",
        error_description: verification.error,
      });
    }

    // Check scopes if required
    if (requiredScopes.length > 0) {
      const hasAllScopes = requiredScopes.every((scope) =>
        verification.scopes?.includes(scope)
      );

      if (!hasAllScopes) {
        return res.status(403).json({
          error: "insufficient_scope",
          error_description: `Required scopes: ${requiredScopes.join(", ")}`,
        });
      }
    }

    // Attach client info to request
    (req as any).oauth = {
      clientId: verification.clientId,
      userId: verification.userId,
      scopes: verification.scopes,
    };

    // Get client details for rate limiting
    const [client] = await db
      .select()
      .from(apiClients)
      .where(eq(apiClients.clientId, verification.clientId!))
      .limit(1);

    if (!client || client.status !== "active") {
      return res.status(403).json({
        error: "forbidden",
        error_description: "API client is not active",
      });
    }

    // Enforce rate limiting (using COUNT for efficiency)
    const rateLimit = client.rateLimit || 1000; // Default 1000 requests/hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.clientId, verification.clientId!),
          gte(apiUsageLogs.createdAt, oneHourAgo)
        )
      );

    const requestCount = countResult?.count || 0;

    if (requestCount >= rateLimit) {
      return res.status(429).json({
        error: "rate_limit_exceeded",
        error_description: `Rate limit of ${rateLimit} requests per hour exceeded`,
        retry_after: 3600, // seconds until rate limit resets
      });
    }

    // Update last used timestamp
    await db
      .update(apiClients)
      .set({ lastUsed: new Date() })
      .where(eq(apiClients.clientId, verification.clientId!));

    (req as any).apiClient = client;

    next();
  };
}

// Log API usage
export async function logApiUsage(
  clientId: string,
  req: Request,
  res: Response,
  startTime: number,
  error?: string
) {
  const responseTime = Date.now() - startTime;

  try {
    await db.insert(apiUsageLogs).values({
      clientId,
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      requestSize: req.get("content-length") ? parseInt(req.get("content-length")!) : null,
      responseSize: null, // Would need to capture response body size
      ipAddress: req.ip || req.socket.remoteAddress || null,
      userAgent: req.get("user-agent") || null,
      error,
    });
  } catch (err) {
    console.error("Failed to log API usage:", err);
  }
}

// Middleware to log all OAuth API calls
export function apiUsageLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const oauth = (req as any).oauth;
    if (!oauth) {
      return next();
    }

    const startTime = Date.now();

    // Capture response
    const originalSend = res.send;
    res.send = function (data: any) {
      res.send = originalSend;
      logApiUsage(oauth.clientId, req, res, startTime).catch(console.error);
      return res.send(data);
    };

    // Handle errors
    res.on("finish", () => {
      if (res.statusCode >= 400) {
        logApiUsage(
          oauth.clientId,
          req,
          res,
          startTime,
          `HTTP ${res.statusCode}`
        ).catch(console.error);
      }
    });

    next();
  };
}
