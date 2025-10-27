import { db } from "./db";
import { advisors, facilities } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

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
            loanAmount: 10000000,
            currentOutstanding: 8000000,
            interestRate: 8.5,
            loanToValue: 65,
            maturityDate: new Date("2026-12-31"),
            originationDate: new Date("2024-01-01"),
          });
        }
      }
      console.log("✓ Seeded test facilities for HTTP integration tests");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
