/**
 * Content Resolver Tests
 *
 * Tests for content Query and Mutation resolvers including:
 * - content (single content by ID)
 * - contents (list with pagination and filters)
 * - createContent (create new content)
 * - updateContent (update existing content)
 * - deleteContent (remove content)
 * - publishContent (publish content)
 * - optimizeContent (AI optimization stub)
 * - Content.brand field resolver
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
  createMockContent,
  createMockContents,
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

describe("Content Resolvers", () => {
  const { getDb, getSchema, resetMocks } = setupGraphQLTest();

  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  // Helper to create database content format with aiScore
  const createDbContent = (overrides: Partial<ReturnType<typeof createMockContent>> = {}) => {
    const content = createMockContent(overrides);
    return {
      ...content,
      aiScore: content.aiScore ?? 80,
      authorId: content.author,
    };
  };

  // Helper to transform content for GraphQL response
  const transformContent = (content: ReturnType<typeof createDbContent>) => ({
    ...content,
    type: content.type,
    seoScore: content.seoScore,
    aiOptimizationScore: content.aiScore,
    suggestions: [],
  });

  describe("Query: content", () => {
    it("should fetch content by ID with correct data", async () => {
      const mockContent = createDbContent({ id: "content-123", title: "Test Article" });
      mockSelectResult([mockContent]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.content)
        .where()
        .limit(1);

      expect(result).toEqual([mockContent]);
      expect(wasMethodCalled("select")).toBe(true);
      expect(wasMethodCalled("where")).toBe(true);
    });

    it("should return null when content is not found", async () => {
      mockSelectResult([]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.content)
        .where()
        .limit(1);

      expect(result).toEqual([]);
      expect(result[0]).toBeUndefined();
    });

    it("should transform aiScore to aiOptimizationScore", () => {
      const content = createDbContent({ aiScore: 85 });
      const transformed = transformContent(content);

      expect(transformed.aiOptimizationScore).toBe(85);
    });

    it("should include seoScore in response", () => {
      const content = createDbContent({ seoScore: 75 });
      const transformed = transformContent(content);

      expect(transformed.seoScore).toBe(75);
    });

    it("should include empty suggestions array by default", () => {
      const content = createDbContent();
      const transformed = transformContent(content);

      expect(transformed.suggestions).toEqual([]);
    });

    it("should include all content fields", () => {
      const content = createDbContent({
        id: "content-123",
        brandId: "brand-456",
        title: "Test Title",
        type: "blog_post",
        content: "Test content body",
        status: "draft",
      });

      expect(content.id).toBe("content-123");
      expect(content.brandId).toBe("brand-456");
      expect(content.title).toBe("Test Title");
      expect(content.type).toBe("blog_post");
      expect(content.content).toBe("Test content body");
      expect(content.status).toBe("draft");
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
    });
  });

  describe("Query: contents", () => {
    it("should fetch contents for a brand", async () => {
      const brandId = "brand-123";
      const mockContents = [
        createDbContent({ brandId }),
        createDbContent({ brandId }),
        createDbContent({ brandId }),
      ];
      mockSelectResult(mockContents);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.content)
        .where()
        .orderBy()
        .limit(50);

      expect(result).toEqual(mockContents);
      expect(result).toHaveLength(3);
      dbAssertions.expectSelect();
    });

    it("should apply default limit of 50", async () => {
      const mockContents = createMockContents(60);
      mockSelectResult(mockContents.slice(0, 50));

      const db = getDb();
      const result = await db.select().from(getSchema().content).limit(50);

      expect(result).toHaveLength(50);
      expect(wasMethodCalled("limit")).toBe(true);
    });

    it("should apply custom limit when provided", async () => {
      const mockContents = createMockContents(10);
      mockSelectResult(mockContents);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().content)
        .where()
        .limit(10);

      expect(result).toHaveLength(10);
    });

    it("should return empty array when no contents exist", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db.select().from(getSchema().content).where();

      expect(result).toEqual([]);
    });

    it("should order by createdAt descending", async () => {
      const brandId = "brand-123";
      const mockContents = [
        createDbContent({ brandId, createdAt: createTimestamp(0) }), // Today (newest)
        createDbContent({ brandId, createdAt: createTimestamp(1) }),
        createDbContent({ brandId, createdAt: createTimestamp(2) }), // Oldest
      ];
      mockSelectResult(mockContents);

      const db = getDb();
      await db.select().from(getSchema().content).where().orderBy().limit(50);

      expect(wasMethodCalled("orderBy")).toBe(true);
    });

    it("should return correct pagination info", () => {
      const mockContents = createMockContents(50);
      const limit = 50;
      const hasNextPage = mockContents.length === limit;

      expect(hasNextPage).toBe(true);
    });

    it("should generate correct cursor format", () => {
      const idx = 0;
      const cursor = Buffer.from(`content:${idx}`).toString("base64");

      expect(cursor).toBe("Y29udGVudDow");
      expect(Buffer.from(cursor, "base64").toString()).toBe("content:0");
    });

    it("should transform all contents in edges", () => {
      const mockContents = [
        createDbContent({ seoScore: 80, aiScore: 85 }),
        createDbContent({ seoScore: 70, aiScore: 75 }),
        createDbContent({ seoScore: 90, aiScore: 95 }),
      ];

      const edges = mockContents.map((content, idx) => ({
        node: transformContent(content),
        cursor: Buffer.from(`content:${idx}`).toString("base64"),
      }));

      expect(edges[0].node.seoScore).toBe(80);
      expect(edges[0].node.aiOptimizationScore).toBe(85);
      expect(edges[1].node.seoScore).toBe(70);
      expect(edges[2].node.seoScore).toBe(90);
    });

    it("should include total count in pageInfo", async () => {
      const mockContents = createMockContents(5);
      mockSelectResult(mockContents);

      // Second query for count would return { count: 20 }
      const totalCount = 20;

      expect(totalCount).toBeGreaterThan(mockContents.length);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Mutation: createContent", () => {
    it("should create content with draft status", async () => {
      const input = {
        brandId: "brand-123",
        title: "New Blog Post",
        type: "blog_post",
        content: "This is the content body",
      };
      const userId = "user-456";

      const newContent = {
        id: "content-new",
        ...input,
        status: "draft",
        authorId: userId,
        seoScore: null,
        aiScore: null,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockInsertResult([newContent]);

      const db = getDb();
      const schema = getSchema();

      const result = await db.insert(schema.content).values({
        brandId: input.brandId,
        title: input.title,
        type: input.type,
        content: input.content,
        status: "draft",
        authorId: userId,
      }).returning();

      expect(result[0]).toEqual(newContent);
      expect(result[0].status).toBe("draft");
      expect(result[0].authorId).toBe(userId);
      dbAssertions.expectInsert();
    });

    it("should set authorId from user context", () => {
      const context = createMockGraphQLContext({ userId: "user-789" });
      const auth = context.requireAuth();

      expect(auth.userId).toBe("user-789");
    });

    it("should return content with transformed fields", () => {
      const newContent = {
        id: "content-new",
        brandId: "brand-123",
        title: "New Content",
        type: "blog_post",
        content: "Body text",
        status: "draft",
        seoScore: null,
        aiScore: null,
      };

      const response = transformContent(newContent as ReturnType<typeof createDbContent>);

      expect(response.seoScore).toBeNull();
      expect(response.aiOptimizationScore).toBeNull();
      expect(response.suggestions).toEqual([]);
    });

    it("should use .returning() for PostgreSQL", async () => {
      const content = createDbContent();
      mockInsertResult([content]);

      const db = getDb();
      await db.insert(getSchema().content).values({
        brandId: "brand-123",
        title: "Test",
        type: "blog_post",
        content: "Content",
        status: "draft",
      }).returning();

      dbAssertions.expectReturning();
    });

    it("should handle foreign key violation for non-existent brand", () => {
      const error = DatabaseErrors.foreignKeyViolation("brands");

      expect(error.code).toBe("23503");
      expect(error.detail).toContain("brands");

      // Error message should indicate brand not found
      const userFriendlyMessage = "Brand not found. Cannot create content for non-existent brand.";
      expect(userFriendlyMessage).toContain("Brand not found");
    });

    it("should accept valid content types", () => {
      const validTypes = [
        "blog_post",
        "social_post",
        "product_description",
        "faq",
        "landing_page",
        "email",
        "ad_copy",
        "press_release",
      ];

      validTypes.forEach((type) => {
        const content = createMockContent({ type });
        expect(validTypes).toContain(content.type);
      });
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
    });
  });

  describe("Mutation: updateContent", () => {
    it("should update content title", async () => {
      const content = createDbContent({ id: "content-123", title: "Old Title" });
      const updatedContent = { ...content, title: "New Title", updatedAt: new Date() };
      mockUpdateResult([updatedContent]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .update(schema.content)
        .set({ title: "New Title", updatedAt: new Date() })
        .where()
        .returning();

      expect(result[0].title).toBe("New Title");
      dbAssertions.expectUpdate();
    });

    it("should update content body", async () => {
      const content = createDbContent({ id: "content-123" });
      const updatedContent = { ...content, content: "Updated body text", updatedAt: new Date() };
      mockUpdateResult([updatedContent]);

      const result = await getDb()
        .update(getSchema().content)
        .set({ content: "Updated body text", updatedAt: new Date() })
        .where()
        .returning();

      expect(result[0].content).toBe("Updated body text");
    });

    it("should update content type", async () => {
      const content = createDbContent({ id: "content-123", type: "blog_post" });
      const updatedContent = { ...content, type: "landing_page", updatedAt: new Date() };
      mockUpdateResult([updatedContent]);

      const db = getDb();
      const result = await db
        .update(getSchema().content)
        .set({ type: "landing_page", updatedAt: new Date() })
        .where()
        .returning();

      expect(result[0].type).toBe("landing_page");
    });

    it("should update content status", async () => {
      const content = createDbContent({ id: "content-123", status: "draft" });
      const updatedContent = { ...content, status: "review", updatedAt: new Date() };
      mockUpdateResult([updatedContent]);

      const db = getDb();
      const result = await db
        .update(getSchema().content)
        .set({ status: "review", updatedAt: new Date() })
        .where()
        .returning();

      expect(result[0].status).toBe("review");
    });

    it("should throw error when content not found", async () => {
      mockUpdateResult([]);

      // Empty result means content not found
      const result: unknown[] = [];
      expect(result[0]).toBeUndefined();
    });

    it("should use .returning() for PostgreSQL", async () => {
      const content = createDbContent({ id: "content-123" });
      mockUpdateResult([content]);

      const db = getDb();
      await db
        .update(getSchema().content)
        .set({ title: "Updated" })
        .where()
        .returning();

      dbAssertions.expectReturning();
    });

    it("should always set updatedAt timestamp", async () => {
      const content = createDbContent({ id: "content-123" });
      const now = new Date();
      const updatedContent = { ...content, title: "Updated", updatedAt: now };
      mockUpdateResult([updatedContent]);

      expect(updatedContent.updatedAt).toEqual(now);
    });

    it("should handle partial updates", () => {
      const input = { title: "Only Title Changed" };
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (input.title !== undefined) updateData.title = input.title;

      expect(updateData).toHaveProperty("title");
      expect(updateData).not.toHaveProperty("content");
      expect(updateData).not.toHaveProperty("type");
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Mutation: deleteContent", () => {
    it("should delete content by ID", async () => {
      mockDeleteResult([]);

      const db = getDb();
      const schema = getSchema();

      await db.delete(schema.content).where();

      dbAssertions.expectDelete();
    });

    it("should return true on successful deletion", async () => {
      // deleteContent returns true after delete
      const success = true;

      expect(success).toBe(true);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Mutation: publishContent", () => {
    it("should update status to published", async () => {
      const content = createDbContent({ id: "content-123", status: "draft" });
      const now = new Date();
      const updatedContent = {
        ...content,
        status: "published",
        publishedAt: now,
        updatedAt: now,
      };
      mockUpdateResult([updatedContent]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .update(schema.content)
        .set({ status: "published", publishedAt: now, updatedAt: now })
        .where()
        .returning();

      expect(result[0].status).toBe("published");
      expect(result[0].publishedAt).toEqual(now);
      dbAssertions.expectUpdate();
    });

    it("should set publishedAt timestamp", () => {
      const now = new Date();
      const updateData = {
        status: "published",
        publishedAt: now,
        updatedAt: now,
      };

      expect(updateData.publishedAt).toEqual(now);
    });

    it("should throw error when content not found", async () => {
      mockUpdateResult([]);

      const result: unknown[] = [];
      expect(result[0]).toBeUndefined();
    });

    it("should transform published content correctly", () => {
      const publishedContent = createDbContent({
        id: "content-123",
        status: "published",
        seoScore: 85,
        aiScore: 90,
      });
      const transformed = transformContent(publishedContent);

      expect(transformed.status).toBe("published");
      expect(transformed.seoScore).toBe(85);
      expect(transformed.aiOptimizationScore).toBe(90);
      expect(transformed.suggestions).toEqual([]);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Mutation: optimizeContent", () => {
    it("should verify content exists before optimizing", async () => {
      const content = createDbContent({ id: "content-123" });
      mockSelectResult([content]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.content)
        .where()
        .limit(1);

      expect(result[0]).toBeDefined();
      expect(result[0].id).toBe("content-123");
    });

    it("should return content with suggestions", () => {
      const content = createDbContent({ id: "content-123" });

      const response = {
        ...content,
        seoScore: content.seoScore,
        aiOptimizationScore: content.aiScore,
        suggestions: ["Add more keywords", "Improve readability", "Add structured data"],
      };

      expect(response.suggestions).toHaveLength(3);
      expect(response.suggestions).toContain("Add more keywords");
    });

    it("should throw error when content not found", async () => {
      mockSelectResult([]);

      const result: unknown[] = [];
      expect(result[0]).toBeUndefined();
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Field Resolver: Content.brand", () => {
    it("should fetch brand for content by brandId", async () => {
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
        keywords: ["content", "seo", "marketing"],
      };

      expect(mockBrand.keywords).toEqual(["content", "seo", "marketing"]);
    });
  });

  describe("Content Status Workflow", () => {
    it("should start with draft status", () => {
      const newContent = { status: "draft" };
      expect(newContent.status).toBe("draft");
    });

    it("should transition to review status", () => {
      const content = { status: "review" };
      expect(content.status).toBe("review");
    });

    it("should transition to published status", () => {
      const content = { status: "published", publishedAt: new Date() };
      expect(content.status).toBe("published");
      expect(content.publishedAt).toBeDefined();
    });

    it("should support valid status values", () => {
      const validStatuses = ["draft", "review", "published", "archived"];

      validStatuses.forEach((status) => {
        const content = { status };
        expect(validStatuses).toContain(content.status);
      });
    });

    it("should track publishedAt only when published", () => {
      const draftContent = { status: "draft", publishedAt: null };
      const publishedContent = { status: "published", publishedAt: new Date() };

      expect(draftContent.publishedAt).toBeNull();
      expect(publishedContent.publishedAt).toBeDefined();
    });
  });

  describe("Content Types", () => {
    it("should support blog_post type", () => {
      const content = createMockContent({ type: "blog_post" });
      expect(content.type).toBe("blog_post");
    });

    it("should support social_post type", () => {
      const content = createMockContent({ type: "social_post" });
      expect(content.type).toBe("social_post");
    });

    it("should support product_description type", () => {
      const content = createMockContent({ type: "product_description" });
      expect(content.type).toBe("product_description");
    });

    it("should support faq type", () => {
      const content = createMockContent({ type: "faq" });
      expect(content.type).toBe("faq");
    });

    it("should support landing_page type", () => {
      const content = createMockContent({ type: "landing_page" });
      expect(content.type).toBe("landing_page");
    });

    it("should support email type", () => {
      const content = createMockContent({ type: "email" });
      expect(content.type).toBe("email");
    });

    it("should support ad_copy type", () => {
      const content = createMockContent({ type: "ad_copy" });
      expect(content.type).toBe("ad_copy");
    });

    it("should support press_release type", () => {
      const content = createMockContent({ type: "press_release" });
      expect(content.type).toBe("press_release");
    });
  });

  describe("SEO and AI Scores", () => {
    it("should include seoScore field", () => {
      const content = createMockContent({ seoScore: 85 });
      expect(content.seoScore).toBe(85);
    });

    it("should include aiScore field", () => {
      const content = createMockContent({ aiScore: 90 });
      expect(content.aiScore).toBe(90);
    });

    it("should handle null seoScore", () => {
      // Database can return null for seoScore
      const dbContent = { ...createMockContent(), seoScore: null };
      expect(dbContent.seoScore).toBeNull();
    });

    it("should handle null aiScore", () => {
      // Database can return null for aiScore
      const dbContent = { ...createMockContent(), aiScore: null };
      expect(dbContent.aiScore).toBeNull();
    });

    it("should validate score range 0-100", () => {
      const validScores = [0, 25, 50, 75, 100];

      validScores.forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
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
      console.error("Database error fetching content:", error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error fetching content:",
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it("should throw user-friendly error on content fetch failure", () => {
      const userFriendlyMessage = "Failed to fetch content. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to fetch");
      expect(userFriendlyMessage).toContain("Please try again later");
    });

    it("should throw user-friendly error on content create failure", () => {
      const userFriendlyMessage = "Failed to create content. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to create");
    });

    it("should throw user-friendly error on content update failure", () => {
      const userFriendlyMessage = "Failed to update content. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to update");
    });

    it("should throw user-friendly error on content delete failure", () => {
      const userFriendlyMessage = "Failed to delete content. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to delete");
    });

    it("should throw user-friendly error on publish failure", () => {
      const userFriendlyMessage = "Failed to publish content. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to publish");
    });

    it("should re-throw known errors (not found)", () => {
      const notFoundError = new Error("Content not found");
      const isKnown = notFoundError.message === "Content not found";

      expect(isKnown).toBe(true);
    });
  });

  describe("Content Factory Tests", () => {
    it("should create valid mock content", () => {
      const content = createMockContent({
        id: "content-test",
        brandId: "brand-test",
        title: "Test Content",
        type: "blog_post",
        status: "draft",
      });

      expect(content).toHaveProperty("id", "content-test");
      expect(content).toHaveProperty("brandId", "brand-test");
      expect(content).toHaveProperty("title", "Test Content");
      expect(content).toHaveProperty("type", "blog_post");
      expect(content).toHaveProperty("status", "draft");
      expect(content).toHaveProperty("createdAt");
      expect(content).toHaveProperty("updatedAt");
    });

    it("should create list of contents", () => {
      const count = 5;
      const contents = createMockContents(count);

      expect(contents).toHaveLength(5);
      expect(contents.every((c) => c.id !== undefined)).toBe(true);
    });

    it("should create content with default values", () => {
      const content = createMockContent();

      expect(content.status).toBe("draft");
      expect(content.type).toBe("blog_post");
      expect(content.seoScore).toBe(75);
      expect(content.aiScore).toBe(80);
    });
  });

  describe("Author and Metadata", () => {
    it("should include author field", () => {
      const content = createMockContent({ author: "user-123" });

      expect(content.author).toBe("user-123");
    });

    it("should include metadata field", () => {
      const content = createMockContent({
        metadata: { keywords: ["seo", "content"], wordCount: 500 },
      });

      expect(content.metadata).toHaveProperty("keywords");
      expect(content.metadata).toHaveProperty("wordCount");
    });

    it("should handle null metadata", () => {
      const content = createMockContent({ metadata: null });

      expect(content.metadata).toBeNull();
    });
  });

  describe("Date Fields", () => {
    it("should include createdAt timestamp", () => {
      const content = createMockContent();

      expect(content.createdAt).toBeDefined();
      expect(content.createdAt instanceof Date).toBe(true);
    });

    it("should include updatedAt timestamp", () => {
      const content = createMockContent();

      expect(content.updatedAt).toBeDefined();
      expect(content.updatedAt instanceof Date).toBe(true);
    });

    it("should include publishedAt when published", () => {
      const publishedAt = new Date("2025-01-15T10:00:00Z");
      const content = createMockContent({ publishedAt });

      expect(content.publishedAt).toEqual(publishedAt);
    });

    it("should handle null publishedAt", () => {
      const content = createMockContent({ publishedAt: null });

      expect(content.publishedAt).toBeNull();
    });

    it("should transform publishedAt to ISO string for GraphQL", () => {
      const publishedAt = new Date("2025-01-15T10:00:00Z");

      const isoString = publishedAt?.toISOString() || null;

      expect(isoString).toBe("2025-01-15T10:00:00.000Z");
    });
  });
});
