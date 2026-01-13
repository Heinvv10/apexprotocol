/**
 * API Key Generation Module
 *
 * Provides utilities for generating user API keys with secure random bytes,
 * hashing keys for database lookup, and related cryptographic operations.
 *
 * All user-generated API keys use the `apx_` prefix format.
 *
 * Uses Web Crypto API for Edge Runtime compatibility.
 */

// Check if we're in Edge runtime or Node.js runtime
const isEdgeRuntime = typeof (globalThis as any).EdgeRuntime !== "undefined";

// Import Node.js crypto only in Node.js runtime
let nodeRandomBytes: (size: number) => Buffer;
let nodeCreateHash: (algorithm: string) => any;

if (!isEdgeRuntime) {
  try {
    const nodeCrypto = require("crypto");
    nodeRandomBytes = nodeCrypto.randomBytes;
    nodeCreateHash = nodeCrypto.createHash;
  } catch {
    // Fallback will be used
  }
}

// Constants
const API_KEY_PREFIX = "apx_";
const KEY_BYTES_LENGTH = 32; // 32 bytes = 256 bits of entropy

/**
 * Generate a new user API key with the apx_ prefix
 *
 * Format: apx_<32-bytes-base64url> (total ~47 characters)
 * The key is cryptographically random and URL-safe.
 *
 * @returns Object containing the raw key and its SHA-256 hash
 *
 * @example
 * const { key, hash } = generateApiKey();
 * // key: "apx_Ht3D9nK..." (shown to user once)
 * // hash: "abc123..." (stored in database for lookup)
 */
export async function generateApiKey(): Promise<{ key: string; hash: string }> {
  // Generate cryptographically random bytes
  let randomPart: string;

  if (isEdgeRuntime || !nodeRandomBytes) {
    // Use Web Crypto API in Edge runtime
    const randomBytesArray = new Uint8Array(KEY_BYTES_LENGTH);
    crypto.getRandomValues(randomBytesArray);
    // Convert to base64url
    const base64 = btoa(String.fromCharCode(...randomBytesArray));
    randomPart = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } else {
    // Use Node.js crypto in Node runtime
    const randomBytes = nodeRandomBytes(KEY_BYTES_LENGTH);
    randomPart = randomBytes.toString("base64url");
  }

  // Create the full API key with prefix and base64url encoding
  // base64url is URL-safe (uses - and _ instead of + and /)
  const key = `${API_KEY_PREFIX}${randomPart}`;

  // Create SHA-256 hash for database lookup
  const hash = await hashApiKey(key);

  return { key, hash };
}

/**
 * Generate a SHA-256 hash of an API key
 *
 * Used for storing a lookup hash in the database instead of the actual key.
 * This allows us to find keys without decryption overhead.
 *
 * @param key - The full API key (including apx_ prefix)
 * @returns Hex-encoded SHA-256 hash (64 characters)
 *
 * @example
 * const hash = await hashApiKey("apx_abc123...");
 * // Returns: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
 */
export async function hashApiKey(key: string): Promise<string> {
  if (!key) {
    throw new Error("Cannot hash empty API key");
  }

  if (isEdgeRuntime || !nodeCreateHash) {
    // Use Web Crypto API in Edge runtime
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Use Node.js crypto in Node runtime
    return nodeCreateHash("sha256").update(key).digest("hex");
  }
}

/**
 * Verify that a key matches a stored hash
 *
 * @param key - The API key to verify
 * @param expectedHash - The expected SHA-256 hash
 * @returns true if the key matches the hash
 */
export async function verifyApiKeyHash(key: string, expectedHash: string): Promise<boolean> {
  if (!key || !expectedHash) {
    return false;
  }
  const hash = await hashApiKey(key);
  return hash === expectedHash;
}

/**
 * Check if a string is a valid API key format
 *
 * Validates:
 * - Starts with "apx_" prefix
 * - Contains only URL-safe base64 characters after prefix
 * - Has minimum expected length (prefix + base64url encoded 32 bytes)
 *
 * @param key - The string to validate
 * @returns true if the string appears to be a valid API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }

  // Must start with our prefix
  if (!key.startsWith(API_KEY_PREFIX)) {
    return false;
  }

  // Extract the random part after prefix
  const randomPart = key.slice(API_KEY_PREFIX.length);

  // base64url for 32 bytes should be ~43 characters
  // (32 bytes * 8 bits / 6 bits per base64 char = ~42.67, rounded up)
  if (randomPart.length < 42) {
    return false;
  }

  // Validate base64url characters (alphanumeric + dash + underscore, no padding)
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  return base64urlRegex.test(randomPart);
}

/**
 * Extract prefix from an API key
 *
 * @param key - The API key
 * @returns The prefix if present, or null
 */
export function getApiKeyPrefix(key: string): string | null {
  if (!key || typeof key !== "string") {
    return null;
  }
  if (key.startsWith(API_KEY_PREFIX)) {
    return API_KEY_PREFIX;
  }
  return null;
}

/**
 * Mask an API key for display purposes
 *
 * Shows the prefix and first 4 characters of the random part,
 * masks the middle, and shows the last 4 characters.
 *
 * @param key - The API key to mask
 * @returns Masked key like "apx_Ht3D...xyz1"
 */
export function maskApiKey(key: string): string {
  if (!key) {
    return "****";
  }

  // For very short keys, just mask completely
  if (key.length < 16) {
    return "****";
  }

  // For apx_ prefixed keys, show prefix + first 4 + ... + last 4
  if (key.startsWith(API_KEY_PREFIX)) {
    const randomPart = key.slice(API_KEY_PREFIX.length);
    if (randomPart.length < 12) {
      return `${API_KEY_PREFIX}****`;
    }
    const first = randomPart.slice(0, 4);
    const last = randomPart.slice(-4);
    return `${API_KEY_PREFIX}${first}...${last}`;
  }

  // For non-prefixed keys, show first 4 + ... + last 4
  const first = key.slice(0, 4);
  const last = key.slice(-4);
  return `${first}...${last}`;
}

/**
 * Generate secure random bytes
 *
 * Utility function for generating cryptographically secure random data.
 *
 * @param length - Number of bytes to generate
 * @returns Uint8Array containing random bytes
 */
export function generateSecureRandom(length: number): Uint8Array {
  if (length <= 0) {
    throw new Error("Length must be positive");
  }

  if (isEdgeRuntime || !nodeRandomBytes) {
    // Use Web Crypto API
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    return randomBytes;
  } else {
    // Use Node.js crypto
    const buffer = nodeRandomBytes(length);
    return new Uint8Array(buffer);
  }
}

/**
 * Generate a hex-encoded random string
 *
 * @param byteLength - Number of random bytes (output string will be 2x this length)
 * @returns Hex-encoded random string
 */
export function generateRandomHex(byteLength: number): string {
  const randomBytes = generateSecureRandom(byteLength);
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Export constants for external use
export const API_KEY_CONSTANTS = {
  PREFIX: API_KEY_PREFIX,
  KEY_BYTES_LENGTH,
  HASH_LENGTH: 64, // SHA-256 produces 64 hex characters
} as const;

// Default export for convenience
export const keyGeneration = {
  generateApiKey,
  hashApiKey,
  verifyApiKeyHash,
  isValidApiKeyFormat,
  getApiKeyPrefix,
  maskApiKey,
  generateSecureRandom,
  generateRandomHex,
  constants: API_KEY_CONSTANTS,
};
