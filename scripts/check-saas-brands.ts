import * as dotenv from 'dotenv';
import * as path from 'path';
import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { eq, and } from 'drizzle-orm';

// Load .env.local for database connection
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const saasBrands = await db.query.brands.findMany({
    where: and(
      eq(brands.industry, 'SaaS / B2B Software'),
      eq(brands.isBenchmark, true),
      eq(brands.organizationId, 'org_benchmark_brands')
    ),
    columns: { name: true, domain: true, benchmarkTier: true },
  });

  console.log('\n📊 SaaS / B2B Software Brands:\n');
  console.log(`Total: ${saasBrands.length}/5\n`);

  saasBrands.forEach(brand => {
    console.log(`  ${brand.benchmarkTier === 'gold' ? '🥇' : '🥈'} ${brand.name} (${brand.domain})`);
  });

  console.log('\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
