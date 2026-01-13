/**
 * Create AI Insights tables directly via SQL
 * This bypasses the drizzle-kit interactive prompt
 */
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function createTables() {
  console.log("Creating AI Insights tables...");

  try {
    // First check if citation_type enum exists
    const enumExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'citation_type'
      ) as exists
    `);

    if (!enumExists.rows[0]?.exists) {
      console.log("Creating citation_type enum...");
      await db.execute(sql`
        CREATE TYPE citation_type AS ENUM ('direct_quote', 'paraphrase', 'link', 'reference')
      `);
      console.log("✓ citation_type enum created");
    } else {
      console.log("✓ citation_type enum already exists");
    }

    // Check if platform_queries table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'platform_queries'
      ) as exists
    `);

    if (!tableExists.rows[0]?.exists) {
      console.log("Creating platform_queries table...");
      await db.execute(sql`
        CREATE TABLE platform_queries (
          id TEXT PRIMARY KEY,
          brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          query_text TEXT NOT NULL,
          brand_context TEXT,
          platforms JSONB DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ
        )
      `);
      console.log("✓ platform_queries table created");
    } else {
      console.log("✓ platform_queries table already exists");
    }

    // Check if platform_insights table exists
    const insightsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'platform_insights'
      ) as exists
    `);

    if (!insightsExists.rows[0]?.exists) {
      console.log("Creating platform_insights table...");
      // First check if ai_platform enum exists
      const aiPlatformEnumExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'ai_platform'
        ) as exists
      `);

      if (!aiPlatformEnumExists.rows[0]?.exists) {
        console.log("Creating ai_platform enum...");
        await db.execute(sql`
          CREATE TYPE ai_platform AS ENUM ('chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek', 'copilot')
        `);
        console.log("✓ ai_platform enum created");
      }

      await db.execute(sql`
        CREATE TABLE platform_insights (
          id TEXT PRIMARY KEY,
          query_id TEXT NOT NULL REFERENCES platform_queries(id) ON DELETE CASCADE,
          brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          platform ai_platform NOT NULL,
          response_content TEXT NOT NULL,
          visibility_score INTEGER,
          citation_count INTEGER NOT NULL DEFAULT 0,
          mention_count INTEGER NOT NULL DEFAULT 0,
          prominence_score INTEGER,
          content_type_performance JSONB DEFAULT '{}',
          recommendations JSONB DEFAULT '[]',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      console.log("✓ platform_insights table created");
    } else {
      console.log("✓ platform_insights table already exists");
    }

    // Check if citation_records table exists
    const citationsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'citation_records'
      ) as exists
    `);

    if (!citationsExists.rows[0]?.exists) {
      console.log("Creating citation_records table...");
      await db.execute(sql`
        CREATE TABLE citation_records (
          id TEXT PRIMARY KEY,
          insight_id TEXT NOT NULL REFERENCES platform_insights(id) ON DELETE CASCADE,
          brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
          citation_type citation_type NOT NULL,
          citation_text TEXT,
          source_url TEXT,
          source_title TEXT,
          position INTEGER,
          context TEXT,
          content_type TEXT,
          relevance_score INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      console.log("✓ citation_records table created");
    } else {
      console.log("✓ citation_records table already exists");
    }

    console.log("\n✅ All AI Insights tables created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating tables:", error);
    process.exit(1);
  }
}

createTables();
