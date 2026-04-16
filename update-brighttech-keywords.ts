import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function updateBrighttechKeywords() {
  try {
    console.log("📍 [Setup] Updating Brighttech keywords...");

    const keywords = [
      "SaaS development",
      "AI automation",
      "WhatsApp automation",
      "GEO optimization",
      "SEO optimization",
      "custom software engineering",
      "cloud platforms",
      "digital solutions",
      "web application development",
      "intelligent automation",
      "digital marketing services",
      "enterprise software",
      "South African tech companies",
    ];

    // Find the brand
    const brand = await db.query.brands.findFirst({
      where: (brands, { eq }) => eq(brands.domain, "brighttech.co.za"),
    });

    if (!brand) {
      console.error("❌ Brand not found: brighttech.co.za");
      return;
    }

    // Update GEO keywords (used by monitoring system)
    await db
      .update(brands)
      .set({
        geoKeywords: keywords,
        keywords, // Also set general keywords
        updatedAt: new Date(),
      })
      .where(eq(brands.id, brand.id));

    console.log(`✅ Updated keywords for ${brand.name}`);
    console.log(`   Keywords (${keywords.length}):`);
    keywords.forEach(k => console.log(`      • ${k}`));

    // Verify update
    const updated = await db.query.brands.findFirst({
      where: (brands, { eq }) => eq(brands.id, brand.id),
    });

    console.log(`\n✨ Keywords saved: ${JSON.stringify(updated?.keywords)}`);

  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    console.error(error);
    process.exit(1);
  }
}

updateBrighttechKeywords().then(() => {
  console.log("\n✅ Done!");
  process.exit(0);
});
