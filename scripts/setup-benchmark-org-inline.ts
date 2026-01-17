import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema/organizations';
import { eq } from 'drizzle-orm';

const BENCHMARK_ORG_ID = 'org_benchmark_brands';

async function main() {
  console.log('🏢 Setting up benchmark organization...');

  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.id, BENCHMARK_ORG_ID),
  });

  if (existing) {
    console.log('✅ Organization already exists:', existing.id);
    return;
  }

  const [created] = await db
    .insert(organizations)
    .values({
      id: BENCHMARK_ORG_ID,
      name: 'Benchmark Brands (System)',
      slug: 'benchmark-brands',
      plan: 'enterprise',
      brandLimit: 999,
      userLimit: 999,
      isActive: true,
    })
    .returning();

  console.log('✅ Created organization:', created.id, created.name);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
