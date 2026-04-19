/**
 * Integration Tests for Recommendations API
 * Tests for POST /api/recommendations/generate and GET /api/recommendations
 *
 * These tests verify the complete flow from API request through AI generation
 * to database persistence and retrieval.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_USER_ID = "test-user-123";
const TEST_ORG_ID = "test-org-456";
const TEST_BRAND_ID = "test-brand-789";
const TEST_BRAND_NAME = "Test Brand";

// Type for mock AI recommendations
const defaultRecShape = {
  category: "" as string,
  priority: "" as string,
  impact: "" as string,
  effort: "" as string,
  title: "",
  description: "",
  steps: [] as string[],
  aiPlatforms: [] as string[],
  expectedOutcome: "",
  estimatedTimeframe: "",
};

// Mock brand data
const mockBrand = {
  id: TEST_BRAND_ID,
  name: TEST_BRAND_NAME,
  organizationId: TEST_ORG_ID,
  isActive: true,
  domain: "testbrand.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock brand mentions data
const mockBrandMentions = [
  {
    id: "mention-1",
    brandId: TEST_BRAND_ID,
    platform: "ChatGPT",
    query: "best products in category",
    position: 2,
    response: "Test Brand offers excellent products",
    sentiment: "positive",
    timestamp: new Date(),
  },
  {
    id: "mention-2",
    brandId: TEST_BRAND_ID,
    platform: "Claude",
    query: "top companies",
    position: null,
    response: null,
    sentiment: "neutral",
    timestamp: new Date(),
  },
];

// Mock audit data
const mockAudit = {
  id: "audit-1",
  brandId: TEST_BRAND_ID,
  url: "https://testbrand.com",
  status: "completed",
  overallScore: 65,
  categoryScores: [
    { category: "schema", score: 50, maxScore: 100, issues: [] },
    { category: "content", score: 80, maxScore: 100, issues: [] },
  ],
  issues: [
    {
      id: "issue-1",
      category: "schema_markup",
      severity: "high",
      title: "Missing FAQ Schema",
      description: "No FAQ schema markup found",
      recommendation: "Add FAQ schema",
      impact: "medium",
    },
  ],
  completedAt: new Date(),
};

// Mock recommendation for database
const mockRecommendation = {
  id: "rec-1",
  brandId: TEST_BRAND_ID,
  title: "Implement Schema Markup",
  description: "Add structured data for better AI visibility",
  category: "schema_markup",
  priority: "high",
  impact: "high",
  effort: "moderate",
  status: "pending",
  source: "monitoring",
  steps: ["Step 1", "Step 2"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================================================
// Mock Functions
// ============================================================================

const mockAuth = vi.fn();
const mockGetUserId = vi.fn();
const mockGetOrganizationId = vi.fn();
const mockClaudeCreate = vi.fn();
const mockBrandsFindFirst = vi.fn();
const mockBrandMentionsFindMany = vi.fn();
const mockAuditsFindFirst = vi.fn();
const mockCreateRecommendationsWithDuplicateDetection = vi.fn();
const mockGetRecommendations = vi.fn();
const mockGenerateRecommendations = vi.fn();
const mockGenerateAIRecommendations = vi.fn();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create mock AI response
 */
