import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId } from "@/lib/auth";
import { runGEOMonitoringForBrand } from "@/lib/services/geo-monitor";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema/brands";
import { eq } from "drizzle-orm";

/**
 * POST /api/monitor/run
 *
 * Manually trigger GEO monitoring for a brand.
 * This endpoint can be used for testing or on-demand monitoring.
 *
 * Body: { brandId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { brandId } = body;

    if (!brandId) {
      return NextResponse.json(
        { success: false, error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand belongs to this organization
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    if (brand.organizationId !== orgId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Run monitoring
    console.log(`[API] Running GEO monitoring for brand: ${brand.name}`);
    const result = await runGEOMonitoringForBrand(brandId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Error running GEO monitoring:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
