/**
 * Seed script to create the "platform" organization and brand.
 * This allows the admin to store OAuth tokens for platform-level social accounts.
 *
 * Run with: npx tsx scripts/seed-platform-brand.ts
 */

import 'dotenv/config';
import { db } from '../src/lib/db';
import { organizations } from '../src/lib/db/schema/organizations';
import { brands } from '../src/lib/db/schema/brands';
import { eq } from 'drizzle-orm';

const PLATFORM_ORG_ID = 'platform';
const PLATFORM_BRAND_ID = 'platform';

async function seedPlatformBrand() {
  console.log('🚀 Seeding platform organization and brand...\n');

  try {
    // Check if platform organization already exists
    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.id, PLATFORM_ORG_ID)
    });

    if (existingOrg) {
      console.log('✅ Platform organization already exists');
    } else {
      // Create platform organization
      await db.insert(organizations).values({
        id: PLATFORM_ORG_ID,
        name: 'Apex Platform',
        slug: 'apex-platform',
        plan: 'enterprise',
        brandLimit: 999,
        userLimit: 999,
        branding: {
          primaryColor: '#00E5CC',
          accentColor: '#8B5CF6',
          logoUrl: null,
          faviconUrl: null,
          appName: 'Apex',
          customDomain: null,
        },
        features: ['all'],
        isActive: true,
      });
      console.log('✅ Created platform organization');
    }

    // Check if platform brand already exists
    const existingBrand = await db.query.brands.findFirst({
      where: eq(brands.id, PLATFORM_BRAND_ID)
    });

    if (existingBrand) {
      console.log('✅ Platform brand already exists');
    } else {
      // Create platform brand
      await db.insert(brands).values({
        id: PLATFORM_BRAND_ID,
        organizationId: PLATFORM_ORG_ID,
        name: 'Apex Platform',
        domain: 'apex.io',
        description: 'Apex GEO/AEO Platform - The official platform brand for social media management.',
        tagline: 'Visibility in the AI Era',
        industry: 'Marketing Technology',
        keywords: ['GEO', 'AEO', 'AI visibility', 'content optimization'],
        monitoringEnabled: true,
        isActive: true,
      });
      console.log('✅ Created platform brand');
    }

    console.log('\n✨ Platform seeding complete!');
    console.log('\nYou can now use brandId="platform" for admin OAuth connections.');

  } catch (error) {
    console.error('❌ Error seeding platform brand:', error);
    throw error;
  }

  process.exit(0);
}

seedPlatformBrand();
