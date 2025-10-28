import { db } from "./db";
import { advisors, facilities, marketTransactions, marketBenchmarks, usageAnalytics } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

async function seedMarketIntelligence() {
  try {
    console.log("Seeding market intelligence data...");

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
        facilitySize: Math.floor(Math.random() * 40000000) + 10000000,
        loanToValue: (Math.random() * 20 + 50).toFixed(2),
        pricingSpread: Math.floor(Math.random() * 300) + 400,
        commitmentPeriod: Math.floor(Math.random() * 24) + 24,
        fundAum: Math.floor(Math.random() * 400000000) + 100000000,
        fundVintage: vintage,
        fundStrategy: strategies[Math.floor(Math.random() * strategies.length)],
        primarySector: sector,
        geography: geographies[Math.floor(Math.random() * geographies.length)],
        portfolioCompanyCount: Math.floor(Math.random() * 20) + 5,
        maxLtvCovenant: (Math.random() * 10 + 65).toFixed(2),
        minNavCovenant: Math.floor(Math.random() * 20) + 80,
        diversificationCovenant: (Math.random() * 10 + 15).toFixed(2),
        liquidityCovenant: (Math.random() * 5 + 5).toFixed(2),
        closeDate,
        advisorInvolved: Math.random() > 0.5,
        timeToClose: Math.floor(Math.random() * 60) + 30,
        competitiveBids: Math.floor(Math.random() * 5) + 2,
        sourceType: 'platform_deal' as const,
      });
    }

    await db.insert(marketTransactions).values(transactions).onConflictDoNothing();

    const periodStart = new Date('2023-01-01');
    const periodEnd = new Date('2024-10-28');

    const benchmarks = [
      {
        segmentType: 'overall' as const,
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
        segmentType: 'by_sector' as const,
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
        segmentType: 'by_vintage' as const,
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

    // Seed sample usage analytics for demo
    const sampleAnalytics = [];
    const activityTypes = ['underwriting', 'covenant_check', 'rfp_creation', 'draw_request', 'term_sheet_generation'] as const;
    
    for (let i = 0; i < 20; i++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const manualTimeEstimates: Record<string, number> = {
        underwriting: 40 * 60 * 60,
        covenant_check: 3 * 60 * 60,
        rfp_creation: 2 * 60 * 60,
        draw_request: 2 * 24 * 60 * 60,
        term_sheet_generation: 16 * 60 * 60,
      };
      
      const estimatedManualTime = manualTimeEstimates[activityType];
      const actualDuration = Math.floor(estimatedManualTime * (Math.random() * 0.15 + 0.05));
      const timeSavings = estimatedManualTime - actualDuration;
      const timeSavingsPercentage = (timeSavings / estimatedManualTime) * 100;
      const laborCostSaved = Math.floor((timeSavings / 3600) * 175);

      const startTime = new Date(2024, Math.floor(Math.random() * 10), Math.floor(Math.random() * 28));
      const endTime = new Date(startTime.getTime() + actualDuration * 1000);
      
      sampleAnalytics.push({
        userId: 'demo-operations-user',
        organizationType: 'lender' as const,
        activityType,
        startTime,
        endTime,
        durationSeconds: actualDuration,
        estimatedManualTimeSeconds: estimatedManualTime,
        timeSavingsSeconds: timeSavings,
        timeSavingsPercentage: timeSavingsPercentage.toFixed(2),
        completed: true,
        automationLevel: 'ai_assisted' as const,
        estimatedLaborCostSaved: laborCostSaved,
      });
    }

    await db.insert(usageAnalytics).values(sampleAnalytics).onConflictDoNothing();
    
    console.log("✓ Market intelligence data seeded successfully");
  } catch (error: any) {
    console.log("Note: Market intelligence tables may not exist yet, skipping seed");
  }
}

export async function seedDatabase() {
  try {
    // Seed default advisor (Wheelahan Capital Advisors)
    const existingAdvisor = await db
      .select()
      .from(advisors)
      .where(eq(advisors.email, "richard@wheelahan.com"))
      .limit(1);

    if (existingAdvisor.length === 0) {
      await db.insert(advisors).values({
        id: "mock-advisor-1",
        firmName: "Wheelahan Capital Advisors",
        advisorName: "Richard Wheelahan",
        email: "richard@wheelahan.com",
        phone: "+1-555-0100",
        linkedInUrl: "https://linkedin.com/in/richardwheelahan",
        commissionRate: 50,
        status: "active",
        dealsSubmitted: 0,
        dealsWon: 0,
        totalVolume: 0,
      });
      console.log("✓ Seeded default advisor: Richard Wheelahan");
    } else {
      console.log("✓ Default advisor already exists");
    }

    // Seed test facilities for HTTP integration tests (test mode only)
    if (process.env.NODE_ENV === 'test') {
      const testFacilities = [
        { id: "facility-1", gpUserId: "Av82cL", fundName: "Test Fund 1", status: "active" as const },
        { id: "facility-2", gpUserId: "Av82cL", fundName: "Test Fund 2", status: "active" as const },
        { id: "facility-3", gpUserId: "FG9ujq", fundName: "Test Fund 3", status: "active" as const },
        { id: "facility-4", gpUserId: "FG9ujq", fundName: "Test Fund 4", status: "active" as const },
        { id: "facility-5", gpUserId: "GpeoZT", fundName: "Test Fund 5", status: "active" as const },
      ];

      for (const testFacility of testFacilities) {
        const exists = await db
          .select()
          .from(facilities)
          .where(eq(facilities.id, testFacility.id))
          .limit(1);

        if (exists.length === 0) {
          await db.insert(facilities).values({
            ...testFacility,
            principalAmount: 10000000,
            outstandingBalance: 8000000,
            interestRate: 850,
            ltvRatio: 65,
            maturityDate: new Date("2026-12-31"),
            originationDate: new Date("2024-01-01"),
          });
        }
      }
      console.log("✓ Seeded test facilities for HTTP integration tests");
    }

    await seedMarketIntelligence();
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
