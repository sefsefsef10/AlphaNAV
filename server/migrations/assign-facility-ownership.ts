#!/usr/bin/env tsx
/**
 * Facility Ownership Migration Script
 * 
 * Purpose: Assign gpUserId to existing facilities for multi-tenant security
 * 
 * This script helps operations team assign facility ownership to GP users.
 * Run this BEFORE deploying multi-tenant security features to production.
 * 
 * Usage:
 *   npm run tsx server/migrations/assign-facility-ownership.ts
 */

import { db } from "../db";
import { facilities, users } from "../../shared/schema";
import { eq, isNull } from "drizzle-orm";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

interface FacilityWithoutOwner {
  id: string;
  fundName: string;
  principalAmount: number;
  lenderName: string;
  status: string;
  originationDate: Date;
}

interface GPUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

async function listUnassignedFacilities(): Promise<FacilityWithoutOwner[]> {
  return await db
    .select({
      id: facilities.id,
      fundName: facilities.fundName,
      principalAmount: facilities.principalAmount,
      lenderName: facilities.lenderName,
      status: facilities.status,
      originationDate: facilities.originationDate,
    })
    .from(facilities)
    .where(isNull(facilities.gpUserId));
}

async function listGPUsers(): Promise<GPUser[]> {
  return await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    })
    .from(users)
    .where(eq(users.role, "gp"));
}

async function assignFacilityToGP(
  facilityId: string,
  gpUserId: string
): Promise<void> {
  await db
    .update(facilities)
    .set({ 
      gpUserId,
      updatedAt: new Date() 
    })
    .where(eq(facilities.id, facilityId));
}

