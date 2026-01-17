import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { eq } from 'drizzle-orm';

async function main() {
  const saasBrands = await db.query.brands.findMany({
    where: eq(brands.industry, 'SaaS / B2B Software'),
    orderBy: (brands, { asc }) => [asc(brands.name)],
  });

  console.log(`\nSaaS / B2B Software brands: ${saasBrands.length}\n`);
  saasBrands.forEach((brand, idx) => {
    console.log(`  ${idx + 1}. ${brand.name} (${brand.domain}) - ${brand.benchmarkTier}`);
  });
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
