/**
 * AI Insights API Routes Unit Tests
 * Tests for /api/ai-insights/* endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Clerk auth
vi.mock("@/lib/auth/supabase-server", () => ({
  getSession: vi.fn(async () => ({ userId: "test-user-id", orgId: "test-org-id", orgRole: "admin", orgSlug: null })),
  currentDbUser: vi.fn(async () => null),
  }));

// Mock database and schema
vi.mock("@/lib/db", () => {
  const mockBrand = {
    id: "brand-123",
    name: "Test Brand",
    domain: "testbrand.com",
    logoUrl: "https://testbrand.com/logo.png",
    userId: "test-user-123",
  };

  const mockQuery = {
    id: "query-123",
    brandId: "brand-123",
    userId: "test-user-123",
    queryText: "How do AI platforms reference Test Brand?",
    brandContext: "Test Brand is a leading tech company",
    platforms: ["chatgpt", "claude", "gemini", "perplexity"],
    status: "completed",
    createdAt: new Date(),
    completedAt: new Date(),
  };

  const mockInsight = {
    id: "insight-123",
    queryId: "query-123",
    brandId: "brand-123",
    userId: "test-user-123",
    platform: "chatgpt",
    responseContent: "Test Brand is a leading tech company...",
    visibilityScore: 75,
    citationCount: 5,
    mentionCount: 3,
    prominenceScore: 20,
    contentTypePerformance: {
      blog_post: 2,
      documentation: 3,
    },
    recommendations: ["increase_mentions", "improve_citations"],
    metadata: {
      model: "gpt-4",
      modelVersion: "gpt-4-0613",
      temperature: 0.7,
      tokensUsed: 1500,
      responseTime: 2500,
    },
    createdAt: new Date(),
  };

  const mockCitation = {
    id: "citation-123",
    insightId: "insight-123",
    brandId: "brand-123",
    citationType: "direct_quote",
    citationText: "Test Brand is a leader in technology",
    sourceUrl: "https://testbrand.com/about",
    sourceTitle: "About Test Brand",
    position: 0,
    context: "According to Test Brand...",
    contentType: "documentation",
    relevanceScore: 85,
    createdAt: new Date(),
  };

  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([mockBrand])),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockQuery])),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      })),
      query: {
        platformQueries: {
          findMany: vi.fn(() =>
            Promise.resolve([
              {
                ...mockQuery,
                brand: mockBrand,
                insights: [
                  {
                    ...mockInsight,
                    citations: [mockCitation],
                  },
                ],
              },
            ])
          ),
        },
        platformInsights: {
          findMany: vi.fn(() =>
            Promise.resolve([
              {
                ...mockInsight,
                query: mockQuery,
                brand: mockBrand,
                citations: [mockCitation],
              },
            ])
          ),
        },
      },
    },
  };
});

// Mock schema exports
vi.mock("@/lib/db/schema", () => ({
  brands: {
    id: "id",
    name: "name",
    domain: "domain",
  },
  platformQueries: {
    id: "id",
    userId: "userId",
    brandId: "brandId",
    status: "status",
    createdAt: "createdAt",
  },
  platformInsights: {
    id: "id",
    queryId: "queryId",
    userId: "userId",
    platform: "platform",
    createdAt: "createdAt",
  },
  citationRecords: {
    id: "id",
    insightId: "insightId",
    position: "position",
  },
}));

// Mock Drizzle ORM helpers
vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual("drizzle-orm");
  return {
    ...actual,
    eq: vi.fn(() => ({})),
    and: vi.fn((...conditions) => ({ conditions })),
    desc: vi.fn(() => ({})),
    count: vi.fn(() => ({})),
  };
});

// Mock AnalysisEngine
vi.mock("@/lib/ai/analysis-engine", () => ({
  AnalysisEngine: vi.fn().mockImplementation(() => ({
    analyze: vi.fn(() =>
      Promise.resolve({
        status: "partial",
        aggregate: {
          averageScore: 72,
          totalCitations: 15,
          totalMentions: 10,
          bestPlatform: "chatgpt",
          worstPlatform: "perplexity",
        },
        // platforms is keyed by platform name (object map), matching AnalysisEngine.analyze return type
        platforms: {
          chatgpt: {
            status: "success",
            error: null,
            platform: "chatgpt",
            visibilityScore: {
              total: 75,
              breakdown: {
                mentionCount: 30,
                citationQuality: 25,
                prominence: 20,
              },
              metrics: {
                totalMentions: 3,
                averageRelevance: 0.85,
                firstMentionPosition: 120,
              },
            },
            response: {
              platform: "chatgpt",
              content: "Test Brand is a leading tech company...",
              citations: [
                {
                  type: "direct_quote",
                  text: "Test Brand is a leader in technology",
                  sourceUrl: "https://testbrand.com/about",
                  sourceTitle: "About Test Brand",
                  position: 0,
                  context: "According to Test Brand...",
                  contentType: "documentation",
                  relevanceScore: 0.85,
                },
              ],
              metadata: {
                model: "gpt-4",
                version: "gpt-4-0613",
                temperature: 0.7,
                tokensUsed: 1500,
                responseTimeMs: 2500,
              },
            },
            contentTypePerformance: {
              blog_post: 2,
              documentation: 3,
            },
            recommendations: [
              {
                id: "increase_mentions",
                title: "Increase Brand Mentions",
                description: "Improve brand visibility",
                priority: 1,
                impact: "high",
                difficulty: "medium",
                actionItems: ["Create more content", "Optimize existing content"],
                examples: ["Example 1", "Example 2"],
              },
            ],
          },
          claude: {
            status: "failed",
            error: {
              platform: "claude",
              type: "rate_limit",
              message: "Rate limit exceeded",
              timestamp: new Date(),
              retryable: true,
              retryAfter: 60,
            },
          },
        },
      })
    ),
  })),
}));

// Mock validation functions
vi.mock("@/lib/ai/validation", () => ({
  analyzeRequestSchema: {
    parse: vi.fn((data) => ({
      queryText: data.queryText || "Test query",
      brandContext: data.brandContext || null,
      brandId: data.brandId || "brand-123",
      brandName: data.brandName || "Test Brand",
      brandKeywords: data.brandKeywords || [],
      platforms: data.platforms || ["chatgpt", "claude", "gemini", "perplexity"],
    })),
  },
  parseHistoryQueryParams: vi.fn((searchParams) => ({
    brandId: searchParams.get("brandId") || null,
    limit: parseInt(searchParams.get("limit") || "10"),
    offset: parseInt(searchParams.get("offset") || "0"),
  })),
  parsePlatformQueryParams: vi.fn((platform, searchParams) => ({
    platform,
    brandId: searchParams.get("brandId") || null,
    limit: parseInt(searchParams.get("limit") || "10"),
    offset: parseInt(searchParams.get("offset") || "0"),
  })),
  isValidPlatform: vi.fn((platform) =>
    ["chatgpt", "claude", "gemini", "perplexity"].includes(platform)
  ),
}));

describe("AI Insights API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set DATABASE_URL to ensure database is considered configured
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  });

  describe("POST /api/ai-insights/analyze", () => {
    it("should analyze brand visibility across all platforms", async () => {
      const request = {
        url: "http://localhost:3000/api/ai-insights/analyze",
        json: async () => ({
          queryText: "How do AI platforms reference Test Brand?",
          brandContext: "Test Brand is a leading tech company",
          brandId: "brand-123",
          brandName: "Test Brand",
          brandKeywords: ["technology", "innovation"],
          platforms: ["chatgpt", "claude", "gemini", "perplexity"],
        }),
      };

      const { POST } = await import("@/app/api/ai-insights/analyze/route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.queryId).toBeDefined();
      expect(data.data.status).toBe("partial"); // One platform failed
      expect(data.data.analysis).toBeDefined();
      expect(data.data.analysis.summary).toBeDefined();
      expect(data.data.analysis.platforms).toBeDefined();
      expect(Array.isArray(data.data.analysis.platforms)).toBe(true);
    });

    it("should return 401 when user is not authenticated", async () => {
      // Mock auth to return no userId
      const { auth } = await import("@/lib/auth/supabase-server");
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = {
        url: "http://localhost:3000/api/ai-insights/analyze",
        json: async () => ({
          queryText: "Test query",
          brandId: "brand-123",
          brandName: "Test Brand",
        }),
      };

      const { POST } = await import("@/app/api/ai-insights/analyze/route");
      const response = await POST(request as never);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 503 when database is not configured", async () => {
      delete process.env.DATABASE_URL;

      const request = {
        url: "http://localhost:3000/api/ai-insights/analyze",
        json: async () => ({
          queryText: "Test query",
          brandId: "brand-123",
          brandName: "Test Brand",
        }),
      };

      vi.resetModules();
      const { POST } = await import("@/app/api/ai-insights/analyze/route");
      const response = await POST(request as never);

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Database not configured");
    });

    it("should return 404 when brand is not found", async () => {
      // Mock brand query to return empty array
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as never);

      const request = {
        url: "http://localhost:3000/api/ai-insights/analyze",
        json: async () => ({
          queryText: "Test query",
          brandId: "non-existent-brand",
          brandName: "Test Brand",
        }),
      };

      const { POST } = await import("@/app/api/ai-insights/analyze/route");
      const response = await POST(request as never);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Brand not found");
    });

    it("should handle validation errors", async () => {
      const { analyzeRequestSchema } = await import("@/lib/ai/validation");
      const { ZodError } = await import("zod");

      // Mock validation to throw Zod error
      vi.mocked(analyzeRequestSchema.parse).mockImplementationOnce(() => {
        throw new ZodError([
          {
            code: "invalid_type",
            expected: "string",
            received: "undefined",
            path: ["queryText"],
            message: "Required",
          },
        ]);
      });

      const request = {
        url: "http://localhost:3000/api/ai-insights/analyze",
        json: async () => ({
          brandId: "brand-123",
          brandName: "Test Brand",
        }),
      };

      const { POST } = await import("@/app/api/ai-insights/analyze/route");
      const response = await POST(request as never);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation error");
      expect(data.details).toBeDefined();
    });

    it("should store platform insights and citations in database", async () => {
      const { db } = await import("@/lib/db");

      const request = {
        url: "http://localhost:3000/api/ai-insights/analyze",
        json: async () => ({
          queryText: "Test query",
          brandId: "brand-123",
          brandName: "Test Brand",
        }),
      };

      const { POST } = await import("@/app/api/ai-insights/analyze/route");
      await POST(request as never);

      // Verify database insert was called
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe("GET /api/ai-insights/history", () => {
    it("should return user's analysis history", async () => {
      const request = {
        url: "http://localhost:3000/api/ai-insights/history",
        nextUrl: new URL("http://localhost:3000/api/ai-insights/history"),
      };

      const { GET } = await import("@/app/api/ai-insights/history/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.history).toBeDefined();
      expect(Array.isArray(data.data.history)).toBe(true);
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.limit).toBeDefined();
      expect(data.data.pagination.offset).toBeDefined();
      expect(data.data.pagination.total).toBeDefined();
      expect(data.data.pagination.hasMore).toBeDefined();
    });

    it("should filter history by brandId", async () => {
      const request = {
        url: "http://localhost:3000/api/ai-insights/history?brandId=brand-123",
        nextUrl: new URL(
          "http://localhost:3000/api/ai-insights/history?brandId=brand-123"
        ),
      };

      const { GET } = await import("@/app/api/ai-insights/history/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.history).toBeDefined();
    });

    it("should support pagination with limit and offset", async () => {
      const request = {
        url: "http://localhost:3000/api/ai-insights/history?limit=5&offset=10",
        nextUrl: new URL(
          "http://localhost:3000/api/ai-insights/history?limit=5&offset=10"
        ),
      };

      const { GET } = await import("@/app/api/ai-insights/history/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.pagination.limit).toBe(5);
      expect(data.data.pagination.offset).toBe(10);
    });

    it("should return 401 when user is not authenticated", async () => {
      const { auth } = await import("@/lib/auth/supabase-server");
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = {
        url: "http://localhost:3000/api/ai-insights/history",
        nextUrl: new URL("http://localhost:3000/api/ai-insights/history"),
      };

      const { GET } = await import("@/app/api/ai-insights/history/route");
      const response = await GET(request as never);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 503 when database is not configured", async () => {
      delete process.env.DATABASE_URL;

      const request = {
        url: "http://localhost:3000/api/ai-insights/history",
        nextUrl: new URL("http://localhost:3000/api/ai-insights/history"),
      };

      vi.resetModules();
      const { GET } = await import("@/app/api/ai-insights/history/route");
      const response = await GET(request as never);

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Database not configured");
    });

    it("should return 404 when brand is not found", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as never);

      const request = {
        url: "http://localhost:3000/api/ai-insights/history?brandId=non-existent",
        nextUrl: new URL(
          "http://localhost:3000/api/ai-insights/history?brandId=non-existent"
        ),
      };

      const { GET } = await import("@/app/api/ai-insights/history/route");
      const response = await GET(request as never);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Brand not found");
    });

    it("should include platform breakdown in history entries", async () => {
      const request = {
        url: "http://localhost:3000/api/ai-insights/history",
        nextUrl: new URL("http://localhost:3000/api/ai-insights/history"),
      };

      const { GET } = await import("@/app/api/ai-insights/history/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.success).toBe(true);
      if (data.data.history.length > 0) {
        const entry = data.data.history[0];
        expect(entry.platformBreakdown).toBeDefined();
        expect(Array.isArray(entry.platformBreakdown)).toBe(true);
      }
    });
  });

  describe("GET /api/ai-insights/[platform]", () => {
    const validPlatforms = ["chatgpt", "claude", "gemini", "perplexity"];

    validPlatforms.forEach((platform) => {
      it(`should return ${platform} insights`, async () => {
        const request = {
          url: `http://localhost:3000/api/ai-insights/${platform}`,
          nextUrl: new URL(
            `http://localhost:3000/api/ai-insights/${platform}`
          ),
        };

        const params = {
          params: Promise.resolve({ platform }),
        };

        const { GET } = await import(
          "@/app/api/ai-insights/[platform]/route"
        );
        const response = await GET(request as never, params);
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.platform).toBe(platform);
        expect(data.data.insights).toBeDefined();
        expect(Array.isArray(data.data.insights)).toBe(true);
        expect(data.data.aggregateStats).toBeDefined();
        expect(data.data.pagination).toBeDefined();
      });
    });

    it("should return 400 for invalid platform", async () => {
      const request = {
        url: "http://localhost:3000/api/ai-insights/invalid-platform",
        nextUrl: new URL(
          "http://localhost:3000/api/ai-insights/invalid-platform"
        ),
      };

      const params = {
        params: Promise.resolve({ platform: "invalid-platform" }),
      };

      // Mock isValidPlatform to return false
      const { isValidPlatform } = await import("@/lib/ai/validation");
      vi.mocked(isValidPlatform).mockReturnValueOnce(false);

      const { GET } = await import("@/app/api/ai-insights/[platform]/route");
      const response = await GET(request as never, params);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid platform");
    });

    it("should filter insights by brandId", async () => {
      const request = {
        url: "http://localhost:3000/api/ai-insights/chatgpt?brandId=brand-123",
        nextUrl: new URL(
          "http://localhost:3000/api/ai-insights/chatgpt?brandId=brand-123"
        ),
      };

      const params = {
        params: Promise.resolve({ platform: "chatgpt" }),
      };

      const { GET } = await import("@/app/api/ai-insights/[platform]/route");
      const response = await GET(request as never, params);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.insights).toBeDefined();
    });

    it("should support pagination", async () => {
      const request = {
        url: "http://localhost:3000/api/ai-insights/chatgpt?limit=5&offset=10",
        nextUrl: new URL(
          "http://localhost:3000/api/ai-insights/chatgpt?limit=5&offset=10"
        ),
      };

      const params = {
        params: Promise.resolve({ platform: "chatgpt" }),
      };

      const { GET } = await import("@/app/api/ai-insights/[platform]/route");
      const response = await GET(request as never, params);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.pagination.limit).toBe(5);
      expect(data.data.pagination.offset).toBe(10);
    });

    it("should return 401 when user is not authenticated", async () => {
      const { auth } = await import("@/lib/auth/supabase-server");
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = {
        url: "http://localhost:3000/api/ai-insights/chatgpt",
        nextUrl: new URL("http://localhost:3000/api/ai-insights/chatgpt"),
      };

      const params = {
        params: Promise.resolve({ platform: "chatgpt" }),
      };

      const { GET } = await import("@/app/api/ai-insights/[platform]/route");
      const response = await GET(request as never, params);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 503 when database is not configured", async () => {
      delete process.env.DATABASE_URL;

      const request = {
        url: "http://localhost:3000/api/ai-insights/chatgpt",
        nextUrl: new URL("http://localhost:3000/api/ai-insights/chatgpt"),
      };

      const params = {
        params: Promise.resolve({ platform: "chatgpt" }),
      };

      vi.resetModules();
      const { GET } = await import("@/app/api/ai-insights/[platform]/route");
      const response = await GET(request as never, params);

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Database not configured");
    });

    it("should return 404 when brand is not found", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as never);

      const request = {
        url: "http://localhost:3000/api/ai-insights/chatgpt?brandId=non-existent",
        nextUrl: new URL(
          "http://localhost:3000/api/ai-insights/chatgpt?brandId=non-existent"
        ),
      };

      const params = {
        params: Promise.resolve({ platform: "chatgpt" }),
      };

      const { GET } = await import("@/app/api/ai-insights/[platform]/route");
      const response = await GET(request as never, params);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Brand not found");
    });

    it("should include aggregate statistics", async () => {
      const request = {
        url: "http://localhost:3000/api/ai-insights/chatgpt",
        nextUrl: new URL("http://localhost:3000/api/ai-insights/chatgpt"),
      };

      const params = {
        params: Promise.resolve({ platform: "chatgpt" }),
      };

      const { GET } = await import("@/app/api/ai-insights/[platform]/route");
      const response = await GET(request as never, params);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.aggregateStats).toBeDefined();
      expect(data.data.aggregateStats.averageVisibilityScore).toBeDefined();
      expect(data.data.aggregateStats.totalCitations).toBeDefined();
      expect(data.data.aggregateStats.totalMentions).toBeDefined();
      expect(data.data.aggregateStats.totalAnalyses).toBeDefined();
      expect(data.data.aggregateStats.averageProminenceScore).toBeDefined();
    });

    it("should include citations in insights", async () => {
      const request = {
        url: "http://localhost:3000/api/ai-insights/chatgpt",
        nextUrl: new URL("http://localhost:3000/api/ai-insights/chatgpt"),
      };

      const params = {
        params: Promise.resolve({ platform: "chatgpt" }),
      };

      const { GET } = await import("@/app/api/ai-insights/[platform]/route");
      const response = await GET(request as never, params);
      const data = await response.json();

      expect(data.success).toBe(true);
      if (data.data.insights.length > 0) {
        const insight = data.data.insights[0];
        expect(insight.citations).toBeDefined();
        expect(Array.isArray(insight.citations)).toBe(true);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully in analyze endpoint", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.insert).mockImplementationOnce(() => {
        throw new Error("Database connection failed");
      });

      const request = {
        url: "http://localhost:3000/api/ai-insights/analyze",
        json: async () => ({
          queryText: "Test query",
          brandId: "brand-123",
          brandName: "Test Brand",
        }),
      };

      const { POST } = await import("@/app/api/ai-insights/analyze/route");
      const response = await POST(request as never);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Analysis failed");
    });

    it("should handle database errors gracefully in history endpoint", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.query.platformQueries.findMany).mockRejectedValueOnce(
        new Error("Database query failed")
      );

      const request = {
        url: "http://localhost:3000/api/ai-insights/history",
        nextUrl: new URL("http://localhost:3000/api/ai-insights/history"),
      };

      const { GET } = await import("@/app/api/ai-insights/history/route");
      const response = await GET(request as never);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch analysis history");
    });

    it("should handle database errors gracefully in platform endpoint", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.query.platformInsights.findMany).mockRejectedValueOnce(
        new Error("Database query failed")
      );

      const request = {
        url: "http://localhost:3000/api/ai-insights/chatgpt",
        nextUrl: new URL("http://localhost:3000/api/ai-insights/chatgpt"),
      };

      const params = {
        params: Promise.resolve({ platform: "chatgpt" }),
      };

      const { GET } = await import("@/app/api/ai-insights/[platform]/route");
      const response = await GET(request as never, params);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch platform insights");
    });
  });
});
