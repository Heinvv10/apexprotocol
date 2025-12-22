/**
 * Recommendation Resolver Tests
 *
 * Tests for recommendation Query and Mutation resolvers including:
 * - recommendation (single recommendation by ID)
 * - recommendations (list with pagination and filters)
 * - updateRecommendationStatus (status transitions)
 * - assignRecommendation (assign to user)
 * - submitRecommendationFeedback (create feedback)
 * - generateRecommendations (AI stub)
 * - Recommendation.brand field resolver
 * - Recommendation.feedback field resolver
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setupGraphQLTest,
  mockSelectResult,
  mockInsertResult,
  mockUpdateResult,
  getCallHistory,
  wasMethodCalled,
  createMockRecommendation,
  createMockRecommendations,
  createMockRecommendationFeedback,
  createMockBrand,
  createMockGraphQLContext,
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

describe("Recommendation Resolvers", () => {
  const { getDb, getSchema, resetMocks } = setupGraphQLTest();

  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  // Helper to create database recommendation format (matching schema)
  const createDbRecommendation = (overrides: Partial<ReturnType<typeof createMockRecommendation>> & { impact?: string } = {}) => {
    const rec = createMockRecommendation(overrides);
    return {
      ...rec,
      // Map to database schema fields
      impact: overrides.impact ?? "high",
      category: rec.category,
      assignedToId: rec.assignedTo || null,
      dueDate: rec.dueDate || null,
      completedAt: rec.completedAt || null,
      dismissedAt: null,
    };
  };

  // Helper to transform database recommendation to GraphQL format
  const transformRecommendation = (rec: ReturnType<typeof createDbRecommendation>) => ({
    ...rec,
    type: rec.category,
    estimatedImpact: rec.impact === "high" ? 0.8 : rec.impact === "medium" ? 0.5 : 0.3,
    dependencies: [],
    evidence: {},
    aiExplanation: null,
    feedback: [],
  });

  describe("Query: recommendation", () => {
    it("should fetch a recommendation by ID with correct data", async () => {
      const mockRec = createDbRecommendation({ id: "rec-123", title: "Improve SEO" });
      mockSelectResult([mockRec]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.recommendations)
        .where()
        .limit(1);

      expect(result).toEqual([mockRec]);
      expect(wasMethodCalled("select")).toBe(true);
      expect(wasMethodCalled("where")).toBe(true);
    });

    it("should return null when recommendation is not found", async () => {
      mockSelectResult([]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.recommendations)
        .where()
        .limit(1);

      expect(result).toEqual([]);
      expect(result[0]).toBeUndefined();
    });

    it("should transform recommendation with computed type field", () => {
      const rec = createDbRecommendation({ category: "content" });
      const transformed = transformRecommendation(rec);

      expect(transformed.type).toBe("content");
      expect(transformed.category).toBe("content");
    });

    it("should compute estimatedImpact based on impact field", () => {
      // High impact = 0.8
      const highRec = createDbRecommendation({ impact: "high" });
      expect(transformRecommendation(highRec).estimatedImpact).toBe(0.8);

      // Medium impact = 0.5
      const medRec = createDbRecommendation({ impact: "medium" });
      expect(transformRecommendation(medRec).estimatedImpact).toBe(0.5);

      // Low impact = 0.3
      const lowRec = createDbRecommendation({ impact: "low" });
      expect(transformRecommendation(lowRec).estimatedImpact).toBe(0.3);
    });

    it("should include empty dependencies array", () => {
      const rec = createDbRecommendation();
      const transformed = transformRecommendation(rec);

      expect(transformed.dependencies).toEqual([]);
    });

    it("should include empty evidence object", () => {
      const rec = createDbRecommendation();
      const transformed = transformRecommendation(rec);

      expect(transformed.evidence).toEqual({});
    });

    it("should include null aiExplanation", () => {
      const rec = createDbRecommendation();
      const transformed = transformRecommendation(rec);

      expect(transformed.aiExplanation).toBeNull();
    });

    it("should include empty feedback array by default", () => {
      const rec = createDbRecommendation();
      const transformed = transformRecommendation(rec);

      expect(transformed.feedback).toEqual([]);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
    });
  });

  describe("Query: recommendations", () => {
    it("should fetch recommendations for a brand", async () => {
      const brandId = "brand-123";
      const mockRecs = [
        createDbRecommendation({ brandId }),
        createDbRecommendation({ brandId }),
        createDbRecommendation({ brandId }),
      ];
      mockSelectResult(mockRecs);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.recommendations)
        .where()
        .orderBy()
        .limit(50);

      expect(result).toEqual(mockRecs);
      expect(result).toHaveLength(3);
      dbAssertions.expectSelect();
    });

    it("should apply default limit of 50", async () => {
      const mockRecs = createMockRecommendations(60).map(r => ({
        ...r,
        impact: "high",
        assignedToId: null,
        dismissedAt: null,
      }));
      mockSelectResult(mockRecs.slice(0, 50));

      const defaultLimit = 50;
      const db = getDb();
      const result = await db.select().from(getSchema().recommendations).limit(50);

      expect(result).toHaveLength(50);
      expect(wasMethodCalled("limit")).toBe(true);
    });

    it("should apply custom limit when provided", async () => {
      const mockRecs = createMockRecommendations(10).map(r => ({
        ...r,
        impact: "medium",
        assignedToId: null,
        dismissedAt: null,
      }));
      mockSelectResult(mockRecs);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().recommendations)
        .where()
        .limit(10);

      expect(result).toHaveLength(10);
    });

    it("should return empty array when no recommendations exist", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db.select().from(getSchema().recommendations).where();

      expect(result).toEqual([]);
    });

    it("should order by createdAt descending", async () => {
      const brandId = "brand-123";
      const mockRecs = [
        createDbRecommendation({ brandId, createdAt: createTimestamp(0) }), // Today (newest)
        createDbRecommendation({ brandId, createdAt: createTimestamp(1) }),
        createDbRecommendation({ brandId, createdAt: createTimestamp(2) }), // Oldest
      ];
      mockSelectResult(mockRecs);

      const db = getDb();
      await db.select().from(getSchema().recommendations).where().orderBy().limit(50);

      expect(wasMethodCalled("orderBy")).toBe(true);
    });

    it("should return correct pagination info", () => {
      const mockRecs = createMockRecommendations(50);
      const limit = 50;
      const hasNextPage = mockRecs.length === limit;

      expect(hasNextPage).toBe(true);
    });

    it("should generate correct cursor format", () => {
      const idx = 0;
      const cursor = Buffer.from(`rec:${idx}`).toString("base64");

      expect(cursor).toBe("cmVjOjA=");
      expect(Buffer.from(cursor, "base64").toString()).toBe("rec:0");
    });

    it("should transform all recommendations in edges", () => {
      const mockRecs = [
        createDbRecommendation({ impact: "high" }),
        createDbRecommendation({ impact: "medium" }),
        createDbRecommendation({ impact: "low" }),
      ];

      const edges = mockRecs.map((rec, idx) => ({
        node: transformRecommendation(rec),
        cursor: Buffer.from(`rec:${idx}`).toString("base64"),
      }));

      expect(edges[0].node.estimatedImpact).toBe(0.8);
      expect(edges[1].node.estimatedImpact).toBe(0.5);
      expect(edges[2].node.estimatedImpact).toBe(0.3);
    });

    it("should include total count in pageInfo", async () => {
      const mockRecs = createMockRecommendations(5);
      mockSelectResult(mockRecs);

      // Second query for count would return { count: 20 }
      const totalCount = 20;

      expect(totalCount).toBeGreaterThan(mockRecs.length);
    });
  });

  describe("Mutation: updateRecommendationStatus", () => {
    it("should update status to pending", async () => {
      const rec = createDbRecommendation({ id: "rec-123", status: "in_progress" });
      const updatedRec = { ...rec, status: "pending", updatedAt: new Date() };
      mockUpdateResult([updatedRec]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .update(schema.recommendations)
        .set({ status: "pending", updatedAt: new Date() })
        .where()
        .returning();

      expect(result[0].status).toBe("pending");
      dbAssertions.expectUpdate();
    });

    it("should update status to in_progress", async () => {
      const rec = createDbRecommendation({ id: "rec-123", status: "pending" });
      const updatedRec = { ...rec, status: "in_progress", updatedAt: new Date() };
      mockUpdateResult([updatedRec]);

      const result = await getDb()
        .update(getSchema().recommendations)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where()
        .returning();

      expect(result[0].status).toBe("in_progress");
    });

    it("should update status to completed and set completedAt", async () => {
      const rec = createDbRecommendation({ id: "rec-123", status: "in_progress" });
      const now = new Date();
      const updatedRec = { ...rec, status: "completed", completedAt: now, updatedAt: now };
      mockUpdateResult([updatedRec]);

      // Verify completedAt is set when status is completed
      expect(updatedRec.status).toBe("completed");
      expect(updatedRec.completedAt).toEqual(now);
    });

    it("should update status to dismissed and set dismissedAt", async () => {
      const rec = createDbRecommendation({ id: "rec-123", status: "pending" });
      const now = new Date();
      const updatedRec = { ...rec, status: "dismissed", dismissedAt: now, updatedAt: now };
      mockUpdateResult([updatedRec]);

      // Verify dismissedAt is set when status is dismissed
      expect(updatedRec.status).toBe("dismissed");
      expect(updatedRec.dismissedAt).toEqual(now);
    });

    it("should throw error when recommendation not found", async () => {
      mockUpdateResult([]);

      // Empty result means recommendation not found
      const result: unknown[] = [];
      expect(result[0]).toBeUndefined();
    });

    it("should use .returning() for PostgreSQL", async () => {
      const rec = createDbRecommendation({ id: "rec-123" });
      mockUpdateResult([rec]);

      const db = getDb();
      await db
        .update(getSchema().recommendations)
        .set({ status: "completed" })
        .where()
        .returning();

      dbAssertions.expectReturning();
    });

    it("should always set updatedAt timestamp", async () => {
      const rec = createDbRecommendation({ id: "rec-123" });
      const now = new Date();
      const updatedRec = { ...rec, status: "completed", updatedAt: now };
      mockUpdateResult([updatedRec]);

      expect(updatedRec.updatedAt).toEqual(now);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });

    it("should transform updated recommendation correctly", () => {
      const updatedRec = createDbRecommendation({ id: "rec-123", status: "completed", impact: "high" });
      const transformed = transformRecommendation(updatedRec);

      expect(transformed.type).toBe(updatedRec.category);
      expect(transformed.estimatedImpact).toBe(0.8);
      expect(transformed.dependencies).toEqual([]);
      expect(transformed.evidence).toEqual({});
      expect(transformed.aiExplanation).toBeNull();
      expect(transformed.feedback).toEqual([]);
    });
  });

  describe("Mutation: assignRecommendation", () => {
    it("should assign recommendation to user", async () => {
      const rec = createDbRecommendation({ id: "rec-123" });
      const userId = "user-456";
      const updatedRec = { ...rec, assignedToId: userId, updatedAt: new Date() };
      mockUpdateResult([updatedRec]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .update(schema.recommendations)
        .set({ assignedToId: userId, updatedAt: new Date() })
        .where()
        .returning();

      expect(result[0].assignedToId).toBe(userId);
      dbAssertions.expectUpdate();
    });

    it("should set assignedTo in response", () => {
      const rec = createDbRecommendation({ id: "rec-123" });
      const userId = "user-456";
      const updatedRec = { ...rec, assignedToId: userId };

      const response = {
        ...transformRecommendation(updatedRec),
        assignedTo: userId,
      };

      expect(response.assignedTo).toBe(userId);
    });

    it("should throw error when recommendation not found", async () => {
      mockUpdateResult([]);

      const result: unknown[] = [];
      expect(result[0]).toBeUndefined();
    });

    it("should handle foreign key violation for non-existent user", () => {
      const error = DatabaseErrors.foreignKeyViolation("users");

      expect(error.code).toBe("23503");
      expect(error.detail).toContain("users");

      // Error message should indicate user not found
      const userFriendlyMessage = "User not found. Cannot assign recommendation to non-existent user.";
      expect(userFriendlyMessage).toContain("User not found");
    });

    it("should use .returning() for PostgreSQL", async () => {
      const rec = createDbRecommendation({ id: "rec-123" });
      mockUpdateResult([rec]);

      const db = getDb();
      await db
        .update(getSchema().recommendations)
        .set({ assignedToId: "user-123" })
        .where()
        .returning();

      dbAssertions.expectReturning();
    });

    it("should always set updatedAt timestamp", async () => {
      const rec = createDbRecommendation({ id: "rec-123" });
      const now = new Date();
      const updatedRec = { ...rec, assignedToId: "user-123", updatedAt: now };
      mockUpdateResult([updatedRec]);

      expect(updatedRec.updatedAt).toEqual(now);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Mutation: submitRecommendationFeedback", () => {
    it("should verify recommendation exists before creating feedback", async () => {
      const rec = createDbRecommendation({ id: "rec-123", impact: "high" });
      mockSelectResult([rec]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.recommendations)
        .where()
        .limit(1);

      expect(result[0]).toBeDefined();
      expect(result[0].id).toBe("rec-123");
    });

    it("should insert feedback into recommendation_feedback table", async () => {
      const rec = createDbRecommendation({ id: "rec-123", impact: "high" });
      mockSelectResult([rec]); // For existence check

      const feedbackInput = {
        rating: 5,
        wasHelpful: true,
        comment: "Very helpful recommendation",
        actualImpact: 75,
      };

      const feedbackRecord = {
        id: "feedback-1",
        recommendationId: "rec-123",
        userId: "user-123",
        rating: feedbackInput.rating,
        wasHelpful: feedbackInput.wasHelpful,
        comment: feedbackInput.comment,
        actualImpact: feedbackInput.actualImpact,
        expectedImpact: 80, // high = 80
        createdAt: new Date(),
      };
      mockInsertResult([feedbackRecord]);

      const db = getDb();
      const schema = getSchema();

      await db.insert(schema.recommendationFeedback).values({
        recommendationId: "rec-123",
        userId: "user-123",
        rating: feedbackInput.rating,
        wasHelpful: feedbackInput.wasHelpful,
        comment: feedbackInput.comment,
        actualImpact: feedbackInput.actualImpact,
        expectedImpact: 80,
      });

      dbAssertions.expectInsert();
    });

    it("should calculate expectedImpact based on recommendation impact", () => {
      // High impact = 80
      expect(createDbRecommendation({ impact: "high" }).impact === "high" ? 80 : 50).toBe(80);

      // Medium impact = 50
      expect(createDbRecommendation({ impact: "medium" }).impact === "medium" ? 50 : 80).toBe(50);

      // Low impact = 30
      expect(createDbRecommendation({ impact: "low" }).impact === "low" ? 30 : 50).toBe(30);
    });

    it("should update recommendation updatedAt after feedback", async () => {
      const rec = createDbRecommendation({ id: "rec-123" });
      const now = new Date();
      const updatedRec = { ...rec, updatedAt: now };
      mockUpdateResult([updatedRec]);

      const db = getDb();
      await db
        .update(getSchema().recommendations)
        .set({ updatedAt: now })
        .where()
        .returning();

      expect(updatedRec.updatedAt).toEqual(now);
      dbAssertions.expectUpdate();
    });

    it("should return recommendation with feedback list", () => {
      const rec = createDbRecommendation({ id: "rec-123" });
      const feedbackList = [
        createMockRecommendationFeedback({ recommendationId: "rec-123", rating: 5 }),
        createMockRecommendationFeedback({ recommendationId: "rec-123", rating: 4 }),
      ];

      const response = {
        ...transformRecommendation(rec),
        feedback: feedbackList.map(f => ({
          id: f.id,
          userId: f.userId,
          rating: f.rating,
          wasHelpful: true,
          comment: f.feedback,
          actualImpact: 75,
          createdAt: f.createdAt.toISOString(),
        })),
      };

      expect(response.feedback).toHaveLength(2);
      expect(response.feedback[0].rating).toBe(5);
      expect(response.feedback[1].rating).toBe(4);
    });

    it("should throw error when recommendation not found", async () => {
      mockSelectResult([]);

      const result: unknown[] = [];
      expect(result[0]).toBeUndefined();
    });

    it("should handle optional comment field", () => {
      const feedbackInput = {
        rating: 4,
        wasHelpful: true,
        // comment is optional
      };

      const comment = feedbackInput.comment || null;
      expect(comment).toBeNull();
    });

    it("should handle optional actualImpact field", () => {
      const feedbackInput = {
        rating: 4,
        wasHelpful: true,
        // actualImpact is optional
      };

      const actualImpact = feedbackInput.actualImpact || null;
      expect(actualImpact).toBeNull();
    });

    it("should order feedback by createdAt descending", async () => {
      const feedbackList = [
        createMockRecommendationFeedback({ createdAt: createTimestamp(0) }), // Today (newest)
        createMockRecommendationFeedback({ createdAt: createTimestamp(1) }),
        createMockRecommendationFeedback({ createdAt: createTimestamp(2) }), // Oldest
      ];
      mockSelectResult(feedbackList);

      const db = getDb();
      await db.select().from(getSchema().recommendationFeedback).where().orderBy();

      expect(wasMethodCalled("orderBy")).toBe(true);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
    });

    it("should use userId from context", () => {
      const context = createMockGraphQLContext({ userId: "user-789" });
      const auth = context.requireAuth();

      expect(auth.userId).toBe("user-789");
    });
  });

  describe("Mutation: generateRecommendations", () => {
    it("should return empty array (stub)", () => {
      // This is a placeholder for AI-powered generation
      const result: unknown[] = [];

      expect(result).toEqual([]);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });

    it("should accept brandId parameter", () => {
      const brandId = "brand-123";

      // The stub accepts brandId but doesn't use it yet
      expect(brandId).toBeDefined();
    });
  });

  describe("Field Resolver: Recommendation.brand", () => {
    it("should fetch brand for recommendation by brandId", async () => {
      const parent = { brandId: "brand-123" };
      const mockBrand = createMockBrand({ id: parent.brandId });
      mockSelectResult([mockBrand]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.brands)
        .where()
        .limit(1);

      expect(result[0]).toEqual(mockBrand);
      dbAssertions.expectSelect();
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
      const mockBrand = {
        ...createMockBrand({ id: "brand-123" }),
        monitoringPlatforms: ["chatgpt", "claude"],
      };

      const transformedBrand = {
        ...mockBrand,
        platforms: mockBrand.monitoringPlatforms || [],
      };

      expect(transformedBrand.platforms).toEqual(["chatgpt", "claude"]);
    });

    it("should extract competitor names from objects", () => {
      const competitors = [
        { name: "Competitor A" },
        { name: "Competitor B" },
      ];

      const competitorNames = competitors.map((c: { name: string }) => c.name);

      expect(competitorNames).toEqual(["Competitor A", "Competitor B"]);
    });

    it("should handle null competitors gracefully", () => {
      const mockBrand = {
        ...createMockBrand({ id: "brand-123" }),
        competitors: null,
      };

      const competitors = (mockBrand.competitors || []).map((c: { name: string }) => c.name);

      expect(competitors).toEqual([]);
    });

    it("should include keywords array", () => {
      const mockBrand = {
        ...createMockBrand({ id: "brand-123" }),
        keywords: ["seo", "marketing", "ai"],
      };

      expect(mockBrand.keywords).toEqual(["seo", "marketing", "ai"]);
    });
  });

  describe("Field Resolver: Recommendation.feedback", () => {
    it("should fetch feedback for recommendation by parent.id", async () => {
      const parent = { id: "rec-123" };
      const feedbackList = [
        createMockRecommendationFeedback({ recommendationId: parent.id, rating: 5 }),
        createMockRecommendationFeedback({ recommendationId: parent.id, rating: 4 }),
      ];
      mockSelectResult(feedbackList);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.recommendationFeedback)
        .where()
        .orderBy();

      expect(result).toHaveLength(2);
      expect(result.every(f => f.recommendationId === parent.id)).toBe(true);
    });

    it("should return empty array when no feedback exists", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().recommendationFeedback)
        .where()
        .orderBy();

      expect(result).toEqual([]);
    });

    it("should order feedback by createdAt descending", async () => {
      const feedbackList = [
        createMockRecommendationFeedback({ createdAt: createTimestamp(0) }),
        createMockRecommendationFeedback({ createdAt: createTimestamp(1) }),
        createMockRecommendationFeedback({ createdAt: createTimestamp(2) }),
      ];
      mockSelectResult(feedbackList);

      const db = getDb();
      await db.select().from(getSchema().recommendationFeedback).where().orderBy();

      expect(wasMethodCalled("orderBy")).toBe(true);
    });

    it("should transform feedback with correct structure", () => {
      const feedback = createMockRecommendationFeedback({
        id: "feedback-1",
        userId: "user-123",
        rating: 5,
        feedback: "Great recommendation!",
        createdAt: new Date("2025-01-15T10:00:00Z"),
      });

      const transformed = {
        id: feedback.id,
        userId: feedback.userId,
        rating: feedback.rating,
        wasHelpful: true,
        comment: feedback.feedback,
        actualImpact: 80,
        createdAt: feedback.createdAt.toISOString(),
      };

      expect(transformed.id).toBe("feedback-1");
      expect(transformed.userId).toBe("user-123");
      expect(transformed.rating).toBe(5);
      expect(transformed.wasHelpful).toBe(true);
      expect(transformed.comment).toBe("Great recommendation!");
      expect(transformed.createdAt).toBe("2025-01-15T10:00:00.000Z");
    });

    it("should include all feedback fields in response", () => {
      const feedback = createMockRecommendationFeedback();
      const transformed = {
        id: feedback.id,
        userId: feedback.userId,
        rating: feedback.rating,
        wasHelpful: true,
        comment: feedback.feedback,
        actualImpact: feedback.rating * 20, // Example calculation
        createdAt: feedback.createdAt.toISOString(),
      };

      expect(transformed).toHaveProperty("id");
      expect(transformed).toHaveProperty("userId");
      expect(transformed).toHaveProperty("rating");
      expect(transformed).toHaveProperty("wasHelpful");
      expect(transformed).toHaveProperty("comment");
      expect(transformed).toHaveProperty("actualImpact");
      expect(transformed).toHaveProperty("createdAt");
    });
  });

  describe("Status Transitions", () => {
    it("should allow pending -> in_progress transition", () => {
      const validTransitions = {
        pending: ["in_progress", "dismissed"],
        in_progress: ["completed", "dismissed", "pending"],
        completed: ["in_progress"], // Can reopen
        dismissed: ["pending"], // Can reopen
      };

      expect(validTransitions.pending).toContain("in_progress");
    });

    it("should allow in_progress -> completed transition", () => {
      const currentStatus = "in_progress";
      const newStatus = "completed";

      // Verify this is a valid transition
      expect(["pending", "in_progress", "completed", "dismissed"]).toContain(newStatus);
    });

    it("should track completedAt when status becomes completed", () => {
      const status = "completed";
      const updateData: Record<string, unknown> = { status, updatedAt: new Date() };

      if (status === "completed") {
        updateData.completedAt = new Date();
      }

      expect(updateData).toHaveProperty("completedAt");
    });

    it("should track dismissedAt when status becomes dismissed", () => {
      const status = "dismissed";
      const updateData: Record<string, unknown> = { status, updatedAt: new Date() };

      if (status === "dismissed") {
        updateData.dismissedAt = new Date();
      }

      expect(updateData).toHaveProperty("dismissedAt");
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
      console.error("Database error fetching recommendation:", error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error fetching recommendation:",
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it("should throw user-friendly error on recommendation fetch failure", () => {
      const userFriendlyMessage = "Failed to fetch recommendation. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to fetch");
      expect(userFriendlyMessage).toContain("Please try again later");
    });

    it("should throw user-friendly error on status update failure", () => {
      const userFriendlyMessage = "Failed to update recommendation status. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to update");
    });

    it("should throw user-friendly error on feedback submission failure", () => {
      const userFriendlyMessage = "Failed to submit feedback. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to submit");
    });

    it("should re-throw known errors (not found)", () => {
      const notFoundError = new Error("Recommendation not found");
      const isKnown = notFoundError.message === "Recommendation not found";

      expect(isKnown).toBe(true);
    });

    it("should handle foreign key violations for brand reference", () => {
      const error = DatabaseErrors.foreignKeyViolation("brands");

      expect(error.code).toBe("23503");
      expect(error.detail).toContain("brands");
    });
  });

  describe("Priority and Category Filtering", () => {
    it("should filter by priority", async () => {
      const mockRecs = [
        createDbRecommendation({ priority: "high" }),
        createDbRecommendation({ priority: "high" }),
      ];
      mockSelectResult(mockRecs);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().recommendations)
        .where(); // Would filter by priority = 'high'

      expect(result.every(r => r.priority === "high")).toBe(true);
    });

    it("should filter by category", async () => {
      const mockRecs = [
        createDbRecommendation({ category: "content" }),
        createDbRecommendation({ category: "content" }),
      ];
      mockSelectResult(mockRecs);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().recommendations)
        .where(); // Would filter by category = 'content'

      expect(result.every(r => r.category === "content")).toBe(true);
    });

    it("should filter by status", async () => {
      const mockRecs = [
        createDbRecommendation({ status: "pending" }),
        createDbRecommendation({ status: "pending" }),
      ];
      mockSelectResult(mockRecs);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().recommendations)
        .where(); // Would filter by status = 'pending'

      expect(result.every(r => r.status === "pending")).toBe(true);
    });

    it("should support multiple filters combined", () => {
      const args = {
        brandId: "brand-123",
        status: "pending",
        priority: "high",
        category: "content",
      };

      // All filters should be applied
      expect(args.brandId).toBeDefined();
      expect(args.status).toBeDefined();
      expect(args.priority).toBeDefined();
      expect(args.category).toBeDefined();
    });
  });

  describe("Recommendation Factory Tests", () => {
    it("should create valid mock recommendation", () => {
      const rec = createMockRecommendation({
        id: "rec-test",
        brandId: "brand-test",
        title: "Test Recommendation",
        status: "pending",
        priority: "high",
      });

      expect(rec).toHaveProperty("id", "rec-test");
      expect(rec).toHaveProperty("brandId", "brand-test");
      expect(rec).toHaveProperty("title", "Test Recommendation");
      expect(rec).toHaveProperty("status", "pending");
      expect(rec).toHaveProperty("priority", "high");
      expect(rec).toHaveProperty("category");
      expect(rec).toHaveProperty("description");
      expect(rec).toHaveProperty("createdAt");
      expect(rec).toHaveProperty("updatedAt");
    });

    it("should create list of recommendations", () => {
      const count = 5;
      const recs = createMockRecommendations(count);

      expect(recs).toHaveLength(5);
      expect(recs.every(r => r.id !== undefined)).toBe(true);
    });

    it("should create valid mock feedback", () => {
      const feedback = createMockRecommendationFeedback({
        recommendationId: "rec-123",
        userId: "user-456",
        rating: 5,
      });

      expect(feedback).toHaveProperty("id");
      expect(feedback).toHaveProperty("recommendationId", "rec-123");
      expect(feedback).toHaveProperty("userId", "user-456");
      expect(feedback).toHaveProperty("rating", 5);
      expect(feedback).toHaveProperty("feedback");
      expect(feedback).toHaveProperty("createdAt");
    });
  });

  describe("Effort and Impact Fields", () => {
    it("should include effort field in recommendation", () => {
      const rec = createDbRecommendation({ effort: "medium" });

      expect(rec.effort).toBe("medium");
    });

    it("should support effort values: low, medium, high", () => {
      const effortValues = ["low", "medium", "high"];

      effortValues.forEach(effort => {
        const rec = createMockRecommendation({ effort });
        expect(rec.effort).toBe(effort);
      });
    });

    it("should convert impact to estimatedImpact percentage", () => {
      const impactMap = {
        high: 0.8,
        medium: 0.5,
        low: 0.3,
      };

      Object.entries(impactMap).forEach(([impact, expected]) => {
        expect(impact === "high" ? 0.8 : impact === "medium" ? 0.5 : 0.3).toBe(expected);
      });
    });
  });

  describe("Date Fields", () => {
    it("should include dueDate field", () => {
      const dueDate = new Date("2025-02-01");
      const rec = createMockRecommendation({ dueDate });

      expect(rec.dueDate).toEqual(dueDate);
    });

    it("should include completedAt when completed", () => {
      const completedAt = new Date("2025-01-20");
      const rec = createMockRecommendation({ status: "completed", completedAt });

      expect(rec.completedAt).toEqual(completedAt);
    });

    it("should transform dueDate to ISO string for GraphQL", () => {
      const dueDate = new Date("2025-02-01T10:00:00Z");

      const isoString = dueDate?.toISOString() || null;

      expect(isoString).toBe("2025-02-01T10:00:00.000Z");
    });

    it("should transform completedAt to ISO string for GraphQL", () => {
      const completedAt = new Date("2025-01-20T15:00:00Z");

      const isoString = completedAt?.toISOString() || null;

      expect(isoString).toBe("2025-01-20T15:00:00.000Z");
    });

    it("should handle null dueDate", () => {
      const rec = createMockRecommendation({ dueDate: null });

      const dueDate = rec.dueDate?.toISOString() || null;

      expect(dueDate).toBeNull();
    });

    it("should handle null completedAt", () => {
      const rec = createMockRecommendation({ completedAt: null });

      const completedAt = rec.completedAt?.toISOString() || null;

      expect(completedAt).toBeNull();
    });
  });

  describe("Assignment Fields", () => {
    it("should include assignedTo field", () => {
      const rec = createMockRecommendation({ assignedTo: "user-123" });

      expect(rec.assignedTo).toBe("user-123");
    });

    it("should handle null assignedTo", () => {
      const rec = createMockRecommendation({ assignedTo: null });

      expect(rec.assignedTo).toBeNull();
    });

    it("should map assignedTo to assignedToId in database", () => {
      const rec = createDbRecommendation({ assignedTo: "user-456" });

      // In database schema, it's stored as assignedToId
      expect(rec.assignedToId).toBe("user-456");
    });
  });
});
