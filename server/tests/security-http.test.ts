/**
 * Multi-Tenant Security HTTP Integration Tests
 * Tests actual production HTTP endpoints with authenticated requests
 * 
 * Run: tsx server/tests/security-http.test.ts
 */

import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { testUsers } from "./helpers/testAuth";

// Create test app instance
const testApp = express();
testApp.use(express.json());

// Test authentication middleware - injects test user into req.user
testApp.use((req, _res, next) => {
  const userId = req.header("X-Test-User-ID");
  const userRole = req.header("X-Test-User-Role");
  
  if (userId && userRole) {
    req.user = {
      id: userId,
      role: userRole,
      email: `${userId}@test.com`,
      firstName: "Test",
      lastName: "User",
      createdAt: new Date(),
      updatedAt: new Date()
    } as Express.User;
  }
  next();
});

// Test results tracking
interface TestResult {
  name: string;
  passed: boolean;
  status?: number;
  expected?: number;
}

const results: TestResult[] = [];

function logTest(name: string, actualStatus: number, expectedStatus: number) {
  const passed = actualStatus === expectedStatus;
  results.push({ name, passed, status: actualStatus, expected: expectedStatus });
  const emoji = passed ? "✓" : "✗";
  const color = passed ? "\x1b[32m" : "\x1b[31m";
  console.log(`${color}${emoji}\x1b[0m ${name} [${actualStatus} vs ${expectedStatus}]`);
}

async function runTests() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  Multi-Tenant Security HTTP Integration Tests           ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  try {
    // Initialize routes
    await registerRoutes(testApp);
    console.log("✓ Test app initialized with production routes\n");

    // Test data - facilities owned by different GPs
    const facilities = {
      gp1: ["facility-1", "facility-2"], // Owned by Av82cL
      gp2: ["facility-3", "facility-4"], // Owned by FG9ujq
      gp3: ["facility-5"]                 // Owned by GpeoZT
    };

    console.log("TEST GROUP 1: GP User 1 Access Patterns\n");

    // GP1 accesses own facilities - should succeed (200)
    for (const facilityId of facilities.gp1) {
      const res = await request(testApp)
        .get(`/api/facilities/${facilityId}`)
        .set("X-Test-User-ID", "Av82cL")
        .set("X-Test-User-Role", "gp");
      
      logTest(`GP1 GET /api/facilities/${facilityId} (own facility)`, res.status, 200);
    }

    // GP1 tries to access GP2's facilities - should fail (403)
    for (const facilityId of facilities.gp2) {
      const res = await request(testApp)
        .get(`/api/facilities/${facilityId}`)
        .set("X-Test-User-ID", "Av82cL")
        .set("X-Test-User-Role", "gp");
      
      logTest(`GP1 GET /api/facilities/${facilityId} (other GP)`, res.status, 403);
    }

    console.log("\nTEST GROUP 2: GP User 2 Access Patterns\n");

    // GP2 accesses own facilities - should succeed (200)
    for (const facilityId of facilities.gp2) {
      const res = await request(testApp)
        .get(`/api/facilities/${facilityId}`)
        .set("X-Test-User-ID", "FG9ujq")
        .set("X-Test-User-Role", "gp");
      
      logTest(`GP2 GET /api/facilities/${facilityId} (own facility)`, res.status, 200);
    }

    // GP2 tries to access GP1's facilities - should fail (403)
    for (const facilityId of facilities.gp1) {
      const res = await request(testApp)
        .get(`/api/facilities/${facilityId}`)
        .set("X-Test-User-ID", "FG9ujq")
        .set("X-Test-User-Role", "gp");
      
      logTest(`GP2 GET /api/facilities/${facilityId} (other GP)`, res.status, 403);
    }

    console.log("\nTEST GROUP 3: Operations User Access\n");

    // Operations can access all facilities - should succeed (200)
    const allFacilities = [...facilities.gp1, ...facilities.gp2, ...facilities.gp3];
    for (const facilityId of allFacilities) {
      const res = await request(testApp)
        .get(`/api/facilities/${facilityId}`)
        .set("X-Test-User-ID", "ops-user-1")
        .set("X-Test-User-Role", "operations");
      
      logTest(`OPS GET /api/facilities/${facilityId}`, res.status, 200);
    }

    console.log("\nTEST GROUP 4: Draw Request Endpoints\n");

    // GP1 creates draw request for own facility - should succeed
    const drawRes1 = await request(testApp)
      .post(`/api/facilities/facility-1/draw-requests`)
      .set("X-Test-User-ID", "Av82cL")
      .set("X-Test-User-Role", "gp")
      .send({
        amount: 1000000,
        purpose: "Capital deployment test",
        requestedDisbursementDate: "2025-12-01"
      });
    
    logTest("GP1 POST /api/facilities/facility-1/draw-requests (own)", drawRes1.status, 201);

    // GP1 tries to create draw request for GP2's facility - should fail
    const drawRes2 = await request(testApp)
      .post(`/api/facilities/facility-3/draw-requests`)
      .set("X-Test-User-ID", "Av82cL")
      .set("X-Test-User-Role", "gp")
      .send({
        amount: 500000,
        purpose: "Unauthorized test",
        requestedDisbursementDate: "2025-12-01"
      });
    
    logTest("GP1 POST /api/facilities/facility-3/draw-requests (other GP)", drawRes2.status, 403);

    console.log("\nTEST GROUP 5: Edge Cases\n");

    // Non-existent facility - should return 404
    const notFoundRes = await request(testApp)
      .get("/api/facilities/nonexistent-id")
      .set("X-Test-User-ID", "Av82cL")
      .set("X-Test-User-Role", "gp");
    
    logTest("GP1 GET /api/facilities/nonexistent-id", notFoundRes.status, 404);

    // Unauthenticated request - should return 401
    const unauthRes = await request(testApp)
      .get("/api/facilities/facility-1");
    
    logTest("Unauthenticated GET /api/facilities/facility-1", unauthRes.status, 401);

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
      console.log("❌ SECURITY TESTS FAILED!\n");
      const failures = results.filter(r => !r.passed);
      failures.forEach(f => {
        console.log(`  - ${f.name}`);
        console.log(`    Expected: ${f.expected}, Got: ${f.status}`);
      });
      console.log("");
      process.exit(1);
    } else {
      console.log("✅ ALL HTTP SECURITY TESTS PASSED!\n");
      console.log("Validated via actual HTTP endpoints:");
      console.log("  ✓ GP users can access their own facilities (200)");
      console.log("  ✓ GP users CANNOT access other GPs' facilities (403)");
      console.log("  ✓ Operations users can access all facilities (200)");
      console.log("  ✓ Non-existent facilities return 404");
      console.log("  ✓ Unauthenticated requests return 401\n");
      process.exit(0);
    }

  } catch (error) {
    console.error("\n❌ Test execution failed:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

runTests();
