/**
 * Test Infrastructure Verification Tests
 *
 * Verifies that the GraphQL test setup and mocks work correctly.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  setupGraphQLTest,
  mockSelectResult,
  mockInsertResult,
  mockUpdateResult,
  getCallHistory,
  wasMethodCalled,
  createMockBrand,
  createMockMention,
  createMockRecommendation,
  createMockAudit,
  createMockContent,
  createMockOrganization,
  createMockUser,
  createMockIntegration,
  createMockGeoScoreHistory,
  createMockGraphQLContext,
  DatabaseErrors,
  dbAssertions,
  resetIdCounter,
} from "./setup";

describe("Test Infrastructure", () => {
  const { getDb, getSchema, getContext, resetMocks } = setupGraphQLTest();

  beforeEach(() => {
    resetMocks();
  });

  describe("Database Mock", () => {
    it("should create a valid database mock", () => {
      const db = getDb();

      expect(db).toBeDefined();
      expect(typeof db.select).toBe("function");
      expect(typeof db.insert).toBe("function");
      expect(typeof db.update).toBe("function");
      expect(typeof db.delete).toBe("function");
    });

    it("should support chained SELECT queries", async () => {
      const mockBrand = createMockBrand();
      mockSelectResult([mockBrand]);

      const db = getDb();
      const result = await db.select().from(getSchema().brands);

      expect(result).toEqual([mockBrand]);
    });

    it("should support SELECT with WHERE clause", async () => {
      const mockBrand = createMockBrand({ id: "brand-1" });
      mockSelectResult([mockBrand]);

      const db = getDb();
      const schema = getSchema();
      const result = await db.select().from(schema.brands).where();

      expect(result).toEqual([mockBrand]);
      expect(wasMethodCalled("where")).toBe(true);
    });

    it("should support SELECT with limit and offset", async () => {
      const mockBrands = [
        createMockBrand({ id: "brand-1" }),
        createMockBrand({ id: "brand-2" }),
      ];
      mockSelectResult(mockBrands);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().brands)
        .limit(10)
        .offset(0);

      expect(result).toEqual(mockBrands);
      expect(wasMethodCalled("limit")).toBe(true);
      expect(wasMethodCalled("offset")).toBe(true);
    });

    it("should support INSERT with returning", async () => {
      const mockBrand = createMockBrand();
      mockInsertResult([mockBrand]);

      const db = getDb();
      const result = await db
        .insert(getSchema().brands)
        .values({ name: "New Brand" })
        .returning();

      expect(result).toEqual([mockBrand]);
      expect(wasMethodCalled("insert")).toBe(true);
      expect(wasMethodCalled("values")).toBe(true);
      expect(wasMethodCalled("returning")).toBe(true);
    });

    it("should support UPDATE with WHERE and returning", async () => {
      const mockBrand = createMockBrand({ name: "Updated Brand" });
      mockUpdateResult([mockBrand]);

      const db = getDb();
      const result = await db
        .update(getSchema().brands)
        .set({ name: "Updated Brand" })
        .where()
        .returning();

      expect(result).toEqual([mockBrand]);
      expect(wasMethodCalled("update")).toBe(true);
      expect(wasMethodCalled("set")).toBe(true);
    });

    it("should support DELETE with WHERE", async () => {
      const db = getDb();
      await db.delete(getSchema().brands).where();

      expect(wasMethodCalled("delete")).toBe(true);
      expect(wasMethodCalled("deleteWhere")).toBe(true);
    });

    it("should track call history", () => {
      const db = getDb();
      db.select();
      db.insert(getSchema().brands);

      const history = getCallHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history.some((call) => call.method === "select")).toBe(true);
      expect(history.some((call) => call.method === "insert")).toBe(true);
    });

    it("should reset call history on resetMocks", () => {
      const db = getDb();
      db.select();

      expect(getCallHistory().length).toBeGreaterThan(0);

      resetMocks();

      expect(getCallHistory().length).toBe(0);
    });
  });

  describe("Schema Mock", () => {
    it("should contain all required tables", () => {
      const schema = getSchema();

      expect(schema.brands).toBeDefined();
      expect(schema.brandMentions).toBeDefined();
      expect(schema.recommendations).toBeDefined();
      expect(schema.recommendationFeedback).toBeDefined();
      expect(schema.audits).toBeDefined();
      expect(schema.content).toBeDefined();
      expect(schema.organizations).toBeDefined();
      expect(schema.users).toBeDefined();
      expect(schema.apiIntegrations).toBeDefined();
      expect(schema.geoScoreHistory).toBeDefined();
    });

    it("should have named tables for query logging", () => {
      const schema = getSchema();

      expect(schema.brands.name).toBe("brands");
      expect(schema.brandMentions.name).toBe("brandMentions");
    });
  });

  describe("Context Mock", () => {
    it("should create a valid GraphQL context", () => {
      const context = getContext();

      expect(context).toBeDefined();
      expect(context.userId).toBeDefined();
      expect(context.orgId).toBeDefined();
      expect(context.user).toBeDefined();
      expect(context.organization).toBeDefined();
      expect(typeof context.requireAuth).toBe("function");
    });

    it("should provide requireAuth function", () => {
      const context = getContext();
      const auth = context.requireAuth();

      expect(auth.userId).toBe(context.userId);
      expect(auth.orgId).toBe(context.orgId);
    });

    it("should allow custom context values", () => {
      const customContext = createMockGraphQLContext({
        userId: "custom-user",
        orgId: "custom-org",
      });

      expect(customContext.userId).toBe("custom-user");
      expect(customContext.orgId).toBe("custom-org");
    });
  });

  describe("Factory Functions", () => {
    beforeEach(() => {
      resetIdCounter();
    });

    it("should create mock brands", () => {
      const brand = createMockBrand();

      expect(brand.id).toBeDefined();
      expect(brand.name).toBeDefined();
      expect(brand.organizationId).toBeDefined();
      expect(brand.platforms).toBeInstanceOf(Array);
      expect(brand.createdAt).toBeInstanceOf(Date);
    });

    it("should create mock brands with overrides", () => {
      const brand = createMockBrand({
        name: "Custom Brand",
        industry: "Healthcare",
      });

      expect(brand.name).toBe("Custom Brand");
      expect(brand.industry).toBe("Healthcare");
    });

    it("should create mock mentions", () => {
      const mention = createMockMention();

      expect(mention.id).toBeDefined();
      expect(mention.brandId).toBeDefined();
      expect(mention.platform).toBeDefined();
      expect(mention.sentiment).toBeDefined();
      expect(typeof mention.sentimentScore).toBe("number");
    });

    it("should create mock recommendations", () => {
      const recommendation = createMockRecommendation();

      expect(recommendation.id).toBeDefined();
      expect(recommendation.brandId).toBeDefined();
      expect(recommendation.title).toBeDefined();
      expect(recommendation.priority).toBeDefined();
      expect(recommendation.status).toBeDefined();
    });

    it("should create mock audits", () => {
      const audit = createMockAudit();

      expect(audit.id).toBeDefined();
      expect(audit.brandId).toBeDefined();
      expect(audit.status).toBeDefined();
      expect(audit.overallScore).toBeDefined();
    });

    it("should create mock content", () => {
      const content = createMockContent();

      expect(content.id).toBeDefined();
      expect(content.brandId).toBeDefined();
      expect(content.title).toBeDefined();
      expect(content.type).toBeDefined();
      expect(content.status).toBeDefined();
    });

    it("should create mock organizations", () => {
      const org = createMockOrganization();

      expect(org.id).toBeDefined();
      expect(org.name).toBeDefined();
      expect(org.plan).toBeDefined();
    });

    it("should create mock users", () => {
      const user = createMockUser();

      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.organizationId).toBeDefined();
    });

    it("should create mock integrations", () => {
      const integration = createMockIntegration();

      expect(integration.id).toBeDefined();
      expect(integration.provider).toBeDefined();
      expect(integration.status).toBeDefined();
    });

    it("should create mock GEO score history", () => {
      const history = createMockGeoScoreHistory();

      expect(history.id).toBeDefined();
      expect(history.brandId).toBeDefined();
      expect(history.score).toBeDefined();
      expect(history.platformScores).toBeDefined();
    });

    it("should generate unique IDs", () => {
      const brand1 = createMockBrand();
      const brand2 = createMockBrand();

      expect(brand1.id).not.toBe(brand2.id);
    });
  });

  describe("Database Errors", () => {
    it("should create connection error", () => {
      const error = DatabaseErrors.connectionError();

      expect(error.code).toBe("ECONNREFUSED");
      expect(error.message).toContain("Connection refused");
    });

    it("should create unique violation error", () => {
      const error = DatabaseErrors.uniqueViolation("email");

      expect(error.code).toBe("23505");
      expect(error.constraint).toContain("email");
    });

    it("should create foreign key violation error", () => {
      const error = DatabaseErrors.foreignKeyViolation("brands");

      expect(error.code).toBe("23503");
      expect(error.detail).toContain("brands");
    });

    it("should create not null violation error", () => {
      const error = DatabaseErrors.notNullViolation("name");

      expect(error.code).toBe("23502");
      expect(error.message).toContain("name");
    });

    it("should create check constraint violation error", () => {
      const error = DatabaseErrors.checkConstraintViolation("positive_score");

      expect(error.code).toBe("23514");
      expect(error.constraint).toBe("positive_score");
    });

    it("should create timeout error", () => {
      const error = DatabaseErrors.timeout();

      expect(error.code).toBe("57014");
    });
  });

  describe("Database Assertions", () => {
    it("should verify SELECT was called", () => {
      const db = getDb();
      db.select();

      expect(() => dbAssertions.expectSelect()).not.toThrow();
    });

    it("should throw when SELECT was not called", () => {
      resetMocks();

      expect(() => dbAssertions.expectSelect()).toThrow(
        "Expected db.select() to be called"
      );
    });

    it("should verify INSERT was called", () => {
      const db = getDb();
      db.insert(getSchema().brands);

      expect(() => dbAssertions.expectInsert()).not.toThrow();
    });

    it("should verify UPDATE was called", () => {
      const db = getDb();
      db.update(getSchema().brands);

      expect(() => dbAssertions.expectUpdate()).not.toThrow();
    });

    it("should verify DELETE was called", () => {
      const db = getDb();
      db.delete(getSchema().brands);

      expect(() => dbAssertions.expectDelete()).not.toThrow();
    });
  });
});
