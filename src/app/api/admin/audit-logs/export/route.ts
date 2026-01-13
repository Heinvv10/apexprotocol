import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Admin Audit Logs API - Export
 * POST /api/admin/audit-logs/export - Export logs to CSV or JSON
 *
 * Protocol: Doc-Driven TDD (GREEN phase)
 * Implements requirements from docs/admin-phase5-audit-logs-spec.md
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { db } from "@/lib/db";
import { systemAuditLogs } from "@/lib/db/schema";
import { desc, and, eq, gte, lte, like, or } from "drizzle-orm";

/**
 * POST /api/admin/audit-logs/export
 * Export audit logs to CSV or JSON format
 *
 * Request Body:
 * - format: "csv" | "json" (required)
 * - filters: object (optional) - same filters as GET endpoint
 *   - actor: string
 *   - action: string
 *   - targetType: string
 *   - status: string
 *   - startDate: string
 *   - endDate: string
 *   - search: string
 *
 * Response:
 * - CSV or JSON file download with Content-Disposition header
 * - Filename format: apex-audit-logs-YYYY-MM-DD-HHmmss.{csv|json}
 * - Maximum 10,000 records per export
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    // Dev mode bypass for testing
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev) {
      if (!userId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      // Check super-admin authorization
      const isAdmin = await isSuperAdmin();
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    // Parse request body
    const body = await request.json();

    // Validate format
    const format = body.format;
    if (!format || (format !== "csv" && format !== "json")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid format. Must be 'csv' or 'json'",
        },
        { status: 400 }
      );
    }

    // Parse filters
    const filters = body.filters || {};
    const actor = filters.actor;
    const action = filters.action;
    const targetType = filters.targetType;
    const status = filters.status;
    const startDate = filters.startDate;
    const endDate = filters.endDate;
    const search = filters.search;

    // Build where conditions
    const conditions = [];

    if (actor) {
      conditions.push(eq(systemAuditLogs.actorId, actor));
    }

    if (action) {
      conditions.push(eq(systemAuditLogs.action, action));
    }

    if (targetType) {
      conditions.push(eq(systemAuditLogs.targetType, targetType));
    }

    if (status) {
      conditions.push(eq(systemAuditLogs.status, status as "success" | "failure" | "warning"));
    }

    if (startDate) {
      conditions.push(gte(systemAuditLogs.timestamp, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(systemAuditLogs.timestamp, new Date(endDate)));
    }

    // Search across multiple fields
    if (search) {
      const searchConditions = [
        like(systemAuditLogs.actorName, `%${search}%`),
        like(systemAuditLogs.actorEmail, `%${search}%`),
        like(systemAuditLogs.action, `%${search}%`),
        like(systemAuditLogs.description, `%${search}%`),
        like(systemAuditLogs.targetType, `%${search}%`),
        like(systemAuditLogs.targetName, `%${search}%`),
      ];
      conditions.push(or(...searchConditions));
    }

    // Build query
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch logs (max 10,000)
    const logs = await db
      .select()
      .from(systemAuditLogs)
      .where(whereClause)
      .orderBy(desc(systemAuditLogs.timestamp))
      .limit(10000);

    // Generate timestamp for filename
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/T/, "-")
      .replace(/\..+/, "")
      .replace(/:/g, "")
      .replace(/-/g, "-")
      .slice(0, 17); // YYYY-MM-DD-HHmmss

    if (format === "csv") {
      // Generate CSV
      const csv = generateCSV(logs);

      // Return CSV file
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="apex-audit-logs-${timestamp}.csv"`,
        },
      });
    } else {
      // Generate JSON
      const json = JSON.stringify(logs, null, 2);

      // Return JSON file
      return new Response(json, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="apex-audit-logs-${timestamp}.json"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV from audit logs
 */
function generateCSV(logs: any[]): string {
  // CSV Headers
  const headers = [
    "ID",
    "Timestamp",
    "Actor ID",
    "Actor Name",
    "Actor Email",
    "Actor Role",
    "Action",
    "Action Type",
    "Description",
    "Target Type",
    "Target ID",
    "Target Name",
    "Status",
    "IP Address",
    "User Agent",
    "Location",
    "Session ID",
    "Request ID",
    "Duration (ms)",
    "Error Message",
    "Integrity Hash",
    "Previous Log Hash",
  ];

  // Build CSV rows
  const rows = [headers.join(",")];

  for (const log of logs) {
    const metadata = log.metadata || {};
    const row = [
      escapeCSV(log.id),
      escapeCSV(log.timestamp?.toISOString() || ""),
      escapeCSV(log.actorId || ""),
      escapeCSV(log.actorName || ""),
      escapeCSV(log.actorEmail || ""),
      escapeCSV(log.actorRole || ""),
      escapeCSV(log.action || ""),
      escapeCSV(log.actionType || ""),
      escapeCSV(log.description || ""),
      escapeCSV(log.targetType || ""),
      escapeCSV(log.targetId || ""),
      escapeCSV(log.targetName || ""),
      escapeCSV(log.status || ""),
      escapeCSV(metadata.ipAddress || ""),
      escapeCSV(metadata.userAgent || ""),
      escapeCSV(metadata.location || ""),
      escapeCSV(metadata.sessionId || ""),
      escapeCSV(metadata.requestId || ""),
      escapeCSV(metadata.duration?.toString() || ""),
      escapeCSV(log.errorMessage || ""),
      escapeCSV(log.integrityHash || ""),
      escapeCSV(log.previousLogHash || ""),
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

/**
 * Escape CSV values
 */
function escapeCSV(value: string): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
