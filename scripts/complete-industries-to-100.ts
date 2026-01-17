import * as dotenv from 'dotenv';
import * as path from 'path';
import { db } from '@/lib/db';
import { brands, organizations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Load .env.local for database connection
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MISSING_BRANDS = {
  'SaaS / B2B Software': {
    name: 'HubSpot',
    domain: 'hubspot.com',
    tagline: 'Grow better with HubSpot',
    description: 'HubSpot is a CRM platform with marketing, sales, service, and content management software.',
    logoUrl: 'https://logo.clearbit.com/hubspot.com',
    industry: 'SaaS / B2B Software',
    keywords: ['hubspot', 'crm', 'marketing automation', 'sales'],
    seoKeywords: ['crm software', 'marketing automation', 'sales software', 'inbound marketing', 'email marketing'],
    geoKeywords: ['hubspot crm', 'hubspot pricing', 'hubspot alternatives'],
    competitors: [
      { name: 'Salesforce', url: 'salesforce.com', reason: 'CRM competitor' },
      { name: 'Marketo', url: 'marketo.com', reason: 'Marketing automation competitor' },
      { name: 'Pardot', url: 'pardot.com', reason: 'B2B marketing competitor' },
      { name: 'ActiveCampaign', url: 'activecampaign.com', reason: 'Marketing automation competitor' },
      { name: 'Pipedrive', url: 'pipedrive.com', reason: 'Sales CRM competitor' },
    ],
    valuePropositions: ['All-in-one platform', 'Inbound methodology', 'Free CRM', 'Easy to use'],
    socialLinks: {
      twitter: 'https://twitter.com/HubSpot',
      linkedin: 'https://www.linkedin.com/company/hubspot',
      facebook: 'https://www.facebook.com/HubSpot',
      instagram: 'https://www.instagram.com/hubspot',
      youtube: 'https://www.youtube.com/user/HubSpot',
    },
    voice: {
      tone: 'helpful' as const,
      personality: ['friendly', 'educational', 'growth-focused', 'customer-centric'],
      targetAudience: 'Small to mid-size businesses seeking integrated marketing and sales tools',
      keyMessages: ['Grow better', 'Inbound marketing', 'All-in-one platform', 'Customer first'],
      avoidTopics: [],
    },
    visual: {
      primaryColor: '#FF7A59',
      secondaryColor: '#2E475D',
      accentColor: '#FFFFFF',
      colorPalette: ['#FF7A59', '#2E475D', '#FFFFFF', '#FF5C35'],
      fontFamily: 'Avenir Next',
    },
    benchmarkTier: 'silver' as const,
    locations: [
      {
        type: 'headquarters' as const,
        address: '25 First Street',
        city: 'Cambridge',
        state: 'MA',
        country: 'USA',
        postalCode: '02141',
      },
    ],
    personnel: [
      {
        name: 'Yamini Rangan',
        title: 'CEO',
        linkedinUrl: 'https://www.linkedin.com/in/yamanirangan/',
        isActive: true,
        joinedDate: '2020-09',
      },
      {
        name: 'Kate Bueker',
        title: 'Chief Financial Officer',
        linkedinUrl: 'https://www.linkedin.com/in/kate-bueker/',
        isActive: true,
        joinedDate: '2021-01',
      },
      {
        name: 'Andy Pitre',
        title: 'Chief Product Officer',
        linkedinUrl: 'https://www.linkedin.com/in/andypitre/',
        isActive: true,
        joinedDate: '2019-01',
      },
      {
        name: 'Kipp Bodnar',
        title: 'Chief Marketing Officer',
        linkedinUrl: 'https://www.linkedin.com/in/kippbodnar/',
        isActive: true,
        joinedDate: '2012-01',
      },
      {
        name: 'Dharmesh Shah',
        title: 'Co-Founder & CTO',
        linkedinUrl: 'https://www.linkedin.com/in/dharmesh/',
        isActive: true,
        joinedDate: '2006-01',
      },
    ],
  },
  'Beauty / Cosmetics': {
    name: 'Ulta Beauty',
    domain: 'ulta.com',
    tagline: 'All Things Beauty, All in One Place',
    description: 'Ulta Beauty is the largest beauty retailer in the US, offering cosmetics, skincare, haircare, and salon services.',
    logoUrl: 'https://logo.clearbit.com/ulta.com',
    industry: 'Beauty / Cosmetics',
    keywords: ['ulta', 'beauty', 'cosmetics', 'salon'],
    seoKeywords: ['beauty store', 'makeup', 'skincare', 'hair salon', 'beauty products'],
    geoKeywords: ['ulta near me', 'ulta store', 'ulta salon'],
    competitors: [
      { name: 'Sephora', url: 'sephora.com', reason: 'Beauty retail competitor' },
      { name: 'Sally Beauty', url: 'sallybeauty.com', reason: 'Beauty supply competitor' },
      { name: 'Blue Mercury', url: 'bluemercury.com', reason: 'Premium beauty retailer' },
      { name: 'Dermstore', url: 'dermstore.com', reason: 'Online beauty competitor' },
      { name: 'Beautylish', url: 'beautylish.com', reason: 'Online cosmetics competitor' },
    ],
    valuePropositions: ['Wide selection', 'Drugstore to prestige', 'Full-service salon', 'Rewards program'],
    socialLinks: {
      twitter: 'https://twitter.com/Ulta',
      linkedin: 'https://www.linkedin.com/company/ulta-beauty',
      facebook: 'https://www.facebook.com/UltaBeauty',
      instagram: 'https://www.instagram.com/ultabeauty',
      youtube: 'https://www.youtube.com/user/UltaBeautyInc',
    },
    voice: {
      tone: 'enthusiastic' as const,
      personality: ['inclusive', 'beauty-obsessed', 'empowering', 'fun'],
      targetAudience: 'Beauty enthusiasts of all types seeking variety and value',
      keyMessages: ['All things beauty', 'All in one place', 'Beauty for all', 'Discover your beauty'],
      avoidTopics: [],
    },
    visual: {
      primaryColor: '#E91E63',
      secondaryColor: '#000000',
      accentColor: '#FFFFFF',
      colorPalette: ['#E91E63', '#000000', '#FFFFFF', '#C2185B'],
      fontFamily: 'Montserrat',
    },
    benchmarkTier: 'silver' as const,
    locations: [
      {
        type: 'headquarters' as const,
        address: '1000 Remington Blvd, Suite 120',
        city: 'Bolingbrook',
        state: 'IL',
        country: 'USA',
        postalCode: '60440',
      },
    ],
    personnel: [
      {
        name: 'Dave Kimbell',
        title: 'CEO',
        linkedinUrl: 'https://www.linkedin.com/in/dave-kimbell/',
        isActive: true,
        joinedDate: '2021-06',
      },
      {
        name: 'Scott Settersten',
        title: 'Chief Financial Officer',
        linkedinUrl: 'https://www.linkedin.com/in/scott-settersten/',
        isActive: true,
        joinedDate: '2014-09',
      },
      {
        name: 'Kecia Steelman',
        title: 'Chief Store Operations Officer',
        linkedinUrl: 'https://www.linkedin.com/in/kecia-steelman/',
        isActive: true,
        joinedDate: '2020-01',
      },
      {
        name: 'Prama Bhatt',
        title: 'Chief Digital Officer',
        linkedinUrl: 'https://www.linkedin.com/in/pramabhatt/',
        isActive: true,
        joinedDate: '2019-01',
      },
      {
        name: 'Shelley Haus',
        title: 'Chief Merchandising Officer',
        linkedinUrl: 'https://www.linkedin.com/in/shelley-haus/',
        isActive: true,
        joinedDate: '2018-01',
      },
    ],
  },
  'Sports & Fitness': {
    name: 'Whoop',
    domain: 'whoop.com',
    tagline: 'Unlock human performance',
    description: 'WHOOP is a wearable fitness tracker focused on recovery, strain, and sleep optimization for athletes.',
    logoUrl: 'https://logo.clearbit.com/whoop.com',
    industry: 'Sports & Fitness',
    keywords: ['whoop', 'fitness tracker', 'recovery', 'wearable'],
    seoKeywords: ['whoop band', 'fitness recovery', 'sleep tracking', 'athletic performance', 'hrv monitor'],
    geoKeywords: ['whoop membership', 'whoop 4.0', 'whoop subscription'],
    competitors: [
      { name: 'Oura Ring', url: 'ouraring.com', reason: 'Recovery tracking competitor' },
      { name: 'Fitbit', url: 'fitbit.com', reason: 'Fitness wearable competitor' },
      { name: 'Apple Watch', url: 'apple.com', reason: 'Smartwatch competitor' },
      { name: 'Garmin', url: 'garmin.com', reason: 'Fitness tracker competitor' },
      { name: 'Polar', url: 'polar.com', reason: 'Athletic tracking competitor' },
    ],
    valuePropositions: ['Recovery insights', 'Strain tracking', 'Sleep optimization', 'Membership model'],
    socialLinks: {
      twitter: 'https://twitter.com/whoop',
      linkedin: 'https://www.linkedin.com/company/whoop',
      facebook: 'https://www.facebook.com/WHOOP',
      instagram: 'https://www.instagram.com/whoop',
      youtube: 'https://www.youtube.com/c/WHOOP',
    },
    voice: {
      tone: 'performance-driven' as const,
      personality: ['data-driven', 'elite', 'science-backed', 'motivational'],
      targetAudience: 'Serious athletes and performance-focused individuals',
      keyMessages: ['Unlock performance', 'Recovery first', 'Data-driven insights', 'Elite performance'],
      avoidTopics: [],
    },
    visual: {
      primaryColor: '#000000',
      secondaryColor: '#00D1FF',
      accentColor: '#FFFFFF',
      colorPalette: ['#000000', '#00D1FF', '#FFFFFF', '#00A8CC'],
      fontFamily: 'Proxima Nova',
    },
    benchmarkTier: 'silver' as const,
    locations: [
      {
        type: 'headquarters' as const,
        address: '1325 Boylston Street',
        city: 'Boston',
        state: 'MA',
        country: 'USA',
        postalCode: '02215',
      },
    ],
    personnel: [
      {
        name: 'Will Ahmed',
        title: 'Founder & CEO',
        linkedinUrl: 'https://www.linkedin.com/in/will-ahmed/',
        isActive: true,
        joinedDate: '2012-01',
      },
      {
        name: 'Emily Capodilupo',
        title: 'VP of Data Science & Research',
        linkedinUrl: 'https://www.linkedin.com/in/emilycap/',
        isActive: true,
        joinedDate: '2014-01',
      },
      {
        name: 'Kristen Holmes',
        title: 'VP of Performance Science',
        linkedinUrl: 'https://www.linkedin.com/in/kristen-holmes-whoop/',
        isActive: true,
        joinedDate: '2016-01',
      },
      {
        name: 'John Capodilupo',
        title: 'Co-Founder & CTO',
        linkedinUrl: 'https://www.linkedin.com/in/john-capodilupo/',
        isActive: true,
        joinedDate: '2012-01',
      },
      {
        name: 'Jaime Waydo',
        title: 'VP of Hardware Engineering',
        linkedinUrl: 'https://www.linkedin.com/in/jaime-waydo/',
        isActive: true,
        joinedDate: '2020-01',
      },
    ],
  },
  'Energy / Sustainability': {
    name: 'Rivian',
    domain: 'rivian.com',
    tagline: 'Keep the world adventurous forever',
    description: 'Rivian is an electric vehicle manufacturer focused on adventure-ready trucks and SUVs with sustainable technology.',
    logoUrl: 'https://logo.clearbit.com/rivian.com',
    industry: 'Energy / Sustainability',
    keywords: ['rivian', 'electric vehicle', 'ev truck', 'sustainable'],
    seoKeywords: ['electric truck', 'ev suv', 'electric adventure vehicle', 'sustainable vehicles', 'zero emissions'],
    geoKeywords: ['rivian r1t', 'rivian r1s', 'rivian dealership'],
    competitors: [
      { name: 'Tesla', url: 'tesla.com', reason: 'Electric vehicle competitor' },
      { name: 'Ford F-150 Lightning', url: 'ford.com', reason: 'Electric truck competitor' },
      { name: 'Lucid Motors', url: 'lucidmotors.com', reason: 'Luxury EV competitor' },
      { name: 'General Motors', url: 'gm.com', reason: 'Electric vehicle competitor' },
      { name: 'Polestar', url: 'polestar.com', reason: 'Performance EV competitor' },
    ],
    valuePropositions: ['Adventure-ready EVs', 'Innovative technology', 'Sustainable manufacturing', 'Off-road capable'],
    socialLinks: {
      twitter: 'https://twitter.com/Rivian',
      linkedin: 'https://www.linkedin.com/company/rivian',
      facebook: 'https://www.facebook.com/Rivian',
      instagram: 'https://www.instagram.com/rivian',
      youtube: 'https://www.youtube.com/c/Rivian',
    },
    voice: {
      tone: 'adventurous' as const,
      personality: ['innovative', 'sustainable', 'rugged', 'forward-thinking'],
      targetAudience: 'Adventure seekers and outdoor enthusiasts wanting sustainable transportation',
      keyMessages: ['Keep the world adventurous', 'Electric adventure', 'Sustainable exploration', 'Forever is now'],
      avoidTopics: [],
    },
    visual: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#00D4B4',
      accentColor: '#FFFFFF',
      colorPalette: ['#1E3A8A', '#00D4B4', '#FFFFFF', '#1E40AF'],
      fontFamily: 'Gotham',
    },
    benchmarkTier: 'silver' as const,
    locations: [
      {
        type: 'headquarters' as const,
        address: '14600 Myford Road',
        city: 'Irvine',
        state: 'CA',
        country: 'USA',
        postalCode: '92606',
      },
    ],
    personnel: [
      {
        name: 'RJ Scaringe',
        title: 'Founder & CEO',
        linkedinUrl: 'https://www.linkedin.com/in/rjscaringe/',
        isActive: true,
        joinedDate: '2009-01',
      },
      {
        name: 'Claire McDonough',
        title: 'Chief Financial Officer',
        linkedinUrl: 'https://www.linkedin.com/in/claire-mcdonough/',
        isActive: true,
        joinedDate: '2021-01',
      },
      {
        name: 'Frank Klein',
        title: 'Chief Operating Officer',
        linkedinUrl: 'https://www.linkedin.com/in/frank-klein-rivian/',
        isActive: true,
        joinedDate: '2020-01',
      },
      {
        name: 'Kjell Gruner',
        title: 'President & Chief Commercial Officer',
        linkedinUrl: 'https://www.linkedin.com/in/kjell-gruner/',
        isActive: true,
        joinedDate: '2022-01',
      },
      {
        name: 'Angie Nucci',
        title: 'VP of People',
        linkedinUrl: 'https://www.linkedin.com/in/angie-nucci/',
        isActive: true,
        joinedDate: '2020-01',
      },
    ],
  },
};

async function main() {
  console.log('Completing industries to 100 total benchmark brands...\n');

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

  for (const [industry, brandData] of Object.entries(MISSING_BRANDS)) {
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
  console.log('\n🎉 All industries should now have 5 brands each!');
  console.log('Run count-brands.ts to verify 100 total brands.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
