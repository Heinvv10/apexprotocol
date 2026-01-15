import { config } from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// Load .env.local explicitly
config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  // Check enum values for alert_severity
  const result = await pool.query(`
    SELECT e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'alert_severity'
    ORDER BY e.enumsortorder
  `);
  console.log('alert_severity enum values:', result.rows.map(r => r.enumlabel));
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}
