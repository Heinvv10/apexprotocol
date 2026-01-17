import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function check() {
  let output = '';
  try {
    output += 'DATABASE_URL present: ' + !!process.env.DATABASE_URL + '\n';
    output += 'Checking database...\n';

    const orgs = await db.execute(sql`SELECT id, name, slug FROM organizations WHERE id = 'platform' OR slug = 'apex-platform'`);
    output += 'Platform organization:\n';
    output += JSON.stringify(orgs.rows, null, 2) + '\n';

    const brandResult = await db.execute(sql`SELECT id, name, organization_id FROM brands WHERE id = 'platform'`);
    output += '\nPlatform brand:\n';
    output += JSON.stringify(brandResult.rows, null, 2) + '\n';

  } catch (e: unknown) {
    output += 'Error: ' + (e instanceof Error ? e.message : String(e)) + '\n';
  }

  fs.writeFileSync('scripts/check-output.txt', output);
  process.exit(0);
}

check();
