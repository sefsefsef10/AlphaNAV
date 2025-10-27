import { GoogleGenAI } from "@google/genai";
import { db } from "../db";
import { portfolioCompanies, portfolioHoldings, facilities } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Initialize Gemini AI with proper error handling
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export interface ValuationInput {
  companyId: string;
  currentRevenue?: number;
  currentEBITDA?: number;
  revenueGrowthRate?: number;
  industryMultiple?: number;
  customFactors?: Record<string, any>;
}

export interface ValuationResult {
  baseValuation: number;
  valuationRange: {
    low: number;
    mid: number;
    high: number;
  };
  methodology: string;
  assumptions: string[];
  confidence: number;
  aiInsights?: string;
}

export interface StressTestScenario {
  name: string;
  description: string;
  revenueImpact: number; // Percentage change
  multipleImpact: number; // Percentage change
  marketConditions: string;
}

export interface StressTestResult {
  scenario: StressTestScenario;
  valuationImpact: {
    baselineValuation: number;
    stressedValuation: number;
    percentageChange: number;
    dollarChange: number;
  };
  ltvImpact?: {
    baselineLTV: number;
    stressedLTV: number;
    breachesCovenants: boolean;
  };
}

export interface PortfolioNAVAnalysis {
  totalNAV: number;
  totalCost: number;
  unrealizedGain: number;
  unrealizedGainPercentage: number;
  companyCount: number;
  topHoldings: Array<{
    companyId: string;
    companyName: string;
    fairValue: number;
    percentageOfNAV: number;
  }>;
  sectorConcentration: Record<string, number>;
  stressTestSummary?: {
    baselineNAV: number;
    worstCaseNAV: number;
    maxDrawdown: number;
  };
}

/**
 * Calculate NAV valuation for a portfolio company using multiple methodologies
 */
export async function calculateCompanyValuation(
  input: ValuationInput
): Promise<ValuationResult> {
  try {
    // Get company details
    const [company] = await db.select()
      .from(portfolioCompanies)
      .where(eq(portfolioCompanies.id, input.companyId));

    if (!company) {
      throw new Error("Company not found");
    }

    // Get latest holdings data
    const [latestHolding] = await db.select()
      .from(portfolioHoldings)
      .where(eq(portfolioHoldings.companyId, input.companyId))
      .orderBy(desc(portfolioHoldings.asOfDate))
      .limit(1);

    // Use AI to enhance valuation with market intelligence (if available)
    let aiAnalysis = null;
    
    if (genAI) {
      const aiPrompt = `You are a private equity valuation expert. Analyze this company and provide valuation insights:

Company: ${company.companyName}
Industry: ${company.industry || "Unknown"}
Sector: ${company.sector || "Unknown"}
Geography: ${company.geography || "Unknown"}
Investment Date: ${company.investmentDate ? new Date(company.investmentDate).toISOString() : "Unknown"}
Investment Amount: ${company.investmentAmount ? `$${company.investmentAmount.toLocaleString()}` : "Unknown"}
Current Value (last reported): ${latestHolding?.fairValue ? `$${latestHolding.fairValue.toLocaleString()}` : "Unknown"}

Additional Data:
- Current Revenue: ${input.currentRevenue ? `$${input.currentRevenue.toLocaleString()}` : "Not provided"}
- Current EBITDA: ${input.currentEBITDA ? `$${input.currentEBITDA.toLocaleString()}` : "Not provided"}
- Revenue Growth Rate: ${input.revenueGrowthRate ? `${input.revenueGrowthRate}%` : "Not provided"}
- Industry Multiple: ${input.industryMultiple ? `${input.industryMultiple}x` : "Not provided"}

Based on typical market conditions for ${company.industry || "this industry"} companies in ${company.geography || "this geography"}, provide:
1. A valuation range (conservative, mid-point, optimistic)
2. Key assumptions for the valuation
3. Risk factors that could impact valuation
4. Industry-specific considerations

Respond in JSON format:
{
  "conservativeValuation": <number>,
  "midPointValuation": <number>,
  "optimisticValuation": <number>,
  "keyAssumptions": ["assumption1", "assumption2", ...],
  "riskFactors": ["risk1", "risk2", ...],
  "insights": "Brief paragraph of key insights"
}`;

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent(aiPrompt);
        const responseText = result.response.text();

        // Parse AI response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Failed to get AI valuation insights:", parseError);
        aiAnalysis = null;
      }
    } else {
      console.warn("Gemini AI not available - valuation will use traditional methods only");
    }

    // Calculate baseline valuation using traditional methods
    let baselineValuation = latestHolding?.fairValue || company.currentValue || company.investmentAmount || 0;

    // If we have revenue/EBITDA data, use multiple-based valuation
    if (input.currentEBITDA && input.industryMultiple) {
      baselineValuation = input.currentEBITDA * input.industryMultiple;
    } else if (input.currentRevenue && input.industryMultiple) {
      // Use revenue multiple as fallback
      baselineValuation = input.currentRevenue * (input.industryMultiple / 5); // Assume 5x EBITDA = 1x Revenue roughly
    }

    // Apply growth adjustments if provided
    if (input.revenueGrowthRate && input.revenueGrowthRate > 0) {
      const growthMultiplier = 1 + (input.revenueGrowthRate / 100 * 0.5); // 50% of growth impacts valuation
      baselineValuation *= growthMultiplier;
    }

    // Use AI insights if available, otherwise use conservative ranges
    const valuationRange = aiAnalysis ? {
      low: aiAnalysis.conservativeValuation || baselineValuation * 0.8,
      mid: aiAnalysis.midPointValuation || baselineValuation,
      high: aiAnalysis.optimisticValuation || baselineValuation * 1.2,
    } : {
      low: baselineValuation * 0.8,
      mid: baselineValuation,
      high: baselineValuation * 1.2,
    };

    // Determine methodology used
    let methodology = "Market-based valuation";
    if (input.currentEBITDA && input.industryMultiple) {
      methodology = "EBITDA Multiple";
    } else if (input.currentRevenue && input.industryMultiple) {
      methodology = "Revenue Multiple";
    } else if (latestHolding) {
      methodology = "Latest Fair Value from Holdings";
    } else {
      methodology = "Cost Basis (Investment Amount)";
    }

    // Compile assumptions
    const assumptions = aiAnalysis?.keyAssumptions || [
      `Industry: ${company.industry || "General"}`,
      `Geography: ${company.geography || "Global"}`,
      `Methodology: ${methodology}`,
    ];

    if (input.industryMultiple) {
      assumptions.push(`Industry Multiple: ${input.industryMultiple}x`);
    }
    if (input.revenueGrowthRate) {
      assumptions.push(`Revenue Growth Rate: ${input.revenueGrowthRate}%`);
    }

    // Calculate confidence based on data quality
    let confidence = 60; // Base confidence
    if (input.currentEBITDA) confidence += 15;
    if (input.currentRevenue) confidence += 10;
    if (input.industryMultiple) confidence += 10;
    if (aiAnalysis) confidence += 5;
    confidence = Math.min(confidence, 95); // Cap at 95%

    return {
      baseValuation: valuationRange.mid,
      valuationRange,
      methodology,
      assumptions,
      confidence,
      aiInsights: aiAnalysis?.insights,
    };
  } catch (error) {
    console.error("Error calculating company valuation:", error);
    throw new Error("Failed to calculate valuation");
  }
}

