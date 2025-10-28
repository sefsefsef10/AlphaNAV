import { Router, type Request, type Response } from "express";
import { 
  calculatePlatformMetrics,
  getUserActivityTimeline,
  getEfficiencyTrends,
  calculateAdvisorWinRate,
} from "../services/analytics";
import { type User } from "@shared/schema";

export const analyticsRouter = Router();

// GET /api/analytics/platform-metrics
analyticsRouter.get("/platform-metrics", async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const metrics = await calculatePlatformMetrics();
    return res.json(metrics);
  } catch (error) {
    console.error("Error fetching platform metrics:", error);
    return res.status(500).json({ error: "Failed to fetch platform metrics" });
  }
});

// GET /api/analytics/efficiency-trends
analyticsRouter.get("/efficiency-trends", async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const days = parseInt(req.query.days as string) || 30;
    const trends = await getEfficiencyTrends(days);
    return res.json(trends);
  } catch (error) {
    console.error("Error fetching efficiency trends:", error);
    return res.status(500).json({ error: "Failed to fetch efficiency trends" });
  }
});

// GET /api/analytics/activity-timeline
analyticsRouter.get("/activity-timeline", async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const user = req.user as User;
    const limit = parseInt(req.query.limit as string) || 10;
    const timeline = await getUserActivityTimeline(user.id, limit);
    return res.json(timeline);
  } catch (error) {
    console.error("Error fetching activity timeline:", error);
    return res.status(500).json({ error: "Failed to fetch activity timeline" });
  }
});

// GET /api/analytics/advisor-win-rate/:advisorId
analyticsRouter.get("/advisor-win-rate/:advisorId", async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const { advisorId } = req.params;
    const winRate = await calculateAdvisorWinRate(advisorId);
    return res.json(winRate);
  } catch (error) {
    console.error("Error fetching advisor win rate:", error);
    return res.status(500).json({ error: "Failed to fetch advisor win rate" });
  }
});
