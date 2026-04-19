/**
 * GET /api/v1/brands
 *
 * List brands in the caller's tenant. Cursor-paginated.
 *
 * Query params:
 *   - limit (1..200, default 50)
 *   - cursor (opaque)
 *   - search (optional — matches name or domain, case-insensitive)
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq, lt, or, ilike, gt, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import { parsePagination, paginate } from "@/lib/api/v1/pagination";

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const auth = await requireV1Auth();
  const params = request.nextUrl.searchParams;
  const pagination = parsePagination(params);
  const search = params.get("search")?.trim();

  const filters: SQL[] = [eq(brands.organizationId, auth.tenantId)];

  if (pagination.cursor) {
    filters.push(
      or(
        lt(brands.createdAt, new Date(pagination.cursor.ts)),
        and(
          eq(brands.createdAt, new Date(pagination.cursor.ts)),
          gt(brands.id, pagination.cursor.id),
        ),
      )!,
    );
  }

  if (search) {
    filters.push(
      or(
        ilike(brands.name, `%${search}%`),
        ilike(brands.domain, `%${search}%`),
      )!,
    );
  }

  const rows = await db
    .select({
      id: brands.id,
      name: brands.name,
      domain: brands.domain,
      industry: brands.industry,
      description: brands.description,
      logoUrl: brands.logoUrl,
      keywords: brands.keywords,
      createdAt: brands.createdAt,
      updatedAt: brands.updatedAt,
    })
    .from(brands)
    .where(and(...filters))
    .orderBy(desc(brands.createdAt), brands.id)
    .limit(pagination.limit + 1);

  const page = paginate(rows, pagination);

  return NextResponse.json({
    data: page.data.map((b) => ({
      id: b.id,
      name: b.name,
      domain: b.domain,
      industry: b.industry,
      description: b.description,
      logo_url: b.logoUrl,
      keywords: b.keywords ?? [],
      created_at: b.createdAt.toISOString(),
      updated_at: b.updatedAt.toISOString(),
    })),
    pagination: page.pagination,
  });
});
