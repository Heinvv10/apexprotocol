import { db } from "../src/lib/db";

async function quickCheck() {
  console.log("Connecting to database...");

  // Simple count query
  const result = await db.execute(`
    SELECT
      COUNT(*) as total_brands,
      COUNT(CASE WHEN locations IS NOT NULL AND jsonb_array_length(locations) > 0 THEN 1 END) as brands_with_location_jsonb,
      COUNT(CASE WHEN personnel IS NOT NULL AND jsonb_array_length(personnel) > 0 THEN 1 END) as brands_with_people_jsonb
    FROM brands
  `);

  const locationCount = await db.execute(`
    SELECT COUNT(DISTINCT brand_id) as brands_with_locations
    FROM brand_locations
  `);

  const peopleCount = await db.execute(`
    SELECT COUNT(DISTINCT brand_id) as brands_with_people
    FROM brand_people
  `);

  console.log("\n📊 Brand Data Summary:");
  console.log(JSON.stringify(result.rows[0], null, 2));
  console.log("\n📍 Brands with location records:");
  console.log(JSON.stringify(locationCount.rows[0], null, 2));
  console.log("\n👥 Brands with people records:");
  console.log(JSON.stringify(peopleCount.rows[0], null, 2));

  process.exit(0);
}

quickCheck().catch(console.error);
