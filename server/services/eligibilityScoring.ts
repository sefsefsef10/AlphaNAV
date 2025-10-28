/**
 * Eligibility Scoring System - Multi-tier assessment for NAV lending prospects
 * 
 * Provides two scoring systems:
 * 1. Simple 0-10 score for quick prospect qualification
 * 2. Detailed 100-point underwriting score for full credit analysis
 */

import type { ExtractionData } from "@shared/schema";

// ========================================
// Simple Eligibility Score (0-10 scale)
// ========================================

export interface EligibilityScore {
  overall: number; // 0-10 final score
  breakdown: {
    fundSize: number; // 0-2 points
    vintage: number; // 0-2 points
    trackRecord: number; // 0-2 points
    diversification: number; // 0-2 points
    ltvRequirement: number; // 0-2 points
  };
  recommendation: "strong" | "review" | "decline";
  reasoning: string[];
}

function scoreFundSize(fundSize: number | null): { score: number; reason: string } {
  if (!fundSize || fundSize <= 0) {
    return { score: 0, reason: "Fund size not provided" };
  }
  
  if (fundSize >= 100_000_000 && fundSize <= 500_000_000) {
    return { score: 2, reason: "Fund size in target range ($100M-$500M)" };
  }
  
  if ((fundSize >= 50_000_000 && fundSize < 100_000_000) || 
      (fundSize > 500_000_000 && fundSize <= 1_000_000_000)) {
    return { score: 1, reason: "Fund size acceptable but outside optimal range" };
  }
  
  if (fundSize < 50_000_000) {
    return { score: 0, reason: "Fund size too small (<$50M)" };
  }
  
  return { score: 0, reason: "Fund size too large (>$1B)" };
}

function scoreVintage(vintage: number | null): { score: number; reason: string } {
  if (!vintage) {
    return { score: 0, reason: "Vintage year not provided" };
  }
  
  const currentYear = new Date().getFullYear();
  
  if (vintage >= 2015 && vintage <= 2021) {
    return { score: 2, reason: "Optimal vintage year (2015-2021)" };
  }
  
  if ((vintage >= 2012 && vintage < 2015) || (vintage >= 2022 && vintage <= currentYear)) {
    return { score: 1, reason: "Acceptable vintage year" };
  }
  
  if (vintage < 2012) {
    return { score: 0, reason: "Vintage too old (<2012)" };
  }
  
  return { score: 0, reason: "Fund too new (likely insufficient track record)" };
}

function scoreTrackRecord(gpTrackRecord: string | null): { score: number; reason: string } {
  if (!gpTrackRecord || gpTrackRecord.trim().length === 0) {
    return { score: 0, reason: "No GP track record provided" };
  }
  
  const trackRecordLower = gpTrackRecord.toLowerCase();
  
  const strongIndicators = [
    "multiple funds",
    "fund ii",
    "fund iii",
    "fund iv",
    "previous fund",
    "prior funds",
    "successful exits",
    "realized returns",
    "irr",
    "dpi",
  ];
  
  const hasStrongIndicator = strongIndicators.some(indicator => 
    trackRecordLower.includes(indicator)
  );
  
  if (hasStrongIndicator) {
    return { score: 2, reason: "Strong GP track record indicated" };
  }
  
  const acceptableIndicators = [
    "experienced",
    "seasoned",
    "veteran",
    "first fund",
    "established",
    "years of experience",
  ];
  
  const hasAcceptableIndicator = acceptableIndicators.some(indicator =>
    trackRecordLower.includes(indicator)
  );
  
  if (hasAcceptableIndicator) {
    return { score: 1, reason: "Acceptable GP experience level" };
  }
  
  return { score: 0, reason: "Limited track record information" };
}

function scoreDiversification(
  portfolioCount: number | null,
  sectors: string[] | null
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];
  
  if (portfolioCount) {
    if (portfolioCount >= 10 && portfolioCount <= 25) {
      score += 1.5;
      reasons.push("Optimal portfolio size (10-25 companies)");
    } else if ((portfolioCount >= 5 && portfolioCount < 10) || 
               (portfolioCount > 25 && portfolioCount <= 40)) {
      score += 0.75;
      reasons.push("Acceptable portfolio size");
    } else if (portfolioCount < 5) {
      reasons.push("High concentration risk (<5 companies)");
    } else {
      reasons.push("Over-diversified (>40 companies)");
    }
  } else {
    reasons.push("Portfolio count not provided");
  }
  
  if (sectors && sectors.length > 0) {
    if (sectors.length >= 3 && sectors.length <= 6) {
      score += 0.5;
      reasons.push("Good sector diversification");
    } else if (sectors.length === 2 || sectors.length > 6) {
      score += 0.25;
      reasons.push("Some sector diversification");
    } else {
      reasons.push("Single sector concentration");
    }
  } else {
    reasons.push("Sector information not provided");
  }
  
  return { 
    score: Math.round(score * 100) / 100,
    reason: reasons.join("; ")
  };
}

