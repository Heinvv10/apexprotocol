import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { eq } from 'drizzle-orm';

async function verify() {
  console.log('\n📊 Verifying Benchmark Brands\n');

  const benchmarkBrands = await db.query.brands.findMany({
    where: eq(brands.isBenchmark, true),
    orderBy: (brands, { asc }) => [asc(brands.industry), asc(brands.benchmarkTier), asc(brands.name)],
  });

  console.log(`Total benchmark brands: ${benchmarkBrands.length}\n`);

  if (benchmarkBrands.length === 0) {
    console.log('❌ No benchmark brands found!\n');
    return;
  }

  console.log('Brands by Industry:\n');
  const byIndustry: Record<string, typeof benchmarkBrands> = {};

  benchmarkBrands.forEach((brand) => {
    const industry = brand.industry || 'Unknown';
    if (!byIndustry[industry]) {
      byIndustry[industry] = [];
    }
    byIndustry[industry].push(brand);
  });

  Object.entries(byIndustry).forEach(([industry, brands]) => {
    console.log(`\n${industry} (${brands.length} brands):`);
    brands.forEach((brand) => {
      const keywords = brand.keywords ? (brand.keywords as string[]).length : 0;
      const competitors = brand.competitors ? (brand.competitors as any[]).length : 0;
      const tier = brand.benchmarkTier || 'N/A';

      console.log(`  [${tier.toUpperCase()}] ${brand.name}`);
      console.log(`       Domain: ${brand.domain}`);
      console.log(`       Keywords: ${keywords} | Competitors: ${competitors}`);
      console.log(`       Logo: ${brand.logoUrl ? '✅' : '❌'}`);
    });
  });

  console.log('\n\n✅ Verification complete!\n');
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
