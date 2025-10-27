import { db } from "../db";
import {
  uploadedDocuments,
  uploadedDocumentBatches,
  documentProcessingJobs,
  type InsertUploadedDocument,
  type InsertDocumentProcessingJob,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// In-memory job queue (consider BullMQ/Redis for production)
class JobQueue {
  private queue: Array<{ id: string; job: any; priority: number }> = [];
  private processing = false;
  private processors: Map<string, (job: any) => Promise<void>> = new Map();

  register(jobType: string, processor: (job: any) => Promise<void>) {
    this.processors.set(jobType, processor);
  }

  async enqueue(job: any) {
    this.queue.push({ id: job.id, job, priority: job.priority || 5 });
    this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first
    
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const { job } = this.queue.shift()!;

    try {
      await this.processJob(job);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
    }

    // Continue processing
    setTimeout(() => this.processQueue(), 100);
  }

  private async processJob(job: any) {
    const processor = this.processors.get(job.jobType);
    if (!processor) {
      console.error(`No processor found for job type: ${job.jobType}`);
      return;
    }

    // Update job status to processing
    await db.update(documentProcessingJobs)
      .set({
        status: "processing",
        processingStartedAt: new Date(),
        attempts: job.attempts + 1,
      })
      .where(eq(documentProcessingJobs.id, job.id));

    try {
      await processor(job);

      // Mark as completed
      await db.update(documentProcessingJobs)
        .set({
          status: "completed",
          processingCompletedAt: new Date(),
        })
        .where(eq(documentProcessingJobs.id, job.id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if should retry
      const shouldRetry = job.attempts + 1 < job.maxAttempts;
      
      await db.update(documentProcessingJobs)
        .set({
          status: shouldRetry ? "queued" : "failed",
          error: errorMessage,
          processingCompletedAt: shouldRetry ? null : new Date(),
        })
        .where(eq(documentProcessingJobs.id, job.id));

      // Re-enqueue if retry
      if (shouldRetry) {
        const [updatedJob] = await db.select()
          .from(documentProcessingJobs)
          .where(eq(documentProcessingJobs.id, job.id));
        
        if (updatedJob) {
          setTimeout(() => this.enqueue(updatedJob), 5000); // Retry after 5s
        }
      }

      throw error;
    }
  }
}

export const jobQueue = new JobQueue();

// Calculate SHA256 checksum for file deduplication
export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Create a batch and upload multiple documents
export async function createDocumentBatch(params: {
  uploadedBy: string;
  sessionId?: string;
  facilityId?: string;
  prospectId?: string;
  files: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    buffer: Buffer;
    storageUrl: string;
  }>;
}): Promise<{
  batchId: string;
  documentIds: string[];
  duplicates: string[];
}> {
  const { uploadedBy, sessionId, facilityId, prospectId, files } = params;

  // Create batch record
  const [batch] = await db.insert(uploadedDocumentBatches)
    .values({
      uploadedBy,
      sessionId,
      facilityId,
      prospectId,
      totalFiles: files.length,
      status: "uploading",
    })
    .returning();

  const documentIds: string[] = [];
  const duplicates: string[] = [];

  // Process each file
  for (const file of files) {
    const checksum = calculateChecksum(file.buffer);

    // Check for duplicates
    const existing = await db.select()
      .from(uploadedDocuments)
      .where(eq(uploadedDocuments.checksum, checksum))
      .limit(1);

    if (existing.length > 0) {
      duplicates.push(file.fileName);
      continue;
    }

    // Insert document
    const [doc] = await db.insert(uploadedDocuments)
      .values({
        batchId: batch.id,
        sessionId,
        facilityId,
        prospectId,
        uploadedBy,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        storageUrl: file.storageUrl,
        checksum,
        storageProvider: "replit",
        processingStatus: "pending",
      })
      .returning();

    documentIds.push(doc.id);

    // Create processing job for data extraction
    const [job] = await db.insert(documentProcessingJobs)
      .values({
        batchId: batch.id,
        documentId: doc.id,
        jobType: "extract_data",
        priority: 5,
      })
      .returning();

    // Enqueue job
    await jobQueue.enqueue(job);
  }

  // Update batch status
  await db.update(uploadedDocumentBatches)
    .set({
      status: "processing",
      processedFiles: 0,
    })
    .where(eq(uploadedDocumentBatches.id, batch.id));

  return {
    batchId: batch.id,
    documentIds,
    duplicates,
  };
}

// Get batch status
export async function getBatchStatus(batchId: string) {
  const [batch] = await db.select()
    .from(uploadedDocumentBatches)
    .where(eq(uploadedDocumentBatches.id, batchId));

  if (!batch) {
    throw new Error("Batch not found");
  }

  const jobs = await db.select()
    .from(documentProcessingJobs)
    .where(eq(documentProcessingJobs.batchId, batchId));

  const documents = await db.select()
    .from(uploadedDocuments)
    .where(eq(uploadedDocuments.batchId, batchId));

  return {
    batch,
    jobs,
    documents,
    progress: {
      total: batch.totalFiles,
      processed: batch.processedFiles,
      failed: batch.failedFiles,
      pending: batch.totalFiles - batch.processedFiles - batch.failedFiles,
    },
  };
}
