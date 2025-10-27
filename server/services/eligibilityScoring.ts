/**
 * Eligibility Scoring System - 10-point assessment for NAV lending prospects
 * Scores prospects on a 0-10 scale based on key criteria
 * Target: 7+ = Strong candidate, 5-6 = Review needed, <5 = Decline
 */

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

/**
 * Score fund size (AUM)
 * 2 points: $100M-$500M (sweet spot)
 * 1 point: $50M-$100M or $500M-$1B (acceptable)
 * 0 points: <$50M or >$1B (outside target range)
 */
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

/**
 * Score vintage year
 * 2 points: 2015-2021 (mature funds with track record)
 * 1 point: 2012-2014 or 2022-2023 (acceptable)
 * 0 points: <2012 or >2023 (too old or too new)
 */
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

/**
 * Score GP track record
 * 2 points: Clear multi-fund track record mentioned
 * 1 point: Some track record or first-time fund with strong team
 * 0 points: No track record information
 */
function scoreTrackRecord(gpTrackRecord: string | null): { score: number; reason: string } {
  if (!gpTrackRecord || gpTrackRecord.trim().length === 0) {
    return { score: 0, reason: "No GP track record provided" };
  }
  
  const trackRecordLower = gpTrackRecord.toLowerCase();
  
  // Look for indicators of strong track record
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
  
  // Look for acceptable indicators
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

/**
 * Score portfolio diversification
 * 2 points: 10-25 portfolio companies (well diversified)
 * 1 point: 5-9 or 26-40 companies (acceptable)
 * 0 points: <5 or >40 companies (concentration risk or over-diversified)
 */
function scoreDiversification(
  portfolioCount: number | null,
  sectors: string[] | null
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];
  
  // Score based on portfolio count (1.5 points max)
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
  
  // Score based on sector diversity (0.5 points max)
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
    score: Math.round(score * 100) / 100, // Round to 2 decimals
    reason: reasons.join("; ")
  };
}

/**
 * Score LTV requirement (implied from fund size)
 * 2 points: Likely to request 40-60% LTV (optimal)
 * 1 point: Likely to request 30-40% or 60-70% LTV
 * 0 points: Likely to request <30% or >70% LTV
 * 
 * Note: This is a proxy score based on fund size patterns
 * Actual LTV will be determined during underwriting
 */
function scoreLtvRequirement(fundSize: number | null): { score: number; reason: string } {
  if (!fundSize) {
    return { score: 1, reason: "LTV requirement to be determined during underwriting" };
  }
  
  // Larger funds tend to request higher LTV
  // $100M-$300M funds typically request 45-55% LTV (optimal)
  // $300M-$500M funds typically request 50-65% LTV (acceptable)
  // $50M-$100M funds typically request 35-50% LTV (acceptable)
  
  if (fundSize >= 100_000_000 && fundSize <= 300_000_000) {
    return { score: 2, reason: "Fund size suggests optimal LTV range (45-55%)" };
  }
  
  if ((fundSize >= 50_000_000 && fundSize < 100_000_000) ||
      (fundSize > 300_000_000 && fundSize <= 500_000_000)) {
    return { score: 1, reason: "Fund size suggests acceptable LTV range" };
  }
  
  return { score: 0, reason: "Fund size outside typical NAV lending range" };
}

/**
 * Calculate comprehensive eligibility score for a prospect
 */
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
  
  // Determine recommendation
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
