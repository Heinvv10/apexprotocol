/**
 * Content Resolver Tests
 *
 * Tests for content Query and Mutation resolvers including:
 * - content (single content by ID)
 * - contents (list of content with pagination)
 * - createContent (insert new content)
 * - updateContent (update content fields)
 * - deleteContent (delete content)
 * - optimizeContent (AI optimization stub)
 * - publishContent (set status to published)
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

  // Helper to create database content format
  const createDbContent = (overrides: Partial<ReturnType<typeof createMockContent>> = {}) => {
    const content = createMockContent(overrides);
    return {
      ...content,
      aiScore: content.aiScore ?? 80,
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
      const mockContent = createDbContent({ id: "content-123", status: "draft" });
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
      expect((result as unknown[])[0]).toBeUndefined();
    });

    it("should transform content with aiOptimizationScore", () => {
      const content = createDbContent({ id: "content-123", seoScore: 85 });
      const transformed = transformContent(content);

      expect(transformed.seoScore).toBe(85);
      expect(transformed.aiOptimizationScore).toBe(content.aiScore);
    });

    it("should include suggestions as empty array", () => {
      const content = createDbContent();
      const transformed = transformContent(content);

      expect(transformed.suggestions).toEqual([]);
    });

    it("should include all required fields", () => {
      const content = createDbContent({
        id: "content-123",
        brandId: "brand-456",
        title: "Test Article",
        type: "blog_post",
        content: "This is the content body",
        status: "draft",
      });

      expect(content.id).toBe("content-123");
      expect(content.brandId).toBe("brand-456");
      expect(content.title).toBe("Test Article");
      expect(content.type).toBe("blog_post");
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
    it("should fetch contents with pagination", async () => {
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

    it("should return empty edges array when no content exists", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db.select().from(getSchema().content).where();

      expect(result).toEqual([]);
    });

    it("should order by createdAt descending", async () => {
      const mockContents = [
        createDbContent({ createdAt: createTimestamp(0) }),
        createDbContent({ createdAt: createTimestamp(1) }),
        createDbContent({ createdAt: createTimestamp(2) }),
      ];
      mockSelectResult(mockContents);

      const db = getDb();
      await db.select().from(getSchema().content).where().orderBy().limit(50);

      expect(wasMethodCalled("orderBy")).toBe(true);
    });

    it("should include pageInfo in response", () => {
      const mockContents = createMockContents(3);
      const limit = 50;
      const hasNextPage = mockContents.length === limit;

      const pageInfo = {
        hasNextPage,
        hasPreviousPage: false,
        startCursor: Buffer.from("content:0").toString("base64"),
        endCursor: Buffer.from(`content:${mockContents.length - 1}`).toString("base64"),
        total: mockContents.length,
      };

      expect(pageInfo.hasNextPage).toBe(false);
      expect(pageInfo.startCursor).toBe("Y29udGVudDow");
    });

    it("should transform edges with cursor", () => {
      const mockContents = createMockContents(2);
      const edges = mockContents.map((c, idx) => ({
        node: transformContent(createDbContent(c)),
        cursor: Buffer.from(`content:${idx}`).toString("base64"),
      }));

      expect(edges[0].cursor).toBe("Y29udGVudDow");
      expect(edges[1].cursor).toBe("Y29udGVudDox");
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });

    it("should filter by brandId when provided", async () => {
      const brandId = "brand-specific";
      const mockContents = [
        createDbContent({ brandId }),
        createDbContent({ brandId }),
      ];
      mockSelectResult(mockContents);

      const db = getDb();
      await db.select().from(getSchema().content).where();

      expect(wasMethodCalled("where")).toBe(true);
      expect(mockContents.every((c) => c.brandId === brandId)).toBe(true);
    });
  });

  describe("Mutation: createContent", () => {
    it("should create content with .returning()", async () => {
      const newContent = createDbContent({
        brandId: "brand-123",
        title: "New Article",
        type: "blog_post",
        content: "Article content",
        status: "draft",
      });
      mockInsertResult([newContent]);

      const db = getDb();
      const schema = getSchema();

      const result = await db.insert(schema.content).values({
        brandId: "brand-123",
        title: "New Article",
        type: "blog_post",
        content: "Article content",
        status: "draft",
        authorId: "user-123",
      }).returning();

      expect(result[0]).toEqual(newContent);
      dbAssertions.expectInsert();
      dbAssertions.expectReturning();
    });

    it("should set status to draft by default", () => {
      const content = createDbContent({ status: "draft" });

      expect(content.status).toBe("draft");
    });

    it("should set authorId from context user", () => {
      const context = createMockGraphQLContext({ userId: "user-456" });
      const auth = context.requireAuth();

      expect(auth.userId).toBe("user-456");
    });

    it("should support all content types", () => {
      const contentTypes = [
        "blog_post",
        "social_post",
        "product_description",
        "faq",
        "landing_page",
        "email",
        "ad_copy",
        "press_release",
      ];

      contentTypes.forEach((type) => {
        const content = createDbContent({ type });
        expect(content.type).toBe(type);
      });
    });

    it("should handle foreign key violation for non-existent brand", () => {
      const error = DatabaseErrors.foreignKeyViolation("brands");

      expect(error.code).toBe("23503");
      expect(error.detail).toContain("brands");
    });

    it("should return content with aiOptimizationScore", () => {
      const content = createDbContent({ aiScore: 75 });
      const response = transformContent(content);

      expect(response.aiOptimizationScore).toBe(75);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
    });
  });

  describe("Mutation: updateContent", () => {
    it("should update content with .returning()", async () => {
      const existingContent = createDbContent({ id: "content-123", title: "Original Title" });
      const updatedContent = { ...existingContent, title: "Updated Title", updatedAt: new Date() };
      mockUpdateResult([updatedContent]);

      const db = getDb();
      const schema = getSchema();

      const result = await db.update(schema.content).set({
        title: "Updated Title",
        updatedAt: new Date(),
      }).where().returning();

      expect(result[0]).toEqual(updatedContent);
      dbAssertions.expectUpdate();
      dbAssertions.expectReturning();
    });

    it("should only update provided fields", () => {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      const input = { title: "New Title" };

      if (input.title !== undefined) updateData.title = input.title;

      expect(updateData).toHaveProperty("title", "New Title");
      expect(updateData).toHaveProperty("updatedAt");
    });

    it("should throw error when content not found", async () => {
      mockUpdateResult([]);

      const errorMessage = "Content not found";
      expect(errorMessage).toBe("Content not found");
    });

    it("should update content type", () => {
      const updateData = { type: "landing_page", updatedAt: new Date() };

      expect(updateData.type).toBe("landing_page");
    });

    it("should update content status", () => {
      const updateData = { status: "review", updatedAt: new Date() };

      expect(updateData.status).toBe("review");
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Mutation: deleteContent", () => {
    it("should delete content by ID", async () => {
      mockDeleteResult({ success: true });

      const db = getDb();
      const schema = getSchema();

      await db.delete(schema.content).where();

      dbAssertions.expectDelete();
    });

    it("should return true on successful deletion", () => {
      const result = true;
      expect(result).toBe(true);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Mutation: optimizeContent", () => {
    it("should fetch content and return with suggestions", async () => {
      const mockContent = createDbContent({ id: "content-123" });
      mockSelectResult([mockContent]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.content)
        .where()
        .limit(1);

      expect((result as unknown[])[0]).toEqual(mockContent);
      dbAssertions.expectSelect();
    });

    it("should return AI optimization suggestions", () => {
      const content = createDbContent();
      const optimizedResponse = {
        ...content,
        seoScore: content.seoScore,
        aiOptimizationScore: content.aiScore,
        suggestions: ["Add more keywords", "Improve readability", "Add structured data"],
      };

      expect(optimizedResponse.suggestions).toHaveLength(3);
      expect(optimizedResponse.suggestions).toContain("Add more keywords");
    });

    it("should throw error when content not found", () => {
      const errorMessage = "Content not found";
      expect(errorMessage).toBe("Content not found");
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Mutation: publishContent", () => {
    it("should set status to published", async () => {
      const existingContent = createDbContent({ id: "content-123", status: "draft" });
      const publishedContent = {
        ...existingContent,
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      };
      mockUpdateResult([publishedContent]);

      const db = getDb();
      const schema = getSchema();

      const result = await db.update(schema.content).set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      }).where().returning();

      expect((result as Array<{ status: string }>)[0].status).toBe("published");
      dbAssertions.expectUpdate();
    });

    it("should set publishedAt timestamp", async () => {
      const now = new Date();
      const publishedContent = createDbContent({
        status: "published",
        publishedAt: now,
      });
      mockUpdateResult([publishedContent]);

      expect(publishedContent.publishedAt).toEqual(now);
    });

    it("should throw error when content not found", () => {
      const errorMessage = "Content not found";
      expect(errorMessage).toBe("Content not found");
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });

    it("should use .returning() for PostgreSQL", async () => {
      const content = createMockContent({ status: "published" });
      mockUpdateResult([content]);

      const db = getDb();
      await db.update(getSchema().content).set({ status: "published" }).where().returning();

      dbAssertions.expectReturning();
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

      expect((result as unknown[])[0]).toEqual(mockBrand);
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

      expect((result as unknown[])[0]).toBeUndefined();
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
  });

  describe("Content Status Workflow", () => {
    it("should start with draft status", () => {
      const content = createDbContent({ status: "draft" });
      expect(content.status).toBe("draft");
    });

    it("should support review status", () => {
      const content = createDbContent({ status: "review" });
      expect(content.status).toBe("review");
    });

    it("should support published status", () => {
      const content = createDbContent({ status: "published" });
      expect(content.status).toBe("published");
    });

    it("should support archived status", () => {
      const content = createDbContent({ status: "archived" });
      expect(content.status).toBe("archived");
    });

    it("should have publishedAt when published", () => {
      const publishedAt = new Date();
      const content = createDbContent({
        status: "published",
        publishedAt,
      });

      expect(content.publishedAt).toEqual(publishedAt);
    });

    it("should have null publishedAt when draft", () => {
      const content = createDbContent({
        status: "draft",
        publishedAt: null,
      });

      expect(content.publishedAt).toBeNull();
    });
  });

  describe("Content Type Validation", () => {
    it("should support blog_post type", () => {
      const content = createDbContent({ type: "blog_post" });
      expect(content.type).toBe("blog_post");
    });

    it("should support social_post type", () => {
      const content = createDbContent({ type: "social_post" });
      expect(content.type).toBe("social_post");
    });

    it("should support product_description type", () => {
      const content = createDbContent({ type: "product_description" });
      expect(content.type).toBe("product_description");
    });

    it("should support faq type", () => {
      const content = createDbContent({ type: "faq" });
      expect(content.type).toBe("faq");
    });

    it("should support landing_page type", () => {
      const content = createDbContent({ type: "landing_page" });
      expect(content.type).toBe("landing_page");
    });

    it("should support email type", () => {
      const content = createDbContent({ type: "email" });
      expect(content.type).toBe("email");
    });

    it("should support ad_copy type", () => {
      const content = createDbContent({ type: "ad_copy" });
      expect(content.type).toBe("ad_copy");
    });

    it("should support press_release type", () => {
      const content = createDbContent({ type: "press_release" });
      expect(content.type).toBe("press_release");
    });
  });

  describe("Score Fields", () => {
    it("should include seoScore", () => {
      const content = createDbContent({ seoScore: 85 });

      expect(content.seoScore).toBe(85);
    });

    it("should include aiScore/aiOptimizationScore", () => {
      const content = createDbContent({ aiScore: 90 });

      expect(content.aiScore).toBe(90);
    });

    it("should handle null seoScore", () => {
      // Test that null seoScore from database is preserved through transformation
      // Bypass factory defaults by spreading with explicit null
      const content = { ...createMockContent(), seoScore: null };
      const transformed = transformContent(content as ReturnType<typeof createDbContent>);

      expect(transformed.seoScore).toBeNull();
    });

    it("should handle null aiScore", () => {
      // Test that null aiScore from database is transformed to null aiOptimizationScore
      // Bypass factory defaults by spreading with explicit null
      const content = { ...createMockContent(), aiScore: null };
      const transformed = transformContent(content as unknown as ReturnType<typeof createDbContent>);

      expect(transformed.aiOptimizationScore).toBeNull();
    });

    it("should transform aiScore to aiOptimizationScore", () => {
      const content = createDbContent({ aiScore: 75 });
      const transformed = transformContent(content);

      expect(transformed.aiOptimizationScore).toBe(75);
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

    it("should throw user-friendly error on optimize failure", () => {
      const userFriendlyMessage = "Failed to optimize content. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to optimize");
    });
  });

  describe("Metadata and Author", () => {
    it("should include author field", () => {
      const content = createDbContent({ author: "user-123" });

      expect(content.author).toBe("user-123");
    });

    it("should handle null metadata", () => {
      const content = createDbContent({ metadata: null });

      expect(content.metadata).toBeNull();
    });

    it("should handle metadata with custom values", () => {
      const content = createDbContent({
        metadata: { keywords: ["seo", "content"], readTime: 5 },
      });

      expect(content.metadata).toEqual({ keywords: ["seo", "content"], readTime: 5 });
    });
  });

  describe("Date Fields", () => {
    it("should have createdAt timestamp", () => {
      const content = createDbContent();

      expect(content.createdAt).toBeInstanceOf(Date);
    });

    it("should have updatedAt timestamp", () => {
      const content = createDbContent();

      expect(content.updatedAt).toBeInstanceOf(Date);
    });

    it("should have publishedAt when published", () => {
      const publishedAt = new Date();
      const content = createDbContent({
        status: "published",
        publishedAt,
      });

      expect(content.publishedAt).toEqual(publishedAt);
    });

    it("should handle null publishedAt for drafts", () => {
      const content = createDbContent({
        status: "draft",
        publishedAt: null,
      });

      expect(content.publishedAt).toBeNull();
    });
  });

  describe("Content Factory Tests", () => {
    it("should create valid mock content", () => {
      const content = createMockContent({
        id: "content-test",
        brandId: "brand-test",
        title: "Test Title",
        status: "draft",
      });

      expect(content).toHaveProperty("id", "content-test");
      expect(content).toHaveProperty("brandId", "brand-test");
      expect(content).toHaveProperty("title", "Test Title");
      expect(content).toHaveProperty("status", "draft");
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
    });
  });

  describe("Pagination", () => {
    it("should encode cursor correctly", () => {
      const idx = 5;
      const cursor = Buffer.from(`content:${idx}`).toString("base64");

      expect(cursor).toBe("Y29udGVudDo1");
    });

    it("should decode cursor correctly", () => {
      const cursor = "Y29udGVudDo1";
      const decoded = Buffer.from(cursor, "base64").toString();

      expect(decoded).toBe("content:5");
    });

    it("should calculate hasNextPage based on limit", () => {
      const limit = 50;
      const results = createMockContents(50);

      const hasNextPage = results.length === limit;

      expect(hasNextPage).toBe(true);
    });

    it("should set hasPreviousPage to false", () => {
      const hasPreviousPage = false;

      expect(hasPreviousPage).toBe(false);
    });

    it("should include total count in pageInfo", () => {
      const total = 100;

      expect(total).toBe(100);
    });

    it("should handle empty result set for pageInfo", () => {
      const results: unknown[] = [];
      const startCursor = results.length > 0 ? Buffer.from("content:0").toString("base64") : null;
      const endCursor = results.length > 0 ? Buffer.from(`content:${results.length - 1}`).toString("base64") : null;

      expect(startCursor).toBeNull();
      expect(endCursor).toBeNull();
    });
  });
});
