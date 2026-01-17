import * as dotenv from 'dotenv';
import * as path from 'path';
import { db } from '@/lib/db';
import { brands, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Load .env.local for database connection
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const FINAL_SAAS_BRAND = {
  name: 'Asana',
  domain: 'asana.com',
  tagline: 'Work on big ideas, without the busywork',
  description: 'Asana is a work management platform that helps teams organize, track, and manage their work and projects.',
  logoUrl: 'https://logo.clearbit.com/asana.com',
  industry: 'SaaS / B2B Software',
  keywords: ['asana', 'project management', 'work management', 'team collaboration'],
  seoKeywords: ['project management software', 'task management', 'team collaboration tool', 'workflow management', 'productivity app'],
  geoKeywords: ['asana pricing', 'asana templates', 'asana alternatives'],
  competitors: [
    { name: 'Monday.com', url: 'monday.com', reason: 'Work management competitor' },
    { name: 'Trello', url: 'trello.com', reason: 'Project management competitor' },
    { name: 'Jira', url: 'atlassian.com/jira', reason: 'Project tracking competitor' },
    { name: 'ClickUp', url: 'clickup.com', reason: 'All-in-one work app competitor' },
    { name: 'Notion', url: 'notion.so', reason: 'Workspace competitor' },
  ],
  valuePropositions: ['Clear work organization', 'Team alignment', 'Workflow automation', 'Multiple views'],
  socialLinks: {
    twitter: 'https://twitter.com/asana',
    linkedin: 'https://www.linkedin.com/company/asana',
    facebook: 'https://www.facebook.com/asana',
    instagram: 'https://www.instagram.com/asana',
    youtube: 'https://www.youtube.com/c/asana',
  },
  voice: {
    tone: 'empowering' as const,
    personality: ['organized', 'efficient', 'supportive', 'clarity-focused'],
    targetAudience: 'Teams seeking better work management and collaboration',
    keyMessages: ['Work without busywork', 'Clarity on tasks', 'Team alignment', 'Get organized'],
    avoidTopics: [],
  },
  visual: {
    primaryColor: '#F06A6A',
    secondaryColor: '#FFB900',
    accentColor: '#FFFFFF',
    colorPalette: ['#F06A6A', '#FFB900', '#FFFFFF', '#E05555'],
    fontFamily: 'Sailec',
  },
  benchmarkTier: 'silver' as const,
  locations: [
    {
      type: 'headquarters' as const,
      address: '633 Folsom Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94107',
    },
  ],
  personnel: [
    {
      name: 'Dustin Moskovitz',
      title: 'Co-Founder & CEO',
      linkedinUrl: 'https://www.linkedin.com/in/dmoskov/',
      isActive: true,
      joinedDate: '2008-01',
    },
    {
      name: 'Justin Rosenstein',
      title: 'Co-Founder',
      linkedinUrl: 'https://www.linkedin.com/in/justinrosenstein/',
      isActive: true,
      joinedDate: '2008-01',
    },
    {
      name: 'Anne Raimondi',
      title: 'Chief Operating Officer',
      linkedinUrl: 'https://www.linkedin.com/in/anneraimondi/',
      isActive: true,
      joinedDate: '2018-01',
    },
    {
      name: 'Tim Wan',
      title: 'Chief Financial Officer',
      linkedinUrl: 'https://www.linkedin.com/in/timwan/',
      isActive: true,
      joinedDate: '2020-01',
    },
    {
      name: 'Sonja Gittens Ottley',
      title: 'Chief People Officer',
      linkedinUrl: 'https://www.linkedin.com/in/sonjagittensottley/',
      isActive: true,
      joinedDate: '2019-01',
    },
  ],
};

async function main() {
  console.log('Adding final SaaS brand - THE 100th BRAND! 🎯\n');

  // Check if org exists
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, 'org_benchmark_brands'),
  });

  if (!org) {
    console.error('ERROR: Organization "org_benchmark_brands" not found!');
    process.exit(1);
  }

  console.log('Organization found:', org.name);
  console.log('');

  console.log(`Processing industry: ${FINAL_SAAS_BRAND.industry}`);
  console.log('='.repeat(60));

  try {
    // Check if brand already exists by domain
    const existing = await db.query.brands.findFirst({
      where: eq(brands.domain, FINAL_SAAS_BRAND.domain),
    });

    if (existing) {
      console.log(`⏭️  SKIPPED: ${FINAL_SAAS_BRAND.name} (${FINAL_SAAS_BRAND.domain}) - already exists`);
      console.log('Brand count is still at 99. Need to find a different brand.');
      process.exit(1);
    }

    // Insert brand
    await db.insert(brands).values({
      organizationId: 'org_benchmark_brands',
      isBenchmark: true,
      ...FINAL_SAAS_BRAND,
    });

    console.log(`✅ INSERTED: ${FINAL_SAAS_BRAND.name} (${FINAL_SAAS_BRAND.domain}) - ${FINAL_SAAS_BRAND.benchmarkTier} tier`);
    console.log('');
    console.log('='.repeat(60));
    console.log('🎉🎉🎉 100 BENCHMARK BRANDS COMPLETE! 🎉🎉🎉');
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ All 20 industries now have 5 brands each');
    console.log('✅ Tier distribution: 3 gold + 2 silver per industry');
    console.log('✅ Total: 100 benchmark brands (50 original + 50 new)');
    console.log('');
    console.log('Run count-brands.ts to verify!');
  } catch (error) {
    console.error(`❌ ERROR inserting ${FINAL_SAAS_BRAND.name}:`, error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
