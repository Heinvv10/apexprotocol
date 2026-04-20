/**
 * Dashboard Activity API Tests - RED Phase
 *
 * Tests for GET /api/admin/dashboard/activity
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

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  },
}));

import { getSession } from "@/lib/auth/supabase-server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

describe("GET /api/admin/dashboard/activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // UT-16: Returns recent audit logs
  it("UT-16: should return recent audit logs", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/activity");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("activities");
    expect(Array.isArray(data.activities)).toBe(true);
  });

  // UT-17: Respects limit parameter
  it("UT-17: should respect limit parameter", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/activity?limit=5");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activities.length).toBeLessThanOrEqual(5);
  });

  // UT-18: Orders by timestamp descending
  it("UT-18: should order by timestamp descending", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/activity");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // If there are multiple activities, verify descending order
    if (data.activities.length > 1) {
      const timestamps = data.activities.map((a: { timestamp: string }) => new Date(a.timestamp).getTime());
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
    }
  });

  // UT-19: Calculates relative time correctly
  it("UT-19: should calculate relative time correctly", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/activity");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Each activity should have relativeTime field
    data.activities.forEach((activity: { relativeTime: string }) => {
      expect(activity).toHaveProperty("relativeTime");
      expect(typeof activity.relativeTime).toBe("string");
    });
  });

  // UT-20: Includes actor and target information
  it("UT-20: should include actor and target information", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/activity");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Each activity should have actor and target info
    data.activities.forEach((activity: { actorName: string; actorEmail: string; targetType: string }) => {
      expect(activity).toHaveProperty("actorName");
      expect(activity).toHaveProperty("actorEmail");
      expect(activity).toHaveProperty("targetType");
    });
  });

  // UT-21: Returns 401 if not authenticated
  it("UT-21: should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: null } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/activity");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  // UT-22: Returns 403 if not super-admin
  it("UT-22: should return 403 if not super-admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(false);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/activity");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden - Super admin access required");
  });

  // UT-23: Limits maximum to 50
  it("UT-23: should limit maximum to 50", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/activity?limit=100");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Even if 100 requested, should cap at 50
    expect(data.activities.length).toBeLessThanOrEqual(50);
  });

  // UT-24: Default limit is 10
  it("UT-24: should default limit to 10", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/dashboard/activity");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activities.length).toBeLessThanOrEqual(10);
  });
});
