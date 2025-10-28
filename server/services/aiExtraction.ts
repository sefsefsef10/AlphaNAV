// Gemini AI integration - reference: blueprint:javascript_gemini
import { GoogleGenAI } from "@google/genai";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ExtractionResult {
  fundName: string | null;
  fundSize: number | null; // AUM in dollars
  vintage: number | null;
  portfolioCount: number | null;
  sectors: string[] | null;
  gpName: string | null;
  gpFirmName: string | null;
  gpTrackRecord: string | null;
  fundStructure: string | null;
  strategy: string | null;
  geography: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  confidence: {
    overall: number; // 0-100
    fundName: number;
    fundSize: number;
    vintage: number;
    portfolioCount: number;
    gpInfo: number;
  };
  rawResponse: string;
}

export interface UnderwritingExtractionResult extends ExtractionResult {
  fundAUM: number | null;
  fundType: string | null;
  fundStatus: string | null;
  gpEntity: string | null;
  portfolioCompanyCount: number | null;
  portfolioCompanies: Array<{ name: string; sector: string; value: number }> | null;
  sectorDistribution: Record<string, number> | null;
  largestHoldingPercent: number | null;
  topThreeConcentration: number | null;
  currentNAV: number | null;
  unrealizedValue: number | null;
  realizedValue: number | null;
  grossIRR: number | null;
  netIRR: number | null;
  moic: number | null;
  dpi: number | null;
  rvpi: number | null;
  cashReserves: number | null;
  totalDebt: number | null;
  capitalCommitted: number | null;
  capitalCalled: number | null;
  priorFundCount: number | null;
  priorFundAUM: number | null;
  priorFundAvgIRR: number | null;
  priorFundAvgMOIC: number | null;
  yearsOfExperience: number | null;
  teamSize: number | null;
  extractionConfidence: number;
  lowConfidenceFields: string[];
}

const EXTRACTION_PROMPT = `You are an expert financial analyst specializing in private equity fund analysis. Extract the following information from this fund document:

1. Fund Name (exact legal name)
2. Fund Size / AUM (Assets Under Management) - convert to USD amount
3. Vintage Year (year the fund was raised)
4. Number of Portfolio Companies
5. Investment Sectors (list all mentioned sectors)
6. General Partner (GP) Name
7. GP Firm Name
8. GP Track Record (brief summary of past performance/experience)
9. Fund Structure (LP/GP split, fund type, etc.)
10. Investment Strategy (growth, buyout, distressed, etc.)
11. Geographic Focus
12. Contact Information (name, email, phone if available)

For each piece of extracted information, provide a confidence score from 0-100:
- 0-70: Low confidence (unclear, ambiguous, or inferred)
- 71-90: Medium confidence (clearly stated but may need verification)
- 91-100: High confidence (explicitly stated with clear supporting evidence)

Respond ONLY with valid JSON in this exact format:
{
  "fundName": "string or null",
  "fundSize": number or null,
  "vintage": number or null,
  "portfolioCount": number or null,
  "sectors": ["sector1", "sector2"] or null,
  "gpName": "string or null",
  "gpFirmName": "string or null",
  "gpTrackRecord": "string or null",
  "fundStructure": "string or null",
  "strategy": "string or null",
  "geography": "string or null",
  "contactName": "string or null",
  "contactEmail": "string or null",
  "contactPhone": "string or null",
  "confidence": {
    "fundName": number,
    "fundSize": number,
    "vintage": number,
    "portfolioCount": number,
    "gpInfo": number,
    "overall": number
  }
}

If information is not found in the document, set the value to null and confidence to 0.
Calculate overall confidence as the weighted average of all individual confidence scores.`;

