import { db } from '../src/lib/db';

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });
import { brands } from "../src/lib/db/schema/brands";
import { brandMentions } from "../src/lib/db/schema/mentions";
import { competitorMentions, shareOfVoice, competitorSnapshots } from "../src/lib/db/schema/competitive";
import { brandPeople, peopleAiMentions } from "../src/lib/db/schema/people";
import { eq } from "drizzle-orm";
async function deleteFakeData() {
  console.log("🗑️  Deleting all fake data for VEA Group...\n");

  const veaBrands = await db.select().from(brands).where(eq(brands.name, "VEA Group"));
  if (veaBrands.length === 0) {
    console.log("No VEA Group brand found");
    process.exit(0);
  }
  const brandId = veaBrands[0].id;

  // Delete people AI mentions first (foreign key)
  const deletedPeopleMentions = await db.delete(peopleAiMentions)
    .where(eq(peopleAiMentions.brandId, brandId));
  console.log("✅ Deleted people AI mentions");

  // Delete people
  const deletedPeople = await db.delete(brandPeople)
    .where(eq(brandPeople.brandId, brandId));
  console.log("✅ Deleted fake leadership/people entries");

  // Delete brand mentions
  const deletedBrandMentions = await db.delete(brandMentions)
    .where(eq(brandMentions.brandId, brandId));
  console.log("✅ Deleted fake brand mentions");

  // Delete competitor mentions
  const deletedCompMentions = await db.delete(competitorMentions)
    .where(eq(competitorMentions.brandId, brandId));
  console.log("✅ Deleted fake competitor mentions");

  // Delete share of voice
  const deletedSOV = await db.delete(shareOfVoice)
    .where(eq(shareOfVoice.brandId, brandId));
  console.log("✅ Deleted fake share of voice data");

  // Delete competitor snapshots
  const deletedSnapshots = await db.delete(competitorSnapshots)
    .where(eq(competitorSnapshots.brandId, brandId));
  console.log("✅ Deleted fake competitor snapshots");

  console.log("\n✅ All fake data deleted successfully");
  console.log("VEA Group brand still exists with real scraped data (company info, social links, value props)");

  process.exit(0);
}

deleteFakeData().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
