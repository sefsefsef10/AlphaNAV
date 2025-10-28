import { Router, type Request, type Response } from "express";
import { db } from "../db";
import { 
  underwritingSessions,
  extractionData,
  eligibilityScores,
  ltvCalculations,
  underwritingTermSheets,
  uploadedDocuments,
  type InsertUnderwritingSession,
  type InsertExtractionData,
  type InsertEligibilityScore,
  type InsertLtvCalculation,
  type InsertUnderwritingTermSheet,
} from "@shared/schema";
import { extractUnderwritingData, type UnderwritingExtractionResult } from "../services/aiExtraction";
import { calculateUnderwritingScore } from "../services/eligibilityScoring";
import { calculateLTV } from "../services/ltvCalculator";
import { storeFile } from "../services/fileStorage";
import multer from "multer";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 10, // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

// ========================================
// Underwriting Session Management
// ========================================

// Create new underwriting session
router.post("/sessions", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionSchema = z.object({
      fundName: z.string().min(1),
      prospectId: z.string().optional(),
      dealId: z.string().optional(),
    });

    const body = sessionSchema.parse(req.body);

    const [session] = await db.insert(underwritingSessions).values({
      userId: req.user.id,
      fundName: body.fundName,
      prospectId: body.prospectId || null,
      dealId: body.dealId || null,
      status: "uploading",
      currentStep: 1,
    }).returning();

    return res.status(201).json(session);
  } catch (error: any) {
    console.error("Error creating underwriting session:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    return res.status(500).json({ error: error.message });
  }
});

// Get all underwriting sessions for user
router.get("/sessions", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessions = await db
      .select()
      .from(underwritingSessions)
      .where(eq(underwritingSessions.userId, req.user.id))
      .orderBy(desc(underwritingSessions.createdAt));

    return res.json(sessions);
  } catch (error: any) {
    console.error("Error fetching underwriting sessions:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Get specific underwriting session by ID
router.get("/sessions/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [session] = await db
      .select()
      .from(underwritingSessions)
      .where(
        and(
          eq(underwritingSessions.id, req.params.id),
          eq(underwritingSessions.userId, req.user.id)
        )
      );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.json(session);
  } catch (error: any) {
    console.error("Error fetching underwriting session:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Update underwriting session status/step
router.patch("/sessions/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updateSchema = z.object({
      status: z.enum(["uploading", "extracting", "reviewing", "scoring", "calculating", "generating", "completed", "failed"]).optional(),
      currentStep: z.number().min(1).max(5).optional(),
    });

    const body = updateSchema.parse(req.body);

    const [updated] = await db
      .update(underwritingSessions)
      .set({
        ...body,
        updatedAt: new Date(),
        ...(body.status === "completed" ? { completedAt: new Date() } : {}),
      })
      .where(
        and(
          eq(underwritingSessions.id, req.params.id),
          eq(underwritingSessions.userId, req.user.id)
        )
      )
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.json(updated);
  } catch (error: any) {
    console.error("Error updating underwriting session:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    return res.status(500).json({ error: error.message });
  }
});

// ========================================
// Document Upload & AI Extraction
// ========================================

// Upload documents and trigger AI extraction
router.post("/sessions/:id/documents", upload.array("documents", 10), async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = req.params.id;

    // Verify session ownership
    const [session] = await db
      .select()
      .from(underwritingSessions)
      .where(
        and(
          eq(underwritingSessions.id, sessionId),
          eq(underwritingSessions.userId, req.user.id)
        )
      );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Update session status to extracting
    await db
      .update(underwritingSessions)
      .set({ status: "extracting", currentStep: 2 })
      .where(eq(underwritingSessions.id, sessionId));

    // Store uploaded documents securely with validation
    const uploadedDocs = [];
    for (const file of files) {
      // Store file with security validation (magic bytes, sanitization)
      const secureFile = await storeFile(file.buffer, file.originalname, file.mimetype, sessionId);
      
      const [doc] = await db.insert(uploadedDocuments).values({
        sessionId,
        uploadedBy: req.user.id,
        fileName: secureFile.filename,
        fileType: secureFile.mimeType,
        fileSize: secureFile.size,
        storageUrl: secureFile.storageUrl,
        storageProvider: "local",
        checksum: secureFile.checksum,
        processingStatus: "pending",
      }).returning();
      
      uploadedDocs.push({
        ...doc,
        buffer: file.buffer,
      });
    }

    // Parse document text from all uploaded files
    const documentTexts: string[] = [];
    for (const doc of uploadedDocs) {
      try {
        const buffer = doc.buffer;
        const text = await parseDocumentText(buffer, doc.fileType);
        documentTexts.push(text);
      } catch (parseError) {
        console.error(`Error parsing ${doc.fileName}:`, parseError);
      }
    }

    // Combine all text and trigger AI extraction
    const combinedText = documentTexts.join("\n\n--- NEXT DOCUMENT ---\n\n");
    const extractionResult = await extractUnderwritingData(combinedText);

    // Map extraction result to database schema
    const extractionDataPayload = mapExtractionToSchema(extractionResult);

    // Store extraction data in database
    const [extraction] = await db.insert(extractionData).values({
      sessionId,
      ...extractionDataPayload,
      extractedAt: new Date(),
      extractedBy: "gemini-2.0-flash",
    }).returning();

    // Update session to reviewing status
    await db
      .update(underwritingSessions)
      .set({ status: "reviewing", currentStep: 2 })
      .where(eq(underwritingSessions.id, sessionId));

    return res.status(201).json({
      session,
      extraction,
      uploadedDocuments: uploadedDocs.length,
      extractionConfidence: extraction.extractionConfidence,
      lowConfidenceFields: extraction.lowConfidenceFields,
    });
  } catch (error: any) {
    console.error("Error uploading documents:", error);
    
    // Update session to failed status
    try {
      await db
        .update(underwritingSessions)
        .set({ status: "failed" })
        .where(eq(underwritingSessions.id, req.params.id));
    } catch (updateError) {
      console.error("Error updating session to failed:", updateError);
    }
    
    return res.status(500).json({ error: error.message });
  }
});

