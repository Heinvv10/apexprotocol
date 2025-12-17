# Admin Phase 5.1 - Audit Logging Middleware Test Specifications

**Protocol**: Doc-Driven TDD (RED Phase)
**Author**: Claude Code Assistant
**Date**: 2025-12-17
**Status**: Test Specification Phase

---

## Test File Structure

```
src/lib/
  audit-logger.ts              # Implementation
  audit-logger.test.ts         # Unit tests

src/app/api/admin/users/
  route.test.ts                # Updated with audit tests
  [id]/route.test.ts           # Updated with audit tests
  [id]/suspend/route.test.ts   # Updated with audit tests
  [id]/super-admin/route.test.ts # Updated with audit tests

tests/e2e/
  audit-logging.spec.ts        # E2E tests
```

---

## Unit Tests: `src/lib/audit-logger.test.ts`

### Test Suite 1: Hash Generation

**File**: `src/lib/audit-logger.test.ts`
**Suite**: `Audit Logger - Hash Generation`

#### Test 1.1: Generates deterministic SHA-256 hash
```typescript
it("should generate deterministic SHA-256 hash", async () => {
  const logData = {
    actorId: "user_123",
    action: "create",
    actionType: "create" as const,
    description: "Created user",
    timestamp: new Date("2025-12-17T10:00:00Z"),
    previousLogHash: "abc123",
  };

  const hash1 = generateLogHash(logData);
  const hash2 = generateLogHash(logData);

  expect(hash1).toBe(hash2);
  expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 = 64 hex chars
});
```

#### Test 1.2: Different data produces different hash
```typescript
it("should produce different hash for different data", async () => {
  const logData1 = {
    actorId: "user_123",
    action: "create",
    actionType: "create" as const,
    description: "Created user",
    timestamp: new Date("2025-12-17T10:00:00Z"),
  };

  const logData2 = {
    ...logData1,
    description: "Updated user",
  };

  const hash1 = generateLogHash(logData1);
  const hash2 = generateLogHash(logData2);

  expect(hash1).not.toBe(hash2);
});
```

#### Test 1.3: Includes previousLogHash in chain
```typescript
it("should include previousLogHash in hash calculation", async () => {
  const logData = {
    actorId: "user_123",
    action: "create",
    actionType: "create" as const,
    description: "Created user",
    timestamp: new Date("2025-12-17T10:00:00Z"),
  };

  const hashWithoutPrevious = generateLogHash({ ...logData, previousLogHash: null });
  const hashWithPrevious = generateLogHash({ ...logData, previousLogHash: "abc123" });

  expect(hashWithoutPrevious).not.toBe(hashWithPrevious);
});
```

### Test Suite 2: Metadata Extraction

**Suite**: `Audit Logger - Metadata Extraction`

#### Test 2.1: Extracts IP from x-forwarded-for header
```typescript
it("should extract IP from x-forwarded-for header", async () => {
  const request = new NextRequest("http://localhost:3000/api/test", {
    headers: { "x-forwarded-for": "192.168.1.100" },
  });

  const metadata = extractMetadata(request);

  expect(metadata.ipAddress).toBe("192.168.1.100");
});
```

#### Test 2.2: Extracts IP from x-real-ip header as fallback
```typescript
it("should extract IP from x-real-ip header as fallback", async () => {
  const request = new NextRequest("http://localhost:3000/api/test", {
    headers: { "x-real-ip": "10.0.0.1" },
  });

  const metadata = extractMetadata(request);

  expect(metadata.ipAddress).toBe("10.0.0.1");
});
```

#### Test 2.3: Extracts user agent
```typescript
it("should extract user agent", async () => {
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0";
  const request = new NextRequest("http://localhost:3000/api/test", {
    headers: { "user-agent": userAgent },
  });

  const metadata = extractMetadata(request);

  expect(metadata.userAgent).toBe(userAgent);
});
```

#### Test 2.4: Generates request ID
```typescript
it("should generate unique request ID", async () => {
  const request = new NextRequest("http://localhost:3000/api/test");

  const metadata1 = extractMetadata(request);
  const metadata2 = extractMetadata(request);

  expect(metadata1.requestId).toBeDefined();
  expect(metadata2.requestId).toBeDefined();
  expect(metadata1.requestId).not.toBe(metadata2.requestId);
});
```

