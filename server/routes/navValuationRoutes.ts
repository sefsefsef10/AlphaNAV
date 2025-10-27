import { Router } from "express";
import { z } from "zod";
import type { User } from "@shared/schema";
import {
  calculateCompanyValuation,
  performStressTest,
  getStandardStressScenarios,
  calculatePortfolioNAV,
  performPortfolioStressTest,
} from "../services/navValuation";

export const navValuationRouter = Router();

/**
 * POST /api/nav-valuation/company
 * Calculate valuation for a portfolio company
 */
const calculateValuationSchema = z.object({
  companyId: z.string(),
  currentRevenue: z.number().optional(),
  currentEBITDA: z.number().optional(),
  revenueGrowthRate: z.number().optional(),
  industryMultiple: z.number().optional(),
  customFactors: z.record(z.any()).optional(),
});

navValuationRouter.post("/company", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only operations and admin can perform valuations
    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const validation = calculateValuationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.issues,
      });
    }

    const result = await calculateCompanyValuation(validation.data);
    res.json(result);
  } catch (error) {
    console.error("Error calculating valuation:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to calculate valuation" 
    });
  }
});

/**
 * POST /api/nav-valuation/stress-test
 * Perform stress testing on a company valuation
 */
const stressTestSchema = z.object({
  companyId: z.string(),
  baselineValuation: z.number(),
  facilityId: z.string().optional(),
  scenarios: z.array(z.object({
    name: z.string(),
    description: z.string(),
    revenueImpact: z.number(),
    multipleImpact: z.number(),
    marketConditions: z.string(),
  })).optional(),
});

navValuationRouter.post("/stress-test", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const validation = stressTestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.issues,
      });
    }

    const { companyId, baselineValuation, facilityId, scenarios } = validation.data;
    
    // Use provided scenarios or standard ones
    const testScenarios = scenarios || getStandardStressScenarios();
    
    const results = await performStressTest(
      companyId,
      baselineValuation,
      testScenarios,
      facilityId
    );

    res.json(results);
  } catch (error) {
    console.error("Error performing stress test:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to perform stress test" 
    });
  }
});

/**
 * GET /api/nav-valuation/scenarios
 * Get standard stress test scenarios
 */
navValuationRouter.get("/scenarios", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const scenarios = getStandardStressScenarios();
    res.json(scenarios);
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    res.status(500).json({ error: "Failed to fetch scenarios" });
  }
});

/**
 * POST /api/nav-valuation/portfolio
 * Calculate portfolio-wide NAV
 */
const portfolioNAVSchema = z.object({
  facilityId: z.string().optional(),
  prospectId: z.string().optional(),
});

navValuationRouter.post("/portfolio", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const validation = portfolioNAVSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.issues,
      });
    }

    const { facilityId, prospectId } = validation.data;
    const result = await calculatePortfolioNAV(facilityId, prospectId);
    
    res.json(result);
  } catch (error) {
    console.error("Error calculating portfolio NAV:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to calculate portfolio NAV" 
    });
  }
});

/**
 * POST /api/nav-valuation/portfolio/stress-test
 * Perform portfolio-wide stress testing
 */
const portfolioStressTestSchema = z.object({
  facilityId: z.string(),
});

navValuationRouter.post("/portfolio/stress-test", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const validation = portfolioStressTestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.issues,
      });
    }

    const { facilityId } = validation.data;
    const result = await performPortfolioStressTest(facilityId);
    
    res.json(result);
  } catch (error) {
    console.error("Error performing portfolio stress test:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to perform portfolio stress test" 
    });
  }
});
