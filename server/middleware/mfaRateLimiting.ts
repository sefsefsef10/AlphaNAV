import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Rate limiter for MFA verification attempts
 * Prevents brute-force attacks on TOTP codes
 * 
 * Limits: 5 attempts per 15 minutes per IP
 */
export const mfaVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: "Too many MFA verification attempts",
    message: "Please try again in 15 minutes",
    code: "MFA_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IPv6-safe IP + user ID for better rate limiting
  keyGenerator: (req) => {
    const userId = (req.user as any)?.id || "anonymous";
    const ip = ipKeyGenerator(req);
    return `${ip}-${userId}`;
  },
});

/**
 * Rate limiter for MFA enrollment
 * Prevents spam enrollment attempts
 * 
 * Limits: 3 enrollment attempts per hour per IP
 */
export const mfaEnrollLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per window
  message: {
    error: "Too many MFA enrollment attempts",
    message: "Please try again in 1 hour",
    code: "MFA_ENROLL_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req.user as any)?.id || "anonymous";
    const ip = ipKeyGenerator(req);
    return `${ip}-${userId}`;
  },
});

/**
 * Rate limiter for backup code regeneration
 * Prevents spam regeneration
 * 
 * Limits: 2 regenerations per 6 hours per user
 */
export const mfaRegenerateLimiter = rateLimit({
  windowMs: 6 * 60 * 60 * 1000, // 6 hours
  max: 2, // 2 regenerations per window
  message: {
    error: "Too many backup code regeneration attempts",
    message: "Please try again in 6 hours",
    code: "MFA_REGENERATE_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Regeneration is user-specific only (not IP-based)
  keyGenerator: (req) => {
    const userId = (req.user as any)?.id || "anonymous";
    return `mfa-regen-${userId}`;
  },
  skipFailedRequests: false,
});

/**
 * General MFA endpoint rate limiter
 * Protects other MFA endpoints from abuse
 * 
 * Limits: 20 requests per 10 minutes per IP
 */
export const mfaGeneralLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 requests per window
  message: {
    error: "Too many requests to MFA endpoints",
    message: "Please try again later",
    code: "MFA_GENERAL_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
