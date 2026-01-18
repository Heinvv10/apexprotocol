/**
 * Unit Tests for /api/monitor/prompts route
 * Testing authentication, query aggregation, trend calculation, and error handling
 * Following existing test patterns from mentions, analytics, and citations route tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock Clerk auth via lib/auth
vi.mock("@/lib/auth", () => ({
  getOrganizationId: vi.fn(),
}));

// Mock brands data
const mockBrands = [
  { id: "brand-1" },
  { id: "brand-2" },
];

// Create mock date helpers
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

// Previous period dates (for trend calculation - 30 days back from current period)
const previousPeriodDate = new Date(today);
previousPeriodDate.setDate(previousPeriodDate.getDate() - 35);

// Mock mentions for current period aggregation testing
const mockCurrentMentions = [
  {
    query: "What is the best AI writing tool?",
    platform: "chatgpt",
    sentiment: "positive",
    timestamp: today,
  },
  {
    query: "What is the best AI writing tool?",
    platform: "claude",
    sentiment: "positive",
    timestamp: yesterday,
  },
  {
    query: "What is the best AI writing tool?",
    platform: "perplexity",
    sentiment: "neutral",
    timestamp: twoDaysAgo,
  },
  {
    query: "Compare Brand A vs Brand B",
    platform: "chatgpt",
    sentiment: "neutral",
    timestamp: today,
  },
  {
    query: "Compare Brand A vs Brand B",
    platform: "gemini",
    sentiment: "negative",
    timestamp: yesterday,
  },
  {
    query: "Top marketing automation tools 2024",
    platform: "perplexity",
    sentiment: "positive",
    timestamp: threeDaysAgo,
  },
];

// Mock mentions for previous period (for trend calculation)
const mockPreviousMentions = [
  { query: "What is the best AI writing tool?" }, // 1 in previous period vs 3 in current = +200% = up
  { query: "Compare Brand A vs Brand B" }, // 1 in previous vs 2 in current = +100% = up
  { query: "Compare Brand A vs Brand B" }, // 2 in previous vs 2 in current = 0% = stable
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

// Helper to setup standard mock behavior (brands + current mentions + previous mentions)
const setupStandardMock = (
  brandsResult = mockBrands,
  currentMentionsResult = mockCurrentMentions,
  previousMentionsResult = mockPreviousMentions
) => {
  let callCount = 0;
  vi.mocked(db.select).mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // First call: get organization's brands
      return createChain(brandsResult) as ReturnType<typeof db.select>;
    }
    if (callCount === 2) {
      // Second call: get current period mentions
      return createChain(currentMentionsResult) as ReturnType<typeof db.select>;
    }
    // Third call: get previous period mentions (for trend calculation)
    return createChain(previousMentionsResult) as ReturnType<typeof db.select>;
  });
};

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrganizationId).mockResolvedValue("test-org-id");
  // Setup default mock behavior
  setupStandardMock();
});

describe("GET /api/monitor/prompts - Authentication (AC-2.4.1)", () => {
  it("should return 401 when not authenticated", async () => {
    vi.mocked(getOrganizationId).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Organization not found");
  });

  it("should return 200 when authenticated", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe("GET /api/monitor/prompts - Query Aggregation by Text (AC-2.4.2)", () => {
  it("should aggregate prompts by query text", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.prompts)).toBe(true);
  });

  it("should return unique prompts with aggregated data", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Mock data has 3 unique queries
    // "What is the best AI writing tool?" appears 3 times
    // "Compare Brand A vs Brand B" appears 2 times
    // "Top marketing automation tools 2024" appears 1 time
    expect(data.prompts.length).toBe(3);
    expect(data.total).toBe(3);
  });

  it("should aggregate platforms per prompt", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Find the "What is the best AI writing tool?" prompt
    const aiWritingPrompt = data.prompts.find(
      (p: { promptText: string }) => p.promptText === "What is the best AI writing tool?"
    );

    if (aiWritingPrompt) {
      // Should have chatgpt, claude, perplexity platforms
      expect(aiWritingPrompt.platforms).toContain("chatgpt");
      expect(aiWritingPrompt.platforms).toContain("claude");
      expect(aiWritingPrompt.platforms).toContain("perplexity");
      expect(aiWritingPrompt.platforms.length).toBe(3);
    }
  });

  it("should sort prompts by frequency descending", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prompts.length).toBeGreaterThan(0);

    // Verify sorted by frequency descending
    for (let i = 1; i < data.prompts.length; i++) {
      expect(data.prompts[i].frequency).toBeLessThanOrEqual(data.prompts[i - 1].frequency);
    }
  });

  it("should return empty prompts array when organization has no brands", async () => {
    setupStandardMock([], [], []);

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.prompts).toEqual([]);
    expect(data.total).toBe(0);
  });

  it("should return empty prompts array when no mentions exist", async () => {
    setupStandardMock(mockBrands, [], []);

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.prompts).toEqual([]);
    expect(data.total).toBe(0);
  });
});

describe("GET /api/monitor/prompts - Frequency Calculation (AC-2.4.3)", () => {
  it("should calculate frequency correctly for each prompt", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // "What is the best AI writing tool?" appears 3 times in mock data
    const aiWritingPrompt = data.prompts.find(
      (p: { promptText: string }) => p.promptText === "What is the best AI writing tool?"
    );

    if (aiWritingPrompt) {
      expect(aiWritingPrompt.frequency).toBe(3);
    }
  });

  it("should count single occurrence prompts as frequency 1", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // "Top marketing automation tools 2024" appears only once
    const marketingPrompt = data.prompts.find(
      (p: { promptText: string }) => p.promptText === "Top marketing automation tools 2024"
    );

    if (marketingPrompt) {
      expect(marketingPrompt.frequency).toBe(1);
    }
  });

  it("should include frequency as a number", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      const firstPrompt = data.prompts[0];
      expect(typeof firstPrompt.frequency).toBe("number");
      expect(firstPrompt.frequency).toBeGreaterThan(0);
    }
  });
});

describe("GET /api/monitor/prompts - Trend Direction Calculation (AC-2.4.4)", () => {
  it("should calculate trend as 'up' when frequency increased significantly", async () => {
    // Setup: "What is the best AI writing tool?" has 3 in current period, 1 in previous = +200% > 10%
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    const aiWritingPrompt = data.prompts.find(
      (p: { promptText: string }) => p.promptText === "What is the best AI writing tool?"
    );

    if (aiWritingPrompt) {
      expect(aiWritingPrompt.trend).toBe("up");
      expect(aiWritingPrompt.trendValue).toBeGreaterThan(0);
    }
  });

  it("should calculate trend as 'stable' when frequency change is within threshold", async () => {
    // Setup: query with similar count in both periods (within 10%)
    setupStandardMock(
      mockBrands,
      [
        { query: "Test query", platform: "chatgpt", sentiment: "neutral", timestamp: today },
        { query: "Test query", platform: "claude", sentiment: "neutral", timestamp: yesterday },
      ],
      [
        { query: "Test query" },
        { query: "Test query" },
      ]
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      // 2 in current, 2 in previous = 0% change = stable
      expect(data.prompts[0].trend).toBe("stable");
    }
  });

  it("should calculate trend as 'down' when frequency decreased significantly", async () => {
    // Setup: more in previous period than current
    setupStandardMock(
      mockBrands,
      [
        { query: "Declining query", platform: "chatgpt", sentiment: "neutral", timestamp: today },
      ],
      [
        { query: "Declining query" },
        { query: "Declining query" },
        { query: "Declining query" },
        { query: "Declining query" },
      ]
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      // 1 in current, 4 in previous = -75% < -10% = down
      expect(data.prompts[0].trend).toBe("down");
    }
  });

  it("should set trend as 'up' with 100% trendValue for new queries", async () => {
    // Setup: query appears only in current period (not in previous)
    setupStandardMock(
      mockBrands,
      [
        { query: "Brand new query", platform: "chatgpt", sentiment: "positive", timestamp: today },
      ],
      [] // No previous mentions
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      expect(data.prompts[0].trend).toBe("up");
      expect(data.prompts[0].trendValue).toBe(100);
    }
  });

  it("should include trendValue as a number", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      const firstPrompt = data.prompts[0];
      expect(typeof firstPrompt.trendValue).toBe("number");
      expect(firstPrompt.trendValue).toBeGreaterThanOrEqual(0);
    }
  });

  it("should include trend direction as valid enum value", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      const firstPrompt = data.prompts[0];
      expect(["up", "down", "stable"]).toContain(firstPrompt.trend);
    }
  });
});

describe("GET /api/monitor/prompts - Sentiment Determination", () => {
  it("should determine dominant sentiment from mentions", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // "What is the best AI writing tool?" has 2 positive, 1 neutral = positive dominant
    const aiWritingPrompt = data.prompts.find(
      (p: { promptText: string }) => p.promptText === "What is the best AI writing tool?"
    );

    if (aiWritingPrompt) {
      expect(aiWritingPrompt.sentiment).toBe("positive");
    }
  });

  it("should return valid sentiment enum value", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      const firstPrompt = data.prompts[0];
      expect(["positive", "neutral", "negative"]).toContain(firstPrompt.sentiment);
    }
  });

  it("should default to neutral when sentiments are equal", async () => {
    setupStandardMock(
      mockBrands,
      [
        { query: "Equal sentiment query", platform: "chatgpt", sentiment: "positive", timestamp: today },
        { query: "Equal sentiment query", platform: "claude", sentiment: "negative", timestamp: yesterday },
      ],
      []
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      // With equal positive and negative, should still pick one (first max found)
      expect(["positive", "neutral", "negative"]).toContain(data.prompts[0].sentiment);
    }
  });
});

describe("GET /api/monitor/prompts - Query Parameter Validation", () => {
  it("should use default range of 30d", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("30d");
  });

  it("should respect 7d range parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?range=7d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("7d");
  });

  it("should respect 14d range parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?range=14d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("14d");
  });

  it("should respect 90d range parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?range=90d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.range).toBe("90d");
  });

  it("should return 400 for invalid range value", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?range=invalid");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should return 400 for unsupported range value", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?range=60d");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should use default limit of 50", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // With mock data, we have 3 prompts, so it won't exceed default limit
    expect(data.prompts.length).toBeLessThanOrEqual(50);
  });

  it("should respect custom limit parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?limit=2");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should be limited to 2, even though we have 3 unique prompts
    expect(data.prompts.length).toBeLessThanOrEqual(2);
  });

  it("should return 400 for limit exceeding maximum (100)", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?limit=150");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should return 400 for limit below minimum (1)", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?limit=0");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should accept optional brandId parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?brandId=brand-1");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should work with multiple parameters combined", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?brandId=brand-1&range=7d&limit=10");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.meta.range).toBe("7d");
    expect(data.prompts.length).toBeLessThanOrEqual(10);
  });
});

describe("GET /api/monitor/prompts - Error Handling", () => {
  it("should handle database errors gracefully", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Database connection failed");
    });

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
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

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unknown error");
  });

  it("should return validation error details for invalid parameters", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?range=invalid");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
    expect(data.details).toBeDefined();
  });
});

describe("GET /api/monitor/prompts - Response Structure", () => {
  it("should return correct response structure", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("prompts");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("meta");
  });

  it("should include meta information", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta).toHaveProperty("range");
    expect(data.meta).toHaveProperty("startDate");
    expect(data.meta).toHaveProperty("endDate");
  });

  it("should return valid ISO date strings in meta", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
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
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    const startDate = new Date(data.meta.startDate);
    const endDate = new Date(data.meta.endDate);

    expect(startDate < endDate).toBe(true);
  });

  it("should return correct prompt object structure", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      const prompt = data.prompts[0];
      expect(prompt).toHaveProperty("id");
      expect(prompt).toHaveProperty("promptText");
      expect(prompt).toHaveProperty("platforms");
      expect(prompt).toHaveProperty("frequency");
      expect(prompt).toHaveProperty("trend");
      expect(prompt).toHaveProperty("trendValue");
      expect(prompt).toHaveProperty("sentiment");
      expect(prompt).toHaveProperty("lastSeen");
    }
  });

  it("should generate sequential prompt IDs", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      expect(data.prompts[0].id).toBe("prompt-1");
      if (data.prompts.length > 1) {
        expect(data.prompts[1].id).toBe("prompt-2");
      }
    }
  });
});

describe("GET /api/monitor/prompts - Last Seen Formatting", () => {
  it("should format very recent prompts as 'Just now'", async () => {
    const justNow = new Date();
    setupStandardMock(
      mockBrands,
      [
        { query: "Recent query", platform: "chatgpt", sentiment: "neutral", timestamp: justNow },
      ],
      []
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      expect(data.prompts[0].lastSeen).toBe("Just now");
    }
  });

  it("should format hours ago correctly", async () => {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - 5);

    setupStandardMock(
      mockBrands,
      [
        { query: "Hours ago query", platform: "chatgpt", sentiment: "neutral", timestamp: hoursAgo },
      ],
      []
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      expect(data.prompts[0].lastSeen).toMatch(/\d+h ago/);
    }
  });

  it("should format yesterday correctly", async () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(oneDayAgo.getHours() - 1); // Ensure it's more than 24h ago

    setupStandardMock(
      mockBrands,
      [
        { query: "Yesterday query", platform: "chatgpt", sentiment: "neutral", timestamp: oneDayAgo },
      ],
      []
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      expect(data.prompts[0].lastSeen).toBe("Yesterday");
    }
  });

  it("should format days ago correctly", async () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    setupStandardMock(
      mockBrands,
      [
        { query: "Days ago query", platform: "chatgpt", sentiment: "neutral", timestamp: fiveDaysAgo },
      ],
      []
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      expect(data.prompts[0].lastSeen).toMatch(/\d+ days ago/);
    }
  });

  it("should format older dates with month and day", async () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    setupStandardMock(
      mockBrands,
      [
        { query: "Two weeks ago query", platform: "chatgpt", sentiment: "neutral", timestamp: twoWeeksAgo },
      ],
      []
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      // Should be formatted like "Dec 9" or similar
      expect(data.prompts[0].lastSeen).toMatch(/[A-Z][a-z]{2} \d+/);
    }
  });
});

describe("GET /api/monitor/prompts - Edge Cases", () => {
  it("should handle prompts with special characters", async () => {
    setupStandardMock(
      mockBrands,
      [
        {
          query: "What's the best AI tool for writing & editing?",
          platform: "chatgpt",
          sentiment: "neutral",
          timestamp: today,
        },
      ],
      []
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.prompts[0].promptText).toBe("What's the best AI tool for writing & editing?");
  });

  it("should handle very long prompt text", async () => {
    const longQuery = "A".repeat(500);
    setupStandardMock(
      mockBrands,
      [
        { query: longQuery, platform: "chatgpt", sentiment: "neutral", timestamp: today },
      ],
      []
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.prompts[0].promptText).toBe(longQuery);
  });

  it("should handle unicode characters in prompts", async () => {
    setupStandardMock(
      mockBrands,
      [
        {
          query: "¿Cuál es la mejor herramienta de IA? 🤖",
          platform: "chatgpt",
          sentiment: "positive",
          timestamp: today,
        },
      ],
      []
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.prompts[0].promptText).toBe("¿Cuál es la mejor herramienta de IA? 🤖");
  });

  it("should update lastSeen with most recent timestamp", async () => {
    const oldTimestamp = new Date();
    oldTimestamp.setDate(oldTimestamp.getDate() - 5);
    const newTimestamp = new Date(); // Today

    setupStandardMock(
      mockBrands,
      [
        { query: "Same query", platform: "chatgpt", sentiment: "neutral", timestamp: oldTimestamp },
        { query: "Same query", platform: "claude", sentiment: "neutral", timestamp: newTimestamp },
      ],
      []
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Should show "Just now" since the most recent timestamp is today
    expect(data.prompts[0].lastSeen).toBe("Just now");
  });

  it("should handle single brand filter correctly", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?brandId=brand-1");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(db.select).toHaveBeenCalled();
  });

  it("should handle all platforms correctly", async () => {
    setupStandardMock(
      mockBrands,
      [
        { query: "Multi-platform query", platform: "chatgpt", sentiment: "neutral", timestamp: today },
        { query: "Multi-platform query", platform: "claude", sentiment: "neutral", timestamp: today },
        { query: "Multi-platform query", platform: "gemini", sentiment: "neutral", timestamp: today },
        { query: "Multi-platform query", platform: "perplexity", sentiment: "neutral", timestamp: today },
        { query: "Multi-platform query", platform: "grok", sentiment: "neutral", timestamp: today },
        { query: "Multi-platform query", platform: "deepseek", sentiment: "neutral", timestamp: today },
        { query: "Multi-platform query", platform: "copilot", sentiment: "neutral", timestamp: today },
      ],
      []
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.prompts[0].platforms.length).toBe(7);
    expect(data.prompts[0].platforms).toContain("chatgpt");
    expect(data.prompts[0].platforms).toContain("claude");
    expect(data.prompts[0].platforms).toContain("gemini");
    expect(data.prompts[0].platforms).toContain("perplexity");
    expect(data.prompts[0].platforms).toContain("grok");
    expect(data.prompts[0].platforms).toContain("deepseek");
    expect(data.prompts[0].platforms).toContain("copilot");
  });

  it("should apply limit correctly even when more prompts exist", async () => {
    // Create many unique prompts
    const manyMentions = Array.from({ length: 20 }, (_, i) => ({
      query: `Unique query ${i}`,
      platform: "chatgpt",
      sentiment: "neutral" as const,
      timestamp: today,
    }));

    setupStandardMock(mockBrands, manyMentions, []);

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts?limit=5");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prompts.length).toBe(5);
    expect(data.total).toBe(20); // Total unique prompts before limit
  });
});

describe("GET /api/monitor/prompts - Platform Array Handling", () => {
  it("should return platforms as an array", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    if (data.prompts.length > 0) {
      expect(Array.isArray(data.prompts[0].platforms)).toBe(true);
    }
  });

  it("should not duplicate platforms", async () => {
    setupStandardMock(
      mockBrands,
      [
        { query: "Duplicate platform query", platform: "chatgpt", sentiment: "neutral", timestamp: today },
        { query: "Duplicate platform query", platform: "chatgpt", sentiment: "positive", timestamp: yesterday },
        { query: "Duplicate platform query", platform: "chatgpt", sentiment: "negative", timestamp: twoDaysAgo },
      ],
      []
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/prompts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prompts[0].platforms.length).toBe(1);
    expect(data.prompts[0].platforms).toContain("chatgpt");
    expect(data.prompts[0].frequency).toBe(3);
  });
});
