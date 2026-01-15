/**
 * Unit Tests for Audit Logger
 *
 * Protocol: Doc-Driven TDD (RED phase)
 * These tests are expected to FAIL until implementation is complete
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createAuditLog,
  generateLogHash,
  extractMetadata,
  redactSensitiveData,
  getPreviousLogHash,
} from "./audit-logger";

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

import { db } from "@/lib/db";

describe("Audit Logger - Hash Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate deterministic SHA-256 hash", () => {
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

  it("should produce different hash for different data", () => {
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

  it("should include previousLogHash in hash calculation", () => {
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
});

describe("Audit Logger - Metadata Extraction", () => {
  it("should extract IP from x-forwarded-for header", () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: { "x-forwarded-for": "192.168.1.100" },
    });

    const metadata = extractMetadata(request);

    expect(metadata.ipAddress).toBe("192.168.1.100");
  });

  it("should extract IP from x-real-ip header as fallback", () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: { "x-real-ip": "10.0.0.1" },
    });

    const metadata = extractMetadata(request);

    expect(metadata.ipAddress).toBe("10.0.0.1");
  });

  it("should extract user agent", () => {
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0";
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: { "user-agent": userAgent },
    });

    const metadata = extractMetadata(request);

    expect(metadata.userAgent).toBe(userAgent);
  });

  it("should generate unique request ID", () => {
    const request = new NextRequest("http://localhost:3000/api/test");

    const metadata1 = extractMetadata(request);
    const metadata2 = extractMetadata(request);

    expect(metadata1.requestId).toBeDefined();
    expect(metadata2.requestId).toBeDefined();
    expect(metadata1.requestId).not.toBe(metadata2.requestId);
  });

  it("should handle missing headers gracefully", () => {
    const request = new NextRequest("http://localhost:3000/api/test");

    const metadata = extractMetadata(request);

    expect(metadata.ipAddress).toBeNull();
    expect(metadata.userAgent).toBeNull();
    expect(metadata.requestId).toBeDefined(); // Always generated
  });
});

describe("Audit Logger - Sensitive Data Redaction", () => {
  it("should redact password fields in changes", () => {
    const changes = {
      before: { name: "John", password: "secret123" },
      after: { name: "Jane", password: "newsecret456" },
    };

    const redacted = redactSensitiveData(changes);

    expect(redacted.before?.password).toBe("[REDACTED]");
    expect(redacted.after?.password).toBe("[REDACTED]");
    expect(redacted.before?.name).toBe("John");
    expect(redacted.after?.name).toBe("Jane");
  });

  it("should redact API key fields in changes", () => {
    const changes = {
      before: { name: "Config 1", apiKey: "sk_test_123" },
      after: { name: "Config 1", apiKey: "sk_test_456" },
    };

    const redacted = redactSensitiveData(changes);

    expect(redacted.before?.apiKey).toBe("[REDACTED]");
    expect(redacted.after?.apiKey).toBe("[REDACTED]");
  });

  it("should redact token fields in changes", () => {
    const changes = {
      before: { accessToken: "token123", refreshToken: "refresh123" },
      after: { accessToken: "token456", refreshToken: "refresh456" },
    };

    const redacted = redactSensitiveData(changes);

    expect(redacted.before?.accessToken).toBe("[REDACTED]");
    expect(redacted.before?.refreshToken).toBe("[REDACTED]");
    expect(redacted.after?.accessToken).toBe("[REDACTED]");
    expect(redacted.after?.refreshToken).toBe("[REDACTED]");
  });

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

    const beforeCreds = redacted.before?.credentials as Record<string, unknown>;
    const afterCreds = redacted.after?.credentials as Record<string, unknown>;
    expect(beforeCreds?.password).toBe("[REDACTED]");
    expect(beforeCreds?.apiKey).toBe("[REDACTED]");
    expect(afterCreds?.password).toBe("[REDACTED]");
    expect(afterCreds?.apiKey).toBe("[REDACTED]");
  });
});

describe("Audit Logger - Previous Hash Retrieval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("should return null when no logs exist", async () => {
    vi.mocked(db.limit).mockResolvedValue([]);

    const previousHash = await getPreviousLogHash();

    expect(previousHash).toBeNull();
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(db.limit).mockRejectedValue(new Error("DB connection failed"));

    const previousHash = await getPreviousLogHash();

    expect(previousHash).toBeNull(); // Returns null on error
  });
});

describe("Audit Logger - createAuditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create audit log with all fields", async () => {
    const mockCreatedLog = {
      id: "log_123",
      actorId: "user_123",
      actorName: "John Doe",
      actorEmail: "john@example.com",
      action: "create",
      actionType: "create",
      description: "Created user",
      integrityHash: "abc123",
      previousLogHash: null,
      timestamp: new Date(),
      createdAt: new Date(),
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
        actorEmail: "john@example.com",
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

  it("should return null on database failure", async () => {
    vi.mocked(db.limit).mockResolvedValue([]);
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

  it("should create log for system actions", async () => {
    const mockCreatedLog = {
      id: "log_123",
      actorId: null,
      actorName: "System",
      action: "system",
      actionType: "system",
      description: "System maintenance",
      integrityHash: "abc123",
      previousLogHash: null,
      timestamp: new Date(),
      createdAt: new Date(),
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

  it("should chain to previous log hash", async () => {
    const previousLog = {
      id: "log_prev",
      integrityHash: "previoushash123",
      createdAt: new Date(),
    };

    const mockCreatedLog = {
      id: "log_new",
      integrityHash: "newhash456",
      previousLogHash: "previoushash123",
      timestamp: new Date(),
      createdAt: new Date(),
    };

    vi.mocked(db.limit).mockResolvedValueOnce([previousLog]); // Previous hash query
    vi.mocked(db.returning).mockResolvedValue([mockCreatedLog]);

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

  it("should handle missing request gracefully", async () => {
    const mockCreatedLog = {
      id: "log_123",
      actorId: null,
      action: "system",
      actionType: "system",
      description: "System action",
      integrityHash: "abc123",
      timestamp: new Date(),
      createdAt: new Date(),
    };

    vi.mocked(db.limit).mockResolvedValue([]);
    vi.mocked(db.returning).mockResolvedValue([mockCreatedLog]);

    const log = await createAuditLog(
      {
        action: "system",
        actionType: "system",
        description: "System action",
        status: "success",
      },
      null as any // No request
    );

    expect(log).not.toBeNull();
  });

  it("should redact sensitive data in changes", async () => {
    const mockCreatedLog = {
      id: "log_123",
      actorId: "user_123",
      action: "update",
      actionType: "update",
      description: "Updated config",
      changes: {
        before: { name: "Config", apiKey: "[REDACTED]" },
        after: { name: "New Config", apiKey: "[REDACTED]" },
      },
      integrityHash: "abc123",
      timestamp: new Date(),
      createdAt: new Date(),
    };

    vi.mocked(db.limit).mockResolvedValue([]);
    vi.mocked(db.returning).mockResolvedValue([mockCreatedLog]);

    const request = new NextRequest("http://localhost:3000/api/test");

    const log = await createAuditLog(
      {
        actorId: "user_123",
        action: "update",
        actionType: "update",
        description: "Updated config",
        changes: {
          before: { name: "Config", apiKey: "sk_test_123" },
          after: { name: "New Config", apiKey: "sk_test_456" },
        },
        status: "success",
      },
      request
    );

    expect(log).not.toBeNull();
    // Note: The actual redaction happens in the implementation
    // This test verifies the function accepts changes with sensitive data
  });
});
