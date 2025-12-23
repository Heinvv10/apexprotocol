/**
 * Edge Cases Integration Tests
 *
 * Tests queries for non-existent IDs and other edge cases.
 * Verifies that database operations handle edge cases gracefully.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL or DATABASE_URL must be configured
 * - Database must be accessible
 *
 * Acceptance Criteria:
 * - Query non-existent ID returns null
 * - Empty result sets return empty arrays
 * - Invalid input handled gracefully
 */

import { describe, it, expect, afterAll } from "vitest";
import { eq, and, gt, lt, gte, like } from "drizzle-orm";
import {
  setupIntegrationTest,
  isDatabaseConfigured,
} from "./setup";
import { TEST_IDS } from "./seed";

// Check if database is configured
const dbConfigured = isDatabaseConfigured();

describe("Edge Cases Integration Tests", () => {
  // If database is not configured, skip all tests with a clear message
  if (!dbConfigured) {
    it.skip("all tests skipped - database not configured (set DATABASE_URL or TEST_DATABASE_URL)", () => {});
    return;
  }

  // Set up integration test infrastructure
  const { getDb, getSchema: getSchemaFn, getSeededData, testIds } =
    setupIntegrationTest();

  describe("Non-Existent ID Queries", () => {
    describe("Brands", () => {
      it("should return empty array for non-existent brand ID", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.brands)
          .where(eq(schema.brands.id, "brand-that-does-not-exist-12345"))
          .limit(1);

        expect(result).toEqual([]);
        expect(result[0]).toBeUndefined();
      });

      it("should return null when accessing first element of non-existent brand query", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const [brand] = await db
          .select()
          .from(schema.brands)
          .where(eq(schema.brands.id, "non-existent-brand-xyz-abc"))
          .limit(1);

        expect(brand).toBeUndefined();
        // GraphQL resolvers would return null for this case
        const resolverResult = brand || null;
        expect(resolverResult).toBeNull();
      });

      it("should return empty array for non-existent domain query", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.brands)
          .where(eq(schema.brands.domain, "this-domain-does-not-exist.fake"));

        expect(result).toEqual([]);
      });

      it("should return empty array for non-existent organization ID", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.brands)
          .where(eq(schema.brands.organizationId, "org-that-never-existed-ever"));

        expect(result).toEqual([]);
      });
    });

    describe("Mentions", () => {
      it("should return empty array for non-existent mention ID", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.brandMentions)
          .where(eq(schema.brandMentions.id, "mention-not-found-99999"))
          .limit(1);

        expect(result).toEqual([]);
        expect(result[0]).toBeUndefined();
      });

      it("should return empty array for non-existent brand's mentions", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.brandMentions)
          .where(eq(schema.brandMentions.brandId, "brand-with-no-mentions-xyz"));

        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });
    });

    describe("Recommendations", () => {
      it("should return empty array for non-existent recommendation ID", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.recommendations)
          .where(eq(schema.recommendations.id, "rec-not-found-88888"))
          .limit(1);

        expect(result).toEqual([]);
        expect(result[0]).toBeUndefined();
      });

      it("should return empty array for non-existent brand's recommendations", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.recommendations)
          .where(eq(schema.recommendations.brandId, "brand-without-recs-abc"));

        expect(result).toEqual([]);
      });
    });

    describe("Audits", () => {
      it("should return empty array for non-existent audit ID", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.audits)
          .where(eq(schema.audits.id, "audit-nonexistent-77777"))
          .limit(1);

        expect(result).toEqual([]);
        expect(result[0]).toBeUndefined();
      });

      it("should return empty array for non-existent brand's audits", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.audits)
          .where(eq(schema.audits.brandId, "brand-no-audits-def"));

        expect(result).toEqual([]);
      });
    });

    describe("Content", () => {
      it("should return empty array for non-existent content ID", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.content)
          .where(eq(schema.content.id, "content-missing-66666"))
          .limit(1);

        expect(result).toEqual([]);
        expect(result[0]).toBeUndefined();
      });

      it("should return empty array for non-existent brand's content", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.content)
          .where(eq(schema.content.brandId, "brand-no-content-ghi"));

        expect(result).toEqual([]);
      });
    });

    describe("GEO Score History", () => {
      it("should return empty array for non-existent GEO score history ID", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.geoScoreHistory)
          .where(eq(schema.geoScoreHistory.id, "geo-history-not-found-55555"))
          .limit(1);

        expect(result).toEqual([]);
        expect(result[0]).toBeUndefined();
      });

      it("should return empty array for non-existent brand's GEO history", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.geoScoreHistory)
          .where(eq(schema.geoScoreHistory.brandId, "brand-no-geo-history-jkl"));

        expect(result).toEqual([]);
      });
    });

    describe("Users", () => {
      it("should return empty array for non-existent user ID", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, "user-not-found-44444"))
          .limit(1);

        expect(result).toEqual([]);
        expect(result[0]).toBeUndefined();
      });

      it("should return empty array for non-existent clerk user ID", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.clerkUserId, "clerk_user_nonexistent_xyz"));

        expect(result).toEqual([]);
      });
    });

    describe("Organizations", () => {
      it("should return empty array for non-existent organization ID", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.organizations)
          .where(eq(schema.organizations.id, "org-not-found-33333"))
          .limit(1);

        expect(result).toEqual([]);
        expect(result[0]).toBeUndefined();
      });

      it("should return empty array for non-existent clerk org ID", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.organizations)
          .where(eq(schema.organizations.clerkOrgId, "clerk_org_nonexistent_abc"));

        expect(result).toEqual([]);
      });
    });

    describe("Integrations", () => {
      it("should return empty array for non-existent integration ID", async () => {
        const db = getDb();
        const schema = getSchemaFn();

        const result = await db
          .select()
          .from(schema.apiIntegrations)
          .where(eq(schema.apiIntegrations.id, "integration-not-found-22222"))
          .limit(1);

        expect(result).toEqual([]);
        expect(result[0]).toBeUndefined();
      });
    });
  });

  describe("Empty Result Sets", () => {
    it("should return empty array when filtering with impossible conditions on brands", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Query with conditions that will never match
      const result = await db
        .select()
        .from(schema.brands)
        .where(
          and(
            eq(schema.brands.isActive, true),
            eq(schema.brands.isActive, false)
          )
        );

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array when filtering future dates on mentions", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const farFuture = new Date("2099-12-31T23:59:59Z");

      const result = await db
        .select()
        .from(schema.brandMentions)
        .where(gt(schema.brandMentions.timestamp, farFuture));

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array when filtering recommendations with impossible status", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Filter with a valid org but non-existent brand
      const result = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.brandId, "definitely-not-a-brand"));

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array when searching with no-match pattern", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brands)
        .where(like(schema.brands.name, "%ZZZZZXXXXX_NO_MATCH_PATTERN%"));

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array for empty organization's brands", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.organizationId, "org-with-zero-brands-xyz"));

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it("should return empty array when limit is 0", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brands)
        .limit(0);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array when offset exceeds total count", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.organizationId, TEST_IDS.ORG))
        .offset(99999);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Update/Delete Non-Existent Records", () => {
    it("should return empty array when updating non-existent brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .update(schema.brands)
        .set({ name: "Updated Name That Will Not Apply" })
        .where(eq(schema.brands.id, "brand-update-nonexistent-11111"))
        .returning();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it("should not throw when deleting non-existent brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Delete should not throw for non-existent record
      await db
        .delete(schema.brands)
        .where(eq(schema.brands.id, "brand-delete-nonexistent-00000"));

      // If we get here without throwing, the test passes
      expect(true).toBe(true);
    });

    it("should return empty array when updating non-existent recommendation", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .update(schema.recommendations)
        .set({ status: "completed" })
        .where(eq(schema.recommendations.id, "rec-update-nonexistent-xyz"))
        .returning();

      expect(result).toEqual([]);
    });

    it("should return empty array when updating non-existent content", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .update(schema.content)
        .set({ status: "published" })
        .where(eq(schema.content.id, "content-update-nonexistent-abc"))
        .returning();

      expect(result).toEqual([]);
    });

    it("should not throw when deleting non-existent mention", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Delete should not throw for non-existent record
      await db
        .delete(schema.brandMentions)
        .where(eq(schema.brandMentions.id, "mention-delete-nonexistent-qrs"));

      expect(true).toBe(true);
    });
  });

  describe("Invalid Input Handling", () => {
    it("should handle empty string ID gracefully", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, ""))
        .limit(1);

      expect(result).toEqual([]);
    });

    it("should handle whitespace-only ID gracefully", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, "   "))
        .limit(1);

      expect(result).toEqual([]);
    });

    it("should handle very long ID gracefully", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const veryLongId = "x".repeat(1000);

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, veryLongId))
        .limit(1);

      expect(result).toEqual([]);
    });

    it("should handle special characters in ID gracefully", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const specialId = "brand-'OR 1=1;--";

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, specialId))
        .limit(1);

      expect(result).toEqual([]);
    });

    it("should handle unicode characters in ID gracefully", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const unicodeId = "brand-日本語-emoji-🚀";

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, unicodeId))
        .limit(1);

      expect(result).toEqual([]);
    });

    it("should handle newlines and tabs in search gracefully", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const weirdSearch = "brand\nwith\nnewlines\tand\ttabs";

      const result = await db
        .select()
        .from(schema.brands)
        .where(like(schema.brands.name, `%${weirdSearch}%`));

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle null-like string gracefully", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, "null"))
        .limit(1);

      expect(result).toEqual([]);
    });

    it("should handle undefined-like string gracefully", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, "undefined"))
        .limit(1);

      expect(result).toEqual([]);
    });
  });

  describe("Boundary Conditions", () => {
    it("should handle limit of 1 with no results", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, "definitely-not-a-brand"))
        .limit(1);

      expect(result).toHaveLength(0);
    });

    it("should handle very large limit with few results", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.organizationId, TEST_IDS.ORG))
        .limit(1000000);

      // Should return actual count, not error
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(1000000);
    });

    it("should handle date filtering at boundary", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Query for mentions from the distant past
      const ancientDate = new Date("1970-01-01T00:00:00Z");

      const result = await db
        .select()
        .from(schema.brandMentions)
        .where(lt(schema.brandMentions.timestamp, ancientDate));

      // Should return empty (no mentions from 1970)
      expect(result).toEqual([]);
    });

    it("should handle ordering with no results", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.brandId, "no-brand-here-abc"))
        .orderBy(schema.recommendations.createdAt);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Cross-Entity Edge Cases", () => {
    it("should return empty array when joining mention with non-existent brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Try to get a brand for a mention that references a non-existent brand
      // This simulates what happens in Mention.brand field resolver
      const nonExistentBrandId = "brand-that-was-deleted-xyz";

      const result = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, nonExistentBrandId))
        .limit(1);

      expect(result).toEqual([]);
      const brand = result[0] || null;
      expect(brand).toBeNull();
    });

    it("should return empty array for recommendation feedback with non-existent recommendation", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.recommendationFeedback)
        .where(eq(schema.recommendationFeedback.recommendationId, "rec-no-feedback-xyz"));

      expect(result).toEqual([]);
    });

    it("should return empty array for user in non-existent organization", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.organizationId, "org-does-not-exist-123"));

      expect(result).toEqual([]);
    });

    it("should handle querying integrations with non-existent provider", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.apiIntegrations)
        .where(eq(schema.apiIntegrations.provider, "provider-that-does-not-exist-xyz"));

      expect(result).toEqual([]);
    });
  });

  describe("Multiple Condition Edge Cases", () => {
    it("should return empty array with multiple AND conditions that never match", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.recommendations)
        .where(
          and(
            eq(schema.recommendations.status, "pending"),
            eq(schema.recommendations.status, "completed")
          )
        );

      expect(result).toEqual([]);
    });

    it("should return empty array filtering by platform and non-existent brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brandMentions)
        .where(
          and(
            eq(schema.brandMentions.platform, "chatgpt"),
            eq(schema.brandMentions.brandId, "brand-nonexistent-multi-filter")
          )
        );

      expect(result).toEqual([]);
    });

    it("should return empty array for content with specific type in non-existent brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.content)
        .where(
          and(
            eq(schema.content.type, "blog_post"),
            eq(schema.content.brandId, "brand-no-content-filter-xyz")
          )
        );

      expect(result).toEqual([]);
    });
  });

  describe("Resolver-Simulated Edge Cases", () => {
    it("should simulate brand resolver returning null for non-existent ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Simulate brand(id: ID!) resolver
      const [brand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, "non-existent-brand-resolver-test"))
        .limit(1);

      // GraphQL resolver would return null
      const resolverResult = brand || null;
      expect(resolverResult).toBeNull();
    });

    it("should simulate brands resolver returning empty PageInfo for empty results", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Simulate brands(first: Int, search: String) resolver with empty results
      const brands = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.organizationId, "org-empty-brand-list-xyz"))
        .limit(20);

      // GraphQL resolver would return empty connection
      const pageInfo = {
        hasNextPage: brands.length >= 20,
        startCursor: brands.length > 0 ? Buffer.from(`brand:0`).toString("base64") : null,
        endCursor: brands.length > 0 ? Buffer.from(`brand:${brands.length - 1}`).toString("base64") : null,
      };

      expect(brands).toEqual([]);
      expect(pageInfo.hasNextPage).toBe(false);
      expect(pageInfo.startCursor).toBeNull();
      expect(pageInfo.endCursor).toBeNull();
    });

    it("should simulate Brand.mentions field resolver returning empty array", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Simulate Brand.mentions field resolver for brand with no mentions
      const parentBrandId = "brand-no-mentions-field-resolver";

      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.brandId, parentBrandId))
        .limit(10);

      expect(mentions).toEqual([]);
      expect(Array.isArray(mentions)).toBe(true);
    });

    it("should simulate geoScore resolver with no data", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Simulate geoScore(brandId: ID!) resolver
      const nonExistentBrandId = "brand-no-geo-score-data-xyz";

      // Get mention count
      const mentionCount = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.brandId, nonExistentBrandId));

      // Get recommendation count
      const recCount = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.brandId, nonExistentBrandId));

      // With no data, score would be computed as defaults
      expect(mentionCount).toEqual([]);
      expect(recCount).toEqual([]);

      // Simulated score calculation with zeros
      const visibilityScore = Math.min(mentionCount.length * 5, 100);
      expect(visibilityScore).toBe(0);
    });

    it("should simulate geoScoreHistory resolver returning empty array", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Simulate geoScoreHistory(brandId: ID!, days: Int) resolver
      const nonExistentBrandId = "brand-no-geo-history-abc";
      const days = 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const history = await db
        .select()
        .from(schema.geoScoreHistory)
        .where(
          and(
            eq(schema.geoScoreHistory.brandId, nonExistentBrandId),
            gte(schema.geoScoreHistory.calculatedAt, cutoffDate)
          )
        );

      expect(history).toEqual([]);
    });

    it("should simulate subscription resolver returning null for non-existent org", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Simulate subscription resolver (uses user.orgId)
      const nonExistentOrgId = "org-no-subscription-xyz";

      const [org] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, nonExistentOrgId))
        .limit(1);

      const resolverResult = org || null;
      expect(resolverResult).toBeNull();
    });

    it("should simulate analytics resolver with empty data", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Simulate analytics(brandId: ID!) resolver
      const nonExistentBrandId = "brand-no-analytics-data-xyz";

      // Get counts
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.brandId, nonExistentBrandId));

      const recommendations = await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.brandId, nonExistentBrandId));

      const content = await db
        .select()
        .from(schema.content)
        .where(eq(schema.content.brandId, nonExistentBrandId));

      // All should be empty
      expect(mentions.length).toBe(0);
      expect(recommendations.length).toBe(0);
      expect(content.length).toBe(0);

      // Simulated analytics result
      const analytics = {
        totalMentions: mentions.length,
        totalRecommendations: recommendations.length,
        totalContent: content.length,
      };

      expect(analytics).toEqual({
        totalMentions: 0,
        totalRecommendations: 0,
        totalContent: 0,
      });
    });
  });

  describe("Data Integrity Edge Cases", () => {
    it("should return consistent empty results across multiple queries", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const nonExistentId = "brand-consistency-check-xyz";

      // Run the same query multiple times
      const results = await Promise.all([
        db.select().from(schema.brands).where(eq(schema.brands.id, nonExistentId)).limit(1),
        db.select().from(schema.brands).where(eq(schema.brands.id, nonExistentId)).limit(1),
        db.select().from(schema.brands).where(eq(schema.brands.id, nonExistentId)).limit(1),
      ]);

      // All results should be identical (empty)
      results.forEach((result) => {
        expect(result).toEqual([]);
      });
    });

    it("should handle query after failed insert due to FK constraint", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const badMentionData = {
        id: `bad-mention-fk-${Date.now()}`,
        brandId: "brand-that-definitely-does-not-exist-ever",
        platform: "chatgpt" as const,
        query: "Test query",
        response: "Test response",
        sentiment: "neutral" as const,
        timestamp: new Date(),
      };

      let insertFailed = false;

      // Attempt insert with invalid FK
      try {
        await db.insert(schema.brandMentions).values(badMentionData).returning();
      } catch {
        insertFailed = true;
      }

      // Query should still work after failed insert
      const result = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.id, badMentionData.id))
        .limit(1);

      // Mention should not exist (insert failed)
      expect(result).toEqual([]);
      expect(insertFailed).toBe(true);
    });
  });
});
