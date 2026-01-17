import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { eq, and } from 'drizzle-orm';

async function main() {
  const benchmarkBrands = await db.query.brands.findMany({
    where: and(
      eq(brands.isBenchmark, true),
      eq(brands.organizationId, 'org_benchmark_brands')
    ),
  });

  const byIndustry: Record<string, number> = {};
  for (const brand of benchmarkBrands) {
    byIndustry[brand.industry] = (byIndustry[brand.industry] || 0) + 1;
  }

  console.log('\n📊 Benchmark Brands Count\n');
  console.log(`Total: ${benchmarkBrands.length}\n`);
  console.log('By Industry:');
  Object.entries(byIndustry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([industry, count]) => {
      console.log(`  ${industry}: ${count}`);
    });
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
