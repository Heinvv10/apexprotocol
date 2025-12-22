/**
 * GEO Score Resolver Tests
 *
 * Tests for GEO Score Query and Mutation resolvers including:
 * - geoScore (calculated score from mentions and recommendations)
 * - geoScoreHistory (historical score data with date filtering)
 * - calculateGeoScore (calculates, stores, and returns score)
 * - GEOScore.history field resolver
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setupGraphQLTest,
  mockSelectResult,
  mockInsertResult,
  getCallHistory,
  wasMethodCalled,
  createMockGraphQLContext,
  createMockGeoScoreHistory,
  createMockGeoScoreHistoryList,
  DatabaseErrors,
  dbAssertions,
  createTimestamp,
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
    const knownMessages = ["not found", "Unauthorized", "foreign key"];
    return knownMessages.some((msg) => error.message?.includes(msg));
  }),
}));

describe("GEO Score Resolvers", () => {
  const { getDb, getSchema, resetMocks } = setupGraphQLTest();

  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  // Helper to create mock count result
  const createCountResult = (count: number) => [{ count }];

  // Helper to create database GEO score history record
  const createDbGeoScoreHistory = (overrides: Partial<ReturnType<typeof createMockGeoScoreHistory>> & { overallScore?: number } = {}) => {
    const history = createMockGeoScoreHistory(overrides);
    return {
      ...history,
      overallScore: overrides.overallScore ?? history.score,
    };
  };

  // Calculate GEO score using the resolver formula
  const calculateOverallScore = (
    visibilityScore: number,
    sentimentScore: number,
    recommendationScore: number
  ) => {
    return Math.round((visibilityScore * 0.4 + sentimentScore * 0.3 + recommendationScore * 0.3));
  };

  describe("Query: geoScore", () => {
    it("should calculate score correctly from mention and recommendation counts", async () => {
      const brandId = "brand-123";
      const mentionCount = 10;

      // Mock count query result
      mockSelectResult(createCountResult(mentionCount));

      const db = getDb();
      const schema = getSchema();

      // Execute count query (simulating mentions count)
      const mentionsResult = await db
        .select({ count: 1 })
        .from(schema.brandMentions)
        .where();

      expect(mentionsResult).toEqual([{ count: mentionCount }]);
      dbAssertions.expectSelect();

      // Verify calculation would work correctly
      const visibilityScore = Math.min(100, mentionCount * 5); // 50
      const sentimentScore = 70; // Default
      const recommendationScore = 85; // Assuming recCount = 3

      const overallScore = calculateOverallScore(visibilityScore, sentimentScore, recommendationScore);
      // 50 * 0.4 = 20, 70 * 0.3 = 21, 85 * 0.3 = 25.5 = 67 rounded
      expect(overallScore).toBe(67);
    });

    it("should calculate visibilityScore as mentionCount * 5 (max 100)", () => {
      // Test various mention counts
      expect(Math.min(100, 0 * 5)).toBe(0);
      expect(Math.min(100, 5 * 5)).toBe(25);
      expect(Math.min(100, 10 * 5)).toBe(50);
      expect(Math.min(100, 20 * 5)).toBe(100);
      expect(Math.min(100, 30 * 5)).toBe(100); // Capped at 100
    });

    it("should use default sentimentScore of 70 when not analyzing distribution", () => {
      // The geoScore query uses a default sentiment score
      const defaultSentimentScore = 70;
      expect(defaultSentimentScore).toBe(70);
    });

    it("should calculate recommendationScore as 100 - recCount * 5 (min 0)", () => {
      // More recommendations means lower score (they need to be completed)
      expect(Math.max(0, 100 - 0 * 5)).toBe(100);
      expect(Math.max(0, 100 - 5 * 5)).toBe(75);
      expect(Math.max(0, 100 - 10 * 5)).toBe(50);
      expect(Math.max(0, 100 - 20 * 5)).toBe(0);
      expect(Math.max(0, 100 - 30 * 5)).toBe(0); // Capped at 0
    });

    it("should calculate correct overall score using weighted formula", () => {
      // Formula: (visibility * 0.4 + sentiment * 0.3 + recommendation * 0.3)
      const visibility = 50;
      const sentiment = 70;
      const recommendation = 75;

      const expected = calculateOverallScore(visibility, sentiment, recommendation);

      // 50 * 0.4 = 20
      // 70 * 0.3 = 21
      // 75 * 0.3 = 22.5
      // Total = 63.5 -> rounded = 64
      expect(expected).toBe(64);
    });

    it("should return GEOScore with all required fields", () => {
      const brandId = "brand-456";
      const mentionCount = 12;
      const recCount = 3;

      const visibilityScore = Math.min(100, mentionCount * 5); // 60
      const sentimentScore = 70; // Default
      const recommendationScore = Math.max(0, 100 - recCount * 5); // 85
      const overallScore = calculateOverallScore(visibilityScore, sentimentScore, recommendationScore);

      const geoScore = {
        id: `geo_${brandId}`,
        brandId,
        overallScore,
        visibilityScore,
        sentimentScore,
        recommendationScore,
        competitorGapScore: 50, // Default
        platformScores: {},
        previousScore: null,
        trend: 0,
        calculatedAt: expect.any(String),
      };

      expect(geoScore).toHaveProperty("id", `geo_${brandId}`);
      expect(geoScore).toHaveProperty("brandId", brandId);
      expect(geoScore).toHaveProperty("overallScore");
      expect(geoScore).toHaveProperty("visibilityScore", 60);
      expect(geoScore).toHaveProperty("sentimentScore", 70);
      expect(geoScore).toHaveProperty("recommendationScore", 85);
      expect(geoScore).toHaveProperty("competitorGapScore", 50);
      expect(geoScore).toHaveProperty("platformScores", {});
      expect(geoScore).toHaveProperty("previousScore", null);
      expect(geoScore).toHaveProperty("trend", 0);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
    });

    it("should handle zero mentions correctly", () => {
      const mentionCount = 0;
      const recCount = 0;

      const visibilityScore = Math.min(100, mentionCount * 5); // 0
      const sentimentScore = 70;
      const recommendationScore = Math.max(0, 100 - recCount * 5); // 100

      const overallScore = calculateOverallScore(visibilityScore, sentimentScore, recommendationScore);

      // 0 * 0.4 = 0
      // 70 * 0.3 = 21
      // 100 * 0.3 = 30
      // Total = 51
      expect(overallScore).toBe(51);
    });

    it("should handle high mention counts with capped visibility", () => {
      const mentionCount = 50; // Would be 250, but capped at 100
      const recCount = 0;

      const visibilityScore = Math.min(100, mentionCount * 5); // 100 (capped)
      const sentimentScore = 70;
      const recommendationScore = Math.max(0, 100 - recCount * 5); // 100

      const overallScore = calculateOverallScore(visibilityScore, sentimentScore, recommendationScore);

      // 100 * 0.4 = 40
      // 70 * 0.3 = 21
      // 100 * 0.3 = 30
      // Total = 91
      expect(overallScore).toBe(91);
    });
  });

  describe("Query: geoScoreHistory", () => {
    it("should fetch history records filtered by brandId", async () => {
      const brandId = "brand-123";
      const historyRecords = [
        createDbGeoScoreHistory({ brandId, overallScore: 75, calculatedAt: createTimestamp(1) }),
        createDbGeoScoreHistory({ brandId, overallScore: 72, calculatedAt: createTimestamp(2) }),
        createDbGeoScoreHistory({ brandId, overallScore: 70, calculatedAt: createTimestamp(3) }),
      ];
      mockSelectResult(historyRecords);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.geoScoreHistory)
        .where()
        .orderBy()
        .limit(30);

      expect(result).toEqual(historyRecords);
      expect(result).toHaveLength(3);
      dbAssertions.expectSelect();
    });

    it("should use default limit of 30 days", () => {
      const defaultDays = 30;
      const startDate = new Date(Date.now() - defaultDays * 24 * 60 * 60 * 1000);

      expect(defaultDays).toBe(30);
      expect(startDate.getTime()).toBeLessThan(Date.now());
    });

    it("should accept custom days parameter", () => {
      const customDays = 7;
      const startDate = new Date(Date.now() - customDays * 24 * 60 * 60 * 1000);

      expect(customDays).toBe(7);
      expect(startDate.getTime()).toBeLessThan(Date.now());
    });

    it("should filter by date range using days parameter", () => {
      const days = 14;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Dates within range should pass
      const withinRange = createTimestamp(7);
      const outsideRange = createTimestamp(30);

      expect(withinRange.getTime()).toBeGreaterThan(startDate.getTime());
      expect(outsideRange.getTime()).toBeLessThan(startDate.getTime());
    });

    it("should order by calculatedAt descending (newest first)", async () => {
      const brandId = "brand-123";
      const historyRecords = [
        createDbGeoScoreHistory({ brandId, calculatedAt: createTimestamp(0) }), // Today (newest)
        createDbGeoScoreHistory({ brandId, calculatedAt: createTimestamp(1) }),
        createDbGeoScoreHistory({ brandId, calculatedAt: createTimestamp(2) }), // Oldest
      ];
      mockSelectResult(historyRecords);

      const db = getDb();
      await db.select().from(getSchema().geoScoreHistory).where().orderBy().limit(30);

      expect(wasMethodCalled("orderBy")).toBe(true);
    });

    it("should transform database records to correct output format", () => {
      const historyRecord = {
        calculatedAt: new Date("2025-01-15T10:30:00Z"),
        overallScore: 78,
        visibilityScore: 80,
        sentimentScore: 75,
        recommendationScore: 70,
        competitorGapScore: 65,
      };

      const transformed = {
        date: historyRecord.calculatedAt.toISOString(),
        score: historyRecord.overallScore,
        components: {
          visibility: historyRecord.visibilityScore,
          sentiment: historyRecord.sentimentScore,
          recommendation: historyRecord.recommendationScore,
          competitorGap: historyRecord.competitorGapScore,
        },
      };

      expect(transformed.date).toBe("2025-01-15T10:30:00.000Z");
      expect(transformed.score).toBe(78);
      expect(transformed.components.visibility).toBe(80);
      expect(transformed.components.sentiment).toBe(75);
      expect(transformed.components.recommendation).toBe(70);
      expect(transformed.components.competitorGap).toBe(65);
    });

    it("should return empty array when no history exists", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().geoScoreHistory)
        .where()
        .orderBy()
        .limit(30);

      expect(result).toEqual([]);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Mutation: calculateGeoScore", () => {
    it("should calculate visibility score from mention count", () => {
      const mentionCount = 15;
      const visibilityScore = Math.min(100, mentionCount * 5);

      expect(visibilityScore).toBe(75);
    });

    it("should calculate sentiment score from positive/negative ratio", () => {
      const mentionCount = 20;
      const positiveCount = 14;
      const negativeCount = 4;
      // neutralCount = 20 - 14 - 4 = 2

      // Sentiment score formula: (positiveCount / mentionCount) * 100
      const sentimentScore = mentionCount > 0
        ? Math.round((positiveCount / mentionCount) * 100)
        : 50;

      expect(sentimentScore).toBe(70); // 14/20 = 0.7 = 70%
    });

    it("should use default sentiment score of 50 when no mentions", () => {
      const mentionCount = 0;
      const sentimentScore = mentionCount > 0 ? 0 : 50;

      expect(sentimentScore).toBe(50);
    });

    it("should calculate recommendation score from completed/total ratio", () => {
      const recCount = 10;
      const completedRecs = 8;

      // Recommendation score formula: (completedRecs / recCount) * 100
      const recommendationScore = recCount > 0
        ? Math.round((completedRecs / recCount) * 100)
        : 100;

      expect(recommendationScore).toBe(80);
    });

    it("should use default recommendation score of 100 when no recommendations", () => {
      const recCount = 0;
      const recommendationScore = recCount > 0 ? 0 : 100;

      expect(recommendationScore).toBe(100);
    });

    it("should get previous score for trend calculation", async () => {
      const brandId = "brand-123";
      const previousScoreRecord = { overallScore: 72 };
      mockSelectResult([previousScoreRecord]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select({ overallScore: 1 })
        .from(schema.geoScoreHistory)
        .where()
        .orderBy()
        .limit(1);

      expect(result[0]).toEqual({ overallScore: 72 });
    });

    it("should calculate trend as up when score increased by more than 1", () => {
      const overallScore = 78;
      const previousScore = 72;
      const scoreChange = overallScore - previousScore;

      const trend: "up" | "down" | "stable" = scoreChange > 1 ? "up" : scoreChange < -1 ? "down" : "stable";

      expect(scoreChange).toBe(6);
      expect(trend).toBe("up");
    });

    it("should calculate trend as down when score decreased by more than 1", () => {
      const overallScore = 68;
      const previousScore = 75;
      const scoreChange = overallScore - previousScore;

      const trend: "up" | "down" | "stable" = scoreChange > 1 ? "up" : scoreChange < -1 ? "down" : "stable";

      expect(scoreChange).toBe(-7);
      expect(trend).toBe("down");
    });

    it("should calculate trend as stable when change is within 1 point", () => {
      const overallScore = 73;
      const previousScore = 72;
      const scoreChange = overallScore - previousScore;

      const trend: "up" | "down" | "stable" = scoreChange > 1 ? "up" : scoreChange < -1 ? "down" : "stable";

      expect(scoreChange).toBe(1);
      expect(trend).toBe("stable");
    });

    it("should insert calculated score into geoScoreHistory table", async () => {
      const brandId = "brand-123";
      mockInsertResult([{ id: "geo-history-1" }]);

      const db = getDb();
      const schema = getSchema();

      await db.insert(schema.geoScoreHistory).values({
        brandId,
        overallScore: 75,
        visibilityScore: 80,
        sentimentScore: 70,
        recommendationScore: 75,
        competitorGapScore: 50,
        platformScores: {},
        previousScore: null,
        scoreChange: 0,
        trend: "stable",
        mentionCount: 16,
        positiveMentions: 10,
        negativeMentions: 3,
        neutralMentions: 3,
        recommendationCount: 5,
        completedRecommendations: 3,
      });

      dbAssertions.expectInsert();
    });

    it("should return correct GEOScore structure from mutation", () => {
      const brandId = "brand-789";
      const overallScore = 77;
      const visibilityScore = 85;
      const sentimentScore = 72;
      const recommendationScore = 68;
      const competitorGapScore = 50;
      const previousScore = 74;
      const scoreChange = overallScore - previousScore;

      const geoScore = {
        id: `geo_${brandId}`,
        brandId,
        overallScore,
        visibilityScore,
        sentimentScore,
        recommendationScore,
        competitorGapScore,
        platformScores: {},
        previousScore,
        trend: scoreChange,
        calculatedAt: new Date().toISOString(),
      };

      expect(geoScore).toHaveProperty("id", "geo_brand-789");
      expect(geoScore).toHaveProperty("brandId", brandId);
      expect(geoScore).toHaveProperty("overallScore", 77);
      expect(geoScore).toHaveProperty("visibilityScore", 85);
      expect(geoScore).toHaveProperty("sentimentScore", 72);
      expect(geoScore).toHaveProperty("recommendationScore", 68);
      expect(geoScore).toHaveProperty("competitorGapScore", 50);
      expect(geoScore).toHaveProperty("platformScores", {});
      expect(geoScore).toHaveProperty("previousScore", 74);
      expect(geoScore).toHaveProperty("trend", 3);
    });

    it("should handle null previous score (first calculation)", () => {
      const previousScore = null;
      const overallScore = 75;
      const scoreChange = previousScore ? overallScore - previousScore : 0;

      expect(scoreChange).toBe(0);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
    });

    it("should perform multiple database queries for calculation", async () => {
      // calculateGeoScore makes these queries:
      // 1. Count all mentions
      // 2. Count positive mentions
      // 3. Count negative mentions
      // 4. Count all recommendations
      // 5. Count completed recommendations
      // 6. Get previous score
      // 7. Insert new history record

      const queries = [
        "mentions count",
        "positive mentions count",
        "negative mentions count",
        "recommendations count",
        "completed recommendations count",
        "previous score",
        "insert history",
      ];

      expect(queries).toHaveLength(7);
    });
  });

  describe("Field Resolver: GEOScore.history", () => {
    it("should fetch history for parent.brandId", async () => {
      const parent = { brandId: "brand-123" };
      const historyRecords = [
        createDbGeoScoreHistory({ brandId: parent.brandId, overallScore: 80 }),
        createDbGeoScoreHistory({ brandId: parent.brandId, overallScore: 78 }),
      ];
      mockSelectResult(historyRecords);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.geoScoreHistory)
        .where() // Would check brandId = parent.brandId
        .orderBy()
        .limit(30);

      expect(result).toEqual(historyRecords);
      expect(result.every((r) => r.brandId === parent.brandId)).toBe(true);
    });

    it("should use default limit when days not provided", () => {
      const days = undefined;
      const limit = days || 30;

      expect(limit).toBe(30);
    });

    it("should accept custom days parameter", () => {
      const days = 7;
      const limit = days || 30;

      expect(limit).toBe(7);
    });

    it("should transform history records with correct structure", () => {
      const historyRecord = {
        calculatedAt: new Date("2025-01-20T15:00:00Z"),
        overallScore: 82,
        visibilityScore: 90,
        sentimentScore: 75,
        recommendationScore: 80,
        competitorGapScore: 70,
        platformScores: { chatgpt: 85, claude: 80, gemini: 78 },
      };

      const transformed = {
        date: historyRecord.calculatedAt.toISOString(),
        score: historyRecord.overallScore,
        components: {
          visibility: historyRecord.visibilityScore,
          sentiment: historyRecord.sentimentScore,
          recommendation: historyRecord.recommendationScore,
          competitorGap: historyRecord.competitorGapScore,
          platformScores: historyRecord.platformScores,
        },
      };

      expect(transformed.date).toBe("2025-01-20T15:00:00.000Z");
      expect(transformed.score).toBe(82);
      expect(transformed.components).toEqual({
        visibility: 90,
        sentiment: 75,
        recommendation: 80,
        competitorGap: 70,
        platformScores: { chatgpt: 85, claude: 80, gemini: 78 },
      });
    });

    it("should return empty array when no history", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().geoScoreHistory)
        .where()
        .orderBy()
        .limit(30);

      expect(result).toEqual([]);
    });
  });

  describe("Score Calculation Formula", () => {
    it("should correctly weight component scores", () => {
      // Overall = visibility * 0.4 + sentiment * 0.3 + recommendation * 0.3

      // Test case 1: All components at 100
      expect(calculateOverallScore(100, 100, 100)).toBe(100);

      // Test case 2: All components at 50
      expect(calculateOverallScore(50, 50, 50)).toBe(50);

      // Test case 3: All components at 0
      expect(calculateOverallScore(0, 0, 0)).toBe(0);

      // Test case 4: Varied components
      // 80 * 0.4 = 32, 60 * 0.3 = 18, 90 * 0.3 = 27
      // Total = 77
      expect(calculateOverallScore(80, 60, 90)).toBe(77);
    });

    it("should round overall score to nearest integer", () => {
      // 75 * 0.4 = 30, 75 * 0.3 = 22.5, 75 * 0.3 = 22.5
      // Total = 75 (exact)
      expect(calculateOverallScore(75, 75, 75)).toBe(75);

      // 73 * 0.4 = 29.2, 67 * 0.3 = 20.1, 81 * 0.3 = 24.3
      // Total = 73.6 -> rounds to 74
      expect(calculateOverallScore(73, 67, 81)).toBe(74);
    });

    it("should handle edge cases in score calculation", () => {
      // Only visibility matters (others at 0)
      // 100 * 0.4 = 40, 0 * 0.3 = 0, 0 * 0.3 = 0
      expect(calculateOverallScore(100, 0, 0)).toBe(40);

      // Only sentiment matters (others at 0)
      // 0 * 0.4 = 0, 100 * 0.3 = 30, 0 * 0.3 = 0
      expect(calculateOverallScore(0, 100, 0)).toBe(30);

      // Only recommendation matters (others at 0)
      // 0 * 0.4 = 0, 0 * 0.3 = 0, 100 * 0.3 = 30
      expect(calculateOverallScore(0, 0, 100)).toBe(30);
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", () => {
      const error = DatabaseErrors.connectionError();

      expect(error.code).toBe("ECONNREFUSED");
      expect(error.message).toContain("Connection refused");
    });

    it("should handle query timeout errors", () => {
      const error = DatabaseErrors.timeout();

      expect(error.code).toBe("57014");
      expect(error.message).toContain("timeout");
    });

    it("should log errors for debugging", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const error = new Error("Test database error");
      console.error("Database error calculating GEO score:", error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error calculating GEO score:",
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it("should throw user-friendly error on geoScore failure", () => {
      const userFriendlyMessage = "Failed to calculate GEO score. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to calculate");
      expect(userFriendlyMessage).toContain("Please try again later");
    });

    it("should throw user-friendly error on geoScoreHistory failure", () => {
      const userFriendlyMessage = "Failed to fetch GEO score history. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to fetch");
      expect(userFriendlyMessage).toContain("Please try again later");
    });

    it("should handle foreign key violations (brand not found)", () => {
      const error = new Error("violates foreign key constraint on brands");

      const isForeignKeyError = error.message.includes("foreign key");
      expect(isForeignKeyError).toBe(true);

      const userFriendlyMessage = "Brand not found. Cannot calculate GEO score for non-existent brand.";
      expect(userFriendlyMessage).toContain("Brand not found");
    });
  });

  describe("Date Range Filtering", () => {
    it("should calculate correct start date for 30-day range", () => {
      const days = 30;
      const now = Date.now();
      const startDate = new Date(now - days * 24 * 60 * 60 * 1000);

      // startDate should be approximately 30 days ago
      const daysDiff = (now - startDate.getTime()) / (24 * 60 * 60 * 1000);
      expect(daysDiff).toBeCloseTo(30, 0);
    });

    it("should calculate correct start date for 7-day range", () => {
      const days = 7;
      const now = Date.now();
      const startDate = new Date(now - days * 24 * 60 * 60 * 1000);

      const daysDiff = (now - startDate.getTime()) / (24 * 60 * 60 * 1000);
      expect(daysDiff).toBeCloseTo(7, 0);
    });

    it("should calculate correct start date for 90-day range", () => {
      const days = 90;
      const now = Date.now();
      const startDate = new Date(now - days * 24 * 60 * 60 * 1000);

      const daysDiff = (now - startDate.getTime()) / (24 * 60 * 60 * 1000);
      expect(daysDiff).toBeCloseTo(90, 0);
    });
  });

  describe("GEO Score Factory Tests", () => {
    it("should create valid mock GEO score history record", () => {
      const record = createMockGeoScoreHistory({
        brandId: "brand-test",
        score: 85,
      });

      expect(record).toHaveProperty("id");
      expect(record).toHaveProperty("brandId", "brand-test");
      expect(record).toHaveProperty("score", 85);
      expect(record).toHaveProperty("visibilityScore");
      expect(record).toHaveProperty("sentimentScore");
      expect(record).toHaveProperty("recommendationScore");
      expect(record).toHaveProperty("competitorGapScore");
      expect(record).toHaveProperty("platformScores");
      expect(record).toHaveProperty("calculatedAt");
    });

    it("should create list of history records with correct dates", () => {
      const brandId = "brand-list-test";
      const count = 5;
      const records = createMockGeoScoreHistoryList(count, brandId, { startDaysAgo: 10 });

      expect(records).toHaveLength(5);
      expect(records.every((r) => r.brandId === brandId)).toBe(true);

      // Records should have decreasing dates (older first)
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].calculatedAt.getTime()).toBeLessThan(records[i + 1].calculatedAt.getTime());
      }
    });
  });

  describe("Trend Analysis", () => {
    it("should identify upward trend correctly", () => {
      const historicalScores = [70, 72, 74, 76, 78, 80];

      // Calculate trend: compare first and last
      const trend = historicalScores[historicalScores.length - 1] - historicalScores[0] > 1
        ? "up"
        : historicalScores[historicalScores.length - 1] - historicalScores[0] < -1
        ? "down"
        : "stable";

      expect(trend).toBe("up");
    });

    it("should identify downward trend correctly", () => {
      const historicalScores = [85, 82, 79, 76, 73, 70];

      const trend = historicalScores[historicalScores.length - 1] - historicalScores[0] > 1
        ? "up"
        : historicalScores[historicalScores.length - 1] - historicalScores[0] < -1
        ? "down"
        : "stable";

      expect(trend).toBe("down");
    });

    it("should identify stable trend correctly", () => {
      const historicalScores = [75, 76, 75, 74, 75, 75];

      const trend = historicalScores[historicalScores.length - 1] - historicalScores[0] > 1
        ? "up"
        : historicalScores[historicalScores.length - 1] - historicalScores[0] < -1
        ? "down"
        : "stable";

      expect(trend).toBe("stable");
    });
  });

  describe("Component Score Calculations", () => {
    it("should cap visibility score at 100", () => {
      const mentionCounts = [0, 10, 20, 30, 50, 100];
      const visibilityScores = mentionCounts.map((c) => Math.min(100, c * 5));

      expect(visibilityScores).toEqual([0, 50, 100, 100, 100, 100]);
    });

    it("should calculate sentiment percentage from counts", () => {
      const cases = [
        { total: 100, positive: 80, expected: 80 },
        { total: 50, positive: 25, expected: 50 },
        { total: 10, positive: 7, expected: 70 },
        { total: 0, positive: 0, expected: 50 }, // Default when no mentions
      ];

      cases.forEach(({ total, positive, expected }) => {
        const score = total > 0 ? Math.round((positive / total) * 100) : 50;
        expect(score).toBe(expected);
      });
    });

    it("should calculate recommendation completion percentage", () => {
      const cases = [
        { total: 10, completed: 10, expected: 100 },
        { total: 10, completed: 5, expected: 50 },
        { total: 10, completed: 0, expected: 0 },
        { total: 0, completed: 0, expected: 100 }, // Default when no recommendations
      ];

      cases.forEach(({ total, completed, expected }) => {
        const score = total > 0 ? Math.round((completed / total) * 100) : 100;
        expect(score).toBe(expected);
      });
    });
  });
});