export async function extractFundData(
  documentText: string
): Promise<ExtractionResult> {
  try {
    // Properly structured contents array for Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${EXTRACTION_PROMPT}\n\nDocument content:\n${documentText}`
            }
          ]
        }
      ],
    });

    const text = response.text || "";

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "").replace(/```\n?$/g, "");
    }

    // Defensive JSON parsing
    let extracted;
    try {
      extracted = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", text);
      throw new Error("AI returned invalid JSON response");
    }

    // Validate required structure
    if (!extracted.confidence) {
      throw new Error("AI response missing required confidence scores");
    }

    return {
      ...extracted,
      rawResponse: text,
    };
  } catch (error) {
    console.error("AI extraction error:", error);
    throw new Error(
      `Failed to extract fund data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

const UNDERWRITING_EXTRACTION_PROMPT = `You are a senior underwriter for NAV lending specializing in private equity fund analysis. Extract comprehensive underwriting data from this fund document for credit assessment.

Extract ALL of the following 47+ data points (set to null if not found):

FUND BASICS:
1. Fund Name
2. Fund AUM (Assets Under Management in USD)
3. Vintage Year
4. GP Entity (legal entity name)
5. GP Firm Name
6. Fund Structure (LP, GP, etc.)
7. Investment Strategy
8. Geographic Focus
9. Fund Type (buyout, growth, etc.)
10. Fund Status (growing, stable, declining)

PORTFOLIO ANALYSIS (CRITICAL):
11. Portfolio Company Count
12. Portfolio Companies (array of {name, sector, value})
13. Sector Distribution (object mapping sector to percentage)
14. Largest Single Holding Percentage
15. Top 3 Holdings Concentration Percentage

FINANCIAL PERFORMANCE:
16. Current NAV (Net Asset Value in USD)
17. Unrealized Value
18. Realized Value
19. Gross IRR (%)
20. Net IRR (%)
21. MOIC (Multiple on Invested Capital)
22. DPI (Distributions to Paid-In)
23. RVPI (Residual Value to Paid-In)

LIQUIDITY & CAPITAL:
24. Cash Reserves (USD)
25. Total Debt (USD)
26. Capital Committed (USD)
27. Capital Called (USD)

GP TRACK RECORD:
28. Prior Fund Count
29. Prior Fund Average AUM
30. Prior Fund Average IRR (%)
31. Prior Fund Average MOIC
32. Years of Experience
33. Team Size

For each data point, assign a confidence score (0-100):
- 0-70: Low (inferred, unclear)
- 71-90: Medium (stated but needs verification)  
- 91-100: High (explicitly stated with evidence)

Respond ONLY with valid JSON in this format:
{
  "fundName": "string or null",
  "fundAUM": number or null,
  "vintage": number or null,
  "gpEntity": "string or null",
  "gpFirmName": "string or null",
  "fundStructure": "string or null",
  "strategy": "string or null",
  "geography": "string or null",
  "fundType": "string or null",
  "fundStatus": "string or null",
  "portfolioCompanyCount": number or null,
  "portfolioCompanies": [{"name": "string", "sector": "string", "value": number}] or null,
  "sectorDistribution": {"sector1": percentage, "sector2": percentage} or null,
  "largestHoldingPercent": number or null,
  "topThreeConcentration": number or null,
  "currentNAV": number or null,
  "unrealizedValue": number or null,
  "realizedValue": number or null,
  "grossIRR": number or null,
  "netIRR": number or null,
  "moic": number or null,
  "dpi": number or null,
  "rvpi": number or null,
  "cashReserves": number or null,
  "totalDebt": number or null,
  "capitalCommitted": number or null,
  "capitalCalled": number or null,
  "priorFundCount": number or null,
  "priorFundAUM": number or null,
  "priorFundAvgIRR": number or null,
  "priorFundAvgMOIC": number or null,
  "yearsOfExperience": number or null,
  "teamSize": number or null,
  "fieldConfidence": {
    "fundName": number,
    "fundAUM": number,
    "portfolioCompanies": number,
    "currentNAV": number,
    "netIRR": number,
    "moic": number
  }
}`;

export async function extractUnderwritingData(
  documentText: string
): Promise<UnderwritingExtractionResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${UNDERWRITING_EXTRACTION_PROMPT}\n\nDocument content:\n${documentText}`
            }
          ]
        }
      ],
    });

    const text = response.text || "";

    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "").replace(/```\n?$/g, "");
    }

    let extracted;
    try {
      extracted = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", text);
      throw new Error("AI returned invalid JSON response");
    }

    const fieldConfidence = extracted.fieldConfidence || {};
    const lowConfidenceFields: string[] = [];
    let totalConfidence = 0;
    let fieldCount = 0;

    Object.entries(fieldConfidence).forEach(([field, confidence]) => {
      const conf = confidence as number;
      totalConfidence += conf;
      fieldCount++;
      if (conf < 71) {
        lowConfidenceFields.push(field);
      }
    });

    const overallConfidence = fieldCount > 0 ? Math.round(totalConfidence / fieldCount) : 0;

    return {
      ...extracted,
      fundSize: extracted.fundAUM,
      portfolioCount: extracted.portfolioCompanyCount,
      sectors: extracted.sectorDistribution ? Object.keys(extracted.sectorDistribution) : null,
      gpName: extracted.gpEntity || extracted.gpFirmName,
      extractionConfidence: overallConfidence,
      lowConfidenceFields,
      confidence: {
        overall: overallConfidence,
        fundName: fieldConfidence.fundName || 0,
        fundSize: fieldConfidence.fundAUM || 0,
        vintage: fieldConfidence.vintage || 0,
        portfolioCount: fieldConfidence.portfolioCompanies || 0,
        gpInfo: Math.round(((fieldConfidence.gpEntity || 0) + (fieldConfidence.gpFirmName || 0)) / 2),
      },
      rawResponse: text,
    };
  } catch (error) {
    console.error("Underwriting extraction error:", error);
    throw new Error(
      `Failed to extract underwriting data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Allowed file types for security
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/plain",
];

export async function extractFromFile(
  fileBuffer: Buffer,
  fileType: string
): Promise<ExtractionResult> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    throw new Error(
      `Unsupported file type: ${fileType}. Allowed types: PDF, Word, Excel, or Text files.`
    );
  }

  let documentText = "";

  try {
    if (fileType === "application/pdf") {
      // Parse PDF using pdf-parse (v2.x class-based API)
      console.log("Parsing PDF document...");
      const parser = new PDFParse({ data: fileBuffer });
      
      try {
        const result = await parser.getText();
        documentText = result.text;
        console.log(`PDF parsed: ${result.total || 0} pages, ${documentText.length} characters`);
      } finally {
        // Always destroy parser to free resources
        await parser.destroy();
      }
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Parse DOCX using mammoth
      console.log("Parsing DOCX document...");
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      documentText = result.value;
      console.log(`DOCX parsed: ${documentText.length} characters`);
      
      if (result.messages && result.messages.length > 0) {
        console.warn("DOCX parsing warnings:", result.messages);
      }
    } else if (fileType === "application/msword") {
      // Legacy DOC format - attempt text extraction
      // Note: Mammoth doesn't support .doc, only .docx
      console.warn("Legacy .doc format detected, attempting basic text extraction");
      documentText = fileBuffer.toString("utf-8");
    } else if (fileType === "text/plain") {
      // Plain text - direct conversion
      documentText = fileBuffer.toString("utf-8");
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileType === "application/vnd.ms-excel"
    ) {
      // Excel files - basic text extraction
      // For production, consider using xlsx library for structured data
      console.warn("Excel file detected, using basic text extraction");
      documentText = fileBuffer.toString("utf-8");
    }
  } catch (parseError) {
    console.error("Document parsing error:", parseError);
    throw new Error(
      `Failed to parse document: ${parseError instanceof Error ? parseError.message : "Unknown parsing error"}`
    );
  }

  // Validate extracted text
  if (!documentText || documentText.trim().length === 0) {
    throw new Error("Could not extract text from document - file may be empty or corrupted");
  }

  // Limit text length for AI processing (Gemini has token limits)
  const MAX_TEXT_LENGTH = 50000; // ~50K characters
  if (documentText.length > MAX_TEXT_LENGTH) {
    console.warn(`Document text truncated from ${documentText.length} to ${MAX_TEXT_LENGTH} characters`);
    documentText = documentText.substring(0, MAX_TEXT_LENGTH);
  }

  console.log(`Sending ${documentText.length} characters to AI for extraction`);
  return extractFundData(documentText);
}

export function getConfidenceLevel(
  score: number
): "high" | "medium" | "low" {
  if (score >= 91) return "high";
  if (score >= 71) return "medium";
  return "low";
}

export function getConfidenceBadgeColor(
  level: "high" | "medium" | "low"
): string {
  switch (level) {
    case "high":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "medium":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "low":
      return "bg-red-500/10 text-red-500 border-red-500/20";
  }
}
