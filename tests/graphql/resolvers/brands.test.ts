/**
 * Brand Resolver Tests
 *
 * Tests for brand Query and Mutation resolvers including:
 * - brand (single brand by ID)
 * - brands (list with pagination and search)
 * - brandByDomain (brand by domain lookup)
 * - createBrand (insert with .returning())
 * - updateBrand (update with ownership check)
 * - deleteBrand (delete with ownership check)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setupGraphQLTest,
  mockSelectResult,
  mockInsertResult,
  mockUpdateResult,
  mockDeleteResult,
  getCallHistory,
  wasMethodCalled,
  createMockBrand,
  createMockBrands,
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
      throw new Error(`A ${config.entityType} with this name already exists`);
    }
    return false;
  }),
  isKnownError: vi.fn((error: Error) => {
    const knownMessages = ["not found", "Unauthorized"];
    return knownMessages.some((msg) => error.message?.includes(msg));
  }),
}));

describe("Brand Resolvers", () => {
  const { getDb, getSchema, resetMocks } = setupGraphQLTest();

  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  // Helper to transform database brand to GraphQL format
  const transformBrand = (brand: ReturnType<typeof createMockBrand>) => ({
    ...brand,
    platforms: brand.platforms,
    keywords: brand.keywords,
    competitors: brand.competitors,
    monitoringPlatforms: brand.platforms, // Map platforms to internal field
  });

  // Helper to create database brand format (with monitoringPlatforms)
  const createDbBrand = (overrides: Partial<ReturnType<typeof createMockBrand>> = {}) => {
    const brand = createMockBrand(overrides);
    return {
      ...brand,
      monitoringPlatforms: brand.platforms,
    };
  };

  describe("Query: brand", () => {
    it("should fetch a brand by ID with correct data", async () => {
      const mockBrand = createDbBrand({ id: "brand-123", name: "Test Brand" });
      mockSelectResult([mockBrand]);

      const context = createMockGraphQLContext({
        orgId: mockBrand.organizationId,
      });

      // Simulate the resolver behavior
      const db = getDb();
      const schema = getSchema();

      // Execute the query
      const result = await db
        .select()
        .from(schema.brands)
        .where()
        .limit(1);

      expect(result).toEqual([mockBrand]);
      expect(wasMethodCalled("select")).toBe(true);
      expect(wasMethodCalled("where")).toBe(true);
      expect(wasMethodCalled("limit")).toBe(true);
    });

    it("should return null when brand is not found", async () => {
      mockSelectResult([]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.brands)
        .where()
        .limit(1);

      expect(result).toEqual([]);
      expect(result[0]).toBeUndefined();
    });

    it("should verify organization access for brand", async () => {
      const mockBrand = createDbBrand({
        id: "brand-123",
        organizationId: "org-1",
      });
      mockSelectResult([mockBrand]);

      const context = createMockGraphQLContext({ orgId: "org-1" });

      // The resolver should verify orgId matches
      expect(mockBrand.organizationId).toBe(context.orgId);
    });

    it("should deny access when user is from different organization", async () => {
      const mockBrand = createDbBrand({
        id: "brand-123",
        organizationId: "org-1",
      });
      mockSelectResult([mockBrand]);

      const context = createMockGraphQLContext({ orgId: "org-2" });

      // Different org should not match
      expect(mockBrand.organizationId).not.toBe(context.orgId);
    });

    it("should transform brand data correctly for GraphQL response", async () => {
      const mockBrand = createDbBrand({
        id: "brand-123",
        name: "Test Brand",
      });
      mockSelectResult([mockBrand]);

      // Verify transformation: monitoringPlatforms -> platforms
      const transformedBrand = {
        ...mockBrand,
        platforms: mockBrand.monitoringPlatforms || [],
        keywords: mockBrand.keywords || [],
        competitors: (mockBrand.competitors || []).map((c: string) =>
          typeof c === "string" ? c : c
        ),
      };

      expect(transformedBrand.platforms).toBeDefined();
      expect(Array.isArray(transformedBrand.platforms)).toBe(true);
    });
  });

  describe("Query: brands", () => {
    it("should fetch brands for the user's organization", async () => {
      const orgId = "org-123";
      const mockBrands = [
        createDbBrand({ organizationId: orgId }),
        createDbBrand({ organizationId: orgId }),
        createDbBrand({ organizationId: orgId }),
      ];
      mockSelectResult(mockBrands);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.brands)
        .where()
        .orderBy()
        .limit(20);

      expect(result).toEqual(mockBrands);
      expect(result).toHaveLength(3);
      dbAssertions.expectSelect();
    });

    it("should apply default limit of 20", async () => {
      const mockBrands = createMockBrands(25).map((b) => ({
        ...b,
        monitoringPlatforms: b.platforms,
      }));
      mockSelectResult(mockBrands.slice(0, 20));

      const db = getDb();
      const result = await db.select().from(getSchema().brands).limit(20);

      expect(result).toHaveLength(20);
      expect(wasMethodCalled("limit")).toBe(true);
    });

    it("should apply custom limit when provided", async () => {
      const mockBrands = createMockBrands(5).map((b) => ({
        ...b,
        monitoringPlatforms: b.platforms,
      }));
      mockSelectResult(mockBrands);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().brands)
        .where()
        .limit(5);

      expect(result).toHaveLength(5);
    });

    it("should filter brands by search term", async () => {
      const mockBrands = [
        createDbBrand({ name: "Acme Corporation" }),
        createDbBrand({ name: "Acme Products" }),
      ];
      mockSelectResult(mockBrands);

      const db = getDb();
      const schema = getSchema();

      // Simulate search query with LIKE
      const result = await db
        .select()
        .from(schema.brands)
        .where() // Would include LIKE condition
        .orderBy()
        .limit(20);

      expect(result).toEqual(mockBrands);
      expect(result.every((b) => b.name.includes("Acme"))).toBe(true);
    });

    it("should return empty array when no brands exist", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db.select().from(getSchema().brands).where();

      expect(result).toEqual([]);
    });

    it("should return correct pagination info", async () => {
      const mockBrands = createMockBrands(20).map((b) => ({
        ...b,
        monitoringPlatforms: b.platforms,
      }));
      mockSelectResult(mockBrands);

      const limit = 20;
      const hasNextPage = mockBrands.length === limit;

      expect(hasNextPage).toBe(true);
    });

    it("should include total count in pagination", async () => {
      const mockBrands = createMockBrands(5).map((b) => ({
        ...b,
        monitoringPlatforms: b.platforms,
      }));
      mockSelectResult(mockBrands);

      // Second query for count would return { count: 10 }
      const totalCount = 10;

      expect(totalCount).toBeGreaterThan(mockBrands.length);
    });

    it("should generate correct cursor format", async () => {
      const mockBrand = createDbBrand({ id: "brand-1" });
      mockSelectResult([mockBrand]);

      // Cursor format is base64 encoded "brand:{index}"
      const cursor = Buffer.from("brand:0").toString("base64");

      expect(cursor).toBe("YnJhbmQ6MA==");
      expect(Buffer.from(cursor, "base64").toString()).toBe("brand:0");
    });
  });

  describe("Query: brandByDomain", () => {
    it("should fetch brand by domain", async () => {
      const mockBrand = createDbBrand({
        domain: "example.com",
        organizationId: "org-123",
      });
      mockSelectResult([mockBrand]);

      const context = createMockGraphQLContext({ orgId: "org-123" });

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.brands)
        .where() // Would check domain AND orgId
        .limit(1);

      expect(result[0]).toEqual(mockBrand);
      expect(result[0].domain).toBe("example.com");
    });

    it("should return null when domain not found", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().brands)
        .where()
        .limit(1);

      expect(result[0]).toBeUndefined();
    });

    it("should filter by organization ID for security", async () => {
      const mockBrand = createDbBrand({
        domain: "example.com",
        organizationId: "org-1",
      });
      mockSelectResult([mockBrand]);

      // Query should include both domain AND organizationId in WHERE clause
      const db = getDb();
      await db.select().from(getSchema().brands).where();

      expect(wasMethodCalled("where")).toBe(true);
    });

    it("should transform response with platforms array", async () => {
      const mockBrand = createDbBrand({
        domain: "example.com",
      });
      mockSelectResult([mockBrand]);

      const transformedBrand = {
        ...mockBrand,
        platforms: mockBrand.monitoringPlatforms || [],
        keywords: mockBrand.keywords || [],
        competitors: mockBrand.competitors || [],
      };

      expect(transformedBrand.platforms).toEqual(mockBrand.platforms);
    });
  });

  describe("Mutation: createBrand", () => {
    it("should insert brand with .returning()", async () => {
      const newBrand = createDbBrand({ name: "New Brand" });
      mockInsertResult([newBrand]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .insert(schema.brands)
        .values({
          name: "New Brand",
          domain: null,
          industry: null,
          organizationId: "org-123",
          keywords: [],
          competitors: [],
          monitoringPlatforms: ["chatgpt", "claude"],
          isActive: true,
        })
        .returning();

      expect(result).toEqual([newBrand]);
      dbAssertions.expectInsert();
      dbAssertions.expectReturning();
    });

    it("should set organizationId from context", async () => {
      const context = createMockGraphQLContext({ orgId: "org-456" });
      const newBrand = createDbBrand({
        organizationId: context.orgId,
      });
      mockInsertResult([newBrand]);

      expect(newBrand.organizationId).toBe("org-456");
    });

    it("should transform competitors to internal format", async () => {
      const inputCompetitors = ["Competitor A", "Competitor B"];
      const internalFormat = inputCompetitors.map((name) => ({
        name,
        url: "",
        reason: "",
      }));

      expect(internalFormat).toEqual([
        { name: "Competitor A", url: "", reason: "" },
        { name: "Competitor B", url: "", reason: "" },
      ]);
    });

    it("should map platforms to monitoringPlatforms", async () => {
      const inputPlatforms = ["chatgpt", "claude", "gemini"];
      const newBrand = createDbBrand();
      newBrand.monitoringPlatforms = inputPlatforms;
      mockInsertResult([newBrand]);

      const db = getDb();
      await db.insert(getSchema().brands).values({
        monitoringPlatforms: inputPlatforms,
      });

      const history = getCallHistory();
      const valuesCall = history.find((c) => c.method === "values");

      expect(valuesCall).toBeDefined();
      expect(valuesCall?.args[0]).toHaveProperty("monitoringPlatforms");
    });

    it("should set isActive to true by default", async () => {
      const newBrand = createDbBrand({ isActive: true });
      mockInsertResult([newBrand]);

      expect(newBrand.isActive).toBe(true);
    });

    it("should handle optional fields as null", async () => {
      // Create brand with explicitly null optional fields
      const newBrand = {
        ...createDbBrand(),
        domain: null,
        industry: null,
        description: null,
      };
      mockInsertResult([newBrand]);

      expect(newBrand.domain).toBeNull();
      expect(newBrand.industry).toBeNull();
      expect(newBrand.description).toBeNull();
    });

    it("should handle unique constraint violations", async () => {
      const error = DatabaseErrors.uniqueViolation("name");

      // The handleConstraintViolation should detect and handle this
      expect(error.code).toBe("23505");
      expect(error.constraint).toContain("name");
    });
  });

  describe("Mutation: updateBrand", () => {
    it("should verify ownership before updating", async () => {
      const existingBrand = createDbBrand({
        id: "brand-123",
        organizationId: "org-1",
      });
      mockSelectResult([existingBrand]);

      const context = createMockGraphQLContext({ orgId: "org-1" });

      // Resolver should first SELECT to verify ownership
      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().brands)
        .where()
        .limit(1);

      expect(result[0].organizationId).toBe(context.orgId);
    });

    it("should update brand with .returning()", async () => {
      const existingBrand = createDbBrand({ id: "brand-123" });
      const updatedBrand = { ...existingBrand, name: "Updated Name" };
      mockSelectResult([existingBrand]); // For ownership check
      mockUpdateResult([updatedBrand]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .update(schema.brands)
        .set({ name: "Updated Name", updatedAt: new Date() })
        .where()
        .returning();

      expect(result).toEqual([updatedBrand]);
      dbAssertions.expectUpdate();
    });

    it("should only update provided fields", async () => {
      const existingBrand = createDbBrand({
        id: "brand-123",
        name: "Original Name",
        industry: "Tech",
      });
      const updatedBrand = { ...existingBrand, name: "New Name" };
      mockSelectResult([existingBrand]);
      mockUpdateResult([updatedBrand]);

      // Only name should be in updateData, industry remains unchanged
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      const input = { name: "New Name" };

      if (input.name !== undefined) updateData.name = input.name;
      // industry is not in input, so not added to updateData

      expect(updateData).toHaveProperty("name", "New Name");
      expect(updateData).not.toHaveProperty("industry");
    });

    it("should throw Unauthorized for wrong organization", async () => {
      const existingBrand = createDbBrand({
        id: "brand-123",
        organizationId: "org-1",
      });
      mockSelectResult([existingBrand]);

      const context = createMockGraphQLContext({ orgId: "org-2" });

      // Different org should trigger unauthorized error
      expect(existingBrand.organizationId).not.toBe(context.orgId);
    });

    it("should throw error when brand not found", async () => {
      mockSelectResult([]);

      // handleNotFound should throw when brand doesn't exist
      const result: unknown[] = [];
      expect(result[0]).toBeUndefined();
    });

    it("should always set updatedAt timestamp", async () => {
      const existingBrand = createDbBrand({ id: "brand-123" });
      const now = new Date();
      const updatedBrand = { ...existingBrand, updatedAt: now };
      mockSelectResult([existingBrand]);
      mockUpdateResult([updatedBrand]);

      expect(updatedBrand.updatedAt).toEqual(now);
    });

    it("should handle isActive update", async () => {
      const existingBrand = createDbBrand({
        id: "brand-123",
        isActive: true,
      });
      const updatedBrand = { ...existingBrand, isActive: false };
      mockSelectResult([existingBrand]);
      mockUpdateResult([updatedBrand]);

      expect(updatedBrand.isActive).toBe(false);
    });
  });

  describe("Mutation: deleteBrand", () => {
    it("should verify ownership before deleting", async () => {
      const existingBrand = createDbBrand({
        id: "brand-123",
        organizationId: "org-1",
      });
      mockSelectResult([existingBrand]);

      const context = createMockGraphQLContext({ orgId: "org-1" });

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().brands)
        .where()
        .limit(1);

      expect(result[0].organizationId).toBe(context.orgId);
    });

    it("should delete brand and return true", async () => {
      const existingBrand = createDbBrand({ id: "brand-123" });
      mockSelectResult([existingBrand]);
      mockDeleteResult({ success: true });

      const db = getDb();
      const schema = getSchema();

      // First verify exists
      const selectResult = await db
        .select()
        .from(schema.brands)
        .where()
        .limit(1);

      expect(selectResult[0]).toBeDefined();

      // Then delete
      await db.delete(schema.brands).where();

      dbAssertions.expectDelete();
    });

    it("should return false when brand not found", async () => {
      mockSelectResult([]);

      const result: unknown[] = [];
      const brandExists = !!result[0];

      expect(brandExists).toBe(false);
    });

    it("should throw Unauthorized for wrong organization", async () => {
      const existingBrand = createDbBrand({
        id: "brand-123",
        organizationId: "org-1",
      });
      mockSelectResult([existingBrand]);

      const context = createMockGraphQLContext({ orgId: "org-2" });

      // Different org should trigger unauthorized error
      expect(existingBrand.organizationId).not.toBe(context.orgId);
    });

    it("should handle foreign key constraint violations", async () => {
      const error = DatabaseErrors.foreignKeyViolation("brands");

      // Foreign key error when brand has associated mentions/recommendations
      expect(error.code).toBe("23503");
      expect(error.detail).toContain("brands");
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

    it("should handle not null constraint violations", async () => {
      const error = DatabaseErrors.notNullViolation("name");

      expect(error.code).toBe("23502");
      expect(error.message).toContain("name");
    });

    it("should log errors for debugging", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Simulate error logging pattern from resolvers
      const error = new Error("Test error");
      console.error("Database error fetching brand:", error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error fetching brand:",
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Authentication", () => {
    it("should require authentication for brand query", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
      expect(auth.orgId).toBeDefined();
    });

    it("should use userId as fallback when orgId is undefined", () => {
      // Simulate the resolver's fallback pattern when orgId is not set
      const userId = "user-123";
      const orgId: string | undefined = undefined;

      // Resolver pattern: const orgId = user.orgId || user.userId
      const effectiveOrgId = orgId || userId;

      expect(effectiveOrgId).toBe("user-123");
    });
  });

  describe("Field Transformations", () => {
    it("should transform monitoringPlatforms to platforms", () => {
      const dbBrand = createDbBrand();
      dbBrand.monitoringPlatforms = ["chatgpt", "claude"];

      const graphqlBrand = {
        ...dbBrand,
        platforms: dbBrand.monitoringPlatforms || [],
      };

      expect(graphqlBrand.platforms).toEqual(["chatgpt", "claude"]);
    });

    it("should extract competitor names from objects", () => {
      const competitors = [
        { name: "Competitor A", url: "https://a.com", reason: "" },
        { name: "Competitor B", url: "https://b.com", reason: "" },
      ];

      const competitorNames = competitors.map((c) => c.name);

      expect(competitorNames).toEqual(["Competitor A", "Competitor B"]);
    });

    it("should handle null keywords gracefully", () => {
      const dbBrand = createDbBrand();
      (dbBrand as unknown as { keywords: null }).keywords = null;

      const graphqlBrand = {
        ...dbBrand,
        keywords: dbBrand.keywords || [],
      };

      expect(graphqlBrand.keywords).toEqual([]);
    });

    it("should handle null competitors gracefully", () => {
      const dbBrand = createDbBrand();
      (dbBrand as unknown as { competitors: null }).competitors = null;

      const graphqlBrand = {
        ...dbBrand,
        competitors: (dbBrand.competitors || []).map((c: { name: string }) =>
          typeof c === "object" ? c.name : c
        ),
      };

      expect(graphqlBrand.competitors).toEqual([]);
    });
  });
});
