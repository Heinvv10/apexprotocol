/**
 * Engine Room Data Collection API
 *
 * Manually triggers AI platform queries to populate brand_mentions table.
 * This endpoint can be called:
 * - After brand creation (via background job)
 * - Manually by user (via UI button)
 * - By cron job (scheduled monitoring)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/supabase-server";
import { runGEOMonitoringForBrand } from "@/lib/services/geo-monitor";
import { logger } from "@/lib/logger";

// Validation schema
const requestSchema = z.object({
  brandId: z.string().min(1, "Brand ID is required"),
});

/**
 * POST /api/engine-room/collect
 * Triggers Engine Room data collection for a specific brand
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

    // Parse request body
    const body = await request.json();
    const { brandId } = requestSchema.parse(body);

    logger.info(`[Engine Room] Starting data collection for brand: ${brandId}`);

    // Run GEO monitoring (which now includes real AI platform queries)
    const result = await runGEOMonitoringForBrand(brandId);

    if (result.errors.length > 0) {
      console.warn(`[Engine Room] Completed with errors:`, result.errors);
    }

    return NextResponse.json({
      success: true,
      data: {
        brandId: result.brandId,
        brandName: result.brandName,
        platformsQueried: result.platformsQueried,
        mentionsCollected: result.mentionsCollected,
        errors: result.errors,
      },
      message: `Collected ${result.mentionsCollected} mentions across ${result.platformsQueried} platform queries`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Engine Room] Collection error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
