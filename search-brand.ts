import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { like } from "drizzle-orm";

async function searchBrand(query: string) {
  try {
    const results = await db
      .select()
      .from(brands)
      .where(like(brands.name, `%${query}%`));

    if (results.length === 0) {
      console.log(`No brands matching "${query}"`);
      return;
    }

    console.log(`Found ${results.length} brand(s) matching "${query}":\n`);
    results.forEach((brand) => {
      console.log(`Name: ${brand.name}`);
      console.log(`ID: ${brand.id}`);
      console.log(`Domain: ${brand.domain}`);
      console.log(`Monitoring Platforms: ${JSON.stringify(brand.monitoringPlatforms)}`);
      console.log(``);
    });

  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
  }
}

searchBrand("brighttech").catch(console.error);
