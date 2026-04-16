/**
 * Unit Tests for /api/monitor/mentions/analytics route
 * Testing authentication, data aggregation, time range filtering, and error handling
 * Following existing test patterns from mentions route tests
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

// Create mock mentions for aggregation testing
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

const mockMentions = [
  { id: "m1", platform: "chatgpt", sentiment: "positive", timestamp: today },
  { id: "m2", platform: "chatgpt", sentiment: "positive", timestamp: today },
  { id: "m3", platform: "claude", sentiment: "neutral", timestamp: today },
  { id: "m4", platform: "perplexity", sentiment: "negative", timestamp: yesterday },
  { id: "m5", platform: "chatgpt", sentiment: "positive", timestamp: yesterday },
  { id: "m6", platform: "gemini", sentiment: "neutral", timestamp: twoDaysAgo },
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

// Helper to setup standard mock behavior (brands + mentions)
const setupStandardMock = (brandsResult = mockBrands, mentionsResult = mockMentions) => {
  let callCount = 0;
  vi.mocked(db.select).mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // First call: get organization's brands
      return createChain(brandsResult) as ReturnType<typeof db.select>;
    }
    // Second call: get mentions
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

describe("GET /api/monitor/mentions/analytics - Authentication (AC-2.2.1)", () => {
  it("should return 401 when not authenticated", async () => {
    vi.mocked(getOrganizationId).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Organization not found");
  });

  it("should return 200 when authenticated", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe("GET /api/monitor/mentions/analytics - Data Aggregation by Date (AC-2.2.2)", () => {
  it("should return analytics data array sorted by date", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);

    // Verify data is sorted by date ascending
    for (let i = 1; i < data.data.length; i++) {
      expect(data.data[i].date >= data.data[i - 1].date).toBe(true);
    }
  });

  it("should include date and displayDate fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Each data point should have date and displayDate
    if (data.data.length > 0) {
      const firstPoint = data.data[0];
      expect(firstPoint).toHaveProperty("date");
      expect(firstPoint).toHaveProperty("displayDate");
      expect(typeof firstPoint.date).toBe("string");
      expect(typeof firstPoint.displayDate).toBe("string");
    }
  });

  it("should include platform breakdown in each data point", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Each data point should have platform counts
    if (data.data.length > 0) {
      const firstPoint = data.data[0];
      expect(firstPoint).toHaveProperty("chatgpt");
      expect(firstPoint).toHaveProperty("claude");
      expect(firstPoint).toHaveProperty("perplexity");
      expect(firstPoint).toHaveProperty("gemini");
      expect(firstPoint).toHaveProperty("grok");
      expect(firstPoint).toHaveProperty("deepseek");
      expect(firstPoint).toHaveProperty("copilot");
      expect(firstPoint).toHaveProperty("total");
    }
  });

  it("should return empty data when organization has no brands", async () => {
    setupStandardMock([], []);

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
    expect(data.sentiment).toEqual({ total: 0, positive: 0, neutral: 0, negative: 0, unrecognized: 0 });
    expect(data.platforms).toEqual({});
  });
});

describe("GET /api/monitor/mentions/analytics - Sentiment Stats (AC-2.2.3)", () => {
  it("should return sentiment statistics object", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("sentiment");
    expect(data.sentiment).toHaveProperty("total");
    expect(data.sentiment).toHaveProperty("positive");
    expect(data.sentiment).toHaveProperty("neutral");
    expect(data.sentiment).toHaveProperty("negative");
  });

  it("should calculate sentiment totals correctly", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Verify sentiment counts match mock data
    // Mock data has: 3 positive, 2 neutral, 1 negative = 6 total
    expect(data.sentiment.total).toBe(6);
    expect(data.sentiment.positive).toBe(3);
    expect(data.sentiment.neutral).toBe(2);
    expect(data.sentiment.negative).toBe(1);
  });

  it("should ensure sentiment parts sum to total", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    const { total, positive, neutral, negative } = data.sentiment;
    expect(positive + neutral + negative).toBe(total);
  });
});

describe("GET /api/monitor/mentions/analytics - Platform Stats", () => {
  it("should return platform statistics object", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("platforms");
    expect(typeof data.platforms).toBe("object");
  });

  it("should include all supported platforms", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    const platforms = data.platforms;
    expect(platforms).toHaveProperty("chatgpt");
    expect(platforms).toHaveProperty("claude");
    expect(platforms).toHaveProperty("perplexity");
    expect(platforms).toHaveProperty("gemini");
    expect(platforms).toHaveProperty("grok");
    expect(platforms).toHaveProperty("deepseek");
    expect(platforms).toHaveProperty("copilot");
  });

  it("should calculate platform counts correctly", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Mock data: 3 chatgpt, 1 claude, 1 perplexity, 1 gemini
    expect(data.platforms.chatgpt).toBe(3);
    expect(data.platforms.claude).toBe(1);
    expect(data.platforms.perplexity).toBe(1);
    expect(data.platforms.gemini).toBe(1);
  });
});

describe("GET /api/monitor/mentions/analytics - Time Range Parameter (AC-2.2.4)", () => {
  it("should use default range of 30d", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("30d");
  });

  it("should respect 7d range parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics?range=7d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("7d");
  });

  it("should respect 14d range parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics?range=14d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("14d");
  });

  it("should respect 30d range parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics?range=30d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("30d");
  });

  it("should respect 90d range parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics?range=90d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("90d");
  });

  it("should return 400 for invalid range value", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics?range=invalid");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should return 400 for unsupported range value", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics?range=60d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });
});

describe("GET /api/monitor/mentions/analytics - Brand Filter Parameter", () => {
  it("should accept optional brandId parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics?brandId=brand-1");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should work without brandId parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should accept brandId with range parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics?brandId=brand-1&range=7d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.meta.range).toBe("7d");
  });
});

describe("GET /api/monitor/mentions/analytics - Error Handling", () => {
  it("should handle database errors gracefully", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Database connection failed");
    });

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
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

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unknown error");
  });

  it("should return validation error details for invalid parameters", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics?range=invalid");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
    expect(data.details).toBeDefined();
  });
});

describe("GET /api/monitor/mentions/analytics - Response Structure", () => {
  it("should return correct response structure", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("sentiment");
    expect(data).toHaveProperty("platforms");
    expect(data).toHaveProperty("meta");
  });

  it("should include meta information", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta).toHaveProperty("range");
    expect(data.meta).toHaveProperty("startDate");
    expect(data.meta).toHaveProperty("endDate");
    expect(data.meta).toHaveProperty("totalMentions");
  });

  it("should return valid ISO date strings in meta", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Validate startDate and endDate are valid ISO strings
    const startDate = new Date(data.meta.startDate);
    const endDate = new Date(data.meta.endDate);

    expect(startDate.toString()).not.toBe("Invalid Date");
    expect(endDate.toString()).not.toBe("Invalid Date");
  });

  it("should return totalMentions as a number", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(typeof data.meta.totalMentions).toBe("number");
  });
});

describe("GET /api/monitor/mentions/analytics - Date Range Calculation", () => {
  it("should have startDate before endDate", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    const startDate = new Date(data.meta.startDate);
    const endDate = new Date(data.meta.endDate);

    expect(startDate < endDate).toBe(true);
  });

  it("should generate correct number of date entries for 7d range", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics?range=7d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should have 7 date entries
    expect(data.data.length).toBe(7);
  });

  it("should generate correct number of date entries for 30d range", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics?range=30d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should have 30 date entries
    expect(data.data.length).toBe(30);
  });
});

describe("GET /api/monitor/mentions/analytics - Edge Cases", () => {
  it("should handle organization with brands but no mentions", async () => {
    setupStandardMock(mockBrands, []);

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sentiment.total).toBe(0);
    expect(data.meta.totalMentions).toBe(0);
  });

  it("should handle mentions without sentiment (default to neutral)", async () => {
    setupStandardMock(mockBrands, [
      { id: "m1", platform: "chatgpt", sentiment: null, timestamp: new Date() },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Null sentiment should be counted as neutral based on the else clause
    expect(data.sentiment.neutral).toBe(1);
  });

  it("should ignore unknown platforms in platform stats", async () => {
    setupStandardMock(mockBrands, [
      { id: "m1", platform: "unknown_platform", sentiment: "positive", timestamp: new Date() },
    ]);

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Unknown platform should not be counted in platform stats
    expect(data.platforms.chatgpt).toBe(0);
    expect(data.platforms.claude).toBe(0);
  });

  it("should handle multiple brands with same brandId filter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions/analytics?brandId=brand-1");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // db.select should be called with brandId filter condition
    expect(db.select).toHaveBeenCalled();
  });
});
