/**
 * Concurrent Requests Integration Tests
 *
 * Tests multiple simultaneous GraphQL requests to verify:
 * - Neon connection pooling handles concurrent load
 * - All responses are valid
 * - No connection pool exhaustion occurs
 *
 * Prerequisites:
 * - TEST_DATABASE_URL or DATABASE_URL must be configured
 * - Database must be accessible
 *
 * Note: These tests verify that the database layer can handle concurrent
 * operations, which is critical for production GraphQL workloads.
 */

import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import {
  setupIntegrationTest,
  isDatabaseConfigured,
} from "./setup";
import { TEST_IDS } from "./seed";

// Check if database is configured
const dbConfigured = isDatabaseConfigured();

describe("Concurrent Requests Integration Tests", () => {
  // If database is not configured, skip all tests with a clear message
  if (!dbConfigured) {
    it.skip("all tests skipped - database not configured (set DATABASE_URL or TEST_DATABASE_URL)", () => {});
    return;
  }

  // Set up integration test infrastructure
  const { getDb, getSchema: getSchemaFn, getSeededData } =
    setupIntegrationTest();

  describe("Concurrent Query Operations", () => {
    it("should handle 10 concurrent brand queries successfully", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const brandId = seededData.brands[0].id;

      // Create 10 concurrent queries for the same brand
      const concurrentQueries = Array.from({ length: 10 }, () =>
        db
          .select()
          .from(schema.brands)
          .where(eq(schema.brands.id, brandId))
          .limit(1)
      );

      // Execute all queries concurrently
      const results = await Promise.all(concurrentQueries);

      // Verify all 10 queries succeeded
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(brandId);
        expect(result[0].name).toBe(seededData.brands[0].name);
      });
    });

    it("should handle 10 concurrent queries across different tables", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData) {
        console.warn("No seeded data available");
        return;
      }

      // Create concurrent queries across different tables
      const concurrentQueries = [
        // Brands queries (3)
        db.select().from(schema.brands).where(eq(schema.brands.organizationId, TEST_IDS.ORG)).limit(5),
        db.select().from(schema.brands).where(eq(schema.brands.id, seededData.brands[0]?.id || '')).limit(1),
        db.select().from(schema.brands).limit(10),

        // Mentions queries (2)
        db.select().from(schema.brandMentions).limit(5),
        db.select().from(schema.brandMentions).where(eq(schema.brandMentions.sentiment, 'positive')).limit(5),

        // Recommendations queries (2)
        db.select().from(schema.recommendations).where(eq(schema.recommendations.status, 'pending')).limit(5),
        db.select().from(schema.recommendations).limit(10),

        // Audits queries (1)
        db.select().from(schema.audits).limit(5),

        // Content queries (1)
        db.select().from(schema.content).limit(5),

        // Users query (1)
        db.select().from(schema.users).where(eq(schema.users.organizationId, TEST_IDS.ORG)).limit(5),
      ];

      // Execute all queries concurrently
      const results = await Promise.all(concurrentQueries);

      // Verify all 10 queries succeeded
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
        // Results should be valid arrays (may be empty)
      });
    });

    it("should handle 20 concurrent queries without connection pool exhaustion", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create 20 concurrent queries - double the acceptance criteria
      const concurrentQueries = Array.from({ length: 20 }, () =>
        db
          .select()
          .from(schema.brands)
          .where(eq(schema.brands.organizationId, TEST_IDS.ORG))
          .limit(5)
      );

      // Track start time to measure performance
      const startTime = Date.now();

      // Execute all queries concurrently
      const results = await Promise.all(concurrentQueries);

      const duration = Date.now() - startTime;

      // Verify all 20 queries succeeded
      expect(results).toHaveLength(20);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });

      // Log performance info for debugging
      console.log(`20 concurrent queries completed in ${duration}ms`);
    });

    it("should return consistent results for concurrent identical queries", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create 5 identical concurrent queries
      const concurrentQueries = Array.from({ length: 5 }, () =>
        db
          .select()
          .from(schema.brands)
          .where(eq(schema.brands.organizationId, TEST_IDS.ORG))
      );

      // Execute all queries concurrently
      const results = await Promise.all(concurrentQueries);

      // All results should be identical
      const firstResult = JSON.stringify(results[0]);
      results.forEach((result) => {
        expect(JSON.stringify(result)).toBe(firstResult);
      });
    });
  });

  describe("Concurrent Mixed Operations", () => {
    it("should handle concurrent reads and writes without conflicts", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const timestamp = Date.now();

      // Create multiple brands concurrently
      const brandsToCreate = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent-brand-${timestamp}-${i}`,
        organizationId: TEST_IDS.ORG,
        name: `Concurrent Brand ${i}`,
        monitoringPlatforms: ["chatgpt"],
        isActive: true,
      }));

      // Create concurrent write operations
      const writeOperations = brandsToCreate.map((brandData) =>
        db.insert(schema.brands).values(brandData).returning()
      );

      // Create concurrent read operations interleaved with writes
      const readOperations = Array.from({ length: 5 }, () =>
        db.select().from(schema.brands).where(eq(schema.brands.organizationId, TEST_IDS.ORG)).limit(10)
      );

      try {
        // Execute all operations concurrently
        const [writeResults, readResults] = await Promise.all([
          Promise.all(writeOperations),
          Promise.all(readOperations),
        ]);

        // Verify all writes succeeded
        expect(writeResults).toHaveLength(5);
        writeResults.forEach((result, i) => {
          expect(result).toHaveLength(1);
          expect(result[0].id).toBe(brandsToCreate[i].id);
        });

        // Verify all reads succeeded
        expect(readResults).toHaveLength(5);
        readResults.forEach((result) => {
          expect(Array.isArray(result)).toBe(true);
        });
      } finally {
        // Cleanup created brands
        for (const brand of brandsToCreate) {
          await db.delete(schema.brands).where(eq(schema.brands.id, brand.id));
        }
      }
    });

    it("should handle concurrent updates to different records", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const timestamp = Date.now();

      // Create brands to update
      const brandsToUpdate = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent-update-${timestamp}-${i}`,
        organizationId: TEST_IDS.ORG,
        name: `Update Brand ${i}`,
        monitoringPlatforms: ["chatgpt"],
        isActive: true,
      }));

      // Insert brands first
      for (const brandData of brandsToUpdate) {
        await db.insert(schema.brands).values(brandData).returning();
      }

      try {
        // Create concurrent update operations
        const updateOperations = brandsToUpdate.map((brand, i) =>
          db
            .update(schema.brands)
            .set({ name: `Updated Brand ${i}`, updatedAt: new Date() })
            .where(eq(schema.brands.id, brand.id))
            .returning()
        );

        // Execute all updates concurrently
        const results = await Promise.all(updateOperations);

        // Verify all updates succeeded
        expect(results).toHaveLength(5);
        results.forEach((result, i) => {
          expect(result).toHaveLength(1);
          expect(result[0].name).toBe(`Updated Brand ${i}`);
        });
      } finally {
        // Cleanup created brands
        for (const brand of brandsToUpdate) {
          await db.delete(schema.brands).where(eq(schema.brands.id, brand.id));
        }
      }
    });
  });

  describe("Concurrent Operations Across Entity Types", () => {
    it("should handle concurrent CRUD operations across brands, mentions, and recommendations", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const brandId = seededData.brands[0].id;

      // Create mixed entity operations
      const operations = [
        // Brand queries
        db.select().from(schema.brands).where(eq(schema.brands.organizationId, TEST_IDS.ORG)),
        db.select().from(schema.brands).where(eq(schema.brands.id, brandId)),

        // Mention queries
        db.select().from(schema.brandMentions).where(eq(schema.brandMentions.brandId, brandId)).limit(5),
        db.select().from(schema.brandMentions).limit(10),

        // Recommendation queries
        db.select().from(schema.recommendations).where(eq(schema.recommendations.brandId, brandId)).limit(5),
        db.select().from(schema.recommendations).where(eq(schema.recommendations.status, 'pending')).limit(5),

        // Audit queries
        db.select().from(schema.audits).where(eq(schema.audits.brandId, brandId)).limit(5),

        // Content queries
        db.select().from(schema.content).where(eq(schema.content.brandId, brandId)).limit(5),

        // User queries
        db.select().from(schema.users).where(eq(schema.users.organizationId, TEST_IDS.ORG)),

        // Organization query
        db.select().from(schema.organizations).where(eq(schema.organizations.id, TEST_IDS.ORG)),
      ];

      // Execute all operations concurrently
      const results = await Promise.all(operations);

      // Verify all 10 operations succeeded
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it("should maintain data integrity with concurrent operations on related entities", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const timestamp = Date.now();
      const brandId = `concurrent-brand-integrity-${timestamp}`;
      const recommendationIds: string[] = [];

      // Create a brand first
      await db.insert(schema.brands).values({
        id: brandId,
        organizationId: TEST_IDS.ORG,
        name: `Integrity Test Brand ${timestamp}`,
        monitoringPlatforms: ["chatgpt"],
        isActive: true,
      });

      try {
        // Create recommendations concurrently for this brand
        const recommendationOperations = Array.from({ length: 5 }, (_, i) => {
          const recId = `concurrent-rec-${timestamp}-${i}`;
          recommendationIds.push(recId);
          return db
            .insert(schema.recommendations)
            .values({
              id: recId,
              brandId: brandId,
              title: `Concurrent Rec ${i}`,
              description: `Test recommendation ${i}`,
              category: "content_optimization",
              priority: "medium",
              status: "pending",
              effort: "moderate",
              impact: "medium",
              source: "manual",
            })
            .returning();
        });

        // Execute all inserts concurrently
        const insertResults = await Promise.all(recommendationOperations);

        // Verify all inserts succeeded
        expect(insertResults).toHaveLength(5);
        insertResults.forEach((result) => {
          expect(result).toHaveLength(1);
          expect(result[0].brandId).toBe(brandId);
        });

        // Query all recommendations for this brand
        const recommendations = await db
          .select()
          .from(schema.recommendations)
          .where(eq(schema.recommendations.brandId, brandId));

        // Should have all 5 recommendations
        expect(recommendations.length).toBeGreaterThanOrEqual(5);

        // Verify data integrity - all should reference the correct brand
        recommendations.forEach((rec) => {
          if (rec.id.startsWith(`concurrent-rec-${timestamp}`)) {
            expect(rec.brandId).toBe(brandId);
          }
        });
      } finally {
        // Cleanup recommendations first (due to FK)
        for (const recId of recommendationIds) {
          await db.delete(schema.recommendations).where(eq(schema.recommendations.id, recId));
        }
        // Then cleanup brand
        await db.delete(schema.brands).where(eq(schema.brands.id, brandId));
      }
    });
  });

  describe("Stress Testing", () => {
    it("should handle 50 concurrent queries without errors", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create 50 concurrent queries - 5x the acceptance criteria
      const concurrentQueries = Array.from({ length: 50 }, () =>
        db
          .select()
          .from(schema.brands)
          .where(eq(schema.brands.organizationId, TEST_IDS.ORG))
          .limit(5)
      );

      // Track start time
      const startTime = Date.now();

      // Execute all queries concurrently
      const results = await Promise.all(concurrentQueries);

      const duration = Date.now() - startTime;

      // Verify all 50 queries succeeded
      expect(results).toHaveLength(50);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });

      // Log performance info
      console.log(`50 concurrent queries completed in ${duration}ms`);
    });

    it("should handle rapid sequential queries without connection issues", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const results: Array<typeof schema.brands.$inferSelect[]> = [];

      // Execute 20 rapid sequential queries
      for (let i = 0; i < 20; i++) {
        const result = await db
          .select()
          .from(schema.brands)
          .where(eq(schema.brands.organizationId, TEST_IDS.ORG))
          .limit(5);
        results.push(result);
      }

      // Verify all queries succeeded
      expect(results).toHaveLength(20);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it("should handle burst of concurrent requests followed by more requests", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // First burst of 10 concurrent queries
      const burst1 = Array.from({ length: 10 }, () =>
        db.select().from(schema.brands).where(eq(schema.brands.organizationId, TEST_IDS.ORG)).limit(5)
      );
      const results1 = await Promise.all(burst1);

      // Second burst of 10 concurrent queries
      const burst2 = Array.from({ length: 10 }, () =>
        db.select().from(schema.recommendations).limit(10)
      );
      const results2 = await Promise.all(burst2);

      // Third burst of 10 concurrent queries
      const burst3 = Array.from({ length: 10 }, () =>
        db.select().from(schema.brandMentions).limit(10)
      );
      const results3 = await Promise.all(burst3);

      // Verify all bursts completed successfully
      expect(results1).toHaveLength(10);
      expect(results2).toHaveLength(10);
      expect(results3).toHaveLength(10);

      // All results should be valid arrays
      [...results1, ...results2, ...results3].forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe("Error Resilience", () => {
    it("should handle concurrent queries with some returning empty results", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Mix of queries that will return results and empty results
      const concurrentQueries = [
        // Should return results
        db.select().from(schema.brands).where(eq(schema.brands.organizationId, TEST_IDS.ORG)).limit(5),
        db.select().from(schema.brands).limit(10),

        // Should return empty results (non-existent IDs)
        db.select().from(schema.brands).where(eq(schema.brands.id, 'non-existent-id-1')).limit(1),
        db.select().from(schema.brands).where(eq(schema.brands.id, 'non-existent-id-2')).limit(1),
        db.select().from(schema.recommendations).where(eq(schema.recommendations.id, 'non-existent-rec')).limit(1),

        // More queries that should return results
        db.select().from(schema.users).where(eq(schema.users.organizationId, TEST_IDS.ORG)).limit(5),
        db.select().from(schema.organizations).where(eq(schema.organizations.id, TEST_IDS.ORG)).limit(1),

        // More empty results
        db.select().from(schema.audits).where(eq(schema.audits.id, 'non-existent-audit')).limit(1),
        db.select().from(schema.content).where(eq(schema.content.id, 'non-existent-content')).limit(1),

        // Another valid query
        db.select().from(schema.recommendations).limit(5),
      ];

      // Execute all queries concurrently
      const results = await Promise.all(concurrentQueries);

      // Verify all 10 queries completed without errors
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
        // Result length may be 0 or more - just verify it's a valid array
      });

      // Verify empty results are handled correctly
      expect(results[2]).toEqual([]); // non-existent brand 1
      expect(results[3]).toEqual([]); // non-existent brand 2
      expect(results[4]).toEqual([]); // non-existent recommendation
    });

    it("should continue working after a batch of concurrent operations", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Execute a large batch of concurrent operations
      const largeBatch = Array.from({ length: 30 }, () =>
        db.select().from(schema.brands).limit(5)
      );
      await Promise.all(largeBatch);

      // Execute a follow-up query to verify connection pool is still working
      const followUpResult = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.organizationId, TEST_IDS.ORG))
        .limit(5);

      expect(Array.isArray(followUpResult)).toBe(true);
    });
  });

  describe("Response Validation", () => {
    it("should return complete and valid brand data in all concurrent responses", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const brandId = seededData.brands[0].id;

      // Create 10 concurrent queries for the same brand
      const concurrentQueries = Array.from({ length: 10 }, () =>
        db
          .select()
          .from(schema.brands)
          .where(eq(schema.brands.id, brandId))
          .limit(1)
      );

      // Execute all queries concurrently
      const results = await Promise.all(concurrentQueries);

      // Verify each response contains valid, complete brand data
      results.forEach((result) => {
        expect(result).toHaveLength(1);
        const brand = result[0];

        // Verify required fields are present
        expect(brand.id).toBe(brandId);
        expect(typeof brand.name).toBe("string");
        expect(typeof brand.organizationId).toBe("string");
        expect(typeof brand.isActive).toBe("boolean");
        expect(Array.isArray(brand.monitoringPlatforms)).toBe(true);

        // Verify dates are valid
        expect(brand.createdAt).toBeInstanceOf(Date);
        expect(brand.updatedAt).toBeInstanceOf(Date);
      });
    });

    it("should return valid recommendation data in concurrent queries", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create 10 concurrent queries for recommendations
      const concurrentQueries = Array.from({ length: 10 }, () =>
        db
          .select()
          .from(schema.recommendations)
          .limit(5)
      );

      // Execute all queries concurrently
      const results = await Promise.all(concurrentQueries);

      // Verify each response contains valid recommendation data
      results.forEach((result) => {
        result.forEach((rec) => {
          // Verify required fields
          expect(typeof rec.id).toBe("string");
          expect(typeof rec.brandId).toBe("string");
          expect(typeof rec.title).toBe("string");
          expect(typeof rec.description).toBe("string");
          expect(typeof rec.category).toBe("string");
          expect(typeof rec.priority).toBe("string");
          expect(typeof rec.status).toBe("string");

          // Verify status is a valid enum value
          expect(["pending", "in_progress", "completed", "dismissed"]).toContain(rec.status);
        });
      });
    });
  });
});
