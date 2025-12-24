/**
 * API Key Encryption Module
 *
 * Provides specialized functions for encrypting/decrypting API keys
 * with JSON format storage containing ciphertext, iv, and authTag.
 *
 * Uses AES-256-GCM authenticated encryption for data protection.
 * The encryption key is loaded from the ENCRYPTION_KEY environment variable.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

// Constants
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Structure for encrypted API key data stored in database
 */
export interface EncryptedApiKeyData {
  ciphertext: string; // hex encoded
  iv: string; // hex encoded (12 bytes)
  authTag: string; // hex encoded (16 bytes)
}

/**
 * Error thrown when decryption fails due to tampered data or wrong key
 */
export class ApiKeyDecryptionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "ApiKeyDecryptionError";
  }
}

/**
 * Error thrown when encrypted data format is invalid
 */
export class InvalidEncryptedDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidEncryptedDataError";
  }
}

// Cached encryption key for performance
let cachedEncryptionKey: Buffer | null = null;

/**
 * Get or derive the encryption key from environment
 *
 * Uses ENCRYPTION_KEY env var, or derives from a fallback for development/test.
 * In production, requires a 64-character hex-encoded key (32 bytes).
 *
 * @throws Error if ENCRYPTION_KEY is not set in production
 */
function getEncryptionKey(): Buffer {
  // Return cached key if available
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  const envKey = process.env.ENCRYPTION_KEY;

  if (envKey) {
    // If it's a hex-encoded key (64 characters for 32 bytes)
    if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
      cachedEncryptionKey = Buffer.from(envKey, "hex");
      return cachedEncryptionKey;
    }
    // Otherwise, derive a key from it using SHA-256
    cachedEncryptionKey = createHash("sha256").update(envKey).digest();
    return cachedEncryptionKey;
  }

  // Development/Test fallback - WARNING: Not secure for production
  if (process.env.NODE_ENV !== "production") {
    const devKey = "apex-dev-encryption-key-not-for-production";
    cachedEncryptionKey = createHash("sha256").update(devKey).digest();
    return cachedEncryptionKey;
  }

  throw new Error(
    "ENCRYPTION_KEY environment variable is required in production. " +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

/**
 * Clear the cached encryption key
 *
 * Primarily useful for testing when switching between encryption keys.
 */
export function clearEncryptionKeyCache(): void {
  cachedEncryptionKey = null;
}

/**
 * Encrypt an API key using AES-256-GCM
 *
 * Returns a JSON string containing the ciphertext, IV, and authentication tag.
 * Each encryption operation generates a unique IV for security.
 *
 * @param apiKey - The plaintext API key to encrypt
 * @returns JSON string with format: {"ciphertext":"...","iv":"...","authTag":"..."}
 *
 * @example
 * const encrypted = encryptApiKey("apx_abc123...");
 * // Returns: '{"ciphertext":"f8d2...","iv":"a1b2...","authTag":"c3d4..."}'
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey) {
    throw new Error("Cannot encrypt empty API key");
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let ciphertext = cipher.update(apiKey, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  const encryptedData: EncryptedApiKeyData = {
    ciphertext,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };

  return JSON.stringify(encryptedData);
}

/**
 * Decrypt an API key encrypted with encryptApiKey()
 *
 * Parses the JSON string and decrypts using AES-256-GCM.
 * Verifies the authentication tag to ensure data integrity.
 *
 * @param encryptedJson - JSON string from encryptApiKey()
 * @returns The original plaintext API key
 * @throws InvalidEncryptedDataError if the JSON is malformed or missing fields
 * @throws ApiKeyDecryptionError if decryption fails (wrong key, tampered data)
 *
 * @example
 * const apiKey = decryptApiKey(encryptedJson);
 * // Returns: "apx_abc123..."
 */
export function decryptApiKey(encryptedJson: string): string {
  if (!encryptedJson) {
    throw new InvalidEncryptedDataError("Cannot decrypt empty value");
  }

  // Parse and validate the encrypted data
  const encryptedData = parseEncryptedData(encryptedJson);

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(encryptedData.iv, "hex");
    const authTag = Buffer.from(encryptedData.authTag, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    // CRITICAL: Set auth tag BEFORE calling update()
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(encryptedData.ciphertext, "hex", "utf8");
    plaintext += decipher.final("utf8"); // Throws if auth tag verification fails

    return plaintext;
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof InvalidEncryptedDataError) {
      throw error;
    }
    if (error instanceof ApiKeyDecryptionError) {
      throw error;
    }

    // Handle crypto errors (wrong key, tampered data)
    const cryptoError = error as Error;
    throw new ApiKeyDecryptionError(
      "Failed to decrypt API key: authentication tag verification failed. " +
        "This may indicate tampered data or an incorrect encryption key.",
      cryptoError
    );
  }
}

