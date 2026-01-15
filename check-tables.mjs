import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;

// Load .env.local explicitly
config({ path: '.env.local' });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const result = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('predictions', 'model_metadata', 'predictive_alerts') ORDER BY table_name");
  console.log('Tables found:', JSON.stringify(result.rows, null, 2));
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}
