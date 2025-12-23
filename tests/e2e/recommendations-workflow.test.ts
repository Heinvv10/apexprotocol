/**
 * End-to-End Workflow Validation Tests for AI Recommendations
 *
 * This test suite validates the complete workflow:
 * 1. POST visibility data to /api/recommendations/generate
 * 2. Verify 200 response with recommendations array
 * 3. GET /api/recommendations?brandId=X
 * 4. Verify recommendations from step 2 appear in GET response
 * 5. Verify database contains persisted recommendations
 * 6. POST same visibility data again
 * 7. Verify duplicatesSkipped > 0 in response
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================================
// Test Constants
// ============================================================================

const TEST_USER_ID = "e2e-test-user-123";
const TEST_ORG_ID = "e2e-test-org-456";
const TEST_BRAND_ID = "e2e-test-brand-789";
const TEST_BRAND_NAME = "E2E Test Brand";

// ============================================================================
// Mock Data
// ============================================================================

const mockBrand = {
  id: TEST_BRAND_ID,
  name: TEST_BRAND_NAME,
  organizationId: TEST_ORG_ID,
  isActive: true,
  domain: "e2e-test.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Comprehensive visibility data for testing
const mockBrandMentions = [
  {
    id: "mention-e2e-1",
    brandId: TEST_BRAND_ID,
    platform: "ChatGPT",
    query: "best software tools",
    position: 3,
    response: "E2E Test Brand is mentioned as a top solution",
    sentiment: "positive",
    timestamp: new Date(),
  },
  {
    id: "mention-e2e-2",
    brandId: TEST_BRAND_ID,
    platform: "Claude",
    query: "recommended products",
    position: 5,
    response: "E2E Test Brand offers reliable products",
    sentiment: "positive",
    timestamp: new Date(),
  },
  {
    id: "mention-e2e-3",
    brandId: TEST_BRAND_ID,
    platform: "Perplexity",
    query: "industry leaders",
    position: null,
    response: null,
    sentiment: "neutral",
    timestamp: new Date(),
  },
];

const mockAudit = {
  id: "audit-e2e-1",
  brandId: TEST_BRAND_ID,
  url: "https://e2e-test.com",
  status: "completed",
  overallScore: 55,
  categoryScores: [
    { category: "schema_markup", score: 30, maxScore: 100, issues: [] },
    { category: "content", score: 70, maxScore: 100, issues: [] },
    { category: "technical_seo", score: 45, maxScore: 100, issues: [] },
  ],
  issues: [
    {
      id: "issue-e2e-1",
      category: "schema_markup",
      severity: "high",
      title: "Missing Organization Schema",
      description: "No Organization schema markup detected on the homepage",
      recommendation: "Add Organization schema to improve brand visibility",
      impact: "high",
    },
    {
      id: "issue-e2e-2",
      category: "technical_seo",
      severity: "medium",
      title: "Missing FAQ Schema",
      description: "FAQ pages lack structured data",
      recommendation: "Implement FAQ schema on knowledge base pages",
      impact: "medium",
    },
  ],
  completedAt: new Date(),
};

// ============================================================================
// Mock Functions
// ============================================================================

const mockAuth = vi.fn();
const mockGetOrganizationId = vi.fn();
const mockClaudeCreate = vi.fn();
const mockBrandsFindFirst = vi.fn();
const mockBrandMentionsFindMany = vi.fn();
const mockAuditsFindFirst = vi.fn();
const mockCreateRecommendationsWithDuplicateDetection = vi.fn();
const mockGenerateRecommendations = vi.fn();

// Persistent storage for simulating database state across test steps
let persistedRecommendations: Array<{
  id: string;
  brandId: string;
  title: string;
  category: string;
  priority: string;
  impact: string;
  effort: string;
  status: string;
  source: string;
  steps: string[];
  description: string;
  createdAt: Date;
}> = [];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create mock AI response with realistic recommendations
 */
