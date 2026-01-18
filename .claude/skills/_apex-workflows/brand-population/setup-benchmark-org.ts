/**
 * Setup Benchmark Organization
 *
 * Creates the special "Benchmark Brands" system organization that will own
 * all benchmark brand records in the database.
 *
 * Usage:
 *   bun run .claude/skills/brand-population/setup-benchmark-org.ts
 */

import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema/organizations';
import { eq } from 'drizzle-orm';

const BENCHMARK_ORG_ID = 'org_benchmark_brands';
const BENCHMARK_ORG_NAME = 'Benchmark Brands (System)';

async function setupBenchmarkOrganization() {
  console.log('\n🏢 Setting up Benchmark Organization...\n');

  try {
    // Check if organization already exists
    const existing = await db.query.organizations.findFirst({
      where: eq(organizations.id, BENCHMARK_ORG_ID),
    });

    if (existing) {
      console.log(`✅ Benchmark organization already exists:`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Created: ${existing.createdAt}\n`);
      return existing;
    }

    // Create new benchmark organization
    const [created] = await db
      .insert(organizations)
      .values({
        id: BENCHMARK_ORG_ID,
        name: BENCHMARK_ORG_NAME,
        slug: 'benchmark-brands',

        // Organization settings
        plan: 'enterprise', // Highest tier for system organization
        brandLimit: 999, // Unlimited brands for benchmarks
        userLimit: 999,
        isActive: true,

        // Default settings
        branding: {
          primaryColor: '#4926FA',
          accentColor: '#D82F71',
          logoUrl: null,
          faviconUrl: null,
          appName: 'Benchmark Brands',
          customDomain: null,
        },
        settings: {
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          defaultLanguage: 'en',
        },
        onboardingStatus: {
          brandAdded: true,
          monitoringConfigured: true,
          auditRun: true,
          recommendationsReviewed: true,
          completedAt: new Date().toISOString(),
          dismissedAt: null,
        },
      })
      .returning();

    console.log(`✅ Successfully created benchmark organization:`);
    console.log(`   ID: ${created.id}`);
    console.log(`   Name: ${created.name}`);
    console.log(`   Slug: ${created.slug}`);
    console.log(`   Created: ${created.createdAt}\n`);

    return created;
  } catch (error) {
    console.error(`❌ Failed to setup benchmark organization:`, error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.main) {
  setupBenchmarkOrganization()
    .then(() => {
      console.log('✅ Setup complete!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { setupBenchmarkOrganization, BENCHMARK_ORG_ID, BENCHMARK_ORG_NAME };
