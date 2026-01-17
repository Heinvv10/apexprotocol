import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db/index.js';

async function check() {
  try {
    const result = await db.execute(sql`SELECT id, brand_id, platform, account_name, connection_status, created_at FROM social_oauth_tokens LIMIT 10`);
    console.log('OAuth Tokens in database:');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
}
check();