// Helper function to parse document text from buffer
async function parseDocumentText(buffer: Buffer, fileType: string): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const mammoth = (await import("mammoth")).default;

  let documentText = "";

  if (fileType === "application/pdf") {
    console.log("Parsing PDF document...");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      documentText = result.text;
      console.log(`PDF parsed: ${documentText.length} characters`);
    } finally {
      await parser.destroy();
    }
  } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    console.log("Parsing DOCX document...");
    const result = await mammoth.extractRawText({ buffer });
    documentText = result.value;
    console.log(`DOCX parsed: ${documentText.length} characters`);
  } else if (fileType === "application/msword") {
    console.warn("Legacy .doc format detected, attempting basic text extraction");
    documentText = buffer.toString("utf-8");
  } else if (fileType === "text/plain") {
    documentText = buffer.toString("utf-8");
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel"
  ) {
    console.warn("Excel file detected, using basic text extraction");
    documentText = buffer.toString("utf-8");
  }

  if (documentText.length > 50000) {
    documentText = documentText.substring(0, 50000);
    console.warn("Document text truncated to 50,000 characters");
  }

  return documentText;
}

// Helper function to map AI extraction result to database schema
function mapExtractionToSchema(result: UnderwritingExtractionResult): Partial<InsertExtractionData> {
  return {
    fundName: result.fundName,
    fundAum: result.fundAUM,
    vintage: result.vintage,
    gpEntity: result.gpEntity,
    gpFirmName: result.gpFirmName,
    fundStructure: result.fundStructure,
    strategy: result.strategy,
    geography: result.geography,
    fundType: result.fundType,
    fundStatus: result.fundStatus,
    portfolioCompanyCount: result.portfolioCompanyCount,
    portfolioCompanies: result.portfolioCompanies,
    sectorDistribution: result.sectorDistribution,
    largestHoldingPercent: result.largestHoldingPercent !== null ? String(result.largestHoldingPercent) : null,
    topThreeConcentration: result.topThreeConcentration !== null ? String(result.topThreeConcentration) : null,
    currentNav: result.currentNAV,
    unrealizedValue: result.unrealizedValue,
    realizedValue: result.realizedValue,
    grossIrr: result.grossIRR !== null ? String(result.grossIRR) : null,
    netIrr: result.netIRR !== null ? String(result.netIRR) : null,
    moic: result.moic !== null ? String(result.moic) : null,
    dpi: result.dpi !== null ? String(result.dpi) : null,
    rvpi: result.rvpi !== null ? String(result.rvpi) : null,
    cashReserves: result.cashReserves,
    totalDebt: result.totalDebt,
    capitalCommitted: result.capitalCommitted,
    capitalCalled: result.capitalCalled,
    priorFundCount: result.priorFundCount,
    priorFundAum: result.priorFundAUM,
    priorFundAvgIrr: result.priorFundAvgIRR !== null ? String(result.priorFundAvgIRR) : null,
    priorFundAvgMoic: result.priorFundAvgMOIC !== null ? String(result.priorFundAvgMOIC) : null,
    yearsOfExperience: result.yearsOfExperience,
    teamSize: result.teamSize,
    extractionConfidence: result.extractionConfidence,
    lowConfidenceFields: result.lowConfidenceFields,
  };
}