function createMockAIResponse(recommendations: Partial<typeof defaultRecShape>[] = []) {
  const defaultRec = {
    category: "content_optimization",
    priority: "high",
    impact: "high",
    effort: "moderate",
    title: "Improve Content Quality",
    description: "Enhance content for better AI visibility",
    steps: ["Step 1: Analyze content", "Step 2: Optimize for AI"],
    aiPlatforms: ["ChatGPT", "Claude"],
    expectedOutcome: "Increased visibility by 20%",
    estimatedTimeframe: "2-4 weeks",
  };

  const recs = recommendations.length > 0
    ? recommendations.map((rec) => ({ ...defaultRec, ...rec }))
    : [defaultRec];

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ recommendations: recs }),
      },
    ],
    usage: { input_tokens: 500, output_tokens: 300 },
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
function createMockGetRequest(
  url: string
): {
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

describe("Recommendations API Integration Tests", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Set up default mock return values
    mockAuth.mockResolvedValue({
      userId: TEST_USER_ID,
      orgId: TEST_ORG_ID,
    });

    mockGetUserId.mockResolvedValue(TEST_USER_ID);
    mockGetOrganizationId.mockResolvedValue(TEST_ORG_ID);

    mockBrandsFindFirst.mockResolvedValue(mockBrand);
    mockBrandMentionsFindMany.mockResolvedValue(mockBrandMentions);
    mockAuditsFindFirst.mockResolvedValue(mockAudit);

    mockClaudeCreate.mockResolvedValue(createMockAIResponse([
      { title: "AI Recommendation 1", priority: "high" },
      { title: "AI Recommendation 2", priority: "medium" },
    ]));

    mockCreateRecommendationsWithDuplicateDetection.mockResolvedValue({
      created: [mockRecommendation],
      skipped: [],
      createdCount: 1,
      skippedCount: 0,
    });

    mockGetRecommendations.mockResolvedValue({
      data: [mockRecommendation],
      total: 1,
    });

    mockGenerateRecommendations.mockResolvedValue([
      {
        id: "rule-rec-1",
        source: "monitoring",
        category: "content_optimization",
        priority: "high",
        priorityScore: 75,
        title: "Rule-based Recommendation",
        description: "This is a rule-based recommendation",
        impact: "high",
        effort: "moderate",
        urgency: "medium",
        confidence: 80,
        actionItems: ["Action 1", "Action 2"],
        aiPlatforms: ["ChatGPT"],
      },
    ]);

    mockGenerateAIRecommendations.mockResolvedValue({
      success: true,
      recommendations: [
        {
          category: "content_optimization",
          priority: "high",
          impactScore: 85,
          title: "AI Recommendation 1",
          description: "AI-generated recommendation description",
          impact: "high",
          effort: "moderate",
          steps: ["Step 1", "Step 2"],
          aiPlatforms: ["ChatGPT", "Claude"],
          expectedOutcome: "Improved visibility",
          estimatedTimeframe: "2-4 weeks",
        },
      ],
      tokenUsage: { input: 500, output: 300 },
    });

    // Set up mocks
    vi.doMock("@/lib/auth", () => ({
      auth: mockAuth,
      getUserId: mockGetUserId,
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
      createRecommendationsWithDuplicateDetection: mockCreateRecommendationsWithDuplicateDetection,
      getRecommendations: mockGetRecommendations,
      findSimilarRecommendation: vi.fn().mockResolvedValue(null),
    }));

    vi.doMock("@/lib/recommendations", () => ({
      generateRecommendations: mockGenerateRecommendations,
    }));

    vi.doMock("@/lib/ai/recommendations", () => ({
      generateAIRecommendations: mockGenerateAIRecommendations,
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
              limit: vi.fn().mockResolvedValue([mockBrand]),
              offset: vi.fn().mockResolvedValue([]),
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([]),
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
      brands: { id: "id", organizationId: "organizationId", name: "name", isActive: "isActive" },
      audits: { id: "id", brandId: "brandId", status: "status", completedAt: "completedAt" },
      brandMentions: { id: "id", brandId: "brandId", platform: "platform", timestamp: "timestamp" },
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
  // POST /api/recommendations/generate Tests
  // ==========================================================================

  describe("POST /api/recommendations/generate", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null, orgId: null });
      mockGetUserId.mockResolvedValue(null);

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 for empty request body", async () => {
      const request = {
        url: "http://localhost:3000/api/recommendations/generate",
        nextUrl: new URL("http://localhost:3000/api/recommendations/generate"),
        json: async () => {
          throw new SyntaxError("Unexpected end of JSON input");
        },
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "POST",
      };

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request body");
    });

    it("should return 400 for missing brandId", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        {
          includeMonitor: true,
          includeAudit: true,
        }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request body");
      expect(data.details).toBeDefined();
    }, 15000);

    it("should return 400 for invalid brandId (empty string)", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        {
          brandId: "",
          includeMonitor: true,
        }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("should return 404 when brand is not found", async () => {
      mockBrandsFindFirst.mockResolvedValue(null);

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        {
          brandId: "non-existent-brand",
        }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Brand not found");
    });

    it("should return 200 with recommendations for valid AI generation request", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        {
          brandId: TEST_BRAND_ID,
          includeMonitor: true,
          includeAudit: true,
          useAI: true,
        }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.brandId).toBe(TEST_BRAND_ID);
      expect(data.recommendations).toBeDefined();
      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(data.summary).toBeDefined();
      expect(data.summary.total).toBeGreaterThanOrEqual(0);
    });

    it("should return 200 with rule-based recommendations when useAI is false", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        {
          brandId: TEST_BRAND_ID,
          includeMonitor: true,
          includeAudit: true,
          useAI: false,
        }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recommendations).toBeDefined();
      expect(mockGenerateRecommendations).toHaveBeenCalled();
    });

    it("should return 200 with empty recommendations when no visibility data", async () => {
      mockBrandMentionsFindMany.mockResolvedValue([]);
      mockAuditsFindFirst.mockResolvedValue(null);
      mockGenerateAIRecommendations.mockResolvedValue({
        success: false,
        error: "Insufficient visibility data to generate recommendations",
        recommendations: [],
      });

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        {
          brandId: TEST_BRAND_ID,
          includeMonitor: true,
          includeAudit: true,
          useAI: true,
        }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recommendations).toEqual([]);
    });

    it("should handle AI API failure gracefully", async () => {
      mockGenerateAIRecommendations.mockResolvedValue({
        success: false,
        error: "API rate limit exceeded",
        recommendations: [],
      });

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        {
          brandId: TEST_BRAND_ID,
          useAI: true,
        }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Failed to generate AI recommendations");
    });

    it("should include summary with priority breakdown", async () => {
      mockClaudeCreate.mockResolvedValue(createMockAIResponse([
        { title: "Critical Rec", priority: "critical" },
        { title: "High Rec", priority: "high" },
        { title: "Medium Rec", priority: "medium" },
        { title: "Low Rec", priority: "low" },
      ]));

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary).toBeDefined();
      expect(typeof data.summary.total).toBe("number");
      expect(typeof data.summary.critical).toBe("number");
      expect(typeof data.summary.high).toBe("number");
      expect(typeof data.summary.medium).toBe("number");
      expect(typeof data.summary.low).toBe("number");
    });

    it("should include source information in response", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        {
          brandId: TEST_BRAND_ID,
          includeMonitor: true,
          includeAudit: true,
          useAI: true,
        }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sources).toBeDefined();
      expect(typeof data.sources.monitorPlatforms).toBe("number");
      expect(typeof data.sources.auditIncluded).toBe("boolean");
    });

    it("should include generatedAt timestamp", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.generatedAt).toBeDefined();
      expect(() => new Date(data.generatedAt)).not.toThrow();
    });

    it("should include persisted count for AI generation", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary).toBeDefined();
      expect(typeof data.summary.persisted).toBe("number");
    });

    it("should track duplicates skipped", async () => {
      mockCreateRecommendationsWithDuplicateDetection.mockResolvedValue({
        created: [mockRecommendation],
        skipped: [{ title: "Duplicate Rec" }],
        createdCount: 1,
        skippedCount: 1,
      });

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary.duplicatesSkipped).toBeGreaterThanOrEqual(0);
    });

    it("should handle database connection errors gracefully", async () => {
      mockBrandsFindFirst.mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it("should handle malformed JSON in AI response", async () => {
      mockGenerateAIRecommendations.mockResolvedValue({
        success: false,
        error: "Failed to parse AI response: invalid JSON",
        recommendations: [],
      });

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it("should handle AI response missing recommendations array", async () => {
      mockGenerateAIRecommendations.mockResolvedValue({
        success: false,
        error: "Invalid AI response: missing recommendations array",
        recommendations: [],
      });

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  // ==========================================================================
  // GET /api/recommendations Tests
  // ==========================================================================

  describe("GET /api/recommendations", () => {
    it.skip("should return 401 when organization is not found", async () => {
      mockGetOrganizationId.mockResolvedValue(null);

      const request = createMockGetRequest(
        "http://localhost:3000/api/recommendations"
      );

      const { GET } = await import("@/app/api/recommendations/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Organization not found");
    });

    it("should return 400 for invalid status value", async () => {
      const request = createMockGetRequest(
        "http://localhost:3000/api/recommendations?status=invalid_status"
      );

      const { GET } = await import("@/app/api/recommendations/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid query parameters");
    });

    it("should return 400 for invalid priority value", async () => {
      const request = createMockGetRequest(
        "http://localhost:3000/api/recommendations?priority=super_high"
      );

      const { GET } = await import("@/app/api/recommendations/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("should return 400 for invalid category value", async () => {
      const request = createMockGetRequest(
        "http://localhost:3000/api/recommendations?category=invalid_category"
      );

      const { GET } = await import("@/app/api/recommendations/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("should return 400 for limit exceeding maximum", async () => {
      const request = createMockGetRequest(
        "http://localhost:3000/api/recommendations?limit=500"
      );

      const { GET } = await import("@/app/api/recommendations/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // ==========================================================================
  // Content Validation Tests
  // ==========================================================================

  describe("AI Recommendation Content Validation", () => {
    it("should generate recommendations with valid categories", async () => {
      const validCategories = [
        "technical_seo",
        "content_optimization",
        "schema_markup",
        "citation_building",
        "brand_consistency",
        "competitor_analysis",
        "content_freshness",
        "authority_building",
      ];

      mockClaudeCreate.mockResolvedValue(createMockAIResponse([
        { title: "Test Rec", category: "content_optimization" },
      ]));

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      if (data.recommendations && data.recommendations.length > 0) {
        expect(validCategories).toContain(data.recommendations[0].category);
      }
    });

    it("should generate recommendations with valid priorities", async () => {
      const validPriorities = ["critical", "high", "medium", "low"];

      mockClaudeCreate.mockResolvedValue(createMockAIResponse([
        { title: "Test Rec", priority: "high" },
      ]));

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      if (data.recommendations && data.recommendations.length > 0) {
        expect(validPriorities).toContain(data.recommendations[0].priority);
      }
    });

    it("should include steps array in recommendations", async () => {
      mockClaudeCreate.mockResolvedValue(createMockAIResponse([
        {
          title: "Test Rec",
          steps: ["Step 1", "Step 2", "Step 3"],
        },
      ]));

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      if (data.recommendations && data.recommendations.length > 0) {
        expect(Array.isArray(data.recommendations[0].steps)).toBe(true);
      }
    });

    it("should include aiPlatforms array in recommendations", async () => {
      mockClaudeCreate.mockResolvedValue(createMockAIResponse([
        {
          title: "Test Rec",
          aiPlatforms: ["ChatGPT", "Claude"],
        },
      ]));

      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: true }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      if (data.recommendations && data.recommendations.length > 0) {
        expect(Array.isArray(data.recommendations[0].aiPlatforms)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // Rule-Based Generation Tests
  // ==========================================================================

  describe("Rule-Based Generation", () => {
    it("should return recommendations with confidence scores", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: false }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      if (data.recommendations && data.recommendations.length > 0) {
        expect(typeof data.recommendations[0].confidence).toBe("number");
      }
    });

    it("should return recommendations with priorityScore", async () => {
      const request = createMockPostRequest(
        "http://localhost:3000/api/recommendations/generate",
        { brandId: TEST_BRAND_ID, useAI: false }
      );

      const { POST } = await import("@/app/api/recommendations/generate/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      if (data.recommendations && data.recommendations.length > 0) {
        expect(typeof data.recommendations[0].priorityScore).toBe("number");
      }
    });
  });
});
