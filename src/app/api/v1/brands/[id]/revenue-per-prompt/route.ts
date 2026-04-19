/**
 * GET /api/v1/brands/:id/revenue-per-prompt
 *
 * Revenue attribution per monitored query (FR-ATT-005).
 *
 * Query params:
 *   - from (ISO, default 30d ago)
 *   - to   (ISO, default now)
 *   - min_runs (default 3)
 *   - limit (default 50)
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import { computeRevenuePerPrompt } from "@/lib/attribution/revenue-per-prompt";

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
      throw new ApiError("not_found", "Brand not found.");
    }

    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = qp.get("from") ? new Date(qp.get("from")!) : defaultFrom;
    const to = qp.get("to") ? new Date(qp.get("to")!) : now;
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new ApiError("invalid_request", "Invalid from/to timestamp.");
    }

    const minRuns = Math.max(
      1,
      Number.parseInt(qp.get("min_runs") ?? "3", 10) || 3,
    );
    const limit = Math.min(
      200,
      Math.max(1, Number.parseInt(qp.get("limit") ?? "50", 10) || 50),
    );

    const rows = await computeRevenuePerPrompt({
      brandId,
      from,
      to,
      minRuns,
      limit,
    });

    return NextResponse.json({
      data: rows,
      meta: {
        brand_id: brandId,
        from: from.toISOString(),
        to: to.toISOString(),
        row_count: rows.length,
      },
    });
  },
);
