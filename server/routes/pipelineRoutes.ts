import { Router, type Request, type Response } from "express";
import { db } from "../db";
import { deals, type User } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const pipelineRouter = Router();

const createDealSchema = z.object({
  fundName: z.string().min(1),
  dealSize: z.number().min(0),
  stage: z.string(),
  status: z.string().default("active"),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  advisorName: z.string().optional(),
  gpName: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/pipeline/deals
pipelineRouter.get("/deals", async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const user = req.user as User;
    const userDeals = await db.select().from(deals)
      .where(eq(deals.userId, user.id));
    
    // Map to expected interface
    const mapped = userDeals.map(d => ({
      id: d.id,
      fundName: d.fundName,
      dealSize: d.amount || 0,
      stage: d.stage,
      priority: d.priority || 'medium',
      advisorName: d.advisorName,
      gpName: d.gpName,
      notes: d.notes,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
    
    return res.json(mapped);
  } catch (error) {
    console.error("Error fetching pipeline deals:", error);
    return res.status(500).json({ error: "Failed to fetch pipeline deals" });
  }
});

// POST /api/pipeline/deals
pipelineRouter.post("/deals", async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const user = req.user as User;
    const validated = createDealSchema.parse(req.body);
    
    const [deal] = await db.insert(deals).values({
      userId: user.id,
      fundName: validated.fundName,
      amount: validated.dealSize,
      stage: validated.stage,
      status: validated.status,
      priority: validated.priority,
      advisorName: validated.advisorName,
      gpName: validated.gpName,
      notes: validated.notes,
    }).returning();
    
    // Map to expected interface
    const mapped = {
      id: deal.id,
      fundName: deal.fundName,
      dealSize: deal.amount || 0,
      stage: deal.stage,
      priority: deal.priority || 'medium',
      advisorName: deal.advisorName,
      gpName: deal.gpName,
      notes: deal.notes,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    };
    
    return res.json(mapped);
  } catch (error: any) {
    console.error("Error creating pipeline deal:", error);
    return res.status(400).json({ error: error.message || "Failed to create deal" });
  }
});

// PATCH /api/pipeline/deals/:id/move
pipelineRouter.patch("/deals/:id/move", async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const user = req.user as User;
    const { id } = req.params;
    const { stage } = req.body;
    
    if (!stage) {
      return res.status(400).json({ error: "Stage is required" });
    }
    
    // Verify ownership before update
    const existing = await db.select().from(deals)
      .where(eq(deals.id, id))
      .limit(1);
    
    if (!existing.length || existing[0].userId !== user.id) {
      return res.status(404).json({ error: "Deal not found" });
    }
    
    const [updated] = await db.update(deals)
      .set({ stage, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    
    // Map to expected interface
    const mapped = {
      id: updated.id,
      fundName: updated.fundName,
      dealSize: updated.amount || 0,
      stage: updated.stage,
      priority: updated.priority || 'medium',
      advisorName: updated.advisorName,
      gpName: updated.gpName,
      notes: updated.notes,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
    
    return res.json(mapped);
  } catch (error: any) {
    console.error("Error moving deal:", error);
    return res.status(500).json({ error: "Failed to move deal" });
  }
});

// DELETE /api/pipeline/deals/:id
pipelineRouter.delete("/deals/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const user = req.user as User;
    const { id } = req.params;
    
    // Verify ownership before delete
    const existing = await db.select().from(deals)
      .where(eq(deals.id, id))
      .limit(1);
    
    if (!existing.length || existing[0].userId !== user.id) {
      return res.status(404).json({ error: "Deal not found" });
    }
    
    const [deleted] = await db.delete(deals)
      .where(eq(deals.id, id))
      .returning();
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return res.status(500).json({ error: "Failed to delete deal" });
  }
});
