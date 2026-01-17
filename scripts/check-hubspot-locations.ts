import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema/brands";
import { brandLocations } from "../src/lib/db/schema/locations";
import { eq, desc } from "drizzle-orm";

async function checkHubSpotLocations() {
  try {
    // Get the most recently created HubSpot brand
    const hubspotBrand = await db.query.brands.findFirst({
      where: eq(brands.name, "HubSpot"),
      orderBy: [desc(brands.createdAt)],
    });

    if (!hubspotBrand) {
      console.log("❌ HubSpot brand not found");
      return;
    }

    console.log("\n✅ Found HubSpot brand:");
    console.log(`  ID: ${hubspotBrand.id}`);
    console.log(`  Created: ${hubspotBrand.createdAt}`);
    console.log(`  Domain: ${hubspotBrand.domain}`);

    // Check locations JSONB field
    console.log("\n📦 Locations JSONB field:");
    if (hubspotBrand.locations && Array.isArray(hubspotBrand.locations)) {
      console.log(`  Found ${hubspotBrand.locations.length} location(s) in JSONB:`);
      hubspotBrand.locations.forEach((loc: any, idx: number) => {
        console.log(`  ${idx + 1}. ${loc.type || "unknown"} - ${loc.city || loc.address || "no city/address"}, ${loc.country || "no country"}`);
      });
    } else {
      console.log("  ❌ No locations in JSONB field");
    }

    // Check brandLocations table
    console.log("\n🗄️  Brand Locations table:");
    const locationRecords = await db.query.brandLocations.findMany({
      where: eq(brandLocations.brandId, hubspotBrand.id),
    });

    if (locationRecords.length > 0) {
      console.log(`  Found ${locationRecords.length} location record(s):`);
      locationRecords.forEach((loc, idx) => {
        console.log(`  ${idx + 1}. ${loc.locationType} - ${loc.city || "no city"}, ${loc.country || "no country"} (${loc.isPrimary ? "PRIMARY" : "secondary"})`);
      });
    } else {
      console.log("  ❌ No records in brandLocations table");
    }

    console.log("\n");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkHubSpotLocations();
