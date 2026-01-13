/**
 * Check AI Insights database records
 */
import { db } from "../src/lib/db";
import { platformQueries, platformInsights, citationRecords } from "../src/lib/db/schema";
import { desc } from "drizzle-orm";

async function main() {
  console.log("=== Platform Queries ===");
  const queries = await db.select().from(platformQueries).orderBy(desc(platformQueries.createdAt)).limit(3);
  console.log(JSON.stringify(queries, null, 2));

  console.log("\n=== Platform Insights ===");
  const insights = await db.select().from(platformInsights).orderBy(desc(platformInsights.createdAt)).limit(3);
  console.log(JSON.stringify(insights, null, 2));

  console.log("\n=== Citation Records ===");
  const citations = await db.select().from(citationRecords).orderBy(desc(citationRecords.createdAt)).limit(3);
  console.log(JSON.stringify(citations, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
