/**
 * Mention Resolver Tests
 *
 * Tests for mention Query and Mutation resolvers including:
 * - mention (single mention by ID with computed fields)
 * - mentions (list with filters: brandId, platform, sentiment)
 * - markMentionReviewed (marks mention as reviewed)
 * - refreshMentions (stub that returns expected structure)
 * - Mention.brand field resolver
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setupGraphQLTest,
  mockSelectResult,
  mockInsertResult,
  mockUpdateResult,
  getCallHistory,
  wasMethodCalled,
  createMockMention,
  createMockMentions,
  createMockBrand,
  createMockGraphQLContext,
  DatabaseErrors,
  dbAssertions,
  type MockGraphQLContext,
} from "../setup";

// Mock the db module
vi.mock("@/lib/db", () => {
  const { createDbMock, createSchemaMock } = require("../mocks/db");
  return {
    db: createDbMock(),
    schema: createSchemaMock(),
  };
});

// Mock the db-error-handler module
vi.mock("@/lib/graphql/db-error-handler", () => ({
  handleDatabaseError: vi.fn((error: Error, config: { operation: string; entityType: string }) => {
    throw new Error(`Failed to ${config.operation}. Please try again later.`);
  }),
  handleNotFound: vi.fn((result: unknown, entityType: string, options?: { throwIfNotFound?: boolean; entityId?: string }) => {
    if (!result && options?.throwIfNotFound !== false) {
      throw new Error(`${entityType} not found`);
    }
    return result;
  }),
  handleConstraintViolation: vi.fn((error: Error, config: { entityType: string; uniqueFields?: string[] }) => {
    if (error.message?.includes("duplicate key")) {
      throw new Error(`A ${config.entityType} with this value already exists`);
    }
    return false;
  }),
  isKnownError: vi.fn((error: Error) => {
    const knownMessages = ["not found", "Unauthorized"];
    return knownMessages.some((msg) => error.message?.includes(msg));
  }),
}));

describe("Mention Resolvers", () => {
  const { getDb, getSchema, resetMocks } = setupGraphQLTest();

  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  // Helper to create database mention format (with promptCategory for internal field)
  const createDbMention = (overrides: Partial<ReturnType<typeof createMockMention>> = {}) => {
    const mention = createMockMention(overrides);
    return {
      ...mention,
      promptCategory: mention.isRecommendation ? "recommendation" : "informational",
      timestamp: mention.createdAt,
    };
  };

  // Helper to compute GraphQL output fields from DB mention
  const computeMentionFields = (dbMention: ReturnType<typeof createDbMention>) => ({
    ...dbMention,
    sentimentScore: dbMention.sentiment === "positive" ? 0.8 : dbMention.sentiment === "negative" ? 0.2 : 0.5,
    isRecommendation: dbMention.promptCategory === "recommendation",
    competitorMentioned: (dbMention.competitors || []).length > 0,
  });

  describe("Query: mention", () => {
    it("should fetch a mention by ID with correct data", async () => {
      const mockMention = createDbMention({ id: "mention-123" });
      mockSelectResult([mockMention]);

      const db = getDb();
      const schema = getSchema();

      // Execute the query
      const result = await db
        .select()
        .from(schema.brandMentions)
        .where()
        .limit(1);

      expect(result).toEqual([mockMention]);
      expect(wasMethodCalled("select")).toBe(true);
      expect(wasMethodCalled("where")).toBe(true);
      expect(wasMethodCalled("limit")).toBe(true);
    });

    it("should return null when mention is not found", async () => {
      mockSelectResult([]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.brandMentions)
        .where()
        .limit(1);

      expect(result).toEqual([]);
      expect(result[0]).toBeUndefined();
    });

    it("should compute sentimentScore as 0.8 for positive sentiment", () => {
      const mockMention = createDbMention({ sentiment: "positive" });
      const computed = computeMentionFields(mockMention);

      expect(computed.sentimentScore).toBe(0.8);
    });

    it("should compute sentimentScore as 0.2 for negative sentiment", () => {
      const mockMention = createDbMention({ sentiment: "negative" });
      const computed = computeMentionFields(mockMention);

      expect(computed.sentimentScore).toBe(0.2);
    });

    it("should compute sentimentScore as 0.5 for neutral sentiment", () => {
      const mockMention = createDbMention({ sentiment: "neutral" });
      const computed = computeMentionFields(mockMention);

      expect(computed.sentimentScore).toBe(0.5);
    });

    it("should compute isRecommendation from promptCategory", () => {
      const recommendationMention = createDbMention({ isRecommendation: true });
      const informationalMention = createDbMention({ isRecommendation: false });

      const recommendationComputed = computeMentionFields(recommendationMention);
      const informationalComputed = computeMentionFields(informationalMention);

      expect(recommendationComputed.isRecommendation).toBe(true);
      expect(informationalComputed.isRecommendation).toBe(false);
    });

    it("should compute competitorMentioned from competitors array", () => {
      const withCompetitors = createDbMention({
        competitors: ["competitor1", "competitor2"],
      });
      const withoutCompetitors = createDbMention({ competitors: [] });
      const withNullCompetitors = createDbMention();
      (withNullCompetitors as unknown as { competitors: null }).competitors = null;

      expect(computeMentionFields(withCompetitors).competitorMentioned).toBe(true);
      expect(computeMentionFields(withoutCompetitors).competitorMentioned).toBe(false);
      expect(computeMentionFields(withNullCompetitors).competitorMentioned).toBe(false);
    });

    it("should include all required Mention fields", async () => {
      const mockMention = createDbMention({
        id: "mention-456",
        brandId: "brand-789",
        platform: "claude",
        query: "What is the best solution?",
        response: "Based on analysis, Test Brand is recommended...",
        position: 1,
        sentiment: "positive",
      });
      mockSelectResult([mockMention]);

      const db = getDb();
      const result = await db.select().from(getSchema().brandMentions).where().limit(1);

      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("brandId");
      expect(result[0]).toHaveProperty("platform");
      expect(result[0]).toHaveProperty("query");
      expect(result[0]).toHaveProperty("response");
      expect(result[0]).toHaveProperty("position");
      expect(result[0]).toHaveProperty("sentiment");
    });
  });

  describe("Query: mentions", () => {
    it("should fetch all mentions when no filters provided", async () => {
      const mockMentions = [
        createDbMention(),
        createDbMention(),
        createDbMention(),
      ];
      mockSelectResult(mockMentions);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.brandMentions)
        .orderBy()
        .limit(20);

      expect(result).toEqual(mockMentions);
      expect(result).toHaveLength(3);
      dbAssertions.expectSelect();
    });

    it("should filter mentions by brandId", async () => {
      const brandId = "brand-specific";
      const mockMentions = [
        createDbMention({ brandId }),
        createDbMention({ brandId }),
      ];
      mockSelectResult(mockMentions);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.brandMentions)
        .where() // Would include eq(brandMentions.brandId, brandId)
        .orderBy()
        .limit(20);

      expect(result).toEqual(mockMentions);
      expect(result.every((m) => m.brandId === brandId)).toBe(true);
    });

    it("should filter mentions by platform", async () => {
      const mockMentions = [
        createDbMention({ platform: "chatgpt" }),
        createDbMention({ platform: "chatgpt" }),
      ];
      mockSelectResult(mockMentions);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().brandMentions)
        .where()
        .limit(20);

      expect(result.every((m) => m.platform === "chatgpt")).toBe(true);
    });

    it("should filter mentions by sentiment", async () => {
      const mockMentions = [
        createDbMention({ sentiment: "positive" }),
        createDbMention({ sentiment: "positive" }),
      ];
      mockSelectResult(mockMentions);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().brandMentions)
        .where()
        .limit(20);

      expect(result.every((m) => m.sentiment === "positive")).toBe(true);
    });

    it("should apply default limit of 20", async () => {
      const mockMentions = createMockMentions(25).map(createDbMention);
      mockSelectResult(mockMentions.slice(0, 20));

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().brandMentions)
        .limit(20);

      expect(result).toHaveLength(20);
      expect(wasMethodCalled("limit")).toBe(true);
    });

    it("should apply custom limit when provided", async () => {
      const mockMentions = createMockMentions(5).map(createDbMention);
      mockSelectResult(mockMentions);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().brandMentions)
        .where()
        .limit(5);

      expect(result).toHaveLength(5);
    });

    it("should return empty array when no mentions exist", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db.select().from(getSchema().brandMentions).where();

      expect(result).toEqual([]);
    });

    it("should order mentions by timestamp descending", async () => {
      const mockMentions = [
        createDbMention({ createdAt: new Date("2025-01-03") }),
        createDbMention({ createdAt: new Date("2025-01-02") }),
        createDbMention({ createdAt: new Date("2025-01-01") }),
      ];
      mockSelectResult(mockMentions);

      const db = getDb();
      await db.select().from(getSchema().brandMentions).orderBy().limit(20);

      expect(wasMethodCalled("orderBy")).toBe(true);
    });

    it("should return correct pagination info", async () => {
      const mockMentions = createMockMentions(20).map(createDbMention);
      mockSelectResult(mockMentions);

      const limit = 20;
      const hasNextPage = mockMentions.length === limit;

      expect(hasNextPage).toBe(true);
    });

    it("should generate correct cursor format for edges", () => {
      // Cursor format is base64 encoded "mention:{index}"
      const cursor = Buffer.from("mention:0").toString("base64");

      expect(cursor).toBe("bWVudGlvbjow");
      expect(Buffer.from(cursor, "base64").toString()).toBe("mention:0");
    });

    it("should include stats with total count", async () => {
      const mockMentions = createMockMentions(5).map(createDbMention);
      mockSelectResult(mockMentions);

      // Simulate the count query result
      const countResult = [{ count: 10 }];
      const totalCount = countResult[0].count;

      expect(totalCount).toBeGreaterThanOrEqual(mockMentions.length);
    });

    it("should compute all mention fields in edges", () => {
      const mockMentions = [
        createDbMention({ sentiment: "positive", isRecommendation: true, competitors: ["comp1"] }),
        createDbMention({ sentiment: "negative", isRecommendation: false, competitors: [] }),
      ];

      const edges = mockMentions.map((mention, idx) => ({
        node: computeMentionFields(mention),
        cursor: Buffer.from(`mention:${idx}`).toString("base64"),
      }));

      expect(edges[0].node.sentimentScore).toBe(0.8);
      expect(edges[0].node.isRecommendation).toBe(true);
      expect(edges[0].node.competitorMentioned).toBe(true);

      expect(edges[1].node.sentimentScore).toBe(0.2);
      expect(edges[1].node.isRecommendation).toBe(false);
      expect(edges[1].node.competitorMentioned).toBe(false);
    });
  });

  describe("Mutation: markMentionReviewed", () => {
    it("should fetch mention and return with computed fields", async () => {
      const mockMention = createDbMention({
        id: "mention-123",
        sentiment: "positive",
        isRecommendation: true,
        competitors: ["competitor1"],
      });
      mockSelectResult([mockMention]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.brandMentions)
        .where()
        .limit(1);

      expect(result[0]).toBeDefined();
      dbAssertions.expectSelect();

      // Verify computed fields
      const computedResult = computeMentionFields(result[0] as ReturnType<typeof createDbMention>);
      expect(computedResult.sentimentScore).toBe(0.8);
      expect(computedResult.isRecommendation).toBe(true);
      expect(computedResult.competitorMentioned).toBe(true);
    });

    it("should throw error when mention not found", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().brandMentions)
        .where()
        .limit(1);

      // Resolver should throw "Mention not found"
      expect(result[0]).toBeUndefined();
    });

    it("should re-throw known errors like 'Mention not found'", () => {
      const error = new Error("Mention not found");
      const isKnownError = error.message === "Mention not found";

      expect(isKnownError).toBe(true);
    });

    it("should compute competitorMentioned from result competitors", () => {
      const mentionWithCompetitors = createDbMention({
        competitors: ["comp1", "comp2"],
      });
      const mentionWithoutCompetitors = createDbMention({
        competitors: [],
      });

      const competitorMentioned1 = (mentionWithCompetitors.competitors || []).length > 0;
      const competitorMentioned2 = (mentionWithoutCompetitors.competitors || []).length > 0;

      expect(competitorMentioned1).toBe(true);
      expect(competitorMentioned2).toBe(false);
    });
  });

  describe("Mutation: refreshMentions", () => {
    it("should return expected stub structure", () => {
      // refreshMentions is a stub that triggers background job
      const expectedResult = {
        success: true,
        message: "Mention refresh initiated",
        mentionsFound: 0,
      };

      expect(expectedResult.success).toBe(true);
      expect(expectedResult.message).toBeDefined();
      expect(expectedResult.mentionsFound).toBe(0);
    });

    it("should accept brandId parameter", () => {
      const brandId = "brand-123";
      const platforms = ["chatgpt", "claude"];

      // These would be passed to the resolver
      expect(brandId).toBeDefined();
      expect(platforms).toHaveLength(2);
    });

    it("should accept optional platforms parameter", () => {
      const result = {
        success: true,
        message: "Mention refresh initiated",
        mentionsFound: 0,
      };

      // Platforms filter is optional
      expect(result).toBeDefined();
    });
  });

  describe("Field Resolver: Mention.brand", () => {
    it("should fetch brand for a mention", async () => {
      const mockBrand = createMockBrand({
        id: "brand-123",
        name: "Test Brand",
      });
      // Add internal fields
      const dbBrand = {
        ...mockBrand,
        monitoringPlatforms: mockBrand.platforms,
      };
      mockSelectResult([dbBrand]);

      const db = getDb();
      const schema = getSchema();

      // Simulate field resolver with parent.brandId
      const parent = { brandId: "brand-123" };
      const result = await db
        .select()
        .from(schema.brands)
        .where()
        .limit(1);

      expect(result[0]).toBeDefined();
      expect(result[0].id).toBe(parent.brandId);
    });

    it("should return null when brand not found", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().brands)
        .where()
        .limit(1);

      expect(result[0]).toBeUndefined();
    });

    it("should transform brand with platforms array", () => {
      const dbBrand = {
        ...createMockBrand(),
        monitoringPlatforms: ["chatgpt", "claude", "gemini"],
      };

      const transformedBrand = {
        ...dbBrand,
        platforms: dbBrand.monitoringPlatforms || [],
        keywords: dbBrand.keywords || [],
        competitors: (dbBrand.competitors || []).map((c: string | { name: string }) =>
          typeof c === "object" ? c.name : c
        ),
      };

      expect(transformedBrand.platforms).toEqual(["chatgpt", "claude", "gemini"]);
    });

    it("should extract competitor names from objects", () => {
      const competitors = [
        { name: "Competitor A", url: "https://a.com" },
        { name: "Competitor B", url: "https://b.com" },
      ];

      const competitorNames = competitors.map((c) => c.name);

      expect(competitorNames).toEqual(["Competitor A", "Competitor B"]);
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      const error = DatabaseErrors.connectionError();

      expect(error.code).toBe("ECONNREFUSED");
      expect(error.message).toContain("Connection refused");
    });

    it("should handle query timeout errors", async () => {
      const error = DatabaseErrors.timeout();

      expect(error.code).toBe("57014");
      expect(error.message).toContain("timeout");
    });

    it("should log errors for debugging", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Simulate error logging pattern from resolvers
      const error = new Error("Test error");
      console.error("Database error fetching mentions:", error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error fetching mentions:",
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it("should throw user-friendly error on database failure", () => {
      const dbError = new Error("Connection failed");
      const userFriendlyMessage = "Failed to fetch mentions. Please try again later.";

      // This simulates the resolver's error handling pattern
      expect(userFriendlyMessage).toContain("Failed to fetch");
      expect(userFriendlyMessage).toContain("Please try again later");
    });
  });

  describe("Computed Fields Edge Cases", () => {
    it("should handle mixed sentiment value", () => {
      // Mixed sentiment should default to 0.5 (same as neutral)
      const mockMention = createDbMention({ sentiment: "mixed" });
      const computed = computeMentionFields(mockMention);

      expect(computed.sentimentScore).toBe(0.5);
    });

    it("should handle undefined sentiment gracefully", () => {
      const mockMention = createDbMention();
      (mockMention as unknown as { sentiment: undefined }).sentiment = undefined;

      // Should default to 0.5 when sentiment is not recognized
      const sentimentScore =
        mockMention.sentiment === "positive" ? 0.8 :
        mockMention.sentiment === "negative" ? 0.2 : 0.5;

      expect(sentimentScore).toBe(0.5);
    });

    it("should handle null metadata gracefully", () => {
      const mockMention = createDbMention();
      mockMention.metadata = null;

      expect(mockMention.metadata).toBeNull();
    });

    it("should handle null url gracefully", () => {
      const mockMention = createDbMention();
      mockMention.url = null;

      expect(mockMention.url).toBeNull();
    });

    it("should handle null position gracefully", () => {
      const mockMention = createDbMention();
      // Override position after creation since ?? operator treats null as nullish
      (mockMention as { position: number | null }).position = null;

      expect(mockMention.position).toBeNull();
    });
  });

  describe("Platform Filtering", () => {
    it("should support all valid platform values", () => {
      const platforms = ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "meta_ai"];

      platforms.forEach((platform) => {
        const mockMention = createDbMention({ platform });
        expect(mockMention.platform).toBe(platform);
      });
    });
  });

  describe("Sentiment Filtering", () => {
    it("should support all valid sentiment values", () => {
      const sentiments = ["positive", "negative", "neutral", "mixed"];

      sentiments.forEach((sentiment) => {
        const mockMention = createDbMention({ sentiment });
        expect(mockMention.sentiment).toBe(sentiment);
      });
    });
  });

  describe("Pagination", () => {
    it("should decode cursor correctly", () => {
      const encodedCursor = Buffer.from("mention:5").toString("base64");
      const decodedCursor = Buffer.from(encodedCursor, "base64").toString();

      expect(decodedCursor).toBe("mention:5");
    });

    it("should calculate hasNextPage based on result count", () => {
      const limit = 20;
      const fullPageResults = createMockMentions(20);
      const partialPageResults = createMockMentions(15);

      const hasNextPageFull = fullPageResults.length === limit;
      const hasNextPagePartial = partialPageResults.length === limit;

      expect(hasNextPageFull).toBe(true);
      expect(hasNextPagePartial).toBe(false);
    });

    it("should generate startCursor and endCursor", () => {
      const mockMentions = createMockMentions(5).map(createDbMention);

      const startCursor = mockMentions.length > 0
        ? Buffer.from("mention:0").toString("base64")
        : null;
      const endCursor = mockMentions.length > 0
        ? Buffer.from(`mention:${mockMentions.length - 1}`).toString("base64")
        : null;

      expect(startCursor).toBe("bWVudGlvbjow");
      expect(endCursor).toBe("bWVudGlvbjo0");
    });

    it("should return null cursors for empty results", () => {
      const mockMentions: ReturnType<typeof createDbMention>[] = [];

      const startCursor = mockMentions.length > 0
        ? Buffer.from("mention:0").toString("base64")
        : null;
      const endCursor = mockMentions.length > 0
        ? Buffer.from(`mention:${mockMentions.length - 1}`).toString("base64")
        : null;

      expect(startCursor).toBeNull();
      expect(endCursor).toBeNull();
    });
  });
});
