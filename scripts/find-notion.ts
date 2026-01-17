import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { eq } from 'drizzle-orm';

async function main() {
  const notion = await db.query.brands.findFirst({
    where: eq(brands.domain, 'notion.so'),
  });

  if (notion) {
    console.log('\n✅ Notion found:');
    console.log(`   Name: ${notion.name}`);
    console.log(`   Domain: ${notion.domain}`);
    console.log(`   Industry: ${notion.industry}`);
    console.log(`   Tier: ${notion.benchmarkTier}`);
    console.log(`   Has Locations: ${notion.locations && (notion.locations as any[]).length > 0 ? 'Yes' : 'No'}`);
    console.log(`   Has Personnel: ${notion.personnel && (notion.personnel as any[]).length > 0 ? 'Yes' : 'No'}`);
  } else {
    console.log('\n❌ Notion not found in database');
  }
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
