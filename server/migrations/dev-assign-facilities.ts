#!/usr/bin/env tsx
/**
 * Quick Development Migration
 * 
 * Assigns all unassigned facilities to the first GP user found.
 * USE ONLY IN DEVELOPMENT - NOT FOR PRODUCTION
 * 
 * Usage:
 *   npm run migrate:facilities:dev
 */

import { db } from "../db";
import { facilities, users } from "../../shared/schema";
import { eq, isNull } from "drizzle-orm";

async function quickAssign() {
  console.log("🔧 Development Facility Migration\n");

  // Find first GP user
  const [gpUser] = await db
    .select()
    .from(users)
    .where(eq(users.role, "gp"))
    .limit(1);

  if (!gpUser) {
    console.log("❌ No GP user found. Please create a GP user first.");
    console.log("   You can change a user's role in the database:");
    console.log("   UPDATE users SET role = 'gp' WHERE email = 'your-email@example.com';\n");
    process.exit(1);
  }

  const name = gpUser.firstName && gpUser.lastName
    ? `${gpUser.firstName} ${gpUser.lastName}`
    : gpUser.email || "GP User";

  // Count unassigned facilities
  const unassigned = await db
    .select({ id: facilities.id })
    .from(facilities)
    .where(isNull(facilities.gpUserId));

  if (unassigned.length === 0) {
    console.log("✓ All facilities already have ownership assigned!\n");
    process.exit(0);
  }

  console.log(`Found ${unassigned.length} facilities without ownership`);
  console.log(`Assigning all to: ${name} (${gpUser.id})\n`);

  // Assign all facilities to this GP
  const result = await db
    .update(facilities)
    .set({
      gpUserId: gpUser.id,
      updatedAt: new Date(),
    })
    .where(isNull(facilities.gpUserId))
    .returning({ 
      id: facilities.id,
      fundName: facilities.fundName 
    });

  console.log(`✓ Successfully assigned ${result.length} facilities:\n`);
  result.forEach((f, i) => {
    console.log(`   ${i + 1}. ${f.fundName} (${f.id})`);
  });

  console.log(`\n✅ Migration complete!\n`);
}

quickAssign()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
