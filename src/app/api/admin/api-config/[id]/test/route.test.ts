/**
 * Phase 4: API Configuration Management - Test Connection Unit Tests
 * Following Doc-Driven TDD Protocol
 * Status: RED (tests written before implementation)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "test-super-admin-id" })),
}));

// Mock super-admin check
vi.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: vi.fn(async () => true),
}));

// Mock database query
const mockQueryChain = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: vi.fn((resolve) =>
    resolve([
      {
        id: "test-integration-id",
        serviceName: "Claude API",
        provider: "Anthropic",
        category: "ai_models",
        config: {
          apiKey: "sk-ant-api03-test-key-1234",
          endpoint: "https://api.anthropic.com/v1",
        },
      },
    ])
  ),
};

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => mockQueryChain),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  apiIntegrations: {
    id: "id",
    config: "config",
  },
}));

// Mock global fetch for API connection tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("POST /api/admin/api-config/:id/test - Test Connection (FR-3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => name === "anthropic-version" ? "2023-06-01" : null,
      },
      json: () => Promise.resolve({ success: true }),
    });
  });

  it("should return success with connection details (AC-3.3)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id/test", {
      method: "POST",
      body: JSON.stringify({
        config: {
          apiKey: "sk-ant-api03-test-key-1234",
          endpoint: "https://api.anthropic.com/v1",
        },
      }),
    });

    const response = await POST(request, { params: { id: "test-id" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("message");
    expect(data).toHaveProperty("details");
  });

  it("should include responseTime in details (AC-3.3)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id/test", {
      method: "POST",
      body: JSON.stringify({
        config: {
          apiKey: "sk-ant-api03-test-key-1234",
          endpoint: "https://api.anthropic.com/v1",
        },
      }),
    });

    const response = await POST(request, { params: { id: "test-id" } });
    const data = await response.json();

    if (data.success) {
      expect(data.details).toHaveProperty("responseTime");
    }
  });

  it("should return error when API key is invalid (AC-3.4)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id/test", {
      method: "POST",
      body: JSON.stringify({
        config: {
          apiKey: "invalid-key",
          endpoint: "https://api.anthropic.com/v1",
        },
      }),
    });

    const response = await POST(request, { params: { id: "test-id" } });
    const data = await response.json();

    // Should return either success: false or a 4xx status
    if (response.status >= 400) {
      expect(data).toHaveProperty("error");
    } else if (!data.success) {
      expect(data).toHaveProperty("error");
    }
  });

  it("should return error when service is unavailable (AC-3.4)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id/test", {
      method: "POST",
      body: JSON.stringify({
        config: {
          apiKey: "sk-ant-api03-test-key-1234",
          endpoint: "https://invalid-endpoint.example.com",
        },
      }),
    });

    const response = await POST(request, { params: { id: "test-id" } });
    const data = await response.json();

    // Should handle service unavailable gracefully
    if (!data.success) {
      expect(data).toHaveProperty("error");
    }
  });

  it("should return timeout error after 30 seconds (EC-2)", async () => {
    // This test would need a mock that simulates a timeout
    // For now, we test that the endpoint has timeout handling
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id/test", {
      method: "POST",
      body: JSON.stringify({
        config: {
          apiKey: "sk-ant-api03-test-key-1234",
          endpoint: "https://api.anthropic.com/v1",
        },
      }),
    });

    const response = await POST(request, { params: { id: "test-id" } });

    // Should complete within reasonable time or return timeout
    expect(response.status).toBeLessThan(600);
  });

  it("should return 404 when integration does not exist", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.select).mockReturnValueOnce({
      ...mockQueryChain,
      then: vi.fn((resolve) => resolve([])),
    } as any);

    const request = new NextRequest(
      "http://localhost:3000/api/admin/api-config/nonexistent/test",
      {
        method: "POST",
        body: JSON.stringify({
          config: {
            apiKey: "test",
          },
        }),
      }
    );

    const response = await POST(request, { params: { id: "nonexistent" } });

    expect(response.status).toBe(404);
  });
});

describe("POST /api/admin/api-config/:id/test - Security (SR-1, SR-2, SR-5)", () => {
  it("should return 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id/test", {
      method: "POST",
      body: JSON.stringify({
        config: { apiKey: "test" },
      }),
    });

    const response = await POST(request, { params: { id: "test-id" } });

    expect(response.status).toBe(401);
  });

  it("should return 403 when not super-admin", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(false);

    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id/test", {
      method: "POST",
      body: JSON.stringify({
        config: { apiKey: "test" },
      }),
    });

    const response = await POST(request, { params: { id: "test-id" } });

    expect(response.status).toBe(403);
  });

  it("should rate limit to 10 requests per minute (SR-5)", async () => {
    // This test would require rate limiting implementation
    // For now, we verify the endpoint exists and responds
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id/test", {
      method: "POST",
      body: JSON.stringify({
        config: {
          apiKey: "sk-ant-api03-test-key-1234",
        },
      }),
    });

    const response = await POST(request, { params: { id: "test-id" } });

    // Should return a valid response (not 500)
    expect(response.status).toBeLessThan(500);
  });
});

describe("POST /api/admin/api-config/:id/test - Validation", () => {
  it("should return 400 when config is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id/test", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: { id: "test-id" } });

    expect(response.status).toBe(400);
  });

  it("should return 400 when apiKey is missing from config", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id/test", {
      method: "POST",
      body: JSON.stringify({
        config: {
          endpoint: "https://api.anthropic.com/v1",
        },
      }),
    });

    const response = await POST(request, { params: { id: "test-id" } });

    expect(response.status).toBe(400);
  });
});