#### Test 2.5: Handles missing headers gracefully
```typescript
it("should handle missing headers gracefully", async () => {
  const request = new NextRequest("http://localhost:3000/api/test");

  const metadata = extractMetadata(request);

  expect(metadata.ipAddress).toBeNull();
  expect(metadata.userAgent).toBeNull();
  expect(metadata.requestId).toBeDefined(); // Always generated
});
```

### Test Suite 3: Sensitive Data Redaction

**Suite**: `Audit Logger - Sensitive Data Redaction`

#### Test 3.1: Redacts password fields
```typescript
it("should redact password fields in changes", () => {
  const changes = {
    before: { name: "John", password: "secret123" },
    after: { name: "Jane", password: "newsecret456" },
  };

  const redacted = redactSensitiveData(changes);

  expect(redacted.before.password).toBe("[REDACTED]");
  expect(redacted.after.password).toBe("[REDACTED]");
  expect(redacted.before.name).toBe("John");
  expect(redacted.after.name).toBe("Jane");
});
```

#### Test 3.2: Redacts API key fields
```typescript
it("should redact API key fields in changes", () => {
  const changes = {
    before: { name: "Config 1", apiKey: "sk_test_123" },
    after: { name: "Config 1", apiKey: "sk_test_456" },
  };

  const redacted = redactSensitiveData(changes);

  expect(redacted.before.apiKey).toBe("[REDACTED]");
  expect(redacted.after.apiKey).toBe("[REDACTED]");
});
```

#### Test 3.3: Redacts token fields
```typescript
it("should redact token fields in changes", () => {
  const changes = {
    before: { accessToken: "token123", refreshToken: "refresh123" },
    after: { accessToken: "token456", refreshToken: "refresh456" },
  };

  const redacted = redactSensitiveData(changes);

  expect(redacted.before.accessToken).toBe("[REDACTED]");
  expect(redacted.before.refreshToken).toBe("[REDACTED]");
  expect(redacted.after.accessToken).toBe("[REDACTED]");
  expect(redacted.after.refreshToken).toBe("[REDACTED]");
});
```

#### Test 3.4: Handles nested objects
```typescript
it("should redact sensitive data in nested objects", () => {
  const changes = {
    before: {
      name: "User",
      credentials: {
        password: "secret",
        apiKey: "key123",
      },
    },
    after: {
      name: "User",
      credentials: {
        password: "newsecret",
        apiKey: "key456",
      },
    },
  };

  const redacted = redactSensitiveData(changes);

  expect(redacted.before.credentials.password).toBe("[REDACTED]");
  expect(redacted.before.credentials.apiKey).toBe("[REDACTED]");
  expect(redacted.after.credentials.password).toBe("[REDACTED]");
  expect(redacted.after.credentials.apiKey).toBe("[REDACTED]");
});
```

### Test Suite 4: Previous Hash Retrieval

**Suite**: `Audit Logger - Previous Hash Retrieval`

#### Test 4.1: Retrieves latest log hash
```typescript
it("should retrieve latest log hash", async () => {
  const mockLog = {
    id: "log_123",
    integrityHash: "abc123def456",
    createdAt: new Date(),
  };

  vi.mocked(db.limit).mockResolvedValue([mockLog]);

  const previousHash = await getPreviousLogHash();

  expect(previousHash).toBe("abc123def456");
});
```

#### Test 4.2: Returns null for empty database
```typescript
it("should return null when no logs exist", async () => {
  vi.mocked(db.limit).mockResolvedValue([]);

  const previousHash = await getPreviousLogHash();

  expect(previousHash).toBeNull();
});
```

#### Test 4.3: Handles database errors
```typescript
it("should handle database errors gracefully", async () => {
  vi.mocked(db.limit).mockRejectedValue(new Error("DB connection failed"));

  const previousHash = await getPreviousLogHash();

  expect(previousHash).toBeNull(); // Returns null on error
});
```

### Test Suite 5: Main createAuditLog Function

**Suite**: `Audit Logger - createAuditLog`

#### Test 5.1: Creates audit log successfully
```typescript
it("should create audit log with all fields", async () => {
  const mockCreatedLog = {
    id: "log_123",
    actorId: "user_123",
    actorName: "John Doe",
    action: "create",
    actionType: "create",
    description: "Created user",
    integrityHash: "abc123",
    timestamp: new Date(),
  };

  vi.mocked(db.limit).mockResolvedValue([]); // No previous logs
  vi.mocked(db.returning).mockResolvedValue([mockCreatedLog]);

  const request = new NextRequest("http://localhost:3000/api/test", {
    headers: {
      "x-forwarded-for": "192.168.1.100",
      "user-agent": "Mozilla/5.0",
    },
  });

  const log = await createAuditLog(
    {
      actorId: "user_123",
      actorName: "John Doe",
      action: "create",
      actionType: "create",
      description: "Created user",
      status: "success",
    },
    request
  );

  expect(log).not.toBeNull();
  expect(log?.actorId).toBe("user_123");
  expect(log?.action).toBe("create");
  expect(log?.integrityHash).toBeDefined();
});
```

