/**
 * Cancel Audit API Route
 * POST /api/audit/[id]/cancel - Cancel a pending or in-progress audit
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { audits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/audit/[id]/cancel - Cancel an audit
 *
 * Only pending or in_progress audits can be cancelled.
 * Completed or already failed audits cannot be cancelled.
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

    // Check if audit can be cancelled
    if (audit.status === "completed") {
      return NextResponse.json(
        { error: "Cannot cancel a completed audit" },
        { status: 400 }
      );
    }

    if (audit.status === "failed") {
      return NextResponse.json(
        { error: "Audit has already failed" },
        { status: 400 }
      );
    }

    // Cancel the audit by setting status to failed
    const now = new Date();
    const existingMetadata = (audit.metadata || {}) as Record<string, unknown>;
    const updatedMetadata = {
      ...existingMetadata,
      cancelledAt: now.toISOString(),
      cancelledBy: userId,
      cancellationReason: "User requested cancellation",
    };

    await db
      .update(audits)
      .set({
        status: "failed",
        completedAt: now,
        errorMessage: "Audit cancelled by user",
        metadata: updatedMetadata as typeof audits.$inferSelect.metadata,
      })
      .where(eq(audits.id, id));

    return NextResponse.json({
      success: true,
      message: "Audit cancelled successfully",
      audit: {
        id,
        status: "failed",
        cancelledAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error cancelling audit:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel audit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
