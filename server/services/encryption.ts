import crypto from "crypto";

// Validate encryption key exists and is properly formatted
function getEncryptionKey(): Buffer {
  const key = process.env.MFA_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      "FATAL: MFA_ENCRYPTION_KEY environment variable is not set. " +
      "MFA cannot function without a persistent encryption key. " +
      "Generate a key with: openssl rand -hex 32"
    );
  }

  // Key must be exactly 64 hex characters (32 bytes)
  if (key.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      `FATAL: MFA_ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes). ` +
      `Current length: ${key.length}. Generate a valid key with: openssl rand -hex 32`
    );
  }

  return Buffer.from(key, "hex");
}

// Initialize key buffer (will throw if invalid/missing)
const KEY_BUFFER = getEncryptionKey();

console.log("✓ MFA encryption key validated successfully");

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(plaintext: string): string {
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.randomBytes(12);
  
  // Create cipher
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY_BUFFER, iv);
  
  // Encrypt
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // Get auth tag
  const authTag = cipher.getAuthTag();
  
  // Combine IV + authTag + encrypted (all in hex)
  // Format: iv(24 chars) + authTag(32 chars) + encrypted
  return iv.toString("hex") + authTag.toString("hex") + encrypted;
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export function decrypt(ciphertext: string): string {
  try {
    // Extract IV (first 24 hex chars = 12 bytes)
    const iv = Buffer.from(ciphertext.slice(0, 24), "hex");
    
    // Extract auth tag (next 32 hex chars = 16 bytes)
    const authTag = Buffer.from(ciphertext.slice(24, 56), "hex");
    
    // Extract encrypted data (rest)
    const encrypted = ciphertext.slice(56);
    
    // Create decipher
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY_BUFFER, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    throw new Error("Decryption failed - data may be corrupted");
  }
}
