/**
 * Audit Logger Utility
 *
 * Creates audit log entries for all administrative actions
 * Maintains integrity hash chain for tamper detection
 *
 * Protocol: Doc-Driven TDD (GREEN phase)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { systemAuditLogs, type SystemAuditLog } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import crypto from "crypto";
import { createId } from "@paralleldrive/cuid2";

/**
 * Parameters for creating an audit log
 */
export interface CreateAuditLogParams {
  // Actor (who performed the action)
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;

  // Action details
  action: string;
  actionType: "create" | "update" | "delete" | "access" | "security" | "system";
  description: string;

  // Target (what was affected)
  targetType?: string | null;
  targetId?: string | null;
  targetName?: string | null;

  // Changes (for update actions)
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };

  // Additional metadata (flexible structure for filters, pagination, etc.)
  metadata?: Record<string, unknown>;

  // Status
  status?: "success" | "failure" | "warning";
  errorMessage?: string | null;
  errorStack?: string | null;
}

/**
 * Metadata extracted from request
 */
export interface RequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string;
  sessionId?: string;
}

/**
 * Log data for hash generation
 */
interface LogHashData {
  actorId?: string | null;
  action: string;
  actionType: string;
  description: string;
  timestamp: Date;
  previousLogHash?: string | null;
  targetType?: string | null;
  targetId?: string | null;
}

/**
 * Generate SHA-256 hash for audit log integrity chain
 */
export function generateLogHash(logData: LogHashData): string {
  const data = JSON.stringify({
    actorId: logData.actorId,
    action: logData.action,
    actionType: logData.actionType,
    description: logData.description,
    timestamp: logData.timestamp.toISOString(),
    previousLogHash: logData.previousLogHash,
    targetType: logData.targetType,
    targetId: logData.targetId,
  });

  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Extract metadata from NextRequest
 */
export function extractMetadata(request: NextRequest | null): RequestMetadata {
  if (!request) {
    return {
      ipAddress: null,
      userAgent: null,
      requestId: createId(),
    };
  }

  // Extract IP address (try x-forwarded-for first, then x-real-ip)
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  // Extract user agent
  const userAgent = request.headers.get("user-agent") || null;

  // Generate unique request ID
  const requestId = createId();

  return {
    ipAddress,
    userAgent,
    requestId,
  };
}

/**
 * Sensitive field names to redact
 */
const SENSITIVE_FIELDS = [
  "password",
  "apiKey",
  "api_key",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "secret",
  "clientSecret",
  "client_secret",
  "privateKey",
  "private_key",
  "token",
];

/**
 * Redact sensitive data from changes object
 */
export function redactSensitiveData(changes: {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}): {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
} {
  const redact = (obj: Record<string, unknown>): Record<string, unknown> => {
    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if field name is sensitive
      if (SENSITIVE_FIELDS.includes(key)) {
        redacted[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Recursively redact nested objects
        redacted[key] = redact(value as Record<string, unknown>);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  };

  return {
    before: changes.before ? redact(changes.before) : undefined,
    after: changes.after ? redact(changes.after) : undefined,
  };
}

/**
 * Get the hash of the most recent audit log for chain integrity
 */
export async function getPreviousLogHash(): Promise<string | null> {
  try {
    const previousLogs = await db
      .select({
        integrityHash: systemAuditLogs.integrityHash,
      })
      .from(systemAuditLogs)
      .orderBy(desc(systemAuditLogs.createdAt))
      .limit(1);

    if (previousLogs.length === 0) {
      return null;
    }

    return previousLogs[0].integrityHash || null;
  } catch (_error) {
    // Return null on error to avoid breaking the application
    return null;
  }
}

/**
 * Create an audit log entry
 *
 * @param params - Log parameters
 * @param request - NextRequest object (optional for system actions)
 * @returns Created log or null on failure
 */
export async function createAuditLog(
  params: CreateAuditLogParams,
  request: NextRequest | null
): Promise<SystemAuditLog | null> {
  try {
    // Extract metadata from request
    const requestMetadata = extractMetadata(request);

    // Get previous log hash for integrity chain
    const previousLogHash = await getPreviousLogHash();

    // Redact sensitive data from changes
    const sanitizedChanges = params.changes
      ? redactSensitiveData(params.changes)
      : undefined;

    // Prepare log data
    const timestamp = new Date();
    const logData: LogHashData = {
      actorId: params.actorId,
      action: params.action,
      actionType: params.actionType,
      description: params.description,
      timestamp,
      previousLogHash,
      targetType: params.targetType,
      targetId: params.targetId,
    };

    // Generate integrity hash
    const integrityHash = generateLogHash(logData);

    // Combine all metadata
    const combinedMetadata = {
      ...requestMetadata,
      ...params.metadata,
    };

    // Insert into database
    const createdLogs = await db
      .insert(systemAuditLogs)
      .values({
        id: createId(),
        actorId: params.actorId || null,
        actorName: params.actorName || null,
        actorEmail: params.actorEmail || null,
        actorRole: params.actorRole || null,
        action: params.action,
        actionType: params.actionType,
        description: params.description,
        targetType: params.targetType || null,
        targetId: params.targetId || null,
        targetName: params.targetName || null,
        changes: sanitizedChanges as unknown as typeof systemAuditLogs.$inferInsert.changes,
        metadata: combinedMetadata as unknown as typeof systemAuditLogs.$inferInsert.metadata,
        status: params.status || "success",
        errorMessage: params.errorMessage || null,
        errorStack: params.errorStack || null,
        integrityHash,
        previousLogHash,
        timestamp,
      })
      .returning();

    return createdLogs[0] || null;
  } catch (error) {
    // Never throw - log error and return null
    // This ensures audit logging failures don't break API operations
    if (process.env.NODE_ENV !== "test") {
      console.error("Failed to create audit log:", error);
    }
    return null;
  }
}