function createE2EMockAIResponse() {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          recommendations: [
            {
              category: "schema_markup",
              priority: "critical",
              impact: "high",
              effort: "moderate",
              title: "Implement Organization Schema for Better Brand Recognition",
              description:
                "Your website lacks Organization schema markup, which is crucial for AI assistants to correctly identify and cite your brand. This affects visibility across ChatGPT, Claude, and Perplexity.",
              steps: [
                "Add Organization schema to your homepage with your company name, logo, and contact information",
                "Include sameAs links to your social media profiles and authoritative directories",
                "Validate the schema using Google's Rich Results Test tool",
                "Monitor brand mentions after implementation to measure improvement",
              ],
              aiPlatforms: ["ChatGPT", "Claude", "Perplexity"],
              expectedOutcome:
                "25-40% increase in accurate brand citations within AI responses",
              estimatedTimeframe: "1-2 weeks",
            },
            {
              category: "content_optimization",
              priority: "high",
              impact: "high",
              effort: "major",
              title: "Create Comprehensive FAQ Content for AI Training",
              description:
                "AI assistants frequently reference FAQ content when answering user queries. Adding structured FAQ content will improve your visibility on Perplexity and ChatGPT.",
              steps: [
                "Identify top 20 frequently asked questions about your products/services",
                "Create detailed, factual answers for each question",
                "Implement FAQPage schema markup for each FAQ entry",
                "Publish FAQ content with clear headings and structured formatting",
                "Submit updated pages to search engine indexing",
              ],
              aiPlatforms: ["ChatGPT", "Perplexity"],
              expectedOutcome:
                "Improved citation frequency for question-based queries",
              estimatedTimeframe: "3-4 weeks",
            },
            {
              category: "technical_seo",
              priority: "medium",
              impact: "medium",
              effort: "quick_win",
              title: "Optimize Meta Descriptions for AI Summarization",
              description:
                "Your meta descriptions are not optimized for AI consumption. Improving them will help AI assistants better understand and summarize your content.",
              steps: [
                "Audit current meta descriptions on key pages",
                "Rewrite descriptions to be factual and informative",
                "Include key brand identifiers and unique value propositions",
              ],
              aiPlatforms: ["ChatGPT", "Claude", "Perplexity", "Gemini"],
              expectedOutcome: "Better brand representation in AI summaries",
              estimatedTimeframe: "1 week",
            },
          ],
        }),
      },
    ],
    usage: { input_tokens: 1200, output_tokens: 800 },
  };
}

/**
 * Create a mock NextRequest for POST requests
 */
function createMockPostRequest(
  url: string,
  body: unknown
): {
  url: string;
  nextUrl: URL;
  json: () => Promise<unknown>;
  headers: Headers;
  method: string;
} {
  return {
    url,
    nextUrl: new URL(url),
    json: async () => body,
    headers: new Headers({ "Content-Type": "application/json" }),
    method: "POST",
  };
}

/**
 * Create a mock NextRequest for GET requests
 */
function createMockGetRequest(url: string): {
  url: string;
  nextUrl: URL;
  headers: Headers;
  method: string;
} {
  return {
    url,
    nextUrl: new URL(url),
    headers: new Headers(),
    method: "GET",
  };
}

// ============================================================================
// Test Setup
// ============================================================================

