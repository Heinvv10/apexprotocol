import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

async function migrate() {
  console.log('🔄 Creating roadmap tables for Phase 9.2...\n');

  try {
    // Create enums first (if they don't exist)
    console.log('Creating enums...');

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE roadmap_status AS ENUM ('draft', 'active', 'paused', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ roadmap_status enum created\n');

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE roadmap_target_position AS ENUM ('leader', 'top3', 'competitive');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ roadmap_target_position enum created\n');

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE score_category AS ENUM ('geo', 'seo', 'aeo', 'smo', 'ppo');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ score_category enum created\n');

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ milestone_status enum created\n');

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE milestone_difficulty AS ENUM ('easy', 'medium', 'hard');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ milestone_difficulty enum created\n');

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE score_data_source AS ENUM ('scraped', 'estimated', 'manual');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ score_data_source enum created\n');

    // Create competitor_scores table
    console.log('Creating competitor_scores table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS competitor_scores (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
        competitor_name TEXT NOT NULL,
        competitor_domain TEXT,

        geo_score INTEGER NOT NULL DEFAULT 0,
        seo_score INTEGER NOT NULL DEFAULT 0,
        aeo_score INTEGER NOT NULL DEFAULT 0,
        smo_score INTEGER NOT NULL DEFAULT 0,
        ppo_score INTEGER NOT NULL DEFAULT 0,
        unified_score INTEGER NOT NULL DEFAULT 0,
        grade TEXT NOT NULL DEFAULT 'D',

        geo_breakdown JSONB DEFAULT '{}',
        seo_breakdown JSONB DEFAULT '{}',
        aeo_breakdown JSONB DEFAULT '{}',
        smo_breakdown JSONB DEFAULT '{}',
        ppo_breakdown JSONB DEFAULT '{}',

        confidence INTEGER NOT NULL DEFAULT 50,
        data_source score_data_source NOT NULL DEFAULT 'estimated',

        calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ competitor_scores table created\n');

    // Create improvement_roadmaps table
    console.log('Creating improvement_roadmaps table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS improvement_roadmaps (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

        title TEXT NOT NULL,
        description TEXT,

        target_competitor TEXT,
        target_position roadmap_target_position NOT NULL DEFAULT 'competitive',

        current_unified_score INTEGER NOT NULL DEFAULT 0,
        target_unified_score INTEGER NOT NULL DEFAULT 0,
        current_grade TEXT NOT NULL DEFAULT 'D',
        target_grade TEXT NOT NULL DEFAULT 'B',

        estimated_weeks INTEGER NOT NULL DEFAULT 12,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,

        status roadmap_status NOT NULL DEFAULT 'draft',
        progress_percentage INTEGER NOT NULL DEFAULT 0,

        generated_by_ai BOOLEAN NOT NULL DEFAULT false,
        ai_model TEXT,
        generation_prompt TEXT,

        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ improvement_roadmaps table created\n');

    // Create roadmap_milestones table
    console.log('Creating roadmap_milestones table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS roadmap_milestones (
        id TEXT PRIMARY KEY,
        roadmap_id TEXT NOT NULL REFERENCES improvement_roadmaps(id) ON DELETE CASCADE,

        title TEXT NOT NULL,
        description TEXT,
        category score_category NOT NULL,

        phase INTEGER NOT NULL DEFAULT 1,
        order_in_phase INTEGER NOT NULL DEFAULT 0,

        expected_score_impact INTEGER NOT NULL DEFAULT 0,
        expected_days_to_complete INTEGER NOT NULL DEFAULT 7,
        difficulty milestone_difficulty NOT NULL DEFAULT 'medium',

        action_items JSONB DEFAULT '[]',

        status milestone_status NOT NULL DEFAULT 'pending',
        completed_at TIMESTAMP WITH TIME ZONE,
        actual_score_impact INTEGER,

        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ roadmap_milestones table created\n');

    // Create roadmap_progress_snapshots table
    console.log('Creating roadmap_progress_snapshots table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS roadmap_progress_snapshots (
        id TEXT PRIMARY KEY,
        roadmap_id TEXT NOT NULL REFERENCES improvement_roadmaps(id) ON DELETE CASCADE,

        snapshot_date DATE NOT NULL,

        geo_score INTEGER NOT NULL DEFAULT 0,
        seo_score INTEGER NOT NULL DEFAULT 0,
        aeo_score INTEGER NOT NULL DEFAULT 0,
        smo_score INTEGER NOT NULL DEFAULT 0,
        ppo_score INTEGER NOT NULL DEFAULT 0,
        unified_score INTEGER NOT NULL DEFAULT 0,
        grade TEXT NOT NULL DEFAULT 'D',

        milestones_completed INTEGER NOT NULL DEFAULT 0,
        milestones_total INTEGER NOT NULL DEFAULT 0,
        rank_among_competitors INTEGER,

        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ roadmap_progress_snapshots table created\n');

    // Create indexes
    console.log('Creating indexes...');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_competitor_scores_brand
      ON competitor_scores(brand_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_improvement_roadmaps_brand
      ON improvement_roadmaps(brand_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_improvement_roadmaps_status
      ON improvement_roadmaps(status)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_roadmap
      ON roadmap_milestones(roadmap_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_roadmap_progress_snapshots_roadmap
      ON roadmap_progress_snapshots(roadmap_id)
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS rps_roadmap_date_idx
      ON roadmap_progress_snapshots(roadmap_id, snapshot_date)
    `);

    console.log('✅ All indexes created\n');

    console.log('🎉 Phase 9.2 Roadmap tables migration complete!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
