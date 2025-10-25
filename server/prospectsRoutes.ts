import { type Router, type Request, type Response } from "express";
import { db } from "./db";
import { 
  prospects, 
  uploadedDocuments,
  type InsertProspect,
} from "@shared/schema";
import { extractFromFile, type ExtractionResult } from "./services/aiExtraction";
import multer from "multer";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export function registerProspectsRoutes(app: Router) {
  // POST /api/prospects/upload-and-extract
  // Upload a document and extract fund data using AI
  app.post("/api/prospects/upload-and-extract", upload.single("document"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = (req.user as any).claims?.sub;
      const file = req.file;

      // Store file in object storage (.private directory)
      const fileName = `${Date.now()}-${file.originalname}`;
      const storagePath = path.join(process.env.PRIVATE_OBJECT_DIR!, "documents", fileName);
      
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
  app.post("/api/prospects/from-extraction", async (req: Request, res: Response) => {
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
  app.get("/api/prospects", async (req: Request, res: Response) => {
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
  app.get("/api/prospects/:id", async (req: Request, res: Response) => {
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
  app.patch("/api/prospects/:id", async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const updates = req.body;

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
  app.delete("/api/prospects/:id", async (req: Request, res: Response) => {
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
}
