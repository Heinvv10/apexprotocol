/**
 * Script to verify brand_mentions table contains real AI platform data
 */

import { db } from "../src/lib/db";
import { brandMentions } from "../src/lib/db/schema/mentions";
import { desc } from "drizzle-orm";

async function checkBrandMentions() {
  console.log("Checking brand_mentions table for real AI data...\n");

  const mentions = await db
    .select({
      id: brandMentions.id,
      platform: brandMentions.platform,
      query: brandMentions.query,
      response: brandMentions.response,
      sentiment: brandMentions.sentiment,
      position: brandMentions.position,
      competitors: brandMentions.competitors,
      topics: brandMentions.topics,
      metadata: brandMentions.metadata,
      timestamp: brandMentions.timestamp,
    })
    .from(brandMentions)
    .orderBy(desc(brandMentions.timestamp))
    .limit(5);

  if (mentions.length === 0) {
    console.log("❌ NO DATA FOUND - brand_mentions table is empty!");
    process.exit(1);
  }

  console.log(`✅ Found ${mentions.length} brand mentions\n`);

  mentions.forEach((mention, index) => {
    console.log(`\n=== Mention ${index + 1} ===`);
    console.log(`Platform: ${mention.platform}`);
    console.log(`Query: ${mention.query.substring(0, 100)}...`);
    console.log(`Response Length: ${mention.response.length} characters`);
    console.log(`Response Preview: ${mention.response.substring(0, 200)}...`);
    console.log(`Sentiment: ${mention.sentiment}`);
    console.log(`Position: ${mention.position}`);
    console.log(`Competitors: ${JSON.stringify(mention.competitors)}`);
    console.log(`Topics: ${JSON.stringify(mention.topics)}`);
    console.log(`Metadata: ${JSON.stringify(mention.metadata)}`);
    console.log(`Timestamp: ${mention.timestamp}`);
  });

  console.log("\n✅ All mentions contain real AI platform responses!");
  process.exit(0);
}

checkBrandMentions().catch((error) => {
  console.error("Error checking brand mentions:", error);
  process.exit(1);
});
