/**
 * Automated Risk Flags Detection
 * Identifies concentration risk, vintage concerns, and portfolio distress signals
 */

export interface RiskAssessment {
  overall: "low" | "medium" | "high";
  score: number; // 0-100 (100 = highest risk)
  flags: RiskFlag[];
  summary: string;
}

export interface RiskFlag {
  type: "concentration" | "vintage" | "distress" | "covenant" | "market";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  detectedAt: Date;
}

/**
 * Detect concentration risk in portfolio
 */
export function detectConcentrationRisk(params: {
  portfolioCount: number | null;
  sectors: string[] | null;
  fundSize: number;
  topThreeHoldings?: number; // Percentage of NAV in top 3 holdings
}): RiskFlag[] {
  const flags: RiskFlag[] = [];
  
  // Check portfolio company concentration
  if (params.portfolioCount && params.portfolioCount < 5) {
    flags.push({
      type: "concentration",
      severity: "critical",
      title: "High Portfolio Concentration Risk",
      description: `Only ${params.portfolioCount} portfolio companies - significant concentration risk`,
      impact: "Single company failure could trigger covenant breach or significant NAV decline",
      recommendation: "Require additional collateral or reduce LTV to 50% or below",
      detectedAt: new Date(),
    });
  } else if (params.portfolioCount && params.portfolioCount < 10) {
    flags.push({
      type: "concentration",
      severity: "high",
      title: "Moderate Portfolio Concentration",
      description: `${params.portfolioCount} portfolio companies - limited diversification`,
      impact: "Portfolio events could materially impact NAV",
      recommendation: "Enhanced monitoring of individual portfolio companies recommended",
      detectedAt: new Date(),
    });
  }
  
  // Check sector concentration
  if (params.sectors && params.sectors.length === 1) {
    flags.push({
      type: "concentration",
      severity: "high",
      title: "Single Sector Concentration",
      description: `All investments in ${params.sectors[0]} - no sector diversification`,
      impact: "Sector-wide downturn would affect entire portfolio",
      recommendation: "Monitor sector-specific risks closely; consider sector-based covenants",
      detectedAt: new Date(),
    });
  } else if (params.sectors && params.sectors.length === 2) {
    flags.push({
      type: "concentration",
      severity: "medium",
      title: "Limited Sector Diversification",
      description: `Investments concentrated in ${params.sectors.length} sectors only`,
      impact: "Limited protection against sector-specific downturns",
      recommendation: "Monitor both sectors for industry trends",
      detectedAt: new Date(),
    });
  }
  
  // Check top holdings concentration
  if (params.topThreeHoldings && params.topThreeHoldings > 50) {
    flags.push({
      type: "concentration",
      severity: "critical",
      title: "Top Holdings Concentration",
      description: `Top 3 holdings represent ${params.topThreeHoldings}% of NAV`,
      impact: "Extreme concentration - single asset stress could trigger covenant breach",
      recommendation: "Require frequent NAV reporting and top holdings disclosure",
      detectedAt: new Date(),
    });
  } else if (params.topThreeHoldings && params.topThreeHoldings > 35) {
    flags.push({
      type: "concentration",
      severity: "high",
      title: "Elevated Top Holdings Concentration",
      description: `Top 3 holdings represent ${params.topThreeHoldings}% of NAV`,
      impact: "Material concentration in few assets",
      recommendation: "Monthly monitoring of top holdings performance",
      detectedAt: new Date(),
    });
  }
  
  return flags;
}

/**
 * Detect vintage-related concerns
 */
