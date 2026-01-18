/**
 * Check competitive data state for debugging
 */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function check() {
  // Get Under Armour brand ID
  const brands = await sql`SELECT id, name FROM brands WHERE name ILIKE '%under armour%' OR name ILIKE '%underarmour%' LIMIT 1`;
  if (brands.length === 0) {
    console.log('No Under Armour brand found');
    return;
  }
  const brandId = brands[0].id;
  console.log('Brand:', brands[0].name, '- ID:', brandId);
  console.log('');

  // Check SOV snapshots
  const sovCount = await sql`SELECT COUNT(*) as count FROM share_of_voice WHERE brand_id = ${brandId}`;
  console.log('SOV snapshots:', sovCount[0].count);

  // Check gaps
  const gapCount = await sql`SELECT COUNT(*) as count FROM competitive_gaps WHERE brand_id = ${brandId}`;
  console.log('Competitive gaps:', gapCount[0].count);

  // Check alerts
  const alertCount = await sql`SELECT COUNT(*) as count FROM competitive_alerts WHERE brand_id = ${brandId}`;
  console.log('Competitive alerts:', alertCount[0].count);
  console.log('');

  // Check brand mentions and their competitor references
  const mentions = await sql`
    SELECT query, competitors, platform
    FROM brand_mentions
    WHERE brand_id = ${brandId}
    AND competitors IS NOT NULL
    LIMIT 5
  `;
  console.log('Sample brand mentions with competitors:', mentions.length);
  for (const m of mentions) {
    console.log('  Query:', m.query);
    console.log('  Competitors:', JSON.stringify(m.competitors));
    console.log('');
  }

  // Check configured competitors on brand
  const brandDetail = await sql`SELECT competitors FROM brands WHERE id = ${brandId}`;
  console.log('Configured competitors on brand:', JSON.stringify(brandDetail[0]?.competitors, null, 2));
}

check().catch(console.error);
