import 'dotenv/config';
import { db } from '../src/lib/db';
import { brands } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function checkDistribution() {
  const result = await db.execute(sql`
    SELECT industry, COUNT(*) as count
    FROM brands
    GROUP BY industry
    ORDER BY count DESC, industry
  `);

  console.log('Industry Distribution:');
  let total = 0;
  for (const row of result.rows) {
    const r = row as { industry: string; count: string };
    console.log(`${r.industry}: ${r.count} brands`);
    total += parseInt(r.count);
  }
  console.log('');
  console.log(`Total Industries: ${result.rows.length}`);
  console.log(`Total Brands: ${total}`);
}

checkDistribution().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
