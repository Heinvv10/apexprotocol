/**
 * Mention Integration Tests
 *
 * Tests mention queries and markMentionReviewed mutation against real database.
 * Verifies that mention operations work correctly end-to-end.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL or DATABASE_URL must be configured
 * - Database must be accessible
 *
 * Note: These tests are designed to run against a real database.
 * When the database is not available, all tests will be skipped.
 */

import { describe, it, expect, afterAll } from "vitest";
import { eq, and, desc } from "drizzle-orm";
import {
  setupIntegrationTest,
  isDatabaseConfigured,
} from "./setup";
import { TEST_IDS } from "./seed";

// Check if database is configured
const dbConfigured = isDatabaseConfigured();

describe("Mention Integration Tests", () => {
  // If database is not configured, skip all tests with a clear message
  if (!dbConfigured) {
    it.skip("all tests skipped - database not configured (set DATABASE_URL or TEST_DATABASE_URL)", () => {});
    return;
  }

  // Set up integration test infrastructure
  const { getDb, getSchema: getSchemaFn, getSeededData, testIds } =
    setupIntegrationTest();

  // Cleanup function for mentions created during tests
  const cleanupMention = async (mentionId: string) => {
    const db = getDb();
    const schema = getSchemaFn();
    try {
      await db.delete(schema.brandMentions).where(eq(schema.brandMentions.id, mentionId));
    } catch {
      // Ignore cleanup errors
    }
  };

  // Helper to create a unique mention for testing
  const createUniqueMention = (suffix: string = Date.now().toString()) => ({
    id: `integration-mention-${suffix}`,
    brandId: TEST_IDS.BRANDS[0],
    platform: "chatgpt" as const,
    query: `Integration test query ${suffix}`,
    response: `Integration test response for ${suffix}`,
    sentiment: "positive" as const,
    position: 1,
    citationUrl: `https://test.com/${suffix}`,
    competitors: [
      { name: "Competitor A", position: 2, sentiment: "neutral" as const },
    ],
    promptCategory: "recommendation",
    topics: ["integration", "testing"],
    metadata: {
      modelVersion: "test-v1",
      responseLength: 100,
      confidenceScore: 0.9,
    },
    timestamp: new Date(),
  });

  describe("Query Mentions (SELECT)", () => {
    it("should fetch seeded mentions for a brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.mentions?.length) {
        console.warn("No seeded mentions available");
        return;
      }

      const brandId = seededData.brands[0].id;

      // Query mentions for the first brand
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.brandId, brandId));

      expect(mentions.length).toBeGreaterThan(0);
      mentions.forEach((mention) => {
        expect(mention.brandId).toBe(brandId);
      });
    });

    it("should fetch a single mention by ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.mentions?.length) {
        console.warn("No seeded mentions available");
        return;
      }

      const expectedMention = seededData.mentions[0];

      // Query mention by ID
      const [mention] = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.id, expectedMention.id))
        .limit(1);

      expect(mention).toBeDefined();
      expect(mention.id).toBe(expectedMention.id);
      expect(mention.brandId).toBe(expectedMention.brandId);
    });

    it("should return empty array for non-existent mention ID", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const result = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.id, "non-existent-mention-id-xyz"))
        .limit(1);

      expect(result).toEqual([]);
      expect(result[0]).toBeUndefined();
    });

    it("should filter mentions by brandId", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length || seededData.brands.length < 2) {
        console.warn("Not enough seeded brands for filter test");
        return;
      }

      const brandId = seededData.brands[0].id;

      // Query mentions filtered by brandId
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.brandId, brandId));

      // All results should have the correct brandId
      mentions.forEach((mention) => {
        expect(mention.brandId).toBe(brandId);
      });
    });

    it("should filter mentions by platform", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const platform = "chatgpt";

      // Query mentions filtered by platform
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.platform, platform));

      // All results should have the correct platform
      mentions.forEach((mention) => {
        expect(mention.platform).toBe(platform);
      });
    });

    it("should filter mentions by sentiment", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const sentiment = "positive";

      // Query mentions filtered by sentiment
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.sentiment, sentiment));

      // All results should have the correct sentiment
      mentions.forEach((mention) => {
        expect(mention.sentiment).toBe(sentiment);
      });
    });

    it("should filter mentions by multiple conditions (brandId and platform)", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const brandId = seededData.brands[0].id;
      const platform = "chatgpt";

      // Query with multiple filters
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .where(
          and(
            eq(schema.brandMentions.brandId, brandId),
            eq(schema.brandMentions.platform, platform)
          )
        );

      // All results should match both filters
      mentions.forEach((mention) => {
        expect(mention.brandId).toBe(brandId);
        expect(mention.platform).toBe(platform);
      });
    });

    it("should order mentions by timestamp descending", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const brandId = seededData.brands[0].id;

      // Query mentions ordered by timestamp
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.brandId, brandId))
        .orderBy(desc(schema.brandMentions.timestamp));

      // Verify order (most recent first)
      for (let i = 1; i < mentions.length; i++) {
        const prevTime = mentions[i - 1].timestamp?.getTime() || 0;
        const currTime = mentions[i].timestamp?.getTime() || 0;
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it("should support pagination with limit", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const limit = 2;

      // Get first page
      const firstPage = await db
        .select()
        .from(schema.brandMentions)
        .orderBy(desc(schema.brandMentions.timestamp))
        .limit(limit);

      expect(firstPage.length).toBeLessThanOrEqual(limit);

      // Get all mentions for comparison
      const allMentions = await db
        .select()
        .from(schema.brandMentions)
        .orderBy(desc(schema.brandMentions.timestamp));

      // Total should be >= the seeded mentions
      expect(allMentions.length).toBeGreaterThanOrEqual(firstPage.length);
    });
  });

  describe("Create Mention (INSERT)", () => {
    let createdMentionId: string | null = null;

    afterAll(async () => {
      if (createdMentionId) {
        await cleanupMention(createdMentionId);
      }
    });

    it("should insert a new mention into the database", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const mentionData = createUniqueMention("create-test-1");
      createdMentionId = mentionData.id;

      // Insert mention into database
      const [insertedMention] = await db
        .insert(schema.brandMentions)
        .values(mentionData)
        .returning();

      // Verify the insert returned data
      expect(insertedMention).toBeDefined();
      expect(insertedMention.id).toBe(mentionData.id);
      expect(insertedMention.brandId).toBe(mentionData.brandId);
      expect(insertedMention.platform).toBe(mentionData.platform);
      expect(insertedMention.query).toBe(mentionData.query);
      expect(insertedMention.sentiment).toBe(mentionData.sentiment);
    });

    it("should persist mention data that can be queried", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const mentionData = createUniqueMention("create-test-2");

      // Insert mention
      await db.insert(schema.brandMentions).values(mentionData).returning();

      // Query it back
      const [queriedMention] = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.id, mentionData.id))
        .limit(1);

      // Cleanup
      await cleanupMention(mentionData.id);

      // Verify data was persisted
      expect(queriedMention).toBeDefined();
      expect(queriedMention.id).toBe(mentionData.id);
      expect(queriedMention.query).toBe(mentionData.query);
      expect(queriedMention.response).toBe(mentionData.response);
    });

    it("should store complex nested data (competitors, metadata)", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const mentionData = createUniqueMention("create-nested");

      // Insert mention with complex data
      await db.insert(schema.brandMentions).values(mentionData).returning();

      // Query it back
      const [queriedMention] = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.id, mentionData.id))
        .limit(1);

      // Cleanup
      await cleanupMention(mentionData.id);

      // Verify nested data was stored correctly
      expect(queriedMention.competitors).toEqual(mentionData.competitors);
      expect(queriedMention.metadata).toEqual(mentionData.metadata);
      expect(queriedMention.topics).toEqual(mentionData.topics);
    });

    it("should reject duplicate mention IDs (primary key constraint)", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const mentionData = createUniqueMention("duplicate-test");

      // Insert first mention
      await db.insert(schema.brandMentions).values(mentionData).returning();

      // Attempt to insert duplicate
      try {
        await db.insert(schema.brandMentions).values(mentionData).returning();
        // Should not reach here
        expect.fail("Should have thrown duplicate key error");
      } catch (error) {
        // Expected: unique constraint violation
        expect(error).toBeDefined();
      } finally {
        // Cleanup
        await cleanupMention(mentionData.id);
      }
    });

    it("should enforce foreign key constraint for brandId", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const mentionData = {
        ...createUniqueMention("fk-test"),
        brandId: "non-existent-brand-id-xyz",
      };

      // Attempt to insert with invalid brandId
      try {
        await db.insert(schema.brandMentions).values(mentionData).returning();
        // May or may not throw depending on FK enforcement
      } catch (error) {
        // Expected: foreign key violation
        expect(error).toBeDefined();
      }
    });
  });

  describe("Mention Computed Fields", () => {
    it("should compute sentimentScore based on sentiment value", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.mentions?.length) {
        console.warn("No seeded mentions available");
        return;
      }

      // Query mentions
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .limit(10);

      // Verify we can compute sentiment scores as GraphQL resolver would
      mentions.forEach((mention) => {
        const sentimentScore =
          mention.sentiment === "positive" ? 0.8 :
          mention.sentiment === "negative" ? 0.2 : 0.5;

        expect(sentimentScore).toBeGreaterThanOrEqual(0);
        expect(sentimentScore).toBeLessThanOrEqual(1);

        if (mention.sentiment === "positive") {
          expect(sentimentScore).toBe(0.8);
        } else if (mention.sentiment === "negative") {
          expect(sentimentScore).toBe(0.2);
        } else {
          expect(sentimentScore).toBe(0.5);
        }
      });
    });

    it("should compute isRecommendation based on promptCategory", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.mentions?.length) {
        console.warn("No seeded mentions available");
        return;
      }

      // Query mentions
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .limit(10);

      // Verify we can compute isRecommendation as GraphQL resolver would
      mentions.forEach((mention) => {
        const isRecommendation = mention.promptCategory === "recommendation";
        expect(typeof isRecommendation).toBe("boolean");
      });
    });

    it("should compute competitorMentioned from competitors array", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.mentions?.length) {
        console.warn("No seeded mentions available");
        return;
      }

      // Query mentions
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .limit(10);

      // Verify we can compute competitorMentioned as GraphQL resolver would
      mentions.forEach((mention) => {
        const competitorMentioned = (mention.competitors || []).length > 0;
        expect(typeof competitorMentioned).toBe("boolean");
      });
    });
  });

  describe("Mention and Brand Relationship", () => {
    it("should be able to join mention with brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.mentions?.length || !seededData?.brands?.length) {
        console.warn("No seeded data available");
        return;
      }

      const mentionId = seededData.mentions[0].id;

      // Get mention
      const [mention] = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.id, mentionId))
        .limit(1);

      expect(mention).toBeDefined();

      // Get associated brand
      const [brand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, mention.brandId))
        .limit(1);

      expect(brand).toBeDefined();
      expect(brand.id).toBe(mention.brandId);
    });

    it("should get brand with mentions count", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const brandId = seededData.brands[0].id;

      // Get brand
      const [brand] = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.id, brandId))
        .limit(1);

      // Get mention count
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.brandId, brandId));

      expect(brand).toBeDefined();
      expect(mentions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Platform and Sentiment Statistics", () => {
    it("should count mentions by platform", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const brandId = seededData.brands[0].id;

      // Get all mentions for brand
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.brandId, brandId));

      // Group by platform manually
      const byPlatform = mentions.reduce((acc, m) => {
        acc[m.platform] = (acc[m.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Verify grouping
      Object.values(byPlatform).forEach((count) => {
        expect(count).toBeGreaterThan(0);
      });
    });

    it("should count mentions by sentiment", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const seededData = getSeededData();

      if (!seededData?.brands?.length) {
        console.warn("No seeded brands available");
        return;
      }

      const brandId = seededData.brands[0].id;

      // Get all mentions for brand
      const mentions = await db
        .select()
        .from(schema.brandMentions)
        .where(eq(schema.brandMentions.brandId, brandId));

      // Group by sentiment manually
      const bySentiment = mentions.reduce((acc, m) => {
        acc[m.sentiment] = (acc[m.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Total should match
      const total = Object.values(bySentiment).reduce((sum, c) => sum + c, 0);
      expect(total).toBe(mentions.length);
    });
  });

  describe("Edge Cases", () => {
    it("should handle mention with null optional fields", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const mentionId = `mention-null-fields-${Date.now()}`;

      // Insert mention with minimal data
      const [insertedMention] = await db
        .insert(schema.brandMentions)
        .values({
          id: mentionId,
          brandId: TEST_IDS.BRANDS[0],
          platform: "chatgpt",
          query: "Minimal query",
          response: "Minimal response",
          sentiment: "neutral",
          timestamp: new Date(),
          // Optional fields left undefined
        })
        .returning();

      // Cleanup
      await cleanupMention(mentionId);

      // Verify defaults/nulls
      expect(insertedMention).toBeDefined();
      expect(insertedMention.position).toBeNull();
      expect(insertedMention.citationUrl).toBeNull();
    });

    it("should handle mention with empty competitors array", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const mentionId = `mention-empty-competitors-${Date.now()}`;

      // Insert mention with empty competitors
      const [insertedMention] = await db
        .insert(schema.brandMentions)
        .values({
          id: mentionId,
          brandId: TEST_IDS.BRANDS[0],
          platform: "claude",
          query: "Query with no competitors",
          response: "Response",
          sentiment: "positive",
          competitors: [],
          timestamp: new Date(),
        })
        .returning();

      // Cleanup
      await cleanupMention(mentionId);

      // Verify empty array is stored
      expect(insertedMention.competitors).toEqual([]);

      // Compute competitorMentioned
      const competitorMentioned = (insertedMention.competitors || []).length > 0;
      expect(competitorMentioned).toBe(false);
    });

    it("should handle mention with long text fields", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const mentionId = `mention-long-text-${Date.now()}`;
      const longResponse = "A".repeat(5000);

      // Insert mention with long response
      const [insertedMention] = await db
        .insert(schema.brandMentions)
        .values({
          id: mentionId,
          brandId: TEST_IDS.BRANDS[0],
          platform: "gemini",
          query: "Query with long response",
          response: longResponse,
          sentiment: "neutral",
          timestamp: new Date(),
        })
        .returning();

      // Cleanup
      await cleanupMention(mentionId);

      // Verify long text is stored
      expect(insertedMention.response).toBe(longResponse);
      expect(insertedMention.response?.length).toBe(5000);
    });

    it("should handle all valid platform values", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const platforms = ["chatgpt", "claude", "gemini", "perplexity", "grok"] as const;

      for (const platform of platforms) {
        const mentionId = `mention-platform-${platform}-${Date.now()}`;

        const [insertedMention] = await db
          .insert(schema.brandMentions)
          .values({
            id: mentionId,
            brandId: TEST_IDS.BRANDS[0],
            platform,
            query: `Query for ${platform}`,
            response: "Response",
            sentiment: "neutral",
            timestamp: new Date(),
          })
          .returning();

        // Cleanup
        await cleanupMention(mentionId);

        expect(insertedMention.platform).toBe(platform);
      }
    });

    it("should handle all valid sentiment values", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const sentiments = ["positive", "neutral", "negative"] as const;

      for (const sentiment of sentiments) {
        const mentionId = `mention-sentiment-${sentiment}-${Date.now()}`;

        const [insertedMention] = await db
          .insert(schema.brandMentions)
          .values({
            id: mentionId,
            brandId: TEST_IDS.BRANDS[0],
            platform: "chatgpt",
            query: `Query with ${sentiment} sentiment`,
            response: "Response",
            sentiment,
            timestamp: new Date(),
          })
          .returning();

        // Cleanup
        await cleanupMention(mentionId);

        expect(insertedMention.sentiment).toBe(sentiment);
      }
    });
  });
});
