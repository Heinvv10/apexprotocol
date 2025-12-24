/**
 * API Key Generation Module Unit Tests
 * Tests for key generation, hashing, and validation utilities
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  generateApiKey,
  hashApiKey,
  verifyApiKeyHash,
  isValidApiKeyFormat,
  getApiKeyPrefix,
  maskApiKey,
  generateSecureRandom,
  generateRandomHex,
  API_KEY_CONSTANTS,
} from "@/lib/crypto/key-generation";

describe("Key Generation Module", () => {
  describe("generateApiKey", () => {
    it("should generate a key with apx_ prefix", () => {
      const { key } = generateApiKey();
      expect(key.startsWith("apx_")).toBe(true);
    });

    it("should generate a key with correct length (47 characters)", () => {
      const { key } = generateApiKey();
      // apx_ (4 chars) + 43 chars base64url = 47 chars total
      expect(key.length).toBe(47);
    });

    it("should generate URL-safe keys (only base64url characters)", () => {
      const { key } = generateApiKey();
      const randomPart = key.slice(4); // Remove 'apx_' prefix
      // base64url uses A-Z, a-z, 0-9, -, _ (no + or /)
      expect(/^[A-Za-z0-9_-]+$/.test(randomPart)).toBe(true);
    });

    it("should generate unique keys on each call", () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const { key } = generateApiKey();
        expect(keys.has(key)).toBe(false);
        keys.add(key);
      }
      expect(keys.size).toBe(100);
    });

    it("should return a hash along with the key", () => {
      const { key, hash } = generateApiKey();
      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      // SHA-256 produces 64 hex characters
      expect(hash.length).toBe(64);
    });

    it("should return a hash that matches hashApiKey output", () => {
      const { key, hash } = generateApiKey();
      const expectedHash = hashApiKey(key);
      expect(hash).toBe(expectedHash);
    });

    it("should generate cryptographically random keys", () => {
      // Generate many keys and check they have high entropy
      const keys: string[] = [];
      for (let i = 0; i < 1000; i++) {
        keys.push(generateApiKey().key);
      }

      // All keys should be unique
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(1000);

      // Check that keys have no obvious patterns (first char after prefix varies)
      const firstChars = new Set(keys.map(k => k[4]));
      // With 1000 random keys, we should have many different first characters
      expect(firstChars.size).toBeGreaterThan(20);
    });
  });

  describe("hashApiKey", () => {
    it("should produce a 64-character hex string (SHA-256)", () => {
      const hash = hashApiKey("apx_test123456");
      expect(hash.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    it("should produce consistent hash for same input", () => {
      const key = "apx_consistentTestKey123";
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);
      const hash3 = hashApiKey(key);

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    it("should produce different hashes for different inputs", () => {
      const hash1 = hashApiKey("apx_key1");
      const hash2 = hashApiKey("apx_key2");
      const hash3 = hashApiKey("apx_key3");

      expect(hash1).not.toBe(hash2);
      expect(hash2).not.toBe(hash3);
      expect(hash1).not.toBe(hash3);
    });

    it("should throw error for empty key", () => {
      expect(() => hashApiKey("")).toThrow("Cannot hash empty API key");
    });

    it("should handle keys without apx_ prefix", () => {
      const hash = hashApiKey("some-other-format-key");
      expect(hash.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    it("should handle special characters in key", () => {
      const hash = hashApiKey("apx_key-with_special-chars_123");
      expect(hash.length).toBe(64);
    });

    it("should produce deterministic output for database lookups", () => {
      // This is critical for API key authentication
      const { key, hash: originalHash } = generateApiKey();

      // Simulate storing hash in database and later looking up
      const lookupHash = hashApiKey(key);

      expect(lookupHash).toBe(originalHash);
    });
  });

  describe("verifyApiKeyHash", () => {
    it("should return true for matching key and hash", () => {
      const { key, hash } = generateApiKey();
      expect(verifyApiKeyHash(key, hash)).toBe(true);
    });

    it("should return false for non-matching key and hash", () => {
      const { key } = generateApiKey();
      const { hash: differentHash } = generateApiKey();
      expect(verifyApiKeyHash(key, differentHash)).toBe(false);
    });

    it("should return false for empty key", () => {
      const { hash } = generateApiKey();
      expect(verifyApiKeyHash("", hash)).toBe(false);
    });

    it("should return false for empty hash", () => {
      const { key } = generateApiKey();
      expect(verifyApiKeyHash(key, "")).toBe(false);
    });

    it("should return false for both empty", () => {
      expect(verifyApiKeyHash("", "")).toBe(false);
    });

    it("should handle slight modifications to key", () => {
      const { key, hash } = generateApiKey();
      // Change last character
      const modifiedKey = key.slice(0, -1) + "X";
      expect(verifyApiKeyHash(modifiedKey, hash)).toBe(false);
    });
  });

  describe("isValidApiKeyFormat", () => {
    it("should return true for valid API key format", () => {
      const { key } = generateApiKey();
      expect(isValidApiKeyFormat(key)).toBe(true);
    });

    it("should return false for key without apx_ prefix", () => {
      expect(isValidApiKeyFormat("sk_test123456789012345678901234567890123")).toBe(false);
      expect(isValidApiKeyFormat("test123456789012345678901234567890123456")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidApiKeyFormat("")).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isValidApiKeyFormat(null as unknown as string)).toBe(false);
      expect(isValidApiKeyFormat(undefined as unknown as string)).toBe(false);
    });

    it("should return false for key that is too short", () => {
      expect(isValidApiKeyFormat("apx_short")).toBe(false);
      expect(isValidApiKeyFormat("apx_tooshortkey")).toBe(false);
    });

    it("should return false for key with invalid base64url characters", () => {
      // + and / are not valid in base64url
      expect(isValidApiKeyFormat("apx_invalid+chars/here123456789012345678901234")).toBe(false);
      // Spaces are not valid
      expect(isValidApiKeyFormat("apx_invalid chars here 123456789012345678901")).toBe(false);
    });

    it("should return true for key with valid base64url characters", () => {
      // base64url uses - and _ instead of + and /
      // Must be at least 42 chars after prefix to be valid
      expect(isValidApiKeyFormat("apx_valid-chars_here-1234567890123456789012345")).toBe(true);
    });

    it("should return false for non-string input", () => {
      expect(isValidApiKeyFormat(12345 as unknown as string)).toBe(false);
      expect(isValidApiKeyFormat({} as unknown as string)).toBe(false);
      expect(isValidApiKeyFormat([] as unknown as string)).toBe(false);
    });
  });

  describe("getApiKeyPrefix", () => {
    it("should return apx_ for valid API keys", () => {
      const { key } = generateApiKey();
      expect(getApiKeyPrefix(key)).toBe("apx_");
    });

    it("should return null for keys without apx_ prefix", () => {
      expect(getApiKeyPrefix("sk_test123")).toBe(null);
      expect(getApiKeyPrefix("no_prefix")).toBe(null);
    });

    it("should return null for empty string", () => {
      expect(getApiKeyPrefix("")).toBe(null);
    });

    it("should return null for null/undefined", () => {
      expect(getApiKeyPrefix(null as unknown as string)).toBe(null);
      expect(getApiKeyPrefix(undefined as unknown as string)).toBe(null);
    });
  });

  describe("maskApiKey", () => {
    it("should mask API key showing prefix, first 4, and last 4 characters", () => {
      const key = "apx_abcdefghijklmnopqrstuvwxyz0123456789ABC";
      const masked = maskApiKey(key);

      expect(masked.startsWith("apx_")).toBe(true);
      expect(masked).toContain("...");
      expect(masked.endsWith("9ABC")).toBe(true);
      expect(masked).toBe("apx_abcd...9ABC");
    });

    it("should mask generated API keys correctly", () => {
      const { key } = generateApiKey();
      const masked = maskApiKey(key);

      expect(masked.startsWith("apx_")).toBe(true);
      expect(masked).toContain("...");
      expect(masked.length).toBeLessThan(key.length);
    });

    it("should return **** for empty input", () => {
      expect(maskApiKey("")).toBe("****");
    });

    it("should return **** for very short keys", () => {
      expect(maskApiKey("short")).toBe("****");
      expect(maskApiKey("apx_")).toBe("****");
    });

    it("should handle short random parts gracefully", () => {
      // Keys shorter than 16 chars total are fully masked
      expect(maskApiKey("apx_short")).toBe("****");
      // Keys at exactly 16 chars get normal masking (randomPart has 12 chars)
      expect(maskApiKey("apx_shortkey1234")).toBe("apx_shor...1234");
    });

    it("should mask non-prefixed keys showing first and last 4 chars", () => {
      const key = "sk_test_1234567890abcdefghij";
      const masked = maskApiKey(key);

      expect(masked).toBe("sk_t...ghij");
    });

    it("should not expose the full key", () => {
      const { key } = generateApiKey();
      const masked = maskApiKey(key);

      // The masked version should not contain the full random part
      const randomPart = key.slice(4);
      expect(masked).not.toContain(randomPart);
    });
  });

  describe("generateSecureRandom", () => {
    it("should generate buffer of specified length", () => {
      const buffer = generateSecureRandom(32);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBe(32);
    });

    it("should generate different buffers on each call", () => {
      const buffer1 = generateSecureRandom(16);
      const buffer2 = generateSecureRandom(16);
      expect(buffer1.equals(buffer2)).toBe(false);
    });

    it("should throw error for zero length", () => {
      expect(() => generateSecureRandom(0)).toThrow("Length must be positive");
    });

    it("should throw error for negative length", () => {
      expect(() => generateSecureRandom(-5)).toThrow("Length must be positive");
    });

    it("should handle various lengths", () => {
      expect(generateSecureRandom(1).length).toBe(1);
      expect(generateSecureRandom(64).length).toBe(64);
      expect(generateSecureRandom(128).length).toBe(128);
    });
  });

  describe("generateRandomHex", () => {
    it("should generate hex string of double the byte length", () => {
      const hex = generateRandomHex(16);
      expect(hex.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it("should only contain valid hex characters", () => {
      const hex = generateRandomHex(32);
      expect(/^[a-f0-9]+$/.test(hex)).toBe(true);
    });

    it("should generate different strings on each call", () => {
      const hex1 = generateRandomHex(16);
      const hex2 = generateRandomHex(16);
      expect(hex1).not.toBe(hex2);
    });

    it("should be useful for generating encryption keys", () => {
      // A 256-bit (32 byte) key for AES-256
      const key = generateRandomHex(32);
      expect(key.length).toBe(64); // 64 hex chars = 32 bytes
      expect(/^[a-f0-9]+$/.test(key)).toBe(true);
    });
  });

  describe("API_KEY_CONSTANTS", () => {
    it("should have correct PREFIX", () => {
      expect(API_KEY_CONSTANTS.PREFIX).toBe("apx_");
    });

    it("should have correct KEY_BYTES_LENGTH", () => {
      expect(API_KEY_CONSTANTS.KEY_BYTES_LENGTH).toBe(32);
    });

    it("should have correct HASH_LENGTH", () => {
      expect(API_KEY_CONSTANTS.HASH_LENGTH).toBe(64);
    });

    it("should match actual generated values", () => {
      const { key, hash } = generateApiKey();

      expect(key.startsWith(API_KEY_CONSTANTS.PREFIX)).toBe(true);
      expect(hash.length).toBe(API_KEY_CONSTANTS.HASH_LENGTH);
    });
  });

  describe("Security Properties", () => {
    it("should not have predictable patterns in generated keys", () => {
      const keys: string[] = [];
      for (let i = 0; i < 100; i++) {
        keys.push(generateApiKey().key);
      }

      // Check character distribution at each position after prefix
      for (let pos = 4; pos < 20; pos++) {
        const charsAtPos = keys.map(k => k[pos]);
        const uniqueChars = new Set(charsAtPos);
        // Should have reasonable variation at each position
        expect(uniqueChars.size).toBeGreaterThan(10);
      }
    });

    it("should use cryptographically secure random source", () => {
      // Generate many random values and check distribution
      const values: number[] = [];
      for (let i = 0; i < 1000; i++) {
        const buffer = generateSecureRandom(1);
        values.push(buffer[0]);
      }

      // Calculate basic statistics
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;

      // For uniform distribution 0-255, expected mean is ~127.5
      // Allow for some variance but should be close
      expect(mean).toBeGreaterThan(100);
      expect(mean).toBeLessThan(155);

      // Check that we have a good spread of values
      const unique = new Set(values);
      expect(unique.size).toBeGreaterThan(100); // Should have many unique values
    });

    it("should produce hashes that are collision-resistant", () => {
      // Generate many keys and check for hash collisions
      const hashes = new Set<string>();
      for (let i = 0; i < 10000; i++) {
        const { hash } = generateApiKey();
        expect(hashes.has(hash)).toBe(false);
        hashes.add(hash);
      }
    });
  });
});