/**
 * Parse and validate encrypted data JSON
 *
 * @param encryptedJson - JSON string to parse
 * @returns Validated EncryptedApiKeyData object
 * @throws InvalidEncryptedDataError if format is invalid
 */
export function parseEncryptedData(encryptedJson: string): EncryptedApiKeyData {
  let parsed: unknown;

  try {
    parsed = JSON.parse(encryptedJson);
  } catch {
    throw new InvalidEncryptedDataError(
      "Invalid encrypted data: not valid JSON"
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new InvalidEncryptedDataError(
      "Invalid encrypted data: expected JSON object"
    );
  }

  const data = parsed as Record<string, unknown>;

  // Validate required fields
  if (typeof data.ciphertext !== "string" || !data.ciphertext) {
    throw new InvalidEncryptedDataError(
      "Invalid encrypted data: missing or invalid 'ciphertext' field"
    );
  }

  if (typeof data.iv !== "string" || !data.iv) {
    throw new InvalidEncryptedDataError(
      "Invalid encrypted data: missing or invalid 'iv' field"
    );
  }

  if (typeof data.authTag !== "string" || !data.authTag) {
    throw new InvalidEncryptedDataError(
      "Invalid encrypted data: missing or invalid 'authTag' field"
    );
  }

  // Validate hex format
  if (!/^[0-9a-fA-F]+$/.test(data.ciphertext)) {
    throw new InvalidEncryptedDataError(
      "Invalid encrypted data: 'ciphertext' must be hex-encoded"
    );
  }

  if (!/^[0-9a-fA-F]+$/.test(data.iv)) {
    throw new InvalidEncryptedDataError(
      "Invalid encrypted data: 'iv' must be hex-encoded"
    );
  }

  if (!/^[0-9a-fA-F]+$/.test(data.authTag)) {
    throw new InvalidEncryptedDataError(
      "Invalid encrypted data: 'authTag' must be hex-encoded"
    );
  }

  // Validate expected lengths (IV should be 24 hex chars = 12 bytes, authTag should be 32 hex chars = 16 bytes)
  if (data.iv.length !== IV_LENGTH * 2) {
    throw new InvalidEncryptedDataError(
      `Invalid encrypted data: 'iv' should be ${IV_LENGTH * 2} hex characters (${IV_LENGTH} bytes)`
    );
  }

  if (data.authTag.length !== AUTH_TAG_LENGTH * 2) {
    throw new InvalidEncryptedDataError(
      `Invalid encrypted data: 'authTag' should be ${AUTH_TAG_LENGTH * 2} hex characters (${AUTH_TAG_LENGTH} bytes)`
    );
  }

  return {
    ciphertext: data.ciphertext,
    iv: data.iv,
    authTag: data.authTag,
  };
}

/**
 * Check if a value appears to be an encrypted API key JSON
 *
 * Does not validate decryptability, only checks JSON structure.
 *
 * @param value - The string to check
 * @returns true if the value appears to be encrypted API key data
 */
export function isEncryptedApiKeyData(value: string): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  try {
    parseEncryptedData(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Re-encrypt an API key with a fresh IV
 *
 * Useful for key rotation operations where you want to update the encryption
 * without changing the underlying API key.
 *
 * @param encryptedJson - Current encrypted JSON from encryptApiKey()
 * @returns New encrypted JSON with fresh IV
 * @throws InvalidEncryptedDataError if input is invalid
 * @throws ApiKeyDecryptionError if decryption fails
 */
export function reEncryptApiKey(encryptedJson: string): string {
  const plaintext = decryptApiKey(encryptedJson);
  return encryptApiKey(plaintext);
}

/**
 * Safely attempt to decrypt, returning null on failure
 *
 * Useful when you want to handle decryption failures gracefully
 * without throwing exceptions.
 *
 * @param encryptedJson - JSON string from encryptApiKey()
 * @returns The decrypted API key, or null if decryption failed
 */
export function tryDecryptApiKey(encryptedJson: string): string | null {
  try {
    return decryptApiKey(encryptedJson);
  } catch {
    return null;
  }
}

// Export constants for external use
export const API_KEY_ENCRYPTION_CONSTANTS = {
  ALGORITHM,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
  KEY_LENGTH,
} as const;

// Default export for convenience
export const apiKeyEncryption = {
  encrypt: encryptApiKey,
  decrypt: decryptApiKey,
  parseEncryptedData,
  isEncryptedApiKeyData,
  reEncrypt: reEncryptApiKey,
  tryDecrypt: tryDecryptApiKey,
  clearCache: clearEncryptionKeyCache,
  constants: API_KEY_ENCRYPTION_CONSTANTS,
  errors: {
    ApiKeyDecryptionError,
    InvalidEncryptedDataError,
  },
};
