import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { eq } from 'drizzle-orm';

async function main() {
  const consumerGoods = await db.query.brands.findMany({
    where: eq(brands.industry, 'Consumer Goods'),
    columns: { name: true, domain: true }
  });

  const fashion = await db.query.brands.findMany({
    where: eq(brands.industry, 'Fashion / Apparel'),
    columns: { name: true, domain: true }
  });

  console.log('\nConsumer Goods:', consumerGoods.map(b => b.name).join(', '));
  console.log('\nFashion / Apparel:', fashion.map(b => b.name).join(', '));
}

main().then(() => process.exit(0));
