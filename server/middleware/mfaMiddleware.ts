import type { Request, Response, NextFunction } from "express";
import { isMFAEnabled, verifyMFASession } from "../services/mfaService";

/**
 * Middleware to enforce MFA verification
 * Checks if user has MFA enabled and requires verification
 */
export async function requireMFA(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user has MFA enabled
    const mfaEnabled = await isMFAEnabled(req.user.id);

    if (!mfaEnabled) {
      // MFA not enabled, allow access
      return next();
    }

    // MFA is enabled, check if session is verified
    const session = req.session as any;
    const mfaSessionId = session?.mfaSessionId;
    const mfaVerified = session?.mfaVerified;

    if (!mfaVerified || !mfaSessionId) {
      return res.status(403).json({
        error: "MFA verification required",
        code: "MFA_REQUIRED",
        message: "Please complete multi-factor authentication",
      });
    }

    // Verify the MFA session is still valid
    const sessionValid = await verifyMFASession(mfaSessionId, req.user.id);

    if (!sessionValid) {
      // Session expired or invalid, clear it
      delete session.mfaSessionId;
      delete session.mfaVerified;

      return res.status(403).json({
        error: "MFA session expired",
        code: "MFA_SESSION_EXPIRED",
        message: "Your MFA session has expired. Please verify again",
      });
    }

    // MFA verified and session valid, allow access
    next();
  } catch (error) {
    console.error("MFA middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Optional MFA middleware - checks MFA but doesn't enforce
 * Useful for endpoints that want to know MFA status but don't require it
 */
export async function checkMFA(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return next();
    }

    const mfaEnabled = await isMFAEnabled(req.user.id);
    const session = req.session as any;

    // Attach MFA status to request
    (req as any).mfaStatus = {
      enabled: mfaEnabled,
      verified: session?.mfaVerified || false,
    };

    next();
  } catch (error) {
    console.error("MFA check middleware error:", error);
    next();
  }
}
