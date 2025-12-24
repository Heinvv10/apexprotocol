/**
 * API Key Encryption Module Unit Tests
 * Tests for AES-256-GCM encryption/decryption with JSON format storage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  encryptApiKey,
  decryptApiKey,
  parseEncryptedData,
  isEncryptedApiKeyData,
  reEncryptApiKey,
  tryDecryptApiKey,
  clearEncryptionKeyCache,
  ApiKeyDecryptionError,
  InvalidEncryptedDataError,
  API_KEY_ENCRYPTION_CONSTANTS,
  type EncryptedApiKeyData,
} from "@/lib/crypto/api-key-encryption";
import { generateApiKey } from "@/lib/crypto/key-generation";

describe("API Key Encryption Module", () => {
  beforeEach(() => {
    // Clear cached encryption key before each test
    clearEncryptionKeyCache();
    // Reset environment for predictable testing
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("encryptApiKey", () => {
    it("should return a valid JSON string", () => {
      const encrypted = encryptApiKey("apx_test123");
      expect(() => JSON.parse(encrypted)).not.toThrow();
    });

    it("should return JSON with ciphertext, iv, and authTag fields", () => {
      const encrypted = encryptApiKey("apx_test123");
      const parsed = JSON.parse(encrypted);

      expect(parsed).toHaveProperty("ciphertext");
      expect(parsed).toHaveProperty("iv");
      expect(parsed).toHaveProperty("authTag");
    });

    it("should return hex-encoded values", () => {
      const encrypted = encryptApiKey("apx_test123");
      const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;

      expect(/^[a-f0-9]+$/i.test(parsed.ciphertext)).toBe(true);
      expect(/^[a-f0-9]+$/i.test(parsed.iv)).toBe(true);
      expect(/^[a-f0-9]+$/i.test(parsed.authTag)).toBe(true);
    });

    it("should return 24-character IV (12 bytes hex-encoded)", () => {
      const encrypted = encryptApiKey("apx_test123");
      const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;

      expect(parsed.iv.length).toBe(24); // 12 bytes * 2 = 24 hex chars
    });

    it("should return 32-character authTag (16 bytes hex-encoded)", () => {
      const encrypted = encryptApiKey("apx_test123");
      const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;

      expect(parsed.authTag.length).toBe(32); // 16 bytes * 2 = 32 hex chars
    });

    it("should throw error for empty API key", () => {
      expect(() => encryptApiKey("")).toThrow("Cannot encrypt empty API key");
    });

    it("should generate unique IVs for each encryption", () => {
      const apiKey = "apx_sameKeyMultipleTimes";
      const ivs = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const encrypted = encryptApiKey(apiKey);
        const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;
        expect(ivs.has(parsed.iv)).toBe(false);
        ivs.add(parsed.iv);
      }

      expect(ivs.size).toBe(100);
    });

    it("should produce different ciphertext for same plaintext (due to unique IV)", () => {
      const apiKey = "apx_sameKeyDifferentCiphertext";
      const ciphertexts = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const encrypted = encryptApiKey(apiKey);
        const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;
        expect(ciphertexts.has(parsed.ciphertext)).toBe(false);
        ciphertexts.add(parsed.ciphertext);
      }

      expect(ciphertexts.size).toBe(100);
    });

    it("should handle long API keys", () => {
      const longKey = "apx_" + "a".repeat(1000);
      const encrypted = encryptApiKey(longKey);

      expect(() => JSON.parse(encrypted)).not.toThrow();
      expect(decryptApiKey(encrypted)).toBe(longKey);
    });

    it("should handle API keys with special characters", () => {
      const specialKey = "apx_test-key_with-special_chars123";
      const encrypted = encryptApiKey(specialKey);

      expect(decryptApiKey(encrypted)).toBe(specialKey);
    });
  });

  describe("decryptApiKey", () => {
    it("should decrypt encrypted API key back to original", () => {
      const originalKey = "apx_testDecryptionWorks123";
      const encrypted = encryptApiKey(originalKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(originalKey);
    });

    it("should work with generated API keys", () => {
      const { key } = generateApiKey();
      const encrypted = encryptApiKey(key);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(key);
    });

    it("should throw InvalidEncryptedDataError for empty input", () => {
      expect(() => decryptApiKey("")).toThrow(InvalidEncryptedDataError);
    });

    it("should throw InvalidEncryptedDataError for invalid JSON", () => {
      expect(() => decryptApiKey("not valid json")).toThrow(InvalidEncryptedDataError);
      expect(() => decryptApiKey("{invalid")).toThrow(InvalidEncryptedDataError);
    });

    it("should throw InvalidEncryptedDataError for missing fields", () => {
      expect(() => decryptApiKey('{"ciphertext":"abc"}')).toThrow(InvalidEncryptedDataError);
      expect(() => decryptApiKey('{"iv":"abc"}')).toThrow(InvalidEncryptedDataError);
      expect(() => decryptApiKey('{"authTag":"abc"}')).toThrow(InvalidEncryptedDataError);
    });

    it("should throw ApiKeyDecryptionError for tampered ciphertext", () => {
      const encrypted = encryptApiKey("apx_original");
      const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;

      // Tamper with the ciphertext
      const tamperedCiphertext = "ff" + parsed.ciphertext.slice(2);
      const tampered = JSON.stringify({
        ...parsed,
        ciphertext: tamperedCiphertext,
      });

      expect(() => decryptApiKey(tampered)).toThrow(ApiKeyDecryptionError);
    });

    it("should throw ApiKeyDecryptionError for tampered IV", () => {
      const encrypted = encryptApiKey("apx_original");
      const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;

      // Tamper with the IV
      const tamperedIv = "ff" + parsed.iv.slice(2);
      const tampered = JSON.stringify({
        ...parsed,
        iv: tamperedIv,
      });

      expect(() => decryptApiKey(tampered)).toThrow(ApiKeyDecryptionError);
    });

    it("should throw ApiKeyDecryptionError for tampered authTag", () => {
      const encrypted = encryptApiKey("apx_original");
      const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;

      // Tamper with the authTag
      const tamperedTag = "ff" + parsed.authTag.slice(2);
      const tampered = JSON.stringify({
        ...parsed,
        authTag: tamperedTag,
      });

      expect(() => decryptApiKey(tampered)).toThrow(ApiKeyDecryptionError);
    });

    it("should include informative error message for auth tag failure", () => {
      const encrypted = encryptApiKey("apx_original");
      const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;
      const tampered = JSON.stringify({
        ...parsed,
        authTag: "00".repeat(16),
      });

      try {
        decryptApiKey(tampered);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiKeyDecryptionError);
        expect((error as Error).message).toContain("authentication tag verification failed");
      }
    });
  });

  describe("Round-Trip Encryption/Decryption", () => {
    it("should maintain data integrity through round-trip", () => {
      const testCases = [
        "apx_simple",
        "apx_with-dashes_and_underscores",
        "apx_" + "x".repeat(100),
        "apx_MixedCaseAndNumbers123",
      ];

      for (const original of testCases) {
        const encrypted = encryptApiKey(original);
        const decrypted = decryptApiKey(encrypted);
        expect(decrypted).toBe(original);
      }
    });

    it("should work for 1000 unique generated keys", () => {
      for (let i = 0; i < 1000; i++) {
        const { key } = generateApiKey();
        const encrypted = encryptApiKey(key);
        const decrypted = decryptApiKey(encrypted);
        expect(decrypted).toBe(key);
      }
    });

    it("should work with non-ASCII characters", () => {
      const unicodeKey = "apx_test_unicode_\u4e2d\u6587";
      const encrypted = encryptApiKey(unicodeKey);
      const decrypted = decryptApiKey(encrypted);
      expect(decrypted).toBe(unicodeKey);
    });
  });

  describe("parseEncryptedData", () => {
    it("should parse valid encrypted data JSON", () => {
      const encrypted = encryptApiKey("apx_test");
      const parsed = parseEncryptedData(encrypted);

      expect(parsed.ciphertext).toBeDefined();
      expect(parsed.iv).toBeDefined();
      expect(parsed.authTag).toBeDefined();
    });

    it("should throw for invalid JSON", () => {
      expect(() => parseEncryptedData("not json")).toThrow(InvalidEncryptedDataError);
      expect(() => parseEncryptedData("")).toThrow(InvalidEncryptedDataError);
    });

    it("should throw for non-object JSON", () => {
      expect(() => parseEncryptedData('"string"')).toThrow(InvalidEncryptedDataError);
      expect(() => parseEncryptedData("[1, 2, 3]")).toThrow(InvalidEncryptedDataError);
      expect(() => parseEncryptedData("null")).toThrow(InvalidEncryptedDataError);
    });

    it("should throw for missing ciphertext field", () => {
      expect(() =>
        parseEncryptedData('{"iv":"aabbccdd00112233aabbccdd","authTag":"aabbccdd00112233aabbccdd00112233"}')
      ).toThrow("missing or invalid 'ciphertext' field");
    });

    it("should throw for missing iv field", () => {
      expect(() =>
        parseEncryptedData('{"ciphertext":"aabb","authTag":"aabbccdd00112233aabbccdd00112233"}')
      ).toThrow("missing or invalid 'iv' field");
    });

    it("should throw for missing authTag field", () => {
      expect(() =>
        parseEncryptedData('{"ciphertext":"aabb","iv":"aabbccdd00112233aabbccdd"}')
      ).toThrow("missing or invalid 'authTag' field");
    });

    it("should throw for non-hex ciphertext", () => {
      expect(() =>
        parseEncryptedData('{"ciphertext":"not hex!","iv":"aabbccdd00112233aabbccdd","authTag":"aabbccdd00112233aabbccdd00112233"}')
      ).toThrow("'ciphertext' must be hex-encoded");
    });

    it("should throw for non-hex iv", () => {
      expect(() =>
        parseEncryptedData('{"ciphertext":"aabb","iv":"not hex at all!","authTag":"aabbccdd00112233aabbccdd00112233"}')
      ).toThrow("'iv' must be hex-encoded");
    });

    it("should throw for non-hex authTag", () => {
      expect(() =>
        parseEncryptedData('{"ciphertext":"aabb","iv":"aabbccdd00112233aabbccdd","authTag":"not hex at all!!!!"}')
      ).toThrow("'authTag' must be hex-encoded");
    });

    it("should throw for incorrect IV length", () => {
      expect(() =>
        parseEncryptedData('{"ciphertext":"aabb","iv":"aabbccdd","authTag":"aabbccdd00112233aabbccdd00112233"}')
      ).toThrow("'iv' should be 24 hex characters");
    });

    it("should throw for incorrect authTag length", () => {
      expect(() =>
        parseEncryptedData('{"ciphertext":"aabb","iv":"aabbccdd00112233aabbccdd","authTag":"aabbccdd"}')
      ).toThrow("'authTag' should be 32 hex characters");
    });
  });

  describe("isEncryptedApiKeyData", () => {
    it("should return true for valid encrypted data", () => {
      const encrypted = encryptApiKey("apx_test");
      expect(isEncryptedApiKeyData(encrypted)).toBe(true);
    });

    it("should return false for invalid JSON", () => {
      expect(isEncryptedApiKeyData("not json")).toBe(false);
      expect(isEncryptedApiKeyData("")).toBe(false);
    });

    it("should return false for missing fields", () => {
      expect(isEncryptedApiKeyData('{"ciphertext":"abc"}')).toBe(false);
      expect(isEncryptedApiKeyData('{"iv":"abc"}')).toBe(false);
    });

    it("should return false for invalid field formats", () => {
      expect(isEncryptedApiKeyData('{"ciphertext":"abc","iv":"short","authTag":"abc"}')).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isEncryptedApiKeyData(null as unknown as string)).toBe(false);
      expect(isEncryptedApiKeyData(undefined as unknown as string)).toBe(false);
    });

    it("should return false for non-string input", () => {
      expect(isEncryptedApiKeyData(123 as unknown as string)).toBe(false);
      expect(isEncryptedApiKeyData({} as unknown as string)).toBe(false);
    });
  });

  describe("reEncryptApiKey", () => {
    it("should produce different encrypted output with same plaintext", () => {
      const original = "apx_testReEncryption123";
      const firstEncryption = encryptApiKey(original);
      const reEncrypted = reEncryptApiKey(firstEncryption);

      // The encrypted values should be different (new IV)
      expect(reEncrypted).not.toBe(firstEncryption);

      // But both should decrypt to the same value
      expect(decryptApiKey(firstEncryption)).toBe(original);
      expect(decryptApiKey(reEncrypted)).toBe(original);
    });

    it("should use a fresh IV", () => {
      const encrypted = encryptApiKey("apx_test");
      const reEncrypted = reEncryptApiKey(encrypted);

      const original = JSON.parse(encrypted) as EncryptedApiKeyData;
      const reEncryptedParsed = JSON.parse(reEncrypted) as EncryptedApiKeyData;

      expect(reEncryptedParsed.iv).not.toBe(original.iv);
    });

    it("should throw for invalid encrypted data", () => {
      expect(() => reEncryptApiKey("not valid")).toThrow(InvalidEncryptedDataError);
    });

    it("should throw for tampered data", () => {
      const encrypted = encryptApiKey("apx_test");
      const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;
      const tampered = JSON.stringify({
        ...parsed,
        authTag: "00".repeat(16),
      });

      expect(() => reEncryptApiKey(tampered)).toThrow(ApiKeyDecryptionError);
    });
  });

  describe("tryDecryptApiKey", () => {
    it("should return decrypted key for valid input", () => {
      const original = "apx_testTryDecrypt";
      const encrypted = encryptApiKey(original);
      const result = tryDecryptApiKey(encrypted);

      expect(result).toBe(original);
    });

    it("should return null for invalid JSON", () => {
      expect(tryDecryptApiKey("not json")).toBe(null);
    });

    it("should return null for tampered data", () => {
      const encrypted = encryptApiKey("apx_test");
      const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;
      const tampered = JSON.stringify({
        ...parsed,
        authTag: "00".repeat(16),
      });

      expect(tryDecryptApiKey(tampered)).toBe(null);
    });

    it("should return null for empty input", () => {
      expect(tryDecryptApiKey("")).toBe(null);
    });

    it("should not throw any errors", () => {
      const invalidInputs = [
        "",
        "not json",
        '{"invalid":"format"}',
        "null",
        '{"ciphertext":"ff","iv":"ff","authTag":"ff"}',
      ];

      for (const input of invalidInputs) {
        expect(() => tryDecryptApiKey(input)).not.toThrow();
        expect(tryDecryptApiKey(input)).toBe(null);
      }
    });
  });

  describe("clearEncryptionKeyCache", () => {
    it("should allow cache to be cleared without errors", () => {
      // Encrypt something to populate cache
      encryptApiKey("apx_test");

      // Clear should not throw
      expect(() => clearEncryptionKeyCache()).not.toThrow();
    });

    it("should allow encryption to work after clearing cache", () => {
      encryptApiKey("apx_test1");
      clearEncryptionKeyCache();

      const encrypted = encryptApiKey("apx_test2");
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe("apx_test2");
    });
  });

  describe("API_KEY_ENCRYPTION_CONSTANTS", () => {
    it("should have correct ALGORITHM", () => {
      expect(API_KEY_ENCRYPTION_CONSTANTS.ALGORITHM).toBe("aes-256-gcm");
    });

    it("should have correct IV_LENGTH (12 bytes for GCM)", () => {
      expect(API_KEY_ENCRYPTION_CONSTANTS.IV_LENGTH).toBe(12);
    });

    it("should have correct AUTH_TAG_LENGTH (16 bytes)", () => {
      expect(API_KEY_ENCRYPTION_CONSTANTS.AUTH_TAG_LENGTH).toBe(16);
    });

    it("should have correct KEY_LENGTH (32 bytes for AES-256)", () => {
      expect(API_KEY_ENCRYPTION_CONSTANTS.KEY_LENGTH).toBe(32);
    });
  });

  describe("Error Classes", () => {
    describe("ApiKeyDecryptionError", () => {
      it("should have correct name", () => {
        const error = new ApiKeyDecryptionError("test message");
        expect(error.name).toBe("ApiKeyDecryptionError");
      });

      it("should store message correctly", () => {
        const error = new ApiKeyDecryptionError("test message");
        expect(error.message).toBe("test message");
      });

      it("should store cause if provided", () => {
        const cause = new Error("original error");
        const error = new ApiKeyDecryptionError("wrapper message", cause);
        expect(error.cause).toBe(cause);
      });

      it("should be instanceof Error", () => {
        const error = new ApiKeyDecryptionError("test");
        expect(error).toBeInstanceOf(Error);
      });
    });

    describe("InvalidEncryptedDataError", () => {
      it("should have correct name", () => {
        const error = new InvalidEncryptedDataError("test message");
        expect(error.name).toBe("InvalidEncryptedDataError");
      });

      it("should store message correctly", () => {
        const error = new InvalidEncryptedDataError("test message");
        expect(error.message).toBe("test message");
      });

      it("should be instanceof Error", () => {
        const error = new InvalidEncryptedDataError("test");
        expect(error).toBeInstanceOf(Error);
      });
    });
  });

  describe("Encryption Key Loading", () => {
    beforeEach(() => {
      clearEncryptionKeyCache();
    });

    it("should use development fallback key in non-production", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ENCRYPTION_KEY", "");
      clearEncryptionKeyCache();

      // Should not throw in development
      expect(() => encryptApiKey("apx_test")).not.toThrow();
    });

    it("should work with 64-character hex key", () => {
      const validHexKey = "a".repeat(64);
      vi.stubEnv("ENCRYPTION_KEY", validHexKey);
      clearEncryptionKeyCache();

      const encrypted = encryptApiKey("apx_test");
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe("apx_test");
    });

    it("should derive key from non-hex ENCRYPTION_KEY", () => {
      vi.stubEnv("ENCRYPTION_KEY", "my-secret-passphrase-for-encryption");
      clearEncryptionKeyCache();

      const encrypted = encryptApiKey("apx_test");
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe("apx_test");
    });

    it("should throw in production without ENCRYPTION_KEY", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ENCRYPTION_KEY", "");
      clearEncryptionKeyCache();

      expect(() => encryptApiKey("apx_test")).toThrow("ENCRYPTION_KEY environment variable is required");
    });

    it("should cache key for performance", () => {
      vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64));
      clearEncryptionKeyCache();

      // First encryption - loads key
      const encrypted1 = encryptApiKey("apx_test1");

      // Second encryption - uses cached key
      const encrypted2 = encryptApiKey("apx_test2");

      // Both should work and decrypt correctly
      expect(decryptApiKey(encrypted1)).toBe("apx_test1");
      expect(decryptApiKey(encrypted2)).toBe("apx_test2");
    });

    it("should decrypt with same key that was used for encryption", () => {
      const key1 = "a".repeat(64);
      const key2 = "b".repeat(64);

      // Encrypt with key1
      vi.stubEnv("ENCRYPTION_KEY", key1);
      clearEncryptionKeyCache();
      const encrypted = encryptApiKey("apx_test");

      // Try to decrypt with different key - should fail
      vi.stubEnv("ENCRYPTION_KEY", key2);
      clearEncryptionKeyCache();
      expect(() => decryptApiKey(encrypted)).toThrow(ApiKeyDecryptionError);
    });
  });

  describe("Security Properties", () => {
    it("should not leak plaintext in encrypted output", () => {
      const sensitiveKey = "apx_verySensitiveApiKey123456789";
      const encrypted = encryptApiKey(sensitiveKey);

      // Encrypted output should not contain the plaintext
      expect(encrypted).not.toContain("verySensitiveApiKey");
      expect(encrypted).not.toContain(sensitiveKey);
    });

    it("should use authenticated encryption (GCM mode)", () => {
      // Verify auth tag is always present and validated
      const encrypted = encryptApiKey("apx_test");
      const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;

      // Auth tag should be present
      expect(parsed.authTag).toBeDefined();
      expect(parsed.authTag.length).toBe(32);

      // Modifying any part should cause auth failure
      const modifications = [
        { ...parsed, ciphertext: "00" + parsed.ciphertext.slice(2) },
        { ...parsed, iv: "00" + parsed.iv.slice(2) },
        { ...parsed, authTag: "00" + parsed.authTag.slice(2) },
      ];

      for (const modified of modifications) {
        expect(() => decryptApiKey(JSON.stringify(modified))).toThrow(ApiKeyDecryptionError);
      }
    });

    it("should prevent IV reuse attacks", () => {
      // Each encryption should have unique IV
      const encrypted1 = encryptApiKey("apx_same_key");
      const encrypted2 = encryptApiKey("apx_same_key");

      const iv1 = (JSON.parse(encrypted1) as EncryptedApiKeyData).iv;
      const iv2 = (JSON.parse(encrypted2) as EncryptedApiKeyData).iv;

      expect(iv1).not.toBe(iv2);
    });

    it("should use recommended IV length for GCM (12 bytes)", () => {
      const encrypted = encryptApiKey("apx_test");
      const parsed = JSON.parse(encrypted) as EncryptedApiKeyData;

      // 12 bytes = 24 hex characters
      expect(parsed.iv.length).toBe(24);
    });
  });

  describe("Performance", () => {
    it("should encrypt and decrypt within reasonable time (< 10ms per operation)", () => {
      const { key } = generateApiKey();
      const iterations = 100;

      // Measure encryption time
      const encryptStart = performance.now();
      const encrypted: string[] = [];
      for (let i = 0; i < iterations; i++) {
        encrypted.push(encryptApiKey(key));
      }
      const encryptEnd = performance.now();
      const encryptAvg = (encryptEnd - encryptStart) / iterations;

      // Measure decryption time
      const decryptStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        decryptApiKey(encrypted[i]);
      }
      const decryptEnd = performance.now();
      const decryptAvg = (decryptEnd - decryptStart) / iterations;

      // Should complete each operation in under 10ms
      expect(encryptAvg).toBeLessThan(10);
      expect(decryptAvg).toBeLessThan(10);
    });
  });
});
