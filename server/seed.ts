import { db } from "./db";
import { advisors } from "@shared/schema";
import { eq } from "drizzle-orm";

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
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
