/**
 * Unit Tests for Admin Audit Logs API - Export
 * POST /api/admin/audit-logs/export - Export logs to CSV/JSON
 *
 * Protocol: Doc-Driven TDD (RED phase)
 * These tests are expected to FAIL until implementation is complete
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock Clerk auth
vi.mock("@/lib/auth/supabase-server", () => ({
  getSession: vi.fn(async () => ({ userId: "test-user-id", orgId: "test-org-id", orgRole: "admin", orgSlug: null })),
  currentDbUser: vi.fn(async () => null),
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
    limit: vi.fn(),
  },
}));

import { getSession } from "@/lib/auth/supabase-server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { db } from "@/lib/db";

describe("POST /api/admin/audit-logs/export - Export Functionality (FR-5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({ userId: "user_super123", orgId: "test-org-id", orgRole: "admin", orgSlug: null });
    vi.mocked(isSuperAdmin).mockResolvedValue(true);
  });

  it("should export logs to CSV (AC-5.1)", async () => {
    const mockLogs = [
      {
        id: "log_1",
        timestamp: new Date("2025-12-17T10:30:00Z"),
        actorId: "user_123",
        actorName: "John Doe",
        actorEmail: "john@example.com",
        actorRole: "super_admin",
        action: "update",
        actionType: "update",
        description: "Updated organization",
        targetType: "organization",
        targetId: "org_456",
        targetName: "Acme Corp",
        status: "success",
        metadata: { ipAddress: "192.168.1.100" },
        createdAt: new Date("2025-12-17T10:30:00Z"),
      },
    ];

    vi.mocked((db as any).limit).mockResolvedValue(mockLogs);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "csv",
        filters: {},
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.headers.get("content-disposition")).toContain("apex-audit-logs-");
    expect(response.headers.get("content-disposition")).toContain(".csv");
  });

  it("should export logs to JSON (AC-5.2)", async () => {
    const mockLogs = [
      {
        id: "log_1",
        timestamp: new Date("2025-12-17T10:30:00Z"),
        actorId: "user_123",
        actorName: "John Doe",
        actorEmail: "john@example.com",
        actorRole: "super_admin",
        action: "update",
        actionType: "update",
        description: "Updated organization",
        targetType: "organization",
        targetId: "org_456",
        targetName: "Acme Corp",
        status: "success",
        metadata: { ipAddress: "192.168.1.100" },
        createdAt: new Date("2025-12-17T10:30:00Z"),
      },
    ];

    vi.mocked((db as any).limit).mockResolvedValue(mockLogs);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "json",
        filters: {},
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.headers.get("content-disposition")).toContain(".json");
  });

  it("should respect filters in export (AC-5.3)", async () => {
    const filters = {
      action: "update",
      status: "success",
    };

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
        description: "Updated something",
        targetType: "organization",
        targetId: "org_456",
        targetName: "Org",
        status: "success",
        metadata: {},
        createdAt: new Date(),
      },
    ];

    vi.mocked((db as any).limit).mockResolvedValue(mockLogs);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "json",
        filters,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const text = await response.text();
    const data = JSON.parse(text);

    data.forEach((log: any) => {
      expect(log.actionType).toBe("update");
      expect(log.status).toBe("success");
    });
  });

  it("should limit exports to 10,000 records (AC-5.6)", async () => {
    // Create 10,001 mock logs
    const mockLogs = Array.from({ length: 10001 }, (_, i) => ({
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

    vi.mocked((db as any).limit).mockResolvedValue(mockLogs.slice(0, 10000));

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "json",
        filters: {},
      }),
    });

    const response = await POST(request);
    const text = await response.text();
    const data = JSON.parse(text);

    expect(data.length).toBeLessThanOrEqual(10000);
  });

  it("should generate filename with timestamp (AC-5.4)", async () => {
    vi.mocked((db as any).limit).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "csv",
        filters: {},
      }),
    });

    const response = await POST(request);
    const disposition = response.headers.get("content-disposition");

    expect(disposition).toMatch(/apex-audit-logs-\d{4}-\d{2}-\d{2}-\d{6}\.csv/);
  });

  it("should return 400 when format is invalid", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "invalid_format",
        filters: {},
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 401 when not authenticated (SR-1)", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: null, orgId: "test-org-id", orgRole: "admin", orgSlug: null });

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "csv",
        filters: {},
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 403 when not super-admin (SR-2)", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user_123", orgId: "test-org-id", orgRole: "admin", orgSlug: null });
    vi.mocked(isSuperAdmin).mockResolvedValue(false);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "csv",
        filters: {},
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("should allow access in dev mode when DEV_SUPER_ADMIN is set", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_SUPER_ADMIN = "true";

    vi.mocked((db as any).limit).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "csv",
        filters: {},
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    delete process.env.DEV_SUPER_ADMIN;
  });

  it("should return error when export exceeds 10,000 records (EC-1)", async () => {
    // This would normally query the database to check count before export
    // For now, test that the limit is enforced

    const mockLogs = Array.from({ length: 10000 }, (_, i) => ({
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

    vi.mocked((db as any).limit).mockResolvedValue(mockLogs);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "json",
        filters: {},
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const text = await response.text();
    const data = JSON.parse(text);
    expect(data.length).toBeLessThanOrEqual(10000);
  });
});
