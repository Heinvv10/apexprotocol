/**
 * Enrich all brands with location and people data
 * Scrapes each brand's website to extract missing location and personnel information
 */

import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema/brands";
import { eq } from "drizzle-orm";
import { scrapeBrandFromUrl } from "../src/lib/services/brand-scraper";
import { populateLocations } from "../src/lib/services/brand-post-create";

interface EnrichmentResult {
  brandName: string;
  domain: string;
  status: "success" | "failed" | "skipped";
  locationsFound: number;
  peopleFound: number;
  locationsMigrated: number;
  error?: string;
}

async function enrichAllBrands() {
  console.log("\n🔄 Starting Brand Enrichment for All Brands\n");
  console.log("=".repeat(80));

  try {
    // Get all brands
    const allBrands = await db.query.brands.findMany({
      orderBy: (brands, { asc }) => [asc(brands.name)],
    });

    console.log(`\n📊 Found ${allBrands.length} brands to enrich\n`);

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
        console.log(`  ⏭️  Skipped - no domain`);
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
        console.log(`  ✅ Already has data - locations: ${brand.locations.length}, people: ${brand.personnel.length}`);

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
            console.log(`  📍 Migrated ${locationsMigrated} location(s) to table`);
          }
        } catch (error) {
          console.error(`  ❌ Migration error:`, error);
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
        console.log(`  🌐 Scraping https://${brand.domain}...`);

        const scrapedData = await scrapeBrandFromUrl(
          `https://${brand.domain}`,
          (progress, message) => {
            console.log(`     ${progress}% - ${message}`);
          }
        );

        const locationsFound = scrapedData.locations?.length || 0;
        const peopleFound = scrapedData.personnel?.length || 0;

        console.log(`  📊 Found: ${locationsFound} location(s), ${peopleFound} people`);

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

          console.log(`  ✅ Updated brand with scraped data`);
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
              console.log(`  📍 Migrated ${locationsMigrated} location(s) to table`);
            }
          } catch (error) {
            console.error(`  ❌ Migration error:`, error);
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
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`  ❌ Failed: ${errorMsg}`);

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

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("\n📈 ENRICHMENT SUMMARY\n");
    console.log(`Total Brands: ${allBrands.length}`);
    console.log(`✅ Successfully Enriched: ${successCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`⏭️  Skipped (already has data or no domain): ${skippedCount}`);
    console.log("");
    console.log(`📍 Total Locations Found: ${totalLocationsFound}`);
    console.log(`👥 Total People Found: ${totalPeopleFound}`);
    console.log(`🗄️  Total Locations Migrated to Table: ${totalLocationsMigrated}`);
    console.log("");

    // Top brands with most data
    const topBrands = results
      .filter(r => r.status === "success" && (r.locationsFound > 0 || r.peopleFound > 0))
      .sort((a, b) => (b.locationsFound + b.peopleFound) - (a.locationsFound + a.peopleFound))
      .slice(0, 10);

    if (topBrands.length > 0) {
      console.log("🏆 Top Brands with Most Data:\n");
      topBrands.forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.brandName}: ${r.locationsFound} locations, ${r.peopleFound} people`);
      });
      console.log("");
    }

    // Failed brands
    const failedBrands = results.filter(r => r.status === "failed");
    if (failedBrands.length > 0) {
      console.log("❌ Failed Brands:\n");
      failedBrands.slice(0, 10).forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.brandName} (${r.domain}): ${r.error}`);
      });
      if (failedBrands.length > 10) {
        console.log(`  ...and ${failedBrands.length - 10} more`);
      }
      console.log("");
    }

    console.log("=".repeat(80) + "\n");

  } catch (error) {
    console.error("\n❌ Fatal error:", error);
  } finally {
    process.exit(0);
  }
}

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\n\n⚠️  Enrichment interrupted by user. Exiting...\n");
  process.exit(0);
});

enrichAllBrands();