/**
 * Perform stress testing on a company valuation
 */
export async function performStressTest(
  companyId: string,
  baselineValuation: number,
  scenarios: StressTestScenario[],
  facilityId?: string
): Promise<StressTestResult[]> {
  const results: StressTestResult[] = [];

  // Get facility details if provided (for LTV calculations)
  let facility;
  if (facilityId) {
    [facility] = await db.select()
      .from(facilities)
      .where(eq(facilities.id, facilityId));
  }

  for (const scenario of scenarios) {
    // Calculate stressed valuation
    const revenueMultiplier = 1 + (scenario.revenueImpact / 100);
    const multipleMultiplier = 1 + (scenario.multipleImpact / 100);
    const stressedValuation = baselineValuation * revenueMultiplier * multipleMultiplier;

    const percentageChange = ((stressedValuation - baselineValuation) / baselineValuation) * 100;
    const dollarChange = stressedValuation - baselineValuation;

    const result: StressTestResult = {
      scenario,
      valuationImpact: {
        baselineValuation,
        stressedValuation,
        percentageChange,
        dollarChange,
      },
    };

    // Calculate LTV impact if facility provided
    if (facility && facility.principalAmount) {
      const baselineLTV = (facility.principalAmount / baselineValuation) * 100;
      const stressedLTV = (facility.principalAmount / stressedValuation) * 100;
      
      // Check if stressed LTV breaches covenant (assuming 80% max LTV covenant)
      const maxLTV = facility.ltvRatio || 80;
      const breachesCovenants = stressedLTV > maxLTV;

      result.ltvImpact = {
        baselineLTV,
        stressedLTV,
        breachesCovenants,
      };
    }

    results.push(result);
  }

  return results;
}

/**
 * Get predefined stress test scenarios
 */
