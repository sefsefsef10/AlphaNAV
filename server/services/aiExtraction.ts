// Gemini AI integration - reference: blueprint:javascript_gemini
import { GoogleGenAI } from "@google/genai";

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

  // For now, handle text-based extraction
  // TODO: Add PDF parsing, DOCX parsing for production
  let documentText = "";

  if (fileType === "application/pdf") {
    // For MVP, we'll pass the file directly to Gemini which can handle PDFs
    // In production, you might want to use pdf-parse or similar
    documentText = fileBuffer.toString("utf-8");
  } else if (
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword"
  ) {
    // For DOCX, we'd need mammoth or docx-parser
    // For MVP, attempt text extraction
    documentText = fileBuffer.toString("utf-8");
  } else if (fileType === "text/plain") {
    documentText = fileBuffer.toString("utf-8");
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel"
  ) {
    // For Excel files
    documentText = fileBuffer.toString("utf-8");
  }

  if (!documentText || documentText.trim().length === 0) {
    throw new Error("Could not extract text from document");
  }

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
