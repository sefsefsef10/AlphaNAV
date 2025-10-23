// Gemini AI integration - reference: blueprint:javascript_gemini
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Extract fund data from documents
export async function extractFundData(documentsData: any[]): Promise<any> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: `You are analyzing documents from a PE fund applying for NAV IQ Capital lending.
Consolidate the extracted data into a single comprehensive fund profile.

NAV IQ Capital eligibility criteria:
- US Growth / Buyout PE with $100M-$500M AUM
- 4+ year vintage (founded in 2021 or earlier)
- Post-investment period preferred
- 5+ portfolio companies (diversified)
- Borrowing permitted or amendable fund documentation

Return a JSON object with these exact fields:
{
  "fundName": string,
  "vintage": number (fund formation year),
  "aum": number (in dollars, not millions),
  "portfolioCompanyCount": number,
  "sectors": string[],
  "keyPersonnel": string[],
  "borrowingPermitted": boolean,
  "fundStatus": string,
  "meetsEligibilityCriteria": boolean,
  "eligibilityNotes": string,
  "confidence": number (0-100)
}`,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            fundName: { type: "string" },
            vintage: { type: "number" },
            aum: { type: "number" },
            portfolioCompanyCount: { type: "number" },
            sectors: { type: "array", items: { type: "string" } },
            keyPersonnel: { type: "array", items: { type: "string" } },
            borrowingPermitted: { type: "boolean" },
            fundStatus: { type: "string" },
            meetsEligibilityCriteria: { type: "boolean" },
            eligibilityNotes: { type: "string" },
            confidence: { type: "number" },
          },
          required: ["fundName", "eligibilityNotes"],
        },
      },
      contents: `Here is the extracted data from ${documentsData.length} document(s):\n\n${JSON.stringify(documentsData, null, 2)}\n\nPlease consolidate and analyze for NAV IQ Capital eligibility. Current year is 2025.`,
    });

    const result = JSON.parse(response.text || "{}");
    return {
      fundName: result.fundName || "Not provided",
      vintage: result.vintage || null,
      aum: result.aum || null,
      portfolioCompanyCount: result.portfolioCompanyCount || null,
      sectors: Array.isArray(result.sectors) ? result.sectors : [],
      keyPersonnel: Array.isArray(result.keyPersonnel) ? result.keyPersonnel : [],
      borrowingPermitted: result.borrowingPermitted || false,
      fundStatus: result.fundStatus || "Unknown",
      meetsEligibilityCriteria: result.meetsEligibilityCriteria || false,
      eligibilityNotes: result.eligibilityNotes || "Insufficient data for assessment",
      confidence: result.confidence || 0,
    };
  } catch (error) {
    console.error("Error analyzing with Gemini:", error);
    throw error;
  }
}

// Generate IC memo
export async function generateICMemo(dealData: any): Promise<string> {
  try {
    const prompt = `Generate a professional Investment Committee Memorandum for this NAV lending opportunity:

Fund Name: ${dealData.fundName}
Requested Amount: $${dealData.loanAmount?.toLocaleString() || 'TBD'}
Fund AUM: $${dealData.fundSize?.toLocaleString() || 'TBD'}
Vintage: ${dealData.vintage || 'TBD'}
Portfolio Companies: ${dealData.portfolioCount || 'TBD'}
Sectors: ${dealData.sectors?.join(', ') || 'TBD'}

Please create a structured IC memo with:
1. Executive Summary
2. Fund Overview
3. Financial Analysis
4. Risk Assessment
5. Covenant Package Recommendation
6. Final Recommendation

Be professional, data-driven, and concise.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    return response.text || "Failed to generate memo";
  } catch (error) {
    console.error("Error generating IC memo:", error);
    throw error;
  }
}

// Analyze covenant breach risk
export async function analyzeCovenantBreach(facilityData: any, financialMetrics: any): Promise<any> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: `You are a financial analyst assessing covenant breach risk for a NAV lending facility.
Analyze the provided data and predict breach probability.

Return JSON with:
{
  "breachProbability": number (0-100),
  "riskLevel": string ("low", "medium", "high", "critical"),
  "keyRiskFactors": string[],
  "recommendations": string[],
  "timeToBreachEstimate": string
}`,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            breachProbability: { type: "number" },
            riskLevel: { type: "string" },
            keyRiskFactors: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            timeToBreachEstimate: { type: "string" },
          },
        },
      },
      contents: `Facility Data:\n${JSON.stringify(facilityData, null, 2)}\n\nFinancial Metrics:\n${JSON.stringify(financialMetrics, null, 2)}`,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing covenant breach:", error);
    throw error;
  }
}

// Generate term sheet
export async function generateTermSheet(dealData: any): Promise<string> {
  try {
    const prompt = `Generate a professional NAV lending term sheet for:

Fund: ${dealData.fundName}
Loan Amount: $${dealData.loanAmount?.toLocaleString()}
Proposed LTV: ${dealData.ltv || '10'}%
Interest Rate: ${dealData.interestRate || '8.5'}%
Maturity: ${dealData.maturity || '3 years'}

Include standard NAV lending terms:
- Pricing structure
- Covenants (Debt/EBITDA, Interest Coverage)
- Reporting requirements
- Events of default
- Prepayment terms

Format as a professional term sheet document.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    return response.text || "Failed to generate term sheet";
  } catch (error) {
    console.error("Error generating term sheet:", error);
    throw error;
  }
}
