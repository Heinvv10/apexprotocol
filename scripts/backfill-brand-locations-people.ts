/**
 * Backfill script to migrate locations and people from JSONB fields to relational tables
 * for brands created before the migration logic was implemented.
 */

import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema/brands";
import { populateLocations } from "../src/lib/services/brand-post-create";
import { discoverManagementPeople } from "../src/lib/services/people-discovery";

async function backfillBrandData() {
  console.log("\n🔄 Starting Backfill Migration for Existing Brands\n");
  console.log("=".repeat(80));

  try {
    // Get all brands
    const allBrands = await db.query.brands.findMany({
      orderBy: (brands, { desc }) => [desc(brands.createdAt)],
    });

    console.log(`\n📊 Found ${allBrands.length} brands to check\n`);

    let locationsBackfilled = 0;
    let peopleBackfilled = 0;
    let totalLocationRecords = 0;
    let totalPeopleRecords = 0;
    let errors: string[] = [];

    for (const brand of allBrands) {
      console.log(`\nProcessing: ${brand.name} (${brand.domain || 'no domain'})`);

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
            console.log(`  ✅ Migrated ${count} location(s)`);
          } else {
            console.log(`  ℹ️  Locations already migrated`);
          }
        } catch (error) {
          const errorMsg = `Failed to migrate locations for ${brand.name}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`  ❌ ${errorMsg}`);
        }
      } else {
        console.log(`  ⏭️  No locations in JSONB field`);
      }

      // Backfill people from personnel JSONB
      if (brand.personnel && Array.isArray(brand.personnel) && brand.personnel.length > 0) {
        try {
          // For now, just log - people migration would need additional logic
          console.log(`  ℹ️  ${brand.personnel.length} people in JSONB (migration TODO)`);
        } catch (error) {
          const errorMsg = `Failed to check people for ${brand.name}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`  ❌ ${errorMsg}`);
        }
      }
    }

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("\n📈 BACKFILL SUMMARY\n");
    console.log(`✅ Brands with locations backfilled: ${locationsBackfilled}`);
    console.log(`📍 Total location records created: ${totalLocationRecords}`);
    console.log(`\n⚠️  Errors encountered: ${errors.length}`);

    if (errors.length > 0) {
      console.log("\nError details:");
      errors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
    }

    console.log("\n" + "=".repeat(80) + "\n");

  } catch (error) {
    console.error("\n❌ Fatal error:", error);
  } finally {
    process.exit(0);
  }
}

backfillBrandData();
