import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

async function migrate() {
  console.log('🔄 Adding locations and personnel fields to brands table...\n');

  try {
    // Add columns
    await db.execute(sql`
      ALTER TABLE brands
        ADD COLUMN IF NOT EXISTS locations JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS personnel JSONB DEFAULT '[]'::jsonb
    `);
    console.log('✅ Columns added successfully\n');

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_brands_locations
      ON brands USING GIN (locations)
    `);
    console.log('✅ Index idx_brands_locations created\n');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_brands_personnel
      ON brands USING GIN (personnel)
    `);
    console.log('✅ Index idx_brands_personnel created\n');

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
