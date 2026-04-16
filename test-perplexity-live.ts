import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runGEOMonitoringForBrand } from "@/lib/services/geo-monitor";

async function testPerplexityBrowser() {
  try {
    console.log("📍 [Test] Finding brighttech.co.za brand...");

    // Find the brighttech brand
    const brand = await db.query.brands.findFirst({
      where: (brands, { like }) => like(brands.name, "%brighttech%"),
    });

    if (!brand) {
      console.error("❌ Brand 'brighttech' not found");
      return;
    }

    console.log(`✅ Found brand: ${brand.name} (${brand.id})`);
    console.log(`   Monitoring platforms: ${JSON.stringify(brand.monitoringPlatforms)}`);

    // Check if perplexity_browser is enabled
    const platforms = (brand.monitoringPlatforms as string[]) || [];
    if (!platforms.includes("perplexity_browser")) {
      console.log("⚠️  perplexity_browser NOT in monitoring platforms, adding it...");
      platforms.push("perplexity_browser");

      // Update brand with perplexity_browser
      await db
        .update(brands)
        .set({ monitoringPlatforms: platforms })
        .where(eq(brands.id, brand.id));

      console.log("✅ Added perplexity_browser to monitoring platforms");
    } else {
      console.log("✅ perplexity_browser already enabled");
    }

    // Run monitoring
    console.log("\n🚀 [Test] Running GEO monitoring for brighttech with perplexity_browser...");
    const result = await runGEOMonitoringForBrand(brand.id);

    console.log("\n✅ Monitoring completed:");
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("❌ Test failed:", error instanceof Error ? error.message : error);
  }
}

testPerplexityBrowser().catch(console.error);
