import { Router, type Request, type Response } from "express";
import multer from "multer";
import fs from "fs/promises";
import { createDocumentBatch, getBatchStatus } from "../services/batchDocumentProcessor";

const router = Router();

// Configure multer for multi-file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 50, // Max 50 files per batch
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

// POST /api/documents/batch - Upload multiple documents
router.post("/batch", upload.array("files", 50), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    const { sessionId, facilityId, prospectId } = req.body;

    // Create uploads directory if it doesn't exist
    const uploadsDir = "./uploads";
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Save files to disk and prepare for processing
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const timestamp = Date.now();
        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageUrl = `${uploadsDir}/${timestamp}_${safeFileName}`;
        
        // Write file to disk
        await fs.writeFile(storageUrl, file.buffer);
        
        return {
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          buffer: file.buffer,
          storageUrl,
        };
      })
    );

    const result = await createDocumentBatch({
      uploadedBy: req.user.id,
      sessionId,
      facilityId,
      prospectId,
      files: processedFiles,
    });

    res.json({
      success: true,
      batchId: result.batchId,
      uploadedCount: result.documentIds.length,
      duplicateCount: result.duplicates.length,
      documentIds: result.documentIds,
      duplicates: result.duplicates,
      message: `Successfully queued ${result.documentIds.length} documents for processing`,
    });
  } catch (error) {
    console.error("Batch upload error:", error);
    res.status(500).json({
      error: "Failed to upload batch",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/documents/batch/:batchId - Get batch status
router.get("/batch/:batchId", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { batchId } = req.params;
    const status = await getBatchStatus(batchId);

    res.json(status);
  } catch (error) {
    console.error("Get batch status error:", error);
    res.status(500).json({
      error: "Failed to get batch status",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/documents/batch/recent - Get recent batches
router.get("/batch/recent", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { db } = await import("../db");
    const { uploadedDocumentBatches } = await import("@shared/schema");
    const { sql } = await import("drizzle-orm");
    
    const batches = await db
      .select()
      .from(uploadedDocumentBatches)
      .orderBy(sql`${uploadedDocumentBatches.createdAt} DESC`)
      .limit(20);
    
    res.json(batches);
  } catch (error) {
    console.error("Get recent batches error:", error);
    res.status(500).json({
      error: "Failed to get recent batches",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
