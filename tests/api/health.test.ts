/**
 * Health API Route Unit Tests
 * Tests for /api/health endpoint
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the NextRequest/NextResponse before importing the route
vi.mock("next/server", () => {
  class MockNextResponse {
    data: unknown;
    status: number;
    headers: Record<string, string>;

    constructor(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.data = body;
      this.status = init?.status || 200;
      this.headers = init?.headers || {};
    }

    async json() {
      return this.data;
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(data, init);
    }
  }

  return {
    NextRequest: class MockNextRequest {
      url: string;
      nextUrl: URL;
      headers: Headers;
      method: string;
      private _body: unknown;

      constructor(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) {
        this.url = url;
        this.nextUrl = new URL(url);
        this.headers = new Headers(init?.headers);
        this.method = init?.method || "GET";
        this._body = init?.body ? JSON.parse(init.body) : null;
      }

      async json() {
        return this._body;
      }
    },
    NextResponse: MockNextResponse,
  };
});

describe("Health API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    process.env.CLERK_SECRET_KEY = "test-clerk-secret";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "test-clerk-publishable";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    process.env.PINECONE_API_KEY = "test-pinecone-key";
    process.env.PINECONE_INDEX = "test-index";
  });

  describe("GET /api/health", () => {
    it("should return healthy status when all services are configured", async () => {
      const request = {
        url: "http://localhost:3000/api/health",
        nextUrl: new URL("http://localhost:3000/api/health"),
      };

      // Import dynamically to get fresh module with mocked env
      const { GET } = await import("@/app/api/health/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.status).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(data.services).toBeDefined();
      expect(Array.isArray(data.services)).toBe(true);
    });

    it("should return correct service count", async () => {
      const request = {
        url: "http://localhost:3000/api/health",
        nextUrl: new URL("http://localhost:3000/api/health"),
      };

      const { GET } = await import("@/app/api/health/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.summary).toBeDefined();
      expect(data.summary.total).toBeGreaterThan(0);
      expect(data.summary.healthy + data.summary.degraded + data.summary.unhealthy).toBe(
        data.summary.total
      );
    });

    it("should include version and uptime", async () => {
      const request = {
        url: "http://localhost:3000/api/health",
        nextUrl: new URL("http://localhost:3000/api/health"),
      };

      const { GET } = await import("@/app/api/health/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.version).toBeDefined();
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should return detailed services when detailed=true", async () => {
      const request = {
        url: "http://localhost:3000/api/health?detailed=true",
        nextUrl: new URL("http://localhost:3000/api/health?detailed=true"),
      };

      const { GET } = await import("@/app/api/health/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.services).toBeDefined();
      if (data.services.length > 0) {
        expect(data.services[0].name).toBeDefined();
        expect(data.services[0].status).toBeDefined();
      }
    });

    it("should return specific service when service param provided", async () => {
      const request = {
        url: "http://localhost:3000/api/health?service=database",
        nextUrl: new URL("http://localhost:3000/api/health?service=database"),
      };

      const { GET } = await import("@/app/api/health/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.name).toBe("database");
      expect(data.status).toBeDefined();
    });

    it("should return 404 for unknown service", async () => {
      const request = {
        url: "http://localhost:3000/api/health?service=unknown",
        nextUrl: new URL("http://localhost:3000/api/health?service=unknown"),
      };

      const { GET } = await import("@/app/api/health/route");
      const response = await GET(request as never);

      expect(response.status).toBe(404);
    });
  });

  describe("HEAD /api/health", () => {
    it("should return 200 when database is configured", async () => {
      const { HEAD } = await import("@/app/api/health/route");
      const response = await HEAD();

      expect(response.status).toBe(200);
    });

    it("should return 503 when database is not configured", async () => {
      delete process.env.DATABASE_URL;

      // Force re-import
      vi.resetModules();
      const { HEAD } = await import("@/app/api/health/route");
      const response = await HEAD();

      expect(response.status).toBe(503);
    });
  });

  describe("Service Health Checks", () => {
    it("should check database health", async () => {
      const request = {
        url: "http://localhost:3000/api/health?service=database",
        nextUrl: new URL("http://localhost:3000/api/health?service=database"),
      };

      const { GET } = await import("@/app/api/health/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.name).toBe("database");
      expect(["healthy", "degraded", "unhealthy"]).toContain(data.status);
    });

    it("should check redis health", async () => {
      const request = {
        url: "http://localhost:3000/api/health?service=redis",
        nextUrl: new URL("http://localhost:3000/api/health?service=redis"),
      };

      const { GET } = await import("@/app/api/health/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.name).toBe("redis");
      expect(["healthy", "degraded", "unhealthy"]).toContain(data.status);
    });

    it("should check auth service health", async () => {
      const request = {
        url: "http://localhost:3000/api/health?service=auth",
        nextUrl: new URL("http://localhost:3000/api/health?service=auth"),
      };

      const { GET } = await import("@/app/api/health/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.name).toBe("auth");
      expect(["healthy", "degraded", "unhealthy"]).toContain(data.status);
    });

    it("should check AI service health", async () => {
      const request = {
        url: "http://localhost:3000/api/health?service=ai",
        nextUrl: new URL("http://localhost:3000/api/health?service=ai"),
      };

      const { GET } = await import("@/app/api/health/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.name).toBe("ai");
      expect(["healthy", "degraded", "unhealthy"]).toContain(data.status);
    });

    it("should check storage health", async () => {
      const request = {
        url: "http://localhost:3000/api/health?service=storage",
        nextUrl: new URL("http://localhost:3000/api/health?service=storage"),
      };

      const { GET } = await import("@/app/api/health/route");
      const response = await GET(request as never);
      const data = await response.json();

      expect(data.name).toBe("storage");
      expect(["healthy", "degraded", "unhealthy"]).toContain(data.status);
      expect(data.details).toBeDefined();
    });
  });
});