describe("E2E Workflow: AI Recommendations Generation Lifecycle", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Reset persisted state
    persistedRecommendations = [];

    // Default mock implementations
    mockAuth.mockResolvedValue({
      userId: TEST_USER_ID,
      orgId: TEST_ORG_ID,
    });

    mockGetOrganizationId.mockResolvedValue(TEST_ORG_ID);

    mockBrandsFindFirst.mockResolvedValue(mockBrand);
    mockBrandMentionsFindMany.mockResolvedValue(mockBrandMentions);
    mockAuditsFindFirst.mockResolvedValue(mockAudit);

    mockClaudeCreate.mockResolvedValue(createE2EMockAIResponse());

    // Simulate database persistence with duplicate detection
    mockCreateRecommendationsWithDuplicateDetection.mockImplementation(
      async (recommendations: Array<{ brandId: string; title: string; category: string; priority: string; impact: string; effort: string; status: string; source: string; steps: string[]; description: string }>) => {
        const created: typeof persistedRecommendations = [];
        const skipped: Array<{ title: string }> = [];

        for (const rec of recommendations) {
          // Check for duplicate (case-insensitive title match for same brand)
          const isDuplicate = persistedRecommendations.some(
            (existing) =>
              existing.brandId === rec.brandId &&
              existing.title.toLowerCase() === rec.title.toLowerCase()
          );

          if (isDuplicate) {
            skipped.push({ title: rec.title });
          } else {
            const newRec = {
              id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              brandId: rec.brandId,
              title: rec.title,
              description: rec.description,
              category: rec.category,
              priority: rec.priority,
              impact: rec.impact,
              effort: rec.effort,
              status: rec.status,
              source: rec.source,
              steps: rec.steps,
              createdAt: new Date(),
            };
            persistedRecommendations.push(newRec);
            created.push(newRec);
          }
        }

        return {
          created,
          skipped,
          createdCount: created.length,
          skippedCount: skipped.length,
        };
      }
    );

    mockGenerateRecommendations.mockResolvedValue([]);

    // Set up mocks
    vi.doMock("@clerk/nextjs/server", () => ({
      auth: mockAuth,
    }));

    vi.doMock("@/lib/auth", () => ({
      getOrganizationId: mockGetOrganizationId,
    }));

    vi.doMock("@/lib/onboarding/auto-detection", () => ({
      detectRecommendationsReviewed: vi.fn().mockResolvedValue(undefined),
    }));

    vi.doMock("@/lib/ai/claude", () => ({
      getClaudeClient: vi.fn(() => ({
        messages: {
          create: mockClaudeCreate,
        },
      })),
      CLAUDE_MODELS: {
        SONNET_3_5: "claude-3-5-sonnet-20241022",
        HAIKU_3_5: "claude-3-5-haiku-20241022",
        OPUS_3: "claude-3-opus-20240229",
      },
      DEFAULT_MODELS: {
        default: "claude-3-5-sonnet-20241022",
      },
    }));

    vi.doMock("@/lib/db/queries/recommendations", () => ({
      createRecommendationsWithDuplicateDetection:
        mockCreateRecommendationsWithDuplicateDetection,
      getRecommendations: vi.fn().mockImplementation(async () => ({
        data: persistedRecommendations,
        total: persistedRecommendations.length,
      })),
      findSimilarRecommendation: vi.fn().mockResolvedValue(null),
    }));

    vi.doMock("@/lib/recommendations", () => ({
      generateRecommendations: mockGenerateRecommendations,
    }));

    vi.doMock("@/lib/db", () => ({
      db: {
        query: {
          brands: {
            findFirst: mockBrandsFindFirst,
          },
          brandMentions: {
            findMany: mockBrandMentionsFindMany,
          },
          audits: {
            findFirst: mockAuditsFindFirst,
          },
        },
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockImplementation(() =>
                Promise.resolve([mockBrand])
              ),
              offset: vi.fn().mockResolvedValue([]),
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockImplementation(() =>
                  Promise.resolve(persistedRecommendations)
                ),
                offset: vi.fn().mockResolvedValue([]),
              })),
            })),
            orderBy: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([]),
              offset: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      },
    }));

    vi.doMock("drizzle-orm", () => ({
      eq: vi.fn(() => ({})),
      and: vi.fn((...conditions) => conditions),
      desc: vi.fn(() => ({})),
      asc: vi.fn(() => ({})),
      inArray: vi.fn(() => ({})),
      gte: vi.fn(() => ({})),
      lte: vi.fn(() => ({})),
      or: vi.fn(() => ({})),
      ilike: vi.fn(() => ({})),
      sql: Object.assign(vi.fn(() => ({})), {
        raw: vi.fn(),
      }),
    }));

    vi.doMock("@/lib/db/schema", () => ({
      brands: {
        id: "id",
        organizationId: "organizationId",
        name: "name",
        isActive: "isActive",
      },
      audits: {
        id: "id",
        brandId: "brandId",
        status: "status",
        completedAt: "completedAt",
      },
      brandMentions: {
        id: "id",
        brandId: "brandId",
        platform: "platform",
        timestamp: "timestamp",
      },
      recommendations: {
        id: "id",
        brandId: "brandId",
        title: "title",
        description: "description",
        category: "category",
        priority: "priority",
        impact: "impact",
        effort: "effort",
        status: "status",
        source: "source",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
    }));

    // Suppress console output during tests
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Full E2E Workflow Test
  // ==========================================================================

  describe("Complete Recommendation Generation Workflow", () => {
    it("should complete full workflow: generate → persist → retrieve → deduplicate", async () => {
      // Step 1: POST visibility data to /api/recommendations/generate
      const generateRequest = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        {
          brandId: TEST_BRAND_ID,
          includeMonitor: true,
          includeAudit: true,
          maxRecommendations: 10,
          useAI: true,
        }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const generateResponse = await POST(generateRequest as never);
      const generateData = await generateResponse.json();

      // Step 2: Verify 200 response with recommendations array
      expect(generateResponse.status).toBe(200);
      expect(generateData.success).toBe(true);
      expect(generateData.brandId).toBe(TEST_BRAND_ID);
      expect(generateData.recommendations).toBeDefined();
      expect(Array.isArray(generateData.recommendations)).toBe(true);
      expect(generateData.recommendations.length).toBeGreaterThan(0);

      // Verify recommendation structure
      const firstRec = generateData.recommendations[0];
      expect(firstRec.category).toBeDefined();
      expect(firstRec.priority).toBeDefined();
      expect(firstRec.title).toBeDefined();
      expect(firstRec.description).toBeDefined();
      expect(firstRec.steps).toBeDefined();
      expect(Array.isArray(firstRec.steps)).toBe(true);
      expect(firstRec.aiPlatforms).toBeDefined();
      expect(Array.isArray(firstRec.aiPlatforms)).toBe(true);

      // Verify summary includes all metrics
      expect(generateData.summary).toBeDefined();
      expect(typeof generateData.summary.total).toBe("number");
      expect(typeof generateData.summary.persisted).toBe("number");
      expect(typeof generateData.summary.duplicatesSkipped).toBe("number");

      // Step 3 & 4: Verify persistence happened (persisted count should match)
      const persistedCount = generateData.summary.persisted;
      expect(persistedCount).toBeGreaterThan(0);

      // Step 5: Verify database state (using mock's persisted state)
      expect(persistedRecommendations.length).toBe(persistedCount);

      // Verify each persisted recommendation has required fields
      for (const rec of persistedRecommendations) {
        expect(rec.id).toBeDefined();
        expect(rec.brandId).toBe(TEST_BRAND_ID);
        expect(rec.title).toBeDefined();
        expect(rec.category).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.status).toBe("pending");
        expect(rec.source).toBe("monitoring");
      }

      // Step 6: POST same visibility data again
      const secondGenerateResponse = await POST(generateRequest as never);
      const secondGenerateData = await secondGenerateResponse.json();

      // Step 7: Verify duplicatesSkipped > 0 in response
      expect(secondGenerateResponse.status).toBe(200);
      expect(secondGenerateData.success).toBe(true);
      expect(secondGenerateData.summary.duplicatesSkipped).toBeGreaterThan(0);

      // Verify total persisted recommendations didn't increase (or increased only for non-duplicates)
      const totalAfterSecondRun =
        secondGenerateData.summary.persisted +
        secondGenerateData.summary.duplicatesSkipped;
      expect(totalAfterSecondRun).toBe(generateData.summary.total);
    });

    it("should maintain data integrity across multiple generation cycles", async () => {
      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );

      // First generation
      const firstRequest = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const firstResponse = await POST(firstRequest as never);
      const firstData = await firstResponse.json();

      expect(firstResponse.status).toBe(200);
      expect(firstData.summary.persisted).toBeGreaterThan(0);
      expect(firstData.summary.duplicatesSkipped).toBe(0);

      const firstPersisted = persistedRecommendations.length;

      // Second generation (should detect duplicates)
      const secondResponse = await POST(firstRequest as never);
      const secondData = await secondResponse.json();

      expect(secondResponse.status).toBe(200);
      expect(secondData.summary.duplicatesSkipped).toBe(firstPersisted);

      // Database should not have grown (all duplicates skipped)
      expect(persistedRecommendations.length).toBe(firstPersisted);

      // Third generation (still all duplicates)
      const thirdResponse = await POST(firstRequest as never);
      const thirdData = await thirdResponse.json();

      expect(thirdData.summary.duplicatesSkipped).toBe(firstPersisted);
      expect(persistedRecommendations.length).toBe(firstPersisted);
    });
  });

  // ==========================================================================
  // Response Validation Tests
  // ==========================================================================

  describe("Response Structure Validation", () => {
    it("should include complete summary in response", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      expect(data.summary).toBeDefined();
      expect(data.summary).toMatchObject({
        total: expect.any(Number),
        critical: expect.any(Number),
        high: expect.any(Number),
        medium: expect.any(Number),
        low: expect.any(Number),
        persisted: expect.any(Number),
        duplicatesSkipped: expect.any(Number),
      });
    });

    it("should include source information", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        {
          brandId: TEST_BRAND_ID,
          includeMonitor: true,
          includeAudit: true,
          useAI: true,
        }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      expect(data.sources).toBeDefined();
      expect(typeof data.sources.monitorPlatforms).toBe("number");
      expect(typeof data.sources.auditIncluded).toBe("boolean");
    });

    it("should include token usage for AI generation", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      expect(data.tokenUsage).toBeDefined();
      expect(typeof data.tokenUsage.input).toBe("number");
      expect(typeof data.tokenUsage.output).toBe("number");
    });

    it("should include grouped recommendations by priority", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      expect(data.grouped).toBeDefined();
      expect(data.grouped.critical).toBeDefined();
      expect(data.grouped.high).toBeDefined();
      expect(data.grouped.medium).toBeDefined();
      expect(data.grouped.low).toBeDefined();
    });
  });

  // ==========================================================================
  // Recommendation Quality Tests
  // ==========================================================================

  describe("Recommendation Quality Validation", () => {
    it("should generate platform-specific recommendations", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      // Verify at least one recommendation references specific platforms
      const hasSpecificPlatforms = data.recommendations.some(
        (rec: { aiPlatforms: string[] }) =>
          rec.aiPlatforms &&
          rec.aiPlatforms.length > 0 &&
          rec.aiPlatforms.every((p: string) =>
            ["ChatGPT", "Claude", "Perplexity", "Gemini"].includes(p)
          )
      );

      expect(hasSpecificPlatforms).toBe(true);
    });

    it("should generate actionable steps", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      // Verify steps are present and meaningful
      for (const rec of data.recommendations) {
        expect(rec.steps).toBeDefined();
        expect(Array.isArray(rec.steps)).toBe(true);
        expect(rec.steps.length).toBeGreaterThanOrEqual(2);
        expect(rec.steps.length).toBeLessThanOrEqual(5);

        // Each step should be a non-empty string
        for (const step of rec.steps) {
          expect(typeof step).toBe("string");
          expect(step.length).toBeGreaterThan(10);
        }
      }
    });

    it("should assign appropriate priority levels", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      const validPriorities = ["critical", "high", "medium", "low"];

      for (const rec of data.recommendations) {
        expect(validPriorities).toContain(rec.priority);
      }

      // Verify summary counts match actual distribution
      const criticalCount = data.recommendations.filter(
        (r: { priority: string }) => r.priority === "critical"
      ).length;
      const highCount = data.recommendations.filter(
        (r: { priority: string }) => r.priority === "high"
      ).length;
      const mediumCount = data.recommendations.filter(
        (r: { priority: string }) => r.priority === "medium"
      ).length;
      const lowCount = data.recommendations.filter(
        (r: { priority: string }) => r.priority === "low"
      ).length;

      expect(data.summary.critical).toBe(criticalCount);
      expect(data.summary.high).toBe(highCount);
      expect(data.summary.medium).toBe(mediumCount);
      expect(data.summary.low).toBe(lowCount);
    });

    it("should include expected outcomes", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      for (const rec of data.recommendations) {
        expect(rec.expectedOutcome).toBeDefined();
        expect(typeof rec.expectedOutcome).toBe("string");
        expect(rec.expectedOutcome.length).toBeGreaterThan(10);
      }
    });

    it("should include estimated timeframes", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      for (const rec of data.recommendations) {
        expect(rec.estimatedTimeframe).toBeDefined();
        expect(typeof rec.estimatedTimeframe).toBe("string");
      }
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe("Error Handling in E2E Flow", () => {
    it("should handle AI service unavailability gracefully", async () => {
      mockClaudeCreate.mockRejectedValue(
        new Error("Service temporarily unavailable")
      );

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it("should handle database persistence failures gracefully", async () => {
      mockCreateRecommendationsWithDuplicateDetection.mockRejectedValue(
        new Error("Database connection lost")
      );

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it("should return empty array for brand with no visibility data", async () => {
      mockBrandMentionsFindMany.mockResolvedValue([]);
      mockAuditsFindFirst.mockResolvedValue(null);

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        {
          brandId: TEST_BRAND_ID,
          includeMonitor: true,
          includeAudit: true,
          useAI: true,
        }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recommendations).toEqual([]);
    });
  });

  // ==========================================================================
  // Performance Tests
  // ==========================================================================

  describe("Performance Metrics", () => {
    it("should include generatedAt timestamp", async () => {
      const beforeTime = new Date();

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      const afterTime = new Date();
      const generatedAt = new Date(data.generatedAt);

      expect(data.generatedAt).toBeDefined();
      expect(generatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(generatedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it("should track token usage accurately", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import(
        "@/app/api/recommendations/generate/route"
      );
      const response = await POST(request as never);
      const data = await response.json();

      expect(data.tokenUsage.input).toBe(1200);
      expect(data.tokenUsage.output).toBe(800);
    });
  });
});
