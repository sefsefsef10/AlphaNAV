import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

export const healthRouter = Router();

/**
 * GET /health
 * Basic health check endpoint for load balancers and monitoring
 */
healthRouter.get("/", async (_req, res) => {
  try {
    // Check database connectivity
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbLatency = Date.now() - start;

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: "connected",
        latency_ms: dbLatency,
      },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /health/detailed
 * Detailed health check with additional system info
 */
healthRouter.get("/detailed", async (req, res) => {
  try {
    // Only allow operations/admin to access detailed health info
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as any;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Database check
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbLatency = Date.now() - dbStart;

    // Memory usage
    const memUsage = process.memoryUsage();

    // Check critical environment variables
    const criticalEnvVars = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      SESSION_SECRET: !!process.env.SESSION_SECRET,
      MFA_ENCRYPTION_KEY: !!process.env.MFA_ENCRYPTION_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    };

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      node_version: process.version,
      environment: process.env.NODE_ENV || "development",
      database: {
        status: "connected",
        latency_ms: dbLatency,
      },
      memory: {
        rss_mb: Math.round(memUsage.rss / 1024 / 1024),
        heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      env_vars: criticalEnvVars,
    });
  } catch (error) {
    console.error("Detailed health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
