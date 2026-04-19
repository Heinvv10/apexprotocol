/**
 * GET /api/v1/brands/:id/share-of-voice
 *
 * Share-of-voice rollup for a brand across AI platforms.
 *
 * Query params:
 *   - from (ISO — default 30 days ago)
 *   - to   (ISO — default now)
 *   - platform (optional — restrict to one platform)
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import { computeShareOfVoice } from "@/lib/mentions/share-of-voice";

export const GET = withApiErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const auth = await requireV1Auth();
    const { id: brandId } = await params;
    const qp = request.nextUrl.searchParams;

    const brandRows = await db
      .select({ id: brands.id, name: brands.name })
      .from(brands)
      .where(
        and(eq(brands.id, brandId), eq(brands.organizationId, auth.tenantId)),
      )
      .limit(1);
    if (brandRows.length === 0) {
      throw new ApiError("not_found", `Brand "${brandId}" not found.`);
    }
    const brand = brandRows[0];

    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const from = qp.get("from") ? new Date(qp.get("from")!) : defaultFrom;
    const to = qp.get("to") ? new Date(qp.get("to")!) : now;
    const platform = qp.get("platform");

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new ApiError("invalid_request", "Invalid `from` or `to` timestamp.");
    }

    const points = await computeShareOfVoice({
      brandId,
      platform,
      from,
      to,
    });

    const resolved = points.map((p) =>
      p.entity === "__own__"
        ? { ...p, entity: brand.name }
        : p,
    );

    return NextResponse.json({
      data: resolved,
      meta: {
        brand_id: brandId,
        brand_name: brand.name,
        platform: platform ?? "all",
        from: from.toISOString(),
        to: to.toISOString(),
        total_entities: resolved.length,
      },
    });
  },
);
