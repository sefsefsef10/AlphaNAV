import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { 
  prospects, 
  uploadedDocuments,
  facilities,
  covenants,
  advisorDeals,
  lenderInvitations,
  termSheets,
  drawRequests,
  cashFlows,
  users,
  notifications,
  leads,
  subscriptions,
  invoices,
  validationRuns,
  type InsertProspect,
  type InsertUploadedDocument,
  type InsertFacility,
  type Facility,
  type InsertCovenant,
  type InsertAdvisorDeal,
  type InsertLenderInvitation,
  type InsertDrawRequest,
  type InsertCashFlow,
  insertProspectSchema,
  insertFacilitySchema,
  insertCovenantSchema,
  insertAdvisorDealSchema,
  insertLenderInvitationSchema,
  insertDrawRequestSchema,
  insertCashFlowSchema,
  insertLeadSchema,
} from "@shared/schema";
import { extractFromFile, type ExtractionResult } from "./services/aiExtraction";
import multer from "multer";
import { eq, or, and, sql } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

const router = Router();

// Allowed file types for document uploads
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
  'text/csv',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'];

// Magic bytes (file signatures) for validating actual file content
const FILE_SIGNATURES: Record<string, Buffer[]> = {
  '.pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
  '.doc': [Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])], // DOC (OLE2)
  '.docx': [Buffer.from([0x50, 0x4B, 0x03, 0x04])], // ZIP archive (DOCX is ZIP)
  '.xls': [Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])], // XLS (OLE2)
  '.xlsx': [Buffer.from([0x50, 0x4B, 0x03, 0x04])], // ZIP archive (XLSX is ZIP)
  // Note: TXT and CSV have no magic bytes (plain text), validated separately
};

function validateFileSignature(buffer: Buffer, extension: string): boolean {
  // Plain text files (TXT, CSV) don't have magic bytes
  if (extension === '.txt' || extension === '.csv') {
    // Basic check: ensure it's valid UTF-8 or ASCII
    try {
      const content = buffer.toString('utf-8');
      // Check for null bytes (binary content masquerading as text)
      return !content.includes('\0');
    } catch {
      return false;
    }
  }
  
  const signatures = FILE_SIGNATURES[extension];
  if (!signatures || signatures.length === 0) {
    return false;
  }
  
  // Check if file starts with any of the valid signatures
  return signatures.some(sig => buffer.slice(0, sig.length).equals(sig));
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit (reduced from 50MB for security)
    files: 1 // Only allow single file uploads
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
    
    // Validate file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
    
    cb(null, true);
  }
});

// Validation helper function
function validateBody<T>(schema: z.ZodSchema<T>, body: any): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

// Facility ownership validation helper
// Validates that a GP user owns the facility they're trying to access
// Operations and admin roles bypass this check
async function validateFacilityOwnership(
  facilityId: string,
  user: Express.User,
  action: string = "access"
): Promise<{ success: true; facility: Facility } | { success: false; status: number; error: string; message?: string }> {
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
  if (user.role === "operations" || user.role === "admin") {
    return { success: true, facility };
  }

  // For GP users, validate ownership
  if (user.role === "gp") {
    if (!facility.gpUserId) {
      return {
        success: false,
        status: 403,
        error: "Forbidden: Facility ownership not assigned",
        message: `This facility must be assigned to a GP user before you can ${action}. Please contact operations.`
      };
    }

    if (facility.gpUserId !== user.id) {
      return {
        success: false,
        status: 403,
        error: "Forbidden: You do not have access to this facility",
        message: `You can only ${action} your own facilities`
      };
    }
  }

  return { success: true, facility };
}

// Update schemas for PATCH endpoints (omit foreign keys and one-time-set fields)
// Note: insert schemas already omit id, createdAt, updatedAt
const updateProspectSchema = insertProspectSchema.omit({ 
  extractedAt: true, // Set once during extraction
  extractedBy: true, // Set once during extraction
  extractedData: true, // Set once during extraction
  stage: true // Stage changes require business logic validation
}).partial().strict(); // Reject unknown fields to prevent mass assignment

const updateFacilitySchema = insertFacilitySchema.omit({
  prospectId: true, // Foreign key should not be changed
  advisorDealId: true, // Foreign key should not be changed
  status: true // Status changes require business logic validation
}).partial().strict(); // Reject unknown fields to prevent mass assignment

const updateCovenantSchema = insertCovenantSchema.omit({
  facilityId: true, // Foreign key should not be changed
  status: true // Status changes require business logic validation
}).partial().strict(); // Reject unknown fields to prevent mass assignment

const updateDrawRequestSchema = insertDrawRequestSchema.omit({
  facilityId: true, // Foreign key should not be changed
  requestedBy: true, // Set once during creation
  requestDate: true, // Set once during creation
}).partial().strict(); // Reject unknown fields to prevent mass assignment

const updateCashFlowSchema = insertCashFlowSchema.omit({
  facilityId: true, // Foreign key should not be changed
  dueDate: true, // Set once during creation
  principal: true, // Set once during creation
  interest: true, // Set once during creation
  totalDue: true, // Set once during creation
}).partial().strict(); // Reject unknown fields to prevent mass assignment

