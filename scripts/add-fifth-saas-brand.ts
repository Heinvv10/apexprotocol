/**
 * Add Fifth SaaS Brand - Notion
 * Completes the SaaS / B2B Software industry with 5 brands
 */

import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { organizations } from '@/lib/db/schema/organizations';
import { eq } from 'drizzle-orm';

const BENCHMARK_ORG_ID = 'org_benchmark_brands';

const notionBrand = {
  name: 'Notion',
  domain: 'notion.so',
  tagline: 'Your connected workspace for wiki, docs & projects',
  description: 'Notion is the connected workspace where better, faster work happens. Write, plan, and get organized in one place with Notion\'s flexible and powerful platform.',
  logoUrl: 'https://logo.clearbit.com/notion.so',
  industry: 'SaaS / B2B Software',
  keywords: ['notion', 'productivity', 'workspace'],
  seoKeywords: ['note-taking app', 'project management', 'wiki software', 'knowledge base', 'collaboration tools'],
  geoKeywords: ['what is notion', 'how to use notion', 'best productivity app', 'notion vs evernote'],
  competitors: [
    { name: 'Confluence', url: 'atlassian.com/software/confluence', reason: 'Team collaboration and wiki platform' },
    { name: 'Coda', url: 'coda.io', reason: 'All-in-one doc platform competitor' },
    { name: 'Evernote', url: 'evernote.com', reason: 'Note-taking and organization app' },
    { name: 'Monday.com', url: 'monday.com', reason: 'Competes in project management space' },
    { name: 'ClickUp', url: 'clickup.com', reason: 'All-in-one productivity platform' },
  ],
  valuePropositions: [
    'All-in-one workspace combining notes, docs, and project management',
    'Flexible building blocks for customization',
    'Beautiful, intuitive interface',
    'Powerful database and relational features',
  ],
  socialLinks: {
    twitter: 'https://twitter.com/notionhq',
    linkedin: 'https://linkedin.com/company/notionhq',
    facebook: 'https://facebook.com/notionhq',
    instagram: 'https://instagram.com/notionhq',
    youtube: 'https://youtube.com/c/notion',
  },
  voice: {
    tone: 'friendly' as const,
    personality: ['creative', 'flexible', 'minimalist', 'empowering'],
    targetAudience: 'Individuals, teams, and companies seeking a unified workspace for productivity',
    keyMessages: ['All-in-one workspace', 'Customizable', 'Write, plan, collaborate', 'Your tool, your way'],
    avoidTopics: [],
  },
  visual: {
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    accentColor: '#EB5757',
    colorPalette: ['#000000', '#FFFFFF', '#EB5757'],
    fontFamily: 'Inter',
  },
  benchmarkTier: 'silver' as const,
  locations: [
    {
      type: 'headquarters' as const,
      address: '2300 Harrison Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94110',
    },
  ],
  personnel: [
    {
      name: 'Ivan Zhao',
      title: 'CEO & Co-Founder',
      linkedinUrl: 'https://www.linkedin.com/in/ivanzhao/',
      isActive: true,
      joinedDate: '2016',
    },
    {
      name: 'Simon Last',
      title: 'Co-Founder & Former CEO',
      linkedinUrl: 'https://www.linkedin.com/in/simonlast/',
      isActive: false,
      joinedDate: '2016',
    },
    {
      name: 'Akshay Kothari',
      title: 'COO',
      linkedinUrl: 'https://www.linkedin.com/in/akshay-kothari/',
      isActive: true,
      joinedDate: '2018-12',
    },
    {
      name: 'Olivia Nottebohm',
      title: 'Chief Operating Officer',
      linkedinUrl: 'https://www.linkedin.com/in/olivia-nottebohm/',
      isActive: true,
      joinedDate: '2021-11',
    },
    {
      name: 'Madhu Muthukumar',
      title: 'Chief Product Officer',
      linkedinUrl: 'https://www.linkedin.com/in/madhu-muthukumar/',
      isActive: true,
      joinedDate: '2020-06',
    },
  ],
};

async function main() {
  console.log('\n🚀 Adding Fifth SaaS Brand - Notion\n');

  // Step 1: Ensure benchmark organization exists
  console.log('Step 1: Checking benchmark organization...');
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, BENCHMARK_ORG_ID),
  });

  if (!org) {
    console.log('❌ Benchmark organization not found!\n');
    process.exit(1);
  }
  console.log(`✅ Organization exists: ${org.id}\n`);

  // Step 2: Check if Notion already exists
  console.log('Step 2: Checking if Notion already exists...');
  const existing = await db.query.brands.findFirst({
    where: eq(brands.domain, notionBrand.domain),
  });

  if (existing) {
    console.log(`⏭️  Notion already exists, skipping\n`);
    process.exit(0);
  }

  // Step 3: Insert Notion
  console.log('Step 3: Inserting Notion...');
  await db.insert(brands).values({
    organizationId: BENCHMARK_ORG_ID,
    ...notionBrand,
    isBenchmark: true,
    lastEnrichedAt: new Date(),
    monitoringEnabled: false,
    isActive: true,
  });

  console.log(`✅ Notion inserted successfully\n`);

  // Step 4: Verify
  console.log('Step 4: Verifying SaaS brands count...');
  const saasBrands = await db.query.brands.findMany({
    where: eq(brands.industry, 'SaaS / B2B Software'),
  });

  console.log(`\nSaaS / B2B Software brands: ${saasBrands.length}/5`);
  saasBrands.forEach((brand, idx) => {
    console.log(`  ${idx + 1}. ${brand.name} (${brand.benchmarkTier})`);
  });

  console.log('\n✅ Complete!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