#### Test 5.2: Handles database failure gracefully
```typescript
it("should return null on database failure", async () => {
  vi.mocked(db.returning).mockRejectedValue(new Error("DB error"));

  const request = new NextRequest("http://localhost:3000/api/test");

  const log = await createAuditLog(
    {
      actorId: "user_123",
      action: "create",
      actionType: "create",
      description: "Created user",
      status: "success",
    },
    request
  );

  expect(log).toBeNull();
});
```

#### Test 5.3: Works with system actions (no actor)
```typescript
it("should create log for system actions", async () => {
  const mockCreatedLog = {
    id: "log_123",
    actorId: null,
    actorName: "System",
    action: "system",
    actionType: "system",
    description: "System maintenance",
    integrityHash: "abc123",
    timestamp: new Date(),
  };

  vi.mocked(db.limit).mockResolvedValue([]);
  vi.mocked(db.returning).mockResolvedValue([mockCreatedLog]);

  const request = new NextRequest("http://localhost:3000/api/test");

  const log = await createAuditLog(
    {
      action: "system",
      actionType: "system",
      description: "System maintenance",
      status: "success",
    },
    request
  );

  expect(log).not.toBeNull();
  expect(log?.actorId).toBeNull();
});
```

#### Test 5.4: Chains to previous log hash
```typescript
it("should chain to previous log hash", async () => {
  const previousLog = {
    id: "log_prev",
    integrityHash: "previoushash123",
    createdAt: new Date(),
  };

  vi.mocked(db.limit).mockResolvedValueOnce([previousLog]); // Previous hash query
  vi.mocked(db.returning).mockResolvedValue([
    {
      id: "log_new",
      integrityHash: "newhash456",
      previousLogHash: "previoushash123",
      timestamp: new Date(),
    },
  ]);

  const request = new NextRequest("http://localhost:3000/api/test");

  const log = await createAuditLog(
    {
      action: "create",
      actionType: "create",
      description: "Created user",
      status: "success",
    },
    request
  );

  expect(log?.previousLogHash).toBe("previoushash123");
});
```

---

## Integration Tests: Updated Route Tests

### User Management Routes

**File**: `src/app/api/admin/users/route.test.ts`

#### Additional Test: Creates audit log on user list
```typescript
it("should create audit log when super-admin lists users", async () => {
  // Setup mocks...

  const request = new NextRequest("http://localhost:3000/api/admin/users");
  const response = await GET(request);

  expect(response.status).toBe(200);

  // Verify audit log created
  expect(db.insert).toHaveBeenCalledWith(systemAuditLogs);
  expect(db.values).toHaveBeenCalledWith(
    expect.objectContaining({
      action: "access",
      actionType: "access",
      description: expect.stringContaining("Viewed users list"),
    })
  );
});
```

**File**: `src/app/api/admin/users/[id]/suspend/route.test.ts`

