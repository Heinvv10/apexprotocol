# Phase 5: System Audit Logs - Test Specification

**Version**: 1.0
**Date**: 2025-12-17
**Status**: Draft
**Protocol**: Doc-Driven TDD (RED phase)

---

## Overview

This document maps every requirement from the Phase 5 specification to specific test cases. Tests will be written BEFORE implementation following the RED → GREEN → REFACTOR TDD cycle.

---

## Unit Tests (API Routes)

### GET /api/admin/audit-logs - List Audit Logs (FR-1)

```typescript
describe("GET /api/admin/audit-logs - List Audit Logs (FR-1)", () => {
  it("should return audit logs with all required fields (AC-1.1)", async () => {
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
    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs?page=1&pageSize=10");
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
    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs");
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination).toHaveProperty("total");
    expect(typeof data.pagination.total).toBe("number");
  });
});
```

### GET /api/admin/audit-logs - Filter Functionality (FR-2)

```typescript
describe("GET /api/admin/audit-logs - Filter Functionality (FR-2)", () => {
  it("should filter by actor (AC-2.1)", async () => {
    const actorId = "user_test123";
    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs?actor=${actorId}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.filters.actor).toBe(actorId);
    // All returned logs should match the actor filter
    data.logs.forEach((log: any) => {
      expect(log.actorId).toBe(actorId);
    });
  });

  it("should filter by action type (AC-2.2)", async () => {
    const action = "update";
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
    const dateFrom = "2025-12-01T00:00:00Z";
    const dateTo = "2025-12-17T23:59:59Z";
    const request = new NextRequest(
      `http://localhost:3000/api/admin/audit-logs?dateFrom=${dateFrom}&dateTo=${dateTo}`
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.filters.dateFrom).toBe(dateFrom);
    expect(data.filters.dateTo).toBe(dateTo);

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    data.logs.forEach((log: any) => {
      const logDate = new Date(log.timestamp);
      expect(logDate.getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(logDate.getTime()).toBeLessThanOrEqual(to.getTime());
    });
  });

  it("should support combining multiple filters (AC-2.6)", async () => {
    const action = "update";
    const status = "success";
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
```

### GET /api/admin/audit-logs - Search Functionality (FR-3)

```typescript
describe("GET /api/admin/audit-logs - Search Functionality (FR-3)", () => {
  it("should search across multiple fields (AC-3.1, AC-3.2)", async () => {
    const search = "organization";
    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs?search=${search}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.filters.search).toBe(search);

    // Verify that search matches in at least one field
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
    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs?search=${search}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toEqual([]);
    expect(data.pagination.total).toBe(0);
  });
});
```

### GET /api/admin/audit-logs/:id - Log Details (FR-4)

```typescript
describe("GET /api/admin/audit-logs/:id - Log Details (FR-4)", () => {
  it("should return detailed log information (AC-4.2)", async () => {
    const logId = "log_test123";
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
    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs/${logId}`);
    const response = await GET(request, { params: { id: logId } });

    expect(response.status).toBe(404);
  });

  it("should include related logs (AC-4.5)", async () => {
    const logId = "log_test123";
    const request = new NextRequest(`http://localhost:3000/api/admin/audit-logs/${logId}`);
    const response = await GET(request, { params: { id: logId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.log).toHaveProperty("relatedLogs");
    expect(Array.isArray(data.log.relatedLogs)).toBe(true);
  });
});
```

### POST /api/admin/audit-logs/export - Export Functionality (FR-5)

```typescript
describe("POST /api/admin/audit-logs/export - Export Functionality (FR-5)", () => {
  it("should export logs to CSV (AC-5.1, AC-5.2)", async () => {
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
});
```

### POST /api/admin/audit-logs - Create Log (Internal)

```typescript
describe("POST /api/admin/audit-logs - Create Log (Internal)", () => {
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

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("logId");
  });

  it("should generate integrity hash (SR-3)", async () => {
    const logData = {
      actorId: "user_test123",
      action: "create",
      actionType: "create",
      description: "Created new user",
      targetType: "user",
      targetId: "user_789",
      targetName: "New User",
      status: "success",
    };

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });

    const response = await POST(request);
    const data = await response.json();

    // Fetch the created log to verify hash
    const getRequest = new NextRequest(`http://localhost:3000/api/admin/audit-logs/${data.logId}`);
    const getResponse = await GET(getRequest, { params: { id: data.logId } });
    const logDetails = await getResponse.json();

    expect(logDetails.log).toHaveProperty("integrityHash");
    expect(typeof logDetails.log.integrityHash).toBe("string");
    expect(logDetails.log.integrityHash.length).toBeGreaterThan(0);
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

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it("should mask sensitive data in logs (SR-4)", async () => {
    const logData = {
      actorId: "user_test123",
      action: "create",
      actionType: "create",
      description: "Created API key",
      targetType: "api_config",
      targetId: "api_789",
      targetName: "Claude API",
      changes: {
        after: { apiKey: "sk-ant-api03-very-secret-key-12345" },
      },
      status: "success",
    };

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });

    const response = await POST(request);
    const data = await response.json();

    // Fetch the log to verify masking
    const getRequest = new NextRequest(`http://localhost:3000/api/admin/audit-logs/${data.logId}`);
    const getResponse = await GET(getRequest, { params: { id: data.logId } });
    const logDetails = await getResponse.json();

    // API key should be masked
    expect(logDetails.log.changes.after.apiKey).toMatch(/\*\*\*\*/);
    expect(logDetails.log.changes.after.apiKey).not.toContain("very-secret-key");
  });
});
```

### Security Tests (SR-1, SR-2)

```typescript
describe("Security - Authentication and Authorization", () => {
  it("should return 401 when not authenticated (SR-1)", async () => {
    // Mock auth to return null
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("should return 403 when not super-admin (SR-2)", async () => {
    // Mock auth to return user who is not super-admin
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any);
    vi.mocked(isSuperAdmin).mockResolvedValue(false);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs");
    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it("should allow access when super-admin (SR-2)", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_super123" } as any);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs");
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it("should log access to audit logs (SR-5 - meta-logging)", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_super123" } as any);
    vi.mocked(isSuperAdmin).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/admin/audit-logs");
    await GET(request);

    // Verify that a meta-log was created
    // This would check the database for a log entry with action="access" and targetType="audit_logs"
  });
});
```

---

## E2E Tests (UI)

### Audit Logs Page

```typescript
import { test, expect } from "@playwright/test";

const ADMIN_AUDIT_LOGS_URL = "/admin/audit-logs";

// Helper to wait for data to load
async function waitForDataLoad(page: Page) {
  await page.waitForSelector("table", { timeout: 5000 });
}

test.describe("Admin Audit Logs Page", () => {
  test.beforeEach(async ({ page }) => {
    // Login as super-admin
    await page.goto("/sign-in");
    // ... perform login ...
  });

  test("should display audit logs table on page load (FR-1)", async ({ page }) => {
    await page.goto(ADMIN_AUDIT_LOGS_URL);
    await waitForDataLoad(page);

    // AC-1.1: Verify table columns
    await expect(page.locator("h1")).toContainText(/Audit Logs/i);
    await expect(page.locator("th").filter({ hasText: "Timestamp" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Actor" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Action" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Target" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Status" })).toBeVisible();

    // AC-1.8: Verify total count is displayed
    await expect(page.locator("text=/Total: \\d+/")).toBeVisible();
  });

  test("should filter logs by action type (FR-2)", async ({ page }) => {
    await page.goto(ADMIN_AUDIT_LOGS_URL);
    await waitForDataLoad(page);

    // AC-2.2: Filter by action type
    await page.selectOption('select[name="action"]', "update");
    await waitForDataLoad(page);

    // Verify filter is applied
    const rows = page.locator("tbody tr");
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const actionCell = rows.nth(i).locator("td").nth(2);
      await expect(actionCell).toContainText(/update/i);
    }
  });

  test("should search logs (FR-3)", async ({ page }) => {
    await page.goto(ADMIN_AUDIT_LOGS_URL);
    await waitForDataLoad(page);

    // AC-3.1: Search functionality
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("organization");
    await waitForDataLoad(page);

    // Verify search results contain the term
    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toContainText(/organization/i);
  });

  test("should open log details modal (FR-4)", async ({ page }) => {
    await page.goto(ADMIN_AUDIT_LOGS_URL);
    await waitForDataLoad(page);

    // AC-4.1: Click log row to open details
    const firstRow = page.locator("tbody tr").first();
    await firstRow.click();

    // AC-4.2: Verify modal displays full details
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator("text=/Actor:/")).toBeVisible();
    await expect(page.locator("text=/Action:/")).toBeVisible();
    await expect(page.locator("text=/Target:/")).toBeVisible();
    await expect(page.locator("text=/Timestamp:/")).toBeVisible();
  });

  test("should export logs to CSV (FR-5)", async ({ page }) => {
    await page.goto(ADMIN_AUDIT_LOGS_URL);
    await waitForDataLoad(page);

    // AC-5.1: Export to CSV
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('button:has-text("Export")'),
      page.click('text="CSV"'),
    ]);

    // AC-5.4: Verify filename format
    expect(download.suggestedFilename()).toMatch(/apex-audit-logs-\d{4}-\d{2}-\d{2}-\d{6}\.csv/);
  });

  test("should show real-time updates notification (FR-6)", async ({ page }) => {
    await page.goto(ADMIN_AUDIT_LOGS_URL);
    await waitForDataLoad(page);

    // Wait for auto-refresh (5 seconds + buffer)
    await page.waitForTimeout(6000);

    // AC-6.2: Notification badge should appear if new logs
    const badge = page.locator('[data-testid="new-logs-badge"]');
    // Badge may or may not be visible depending on whether new logs were created
  });

  test("should display active filters as chips (FR-2)", async ({ page }) => {
    await page.goto(ADMIN_AUDIT_LOGS_URL);
    await waitForDataLoad(page);

    // Apply multiple filters
    await page.selectOption('select[name="action"]', "update");
    await page.selectOption('select[name="status"]', "success");

    // AC-2.7: Verify filter chips
    await expect(page.locator('text="Action: update"')).toBeVisible();
    await expect(page.locator('text="Status: success"')).toBeVisible();

    // AC-2.8: Clear all filters
    await page.click('button:has-text("Clear all")');
    await expect(page.locator('text="Action: update"')).not.toBeVisible();
  });
});
```

---

## Integration Tests

### Audit Logging Middleware

```typescript
describe("Audit Logging Middleware", () => {
  it("should automatically log successful actions", async () => {
    // Simulate an API call that should be logged
    await createOrganization({
      name: "Test Org",
      createdBy: "user_123",
    });

    // Verify log was created
    const logs = await db
      .select()
      .from(systemAuditLogs)
      .where(eq(systemAuditLogs.action, "create"))
      .where(eq(systemAuditLogs.targetType, "organization"))
      .orderBy(desc(systemAuditLogs.timestamp))
      .limit(1);

    expect(logs.length).toBe(1);
    expect(logs[0].actorId).toBe("user_123");
    expect(logs[0].description).toContain("organization");
  });

  it("should log failed actions with error details (EC-4)", async () => {
    // Simulate a failed action
    try {
      await updateOrganization({
        id: "nonexistent_org",
        name: "Updated Name",
        updatedBy: "user_123",
      });
    } catch (error) {
      // Expected to fail
    }

    // Verify failure was logged
    const logs = await db
      .select()
      .from(systemAuditLogs)
      .where(eq(systemAuditLogs.status, "failure"))
      .orderBy(desc(systemAuditLogs.timestamp))
      .limit(1);

    expect(logs.length).toBe(1);
    expect(logs[0].errorMessage).toBeTruthy();
  });
});
```

---

## Test Coverage Goals

- **API Routes**: 95%+ coverage
- **UI Components**: 90%+ coverage
- **Audit Logger**: 100% coverage (critical security feature)
- **Integrity Hash**: 100% coverage

---

## Test Data Requirements

### Mock Audit Logs
Create at least 100 mock audit logs with variety:
- Different action types (create, update, delete, access, security, system)
- Different actors (super-admin, org-admin, user, system)
- Different target types (user, organization, brand, api_config)
- Different statuses (success, failure, warning)
- Different time ranges (last hour, last day, last week, last month)

### Mock User Context
- Super-admin user (can access all logs)
- Regular admin user (should be denied access)
- Unauthenticated request (should be denied)

---

## Next Steps

1. Create database schema file: `src/lib/db/schema/system-audit-logs.ts`
2. Write all unit tests (expected to FAIL - RED phase)
3. Write all E2E tests (expected to FAIL - RED phase)
4. Commit RED phase with failing tests
5. Implement API routes (GREEN phase)
6. Verify tests pass
7. Implement UI components
8. Create audit logging middleware

---

**Protocol**: Doc-Driven TDD (RED phase)
**Author**: Claude Code Assistant
**Phase**: 5 - System Audit Logs
