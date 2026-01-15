/**
 * Audit Log Hash Chain Verification API
 * POST /api/admin/audit-logs/verify
 *
 * Verifies the integrity of the audit log hash chain
 * Returns verification status and identifies any broken links
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { systemAuditLogs } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { generateLogHash } from "@/lib/audit-logger";

interface VerificationResult {
  isValid: boolean;
  totalLogs: number;
  logsVerified: number;
  firstBrokenAt?: {
    logId: string;
    position: number;
    expectedHash: string;
    actualHash: string;
    timestamp: string;
  };
  verificationTime: number;
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body for optional limit
    let limit = 1000; // Default to verifying last 1000 logs
    try {
      const body = await request.json();
      if (body.limit && typeof body.limit === "number") {
        limit = Math.min(body.limit, 10000); // Max 10000 logs per verification
      }
    } catch {
      // Use default limit if no body or invalid JSON
    }

    const startTime = Date.now();

    // Fetch logs ordered by creation time (oldest first for chain verification)
    const logs = await db
      .select({
        id: systemAuditLogs.id,
        actorId: systemAuditLogs.actorId,
        actorName: systemAuditLogs.actorName,
        actorEmail: systemAuditLogs.actorEmail,
        actorRole: systemAuditLogs.actorRole,
        action: systemAuditLogs.action,
        actionType: systemAuditLogs.actionType,
        description: systemAuditLogs.description,
        targetType: systemAuditLogs.targetType,
        targetId: systemAuditLogs.targetId,
        targetName: systemAuditLogs.targetName,
        changes: systemAuditLogs.changes,
        metadata: systemAuditLogs.metadata,
        status: systemAuditLogs.status,
        errorMessage: systemAuditLogs.errorMessage,
        integrityHash: systemAuditLogs.integrityHash,
        previousLogHash: systemAuditLogs.previousLogHash,
        timestamp: systemAuditLogs.timestamp,
        createdAt: systemAuditLogs.createdAt,
      })
      .from(systemAuditLogs)
      .orderBy(desc(systemAuditLogs.createdAt))
      .limit(limit);

    // Reverse to process from oldest to newest
    const orderedLogs = logs.reverse();

    if (orderedLogs.length === 0) {
      const result: VerificationResult = {
        isValid: true,
        totalLogs: 0,
        logsVerified: 0,
        verificationTime: Date.now() - startTime,
        message: "No audit logs found to verify",
      };

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    let isValid = true;
    let firstBrokenAt: VerificationResult["firstBrokenAt"] = undefined;
    let logsVerified = 0;

    for (let i = 0; i < orderedLogs.length; i++) {
      const log = orderedLogs[i];
      logsVerified++;

      // Verify hash chain link
      if (i > 0) {
        const previousLog = orderedLogs[i - 1];

        // Check if previous hash matches
        if (log.previousLogHash !== previousLog.integrityHash) {
          isValid = false;
          firstBrokenAt = {
            logId: log.id,
            position: i + 1,
            expectedHash: previousLog.integrityHash || "null",
            actualHash: log.previousLogHash || "null",
            timestamp: log.timestamp?.toISOString() || log.createdAt?.toISOString() || "",
          };
          break;
        }
      } else {
        // First log - verify previousLogHash is null
        if (log.previousLogHash !== null) {
          // This might be valid if we're only looking at recent logs
          // Check if there are older logs
          const olderLogsCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(systemAuditLogs)
            .where(sql`${systemAuditLogs.createdAt} < ${log.createdAt}`);

          if (olderLogsCount[0]?.count === 0 && log.previousLogHash !== null) {
            // First ever log should have null previousLogHash
            isValid = false;
            firstBrokenAt = {
              logId: log.id,
              position: 1,
              expectedHash: "null (first log)",
              actualHash: log.previousLogHash,
              timestamp: log.timestamp?.toISOString() || log.createdAt?.toISOString() || "",
            };
            break;
          }
        }
      }

      // Optionally verify the hash itself is correct (more expensive)
      const computedHash = generateLogHash({
        actorId: log.actorId || undefined,
        action: log.action,
        actionType: log.actionType as "create" | "update" | "delete" | "access" | "security" | "system",
        description: log.description,
        timestamp: log.timestamp || log.createdAt || new Date(),
        previousLogHash: log.previousLogHash,
      });

      if (computedHash !== log.integrityHash) {
        isValid = false;
        firstBrokenAt = {
          logId: log.id,
          position: i + 1,
          expectedHash: computedHash,
          actualHash: log.integrityHash || "null",
          timestamp: log.timestamp?.toISOString() || log.createdAt?.toISOString() || "",
        };
        break;
      }
    }

    const verificationTime = Date.now() - startTime;

    const result: VerificationResult = {
      isValid,
      totalLogs: logs.length,
      logsVerified,
      firstBrokenAt,
      verificationTime,
      message: isValid
        ? `All ${logsVerified} audit logs verified successfully. Hash chain integrity confirmed.`
        : `Hash chain broken at log #${firstBrokenAt?.position} (${firstBrokenAt?.logId}). ${logsVerified} logs checked before finding issue.`,
    };

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error verifying audit log hash chain:", error);
    return NextResponse.json(
      {
        error: "Failed to verify audit log integrity",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
