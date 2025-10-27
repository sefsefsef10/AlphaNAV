import { GoogleGenAI } from "@google/genai";
import { db } from "../db";
import {
  creditDocuments,
  legalClauseTemplates,
  clauseOccurrences,
  uploadedDocuments,
  type InsertCreditDocument,
  type InsertClauseOccurrence,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs/promises";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const CREDIT_PARSING_PROMPT = `You are an expert at parsing credit agreements and loan documents.

Extract the following key information:
- documentType: loan_agreement, term_sheet, credit_agreement, promissory_note, etc
- parties: Array of {name, role} where role is lender, borrower, guarantor, agent
- effectiveDate: YYYY-MM-DD
- maturityDate: YYYY-MM-DD
- principalAmount: number (in dollars)
- interestRate: number (as percentage, e.g., 5.75)
- covenants: Array of {clauseType, clauseName, description, severity, keyTerms}
- parsingConfidence: 0-100

Respond with valid JSON only. Example:
{
  "documentType": "credit_agreement",
  "parties": [
    {"name": "ABC Bank", "role": "lender"},
    {"name": "XYZ Fund LP", "role": "borrower"}
  ],
  "effectiveDate": "2024-01-15",
  "maturityDate": "2027-01-15",
  "principalAmount": 50000000,
  "interestRate": 6.5,
  "covenants": [
    {
      "clauseType": "financial_covenant",
      "clauseName": "Minimum NAV Coverage",
      "description": "Borrower must maintain NAV of at least 2.0x loan amount",
      "severity": "critical",
      "keyTerms": {"ratio": 2.0, "metric": "NAV"}
    }
  ],
  "parsingConfidence": 92
}`;

export async function parseCreditDocument(params: {
  documentId: string;
  facilityId?: string;
}): Promise<{
  creditDocumentId: string;
  covenantCount: number;
}> {
  const { documentId, facilityId } = params;

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

    // Call Gemini for parsing
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent([
      CREDIT_PARSING_PROMPT,
      `\n\nDocument content:\n${documentText.slice(0, 80000)}`, // Limit to ~80k chars
    ]);

    const responseText = result.response.text();
    
    // Parse JSON response
    let parsedData: any;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse credit document");
    }

    // Create credit document record
    const [creditDoc] = await db.insert(creditDocuments)
      .values({
        facilityId: facilityId || doc.facilityId || undefined,
        documentId,
        documentType: parsedData.documentType,
        parties: parsedData.parties,
        effectiveDate: parsedData.effectiveDate ? new Date(parsedData.effectiveDate) : undefined,
        maturityDate: parsedData.maturityDate ? new Date(parsedData.maturityDate) : undefined,
        principalAmount: parsedData.principalAmount,
        interestRate: parsedData.interestRate?.toString(),
        covenantCount: parsedData.covenants?.length || 0,
        parsedData,
        parsingConfidence: parsedData.parsingConfidence,
        parsedAt: new Date(),
      })
      .returning();

    // Save clause occurrences
    if (parsedData.covenants && Array.isArray(parsedData.covenants)) {
      for (const covenant of parsedData.covenants) {
        await db.insert(clauseOccurrences).values({
          creditDocumentId: creditDoc.id,
          clauseText: covenant.description || "",
          clauseType: covenant.clauseType,
          extractedTerms: covenant.keyTerms,
          confidence: parsedData.parsingConfidence,
        });
      }
    }

    return {
      creditDocumentId: creditDoc.id,
      covenantCount: parsedData.covenants?.length || 0,
    };
  } catch (error) {
    console.error("Credit parsing error:", error);
    throw error;
  }
}

// Get credit documents for a facility
export async function getCreditDocuments(facilityId: string) {
  return await db.select()
    .from(creditDocuments)
    .where(eq(creditDocuments.facilityId, facilityId));
}

// Get clauses for a credit document
export async function getClauseOccurrences(creditDocumentId: string) {
  return await db.select()
    .from(clauseOccurrences)
    .where(eq(clauseOccurrences.creditDocumentId, creditDocumentId));
}
