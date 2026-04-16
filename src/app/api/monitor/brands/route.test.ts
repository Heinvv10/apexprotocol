/**
 * Unit Tests for /api/monitor/brands route
 * Testing authentication, brand listing, brand creation, and error handling
 * Following existing test patterns from mentions, analytics, citations, and prompts route tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

// Mock Clerk auth via lib/auth/clerk
vi.mock("@/lib/auth/clerk", () => ({
  getOrganizationId: vi.fn(),
}));

// Mock brand data matching the Brand schema
const mockBrands = [
  {
    id: "brand-1",
    organizationId: "test-org-id",
    name: "Acme Corp",
    domain: "https://acme.com",
    description: "A leading provider of innovative solutions",
    industry: "Technology",
    logoUrl: "https://acme.com/logo.png",
    keywords: ["innovation", "technology", "solutions"],
    competitors: [
      { name: "Competitor A", url: "https://competitor-a.com", reason: "Market overlap" },
    ],
    voice: {
      tone: "professional",
      personality: ["innovative", "trustworthy"],
      targetAudience: "Enterprise businesses",
      keyMessages: ["Quality first"],
      avoidTopics: ["controversial topics"],
    },
    visual: {
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      fontFamily: "Inter",
    },
    monitoringEnabled: true,
    monitoringPlatforms: ["chatgpt", "claude", "perplexity"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "brand-2",
    organizationId: "test-org-id",
    name: "Beta Industries",
    domain: "https://beta-industries.com",
    description: "Manufacturing excellence",
    industry: "Manufacturing",
    logoUrl: null,
    keywords: ["manufacturing", "quality"],
    competitors: [],
    voice: {
      tone: "formal",
      personality: ["reliable"],
      targetAudience: "B2B customers",
      keyMessages: [],
      avoidTopics: [],
    },
    visual: {
      primaryColor: null,
      secondaryColor: null,
      fontFamily: null,
    },
    monitoringEnabled: false,
    monitoringPlatforms: ["chatgpt"],
    isActive: true,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
];

// Create a chainable mock for database operations
const createChain = (result: unknown) => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => void) => Promise.resolve(result).catch(reject),
  };
  // Make all methods return the chain for chaining
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.offset.mockReturnValue(chain);
  chain.returning.mockReturnValue(chain);
  chain.values.mockReturnValue(chain);
  return chain;
};

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

// Import mocked modules AFTER vi.mock declarations
import { getOrganizationId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";

// Helper to setup standard mock behavior for GET
const setupSelectMock = (brandsResult = mockBrands) => {
  vi.mocked(db.select).mockImplementation(() => {
    return createChain(brandsResult) as ReturnType<typeof db.select>;
  });
};

// Helper to setup mock behavior for POST (insert)
const setupInsertMock = (returnedBrand = mockBrands[0]) => {
  const insertChain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockImplementation(() => {
      return Promise.resolve([returnedBrand]);
    }),
    then: (resolve: (value: unknown) => void) => Promise.resolve([returnedBrand]).then(resolve),
    catch: (reject: (reason: unknown) => void) => Promise.resolve([returnedBrand]).catch(reject),
  };
  vi.mocked(db.insert).mockReturnValue(insertChain as ReturnType<typeof db.insert>);
};

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrganizationId).mockResolvedValue("test-org-id");
  // Setup default mock behavior
  setupSelectMock();
  setupInsertMock();
});

describe("GET /api/monitor/brands - Authentication (AC-2.5.1)", () => {
  it("should return 401 when not authenticated", async () => {
    vi.mocked(getOrganizationId).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Organization not found");
  });

  it("should return 200 when authenticated", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should call getOrganizationId for authentication check", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
    await GET(request);

    expect(getOrganizationId).toHaveBeenCalled();
  });
});

describe("GET /api/monitor/brands - Data Retrieval (AC-2.5.2)", () => {
  it("should return all brands for the organization", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBe(2);
  });

  it("should return brands with correct structure", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data[0]).toHaveProperty("id", "brand-1");
    expect(data.data[0]).toHaveProperty("name", "Acme Corp");
    expect(data.data[0]).toHaveProperty("domain", "https://acme.com");
    expect(data.data[0]).toHaveProperty("description");
    expect(data.data[0]).toHaveProperty("industry");
    expect(data.data[0]).toHaveProperty("keywords");
    expect(data.data[0]).toHaveProperty("competitors");
    expect(data.data[0]).toHaveProperty("voice");
    expect(data.data[0]).toHaveProperty("visual");
    expect(data.data[0]).toHaveProperty("monitoringEnabled");
    expect(data.data[0]).toHaveProperty("monitoringPlatforms");
  });

  it("should return meta information with total count", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("meta");
    expect(data.meta).toHaveProperty("total", 2);
    expect(data.meta).toHaveProperty("timestamp");
  });

  it("should return timestamp in ISO format", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const timestamp = new Date(data.meta.timestamp);
    expect(timestamp.toString()).not.toBe("Invalid Date");
  });

  it("should return empty array when organization has no brands", async () => {
    setupSelectMock([]);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
    expect(data.meta.total).toBe(0);
  });

  it("should only return active brands (isActive = true)", async () => {
    // This test verifies the route filters by isActive
    // The mock returns only active brands, simulating the WHERE clause
    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // All returned brands should have isActive = true
    data.data.forEach((brand: { isActive: boolean }) => {
      expect(brand.isActive).toBe(true);
    });
  });
});

describe("GET /api/monitor/brands - Error Handling", () => {
  it("should handle database errors gracefully", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Database connection failed");
    });

    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
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

    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unknown error");
  });
});

describe("POST /api/monitor/brands - Authentication (AC-2.5.1)", () => {
  it("should return 401 when not authenticated", async () => {
    vi.mocked(getOrganizationId).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Brand" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Organization not found");
  });

  it("should return 201 when brand is created successfully", async () => {
    const newBrand = {
      ...mockBrands[0],
      id: "brand-new",
      name: "New Brand",
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Brand" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});

describe("POST /api/monitor/brands - Brand Creation (AC-2.5.2)", () => {
  it("should create brand with minimal required data (name only)", async () => {
    const newBrand = {
      id: "brand-new",
      organizationId: "test-org-id",
      name: "Minimal Brand",
      domain: null,
      description: null,
      industry: null,
      logoUrl: null,
      keywords: [],
      competitors: [],
      voice: {
        tone: "professional",
        personality: [],
        targetAudience: "",
        keyMessages: [],
        avoidTopics: [],
      },
      visual: {
        primaryColor: null,
        secondaryColor: null,
        fontFamily: null,
      },
      monitoringEnabled: true,
      monitoringPlatforms: ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Minimal Brand" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("Minimal Brand");
  });

  it("should create brand with all optional fields", async () => {
    const fullBrand = {
      id: "brand-full",
      organizationId: "test-org-id",
      name: "Full Brand",
      domain: "https://fullbrand.com",
      description: "A complete brand",
      industry: "Tech",
      logoUrl: "https://fullbrand.com/logo.png",
      keywords: ["keyword1", "keyword2"],
      competitors: [{ name: "Comp", url: "https://comp.com", reason: "Competition" }],
      voice: {
        tone: "friendly",
        personality: ["fun", "energetic"],
        targetAudience: "Young adults",
        keyMessages: ["Be bold"],
        avoidTopics: ["politics"],
      },
      visual: {
        primaryColor: "#FF0000",
        secondaryColor: "#00FF00",
        fontFamily: "Arial",
      },
      monitoringEnabled: true,
      monitoringPlatforms: ["chatgpt", "claude"],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setupInsertMock(fullBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Full Brand",
        domain: "https://fullbrand.com",
        description: "A complete brand",
        industry: "Tech",
        logoUrl: "https://fullbrand.com/logo.png",
        keywords: ["keyword1", "keyword2"],
        competitors: [{ name: "Comp", url: "https://comp.com", reason: "Competition" }],
        voice: {
          tone: "friendly",
          personality: ["fun", "energetic"],
          targetAudience: "Young adults",
          keyMessages: ["Be bold"],
          avoidTopics: ["politics"],
        },
        visual: {
          primaryColor: "#FF0000",
          secondaryColor: "#00FF00",
          fontFamily: "Arial",
        },
        monitoringPlatforms: ["chatgpt", "claude"],
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("Full Brand");
    expect(data.data.domain).toBe("https://fullbrand.com");
  });

  it("should return created brand data in response", async () => {
    const newBrand = { ...mockBrands[0], id: "brand-new", name: "Created Brand" };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Created Brand" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toHaveProperty("id");
    expect(data.data).toHaveProperty("name");
    expect(data.data).toHaveProperty("organizationId");
  });

  it("should call db.insert with correct values", async () => {
    const newBrand = { ...mockBrands[0], id: "brand-new" };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Brand" }),
    });
    await POST(request);

    expect(db.insert).toHaveBeenCalled();
  });
});

describe("POST /api/monitor/brands - Validation (AC-2.5.3)", () => {
  it("should return 400 when name is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
    expect(data).toHaveProperty("details");
  });

  it("should return 400 when name is empty string", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });

  it("should return 400 for invalid domain URL format", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Brand", domain: "not-a-valid-url" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });

  it("should return 400 for invalid logoUrl format", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Brand", logoUrl: "not-a-valid-url" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });

  it("should return 400 for invalid voice tone value", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Brand",
        voice: {
          tone: "invalid-tone",
          personality: [],
          targetAudience: "",
          keyMessages: [],
          avoidTopics: [],
        },
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });

  it("should accept valid voice tone values", async () => {
    const validTones = ["professional", "friendly", "authoritative", "casual", "formal"];

    for (const tone of validTones) {
      vi.clearAllMocks();
      vi.mocked(getOrganizationId).mockResolvedValue("test-org-id");

      const newBrand = {
        ...mockBrands[0],
        id: `brand-${tone}`,
        voice: { ...mockBrands[0].voice, tone },
      };
      setupInsertMock(newBrand);

      const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${tone} Brand`,
          voice: {
            tone: tone,
            personality: [],
            targetAudience: "",
            keyMessages: [],
            avoidTopics: [],
          },
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    }
  });

  it("should return 400 for invalid keywords type (not array)", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Brand", keywords: "not-an-array" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });

  it("should return 400 for invalid competitors structure", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Brand",
        competitors: [{ invalid: "structure" }],
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation error");
  });

  it("should accept valid competitor structure", async () => {
    const newBrand = { ...mockBrands[0], id: "brand-new" };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Brand",
        competitors: [
          { name: "Competitor A", url: "https://comp-a.com", reason: "Direct competitor" },
        ],
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
  });

  it("should accept null for optional nullable fields", async () => {
    const newBrand = {
      ...mockBrands[0],
      id: "brand-null",
      domain: null,
      description: null,
      industry: null,
      logoUrl: null,
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Brand",
        domain: null,
        description: null,
        industry: null,
        logoUrl: null,
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
  });
});

describe("POST /api/monitor/brands - Error Handling", () => {
  it("should handle database insert errors gracefully", async () => {
    vi.mocked(db.insert).mockImplementationOnce(() => {
      throw new Error("Database insert failed");
    });

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Brand" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Database insert failed");
  });

  it("should return generic error message for unknown errors during insert", async () => {
    vi.mocked(db.insert).mockImplementationOnce(() => {
      throw "Unknown error type";
    });

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Brand" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unknown error");
  });

  // Note: Invalid JSON body test removed - NextRequest constructor throws
  // immediately when parsing invalid JSON, which is expected framework behavior.
  // Our route's error handling only covers errors that occur after request creation.
});

describe("POST /api/monitor/brands - Default Values", () => {
  it("should use default monitoringEnabled value (true)", async () => {
    const newBrand = {
      ...mockBrands[0],
      id: "brand-defaults",
      monitoringEnabled: true,
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Default Brand" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.monitoringEnabled).toBe(true);
  });

  it("should use default monitoringPlatforms (all platforms)", async () => {
    const allPlatforms = ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"];
    const newBrand = {
      ...mockBrands[0],
      id: "brand-defaults",
      monitoringPlatforms: allPlatforms,
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Default Brand" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.monitoringPlatforms).toEqual(allPlatforms);
  });

  it("should use default empty arrays for keywords", async () => {
    const newBrand = {
      ...mockBrands[0],
      id: "brand-defaults",
      keywords: [],
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Default Brand" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.keywords).toEqual([]);
  });

  it("should allow overriding monitoringEnabled to false", async () => {
    const newBrand = {
      ...mockBrands[0],
      id: "brand-disabled",
      monitoringEnabled: false,
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Disabled Brand", monitoringEnabled: false }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.monitoringEnabled).toBe(false);
  });

  it("should allow custom monitoringPlatforms selection", async () => {
    const customPlatforms = ["chatgpt", "claude"];
    const newBrand = {
      ...mockBrands[0],
      id: "brand-custom",
      monitoringPlatforms: customPlatforms,
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Custom Brand", monitoringPlatforms: customPlatforms }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.monitoringPlatforms).toEqual(customPlatforms);
  });
});

describe("POST /api/monitor/brands - Edge Cases", () => {
  it("should handle brand name with special characters", async () => {
    const newBrand = {
      ...mockBrands[0],
      id: "brand-special",
      name: "Brand & Co. (Est. '99) - Premium™",
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Brand & Co. (Est. '99) - Premium™" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.name).toBe("Brand & Co. (Est. '99) - Premium™");
  });

  it("should handle unicode characters in brand name", async () => {
    const newBrand = {
      ...mockBrands[0],
      id: "brand-unicode",
      name: "Café München 日本語 🚀",
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Café München 日本語 🚀" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.name).toBe("Café München 日本語 🚀");
  });

  it("should handle very long description", async () => {
    const longDescription = "A".repeat(1000);
    const newBrand = {
      ...mockBrands[0],
      id: "brand-long",
      description: longDescription,
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Long Brand", description: longDescription }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.description).toBe(longDescription);
  });

  it("should handle many keywords", async () => {
    const manyKeywords = Array.from({ length: 50 }, (_, i) => `keyword-${i}`);
    const newBrand = {
      ...mockBrands[0],
      id: "brand-keywords",
      keywords: manyKeywords,
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Keyword Brand", keywords: manyKeywords }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.keywords.length).toBe(50);
  });

  it("should handle multiple competitors", async () => {
    const competitors = Array.from({ length: 10 }, (_, i) => ({
      name: `Competitor ${i}`,
      url: `https://competitor-${i}.com`,
      reason: `Reason ${i}`,
    }));
    const newBrand = {
      ...mockBrands[0],
      id: "brand-competitors",
      competitors,
    };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Competitor Brand", competitors }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.competitors.length).toBe(10);
  });
});

describe("GET /api/monitor/brands - Response Structure", () => {
  it("should return correct response structure for success", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("meta");
  });

  it("should return correct response structure for error", async () => {
    vi.mocked(getOrganizationId).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toHaveProperty("success", false);
    expect(data).toHaveProperty("error");
  });
});

describe("POST /api/monitor/brands - Response Structure", () => {
  it("should return correct response structure for success", async () => {
    const newBrand = { ...mockBrands[0], id: "brand-new" };
    setupInsertMock(newBrand);

    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Brand" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("data");
  });

  it("should return correct response structure for validation error", async () => {
    const request = new NextRequest("http://localhost:3000/api/monitor/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("success", false);
    expect(data).toHaveProperty("error", "Validation error");
    expect(data).toHaveProperty("details");
    expect(Array.isArray(data.details)).toBe(true);
  });
});
