import { GoogleGenAI } from "@google/genai";
import { db } from "../db";
import {
  portfolioCompanies,
  portfolioHoldings,
  extractionRuns,
  uploadedDocuments,
  type InsertPortfolioCompany,
  type InsertPortfolioHolding,
  type InsertExtractionRun,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs/promises";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface ExtractedCompany {
  companyName: string;
  industry?: string;
  sector?: string;
  geography?: string;
  investmentDate?: string;
  investmentAmount?: number;
  ownershipPercentage?: number;
  currentValue?: number;
  valuationDate?: string;
  status?: "active" | "exited" | "written-off";
  exitDate?: string;
  exitValue?: number;
  confidence: number;
}

const EXTRACTION_PROMPT = `You are an expert at extracting portfolio company information from private equity fund documents.

Extract ALL portfolio companies mentioned in the document with the following fields:
- companyName (required)
- industry
- sector
- geography
- investmentDate (ISO format YYYY-MM-DD if possible)
- investmentAmount (in dollars, no commas)
- ownershipPercentage (as decimal, e.g., 0.25 for 25%)
- currentValue (in dollars)
- valuationDate (ISO format)
- status (active, exited, or written-off)
- exitDate (ISO format if exited)
- exitValue (in dollars if exited)
- confidence (0-100, your confidence in this extraction)

Respond ONLY with a valid JSON array of company objects. Example:
[
  {
    "companyName": "TechCo Inc",
    "industry": "Software",
    "sector": "B2B SaaS",
    "geography": "United States",
    "investmentDate": "2020-03-15",
    "investmentAmount": 5000000,
    "ownershipPercentage": 0.35,
    "currentValue": 7500000,
    "valuationDate": "2024-12-31",
    "status": "active",
    "confidence": 95
  }
]

If no portfolio companies found, return empty array: []`;

export async function extractPortfolioCompanies(params: {
  documentId: string;
  batchId?: string;
  prospectId?: string;
  facilityId?: string;
}): Promise<{
  runId: string;
  companiesExtracted: number;
  companies: ExtractedCompany[];
}> {
  const { documentId, batchId, prospectId, facilityId } = params;

  // Create extraction run
  const [run] = await db.insert(extractionRuns)
    .values({
      documentId,
      batchId,
      extractionType: "portfolio_companies",
      model: "gemini-2.0-flash-exp",
      status: "running",
    })
    .returning();

  try {
    // Get document
    const [doc] = await db.select()
      .from(uploadedDocuments)
      .where(eq(uploadedDocuments.id, documentId));

    if (!doc) {
      throw new Error("Document not found");
    }

    // Extract text from document
    let documentText: string;
    
    if (doc.fileType === "application/pdf") {
      const buffer = await fs.readFile(doc.storageUrl);
      const pdfData = await pdf(buffer);
      documentText = pdfData.text;
    } else if (doc.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const buffer = await fs.readFile(doc.storageUrl);
      const result = await mammoth.extractRawText({ buffer });
      documentText = result.value;
    } else {
      throw new Error(`Unsupported file type: ${doc.fileType}`);
    }

    // Call Gemini for extraction
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      `\n\nDocument content:\n${documentText.slice(0, 50000)}`, // Limit to ~50k chars
    ]);

    const responseText = result.response.text();
    
    // Parse JSON response
    let companies: ExtractedCompany[] = [];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        companies = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      companies = [];
    }

    // Calculate average confidence
    const avgConfidence = companies.length > 0
      ? companies.reduce((sum, c) => sum + c.confidence, 0) / companies.length
      : 0;

    // Save extracted companies
    for (const company of companies) {
      await db.insert(portfolioCompanies).values({
        prospectId: prospectId || doc.prospectId || undefined,
        facilityId: facilityId || doc.facilityId || undefined,
        companyName: company.companyName,
        industry: company.industry,
        sector: company.sector,
        geography: company.geography,
        investmentDate: company.investmentDate ? new Date(company.investmentDate) : undefined,
        investmentAmount: company.investmentAmount,
        ownershipPercentage: company.ownershipPercentage?.toString(),
        currentValue: company.currentValue,
        valuationDate: company.valuationDate ? new Date(company.valuationDate) : undefined,
        status: company.status || "active",
        exitDate: company.exitDate ? new Date(company.exitDate) : undefined,
        exitValue: company.exitValue,
        extractedFrom: documentId,
        extractionConfidence: company.confidence,
      });
    }

    // Update extraction run
    await db.update(extractionRuns)
      .set({
        status: "completed",
        companiesExtracted: companies.length,
        averageConfidence: avgConfidence.toString(),
        completedAt: new Date(),
      })
      .where(eq(extractionRuns.id, run.id));

    return {
      runId: run.id,
      companiesExtracted: companies.length,
      companies,
    };
  } catch (error) {
    // Mark run as failed
    await db.update(extractionRuns)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      })
      .where(eq(extractionRuns.id, run.id));

    throw error;
  }
}

// Get portfolio companies for a prospect or facility
export async function getPortfolioCompanies(params: {
  prospectId?: string;
  facilityId?: string;
}) {
  const { prospectId, facilityId } = params;

  if (!prospectId && !facilityId) {
    throw new Error("Either prospectId or facilityId required");
  }

  const conditions = [];
  if (prospectId) conditions.push(eq(portfolioCompanies.prospectId, prospectId));
  if (facilityId) conditions.push(eq(portfolioCompanies.facilityId, facilityId));

  return await db.select()
    .from(portfolioCompanies)
    .where(conditions.length === 1 ? conditions[0] : undefined);
}
