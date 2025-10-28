/**
 * Secure File Storage Service
 * 
 * Handles secure file uploads with:
 * - Magic byte validation (file signature checking)
 * - Filename sanitization  
 * - Secure storage persistence
 * - File type verification
 */

import path from "path";
import crypto from "crypto";
import fs from "fs/promises";

// Magic bytes for supported file types
const FILE_SIGNATURES = {
  PDF: Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
  DOCX: Buffer.from([0x50, 0x4B, 0x03, 0x04]), // PK.. (ZIP format)
  DOC: Buffer.from([0xD0, 0xCF, 0x11, 0xE0]), // CFBF (Compound File Binary Format)
  XLSX: Buffer.from([0x50, 0x4B, 0x03, 0x04]), // PK.. (ZIP format, same as DOCX)
  XLS: Buffer.from([0xD0, 0xCF, 0x11, 0xE0]), // CFBF (Compound File Binary Format, same as DOC)
};

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export interface SecureFileUpload {
  filename: string; // Sanitized filename
  originalFilename: string;
  mimeType: string;
  size: number;
  storageUrl: string; // Actual storage path
  checksum: string; // SHA256 hash
}

/**
 * Validate file type using magic bytes (file signature)
 */
export function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  // PDF validation
  if (mimeType === "application/pdf") {
    return buffer.slice(0, 4).equals(FILE_SIGNATURES.PDF);
  }
  
  // DOCX and XLSX validation (both are ZIP files)
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return buffer.slice(0, 4).equals(FILE_SIGNATURES.DOCX);
  }
  
  // Legacy DOC and XLS validation (both use CFBF format)
  if (mimeType === "application/msword" ||
      mimeType === "application/vnd.ms-excel") {
    return buffer.slice(0, 4).equals(FILE_SIGNATURES.DOC);
  }
  
  return false;
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  // Get only the basename (removes any path components)
  const basename = path.basename(filename);
  
  // Remove any non-alphanumeric characters except dots, hyphens, and underscores
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, "_");
  
  // Add timestamp to prevent conflicts
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString("hex");
  const ext = path.extname(sanitized);
  const nameWithoutExt = path.basename(sanitized, ext);
  
  return `${nameWithoutExt}_${timestamp}_${randomSuffix}${ext}`;
}

/**
 * Calculate SHA256 checksum for deduplication
 */
export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Store file securely with validation
 */
export async function storeFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
  sessionId: string
): Promise<SecureFileUpload> {
  // Validate MIME type is allowed
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`File type not allowed: ${mimeType}`);
  }
  
  // Validate file signature (magic bytes)
  if (!validateFileSignature(buffer, mimeType)) {
    throw new Error(`File signature does not match declared type: ${mimeType}`);
  }
  
  // Sanitize filename
  const filename = sanitizeFilename(originalFilename);
  
  // Calculate checksum
  const checksum = calculateChecksum(buffer);
  
  // Create storage directory if it doesn't exist
  const storageDir = path.join(process.cwd(), "storage", "documents", sessionId);
  await fs.mkdir(storageDir, { recursive: true });
  
  // Write file to storage
  const storageUrl = path.join(storageDir, filename);
  await fs.writeFile(storageUrl, buffer);
  
  return {
    filename,
    originalFilename,
    mimeType,
    size: buffer.length,
    storageUrl,
    checksum,
  };
}

/**
 * Read file from storage
 */
export async function readFile(storageUrl: string): Promise<Buffer> {
  return await fs.readFile(storageUrl);
}

/**
 * Delete file from storage
 */
export async function deleteFile(storageUrl: string): Promise<void> {
  try {
    await fs.unlink(storageUrl);
  } catch (error) {
    console.error(`Failed to delete file: ${storageUrl}`, error);
  }
}
