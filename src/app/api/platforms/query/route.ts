import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema/brands";
import { eq } from "drizzle-orm";
import { queryAllPlatforms } from "@/lib/monitoring/multi-platform-query";

/**
 * Query all platforms for a brand
 *
 * POST /api/platforms/query
 *
 * Request body:
 * {
 *   "brandId": "brand_id",
 *   "query": "search query",
 *   "brandContext": "optional brand context"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { brandId, query, brandContext } = await request.json();

    if (!brandId || !query) {
      return NextResponse.json(
        { error: "Missing required fields: brandId, query" },
        { status: 400 }
      );
    }

    // Verify user has access to this brand
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // Execute multi-platform query
    const results = await queryAllPlatforms(
      brandId,
      query,
      brandContext
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Platform query error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Query failed",
      },
      { status: 500 }
    );
  }
}