#### Additional Test: Logs suspension with reason
```typescript
it("should create audit log with suspension reason", async () => {
  const userId = "user_123";
  const reason = "Violation of terms";

  const request = new NextRequest(
    `http://localhost:3000/api/admin/users/${userId}/suspend`,
    {
      method: "POST",
      body: JSON.stringify({ suspended: true, reason }),
    }
  );

  const response = await POST(request, { params: { id: userId } });

  expect(response.status).toBe(200);

  // Verify audit log includes reason
  expect(db.values).toHaveBeenCalledWith(
    expect.objectContaining({
      action: "security",
      actionType: "security",
      description: expect.stringContaining(reason),
    })
  );
});
```

---

## E2E Tests: `tests/e2e/audit-logging.spec.ts`

### Test Journey 1: User Management Audit Trail

```typescript
test.describe("Audit Logging - User Management", () => {
  test("should log complete user management journey", async ({ page }) => {
    // Login as super-admin
    await page.goto("/admin/users");
    await page.waitForSelector('text="User Management"');

    // Create user
    await page.click('button:has-text("Create User")');
    await page.fill('[name="name"]', "Test User");
    await page.fill('[name="email"]', "test@example.com");
    await page.click('button:has-text("Create")');
    await page.waitForSelector('text="User created successfully"');

    // Navigate to audit logs
    await page.goto("/admin/audit-logs");
    await page.waitForSelector('text="System Audit Logs"');

    // Search for user creation
    await page.fill('[placeholder="Search logs..."]', "Test User");
    await page.waitForTimeout(500);

    // Verify log appears
    const logRow = page.locator('text="Created user Test User"');
    await expect(logRow).toBeVisible();

    // Click to view details
    await logRow.click();
    await page.waitForSelector('text="Audit Log Details"');

    // Verify details modal
    await expect(page.locator('text="create"')).toBeVisible();
    await expect(page.locator('text="success"')).toBeVisible();
    await expect(page.locator('text="test@example.com"')).toBeVisible();
  });
});
```

### Test Journey 2: Integrity Chain Verification

```typescript
test.describe("Audit Logging - Integrity Chain", () => {
  test("should maintain integrity hash chain", async ({ page }) => {
    // Perform 3 actions
    await page.goto("/admin/users");

    // Action 1: Create user
    await page.click('button:has-text("Create User")');
    // ... create user ...

    // Action 2: Update user
    // ... update user ...

    // Action 3: Suspend user
    // ... suspend user ...

    // Navigate to audit logs
    await page.goto("/admin/audit-logs");

    // Get the 3 most recent logs
    const logRows = page.locator('table tbody tr').first().locator('..').locator('tr');
    const count = await logRows.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Click first log
    await logRows.nth(0).click();
    const hash1 = await page.locator('[data-testid="integrity-hash"]').textContent();
    const prevHash1 = await page.locator('[data-testid="previous-hash"]').textContent();
    await page.click('[aria-label="Close"]');

    // Click second log
    await logRows.nth(1).click();
    const hash2 = await page.locator('[data-testid="integrity-hash"]').textContent();
    const prevHash2 = await page.locator('[data-testid="previous-hash"]').textContent();
    await page.click('[aria-label="Close"]');

    // Verify chain: hash2 should equal prevHash1
    expect(hash2).toBe(prevHash1);
  });
});
```

### Test Journey 3: Export Includes Actions

```typescript
test.describe("Audit Logging - Export", () => {
  test("should include logged actions in CSV export", async ({ page }) => {
    // Perform an action
    await page.goto("/admin/users");
    await page.click('button:has-text("Create User")');
    // ... create user ...

    // Navigate to audit logs
    await page.goto("/admin/audit-logs");

    // Export CSV
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('button:has-text("Export CSV")'),
    ]);

    // Verify download
    expect(download.suggestedFilename()).toContain("audit-logs");
    expect(download.suggestedFilename()).toEndWith(".csv");

    // Read CSV content
    const path = await download.path();
    const fs = require("fs");
    const content = fs.readFileSync(path, "utf-8");

    // Verify action in CSV
    expect(content).toContain("Created user");
    expect(content).toContain("success");
  });
});
```

---

## Zero Tolerance Checks

### Pre-Commit Validation

```bash
# TypeScript
npm run type-check
# Expected: 0 errors

# ESLint
npm run lint
# Expected: 0 errors, 0 warnings

# Zero Tolerance Script
node scripts/zero-tolerance-check.js
# Expected: All checks pass

# Unit Tests
npm test -- src/lib/audit-logger.test.ts --run
# Expected: All tests pass

# Integration Tests
npm test -- src/app/api/admin/users --run
# Expected: All tests pass

# E2E Tests
npm run test:e2e tests/e2e/audit-logging.spec.ts
# Expected: All tests pass
```

---

## Test Coverage Requirements

- **Unit Tests**: >95% coverage for `audit-logger.ts`
- **Integration Tests**: 100% of instrumented routes tested
- **E2E Tests**: All major user journeys covered
- **Edge Cases**: All EC-1 through EC-5 tested

---

## Definition of Done (Tests)

- [ ] All unit tests written and RED
- [ ] All integration tests updated and RED
- [ ] All E2E tests written
- [ ] All tests pass after GREEN implementation
- [ ] Zero Tolerance checks pass
- [ ] No console.log statements
- [ ] No DGTS violations (all assertions verified)
- [ ] No NLNH violations (no assumed behavior)

---

**Next Step**: Write RED phase tests starting with `audit-logger.test.ts`
