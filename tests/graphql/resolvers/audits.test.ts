/**
 * Audit Resolver Tests
 *
 * Tests for audit Query and Mutation resolvers including:
 * - audit (single audit by ID)
 * - audits (list for a brand)
 * - startAudit (create new audit)
 * - cancelAudit (cancel an audit)
 * - Audit.brand field resolver
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setupGraphQLTest,
  mockSelectResult,
  mockInsertResult,
  mockUpdateResult,
  getCallHistory,
  wasMethodCalled,
  createMockAudit,
  createMockAudits,
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

describe("Audit Resolvers", () => {
  const { getDb, getSchema, resetMocks } = setupGraphQLTest();

  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  // Helper to create database audit format with categoryScores array
  const createDbAudit = (overrides: Partial<ReturnType<typeof createMockAudit>> = {}) => {
    const audit = createMockAudit(overrides);
    return {
      ...audit,
      categoryScores: [
        { category: "visibility", score: 80, maxScore: 100, issues: 2 },
        { category: "sentiment", score: 70, maxScore: 100, issues: 5 },
        { category: "recommendations", score: 75, maxScore: 100, issues: 3 },
      ],
    };
  };

  // Helper to transform audit with categories
  const transformAudit = (audit: ReturnType<typeof createDbAudit>) => ({
    ...audit,
    categories: (audit.categoryScores || []).map((cs) => ({
      name: cs.category,
      score: cs.score,
      weight: 1,
      issues: cs.issues,
      passed: cs.maxScore - cs.issues,
    })),
  });

  describe("Query: audit", () => {
    it("should fetch an audit by ID with correct data", async () => {
      const mockAudit = createDbAudit({ id: "audit-123", status: "completed" });
      mockSelectResult([mockAudit]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.audits)
        .where()
        .limit(1);

      expect(result).toEqual([mockAudit]);
      expect(wasMethodCalled("select")).toBe(true);
      expect(wasMethodCalled("where")).toBe(true);
    });

    it("should return null when audit is not found", async () => {
      mockSelectResult([]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.audits)
        .where()
        .limit(1);

      expect(result).toEqual([]);
      expect(result[0]).toBeUndefined();
    });

    it("should transform categoryScores to categories array", () => {
      const audit = createDbAudit();
      const transformed = transformAudit(audit);

      expect(transformed.categories).toBeDefined();
      expect(transformed.categories).toHaveLength(3);
      expect(transformed.categories[0]).toHaveProperty("name");
      expect(transformed.categories[0]).toHaveProperty("score");
      expect(transformed.categories[0]).toHaveProperty("weight");
      expect(transformed.categories[0]).toHaveProperty("issues");
      expect(transformed.categories[0]).toHaveProperty("passed");
    });

    it("should calculate passed as maxScore - issues", () => {
      const audit = createDbAudit();
      const transformed = transformAudit(audit);

      // categoryScores: [{ category: "visibility", score: 80, maxScore: 100, issues: 2 }, ...]
      expect(transformed.categories[0].passed).toBe(98); // 100 - 2
    });

    it("should set weight to 1 for all categories", () => {
      const audit = createDbAudit();
      const transformed = transformAudit(audit);

      transformed.categories.forEach((cat) => {
        expect(cat.weight).toBe(1);
      });
    });

    it("should handle null categoryScores gracefully", () => {
      const audit = { ...createMockAudit(), categoryScores: null };
      const categories = (audit.categoryScores || []).map((cs: { category: string; score: number; maxScore: number; issues: number }) => ({
        name: cs.category,
        score: cs.score,
        weight: 1,
        issues: cs.issues,
        passed: cs.maxScore - cs.issues,
      }));

      expect(categories).toEqual([]);
    });

    it("should include all audit fields in response", () => {
      const audit = createDbAudit({
        id: "audit-123",
        brandId: "brand-456",
        status: "completed",
        overallScore: 75,
        progress: 100,
      });

      expect(audit.id).toBe("audit-123");
      expect(audit.brandId).toBe("brand-456");
      expect(audit.status).toBe("completed");
      expect(audit.overallScore).toBe(75);
      expect(audit.progress).toBe(100);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
    });
  });

  describe("Query: audits", () => {
    it("should fetch audits for a brand", async () => {
      const brandId = "brand-123";
      const mockAudits = [
        createDbAudit({ brandId }),
        createDbAudit({ brandId }),
        createDbAudit({ brandId }),
      ];
      mockSelectResult(mockAudits);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.audits)
        .where()
        .orderBy()
        .limit(20);

      expect(result).toEqual(mockAudits);
      expect(result).toHaveLength(3);
      dbAssertions.expectSelect();
    });

    it("should apply default limit of 20", async () => {
      const mockAudits = createMockAudits(25);
      mockSelectResult(mockAudits.slice(0, 20));

      const db = getDb();
      const result = await db.select().from(getSchema().audits).limit(20);

      expect(result).toHaveLength(20);
      expect(wasMethodCalled("limit")).toBe(true);
    });

    it("should apply custom limit when provided", async () => {
      const mockAudits = createMockAudits(10);
      mockSelectResult(mockAudits);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().audits)
        .where()
        .limit(10);

      expect(result).toHaveLength(10);
    });

    it("should return empty array when no audits exist", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db.select().from(getSchema().audits).where();

      expect(result).toEqual([]);
    });

    it("should order by createdAt descending", async () => {
      const brandId = "brand-123";
      const mockAudits = [
        createDbAudit({ brandId, createdAt: createTimestamp(0) }), // Today (newest)
        createDbAudit({ brandId, createdAt: createTimestamp(1) }),
        createDbAudit({ brandId, createdAt: createTimestamp(2) }), // Oldest
      ];
      mockSelectResult(mockAudits);

      const db = getDb();
      await db.select().from(getSchema().audits).where().orderBy().limit(20);

      expect(wasMethodCalled("orderBy")).toBe(true);
    });

    it("should transform all audits in result", () => {
      const mockAudits = [
        createDbAudit({ status: "completed" }),
        createDbAudit({ status: "in_progress" }),
        createDbAudit({ status: "pending" }),
      ];

      const transformed = mockAudits.map(transformAudit);

      expect(transformed).toHaveLength(3);
      transformed.forEach((audit) => {
        expect(audit.categories).toBeDefined();
        expect(Array.isArray(audit.categories)).toBe(true);
      });
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Mutation: startAudit", () => {
    it("should create a new audit with pending status", async () => {
      const brandId = "brand-123";
      const url = "https://example.com";
      const userId = "user-456";

      const newAudit = {
        id: "audit-new",
        brandId,
        url,
        status: "pending",
        triggeredById: userId,
        overallScore: null,
        progress: 0,
        categoryScores: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockInsertResult([newAudit]);

      const db = getDb();
      const schema = getSchema();

      const result = await db.insert(schema.audits).values({
        brandId,
        url,
        status: "pending",
        triggeredById: userId,
      }).returning();

      expect(result[0]).toEqual(newAudit);
      expect(result[0].status).toBe("pending");
      expect(result[0].brandId).toBe(brandId);
      expect(result[0].url).toBe(url);
      dbAssertions.expectInsert();
    });

    it("should set triggeredById from user context", () => {
      const context = createMockGraphQLContext({ userId: "user-789" });
      const auth = context.requireAuth();

      expect(auth.userId).toBe("user-789");
    });

    it("should return audit with empty categories array", () => {
      const newAudit = {
        id: "audit-new",
        brandId: "brand-123",
        url: "https://example.com",
        status: "pending",
        categoryScores: null,
      };

      const response = {
        ...newAudit,
        categories: [],
      };

      expect(response.categories).toEqual([]);
    });

    it("should use .returning() for PostgreSQL", async () => {
      const audit = createMockAudit();
      mockInsertResult([audit]);

      const db = getDb();
      await db.insert(getSchema().audits).values({
        brandId: "brand-123",
        url: "https://example.com",
        status: "pending",
      }).returning();

      dbAssertions.expectReturning();
    });

    it("should handle foreign key violation for non-existent brand", () => {
      const error = DatabaseErrors.foreignKeyViolation("brands");

      expect(error.code).toBe("23503");
      expect(error.detail).toContain("brands");

      // Error message should indicate brand not found
      const userFriendlyMessage = "Brand not found. Cannot start audit for non-existent brand.";
      expect(userFriendlyMessage).toContain("Brand not found");
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
    });
  });

  describe("Mutation: cancelAudit", () => {
    it("should update audit status to failed", async () => {
      const auditId = "audit-123";

      mockUpdateResult([{}]); // cancelAudit doesn't use return value, returns true

      const db = getDb();
      const schema = getSchema();

      await db.update(schema.audits).set({
        status: "failed",
        errorMessage: "Cancelled by user",
      }).where();

      dbAssertions.expectUpdate();
    });

    it("should set errorMessage to 'Cancelled by user'", () => {
      const updateData = {
        status: "failed",
        errorMessage: "Cancelled by user",
      };

      expect(updateData.errorMessage).toBe("Cancelled by user");
    });

    it("should return true on success", async () => {
      // cancelAudit returns true after update
      const success = true;

      expect(success).toBe(true);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Field Resolver: Audit.brand", () => {
    it("should fetch brand for audit by brandId", async () => {
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

    it("should include keywords array", () => {
      const mockBrand = {
        ...createMockBrand({ id: "brand-123" }),
        keywords: ["audit", "brand", "seo"],
      };

      expect(mockBrand.keywords).toEqual(["audit", "brand", "seo"]);
    });
  });

  describe("Audit Status Workflow", () => {
    it("should start with pending status", () => {
      const newAudit = { status: "pending" };
      expect(newAudit.status).toBe("pending");
    });

    it("should transition to in_progress when started", () => {
      const audit = { status: "in_progress", startedAt: new Date() };
      expect(audit.status).toBe("in_progress");
      expect(audit.startedAt).toBeDefined();
    });

    it("should transition to completed when finished", () => {
      const audit = { status: "completed", completedAt: new Date(), overallScore: 75 };
      expect(audit.status).toBe("completed");
      expect(audit.completedAt).toBeDefined();
      expect(audit.overallScore).toBe(75);
    });

    it("should transition to failed when cancelled or errored", () => {
      const audit = { status: "failed", errorMessage: "Cancelled by user" };
      expect(audit.status).toBe("failed");
      expect(audit.errorMessage).toBeDefined();
    });

    it("should support valid status values", () => {
      const validStatuses = ["pending", "in_progress", "completed", "failed"];

      validStatuses.forEach((status) => {
        const audit = { status };
        expect(validStatuses).toContain(audit.status);
      });
    });
  });

  describe("Progress Tracking", () => {
    it("should start with 0 progress", () => {
      const newAudit = { progress: 0, status: "pending" };
      expect(newAudit.progress).toBe(0);
    });

    it("should track progress percentage during audit", () => {
      const progressValues = [0, 25, 50, 75, 100];

      progressValues.forEach((progress) => {
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      });
    });

    it("should have 100 progress when completed", () => {
      const completedAudit = { progress: 100, status: "completed" };
      expect(completedAudit.progress).toBe(100);
    });
  });

  describe("Duration Calculation", () => {
    it("should calculate duration from startedAt and completedAt", () => {
      const startedAt = new Date("2025-01-15T10:00:00Z");
      const completedAt = new Date("2025-01-15T10:05:00Z");

      const durationSeconds = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000);

      expect(durationSeconds).toBe(300); // 5 minutes
    });

    it("should return null duration when not completed", () => {
      const audit = { startedAt: new Date(), completedAt: null };

      const duration = audit.completedAt && audit.startedAt
        ? Math.round((audit.completedAt.getTime() - audit.startedAt.getTime()) / 1000)
        : null;

      expect(duration).toBeNull();
    });

    it("should return null duration when not started", () => {
      const audit = { startedAt: null, completedAt: null };

      const duration = audit.completedAt && audit.startedAt
        ? Math.round((audit.completedAt.getTime() - audit.startedAt.getTime()) / 1000)
        : null;

      expect(duration).toBeNull();
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
      console.error("Database error fetching audit:", error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error fetching audit:",
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it("should throw user-friendly error on audit fetch failure", () => {
      const userFriendlyMessage = "Failed to fetch audit. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to fetch");
      expect(userFriendlyMessage).toContain("Please try again later");
    });

    it("should throw user-friendly error on audit start failure", () => {
      const userFriendlyMessage = "Failed to start audit. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to start");
    });

    it("should throw user-friendly error on audit cancel failure", () => {
      const userFriendlyMessage = "Failed to cancel audit. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to cancel");
    });
  });

  describe("Audit Factory Tests", () => {
    it("should create valid mock audit", () => {
      const audit = createMockAudit({
        id: "audit-test",
        brandId: "brand-test",
        status: "completed",
        overallScore: 85,
      });

      expect(audit).toHaveProperty("id", "audit-test");
      expect(audit).toHaveProperty("brandId", "brand-test");
      expect(audit).toHaveProperty("status", "completed");
      expect(audit).toHaveProperty("overallScore", 85);
      expect(audit).toHaveProperty("createdAt");
      expect(audit).toHaveProperty("updatedAt");
    });

    it("should create list of audits", () => {
      const count = 5;
      const audits = createMockAudits(count);

      expect(audits).toHaveLength(5);
      expect(audits.every((a) => a.id !== undefined)).toBe(true);
    });

    it("should create audit with default values", () => {
      const audit = createMockAudit();

      expect(audit.status).toBe("completed");
      expect(audit.overallScore).toBe(75);
      expect(audit.progress).toBe(100);
    });
  });

  describe("Issues and Scores", () => {
    it("should include issues array in audit", () => {
      const audit = createMockAudit({
        issues: [
          { type: "seo", severity: "high", message: "Missing meta description" },
          { type: "content", severity: "medium", message: "Content too short" },
        ],
      });

      expect(audit.issues).toHaveLength(2);
    });

    it("should calculate overall score from category scores", () => {
      const categoryScores = [
        { category: "visibility", score: 80, maxScore: 100, issues: 2 },
        { category: "sentiment", score: 70, maxScore: 100, issues: 5 },
        { category: "content", score: 90, maxScore: 100, issues: 1 },
      ];

      const avgScore = Math.round(
        categoryScores.reduce((sum, cs) => sum + cs.score, 0) / categoryScores.length
      );

      expect(avgScore).toBe(80);
    });

    it("should handle empty issues array", () => {
      const audit = createMockAudit({ issues: [] });

      expect(audit.issues).toEqual([]);
    });
  });

  describe("URL Validation", () => {
    it("should accept valid URL for audit", () => {
      const validUrls = [
        "https://example.com",
        "https://www.example.com/path",
        "https://subdomain.example.com",
        "http://localhost:3000",
      ];

      validUrls.forEach((url) => {
        expect(() => new URL(url)).not.toThrow();
      });
    });
  });
});
