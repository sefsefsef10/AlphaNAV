import { Router, type Request, type Response } from "express";
import multer from "multer";
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

    // Upload files to object storage (using PUBLIC_OBJECT_SEARCH_PATHS for now)
    // In production, files would be uploaded to proper storage bucket
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        // For now, simulate storage URL (in production, upload to object storage)
        const storageUrl = `/uploads/${Date.now()}_${file.originalname}`;
        
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

export default router;
