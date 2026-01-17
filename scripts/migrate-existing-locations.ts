/**
 * Migrate existing locations from JSONB field to brandLocations table
 * for brands that have locations in the JSONB field but not in the table
 */

import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema/brands";
import { eq } from "drizzle-orm";
import { populateLocations } from "../src/lib/services/brand-post-create";

async function migrateExistingLocations() {
  const targetDomains = ["takealot.com", "velocityfibre.co.za"];

  console.log("Starting location migration for brands with existing JSONB data...\n");

  for (const domain of targetDomains) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Processing: ${domain}`);
    console.log("=".repeat(60));

    // Get brand from database
    const brand = await db.query.brands.findFirst({
      where: eq(brands.domain, domain),
    });

    if (!brand) {
      console.log(`❌ Brand not found: ${domain}`);
      continue;
    }

    console.log(`✅ Brand found: ${brand.name} (ID: ${brand.id})`);

    // Check if brand has locations in JSONB field
    if (!brand.locations || !Array.isArray(brand.locations) || brand.locations.length === 0) {
      console.log(`⚠️  No locations in JSONB field, skipping`);
      continue;
    }

    console.log(`📍 Found ${brand.locations.length} location(s) in JSONB field`);

    // Display locations
    brand.locations.forEach((loc: any, idx: number) => {
      console.log(`\n  Location ${idx + 1}:`);
      console.log(`    Type: ${loc.type || "N/A"}`);
      console.log(`    City: ${loc.city || "N/A"}`);
      console.log(`    State: ${loc.state || "N/A"}`);
      console.log(`    Country: ${loc.country || "N/A"}`);
      console.log(`    Address: ${loc.address || "N/A"}`);
      console.log(`    Phone: ${loc.phone || "N/A"}`);
      console.log(`    Email: ${loc.email || "N/A"}`);
    });

    // Migrate locations using the fixed populateLocations function
    console.log(`\n🔄 Attempting migration...`);
    try {
      const migratedCount = await populateLocations(
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

      if (migratedCount > 0) {
        console.log(`✅ Successfully migrated ${migratedCount} location(s) to table`);
      } else {
        console.log(`⚠️  No new locations migrated (may already exist in table)`);
      }
    } catch (error) {
      console.error(`❌ Migration error:`, error);
    }
  }

  console.log(`\n${"=".repeat(60)}\n`);
  console.log("✅ Migration complete!");
  process.exit(0);
}

migrateExistingLocations().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
