import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { 
  prospects, 
  uploadedDocuments,
  facilities,
  covenants,
  advisorDeals,
  lenderInvitations,
  type InsertProspect,
  type InsertUploadedDocument,
  type InsertFacility,
  type InsertCovenant,
  type InsertAdvisorDeal,
  type InsertLenderInvitation,
  insertProspectSchema,
  insertFacilitySchema,
  insertCovenantSchema,
  insertAdvisorDealSchema,
  insertLenderInvitationSchema,
} from "@shared/schema";
import { extractFromFile, type ExtractionResult } from "./services/aiExtraction";
import multer from "multer";
import { eq } from "drizzle-orm";
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

    // Validate object storage configuration
    const storageRoot = process.env.PRIVATE_OBJECT_DIR;
    if (!storageRoot) {
      console.error("PRIVATE_OBJECT_DIR environment variable not configured");
      return res.status(500).json({ 
        error: "Server configuration error",
        details: "Object storage not configured"
      });
    }

    // Store file in object storage (.private directory)
    const fileName = `${Date.now()}-${file.originalname}`;
    const storagePath = path.join(storageRoot, "documents", fileName);
    
    // Ensure directory exists
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

// Export router as registerRoutes function for compatibility
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first
  await setupAuth(app);
  
  // Register all prospect routes under /api prefix
  app.use("/api", router);
  
  // Create and return HTTP server
  const server = createServer(app);
  return server;
}
