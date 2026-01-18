/**
 * Check brand mentions data structure
 */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function check() {
  const brands = await sql`SELECT id FROM brands WHERE name = 'Under Armour' LIMIT 1`;
  const brandId = brands[0].id;

  const mentions = await sql`
    SELECT query, platform, competitors, topics
    FROM brand_mentions
    WHERE brand_id = ${brandId}
    LIMIT 10
  `;

  console.log('Brand Mentions Sample:');
  for (const m of mentions) {
    console.log('');
    console.log('  Query:', m.query);
    console.log('  Platform:', m.platform);
    console.log('  Competitors:', JSON.stringify(m.competitors || []));
    console.log('  Topics:', JSON.stringify(m.topics || []));
  }
}

check().catch(console.error);
