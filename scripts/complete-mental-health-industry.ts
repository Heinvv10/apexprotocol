import * as dotenv from 'dotenv';
import * as path from 'path';
import { db } from '@/lib/db';
import { brands, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Load .env.local for database connection
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MENTAL_HEALTH_BRANDS = [
  {
    name: 'Spring Health',
    domain: 'springhealth.com',
    tagline: 'Comprehensive mental health solution for employers',
    description: 'Spring Health is a comprehensive mental health solution for employers, providing personalized care through therapy, coaching, medication management, and self-care tools.',
    logoUrl: 'https://logo.clearbit.com/springhealth.com',
    industry: 'Mental Health / Therapy Tech',
    keywords: ['spring health', 'workplace mental health', 'employee wellness', 'mental health benefits', 'therapy'],
    seoKeywords: ['employee mental health', 'workplace wellness program', 'mental health benefits', 'employer mental health', 'corporate wellness'],
    geoKeywords: ['spring health platform', 'spring health employers', 'spring health care'],
    competitors: [
      { name: 'Lyra Health', url: 'lyrahealth.com', reason: 'Workplace mental health competitor' },
      { name: 'Modern Health', url: 'modernhealth.com', reason: 'Employee wellness platform' },
      { name: 'Ginger', url: 'ginger.com', reason: 'Mental health benefits competitor' },
      { name: 'Talkspace', url: 'talkspace.com', reason: 'Online therapy competitor' },
      { name: 'BetterHelp', url: 'betterhelp.com', reason: 'Online therapy competitor' },
    ],
    valuePropositions: ['Personalized care', 'Precision mental healthcare', 'Employer benefits', 'Data-driven matching'],
    socialLinks: {
      twitter: 'https://twitter.com/springhealth',
      linkedin: 'https://www.linkedin.com/company/spring-health',
      facebook: 'https://www.facebook.com/springhealth',
      instagram: 'https://www.instagram.com/springhealth',
    },
    voice: {
      tone: 'professional' as const,
      personality: ['data-driven', 'comprehensive', 'employer-focused', 'personalized'],
      targetAudience: 'Employers and HR teams seeking comprehensive mental health solutions',
      keyMessages: ['Precision mental healthcare', 'Better outcomes', 'Personalized care', 'Data-driven'],
      avoidTopics: [],
    },
    visual: {
      primaryColor: '#6B4FBB',
      secondaryColor: '#1A1A1A',
      accentColor: '#FFFFFF',
      colorPalette: ['#6B4FBB', '#1A1A1A', '#FFFFFF', '#9B81D6'],
      fontFamily: 'Inter',
    },
    benchmarkTier: 'gold' as const,
    locations: [
      {
        type: 'headquarters' as const,
        address: '55 W 46th St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10036',
      },
    ],
    personnel: [
      {
        name: 'April Koh',
        title: 'Co-Founder & CEO',
        linkedinUrl: 'https://www.linkedin.com/in/aprilkoh/',
        isActive: true,
        joinedDate: '2016-01',
      },
      {
        name: 'Adam Chekroud',
        title: 'Co-Founder & President',
        linkedinUrl: 'https://www.linkedin.com/in/adam-chekroud/',
        isActive: true,
        joinedDate: '2016-01',
      },
    ],
  },
  {
    name: 'Cerebral',
    domain: 'cerebral.com',
    tagline: 'Long-term mental health care, online',
    description: 'Cerebral provides online mental health care including therapy, medication management, and care counseling for anxiety, depression, and insomnia.',
    logoUrl: 'https://logo.clearbit.com/cerebral.com',
    industry: 'Mental Health / Therapy Tech',
    keywords: ['cerebral', 'online therapy', 'mental health', 'medication management', 'anxiety treatment'],
    seoKeywords: ['online psychiatry', 'anxiety medication online', 'depression treatment', 'ADHD treatment online', 'mental health medication'],
    geoKeywords: ['cerebral app', 'cerebral therapy', 'cerebral prescription'],
    competitors: [
      { name: 'Talkspace', url: 'talkspace.com', reason: 'Online therapy and psychiatry' },
      { name: 'BetterHelp', url: 'betterhelp.com', reason: 'Online therapy competitor' },
      { name: 'Done', url: 'donefirst.com', reason: 'ADHD treatment online' },
      { name: 'Brightside', url: 'brightside.com', reason: 'Psychiatry and therapy' },
      { name: 'Mindbloom', url: 'mindbloom.com', reason: 'Mental health treatment' },
    ],
    valuePropositions: ['Therapy and medication', 'Flexible plans', 'Licensed providers', 'Online care'],
    socialLinks: {
      twitter: 'https://twitter.com/getcerebral',
      linkedin: 'https://www.linkedin.com/company/cerebral',
      facebook: 'https://www.facebook.com/getcerebral',
      instagram: 'https://www.instagram.com/getcerebral',
    },
    voice: {
      tone: 'supportive' as const,
      personality: ['accessible', 'medical', 'caring', 'straightforward'],
      targetAudience: 'Individuals seeking online therapy and medication management',
      keyMessages: ['Long-term care', 'Therapy and meds', 'Accessible treatment', 'Your mental health'],
      avoidTopics: [],
    },
    visual: {
      primaryColor: '#FF6B6B',
      secondaryColor: '#1A1A1A',
      accentColor: '#FFFFFF',
      colorPalette: ['#FF6B6B', '#1A1A1A', '#FFFFFF', '#FF9999'],
      fontFamily: 'Circular',
    },
    benchmarkTier: 'silver' as const,
    locations: [
      {
        type: 'headquarters' as const,
        address: '1400 16th St',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94103',
      },
    ],
    personnel: [
      {
        name: 'Kyle Robertson',
        title: 'Founder & CEO',
        linkedinUrl: 'https://www.linkedin.com/in/kylerobertsoncerebral/',
        isActive: true,
        joinedDate: '2019-01',
      },
    ],
  },
];

async function main() {
  console.log('Completing Mental Health / Therapy Tech industry (adding 2 brands)...\n');

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

  let totalInserted = 0;
  let totalSkipped = 0;

  console.log('Processing industry: Mental Health / Therapy Tech');
  console.log('='.repeat(60));

  for (const brandData of MENTAL_HEALTH_BRANDS) {
    try {
      // Check if brand already exists by domain
      const existing = await db.query.brands.findFirst({
        where: eq(brands.domain, brandData.domain),
      });

      if (existing) {
        console.log(`⏭️  SKIPPED: ${brandData.name} (${brandData.domain}) - already exists`);
        totalSkipped++;
        continue;
      }

      // Insert brand
      await db.insert(brands).values({
        organizationId: 'org_benchmark_brands',
        isBenchmark: true,
        ...brandData,
      });

      console.log(`✅ INSERTED: ${brandData.name} (${brandData.domain}) - ${brandData.benchmarkTier} tier`);
      totalInserted++;

      // Small delay to avoid overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`❌ ERROR inserting ${brandData.name}:`, error);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY:');
  console.log(`✅ Inserted: ${totalInserted}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);
  console.log('='.repeat(60));

  if (totalInserted === 2) {
    console.log('\n🎉🎉🎉 125 BENCHMARK BRANDS COMPLETE! 🎉🎉🎉');
    console.log('All 25 industries now have 5 brands each (3 gold + 2 silver)');
    console.log('\nRun count-brands.ts to verify!');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
