import { db } from "./db";
import { marketTransactions, marketBenchmarks, usageAnalytics, pipelineStages } from "@shared/schema";

export async function seedMarketIntelligence() {
  console.log("Seeding market intelligence data...");

  // Seed anonymized market transactions
  const sectors = ['healthcare', 'technology', 'industrials', 'consumer', 'financial_services'];
  const vintages = [2019, 2020, 2021, 2022, 2023];
  const strategies = ['buyout', 'growth', 'venture'];
  const geographies = ['north_america', 'europe'];

  const transactions = [];
  for (let i = 0; i < 50; i++) {
    const vintage = vintages[Math.floor(Math.random() * vintages.length)];
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const closeDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));
    
    transactions.push({
      dealType: 'nav_facility',
      facilitySize: Math.floor(Math.random() * 40000000) + 10000000, // $10M-$50M
      loanToValue: (Math.random() * 20 + 50).toFixed(2), // 50-70%
      pricingSpread: Math.floor(Math.random() * 300) + 400, // 400-700 bps
      commitmentPeriod: Math.floor(Math.random() * 24) + 24, // 24-48 months
      fundAum: Math.floor(Math.random() * 400000000) + 100000000, // $100M-$500M
      fundVintage: vintage,
      fundStrategy: strategies[Math.floor(Math.random() * strategies.length)],
      primarySector: sector,
      geography: geographies[Math.floor(Math.random() * geographies.length)],
      portfolioCompanyCount: Math.floor(Math.random() * 20) + 5,
      maxLtvCovenant: (Math.random() * 10 + 65).toFixed(2), // 65-75%
      minNavCovenant: Math.floor(Math.random() * 20) + 80, // 80-100%
      diversificationCovenant: (Math.random() * 10 + 15).toFixed(2), // 15-25%
      liquidityCovenant: (Math.random() * 5 + 5).toFixed(2), // 5-10%
      closeDate,
      advisorInvolved: Math.random() > 0.5,
      timeToClose: Math.floor(Math.random() * 60) + 30, // 30-90 days
      competitiveBids: Math.floor(Math.random() * 5) + 2, // 2-7 lenders
      sourceType: 'platform_deal',
    });
  }

  await db.insert(marketTransactions).values(transactions).onConflictDoNothing();

  // Seed market benchmarks (pre-aggregated)
  const periodStart = new Date('2023-01-01');
  const periodEnd = new Date('2024-10-28');

  const benchmarks = [
    {
      segmentType: 'overall',
      segmentValue: null,
      periodStart,
      periodEnd,
      medianLtv: '62.5',
      medianPricingSpread: 550,
      p25PricingSpread: 475,
      p75PricingSpread: 625,
      medianFacilitySize: 28000000,
      avgFacilitySize: 30000000,
      medianMaxLtv: '70.0',
      medianMinNav: '90',
      medianDiversification: '20.0',
      dealCount: 50,
      totalVolume: 1500000000,
      avgTimeToClose: 52,
    },
    ...sectors.map(sector => ({
      segmentType: 'by_sector',
      segmentValue: sector,
      periodStart,
      periodEnd,
      medianLtv: (Math.random() * 10 + 58).toFixed(2),
      medianPricingSpread: Math.floor(Math.random() * 200) + 450,
      p25PricingSpread: Math.floor(Math.random() * 150) + 400,
      p75PricingSpread: Math.floor(Math.random() * 200) + 500,
      medianFacilitySize: Math.floor(Math.random() * 20000000) + 20000000,
      avgFacilitySize: Math.floor(Math.random() * 25000000) + 22000000,
      medianMaxLtv: (Math.random() * 8 + 67).toFixed(2),
      medianMinNav: String(Math.floor(Math.random() * 15) + 85),
      medianDiversification: (Math.random() * 8 + 18).toFixed(2),
      dealCount: Math.floor(Math.random() * 15) + 5,
      totalVolume: Math.floor(Math.random() * 500000000) + 200000000,
      avgTimeToClose: Math.floor(Math.random() * 30) + 40,
    })),
    ...vintages.map(vintage => ({
      segmentType: 'by_vintage',
      segmentValue: String(vintage),
      periodStart,
      periodEnd,
      medianLtv: (Math.random() * 8 + 60).toFixed(2),
      medianPricingSpread: Math.floor(Math.random() * 150) + 475,
      p25PricingSpread: Math.floor(Math.random() * 100) + 425,
      p75PricingSpread: Math.floor(Math.random() * 150) + 525,
      medianFacilitySize: Math.floor(Math.random() * 15000000) + 22000000,
      avgFacilitySize: Math.floor(Math.random() * 18000000) + 24000000,
      medianMaxLtv: (Math.random() * 7 + 68).toFixed(2),
      medianMinNav: String(Math.floor(Math.random() * 12) + 88),
      medianDiversification: (Math.random() * 6 + 19).toFixed(2),
      dealCount: Math.floor(Math.random() * 12) + 6,
      totalVolume: Math.floor(Math.random() * 400000000) + 250000000,
      avgTimeToClose: Math.floor(Math.random() * 25) + 45,
    })),
  ];

  await db.insert(marketBenchmarks).values(benchmarks).onConflictDoNothing();

  console.log("✓ Market intelligence data seeded successfully");
}
