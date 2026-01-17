import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getOrgId() {
  const client = await pool.connect();

  try {
    const result = await client.query('SELECT id, name FROM organizations LIMIT 5');
    console.log('Organizations:');
    console.log(result.rows);

    if (result.rows.length > 0) {
      console.log('\nUsing organization ID:', result.rows[0].id);
      return result.rows[0].id;
    } else {
      console.log('\nNo organizations found - creating one');
      const createResult = await client.query(`
        INSERT INTO organizations (id, name, created_at, updated_at)
        VALUES (gen_random_uuid()::text, 'Test Organization', NOW(), NOW())
        RETURNING id
      `);
      console.log('Created organization ID:', createResult.rows[0].id);
      return createResult.rows[0].id;
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

getOrgId();
