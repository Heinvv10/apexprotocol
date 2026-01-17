/**
 * Enrich brands that are missing location/personnel data
 */
import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema/brands";
import { isNull, or, sql } from "drizzle-orm";
import { scrapeMultiPageBrand } from "../src/lib/services/brand-scraper-multipage";
import { populateLocations } from "../src/lib/services/brand-post-create";

async function enrichMissingBrands() {
  console.log("=== Enriching Missing Brands ===\n");

  // Find brands without location data (excluding test domains)
  const missingBrands = await db
    .select({
      id: brands.id,
      name: brands.name,
      domain: brands.domain,
    })
    .from(brands)
    .where(
      sql`(locations IS NULL OR jsonb_array_length(locations) = 0)
          AND domain IS NOT NULL
          AND domain NOT LIKE '%test%'
          AND domain NOT LIKE '%.io'
          AND name NOT LIKE 'Temp %'`
    );

  console.log(`Found ${missingBrands.length} brands needing enrichment:\n`);
  missingBrands.forEach((b) => console.log(`  - ${b.name} (${b.domain})`));
  console.log("");

  let successCount = 0;
  let failedCount = 0;

  for (const brand of missingBrands) {
    if (!brand.domain) continue;

    console.log(`\n🔄 Processing: ${brand.name} (${brand.domain})`);

    try {
      // Scrape the brand website
      const url = `https://${brand.domain}`;
      const scraped = await scrapeMultiPageBrand(url);

      if (!scraped) {
        console.log(`  ❌ Failed to scrape`);
        failedCount++;
        continue;
      }

      // Update brand with scraped data
      const updateData: any = {};
      if (scraped.locations?.length) {
        updateData.locations = scraped.locations;
      }
      if (scraped.personnel?.length) {
        updateData.personnel = scraped.personnel;
      }
      if (scraped.description) {
        updateData.description = scraped.description;
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(brands).set(updateData).where(sql`id = ${brand.id}`);
        console.log(
          `  ✅ Updated: ${scraped.locations?.length || 0} locations, ${scraped.personnel?.length || 0} people`
        );

        // Migrate locations to table
        if (scraped.locations?.length) {
          const migrated = await populateLocations(brand.id, scraped.locations);
          console.log(`  📍 Migrated ${migrated} locations to table`);
        }

        successCount++;
      } else {
        console.log(`  ⏭️ No new data found`);
        failedCount++;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ Error: ${msg}`);
      failedCount++;
    }
  }

  console.log("\n=== Enrichment Complete ===");
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failedCount}`);

  process.exit(0);
}

enrichMissingBrands().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