// POST /api/prospects/upload-and-extract
// Upload a document and extract fund data using AI
router.post("/prospects/upload-and-extract", upload.single("document"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = (req.user as any).claims?.sub;
    const file = req.file;
    
    // Validate file content using magic bytes (prevents polyglot/malicious uploads)
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!validateFileSignature(file.buffer, fileExtension)) {
      return res.status(400).json({ 
        error: "Invalid file content",
        details: "File content does not match the declared file type. This may indicate a corrupted or malicious file."
      });
    }

    // Validate object storage configuration with intelligent fallback
    let storageRoot = process.env.PRIVATE_OBJECT_DIR;
    let usingFallback = false;
    
    if (!storageRoot) {
      console.warn("PRIVATE_OBJECT_DIR not configured, using fallback directory");
      storageRoot = path.join(process.cwd(), ".uploads");
      usingFallback = true;
    }
    
    // Test if storage root is accessible (create if needed)
    try {
      await fs.mkdir(storageRoot, { recursive: true });
      // Test write permissions
      const testFile = path.join(storageRoot, '.test-write');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
    } catch (error) {
      console.error(`Storage root ${storageRoot} not accessible:`, error);
      
      // If configured storage failed, try fallback
      if (!usingFallback) {
        console.warn("Configured storage failed, falling back to local directory");
        storageRoot = path.join(process.cwd(), ".uploads");
        usingFallback = true;
        
        try {
          await fs.mkdir(storageRoot, { recursive: true });
        } catch (fallbackError) {
          console.error("Fallback storage also failed:", fallbackError);
          return res.status(500).json({ 
            error: "Server configuration error",
            details: "Could not initialize file storage"
          });
        }
      } else {
        return res.status(500).json({ 
          error: "Server configuration error",
          details: "Could not initialize file storage"
        });
      }
    }

    // Store file in object storage (.private directory or fallback)
    const fileName = `${Date.now()}-${file.originalname}`;
    const storagePath = path.join(storageRoot, "documents", fileName);
    
    // Ensure documents directory exists
    const dir = path.dirname(storagePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file to storage
    await fs.writeFile(storagePath, file.buffer);

    // Create uploaded document record
    const [uploadedDoc] = await db.insert(uploadedDocuments).values({
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      storageUrl: storagePath,
      uploadedBy: userId,
      processingStatus: "processing",
    }).returning();

    // Extract data using AI in background (for now, synchronous)
    let extractionResult: ExtractionResult;
    try {
      extractionResult = await extractFromFile(file.buffer, file.mimetype);

      // Update document with extraction results
      await db.update(uploadedDocuments)
        .set({
          extractedData: extractionResult as any,
          extractionConfidence: extractionResult.confidence.overall,
          processingStatus: "completed",
        })
        .where(eq(uploadedDocuments.id, uploadedDoc.id));

    } catch (extractionError) {
      // Update document with error
      await db.update(uploadedDocuments)
        .set({
          processingStatus: "failed",
          processingError: extractionError instanceof Error ? extractionError.message : "Unknown error",
        })
        .where(eq(uploadedDocuments.id, uploadedDoc.id));

      throw extractionError;
    }

    res.json({
      documentId: uploadedDoc.id,
      extraction: extractionResult,
      message: "Document uploaded and processed successfully",
    });

  } catch (error) {
    console.error("Upload and extract error:", error);
    res.status(500).json({ 
      error: "Failed to process document",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/prospects/from-extraction
// Create a prospect from extraction results
router.post("/prospects/from-extraction", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { documentId, overrides } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: "Document ID required" });
    }

    // Get the document
    const [document] = await db.select()
      .from(uploadedDocuments)
      .where(eq(uploadedDocuments.id, documentId))
      .limit(1);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!document.extractedData) {
      return res.status(400).json({ error: "No extraction data available" });
    }

    const extraction = document.extractedData as ExtractionResult;

    // AUTOMATION: Enforce confidence threshold (configurable via AI_CONFIDENCE_THRESHOLD env var)
    const confidenceThreshold = parseInt(process.env.AI_CONFIDENCE_THRESHOLD || '95', 10);
    if (extraction.confidence.overall < confidenceThreshold) {
      return res.status(400).json({
        error: "Extraction confidence too low",
        details: `AI extraction confidence (${extraction.confidence.overall}%) below ${confidenceThreshold}% threshold. Manual review required.`,
        confidence: extraction.confidence,
        extraction: extraction,
        threshold: confidenceThreshold,
      });
    }

    // Create prospect from extraction data (with user overrides)
    const prospectData: InsertProspect = {
      fundName: overrides?.fundName || extraction.fundName || "Unknown Fund",
      fundSize: overrides?.fundSize || extraction.fundSize,
      vintage: overrides?.vintage || extraction.vintage,
      portfolioCount: overrides?.portfolioCount || extraction.portfolioCount,
      sectors: overrides?.sectors || extraction.sectors,
      gpName: overrides?.gpName || extraction.gpName,
      gpFirmName: overrides?.gpFirmName || extraction.gpFirmName,
      gpTrackRecord: overrides?.gpTrackRecord || extraction.gpTrackRecord,
      fundStructure: overrides?.fundStructure || extraction.fundStructure,
      strategy: overrides?.strategy || extraction.strategy,
      geography: overrides?.geography || extraction.geography,
      contactName: overrides?.contactName || extraction.contactName,
      contactEmail: overrides?.contactEmail || extraction.contactEmail,
      contactPhone: overrides?.contactPhone || extraction.contactPhone,
      extractionConfidence: extraction.confidence.overall,
      extractedData: extraction as any,
      extractedAt: new Date(),
      extractedBy: "gemini-2.0-flash-exp",
      source: "ai_extraction",
      stage: "prospect",
    };

    const [prospect] = await db.insert(prospects).values(prospectData).returning();

    // Link document to prospect
    await db.update(uploadedDocuments)
      .set({ prospectId: prospect.id })
      .where(eq(uploadedDocuments.id, documentId));

    // AUTOMATION: Calculate eligibility score
    const { calculateEligibilityScore } = await import("./services/eligibilityScoring");
    const eligibilityScore = calculateEligibilityScore({
      fundSize: prospect.fundSize,
      vintage: prospect.vintage,
      gpTrackRecord: prospect.gpTrackRecord,
      portfolioCount: prospect.portfolioCount,
      sectors: prospect.sectors as string[] | null,
    });

    // AUTOMATION: Detect risk flags
    const { assessAllRisks } = await import("./services/riskFlags");
    const riskAssessment = assessAllRisks({
      portfolioCount: prospect.portfolioCount,
      sectors: prospect.sectors as string[] | null,
      fundSize: prospect.fundSize || 0,
      vintage: prospect.vintage,
    });

    // Update prospect with automated assessments
    const [updatedProspect] = await db.update(prospects)
      .set({
        eligibilityStatus: eligibilityScore.recommendation,
        eligibilityNotes: `Eligibility Score: ${eligibilityScore.overall}/10\n\n${eligibilityScore.reasoning.join('\n')}\n\nRisk Assessment: ${riskAssessment.overall.toUpperCase()} (${riskAssessment.score}/100)\n${riskAssessment.summary}\n\nRisk Flags:\n${riskAssessment.flags.map(f => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`).join('\n') || 'None'}`,
        overallScore: Math.round(eligibilityScore.overall * 10), // Convert 0-10 to 0-100
        updatedAt: new Date(),
      })
      .where(eq(prospects.id, prospect.id))
      .returning();

    res.json({
      prospect: updatedProspect,
      automation: {
        eligibilityScore,
        riskAssessment,
      },
      message: "Prospect created successfully from extraction with automated scoring",
    });

  } catch (error) {
    console.error("Create prospect error:", error);
    res.status(500).json({ 
      error: "Failed to create prospect",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/prospects
// List all prospects
router.get("/prospects", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allProspects = await db.select()
      .from(prospects)
      .orderBy(prospects.createdAt);

    res.json(allProspects);

  } catch (error) {
    console.error("Get prospects error:", error);
    res.status(500).json({ 
      error: "Failed to fetch prospects",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/prospects/:id
// Get a single prospect
router.get("/prospects/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const [prospect] = await db.select()
      .from(prospects)
      .where(eq(prospects.id, id))
      .limit(1);

    if (!prospect) {
      return res.status(404).json({ error: "Prospect not found" });
    }

    // Get related documents
    const documents = await db.select()
      .from(uploadedDocuments)
      .where(eq(uploadedDocuments.prospectId, id));

    res.json({
      ...prospect,
      documents,
    });

  } catch (error) {
    console.error("Get prospect error:", error);
    res.status(500).json({ 
      error: "Failed to fetch prospect",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PATCH /api/prospects/:id
// Update a prospect
router.patch("/prospects/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    
    // Validate request body
    const validation = validateBody(updateProspectSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid update data",
        details: validation.error.errors 
      });
    }

    const updates = validation.data;

    const [updatedProspect] = await db.update(prospects)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(prospects.id, id))
      .returning();

    if (!updatedProspect) {
      return res.status(404).json({ error: "Prospect not found" });
    }

    res.json(updatedProspect);

  } catch (error) {
    console.error("Update prospect error:", error);
    res.status(500).json({ 
      error: "Failed to update prospect",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// DELETE /api/prospects/:id
// Delete a prospect
router.delete("/prospects/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    await db.delete(prospects)
      .where(eq(prospects.id, id));

    res.json({ message: "Prospect deleted successfully" });

  } catch (error) {
    console.error("Delete prospect error:", error);
    res.status(500).json({ 
      error: "Failed to delete prospect",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ===== AUTOMATION API ENDPOINTS =====

// POST /api/automation/ltv-calculator
// Calculate LTV with stress testing
router.post("/automation/ltv-calculator", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { requestedLoan, currentNav, maxLtvThreshold, stressTestThreshold } = req.body;

    if (!requestedLoan || !currentNav) {
      return res.status(400).json({ 
        error: "Missing required parameters: requestedLoan, currentNav" 
      });
    }

    const { calculateLTV } = await import("./services/ltvCalculator");
    const ltvCalculation = calculateLTV({
      requestedLoan,
      currentNav,
      maxLtvThreshold,
      stressTestThreshold,
    });

    res.json(ltvCalculation);
  } catch (error) {
    console.error("LTV calculation error:", error);
    res.status(500).json({
      error: "Failed to calculate LTV",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/automation/risk-assessment
// Assess portfolio risks with automated flag detection
router.post("/automation/risk-assessment", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const params = req.body;

    const { assessAllRisks } = await import("./services/riskFlags");
    const riskAssessment = assessAllRisks(params);

    res.json(riskAssessment);
  } catch (error) {
    console.error("Risk assessment error:", error);
    res.status(500).json({
      error: "Failed to assess risks",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/automation/eligibility-score
// Calculate eligibility score for a prospect
router.post("/automation/eligibility-score", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fundSize, vintage, gpTrackRecord, portfolioCount, sectors } = req.body;

    const { calculateEligibilityScore } = await import("./services/eligibilityScoring");
    const eligibilityScore = calculateEligibilityScore({
      fundSize,
      vintage,
      gpTrackRecord,
      portfolioCount,
      sectors,
    });

    res.json(eligibilityScore);
  } catch (error) {
    console.error("Eligibility score error:", error);
    res.status(500).json({
      error: "Failed to calculate eligibility score",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/automation/validate-extraction
// Run accuracy validation against ground truth dataset
router.post("/automation/validate-extraction", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Require operations or admin role for validation
    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Only operations/admin can run validation tests" 
      });
    }

    const { datasetId } = req.body;

    if (!datasetId) {
      return res.status(400).json({ error: "Missing required parameter: datasetId" });
    }

    const { runValidation } = await import("./services/aiValidation");
    const validationResult = await runValidation(datasetId);

    res.json(validationResult);
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({
      error: "Failed to run validation",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/automation/validate-all
// Run validation on all active ground truth datasets
router.post("/automation/validate-all", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Require operations or admin role for validation
    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Only operations/admin can run validation tests" 
      });
    }

    const { runAllValidations } = await import("./services/aiValidation");
    const validationResults = await runAllValidations();

    res.json({
      totalTests: validationResults.length,
      passed: validationResults.filter(r => r.passed).length,
      failed: validationResults.filter(r => !r.passed).length,
      averageAccuracy: validationResults.reduce((sum, r) => sum + r.accuracyOverall, 0) / validationResults.length,
      results: validationResults,
    });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({
      error: "Failed to run validation tests",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/automation/accuracy-metrics
// Get accuracy metrics from validation runs
router.get("/automation/accuracy-metrics", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Require operations or admin role
    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Only operations/admin can view accuracy metrics" 
      });
    }

    const recentRuns = await db.select()
      .from(validationRuns)
      .orderBy(validationRuns.createdAt)
      .limit(100);

    if (recentRuns.length === 0) {
      return res.json({
        totalRuns: 0,
        averageAccuracy: 0,
        passed95Percent: 0,
        recentRuns: [],
      });
    }

    const accuracies = recentRuns
      .filter(r => r.accuracyOverall !== null)
      .map(r => parseFloat(r.accuracyOverall!));
    const passed = recentRuns.filter(r => r.accuracyOverall !== null && parseFloat(r.accuracyOverall!) >= 95).length;

    res.json({
      totalRuns: recentRuns.length,
      averageAccuracy: accuracies.reduce((a, b) => a + b, 0) / accuracies.length,
      passed95Percent: (passed / recentRuns.length) * 100,
      recentRuns: recentRuns.slice(-10), // Last 10 runs
    });
  } catch (error) {
    console.error("Accuracy metrics error:", error);
    res.status(500).json({
      error: "Failed to fetch accuracy metrics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ===== FACILITY ROUTES =====

// GET /api/facilities
// List all facilities
router.get("/facilities", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allFacilities = await db.select()
      .from(facilities)
      .orderBy(facilities.createdAt);

    res.json(allFacilities);

  } catch (error) {
    console.error("Get facilities error:", error);
    res.status(500).json({ 
      error: "Failed to fetch facilities",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/facilities/:id
// Get a single facility with covenants
router.get("/facilities/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // SECURITY: Validate facility ownership for GP users
    const ownershipCheck = await validateFacilityOwnership(
      id,
      req.user,
      "view this facility"
    );

    if (!ownershipCheck.success) {
      return res.status(ownershipCheck.status).json({ 
        error: ownershipCheck.error,
        message: ownershipCheck.message 
      });
    }

    const facility = ownershipCheck.facility;

    // Get related covenants
    const facilityCovenants = await db.select()
      .from(covenants)
      .where(eq(covenants.facilityId, id));

    res.json({
      ...facility,
      covenants: facilityCovenants,
    });

  } catch (error) {
    console.error("Get facility error:", error);
    res.status(500).json({ 
      error: "Failed to fetch facility",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/facilities
// Create a new facility from prospect
router.post("/facilities", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate request body
    const validation = validateBody(insertFacilitySchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid facility data",
        details: validation.error.errors 
      });
    }

    const facilityData: InsertFacility = validation.data;

    const [newFacility] = await db.insert(facilities)
      .values(facilityData)
      .returning();

    res.json(newFacility);

  } catch (error) {
    console.error("Create facility error:", error);
    res.status(500).json({ 
      error: "Failed to create facility",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PATCH /api/facilities/:id
// Update a facility
router.patch("/facilities/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    
    // Validate request body
    const validation = validateBody(updateFacilitySchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid update data",
        details: validation.error.errors 
      });
    }

    const updates = validation.data;

    const [updatedFacility] = await db.update(facilities)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(facilities.id, id))
      .returning();

    if (!updatedFacility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    res.json(updatedFacility);

  } catch (error) {
    console.error("Update facility error:", error);
    res.status(500).json({ 
      error: "Failed to update facility",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ===== COVENANT ROUTES =====

// POST /api/facilities/:facilityId/covenants
// Add a covenant to a facility
router.post("/facilities/:facilityId/covenants", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { facilityId } = req.params;
    
    // Validate request body
    const validation = validateBody(insertCovenantSchema, { ...req.body, facilityId });
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid covenant data",
        details: validation.error.errors 
      });
    }

    const covenantData: InsertCovenant = validation.data;

    const [newCovenant] = await db.insert(covenants)
      .values(covenantData)
      .returning();

    res.json(newCovenant);

  } catch (error) {
    console.error("Create covenant error:", error);
    res.status(500).json({ 
      error: "Failed to create covenant",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PATCH /api/covenants/:id
// Update a covenant (e.g., check status)
router.patch("/covenants/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    
    // Validate request body
    const validation = validateBody(updateCovenantSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid update data",
        details: validation.error.errors 
      });
    }

    const updates = validation.data;

    const [updatedCovenant] = await db.update(covenants)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(covenants.id, id))
      .returning();

    if (!updatedCovenant) {
      return res.status(404).json({ error: "Covenant not found" });
    }

    res.json(updatedCovenant);

  } catch (error) {
    console.error("Update covenant error:", error);
    res.status(500).json({ 
      error: "Failed to update covenant",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ===== LEGAL DOCUMENT GENERATION ROUTES =====

// POST /api/facilities/:id/generate-document
// Generate a legal document for a facility
router.post("/facilities/:id/generate-document", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { documentType, config } = req.body;

    // SECURITY: Validate facility ownership for GP users
    const ownershipCheck = await validateFacilityOwnership(
      id,
      req.user,
      "generate legal documents"
    );

    if (!ownershipCheck.success) {
      return res.status(ownershipCheck.status).json({ 
        error: ownershipCheck.error,
        message: ownershipCheck.message 
      });
    }

    const facility = ownershipCheck.facility;

    // Import document generator functions
    const { generateLoanAgreement, generateTermSheet, generateComplianceReport } = 
      await import("./documentGenerator");

    let document: string;
    let filename: string;

    switch (documentType) {
      case "loan-agreement":
        document = generateLoanAgreement(config, {
          fundName: facility.fundName,
          principalAmount: facility.principalAmount,
          interestRate: facility.interestRate,
          ltvRatio: facility.ltvRatio,
          maturityDate: facility.maturityDate,
          paymentSchedule: facility.paymentSchedule,
        });
        filename = `loan-agreement-${facility.fundName.replace(/\s+/g, '-').toLowerCase()}.md`;
        break;

      case "term-sheet":
        document = generateTermSheet(config, {
          fundName: facility.fundName,
          principalAmount: facility.principalAmount,
          interestRate: facility.interestRate,
          ltvRatio: facility.ltvRatio,
          maturityDate: facility.maturityDate,
          paymentSchedule: facility.paymentSchedule,
        });
        filename = `term-sheet-${facility.fundName.replace(/\s+/g, '-').toLowerCase()}.md`;
        break;

      case "compliance-report":
        document = generateComplianceReport(facility.id, {
          fundName: facility.fundName,
          principalAmount: facility.principalAmount,
          outstandingBalance: facility.outstandingBalance,
          interestRate: facility.interestRate,
          ltvRatio: facility.ltvRatio,
          maturityDate: facility.maturityDate,
        });
        filename = `compliance-report-${facility.fundName.replace(/\s+/g, '-').toLowerCase()}.md`;
        break;

      default:
        return res.status(400).json({ error: "Invalid document type" });
    }

    res.json({
      document,
      filename,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Generate document error:", error);
    res.status(500).json({ 
      error: "Failed to generate document",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ===== ADVISOR DEALS ROUTES =====

// GET /api/advisor-deals
// List all advisor deals
router.get("/advisor-deals", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const deals = await db.select().from(advisorDeals).orderBy(advisorDeals.createdAt);
    res.json(deals);
  } catch (error) {
    console.error("Get advisor deals error:", error);
    res.status(500).json({ error: "Failed to fetch advisor deals" });
  }
});

// POST /api/advisor-deals
// Create a new advisor deal (RFP submission)
router.post("/advisor-deals", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate request body
    const validation = validateBody(insertAdvisorDealSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid advisor deal data",
        details: validation.error.errors 
      });
    }

    const dealData: InsertAdvisorDeal = validation.data;
    
    const [newDeal] = await db.insert(advisorDeals)
      .values(dealData)
      .returning();

    res.json(newDeal);
  } catch (error) {
    console.error("Create advisor deal error:", error);
    res.status(500).json({ 
      error: "Failed to create advisor deal",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/advisor-deals/:id
// Get a specific advisor deal
router.get("/advisor-deals/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const [deal] = await db.select()
      .from(advisorDeals)
      .where(eq(advisorDeals.id, id));

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    res.json(deal);
  } catch (error) {
    console.error("Get advisor deal error:", error);
    res.status(500).json({ error: "Failed to fetch advisor deal" });
  }
});

// GET /api/advisor-deals/:id/compare-bids
// Compare all term sheets for an advisor deal side-by-side
router.get("/advisor-deals/:id/compare-bids", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only advisors and operations/admin can view bid comparisons
    if (!["advisor", "operations", "admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Advisor or Operations role required" });
    }

    const { id } = req.params;

    // Verify deal exists
    const [deal] = await db.select()
      .from(advisorDeals)
      .where(eq(advisorDeals.id, id))
      .limit(1);

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // Fetch all term sheets for this deal
    const allTermSheets = await db.select()
      .from(termSheets)
      .where(eq(termSheets.advisorDealId, id));

    if (allTermSheets.length === 0) {
      return res.json({
        dealId: id,
        fundName: deal.gpFundName,
        requestedAmount: deal.loanAmount,
        termSheetCount: 0,
        bids: [],
        rankings: {
          bestPricing: null,
          bestLoanAmount: null,
          bestLTV: null,
          fastestClose: null,
        },
        recommendation: "No term sheets submitted yet",
      });
    }

    // Parse pricing ranges and extract numerical values for comparison
    const parsePricingRange = (pricingStr: string | null): { min: number; max: number; avg: number } => {
      if (!pricingStr) return { min: 0, max: 0, avg: 0 };
      
      // Detect if pricing is in basis points (bps/bp) - convert to percentage
      const isBasisPoints = /bps?/i.test(pricingStr);
      
      // Handle formats like "8.5-9.5%", "850-950bps", "8.5%", "850bps"
      const numberMatch = pricingStr.match(/(\d+\.?\d*)/g);
      if (!numberMatch) return { min: 0, max: 0, avg: 0 };
      
      let numbers = numberMatch.map(n => parseFloat(n));
      
      // Convert basis points to percentage (850 bps = 8.5%)
      if (isBasisPoints) {
        numbers = numbers.map(n => n / 100);
      }
      
      if (numbers.length === 1) {
        return { min: numbers[0], max: numbers[0], avg: numbers[0] };
      }
      
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      const avg = (min + max) / 2;
      
      return { min, max, avg };
    };

    // Score each term sheet
    const scoredBids = allTermSheets.map((sheet) => {
      const pricing = parsePricingRange(sheet.pricingRange);
      
      // Calculate individual scores (0-100 scale)
      let pricingScore = 0;
      let amountScore = 0;
      let ltvScore = 0;
      let timelineScore = 0;

      // Pricing score (lower is better) - assume 5-15% range, normalize
      if (pricing.avg > 0) {
        const normalizedRate = Math.max(0, Math.min(100, (15 - pricing.avg) / 10 * 100));
        pricingScore = normalizedRate;
      }

      // Loan amount score (closer to requested is better)
      if (sheet.loanAmount && deal.loanAmount) {
        const difference = Math.abs(sheet.loanAmount - deal.loanAmount);
        const percentDiff = (difference / deal.loanAmount) * 100;
        amountScore = Math.max(0, 100 - percentDiff);
      }

      // LTV score (higher is better) - assume 0-100% range
      if (sheet.ltvRatio) {
        ltvScore = sheet.ltvRatio; // Already in 0-100 range
      }

      // Timeline score (faster is better) - assume 0-180 days range
      if (sheet.timelineToClose) {
        timelineScore = Math.max(0, 100 - (sheet.timelineToClose / 180 * 100));
      }

      // Overall composite score (weighted average)
      const overallScore = (
        pricingScore * 0.35 +    // Pricing is most important (35%)
        amountScore * 0.25 +     // Loan amount match (25%)
        ltvScore * 0.25 +        // LTV ratio (25%)
        timelineScore * 0.15     // Timeline (15%)
      );

      return {
        ...sheet,
        pricing: {
          raw: sheet.pricingRange,
          parsed: pricing,
        },
        scores: {
          pricing: Math.round(pricingScore),
          loanAmount: Math.round(amountScore),
          ltv: Math.round(ltvScore),
          timeline: Math.round(timelineScore),
          overall: Math.round(overallScore),
        },
      };
    });

    // Sort by overall score (descending)
    scoredBids.sort((a, b) => b.scores.overall - a.scores.overall);

    // Identify best in each category
    const bestPricing = [...scoredBids].sort((a, b) => b.scores.pricing - a.scores.pricing)[0];
    const bestLoanAmount = [...scoredBids].sort((a, b) => b.scores.loanAmount - a.scores.loanAmount)[0];
    const bestLTV = [...scoredBids].sort((a, b) => b.scores.ltv - a.scores.ltv)[0];
    const fastestClose = [...scoredBids].sort((a, b) => b.scores.timeline - a.scores.timeline)[0];

    // Generate recommendation
    const topBid = scoredBids[0];
    let recommendation = `Recommended: ${topBid.lenderName} with overall score of ${topBid.scores.overall}/100. `;
    
    const strengths: string[] = [];
    if (topBid.id === bestPricing.id) strengths.push("best pricing");
    if (topBid.id === bestLoanAmount.id) strengths.push("optimal loan amount");
    if (topBid.id === bestLTV.id) strengths.push("highest LTV");
    if (topBid.id === fastestClose.id) strengths.push("fastest close");
    
    if (strengths.length > 0) {
      recommendation += `Strengths: ${strengths.join(", ")}.`;
    }

    res.json({
      dealId: id,
      fundName: deal.gpFundName,
      requestedAmount: deal.loanAmount,
      termSheetCount: allTermSheets.length,
      bids: scoredBids,
      rankings: {
        bestPricing: {
          lender: bestPricing.lenderName,
          score: bestPricing.scores.pricing,
          value: bestPricing.pricingRange,
        },
        bestLoanAmount: {
          lender: bestLoanAmount.lenderName,
          score: bestLoanAmount.scores.loanAmount,
          value: bestLoanAmount.loanAmount,
        },
        bestLTV: {
          lender: bestLTV.lenderName,
          score: bestLTV.scores.ltv,
          value: bestLTV.ltvRatio,
        },
        fastestClose: {
          lender: fastestClose.lenderName,
          score: fastestClose.scores.timeline,
          value: fastestClose.timelineToClose,
        },
      },
      recommendation,
    });
  } catch (error) {
    console.error("Compare bids error:", error);
    res.status(500).json({ 
      error: "Failed to compare bids",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/advisor-deals/:id/commission
// Calculate commission for a specific advisor deal
router.get("/advisor-deals/:id/commission", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only advisors and operations/admin can view commission details
    if (!["advisor", "operations", "admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Advisor or Operations role required" });
    }

    const { id } = req.params;

    // Fetch the advisor deal
    const [deal] = await db.select()
      .from(advisorDeals)
      .where(eq(advisorDeals.id, id))
      .limit(1);

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // Check if deal has closed
    if (deal.status !== "closed" && deal.status !== "won") {
      return res.json({
        dealId: id,
        status: deal.status,
        message: "Deal has not closed yet - commission not applicable",
        commission: {
          earned: 0,
          basis: null,
          rate: null,
        },
      });
    }

    // Check if there's a linked facility
    let facilityAmount = 0;
    if (deal.winner) {
      const [facility] = await db.select()
        .from(facilities)
        .where(eq(facilities.advisorDealId, id))
        .limit(1);

      if (facility) {
        facilityAmount = facility.principalAmount;
      }
    }

    // Commission calculation logic
    // Standard industry rates: 50-100 bps (0.5% - 1%) of loan amount
    // Tier 1: <$10M = 100 bps (1%)
    // Tier 2: $10M-$50M = 75 bps (0.75%)
    // Tier 3: $50M+ = 50 bps (0.5%)
    
    const loanAmount = facilityAmount || deal.loanAmount || 0;
    let commissionRate = 0;
    let tier = "";

    if (loanAmount === 0) {
      return res.json({
        dealId: id,
        status: deal.status,
        message: "No loan amount available for commission calculation",
        commission: {
          earned: 0,
          basis: 0,
          rate: 0,
        },
      });
    }

    if (loanAmount < 10_000_000) {
      commissionRate = 100; // 100 basis points = 1%
      tier = "Tier 1 (<$10M)";
    } else if (loanAmount < 50_000_000) {
      commissionRate = 75; // 75 basis points = 0.75%
      tier = "Tier 2 ($10M-$50M)";
    } else {
      commissionRate = 50; // 50 basis points = 0.5%
      tier = "Tier 3 ($50M+)";
    }

    // Calculate commission (basis points to percentage: divide by 10,000)
    const commissionEarned = Math.round(loanAmount * (commissionRate / 10000));

    // Update the deal with calculated commission if not already set
    if (!deal.commissionEarned || deal.commissionEarned === 0) {
      await db.update(advisorDeals)
        .set({ 
          commissionEarned,
          updatedAt: new Date(),
        })
        .where(eq(advisorDeals.id, id));
    }

    res.json({
      dealId: id,
      fundName: deal.gpFundName,
      status: deal.status,
      winner: deal.winner,
      closeDate: deal.closeDate,
      loanAmount,
      commission: {
        earned: commissionEarned,
        basis: loanAmount,
        rate: commissionRate,
        ratePercentage: (commissionRate / 100).toFixed(2) + "%",
        tier,
      },
      breakdown: {
        loanAmountFormatted: `$${(loanAmount / 1_000_000).toFixed(1)}M`,
        commissionRateBps: `${commissionRate} bps`,
        commissionEarnedFormatted: `$${(commissionEarned / 1_000).toFixed(1)}K`,
      },
    });
  } catch (error) {
    console.error("Calculate commission error:", error);
    res.status(500).json({ 
      error: "Failed to calculate commission",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/advisors/:advisorId/dashboard
// Get comprehensive dashboard summary for an advisor
router.get("/advisors/:advisorId/dashboard", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only advisors and operations/admin can view advisor dashboards
    if (!["advisor", "operations", "admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Advisor or Operations role required" });
    }

    const { advisorId } = req.params;

    // Security: Advisors can only view their own dashboard
    // Operations/admin can view any advisor's dashboard
    if (req.user.role === "advisor" && req.user.id !== advisorId) {
      return res.status(403).json({ 
        error: "Forbidden: Advisors can only access their own dashboard" 
      });
    }

    // Fetch all deals for this advisor
    const allDeals = await db.select()
      .from(advisorDeals)
      .where(eq(advisorDeals.advisorId, advisorId));

    if (allDeals.length === 0) {
      return res.json({
        advisorId,
        summary: {
          totalDeals: 0,
          activeDeals: 0,
          closedDeals: 0,
          totalCommissionsEarned: 0,
          averageDaysToClose: 0,
          winRate: 0,
        },
        dealsByStatus: {},
        topDeals: [],
        recentActivity: [],
      });
    }

    // Calculate summary statistics
    const statusCounts: Record<string, number> = {};
    let totalCommissions = 0;
    let closedDeals = 0;
    let totalDaysToClose = 0;

    for (const deal of allDeals) {
      // Count by status
      statusCounts[deal.status] = (statusCounts[deal.status] || 0) + 1;

      // Track commissions
      if (deal.commissionEarned) {
        totalCommissions += deal.commissionEarned;
      }

      // Track days to close
      if (deal.daysToClose) {
        closedDeals++;
        totalDaysToClose += deal.daysToClose;
      }
    }

    const averageDaysToClose = closedDeals > 0 ? Math.round(totalDaysToClose / closedDeals) : 0;
    const totalDeals = allDeals.length;
    // Sum both "won" and "closed" status counts (not OR operation)
    const wonDeals = (statusCounts["won"] || 0) + (statusCounts["closed"] || 0);
    const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

    // Get top deals by commission
    const topDealsByCommission = [...allDeals]
      .filter(d => d.commissionEarned && d.commissionEarned > 0)
      .sort((a, b) => (b.commissionEarned || 0) - (a.commissionEarned || 0))
      .slice(0, 5)
      .map(deal => ({
        id: deal.id,
        fundName: deal.gpFundName,
        loanAmount: deal.loanAmount,
        commissionEarned: deal.commissionEarned,
        status: deal.status,
        winner: deal.winner,
      }));

    // Get recent activity (most recently updated deals)
    const recentActivity = [...allDeals]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map(deal => ({
        id: deal.id,
        fundName: deal.gpFundName,
        status: deal.status,
        updatedAt: deal.updatedAt,
        loanAmount: deal.loanAmount,
      }));

    // For each active deal, get term sheet count
    const activeDeals = allDeals.filter(d => 
      d.status === "active" || d.status === "in_progress" || d.status === "rfp_sent"
    );
    
    const dealsWithTermSheetCounts = await Promise.all(
      activeDeals.slice(0, 10).map(async (deal) => {
        const termSheetCount = await db.select()
          .from(termSheets)
          .where(eq(termSheets.advisorDealId, deal.id));
        
        return {
          id: deal.id,
          fundName: deal.gpFundName,
          status: deal.status,
          loanAmount: deal.loanAmount,
          termSheetCount: termSheetCount.length,
          submissionDeadline: deal.submissionDeadline,
        };
      })
    );

    res.json({
      advisorId,
      summary: {
        totalDeals,
        activeDeals: activeDeals.length,
        closedDeals: wonDeals,
        totalCommissionsEarned: totalCommissions,
        averageDaysToClose,
        winRate,
      },
      dealsByStatus: statusCounts,
      topDeals: topDealsByCommission,
      activeDealsWithBids: dealsWithTermSheetCounts,
      recentActivity,
      performanceMetrics: {
        totalCommissionsFormatted: `$${(totalCommissions / 1_000).toFixed(1)}K`,
        averageCommissionPerDeal: wonDeals > 0 ? 
          `$${(totalCommissions / wonDeals / 1_000).toFixed(1)}K` : "$0K",
        winRateFormatted: `${winRate}%`,
      },
    });
  } catch (error) {
    console.error("Get advisor dashboard error:", error);
    res.status(500).json({ 
      error: "Failed to fetch advisor dashboard",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/lender-invitations
// Create lender invitations for an RFP
router.post("/lender-invitations", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate request body
    const validation = validateBody(insertLenderInvitationSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid lender invitation data",
        details: validation.error.errors 
      });
    }

    const invitationData: InsertLenderInvitation = validation.data;
    
    const [newInvitation] = await db.insert(lenderInvitations)
      .values(invitationData)
      .returning();

    res.json(newInvitation);
  } catch (error) {
    console.error("Create lender invitation error:", error);
    res.status(500).json({ 
      error: "Failed to create lender invitation",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/lender-invitations/:dealId
// Get all lender invitations for a specific deal
router.get("/lender-invitations/:dealId", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { dealId } = req.params;
    const invitations = await db.select()
      .from(lenderInvitations)
      .where(eq(lenderInvitations.advisorDealId, dealId));

    res.json(invitations);
  } catch (error) {
    console.error("Get lender invitations error:", error);
    res.status(500).json({ error: "Failed to fetch lender invitations" });
  }
});

// Covenant Monitoring Routes
import { 
  checkCovenant, 
  checkAllDueCovenants, 
  manualCovenantCheck,
  getCovenantBreachSummary 
} from "./services/covenantMonitoring";

// POST /api/covenants/:id/check
// Manually check a specific covenant
router.post("/covenants/:id/check", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { currentValue } = req.body;

    if (typeof currentValue !== "number") {
      return res.status(400).json({ error: "Current value must be a number" });
    }

    const result = await checkCovenant(id, currentValue, req.user.id);
    res.json(result);
  } catch (error) {
    console.error("Check covenant error:", error);
    res.status(500).json({ 
      error: "Failed to check covenant",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/facilities/:facilityId/check-covenants
// Check all covenants for a facility
router.post("/facilities/:facilityId/check-covenants", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { facilityId } = req.params;

    // SECURITY: Validate facility ownership for GP users
    const ownershipCheck = await validateFacilityOwnership(
      facilityId,
      req.user,
      "check covenant compliance"
    );

    if (!ownershipCheck.success) {
      return res.status(ownershipCheck.status).json({ 
        error: ownershipCheck.error,
        message: ownershipCheck.message 
      });
    }

    const results = await manualCovenantCheck(facilityId, req.user.id);
    
    res.json({
      facilityId,
      covenantsChecked: results.length,
      results,
    });
  } catch (error) {
    console.error("Check facility covenants error:", error);
    res.status(500).json({ 
      error: "Failed to check facility covenants",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/facilities/:facilityId/covenant-summary
// Get covenant breach summary for a facility
router.get("/facilities/:facilityId/covenant-summary", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { facilityId } = req.params;

    // SECURITY: Validate facility ownership for GP users
    const ownershipCheck = await validateFacilityOwnership(
      facilityId,
      req.user,
      "view covenant compliance summary"
    );

    if (!ownershipCheck.success) {
      return res.status(ownershipCheck.status).json({ 
        error: ownershipCheck.error,
        message: ownershipCheck.message 
      });
    }

    const summary = await getCovenantBreachSummary(facilityId);
    
    res.json(summary);
  } catch (error) {
    console.error("Get covenant summary error:", error);
    res.status(500).json({ 
      error: "Failed to get covenant summary",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/covenants/check-all-due
// Run automated check for all due covenants (admin only)
router.post("/covenants/check-all-due", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only allow operations and admin roles
    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin or operations role required" });
    }

    const results = await checkAllDueCovenants();
    
    const breaches = results.filter((r) => r.breachDetected);
    
    res.json({
      totalChecked: results.length,
      breachesDetected: breaches.length,
      results,
    });
  } catch (error) {
    console.error("Check all due covenants error:", error);
    res.status(500).json({ 
      error: "Failed to check all due covenants",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Monitoring Dashboard Routes
// GET /api/monitoring/covenants
// Get all covenants across all facilities with aggregated data
router.get("/monitoring/covenants", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get all facilities with their covenants
    const allFacilities = await db.select().from(facilities).orderBy(facilities.createdAt);
    const allCovenants = await db.select().from(covenants).orderBy(covenants.createdAt);

    // Map covenants to facilities and format for frontend
    const covenantData = allCovenants.map(covenant => {
      const facility = allFacilities.find(f => f.id === covenant.facilityId);
      const operatorSymbol = covenant.thresholdOperator === "less_than" || covenant.thresholdOperator === "less_than_equal" ? "≤" : "≥";
      return {
        id: covenant.id,
        dealName: facility?.fundName || "Unknown Fund",
        covenantType: covenant.covenantType,
        threshold: `${operatorSymbol} ${covenant.thresholdValue}`,
        currentValue: `${covenant.currentValue ?? "N/A"}`,
        status: covenant.status,
        lastChecked: covenant.lastChecked ? `${Math.round((Date.now() - new Date(covenant.lastChecked).getTime()) / (1000 * 60 * 60))} hours ago` : "Never",
      };
    });

    res.json(covenantData);
  } catch (error) {
    console.error("Get monitoring covenants error:", error);
    res.status(500).json({ 
      error: "Failed to fetch monitoring covenants",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/monitoring/health-scores
// Get facility health scores and metrics
router.get("/monitoring/health-scores", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allFacilities = await db.select().from(facilities).orderBy(facilities.createdAt);

    // Calculate health scores for each facility
    const healthScores = await Promise.all(allFacilities.map(async (facility) => {
      // Get covenants for this facility
      const facilityCovenants = await db.select()
        .from(covenants)
        .where(eq(covenants.facilityId, facility.id));

      // Calculate health score based on covenant compliance
      const totalCovenants = facilityCovenants.length;
      const compliantCovenants = facilityCovenants.filter(c => c.status === "compliant").length;
      const warningCovenants = facilityCovenants.filter(c => c.status === "warning").length;
      const breachCovenants = facilityCovenants.filter(c => c.status === "breach").length;

      // Score calculation: 100 for compliant, 50 for warning, 0 for breach
      let score = 75; // Default score
      if (totalCovenants > 0) {
        score = Math.round((compliantCovenants * 100 + warningCovenants * 50) / totalCovenants);
      }

      // Determine trend (simplified - based on recent checks)
      let trend: "up" | "down" | "stable" = "stable";
      if (warningCovenants > 0 || breachCovenants > 0) {
        trend = "down";
      } else if (compliantCovenants === totalCovenants) {
        trend = "up";
      }

      // Determine category
      let category: "excellent" | "good" | "fair" | "poor";
      if (score >= 85) category = "excellent";
      else if (score >= 70) category = "good";
      else if (score >= 50) category = "fair";
      else category = "poor";

      return {
        id: facility.id,
        dealName: facility.fundName,
        score,
        trend,
        category,
        lastUpdate: `Updated ${Math.round((Date.now() - new Date(facility.updatedAt).getTime()) / (1000 * 60 * 60))} hours ago`,
      };
    }));

    res.json(healthScores);
  } catch (error) {
    console.error("Get health scores error:", error);
    res.status(500).json({ 
      error: "Failed to fetch health scores",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/monitoring/stats
// Get monitoring statistics
router.get("/monitoring/stats", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allFacilities = await db.select().from(facilities);
    const allCovenants = await db.select().from(covenants);

    const compliantCount = allCovenants.filter(c => c.status === "compliant").length;
    const warningCount = allCovenants.filter(c => c.status === "warning").length;
    const breachCount = allCovenants.filter(c => c.status === "breach").length;
    const total = allCovenants.length;

    res.json({
      compliantDeals: allFacilities.filter(f => f.status === "active").length,
      compliantPercentage: total > 0 ? Math.round((compliantCount / total) * 100) : 0,
      warningDeals: warningCount,
      warningPercentage: total > 0 ? Math.round((warningCount / total) * 100) : 0,
      breachDeals: breachCount,
      breachPercentage: total > 0 ? Math.round((breachCount / total) * 100) : 0,
      totalCovenants: total,
    });
  } catch (error) {
    console.error("Get monitoring stats error:", error);
    res.status(500).json({ 
      error: "Failed to fetch monitoring stats",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Draw Request Routes
// POST /api/facilities/:facilityId/draw-requests
// Create a new draw request for a facility (GP role only)
router.post("/facilities/:facilityId/draw-requests", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only GPs can create draw requests
    if (req.user.role !== "gp") {
      return res.status(403).json({ error: "Forbidden: Only GPs can create draw requests" });
    }

    const { facilityId } = req.params;

    // SECURITY: Validate facility ownership for GP users
    const ownershipCheck = await validateFacilityOwnership(
      facilityId,
      req.user,
      "submit draw requests"
    );

    if (!ownershipCheck.success) {
      return res.status(ownershipCheck.status).json({ 
        error: ownershipCheck.error,
        message: ownershipCheck.message 
      });
    }

    const facility = ownershipCheck.facility;

    // Verify facility is active (cannot request draws on closed facilities)
    if (facility.status !== "active") {
      return res.status(403).json({ 
        error: "Forbidden: Cannot request draws on non-active facilities",
        facilityStatus: facility.status
      });
    }

    // Validate request body
    const validation = validateBody(insertDrawRequestSchema, {
      ...req.body,
      facilityId,
      requestedBy: req.user.email,
      status: "pending",
    });

    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: validation.error.errors 
      });
    }

    const [drawRequest] = await db.insert(drawRequests)
      .values(validation.data)
      .returning();

    // Get all operations and admin users to notify them
    const opsUsers = await db.select()
      .from(users)
      .where(
        or(
          eq(users.role, "operations"),
          eq(users.role, "admin")
        )
      );

    // Create notifications for all operations team members
    if (opsUsers.length > 0) {
      await db.insert(notifications).values(
        opsUsers.map(user => ({
          userId: user.id,
          type: "draw_request_submitted",
          title: "New Draw Request",
          message: `Draw request for $${(validation.data.requestedAmount / 100).toLocaleString()} submitted for ${facility.fundName} by ${req.user!.email}`,
          relatedEntityType: "draw_request",
          relatedEntityId: drawRequest.id,
          actionUrl: `/facilities/${facilityId}`,
          priority: "high",
        }))
      );
    }

    res.json(drawRequest);
  } catch (error) {
    console.error("Create draw request error:", error);
    res.status(500).json({ 
      error: "Failed to create draw request",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/facilities/:facilityId/draw-requests
// Get all draw requests for a facility
router.get("/facilities/:facilityId/draw-requests", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { facilityId } = req.params;

    // SECURITY: Validate facility ownership for GP users
    const ownershipCheck = await validateFacilityOwnership(
      facilityId,
      req.user,
      "view draw requests"
    );

    if (!ownershipCheck.success) {
      return res.status(ownershipCheck.status).json({ 
        error: ownershipCheck.error,
        message: ownershipCheck.message 
      });
    }

    const facilityDrawRequests = await db.select()
      .from(drawRequests)
      .where(eq(drawRequests.facilityId, facilityId))
      .orderBy(sql`${drawRequests.requestDate} DESC`);

    res.json(facilityDrawRequests);
  } catch (error) {
    console.error("Get draw requests error:", error);
    res.status(500).json({ 
      error: "Failed to fetch draw requests",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/draw-requests/:id
// Get a single draw request by ID
router.get("/draw-requests/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const [drawRequest] = await db.select()
      .from(drawRequests)
      .where(eq(drawRequests.id, id))
      .limit(1);

    if (!drawRequest) {
      return res.status(404).json({ error: "Draw request not found" });
    }

    // SECURITY: Validate facility ownership for GP users
    const ownershipCheck = await validateFacilityOwnership(
      drawRequest.facilityId,
      req.user,
      "view this draw request"
    );

    if (!ownershipCheck.success) {
      return res.status(ownershipCheck.status).json({ 
        error: ownershipCheck.error,
        message: ownershipCheck.message 
      });
    }

    res.json(drawRequest);
  } catch (error) {
    console.error("Get draw request error:", error);
    res.status(500).json({ 
      error: "Failed to fetch draw request",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PATCH /api/draw-requests/:id
// Update draw request (approve, reject, or disburse) - Operations only
router.patch("/draw-requests/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only operations and admin can update draw requests
    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    const { id } = req.params;

    // Get existing draw request
    const [existingDrawRequest] = await db.select()
      .from(drawRequests)
      .where(eq(drawRequests.id, id))
      .limit(1);

    if (!existingDrawRequest) {
      return res.status(404).json({ error: "Draw request not found" });
    }

    // Validate update data
    const validation = validateBody(updateDrawRequestSchema, req.body);

    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid update data", 
        details: validation.error.errors 
      });
    }

    // Add metadata based on status change
    const updates: Partial<InsertDrawRequest> = { ...validation.data };

    if (validation.data.status === "approved" && !existingDrawRequest.approvedBy) {
      updates.approvedBy = req.user.email;
      updates.approvedDate = new Date();
    }

    if (validation.data.status === "disbursed" && !existingDrawRequest.disbursedDate) {
      updates.disbursedDate = new Date();
    }

    const [updatedDrawRequest] = await db.update(drawRequests)
      .set(updates)
      .where(eq(drawRequests.id, id))
      .returning();

    // Create notification for status changes
    if (validation.data.status) {
      const [facility] = await db.select()
        .from(facilities)
        .where(eq(facilities.id, existingDrawRequest.facilityId))
        .limit(1);

      let notificationMessage = "";
      let notificationPriority: "low" | "normal" | "high" | "urgent" = "normal";

      if (validation.data.status === "approved") {
        notificationMessage = `Draw request for $${(existingDrawRequest.requestedAmount / 100).toLocaleString()} has been approved by ${req.user.email}`;
        notificationPriority = "high";
      } else if (validation.data.status === "rejected") {
        notificationMessage = `Draw request for $${(existingDrawRequest.requestedAmount / 100).toLocaleString()} has been rejected by ${req.user.email}`;
        notificationPriority = "high";
      } else if (validation.data.status === "disbursed") {
        notificationMessage = `Draw request for $${(existingDrawRequest.requestedAmount / 100).toLocaleString()} has been disbursed`;
        notificationPriority = "urgent";
      }

      if (notificationMessage) {
        // Find the GP who submitted the request by email
        const [gpUser] = await db.select()
          .from(users)
          .where(eq(users.email, existingDrawRequest.requestedBy))
          .limit(1);

        if (gpUser) {
          // Send notification to the GP who requested the draw
          await db.insert(notifications).values({
            userId: gpUser.id, // Send to GP who requested it
            type: "draw_request_status_change",
            title: `Draw Request ${validation.data.status}`,
            message: notificationMessage,
            relatedEntityType: "draw_request",
            relatedEntityId: id,
            actionUrl: `/facilities/${existingDrawRequest.facilityId}`,
            priority: notificationPriority,
          });
        }
      }
    }

    res.json(updatedDrawRequest);
  } catch (error) {
    console.error("Update draw request error:", error);
    res.status(500).json({ 
      error: "Failed to update draw request",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Cash Flow / Repayment Tracking Routes
// POST /api/facilities/:facilityId/cash-flows
// Create scheduled payment for a facility (Operations only)
router.post("/facilities/:facilityId/cash-flows", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only operations and admin can create scheduled payments
    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    const { facilityId } = req.params;

    // Validate facility exists
    const [facility] = await db.select()
      .from(facilities)
      .where(eq(facilities.id, facilityId))
      .limit(1);

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    // Validate request body
    const validation = validateBody(insertCashFlowSchema, {
      ...req.body,
      facilityId,
      status: "scheduled",
    });

    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: validation.error.errors 
      });
    }

    const [cashFlow] = await db.insert(cashFlows)
      .values(validation.data)
      .returning();

    res.json(cashFlow);
  } catch (error) {
    console.error("Create cash flow error:", error);
    res.status(500).json({ 
      error: "Failed to create cash flow",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/facilities/:facilityId/cash-flows
// Get all cash flows (scheduled and paid) for a facility
router.get("/facilities/:facilityId/cash-flows", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { facilityId } = req.params;

    // SECURITY: Validate facility ownership for GP users
    const ownershipCheck = await validateFacilityOwnership(
      facilityId,
      req.user,
      "view payment schedules"
    );

    if (!ownershipCheck.success) {
      return res.status(ownershipCheck.status).json({ 
        error: ownershipCheck.error,
        message: ownershipCheck.message 
      });
    }

    const facilityCashFlows = await db.select()
      .from(cashFlows)
      .where(eq(cashFlows.facilityId, facilityId))
      .orderBy(sql`${cashFlows.dueDate} ASC`);

    // Calculate summary statistics
    const totalScheduled = facilityCashFlows
      .filter(cf => cf.status === "scheduled")
      .reduce((sum, cf) => sum + cf.totalDue, 0);

    const totalPaid = facilityCashFlows
      .filter(cf => cf.status === "paid")
      .reduce((sum, cf) => sum + cf.paidAmount, 0);

    const totalOverdue = facilityCashFlows
      .filter(cf => cf.status === "overdue")
      .reduce((sum, cf) => sum + (cf.totalDue - cf.paidAmount), 0);

    res.json({
      cashFlows: facilityCashFlows,
      summary: {
        totalScheduled,
        totalPaid,
        totalOverdue,
        count: facilityCashFlows.length,
      },
    });
  } catch (error) {
    console.error("Get cash flows error:", error);
    res.status(500).json({ 
      error: "Failed to fetch cash flows",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/cash-flows/:id
// Get a single cash flow by ID
router.get("/cash-flows/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const [cashFlow] = await db.select()
      .from(cashFlows)
      .where(eq(cashFlows.id, id))
      .limit(1);

    if (!cashFlow) {
      return res.status(404).json({ error: "Cash flow not found" });
    }

    // SECURITY: Validate facility ownership for GP users
    const ownershipCheck = await validateFacilityOwnership(
      cashFlow.facilityId,
      req.user,
      "view this payment"
    );

    if (!ownershipCheck.success) {
      return res.status(ownershipCheck.status).json({ 
        error: ownershipCheck.error,
        message: ownershipCheck.message 
      });
    }

    res.json(cashFlow);
  } catch (error) {
    console.error("Get cash flow error:", error);
    res.status(500).json({ 
      error: "Failed to fetch cash flow",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PATCH /api/cash-flows/:id/payment
// Record a payment against a scheduled cash flow
router.patch("/cash-flows/:id/payment", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only operations and admin can record payments
    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    const { id } = req.params;

    // Get existing cash flow
    const [existingCashFlow] = await db.select()
      .from(cashFlows)
      .where(eq(cashFlows.id, id))
      .limit(1);

    if (!existingCashFlow) {
      return res.status(404).json({ error: "Cash flow not found" });
    }

    // Validate payment data
    const paymentSchema = z.object({
      paidAmount: z.number().int().positive(),
      paidDate: z.string().or(z.date()).optional(),
    });

    const validation = paymentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid payment data", 
        details: validation.error.errors 
      });
    }

    const { paidAmount, paidDate } = validation.data;

    // Determine payment status
    let status: string;
    if (paidAmount >= existingCashFlow.totalDue) {
      status = "paid";
    } else if (paidAmount > 0) {
      status = "partial";
    } else {
      status = existingCashFlow.status;
    }

    const [updatedCashFlow] = await db.update(cashFlows)
      .set({
        paidAmount,
        paidDate: paidDate ? new Date(paidDate) : new Date(),
        status,
      })
      .where(eq(cashFlows.id, id))
      .returning();

    // Update facility outstanding balance
    const [facility] = await db.select()
      .from(facilities)
      .where(eq(facilities.id, existingCashFlow.facilityId))
      .limit(1);

    if (facility) {
      const principalPaid = Math.min(paidAmount, existingCashFlow.principal);
      const newOutstandingBalance = facility.outstandingBalance - principalPaid;

      await db.update(facilities)
        .set({ outstandingBalance: newOutstandingBalance })
        .where(eq(facilities.id, existingCashFlow.facilityId));

      // Create notification for payment received
      await db.insert(notifications).values({
        userId: req.user.id, // TODO: Send to GP and operations team
        type: "payment_received",
        title: "Payment Received",
        message: `Payment of $${(paidAmount / 100).toLocaleString()} received for ${facility.fundName}`,
        relatedEntityType: "cash_flow",
        relatedEntityId: id,
        actionUrl: `/facilities/${existingCashFlow.facilityId}`,
        priority: "normal",
      });
    }

    res.json(updatedCashFlow);
  } catch (error) {
    console.error("Record payment error:", error);
    res.status(500).json({ 
      error: "Failed to record payment",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Notification Routes
// GET /api/notifications
// Get all notifications for the current user
router.get("/notifications", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, req.user.id))
      .orderBy(sql`${notifications.createdAt} DESC`);

    res.json(userNotifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// GET /api/notifications/unread
// Get unread notifications count
router.get("/notifications/unread", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const unread = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, req.user.id),
          eq(notifications.isRead, false)
        )
      );

    res.json({ 
      count: unread.length,
      notifications: unread 
    });
  } catch (error) {
    console.error("Get unread notifications error:", error);
    res.status(500).json({ error: "Failed to fetch unread notifications" });
  }
});

// PATCH /api/notifications/:id/read
// Mark a notification as read
router.patch("/notifications/:id/read", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    
    const [notification] = await db.update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, req.user.id)
        )
      )
      .returning();

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// POST /api/notifications/mark-all-read
// Mark all notifications as read for current user
router.post("/notifications/mark-all-read", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await db.update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, req.user.id),
          eq(notifications.isRead, false)
        )
      );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// DELETE /api/notifications/:id
// Delete a notification
router.delete("/notifications/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    
    const [deleted] = await db.delete(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, req.user.id)
        )
      )
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// Portfolio Analytics Routes
// GET /api/analytics/portfolio-summary
// Get comprehensive portfolio risk metrics and summary (Operations/Admin only)
router.get("/analytics/portfolio-summary", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only operations and admin can view portfolio analytics
    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    // Get all facilities
    const allFacilities = await db.select().from(facilities);
    
    // Get all covenants
    const allCovenants = await db.select().from(covenants);
    
    // Get all cash flows
    const allCashFlows = await db.select().from(cashFlows);

    // Portfolio Overview Metrics
    const totalFacilities = allFacilities.length;
    const activeFacilities = allFacilities.filter(f => f.status === "active").length;
    const totalPrincipalAmount = allFacilities.reduce((sum, f) => sum + f.principalAmount, 0);
    const totalOutstandingBalance = allFacilities.reduce((sum, f) => sum + f.outstandingBalance, 0);
    
    // Average metrics
    const avgLtvRatio = activeFacilities > 0 
      ? allFacilities.filter(f => f.status === "active").reduce((sum, f) => sum + f.ltvRatio, 0) / activeFacilities
      : 0;
    
    const avgInterestRate = activeFacilities > 0
      ? allFacilities.filter(f => f.status === "active").reduce((sum, f) => sum + f.interestRate, 0) / activeFacilities
      : 0;

    // Risk Concentration by Status
    const statusDistribution = allFacilities.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Covenant Health Metrics
    const covenantHealth = {
      total: allCovenants.length,
      compliant: allCovenants.filter(c => c.status === "compliant").length,
      warning: allCovenants.filter(c => c.status === "warning").length,
      breach: allCovenants.filter(c => c.status === "breach").length,
    };

    const covenantHealthPercentage = {
      compliant: covenantHealth.total > 0 ? (covenantHealth.compliant / covenantHealth.total) * 100 : 0,
      warning: covenantHealth.total > 0 ? (covenantHealth.warning / covenantHealth.total) * 100 : 0,
      breach: covenantHealth.total > 0 ? (covenantHealth.breach / covenantHealth.total) * 100 : 0,
    };

    // Payment Performance Metrics
    const totalCashFlows = allCashFlows.length;
    const paidCashFlows = allCashFlows.filter(cf => cf.status === "paid").length;
    const overdueCashFlows = allCashFlows.filter(cf => cf.status === "overdue").length;
    const scheduledCashFlows = allCashFlows.filter(cf => cf.status === "scheduled").length;

    const paymentPerformance = {
      total: totalCashFlows,
      paid: paidCashFlows,
      overdue: overdueCashFlows,
      scheduled: scheduledCashFlows,
      paidPercentage: totalCashFlows > 0 ? (paidCashFlows / totalCashFlows) * 100 : 0,
    };

    // Calculate total amounts by payment status
    const totalPaidAmount = allCashFlows
      .filter(cf => cf.status === "paid")
      .reduce((sum, cf) => sum + cf.paidAmount, 0);

    const totalOverdueAmount = allCashFlows
      .filter(cf => cf.status === "overdue")
      .reduce((sum, cf) => sum + (cf.totalDue - cf.paidAmount), 0);

    const totalScheduledAmount = allCashFlows
      .filter(cf => cf.status === "scheduled")
      .reduce((sum, cf) => sum + cf.totalDue, 0);

    // Upcoming Maturities (next 90 days)
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const upcomingMaturities = allFacilities.filter(f => {
      const maturityDate = new Date(f.maturityDate);
      return maturityDate <= ninetyDaysFromNow && f.status === "active";
    }).length;

    // Risk Score (simple calculation based on covenant breaches and overdue payments)
    // Scale: 0-100 (0 = lowest risk, 100 = highest risk)
    let riskScore = 0;
    
    // Covenant breach contribution (max 50 points)
    const breachRatio = covenantHealth.total > 0 ? covenantHealth.breach / covenantHealth.total : 0;
    riskScore += breachRatio * 50;
    
    // Overdue payment contribution (max 30 points)
    const overdueRatio = totalCashFlows > 0 ? overdueCashFlows / totalCashFlows : 0;
    riskScore += overdueRatio * 30;
    
    // Overdue amount contribution (max 20 points)
    const overdueAmountRatio = totalOutstandingBalance > 0 ? totalOverdueAmount / totalOutstandingBalance : 0;
    riskScore += overdueAmountRatio * 20;

    // Risk level categorization
    let riskLevel: "low" | "medium" | "high" | "critical";
    if (riskScore < 20) {
      riskLevel = "low";
    } else if (riskScore < 40) {
      riskLevel = "medium";
    } else if (riskScore < 70) {
      riskLevel = "high";
    } else {
      riskLevel = "critical";
    }

    // Portfolio concentration risk (top 5 largest facilities)
    const sortedBySize = [...allFacilities]
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
      .slice(0, 5);

    const topFiveConcentration = sortedBySize.reduce((sum, f) => sum + f.outstandingBalance, 0);
    const concentrationRatio = totalOutstandingBalance > 0 
      ? (topFiveConcentration / totalOutstandingBalance) * 100 
      : 0;

    const portfolioSummary = {
      overview: {
        totalFacilities,
        activeFacilities,
        totalPrincipalAmount,
        totalOutstandingBalance,
        avgLtvRatio: Math.round(avgLtvRatio),
        avgInterestRate: Math.round(avgInterestRate),
      },
      statusDistribution,
      covenantHealth: {
        total: covenantHealth.total,
        compliant: covenantHealth.compliant,
        warning: covenantHealth.warning,
        breach: covenantHealth.breach,
        compliantPercentage: covenantHealthPercentage.compliant,
        warningPercentage: covenantHealthPercentage.warning,
        breachPercentage: covenantHealthPercentage.breach,
      },
      paymentPerformance: {
        totalCashFlows,
        paidCount: paidCashFlows,
        overdueCount: overdueCashFlows,
        scheduledCount: scheduledCashFlows,
        paidPercentage: totalCashFlows > 0 ? (paidCashFlows / totalCashFlows) * 100 : 0,
        overduePercentage: totalCashFlows > 0 ? (overdueCashFlows / totalCashFlows) * 100 : 0,
        scheduledPercentage: totalCashFlows > 0 ? (scheduledCashFlows / totalCashFlows) * 100 : 0,
        totalPaid: totalPaidAmount,
        totalOverdue: totalOverdueAmount,
        totalScheduled: totalScheduledAmount,
      },
      riskMetrics: {
        riskScore: Math.round(riskScore),
        riskLevel,
        upcomingMaturities90Days: upcomingMaturities,
        concentrationRatio: Math.round(concentrationRatio * 10) / 10,
        topFiveExposure: topFiveConcentration,
      },
    };

    res.json(portfolioSummary);
  } catch (error) {
    console.error("Get portfolio summary error:", error);
    res.status(500).json({ 
      error: "Failed to fetch portfolio summary",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/analytics/stress-test
// Perform portfolio stress testing with NAV decline scenarios (Operations/Admin only)
router.post("/analytics/stress-test", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    // Get all facilities with their prospect data for NAV information
    const facilitiesWithProspects = await db
      .select({
        facility: facilities,
        prospect: prospects,
      })
      .from(facilities)
      .leftJoin(prospects, eq(facilities.prospectId, prospects.id))
      .where(eq(facilities.status, "active"));

    if (facilitiesWithProspects.length === 0) {
      return res.json({
        baseline: { totalExposure: 0, avgLtv: 0, facilitiesAtRisk: 0, breachCount: 0 },
        moderate: { totalExposure: 0, avgLtv: 0, facilitiesAtRisk: 0, breachCount: 0, navDecline: 20 },
        severe: { totalExposure: 0, avgLtv: 0, facilitiesAtRisk: 0, breachCount: 0, navDecline: 40 },
        recommendations: [],
      });
    }

    // Calculate stress test scenarios
    const baselineMetrics = {
      totalExposure: 0,
      avgLtv: 0,
      facilitiesAtRisk: 0,
      breachCount: 0,
    };

    const moderateStressMetrics = {
      totalExposure: 0,
      avgLtv: 0,
      facilitiesAtRisk: 0,
      breachCount: 0,
      navDecline: 20,
    };

    const severeStressMetrics = {
      totalExposure: 0,
      avgLtv: 0,
      facilitiesAtRisk: 0,
      breachCount: 0,
      navDecline: 40,
    };

    const recommendations: Array<{
      facilityId: string;
      fundName: string;
      currentLtv: number;
      moderateStressLtv: number;
      severeStressLtv: number;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      recommendation: string;
    }> = [];

    let totalLtv = 0;
    let totalModerateLtv = 0;
    let totalSevereLtv = 0;

    for (const { facility, prospect } of facilitiesWithProspects) {
      const currentOutstanding = facility.outstandingBalance;
      const currentNav = prospect?.fundSize || (currentOutstanding * 100) / facility.ltvRatio; // Estimate NAV if not available

      baselineMetrics.totalExposure += currentOutstanding;

      // Baseline LTV
      const baselineLtv = (currentOutstanding / currentNav) * 100;
      totalLtv += baselineLtv;

      // Moderate stress: -20% NAV decline
      const moderateNav = currentNav * 0.80;
      const moderateLtv = (currentOutstanding / moderateNav) * 100;
      totalModerateLtv += moderateLtv;
      moderateStressMetrics.totalExposure += currentOutstanding;

      // Severe stress: -40% NAV decline
      const severeNav = currentNav * 0.60;
      const severeLtv = (currentOutstanding / severeNav) * 100;
      totalSevereLtv += severeLtv;
      severeStressMetrics.totalExposure += currentOutstanding;

      // Check for covenant breaches (assuming 70% LTV covenant)
      const ltvCovenantThreshold = 70;
      
      if (baselineLtv > ltvCovenantThreshold) {
        baselineMetrics.breachCount++;
        baselineMetrics.facilitiesAtRisk++;
      }

      if (moderateLtv > ltvCovenantThreshold) {
        moderateStressMetrics.breachCount++;
        moderateStressMetrics.facilitiesAtRisk++;
      }

      if (severeLtv > ltvCovenantThreshold) {
        severeStressMetrics.breachCount++;
        severeStressMetrics.facilitiesAtRisk++;
      }

      // Generate recommendations
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      let recommendation: string;

      if (severeLtv > 80) {
        riskLevel = 'critical';
        recommendation = `Immediate action required: LTV reaches ${severeLtv.toFixed(1)}% under severe stress. Consider reducing exposure or requiring additional collateral.`;
      } else if (moderateLtv > 75) {
        riskLevel = 'high';
        recommendation = `High risk: LTV reaches ${moderateLtv.toFixed(1)}% under moderate stress. Monitor closely and prepare contingency plans.`;
      } else if (moderateLtv > 70) {
        riskLevel = 'medium';
        recommendation = `Medium risk: LTV approaches covenant threshold under moderate stress. Increase monitoring frequency.`;
      } else {
        riskLevel = 'low';
        recommendation = `Low risk: Facility maintains healthy LTV (${moderateLtv.toFixed(1)}%) even under moderate stress.`;
      }

      recommendations.push({
        facilityId: facility.id,
        fundName: facility.fundName,
        currentLtv: Math.round(baselineLtv * 10) / 10,
        moderateStressLtv: Math.round(moderateLtv * 10) / 10,
        severeStressLtv: Math.round(severeLtv * 10) / 10,
        riskLevel,
        recommendation,
      });
    }

    const facilityCount = facilitiesWithProspects.length;
    baselineMetrics.avgLtv = Math.round((totalLtv / facilityCount) * 10) / 10;
    moderateStressMetrics.avgLtv = Math.round((totalModerateLtv / facilityCount) * 10) / 10;
    severeStressMetrics.avgLtv = Math.round((totalSevereLtv / facilityCount) * 10) / 10;

    res.json({
      baseline: baselineMetrics,
      moderate: moderateStressMetrics,
      severe: severeStressMetrics,
      recommendations: recommendations.sort((a, b) => {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }),
    });
  } catch (error) {
    console.error("Stress test error:", error);
    res.status(500).json({ 
      error: "Failed to perform stress test",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/analytics/concentration
// Get portfolio concentration analysis by sector, vintage, and GP (Operations/Admin only)
router.get("/analytics/concentration", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    // Get all facilities with their prospect data
    const facilitiesWithProspects = await db
      .select({
        facility: facilities,
        prospect: prospects,
      })
      .from(facilities)
      .leftJoin(prospects, eq(facilities.prospectId, prospects.id))
      .where(eq(facilities.status, "active"));

    if (facilitiesWithProspects.length === 0) {
      return res.json({
        bySector: [],
        byVintage: [],
        byGP: [],
        summary: {
          totalExposure: 0,
          mostConcentratedSector: null,
          mostConcentratedVintage: null,
          mostConcentratedGP: null,
          herfindahlIndex: 0,
        },
      });
    }

    const totalOutstanding = facilitiesWithProspects.reduce(
      (sum, { facility }) => sum + facility.outstandingBalance,
      0
    );

    // Sector concentration
    const sectorMap = new Map<string, { exposure: number; facilityCount: number }>();
    
    for (const { facility, prospect } of facilitiesWithProspects) {
      const sectors = (prospect?.sectors as string[]) || ['Unknown'];
      
      for (const sector of sectors) {
        const existing = sectorMap.get(sector) || { exposure: 0, facilityCount: 0 };
        sectorMap.set(sector, {
          exposure: existing.exposure + facility.outstandingBalance,
          facilityCount: existing.facilityCount + 1,
        });
      }
    }

    const bySector = Array.from(sectorMap.entries())
      .map(([sector, data]) => ({
        sector,
        exposure: data.exposure,
        facilityCount: data.facilityCount,
        percentage: (data.exposure / totalOutstanding) * 100,
      }))
      .sort((a, b) => b.exposure - a.exposure);

    // Vintage concentration
    const vintageMap = new Map<string, { exposure: number; facilityCount: number }>();
    
    for (const { facility, prospect } of facilitiesWithProspects) {
      const vintage = prospect?.vintage ? String(prospect.vintage) : 'Unknown';
      const existing = vintageMap.get(vintage) || { exposure: 0, facilityCount: 0 };
      vintageMap.set(vintage, {
        exposure: existing.exposure + facility.outstandingBalance,
        facilityCount: existing.facilityCount + 1,
      });
    }

    const byVintage = Array.from(vintageMap.entries())
      .map(([vintage, data]) => ({
        vintage,
        exposure: data.exposure,
        facilityCount: data.facilityCount,
        percentage: (data.exposure / totalOutstanding) * 100,
      }))
      .sort((a, b) => {
        if (a.vintage === 'Unknown') return 1;
        if (b.vintage === 'Unknown') return -1;
        return parseInt(b.vintage) - parseInt(a.vintage);
      });

    // GP concentration
    const gpMap = new Map<string, { exposure: number; facilityCount: number }>();
    
    for (const { facility, prospect } of facilitiesWithProspects) {
      const gp = prospect?.gpFirmName || 'Unknown';
      const existing = gpMap.get(gp) || { exposure: 0, facilityCount: 0 };
      gpMap.set(gp, {
        exposure: existing.exposure + facility.outstandingBalance,
        facilityCount: existing.facilityCount + 1,
      });
    }

    const byGP = Array.from(gpMap.entries())
      .map(([gp, data]) => ({
        gp,
        exposure: data.exposure,
        facilityCount: data.facilityCount,
        percentage: (data.exposure / totalOutstanding) * 100,
      }))
      .sort((a, b) => b.exposure - a.exposure);

    // Calculate Herfindahl-Hirschman Index (HHI) for sector concentration
    // HHI ranges from 0 to 10,000. Higher values indicate more concentration
    // HHI < 1,500: Unconcentrated, 1,500-2,500: Moderate, >2,500: High concentration
    const herfindahlIndex = bySector.reduce((sum, { percentage }) => {
      return sum + Math.pow(percentage, 2);
    }, 0);

    res.json({
      bySector,
      byVintage,
      byGP,
      summary: {
        totalExposure: totalOutstanding,
        mostConcentratedSector: bySector[0] || null,
        mostConcentratedVintage: byVintage[0] || null,
        mostConcentratedGP: byGP[0] || null,
        herfindahlIndex: Math.round(herfindahlIndex),
      },
    });
  } catch (error) {
    console.error("Concentration analysis error:", error);
    res.status(500).json({ 
      error: "Failed to analyze concentration",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/analytics/performance-metrics
// Get portfolio performance metrics: ROI, default rate, recovery rate (Operations/Admin only)
router.get("/analytics/performance-metrics", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    // Get all facilities (including historical ones)
    const allFacilities = await db.select().from(facilities);
    const allCashFlows = await db.select().from(cashFlows);

    if (allFacilities.length === 0) {
      return res.json({
        portfolioROI: {
          totalInvested: 0,
          totalInterestEarned: 0,
          totalPrincipalRepaid: 0,
          roi: 0,
          annualizedROI: 0,
        },
        defaultMetrics: {
          totalFacilities: 0,
          defaultedFacilities: 0,
          defaultRate: 0,
          totalDefaultedAmount: 0,
          recoveryRate: 0,
          totalRecoveredAmount: 0,
          netLoss: 0,
        },
        performanceByStatus: {},
      });
    }

    // Calculate total invested capital (all facilities ever originated)
    const totalInvested = allFacilities.reduce(
      (sum, f) => sum + f.principalAmount,
      0
    );

    // Calculate interest earned and principal repaid (from paid cash flows)
    // Cash flows contain both principal and interest in each payment
    const paidCashFlows = allCashFlows.filter(cf => cf.status === 'paid');
    
    const totalInterestEarned = paidCashFlows.reduce(
      (sum, cf) => sum + cf.interest,
      0
    );

    const totalPrincipalRepaid = paidCashFlows.reduce(
      (sum, cf) => sum + cf.principal,
      0
    );

    // Calculate ROI
    const totalReturns = totalInterestEarned + totalPrincipalRepaid;
    const roi = totalInvested > 0 ? ((totalReturns - totalInvested) / totalInvested) * 100 : 0;

    // Calculate annualized ROI (assuming average 3-year facility term)
    const avgTermYears = 3;
    const annualizedROI = roi / avgTermYears;

    // Default metrics
    const defaultedFacilities = allFacilities.filter(f => f.status === 'defaulted');
    const totalDefaultedAmount = defaultedFacilities.reduce(
      (sum, f) => sum + f.outstandingBalance,
      0
    );
    const defaultRate = allFacilities.length > 0 
      ? (defaultedFacilities.length / allFacilities.length) * 100 
      : 0;

    // Recovery rate calculation (recovered amount from defaulted facilities)
    // For defaulted facilities, check how much was recovered via payments
    let totalRecoveredAmount = 0;
    for (const defaultedFacility of defaultedFacilities) {
      const facilityCashFlows = allCashFlows.filter(cf => cf.facilityId === defaultedFacility.id);
      const recovered = facilityCashFlows.reduce((sum, cf) => sum + cf.paidAmount, 0);
      totalRecoveredAmount += recovered;
    }

    const recoveryRate = totalDefaultedAmount > 0 
      ? (totalRecoveredAmount / totalDefaultedAmount) * 100 
      : 0;

    const netLoss = totalDefaultedAmount - totalRecoveredAmount;

    // Performance by status
    const performanceByStatus: Record<string, {
      count: number;
      totalPrincipal: number;
      totalOutstanding: number;
      percentage: number;
    }> = {};

    for (const facility of allFacilities) {
      if (!performanceByStatus[facility.status]) {
        performanceByStatus[facility.status] = {
          count: 0,
          totalPrincipal: 0,
          totalOutstanding: 0,
          percentage: 0,
        };
      }
      performanceByStatus[facility.status].count++;
      performanceByStatus[facility.status].totalPrincipal += facility.principalAmount;
      performanceByStatus[facility.status].totalOutstanding += facility.outstandingBalance;
    }

    // Calculate percentages
    for (const status in performanceByStatus) {
      performanceByStatus[status].percentage = 
        (performanceByStatus[status].count / allFacilities.length) * 100;
    }

    res.json({
      portfolioROI: {
        totalInvested,
        totalInterestEarned,
        totalPrincipalRepaid,
        roi: Math.round(roi * 100) / 100,
        annualizedROI: Math.round(annualizedROI * 100) / 100,
      },
      defaultMetrics: {
        totalFacilities: allFacilities.length,
        defaultedFacilities: defaultedFacilities.length,
        defaultRate: Math.round(defaultRate * 100) / 100,
        totalDefaultedAmount,
        recoveryRate: Math.round(recoveryRate * 100) / 100,
        totalRecoveredAmount,
        netLoss,
      },
      performanceByStatus,
    });
  } catch (error) {
    console.error("Performance metrics error:", error);
    res.status(500).json({ 
      error: "Failed to calculate performance metrics",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ============================================================================
// BILLING & SUBSCRIPTIONS - Stripe Integration
// ============================================================================

import * as billing from "./billing";

// Get all subscription plans
router.get("/api/subscription-plans", async (req: Request, res: Response) => {
  try {
    const plans = await billing.getSubscriptionPlans();
    res.json(plans);
  } catch (error) {
    console.error("Get subscription plans error:", error);
    res.status(500).json({ error: "Failed to fetch subscription plans" });
  }
});

// Get current user's subscription
router.get("/api/subscription", async (req: Request, res: Response) => {
  try {
    if (!req.user || !('id' in req.user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const subscription = await billing.getUserSubscription(String(req.user.id));
    
    if (!subscription) {
      return res.json({ subscription: null });
    }

    res.json({ subscription });
  } catch (error) {
    console.error("Get subscription error:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

// Get usage summary for current billing period
router.get("/api/subscription/usage", async (req: Request, res: Response) => {
  try {
    if (!req.user || !('id' in req.user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const usage = await billing.getUsageSummary(String(req.user.id));
    
    if (!usage) {
      return res.json({ usage: null, message: "No active subscription" });
    }

    res.json(usage);
  } catch (error) {
    console.error("Get usage summary error:", error);
    res.status(500).json({ error: "Failed to fetch usage summary" });
  }
});

// Create Stripe checkout session for new subscription
router.post("/api/subscription/checkout", async (req: Request, res: Response) => {
  try {
    if (!req.user || !('id' in req.user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { tier } = req.body;
    
    if (!tier || !['starter', 'professional', 'enterprise'].includes(tier)) {
      return res.status(400).json({ error: "Invalid subscription tier" });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${req.get('host')}` 
      : `http://${req.get('host')}`;
    
    const session = await billing.createCheckoutSession(
      String(req.user.id),
      tier,
      `${baseUrl}/settings?subscription=success`,
      `${baseUrl}/settings?subscription=canceled`
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error("Create checkout session error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Create subscription directly (alternative to checkout)
router.post("/api/subscription", async (req: Request, res: Response) => {
  try {
    if (!req.user || !('id' in req.user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { tier } = req.body;
    
    if (!tier || !['starter', 'professional', 'enterprise'].includes(tier)) {
      return res.status(400).json({ error: "Invalid subscription tier" });
    }

    const result = await billing.createSubscription(String(req.user.id), tier);
    
    res.json(result);
  } catch (error) {
    console.error("Create subscription error:", error);
    res.status(500).json({ 
      error: "Failed to create subscription",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Update subscription (upgrade/downgrade)
router.put("/api/subscription", async (req: Request, res: Response) => {
  try {
    if (!req.user || !('id' in req.user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { tier } = req.body;
    
    if (!tier || !['starter', 'professional', 'enterprise'].includes(tier)) {
      return res.status(400).json({ error: "Invalid subscription tier" });
    }

    const subscription = await billing.updateSubscription(String(req.user.id), tier);
    
    res.json({ subscription });
  } catch (error) {
    console.error("Update subscription error:", error);
    res.status(500).json({ 
      error: "Failed to update subscription",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Cancel subscription
router.delete("/api/subscription", async (req: Request, res: Response) => {
  try {
    if (!req.user || !('id' in req.user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { cancelAtPeriodEnd = true } = req.body;
    
    const subscription = await billing.cancelSubscription(
      String(req.user.id),
      cancelAtPeriodEnd
    );
    
    res.json({ subscription });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ 
      error: "Failed to cancel subscription",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Create billing portal session (for customers to manage subscriptions)
router.post("/api/subscription/portal", async (req: Request, res: Response) => {
  try {
    if (!req.user || !('id' in req.user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${req.get('host')}` 
      : `http://${req.get('host')}`;

    const session = await billing.createBillingPortalSession(
      String(req.user.id),
      `${baseUrl}/settings`
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error("Create billing portal session error:", error);
    res.status(500).json({ 
      error: "Failed to create billing portal session",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get invoices for user
router.get("/api/invoices", async (req: Request, res: Response) => {
  try {
    if (!req.user || !('id' in req.user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const invoices = await billing.getUserInvoices(String(req.user.id));
    
    res.json({ invoices });
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// Stripe webhook handler (no authentication required)
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Helper function to handle Stripe webhook events
async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }

  let event;

  try {
    event = billing.stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}`);
  }

  // Handle different event types
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Update subscription status in database
        const subscription = event.data.object as any;
        await db
          .update(subscriptions)
          .set({
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
        break;

      case 'customer.subscription.deleted':
        // Mark subscription as canceled
        const deletedSub = event.data.object as any;
        await db
          .update(subscriptions)
          .set({
            status: 'canceled',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, deletedSub.id));

        // Remove subscription ID from user
        const [existingSub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, deletedSub.id));
        
        if (existingSub) {
          await db
            .update(users)
            .set({ stripeSubscriptionId: null })
            .where(eq(users.id, existingSub.userId));
        }
        break;

      case 'invoice.paid':
        // Record invoice in database
        const invoice = event.data.object as any;
        const [subForInvoice] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription));

        if (subForInvoice) {
          await db.insert(invoices).values({
            userId: subForInvoice.userId,
            subscriptionId: subForInvoice.id,
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: invoice.payment_intent || null,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'paid',
            invoiceNumber: invoice.number,
            invoicePdf: invoice.invoice_pdf,
            hostedInvoiceUrl: invoice.hosted_invoice_url,
            periodStart: new Date(invoice.period_start * 1000),
            periodEnd: new Date(invoice.period_end * 1000),
            paidAt: new Date(invoice.status_transitions.paid_at * 1000),
            dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
          }).onConflictDoNothing();
        }
        break;

      case 'invoice.payment_failed':
        // Handle failed payment - could send notification
        const failedInvoice = event.data.object as any;
        console.error('Payment failed for invoice:', failedInvoice.id);
        // TODO: Send email notification to user
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Export router as registerRoutes function for compatibility

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first
  await setupAuth(app);
  
  // Stripe webhook endpoint (MUST be BEFORE authentication middleware)
  // Stripe needs raw body for signature verification
  app.post("/api/webhooks/stripe", async (req, res) => {
    await handleStripeWebhook(req, res);
  });
  
  // Public marketing leads endpoint (NO auth required for contact form)
  // Note: Global rate limiting already applied in server/index.ts
  app.post("/api/leads", async (req: Request, res: Response) => {
    try {
      // Validate request body with Zod schema
      const validatedData = insertLeadSchema.parse(req.body);

      // Create lead with validated data
      const [lead] = await db.insert(leads).values({
        ...validatedData,
        status: "new",
        source: "website",
      }).returning();

      res.json({ success: true, leadId: lead.id });
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      console.error("Create lead error:", error);
      res.status(500).json({ error: "Failed to submit lead" });
    }
  });
  
  // Apply authentication middleware to ALL routes under /api
  // This ensures no route can be accessed without authentication
  app.use("/api", isAuthenticated, router);
  
  // Create and return HTTP server
  const server = createServer(app);
  return server;
}

// Marketing Leads Routes (authenticated)
// GET /api/leads
// List all leads (Operations/Admin only)
router.get("/leads", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only operations and admin can view leads
    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    const allLeads = await db.select().from(leads).orderBy(sql`${leads.createdAt} DESC`);
    res.json(allLeads);
  } catch (error) {
    console.error("List leads error:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// PATCH /api/leads/:id
// Update lead status (Operations/Admin only)
router.patch("/leads/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only operations and admin can update leads
    if (req.user.role !== "operations" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Operations or admin role required" });
    }

    const { id } = req.params;
    const { status, assignedTo } = req.body;

    const [updated] = await db
      .update(leads)
      .set({ 
        status, 
        assignedTo: assignedTo || null,
        updatedAt: new Date() 
      })
      .where(eq(leads.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update lead error:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

