/**
 * Retry Audit API Route
 * POST /api/audit/[id]/retry - Retry a failed audit
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth";
import { db } from "@/lib/db";
import { audits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { addAuditJob } from "@/lib/queue";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/audit/[id]/retry - Retry a failed audit
 *
 * Only failed audits can be retried.
 * Creates a new job in the audit queue with the same parameters.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch audit with brand info
    const audit = await db.query.audits.findFirst({
      where: eq(audits.id, id),
      with: {
        brand: true,
      },
    });

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    // Verify brand belongs to user's org
    if (orgId && audit.brand.organizationId !== orgId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Check if audit can be retried (only failed audits)
    if (audit.status === "pending" || audit.status === "in_progress") {
      return NextResponse.json(
        { error: "Audit is already running or pending" },
        { status: 400 }
      );
    }

    if (audit.status === "completed") {
      return NextResponse.json(
        { error: "Audit has already completed successfully. Start a new audit instead." },
        { status: 400 }
      );
    }

    // Reset the audit status to pending
    const now = new Date();
    const previousMetadata = (audit.metadata || {}) as Record<string, unknown>;
    const updatedMetadata = {
      ...previousMetadata,
      retriedAt: now.toISOString(),
      retriedBy: userId,
      previousError: audit.errorMessage,
      retryCount: ((previousMetadata.retryCount as number) || 0) + 1,
    };

    await db
      .update(audits)
      .set({
        status: "pending",
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        overallScore: null,
        metadata: updatedMetadata as typeof audits.$inferSelect.metadata,
      })
      .where(eq(audits.id, id));

    // Re-queue the audit job
    const depth = (previousMetadata.depth as number) || 1;
    const maxPages = (previousMetadata.maxPages as number) || 50;

    const job = await addAuditJob(
      audit.brandId,
      orgId || audit.brand.organizationId,
      audit.url,
      {
        depth,
        maxPages,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Audit retry initiated",
      audit: {
        id,
        status: "pending",
        retriedAt: now.toISOString(),
      },
      jobId: job?.id,
    });
  } catch (error) {
    console.error("Error retrying audit:", error);
    return NextResponse.json(
      {
        error: "Failed to retry audit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
