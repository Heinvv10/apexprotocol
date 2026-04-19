/**
 * GET /api/v1/brands/:id/recommendations
 *
 * List recommendations for a brand. Cursor-paginated.
 *
 * Query params:
 *   - limit (1..200, default 50)
 *   - cursor (opaque)
 *   - status (pending|in_progress|completed|dismissed)
 *   - priority (critical|high|medium|low)
 *   - category (technical_seo|content_optimization|schema_markup|citation_building|brand_consistency|competitor_analysis|content_freshness|authority_building)
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq, lt, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands, recommendations } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import { parsePagination, paginate } from "@/lib/api/v1/pagination";

const VALID_STATUS = new Set([
  "pending",
  "in_progress",
  "completed",
  "dismissed",
]);
const VALID_PRIORITY = new Set(["critical", "high", "medium", "low"]);
const VALID_CATEGORY = new Set([
  "technical_seo",
  "content_optimization",
  "schema_markup",
  "citation_building",
  "brand_consistency",
  "competitor_analysis",
  "content_freshness",
  "authority_building",
]);

type RecStatus = "pending" | "in_progress" | "completed" | "dismissed";
type RecPriority = "critical" | "high" | "medium" | "low";
type RecCategory =
  | "technical_seo"
  | "content_optimization"
  | "schema_markup"
  | "citation_building"
  | "brand_consistency"
  | "competitor_analysis"
  | "content_freshness"
  | "authority_building";

export const GET = withApiErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const auth = await requireV1Auth();
    const { id: brandId } = await params;
    const qp = request.nextUrl.searchParams;
    const pagination = parsePagination(qp);

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

    const filters: SQL[] = [eq(recommendations.brandId, brandId)];

    const status = qp.get("status");
    if (status) {
      if (!VALID_STATUS.has(status)) {
        throw new ApiError("invalid_request", `Unknown status "${status}".`);
      }
      filters.push(eq(recommendations.status, status as RecStatus));
    }

    const priority = qp.get("priority");
    if (priority) {
      if (!VALID_PRIORITY.has(priority)) {
        throw new ApiError(
          "invalid_request",
          `Unknown priority "${priority}".`,
        );
      }
      filters.push(eq(recommendations.priority, priority as RecPriority));
    }

    const category = qp.get("category");
    if (category) {
      if (!VALID_CATEGORY.has(category)) {
        throw new ApiError(
          "invalid_request",
          `Unknown category "${category}".`,
        );
      }
      filters.push(eq(recommendations.category, category as RecCategory));
    }

    if (pagination.cursor) {
      filters.push(
        lt(recommendations.createdAt, new Date(pagination.cursor.ts)),
      );
    }

    const rows = await db
      .select()
      .from(recommendations)
      .where(and(...filters))
      .orderBy(desc(recommendations.createdAt), desc(recommendations.id))
      .limit(pagination.limit + 1);

    const page = paginate(rows, pagination);

    return NextResponse.json({
      data: page.data.map((r) => ({
        id: r.id,
        brand_id: r.brandId,
        audit_id: r.auditId,
        title: r.title,
        description: r.description,
        category: r.category,
        priority: r.priority,
        status: r.status,
        effort: r.effort,
        impact: r.impact,
        impact_source: r.impactSource,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      })),
      pagination: page.pagination,
    });
  },
);
