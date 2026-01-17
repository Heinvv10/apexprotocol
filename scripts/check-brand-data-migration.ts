import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema/brands";
import { brandLocations } from "../src/lib/db/schema/locations";
import { brandPeople } from "../src/lib/db/schema/people";
import { eq } from "drizzle-orm";

async function checkBrandDataMigration() {
  try {
    console.log("\n🔍 Checking Brand Data Migration Status\n");
    console.log("=".repeat(80));

    // Get all brands
    const allBrands = await db.query.brands.findMany({
      orderBy: (brands, { desc }) => [desc(brands.createdAt)],
    });

    console.log(`\n📊 Total Brands: ${allBrands.length}\n`);

    // Statistics
    let brandsWithLocationJSONB = 0;
    let brandsWithLocationRecords = 0;
    let brandsWithPeopleJSONB = 0;
    let brandsWithPeopleRecords = 0;
    let totalLocationRecords = 0;
    let totalPeopleRecords = 0;

    // Sample details for first 10 brands
    console.log("📋 Sample Brand Details (First 10):\n");

    for (let i = 0; i < Math.min(10, allBrands.length); i++) {
      const brand = allBrands[i];

      // Check JSONB fields
      const hasLocationJSONB = brand.locations && Array.isArray(brand.locations) && brand.locations.length > 0;
      const hasPeopleJSONB = brand.personnel && Array.isArray(brand.personnel) && brand.personnel.length > 0;

      // Check relational tables
      const locationRecords = await db.query.brandLocations.findMany({
        where: eq(brandLocations.brandId, brand.id),
      });

      const peopleRecords = await db.query.brandPeople.findMany({
        where: eq(brandPeople.brandId, brand.id),
      });

      console.log(`${i + 1}. ${brand.name} (${brand.domain})`);
      console.log(`   Created: ${brand.createdAt?.toISOString().split('T')[0] || 'N/A'}`);
      console.log(`   Locations JSONB: ${hasLocationJSONB ? (brand.locations as any[]).length : 0} | Table: ${locationRecords.length}`);
      console.log(`   People JSONB: ${hasPeopleJSONB ? (brand.personnel as any[]).length : 0} | Table: ${peopleRecords.length}`);
      console.log("");

      if (hasLocationJSONB) brandsWithLocationJSONB++;
      if (locationRecords.length > 0) brandsWithLocationRecords++;
      if (hasPeopleJSONB) brandsWithPeopleJSONB++;
      if (peopleRecords.length > 0) brandsWithPeopleRecords++;
    }

    // Count all records
    console.log("🔢 Counting All Records...\n");

    for (const brand of allBrands) {
      const hasLocationJSONB = brand.locations && Array.isArray(brand.locations) && brand.locations.length > 0;
      const hasPeopleJSONB = brand.personnel && Array.isArray(brand.personnel) && brand.personnel.length > 0;

      if (hasLocationJSONB) brandsWithLocationJSONB++;
      if (hasPeopleJSONB) brandsWithPeopleJSONB++;

      const locationRecords = await db.query.brandLocations.findMany({
        where: eq(brandLocations.brandId, brand.id),
      });

      const peopleRecords = await db.query.brandPeople.findMany({
        where: eq(brandPeople.brandId, brand.id),
      });

      if (locationRecords.length > 0) brandsWithLocationRecords++;
      if (peopleRecords.length > 0) brandsWithPeopleRecords++;

      totalLocationRecords += locationRecords.length;
      totalPeopleRecords += peopleRecords.length;
    }

    // Summary
    console.log("=".repeat(80));
    console.log("\n📈 MIGRATION SUMMARY\n");
    console.log("Locations:");
    console.log(`  Brands with location data in JSONB: ${brandsWithLocationJSONB}/${allBrands.length} (${((brandsWithLocationJSONB/allBrands.length)*100).toFixed(1)}%)`);
    console.log(`  Brands with location records in table: ${brandsWithLocationRecords}/${allBrands.length} (${((brandsWithLocationRecords/allBrands.length)*100).toFixed(1)}%)`);
    console.log(`  Total location records: ${totalLocationRecords}`);
    console.log("");
    console.log("People:");
    console.log(`  Brands with people data in JSONB: ${brandsWithPeopleJSONB}/${allBrands.length} (${((brandsWithPeopleJSONB/allBrands.length)*100).toFixed(1)}%)`);
    console.log(`  Brands with people records in table: ${brandsWithPeopleRecords}/${allBrands.length} (${((brandsWithPeopleRecords/allBrands.length)*100).toFixed(1)}%)`);
    console.log(`  Total people records: ${totalPeopleRecords}`);
    console.log("");

    // Migration gap analysis
    const locationMigrationGap = brandsWithLocationJSONB - brandsWithLocationRecords;
    const peopleMigrationGap = brandsWithPeopleJSONB - brandsWithPeopleRecords;

    if (locationMigrationGap > 0 || peopleMigrationGap > 0) {
      console.log("⚠️  MIGRATION GAPS DETECTED\n");
      if (locationMigrationGap > 0) {
        console.log(`  ${locationMigrationGap} brands have location JSONB data but no table records`);
      }
      if (peopleMigrationGap > 0) {
        console.log(`  ${peopleMigrationGap} brands have people JSONB data but no table records`);
      }
      console.log("\n💡 These brands were created before the migration logic was implemented.");
      console.log("   Run the backfill migration script to populate their records.");
    } else {
      console.log("✅ No migration gaps detected - all JSONB data has been migrated!");
    }

    console.log("\n" + "=".repeat(80) + "\n");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

checkBrandDataMigration();