export function getStandardStressScenarios(): StressTestScenario[] {
  return [
    {
      name: "Mild Recession",
      description: "Economic downturn with moderate revenue impact",
      revenueImpact: -15,
      multipleImpact: -10,
      marketConditions: "Moderate economic contraction, increased risk aversion",
    },
    {
      name: "Severe Recession",
      description: "Deep economic crisis with significant valuation compression",
      revenueImpact: -30,
      multipleImpact: -25,
      marketConditions: "Severe economic downturn, credit markets frozen",
    },
    {
      name: "Sector Disruption",
      description: "Major disruption specific to company's industry",
      revenueImpact: -20,
      multipleImpact: -30,
      marketConditions: "Industry-specific headwinds, technology disruption",
    },
    {
      name: "Bear Market",
      description: "Broad market correction affecting all valuations",
      revenueImpact: -10,
      multipleImpact: -20,
      marketConditions: "Market correction, reduced investor appetite",
    },
    {
      name: "Optimistic Growth",
      description: "Strong performance and favorable market conditions",
      revenueImpact: 25,
      multipleImpact: 15,
      marketConditions: "Economic expansion, strong market sentiment",
    },
  ];
}

/**
 * Calculate portfolio-wide NAV analysis
 */
export async function calculatePortfolioNAV(
  facilityId?: string,
  prospectId?: string
): Promise<PortfolioNAVAnalysis> {
  try {
    // Build query conditions
    const conditions = [];
    if (facilityId) conditions.push(eq(portfolioCompanies.facilityId, facilityId));
    if (prospectId) conditions.push(eq(portfolioCompanies.prospectId, prospectId));
    conditions.push(eq(portfolioCompanies.status, "active"));

    // Get all active portfolio companies
    const companies = await db.select()
      .from(portfolioCompanies)
      .where(conditions.length > 0 ? and(...conditions) : eq(portfolioCompanies.status, "active"));

    if (companies.length === 0) {
      throw new Error("No active portfolio companies found");
    }

    // Get latest holdings for each company
    const holdingsPromises = companies.map(async (company) => {
      const [holding] = await db.select()
        .from(portfolioHoldings)
        .where(eq(portfolioHoldings.companyId, company.id))
        .orderBy(desc(portfolioHoldings.asOfDate))
        .limit(1);
      
      return {
        company,
        holding,
      };
    });

    const companiesWithHoldings = await Promise.all(holdingsPromises);

    // Calculate totals
    let totalNAV = 0;
    let totalCost = 0;
    const sectorConcentration: Record<string, number> = {};

    const topHoldings = companiesWithHoldings
      .map(({ company, holding }) => {
        const fairValue = holding?.fairValue || company.currentValue || company.investmentAmount || 0;
        const cost = holding?.costBasis || company.investmentAmount || 0;

        totalNAV += fairValue;
        totalCost += cost;

        // Track sector concentration
        const sector = company.sector || "Unknown";
        sectorConcentration[sector] = (sectorConcentration[sector] || 0) + fairValue;

        return {
          companyId: company.id,
          companyName: company.companyName,
          fairValue,
          percentageOfNAV: 0, // Will be calculated after totalNAV is known
        };
      })
      .sort((a, b) => b.fairValue - a.fairValue)
      .slice(0, 10); // Top 10 holdings

    // Calculate percentage of NAV for top holdings
    topHoldings.forEach((holding) => {
      holding.percentageOfNAV = (holding.fairValue / totalNAV) * 100;
    });

    // Calculate sector concentration percentages
    Object.keys(sectorConcentration).forEach((sector) => {
      sectorConcentration[sector] = (sectorConcentration[sector] / totalNAV) * 100;
    });

    const unrealizedGain = totalNAV - totalCost;
    const unrealizedGainPercentage = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0;

    return {
      totalNAV,
      totalCost,
      unrealizedGain,
      unrealizedGainPercentage,
      companyCount: companies.length,
      topHoldings,
      sectorConcentration,
    };
  } catch (error) {
    console.error("Error calculating portfolio NAV:", error);
    throw new Error("Failed to calculate portfolio NAV");
  }
}

/**
 * Perform portfolio-wide stress testing
 */
export async function performPortfolioStressTest(
  facilityId: string
): Promise<PortfolioNAVAnalysis> {
  try {
    // Get baseline NAV
    const baselineNAV = await calculatePortfolioNAV(facilityId);

    // Get worst-case scenario (Severe Recession)
    const worstCaseScenario = getStandardStressScenarios().find(s => s.name === "Severe Recession")!;

    // Calculate stressed NAV
    const revenueMultiplier = 1 + (worstCaseScenario.revenueImpact / 100);
    const multipleMultiplier = 1 + (worstCaseScenario.multipleImpact / 100);
    const worstCaseNAV = baselineNAV.totalNAV * revenueMultiplier * multipleMultiplier;

    const maxDrawdown = ((worstCaseNAV - baselineNAV.totalNAV) / baselineNAV.totalNAV) * 100;

    return {
      ...baselineNAV,
      stressTestSummary: {
        baselineNAV: baselineNAV.totalNAV,
        worstCaseNAV,
        maxDrawdown,
      },
    };
  } catch (error) {
    console.error("Error performing portfolio stress test:", error);
    throw new Error("Failed to perform portfolio stress test");
  }
}
