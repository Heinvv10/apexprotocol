/**
 * Check brand locations in database
 */

import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema/brands";
import { brandLocations } from "../src/lib/db/schema/locations";
import { eq } from "drizzle-orm";

async function checkBrandLocations() {
  const brandNames = ["Takealot.com", "Velocity Fibre"];

  for (const brandName of brandNames) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Checking: ${brandName}`);
    console.log("=".repeat(60));

    // Get brand from database
    const brand = await db.query.brands.findFirst({
      where: eq(brands.name, brandName),
    });

    if (!brand) {
      console.log(`❌ Brand not found: ${brandName}`);
      continue;
    }

    console.log(`\n✅ Brand found:`);
    console.log(`  ID: ${brand.id}`);
    console.log(`  Domain: ${brand.domain}`);
    console.log(`  Last Enriched: ${brand.lastEnrichedAt}`);

    // Check JSONB locations field
    console.log(`\n📍 Locations in JSONB field:`);
    if (brand.locations && Array.isArray(brand.locations)) {
      console.log(`  Count: ${brand.locations.length}`);
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
    } else {
      console.log(`  Count: 0 (empty or null)`);
    }

    // Check brandLocations table
    console.log(`\n🏢 Locations in brandLocations table:`);
    const locations = await db.query.brandLocations.findMany({
      where: eq(brandLocations.brandId, brand.id),
    });

    if (locations.length > 0) {
      console.log(`  Count: ${locations.length}`);
      locations.forEach((loc, idx) => {
        console.log(`\n  Location ${idx + 1}:`);
        console.log(`    ID: ${loc.id}`);
        console.log(`    Type: ${loc.type}`);
        console.log(`    City: ${loc.city || "N/A"}`);
        console.log(`    State: ${loc.state || "N/A"}`);
        console.log(`    Country: ${loc.country || "N/A"}`);
        console.log(`    Address: ${loc.address || "N/A"}`);
        console.log(`    Is Primary: ${loc.isPrimary}`);
        console.log(`    Created At: ${loc.createdAt}`);
      });
    } else {
      console.log(`  Count: 0 (no records in table)`);
    }
  }

  console.log(`\n${"=".repeat(60)}\n`);
  process.exit(0);
}

checkBrandLocations().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
