/**
 * Update Notion to Benchmark Brand
 * Convert existing Notion brand to proper SaaS benchmark brand with complete data
 */

import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { eq } from 'drizzle-orm';

const notionData = {
  industry: 'SaaS / B2B Software',
  tagline: 'Your connected workspace for wiki, docs & projects',
  description: 'Notion is the connected workspace where better, faster work happens. Write, plan, and get organized in one place with Notion\'s flexible and powerful platform.',
  logoUrl: 'https://logo.clearbit.com/notion.so',
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
  isBenchmark: true,
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
  lastEnrichedAt: new Date(),
};

async function main() {
  console.log('\n🔄 Updating Notion to Benchmark Brand\n');

  // Find Notion
  const notion = await db.query.brands.findFirst({
    where: eq(brands.domain, 'notion.so'),
  });

  if (!notion) {
    console.log('❌ Notion not found in database\n');
    process.exit(1);
  }

  console.log(`Found Notion: ${notion.name} (ID: ${notion.id})`);
  console.log(`Current Industry: ${notion.industry}`);
  console.log(`Current Benchmark: ${notion.isBenchmark}\n`);

  // Update to benchmark brand
  await db
    .update(brands)
    .set({
      ...notionData,
      updatedAt: new Date(),
    })
    .where(eq(brands.id, notion.id));

  console.log('✅ Notion updated successfully\n');

  // Verify
  const updated = await db.query.brands.findFirst({
    where: eq(brands.domain, 'notion.so'),
  });

  if (updated) {
    console.log('Updated Notion:');
    console.log(`  Industry: ${updated.industry}`);
    console.log(`  Tier: ${updated.benchmarkTier}`);
    console.log(`  Is Benchmark: ${updated.isBenchmark}`);
    console.log(`  Locations: ${(updated.locations as any[])?.length || 0}`);
    console.log(`  Personnel: ${(updated.personnel as any[])?.length || 0}`);
  }

  // Check SaaS count
  const saasBrands = await db.query.brands.findMany({
    where: eq(brands.industry, 'SaaS / B2B Software'),
  });

  console.log(`\n\nSaaS / B2B Software brands: ${saasBrands.length}/5\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
