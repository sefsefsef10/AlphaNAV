/**
 * Fund Administrator Integration Routes
 * Manage connections to SS&C Intralinks, Alter Domus, Apex, etc.
 */

import { Router, type Request, type Response } from "express";
import { db } from "../db";
import {
  fundAdminConnections,
  fundAdminSyncLogs,
  insertFundAdminConnectionSchema,
  type InsertFundAdminConnection,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import {
  syncFundAdminData,
  testFundAdminConnection,
  syncAllActiveFundAdmins,
} from "../services/fundAdminSync";

const router = Router();

// GET /api/fund-admin-connections
// List all fund admin connections (operations/admin only)
router.get("/fund-admin-connections", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Only operations and admin users can view fund admin connections" 
      });
    }

    const connections = await db
      .select()
      .from(fundAdminConnections)
      .orderBy(desc(fundAdminConnections.createdAt));

    res.json(connections);
  } catch (error) {
    console.error("List fund admin connections error:", error);
    res.status(500).json({ 
      error: "Failed to list connections",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/fund-admin-connections/:id
// Get a specific fund admin connection
router.get("/fund-admin-connections/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Only operations and admin users can view fund admin connections" 
      });
    }

    const { id } = req.params;

    const [connection] = await db
      .select()
      .from(fundAdminConnections)
      .where(eq(fundAdminConnections.id, id))
      .limit(1);

    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }

    res.json(connection);
  } catch (error) {
    console.error("Get fund admin connection error:", error);
    res.status(500).json({ 
      error: "Failed to get connection",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/fund-admin-connections
// Create a new fund admin connection
router.post("/fund-admin-connections", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Only operations and admin users can create fund admin connections" 
      });
    }

    // Validate request body
    const validation = insertFundAdminConnectionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: validation.error.errors 
      });
    }

    const [connection] = await db
      .insert(fundAdminConnections)
      .values(validation.data)
      .returning();

    res.json(connection);
  } catch (error) {
    console.error("Create fund admin connection error:", error);
    res.status(500).json({ 
      error: "Failed to create connection",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PATCH /api/fund-admin-connections/:id
// Update a fund admin connection
router.patch("/fund-admin-connections/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Only operations and admin users can update fund admin connections" 
      });
    }

    const { id } = req.params;

    const [connection] = await db
      .update(fundAdminConnections)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(fundAdminConnections.id, id))
      .returning();

    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }

    res.json(connection);
  } catch (error) {
    console.error("Update fund admin connection error:", error);
    res.status(500).json({ 
      error: "Failed to update connection",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// DELETE /api/fund-admin-connections/:id
// Delete a fund admin connection
router.delete("/fund-admin-connections/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Only operations and admin users can delete fund admin connections" 
      });
    }

    const { id } = req.params;

    await db
      .delete(fundAdminConnections)
      .where(eq(fundAdminConnections.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete fund admin connection error:", error);
    res.status(500).json({ 
      error: "Failed to delete connection",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/fund-admin-connections/:id/sync
// Manually trigger a sync for a specific connection
router.post("/fund-admin-connections/:id/sync", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Only operations and admin users can trigger syncs" 
      });
    }

    const { id } = req.params;

    const result = await syncFundAdminData(id);

    res.json(result);
  } catch (error) {
    console.error("Trigger sync error:", error);
    res.status(500).json({ 
      error: "Failed to trigger sync",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/fund-admin-connections/:id/test
// Test a fund admin connection
router.post("/fund-admin-connections/:id/test", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Only operations and admin users can test connections" 
      });
    }

    const { id } = req.params;

    const result = await testFundAdminConnection(id);

    res.json(result);
  } catch (error) {
    console.error("Test connection error:", error);
    res.status(500).json({ 
      error: "Failed to test connection",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/fund-admin-connections/sync-all
// Trigger sync for all active connections
router.post("/fund-admin-connections/sync-all", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Only operations and admin users can trigger bulk syncs" 
      });
    }

    // Trigger async (don't wait for completion)
    syncAllActiveFundAdmins().catch(err => 
      console.error("Bulk sync error:", err)
    );

    res.json({ 
      success: true,
      message: "Sync triggered for all active connections" 
    });
  } catch (error) {
    console.error("Bulk sync trigger error:", error);
    res.status(500).json({ 
      error: "Failed to trigger bulk sync",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/fund-admin-connections/:id/sync-logs
// Get sync logs for a connection
router.get("/fund-admin-connections/:id/sync-logs", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Only operations and admin users can view sync logs" 
      });
    }

    const { id } = req.params;

    const logs = await db
      .select()
      .from(fundAdminSyncLogs)
      .where(eq(fundAdminSyncLogs.connectionId, id))
      .orderBy(desc(fundAdminSyncLogs.startedAt))
      .limit(50);

    res.json(logs);
  } catch (error) {
    console.error("Get sync logs error:", error);
    res.status(500).json({ 
      error: "Failed to get sync logs",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
