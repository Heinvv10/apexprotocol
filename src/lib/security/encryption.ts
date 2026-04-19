/**
 * Encryption Module (F142)
 * AES-256-GCM encryption for sensitive data like API keys
 *
 * Uses environment variable ENCRYPTION_KEY for the secret key.
 * In production, this should be a 32-byte (256-bit) hex-encoded key.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash, timingSafeEqual } from "crypto";
import { logger } from "@/lib/logger";

// Constants
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get or derive the encryption key from environment
 * Uses ENCRYPTION_KEY env var, or derives from a fallback for development/test
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;

  if (envKey) {
    // If it's a hex-encoded key (64 characters for 32 bytes)
    if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
      return Buffer.from(envKey, "hex");
    }
    // Otherwise, derive a key from it using SHA-256
    return createHash("sha256").update(envKey).digest();
  }

  // Development/Test fallback - WARNING: Not secure for production
  // Allows development and testing without explicit env var
  if (process.env.NODE_ENV !== "production") {
    const devKey = "apex-dev-encryption-key-not-for-production";
    return createHash("sha256").update(devKey).digest();
  }

  throw new Error(
    "ENCRYPTION_KEY environment variable is required in production. " +
      "Generate one with: node -e \"logger.info(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

/**
 * Encrypt a string value using AES-256-GCM
 *
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted value (format: iv:authTag:ciphertext)
 *
 * @example
 * const encrypted = encrypt("my-secret-api-key");
 * // Returns something like: "abc123...xyz789" (base64)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty value");
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine IV + AuthTag + Ciphertext into a single buffer
  const combined = Buffer.concat([iv, authTag, encrypted]);

  // Return as base64 for storage
  return combined.toString("base64");
}

/**
 * Decrypt a string value encrypted with encrypt()
 *
 * @param ciphertext - Base64-encoded encrypted value from encrypt()
 * @returns The original plaintext string
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 *
 * @example
 * const decrypted = decrypt(encryptedValue);
 * // Returns: "my-secret-api-key"
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error("Cannot decrypt empty value");
  }

  const key = getEncryptionKey();
  const combined = Buffer.from(ciphertext, "base64");

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Create a SHA-256 hash of a value
 * Useful for verification without needing to decrypt
 *
 * @param value - The string to hash
 * @returns Hex-encoded SHA-256 hash
 */
export function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Check if a value matches a hash
 *
 * @param value - The plaintext value to check
 * @param expectedHash - The expected hash to compare against
 * @returns true if the value matches the hash
 */
export function verifyHash(value: string, expectedHash: string): boolean {
  const computed = Buffer.from(hash(value), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (computed.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(computed, expected);
}

/**
 * Generate a secure random key for encryption
 * Use this to generate an ENCRYPTION_KEY for .env
 *
 * @returns Hex-encoded 256-bit random key
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString("hex");
}

/**
 * Mask an API key for display purposes
 * Shows first 4 and last 4 characters, masks the rest
 *
 * @param apiKey - The API key to mask
 * @returns Masked version like "sk-a...xyz1"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) {
    return "****";
  }
  const first = apiKey.slice(0, 4);
  const last = apiKey.slice(-4);
  return `${first}...${last}`;
}

/**
 * Encrypt API key within a config object
 * Returns a new config object with encrypted apiKey
 */
export function encryptConfigApiKey<
  T extends { apiKey?: string; [key: string]: unknown }
>(config: T): T & { apiKeyEncrypted?: boolean; apiKeyHash?: string } {
  if (!config.apiKey) {
    return config;
  }

  const encryptedKey = encrypt(config.apiKey);
  const keyHash = hash(config.apiKey);

  return {
    ...config,
    apiKey: encryptedKey,
    apiKeyEncrypted: true,
    apiKeyHash: keyHash,
  };
}

/**
 * Decrypt API key within a config object
 * Returns a new config object with decrypted apiKey
 */
export function decryptConfigApiKey<
  T extends { apiKey?: string; apiKeyEncrypted?: boolean; [key: string]: unknown }
>(config: T): Omit<T, "apiKeyEncrypted" | "apiKeyHash"> {
  if (!config.apiKey || !config.apiKeyEncrypted) {
    const { apiKeyEncrypted: _enc, apiKeyHash: _hash, ...rest } = config;
    return rest;
  }

  const decryptedKey = decrypt(config.apiKey);
  const { apiKeyEncrypted: _enc, apiKeyHash: _hash, ...rest } = config;

  return {
    ...rest,
    apiKey: decryptedKey,
  };
}

/**
 * Mask API key within a config object for safe display
 * Returns a new config object with masked apiKey (never the real key)
 */
export function maskConfigApiKey<
  T extends { apiKey?: string; apiKeyEncrypted?: boolean; [key: string]: unknown }
>(config: T): T {
  if (!config.apiKey) {
    return config;
  }

  // If encrypted, decrypt first then mask
  let actualKey: string;
  if (config.apiKeyEncrypted) {
    try {
      actualKey = decrypt(config.apiKey);
    } catch {
      // If decryption fails, just mask the encrypted value
      return {
        ...config,
        apiKey: "****",
      };
    }
  } else {
    actualKey = config.apiKey;
  }

  return {
    ...config,
    apiKey: maskApiKey(actualKey),
  };
}

// Export all encryption utilities
export const encryption = {
  encrypt,
  decrypt,
  hash,
  verifyHash,
  generateKey: generateEncryptionKey,
  maskApiKey,
  encryptConfigApiKey,
  decryptConfigApiKey,
  maskConfigApiKey,
};
