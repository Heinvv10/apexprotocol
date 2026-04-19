import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Audit by ID API Routes
 * GET /api/audit/[id] - Get audit details
 * DELETE /api/audit/[id] - Delete an audit
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { audits, brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { detectAuditRun } from "@/lib/onboarding/auto-detection";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/audit/[id] - Get audit details
 */
export async function GET(
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

    // Auto-detect: Mark "Run Audit" step as complete if audit is completed
    if (audit.status === "completed" && orgId) {
      detectAuditRun(orgId).catch((err: Error) => {
        console.error("Failed to auto-detect audit run:", err.message);
      });
    }

    return NextResponse.json({
      success: true,
      audit,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch audit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/audit/[id] - Delete an audit
 */
export async function DELETE(
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

    // Fetch audit to verify ownership
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

    // Delete audit
    await db.delete(audits).where(eq(audits.id, id));

    return NextResponse.json({
      success: true,
      message: "Audit deleted",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete audit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
