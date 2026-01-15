import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function check() {
  // Check recent monitoring jobs
  const jobs = await sql`
    SELECT id, brand_id, status, platforms, mentions_found, started_at, completed_at
    FROM monitoring_jobs
    ORDER BY started_at DESC
    LIMIT 5
  `;

  console.log("Recent monitoring jobs:");
  jobs.forEach((j: any) => {
    console.log(`  [${j.status}] Brand: ${j.brand_id}, Mentions: ${j.mentions_found}, Platforms: ${j.platforms?.length || 0}`);
  });

  // Check for recent mentions with Gemini
  const geminiMentions = await sql`
    SELECT platform, brand_id, created_at
    FROM brand_mentions
    WHERE platform = 'gemini'
    ORDER BY created_at DESC
    LIMIT 5
  `;

  console.log("\nRecent Gemini mentions:");
  if (geminiMentions.length === 0) {
    console.log("  No Gemini mentions found yet");
  } else {
    geminiMentions.forEach((m: any) => {
      console.log(`  Brand: ${m.brand_id}, Created: ${new Date(m.created_at).toLocaleString()}`);
    });
  }
}

check().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