export function detectVintageRisk(params: {
  vintage: number | null;
  fundSize: number;
}): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const currentYear = new Date().getFullYear();
  
  if (!params.vintage) {
    flags.push({
      type: "vintage",
      severity: "medium",
      title: "Vintage Year Unknown",
      description: "Fund vintage year not provided",
      impact: "Cannot assess fund lifecycle stage and risk profile",
      recommendation: "Obtain vintage year information during due diligence",
      detectedAt: new Date(),
    });
    return flags;
  }
  
  const fundAge = currentYear - params.vintage;
  
  // Too old - likely in distribution phase
  if (fundAge > 12) {
    flags.push({
      type: "vintage",
      severity: "high",
      title: "Mature Fund - Distribution Phase",
      description: `${params.vintage} vintage fund (${fundAge} years old) - likely in distribution phase`,
      impact: "NAV may decline rapidly as portfolio companies are sold; limited growth potential",
      recommendation: "Require quarterly NAV reporting; consider shorter loan term (2-3 years max)",
      detectedAt: new Date(),
    });
  } else if (fundAge > 8) {
    flags.push({
      type: "vintage",
      severity: "medium",
      title: "Mature Fund",
      description: `${params.vintage} vintage fund (${fundAge} years old) - approaching distribution phase`,
      impact: "Fund approaching end of lifecycle; exits likely to begin soon",
      recommendation: "Monitor for portfolio sales; ensure exit proceeds flow to loan repayment",
      detectedAt: new Date(),
    });
  }
  
  // Too new - limited track record
  if (fundAge < 2) {
    flags.push({
      type: "vintage",
      severity: "high",
      title: "New Fund - Limited Track Record",
      description: `${params.vintage} vintage fund (${fundAge} years old) - very early stage`,
      impact: "Limited operational history; portfolio companies may not be fully valued",
      recommendation: "Require conservative LTV (45% max); quarterly valuations required",
      detectedAt: new Date(),
    });
  } else if (fundAge < 3) {
    flags.push({
      type: "vintage",
      severity: "medium",
      title: "Young Fund",
      description: `${params.vintage} vintage fund (${fundAge} years old) - early stage`,
      impact: "Portfolio companies still maturing; limited exit track record",
      recommendation: "Enhanced monitoring during first 3 years of operation",
      detectedAt: new Date(),
    });
  }
  
  return flags;
}

/**
 * Detect portfolio distress signals
 */
export function detectPortfolioDistress(params: {
  recentNavTrend?: number; // Percentage change in last quarter
  covenantBreaches?: number; // Number of recent breaches
  latePayments?: number; // Number of late payments
  currentLtv?: number;
  description?: string; // Any distress indicators in text
}): RiskFlag[] {
  const flags: RiskFlag[] = [];
  
  // NAV decline signals
  if (params.recentNavTrend && params.recentNavTrend < -10) {
    flags.push({
      type: "distress",
      severity: "critical",
      title: "Significant NAV Decline",
      description: `NAV decreased by ${Math.abs(params.recentNavTrend).toFixed(1)}% in recent quarter`,
      impact: "May trigger covenant breach; indicates portfolio stress",
      recommendation: "Immediate review required; consider requiring additional collateral",
      detectedAt: new Date(),
    });
  } else if (params.recentNavTrend && params.recentNavTrend < -5) {
    flags.push({
      type: "distress",
      severity: "high",
      title: "NAV Decline Detected",
      description: `NAV decreased by ${Math.abs(params.recentNavTrend).toFixed(1)}% in recent quarter`,
      impact: "Approaching covenant thresholds",
      recommendation: "Enhanced monitoring; request portfolio company updates",
      detectedAt: new Date(),
    });
  }
  
  // Covenant breach history
  if (params.covenantBreaches && params.covenantBreaches > 2) {
    flags.push({
      type: "covenant",
      severity: "critical",
      title: "Multiple Covenant Breaches",
      description: `${params.covenantBreaches} covenant breaches in recent history`,
      impact: "Pattern of non-compliance; heightened default risk",
      recommendation: "Consider loan restructuring or additional guarantees",
      detectedAt: new Date(),
    });
  } else if (params.covenantBreaches && params.covenantBreaches > 0) {
    flags.push({
      type: "covenant",
      severity: "high",
      title: "Prior Covenant Breach",
      description: `${params.covenantBreaches} covenant breach(es) detected`,
      impact: "Indicates prior stress events",
      recommendation: "Review circumstances and resolution of prior breaches",
      detectedAt: new Date(),
    });
  }
  
  // Late payment history
  if (params.latePayments && params.latePayments > 1) {
    flags.push({
      type: "distress",
      severity: "high",
      title: "Payment Delinquency History",
      description: `${params.latePayments} late payments detected`,
      impact: "Cash flow issues or operational challenges",
      recommendation: "Require cash flow forecasts; consider payment guarantees",
      detectedAt: new Date(),
    });
  }
  
  // High LTV with other risk factors
  if (params.currentLtv && params.currentLtv > 65 && (params.recentNavTrend || params.covenantBreaches)) {
    flags.push({
      type: "distress",
      severity: "critical",
      title: "High LTV with Distress Signals",
      description: `Current LTV ${params.currentLtv.toFixed(1)}% combined with portfolio stress indicators`,
      impact: "Elevated risk of default or covenant breach",
      recommendation: "Require immediate deleveraging or additional security",
      detectedAt: new Date(),
    });
  }
  
  // Text-based distress detection (if description provided)
  if (params.description) {
    const distressKeywords = [
      "bankruptcy",
      "restructuring",
      "default",
      "distressed",
      "impairment",
      "write-down",
      "litigation",
      "investigation",
      "regulatory action",
    ];
    
    const descLower = params.description.toLowerCase();
    const foundKeywords = distressKeywords.filter(keyword => descLower.includes(keyword));
    
    if (foundKeywords.length > 0) {
      flags.push({
        type: "distress",
        severity: "high",
        title: "Distress Indicators in Documentation",
        description: `Detected keywords: ${foundKeywords.join(", ")}`,
        impact: "Material adverse events may be occurring",
        recommendation: "Immediate investigation and GP disclosure required",
        detectedAt: new Date(),
      });
    }
  }
  
  return flags;
}

