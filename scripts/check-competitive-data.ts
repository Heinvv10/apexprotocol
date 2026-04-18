/**
 * Check competitive data state for debugging
 */
import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function check() {
  // Get Under Armour brand ID
  const brands = await db.execute(sql`SELECT id, name FROM brands WHERE name ILIKE '%under armour%' OR name ILIKE '%underarmour%' LIMIT 1`);
  if (brands.rows.length === 0) {
    console.log('No Under Armour brand found');
    return;
  }
  const brandId = brands.rows[0].id;
  console.log('Brand:', brands.rows[0].name, '- ID:', brandId);
  console.log('');

  // Check SOV snapshots
  const sovCount = await db.execute(sql`SELECT COUNT(*) as count FROM share_of_voice WHERE brand_id = ${brandId}`);
  console.log('SOV snapshots:', sovCount.rows[0].count);

  // Check gaps
  const gapCount = await db.execute(sql`SELECT COUNT(*) as count FROM competitive_gaps WHERE brand_id = ${brandId}`);
  console.log('Competitive gaps:', gapCount.rows[0].count);

  // Check alerts
  const alertCount = await db.execute(sql`SELECT COUNT(*) as count FROM competitive_alerts WHERE brand_id = ${brandId}`);
  console.log('Competitive alerts:', alertCount.rows[0].count);
  console.log('');

  // Check brand mentions and their competitor references
  const mentions = await db.execute(sql`
    SELECT query, competitors, platform
    FROM brand_mentions
    WHERE brand_id = ${brandId}
    AND competitors IS NOT NULL
    LIMIT 5
  `);
  console.log('Sample brand mentions with competitors:', mentions.rows.length);
  for (const m of mentions.rows) {
    console.log('  Query:', m.query);
    console.log('  Competitors:', JSON.stringify(m.competitors));
    console.log('');
  }

  // Check configured competitors on brand
  const brandDetail = await db.execute(sql`SELECT competitors FROM brands WHERE id = ${brandId}`);
  console.log('Configured competitors on brand:', JSON.stringify(brandDetail.rows[0]?.competitors, null, 2));
}

check().catch(console.error);
