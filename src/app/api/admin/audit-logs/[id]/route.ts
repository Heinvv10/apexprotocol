/**
 * Admin Audit Logs API - Dynamic Route
 * GET /api/admin/audit-logs/:id - Get detailed log information
 *
 * Protocol: Doc-Driven TDD (GREEN phase)
 * Implements requirements from docs/admin-phase5-audit-logs-spec.md
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { db } from "@/lib/db";
import { systemAuditLogs } from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";

/**
 * GET /api/admin/audit-logs/:id
 * Get detailed information for a specific audit log
 *
 * Path Parameters:
 * - id: string (log ID)
 *
 * Response includes:
 * - Full log details
 * - Related logs (same session, same target, same actor within 30 minutes)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: logId } = await params;
  try {
    // Check authentication
    const session = await auth();

    // Dev mode bypass for testing
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev) {
      if (!session?.userId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      // Check super-admin authorization
      const isAdmin = await isSuperAdmin();
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    // Get the log entry
    const logs = await db
      .select()
      .from(systemAuditLogs)
      .where(eq(systemAuditLogs.id, logId))
      .limit(1);

    if (logs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Log not found",
        },
        { status: 404 }
      );
    }

    const log = logs[0];

    // Find related logs (same target or same actor within 30 minutes)
    interface RelatedLog {
      id: string;
      timestamp: Date;
      action: string;
      actionType: string;
      description: string | null;
    }
    let relatedLogs: RelatedLog[] = [];

    try {
      const conditions = [];

      // Same target
      if (log.targetType && log.targetId) {
        conditions.push(
          and(
            eq(systemAuditLogs.targetType, log.targetType),
            eq(systemAuditLogs.targetId, log.targetId)
          )
        );
      }

      // Same actor
      if (log.actorId) {
        conditions.push(eq(systemAuditLogs.actorId, log.actorId));
      }

      if (conditions.length > 0) {
        const result = await db
          .select({
            id: systemAuditLogs.id,
            timestamp: systemAuditLogs.timestamp,
            action: systemAuditLogs.action,
            actionType: systemAuditLogs.actionType,
            description: systemAuditLogs.description,
          })
          .from(systemAuditLogs)
          .where(or(...conditions))
          .orderBy(desc(systemAuditLogs.timestamp))
          .limit(10);

        // Filter out the current log and logs outside time window
        const timeWindowStart = new Date(log.timestamp.getTime() - 30 * 60 * 1000);
        const timeWindowEnd = new Date(log.timestamp.getTime() + 30 * 60 * 1000);

        relatedLogs = result.filter((relatedLog) => {
          // Exclude current log
          if (relatedLog.id === logId) {
            return false;
          }

          // Check time window
          const timestamp = new Date(relatedLog.timestamp);
          return timestamp >= timeWindowStart && timestamp <= timeWindowEnd;
        });
      }
    } catch (error) {
      console.error("Error fetching related logs:", error);
      // Continue without related logs if there's an error
      relatedLogs = [];
    }

    return NextResponse.json({
      success: true,
      log: {
        ...log,
        relatedLogs,
      },
    });
  } catch (error) {
    console.error("Error fetching audit log details:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
