/**
 * API endpoint to manually trigger backfill migration for existing brands
 * POST /api/brands/backfill-migration
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema/brands";
import { populateLocations } from "@/lib/services/brand-post-create";
import { getOrganizationId } from "@/lib/auth/supabase-server";
import { logger } from "@/lib/logger";

export async function POST(_request: NextRequest) {
  try {
    // Verify authentication
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("\n🔄 Starting Backfill Migration\n");

    // Get all brands
    const allBrands = await db.query.brands.findMany({
      orderBy: (brands, { desc }) => [desc(brands.createdAt)],
    });

    logger.info(`Found ${allBrands.length} brands to check`);

    let locationsBackfilled = 0;
    let totalLocationRecords = 0;
    const errors: string[] = [];
    const results: Array<{ brandName: string; locationsMigrated: number; error?: string }> = [];

    for (const brand of allBrands) {
      // Backfill locations
      if (brand.locations && Array.isArray(brand.locations) && brand.locations.length > 0) {
        try {
          const count = await populateLocations(
            brand.id,
            brand.locations as Array<{
              type: string;
              address?: string;
              city?: string;
              state?: string;
              country?: string;
              postalCode?: string;
              phone?: string;
              email?: string;
            }>
          );

          if (count > 0) {
            locationsBackfilled++;
            totalLocationRecords += count;
            results.push({
              brandName: brand.name,
              locationsMigrated: count,
            });
            logger.info(`✅ ${brand.name}: Migrated ${count} location(s)`);
          } else {
            results.push({
              brandName: brand.name,
              locationsMigrated: 0,
            });
            logger.info(`ℹ️  ${brand.name}: Locations already migrated`);
          }
        } catch (error) {
          const errorMsg = `Failed to migrate locations for ${brand.name}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          results.push({
            brandName: brand.name,
            locationsMigrated: 0,
            error: errorMsg,
          });
          console.error(`❌ ${errorMsg}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalBrands: allBrands.length,
        brandsWithLocationsMigrated: locationsBackfilled,
        totalLocationRecords: totalLocationRecords,
        errors: errors.length,
      },
      results,
      errors,
    });
  } catch (error) {
    console.error("Backfill migration error:", error);
    return NextResponse.json(
      {
        error: "Failed to run backfill migration",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
