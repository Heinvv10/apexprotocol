/**
 * Unit Tests for /api/monitor/mentions route
 * Testing authentication, data filtering, pagination, and error handling
 * Following existing test patterns from admin routes
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

// Mock Clerk auth via lib/auth
vi.mock("@/lib/auth", () => ({
  getOrganizationId: vi.fn(),
}));

// Mock database with chainable query pattern
const mockBrands = [
  { id: "brand-1" },
  { id: "brand-2" },
];

const mockMentions = [
  {
    id: "mention-1",
    brandId: "brand-1",
    platform: "chatgpt",
    query: "What is the best SaaS tool?",
    response: "Brand A is highly recommended for...",
    sentiment: "positive",
    position: 1,
    citationUrl: "https://example.com/brand-a",
    competitors: [],
    promptCategory: "recommendation",
    topics: ["saas", "tools"],
    metadata: {},
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "mention-2",
    brandId: "brand-1",
    platform: "claude",
    query: "Compare AI tools",
    response: "When comparing AI tools, Brand A stands out...",
    sentiment: "neutral",
    position: 2,
    citationUrl: null,
    competitors: [{ name: "Competitor B", position: 1, sentiment: "positive" }],
    promptCategory: "comparison",
    topics: ["ai", "comparison"],
    metadata: { modelVersion: "claude-3" },
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

// Create chainable mock for database operations
const createSelectChain = (result: unknown[]) => {
  const chain: Record<string, unknown> = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn((limitVal: number) => {
      // For brand selection, return brands
      if (limitVal === 1) {
        return Promise.resolve(result.slice(0, 1));
      }
      return { ...chain, offset: vi.fn(() => Promise.resolve(result)) };
    }),
    offset: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: unknown) => void) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => void) => Promise.resolve(result).catch(reject),
  };
  return chain;
};

// Track inserted data for POST tests
let lastInsertedData: unknown = null;

vi.mock("@/lib/db", () => {
  return {
    db: {
      select: vi.fn((selectArgs?: Record<string, unknown>) => {
        // Determine what type of select this is
        if (selectArgs && "id" in selectArgs) {
          // Selecting brand IDs
          return createSelectChain(mockBrands);
        }
        if (selectArgs && "count" in selectArgs) {
          // Count query
          return createSelectChain([{ count: mockMentions.length }]);
        }
        // Default: mentions query
        return createSelectChain(mockMentions);
      }),
      insert: vi.fn(() => ({
        values: vi.fn((data: unknown) => {
          lastInsertedData = data;
          return {
            returning: vi.fn(() =>
              Promise.resolve([
                {
                  id: "new-mention-id",
                  ...lastInsertedData,
                  timestamp: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                },
              ])
            ),
          };
        }),
      })),
    },
  };
});

// Import mocked modules AFTER vi.mock declarations
import { getOrganizationId } from "@/lib/auth";
import { db } from "@/lib/db";

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrganizationId).mockResolvedValue("test-org-id");
  lastInsertedData = null;
});

describe("GET /api/monitor/mentions - Authentication (AC-2.1.1)", () => {
  it("should return 401 when not authenticated", async () => {
    vi.mocked(getOrganizationId).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Organization not found");
  });

  it("should return 200 when authenticated", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe("GET /api/monitor/mentions - Data Filtering (AC-2.1.2)", () => {
  it("should filter mentions by organization's brands only", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);

    // Verify db.select was called to get org's brands first
    expect(db.select).toHaveBeenCalled();
  });

  it("should return empty array when organization has no brands", async () => {
    // Override the mock to return empty brands
    vi.mocked(db.select).mockImplementationOnce(() =>
      createSelectChain([]) as ReturnType<typeof db.select>
    );

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
    expect(data.meta.total).toBe(0);
  });

  it("should filter by brandId parameter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/monitor/mentions?brandId=brand-1"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should filter by platform parameter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/monitor/mentions?platform=chatgpt"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should filter by sentiment parameter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/monitor/mentions?sentiment=positive"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should filter by date range", async () => {
    const startDate = "2024-01-01T00:00:00.000Z";
    const endDate = "2024-12-31T23:59:59.999Z";
    const request = new NextRequest(
      `http://localhost:3000/api/monitor/mentions?startDate=${startDate}&endDate=${endDate}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe("GET /api/monitor/mentions - Query Parameter Validation (AC-2.1.3)", () => {
  it("should validate platform enum values", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/monitor/mentions?platform=invalid_platform"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
    expect(data.details).toBeDefined();
  });

  it("should validate sentiment enum values", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/monitor/mentions?sentiment=invalid_sentiment"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should validate date format for startDate", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/monitor/mentions?startDate=invalid-date"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should validate date format for endDate", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/monitor/mentions?endDate=not-a-date"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should validate limit is within range (1-100)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/monitor/mentions?limit=500"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("should validate limit minimum value", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/monitor/mentions?limit=0"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("should validate offset is non-negative", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/monitor/mentions?offset=-1"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("should accept valid platform values", async () => {
    const validPlatforms = [
      "chatgpt",
      "claude",
      "gemini",
      "perplexity",
      "grok",
      "deepseek",
      "copilot",
    ];

    for (const platform of validPlatforms) {
      const request = new NextRequest(
        `http://localhost:3000/api/monitor/mentions?platform=${platform}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    }
  });

  it("should accept valid sentiment values", async () => {
    const validSentiments = ["positive", "neutral", "negative"];

    for (const sentiment of validSentiments) {
      const request = new NextRequest(
        `http://localhost:3000/api/monitor/mentions?sentiment=${sentiment}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    }
  });
});

describe("GET /api/monitor/mentions - Pagination (AC-2.1.3)", () => {
  it("should use default limit of 50", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.limit).toBe(50);
  });

  it("should use default offset of 0", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.offset).toBe(0);
  });

  it("should respect custom limit parameter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/monitor/mentions?limit=25"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.limit).toBe(25);
  });

  it("should respect custom offset parameter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/monitor/mentions?offset=10"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.offset).toBe(10);
  });

  it("should include total count in metadata", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta).toHaveProperty("total");
    expect(typeof data.meta.total).toBe("number");
  });

  it("should include timestamp in metadata", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta).toHaveProperty("timestamp");
    expect(typeof data.meta.timestamp).toBe("string");
  });
});

describe("GET /api/monitor/mentions - Error Handling (AC-2.1.4)", () => {
  it("should handle database errors gracefully", async () => {
    // Override db.select to throw an error
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Database connection failed");
    });

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Database connection failed");
  });

  it("should return generic error message for unknown errors", async () => {
    // Override db.select to throw a non-Error object
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw "Unknown error type";
    });

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unknown error");
  });
});

describe("GET /api/monitor/mentions - Response Structure", () => {
  it("should return correct response structure", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("meta");
    expect(data.meta).toHaveProperty("total");
    expect(data.meta).toHaveProperty("limit");
    expect(data.meta).toHaveProperty("offset");
    expect(data.meta).toHaveProperty("timestamp");
  });

  it("should return data as an array", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions");
    const response = await GET(request);
    const data = await response.json();

    expect(Array.isArray(data.data)).toBe(true);
  });
});

describe("POST /api/monitor/mentions - Authentication", () => {
  it("should return 401 when not authenticated", async () => {
    vi.mocked(getOrganizationId).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "brand-1",
        platform: "chatgpt",
        query: "Test query",
        response: "Test response",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Organization not found");
  });
});

describe("POST /api/monitor/mentions - Validation", () => {
  it("should return 400 when brandId is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        platform: "chatgpt",
        query: "Test query",
        response: "Test response",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });

  it("should return 400 when platform is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "brand-1",
        query: "Test query",
        response: "Test response",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });

  it("should return 400 when query is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "brand-1",
        platform: "chatgpt",
        response: "Test response",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });

  it("should return 400 when response is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "brand-1",
        platform: "chatgpt",
        query: "Test query",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });

  it("should return 400 when platform is invalid", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "brand-1",
        platform: "invalid_platform",
        query: "Test query",
        response: "Test response",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });

  it("should return 400 when sentiment is invalid", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "brand-1",
        platform: "chatgpt",
        query: "Test query",
        response: "Test response",
        sentiment: "invalid_sentiment",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });

  it("should return 400 when citationUrl is not a valid URL", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "brand-1",
        platform: "chatgpt",
        query: "Test query",
        response: "Test response",
        citationUrl: "not-a-valid-url",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });
});

describe("POST /api/monitor/mentions - Brand Ownership Verification", () => {
  it("should return 404 when brand does not belong to organization", async () => {
    // Mock db.select to return empty array for brand verification
    // The POST handler only does brand verification (no get brands first like GET)
    const emptyChain = {
      from: vi.fn(() => emptyChain),
      where: vi.fn(() => emptyChain),
      limit: vi.fn(() => Promise.resolve([])),
      then: (resolve: (value: unknown) => void) => Promise.resolve([]).then(resolve),
      catch: (reject: (reason: unknown) => void) => Promise.resolve([]).catch(reject),
    };
    vi.mocked(db.select).mockReturnValue(emptyChain as unknown as ReturnType<typeof db.select>);

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "other-org-brand",
        platform: "chatgpt",
        query: "Test query",
        response: "Test response",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Brand not found");
  });
});

describe("POST /api/monitor/mentions - Success Cases", () => {
  it("should create mention with required fields only", async () => {
    // Mock brand verification to return a valid brand with proper chain
    const validBrandChain = {
      from: vi.fn(() => validBrandChain),
      where: vi.fn(() => validBrandChain),
      limit: vi.fn(() => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }])),
      then: (resolve: (value: unknown) => void) => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }]).then(resolve),
      catch: (reject: (reason: unknown) => void) => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }]).catch(reject),
    };
    vi.mocked(db.select).mockReturnValue(validBrandChain as unknown as ReturnType<typeof db.select>);

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "brand-1",
        platform: "chatgpt",
        query: "Test query",
        response: "Test response",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("id");
  });

  it("should create mention with all optional fields", async () => {
    // Mock brand verification to return a valid brand with proper chain
    const validBrandChain = {
      from: vi.fn(() => validBrandChain),
      where: vi.fn(() => validBrandChain),
      limit: vi.fn(() => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }])),
      then: (resolve: (value: unknown) => void) => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }]).then(resolve),
      catch: (reject: (reason: unknown) => void) => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }]).catch(reject),
    };
    vi.mocked(db.select).mockReturnValue(validBrandChain as unknown as ReturnType<typeof db.select>);

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "brand-1",
        platform: "claude",
        query: "Test query with full data",
        response: "Comprehensive test response",
        sentiment: "positive",
        position: 1,
        citationUrl: "https://example.com/source",
        competitors: [
          { name: "Competitor A", position: 2, sentiment: "neutral" },
        ],
        promptCategory: "comparison",
        topics: ["ai", "tools"],
        metadata: {
          modelVersion: "claude-3-opus",
          responseLength: 500,
          confidenceScore: 0.95,
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("id");
  });

  it("should accept null for optional nullable fields", async () => {
    // Mock brand verification to return a valid brand with proper chain
    const validBrandChain = {
      from: vi.fn(() => validBrandChain),
      where: vi.fn(() => validBrandChain),
      limit: vi.fn(() => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }])),
      then: (resolve: (value: unknown) => void) => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }]).then(resolve),
      catch: (reject: (reason: unknown) => void) => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }]).catch(reject),
    };
    vi.mocked(db.select).mockReturnValue(validBrandChain as unknown as ReturnType<typeof db.select>);

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "brand-1",
        platform: "chatgpt",
        query: "Test query",
        response: "Test response",
        position: null,
        citationUrl: null,
        promptCategory: null,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});

describe("POST /api/monitor/mentions - Error Handling", () => {
  it("should handle database errors gracefully", async () => {
    // Mock brand check to pass but insert to fail
    const validBrandChain = {
      from: vi.fn(() => validBrandChain),
      where: vi.fn(() => validBrandChain),
      limit: vi.fn(() => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }])),
      then: (resolve: (value: unknown) => void) => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }]).then(resolve),
      catch: (reject: (reason: unknown) => void) => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }]).catch(reject),
    };
    vi.mocked(db.select).mockReturnValue(validBrandChain as unknown as ReturnType<typeof db.select>);
    vi.mocked(db.insert).mockImplementationOnce(() => {
      throw new Error("Database insert failed");
    });

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "brand-1",
        platform: "chatgpt",
        query: "Test query",
        response: "Test response",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Database insert failed");
  });

  it("should return generic error message for unknown errors", async () => {
    // Mock brand check to pass but insert to throw non-Error
    const validBrandChain = {
      from: vi.fn(() => validBrandChain),
      where: vi.fn(() => validBrandChain),
      limit: vi.fn(() => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }])),
      then: (resolve: (value: unknown) => void) => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }]).then(resolve),
      catch: (reject: (reason: unknown) => void) => Promise.resolve([{ id: "brand-1", organizationId: "test-org-id", isActive: true }]).catch(reject),
    };
    vi.mocked(db.select).mockReturnValue(validBrandChain as unknown as ReturnType<typeof db.select>);
    vi.mocked(db.insert).mockImplementationOnce(() => {
      throw "Unknown error type";
    });

    const request = new NextRequest("http://localhost:3000/api/monitor/mentions", {
      method: "POST",
      body: JSON.stringify({
        brandId: "brand-1",
        platform: "chatgpt",
        query: "Test query",
        response: "Test response",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unknown error");
  });
});