function scoreLtvRequirement(fundSize: number | null): { score: number; reason: string } {
  if (!fundSize) {
    return { score: 1, reason: "LTV requirement to be determined during underwriting" };
  }
  
  if (fundSize >= 100_000_000 && fundSize <= 300_000_000) {
    return { score: 2, reason: "Fund size suggests optimal LTV range (45-55%)" };
  }
  
  if ((fundSize >= 50_000_000 && fundSize < 100_000_000) ||
      (fundSize > 300_000_000 && fundSize <= 500_000_000)) {
    return { score: 1, reason: "Fund size suggests acceptable LTV range" };
  }
  
  return { score: 0, reason: "Fund size outside typical NAV lending range" };
}

export function calculateEligibilityScore(prospect: {
  fundSize: number | null;
  vintage: number | null;
  gpTrackRecord: string | null;
  portfolioCount: number | null;
  sectors: string[] | null;
}): EligibilityScore {
  const fundSizeResult = scoreFundSize(prospect.fundSize);
  const vintageResult = scoreVintage(prospect.vintage);
  const trackRecordResult = scoreTrackRecord(prospect.gpTrackRecord);
  const diversificationResult = scoreDiversification(
    prospect.portfolioCount,
    prospect.sectors
  );
  const ltvResult = scoreLtvRequirement(prospect.fundSize);
  
  const overall = 
    fundSizeResult.score +
    vintageResult.score +
    trackRecordResult.score +
    diversificationResult.score +
    ltvResult.score;
  
  let recommendation: "strong" | "review" | "decline";
  if (overall >= 7) {
    recommendation = "strong";
  } else if (overall >= 5) {
    recommendation = "review";
  } else {
    recommendation = "decline";
  }
  
  const reasoning = [
    `Fund Size: ${fundSizeResult.reason} (${fundSizeResult.score}/2)`,
    `Vintage: ${vintageResult.reason} (${vintageResult.score}/2)`,
    `Track Record: ${trackRecordResult.reason} (${trackRecordResult.score}/2)`,
    `Diversification: ${diversificationResult.reason} (${diversificationResult.score}/2)`,
    `LTV Potential: ${ltvResult.reason} (${ltvResult.score}/2)`,
  ];
  
  return {
    overall: Math.round(overall * 100) / 100,
    breakdown: {
      fundSize: fundSizeResult.score,
      vintage: vintageResult.score,
      trackRecord: trackRecordResult.score,
      diversification: diversificationResult.score,
      ltvRequirement: ltvResult.score,
    },
    recommendation,
    reasoning,
  };
}

// ========================================
// Detailed Underwriting Score (100-point scale)
// ========================================

export interface UnderwritingEligibilityScore {
  trackRecordScore: number;
  diversificationScore: number;
  liquidityScore: number;
  portfolioQualityScore: number;
  vintageScore: number;
  fundSizeScore: number;
  sectorRiskScore: number;
  geographicRiskScore: number;
  gpExperienceScore: number;
  structureRiskScore: number;
  totalScore: number;
  recommendation: string;
  riskFlags: string[];
}

