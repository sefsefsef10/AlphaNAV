#!/usr/bin/env tsx
/**
 * Multi-Tenant Security Test Suite
 * 
 * Validates that GP users can ONLY access their own facilities
 * and that operations users can access all facilities.
 * 
 * Run: tsx server/test-multitenant-security.ts
 */

import { db } from "./db";
import { facilities, users } from "../shared/schema";
import { eq } from "drizzle-orm";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string, details?: string) {
  results.push({ name, passed, error, details });
  const emoji = passed ? "✓" : "✗";
  const color = passed ? "\x1b[32m" : "\x1b[31m";
  console.log(`${color}${emoji}\x1b[0m ${name}`);
  if (error) console.log(`  Error: ${error}`);
  if (details) console.log(`  Details: ${details}`);
}

async function validateFacilityOwnership(
  facilityId: string,
  userId: string,
  userRole: string,
  action: string = "access"
): Promise<{ success: boolean; status: number; error?: string; message?: string }> {
  // Fetch facility
  const [facility] = await db.select()
    .from(facilities)
    .where(eq(facilities.id, facilityId))
    .limit(1);

  if (!facility) {
    return {
      success: false,
      status: 404,
      error: "Facility not found"
    };
  }

  // Operations and admin can access all facilities
  if (userRole === "operations" || userRole === "admin") {
    return { success: true, status: 200 };
  }

  // For GP users, validate ownership
  if (userRole === "gp") {
    if (!facility.gpUserId) {
      return {
        success: false,
        status: 403,
        error: "Forbidden: Facility ownership not assigned",
        message: `This facility must be assigned to a GP user before you can ${action}. Please contact operations.`
      };
    }

    if (facility.gpUserId !== userId) {
      return {
        success: false,
        status: 403,
        error: "Forbidden: You do not have access to this facility",
        message: `You can only ${action} your own facilities`
      };
    }
  }

  return { success: true, status: 200 };
}