async function assignAllToSingleGP(gpUserId: string): Promise<number> {
  const result = await db
    .update(facilities)
    .set({ 
      gpUserId,
      updatedAt: new Date() 
    })
    .where(isNull(facilities.gpUserId))
    .returning({ id: facilities.id });
  
  return result.length;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function interactiveMigration() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║    Facility Ownership Migration Tool                    ║");
  console.log("║    Assign GP users to facilities for multi-tenant       ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // Fetch unassigned facilities
  const unassignedFacilities = await listUnassignedFacilities();
  
  if (unassignedFacilities.length === 0) {
    console.log("✓ All facilities already have ownership assigned!");
    console.log("Migration complete. No action needed.\n");
    rl.close();
    process.exit(0);
  }

  console.log(`⚠️  Found ${unassignedFacilities.length} facilities without GP ownership:\n`);
  
  unassignedFacilities.forEach((facility, index) => {
    console.log(`${index + 1}. ${facility.fundName}`);
    console.log(`   ID: ${facility.id}`);
    console.log(`   Principal: ${formatCurrency(facility.principalAmount)}`);
    console.log(`   Status: ${facility.status}`);
    console.log(`   Origination: ${formatDate(facility.originationDate)}\n`);
  });

  // Fetch GP users
  const gpUsers = await listGPUsers();
  
  if (gpUsers.length === 0) {
    console.log("❌ No GP users found in the system!");
    console.log("Please create GP users before running this migration.\n");
    rl.close();
    process.exit(1);
  }

  console.log(`Available GP Users (${gpUsers.length}):\n`);
  
  gpUsers.forEach((user, index) => {
    const name = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.email || "Unnamed User";
    console.log(`${index + 1}. ${name}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email || "N/A"}\n`);
  });

  console.log("Migration Options:");
  console.log("1. Assign ALL facilities to a single GP (for development/testing)");
  console.log("2. Assign facilities individually (for production)");
  console.log("3. Exit without changes\n");

  const choice = await question("Select an option (1-3): ");

  if (choice === "1") {
    // Bulk assignment
    const gpIndex = await question(
      `\nEnter GP user number (1-${gpUsers.length}): `
    );
    const selectedGP = gpUsers[parseInt(gpIndex) - 1];

    if (!selectedGP) {
      console.log("❌ Invalid selection. Exiting.\n");
      rl.close();
      process.exit(1);
    }

    const name = selectedGP.firstName && selectedGP.lastName 
      ? `${selectedGP.firstName} ${selectedGP.lastName}` 
      : selectedGP.email;

    console.log(`\n⚠️  You are about to assign ALL ${unassignedFacilities.length} facilities to:`);
    console.log(`   ${name} (${selectedGP.id})\n`);

    const confirm = await question("Confirm? (yes/no): ");

    if (confirm.toLowerCase() === "yes") {
      console.log("\n🔄 Assigning facilities...");
      const count = await assignAllToSingleGP(selectedGP.id);
      console.log(`✓ Successfully assigned ${count} facilities to ${name}\n`);
    } else {
      console.log("❌ Operation cancelled.\n");
    }

    rl.close();
    process.exit(0);
  } else if (choice === "2") {
    // Individual assignment
    console.log("\n📝 Individual Assignment Mode");
    console.log("For each facility, enter the GP user number to assign.\n");

    for (const facility of unassignedFacilities) {
      console.log(`\n--- Facility: ${facility.fundName} ---`);
      console.log(`Principal: ${formatCurrency(facility.principalAmount)}`);
      console.log(`Status: ${facility.status}\n`);

      const gpIndex = await question(
        `Assign to GP (1-${gpUsers.length}) or 's' to skip: `
      );

      if (gpIndex.toLowerCase() === "s") {
        console.log("⊘ Skipped");
        continue;
      }

      const selectedGP = gpUsers[parseInt(gpIndex) - 1];

      if (!selectedGP) {
        console.log("❌ Invalid selection. Skipping facility.");
        continue;
      }

      const name = selectedGP.firstName && selectedGP.lastName 
        ? `${selectedGP.firstName} ${selectedGP.lastName}` 
        : selectedGP.email;

      await assignFacilityToGP(facility.id, selectedGP.id);
      console.log(`✓ Assigned to ${name}`);
    }

    console.log("\n✓ Individual assignment complete!\n");
    rl.close();
    process.exit(0);
  } else {
    console.log("\n❌ Exiting without changes.\n");
    rl.close();
    process.exit(0);
  }
}

async function directSQLMigration() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║    SQL Migration Commands                                ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const unassignedFacilities = await listUnassignedFacilities();
  const gpUsers = await listGPUsers();

  if (unassignedFacilities.length === 0) {
    console.log("✓ All facilities already have ownership assigned!\n");
    return;
  }

  console.log("-- Copy and execute these SQL commands in your database:\n");
  console.log("-- Available GP Users:");
  gpUsers.forEach((user) => {
    const name = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.email || "Unnamed User";
    console.log(`-- ${name}: ${user.id}`);
  });

  console.log("\n-- Facilities needing assignment:");
  unassignedFacilities.forEach((facility) => {
    console.log(`\n-- ${facility.fundName} (${formatCurrency(facility.principalAmount)})`);
    console.log(
      `UPDATE facilities SET gp_user_id = '[GP_USER_ID_HERE]', updated_at = NOW() WHERE id = '${facility.id}';`
    );
  });

  console.log("\n-- Or assign ALL facilities to a single GP:");
  console.log(
    `UPDATE facilities SET gp_user_id = '[GP_USER_ID_HERE]', updated_at = NOW() WHERE gp_user_id IS NULL;\n`
  );
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes("--sql")) {
    await directSQLMigration();
  } else if (args.includes("--help")) {
    console.log("Facility Ownership Migration Tool\n");
    console.log("Usage:");
    console.log("  tsx server/migrations/assign-facility-ownership.ts          # Interactive mode");
    console.log("  tsx server/migrations/assign-facility-ownership.ts --sql    # Generate SQL commands");
    console.log("  tsx server/migrations/assign-facility-ownership.ts --help   # Show this help\n");
  } else {
    await interactiveMigration();
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
