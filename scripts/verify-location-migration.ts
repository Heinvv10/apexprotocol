/**
 * Verify location migration status for specific brands
 */

import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema/brands";
import { brandLocations } from "../src/lib/db/schema/locations";
import { eq } from "drizzle-orm";

async function verifyLocationMigration() {
  const targetDomains = ["takealot.com", "velocityfibre.co.za"];

  console.log("Verifying location migration status...\n");

  for (const domain of targetDomains) {
    console.log(`\nChecking ${domain}:`);

    try {
      // Get brand
      const brand = await db.query.brands.findFirst({
        where: eq(brands.domain, domain),
      });

      if (!brand) {
        console.log(`  ❌ Brand not found`);
        continue;
      }

      console.log(`  ✅ Brand ID: ${brand.id}`);
      console.log(`  Name: ${brand.name}`);

      // Check JSONB locations
      const jsonbLocations = brand.locations as any[];
      console.log(`  JSONB locations: ${jsonbLocations?.length || 0}`);

      if (jsonbLocations && jsonbLocations.length > 0) {
        jsonbLocations.forEach((loc, idx) => {
          console.log(`    ${idx + 1}. Type: ${loc.type}, City: ${loc.city || "N/A"}, Country: ${loc.country || "N/A"}, Address: ${loc.address || "N/A"}`);
        });
      }

      // Check brandLocations table
      const tableLocations = await db.query.brandLocations.findMany({
        where: eq(brandLocations.brandId, brand.id),
      });

      console.log(`  Table locations: ${tableLocations.length}`);

      if (tableLocations.length > 0) {
        tableLocations.forEach((loc, idx) => {
          console.log(`    ${idx + 1}. Type: ${loc.type}, City: ${loc.city || "N/A"}, Country: ${loc.country || "N/A"}, IsPrimary: ${loc.isPrimary}`);
        });
      }

      // Status
      if (jsonbLocations && jsonbLocations.length > 0 && tableLocations.length === 0) {
        console.log(`  ⚠️  STATUS: Locations in JSONB but NOT in table (migration needed)`);
      } else if (tableLocations.length > 0) {
        console.log(`  ✅ STATUS: Locations successfully migrated to table`);
      } else {
        console.log(`  ℹ️  STATUS: No locations found in either location`);
      }

    } catch (error) {
      console.error(`  ❌ Error checking ${domain}:`, error);
    }
  }

  console.log("\n✅ Verification complete\n");
  process.exit(0);
}

verifyLocationMigration().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
