/**
 * Dashboard Stats API Tests - RED Phase
 *
 * Tests for GET /api/admin/dashboard/stats
 * Protocol: Doc-Driven TDD
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock Clerk auth
vi.mock("@/lib/auth/supabase-server", () => ({
  getSession: vi.fn(async () => ({ userId: "test-user-id", orgId: "test-org-id", orgRole: "admin", orgSlug: null })),
  getUserId: vi.fn(async () => "test-user-id"),
  getOrganizationId: vi.fn(async () => "test-org-id"),
  currentDbUser: vi.fn(async () => null),
}));

// Mock super-admin check
vi.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: vi.fn(),
}));

// Mock database - all definitions MUST be inside factory due to hoisting
vi.mock("@/lib/db", () => {
  const mockDbResult = [{ count: 5 }];
  const mockWhereResult = {
    then: (resolve: (v: unknown[]) => void) => Promise.resolve(mockDbResult).then(resolve),
    catch: (reject: (e: unknown) => void) => Promise.resolve(mockDbResult).catch(reject),
  };
  const mockFromResult = {
    then: (resolve: (v: unknown[]) => void) => Promise.resolve(mockDbResult).then(resolve),
    catch: (reject: (e: unknown) => void) => Promise.resolve(mockDbResult).catch(reject),
    where: () => mockWhereResult,
  };

  return {
    db: {
      select: () => ({
        from: () => mockFromResult,
      }),
      execute: vi.fn(),
    },
  };
});

import { getSession } from "@/lib/auth/supabase-server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { db } from "@/lib/db";

describe("GET /api/admin/dashboard/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // UT-1: Returns 401 if not authenticated
  it("UT-1: should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: null } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  // UT-2: Returns 403 if not super-admin
  it("UT-2: should return 403 if not super-admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(false);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden - Super admin access required");
  });

  // UT-3: Returns correct organization count
  it("UT-3: should return correct organization count", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Mock returns count: 5 for all queries
    expect(data.stats.totalOrganizations).toBe(5);
  });

  // UT-4: Returns correct user count
  it("UT-4: should return correct user count", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toHaveProperty("totalUsers");
    expect(typeof data.stats.totalUsers).toBe("number");
  });

  // UT-5: Returns organizations created this month
  it("UT-5: should return organizations created this month", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toHaveProperty("organizationsThisMonth");
    expect(typeof data.stats.organizationsThisMonth).toBe("number");
  });

  // UT-6: Returns users created this week
  it("UT-6: should return users created this week", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toHaveProperty("usersThisWeek");
    expect(typeof data.stats.usersThisWeek).toBe("number");
  });

  // UT-7: Returns active sessions count
  it("UT-7: should return active sessions count", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toHaveProperty("activeSessions");
    expect(typeof data.stats.activeSessions).toBe("number");
  });

  // UT-8: Returns API requests in last 24 hours
  it("UT-8: should return API requests in last 24 hours", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toHaveProperty("apiRequests24h");
    expect(typeof data.stats.apiRequests24h).toBe("number");
  });

  // UT-9: Returns all expected fields
  it("UT-9: should return all expected stats fields", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stats).toMatchObject({
      totalOrganizations: expect.any(Number),
      organizationsThisMonth: expect.any(Number),
      totalUsers: expect.any(Number),
      usersThisWeek: expect.any(Number),
      activeSessions: expect.any(Number),
      apiRequests24h: expect.any(Number),
    });
  });
});
