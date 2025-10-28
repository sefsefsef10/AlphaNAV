/**
 * LTV (Loan-to-Value) Calculator with Stress Testing
 * Matches schema in shared/schema.ts ltvCalculations table
 */

export interface StressScenario {
  name: string; // Scenario name (e.g., "-20% Downturn")
  navStress: number; // Percentage change to NAV (e.g., -20)
  newNav: number; // NAV after stress adjustment
  newLtv: number; // LTV percentage under this scenario
  breachRisk: "low" | "medium" | "high";
  exceedsCovenant: boolean; // Whether scenario breaches max LTV
}

export interface LTVCalculationResult {
  fundNav: number;
  targetLtv: number; // Target LTV percentage (e.g., 15.00)
  maxLtv: number; // Maximum covenant LTV (e.g., 18.00)
  requestedFacilitySize: number | null;
  maxFacilitySize: number; // fundNav * targetLtv
  recommendedFacilitySize: number;
  baselineLtv: number; // LTV if using requested facility size
  scenarios: StressScenario[]; // Array of stress test scenarios
  breachProbability: number; // Estimated probability of covenant breach
  recommendedSofr: number; // Recommended SOFR spread in bps
  marketMedianPricing: number; // Market median pricing in bps
  pricingRationale: string;
}

export interface PortfolioMetrics {
  netIRR?: number | string | null;
  moic?: number | string | null;
  portfolioCompanyCount?: number | null;
}

/**
 * Calculate LTV with stress testing and pricing recommendations
 */
export function calculateLTV(
  params: {
    fundNAV: number;
    requestedFacilitySize?: number | null;
    targetLtv?: number; // Target LTV percentage (default: 15%)
    maxLtv?: number; // Maximum covenant LTV (default: 18%)
  },
  portfolioMetrics?: PortfolioMetrics
): LTVCalculationResult {
  const {
    fundNAV,
    requestedFacilitySize,
    targetLtv = 15,
    maxLtv = 18,
  } = params;
  
  if (fundNAV <= 0) {
    throw new Error("Fund NAV must be greater than zero");
  }
  
  if (targetLtv <= 0 || targetLtv > 100) {
    throw new Error("Target LTV must be between 0 and 100");
  }
  
  if (maxLtv <= 0 || maxLtv > 100) {
    throw new Error("Max LTV must be between 0 and 100");
  }
  
  // Calculate maximum facility size based on target LTV
  const maxFacilitySize = Math.floor(fundNAV * (targetLtv / 100));
  
  // Determine recommended facility size
  // If requested size is within target LTV, use it; otherwise cap at max
  const recommendedFacilitySize = requestedFacilitySize && requestedFacilitySize <= maxFacilitySize
    ? requestedFacilitySize
    : maxFacilitySize;
  
  // Calculate baseline LTV based on recommended facility size
  const baselineLtv = Number(((recommendedFacilitySize / fundNAV) * 100).toFixed(2));
  
  // Stress test scenarios
  const scenarios: StressScenario[] = [
    createStressScenario("Baseline (Current Market)", 0, fundNAV, recommendedFacilitySize, maxLtv),
    createStressScenario("-10% NAV Downturn", -10, fundNAV, recommendedFacilitySize, maxLtv),
    createStressScenario("-20% NAV Downturn", -20, fundNAV, recommendedFacilitySize, maxLtv),
    createStressScenario("-30% NAV Downturn", -30, fundNAV, recommendedFacilitySize, maxLtv),
    createStressScenario("-40% NAV Downturn", -40, fundNAV, recommendedFacilitySize, maxLtv),
  ];
  
  // Calculate breach probability based on scenarios
  const breachingScenarios = scenarios.filter(s => s.exceedsCovenant).length;
  const breachProbability = Number(((breachingScenarios / scenarios.length) * 100).toFixed(2));
  
  // Calculate pricing recommendations based on risk profile
  const pricing = calculatePricing(baselineLtv, breachProbability, portfolioMetrics);
  
  return {
    fundNav: fundNAV,
    targetLtv,
    maxLtv,
    requestedFacilitySize: requestedFacilitySize || null,
    maxFacilitySize,
    recommendedFacilitySize,
    baselineLtv,
    scenarios,
    breachProbability,
    recommendedSofr: pricing.recommendedSofr,
    marketMedianPricing: pricing.marketMedianPricing,
    pricingRationale: pricing.pricingRationale,
  };
}

/**
 * Create a stress test scenario
 */
