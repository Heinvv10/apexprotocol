/**
 * GET /api/v1/brands/:id/scores
 *
 * Time-series of audit scores for a brand.
 * Use `from` / `to` (ISO) to window. Returns most recent N (default 30)
 * audits when unspecified.
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands, audits } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";

export const GET = withApiErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const auth = await requireV1Auth();
    const { id: brandId } = await params;
    const qp = request.nextUrl.searchParams;

    const brandRows = await db
      .select({ id: brands.id })
      .from(brands)
      .where(
        and(eq(brands.id, brandId), eq(brands.organizationId, auth.tenantId)),
      )
      .limit(1);
    if (brandRows.length === 0) {
      throw new ApiError("not_found", `Brand "${brandId}" not found.`);
    }

    const filters: SQL[] = [
      eq(audits.brandId, brandId),
      eq(audits.status, "completed"),
    ];

    const from = qp.get("from");
    if (from) {
      const d = new Date(from);
      if (Number.isNaN(d.getTime())) {
        throw new ApiError("invalid_request", "Invalid `from` timestamp.");
      }
      filters.push(gte(audits.completedAt, d));
    }
    const to = qp.get("to");
    if (to) {
      const d = new Date(to);
      if (Number.isNaN(d.getTime())) {
        throw new ApiError("invalid_request", "Invalid `to` timestamp.");
      }
      filters.push(lte(audits.completedAt, d));
    }

    const limit = (() => {
      const raw = qp.get("limit");
      if (!raw) return 30;
      const n = Number.parseInt(raw, 10);
      if (Number.isNaN(n) || n <= 0) return 30;
      return Math.min(n, 365);
    })();

    const rows = await db
      .select({
        id: audits.id,
        overallScore: audits.overallScore,
        categoryScores: audits.categoryScores,
        issueCount: audits.issueCount,
        criticalCount: audits.criticalCount,
        highCount: audits.highCount,
        mediumCount: audits.mediumCount,
        lowCount: audits.lowCount,
        completedAt: audits.completedAt,
      })
      .from(audits)
      .where(and(...filters))
      .orderBy(desc(audits.completedAt))
      .limit(limit);

    // Return chronologically ascending so clients can chart directly
    const series = rows.reverse().map((r) => ({
      audit_id: r.id,
      overall_score: r.overallScore,
      category_scores: r.categoryScores ?? [],
      issue_counts: {
        total: r.issueCount ?? 0,
        critical: r.criticalCount ?? 0,
        high: r.highCount ?? 0,
        medium: r.mediumCount ?? 0,
        low: r.lowCount ?? 0,
      },
      timestamp: r.completedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({
      data: series,
      meta: {
        brand_id: brandId,
        count: series.length,
        from: from ?? null,
        to: to ?? null,
      },
    });
  },
);
