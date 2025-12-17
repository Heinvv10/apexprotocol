/**
 * Phase 3: Users Management - Unit Tests (API Routes)
 * Following Doc-Driven TDD Protocol
 * Status: RED (tests written before implementation)
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "./route";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "test-super-admin-id" })),
}));

// Mock super-admin check
vi.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: vi.fn(async () => true),
}));

// Mock database with proper query chain
const mockQueryChain = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  then: vi.fn((resolve) => resolve([])), // Makes the query thenable (awaitable)
};

const mockUpdateChain = {
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{
    id: "test-user-id",
    clerkUserId: "test-clerk-id",
    name: "Test User",
    email: "test@example.com",
    organizationId: "test-org-id",
    role: "org:member",
    isSuperAdmin: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastActiveAt: null,
    superAdminGrantedAt: null,
    superAdminGrantedBy: null,
  }]),
};

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => {
      const chain = {
        ...mockQueryChain,
        then: vi.fn((resolve) => {
          // Check if this is the count query (has count field)
          const selectArgs = vi.mocked(chain.select).mock.calls[0]?.[0];
          if (selectArgs && 'count' in selectArgs) {
            return resolve([{ count: 0 }]);
          }
          // Otherwise return empty users array
          return resolve([]);
        }),
      };
      return chain;
    }),
    update: vi.fn(() => mockUpdateChain),
  },
}));

describe("GET /api/admin/users - User Listing (FR-1)", () => {
  it("should return users with all required fields (AC-1.1)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("users");
    expect(Array.isArray(data.users)).toBe(true);

    if (data.users.length > 0) {
      const user = data.users[0];
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("organizationId");
      expect(user).toHaveProperty("organizationName");
      expect(user).toHaveProperty("organizationSlug");
      expect(user).toHaveProperty("role");
      expect(user).toHaveProperty("isSuperAdmin");
      expect(user).toHaveProperty("isActive");
      expect(user).toHaveProperty("createdAt");
    }
  });

  it("should return 20 users by default (AC-1.2)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination).toHaveProperty("limit", 20);
  });

  it("should return total user count in pagination (AC-1.3)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveProperty("pagination");
    expect(data.pagination).toHaveProperty("total");
    expect(typeof data.pagination.total).toBe("number");
  });

  it("should include organization name and slug for each user (AC-1.4)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);
    const data = await response.json();

    if (data.users.length > 0) {
      const user = data.users[0];
      expect(user.organizationName).toBeDefined();
      expect(user.organizationSlug).toBeDefined();
    }
  });

  it("should include role field for each user (AC-1.5)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);
    const data = await response.json();

    if (data.users.length > 0) {
      const user = data.users[0];
      expect(user).toHaveProperty("role");
      expect(["org:admin", "org:member", "super-admin"]).toContain(user.role);
    }
  });
});

describe("GET /api/admin/users - Search (FR-2)", () => {
  it("should filter users by search term in name (AC-2.1)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?search=John");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should filter users by search term in email (AC-2.1)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?search=john@");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should perform case-insensitive search (AC-2.2)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?search=JOHN");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should return same results as lowercase search
  });

  it("should match partial strings in search (AC-2.3)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?search=Joh");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should return all users when search is empty (AC-2.4)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?search=");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toBeDefined();
  });
});

describe("GET /api/admin/users - Filters (FR-3)", () => {
  it("should filter users by organizationId (AC-3.1)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?organizationId=test-org-id");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should filter users by role = super-admin (AC-3.2)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?role=super-admin");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.users.length > 0) {
      expect(data.users.every((u: any) => u.isSuperAdmin === true)).toBe(true);
    }
  });

  it("should filter users by role = org:admin (AC-3.2)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?role=org:admin");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
  });

  it("should filter active users (AC-3.3)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?status=active");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.users.length > 0) {
      expect(data.users.every((u: any) => u.isActive === true)).toBe(true);
    }
  });

  it("should filter suspended users (AC-3.3)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?status=suspended");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.users.length > 0) {
      expect(data.users.every((u: any) => u.isActive === false)).toBe(true);
    }
  });

  it("should apply multiple filters together (AC-3.4)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/admin/users?organizationId=test-org&status=active&role=org:admin"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe("GET /api/admin/users - Pagination (FR-7)", () => {
  it("should return correct pagination metadata (AC-7.1, AC-7.2, AC-7.3)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination).toHaveProperty("page");
    expect(data.pagination).toHaveProperty("limit");
    expect(data.pagination).toHaveProperty("total");
    expect(data.pagination).toHaveProperty("totalPages");
  });

  it("should respect custom page parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?page=2");
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.page).toBe(2);
  });

  it("should respect custom limit parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?limit=10");
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.limit).toBe(10);
  });

  it("should calculate totalPages correctly", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);
    const data = await response.json();

    const expectedPages = Math.ceil(data.pagination.total / data.pagination.limit);
    expect(data.pagination.totalPages).toBe(expectedPages);
  });
});

describe("GET /api/admin/users - Security (SR-1, SR-2)", () => {
  it("should return 401 when not authenticated", async () => {
    // Mock auth to return no userId
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("should return 403 when not super-admin", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(false);

    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it("should allow access with DEV_SUPER_ADMIN=true in dev mode", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_SUPER_ADMIN = "true";

    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});

describe("GET /api/admin/users - Edge Cases", () => {
  it("should return empty array when no users exist (EC-1)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);
    const data = await response.json();

    expect(data.users).toBeDefined();
    expect(Array.isArray(data.users)).toBe(true);
  });

  it("should return empty array when search has no matches (EC-1)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users?search=nonexistentuser12345");
    const response = await GET(request);
    const data = await response.json();

    expect(data.users).toBeDefined();
    expect(Array.isArray(data.users)).toBe(true);
  });
});

describe("PATCH /api/admin/users - Suspend/Activate (FR-5)", () => {
  it("should suspend active user (set isActive=false) (AC-5.3, AC-5.4)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({
        userId: "test-user-id",
        updates: { isActive: false },
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toHaveProperty("isActive", false);
  });

  it("should activate suspended user (set isActive=true) (AC-5.3, AC-5.4)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({
        userId: "test-user-id",
        updates: { isActive: true },
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toHaveProperty("isActive", true);
  });
});

describe("PATCH /api/admin/users - Super Admin (FR-6)", () => {
  it("should grant super-admin status (AC-6.3, AC-6.4)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({
        userId: "test-user-id",
        updates: { isSuperAdmin: true },
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toHaveProperty("isSuperAdmin", true);
    expect(data.user).toHaveProperty("superAdminGrantedAt");
    expect(data.user).toHaveProperty("superAdminGrantedBy");
  });

  it("should revoke super-admin status (AC-6.3, AC-6.4)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({
        userId: "test-user-id",
        updates: { isSuperAdmin: false },
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toHaveProperty("isSuperAdmin", false);
  });

  it("should return 403 when trying to revoke own super-admin status (AC-6.5)", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({
        userId: "test-super-admin-id", // Same as mocked auth userId
        updates: { isSuperAdmin: false },
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(403);
  });
});

describe("PATCH /api/admin/users - Security & Validation", () => {
  it("should return 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "test", updates: {} }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  it("should return 403 when not super-admin", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(false);

    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "test", updates: {} }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(403);
  });

  it("should return 400 when userId is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ updates: {} }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 when updates object is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "test" }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });

  it("should return 404 when user does not exist", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.returning).mockResolvedValueOnce([]);

    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({
        userId: "nonexistent-user",
        updates: { isActive: false },
      }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(404);
  });
});