function createStressScenario(
  name: string,
  navStressPercent: number,
  baseNav: number,
  facilitySize: number,
  maxLtv: number
): StressScenario {
  const newNav = baseNav * (1 + navStressPercent / 100);
  const newLtv = Number(((facilitySize / newNav) * 100).toFixed(2));
  const exceedsCovenant = newLtv > maxLtv;
  
  let breachRisk: "low" | "medium" | "high";
  if (newLtv > maxLtv) {
    breachRisk = "high";
  } else if (newLtv > maxLtv * 0.9) {
    breachRisk = "medium";
  } else {
    breachRisk = "low";
  }
  
  return {
    name,
    navStress: navStressPercent,
    newNav: Math.floor(newNav),
    newLtv,
    breachRisk,
    exceedsCovenant,
  };
}

/**
 * Calculate pricing recommendations based on LTV and portfolio metrics
 */
function calculatePricing(
  baselineLtv: number,
  breachProbability: number,
  portfolioMetrics?: PortfolioMetrics
): {
  recommendedSofr: number;
  marketMedianPricing: number;
  pricingRationale: string;
} {
  // Base pricing: SOFR + 600 bps (6.00%) for NAV lending
  let recommendedSofr = 600;
  let marketMedianPricing = 600;
  
  // Adjust pricing based on LTV
  if (baselineLtv > 15) {
    recommendedSofr += 50; // +50 bps for higher LTV
  }
  if (baselineLtv > 17) {
    recommendedSofr += 50; // +50 bps more
  }
  
  // Adjust pricing based on breach probability
  if (breachProbability > 40) {
    recommendedSofr += 75; // +75 bps for high breach risk
  } else if (breachProbability > 20) {
    recommendedSofr += 50; // +50 bps for medium breach risk
  }
  
  // Adjust pricing based on portfolio performance (if available)
  if (portfolioMetrics) {
    const netIRR = typeof portfolioMetrics.netIRR === 'string' 
      ? parseFloat(portfolioMetrics.netIRR) 
      : (portfolioMetrics.netIRR || 0);
    const moic = typeof portfolioMetrics.moic === 'string'
      ? parseFloat(portfolioMetrics.moic)
      : (portfolioMetrics.moic || 0);
    
    // Strong performance = lower pricing
    if (netIRR >= 20 && moic >= 2.0) {
      recommendedSofr -= 50; // -50 bps for strong performance
    } else if (netIRR < 10 || moic < 1.5) {
      recommendedSofr += 50; // +50 bps for weak performance
    }
    
    // Diversification discount
    if (portfolioMetrics.portfolioCompanyCount && portfolioMetrics.portfolioCompanyCount >= 15) {
      recommendedSofr -= 25; // -25 bps for well-diversified portfolio
    }
  }
  
  // Build pricing rationale
  const rationale: string[] = [];
  rationale.push(`Base NAV lending rate: SOFR + ${marketMedianPricing} bps`);
  
  if (baselineLtv > 15) {
    rationale.push(`LTV adjustment: +${baselineLtv > 17 ? 100 : 50} bps (LTV ${baselineLtv}%)`);
  }
  
  if (breachProbability > 20) {
    const adjustment = breachProbability > 40 ? 75 : 50;
    rationale.push(`Breach risk adjustment: +${adjustment} bps (${breachProbability}% probability)`);
  }
  
  if (portfolioMetrics) {
    const netIRR = typeof portfolioMetrics.netIRR === 'string' 
      ? parseFloat(portfolioMetrics.netIRR) 
      : (portfolioMetrics.netIRR || 0);
    const moic = typeof portfolioMetrics.moic === 'string'
      ? parseFloat(portfolioMetrics.moic)
      : (portfolioMetrics.moic || 0);
    
    if (netIRR >= 20 && moic >= 2.0) {
      rationale.push(`Performance discount: -50 bps (strong track record)`);
    } else if (netIRR < 10 || moic < 1.5) {
      rationale.push(`Performance premium: +50 bps (below-market returns)`);
    }
    
    if (portfolioMetrics.portfolioCompanyCount && portfolioMetrics.portfolioCompanyCount >= 15) {
      rationale.push(`Diversification discount: -25 bps (${portfolioMetrics.portfolioCompanyCount} companies)`);
    }
  }
  
  return {
    recommendedSofr: Math.max(400, Math.min(1200, recommendedSofr)), // Cap between 400-1200 bps
    marketMedianPricing,
    pricingRationale: rationale.join("; "),
  };
}
