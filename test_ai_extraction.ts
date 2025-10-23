// Test script for Gemini AI document extraction
import { extractFundData } from "./server/geminiAI";
import * as fs from "fs";

async function testDocumentExtraction() {
  console.log("🧪 Testing Gemini AI Document Extraction\n");
  
  // Read the test document
  const documentContent = fs.readFileSync("test_documents/sample_fund_document.txt", "utf-8");
  
  console.log("📄 Test Document Content:");
  console.log("─".repeat(60));
  console.log(documentContent);
  console.log("─".repeat(60));
  console.log();
  
  // Simulate extracted text data (as would come from PDF/Word parser)
  const documentsData = [
    {
      filename: "sample_fund_document.txt",
      text: documentContent,
      extractedAt: new Date().toISOString(),
    }
  ];
  
  console.log("🤖 Calling Gemini AI for extraction...\n");
  
  try {
    const startTime = Date.now();
    const result = await extractFundData(documentsData);
    const duration = Date.now() - startTime;
    
    console.log("✅ Extraction Successful!\n");
    console.log("⏱️  Response Time:", `${duration}ms (${(duration/1000).toFixed(2)}s)`);
    console.log();
    console.log("📊 Extracted Fund Data:");
    console.log("─".repeat(60));
    console.log(JSON.stringify(result, null, 2));
    console.log("─".repeat(60));
    console.log();
    
    // Validate against expected values
    console.log("🔍 Validation:");
    console.log();
    
    const checks = [
      { name: "Fund Name", expected: "Summit Equity Partners III", actual: result.fundName, pass: result.fundName?.includes("Summit Equity") },
      { name: "Vintage Year", expected: 2020, actual: result.vintage, pass: result.vintage === 2020 },
      { name: "AUM", expected: 325000000, actual: result.aum, pass: result.aum === 325000000 },
      { name: "Portfolio Count", expected: 9, actual: result.portfolioCompanyCount, pass: result.portfolioCompanyCount === 9 },
      { name: "Sectors Extracted", expected: "3 sectors", actual: result.sectors?.length, pass: result.sectors?.length >= 3 },
      { name: "Key Personnel", expected: "3 people", actual: result.keyPersonnel?.length, pass: result.keyPersonnel?.length >= 3 },
      { name: "Borrowing Permitted", expected: true, actual: result.borrowingPermitted, pass: result.borrowingPermitted === true },
      { name: "Eligibility Check", expected: true, actual: result.meetsEligibilityCriteria, pass: result.meetsEligibilityCriteria === true },
      { name: "Confidence Score", expected: ">70%", actual: result.confidence, pass: result.confidence >= 70 },
    ];
    
    let passCount = 0;
    checks.forEach(check => {
      const status = check.pass ? "✅ PASS" : "❌ FAIL";
      console.log(`  ${status} - ${check.name}`);
      console.log(`       Expected: ${check.expected}, Got: ${check.actual}`);
      if (check.pass) passCount++;
    });
    
    console.log();
    console.log(`📈 Results: ${passCount}/${checks.length} checks passed (${Math.round(passCount/checks.length*100)}%)`);
    console.log();
    
    if (passCount === checks.length) {
      console.log("🎉 ALL TESTS PASSED - Gemini AI extraction working perfectly!");
    } else if (passCount >= checks.length * 0.7) {
      console.log("⚠️  MOST TESTS PASSED - AI extraction working but some data missed");
    } else {
      console.log("❌ TESTS FAILED - AI extraction needs improvement");
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Extraction Failed!");
    console.error(error);
    process.exit(1);
  }
}

testDocumentExtraction();