// Get extraction data for a session
router.get("/sessions/:id/extraction", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = req.params.id;

    // Verify session ownership
    const [session] = await db
      .select()
      .from(underwritingSessions)
      .where(
        and(
          eq(underwritingSessions.id, sessionId),
          eq(underwritingSessions.userId, req.user.id)
        )
      );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const [extraction] = await db
      .select()
      .from(extractionData)
      .where(eq(extractionData.sessionId, sessionId));

    if (!extraction) {
      return res.status(404).json({ error: "Extraction data not found" });
    }

    return res.json(extraction);
  } catch (error: any) {
    console.error("Error fetching extraction data:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Update extraction data (manual corrections)
router.patch("/sessions/:id/extraction", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = req.params.id;

    // Verify session ownership
    const [session] = await db
      .select()
      .from(underwritingSessions)
      .where(
        and(
          eq(underwritingSessions.id, sessionId),
          eq(underwritingSessions.userId, req.user.id)
        )
      );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Update extraction data with manual corrections
    const [updated] = await db
      .update(extractionData)
      .set({
        ...req.body,
        extractedAt: new Date(), // Update timestamp on manual edit
      })
      .where(eq(extractionData.sessionId, sessionId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Extraction data not found" });
    }

    return res.json(updated);
  } catch (error: any) {
    console.error("Error updating extraction data:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ========================================
// Eligibility Scoring
// ========================================

// Calculate and store eligibility score
router.post("/sessions/:id/score", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = req.params.id;

    // Verify session ownership
    const [session] = await db
      .select()
      .from(underwritingSessions)
      .where(
        and(
          eq(underwritingSessions.id, sessionId),
          eq(underwritingSessions.userId, req.user.id)
        )
      );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Get extraction data
    const [extraction] = await db
      .select()
      .from(extractionData)
      .where(eq(extractionData.sessionId, sessionId));

    if (!extraction) {
      return res.status(400).json({ error: "No extraction data found. Upload documents first." });
    }

    // Update session status
    await db
      .update(underwritingSessions)
      .set({ status: "scoring", currentStep: 3 })
      .where(eq(underwritingSessions.id, sessionId));

    // Calculate 10-point eligibility score using service
    const score = calculateUnderwritingScore(extraction);

    // Store eligibility score
    const [eligibilityScore] = await db.insert(eligibilityScores).values({
      sessionId,
      trackRecordScore: score.trackRecordScore,
      diversificationScore: score.diversificationScore,
      liquidityScore: score.liquidityScore,
      portfolioQualityScore: score.portfolioQualityScore,
      vintageScore: score.vintageScore,
      fundSizeScore: score.fundSizeScore,
      sectorRiskScore: score.sectorRiskScore,
      geographicRiskScore: score.geographicRiskScore,
      gpExperienceScore: score.gpExperienceScore,
      structureRiskScore: score.structureRiskScore,
      totalScore: score.totalScore,
      recommendation: score.recommendation,
      riskFlags: score.riskFlags,
      scoredBy: req.user.id,
      scoredAt: new Date(),
    }).returning();

    // Update session status
    await db
      .update(underwritingSessions)
      .set({ status: "reviewing", currentStep: 3 })
      .where(eq(underwritingSessions.id, sessionId));

    return res.status(201).json(eligibilityScore);
  } catch (error: any) {
    console.error("Error calculating eligibility score:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Get eligibility score for a session
router.get("/sessions/:id/score", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = req.params.id;

    // Verify session ownership
    const [session] = await db
      .select()
      .from(underwritingSessions)
      .where(
        and(
          eq(underwritingSessions.id, sessionId),
          eq(underwritingSessions.userId, req.user.id)
        )
      );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const [score] = await db
      .select()
      .from(eligibilityScores)
      .where(eq(eligibilityScores.sessionId, sessionId));

    if (!score) {
      return res.status(404).json({ error: "Eligibility score not found" });
    }

    return res.json(score);
  } catch (error: any) {
    console.error("Error fetching eligibility score:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ========================================
// LTV Calculator with Stress Testing
// ========================================

// Calculate and store LTV with stress testing
router.post("/sessions/:id/ltv", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = req.params.id;

    // Verify session ownership
    const [session] = await db
      .select()
      .from(underwritingSessions)
      .where(
        and(
          eq(underwritingSessions.id, sessionId),
          eq(underwritingSessions.userId, req.user.id)
        )
      );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Get extraction data
    const [extraction] = await db
      .select()
      .from(extractionData)
      .where(eq(extractionData.sessionId, sessionId));

    if (!extraction) {
      return res.status(400).json({ error: "No extraction data found. Upload documents first." });
    }

    // Parse request parameters
    const requestSchema = z.object({
      requestedFacilitySize: z.number().optional(),
      targetLtv: z.number().min(0).max(100).default(15),
      maxLtv: z.number().min(0).max(100).default(18),
    });

    const params = requestSchema.parse(req.body);

    // Update session status
    await db
      .update(underwritingSessions)
      .set({ status: "calculating", currentStep: 4 })
      .where(eq(underwritingSessions.id, sessionId));

    // Calculate LTV with stress testing using service
    const ltvResult = calculateLTV({
      fundNAV: extraction.currentNav || 0,
      requestedFacilitySize: params.requestedFacilitySize,
      targetLtv: params.targetLtv,
      maxLtv: params.maxLtv,
    }, {
      netIRR: extraction.netIrr,
      moic: extraction.moic,
      portfolioCompanyCount: extraction.portfolioCompanyCount,
    });

    // Store LTV calculation
    const [ltvCalculation] = await db.insert(ltvCalculations).values({
      sessionId: sessionId,
      fundNav: ltvResult.fundNav,
      targetLtv: String(ltvResult.targetLtv),
      maxLtv: String(ltvResult.maxLtv),
      requestedFacilitySize: ltvResult.requestedFacilitySize,
      maxFacilitySize: ltvResult.maxFacilitySize,
      recommendedFacilitySize: ltvResult.recommendedFacilitySize,
      baselineLtv: String(ltvResult.baselineLtv),
      scenarios: ltvResult.scenarios as any,
      breachProbability: String(ltvResult.breachProbability),
      recommendedSofr: ltvResult.recommendedSofr,
      marketMedianPricing: ltvResult.marketMedianPricing,
      pricingRationale: ltvResult.pricingRationale,
    }).returning();

    // Update session status
    await db
      .update(underwritingSessions)
      .set({ status: "reviewing", currentStep: 4 })
      .where(eq(underwritingSessions.id, sessionId));

    return res.status(201).json(ltvCalculation);
  } catch (error: any) {
    console.error("Error calculating LTV:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    return res.status(500).json({ error: error.message });
  }
});

// Get LTV calculation for a session
router.get("/sessions/:id/ltv", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = req.params.id;

    // Verify session ownership
    const [session] = await db
      .select()
      .from(underwritingSessions)
      .where(
        and(
          eq(underwritingSessions.id, sessionId),
          eq(underwritingSessions.userId, req.user.id)
        )
      );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const [ltv] = await db
      .select()
      .from(ltvCalculations)
      .where(eq(ltvCalculations.sessionId, sessionId));

    if (!ltv) {
      return res.status(404).json({ error: "LTV calculation not found" });
    }

    return res.json(ltv);
  } catch (error: any) {
    console.error("Error fetching LTV calculation:", error);
    return res.status(500).json({ error: error.message });
  }
});


export default router;
