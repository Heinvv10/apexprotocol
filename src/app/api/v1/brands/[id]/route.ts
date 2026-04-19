/**
 * GET /api/v1/brands/:id
 *
 * Fetch a single brand. RLS enforces tenant scoping — we also double-check at
 * the app layer for defence in depth.
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
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
      .select()
      .from(brands)
      .where(and(eq(brands.id, id), eq(brands.organizationId, auth.tenantId)))
      .limit(1);

    const brand = rows[0];
    if (!brand) {
      throw new ApiError("not_found", `Brand "${id}" not found.`);
    }

    return NextResponse.json({
      data: {
        id: brand.id,
        name: brand.name,
        domain: brand.domain,
        tagline: brand.tagline,
        industry: brand.industry,
        description: brand.description,
        logo_url: brand.logoUrl,
        keywords: brand.keywords ?? [],
        seo_keywords: brand.seoKeywords ?? [],
        geo_keywords: brand.geoKeywords ?? [],
        competitors: brand.competitors ?? [],
        locations: brand.locations ?? [],
        personnel: brand.personnel ?? [],
        value_propositions: brand.valuePropositions ?? [],
        social_links: brand.socialLinks ?? {},
        created_at: brand.createdAt.toISOString(),
        updated_at: brand.updatedAt.toISOString(),
      },
    });
  },
);
