import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { 
  marketIntelligence, 
  competitorIntelligence, 
  lenderDirectory, 
  lenderInteractions,
  insertMarketIntelligenceSchema,
  insertCompetitorIntelligenceSchema,
  insertLenderDirectorySchema,
  insertLenderInteractionSchema,
  type User 
} from "@shared/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

export const marketIntelligenceRouter = Router();

// ==================== MARKET INTELLIGENCE ====================

/**
 * GET /api/market-intelligence
 * Get market data with optional filters
 */
marketIntelligenceRouter.get("/", async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { dataType, geography, sector, limit = "50" } = req.query;
    
    let query = db.select().from(marketIntelligence);
    const conditions = [];
    
    if (dataType) conditions.push(eq(marketIntelligence.dataType, dataType as string));
    if (geography) conditions.push(eq(marketIntelligence.geography, geography as string));
    if (sector) conditions.push(eq(marketIntelligence.sector, sector as string));
    
    const data = await query
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(marketIntelligence.asOfDate))
      .limit(parseInt(limit as string));
    
    res.json(data);
  } catch (error) {
    console.error("Error fetching market intelligence:", error);
    res.status(500).json({ error: "Failed to fetch market intelligence" });
  }
});

/**
 * GET /api/market-intelligence/summary
 * Get aggregated market intelligence summary
 */
marketIntelligenceRouter.get("/summary", async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get latest data points by category
    const [avgInterestRate] = await db.select()
      .from(marketIntelligence)
      .where(and(
        eq(marketIntelligence.dataType, 'interest_rates'),
        eq(marketIntelligence.metric, 'avg_interest_rate')
      ))
      .orderBy(desc(marketIntelligence.asOfDate))
      .limit(1);

    const [medianLtv] = await db.select()
      .from(marketIntelligence)
      .where(and(
        eq(marketIntelligence.dataType, 'fund_valuations'),
        eq(marketIntelligence.metric, 'median_ltv')
      ))
      .orderBy(desc(marketIntelligence.asOfDate))
      .limit(1);

    const [dealCount] = await db.select()
      .from(marketIntelligence)
      .where(and(
        eq(marketIntelligence.dataType, 'deal_volume'),
        eq(marketIntelligence.metric, 'deal_count')
      ))
      .orderBy(desc(marketIntelligence.asOfDate))
      .limit(1);

    res.json({
      avgInterestRate: avgInterestRate || null,
      medianLtv: medianLtv || null,
      dealVolume: dealCount || null,
    });
  } catch (error) {
    console.error("Error fetching market intelligence summary:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

/**
 * POST /api/market-intelligence
 * Create new market intelligence entry
 */
const createMarketIntelligenceSchema = insertMarketIntelligenceSchema;

marketIntelligenceRouter.post("/", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only operations and admin can create market intelligence
    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const validation = createMarketIntelligenceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.issues,
      });
    }

    const [entry] = await db.insert(marketIntelligence)
      .values(validation.data)
      .returning();

    res.status(201).json(entry);
  } catch (error) {
    console.error("Error creating market intelligence:", error);
    res.status(500).json({ error: "Failed to create market intelligence entry" });
  }
});

// ==================== COMPETITOR INTELLIGENCE ====================

/**
 * GET /api/market-intelligence/competitors
 * Get competitor intelligence data
 */
marketIntelligenceRouter.get("/competitors", async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { competitorName, dealType, sector, limit = "50" } = req.query;
    
    let query = db.select().from(competitorIntelligence);
    const conditions = [];
    
    if (competitorName) conditions.push(eq(competitorIntelligence.competitorName, competitorName as string));
    if (dealType) conditions.push(eq(competitorIntelligence.dealType, dealType as string));
    if (sector) conditions.push(eq(competitorIntelligence.sector, sector as string));
    
    const data = await query
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(competitorIntelligence.reportedDate))
      .limit(parseInt(limit as string));
    
    res.json(data);
  } catch (error) {
    console.error("Error fetching competitor intelligence:", error);
    res.status(500).json({ error: "Failed to fetch competitor intelligence" });
  }
});

/**
 * GET /api/market-intelligence/competitors/summary
 * Get competitor summary statistics
 */
marketIntelligenceRouter.get("/competitors/summary", async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get unique competitor count
    const competitorCount = await db.select({ 
      count: sql<number>`count(distinct ${competitorIntelligence.competitorName})` 
    }).from(competitorIntelligence);

    // Get recent deals (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentDeals = await db.select()
      .from(competitorIntelligence)
      .where(gte(competitorIntelligence.reportedDate, thirtyDaysAgo))
      .orderBy(desc(competitorIntelligence.reportedDate))
      .limit(10);

    // Calculate average interest rate from verified deals
    const avgRates = await db.select({
      avgRate: sql<number>`avg(${competitorIntelligence.interestRate}::numeric)`
    })
    .from(competitorIntelligence)
    .where(and(
      eq(competitorIntelligence.reliability, 'verified'),
      sql`${competitorIntelligence.interestRate} is not null`
    ));

    res.json({
      totalCompetitors: competitorCount[0]?.count || 0,
      recentDeals,
      avgInterestRate: avgRates[0]?.avgRate || null,
    });
  } catch (error) {
    console.error("Error fetching competitor summary:", error);
    res.status(500).json({ error: "Failed to fetch competitor summary" });
  }
});

/**
 * POST /api/market-intelligence/competitors
 * Create new competitor intelligence entry
 */
const createCompetitorIntelligenceSchema = insertCompetitorIntelligenceSchema;

