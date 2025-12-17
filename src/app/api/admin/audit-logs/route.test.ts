/**
 * Unit Tests for Admin Audit Logs API
 * GET /api/admin/audit-logs - List audit logs with filtering
 * POST /api/admin/audit-logs - Create audit log (internal)
 *
 * Protocol: Doc-Driven TDD (RED phase)
 * These tests are expected to FAIL until implementation is complete
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock super-admin check
vi.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: vi.fn(),
}));

// Mock database with proper query chain
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

import { auth } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { db } from "@/lib/db";

// Helper to set up database mocks for GET requests
function setupGetMocks(logs: any[], totalCount?: number) {
  const count = totalCount !== undefined ? totalCount : logs.length;

  // Reset mocks
  vi.mocked(db.where).mockReturnValue(db as any);
  vi.mocked(db.from).mockReturnValue(db as any);

  // Setup sequential query responses
  let queryCount = 0;

  vi.mocked(db.where).mockImplementation((clause: any) => {
    queryCount++;
    if (queryCount === 1) {
      // First query is count
      return Promise.resolve([{ count }]) as any;
    }
    // Second query is logs - continue chain
    return db as any;
  });

  // Logs query resolves at offset
  vi.mocked(db.offset).mockResolvedValue(logs);
}

// Helper to set up database mocks for POST requests
function setupPostMocks(createdLog: any, previousLogHash: string | null = null) {
  // Mock previous log hash query (first query)
  const previousLog = previousLogHash ? [{ integrityHash: previousLogHash }] : [];
  vi.mocked(db.limit).mockResolvedValueOnce(previousLog);

  // Mock insert returning (second query)
  vi.mocked(db.returning).mockResolvedValue([createdLog]);
}

describe("GET /api/admin/audit-logs - List Audit Logs (FR-1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated super-admin
    vi.mocked(auth).mockResolvedValue({ userId: "user_super123" } as any);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);
  });

  it("should return audit logs with all required fields (AC-1.1)", async () => {
    const mockLogs = [
      {
        id: "log_123",
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
        changes: { before: { plan: "starter" }, after: { plan: "enterprise" } },
        metadata: { ipAddress: "192.168.1.100", userAgent: "Mozilla/5.0..." },
        status: "success",
        integrityHash: "sha256:abc123",
        previousLogHash: "sha256:xyz789",
        createdAt: new Date("2025-12-17T10:30:00Z"),
      },
    ];

    setupGetMocks(mockLogs);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("logs");
    expect(Array.isArray(data.logs)).toBe(true);

    if (data.logs.length > 0) {
      const log = data.logs[0];
      expect(log).toHaveProperty("id");
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
      expect(log).toHaveProperty("status");
      expect(log).toHaveProperty("metadata");
    }
  });

  it("should return logs in reverse chronological order (AC-1.2)", async () => {
    const mockLogs = [
      {
        id: "log_1",
        timestamp: new Date("2025-12-17T10:30:00Z"),
        actorId: "user_123",
        actorName: "User 1",
        actorEmail: "user1@example.com",
        actorRole: "admin",
        action: "create",
        actionType: "create",
        description: "Created user",
        targetType: "user",
        targetId: "user_456",
        targetName: "New User",
        status: "success",
        metadata: {},
        createdAt: new Date("2025-12-17T10:30:00Z"),
      },
      {
        id: "log_2",
        timestamp: new Date("2025-12-17T10:25:00Z"),
        actorId: "user_123",
        actorName: "User 1",
        actorEmail: "user1@example.com",
        actorRole: "admin",
        action: "update",
        actionType: "update",
        description: "Updated settings",
        targetType: "system",
        targetId: null,
        targetName: "System",
        status: "success",
        metadata: {},
        createdAt: new Date("2025-12-17T10:25:00Z"),
      },
    ];

    setupGetMocks(mockLogs);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs");
    const response = await GET(request);
    const data = await response.json();

    if (data.logs.length > 1) {
      const first = new Date(data.logs[0].timestamp);
      const second = new Date(data.logs[1].timestamp);
      expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
    }
  });

  it("should support pagination (AC-1.7)", async () => {
    const mockLogs = Array.from({ length: 10 }, (_, i) => ({
      id: `log_${i}`,
      timestamp: new Date(),
      actorId: "user_123",
      actorName: "User",
      actorEmail: "user@example.com",
      actorRole: "admin",
      action: "access",
      actionType: "access",
      description: `Action ${i}`,
      targetType: "user",
      targetId: "user_456",
      targetName: "Target",
      status: "success",
      metadata: {},
      createdAt: new Date(),
    }));

    setupGetMocks(mockLogs);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs?page=1&limit=10");
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveProperty("pagination");
    expect(data.pagination).toHaveProperty("page", 1);
    expect(data.pagination).toHaveProperty("pageSize", 10);
    expect(data.pagination).toHaveProperty("total");
    expect(data.pagination).toHaveProperty("totalPages");
    expect(data.logs.length).toBeLessThanOrEqual(10);
  });

  it("should show total count of logs (AC-1.8)", async () => {
    setupGetMocks([]);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs");
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination).toHaveProperty("total");
    expect(typeof data.pagination.total).toBe("number");
  });
});

describe("GET /api/admin/audit-logs - Filter Functionality (FR-2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: "user_super123" } as any);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);
  });

  it("should filter by actor (AC-2.1)", async () => {
    const actorId = "user_test123";
    const mockLogs = [
      {
        id: "log_1",
        timestamp: new Date(),
        actorId: actorId,
        actorName: "Test User",
        actorEmail: "test@example.com",
        actorRole: "admin",
        action: "create",
        actionType: "create",
        description: "Created something",
        targetType: "user",
        targetId: "user_456",
        targetName: "Target",
        status: "success",
        metadata: {},
        createdAt: new Date(),
      },
    ];

    setupGetMocks(mockLogs);

    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs?actor=${actorId}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.filters.actor).toBe(actorId);
    data.logs.forEach((log: any) => {
      expect(log.actorId).toBe(actorId);
    });
  });

  it("should filter by action type (AC-2.2)", async () => {
    const action = "update";
    const mockLogs = [
      {
        id: "log_1",
        timestamp: new Date(),
        actorId: "user_123",
        actorName: "User",
        actorEmail: "user@example.com",
        actorRole: "admin",
        action: action,
        actionType: action,
        description: "Updated something",
        targetType: "organization",
        targetId: "org_456",
        targetName: "Org",
        status: "success",
        metadata: {},
        createdAt: new Date(),
      },
    ];

    setupGetMocks(mockLogs);

    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs?action=${action}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.filters.action).toBe(action);
    data.logs.forEach((log: any) => {
      expect(log.actionType).toBe(action);
    });
  });

  it("should filter by target type (AC-2.3)", async () => {
    const targetType = "organization";
    const mockLogs = [
      {
        id: "log_1",
        timestamp: new Date(),
        actorId: "user_123",
        actorName: "User",
        actorEmail: "user@example.com",
        actorRole: "admin",
        action: "update",
        actionType: "update",
        description: "Updated organization",
        targetType: targetType,
        targetId: "org_456",
        targetName: "Org",
        status: "success",
        metadata: {},
        createdAt: new Date(),
      },
    ];

    setupGetMocks(mockLogs);

    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs?targetType=${targetType}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.filters.targetType).toBe(targetType);
    data.logs.forEach((log: any) => {
      expect(log.targetType).toBe(targetType);
    });
  });

  it("should filter by status (AC-2.4)", async () => {
    const status = "success";
    const mockLogs = [
      {
        id: "log_1",
        timestamp: new Date(),
        actorId: "user_123",
        actorName: "User",
        actorEmail: "user@example.com",
        actorRole: "admin",
        action: "create",
        actionType: "create",
        description: "Created something",
        targetType: "user",
        targetId: "user_456",
        targetName: "Target",
        status: status,
        metadata: {},
        createdAt: new Date(),
      },
    ];

    setupGetMocks(mockLogs);

    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs?status=${status}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.filters.status).toBe(status);
    data.logs.forEach((log: any) => {
      expect(log.status).toBe(status);
    });
  });

  it("should filter by date range (AC-2.5)", async () => {
    const startDate = "2025-12-01T00:00:00Z";
    const endDate = "2025-12-17T23:59:59Z";
    const mockLogs = [
      {
        id: "log_1",
        timestamp: new Date("2025-12-15T10:00:00Z"),
        actorId: "user_123",
        actorName: "User",
        actorEmail: "user@example.com",
        actorRole: "admin",
        action: "create",
        actionType: "create",
        description: "Created something",
        targetType: "user",
        targetId: "user_456",
        targetName: "Target",
        status: "success",
        metadata: {},
        createdAt: new Date("2025-12-15T10:00:00Z"),
      },
    ];

    setupGetMocks(mockLogs);

    const request = new NextRequest(
      `http://localhost:3000/api/admin/audit-logs?startDate=${startDate}&endDate=${endDate}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.filters.startDate).toBe(startDate);
    expect(data.filters.endDate).toBe(endDate);

    const from = new Date(startDate);
    const to = new Date(endDate);
    data.logs.forEach((log: any) => {
      const logDate = new Date(log.timestamp);
      expect(logDate.getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(logDate.getTime()).toBeLessThanOrEqual(to.getTime());
    });
  });

  it("should support combining multiple filters (AC-2.6)", async () => {
    const action = "update";
    const status = "success";
    const mockLogs = [
      {
        id: "log_1",
        timestamp: new Date(),
        actorId: "user_123",
        actorName: "User",
        actorEmail: "user@example.com",
        actorRole: "admin",
        action: action,
        actionType: action,
        description: "Updated something",
        targetType: "organization",
        targetId: "org_456",
        targetName: "Org",
        status: status,
        metadata: {},
        createdAt: new Date(),
      },
    ];

    setupGetMocks(mockLogs);

    const request = new NextRequest(
      `http://localhost:3000/api/admin/audit-logs?action=${action}&status=${status}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.filters.action).toBe(action);
    expect(data.filters.status).toBe(status);

    data.logs.forEach((log: any) => {
      expect(log.actionType).toBe(action);
      expect(log.status).toBe(status);
    });
  });
});

describe("GET /api/admin/audit-logs - Search Functionality (FR-3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: "user_super123" } as any);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);
  });

  it("should search across multiple fields (AC-3.1, AC-3.2)", async () => {
    const search = "organization";
    const mockLogs = [
      {
        id: "log_1",
        timestamp: new Date(),
        actorId: "user_123",
        actorName: "User",
        actorEmail: "user@example.com",
        actorRole: "admin",
        action: "update",
        actionType: "update",
        description: "Updated organization settings",
        targetType: "organization",
        targetId: "org_456",
        targetName: "Test Organization",
        status: "success",
        metadata: {},
        createdAt: new Date(),
      },
    ];

    setupGetMocks(mockLogs);

    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs?search=${search}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.filters.search).toBe(search);

    data.logs.forEach((log: any) => {
      const searchLower = search.toLowerCase();
      const matches =
        log.actorName?.toLowerCase().includes(searchLower) ||
        log.actorEmail?.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower) ||
        log.description?.toLowerCase().includes(searchLower) ||
        log.targetName?.toLowerCase().includes(searchLower);
      expect(matches).toBe(true);
    });
  });

  it("should return empty array when no results found (AC-3.5)", async () => {
    const search = "nonexistent_search_term_xyz123";

    setupGetMocks([]);

    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs?search=${search}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toEqual([]);
    expect(data.pagination.total).toBe(0);
  });
});

describe("POST /api/admin/audit-logs - Create Log (Internal)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: "user_super123" } as any);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);
  });

  it("should create audit log with all required fields", async () => {
    const logData = {
      actorId: "user_test123",
      actorName: "Test User",
      actorEmail: "test@example.com",
      actorRole: "super_admin",
      action: "update",
      actionType: "update",
      description: "Updated organization settings",
      targetType: "organization",
      targetId: "org_456",
      targetName: "Test Org",
      changes: {
        before: { plan: "starter" },
        after: { plan: "enterprise" },
      },
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0...",
        sessionId: "sess_789",
      },
      status: "success",
    };

    const mockCreatedLog = {
      id: "log_new123",
      ...logData,
      timestamp: new Date(),
      integrityHash: "sha256:abc123",
      previousLogHash: "sha256:xyz789",
      createdAt: new Date(),
    };

    setupPostMocks(mockCreatedLog, "sha256:xyz789");

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("log");
  });

  it("should handle system-triggered actions with no actor (EC-3)", async () => {
    const logData = {
      actorId: null,
      actorName: "System",
      actorEmail: null,
      actorRole: "system",
      action: "system",
      actionType: "system",
      description: "Automated database cleanup",
      targetType: "system",
      targetId: null,
      targetName: "Database",
      status: "success",
    };

    const mockCreatedLog = {
      id: "log_system123",
      ...logData,
      timestamp: new Date(),
      integrityHash: "sha256:abc123",
      createdAt: new Date(),
    };

    setupPostMocks(mockCreatedLog);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});

describe("Security - Authentication and Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow access in dev mode when DEV_SUPER_ADMIN is set (GET)", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_SUPER_ADMIN = "true";

    setupGetMocks([]);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs");
    const response = await GET(request);

    expect(response.status).toBe(200);

    delete process.env.DEV_SUPER_ADMIN;
  });

  it("should allow access in dev mode when DEV_SUPER_ADMIN is set (POST)", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_SUPER_ADMIN = "true";

    const mockCreatedLog = {
      id: "log_new123",
      actorId: "dev_user",
      action: "create",
      actionType: "create",
      description: "Test log",
      status: "success",
      timestamp: new Date(),
      createdAt: new Date(),
    };

    setupPostMocks(mockCreatedLog);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actorId: "dev_user",
        action: "create",
        actionType: "create",
        description: "Test log",
        status: "success",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    delete process.env.DEV_SUPER_ADMIN;
  });
});
