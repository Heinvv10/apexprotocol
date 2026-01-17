import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
  try {
    console.log('[TEST] Starting database connection test...');

    const benchmarkBrands = await db.query.brands.findMany({
      where: and(
        eq(brands.isBenchmark, true),
        eq(brands.organizationId, 'org_benchmark_brands')
      ),
      columns: { name: true, industry: true, domain: true },
    });

    console.log(`[TEST] Found ${benchmarkBrands.length} total benchmark brands`);

    // Count by industry
    const byIndustry: Record<string, number> = {};
    for (const brand of benchmarkBrands) {
      byIndustry[brand.industry] = (byIndustry[brand.industry] || 0) + 1;
    }

    console.log('\n[TEST] Brands by industry:');
    Object.entries(byIndustry)
      .sort((a, b) => b[1] - a[1])
      .forEach(([industry, count]) => {
        console.log(`  ${industry}: ${count}`);
      });

    // Check for the new industries
    const professionalServices = benchmarkBrands.filter(b => b.industry === 'Professional Services');
    const sportsFitness = benchmarkBrands.filter(b => b.industry === 'Sports & Fitness');
    const telecom = benchmarkBrands.filter(b => b.industry === 'Telecommunications');
    const energy = benchmarkBrands.filter(b => b.industry === 'Energy / Sustainability');

    console.log('\n[TEST] New industries check:');
    console.log(`  Professional Services: ${professionalServices.length} brands -`, professionalServices.map(b => b.name).join(', ') || 'NONE');
    console.log(`  Sports & Fitness: ${sportsFitness.length} brands -`, sportsFitness.map(b => b.name).join(', ') || 'NONE');
    console.log(`  Telecommunications: ${telecom.length} brands -`, telecom.map(b => b.name).join(', ') || 'NONE');
    console.log(`  Energy / Sustainability: ${energy.length} brands -`, energy.map(b => b.name).join(', ') || 'NONE');

    console.log('\n[TEST] Database connection test complete!');
  } catch (error) {
    console.error('[TEST] ERROR:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('[TEST] Exiting successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[TEST] Fatal error:', error);
    process.exit(1);
  });
