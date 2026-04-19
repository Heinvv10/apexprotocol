/**
 * GET /api/v1/audits/:id
 *
 * Fetch a single audit result. RLS enforces tenant scoping — we also
 * double-check via the brand→organizationId join.
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { audits, brands } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";

export const GET = withApiErrorHandling(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const auth = await requireV1Auth();
    const { id } = await params;

    const rows = await db
      .select({
        audit: audits,
        brandOrgId: brands.organizationId,
      })
      .from(audits)
      .innerJoin(brands, eq(brands.id, audits.brandId))
      .where(and(eq(audits.id, id), eq(brands.organizationId, auth.tenantId)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new ApiError("not_found", `Audit "${id}" not found.`);
    }

    const a = row.audit;
    return NextResponse.json({
      data: {
        id: a.id,
        brand_id: a.brandId,
        url: a.url,
        status: a.status,
        overall_score: a.overallScore,
        category_scores: a.categoryScores ?? [],
        issue_counts: {
          total: a.issueCount ?? 0,
          critical: a.criticalCount ?? 0,
          high: a.highCount ?? 0,
          medium: a.mediumCount ?? 0,
          low: a.lowCount ?? 0,
        },
        issues: a.issues ?? [],
        recommendations_summary: a.recommendations ?? [],
        platform_scores: a.platformScores ?? [],
        error_message: a.errorMessage,
        started_at: a.startedAt?.toISOString() ?? null,
        completed_at: a.completedAt?.toISOString() ?? null,
        created_at: a.createdAt.toISOString(),
      },
    });
  },
);
