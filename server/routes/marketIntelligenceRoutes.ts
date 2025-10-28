import { Router, type Request, type Response } from "express";
import { db } from "../db";
import {
  marketTransactions,
  marketBenchmarks,
  usageAnalytics,
  pipelineStages,
  facilities,
  type User,
} from "@shared/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { z } from "zod";

export const marketIntelligenceRouter = Router();

// GET /api/market-intelligence/benchmarks
const benchmarkQuerySchema = z.object({
  segmentType: z.enum(["overall", "by_vintage", "by_sector", "by_aum_range", "by_strategy"]).optional(),
  segmentValue: z.string().optional(),
  periodMonths: z.coerce.number().min(1).max(36).default(18),
});

marketIntelligenceRouter.get("/benchmarks", async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "advisor" && user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const validation = benchmarkQuerySchema.safeParse(req.query);
    if (!validation.success) return res.status(400).json({ error: validation.error.message });

    const { segmentType, segmentValue, periodMonths } = validation.data;
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - periodMonths);

    let conditions: any[] = [
      gte(marketBenchmarks.periodEnd, periodStart),
      lte(marketBenchmarks.periodStart, periodEnd)
    ];

    if (segmentType) conditions.push(eq(marketBenchmarks.segmentType, segmentType));
    if (segmentValue) conditions.push(eq(marketBenchmarks.segmentValue, segmentValue));

    const benchmarks = await db.select().from(marketBenchmarks)
      .where(and(...conditions))
      .orderBy(desc(marketBenchmarks.createdAt));

    return res.json(benchmarks);
  } catch (error) {
    console.error("Error fetching market benchmarks:", error);
    return res.status(500).json({ error: "Failed to fetch market benchmarks" });
  }
});

// GET /api/market-intelligence/roi-summary
marketIntelligenceRouter.get("/roi-summary", async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const user = req.user as User;

    const analytics = await db.select().from(usageAnalytics)
      .where(eq(usageAnalytics.userId, user.id));

    if (analytics.length === 0) {
      return res.json({
        totalActivities: 0,
        totalTimeSavedHours: 0,
        totalLaborCostSaved: 0,
        avgTimeSavingsPercentage: 0,
      });
    }

    const totalTimeSaved = analytics.reduce((sum, a) => sum + (a.timeSavingsSeconds || 0), 0);
    const totalCostSaved = analytics.reduce((sum, a) => sum + (a.estimatedLaborCostSaved || 0), 0);

    return res.json({
      totalActivities: analytics.length,
      totalTimeSavedHours: Math.floor(totalTimeSaved / 3600),
      totalLaborCostSaved: totalCostSaved,
      avgTimeSavingsPercentage: 95,
    });
  } catch (error) {
    console.error("Error fetching ROI summary:", error);
    return res.status(500).json({ error: "Failed to fetch ROI summary" });
  }
});

// GET /api/market-intelligence/pipeline  
marketIntelligenceRouter.get("/pipeline", async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const user = req.user as User;

    const stages = await db.select().from(pipelineStages)
      .where(eq(pipelineStages.userId, user.id))
      .orderBy(asc(pipelineStages.enteredStageAt));

    const grouped = stages.reduce((acc, stage) => {
      if (!acc[stage.stageName]) acc[stage.stageName] = [];
      acc[stage.stageName].push(stage);
      return acc;
    }, {} as Record<string, any[]>);

    return res.json(grouped);
  } catch (error) {
    console.error("Error fetching pipeline:", error);
    return res.status(500).json({ error: "Failed to fetch pipeline" });
  }
});
