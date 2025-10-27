import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db";
import { facilities, drawRequests, covenants } from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { requireOAuth, apiUsageLogger } from "../oauth/oauthServer";

const router = Router();

// Apply OAuth middleware and usage logging to all public API routes
router.use(apiUsageLogger());

// GET /api/v1/public/facilities - List facilities
router.get(
  "/facilities",
  requireOAuth(["read:facilities"]),
  async (req: Request, res: Response) => {
    try {
      const oauth = (req as any).oauth;
      const client = (req as any).apiClient;

      // Filter by organization if client is scoped to a specific org
      const query = client.organizationId
        ? eq(facilities.gpUserId, client.organizationId)
        : undefined;

      const allFacilities = query
        ? await db.select().from(facilities).where(query).orderBy(desc(facilities.createdAt))
        : await db.select().from(facilities).orderBy(desc(facilities.createdAt));

      return res.json({
        data: allFacilities,
        meta: {
          total: allFacilities.length,
        },
      });
    } catch (error: any) {
      console.error("Public API error:", error);
      return res.status(500).json({
        error: "server_error",
        error_description: error.message,
      });
    }
  }
);

// GET /api/v1/public/facilities/:id - Get facility details
router.get(
  "/facilities/:id",
  requireOAuth(["read:facilities"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = (req as any).apiClient;

      const [facility] = await db
        .select()
        .from(facilities)
        .where(eq(facilities.id, id))
        .limit(1);

      if (!facility) {
        return res.status(404).json({
          error: "not_found",
          error_description: "Facility not found",
        });
      }

      // Check authorization
      if (client.organizationId && facility.gpUserId !== client.organizationId) {
        return res.status(403).json({
          error: "forbidden",
          error_description: "Access denied to this facility",
        });
      }

      return res.json({ data: facility });
    } catch (error: any) {
      console.error("Public API error:", error);
      return res.status(500).json({
        error: "server_error",
        error_description: error.message,
      });
    }
  }
);

// GET /api/v1/public/draw-requests - List draw requests
router.get(
  "/draw-requests",
  requireOAuth(["read:draws"]),
  async (req: Request, res: Response) => {
    try {
      const client = (req as any).apiClient;
      const { facility_id, status } = req.query;

      let query: any[] = [];

      if (facility_id) {
        query.push(eq(drawRequests.facilityId, facility_id as string));
      }

      if (status) {
        query.push(eq(drawRequests.status, status as string));
      }

      const whereClause = query.length > 0 ? and(...query) : undefined;

      const allDraws = whereClause
        ? await db
            .select()
            .from(drawRequests)
            .where(whereClause)
            .orderBy(desc(drawRequests.createdAt))
        : await db.select().from(drawRequests).orderBy(desc(drawRequests.createdAt));

      return res.json({
        data: allDraws,
        meta: {
          total: allDraws.length,
        },
      });
    } catch (error: any) {
      console.error("Public API error:", error);
      return res.status(500).json({
        error: "server_error",
        error_description: error.message,
      });
    }
  }
);

// POST /api/v1/public/draw-requests - Create draw request
router.post(
  "/draw-requests",
  requireOAuth(["write:draws"]),
  async (req: Request, res: Response) => {
    try {
      const client = (req as any).apiClient;
      const {
        facility_id,
        amount,
        purpose,
        requested_date,
        supporting_documents,
      } = req.body;

      if (!facility_id || !amount || !requested_date) {
        return res.status(400).json({
          error: "invalid_request",
          error_description: "facility_id, amount, and requested_date are required",
        });
      }

      // Verify facility exists and client has access
      const [facility] = await db
        .select()
        .from(facilities)
        .where(eq(facilities.id, facility_id))
        .limit(1);

      if (!facility) {
        return res.status(404).json({
          error: "not_found",
          error_description: "Facility not found",
        });
      }

      if (client.organizationId && facility.gpUserId !== client.organizationId) {
        return res.status(403).json({
          error: "forbidden",
          error_description: "Access denied to this facility",
        });
      }

      // Create draw request
      const [newDraw] = await db
        .insert(drawRequests)
        .values({
          facilityId: facility_id,
          requestedAmount: parseInt(amount),
          purpose: purpose || "API-initiated draw request",
          requestedBy: client.organizationId || "api-client",
          requestDate: new Date(requested_date),
          status: "pending",
        })
        .returning();

      return res.status(201).json({ data: newDraw });
    } catch (error: any) {
      console.error("Public API error:", error);
      return res.status(500).json({
        error: "server_error",
        error_description: error.message,
      });
    }
  }
);

// GET /api/v1/public/facilities/:id/summary - Get facility summary
router.get(
  "/facilities/:id/summary",
  requireOAuth(["read:analytics"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = (req as any).apiClient;

      // Verify facility exists and client has access
      const [facility] = await db
        .select()
        .from(facilities)
        .where(eq(facilities.id, id))
        .limit(1);

      if (!facility) {
        return res.status(404).json({
          error: "not_found",
          error_description: "Facility not found",
        });
      }

      if (client.organizationId && facility.gpUserId !== client.organizationId) {
        return res.status(403).json({
          error: "forbidden",
          error_description: "Access denied to this facility",
        });
      }

      // Get draw requests count
      const draws = await db
        .select()
        .from(drawRequests)
        .where(eq(drawRequests.facilityId, id));

      // Get covenants count
      const facilityCovenants = await db
        .select()
        .from(covenants)
        .where(eq(covenants.facilityId, id));

      // Calculate summary
      const summary = {
        facility: facility,
        metrics: {
          totalDraws: draws.length,
          pendingDraws: draws.filter((d) => d.status === "pending").length,
          totalCovenants: facilityCovenants.length,
          breachedCovenants: facilityCovenants.filter((c) => c.status === "breached").length,
          utilizationRate: (facility.outstandingBalance / facility.principalAmount) * 100,
        },
      };

      return res.json({ data: summary });
    } catch (error: any) {
      console.error("Public API error:", error);
      return res.status(500).json({
        error: "server_error",
        error_description: error.message,
      });
    }
  }
);

// GET /api/v1/public/covenants/:facilityId - Get covenant compliance
router.get(
  "/covenants/:facilityId",
  requireOAuth(["read:covenants"]),
  async (req: Request, res: Response) => {
    try {
      const { facilityId } = req.params;
      const client = (req as any).apiClient;

      // Verify facility exists and client has access
      const [facility] = await db
        .select()
        .from(facilities)
        .where(eq(facilities.id, facilityId))
        .limit(1);

      if (!facility) {
        return res.status(404).json({
          error: "not_found",
          error_description: "Facility not found",
        });
      }

      if (client.organizationId && facility.gpUserId !== client.organizationId) {
        return res.status(403).json({
          error: "forbidden",
          error_description: "Access denied to this facility",
        });
      }

      // Get all covenants for this facility
      const allCovenants = await db
        .select()
        .from(covenants)
        .where(eq(covenants.facilityId, facilityId))
        .orderBy(desc(covenants.createdAt));

      return res.json({
        data: allCovenants,
        meta: {
          total: allCovenants.length,
          breached: allCovenants.filter((c) => c.status === "breached").length,
          at_risk: allCovenants.filter((c) => c.status === "at_risk").length,
        },
      });
    } catch (error: any) {
      console.error("Public API error:", error);
      return res.status(500).json({
        error: "server_error",
        error_description: error.message,
      });
    }
  }
);

export default router;
