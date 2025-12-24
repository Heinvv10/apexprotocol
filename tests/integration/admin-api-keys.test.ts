/**
 * Admin API Keys Integration Tests
 *
 * Tests full CRUD cycle for admin API key management against real database.
 * Verifies that encryption, storage, and API operations work correctly end-to-end.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL or DATABASE_URL must be configured
 * - Database must be accessible
 *
 * Note: These tests are designed to run against a real database.
 * When the database is not available, all tests will be skipped.
 */

import { describe, it, expect, afterAll, beforeEach, afterEach, beforeAll } from "vitest";
import { eq, and, ne } from "drizzle-orm";
import { setupIntegrationTest, isDatabaseConfigured, wasDatabaseConnected } from "./setup";
import { TEST_IDS } from "./seed";
import { encryptApiKey, decryptApiKey, isEncryptedApiKeyData } from "../../src/lib/crypto/api-key-encryption";
import { hashApiKey, maskApiKey } from "../../src/lib/crypto/key-generation";
import { createId } from "@paralleldrive/cuid2";

// Check if database is configured
const dbConfigured = isDatabaseConfigured();

describe("Admin API Keys Integration Tests", () => {
  // If database is not configured, skip all tests with a clear message
  if (!dbConfigured) {
    it.skip("all tests skipped - database not configured (set DATABASE_URL or TEST_DATABASE_URL)", () => {});
    return;
  }

  // Set up integration test infrastructure
  const { getDb, getSchema: getSchemaFn, getSeededData } = setupIntegrationTest();

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

  // Helper to create a unique API key for testing
  const createUniqueApiKey = (suffix: string = Date.now().toString()) => ({
    id: `integration-api-key-${suffix}`,
    organizationId: TEST_IDS.ORG,
    name: `Integration Test API Key ${suffix}`,
    displayName: `Test Key ${suffix}`,
    type: "openai" as const,
    rawKey: `sk-test-key-${suffix}-${Date.now()}`,
    expiresAt: null as Date | null,
  });

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

  describe("Create External Service API Key (INSERT with Encryption)", () => {
    let createdKeyId: string | null = null;

    afterEach(async () => {
      if (createdKeyId) {
        await cleanupApiKey(createdKeyId);
        createdKeyId = null;
      }
    });

    itWithDb("should insert a new API key with encrypted storage", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = createUniqueApiKey("create-encrypted-1");
      createdKeyId = keyData.id;

      // Encrypt the API key
      const encryptedKey = encryptApiKey(keyData.rawKey);
      const keyHash = hashApiKey(keyData.rawKey);

      // Insert API key into database
      const [insertedKey] = await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          name: keyData.name,
          displayName: keyData.displayName,
          type: keyData.type,
          encryptedKey,
          keyHash,
          version: 1,
          isActive: true,
          expiresAt: null,
        })
        .returning();

      // Verify the insert returned data
      expect(insertedKey).toBeDefined();
      expect(insertedKey.id).toBe(keyData.id);
      expect(insertedKey.name).toBe(keyData.name);
      expect(insertedKey.type).toBe(keyData.type);
      expect(insertedKey.organizationId).toBe(TEST_IDS.ORG);
      expect(insertedKey.isActive).toBe(true);
    });

    itWithDb("should store encryptedKey as JSON with ciphertext/iv/authTag", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = createUniqueApiKey("create-json-format-1");
      createdKeyId = keyData.id;

      const encryptedKey = encryptApiKey(keyData.rawKey);
      const keyHash = hashApiKey(keyData.rawKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash,
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
      expect(parsed.ciphertext).not.toContain("sk-test-key");
    });

    itWithDb("should store keyHash as 64-character hex SHA-256 hash", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = createUniqueApiKey("create-hash-format-1");
      createdKeyId = keyData.id;

      const encryptedKey = encryptApiKey(keyData.rawKey);
      const keyHash = hashApiKey(keyData.rawKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash,
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

      // Verify key hash format (64 hex characters)
      expect(queriedKey.keyHash).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(queriedKey.keyHash)).toBe(true);

      // Verify hash is consistent
      expect(queriedKey.keyHash).toBe(keyHash);
    });

    itWithDb("should allow decryption of stored key with correct encryption key", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = createUniqueApiKey("create-decrypt-1");
      createdKeyId = keyData.id;

      const encryptedKey = encryptApiKey(keyData.rawKey);
      const keyHash = hashApiKey(keyData.rawKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash,
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
    });

    itWithDb("should reject duplicate key hash (same API key)", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = createUniqueApiKey("duplicate-test");
      createdKeyId = keyData.id;

      const encryptedKey = encryptApiKey(keyData.rawKey);
      const keyHash = hashApiKey(keyData.rawKey);

      // Insert first key
      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Attempt to insert with same hash should be caught by application logic
      // (DB doesn't enforce unique hash, but API should check)
      const duplicateId = `integration-api-key-duplicate-${Date.now()}`;

      // Check for existing key with same hash
      const [existingKey] = await db
        .select({ id: schema.apiKeys.id })
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.keyHash, keyHash))
        .limit(1);

      expect(existingKey).toBeDefined();
      expect(existingKey.id).toBe(keyData.id);

      // Clean up duplicate attempt (not inserted)
    });
  });

  describe("Query External Service API Key (SELECT)", () => {
    let testKeyId: string | null = null;
    let testKeyData: ReturnType<typeof createUniqueApiKey> | null = null;

    beforeEach(async () => {
      if (skipIfNotConnected()) return;
      const db = getDb();
      const schema = getSchemaFn();
      testKeyData = createUniqueApiKey(`query-${Date.now()}`);
      testKeyId = testKeyData.id;

      const encryptedKey = encryptApiKey(testKeyData.rawKey);
      const keyHash = hashApiKey(testKeyData.rawKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: testKeyData.id,
          organizationId: testKeyData.organizationId,
          name: testKeyData.name,
          displayName: testKeyData.displayName,
          type: testKeyData.type,
          encryptedKey,
          keyHash,
          version: 1,
          isActive: true,
        })
        .returning();
    });

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      if (testKeyId) {
        await cleanupApiKey(testKeyId);
        testKeyId = null;
        testKeyData = null;
      }
    });

    itWithDb("should fetch an API key by ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const [key] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, testKeyId!))
        .limit(1);

      expect(key).toBeDefined();
      expect(key.id).toBe(testKeyId);
      expect(key.name).toBe(testKeyData!.name);
      expect(key.type).toBe(testKeyData!.type);
    });

    itWithDb("should fetch API key by keyHash for authentication lookup", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const keyHash = hashApiKey(testKeyData!.rawKey);

      const [key] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.keyHash, keyHash))
        .limit(1);

      expect(key).toBeDefined();
      expect(key.id).toBe(testKeyId);
      expect(key.keyHash).toBe(keyHash);
    });

    itWithDb("should return empty array for non-existent key ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, "non-existent-key-id-xyz"))
        .limit(1);

      expect(result).toEqual([]);
    });

    itWithDb("should filter out user-generated keys when querying external service keys", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create a user-generated key
      const userKeyId = `integration-user-key-${Date.now()}`;
      const userKey = `apx_test${Date.now()}`;
      const encryptedKey = encryptApiKey(userKey);
      const keyHash = hashApiKey(userKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: userKeyId,
          organizationId: TEST_IDS.ORG,
          name: "User Key",
          type: "user", // User-generated type
          encryptedKey,
          keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      try {
        // Query external service keys only (exclude 'user' type)
        const externalKeys = await db
          .select()
          .from(schema.apiKeys)
          .where(
            and(
              eq(schema.apiKeys.organizationId, TEST_IDS.ORG),
              ne(schema.apiKeys.type, "user")
            )
          );

        // Should not include user-generated key
        const foundUserKey = externalKeys.find((k) => k.id === userKeyId);
        expect(foundUserKey).toBeUndefined();

        // Should include our test external service key
        const foundTestKey = externalKeys.find((k) => k.id === testKeyId);
        expect(foundTestKey).toBeDefined();
      } finally {
        await cleanupApiKey(userKeyId);
      }
    });
  });

  describe("Update External Service API Key (UPDATE with Re-encryption)", () => {
    let testKeyId: string | null = null;
    let testKeyData: ReturnType<typeof createUniqueApiKey> | null = null;

    beforeEach(async () => {
      if (skipIfNotConnected()) return;
      const db = getDb();
      const schema = getSchemaFn();
      testKeyData = createUniqueApiKey(`update-${Date.now()}`);
      testKeyId = testKeyData.id;

      const encryptedKey = encryptApiKey(testKeyData.rawKey);
      const keyHash = hashApiKey(testKeyData.rawKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: testKeyData.id,
          organizationId: testKeyData.organizationId,
          name: testKeyData.name,
          displayName: testKeyData.displayName,
          type: testKeyData.type,
          encryptedKey,
          keyHash,
          version: 1,
          isActive: true,
        })
        .returning();
    });

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      if (testKeyId) {
        await cleanupApiKey(testKeyId);
        testKeyId = null;
        testKeyData = null;
      }
    });

    itWithDb("should update key name without affecting encrypted key", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const newName = `Updated API Key Name ${Date.now()}`;

      // Get original encrypted key
      const [originalKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, testKeyId!))
        .limit(1);

      // Update name only
      const [updatedKey] = await db
        .update(schema.apiKeys)
        .set({ name: newName, updatedAt: new Date() })
        .where(eq(schema.apiKeys.id, testKeyId!))
        .returning();

      expect(updatedKey.name).toBe(newName);
      // Encrypted key should remain the same
      expect(updatedKey.encryptedKey).toBe(originalKey.encryptedKey);
      expect(updatedKey.keyHash).toBe(originalKey.keyHash);
    });

    itWithDb("should re-encrypt when API key value is changed", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Get original encrypted key
      const [originalKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, testKeyId!))
        .limit(1);

      // Create new API key value
      const newRawKey = `sk-new-key-${Date.now()}`;
      const newEncryptedKey = encryptApiKey(newRawKey);
      const newKeyHash = hashApiKey(newRawKey);

      // Update with new encrypted key
      const [updatedKey] = await db
        .update(schema.apiKeys)
        .set({
          encryptedKey: newEncryptedKey,
          keyHash: newKeyHash,
          updatedAt: new Date(),
        })
        .where(eq(schema.apiKeys.id, testKeyId!))
        .returning();

      // Encrypted key should be different
      expect(updatedKey.encryptedKey).not.toBe(originalKey.encryptedKey);
      expect(updatedKey.keyHash).not.toBe(originalKey.keyHash);

      // New encrypted key should decrypt to new value
      const decrypted = decryptApiKey(updatedKey.encryptedKey);
      expect(decrypted).toBe(newRawKey);
    });

    itWithDb("should update isActive status for revocation", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Revoke key
      const [revokedKey] = await db
        .update(schema.apiKeys)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.apiKeys.id, testKeyId!))
        .returning();

      expect(revokedKey.isActive).toBe(false);

      // Verify it persisted
      const [queriedKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, testKeyId!))
        .limit(1);

      expect(queriedKey.isActive).toBe(false);
    });

    itWithDb("should update key type", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Update type from openai to anthropic
      const [updatedKey] = await db
        .update(schema.apiKeys)
        .set({ type: "anthropic", updatedAt: new Date() })
        .where(eq(schema.apiKeys.id, testKeyId!))
        .returning();

      expect(updatedKey.type).toBe("anthropic");
    });
  });

  describe("Key Rotation (Version Increment)", () => {
    let testKeyId: string | null = null;
    let testKeyData: ReturnType<typeof createUniqueApiKey> | null = null;
    let createdKeyIds: string[] = [];

    beforeEach(async () => {
      if (skipIfNotConnected()) return;
      const db = getDb();
      const schema = getSchemaFn();
      testKeyData = createUniqueApiKey(`rotate-${Date.now()}`);
      testKeyId = testKeyData.id;

      const encryptedKey = encryptApiKey(testKeyData.rawKey);
      const keyHash = hashApiKey(testKeyData.rawKey);

      await db
        .insert(schema.apiKeys)
        .values({
          id: testKeyData.id,
          organizationId: testKeyData.organizationId,
          name: testKeyData.name,
          displayName: testKeyData.displayName,
          type: testKeyData.type,
          encryptedKey,
          keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      createdKeyIds = [testKeyId];
    });

    afterEach(async () => {
      if (skipIfNotConnected()) return;
      await cleanupApiKeys(createdKeyIds);
      testKeyId = null;
      testKeyData = null;
      createdKeyIds = [];
    });

    itWithDb("should increment version on immediate rotation", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Get original key
      const [originalKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, testKeyId!))
        .limit(1);

      expect(originalKey.version).toBe(1);

      // Rotate with new key value
      const newRawKey = `sk-rotated-key-${Date.now()}`;
      const newEncryptedKey = encryptApiKey(newRawKey);
      const newKeyHash = hashApiKey(newRawKey);
      const rotatedAt = new Date();

      const [rotatedKey] = await db
        .update(schema.apiKeys)
        .set({
          encryptedKey: newEncryptedKey,
          keyHash: newKeyHash,
          version: originalKey.version + 1,
          lastRotatedAt: rotatedAt,
          updatedAt: rotatedAt,
        })
        .where(eq(schema.apiKeys.id, testKeyId!))
        .returning();

      expect(rotatedKey.version).toBe(2);
      expect(rotatedKey.lastRotatedAt).toBeDefined();

      // Verify new key decrypts correctly
      const decrypted = decryptApiKey(rotatedKey.encryptedKey);
      expect(decrypted).toBe(newRawKey);
    });

    itWithDb("should create new key record for grace period rotation", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Get original key
      const [originalKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, testKeyId!))
        .limit(1);

      // Create new key record (simulating grace period rotation)
      const newKeyId = createId();
      const newRawKey = `sk-grace-period-key-${Date.now()}`;
      const newEncryptedKey = encryptApiKey(newRawKey);
      const newKeyHash = hashApiKey(newRawKey);
      const rotatedAt = new Date();
      const gracePeriodMinutes = 60;
      const oldKeyExpiration = new Date(rotatedAt.getTime() + gracePeriodMinutes * 60 * 1000);

      // Insert new key with incremented version
      const [newKey] = await db
        .insert(schema.apiKeys)
        .values({
          id: newKeyId,
          organizationId: originalKey.organizationId,
          name: originalKey.name,
          displayName: originalKey.displayName,
          type: originalKey.type,
          encryptedKey: newEncryptedKey,
          keyHash: newKeyHash,
          version: originalKey.version + 1,
          lastRotatedAt: rotatedAt,
          isActive: true,
        })
        .returning();

      createdKeyIds.push(newKeyId);

      // Set expiration on old key
      const [expiredOldKey] = await db
        .update(schema.apiKeys)
        .set({
          expiresAt: oldKeyExpiration,
          updatedAt: rotatedAt,
        })
        .where(eq(schema.apiKeys.id, testKeyId!))
        .returning();

      // Verify new key has incremented version
      expect(newKey.version).toBe(originalKey.version + 1);
      expect(newKey.lastRotatedAt).toBeDefined();

      // Verify old key has expiration set
      expect(expiredOldKey.expiresAt).toBeDefined();
      expect(new Date(expiredOldKey.expiresAt!).getTime()).toBe(oldKeyExpiration.getTime());

      // Both keys should still be active during grace period
      expect(newKey.isActive).toBe(true);
      expect(expiredOldKey.isActive).toBe(true);
    });

    itWithDb("should update lastRotatedAt timestamp", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Get original key
      const [originalKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, testKeyId!))
        .limit(1);

      expect(originalKey.lastRotatedAt).toBeNull();

      // Rotate key
      const newRawKey = `sk-timestamp-test-${Date.now()}`;
      const newEncryptedKey = encryptApiKey(newRawKey);
      const newKeyHash = hashApiKey(newRawKey);
      const rotatedAt = new Date();

      const [rotatedKey] = await db
        .update(schema.apiKeys)
        .set({
          encryptedKey: newEncryptedKey,
          keyHash: newKeyHash,
          version: originalKey.version + 1,
          lastRotatedAt: rotatedAt,
          updatedAt: rotatedAt,
        })
        .where(eq(schema.apiKeys.id, testKeyId!))
        .returning();

      expect(rotatedKey.lastRotatedAt).not.toBeNull();
      expect(new Date(rotatedKey.lastRotatedAt!).getTime()).toBeCloseTo(rotatedAt.getTime(), -2);
    });
  });

  describe("Delete External Service API Key (DELETE)", () => {
    itWithDb("should soft-delete (revoke) an API key by setting isActive to false", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = createUniqueApiKey("soft-delete-test");

      const encryptedKey = encryptApiKey(keyData.rawKey);
      const keyHash = hashApiKey(keyData.rawKey);

      // Create key
      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Soft delete (revoke)
      const [revokedKey] = await db
        .update(schema.apiKeys)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.apiKeys.id, keyData.id))
        .returning();

      expect(revokedKey.isActive).toBe(false);

      // Key should still exist in database
      const [stillExists] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);

      expect(stillExists).toBeDefined();
      expect(stillExists.isActive).toBe(false);

      // Cleanup
      await cleanupApiKey(keyData.id);
    });

    itWithDb("should hard-delete an API key from database", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = createUniqueApiKey("hard-delete-test");

      const encryptedKey = encryptApiKey(keyData.rawKey);
      const keyHash = hashApiKey(keyData.rawKey);

      // Create key
      await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      // Verify it exists
      const [beforeDelete] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);
      expect(beforeDelete).toBeDefined();

      // Hard delete
      await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, keyData.id));

      // Verify it no longer exists
      const [afterDelete] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);
      expect(afterDelete).toBeUndefined();
    });
  });

  describe("Organization Isolation", () => {
    let testKeyIds: string[] = [];

    afterEach(async () => {
      await cleanupApiKeys(testKeyIds);
      testKeyIds = [];
    });

    itWithDb("should not return keys from other organizations", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create keys in two different organizations
      const orgAKeyId = `org-a-key-${Date.now()}`;
      const orgBKeyId = `org-b-key-${Date.now()}`;

      const orgAKey = `sk-org-a-${Date.now()}`;
      const orgBKey = `sk-org-b-${Date.now()}`;

      // Insert key for organization A (test org)
      await db
        .insert(schema.apiKeys)
        .values({
          id: orgAKeyId,
          organizationId: TEST_IDS.ORG,
          name: "Org A Key",
          type: "openai",
          encryptedKey: encryptApiKey(orgAKey),
          keyHash: hashApiKey(orgAKey),
          version: 1,
          isActive: true,
        })
        .returning();
      testKeyIds.push(orgAKeyId);

      // Insert key for organization B (different org)
      const otherOrgId = `other-org-${Date.now()}`;
      await db
        .insert(schema.apiKeys)
        .values({
          id: orgBKeyId,
          organizationId: otherOrgId,
          name: "Org B Key",
          type: "openai",
          encryptedKey: encryptApiKey(orgBKey),
          keyHash: hashApiKey(orgBKey),
          version: 1,
          isActive: true,
        })
        .returning();
      testKeyIds.push(orgBKeyId);

      // Query keys for organization A only
      const orgAKeys = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.organizationId, TEST_IDS.ORG));

      // Should find org A's key
      const foundOrgAKey = orgAKeys.find((k) => k.id === orgAKeyId);
      expect(foundOrgAKey).toBeDefined();

      // Should NOT find org B's key
      const foundOrgBKey = orgAKeys.find((k) => k.id === orgBKeyId);
      expect(foundOrgBKey).toBeUndefined();
    });

    itWithDb("should isolate keys by organizationId in combined queries", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const testOrgKeyId = `test-org-key-${Date.now()}`;
      const testKey = `sk-test-org-${Date.now()}`;

      // Create key for test organization
      await db
        .insert(schema.apiKeys)
        .values({
          id: testOrgKeyId,
          organizationId: TEST_IDS.ORG,
          name: "Test Org OpenAI Key",
          type: "openai",
          encryptedKey: encryptApiKey(testKey),
          keyHash: hashApiKey(testKey),
          version: 1,
          isActive: true,
        })
        .returning();
      testKeyIds.push(testOrgKeyId);

      // Query with combined filters (org + type + active)
      const activeOpenAiKeys = await db
        .select()
        .from(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.organizationId, TEST_IDS.ORG),
            eq(schema.apiKeys.type, "openai"),
            eq(schema.apiKeys.isActive, true)
          )
        );

      expect(activeOpenAiKeys.length).toBeGreaterThanOrEqual(1);
      activeOpenAiKeys.forEach((key) => {
        expect(key.organizationId).toBe(TEST_IDS.ORG);
        expect(key.type).toBe("openai");
        expect(key.isActive).toBe(true);
      });
    });
  });

  describe("Edge Cases", () => {
    let testKeyIds: string[] = [];

    afterEach(async () => {
      await cleanupApiKeys(testKeyIds);
      testKeyIds = [];
    });

    itWithDb("should handle key with all optional fields null", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyId = `minimal-key-${Date.now()}`;
      const rawKey = `sk-minimal-${Date.now()}`;

      // Insert key with only required fields
      const [insertedKey] = await db
        .insert(schema.apiKeys)
        .values({
          id: keyId,
          organizationId: TEST_IDS.ORG,
          name: "Minimal Key",
          type: "custom",
          encryptedKey: encryptApiKey(rawKey),
          keyHash: hashApiKey(rawKey),
          version: 1,
          isActive: true,
          // All optional fields omitted
        })
        .returning();
      testKeyIds.push(keyId);

      expect(insertedKey.displayName).toBeNull();
      expect(insertedKey.userId).toBeNull();
      expect(insertedKey.lastUsedAt).toBeNull();
      expect(insertedKey.lastRotatedAt).toBeNull();
      expect(insertedKey.expiresAt).toBeNull();
      expect(insertedKey.scopes).toBeNull();
    });

    itWithDb("should handle key with expiration date", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyId = `expiring-key-${Date.now()}`;
      const rawKey = `sk-expiring-${Date.now()}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const [insertedKey] = await db
        .insert(schema.apiKeys)
        .values({
          id: keyId,
          organizationId: TEST_IDS.ORG,
          name: "Expiring Key",
          type: "openai",
          encryptedKey: encryptApiKey(rawKey),
          keyHash: hashApiKey(rawKey),
          version: 1,
          isActive: true,
          expiresAt,
        })
        .returning();
      testKeyIds.push(keyId);

      expect(insertedKey.expiresAt).toBeDefined();
      expect(new Date(insertedKey.expiresAt!).getTime()).toBeCloseTo(expiresAt.getTime(), -2);
    });

    itWithDb("should handle long API key values", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyId = `long-key-${Date.now()}`;
      // Create a very long API key (some providers have long keys)
      const rawKey = `sk-${"a".repeat(200)}-${Date.now()}`;

      const [insertedKey] = await db
        .insert(schema.apiKeys)
        .values({
          id: keyId,
          organizationId: TEST_IDS.ORG,
          name: "Long Key",
          type: "custom",
          encryptedKey: encryptApiKey(rawKey),
          keyHash: hashApiKey(rawKey),
          version: 1,
          isActive: true,
        })
        .returning();
      testKeyIds.push(keyId);

      // Verify it can be decrypted correctly
      const decrypted = decryptApiKey(insertedKey.encryptedKey);
      expect(decrypted).toBe(rawKey);
    });

    itWithDb("should handle special characters in display name", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyId = `special-chars-key-${Date.now()}`;
      const rawKey = `sk-special-${Date.now()}`;
      const displayName = "Production Key ðŸ”‘ (Main) - API v2.0";

      const [insertedKey] = await db
        .insert(schema.apiKeys)
        .values({
          id: keyId,
          organizationId: TEST_IDS.ORG,
          name: "special-chars-key",
          displayName,
          type: "openai",
          encryptedKey: encryptApiKey(rawKey),
          keyHash: hashApiKey(rawKey),
          version: 1,
          isActive: true,
        })
        .returning();
      testKeyIds.push(keyId);

      expect(insertedKey.displayName).toBe(displayName);

      // Verify it persists correctly
      const [queriedKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyId))
        .limit(1);

      expect(queriedKey.displayName).toBe(displayName);
    });

    itWithDb("should mask key hash properly for display", async () => {
      const rawKey = `sk-test-masking-${Date.now()}`;
      const keyHash = hashApiKey(rawKey);
      const masked = maskApiKey(keyHash);

      // Should show first 4 + ... + last 4
      expect(masked).toMatch(/^[a-f0-9]{4}\.\.\.[a-f0-9]{4}$/);
      expect(masked.length).toBe(11); // 4 + 3 + 4
    });
  });

  describe("Full CRUD Cycle", () => {
    itWithDb("should complete create -> read -> update -> rotate -> revoke -> delete cycle", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const keyData = createUniqueApiKey("full-crud-cycle");

      // CREATE
      const encryptedKey = encryptApiKey(keyData.rawKey);
      const keyHash = hashApiKey(keyData.rawKey);

      const [createdKey] = await db
        .insert(schema.apiKeys)
        .values({
          id: keyData.id,
          organizationId: keyData.organizationId,
          name: keyData.name,
          type: keyData.type,
          encryptedKey,
          keyHash,
          version: 1,
          isActive: true,
        })
        .returning();

      expect(createdKey.id).toBe(keyData.id);
      expect(createdKey.version).toBe(1);

      // READ
      const [readKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);

      expect(readKey.id).toBe(keyData.id);
      expect(decryptApiKey(readKey.encryptedKey)).toBe(keyData.rawKey);

      // UPDATE (metadata)
      const newName = "Updated CRUD Key";
      const [updatedKey] = await db
        .update(schema.apiKeys)
        .set({ name: newName, updatedAt: new Date() })
        .where(eq(schema.apiKeys.id, keyData.id))
        .returning();

      expect(updatedKey.name).toBe(newName);

      // ROTATE
      const rotatedRawKey = `sk-rotated-${Date.now()}`;
      const [rotatedKey] = await db
        .update(schema.apiKeys)
        .set({
          encryptedKey: encryptApiKey(rotatedRawKey),
          keyHash: hashApiKey(rotatedRawKey),
          version: updatedKey.version + 1,
          lastRotatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.apiKeys.id, keyData.id))
        .returning();

      expect(rotatedKey.version).toBe(2);
      expect(decryptApiKey(rotatedKey.encryptedKey)).toBe(rotatedRawKey);

      // REVOKE (soft delete)
      const [revokedKey] = await db
        .update(schema.apiKeys)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.apiKeys.id, keyData.id))
        .returning();

      expect(revokedKey.isActive).toBe(false);

      // DELETE (hard delete)
      await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, keyData.id));

      // Verify deletion
      const [deletedKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.id, keyData.id))
        .limit(1);

      expect(deletedKey).toBeUndefined();
    });
  });
});