export function calculateUnderwritingScore(extraction: Partial<ExtractionData>): UnderwritingEligibilityScore {
  const scores = {
    trackRecordScore: 0,
    diversificationScore: 0,
    liquidityScore: 0,
    portfolioQualityScore: 0,
    vintageScore: 0,
    fundSizeScore: 0,
    sectorRiskScore: 0,
    geographicRiskScore: 0,
    gpExperienceScore: 0,
    structureRiskScore: 0,
  };

  const riskFlags: string[] = [];

  // 1. Track Record Score (IRR, MOIC, DPI)
  if (extraction.netIrr !== null && extraction.netIrr !== undefined) {
    const netIrr = typeof extraction.netIrr === 'string' ? parseFloat(extraction.netIrr) : extraction.netIrr;
    if (netIrr >= 20) scores.trackRecordScore = 10;
    else if (netIrr >= 15) scores.trackRecordScore = 8;
    else if (netIrr >= 10) scores.trackRecordScore = 6;
    else if (netIrr >= 5) scores.trackRecordScore = 4;
    else scores.trackRecordScore = 2;
  }
  
  if (extraction.moic !== null && extraction.moic !== undefined) {
    const moic = typeof extraction.moic === 'string' ? parseFloat(extraction.moic) : extraction.moic;
    if (moic < 1.5) {
      riskFlags.push("Low MOIC (<1.5x)");
    }
  }

  // 2. Diversification Score
  if (extraction.portfolioCompanyCount !== null && extraction.portfolioCompanyCount !== undefined) {
    if (extraction.portfolioCompanyCount >= 15) scores.diversificationScore = 10;
    else if (extraction.portfolioCompanyCount >= 10) scores.diversificationScore = 8;
    else if (extraction.portfolioCompanyCount >= 5) scores.diversificationScore = 5;
    else scores.diversificationScore = 2;
  }
  
  if (extraction.largestHoldingPercent !== null && extraction.largestHoldingPercent !== undefined) {
    const largestHolding = typeof extraction.largestHoldingPercent === 'string' 
      ? parseFloat(extraction.largestHoldingPercent) 
      : extraction.largestHoldingPercent;
    if (largestHolding > 25) {
      riskFlags.push("High concentration - largest holding >25%");
    }
  }

  // 3. Liquidity Score
  if (extraction.cashReserves !== null && extraction.cashReserves !== undefined &&
      extraction.totalDebt !== null && extraction.totalDebt !== undefined) {
    const liquidityRatio = extraction.cashReserves / (extraction.totalDebt || 1);
    if (liquidityRatio >= 0.5) scores.liquidityScore = 10;
    else if (liquidityRatio >= 0.3) scores.liquidityScore = 7;
    else if (liquidityRatio >= 0.15) scores.liquidityScore = 4;
    else scores.liquidityScore = 2;
  }

  // 4. Portfolio Quality Score
  if (extraction.fundStatus === "Growing") scores.portfolioQualityScore = 10;
  else if (extraction.fundStatus === "Stable") scores.portfolioQualityScore = 7;
  else if (extraction.fundStatus === "Declining") scores.portfolioQualityScore = 3;
  else scores.portfolioQualityScore = 5;

  // 5. Vintage Score
  if (extraction.vintage !== null && extraction.vintage !== undefined) {
    if (extraction.vintage >= 2015 && extraction.vintage <= 2021) scores.vintageScore = 10;
    else if (extraction.vintage >= 2012 && extraction.vintage <= 2024) scores.vintageScore = 7;
    else scores.vintageScore = 4;
  }

  // 6. Fund Size Score
  if (extraction.fundAum !== null && extraction.fundAum !== undefined) {
    const aumInM = extraction.fundAum / 1000000;
    if (aumInM >= 100 && aumInM <= 500) scores.fundSizeScore = 10;
    else if (aumInM >= 50 && aumInM <= 1000) scores.fundSizeScore = 7;
    else scores.fundSizeScore = 4;
  }

  // 7. Sector Risk Score
  const riskySectors = ["cryptocurrency", "cannabis", "real estate"];
  if (extraction.strategy) {
    const hasRiskySector = riskySectors.some(s => 
      extraction.strategy!.toLowerCase().includes(s)
    );
    if (hasRiskySector) {
      scores.sectorRiskScore = 3;
      riskFlags.push("High-risk sector exposure");
    } else {
      scores.sectorRiskScore = 10;
    }
  } else {
    scores.sectorRiskScore = 5;
  }

  // 8. Geographic Risk Score
  const lowRiskGeos = ["united states", "us", "europe", "western europe", "uk"];
  if (extraction.geography) {
    const isLowRisk = lowRiskGeos.some(g => 
      extraction.geography!.toLowerCase().includes(g)
    );
    scores.geographicRiskScore = isLowRisk ? 10 : 5;
  } else {
    scores.geographicRiskScore = 5;
  }

  // 9. GP Experience Score
  if (extraction.yearsOfExperience !== null && extraction.yearsOfExperience !== undefined) {
    if (extraction.yearsOfExperience >= 15) scores.gpExperienceScore = 10;
    else if (extraction.yearsOfExperience >= 10) scores.gpExperienceScore = 8;
    else if (extraction.yearsOfExperience >= 5) scores.gpExperienceScore = 5;
    else scores.gpExperienceScore = 2;
  }

  // 10. Structure Risk Score
  const preferredStructures = ["lp", "limited partnership"];
  if (extraction.fundStructure) {
    const isPreferred = preferredStructures.some(s => 
      extraction.fundStructure!.toLowerCase().includes(s)
    );
    scores.structureRiskScore = isPreferred ? 10 : 6;
  } else {
    scores.structureRiskScore = 5;
  }

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

  let recommendation: string;
  if (totalScore >= 85 && riskFlags.length === 0) {
    recommendation = "Strong Accept";
  } else if (totalScore >= 70) {
    recommendation = "Accept with Conditions";
  } else if (totalScore >= 55) {
    recommendation = "Further Review Required";
  } else {
    recommendation = "Decline";
  }

  return {
    ...scores,
    totalScore,
    recommendation,
    riskFlags,
  };
}
