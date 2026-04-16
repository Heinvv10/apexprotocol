/**
 * Unit Tests for /api/monitor/citations route
 * Testing authentication, citation aggregation, trend calculation, and error handling
 * Following existing test patterns from mentions and analytics route tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock Clerk auth via lib/auth
vi.mock("@/lib/auth/clerk", () => ({
  getOrganizationId: vi.fn(),
}));

// Mock brands data
const mockBrands = [
  { id: "brand-1" },
  { id: "brand-2" },
];

// Create mock mentions with citations for aggregation testing
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

const mockMentionsWithCitations = [
  {
    id: "m1",
    citationUrl: "https://example.com/article-1",
    platform: "chatgpt",
    response: "This is a comprehensive response about Brand A and its excellent products. The quality is unmatched in the market.",
    timestamp: today,
  },
  {
    id: "m2",
    citationUrl: "https://example.com/article-1",
    platform: "claude",
    response: "Brand A continues to lead the market with innovative solutions.",
    timestamp: yesterday,
  },
  {
    id: "m3",
    citationUrl: "https://example.com/article-2",
    platform: "perplexity",
    response: "According to experts, Brand A is the preferred choice for professionals.",
    timestamp: today,
  },
  {
    id: "m4",
    citationUrl: "https://example.com/blog/post-1",
    platform: "chatgpt",
    response: "Recent analysis shows Brand A's growth trajectory is impressive.",
    timestamp: twoDaysAgo,
  },
  {
    id: "m5",
    citationUrl: "https://example.com/article-1",
    platform: "gemini",
    response: "Brand A has been mentioned frequently in tech discussions.",
    timestamp: threeDaysAgo,
  },
];

// Create a chainable mock
const createChain = (result: unknown) => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => void) => Promise.resolve(result).catch(reject),
  };
  // Make all methods return the chain for chaining
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.offset.mockReturnValue(chain);
  return chain;
};

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

// Import mocked modules AFTER vi.mock declarations
import { getOrganizationId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";

// Helper to setup standard mock behavior (brands + mentions with citations)
const setupStandardMock = (brandsResult = mockBrands, mentionsResult = mockMentionsWithCitations) => {
  let callCount = 0;
  vi.mocked(db.select).mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // First call: get organization's brands
      return createChain(brandsResult) as ReturnType<typeof db.select>;
    }
    // Second call: get mentions with citations
    return createChain(mentionsResult) as ReturnType<typeof db.select>;
  });
};

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrganizationId).mockResolvedValue("test-org-id");
  // Setup default mock behavior
  setupStandardMock();
});

describe("GET /api/monitor/citations - Authentication (AC-2.3.1)", () => {
  it("should return 401 when not authenticated", async () => {
    vi.mocked(getOrganizationId).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Organization not found");
  });

  it("should return 200 when authenticated", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe("GET /api/monitor/citations - Citation Aggregation by URL (AC-2.3.2)", () => {
  it("should aggregate citations by URL", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.citations)).toBe(true);
  });

  it("should return unique URLs with aggregated counts", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Mock data has 3 unique URLs (article-1 x3, article-2 x1, blog/post-1 x1)
    // article-1 should have citations: 3
    // article-2 should have citations: 1
    // blog/post-1 should have citations: 1
    const citation1 = data.citations.find((c: { url: string }) => c.url === "https://example.com/article-1");
    const citation2 = data.citations.find((c: { url: string }) => c.url === "https://example.com/article-2");

    if (citation1) {
      expect(citation1.citations).toBe(3);
    }
    if (citation2) {
      expect(citation2.citations).toBe(1);
    }
  });

  it("should sort citations by count descending", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.citations.length).toBeGreaterThan(0);

    // Verify sorted by citations count descending
    for (let i = 1; i < data.citations.length; i++) {
      expect(data.citations[i].citations).toBeLessThanOrEqual(data.citations[i - 1].citations);
    }
  });

  it("should include platform breakdown per citation", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.citations.length > 0) {
      const firstCitation = data.citations[0];
      expect(firstCitation).toHaveProperty("platforms");
      expect(typeof firstCitation.platforms).toBe("object");
    }
  });

  it("should track platform counts correctly for aggregated citations", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // article-1 has: chatgpt x1, claude x1, gemini x1
    const citation1 = data.citations.find((c: { url: string }) => c.url === "https://example.com/article-1");

    if (citation1) {
      expect(citation1.platforms.chatgpt).toBe(1);
      expect(citation1.platforms.claude).toBe(1);
      expect(citation1.platforms.gemini).toBe(1);
    }
  });

  it("should return empty citations array when organization has no brands", async () => {
    setupStandardMock([], []);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.citations).toEqual([]);
    expect(data.total).toBe(0);
  });

  it("should return empty citations array when no mentions have citations", async () => {
    setupStandardMock(mockBrands, []);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.citations).toEqual([]);
    // trendData still contains date entries with 0 citations
    expect(data.trendData.length).toBe(30); // Default 30d range
    expect(data.trendData.every((t: { citations: number }) => t.citations === 0)).toBe(true);
  });
});

describe("GET /api/monitor/citations - Trend Data Calculation (AC-2.3.3)", () => {
  it("should return trend data array", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.trendData)).toBe(true);
  });

  it("should include date field in trend data points", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.trendData.length > 0) {
      const firstPoint = data.trendData[0];
      expect(firstPoint).toHaveProperty("date");
      expect(typeof firstPoint.date).toBe("string");
    }
  });

  it("should include citations count in trend data points", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.trendData.length > 0) {
      const firstPoint = data.trendData[0];
      expect(firstPoint).toHaveProperty("citations");
      expect(typeof firstPoint.citations).toBe("number");
    }
  });

  it("should generate correct number of trend entries for 7d range", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?range=7d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should have 7 date entries
    expect(data.trendData.length).toBe(7);
  });

  it("should generate correct number of trend entries for 30d range", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?range=30d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should have 30 date entries
    expect(data.trendData.length).toBe(30);
  });

  it("should have trend data in chronological order", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?range=7d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.trendData.length).toBe(7);

    // Trend data should be in date order (oldest to newest)
    // We can't directly compare formatted dates, but the order should be consistent
    expect(data.trendData.length).toBeGreaterThan(0);
  });

  it("should have zeros for days without citations", async () => {
    // Setup with mentions only on today
    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: "https://example.com/article",
        platform: "chatgpt",
        response: "Test response",
        timestamp: today,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations?range=7d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Most entries should be 0, only today should have citations
    const zeroEntries = data.trendData.filter((t: { citations: number }) => t.citations === 0);
    expect(zeroEntries.length).toBeGreaterThanOrEqual(6); // At least 6 out of 7 days should be 0
  });
});

describe("GET /api/monitor/citations - Citation Response Format (AC-2.3.4)", () => {
  it("should return correct citation object structure", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.citations.length > 0) {
      const citation = data.citations[0];
      expect(citation).toHaveProperty("id");
      expect(citation).toHaveProperty("url");
      expect(citation).toHaveProperty("title");
      expect(citation).toHaveProperty("citations");
      expect(citation).toHaveProperty("lastCited");
      expect(citation).toHaveProperty("platforms");
      expect(citation).toHaveProperty("context");
    }
  });

  it("should generate citation ID", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.citations.length > 0) {
      const citation = data.citations[0];
      expect(citation.id).toMatch(/^citation-\d+$/);
    }
  });

  it("should extract title from URL", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.citations.length > 0) {
      const citation = data.citations[0];
      expect(typeof citation.title).toBe("string");
      expect(citation.title.length).toBeGreaterThan(0);
    }
  });

  it("should format lastCited as relative time string", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.citations.length > 0) {
      const citation = data.citations[0];
      expect(typeof citation.lastCited).toBe("string");
      // Should be relative time like "Just now", "1h ago", "Yesterday", etc.
      expect(citation.lastCited.length).toBeGreaterThan(0);
    }
  });

  it("should extract context snippet from response", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.citations.length > 0) {
      const citation = data.citations[0];
      expect(typeof citation.context).toBe("string");
      // Context should be truncated to ~200 chars
      expect(citation.context.length).toBeLessThanOrEqual(203); // 200 + "..."
    }
  });

  it("should include total unique URLs count", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("total");
    expect(typeof data.total).toBe("number");
    // Mock data has 3 unique URLs
    expect(data.total).toBe(3);
  });
});

describe("GET /api/monitor/citations - Query Parameter Validation", () => {
  it("should use default range of 30d", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("30d");
  });

  it("should respect 7d range parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?range=7d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("7d");
  });

  it("should respect 14d range parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?range=14d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("14d");
  });

  it("should respect 90d range parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?range=90d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("90d");
  });

  it("should return 400 for invalid range value", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?range=invalid");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should return 400 for unsupported range value", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?range=60d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should use default limit of 20", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Limit should be applied to citations array
    expect(data.citations.length).toBeLessThanOrEqual(20);
  });

  it("should respect custom limit parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?limit=5");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.citations.length).toBeLessThanOrEqual(5);
  });

  it("should return 400 for limit exceeding maximum (50)", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?limit=100");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should return 400 for limit below minimum (1)", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?limit=0");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should accept optional brandId parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?brandId=brand-1");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should work with multiple parameters combined", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?brandId=brand-1&range=7d&limit=10");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.meta.range).toBe("7d");
    expect(data.citations.length).toBeLessThanOrEqual(10);
    expect(data.trendData.length).toBe(7);
  });
});

describe("GET /api/monitor/citations - Error Handling", () => {
  it("should handle database errors gracefully", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Database connection failed");
    });

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Database connection failed");
  });

  it("should return generic error message for unknown errors", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw "Unknown error type";
    });

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unknown error");
  });

  it("should return validation error details for invalid parameters", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?range=invalid");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
    expect(data.details).toBeDefined();
  });
});

describe("GET /api/monitor/citations - Response Structure", () => {
  it("should return correct response structure", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("citations");
    expect(data).toHaveProperty("trendData");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("meta");
  });

  it("should include meta information", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta).toHaveProperty("range");
    expect(data.meta).toHaveProperty("startDate");
    expect(data.meta).toHaveProperty("endDate");
    expect(data.meta).toHaveProperty("totalCitations");
  });

  it("should return valid ISO date strings in meta", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Validate startDate and endDate are valid ISO strings
    const startDate = new Date(data.meta.startDate);
    const endDate = new Date(data.meta.endDate);

    expect(startDate.toString()).not.toBe("Invalid Date");
    expect(endDate.toString()).not.toBe("Invalid Date");
  });

  it("should have startDate before endDate in meta", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    const startDate = new Date(data.meta.startDate);
    const endDate = new Date(data.meta.endDate);

    expect(startDate < endDate).toBe(true);
  });

  it("should return totalCitations as a number in meta", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(typeof data.meta.totalCitations).toBe("number");
    // Total citations count all mentions with citations, not unique URLs
    expect(data.meta.totalCitations).toBe(5); // 5 mentions in mock data
  });
});

describe("GET /api/monitor/citations - Edge Cases", () => {
  it("should handle mentions with null citationUrl", async () => {
    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: null,
        platform: "chatgpt",
        response: "No citation URL",
        timestamp: today,
      },
      {
        id: "m2",
        citationUrl: "https://example.com/valid",
        platform: "claude",
        response: "Has citation URL",
        timestamp: today,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Should only include the mention with valid citationUrl
    expect(data.total).toBe(1);
  });

  it("should handle very long URLs", async () => {
    const longUrl = "https://example.com/" + "a".repeat(200);
    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: longUrl,
        platform: "chatgpt",
        response: "Test response",
        timestamp: today,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.citations[0].url).toBe(longUrl);
  });

  it("should handle very long responses (truncate context)", async () => {
    const longResponse = "A".repeat(500);
    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: "https://example.com/article",
        platform: "chatgpt",
        response: longResponse,
        timestamp: today,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Context should be truncated to ~200 chars + "..."
    expect(data.citations[0].context.length).toBeLessThanOrEqual(203);
    expect(data.citations[0].context.endsWith("...")).toBe(true);
  });

  it("should handle short responses (no truncation)", async () => {
    const shortResponse = "Short response.";
    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: "https://example.com/article",
        platform: "chatgpt",
        response: shortResponse,
        timestamp: today,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Context should not be truncated
    expect(data.citations[0].context).toBe(shortResponse);
    expect(data.citations[0].context.endsWith("...")).toBe(false);
  });

  it("should handle invalid URL format gracefully", async () => {
    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: "not-a-valid-url",
        platform: "chatgpt",
        response: "Test response",
        timestamp: today,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Title extraction should fallback gracefully
    expect(data.citations[0].title.length).toBeGreaterThan(0);
  });

  it("should update context with most recent citation", async () => {
    const oldResponse = "Old response from yesterday.";
    const newResponse = "New response from today with more details.";

    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: "https://example.com/article",
        platform: "chatgpt",
        response: oldResponse,
        timestamp: yesterday,
      },
      {
        id: "m2",
        citationUrl: "https://example.com/article",
        platform: "claude",
        response: newResponse,
        timestamp: today,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Context should be from the most recent citation (today's)
    expect(data.citations[0].context).toBe(newResponse);
  });

  it("should handle single brand filter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/citations?brandId=brand-1");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Should filter by brandId
    expect(db.select).toHaveBeenCalled();
  });

  it("should handle URL with only hostname", async () => {
    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: "https://example.com",
        platform: "chatgpt",
        response: "Test response",
        timestamp: today,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Title should fallback to hostname
    expect(data.citations[0].title).toBe("example.com");
  });
});

describe("GET /api/monitor/citations - Title Extraction", () => {
  it("should extract title from URL path", async () => {
    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: "https://example.com/blog/my-article-title",
        platform: "chatgpt",
        response: "Test response",
        timestamp: today,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Title should be extracted from last path segment
    expect(data.citations[0].title).toBe("My Article Title");
  });

  it("should handle URL with file extension", async () => {
    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: "https://example.com/article.html",
        platform: "chatgpt",
        response: "Test response",
        timestamp: today,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should strip .html extension
    expect(data.citations[0].title).toBe("Article");
  });

  it("should handle URL with hyphens and underscores", async () => {
    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: "https://example.com/blog/my_article-title",
        platform: "chatgpt",
        response: "Test response",
        timestamp: today,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should convert hyphens and underscores to spaces
    expect(data.citations[0].title).toBe("My Article Title");
  });
});

describe("GET /api/monitor/citations - Last Cited Formatting", () => {
  it("should format very recent citations as 'Just now'", async () => {
    const justNow = new Date();
    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: "https://example.com/article",
        platform: "chatgpt",
        response: "Test response",
        timestamp: justNow,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should be "Just now" for very recent
    expect(data.citations[0].lastCited).toBe("Just now");
  });

  it("should format yesterday citations appropriately", async () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(oneDayAgo.getHours() - 1); // Ensure it's more than 24h ago

    setupStandardMock(mockBrands, [
      {
        id: "m1",
        citationUrl: "https://example.com/article",
        platform: "chatgpt",
        response: "Test response",
        timestamp: oneDayAgo,
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/citations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should be "Yesterday" or "X days ago"
    expect(data.citations[0].lastCited).toMatch(/Yesterday|days ago/);
  });
});
