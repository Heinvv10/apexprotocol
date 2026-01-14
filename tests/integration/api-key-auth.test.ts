/**
 * API Key Authentication Integration Tests
 *
 * Tests API key authentication flow against real database.
 * Verifies validation, expiration, revocation, and context retrieval.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL or DATABASE_URL must be configured
 * - Database must be accessible
 *
 * Note: These tests are designed to run against a real database.
 * When the database is not available, all tests will be skipped.
 */

import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { eq, and } from "drizzle-orm";
import { setupIntegrationTest, isDatabaseConfigured, wasDatabaseConnected } from "./setup";
import { TEST_IDS } from "./seed";
import { encryptApiKey, decryptApiKey } from "../../src/lib/crypto/api-key-encryption";
import { generateApiKey, hashApiKey, isValidApiKeyFormat } from "../../src/lib/crypto/key-generation";
import {
  validateApiKey,
  validateApiKeyFromHeader,
  extractBearerToken,
  isApexApiKey,
  isApiKeyValid,
  getApiKeyAuthContext,
  isApiKeyAuthenticated,
  API_KEY_AUTH_HEADERS,
} from "../../src/lib/auth/api-key-auth";

// Check if database is configured
const dbConfigured = isDatabaseConfigured();

describe("API Key Authentication Integration Tests", () => {
  // If database is not configured, skip all tests with a clear message
  if (!dbConfigured) {
    it.skip("all tests skipped - database not configured (set DATABASE_URL or TEST_DATABASE_URL)", () => {});
    return;
  }

  // Set up integration test infrastructure
  const { getDb, getSchema: getSchemaFn } = setupIntegrationTest();

  // Helper to check if database is actually connected (set after beforeAll runs)
  const skipIfNotConnected = () => !wasDatabaseConnected();

  // Skip condition for tests that require database connection
  const itWithDb = (name: string, fn: () => Promise<void> | void) => {
    it(name, async () => {
      if (skipIfNotConnected()) {
        return; // Skip silently - database not available
      }
      await fn();
    });
  };

  // Helper to create a test user API key with database entry
  const createTestApiKey = async (
    suffix: string,
    options: {
      isActive?: boolean;
      expiresAt?: Date | null;
      userId?: string;
      organizationId?: string;
    } = {}
  ) => {
    const db = getDb();
    const schema = getSchemaFn();
    const { key, hash } = await generateApiKey();

    const keyId = `auth-test-key-${suffix}-${Date.now()}`;
    const userId = options.userId || TEST_IDS.USERS[0];
    const organizationId = options.organizationId || TEST_IDS.ORG;

    const encryptedKey = encryptApiKey(key);

    await db
      .insert(schema.apiKeys)
      .values({
        id: keyId,
        organizationId,
        userId,
        name: `Auth Test Key ${suffix}`,
        type: "user",
        encryptedKey,
        keyHash: hash,
        version: 1,
        isActive: options.isActive !== undefined ? options.isActive : true,
        expiresAt: options.expiresAt !== undefined ? options.expiresAt : null,
      })
      .returning();

    return {
      id: keyId,
      key,
      hash,
      userId,
      organizationId,
    };
  };

  // Cleanup function for API keys created during tests
  const cleanupApiKey = async (keyId: string) => {
    const db = getDb();
    const schema = getSchemaFn();
    try {
      await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, keyId));
    } catch {
      // Ignore cleanup errors
    }
  };

  // Cleanup function for multiple API keys
  const cleanupApiKeys = async (keyIds: string[]) => {
    for (const keyId of keyIds) {
      await cleanupApiKey(keyId);
    }
  };

  describe("Token Extraction and Format Validation", () => {
    it("should extract Bearer token from Authorization header", () => {
      expect(extractBearerToken("Bearer apx_test123")).toBe("apx_test123");
      expect(extractBearerToken("bearer apx_test123")).toBe("apx_test123"); // case-insensitive
      expect(extractBearerToken("BEARER apx_test123")).toBe("apx_test123"); // uppercase
    });

    it("should return null for invalid Authorization headers", () => {
      expect(extractBearerToken(null)).toBeNull();
      expect(extractBearerToken("")).toBeNull();
      expect(extractBearerToken("Basic abc123")).toBeNull();
      expect(extractBearerToken("apx_test123")).toBeNull(); // missing Bearer prefix
    });

    it("should identify Apex API keys by prefix", () => {
      expect(isApexApiKey("apx_test123abc")).toBe(true);
      expect(isApexApiKey("apx_")).toBe(true); // minimal valid prefix
    });

    it("should reject non-Apex tokens", () => {
      expect(isApexApiKey(null)).toBe(false);
      expect(isApexApiKey("")).toBe(false);
      expect(isApexApiKey("sk-test123")).toBe(false); // OpenAI format
      expect(isApexApiKey("pk_test123")).toBe(false); // Stripe format
      expect(isApexApiKey("APX_test123")).toBe(false); // wrong case
    });

    it("should validate full Apex API key format", async () => {
      const { key } = await generateApiKey();
      expect(isValidApiKeyFormat(key)).toBe(true);
      expect(key.startsWith("apx_")).toBe(true);
      expect(key.length).toBe(47);
    });

    it("should reject malformed API keys", () => {
      expect(isValidApiKeyFormat("apx_short")).toBe(false); // too short
      expect(isValidApiKeyFormat("apx_")).toBe(false); // prefix only
      expect(isValidApiKeyFormat("not_valid_key")).toBe(false);
    });
  });

  describe("Valid API Key Authentication", () => {
    let createdKeyIds: string[] = [];

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      await cleanupApiKeys(createdKeyIds);
      createdKeyIds = [];
    });

    itWithDb("should authenticate valid API key successfully", async () => {
      const testKey = await createTestApiKey("valid-auth");
      createdKeyIds.push(testKey.id);

      const result = await validateApiKey(testKey.key, getDb());

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.keyId).toBe(testKey.id);
        expect(result.userId).toBe(testKey.userId);
        expect(result.organizationId).toBe(testKey.organizationId);
      }
    });

    itWithDb("should authenticate via Authorization header", async () => {
      const testKey = await createTestApiKey("header-auth");
      createdKeyIds.push(testKey.id);

      const authHeader = `Bearer ${testKey.key}`;
      const result = await validateApiKeyFromHeader(authHeader, getDb());

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.keyId).toBe(testKey.id);
        expect(result.userId).toBe(testKey.userId);
      }
    });

    itWithDb("should handle case-insensitive Bearer prefix", async () => {
      const testKey = await createTestApiKey("bearer-case");
      createdKeyIds.push(testKey.id);

      // Test lowercase
      const result1 = await validateApiKeyFromHeader(`bearer ${testKey.key}`, getDb());
      expect(result1.valid).toBe(true);

      // Test uppercase
      const result2 = await validateApiKeyFromHeader(`BEARER ${testKey.key}`, getDb());
      expect(result2.valid).toBe(true);

      // Test mixed case
      const result3 = await validateApiKeyFromHeader(`BeArEr ${testKey.key}`, getDb());
      expect(result3.valid).toBe(true);
    });

    itWithDb("should return scopes from key record", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const { key, hash } = await generateApiKey();
      const keyId = `scopes-test-${Date.now()}`;
      createdKeyIds.push(keyId);

      // Create key with scopes
      const scopes = { read: true, write: false, endpoints: ["/api/brands"] };
      await db
        .insert(schema.apiKeys)
        .values({
          id: keyId,
          organizationId: TEST_IDS.ORG,
          userId: TEST_IDS.USERS[0],
          name: "Scopes Test Key",
          type: "user",
          encryptedKey: encryptApiKey(key),
          keyHash: hash,
          version: 1,
          isActive: true,
          scopes,
        })
        .returning();

      const result = await validateApiKey(key, getDb());

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.scopes).toEqual(scopes);
      }
    });
  });

  describe("Invalid API Key Returns 401", () => {
    itWithDb("should reject non-existent API key", async () => {
      const { key } = await generateApiKey();
      // Key was never stored in database

      const result = await validateApiKey(key, getDb());

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("key_not_found");
        expect(result.message).toBe("API key not found");
      }
    });

    itWithDb("should reject invalid key format", async () => {
      const result = await validateApiKey("not_a_valid_key", getDb());

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("invalid_format");
      }
    });

    itWithDb("should reject missing Authorization header", async () => {
      const result = await validateApiKeyFromHeader(null, getDb());

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("missing_header");
      }
    });

    itWithDb("should reject empty Authorization header", async () => {
      const result = await validateApiKeyFromHeader("", getDb());

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("missing_header");
      }
    });

    itWithDb("should reject non-Bearer token", async () => {
      const result = await validateApiKeyFromHeader("Basic abc123", getDb());

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("missing_header");
      }
    });

    itWithDb("should reject non-Apex Bearer token", async () => {
      const result = await validateApiKeyFromHeader("Bearer sk-openai-key", getDb());

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("invalid_format");
        expect(result.message).toBe("Token is not an Apex API key");
      }
    });
  });

  describe("Expired API Key Returns 401", () => {
    let createdKeyIds: string[] = [];

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      await cleanupApiKeys(createdKeyIds);
      createdKeyIds = [];
    });

    itWithDb("should reject expired API key", async () => {
      // Create a key that expired 1 hour ago
      const expiredDate = new Date(Date.now() - 60 * 60 * 1000);
      const testKey = await createTestApiKey("expired", {
        expiresAt: expiredDate,
      });
      createdKeyIds.push(testKey.id);

      const result = await validateApiKey(testKey.key, getDb());

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("key_expired");
        expect(result.message).toBe("API key has expired");
      }
    });

    itWithDb("should reject key that expired just now", async () => {
      // Create a key that expires at exactly now (in the past by the time we check)
      const justExpired = new Date(Date.now() - 1000); // 1 second ago
      const testKey = await createTestApiKey("just-expired", {
        expiresAt: justExpired,
      });
      createdKeyIds.push(testKey.id);

      const result = await validateApiKey(testKey.key, getDb());

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("key_expired");
      }
    });

    itWithDb("should accept key that expires in the future", async () => {
      // Create a key that expires 1 hour from now
      const futureExpiration = new Date(Date.now() + 60 * 60 * 1000);
      const testKey = await createTestApiKey("future-expiry", {
        expiresAt: futureExpiration,
      });
      createdKeyIds.push(testKey.id);

      const result = await validateApiKey(testKey.key, getDb());

      expect(result.valid).toBe(true);
    });

    itWithDb("should accept key with no expiration date", async () => {
      const testKey = await createTestApiKey("no-expiry", {
        expiresAt: null,
      });
      createdKeyIds.push(testKey.id);

      const result = await validateApiKey(testKey.key, getDb());

      expect(result.valid).toBe(true);
    });

    itWithDb("should check expiration using isApiKeyValid", async () => {
      // Expired key
      const expiredDate = new Date(Date.now() - 60 * 60 * 1000);
      const expiredKey = await createTestApiKey("expired-check", {
        expiresAt: expiredDate,
      });
      createdKeyIds.push(expiredKey.id);

      const isExpiredValid = await isApiKeyValid(expiredKey.hash, getDb());
      expect(isExpiredValid).toBe(false);

      // Valid key
      const validKey = await createTestApiKey("valid-check");
      createdKeyIds.push(validKey.id);

      const isValidKeyValid = await isApiKeyValid(validKey.hash, getDb());
      expect(isValidKeyValid).toBe(true);
    });
  });

  describe("Revoked API Key Returns 401", () => {
    let createdKeyIds: string[] = [];

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      await cleanupApiKeys(createdKeyIds);
      createdKeyIds = [];
    });

    itWithDb("should reject revoked (inactive) API key", async () => {
      const testKey = await createTestApiKey("revoked", {
        isActive: false,
      });
      createdKeyIds.push(testKey.id);

      const result = await validateApiKey(testKey.key, getDb());

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("key_inactive");
        expect(result.message).toBe("API key has been revoked");
      }
    });

    itWithDb("should reject key after revocation", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create active key
      const testKey = await createTestApiKey("to-be-revoked", {
        isActive: true,
      });
      createdKeyIds.push(testKey.id);

      // Verify key is valid
      const beforeRevoke = await validateApiKey(testKey.key, getDb());
      expect(beforeRevoke.valid).toBe(true);

      // Revoke the key
      await db
        .update(schema.apiKeys)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.apiKeys.id, testKey.id));

      // Verify key is now invalid
      const afterRevoke = await validateApiKey(testKey.key, getDb());
      expect(afterRevoke.valid).toBe(false);
      if (!afterRevoke.valid) {
        expect(afterRevoke.reason).toBe("key_inactive");
      }
    });

    itWithDb("should check revocation using isApiKeyValid", async () => {
      const revokedKey = await createTestApiKey("revoked-check", {
        isActive: false,
      });
      createdKeyIds.push(revokedKey.id);

      const isValid = await isApiKeyValid(revokedKey.hash, getDb());
      expect(isValid).toBe(false);
    });
  });

  describe("lastUsedAt Updated on Auth", () => {
    let createdKeyIds: string[] = [];

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      await cleanupApiKeys(createdKeyIds);
      createdKeyIds = [];
    });

    itWithDb("should update lastUsedAt on successful authentication", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const testKey = await createTestApiKey("last-used");
      createdKeyIds.push(testKey.id);

      // Check initial state - lastUsedAt should be null
      const [beforeAuth] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, testKey.id))
        .limit(1);

      expect(beforeAuth.lastUsedAt).toBeNull();

      // Authenticate
      const result = await validateApiKey(testKey.key, getDb());
      expect(result.valid).toBe(true);

      // Wait a bit for the async lastUsedAt update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check lastUsedAt was updated
      const [afterAuth] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, testKey.id))
        .limit(1);

      expect(afterAuth.lastUsedAt).not.toBeNull();
      expect(new Date(afterAuth.lastUsedAt!).getTime()).toBeGreaterThan(
        Date.now() - 5000 // Within last 5 seconds
      );
    });

    itWithDb("should not update lastUsedAt on failed authentication", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create revoked key
      const testKey = await createTestApiKey("no-update", {
        isActive: false,
      });
      createdKeyIds.push(testKey.id);

      // Try to authenticate (should fail)
      const result = await validateApiKey(testKey.key, getDb());
      expect(result.valid).toBe(false);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check lastUsedAt was NOT updated
      const [afterAuth] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, testKey.id))
        .limit(1);

      expect(afterAuth.lastUsedAt).toBeNull();
    });

    itWithDb("should not update lastUsedAt when using isApiKeyValid", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const testKey = await createTestApiKey("no-update-check");
      createdKeyIds.push(testKey.id);

      // Check validity (should not update lastUsedAt)
      const isValid = await isApiKeyValid(testKey.hash, getDb());
      expect(isValid).toBe(true);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check lastUsedAt was NOT updated
      const [afterCheck] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, testKey.id))
        .limit(1);

      expect(afterCheck.lastUsedAt).toBeNull();
    });
  });

  describe("API Key Auth Context", () => {
    it("should read context from headers when authenticated", () => {
      const headers = new Headers();
      headers.set(API_KEY_AUTH_HEADERS.AUTH_TYPE, "api-key");
      headers.set(API_KEY_AUTH_HEADERS.KEY_ID, "key-123");
      headers.set(API_KEY_AUTH_HEADERS.USER_ID, "user-456");
      headers.set(API_KEY_AUTH_HEADERS.ORG_ID, "org-789");
      headers.set(API_KEY_AUTH_HEADERS.USER_EMAIL, "test@example.com");
      headers.set(API_KEY_AUTH_HEADERS.USER_NAME, "Test User");
      headers.set(API_KEY_AUTH_HEADERS.ORG_NAME, "Test Org");

      const context = getApiKeyAuthContext(headers);

      expect(context).not.toBeNull();
      expect(context!.authType).toBe("api-key");
      expect(context!.keyId).toBe("key-123");
      expect(context!.userId).toBe("user-456");
      expect(context!.organizationId).toBe("org-789");
      expect(context!.userEmail).toBe("test@example.com");
      expect(context!.userName).toBe("Test User");
      expect(context!.organizationName).toBe("Test Org");
    });

    it("should return null when not authenticated via API key", () => {
      const headers = new Headers();
      // No API key auth headers set

      const context = getApiKeyAuthContext(headers);

      expect(context).toBeNull();
    });

    it("should return null when auth type is not api-key", () => {
      const headers = new Headers();
      headers.set(API_KEY_AUTH_HEADERS.AUTH_TYPE, "session");

      const context = getApiKeyAuthContext(headers);

      expect(context).toBeNull();
    });

    it("should return null when required headers are missing", () => {
      const headers = new Headers();
      headers.set(API_KEY_AUTH_HEADERS.AUTH_TYPE, "api-key");
      // Missing KEY_ID, USER_ID, ORG_ID

      const context = getApiKeyAuthContext(headers);

      expect(context).toBeNull();
    });

    it("should detect API key authentication", () => {
      const apiKeyHeaders = new Headers();
      apiKeyHeaders.set(API_KEY_AUTH_HEADERS.AUTH_TYPE, "api-key");

      expect(isApiKeyAuthenticated(apiKeyHeaders)).toBe(true);

      const sessionHeaders = new Headers();
      expect(isApiKeyAuthenticated(sessionHeaders)).toBe(false);
    });
  });

  describe("External Service Keys Excluded", () => {
    let createdKeyIds: string[] = [];

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      await cleanupApiKeys(createdKeyIds);
      createdKeyIds = [];
    });

    itWithDb("should not authenticate with external service API key", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create an external service key (type = "openai")
      const { key, hash } = await generateApiKey();
      const keyId = `external-service-${Date.now()}`;
      createdKeyIds.push(keyId);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyId,
          organizationId: TEST_IDS.ORG,
          // No userId for external service keys
          name: "External OpenAI Key",
          type: "openai", // External service type, not "user"
          encryptedKey: encryptApiKey(key),
          keyHash: hash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Try to authenticate - should fail because type != "user"
      const result = await validateApiKey(key, getDb());

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("key_not_found");
      }
    });
  });

  describe("Full Authentication Flow", () => {
    let createdKeyIds: string[] = [];

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      await cleanupApiKeys(createdKeyIds);
      createdKeyIds = [];
    });

    itWithDb("should complete full auth flow: generate -> store -> validate -> track", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Step 1: Generate key
      const { key, hash } = await generateApiKey();
      expect(key.startsWith("apx_")).toBe(true);

      const keyId = `full-flow-${Date.now()}`;
      const userId = TEST_IDS.USERS[0];
      createdKeyIds.push(keyId);

      // Step 2: Store key
      await db
        .insert(schema.apiKeys)
        .values({
          id: keyId,
          organizationId: TEST_IDS.ORG,
          userId,
          name: "Full Flow Test Key",
          type: "user",
          encryptedKey: encryptApiKey(key),
          keyHash: hash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Step 3: Validate via header
      const authHeader = `Bearer ${key}`;
      const result = await validateApiKeyFromHeader(authHeader, getDb());

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.keyId).toBe(keyId);
        expect(result.userId).toBe(userId);
        expect(result.organizationId).toBe(TEST_IDS.ORG);
      }

      // Step 4: Verify lastUsedAt was updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      const [updatedKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyId))
        .limit(1);

      expect(updatedKey.lastUsedAt).not.toBeNull();

      // Step 5: Revoke and verify rejection
      await db
        .update(schema.apiKeys)
        .set({ isActive: false })
        .where(eq(schema.apiKeys.id, keyId));

      const revokedResult = await validateApiKey(key, getDb());
      expect(revokedResult.valid).toBe(false);
    });
  });
});
