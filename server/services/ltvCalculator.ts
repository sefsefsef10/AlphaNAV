/**
 * LTV (Loan-to-Value) Calculator with Stress Testing
 * Calculates LTV ratios and performs stress testing under market downturns
 */

export interface LTVCalculation {
  currentLtv: number; // Current LTV percentage
  requestedLoan: number; // Requested loan amount in dollars
  currentNav: number; // Current NAV in dollars
  stressTest: {
    baseline: StressScenario;
    moderate: StressScenario; // -20% market downturn
    severe: StressScenario; // -40% market downturn
  };
  recommendation: "approve" | "review" | "decline";
  maxLoanAmount: number; // Maximum loan we'd approve
  reasoning: string[];
}

export interface StressScenario {
  scenarioName: string;
  navAdjustment: number; // Percentage change
  adjustedNav: number; // NAV after adjustment
  adjustedLtv: number; // LTV under this scenario
  covenantBreachRisk: "low" | "medium" | "high";
  passesStressTest: boolean; // LTV stays under 80% even after stress
}

/**
 * Calculate LTV and stress test scenarios
 */
export function calculateLTV(params: {
  requestedLoan: number;
  currentNav: number;
  maxLtvThreshold?: number; // Default: 70%
  stressTestThreshold?: number; // Default: 80% (can't exceed this even under stress)
}): LTVCalculation {
  const {
    requestedLoan,
    currentNav,
    maxLtvThreshold = 70,
    stressTestThreshold = 80,
  } = params;
  
  if (currentNav <= 0) {
    throw new Error("Current NAV must be greater than zero");
  }
  
  if (requestedLoan <= 0) {
    throw new Error("Requested loan must be greater than zero");
  }
  
  // Calculate current LTV
  const currentLtv = (requestedLoan / currentNav) * 100;
  
  // Baseline scenario (no market change)
  const baseline: StressScenario = {
    scenarioName: "Baseline (Current Market)",
    navAdjustment: 0,
    adjustedNav: currentNav,
    adjustedLtv: currentLtv,
    covenantBreachRisk: currentLtv > 65 ? "medium" : "low",
    passesStressTest: currentLtv <= maxLtvThreshold,
  };
  
  // Moderate stress scenario (-20% market downturn)
  const moderateNav = currentNav * 0.80; // 20% decrease
  const moderateLtv = (requestedLoan / moderateNav) * 100;
  const moderate: StressScenario = {
    scenarioName: "Moderate Stress (-20% NAV)",
    navAdjustment: -20,
    adjustedNav: moderateNav,
    adjustedLtv: moderateLtv,
    covenantBreachRisk: moderateLtv > 75 ? "high" : moderateLtv > 65 ? "medium" : "low",
    passesStressTest: moderateLtv <= stressTestThreshold,
  };
  
  // Severe stress scenario (-40% market downturn)
  const severeNav = currentNav * 0.60; // 40% decrease
  const severeLtv = (requestedLoan / severeNav) * 100;
  const severe: StressScenario = {
    scenarioName: "Severe Stress (-40% NAV)",
    navAdjustment: -40,
    adjustedNav: severeNav,
    adjustedLtv: severeLtv,
    covenantBreachRisk: severeLtv > 85 ? "high" : severeLtv > 75 ? "medium" : "low",
    passesStressTest: severeLtv <= stressTestThreshold,
  };
  
  // Determine maximum loan amount we'd approve
  // Target: Stay under 70% LTV baseline, 80% under moderate stress
  const maxLoanBaseline = currentNav * (maxLtvThreshold / 100);
  const maxLoanStressed = moderateNav * (stressTestThreshold / 100);
  const maxLoanAmount = Math.min(maxLoanBaseline, maxLoanStressed);
  
  // Determine recommendation
  let recommendation: "approve" | "review" | "decline";
  const reasoning: string[] = [];
  
  if (currentLtv > maxLtvThreshold) {
    recommendation = "decline";
    reasoning.push(
      `Current LTV (${currentLtv.toFixed(1)}%) exceeds maximum threshold (${maxLtvThreshold}%)`
    );
  } else if (!moderate.passesStressTest) {
    recommendation = "decline";
    reasoning.push(
      `LTV under moderate stress (${moderateLtv.toFixed(1)}%) exceeds stress test threshold (${stressTestThreshold}%)`
    );
  } else if (severe.covenantBreachRisk === "high") {
    recommendation = "review";
    reasoning.push(
      `High covenant breach risk under severe stress scenario (${severeLtv.toFixed(1)}% LTV)`
    );
    reasoning.push(
      `Consider reducing loan amount to ${formatCurrency(maxLoanAmount)} for better stress resilience`
    );
  } else if (currentLtv > 60) {
    recommendation = "review";
    reasoning.push(
      `LTV is above 60% (${currentLtv.toFixed(1)}%) - recommend enhanced monitoring`
    );
  } else {
    recommendation = "approve";
    reasoning.push(
      `LTV (${currentLtv.toFixed(1)}%) is within acceptable range and passes all stress tests`
    );
  }
  
  // Add stress test insights to reasoning
  if (moderate.passesStressTest && severe.passesStressTest) {
    reasoning.push("Passes both moderate and severe stress tests");
  } else if (moderate.passesStressTest) {
    reasoning.push("Passes moderate stress test, but fails severe stress test");
  }
  
  reasoning.push(
    `Maximum recommended loan: ${formatCurrency(maxLoanAmount)} (${((maxLoanAmount / currentNav) * 100).toFixed(1)}% LTV)`
  );
  
  return {
    currentLtv,
    requestedLoan,
    currentNav,
    stressTest: {
      baseline,
      moderate,
      severe,
    },
    recommendation,
    maxLoanAmount,
    reasoning,
  };
}

