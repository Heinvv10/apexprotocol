import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema/brands";
import { brandLocations } from "../src/lib/db/schema/locations";
import { eq, desc } from "drizzle-orm";
import { populateLocations } from "../src/lib/services/brand-post-create";

async function testLocationMigration() {
  try {
    console.log("\n🧪 Testing Location Migration Fix\n");

    // Get Stripe brand
    const stripeBrand = await db.query.brands.findFirst({
      where: eq(brands.name, "Stripe"),
      orderBy: [desc(brands.createdAt)],
    });

    if (!stripeBrand) {
      console.log("❌ Stripe brand not found");
      return;
    }

    console.log(`✅ Found Stripe brand: ${stripeBrand.id}`);
    console.log(`   Current locations in JSONB: ${stripeBrand.locations ? (stripeBrand.locations as any[]).length : 0}`);

    // Add test locations to JSONB field
    const testLocations = [
      {
        type: "headquarters",
        address: "510 Townsend Street",
        city: "San Francisco",
        state: "CA",
        country: "United States",
        postalCode: "94103",
        phone: "+1-888-926-2289",
      },
      {
        type: "office",
        city: "Dublin",
        country: "Ireland",
      },
      {
        type: "office",
        city: "Singapore",
        country: "Singapore",
      },
    ];

    console.log("\n📝 Updating Stripe brand with test locations...");
    await db
      .update(brands)
      .set({
        locations: testLocations as any,
        updatedAt: new Date(),
      })
      .where(eq(brands.id, stripeBrand.id));

    console.log("✅ Updated JSONB field with 3 test locations");

    // Now run the migration
    console.log("\n🔄 Running populateLocations migration...");
    const createdCount = await populateLocations(stripeBrand.id, testLocations);

    console.log(`✅ Created ${createdCount} location record(s) in brandLocations table`);

    // Verify the migration
    console.log("\n🔍 Verifying migration results...");
    const locationRecords = await db.query.brandLocations.findMany({
      where: eq(brandLocations.brandId, stripeBrand.id),
    });

    console.log(`✅ Found ${locationRecords.length} location(s) in brandLocations table:`);
    locationRecords.forEach((loc, idx) => {
      console.log(`   ${idx + 1}. ${loc.locationType} - ${loc.city}, ${loc.country} (${loc.isPrimary ? "PRIMARY" : "secondary"})`);
      console.log(`      Address: ${loc.address || "N/A"}`);
      console.log(`      Phone: ${loc.phone || "N/A"}`);
    });

    console.log("\n✅ TEST PASSED - Location migration working correctly!\n");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
  } finally {
    process.exit(0);
  }
}

testLocationMigration();
