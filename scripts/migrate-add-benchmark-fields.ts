import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

async function migrate() {
  console.log('🔄 Adding benchmark fields to brands table...\n');

  try {
    // Add columns
    await db.execute(sql`
      ALTER TABLE brands
        ADD COLUMN IF NOT EXISTS is_benchmark BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS benchmark_tier TEXT,
        ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMP WITH TIME ZONE
    `);
    console.log('✅ Columns added successfully\n');

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_brands_is_benchmark
      ON brands(is_benchmark)
      WHERE is_benchmark = true
    `);
    console.log('✅ Index idx_brands_is_benchmark created\n');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_brands_benchmark_tier
      ON brands(benchmark_tier)
      WHERE benchmark_tier IS NOT NULL
    `);
    console.log('✅ Index idx_brands_benchmark_tier created\n');

    console.log('✅ Migration complete!\n');
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
