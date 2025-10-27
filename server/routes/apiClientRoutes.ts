import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db";
import { apiClients, apiUsageLogs, accessTokens } from "@shared/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { generateClientCredentials } from "../oauth/oauthServer";

const router = Router();

// GET /api/oauth/clients - List all API clients (operations/admin only)
router.get("/clients", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    const clients = await db
      .select({
        id: apiClients.id,
        clientId: apiClients.clientId,
        clientName: apiClients.clientName,
        organizationId: apiClients.organizationId,
        allowedScopes: apiClients.allowedScopes,
        status: apiClients.status,
        rateLimit: apiClients.rateLimit,
        environment: apiClients.environment,
        contactEmail: apiClients.contactEmail,
        lastUsed: apiClients.lastUsed,
        createdAt: apiClients.createdAt,
        createdBy: apiClients.createdBy,
      })
      .from(apiClients)
      .orderBy(desc(apiClients.createdAt));

    return res.json(clients);
  } catch (error: any) {
    console.error("Error fetching API clients:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/oauth/clients - Create new API client
router.post("/clients", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    const {
      clientName,
      organizationId,
      allowedScopes,
      rateLimit,
      environment,
      contactEmail,
      webhookUrl,
    } = req.body;

    if (!clientName || !allowedScopes) {
      return res.status(400).json({ error: "clientName and allowedScopes are required" });
    }

    // Generate credentials
    const { clientId, clientSecret, hashedSecret } = generateClientCredentials();

    // Create client
    const [newClient] = await db
      .insert(apiClients)
      .values({
        clientId,
        clientSecret: hashedSecret,
        clientName,
        organizationId: organizationId || null,
        redirectUris: [],
        allowedScopes: Array.isArray(allowedScopes) ? allowedScopes : [allowedScopes],
        grantTypes: ["client_credentials"],
        status: "active",
        rateLimit: rateLimit || 1000,
        environment: environment || "production",
        webhookUrl: webhookUrl || null,
        contactEmail: contactEmail || null,
        createdBy: req.user.id,
      })
      .returning();

    // Return client with secret (only time it's shown)
    return res.status(201).json({
      ...newClient,
      clientSecret, // Raw secret shown only once
    });
  } catch (error: any) {
    console.error("Error creating API client:", error);
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/oauth/clients/:id - Update API client
router.patch("/clients/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    const { id } = req.params;
    const { status, rateLimit, allowedScopes, contactEmail, webhookUrl } = req.body;

    const updates: any = { updatedAt: new Date() };

    if (status !== undefined) updates.status = status;
    if (rateLimit !== undefined) updates.rateLimit = rateLimit;
    if (allowedScopes !== undefined) updates.allowedScopes = allowedScopes;
    if (contactEmail !== undefined) updates.contactEmail = contactEmail;
    if (webhookUrl !== undefined) updates.webhookUrl = webhookUrl;

    const [updated] = await db
      .update(apiClients)
      .set(updates)
      .where(eq(apiClients.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Client not found" });
    }

    return res.json(updated);
  } catch (error: any) {
    console.error("Error updating API client:", error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/oauth/clients/:id - Delete API client
router.delete("/clients/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    const { id } = req.params;

    // Get client to find clientId
    const [client] = await db
      .select()
      .from(apiClients)
      .where(eq(apiClients.id, id))
      .limit(1);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Revoke all active tokens
    await db
      .update(accessTokens)
      .set({ revoked: true })
      .where(eq(accessTokens.clientId, client.clientId));

    // Delete client
    await db.delete(apiClients).where(eq(apiClients.id, id));

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting API client:", error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/oauth/clients/:id/usage - Get usage stats for a client
router.get("/clients/:id/usage", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    const { id } = req.params;
    const { days = 7 } = req.query;

    // Get client
    const [client] = await db
      .select()
      .from(apiClients)
      .where(eq(apiClients.id, id))
      .limit(1);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Get usage logs
    const since = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

    const usageLogs = await db
      .select()
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.clientId, client.clientId),
          gte(apiUsageLogs.createdAt, since)
        )
      )
      .orderBy(desc(apiUsageLogs.createdAt))
      .limit(1000);

    // Calculate stats
    const stats = {
      totalRequests: usageLogs.length,
      successfulRequests: usageLogs.filter((log) => log.statusCode >= 200 && log.statusCode < 300).length,
      failedRequests: usageLogs.filter((log) => log.statusCode >= 400).length,
      avgResponseTime: usageLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / usageLogs.length || 0,
      endpointUsage: usageLogs.reduce((acc, log) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentLogs: usageLogs.slice(0, 50),
    };

    return res.json(stats);
  } catch (error: any) {
    console.error("Error fetching client usage:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