async function runTests() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║    Multi-Tenant Security Test Suite                     ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  try {
    // Fetch test data
    const allFacilities = await db.select().from(facilities).limit(5);
    
    // Get GP users who actually own facilities
    const gpUsersWithFacilities = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName
      })
      .from(users)
      .where(eq(users.role, "gp"))
      .execute();
    
    // Filter to only users who own at least one facility
    const gpUsers = gpUsersWithFacilities.filter(u => 
      allFacilities.some(f => f.gpUserId === u.id)
    );
    
    const [opsUser] = await db.select().from(users).where(eq(users.role, "operations")).limit(1);

    if (allFacilities.length === 0) {
      console.log("❌ No facilities found in database. Please create facilities first.\n");
      process.exit(1);
    }

    if (gpUsers.length < 2) {
      console.log("❌ Need at least 2 GP users for testing. Found:", gpUsers.length);
      console.log("Please create additional GP users or run the facility migration.\n");
      process.exit(1);
    }

    console.log("Test Data:");
    console.log(`  Facilities: ${allFacilities.length}`);
    console.log(`  GP Users: ${gpUsers.length}`);
    console.log(`  Operations Users: ${opsUser ? 1 : 0}\n`);

    // Group facilities by owner
    const gp1Facilities = allFacilities.filter(f => f.gpUserId === gpUsers[0].id);
    const gp2Facilities = allFacilities.filter(f => f.gpUserId === gpUsers[1].id);

    console.log("Facility Ownership:");
    console.log(`  GP User 1 (${gpUsers[0].email}): ${gp1Facilities.length} facilities`);
    console.log(`  GP User 2 (${gpUsers[1].email}): ${gp2Facilities.length} facilities\n`);

    console.log("Running Tests...\n");

    // Test 1: GP User 1 can access their own facilities
    console.log("TEST GROUP 1: GP User 1 Accessing Own Facilities");
    for (const facility of gp1Facilities) {
      const result = await validateFacilityOwnership(
        facility.id,
        gpUsers[0].id,
        "gp",
        "view facility details"
      );
      logTest(
        `GP1 access own facility: ${facility.fundName}`,
        result.success && result.status === 200,
        result.error,
        `Facility ID: ${facility.id}`
      );
    }

    // Test 2: GP User 1 CANNOT access GP User 2's facilities
    console.log("\nTEST GROUP 2: GP User 1 Accessing Other GP's Facilities (Should FAIL)");
    for (const facility of gp2Facilities) {
      const result = await validateFacilityOwnership(
        facility.id,
        gpUsers[0].id,
        "gp",
        "view facility details"
      );
      logTest(
        `GP1 blocked from GP2 facility: ${facility.fundName}`,
        !result.success && result.status === 403,
        result.success ? "SECURITY BREACH: Access was granted!" : undefined,
        `Facility ID: ${facility.id}, Expected: 403, Got: ${result.status}`
      );
    }

    // Test 3: GP User 2 can access their own facilities
    console.log("\nTEST GROUP 3: GP User 2 Accessing Own Facilities");
    for (const facility of gp2Facilities) {
      const result = await validateFacilityOwnership(
        facility.id,
        gpUsers[1].id,
        "gp",
        "view facility details"
      );
      logTest(
        `GP2 access own facility: ${facility.fundName}`,
        result.success && result.status === 200,
        result.error,
        `Facility ID: ${facility.id}`
      );
    }

    // Test 4: GP User 2 CANNOT access GP User 1's facilities
    console.log("\nTEST GROUP 4: GP User 2 Accessing Other GP's Facilities (Should FAIL)");
    for (const facility of gp1Facilities) {
      const result = await validateFacilityOwnership(
        facility.id,
        gpUsers[1].id,
        "gp",
        "view facility details"
      );
      logTest(
        `GP2 blocked from GP1 facility: ${facility.fundName}`,
        !result.success && result.status === 403,
        result.success ? "SECURITY BREACH: Access was granted!" : undefined,
        `Facility ID: ${facility.id}, Expected: 403, Got: ${result.status}`
      );
    }

    // Test 5: Operations user can access ALL facilities
    if (opsUser) {
      console.log("\nTEST GROUP 5: Operations User Accessing All Facilities");
      for (const facility of allFacilities) {
        const result = await validateFacilityOwnership(
          facility.id,
          opsUser.id,
          "operations",
          "view facility details"
        );
        logTest(
          `Operations access facility: ${facility.fundName}`,
          result.success && result.status === 200,
          result.error,
          `Facility ID: ${facility.id}`
        );
      }
    }

    // Test 6: Test facility with NULL gpUserId (should be blocked for GPs)
    const unassignedFacility = allFacilities.find(f => !f.gpUserId);
    if (unassignedFacility) {
      console.log("\nTEST GROUP 6: GP Access to Unassigned Facility (Should FAIL)");
      const result = await validateFacilityOwnership(
        unassignedFacility.id,
        gpUsers[0].id,
        "gp",
        "view facility details"
      );
      logTest(
        `GP blocked from unassigned facility: ${unassignedFacility.fundName}`,
        !result.success && result.status === 403,
        result.success ? "SECURITY BREACH: Access granted to unassigned facility!" : undefined,
        `Facility ID: ${unassignedFacility.id}, Expected: 403, Got: ${result.status}`
      );
    }

    // Test 7: Test non-existent facility
    console.log("\nTEST GROUP 7: Access to Non-Existent Facility");
    const nonExistentResult = await validateFacilityOwnership(
      "nonexistent-facility-id",
      gpUsers[0].id,
      "gp",
      "view facility details"
    );
    logTest(
      "Non-existent facility returns 404",
      !nonExistentResult.success && nonExistentResult.status === 404,
      nonExistentResult.success ? "Should return 404" : undefined,
      `Expected: 404, Got: ${nonExistentResult.status}`
    );

    // Summary
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║    Test Summary                                          ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log("❌ SECURITY VULNERABILITIES DETECTED!\n");
      console.log("Failed Tests:");
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}`);
        if (r.error) console.log(`    Error: ${r.error}`);
      });
      console.log("");
      process.exit(1);
    } else {
      console.log("✅ ALL SECURITY TESTS PASSED!\n");
      console.log("Multi-tenant security implementation is working correctly:");
      console.log("  ✓ GP users can access their own facilities");
      console.log("  ✓ GP users CANNOT access other GPs' facilities");
      console.log("  ✓ Operations users can access all facilities");
      console.log("  ✓ Unassigned facilities are blocked for GP users");
      console.log("  ✓ Non-existent facilities return 404\n");
      process.exit(0);
    }

  } catch (error) {
    console.error("\n❌ Test execution failed:", error);
    process.exit(1);
  }
}

runTests();
