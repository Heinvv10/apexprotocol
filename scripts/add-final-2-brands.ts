import * as dotenv from 'dotenv';
import * as path from 'path';
import { db } from '@/lib/db';
import { brands, organizations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Load .env.local for database connection
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const FINAL_BRANDS = {
  'SaaS / B2B Software': {
    name: 'Canva',
    domain: 'canva.com',
    tagline: 'Design anything',
    description: 'Canva is a graphic design platform that allows users to create social media graphics, presentations, posters, and other visual content.',
    logoUrl: 'https://logo.clearbit.com/canva.com',
    industry: 'SaaS / B2B Software',
    keywords: ['canva', 'graphic design', 'design tool', 'visual content'],
    seoKeywords: ['graphic design software', 'online design tool', 'free design platform', 'social media graphics', 'presentation maker'],
    geoKeywords: ['canva pro', 'canva templates', 'canva for teams'],
    competitors: [
      { name: 'Adobe Creative Cloud', url: 'adobe.com', reason: 'Professional design software' },
      { name: 'Figma', url: 'figma.com', reason: 'Collaborative design tool' },
      { name: 'Visme', url: 'visme.co', reason: 'Visual content creator' },
      { name: 'Crello', url: 'crello.com', reason: 'Graphic design competitor' },
      { name: 'PicMonkey', url: 'picmonkey.com', reason: 'Photo editing and design' },
    ],
    valuePropositions: ['Easy to use', 'Templates library', 'Collaborative design', 'Free tier available'],
    socialLinks: {
      twitter: 'https://twitter.com/canva',
      linkedin: 'https://www.linkedin.com/company/canva',
      facebook: 'https://www.facebook.com/canva',
      instagram: 'https://www.instagram.com/canva',
      youtube: 'https://www.youtube.com/c/canva',
    },
    voice: {
      tone: 'empowering' as const,
      personality: ['creative', 'accessible', 'fun', 'collaborative'],
      targetAudience: 'Creators, marketers, and businesses needing visual content creation',
      keyMessages: ['Design anything', 'Empowering creativity', 'Simple design', 'Anyone can design'],
      avoidTopics: [],
    },
    visual: {
      primaryColor: '#00C4CC',
      secondaryColor: '#7D2AE7',
      accentColor: '#FFFFFF',
      colorPalette: ['#00C4CC', '#7D2AE7', '#FFFFFF', '#00A0A3'],
      fontFamily: 'Graphik',
    },
    benchmarkTier: 'silver' as const,
    locations: [
      {
        type: 'headquarters' as const,
        address: 'Level 39, 201 Elizabeth Street',
        city: 'Sydney',
        state: 'NSW',
        country: 'Australia',
        postalCode: '2000',
      },
    ],
    personnel: [
      {
        name: 'Melanie Perkins',
        title: 'Co-Founder & CEO',
        linkedinUrl: 'https://www.linkedin.com/in/melanieperkins/',
        isActive: true,
        joinedDate: '2012-01',
      },
      {
        name: 'Cliff Obrecht',
        title: 'Co-Founder & COO',
        linkedinUrl: 'https://www.linkedin.com/in/cliff-obrecht/',
        isActive: true,
        joinedDate: '2012-01',
      },
      {
        name: 'Cameron Adams',
        title: 'Co-Founder & CPO',
        linkedinUrl: 'https://www.linkedin.com/in/themaninblue/',
        isActive: true,
        joinedDate: '2012-08',
      },
      {
        name: 'Jennie Rogerson',
        title: 'Chief Marketing Officer',
        linkedinUrl: 'https://www.linkedin.com/in/jennie-rogerson/',
        isActive: true,
        joinedDate: '2020-01',
      },
      {
        name: 'Zach Kitschke',
        title: 'Chief Technology Officer',
        linkedinUrl: 'https://www.linkedin.com/in/zach-kitschke/',
        isActive: true,
        joinedDate: '2016-01',
      },
    ],
  },
  'Energy / Sustainability': {
    name: 'Sonnen',
    domain: 'sonnenbatterie.com',
    tagline: 'Energy independence for everyone',
    description: 'Sonnen is a leading manufacturer of smart home energy storage systems that enable homeowners to become energy independent.',
    logoUrl: 'https://logo.clearbit.com/sonnenbatterie.com',
    industry: 'Energy / Sustainability',
    keywords: ['sonnen', 'energy storage', 'solar battery', 'home energy'],
    seoKeywords: ['home battery storage', 'solar energy storage', 'energy independence', 'smart battery', 'renewable energy storage'],
    geoKeywords: ['sonnen battery', 'sonnenbatterie', 'home energy storage'],
    competitors: [
      { name: 'Tesla Powerwall', url: 'tesla.com', reason: 'Home battery competitor' },
      { name: 'LG Chem', url: 'lgchem.com', reason: 'Battery storage competitor' },
      { name: 'Enphase Energy', url: 'enphase.com', reason: 'Solar storage competitor' },
      { name: 'SimpliPhi Power', url: 'simpliphipower.com', reason: 'Energy storage competitor' },
      { name: 'Generac PWRcell', url: 'generac.com', reason: 'Home battery competitor' },
    ],
    valuePropositions: ['Energy independence', 'Smart integration', 'Virtual power plant', 'German engineering'],
    socialLinks: {
      twitter: 'https://twitter.com/sonnenCommunity',
      linkedin: 'https://www.linkedin.com/company/sonnen-gmbh',
      facebook: 'https://www.facebook.com/sonnenCommunity',
      instagram: 'https://www.instagram.com/sonnencommunity',
      youtube: 'https://www.youtube.com/c/sonnenCommunity',
    },
    voice: {
      tone: 'visionary' as const,
      personality: ['innovative', 'sustainable', 'community-focused', 'empowering'],
      targetAudience: 'Homeowners seeking energy independence and sustainability',
      keyMessages: ['Energy independence', 'Clean energy future', 'Community power', 'Smart storage'],
      avoidTopics: [],
    },
    visual: {
      primaryColor: '#E94E1B',
      secondaryColor: '#1A1A1A',
      accentColor: '#FFFFFF',
      colorPalette: ['#E94E1B', '#1A1A1A', '#FFFFFF', '#D44416'],
      fontFamily: 'Montserrat',
    },
    benchmarkTier: 'silver' as const,
    locations: [
      {
        type: 'headquarters' as const,
        address: 'Am Riedbach 1',
        city: 'Wildpoldsried',
        country: 'Germany',
        postalCode: '87499',
      },
    ],
    personnel: [
      {
        name: 'Christoph Ostermann',
        title: 'CEO',
        linkedinUrl: 'https://www.linkedin.com/in/christoph-ostermann/',
        isActive: true,
        joinedDate: '2010-01',
      },
      {
        name: 'Philipp Schröder',
        title: 'Managing Director Sales & Marketing',
        linkedinUrl: 'https://www.linkedin.com/in/philipp-schroeder-sonnen/',
        isActive: true,
        joinedDate: '2014-01',
      },
      {
        name: 'Boris von Bormann',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/boris-von-bormann/',
        isActive: true,
        joinedDate: '2018-01',
      },
      {
        name: 'Torsten Stiefenhofer',
        title: 'CTO',
        linkedinUrl: 'https://www.linkedin.com/in/torsten-stiefenhofer/',
        isActive: true,
        joinedDate: '2016-01',
      },
      {
        name: 'Jean-Baptiste Cornefert',
        title: 'Managing Director Europe',
        linkedinUrl: 'https://www.linkedin.com/in/jean-baptiste-cornefert/',
        isActive: true,
        joinedDate: '2017-01',
      },
    ],
  },
};

async function main() {
  console.log('Adding final 2 brands to reach 100 total benchmark brands...\n');

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
  let totalErrors = 0;

  for (const [industry, brandData] of Object.entries(FINAL_BRANDS)) {
    console.log(`Processing industry: ${industry}`);
    console.log('='.repeat(60));

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
      totalErrors++;
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log('SUMMARY:');
  console.log(`✅ Inserted: ${totalInserted}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log('='.repeat(60));
  console.log('\n🎉🎉🎉 100 BENCHMARK BRANDS COMPLETE! 🎉🎉🎉');
  console.log('All 20 industries now have 5 brands each (3 gold + 2 silver)');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
