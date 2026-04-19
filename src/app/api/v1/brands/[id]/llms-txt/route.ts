/**
 * GET /api/v1/brands/:id/llms-txt
 *
 * Returns a ready-to-publish llms.txt for the brand (FR-CRE-009, 🏆).
 *
 * Response Content-Type: text/plain. Users can pipe this straight into their
 * deploy pipeline or paste into a CMS.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import {
  generateLlmsTxt,
  scaffoldFromBrand,
} from "@/lib/ai/llms-txt-generator";
import { NextResponse, type NextRequest } from "next/server";

export const GET = withApiErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const auth = await requireV1Auth();
    const { id: brandId } = await params;

    const rows = await db
      .select()
      .from(brands)
      .where(
        and(eq(brands.id, brandId), eq(brands.organizationId, auth.tenantId)),
      )
      .limit(1);
    if (rows.length === 0) {
      throw new ApiError("not_found", `Brand "${brandId}" not found.`);
    }
    const brand = rows[0];

    const input = scaffoldFromBrand({
      name: brand.name,
      description: brand.description,
      tagline: brand.tagline,
      domain: brand.domain,
    });
    const body = generateLlmsTxt(input);

    // Default to text/plain — users will curl this. ?format=json returns
    // the structured input alongside for the dashboard edit UI.
    const wantJson = request.nextUrl.searchParams.get("format") === "json";
    if (wantJson) {
      return NextResponse.json({
        data: {
          brand_id: brandId,
          input,
          body,
        },
      });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `inline; filename="llms.txt"`,
        "Cache-Control": "public, max-age=60",
      },
    });
  },
);
