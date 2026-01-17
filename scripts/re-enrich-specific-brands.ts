/**
 * Re-enrich specific brands to test location migration fix
 */

import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema/brands";
import { eq } from "drizzle-orm";
import { scrapeBrandFromUrl } from "../src/lib/services/brand-scraper";
import { populateLocations } from "../src/lib/services/brand-post-create";

async function reEnrichBrands() {
  const targetDomains = ["takealot.com", "velocityfibre.co.za"];

  console.log("Re-enriching specific brands to test location migration fix...\n");

  for (const domain of targetDomains) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Processing: ${domain}`);
    console.log("=".repeat(60));

    try {
      // Get brand from database
      const brand = await db.query.brands.findFirst({
        where: eq(brands.domain, domain),
      });

      if (!brand) {
        console.log(`❌ Brand not found: ${domain}`);
        continue;
      }

      console.log(`✅ Brand found: ${brand.name} (ID: ${brand.id})`);

      // Check current JSONB locations
      const existingLocations = brand.locations as any[];
      console.log(`📍 Current JSONB locations: ${existingLocations?.length || 0}`);

      if (existingLocations && existingLocations.length > 0) {
        console.log(`\n🔄 Attempting to migrate existing locations...`);

        existingLocations.forEach((loc, idx) => {
          console.log(`\n  Location ${idx + 1}:`);
          console.log(`    Type: ${loc.type || "N/A"}`);
          console.log(`    City: ${loc.city || "N/A"}`);
          console.log(`    Country: ${loc.country || "N/A"}`);
          console.log(`    Address: ${loc.address || "N/A"}`);
        });

        try {
          const migratedCount = await populateLocations(
            brand.id,
            existingLocations as Array<{
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

          if (migratedCount > 0) {
            console.log(`\n✅ Successfully migrated ${migratedCount} location(s) to table`);
          } else {
            console.log(`\n⚠️  No new locations migrated`);
            console.log(`   (Locations may already exist in table or were filtered out)`);
          }
        } catch (error) {
          console.error(`\n❌ Migration error:`, error);
        }
      } else {
        console.log(`⚠️  No locations in JSONB field to migrate`);
      }

    } catch (error) {
      console.error(`❌ Error processing ${domain}:`, error);
    }
  }

  console.log(`\n${"=".repeat(60)}\n`);
  console.log("✅ Re-enrichment complete!");
  process.exit(0);
}

reEnrichBrands().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
