/**
 * Audit Jobs Management API
 *
 * GET /api/admin/dashboard/audit-jobs
 * - List all audit jobs with filtering and pagination
 * - Query params: status (active|pending|completed|failed), page, limit
 *
 * POST /api/admin/dashboard/audit-jobs/cancel
 * - Cancel a running audit job (stop/kill)
 * - Body: { jobId: string }
 *
 * POST /api/admin/dashboard/audit-jobs/retry
 * - Retry a failed audit job
 * - Body: { jobId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audits } from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getUserId } from "@/lib/auth";
import { getRedisClient } from "@/lib/redis";

interface AuditJobInfo {
  id: string;
  brandId: string;
  url: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  overallScore?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  duration?: number;
  errorMessage?: string;
  progress?: {
    pagesAnalyzed: number;
    totalPages: number;
  };
}

/**
 * GET - List audit jobs
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check super-admin status
    const superAdmin = await isSuperAdmin();
    if (!superAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as string | null;
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

    // Build status filter condition
    const validStatuses = ["pending", "in_progress", "completed", "failed"] as const;
    const statusFilter = status && validStatuses.includes(status as any)
      ? eq(audits.status, status as typeof validStatuses[number])
      : undefined;

    // Get total count
    const countQuery = statusFilter
      ? db.select({ count: sql`count(*)` }).from(audits).where(statusFilter)
      : db.select({ count: sql`count(*)` }).from(audits);
    const countResult = await countQuery;
    const total = parseInt((countResult[0]?.count as any) || "0", 10);

    // Fetch audit records with optional filter
    const recordsQuery = statusFilter
      ? db.select().from(audits).where(statusFilter).orderBy(audits.createdAt).limit(limit).offset(page * limit)
      : db.select().from(audits).orderBy(audits.createdAt).limit(limit).offset(page * limit);
    const records = await recordsQuery;

    // Transform to job info
    const jobs: AuditJobInfo[] = records.map((audit: any) => ({
      id: audit.id,
      brandId: audit.brandId,
      url: audit.url,
      status: audit.status,
      overallScore: audit.overallScore,
      createdAt: audit.createdAt?.toISOString() || new Date().toISOString(),
      startedAt: audit.startedAt?.toISOString(),
      completedAt: audit.completedAt?.toISOString(),
      failedAt: audit.failedAt?.toISOString(),
      duration: audit.completedAt && audit.startedAt
        ? (new Date(audit.completedAt).getTime() - new Date(audit.startedAt).getTime()) / 1000
        : undefined,
      errorMessage: audit.metadata?.error,
    }));

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Audit jobs API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch audit jobs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Cancel an audit job
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check super-admin status
    const superAdmin = await isSuperAdmin();
    if (!superAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { jobId, action } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId parameter" },
        { status: 400 }
      );
    }

    const audit = await db.query.audits.findFirst({
      where: eq(audits.id, jobId),
    });

    if (!audit) {
      return NextResponse.json(
        { error: "Audit job not found" },
        { status: 404 }
      );
    }

    if (action === "cancel") {
      // Cancel the audit - set status to failed with cancellation message
      await db
        .update(audits)
        .set({
          status: "failed",
          metadata: {
            ...(audit.metadata as any),
            error: "Audit was cancelled by admin",
            cancelledAt: new Date().toISOString(),
            cancelledBy: userId,
          },
        })
        .where(eq(audits.id, jobId));

      return NextResponse.json({
        success: true,
        message: `Audit job ${jobId} has been cancelled`,
      });
    } else if (action === "retry") {
      // Retry the audit - reset status to pending
      await db
        .update(audits)
        .set({
          status: "pending",
          startedAt: null,
          completedAt: null,
          metadata: {
            ...(audit.metadata as any),
            retriedAt: new Date().toISOString(),
            retriedBy: userId,
            previousStatus: audit.status,
          },
        })
        .where(eq(audits.id, jobId));

      return NextResponse.json({
        success: true,
        message: `Audit job ${jobId} has been queued for retry`,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'cancel' or 'retry'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Audit job action error:", error);
    return NextResponse.json(
      {
        error: "Failed to perform action on audit job",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
