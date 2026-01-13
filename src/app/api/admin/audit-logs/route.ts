import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Admin Audit Logs API
 * GET /api/admin/audit-logs - List audit logs with filters
 * POST /api/admin/audit-logs - Create audit log (internal use)
 *
 * Protocol: Doc-Driven TDD (GREEN phase)
 * Implements requirements from docs/admin-phase5-audit-logs-spec.md
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { db } from "@/lib/db";
import { systemAuditLogs } from "@/lib/db/schema";
import { desc, and, eq, gte, lte, like, or, sql } from "drizzle-orm";

/**
 * GET /api/admin/audit-logs
 * List audit logs with filtering, search, and pagination
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - actor: string (filter by actorId)
 * - action: string (filter by action type)
 * - targetType: string (filter by target type)
 * - status: string (filter by status)
 * - startDate: string (ISO date)
 * - endDate: string (ISO date)
 * - search: string (search across multiple fields)
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    // Filter parameters
    const actor = searchParams.get("actor");
    const action = searchParams.get("action");
    const targetType = searchParams.get("targetType");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

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

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(systemAuditLogs)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);

    // Get paginated results
    const logs = await db
      .select()
      .from(systemAuditLogs)
      .where(whereClause)
      .orderBy(desc(systemAuditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        pageSize: limit, // Alias for tests
        total: totalCount,
        totalCount, // Keep both for compatibility
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        actor: actor || null,
        action: action || null,
        targetType: targetType || null,
        status: status || null,
        startDate: startDate || null,
        endDate: endDate || null,
        search: search || null,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
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
 * POST /api/admin/audit-logs
 * Create a new audit log entry (internal use)
 *
 * Request Body:
 * - actorId: string (optional)
 * - actorName: string (optional)
 * - actorEmail: string (optional)
 * - actorRole: string (optional)
 * - action: string (required)
 * - actionType: "create" | "update" | "delete" | "access" | "security" | "system" (required)
 * - description: string (required)
 * - targetType: string (optional)
 * - targetId: string (optional)
 * - targetName: string (optional)
 * - changes: object (optional)
 * - metadata: object (optional)
 * - status: "success" | "failure" | "warning" (optional, default: "success")
 * - errorMessage: string (optional)
 * - errorStack: string (optional)
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

    // Validate required fields
    if (!body.action || !body.actionType || !body.description) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: action, actionType, description",
        },
        { status: 400 }
      );
    }

    // Get previous log hash for integrity chain
    const previousLog = await db
      .select({ integrityHash: systemAuditLogs.integrityHash })
      .from(systemAuditLogs)
      .orderBy(desc(systemAuditLogs.timestamp))
      .limit(1);

    const previousLogHash = previousLog[0]?.integrityHash || null;

    // Create log entry data
    const logData = {
      actorId: body.actorId || null,
      actorName: body.actorName || null,
      actorEmail: body.actorEmail || null,
      actorRole: body.actorRole || null,
      action: body.action,
      actionType: body.actionType,
      description: body.description,
      targetType: body.targetType || null,
      targetId: body.targetId || null,
      targetName: body.targetName || null,
      changes: body.changes || null,
      metadata: body.metadata || null,
      status: body.status || "success",
      errorMessage: body.errorMessage || null,
      errorStack: body.errorStack || null,
      previousLogHash,
    };

    // Generate integrity hash
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256");
    hash.update(JSON.stringify(logData));
    const integrityHash = `sha256:${hash.digest("hex")}`;

    // Insert log entry
    const [newLog] = await db
      .insert(systemAuditLogs)
      .values({
        ...logData,
        integrityHash,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        log: newLog,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating audit log:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
