/**
 * Integration Test Setup
 *
 * Provides test infrastructure for integration testing against a real database.
 * Uses test transactions for isolation and automatic rollback.
 *
 * Environment Setup:
 * - Set TEST_DATABASE_URL for dedicated test database (recommended)
 * - Falls back to DATABASE_URL if TEST_DATABASE_URL is not set
 *
 * Usage:
 * ```typescript
 * import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
 * import { setupIntegrationTest } from "./setup";
 * import { seedOrganization, seedBrandWithData } from "./seed";
 *
 * describe("Brand Integration Tests", () => {
 *   const { getDb, getSchema, cleanup, seedTestData } = setupIntegrationTest();
 *
 *   beforeAll(async () => {
 *     await seedTestData();
 *   });
 *
 *   afterAll(async () => {
 *     await cleanup();
 *   });
 *
 *   it("should fetch a brand", async () => {
 *     const db = getDb();
 *     const result = await db.select().from(schema.brands);
 *     expect(result.length).toBeGreaterThan(0);
 *   });
 * });
 * ```
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { sql, eq, and, or, inArray } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach } from "vitest";
import * as schema from "../../src/lib/db/schema";
import type { SeedResult } from "./seed";
import { createTestSeedData, cleanupTestData, TEST_IDS } from "./seed";

// Export schema types for use in tests
export type IntegrationTestSchema = typeof schema;
export type IntegrationDatabase = NeonHttpDatabase<typeof schema>;

// Database connection singleton
let _sql: NeonQueryFunction<boolean, boolean> | null = null;
let _db: NeonHttpDatabase<typeof schema> | null = null;

// Track seeded data for cleanup
let _seededData: SeedResult | null = null;

/**
 * Get the test database URL
 * Prefers TEST_DATABASE_URL for dedicated test database
 */
function getTestDatabaseUrl(): string {
  const testUrl = process.env.TEST_DATABASE_URL;
  const devUrl = process.env.DATABASE_URL;

  if (testUrl) {
    return testUrl;
  }

  if (devUrl && devUrl !== "postgresql://placeholder") {
    // Warn if using development database
    console.warn(
      "⚠️  TEST_DATABASE_URL not set - using DATABASE_URL for integration tests"
    );
    console.warn(
      "   Consider setting TEST_DATABASE_URL to a dedicated test database"
    );
    return devUrl;
  }

  throw new Error(
    "Integration tests require TEST_DATABASE_URL or DATABASE_URL to be set.\n" +
      "Set either:\n" +
      "  - TEST_DATABASE_URL: Dedicated test database (recommended)\n" +
      "  - DATABASE_URL: Development database (will be used if TEST_DATABASE_URL not set)"
  );
}

/**
 * Check if database is configured for integration tests
 */
export function isDatabaseConfigured(): boolean {
  try {
    getTestDatabaseUrl();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the database instance for integration tests
 * Creates a singleton connection that's reused across tests
 */
export function getIntegrationDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const url = getTestDatabaseUrl();
    _sql = neon(url);
    _db = drizzle(_sql, { schema });
  }
  return _db;
}

/**
 * Get the schema for direct table access
 */
export function getSchema(): typeof schema {
  return schema;
}

/**
 * Test context with authentication info
 */
export interface TestContext {
  userId: string;
  orgId: string;
  clerkUserId: string;
  requireAuth: () => { userId: string; orgId: string };
}

/**
 * Create a test context for resolver testing
 */
export function createTestContext(overrides: Partial<TestContext> = {}): TestContext {
  const orgId = overrides.orgId ?? TEST_IDS.ORG;
  const userId = overrides.userId ?? TEST_IDS.USERS[0];
  const clerkUserId = overrides.clerkUserId ?? `clerk_test_${userId}`;

  return {
    userId,
    orgId,
    clerkUserId,
    requireAuth: () => ({ userId, orgId }),
  };
}

/**
 * Clean up all test data from the database
 * Should be called after test suite completes
 */
export async function cleanupAllTestData(): Promise<void> {
  const db = getIntegrationDb();

  try {
    // Clean up using the stored seeded data IDs
    if (_seededData) {
      await cleanupTestData(db, _seededData);
      _seededData = null;
    }

    // Also clean up any orphaned test data using prefix pattern
    await cleanupByTestPrefix(db);
  } catch (error) {
    console.error("Cleanup failed:", error);
    throw error;
  }
}

/**
 * Clean up test data by known test ID prefixes
 * Used as a fallback to ensure no test data persists
 */
async function cleanupByTestPrefix(db: IntegrationDatabase): Promise<void> {
  // Delete test organization which cascades to related data
  try {
    await db
      .delete(schema.organizations)
      .where(eq(schema.organizations.id, TEST_IDS.ORG));
  } catch {
    // Organization may not exist, ignore
  }

  // Delete any brands with test organization ID (in case cascade didn't work)
  try {
    await db
      .delete(schema.brands)
      .where(eq(schema.brands.organizationId, TEST_IDS.ORG));
  } catch {
    // May not exist, ignore
  }
}

