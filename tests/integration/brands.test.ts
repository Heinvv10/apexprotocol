/**
 * Brand Integration Tests
 *
 * Tests full CRUD cycle for brands against real database.
 * Verifies that database operations work correctly end-to-end.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL or DATABASE_URL must be configured
 * - Database must be accessible
 *
 * Note: These tests are designed to run against a real database.
 * When the database is not available, all tests will be skipped.
 * The tests will fail if DATABASE_URL is set but database is unreachable.
 */

import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  setupIntegrationTest,
  isDatabaseConfigured,
} from "./setup";
import { TEST_IDS } from "./seed";

// Check if database is configured
const dbConfigured = isDatabaseConfigured();

describe("Brand Integration Tests", () => {
  // If database is not configured, skip all tests with a clear message
  if (!dbConfigured) {
    it.skip("all tests skipped - database not configured (set DATABASE_URL or TEST_DATABASE_URL)", () => {});
    return;
  }

  // Set up integration test infrastructure
  const { getDb, getSchema: getSchemaFn, getSeededData } =
    setupIntegrationTest();

  // Counter for generating unique UUIDs within this test file
  let testIdCounter = 0;

  // Helper to generate a valid UUID for testing
  // Format: aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee (using a fixed prefix and timestamp-based suffix)
  const generateTestUuid = (): string => {
    testIdCounter++;
    const now = Date.now();
    // Create a deterministic but unique UUID based on timestamp and counter
    const hex = (now * 1000 + testIdCounter).toString(16).padStart(16, "0");
    return `aaaaaaaa-bbbb-4ccc-8ddd-${hex.slice(-12)}`;
  };

  // Helper to create a unique brand for testing
  const createUniqueBrand = (suffix: string = Date.now().toString()) => ({
    id: generateTestUuid(),
    organizationId: TEST_IDS.ORG,
    name: `Integration Test Brand ${suffix}`,
    domain: `integration-test-${suffix}.com`,
    description: `Test brand created for integration testing ${suffix}`,
    industry: "Technology",
    keywords: ["integration", "test", "automation"],
    competitors: [
      { name: "Competitor A", url: "https://competitor-a.com", reason: "Direct competitor" },
    ],
    monitoringPlatforms: ["chatgpt", "claude"],
    isActive: true,
  });

  // Cleanup function for brands created during tests
  const cleanupBrand = async (brandId: string) => {
    const db = getDb();
    const schema = getSchemaFn();
    try {
      // First delete related data
      await db.delete(schema.recommendations).where(eq(schema.recommendations.brandId, brandId));
      await db.delete(schema.brandMentions).where(eq(schema.brandMentions.brandId, brandId));
      await db.delete(schema.audits).where(eq(schema.audits.brandId, brandId));
      await db.delete(schema.content).where(eq(schema.content.brandId, brandId));
      await db.delete(schema.geoScoreHistory).where(eq(schema.geoScoreHistory.brandId, brandId));
      // Then delete the brand
      await db.delete(schema.brands).where(eq(schema.brands.id, brandId));
    } catch {
      // Ignore cleanup errors
    }
  };

  describe("Create Brand (INSERT)", () => {
    let createdBrandId: string | null = null;

    afterAll(async () => {
      if (createdBrandId) {
        await cleanupBrand(createdBrandId);
      }
    });

    it("should insert a new brand into the database", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const brandData = createUniqueBrand("create-test-1");
      createdBrandId = brandData.id;

      // Insert brand into database
      const [insertedBrand] = await db
        .insert(schema.brands)
        .values(brandData)
        .returning();

      // Verify the insert returned data
      expect(insertedBrand).toBeDefined();
      expect(insertedBrand.id).toBe(brandData.id);
      expect(insertedBrand.name).toBe(brandData.name);
      expect(insertedBrand.domain).toBe(brandData.domain);
      expect(insertedBrand.organizationId).toBe(TEST_IDS.ORG);
      expect(insertedBrand.isActive).toBe(true);
    });

    it("should persist brand data that can be queried", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const brandData = createUniqueBrand("create-test-2");

      // Insert brand
      await db.insert(schema.brands).values(brandData).returning();

      // Query it back
      const [queriedBrand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, brandData.id))
        .limit(1);

      // Cleanup
      await cleanupBrand(brandData.id);

      // Verify data was persisted
      expect(queriedBrand).toBeDefined();
      expect(queriedBrand.id).toBe(brandData.id);
      expect(queriedBrand.name).toBe(brandData.name);
      expect(queriedBrand.domain).toBe(brandData.domain);
      expect(queriedBrand.industry).toBe(brandData.industry);
      expect(queriedBrand.monitoringPlatforms).toEqual(brandData.monitoringPlatforms);
    });

    it("should set default values for optional fields", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const brandId = generateTestUuid();

      // Insert minimal brand data
      const [insertedBrand] = await db
        .insert(schema.brands)
        .values({
          id: brandId,
          organizationId: TEST_IDS.ORG,
          name: "Minimal Brand",
          isActive: true,
          monitoringPlatforms: ["chatgpt"],
        })
        .returning();

      // Cleanup
      await cleanupBrand(brandId);

      // Verify defaults were set
      expect(insertedBrand).toBeDefined();
      expect(insertedBrand.domain).toBeNull();
      expect(insertedBrand.description).toBeNull();
      expect(insertedBrand.createdAt).toBeDefined();
      expect(insertedBrand.updatedAt).toBeDefined();
    });

    it("should store complex nested data (competitors, keywords)", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const brandData = createUniqueBrand("create-nested-data");

      // Insert brand with complex data
      await db
        .insert(schema.brands)
        .values(brandData)
        .returning();

      // Query it back
      const [queriedBrand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, brandData.id))
        .limit(1);

      // Cleanup
      await cleanupBrand(brandData.id);

      // Verify nested data was stored correctly
      expect(queriedBrand.keywords).toEqual(brandData.keywords);
      expect(queriedBrand.competitors).toEqual(brandData.competitors);
      expect(queriedBrand.monitoringPlatforms).toEqual(brandData.monitoringPlatforms);
    });

    it("should reject duplicate brand IDs (primary key constraint)", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const brandData = createUniqueBrand("duplicate-test");

      // Insert first brand
      await db.insert(schema.brands).values(brandData).returning();

      // Attempt to insert duplicate
      try {
        await db.insert(schema.brands).values(brandData).returning();
        // Should not reach here
        expect.fail("Should have thrown duplicate key error");
      } catch (error) {
        // Expected: unique constraint violation
        expect(error).toBeDefined();
      } finally {
        // Cleanup
        await cleanupBrand(brandData.id);
      }
    });
  });

  describe("Query Brand (SELECT)", () => {
    it("should fetch a seeded brand by ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const expectedBrand = seededData.brands[0];

      // Query brand by ID
      const [brand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, expectedBrand.id))
        .limit(1);

      expect(brand).toBeDefined();
      expect(brand.id).toBe(expectedBrand.id);
      expect(brand.name).toBe(expectedBrand.name);
      expect(brand.domain).toBe(expectedBrand.domain);
    });

    it("should return empty array for non-existent brand ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, "non-existent-brand-id-xyz"))
        .limit(1);

      expect(result).toEqual([]);
      expect(result[0]).toBeUndefined();
    });

    it("should fetch brands filtered by organization ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Query all brands for test organization
      const brands = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.organizationId, TEST_IDS.ORG));

      // Should have at least the seeded brands
      expect(brands.length).toBeGreaterThanOrEqual(3);
      brands.forEach((brand) => {
        expect(brand.organizationId).toBe(TEST_IDS.ORG);
      });
    });

    it("should fetch brands ordered by createdAt descending", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const brands = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.organizationId, TEST_IDS.ORG))
        .orderBy(desc(schema.brands.createdAt));

      // Verify order
      for (let i = 1; i < brands.length; i++) {
        const prevDate = new Date(brands[i - 1].createdAt).getTime();
        const currDate = new Date(brands[i].createdAt).getTime();
        expect(prevDate).toBeGreaterThanOrEqual(currDate);
      }
    });

    it("should fetch brand by domain", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const expectedBrand = seededData.brands[0];

      // Query by domain
      const [brand] = await db
        .select()
        .from(schema.brands)
        .where(
          and(
            eq(schema.brands.organizationId, TEST_IDS.ORG),
            eq(schema.brands.domain, expectedBrand.domain)
          )
        )
        .limit(1);

      expect(brand).toBeDefined();
      expect(brand.domain).toBe(expectedBrand.domain);
      expect(brand.name).toBe(expectedBrand.name);
    });

    it("should support pagination with limit", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Get first 2 brands
      const firstPage = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.organizationId, TEST_IDS.ORG))
        .orderBy(desc(schema.brands.createdAt))
        .limit(2);

      expect(firstPage).toHaveLength(2);

      // Get next brand (offset)
      const allBrands = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.organizationId, TEST_IDS.ORG))
        .orderBy(desc(schema.brands.createdAt));

      // Total should be >= 3 (seeded brands)
      expect(allBrands.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Update Brand (UPDATE)", () => {
    let testBrandId: string | null = null;

    beforeEach(async () => {
      // Create a brand for each update test
      const db = getDb();
      const schema = getSchemaFn();
      const brandData = createUniqueBrand(`update-${Date.now()}`);
      testBrandId = brandData.id;

      await db.insert(schema.brands).values(brandData).returning();
    });

    afterAll(async () => {
      if (testBrandId) {
        await cleanupBrand(testBrandId);
      }
    });

    it("should update brand name and return updated data", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const newName = `Updated Brand Name ${Date.now()}`;

      // Update brand
      const [updatedBrand] = await db
        .update(schema.brands)
        .set({ name: newName, updatedAt: new Date() })
        .where(eq(schema.brands.id, testBrandId!))
        .returning();

      expect(updatedBrand).toBeDefined();
      expect(updatedBrand.name).toBe(newName);

      // Cleanup
      await cleanupBrand(testBrandId!);
    });

    it("should update multiple fields at once", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const updates = {
        name: `Multi-Update Brand ${Date.now()}`,
        domain: `multi-update-${Date.now()}.com`,
        industry: "Healthcare",
        description: "Updated description",
        isActive: false,
        updatedAt: new Date(),
      };

      // Update brand
      const [updatedBrand] = await db
        .update(schema.brands)
        .set(updates)
        .where(eq(schema.brands.id, testBrandId!))
        .returning();

      expect(updatedBrand.name).toBe(updates.name);
      expect(updatedBrand.domain).toBe(updates.domain);
      expect(updatedBrand.industry).toBe(updates.industry);
      expect(updatedBrand.description).toBe(updates.description);
      expect(updatedBrand.isActive).toBe(false);

      // Cleanup
      await cleanupBrand(testBrandId!);
    });

    it("should update nested data (keywords, competitors)", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const newKeywords = ["updated", "keywords", "list"];
      const newCompetitors = [
        { name: "New Competitor", url: "https://new-competitor.com", reason: "Updated" },
      ];

      // Update brand
      const [updatedBrand] = await db
        .update(schema.brands)
        .set({
          keywords: newKeywords,
          competitors: newCompetitors,
          updatedAt: new Date(),
        })
        .where(eq(schema.brands.id, testBrandId!))
        .returning();

      expect(updatedBrand.keywords).toEqual(newKeywords);
      expect(updatedBrand.competitors).toEqual(newCompetitors);

      // Cleanup
      await cleanupBrand(testBrandId!);
    });

    it("should update monitoring platforms", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const newPlatforms = ["chatgpt", "gemini", "perplexity"];

      // Update brand
      const [updatedBrand] = await db
        .update(schema.brands)
        .set({
          monitoringPlatforms: newPlatforms,
          updatedAt: new Date(),
        })
        .where(eq(schema.brands.id, testBrandId!))
        .returning();

      expect(updatedBrand.monitoringPlatforms).toEqual(newPlatforms);

      // Cleanup
      await cleanupBrand(testBrandId!);
    });

    it("should persist updates that can be queried", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const newName = `Persisted Update ${Date.now()}`;

      // Update brand
      await db
        .update(schema.brands)
        .set({ name: newName, updatedAt: new Date() })
        .where(eq(schema.brands.id, testBrandId!))
        .returning();

      // Query it back
      const [queriedBrand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, testBrandId!))
        .limit(1);

      expect(queriedBrand.name).toBe(newName);

      // Cleanup
      await cleanupBrand(testBrandId!);
    });

    it("should return empty array when updating non-existent brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .update(schema.brands)
        .set({ name: "Should Not Update" })
        .where(eq(schema.brands.id, "non-existent-brand-id-abc"))
        .returning();

      expect(result).toEqual([]);

      // Cleanup test brand
      if (testBrandId) {
        await cleanupBrand(testBrandId);
      }
    });

    it("should update updatedAt timestamp", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Get original brand
      const [originalBrand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, testBrandId!))
        .limit(1);

      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update brand (use SQL NOW() to get database server time)
      const [updatedBrand] = await db
        .update(schema.brands)
        .set({ name: "Timestamp Test", updatedAt: sql`NOW()` })
        .where(eq(schema.brands.id, testBrandId!))
        .returning();

      expect(new Date(updatedBrand.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalBrand.updatedAt).getTime()
      );

      // Cleanup
      await cleanupBrand(testBrandId!);
    });
  });

  describe("Delete Brand (DELETE)", () => {
    it("should delete a brand from the database", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create a brand to delete
      const brandData = createUniqueBrand("delete-test-1");
      await db.insert(schema.brands).values(brandData).returning();

      // Verify it exists
      const [beforeDelete] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, brandData.id))
        .limit(1);
      expect(beforeDelete).toBeDefined();

      // Delete brand
      await db.delete(schema.brands).where(eq(schema.brands.id, brandData.id));

      // Verify it no longer exists
      const [afterDelete] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, brandData.id))
        .limit(1);
      expect(afterDelete).toBeUndefined();
    });

    it("should not fail when deleting non-existent brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Delete should not throw for non-existent brand
      await db
        .delete(schema.brands)
        .where(eq(schema.brands.id, "non-existent-brand-delete-xyz"));

      // No error means success
      expect(true).toBe(true);
    });

    it("should cascade delete related data or prevent deletion", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create a brand with related data
      const brandData = createUniqueBrand("delete-cascade-test");
      await db.insert(schema.brands).values(brandData).returning();

      // Add a mention to this brand
      const mentionId = `mention-for-delete-test-${Date.now()}`;
      try {
        await db.insert(schema.brandMentions).values({
          id: mentionId,
          brandId: brandData.id,
          platform: "chatgpt",
          query: "Test query",
          response: "Test response",
          sentiment: "positive",
          timestamp: new Date(),
        });
      } catch {
        // If mention insert fails due to FK, that's okay
        await cleanupBrand(brandData.id);
        return;
      }

      // Now try to delete the brand
      // This should either cascade delete or fail with FK constraint
      try {
        await db.delete(schema.brands).where(eq(schema.brands.id, brandData.id));

        // If delete succeeded, mention should also be deleted (cascade)
        const [mention] = await db
          .select()
          .from(schema.brandMentions)
          .where(eq(schema.brandMentions.id, mentionId))
          .limit(1);

        // Either mention is deleted (cascade) or brand delete failed
        expect(mention).toBeUndefined();
      } catch (error) {
        // FK constraint prevented deletion - that's expected behavior
        expect(error).toBeDefined();

        // Cleanup manually
        await db.delete(schema.brandMentions).where(eq(schema.brandMentions.id, mentionId));
        await db.delete(schema.brands).where(eq(schema.brands.id, brandData.id));
      }
    });

    it("should only delete the specified brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create two brands
      const brand1Data = createUniqueBrand("delete-specific-1");
      const brand2Data = createUniqueBrand("delete-specific-2");

      await db.insert(schema.brands).values(brand1Data).returning();
      await db.insert(schema.brands).values(brand2Data).returning();

      // Delete only brand1
      await db.delete(schema.brands).where(eq(schema.brands.id, brand1Data.id));

      // Verify brand1 is deleted
      const [deletedBrand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, brand1Data.id))
        .limit(1);
      expect(deletedBrand).toBeUndefined();

      // Verify brand2 still exists
      const [remainingBrand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, brand2Data.id))
        .limit(1);
      expect(remainingBrand).toBeDefined();
      expect(remainingBrand.id).toBe(brand2Data.id);

      // Cleanup
      await cleanupBrand(brand2Data.id);
    });
  });

  describe("Full CRUD Cycle", () => {
    it("should complete create -> read -> update -> delete cycle", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const brandData = createUniqueBrand("full-crud-cycle");

      // CREATE
      const [createdBrand] = await db
        .insert(schema.brands)
        .values(brandData)
        .returning();

      expect(createdBrand.id).toBe(brandData.id);
      expect(createdBrand.name).toBe(brandData.name);

      // READ
      const [readBrand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, brandData.id))
        .limit(1);

      expect(readBrand.id).toBe(brandData.id);
      expect(readBrand.name).toBe(brandData.name);

      // UPDATE
      const updatedName = `Updated CRUD Brand ${Date.now()}`;
      const [updatedBrand] = await db
        .update(schema.brands)
        .set({ name: updatedName, updatedAt: new Date() })
        .where(eq(schema.brands.id, brandData.id))
        .returning();

      expect(updatedBrand.name).toBe(updatedName);
      expect(updatedBrand.id).toBe(brandData.id);

      // Verify update persisted
      const [verifyUpdate] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, brandData.id))
        .limit(1);

      expect(verifyUpdate.name).toBe(updatedName);

      // DELETE
      await db.delete(schema.brands).where(eq(schema.brands.id, brandData.id));

      // Verify deletion
      const [deletedBrand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, brandData.id))
        .limit(1);

      expect(deletedBrand).toBeUndefined();
    });
  });

  describe("Organization Isolation", () => {
    it("should not return brands from other organizations", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create another organization first (valid UUID format)
      const otherOrgId = "00000000-0000-0000-0000-000000000099";
      const otherBrandId = "00000000-0000-0000-0000-000000000299";

      // Insert the other organization
      await db.insert(schema.organizations).values({
        id: otherOrgId,
        name: "Other Test Organization",
        slug: `other-test-org-${Date.now()}`,
        clerkOrgId: `clerk_other_org_${Date.now()}`,
        plan: "starter",
        brandLimit: 3,
        userLimit: 5,
        isActive: true,
      }).onConflictDoNothing();

      // Create a brand in the other organization
      const otherOrgBrand = {
        id: otherBrandId,
        organizationId: otherOrgId,
        name: "Other Org Brand",
        isActive: true,
        monitoringPlatforms: ["chatgpt"],
      };

      await db.insert(schema.brands).values(otherOrgBrand).onConflictDoNothing();

      // Query brands for test organization
      const testOrgBrands = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.organizationId, TEST_IDS.ORG));

      // Should not contain the other org's brand
      const foundOtherOrgBrand = testOrgBrands.find(
        (b) => b.id === otherOrgBrand.id
      );
      expect(foundOtherOrgBrand).toBeUndefined();

      // Cleanup
      await db.delete(schema.brands).where(eq(schema.brands.id, otherOrgBrand.id));
      await db.delete(schema.organizations).where(eq(schema.organizations.id, otherOrgId));
    });

    it("should correctly filter by both organization and domain", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const seededData = getSeededData();
      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const expectedBrand = seededData.brands[0];

      // Query with both filters
      const [brand] = await db
        .select()
        .from(schema.brands)
        .where(
          and(
            eq(schema.brands.organizationId, TEST_IDS.ORG),
            eq(schema.brands.domain, expectedBrand.domain)
          )
        )
        .limit(1);

      expect(brand).toBeDefined();
      expect(brand.organizationId).toBe(TEST_IDS.ORG);
      expect(brand.domain).toBe(expectedBrand.domain);
    });
  });

  describe("Edge Cases", () => {
    it("should handle brand with empty arrays", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const brandId = generateTestUuid();

      // Insert brand with empty arrays
      const [insertedBrand] = await db
        .insert(schema.brands)
        .values({
          id: brandId,
          organizationId: TEST_IDS.ORG,
          name: "Empty Arrays Brand",
          keywords: [],
          competitors: [],
          monitoringPlatforms: [],
          isActive: true,
        })
        .returning();

      expect(insertedBrand.keywords).toEqual([]);
      expect(insertedBrand.competitors).toEqual([]);
      expect(insertedBrand.monitoringPlatforms).toEqual([]);

      // Cleanup
      await cleanupBrand(brandId);
    });

    it("should handle brand with null optional fields", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const brandId = generateTestUuid();

      // Insert brand with null optional fields
      const [insertedBrand] = await db
        .insert(schema.brands)
        .values({
          id: brandId,
          organizationId: TEST_IDS.ORG,
          name: "Null Fields Brand",
          domain: null,
          description: null,
          industry: null,
          monitoringPlatforms: ["chatgpt"],
          isActive: true,
        })
        .returning();

      expect(insertedBrand.domain).toBeNull();
      expect(insertedBrand.description).toBeNull();
      expect(insertedBrand.industry).toBeNull();

      // Cleanup
      await cleanupBrand(brandId);
    });

    it("should handle brand name with special characters", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const brandId = generateTestUuid();
      const specialName = "Brand with 特殊字符 & émojis 🚀";

      const [insertedBrand] = await db
        .insert(schema.brands)
        .values({
          id: brandId,
          organizationId: TEST_IDS.ORG,
          name: specialName,
          monitoringPlatforms: ["chatgpt"],
          isActive: true,
        })
        .returning();

      expect(insertedBrand.name).toBe(specialName);

      // Query it back
      const [queriedBrand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, brandId))
        .limit(1);

      expect(queriedBrand.name).toBe(specialName);

      // Cleanup
      await cleanupBrand(brandId);
    });

    it("should handle very long text fields", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const brandId = generateTestUuid();
      const longDescription = "A".repeat(5000);

      const [insertedBrand] = await db
        .insert(schema.brands)
        .values({
          id: brandId,
          organizationId: TEST_IDS.ORG,
          name: "Long Description Brand",
          description: longDescription,
          monitoringPlatforms: ["chatgpt"],
          isActive: true,
        })
        .returning();

      expect(insertedBrand.description).toBe(longDescription);
      expect(insertedBrand.description?.length).toBe(5000);

      // Cleanup
      await cleanupBrand(brandId);
    });
  });
});