/**
 * Covenant monitoring - check if facility is within LTV covenant
 */
export function checkLtvCovenant(params: {
  currentLoan: number;
  currentNav: number;
  maxLtvCovenant: number; // From facility covenant (e.g., 75%)
}): {
  currentLtv: number;
  covenantLimit: number;
  compliant: boolean;
  buffer: number; // How much room before breach (percentage points)
  bufferAmount: number; // How much NAV can decrease before breach (dollars)
  status: "compliant" | "warning" | "breach";
} {
  const { currentLoan, currentNav, maxLtvCovenant } = params;
  
  if (currentNav <= 0) {
    throw new Error("Current NAV must be greater than zero");
  }
  
  const currentLtv = (currentLoan / currentNav) * 100;
  const buffer = maxLtvCovenant - currentLtv;
  
  // Calculate how much NAV can decrease before breach
  // LTV = Loan / NAV, so NAV_min = Loan / (MaxLTV/100)
  const minNavBeforeBreach = currentLoan / (maxLtvCovenant / 100);
  const bufferAmount = currentNav - minNavBeforeBreach;
  
  // Determine status
  let status: "compliant" | "warning" | "breach";
  if (currentLtv > maxLtvCovenant) {
    status = "breach";
  } else if (currentLtv > maxLtvCovenant * 0.9) {
    // Within 10% of breach threshold
    status = "warning";
  } else {
    status = "compliant";
  }
  
  return {
    currentLtv,
    covenantLimit: maxLtvCovenant,
    compliant: currentLtv <= maxLtvCovenant,
    buffer,
    bufferAmount,
    status,
  };
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

/**
 * Calculate recommended loan adjustments based on stress testing
 */
export function recommendLoanAdjustment(params: {
  requestedLoan: number;
  currentNav: number;
  targetLtv?: number; // Target LTV we want to achieve (default: 60%)
}): {
  originalLtv: number;
  recommendedLoan: number;
  recommendedLtv: number;
  adjustment: number; // Dollar amount to reduce
  adjustmentPercent: number; // Percentage reduction
  reasoning: string;
} {
  const { requestedLoan, currentNav, targetLtv = 60 } = params;
  
  const originalLtv = (requestedLoan / currentNav) * 100;
  const recommendedLoan = currentNav * (targetLtv / 100);
  const adjustment = requestedLoan - recommendedLoan;
  const adjustmentPercent = (adjustment / requestedLoan) * 100;
  
  let reasoning = "";
  if (adjustment > 0) {
    reasoning = `Recommend reducing loan by ${formatCurrency(adjustment)} (${adjustmentPercent.toFixed(1)}%) ` +
      `to achieve ${targetLtv}% LTV and improve stress resilience`;
  } else {
    reasoning = `Current request is conservative. Could approve up to ${formatCurrency(recommendedLoan)} ` +
      `while maintaining ${targetLtv}% LTV`;
  }
  
  return {
    originalLtv,
    recommendedLoan,
    recommendedLtv: targetLtv,
    adjustment: Math.max(0, adjustment),
    adjustmentPercent: Math.max(0, adjustmentPercent),
    reasoning,
  };
}
