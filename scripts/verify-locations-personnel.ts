import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { eq } from 'drizzle-orm';

async function verify() {
  console.log('\n📊 Verifying Locations & Personnel Data\n');

  const benchmarkBrands = await db.query.brands.findMany({
    where: eq(brands.isBenchmark, true),
    orderBy: (brands, { asc }) => [asc(brands.industry), asc(brands.name)],
  });

  console.log(`Total benchmark brands: ${benchmarkBrands.length}\n`);

  let withLocations = 0;
  let withPersonnel = 0;
  let missingData: string[] = [];

  benchmarkBrands.forEach((brand) => {
    const locations = brand.locations as any[];
    const personnel = brand.personnel as any[];

    const hasLocations = locations && locations.length > 0;
    const hasPersonnel = personnel && personnel.length > 0;

    if (hasLocations) withLocations++;
    if (hasPersonnel) withPersonnel++;

    if (!hasLocations || !hasPersonnel) {
      missingData.push(
        `${brand.name} (${brand.domain}) - Locations: ${hasLocations ? '✅' : '❌'} Personnel: ${hasPersonnel ? '✅' : '❌'}`
      );
    }
  });

  console.log(`Brands with locations: ${withLocations}/${benchmarkBrands.length}`);
  console.log(`Brands with personnel: ${withPersonnel}/${benchmarkBrands.length}\n`);

  if (missingData.length > 0) {
    console.log('⚠️  Brands missing data:\n');
    missingData.forEach(msg => console.log(`  ${msg}`));
  } else {
    console.log('✅ All benchmark brands have complete location and personnel data!\n');
  }

  console.log('\n✅ Verification complete!\n');
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
