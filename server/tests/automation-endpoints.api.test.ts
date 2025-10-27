/**
 * Automation API Endpoints Integration Tests
 * 
 * Tests the automation features including:
 * - LTV Calculator with stress testing
 * - Risk Assessment with automated flag detection
 * - Eligibility Scoring for prospects
 * - AI Accuracy Validation and metrics
 * 
 * Run: NODE_ENV=test tsx server/tests/automation-endpoints.api.test.ts
 */

import request from "supertest";
import { db } from "../db";
import { users, groundTruthDatasets, validationRuns } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { app } from "../index";

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

async function setupTestUser() {
  // Get an operations user for auth-required tests
  const [opsUser] = await db.select().from(users).where(eq(users.role, "operations")).limit(1);
  
  if (!opsUser) {
    throw new Error("Test setup failed: Need an operations user");
  }

  console.log(`Test User: ${opsUser.email} (${opsUser.role})\n`);
  return opsUser;
}

async function runTests() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  Automation API Endpoints Integration Tests             ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  try {
    const opsUser = await setupTestUser();
    const authHeader = { "x-test-user-id": opsUser.id, "x-test-user-role": opsUser.role };

    // ===== TEST GROUP 1: LTV Calculator Endpoint =====
    console.log("TEST GROUP 1: LTV Calculator with Stress Testing\n");

    // Test 1.1: Basic LTV calculation
    const ltvReq1 = await request(app)
      .post("/api/automation/ltv-calculator")
      .set(authHeader)
      .send({
        requestedLoan: 50000000, // $50M
        currentNav: 100000000, // $100M
      });

    logTest(
      "LTV calculation with valid inputs",
      ltvReq1.status === 200 &&
      ltvReq1.body.currentLtv === 50 &&
      ltvReq1.body.stressTest !== undefined,
      ltvReq1.status !== 200 ? `Status ${ltvReq1.status}` : undefined,
      `LTV: ${ltvReq1.body.currentLtv}%, Recommendation: ${ltvReq1.body.recommendation}`
    );

    // Test 1.2: High LTV scenario (should decline)
    const ltvReq2 = await request(app)
      .post("/api/automation/ltv-calculator")
      .set(authHeader)
      .send({
        requestedLoan: 80000000, // $80M
        currentNav: 100000000, // $100M (80% LTV)
      });

    logTest(
      "High LTV should recommend decline",
      ltvReq2.status === 200 && ltvReq2.body.recommendation === "decline",
      ltvReq2.status !== 200 ? `Status ${ltvReq2.status}` : undefined,
      `LTV: ${ltvReq2.body.currentLtv}%, Recommendation: ${ltvReq2.body.recommendation}`
    );

    // Test 1.3: Stress test scenarios validation
    const ltvReq3 = await request(app)
      .post("/api/automation/ltv-calculator")
      .set(authHeader)
      .send({
        requestedLoan: 60000000,
        currentNav: 100000000,
      });

    const hasAllScenarios = ltvReq3.body.stressTest?.baseline &&
      ltvReq3.body.stressTest?.moderate &&
      ltvReq3.body.stressTest?.severe;

    logTest(
      "Stress test includes all three scenarios (baseline, moderate, severe)",
      ltvReq3.status === 200 && hasAllScenarios,
      !hasAllScenarios ? "Missing stress test scenarios" : undefined,
      `Baseline: ${ltvReq3.body.stressTest?.baseline?.adjustedLtv?.toFixed(1)}%, Moderate: ${ltvReq3.body.stressTest?.moderate?.adjustedLtv?.toFixed(1)}%, Severe: ${ltvReq3.body.stressTest?.severe?.adjustedLtv?.toFixed(1)}%`
    );

    // Test 1.4: Missing required parameters
    const ltvReq4 = await request(app)
      .post("/api/automation/ltv-calculator")
      .set(authHeader)
      .send({ requestedLoan: 50000000 }); // Missing currentNav

    logTest(
      "Missing required parameters returns 400",
      ltvReq4.status === 400,
      ltvReq4.status !== 400 ? `Expected 400, got ${ltvReq4.status}` : undefined
    );

    // ===== TEST GROUP 2: Risk Assessment Endpoint =====
    console.log("\nTEST GROUP 2: Risk Assessment with Automated Flags\n");

    // Test 2.1: Low risk portfolio
    const riskReq1 = await request(app)
      .post("/api/automation/risk-assessment")
      .set(authHeader)
      .send({
        portfolioCount: 15,
        sectors: ["Technology", "Healthcare", "Finance"],
        fundSize: 250000000,
        vintage: 2018,
      });

    logTest(
      "Low risk portfolio assessment",
      riskReq1.status === 200 && riskReq1.body.overall === "low",
      riskReq1.status !== 200 ? `Status ${riskReq1.status}` : undefined,
      `Risk: ${riskReq1.body.overall}, Score: ${riskReq1.body.score}/100, Flags: ${riskReq1.body.flags?.length || 0}`
    );

    // Test 2.2: High concentration risk
    const riskReq2 = await request(app)
      .post("/api/automation/risk-assessment")
      .set(authHeader)
      .send({
        portfolioCount: 3, // Very few companies - concentration risk
        sectors: ["Technology"],
        fundSize: 100000000,
        vintage: 2019,
      });

    logTest(
      "High concentration risk detected",
      riskReq2.status === 200 &&
      riskReq2.body.flags.some((f: any) => f.severity === "critical" && f.type === "concentration"),
      riskReq2.status !== 200 ? `Status ${riskReq2.status}` : undefined,
      `Risk: ${riskReq2.body.overall}, Critical Flags: ${riskReq2.body.flags?.filter((f: any) => f.severity === "critical").length}`
    );

    // Test 2.3: Vintage risk (old fund)
    const riskReq3 = await request(app)
      .post("/api/automation/risk-assessment")
      .set(authHeader)
      .send({
        portfolioCount: 12,
        sectors: ["Technology", "Healthcare"],
        fundSize: 200000000,
        vintage: 2010, // Very old fund - distribution phase
      });

    logTest(
      "Vintage risk detected for old fund",
      riskReq3.status === 200 &&
      riskReq3.body.flags.some((f: any) => f.type === "vintage"),
      riskReq3.status !== 200 ? `Status ${riskReq3.status}` : undefined,
      `Vintage: 2010, Risk: ${riskReq3.body.overall}, Vintage Flags: ${riskReq3.body.flags?.filter((f: any) => f.type === "vintage").length}`
    );

    // ===== TEST GROUP 3: Eligibility Scoring Endpoint =====
    console.log("\nTEST GROUP 3: Eligibility Scoring System\n");

    // Test 3.1: Strong candidate (7+ score)
    const eligReq1 = await request(app)
      .post("/api/automation/eligibility-score")
      .set(authHeader)
      .send({
        fundSize: 250000000, // $250M - optimal range
        vintage: 2018, // Optimal range
        gpTrackRecord: "Multiple funds with strong track record and successful exits",
        portfolioCount: 18, // Well diversified
        sectors: ["Technology", "Healthcare", "Finance", "Consumer"],
      });

    logTest(
      "Strong candidate eligibility (7+ score)",
      eligReq1.status === 200 &&
      eligReq1.body.overall >= 7 &&
      eligReq1.body.recommendation === "strong",
      eligReq1.status !== 200 ? `Status ${eligReq1.status}` : undefined,
      `Score: ${eligReq1.body.overall}/10, Recommendation: ${eligReq1.body.recommendation}`
    );

    // Test 3.2: Decline candidate (<5 score)
    const eligReq2 = await request(app)
      .post("/api/automation/eligibility-score")
      .set(authHeader)
      .send({
        fundSize: 25000000, // Too small
        vintage: 2008, // Too old
        gpTrackRecord: null,
        portfolioCount: 3, // Too few
        sectors: ["Technology"],
      });

    logTest(
      "Decline candidate eligibility (<5 score)",
      eligReq2.status === 200 &&
      eligReq2.body.overall < 5 &&
      eligReq2.body.recommendation === "decline",
      eligReq2.status !== 200 ? `Status ${eligReq2.status}` : undefined,
      `Score: ${eligReq2.body.overall}/10, Recommendation: ${eligReq2.body.recommendation}`
    );

    // Test 3.3: Review needed (5-6 score)
    const eligReq3 = await request(app)
      .post("/api/automation/eligibility-score")
      .set(authHeader)
      .send({
        fundSize: 450000000, // High end of range
        vintage: 2014, // Acceptable
        gpTrackRecord: "Experienced team",
        portfolioCount: 8, // Slightly low
        sectors: ["Technology", "Healthcare"],
      });

    logTest(
      "Review needed eligibility (5-6 score)",
      eligReq3.status === 200 &&
      eligReq3.body.overall >= 5 &&
      eligReq3.body.overall < 7 &&
      eligReq3.body.recommendation === "review",
      eligReq3.status !== 200 ? `Status ${eligReq3.status}` : undefined,
      `Score: ${eligReq3.body.overall}/10, Recommendation: ${eligReq3.body.recommendation}`
    );

    // ===== TEST GROUP 4: Accuracy Metrics Endpoint =====
    console.log("\nTEST GROUP 4: AI Accuracy Metrics\n");

    // Test 4.1: Get accuracy metrics (operations/admin only)
    const metricsReq1 = await request(app)
      .get("/api/automation/accuracy-metrics")
      .set(authHeader);

    logTest(
      "Accuracy metrics endpoint accessible to operations",
      metricsReq1.status === 200 &&
      metricsReq1.body.totalRuns !== undefined &&
      metricsReq1.body.averageAccuracy !== undefined,
      metricsReq1.status !== 200 ? `Status ${metricsReq1.status}` : undefined,
      `Total Runs: ${metricsReq1.body.totalRuns}, Avg Accuracy: ${metricsReq1.body.averageAccuracy?.toFixed(1)}%`
    );

    // Test 4.2: GP users cannot access accuracy metrics
    const [gpUser] = await db.select().from(users).where(eq(users.role, "gp")).limit(1);
    if (gpUser) {
      const metricsReq2 = await request(app)
        .get("/api/automation/accuracy-metrics")
        .set({ "x-test-user-id": gpUser.id, "x-test-user-role": gpUser.role });

      logTest(
        "GP users forbidden from accuracy metrics (403)",
        metricsReq2.status === 403,
        metricsReq2.status !== 403 ? `Expected 403, got ${metricsReq2.status}` : undefined
      );
    } else {
      logTest("GP user access test", false, "No GP user found for testing");
    }

    // ===== TEST GROUP 5: Authorization Tests =====
    console.log("\nTEST GROUP 5: Authorization Controls\n");

    // Test 5.1: Unauthenticated requests
    const unauthReq1 = await request(app)
      .post("/api/automation/ltv-calculator")
      .send({ requestedLoan: 50000000, currentNav: 100000000 });

    logTest(
      "Unauthenticated LTV request returns 401",
      unauthReq1.status === 401,
      unauthReq1.status !== 401 ? `Expected 401, got ${unauthReq1.status}` : undefined
    );

    const unauthReq2 = await request(app)
      .post("/api/automation/risk-assessment")
      .send({ portfolioCount: 15, sectors: ["Technology"] });

    logTest(
      "Unauthenticated risk assessment returns 401",
      unauthReq2.status === 401,
      unauthReq2.status !== 401 ? `Expected 401, got ${unauthReq2.status}` : undefined
    );

    // ===== SUMMARY =====
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║  Test Summary                                            ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`\x1b[32mPassed: ${passedTests}\x1b[0m`);
    if (failedTests > 0) {
      console.log(`\x1b[31mFailed: ${failedTests}\x1b[0m\n`);
      
      console.log("Failed Tests:");
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}`);
        if (r.error) console.log(`    ${r.error}`);
      });
    }

    console.log("\n");
    process.exit(failedTests > 0 ? 1 : 0);

  } catch (error) {
    console.error("\n❌ Test execution failed:");
    console.error(error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
