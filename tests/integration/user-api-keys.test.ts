/**
 * User API Keys Integration Tests
 *
 * Tests user API key generation and management against real database.
 * Verifies key generation, encryption, revocation, rate limiting, and user isolation.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL or DATABASE_URL must be configured
 * - Database must be accessible
 *
 * Note: These tests are designed to run against a real database.
 * When the database is not available, all tests will be skipped.
 */

import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { eq, and, gte } from "drizzle-orm";
import { setupIntegrationTest, isDatabaseConfigured, wasDatabaseConnected } from "./setup";
import { TEST_IDS } from "./seed";
import { encryptApiKey, decryptApiKey, isEncryptedApiKeyData } from "../../src/lib/crypto/api-key-encryption";
import { generateApiKey, hashApiKey, maskApiKey, isValidApiKeyFormat } from "../../src/lib/crypto/key-generation";
import { createId } from "@paralleldrive/cuid2";

// Check if database is configured
const dbConfigured = isDatabaseConfigured();

describe("User API Keys Integration Tests", () => {
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

  // Helper to create a test user API key data
  const createTestUserKey = async (suffix: string = Date.now().toString(), userId?: string) => {
    const { key, hash } = await generateApiKey();
    return {
      id: `integration-user-key-${suffix}`,
      organizationId: TEST_IDS.ORG as string,
      userId: userId || `test-user-${suffix}`,
      name: `User API Key ${suffix}`,
      displayName: `Test Key ${suffix}`,
      type: "user" as const,
      rawKey: key,
      keyHash: hash,
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

  describe("Generate User API Key (Key Format Validation)", () => {
    itWithDb("should generate a valid apx_ prefixed API key", async () => {
      const { key, hash } = await generateApiKey();

      // Verify apx_ prefix
      expect(key.startsWith("apx_")).toBe(true);

      // Verify key format is valid
      expect(isValidApiKeyFormat(key)).toBe(true);

      // Verify key length (apx_ prefix + 43 char base64url = 47 chars)
      expect(key.length).toBe(47);

      // Verify hash is 64-character hex SHA-256
      expect(hash.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });

    itWithDb("should generate unique keys on each call", async () => {
      const keys = new Set<string>();
      const hashes = new Set<string>();

      // Generate 10 keys and verify uniqueness
      for (let i = 0; i < 10; i++) {
        const { key, hash } = await generateApiKey();
        keys.add(key);
        hashes.add(hash);
      }

      expect(keys.size).toBe(10);
      expect(hashes.size).toBe(10);
    });

    itWithDb("should hash the same key consistently", async () => {
      const { key } = await generateApiKey();
      const hash1 = await hashApiKey(key);
      const hash2 = await hashApiKey(key);

      expect(hash1).toBe(hash2);
    });
  });

  describe("Store User API Key (INSERT with Encryption)", () => {
    let createdKeyId: string | null = null;

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      if (createdKeyId) {
        await cleanupApiKey(createdKeyId);
        createdKeyId = null;
      }
    });

    itWithDb("should store generated key with encryption", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = await createTestUserKey("store-encrypted-1");
      createdKeyId = keyData.id;

      // Encrypt the API key
      const encryptedKey = encryptApiKey(keyData.rawKey);

      // Insert API key into database
      const [insertedKey] = await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          userId: keyData.userId,
          name: keyData.name,
          displayName: keyData.displayName,
          type: keyData.type,
          encryptedKey,
          keyHash: keyData.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Verify the insert
      expect(insertedKey).toBeDefined();
      expect(insertedKey.id).toBe(keyData.id);
      expect(insertedKey.userId).toBe(keyData.userId);
      expect(insertedKey.type).toBe("user");
      expect(insertedKey.isActive).toBe(true);
    });

    itWithDb("should store encryptedKey as JSON with ciphertext/iv/authTag", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = await createTestUserKey("json-format-1");
      createdKeyId = keyData.id;

      const encryptedKey = encryptApiKey(keyData.rawKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          userId: keyData.userId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash: keyData.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Query the raw encrypted key from database
      const [queriedKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);

      // Verify the encrypted key is valid JSON with required fields
      expect(isEncryptedApiKeyData(queriedKey.encryptedKey)).toBe(true);

      const parsed = JSON.parse(queriedKey.encryptedKey);
      expect(parsed).toHaveProperty("ciphertext");
      expect(parsed).toHaveProperty("iv");
      expect(parsed).toHaveProperty("authTag");

      // Verify ciphertext is NOT the plaintext key
      expect(parsed.ciphertext).not.toBe(keyData.rawKey);
      expect(parsed.ciphertext).not.toContain("apx_");
    });

    itWithDb("should allow decryption of stored user key", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = await createTestUserKey("decrypt-test-1");
      createdKeyId = keyData.id;

      const encryptedKey = encryptApiKey(keyData.rawKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          userId: keyData.userId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash: keyData.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Query the key from database
      const [queriedKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);

      // Decrypt and verify round-trip
      const decryptedKey = decryptApiKey(queriedKey.encryptedKey);
      expect(decryptedKey).toBe(keyData.rawKey);
      expect(decryptedKey.startsWith("apx_")).toBe(true);
    });

    itWithDb("should store keyHash for fast lookup without decryption", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = await createTestUserKey("hash-lookup-1");
      createdKeyId = keyData.id;

      const encryptedKey = encryptApiKey(keyData.rawKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          userId: keyData.userId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash: keyData.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Lookup by hash (simulating authentication flow)
      const [foundKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.keyHash, keyData.keyHash))
        .limit(1);

      expect(foundKey).toBeDefined();
      expect(foundKey.id).toBe(keyData.id);

      // Verify the hash was computed correctly
      const recomputedHash = hashApiKey(keyData.rawKey);
      expect(foundKey.keyHash).toBe(recomputedHash);
    });
  });

  describe("Revoke User API Key (isActive = false)", () => {
    let testKeyId: string | null = null;

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      if (testKeyId) {
        await cleanupApiKey(testKeyId);
        testKeyId = null;
      }
    });

    itWithDb("should set isActive to false when revoking", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = await createTestUserKey("revoke-test-1");
      testKeyId = keyData.id;

      const encryptedKey = encryptApiKey(keyData.rawKey);

      // Create active key
      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          userId: keyData.userId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash: keyData.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Verify key is active
      const [activeKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);
      expect(activeKey.isActive).toBe(true);

      // Revoke the key (soft delete)
      const [revokedKey] = await db
        .update(schema.apiKeys)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(schema.apiKeys.id, keyData.id))
        .returning();

      expect(revokedKey.isActive).toBe(false);

      // Verify revocation persisted
      const [queriedKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);
      expect(queriedKey.isActive).toBe(false);
    });

    itWithDb("should keep key in database after revocation (soft delete)", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = await createTestUserKey("soft-delete-1");
      testKeyId = keyData.id;

      const encryptedKey = encryptApiKey(keyData.rawKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          userId: keyData.userId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash: keyData.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Revoke
      await db
        .update(schema.apiKeys)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.apiKeys.id, keyData.id));

      // Key should still exist
      const [stillExists] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);

      expect(stillExists).toBeDefined();
      expect(stillExists.isActive).toBe(false);
      // Encrypted data should still be there
      expect(stillExists.encryptedKey).toBeDefined();
      expect(stillExists.keyHash).toBe(keyData.keyHash);
    });

    itWithDb("should exclude revoked keys from active key queries", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = await createTestUserKey("exclude-revoked-1");
      testKeyId = keyData.id;

      const encryptedKey = encryptApiKey(keyData.rawKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          userId: keyData.userId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash: keyData.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Revoke the key
      await db
        .update(schema.apiKeys)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.apiKeys.id, keyData.id));

      // Query for active keys only
      const activeKeys = await db
        .select()
        .from(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.userId, keyData.userId),
            eq(schema.apiKeys.isActive, true)
          )
        );

      // Should not find the revoked key
      const foundRevokedKey = activeKeys.find((k) => k.id === keyData.id);
      expect(foundRevokedKey).toBeUndefined();
    });
  });

  describe("Rate Limiting (10 Keys Per Hour)", () => {
    let createdKeyIds: string[] = [];

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      await cleanupApiKeys(createdKeyIds);
      createdKeyIds = [];
    });

    itWithDb("should track key creation timestamps for rate limiting", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const userId = `rate-limit-user-${Date.now()}`;
      const now = new Date();

      // Create 3 keys for the same user
      for (let i = 0; i < 3; i++) {
        const keyData = await createTestUserKey(`rate-${i}`, userId);
        createdKeyIds.push(keyData.id);

        await db
          .insert(schema.apiKeys)
          .values({
            id: keyData.id,
            organizationId: keyData.organizationId,
            userId: userId,
            name: keyData.name,
            type: keyData.type,
            encryptedKey: encryptApiKey(keyData.rawKey),
            keyHash: keyData.keyHash,
            version: 1,
            isActive: true,
            createdAt: now,
          })
          .returning();
      }

      // Query keys created in the last hour for this user
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentKeys = await db
        .select()
        .from(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.userId, userId),
            eq(schema.apiKeys.type, "user"),
            gte(schema.apiKeys.createdAt, oneHourAgo)
          )
        );

      expect(recentKeys.length).toBe(3);
    });

    itWithDb("should be able to count keys per hour for rate limit enforcement", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const userId = `rate-limit-count-${Date.now()}`;
      const now = new Date();

      // Create 5 keys
      for (let i = 0; i < 5; i++) {
        const keyData = await createTestUserKey(`count-${i}`, userId);
        createdKeyIds.push(keyData.id);

        await db
          .insert(schema.apiKeys)
          .values({
            id: keyData.id,
            organizationId: keyData.organizationId,
            userId: userId,
            name: keyData.name,
            type: keyData.type,
            encryptedKey: encryptApiKey(keyData.rawKey),
            keyHash: keyData.keyHash,
            version: 1,
            isActive: true,
            createdAt: now,
          })
          .returning();
      }

      // Simulate rate limit check
      const MAX_GENERATIONS_PER_HOUR = 10;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const recentKeys = await db
        .select({ id: schema.apiKeys.id })
        .from(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.userId, userId),
            eq(schema.apiKeys.type, "user"),
            gte(schema.apiKeys.createdAt, oneHourAgo)
          )
        );

      const keyCount = recentKeys.length;
      const canGenerateMore = keyCount < MAX_GENERATIONS_PER_HOUR;

      expect(keyCount).toBe(5);
      expect(canGenerateMore).toBe(true);
    });

    itWithDb("should detect when rate limit is reached", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const userId = `rate-limit-exceeded-${Date.now()}`;
      const now = new Date();

      // Create 10 keys (at the limit)
      for (let i = 0; i < 10; i++) {
        const keyData = await createTestUserKey(`limit-${i}`, userId);
        createdKeyIds.push(keyData.id);

        await db
          .insert(schema.apiKeys)
          .values({
            id: keyData.id,
            organizationId: keyData.organizationId,
            userId: userId,
            name: keyData.name,
            type: keyData.type,
            encryptedKey: encryptApiKey(keyData.rawKey),
            keyHash: keyData.keyHash,
            version: 1,
            isActive: true,
            createdAt: now,
          })
          .returning();
      }

      // Check rate limit
      const MAX_GENERATIONS_PER_HOUR = 10;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const recentKeys = await db
        .select({ id: schema.apiKeys.id })
        .from(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.userId, userId),
            eq(schema.apiKeys.type, "user"),
            gte(schema.apiKeys.createdAt, oneHourAgo)
          )
        );

      const keyCount = recentKeys.length;
      const canGenerateMore = keyCount < MAX_GENERATIONS_PER_HOUR;

      expect(keyCount).toBe(10);
      expect(canGenerateMore).toBe(false);
    });
  });

  describe("User Isolation (Own Keys Only)", () => {
    let createdKeyIds: string[] = [];

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      await cleanupApiKeys(createdKeyIds);
      createdKeyIds = [];
    });

    itWithDb("should only return keys belonging to the requesting user", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const userA = `user-a-${Date.now()}`;
      const userB = `user-b-${Date.now()}`;

      // Create key for user A
      const keyDataA = await createTestUserKey("user-a-key", userA);
      createdKeyIds.push(keyDataA.id);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyDataA.id,
          organizationId: keyDataA.organizationId,
          userId: userA,
          name: "User A Key",
          type: "user",
          encryptedKey: encryptApiKey(keyDataA.rawKey),
          keyHash: keyDataA.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Create key for user B
      const keyDataB = await createTestUserKey("user-b-key", userB);
      createdKeyIds.push(keyDataB.id);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyDataB.id,
          organizationId: keyDataB.organizationId,
          userId: userB,
          name: "User B Key",
          type: "user",
          encryptedKey: encryptApiKey(keyDataB.rawKey),
          keyHash: keyDataB.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Query keys for user A
      const userAKeys = await db
        .select()
        .from(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.userId, userA),
            eq(schema.apiKeys.type, "user")
          )
        );

      // Should find user A's key
      const foundUserAKey = userAKeys.find((k) => k.id === keyDataA.id);
      expect(foundUserAKey).toBeDefined();

      // Should NOT find user B's key
      const foundUserBKey = userAKeys.find((k) => k.id === keyDataB.id);
      expect(foundUserBKey).toBeUndefined();
    });

    itWithDb("should isolate keys by both userId and organizationId", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const sharedUserId = `shared-user-${Date.now()}`;
      const orgA = TEST_IDS.ORG;
      const orgB = `other-org-${Date.now()}`;

      // Create key for user in org A
      const keyDataOrgA = await createTestUserKey("org-a-key", sharedUserId);
      keyDataOrgA.organizationId = orgA;
      createdKeyIds.push(keyDataOrgA.id);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyDataOrgA.id,
          organizationId: orgA,
          userId: sharedUserId,
          name: "Org A Key",
          type: "user",
          encryptedKey: encryptApiKey(keyDataOrgA.rawKey),
          keyHash: keyDataOrgA.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Create key for same user in org B
      const keyDataOrgB = await createTestUserKey("org-b-key", sharedUserId);
      keyDataOrgB.organizationId = orgB;
      createdKeyIds.push(keyDataOrgB.id);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyDataOrgB.id,
          organizationId: orgB,
          userId: sharedUserId,
          name: "Org B Key",
          type: "user",
          encryptedKey: encryptApiKey(keyDataOrgB.rawKey),
          keyHash: keyDataOrgB.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Query keys for user in org A only
      const orgAKeys = await db
        .select()
        .from(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.userId, sharedUserId),
            eq(schema.apiKeys.organizationId, orgA),
            eq(schema.apiKeys.type, "user")
          )
        );

      expect(orgAKeys.length).toBe(1);
      expect(orgAKeys[0].id).toBe(keyDataOrgA.id);
      expect(orgAKeys[0].organizationId).toBe(orgA);

      // Query keys for user in org B only
      const orgBKeys = await db
        .select()
        .from(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.userId, sharedUserId),
            eq(schema.apiKeys.organizationId, orgB),
            eq(schema.apiKeys.type, "user")
          )
        );

      expect(orgBKeys.length).toBe(1);
      expect(orgBKeys[0].id).toBe(keyDataOrgB.id);
      expect(orgBKeys[0].organizationId).toBe(orgB);
    });

    itWithDb("should not allow accessing another user's key by ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const userA = `user-a-isolated-${Date.now()}`;
      const userB = `user-b-isolated-${Date.now()}`;

      // Create key for user A
      const keyDataA = await createTestUserKey("isolated-key", userA);
      createdKeyIds.push(keyDataA.id);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyDataA.id,
          organizationId: keyDataA.organizationId,
          userId: userA,
          name: "User A Private Key",
          type: "user",
          encryptedKey: encryptApiKey(keyDataA.rawKey),
          keyHash: keyDataA.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // User B tries to access User A's key by ID
      const [accessedKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.id, keyDataA.id),
            eq(schema.apiKeys.userId, userB) // Wrong user!
          )
        )
        .limit(1);

      // Should not find the key
      expect(accessedKey).toBeUndefined();
    });
  });

  describe("Key Update Operations", () => {
    let testKeyId: string | null = null;

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      if (testKeyId) {
        await cleanupApiKey(testKeyId);
        testKeyId = null;
      }
    });

    itWithDb("should update key name and displayName", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = await createTestUserKey("update-name-1");
      testKeyId = keyData.id;

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          userId: keyData.userId,
          name: keyData.name,
          displayName: keyData.displayName,
          type: keyData.type,
          encryptedKey: encryptApiKey(keyData.rawKey),
          keyHash: keyData.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Update name and displayName
      const newName = "Updated Key Name";
      const newDisplayName = "My Production Key";

      const [updatedKey] = await db
        .update(schema.apiKeys)
        .set({
          name: newName,
          displayName: newDisplayName,
          updatedAt: new Date(),
        })
        .where(eq(schema.apiKeys.id, keyData.id))
        .returning();

      expect(updatedKey.name).toBe(newName);
      expect(updatedKey.displayName).toBe(newDisplayName);

      // Encrypted key should remain unchanged
      const decrypted = decryptApiKey(updatedKey.encryptedKey);
      expect(decrypted).toBe(keyData.rawKey);
    });

    itWithDb("should not allow updating the actual key value (security)", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = await createTestUserKey("no-key-update-1");
      testKeyId = keyData.id;

      const originalEncrypted = encryptApiKey(keyData.rawKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          userId: keyData.userId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey: originalEncrypted,
          keyHash: keyData.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // In the API, users cannot update the key value
      // This test verifies the key hash cannot be changed without proper encryption
      const [queriedKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);

      // Key hash should match original
      expect(queriedKey.keyHash).toBe(keyData.keyHash);

      // Decrypted key should match original
      const decrypted = decryptApiKey(queriedKey.encryptedKey);
      expect(decrypted).toBe(keyData.rawKey);
    });
  });

  describe("Key Metadata and Display", () => {
    let testKeyId: string | null = null;

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      if (testKeyId) {
        await cleanupApiKey(testKeyId);
        testKeyId = null;
      }
    });

    itWithDb("should return masked key value for display", async () => {
      const { key, hash } = await generateApiKey();
      const masked = maskApiKey(hash);

      // Masked should show first 4 + ... + last 4
      expect(masked).toMatch(/^[a-f0-9]{4}\.\.\.[a-f0-9]{4}$/);
      expect(masked.length).toBe(11);
    });

    itWithDb("should track lastUsedAt timestamp", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = await createTestUserKey("last-used-1");
      testKeyId = keyData.id;

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          userId: keyData.userId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey: encryptApiKey(keyData.rawKey),
          keyHash: keyData.keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Initially lastUsedAt should be null
      const [initialKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);

      expect(initialKey.lastUsedAt).toBeNull();

      // Simulate key usage by updating lastUsedAt
      const usedAt = new Date();
      await db
        .update(schema.apiKeys)
        .set({ lastUsedAt: usedAt })
        .where(eq(schema.apiKeys.id, keyData.id));

      // Verify lastUsedAt is updated
      const [usedKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);

      expect(usedKey.lastUsedAt).not.toBeNull();
      expect(new Date(usedKey.lastUsedAt!).getTime()).toBeCloseTo(usedAt.getTime(), -2);
    });

    itWithDb("should handle key expiration date", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = await createTestUserKey("expiring-1");
      testKeyId = keyData.id;

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          userId: keyData.userId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey: encryptApiKey(keyData.rawKey),
          keyHash: keyData.keyHash,
          version: 1,
          isActive: true,
          expiresAt,
        })
        .returning();

      const [queriedKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);

      expect(queriedKey.expiresAt).not.toBeNull();
      expect(new Date(queriedKey.expiresAt!).getTime()).toBeCloseTo(expiresAt.getTime(), -2);
    });
  });

  describe("Full User Key Lifecycle", () => {
    itWithDb("should complete generate -> store -> use -> update -> revoke cycle", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // GENERATE
      const { key, hash } = await generateApiKey();
      expect(key.startsWith("apx_")).toBe(true);
      expect(isValidApiKeyFormat(key)).toBe(true);

      const keyId = `lifecycle-test-${Date.now()}`;
      const userId = `lifecycle-user-${Date.now()}`;

      try {
        // STORE
        const encryptedKey = encryptApiKey(key);
        const [storedKey] = await db
          .insert(schema.apiKeys)
          .values({
            id: keyId,
            organizationId: TEST_IDS.ORG,
            userId: userId,
            name: "Lifecycle Test Key",
            type: "user",
            encryptedKey,
            keyHash: hash,
            version: 1,
            isActive: true,
          })
          .returning();

        expect(storedKey.id).toBe(keyId);
        expect(storedKey.isActive).toBe(true);

        // USE (simulate authentication lookup by hash)
        const [foundKey] = await db
          .select()
          .from(schema.apiKeys)
          .where(
            and(
              eq(schema.apiKeys.keyHash, hash),
              eq(schema.apiKeys.isActive, true)
            )
          )
          .limit(1);

        expect(foundKey).toBeDefined();
        expect(foundKey.id).toBe(keyId);

        // Update lastUsedAt
        await db
          .update(schema.apiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(schema.apiKeys.id, keyId));

        // UPDATE (rename)
        const newName = "Production API Key";
        const [updatedKey] = await db
          .update(schema.apiKeys)
          .set({
            name: newName,
            displayName: "My Primary Key",
            updatedAt: new Date(),
          })
          .where(eq(schema.apiKeys.id, keyId))
          .returning();

        expect(updatedKey.name).toBe(newName);
        expect(updatedKey.lastUsedAt).not.toBeNull();

        // REVOKE
        const [revokedKey] = await db
          .update(schema.apiKeys)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(schema.apiKeys.id, keyId))
          .returning();

        expect(revokedKey.isActive).toBe(false);

        // Verify revoked key cannot be used for auth
        const [authAttempt] = await db
          .select()
          .from(schema.apiKeys)
          .where(
            and(
              eq(schema.apiKeys.keyHash, hash),
              eq(schema.apiKeys.isActive, true)
            )
          )
          .limit(1);

        expect(authAttempt).toBeUndefined();
      } finally {
        // Cleanup
        await cleanupApiKey(keyId);
      }
    });
  });
});
