import { db } from "@/lib/db";

async function listBrands() {
  try {
    const allBrands = await db.query.brands.findMany({
      limit: 20,
    });

    console.log(`Found ${allBrands.length} brands:\n`);
    allBrands.forEach((brand, i) => {
      console.log(`${i + 1}. ${brand.name}`);
      console.log(`   ID: ${brand.id}`);
      console.log(`   Domain: ${brand.domain}`);
      console.log(``);
    });

  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
  }
}

listBrands().catch(console.error);
