/**
 * API endpoint to enrich all brands with location and people data
 * POST /api/brands/enrich-all
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema/brands";
import { eq } from "drizzle-orm";
import { scrapeBrandFromUrl } from "@/lib/services/brand-scraper";
import { populateLocations } from "@/lib/services/brand-post-create";
import { getOrganizationId } from "@/lib/auth";

interface EnrichmentResult {
  brandName: string;
  domain: string;
  status: "success" | "failed" | "skipped";
  locationsFound: number;
  peopleFound: number;
  locationsMigrated: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("\n🔄 Starting Brand Enrichment\n");

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : null;

    // Get all brands (or limited number for testing)
    const allBrands = await db.query.brands.findMany({
      orderBy: (brands, { asc }) => [asc(brands.name)],
      limit: limit || undefined,
    });

    console.log(`Found ${allBrands.length} brands to enrich`);

    const results: EnrichmentResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let totalLocationsFound = 0;
    let totalPeopleFound = 0;
    let totalLocationsMigrated = 0;

    for (let i = 0; i < allBrands.length; i++) {
      const brand = allBrands[i];
      const progress = `[${i + 1}/${allBrands.length}]`;

      console.log(`\n${progress} Processing: ${brand.name} (${brand.domain || "no domain"})`);

      // Skip if no domain
      if (!brand.domain) {
        console.log(`  Skipped - no domain`);
        skippedCount++;
        results.push({
          brandName: brand.name,
          domain: brand.domain || "N/A",
          status: "skipped",
          locationsFound: 0,
          peopleFound: 0,
          locationsMigrated: 0,
          error: "No domain available",
        });
        continue;
      }

      // Check if already has data
      const hasLocations = brand.locations && Array.isArray(brand.locations) && brand.locations.length > 0;
      const hasPeople = brand.personnel && Array.isArray(brand.personnel) && brand.personnel.length > 0;

      if (hasLocations && hasPeople) {
        console.log(`  Already has data - locations: ${brand.locations.length}, people: ${brand.personnel.length}`);

        // Still migrate locations if not in table
        let locationsMigrated = 0;
        try {
          locationsMigrated = await populateLocations(
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

          if (locationsMigrated > 0) {
            console.log(`  Migrated ${locationsMigrated} location(s) to table`);
          }
        } catch (error) {
          console.error(`  Migration error:`, error);
        }

        skippedCount++;
        results.push({
          brandName: brand.name,
          domain: brand.domain,
          status: "skipped",
          locationsFound: brand.locations.length,
          peopleFound: brand.personnel.length,
          locationsMigrated,
        });
        continue;
      }

      // Scrape the brand's website
      try {
        console.log(`  Scraping https://${brand.domain}...`);

        const scrapedData = await scrapeBrandFromUrl(
          `https://${brand.domain}`,
          (progress, message) => {
            console.log(`    ${progress}% - ${message}`);
          }
        );

        const locationsFound = scrapedData.locations?.length || 0;
        const peopleFound = scrapedData.personnel?.length || 0;

        console.log(`  Found: ${locationsFound} location(s), ${peopleFound} people`);

        // Update brand with new data
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (locationsFound > 0 && !hasLocations) {
          updateData.locations = scrapedData.locations;
        }

        if (peopleFound > 0 && !hasPeople) {
          updateData.personnel = scrapedData.personnel;
        }

        // Only update if we found new data
        if (locationsFound > 0 || peopleFound > 0) {
          await db
            .update(brands)
            .set(updateData)
            .where(eq(brands.id, brand.id));

          console.log(`  Updated brand with scraped data`);
        }

        // Migrate locations to table
        let locationsMigrated = 0;
        if (locationsFound > 0) {
          try {
            locationsMigrated = await populateLocations(
              brand.id,
              scrapedData.locations as Array<{
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

            if (locationsMigrated > 0) {
              console.log(`  Migrated ${locationsMigrated} location(s) to table`);
            }
          } catch (error) {
            console.error(`  Migration error:`, error);
          }
        }

        successCount++;
        totalLocationsFound += locationsFound;
        totalPeopleFound += peopleFound;
        totalLocationsMigrated += locationsMigrated;

        results.push({
          brandName: brand.name,
          domain: brand.domain,
          status: "success",
          locationsFound,
          peopleFound,
          locationsMigrated,
        });

        // Small delay to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`  Failed: ${errorMsg}`);

        failedCount++;
        results.push({
          brandName: brand.name,
          domain: brand.domain,
          status: "failed",
          locationsFound: 0,
          peopleFound: 0,
          locationsMigrated: 0,
          error: errorMsg,
        });
      }
    }

    // Return summary
    return NextResponse.json({
      success: true,
      summary: {
        totalBrands: allBrands.length,
        successfullyEnriched: successCount,
        failed: failedCount,
        skipped: skippedCount,
        totalLocationsFound,
        totalPeopleFound,
        totalLocationsMigrated,
      },
      results,
    });
  } catch (error) {
    console.error("Enrichment error:", error);
    return NextResponse.json(
      {
        error: "Failed to enrich brands",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