marketIntelligenceRouter.post("/competitors", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const validation = createCompetitorIntelligenceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.issues,
      });
    }

    const [entry] = await db.insert(competitorIntelligence)
      .values(validation.data)
      .returning();

    res.status(201).json(entry);
  } catch (error) {
    console.error("Error creating competitor intelligence:", error);
    res.status(500).json({ error: "Failed to create competitor intelligence entry" });
  }
});

/**
 * DELETE /api/market-intelligence/competitors/:id
 * Delete competitor intelligence entry
 */
marketIntelligenceRouter.delete("/competitors/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const { id } = req.params;
    await db.delete(competitorIntelligence)
      .where(eq(competitorIntelligence.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting competitor intelligence:", error);
    res.status(500).json({ error: "Failed to delete competitor intelligence entry" });
  }
});

// ==================== LENDER DIRECTORY ====================

/**
 * GET /api/market-intelligence/lenders
 * Get lender directory
 */
marketIntelligenceRouter.get("/lenders", async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { lenderType, tier, geography, relationship, limit = "100" } = req.query;
    
    let query = db.select().from(lenderDirectory);
    const conditions = [eq(lenderDirectory.status, 'active')];
    
    if (lenderType) conditions.push(eq(lenderDirectory.lenderType, lenderType as string));
    if (tier) conditions.push(eq(lenderDirectory.tier, tier as string));
    if (geography) conditions.push(eq(lenderDirectory.geography, geography as string));
    if (relationship) conditions.push(eq(lenderDirectory.relationship, relationship as string));
    
    const data = await query
      .where(and(...conditions))
      .orderBy(desc(lenderDirectory.updatedAt))
      .limit(parseInt(limit as string));
    
    res.json(data);
  } catch (error) {
    console.error("Error fetching lender directory:", error);
    res.status(500).json({ error: "Failed to fetch lender directory" });
  }
});

/**
 * GET /api/market-intelligence/lenders/:id
 * Get specific lender details
 */
marketIntelligenceRouter.get("/lenders/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    
    const [lender] = await db.select()
      .from(lenderDirectory)
      .where(eq(lenderDirectory.id, id));

    if (!lender) {
      return res.status(404).json({ error: "Lender not found" });
    }

    // Get interactions for this lender
    const interactions = await db.select()
      .from(lenderInteractions)
      .where(eq(lenderInteractions.lenderId, id))
      .orderBy(desc(lenderInteractions.interactionDate))
      .limit(20);

    res.json({ ...lender, interactions });
  } catch (error) {
    console.error("Error fetching lender details:", error);
    res.status(500).json({ error: "Failed to fetch lender details" });
  }
});

/**
 * POST /api/market-intelligence/lenders
 * Create new lender directory entry
 */
const createLenderDirectorySchema = insertLenderDirectorySchema;

marketIntelligenceRouter.post("/lenders", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const validation = createLenderDirectorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.issues,
      });
    }

    const [entry] = await db.insert(lenderDirectory)
      .values(validation.data)
      .returning();

    res.status(201).json(entry);
  } catch (error) {
    console.error("Error creating lender directory entry:", error);
    res.status(500).json({ error: "Failed to create lender directory entry" });
  }
});

/**
 * PATCH /api/market-intelligence/lenders/:id
 * Update lender directory entry
 */
const updateLenderDirectorySchema = insertLenderDirectorySchema.partial();

marketIntelligenceRouter.patch("/lenders/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const { id } = req.params;
    const validation = updateLenderDirectorySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.issues,
      });
    }

    const [updated] = await db.update(lenderDirectory)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(eq(lenderDirectory.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Lender not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating lender directory entry:", error);
    res.status(500).json({ error: "Failed to update lender directory entry" });
  }
});

/**
 * DELETE /api/market-intelligence/lenders/:id
 * Delete (soft delete - set to inactive) lender directory entry
 */
marketIntelligenceRouter.delete("/lenders/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const { id } = req.params;
    await db.update(lenderDirectory)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(lenderDirectory.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting lender directory entry:", error);
    res.status(500).json({ error: "Failed to delete lender directory entry" });
  }
});

// ==================== LENDER INTERACTIONS ====================

/**
 * POST /api/market-intelligence/lenders/:id/interactions
 * Log interaction with a lender
 */
const createLenderInteractionSchema = insertLenderInteractionSchema;

marketIntelligenceRouter.post("/lenders/:id/interactions", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as User;
    if (user.role !== "operations" && user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const { id } = req.params;
    const validation = createLenderInteractionSchema.safeParse({
      ...req.body,
      lenderId: id,
      createdBy: user.id,
    });
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request",
        details: validation.error.issues,
      });
    }

    const [interaction] = await db.insert(lenderInteractions)
      .values(validation.data)
      .returning();

    // Update lender's lastContact date
    await db.update(lenderDirectory)
      .set({ 
        lastContact: validation.data.interactionDate,
        updatedAt: new Date(),
      })
      .where(eq(lenderDirectory.id, id));

    res.status(201).json(interaction);
  } catch (error) {
    console.error("Error creating lender interaction:", error);
    res.status(500).json({ error: "Failed to create lender interaction" });
  }
});

/**
 * GET /api/market-intelligence/lenders/:id/interactions
 * Get interactions for a specific lender
 */
marketIntelligenceRouter.get("/lenders/:id/interactions", async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { limit = "50" } = req.query;
    
    const interactions = await db.select()
      .from(lenderInteractions)
      .where(eq(lenderInteractions.lenderId, id))
      .orderBy(desc(lenderInteractions.interactionDate))
      .limit(parseInt(limit as string));
    
    res.json(interactions);
  } catch (error) {
    console.error("Error fetching lender interactions:", error);
    res.status(500).json({ error: "Failed to fetch lender interactions" });
  }
});
