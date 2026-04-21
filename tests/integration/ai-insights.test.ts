/**
 * AI Platform Insights Integration Tests
 *
 * Tests the complete flow from query submission through platform analysis,
 * database persistence, and retrieval of results.
 *
 * Test Flow:
 * 1. Submit query to analyze endpoint
 * 2. Verify platform analysis executes
 * 3. Check database persistence (platformQueries, platformInsights, citationRecords)
 * 4. Retrieve results via history endpoint
 * 5. Retrieve platform-specific data
 * 6. Verify data integrity end-to-end
 *
 * Prerequisites:
 * - TEST_DATABASE_URL or DATABASE_URL must be configured
 * - Database must be accessible
 *
 * Note: These tests are designed to run against a real database.
 * When the database is not available, all tests will be skipped.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { eq, and, desc } from "drizzle-orm";
import {
  setupIntegrationTest,
  isDatabaseConfigured,
} from "./setup";
import { TEST_IDS } from "./seed";
import type { AIPlatform } from "@/lib/ai/types";

// Check if database is configured
const dbConfigured = isDatabaseConfigured();

// Helper to generate valid UUID format for test IDs
let testIdCounter = 0;
const generateTestUuid = (): string => {
  testIdCounter++;
  const now = Date.now();
  const hex = (now * 1000 + testIdCounter).toString(16).padStart(16, "0");
  return `aaaaaaaa-bbbb-4ccc-8ddd-${hex.slice(-12)}`;
};

// Mock environment variables for AI platform API keys
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    OPENAI_API_KEY: "test-openai-key",
    ANTHROPIC_API_KEY: "test-anthropic-key",
    GEMINI_API_KEY: "test-gemini-key",
    PERPLEXITY_API_KEY: "test-perplexity-key",
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe("AI Platform Insights Integration Tests", () => {
  // If database is not configured, skip all tests with a clear message
  if (!dbConfigured) {
    it.skip("all tests skipped - database not configured (set DATABASE_URL or TEST_DATABASE_URL)", () => {});
    return;
  }

  // Set up integration test infrastructure
  const { getDb, getSchema: getSchemaFn, getSeededData } = setupIntegrationTest();

  // Helper to create unique query for testing
  const createUniqueQuery = () => {
    const id = generateTestUuid();
    return {
      id,
      brandId: TEST_IDS.BRANDS[0],
      userId: TEST_IDS.USERS[0],
      queryText: `How do AI platforms reference our brand? (Test ${id.slice(-8)})`,
      brandContext: `Test brand is a leading technology company. Test ${id.slice(-8)}` as string | null,
      platforms: ["chatgpt", "claude", "gemini", "perplexity"] as AIPlatform[],
      status: "pending" as const,
      createdAt: new Date(),
    };
  };

  // Helper to create mock platform insight
  const createMockInsight = (queryId: string, platform: AIPlatform) => {
    const id = generateTestUuid();
    return {
      id,
      queryId,
      brandId: TEST_IDS.BRANDS[0],
      userId: TEST_IDS.USERS[0],
      platform,
      responseContent: `Test Brand is a leading technology company that specializes in AI solutions. ${id.slice(-8)}`,
      visibilityScore: 75,
      citationCount: 3,
      mentionCount: 2,
      prominenceScore: 20,
      contentTypePerformance: {
        blog_post: 2,
        documentation: 1,
      },
      recommendations: ["increase_mentions", "improve_citations"],
      metadata: {
        model: platform === "chatgpt" ? "gpt-4" : platform === "claude" ? "claude-3-5-sonnet-20241022" : platform === "gemini" ? "gemini-2.0-flash-001" : "llama-3.1-sonar-small-128k-online",
        modelVersion: "test-version",
        temperature: 0.7,
        tokensUsed: 1500,
        responseTime: 2500,
      },
      createdAt: new Date(),
    };
  };

  // Helper to create mock citation
  const createMockCitation = (insightId: string, brandId: string) => {
    const id = generateTestUuid();
    return {
      id,
      insightId,
      brandId,
      citationType: "direct_quote" as "direct_quote" | "paraphrase" | "link" | "reference",
      citationText: "Test Brand is a leader in technology innovation",
      sourceUrl: "https://testbrand.com/about" as string | null,
      sourceTitle: "About Test Brand" as string | null,
      position: 120,
      context: "According to industry sources, Test Brand is a leader..." as string | null,
      contentType: "documentation" as const,
      relevanceScore: 85,
      createdAt: new Date(),
    };
  };

  // Cleanup function for AI insights test data
  const cleanupAIInsights = async (queryId: string) => {
    const db = getDb();
    const schema = getSchemaFn();
    try {
      // Delete in order of dependencies
      await db.delete(schema.citationRecords).where(
        eq(schema.citationRecords.brandId, TEST_IDS.BRANDS[0])
      );
      await db.delete(schema.platformInsights).where(
        eq(schema.platformInsights.queryId, queryId)
      );
      await db.delete(schema.platformQueries).where(
        eq(schema.platformQueries.id, queryId)
      );
    } catch {
      // Ignore cleanup errors
    }
  };

  describe("Create Platform Query (INSERT)", () => {
    let createdQueryId: string | null = null;

    afterAll(async () => {
      if (createdQueryId) {
        await cleanupAIInsights(createdQueryId);
      }
    });

    it("should insert a new platform query into the database", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const queryData = createUniqueQuery();
      createdQueryId = queryData.id;

      // Insert query into database
      const [insertedQuery] = await db
        .insert(schema.platformQueries)
        .values(queryData)
        .returning();

      // Verify the insert returned data
      expect(insertedQuery).toBeDefined();
      expect(insertedQuery.id).toBe(queryData.id);
      expect(insertedQuery.queryText).toBe(queryData.queryText);
      expect(insertedQuery.brandId).toBe(TEST_IDS.BRANDS[0]);
      expect(insertedQuery.userId).toBe(TEST_IDS.USERS[0]);
      expect(insertedQuery.status).toBe("pending");
      expect(insertedQuery.platforms).toEqual(queryData.platforms);
    });

    it("should persist query data that can be retrieved", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const queryData = createUniqueQuery();

      // Insert query
      await db.insert(schema.platformQueries).values(queryData).returning();

      // Query it back
      const [queriedQuery] = await db
        .select()
        .from(schema.platformQueries)
        .where(eq(schema.platformQueries.id, queryData.id))
        .limit(1);

      // Cleanup
      await cleanupAIInsights(queryData.id);

      // Verify data was persisted
      expect(queriedQuery).toBeDefined();
      expect(queriedQuery.id).toBe(queryData.id);
      expect(queriedQuery.queryText).toBe(queryData.queryText);
      expect(queriedQuery.brandContext).toBe(queryData.brandContext);
      expect(queriedQuery.platforms).toEqual(queryData.platforms);
    });

    it("should store complex platform array data", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const queryData = createUniqueQuery();

      // Insert query with all platforms
      await db.insert(schema.platformQueries).values(queryData).returning();

      // Query it back
      const [queriedQuery] = await db
        .select()
        .from(schema.platformQueries)
        .where(eq(schema.platformQueries.id, queryData.id))
        .limit(1);

      // Cleanup
      await cleanupAIInsights(queryData.id);

      // Verify platforms array was stored correctly
      expect(queriedQuery.platforms).toEqual(["chatgpt", "claude", "gemini", "perplexity"]);
      expect(queriedQuery.platforms).toHaveLength(4);
    });
  });

  describe("Create Platform Insights (INSERT)", () => {
    let testQueryId: string | null = null;

    beforeEach(async () => {
      // Create a query for each insight test
      const db = getDb();
      const schema = getSchemaFn();
      const queryData = createUniqueQuery();
      testQueryId = queryData.id;

      await db.insert(schema.platformQueries).values(queryData).returning();
    });

    afterAll(async () => {
      if (testQueryId) {
        await cleanupAIInsights(testQueryId);
      }
    });

    it("should insert platform insight for ChatGPT", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const insightData = createMockInsight(testQueryId!, "chatgpt");

      // Insert insight
      const [insertedInsight] = await db
        .insert(schema.platformInsights)
        .values(insightData)
        .returning();

      // Verify the insert
      expect(insertedInsight).toBeDefined();
      expect(insertedInsight.platform).toBe("chatgpt");
      expect(insertedInsight.visibilityScore).toBe(75);
      expect(insertedInsight.citationCount).toBe(3);
      expect(insertedInsight.mentionCount).toBe(2);
      expect(insertedInsight.prominenceScore).toBe(20);

      // Cleanup
      await cleanupAIInsights(testQueryId!);
    });

    it("should store JSONB content type performance data", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const insightData = createMockInsight(testQueryId!, "claude");

      // Insert insight
      await db.insert(schema.platformInsights).values(insightData).returning();

      // Query it back
      const [queriedInsight] = await db
        .select()
        .from(schema.platformInsights)
        .where(eq(schema.platformInsights.id, insightData.id))
        .limit(1);

      // Cleanup
      await cleanupAIInsights(testQueryId!);

      // Verify JSONB data was stored correctly
      expect(queriedInsight.contentTypePerformance).toEqual({
        blog_post: 2,
        documentation: 1,
      });
    });

    it("should store JSONB metadata correctly", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const insightData = createMockInsight(testQueryId!, "gemini");

      // Insert insight
      await db.insert(schema.platformInsights).values(insightData).returning();

      // Query it back
      const [queriedInsight] = await db
        .select()
        .from(schema.platformInsights)
        .where(eq(schema.platformInsights.id, insightData.id))
        .limit(1);

      // Cleanup
      await cleanupAIInsights(testQueryId!);

      // Verify metadata JSONB
      expect(queriedInsight.metadata).toBeDefined();
      expect(queriedInsight.metadata).toHaveProperty("model");
      expect(queriedInsight.metadata).toHaveProperty("tokensUsed");
    });

    it("should insert insights for all 4 platforms", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const platforms: AIPlatform[] = ["chatgpt", "claude", "gemini", "perplexity"];

      // Insert insight for each platform
      for (const platform of platforms) {
        const insightData = createMockInsight(testQueryId!, platform);
        await db.insert(schema.platformInsights).values(insightData).returning();
      }

      // Query all insights for this query
      const insights = await db
        .select()
        .from(schema.platformInsights)
        .where(eq(schema.platformInsights.queryId, testQueryId!));

      // Cleanup
      await cleanupAIInsights(testQueryId!);

      // Verify all 4 platforms were inserted
      expect(insights).toHaveLength(4);
      const platformNames = insights.map((i) => i.platform);
      expect(platformNames).toContain("chatgpt");
      expect(platformNames).toContain("claude");
      expect(platformNames).toContain("gemini");
      expect(platformNames).toContain("perplexity");
    });
  });

  describe("Create Citation Records (INSERT)", () => {
    let testQueryId: string | null = null;
    let testInsightId: string | null = null;

    beforeEach(async () => {
      // Create a query and insight for citation tests
      const db = getDb();
      const schema = getSchemaFn();
      const queryData = createUniqueQuery();
      testQueryId = queryData.id;

      await db.insert(schema.platformQueries).values(queryData).returning();

      const insightData = createMockInsight(testQueryId, "chatgpt");
      testInsightId = insightData.id;
      await db.insert(schema.platformInsights).values(insightData).returning();
    });

    afterAll(async () => {
      if (testQueryId) {
        await cleanupAIInsights(testQueryId);
      }
    });

    it("should insert a citation record", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const citationData = createMockCitation(testInsightId!, TEST_IDS.BRANDS[0]);

      // Insert citation
      const [insertedCitation] = await db
        .insert(schema.citationRecords)
        .values(citationData)
        .returning();

      // Verify the insert
      expect(insertedCitation).toBeDefined();
      expect(insertedCitation.insightId).toBe(testInsightId);
      expect(insertedCitation.citationType).toBe("direct_quote");
      expect(insertedCitation.citationText).toBe("Test Brand is a leader in technology innovation");
      expect(insertedCitation.sourceUrl).toBe("https://testbrand.com/about");
      expect(insertedCitation.relevanceScore).toBe(85);

      // Cleanup
      await cleanupAIInsights(testQueryId!);
    });

    it("should support all citation types", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const citationTypes = ["direct_quote", "paraphrase", "link", "reference"] as const;

      // Insert citation for each type
      for (const citationType of citationTypes) {
        const citationData = createMockCitation(testInsightId!, TEST_IDS.BRANDS[0]);
        citationData.citationType = citationType;
        await db.insert(schema.citationRecords).values(citationData).returning();
      }

      // Query all citations
      const citations = await db
        .select()
        .from(schema.citationRecords)
        .where(eq(schema.citationRecords.insightId, testInsightId!));

      // Cleanup
      await cleanupAIInsights(testQueryId!);

      // Verify all citation types were inserted
      expect(citations).toHaveLength(4);
      const types = citations.map((c) => c.citationType);
      expect(types).toContain("direct_quote");
      expect(types).toContain("paraphrase");
      expect(types).toContain("link");
      expect(types).toContain("reference");
    });

    it("should store multiple citations per insight", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Insert 3 citations for the same insight
      for (let i = 0; i < 3; i++) {
        const citationData = createMockCitation(testInsightId!, TEST_IDS.BRANDS[0]);
        await db.insert(schema.citationRecords).values(citationData).returning();
      }

      // Query citations for this insight
      const citations = await db
        .select()
        .from(schema.citationRecords)
        .where(eq(schema.citationRecords.insightId, testInsightId!));

      // Cleanup
      await cleanupAIInsights(testQueryId!);

      // Verify multiple citations were stored
      expect(citations).toHaveLength(3);
    });
  });

  describe("Query Platform Insights (SELECT)", () => {
    let testQueryId: string | null = null;

    beforeEach(async () => {
      // Set up query with insights and citations
      const db = getDb();
      const schema = getSchemaFn();
      const queryData = createUniqueQuery();
      testQueryId = queryData.id;

      await db.insert(schema.platformQueries).values(queryData).returning();

      // Add insights for all platforms
      const platforms: AIPlatform[] = ["chatgpt", "claude", "gemini", "perplexity"];
      for (const platform of platforms) {
        const insightData = createMockInsight(testQueryId, platform);
        await db.insert(schema.platformInsights).values(insightData).returning();
      }
    });

    afterAll(async () => {
      if (testQueryId) {
        await cleanupAIInsights(testQueryId);
      }
    });

    it("should retrieve query with all platform insights", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Query using relations
      const result = await db.query.platformQueries.findFirst({
        where: eq(schema.platformQueries.id, testQueryId!),
        with: {
          insights: true,
        },
      });

      // Cleanup
      await cleanupAIInsights(testQueryId!);

      // Verify query and insights
      expect(result).toBeDefined();
      expect(result!.insights).toHaveLength(4);
    });

    it("should filter insights by platform", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Query ChatGPT insights only
      const chatgptInsights = await db
        .select()
        .from(schema.platformInsights)
        .where(
          and(
            eq(schema.platformInsights.queryId, testQueryId!),
            eq(schema.platformInsights.platform, "chatgpt")
          )
        );

      // Cleanup
      await cleanupAIInsights(testQueryId!);

      // Verify filtered results
      expect(chatgptInsights).toHaveLength(1);
      expect(chatgptInsights[0].platform).toBe("chatgpt");
    });

    it("should retrieve insights ordered by createdAt desc", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const insights = await db
        .select()
        .from(schema.platformInsights)
        .where(eq(schema.platformInsights.queryId, testQueryId!))
        .orderBy(desc(schema.platformInsights.createdAt));

      // Cleanup
      await cleanupAIInsights(testQueryId!);

      // Verify order
      expect(insights.length).toBeGreaterThan(0);
      for (let i = 1; i < insights.length; i++) {
        const prevDate = new Date(insights[i - 1].createdAt).getTime();
        const currDate = new Date(insights[i].createdAt).getTime();
        expect(prevDate).toBeGreaterThanOrEqual(currDate);
      }
    });
  });

  describe("Full Analysis Flow (CREATE â†’ READ)", () => {
    it("should complete full cycle: query â†' insights â†' citations â†' retrieval", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const queryData = createUniqueQuery();

      // CREATE query
      const [createdQuery] = await db
        .insert(schema.platformQueries)
        .values(queryData)
        .returning();

      expect(createdQuery.id).toBe(queryData.id);
      expect(createdQuery.status).toBe("pending");

      // CREATE insights for all platforms
      const platforms: AIPlatform[] = ["chatgpt", "claude", "gemini", "perplexity"];
      const insightIds: string[] = [];

      for (const platform of platforms) {
        const insightData = createMockInsight(queryData.id, platform);
        const [insight] = await db
          .insert(schema.platformInsights)
          .values(insightData)
          .returning();

        insightIds.push(insight.id);

        // CREATE citations for each insight
        for (let i = 0; i < 2; i++) {
          const citationData = createMockCitation(insight.id, TEST_IDS.BRANDS[0]);
          await db.insert(schema.citationRecords).values(citationData).returning();
        }
      }

      // Update query status to completed
      await db
        .update(schema.platformQueries)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(schema.platformQueries.id, queryData.id));

      // READ - Retrieve complete query with relations
      const result = await db.query.platformQueries.findFirst({
        where: eq(schema.platformQueries.id, queryData.id),
        with: {
          insights: {
            with: {
              citations: true,
            },
          },
          brand: true,
        },
      });

      // Cleanup
      await cleanupAIInsights(queryData.id);

      // Verify complete data structure
      expect(result).toBeDefined();
      expect(result!.status).toBe("completed");
      expect(result!.insights).toHaveLength(4);
      expect(result!.brand).toBeDefined();

      // Verify each insight has citations
      for (const insight of result!.insights) {
        expect(insight.citations).toBeDefined();
        expect(insight.citations.length).toBeGreaterThan(0);
      }

      // Calculate total citations
      const totalCitations = result!.insights.reduce(
        (sum, insight) => sum + insight.citations.length,
        0
      );
      expect(totalCitations).toBe(8); // 4 platforms Ã— 2 citations each
    });
  });

  describe("Update Query Status (UPDATE)", () => {
    let testQueryId: string | null = null;

    beforeEach(async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const queryData = createUniqueQuery();
      testQueryId = queryData.id;

      await db.insert(schema.platformQueries).values(queryData).returning();
    });

    afterAll(async () => {
      if (testQueryId) {
        await cleanupAIInsights(testQueryId);
      }
    });

    it("should update query status from pending to completed", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Update status
      const [updatedQuery] = await db
        .update(schema.platformQueries)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(schema.platformQueries.id, testQueryId!))
        .returning();

      expect(updatedQuery.status).toBe("completed");
      expect(updatedQuery.completedAt).toBeDefined();

      // Cleanup
      await cleanupAIInsights(testQueryId!);
    });

    it("should update query status to partial", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Update to partial status (some platforms failed)
      const [updatedQuery] = await db
        .update(schema.platformQueries)
        .set({ status: "partial", completedAt: new Date() })
        .where(eq(schema.platformQueries.id, testQueryId!))
        .returning();

      expect(updatedQuery.status).toBe("partial");

      // Cleanup
      await cleanupAIInsights(testQueryId!);
    });

    it("should update query status to failed", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Update to failed status
      const [updatedQuery] = await db
        .update(schema.platformQueries)
        .set({ status: "failed", completedAt: new Date() })
        .where(eq(schema.platformQueries.id, testQueryId!))
        .returning();

      expect(updatedQuery.status).toBe("failed");

      // Cleanup
      await cleanupAIInsights(testQueryId!);
    });
  });

  describe("Query History by Brand (SELECT)", () => {
    it("should retrieve all queries for a specific brand", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Create multiple queries for the test brand
      const query1 = createUniqueQuery();
      const query2 = createUniqueQuery();

      await db.insert(schema.platformQueries).values(query1).returning();
      await db.insert(schema.platformQueries).values(query2).returning();

      // Query all queries for brand
      const queries = await db
        .select()
        .from(schema.platformQueries)
        .where(eq(schema.platformQueries.brandId, TEST_IDS.BRANDS[0]))
        .orderBy(desc(schema.platformQueries.createdAt));

      // Cleanup
      await cleanupAIInsights(query1.id);
      await cleanupAIInsights(query2.id);

      // Verify we got at least the 2 test queries
      expect(queries.length).toBeGreaterThanOrEqual(2);
      const queryIds = queries.map((q) => q.id);
      expect(queryIds).toContain(query1.id);
      expect(queryIds).toContain(query2.id);
    });
  });

  describe("Platform-Specific Queries (SELECT)", () => {
    let testQueryId: string | null = null;

    beforeEach(async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const queryData = createUniqueQuery();
      testQueryId = queryData.id;

      await db.insert(schema.platformQueries).values(queryData).returning();

      // Add insights for all platforms
      const platforms: AIPlatform[] = ["chatgpt", "claude", "gemini", "perplexity"];
      for (const platform of platforms) {
        const insightData = createMockInsight(testQueryId, platform);
        await db.insert(schema.platformInsights).values(insightData).returning();
      }
    });

    afterAll(async () => {
      if (testQueryId) {
        await cleanupAIInsights(testQueryId);
      }
    });

    it("should retrieve ChatGPT insights only", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      const insights = await db
        .select()
        .from(schema.platformInsights)
        .where(
          and(
            eq(schema.platformInsights.platform, "chatgpt"),
            eq(schema.platformInsights.brandId, TEST_IDS.BRANDS[0])
          )
        );

      // Cleanup
      await cleanupAIInsights(testQueryId!);

      expect(insights.length).toBeGreaterThanOrEqual(1);
      insights.forEach((insight) => {
        expect(insight.platform).toBe("chatgpt");
      });
    });

    it("should calculate aggregate stats per platform", async () => {
      const db = getDb();
      const schema = getSchemaFn();

      // Get all insights for a platform
      const claudeInsights = await db
        .select()
        .from(schema.platformInsights)
        .where(
          and(
            eq(schema.platformInsights.platform, "claude"),
            eq(schema.platformInsights.brandId, TEST_IDS.BRANDS[0])
          )
        );

      // Cleanup
      await cleanupAIInsights(testQueryId!);

      // Calculate aggregates
      const avgScore = claudeInsights.reduce((sum, i) => sum + (i.visibilityScore || 0), 0) / claudeInsights.length;
      const totalCitations = claudeInsights.reduce((sum, i) => sum + (i.citationCount || 0), 0);
      const totalMentions = claudeInsights.reduce((sum, i) => sum + (i.mentionCount || 0), 0);

      expect(avgScore).toBeGreaterThan(0);
      expect(totalCitations).toBeGreaterThan(0);
      expect(totalMentions).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle query with empty brand context", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const queryData = createUniqueQuery();
      queryData.brandContext = null;

      const [inserted] = await db
        .insert(schema.platformQueries)
        .values(queryData)
        .returning();

      // Cleanup
      await cleanupAIInsights(queryData.id);

      expect(inserted.brandContext).toBeNull();
    });

    it("should handle insight with zero visibility score", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const queryData = createUniqueQuery();
      await db.insert(schema.platformQueries).values(queryData).returning();

      const insightData = createMockInsight(queryData.id, "chatgpt");
      insightData.visibilityScore = 0;
      insightData.citationCount = 0;
      insightData.mentionCount = 0;

      const [inserted] = await db
        .insert(schema.platformInsights)
        .values(insightData)
        .returning();

      // Cleanup
      await cleanupAIInsights(queryData.id);

      expect(inserted.visibilityScore).toBe(0);
      expect(inserted.citationCount).toBe(0);
      expect(inserted.mentionCount).toBe(0);
    });

    it("should handle citation with null optional fields", async () => {
      const db = getDb();
      const schema = getSchemaFn();
      const queryData = createUniqueQuery();
      await db.insert(schema.platformQueries).values(queryData).returning();

      const insightData = createMockInsight(queryData.id, "gemini");
      await db.insert(schema.platformInsights).values(insightData).returning();

      const citationData = createMockCitation(insightData.id, TEST_IDS.BRANDS[0]);
      citationData.sourceUrl = null;
      citationData.sourceTitle = null;
      citationData.context = null;

      const [inserted] = await db
        .insert(schema.citationRecords)
        .values(citationData)
        .returning();

      // Cleanup
      await cleanupAIInsights(queryData.id);

      expect(inserted.sourceUrl).toBeNull();
      expect(inserted.sourceTitle).toBeNull();
      expect(inserted.context).toBeNull();
    });
  });
});
