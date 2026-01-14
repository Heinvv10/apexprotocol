/**
 * Seed script for GEO Knowledge Base
 * Run with: npx tsx scripts/seed-geo.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { seedKnowledgeBase, needsSeeding } from "../src/lib/geo/seed-knowledge-base";

async function main() {
  console.log("🌱 GEO Knowledge Base Seeder");
  console.log("============================\n");

  console.log("Checking if seeding is needed...");
  const needs = await needsSeeding();

  if (!needs) {
    console.log("✅ Knowledge base already seeded. Skipping.");
    process.exit(0);
  }

  console.log("Running seed...\n");
  const result = await seedKnowledgeBase();

  console.log("\n============================");
  console.log("📊 Seed Results:");
  console.log(`   Best Practices: ${result.bestPractices.inserted} inserted, ${result.bestPractices.errors} errors`);
  console.log(`   Schema Templates: ${result.schemaTemplates.inserted} inserted, ${result.schemaTemplates.errors} errors`);
  console.log("============================\n");

  const totalErrors = result.bestPractices.errors + result.schemaTemplates.errors;
  if (totalErrors > 0) {
    console.log(`⚠️  Completed with ${totalErrors} errors`);
    process.exit(1);
  }

  console.log("✅ Knowledge base seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