/**
 * Market risk assessment (macro factors)
 */
export function detectMarketRisk(params: {
  sectors: string[] | null;
}): RiskFlag[] {
  const flags: RiskFlag[] = [];
  
  // Define high-risk sectors (as of 2024-2025)
  const cyclicalSectors = ["retail", "real estate", "hospitality", "energy", "automotive"];
  const regulatoryRiskSectors = ["healthcare", "financial services", "crypto", "cannabis"];
  
  if (params.sectors) {
    // Check for exposure to cyclical sectors
    const cyclicalExposure = params.sectors.filter(s => 
      cyclicalSectors.some(cs => s.toLowerCase().includes(cs))
    );
    
    if (cyclicalExposure.length > 0) {
      flags.push({
        type: "market",
        severity: "medium",
        title: "Cyclical Sector Exposure",
        description: `Exposure to cyclical sectors: ${cyclicalExposure.join(", ")}`,
        impact: "Performance may be volatile during economic downturns",
        recommendation: "Enhanced monitoring during recession risk periods",
        detectedAt: new Date(),
      });
    }
    
    // Check for regulatory risk exposure
    const regulatoryExposure = params.sectors.filter(s =>
      regulatoryRiskSectors.some(rs => s.toLowerCase().includes(rs))
    );
    
    if (regulatoryExposure.length > 0) {
      flags.push({
        type: "market",
        severity: "medium",
        title: "Regulatory Risk Exposure",
        description: `Exposure to regulated sectors: ${regulatoryExposure.join(", ")}`,
        impact: "Regulatory changes could materially affect portfolio valuations",
        recommendation: "Monitor regulatory developments in these sectors",
        detectedAt: new Date(),
      });
    }
  }
  
  return flags;
}

/**
 * Comprehensive risk assessment combining all risk types
 */
export function assessAllRisks(params: {
  portfolioCount: number | null;
  sectors: string[] | null;
  fundSize: number;
  vintage: number | null;
  topThreeHoldings?: number;
  recentNavTrend?: number;
  covenantBreaches?: number;
  latePayments?: number;
  currentLtv?: number;
  description?: string;
}): RiskAssessment {
  const allFlags: RiskFlag[] = [
    ...detectConcentrationRisk({
      portfolioCount: params.portfolioCount,
      sectors: params.sectors,
      fundSize: params.fundSize,
      topThreeHoldings: params.topThreeHoldings,
    }),
    ...detectVintageRisk({
      vintage: params.vintage,
      fundSize: params.fundSize,
    }),
    ...detectPortfolioDistress({
      recentNavTrend: params.recentNavTrend,
      covenantBreaches: params.covenantBreaches,
      latePayments: params.latePayments,
      currentLtv: params.currentLtv,
      description: params.description,
    }),
    ...detectMarketRisk({
      sectors: params.sectors,
    }),
  ];
  
  // Calculate risk score based on flags
  const severityScores = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
  };
  
  const totalScore = allFlags.reduce(
    (sum, flag) => sum + severityScores[flag.severity],
    0
  );
  
  // Cap at 100
  const score = Math.min(totalScore, 100);
  
  // Determine overall risk level
  let overall: "low" | "medium" | "high";
  if (score >= 50 || allFlags.some(f => f.severity === "critical")) {
    overall = "high";
  } else if (score >= 25 || allFlags.some(f => f.severity === "high")) {
    overall = "medium";
  } else {
    overall = "low";
  }
  
  // Generate summary
  const criticalCount = allFlags.filter(f => f.severity === "critical").length;
  const highCount = allFlags.filter(f => f.severity === "high").length;
  
  let summary = `${allFlags.length} risk flag(s) detected. `;
  if (criticalCount > 0) {
    summary += `${criticalCount} critical, `;
  }
  if (highCount > 0) {
    summary += `${highCount} high severity. `;
  }
  summary += `Overall risk: ${overall.toUpperCase()}`;
  
  return {
    overall,
    score,
    flags: allFlags,
    summary,
  };
}