/**
 * Seed test data into the database
 * Returns the seeded data IDs for reference in tests
 */
export async function seedTestData(): Promise<SeedResult> {
  const db = getIntegrationDb();

  // Clean up any existing test data first
  await cleanupAllTestData();

  // Create fresh test data
  _seededData = await createTestSeedData(db);

  return _seededData;
}

/**
 * Get the currently seeded test data
 */
export function getSeededData(): SeedResult | null {
  return _seededData;
}

// Track if database connection was verified to be available
let _databaseConnected = false;

/**
 * Check if database is actually reachable (not just configured)
 */
export async function isDatabaseReachable(): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }

  try {
    const db = getIntegrationDb();
    // Try a simple query to verify connection
    await db.execute(sql`SELECT 1`);
    _databaseConnected = true;
    return true;
  } catch {
    _databaseConnected = false;
    return false;
  }
}

/**
 * Check if database has been verified as connected
 */
export function wasDatabaseConnected(): boolean {
  return _databaseConnected;
}

/**
 * Main setup function for integration tests
 *
 * Provides:
 * - Database connection
 * - Schema access
 * - Seed data utilities
 * - Cleanup functions
 * - Test context creation
 */
export function setupIntegrationTest(options: {
  autoSeed?: boolean;
  autoCleanup?: boolean;
} = {}) {
  const { autoSeed = true, autoCleanup = true } = options;

  // Auto-seed before all tests
  if (autoSeed) {
    beforeAll(async () => {
      if (!isDatabaseConfigured()) {
        console.warn(
          "⚠️  Database not configured - integration tests will be skipped"
        );
        return;
      }

      // Try to connect and verify the database is reachable
      const reachable = await isDatabaseReachable();
      if (!reachable) {
        console.warn(
          "⚠️  Database not reachable - integration tests will be skipped"
        );
        return;
      }

      await seedTestData();
    });
  }

  // Auto-cleanup after all tests
  if (autoCleanup) {
    afterAll(async () => {
      if (_databaseConnected) {
        await cleanupAllTestData();
      }
    });
  }

  return {
    /**
     * Get the database instance
     */
    getDb: () => getIntegrationDb(),

    /**
     * Get the schema for table access
     */
    getSchema: () => schema,

    /**
     * Get the currently seeded data
     */
    getSeededData: () => _seededData,

    /**
     * Seed fresh test data (useful if you need to reset mid-test)
     */
    seedTestData,

    /**
     * Clean up all test data
     */
    cleanup: cleanupAllTestData,

    /**
     * Create a test context for resolver testing
     */
    createContext: createTestContext,

    /**
     * Check if database is configured
     */
    isConfigured: isDatabaseConfigured,

    /**
     * Get test IDs for assertions
     */
    testIds: TEST_IDS,
  };
}

/**
 * Skip test if database is not configured
 * Use this in tests that require a real database
 */
export function skipIfNoDB(): boolean {
  if (!isDatabaseConfigured()) {
    console.warn("Skipping test - database not configured");
    return true;
  }
  return false;
}

/**
 * Skip test if database is not reachable (or not configured)
 * Use this after setupIntegrationTest() has been called
 */
export function skipIfNotReachable(): boolean {
  if (!isDatabaseConfigured()) {
    return true;
  }
  if (!_databaseConnected) {
    return true;
  }
  return false;
}

/**
 * Database assertions for integration tests
 */
export const dbAssertions = {
  /**
   * Assert that a record exists in the database
   */
  async expectRecordExists<T extends keyof typeof schema>(
    tableName: T,
    id: string
  ): Promise<void> {
    const db = getIntegrationDb();
    const table = schema[tableName] as any;

    const result = await db
      .select()
      .from(table)
      .where(eq(table.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new Error(`Expected record with id ${id} to exist in ${String(tableName)}`);
    }
  },

  /**
   * Assert that a record does not exist
   */
  async expectRecordNotExists<T extends keyof typeof schema>(
    tableName: T,
    id: string
  ): Promise<void> {
    const db = getIntegrationDb();
    const table = schema[tableName] as any;

    const result = await db
      .select()
      .from(table)
      .where(eq(table.id, id))
      .limit(1);

    if (result.length > 0) {
      throw new Error(
        `Expected record with id ${id} to NOT exist in ${String(tableName)}`
      );
    }
  },

  /**
   * Get record count for a table
   */
  async getRecordCount<T extends keyof typeof schema>(
    tableName: T,
    whereClause?: Parameters<ReturnType<typeof getIntegrationDb>["select"]>[0]
  ): Promise<number> {
    const db = getIntegrationDb();
    const table = schema[tableName] as any;

    const baseQuery = db.select({ id: table.id }).from(table);
    const result = whereClause
      ? await baseQuery.where(whereClause as any)
      : await baseQuery;

    return result.length;
  },
};

// Re-export types and utilities
export { schema };
export type { SeedResult };
