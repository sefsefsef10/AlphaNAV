import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { 
  prospects, 
  uploadedDocuments,
  facilities,
  covenants,
  advisorDeals,
  lenderInvitations,
  drawRequests,
  cashFlows,
  users,
  notifications,
  type InsertProspect,
  type InsertUploadedDocument,
  type InsertFacility,
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

    res.json({
      prospect,
      message: "Prospect created successfully from extraction",
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

    const [facility] = await db.select()
      .from(facilities)
      .where(eq(facilities.id, id))
      .limit(1);

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

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

    // Get facility data
    const [facility] = await db.select()
      .from(facilities)
      .where(eq(facilities.id, id))
      .limit(1);

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

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

    // Validate facility exists and is active
    const [facility] = await db.select()
      .from(facilities)
      .where(eq(facilities.id, facilityId))
      .limit(1);

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    // Verify facility is active (cannot request draws on closed facilities)
    if (facility.status !== "active") {
      return res.status(403).json({ 
        error: "Forbidden: Cannot request draws on non-active facilities",
        facilityStatus: facility.status
      });
    }

    // TODO: SECURITY ENHANCEMENT NEEDED
    // The facilities table currently lacks a gpUserId field to track ownership.
    // This means any GP can theoretically submit draw requests for any facility.
    // Production deployment requires adding a gpUserId field to facilities table
    // and validating: facility.gpUserId === req.user.id
    // For MVP: Rely on UI-level access controls and facility ID obscurity
    // JIRA ticket: https://jira.example.com/browse/SEC-XXX

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
          message: `Draw request for $${(validation.data.requestedAmount / 100).toLocaleString()} submitted for ${facility.fundName} by ${req.user.email}`,
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

    // Validate facility exists
    const [facility] = await db.select()
      .from(facilities)
      .where(eq(facilities.id, facilityId))
      .limit(1);

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
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

    // Validate facility exists
    const [facility] = await db.select()
      .from(facilities)
      .where(eq(facilities.id, facilityId))
      .limit(1);

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
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
        ...covenantHealth,
        percentage: covenantHealthPercentage,
      },
      paymentPerformance: {
        ...paymentPerformance,
        amounts: {
          totalPaid: totalPaidAmount,
          totalOverdue: totalOverdueAmount,
          totalScheduled: totalScheduledAmount,
        },
      },
      riskMetrics: {
        riskScore: Math.round(riskScore),
        riskLevel,
        upcomingMaturities,
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

// Export router as registerRoutes function for compatibility
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first
  await setupAuth(app);
  
  // Apply authentication middleware to ALL routes under /api
  // This ensures no route can be accessed without authentication
  app.use("/api", isAuthenticated, router);
  
  // Create and return HTTP server
  const server = createServer(app);
  return server;
}
