/**
 * Phase 4: API Configuration Management - Unit Tests (Dynamic ID Routes)
 * Following Doc-Driven TDD Protocol
 * Status: RED (tests written before implementation)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "./route";
import {
  TEST_CREDENTIALS,
  TEST_USER_IDS,
  createMockIntegration,
} from "../__test-constants";

// Mock Clerk auth
vi.mock("@/lib/auth/supabase-server", () => ({
  getSession: vi.fn(async () => ({ userId: "test-user-id", orgId: "test-org-id", orgRole: "admin", orgSlug: null })),
  currentDbUser: vi.fn(async () => null),
})),
}));

// Mock super-admin check
vi.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: vi.fn(async () => true),
}));

// Mock database with proper query chain
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
        description: "Anthropic's Claude AI for content generation",
        category: "ai_models",
        status: "configured",
        isEnabled: true,
        config: {
          apiKey: "sk-ant-****-****-1234",
          endpoint: "https://api.anthropic.com/v1",
          model: "claude-3-5-sonnet-20241022",
          maxTokens: 4096,
        },
        lastVerified: new Date().toISOString(),
        lastError: null,
        usageThisMonth: 1250,
        quotaRemaining: 8750,
        rateLimit: "10000/day",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "user_123",
        updatedBy: "user_123",
      },
    ])
  ),
};

const mockUpdateChain = {
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([
    {
      id: "test-integration-id",
      serviceName: "Claude API",
      provider: "Anthropic",
      category: "ai_models",
      status: "configured",
      isEnabled: true,
      config: {
        apiKey: TEST_CREDENTIALS.ANTHROPIC_API_KEY_NEW,
        endpoint: "https://api.anthropic.com/v1",
      },
      updatedAt: new Date().toISOString(),
      updatedBy: "test-super-admin-id",
    },
  ]),
};

const mockDeleteChain = {
  delete: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([
    {
      id: "test-integration-id",
      serviceName: "Claude API",
    },
  ]),
};

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => mockQueryChain),
    update: vi.fn(() => mockUpdateChain),
    delete: vi.fn(() => mockDeleteChain),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  apiIntegrations: {
    id: "id",
    serviceName: "serviceName",
  },
}));

describe("GET /api/admin/api-config/:id - Integration Details (FR-5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return integration with full details (AC-5.1)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id");
    const response = await GET(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("integration");
    expect(data.integration).toHaveProperty("id");
    expect(data.integration).toHaveProperty("serviceName");
    expect(data.integration).toHaveProperty("provider");
    expect(data.integration).toHaveProperty("description");
    expect(data.integration).toHaveProperty("config");
  });

  it("should mask API key except last 4 characters (AC-5.2)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id");
    const response = await GET(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    const apiKey = data.integration.config.apiKey;
    // New mask format: shows first 4 and last 4 chars with ... in between, e.g., "sk-a...1234"
    expect(apiKey).toMatch(/^.{4}\.\.\..{4}$/); // Should match pattern: xxxx...yyyy
  });

  it("should include usage statistics (AC-5.3)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id");
    const response = await GET(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(data.integration).toHaveProperty("usageThisMonth");
    expect(data.integration).toHaveProperty("quotaRemaining");
  });

  it("should include lastVerified timestamp (AC-5.4)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id");
    const response = await GET(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(data.integration).toHaveProperty("lastVerified");
  });

  it("should include lastError if present (AC-5.5)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id");
    const response = await GET(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(data.integration).toHaveProperty("lastError");
  });

  it("should include rateLimit information (AC-5.6)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id");
    const response = await GET(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(data.integration).toHaveProperty("rateLimit");
  });

  it("should return 404 when integration does not exist", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.select).mockReturnValueOnce({
      ...mockQueryChain,
      then: vi.fn((resolve) => resolve([])),
    } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/api-config/nonexistent");
    const response = await GET(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/admin/api-config/:id - Update Integration (FR-2, FR-4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update integration config", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id", {
      method: "PATCH",
      body: JSON.stringify({
        config: {
          apiKey: TEST_CREDENTIALS.ANTHROPIC_API_KEY_NEW,
          endpoint: "https://api.anthropic.com/v1",
        },
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("integration");
  });

  it("should update isEnabled flag", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id", {
      method: "PATCH",
      body: JSON.stringify({
        isEnabled: false,
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.integration).toHaveProperty("isEnabled");
  });

  it("should set updatedBy to current user", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id", {
      method: "PATCH",
      body: JSON.stringify({
        config: { apiKey: "test" },
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(data.integration).toHaveProperty("updatedBy");
  });

  it("should update updatedAt timestamp", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id", {
      method: "PATCH",
      body: JSON.stringify({
        config: { apiKey: "test" },
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(data.integration).toHaveProperty("updatedAt");
  });

  it("should set status to disabled when isEnabled = false (AC-4.2)", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.update).mockReturnValueOnce({
      ...mockUpdateChain,
      returning: vi.fn().mockResolvedValue([
        {
          id: "test-id",
          status: "disabled",
          isEnabled: false,
        },
      ]),
    } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id", {
      method: "PATCH",
      body: JSON.stringify({
        isEnabled: false,
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(data.integration.status).toBe("disabled");
  });

  it("should return 404 when integration does not exist", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.update).mockReturnValueOnce({
      ...mockUpdateChain,
      returning: vi.fn().mockResolvedValue([]),
    } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/api-config/nonexistent", {
      method: "PATCH",
      body: JSON.stringify({
        config: { apiKey: "test" },
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/admin/api-config/:id - Delete Integration (FR-6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete integration (AC-6.4)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id", {
      method: "DELETE",
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "test-id" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("message");
  });

  it("should return 404 when integration does not exist", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.delete).mockReturnValueOnce({
      ...mockDeleteChain,
      returning: vi.fn().mockResolvedValue([]),
    } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/api-config/nonexistent", {
      method: "DELETE",
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });
});

describe("Security - All [id] Routes (SR-1, SR-2)", () => {
  it("GET should return 401 when not authenticated", async () => {
    const { auth } = await import("@/lib/auth/supabase-server");
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id");
    const response = await GET(request, { params: Promise.resolve({ id: "test-id" }) });

    expect(response.status).toBe(401);
  });

  it("GET should return 403 when not super-admin", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(false);

    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id");
    const response = await GET(request, { params: Promise.resolve({ id: "test-id" }) });

    expect(response.status).toBe(403);
  });

  it("PATCH should return 401 when not authenticated", async () => {
    const { auth } = await import("@/lib/auth/supabase-server");
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id", {
      method: "PATCH",
      body: JSON.stringify({ config: { apiKey: "test" } }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "test-id" }) });

    expect(response.status).toBe(401);
  });

  it("PATCH should return 403 when not super-admin", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(false);

    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id", {
      method: "PATCH",
      body: JSON.stringify({ config: { apiKey: "test" } }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "test-id" }) });

    expect(response.status).toBe(403);
  });

  it("DELETE should return 401 when not authenticated", async () => {
    const { auth } = await import("@/lib/auth/supabase-server");
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id", {
      method: "DELETE",
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "test-id" }) });

    expect(response.status).toBe(401);
  });

  it("DELETE should return 403 when not super-admin", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(false);

    const request = new NextRequest("http://localhost:3000/api/admin/api-config/test-id", {
      method: "DELETE",
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "test-id" }) });

    expect(response.status).toBe(403);
  });
});
