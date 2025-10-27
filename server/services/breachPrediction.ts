import { db } from "../db";
import {
  breachPredictions,
  covenants,
  facilities,
  cashFlows,
  type InsertBreachPrediction,
} from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

// Heuristic-based prediction model (placeholder for ML model)
// In production, this would use a trained ML model
export async function predictCovenantBreach(params: {
  facilityId: string;
  covenantId?: string;
  timeHorizon: "30_days" | "90_days" | "180_days" | "1_year";
}): Promise<{
  predictions: Array<{
    covenantId: string;
    breachProbability: number;
    riskScore: number;
    contributingFactors: string[];
  }>;
}> {
  const { facilityId, covenantId, timeHorizon } = params;

  // Get facility details
  const [facility] = await db.select()
    .from(facilities)
    .where(eq(facilities.id, facilityId));

  if (!facility) {
    throw new Error("Facility not found");
  }

  // Get covenants
  const covenantsToCheck = covenantId
    ? await db.select().from(covenants).where(eq(covenants.id, covenantId))
    : await db.select().from(covenants).where(eq(covenants.facilityId, facilityId));

  const predictions = [];

  for (const covenant of covenantsToCheck) {
    const contributingFactors: string[] = [];
    let riskScore = 0;

    // Factor 1: Current compliance status
    if (covenant.status === "breach") {
      riskScore += 50;
      contributingFactors.push("Currently in breach");
    } else if (covenant.status === "warning") {
      riskScore += 30;
      contributingFactors.push("Currently in warning status");
    }

    // Factor 2: Proximity to threshold
    if (covenant.currentValue && covenant.thresholdValue) {
      const margin = Math.abs(covenant.currentValue - covenant.thresholdValue) / covenant.thresholdValue;
      
      if (margin < 0.05) { // Within 5% of threshold
        riskScore += 30;
        contributingFactors.push("Very close to threshold (<5% margin)");
      } else if (margin < 0.10) { // Within 10% of threshold
        riskScore += 20;
        contributingFactors.push("Close to threshold (5-10% margin)");
      } else if (margin < 0.15) { // Within 15% of threshold
        riskScore += 10;
        contributingFactors.push("Near threshold (10-15% margin)");
      }
    }

    // Factor 3: Recent cash flow performance
    const recentCashFlows = await db.select()
      .from(cashFlows)
      .where(
        and(
          eq(cashFlows.facilityId, facilityId),
          gte(cashFlows.dueDate, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
        )
      );

    if (recentCashFlows.length > 0) {
      const overdueCashFlows = recentCashFlows.filter(cf => cf.status === "overdue");
      const overdueRate = overdueCashFlows.length / recentCashFlows.length;

      if (overdueRate > 0.3) {
        riskScore += 20;
        contributingFactors.push(`High overdue rate (${(overdueRate * 100).toFixed(0)}%)`);
      } else if (overdueRate > 0.1) {
        riskScore += 10;
        contributingFactors.push(`Moderate overdue rate (${(overdueRate * 100).toFixed(0)}%)`);
      }
    }

    // Factor 4: Facility utilization
    if (facility.outstandingBalance && facility.facilityAmount) {
      const utilizationRate = facility.outstandingBalance / facility.facilityAmount;
      
      if (utilizationRate > 0.9) {
        riskScore += 15;
        contributingFactors.push("High facility utilization (>90%)");
      } else if (utilizationRate > 0.75) {
        riskScore += 10;
        contributingFactors.push("Elevated facility utilization (75-90%)");
      }
    }

    // Adjust for time horizon (longer = higher probability)
    const timeMultipliers = {
      "30_days": 0.8,
      "90_days": 1.0,
      "180_days": 1.2,
      "1_year": 1.5,
    };
    riskScore = Math.min(100, riskScore * timeMultipliers[timeHorizon]);

    // Convert risk score to probability (simplified sigmoid-like function)
    const breachProbability = Math.min(100, (riskScore / 100) * 100);

    predictions.push({
      covenantId: covenant.id,
      breachProbability: Math.round(breachProbability * 100) / 100,
      riskScore: Math.round(riskScore),
      contributingFactors,
    });

    // Save prediction to database
    await db.insert(breachPredictions).values({
      facilityId,
      covenantId: covenant.id,
      timeHorizon,
      breachProbability: breachProbability.toString(),
      riskScore: Math.round(riskScore),
      contributingFactors,
      modelVersion: "v1.0-heuristic",
      modelConfidence: "75.00", // Heuristic model has moderate confidence
    });
  }

  return { predictions };
}

// Get predictions for a facility
export async function getBreachPredictions(facilityId: string, timeHorizon?: string) {
  const conditions = [eq(breachPredictions.facilityId, facilityId)];
  
  if (timeHorizon) {
    conditions.push(eq(breachPredictions.timeHorizon, timeHorizon));
  }

  return await db.select()
    .from(breachPredictions)
    .where(and(...conditions))
    .orderBy(sql`${breachPredictions.predictionDate} DESC`)
    .limit(100);
}
