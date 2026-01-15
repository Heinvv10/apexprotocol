import { config } from 'dotenv';
import pkg from 'pg';
import { readFileSync } from 'fs';
const { Pool } = pkg;

// Load .env.local explicitly
config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Read the migration SQL
const migrationSQL = readFileSync('drizzle/0013_add_predictions_tables.sql', 'utf8');

try {
  console.log('Applying predictions migration...');
  await pool.query(migrationSQL);
  console.log('✓ Migration applied successfully!');

  // Verify tables were created
  const result = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('predictions', 'model_metadata', 'predictive_alerts') ORDER BY table_name");
  console.log('Tables created:', result.rows.map(r => r.table_name).join(', '));
} catch (error) {
  console.error('Error applying migration:', error.message);
  process.exit(1);
} finally {
  await pool.end();
}
