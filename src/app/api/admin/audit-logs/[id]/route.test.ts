/**
 * Unit Tests for Admin Audit Logs API - Dynamic Routes
 * GET /api/admin/audit-logs/:id - Get log details
 *
 * Protocol: Doc-Driven TDD (RED phase)
 * These tests are expected to FAIL until implementation is complete
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock super-admin check
vi.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: vi.fn(),
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

import { auth } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { db } from "@/lib/db";

describe("GET /api/admin/audit-logs/:id - Log Details (FR-4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: "user_super123" } as any);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);
  });

  it("should return detailed log information (AC-4.2)", async () => {
    const logId = "log_test123";
    const mockLog = {
      id: logId,
      timestamp: new Date("2025-12-17T10:30:00Z"),
      actorId: "user_actor123",
      actorName: "John Doe",
      actorEmail: "john@example.com",
      actorRole: "super_admin",
      action: "update",
      actionType: "update",
      description: "Updated organization settings",
      targetType: "organization",
      targetId: "org_456",
      targetName: "Acme Corp",
      changes: {
        before: { plan: "starter", maxUsers: 5 },
        after: { plan: "enterprise", maxUsers: 100 },
      },
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        location: "San Francisco, CA",
        sessionId: "sess_789",
        requestId: "req_101112",
      },
      status: "success",
      errorMessage: null,
      errorStack: null,
      integrityHash: "sha256:abc123",
      previousLogHash: "sha256:xyz789",
      createdAt: new Date("2025-12-17T10:30:00Z"),
    };

    // Mock related logs
    const mockRelatedLogs = [
      {
        id: "log_abc122",
        timestamp: new Date("2025-12-17T10:25:30.000Z"),
        action: "access",
        actionType: "access",
        description: "Viewed organization details",
      },
    ];

    // Reset and configure limit mock for this test
    let limitCallCount = 0;
    vi.mocked(db.limit).mockReset();
    vi.mocked(db.limit).mockImplementation((arg?: any) => {
      limitCallCount++;
      if (limitCallCount === 1) {
        // First call: main log query
        return Promise.resolve([mockLog]) as any;
      } else if (limitCallCount === 3 && arg === 10) {
        // Third call with arg 10: related logs query
        return Promise.resolve(mockRelatedLogs) as any;
      }
      return Promise.resolve([]) as any;
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs/${logId}`);
    const response = await GET(request, { params: { id: logId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("log");

    const log = data.log;
    expect(log).toHaveProperty("id", logId);
    expect(log).toHaveProperty("timestamp");
    expect(log).toHaveProperty("actorId");
    expect(log).toHaveProperty("actorName");
    expect(log).toHaveProperty("actorEmail");
    expect(log).toHaveProperty("actorRole");
    expect(log).toHaveProperty("action");
    expect(log).toHaveProperty("actionType");
    expect(log).toHaveProperty("description");
    expect(log).toHaveProperty("targetType");
    expect(log).toHaveProperty("targetId");
    expect(log).toHaveProperty("targetName");
    expect(log).toHaveProperty("changes");
    expect(log).toHaveProperty("metadata");
    expect(log).toHaveProperty("status");
    expect(log).toHaveProperty("integrityHash");
    expect(log).toHaveProperty("previousLogHash");
  });

  it("should return 404 when log not found (FR-4)", async () => {
    const logId = "log_nonexistent";

    // Reset and configure limit mock for this test
    vi.mocked(db.limit).mockReset();
    vi.mocked(db.limit).mockResolvedValue([]);

    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs/${logId}`);
    const response = await GET(request, { params: { id: logId } });

    expect(response.status).toBe(404);
  });

  it("should include related logs (AC-4.5)", async () => {
    const logId = "log_test123";
    const baseTimestamp = new Date("2025-12-17T10:00:00Z");

    const mockLog = {
      id: logId,
      timestamp: baseTimestamp,
      actorId: "user_123",
      actorName: "User",
      actorEmail: "user@example.com",
      actorRole: "admin",
      action: "update",
      actionType: "update",
      description: "Updated something",
      targetType: "organization",
      targetId: "org_456",
      targetName: "Org",
      status: "success",
      metadata: { sessionId: "sess_789" },
      integrityHash: "sha256:abc123",
      createdAt: baseTimestamp,
    };

    const mockRelatedLogs = [
      {
        id: "log_related1",
        timestamp: new Date("2025-12-17T10:05:00Z"), // 5 minutes after
        action: "access",
        actionType: "access",
        description: "Accessed organization",
      },
      {
        id: "log_related2",
        timestamp: new Date("2025-12-17T10:10:00Z"), // 10 minutes after
        action: "create",
        actionType: "create",
        description: "Created user in organization",
      },
    ];

    // Reset and configure limit mock for this test
    let limitCallCount = 0;
    vi.mocked(db.limit).mockReset();
    vi.mocked(db.limit).mockImplementation((arg?: any) => {
      limitCallCount++;
      if (limitCallCount === 1) {
        // First call: main log query
        return Promise.resolve([mockLog]) as any;
      } else if (limitCallCount === 3 && arg === 10) {
        // Third call with arg 10: related logs query
        return Promise.resolve(mockRelatedLogs) as any;
      }
      return Promise.resolve([]) as any;
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs/${logId}`);
    const response = await GET(request, { params: { id: logId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.log).toHaveProperty("relatedLogs");
    expect(Array.isArray(data.log.relatedLogs)).toBe(true);
    expect(data.log.relatedLogs.length).toBeGreaterThan(0);
  });

  it("should return 401 when not authenticated (SR-1)", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const logId = "log_test123";
    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs/${logId}`);
    const response = await GET(request, { params: { id: logId } });

    expect(response.status).toBe(401);
  });

  it("should return 403 when not super-admin (SR-2)", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any);
    vi.mocked(isSuperAdmin).mockResolvedValue(false);

    const logId = "log_test123";
    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs/${logId}`);
    const response = await GET(request, { params: { id: logId } });

    expect(response.status).toBe(403);
  });

  it("should allow access in dev mode when DEV_SUPER_ADMIN is set", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_SUPER_ADMIN = "true";

    const logId = "log_test123";
    const mockLog = {
      id: logId,
      timestamp: new Date(),
      actorId: "dev_user",
      actorName: "Dev User",
      actorEmail: "dev@example.com",
      actorRole: "super_admin",
      action: "create",
      actionType: "create",
      description: "Test log",
      status: "success",
      metadata: {},
      integrityHash: "sha256:abc123",
      createdAt: new Date(),
    };

    vi.mocked(db.limit).mockResolvedValueOnce([mockLog]);
    vi.mocked(db.limit).mockResolvedValueOnce([]);

    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs/${logId}`);
    const response = await GET(request, { params: { id: logId } });

    expect(response.status).toBe(200);

    delete process.env.DEV_SUPER_ADMIN;
  });
});
