/**
 * Quick Brand Population - SaaS Industry
 * Populates 5 SaaS brands with manually curated data
 */

import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { organizations } from '@/lib/db/schema/organizations';
import { eq } from 'drizzle-orm';

const BENCHMARK_ORG_ID = 'org_benchmark_brands';

// SaaS brands with manually curated data
const saasBrands = [
  {
    name: 'HubSpot',
    domain: 'hubspot.com',
    tagline: 'Grow better with HubSpot',
    description: 'HubSpot is an AI-powered customer platform with all the software, integrations, and resources you need to connect your marketing, sales, and customer service.',
    logoUrl: 'https://logo.clearbit.com/hubspot.com',
    industry: 'SaaS / B2B Software',
    keywords: ['hubspot', 'crm', 'marketing automation'],
    seoKeywords: ['inbound marketing', 'sales software', 'customer service platform', 'marketing automation', 'crm software'],
    geoKeywords: ['what is hubspot', 'how does hubspot work', 'best crm for small business', 'marketing automation tools'],
    competitors: [
      { name: 'Salesforce', url: 'salesforce.com', reason: 'Direct competitor in CRM and sales automation space' },
      { name: 'Monday.com', url: 'monday.com', reason: 'Competes in project management and CRM' },
      { name: 'Zoho CRM', url: 'zoho.com/crm', reason: 'Alternative CRM platform for SMBs' },
      { name: 'Pipedrive', url: 'pipedrive.com', reason: 'Focused CRM for sales teams' },
      { name: 'ActiveCampaign', url: 'activecampaign.com', reason: 'Competes in marketing automation' },
    ],
    valuePropositions: [
      'All-in-one platform for marketing, sales, and customer service',
      'Free CRM with unlimited users',
      'Easy to use with powerful automation',
      'Extensive integrations and marketplace',
    ],
    socialLinks: {
      twitter: 'https://twitter.com/hubspot',
      linkedin: 'https://linkedin.com/company/hubspot',
      facebook: 'https://facebook.com/hubspot',
      instagram: 'https://instagram.com/hubspot',
      youtube: 'https://youtube.com/user/hubspot',
    },
    voice: {
      tone: 'friendly' as const,
      personality: ['helpful', 'innovative', 'growth-minded', 'approachable'],
      targetAudience: 'Small to enterprise businesses looking to grow through inbound marketing',
      keyMessages: ['Grow better', 'Inbound marketing', 'Customer-first', 'Easy to use'],
      avoidTopics: [],
    },
    visual: {
      primaryColor: '#FF7A59',
      secondaryColor: '#33475B',
      accentColor: '#00A4BD',
      colorPalette: ['#FF7A59', '#33475B', '#00A4BD'],
      fontFamily: 'Lexend Deca',
    },
    benchmarkTier: 'gold' as const,
  },

  {
    name: 'Salesforce',
    domain: 'salesforce.com',
    tagline: 'Customer 360 - The world\'s #1 CRM',
    description: 'Salesforce brings companies and customers together with AI, Data, and CRM to grow relationships, increase productivity, and lower costs.',
    logoUrl: 'https://logo.clearbit.com/salesforce.com',
    industry: 'SaaS / B2B Software',
    keywords: ['salesforce', 'crm', 'customer 360'],
    seoKeywords: ['enterprise crm', 'sales cloud', 'service cloud', 'marketing cloud', 'customer data platform'],
    geoKeywords: ['what is salesforce', 'how to use salesforce', 'best enterprise crm', 'salesforce vs hubspot'],
    competitors: [
      { name: 'HubSpot', url: 'hubspot.com', reason: 'Competing CRM and marketing automation platform' },
      { name: 'Microsoft Dynamics', url: 'microsoft.com/dynamics-365', reason: 'Enterprise CRM competitor' },
      { name: 'Oracle CX', url: 'oracle.com/cx', reason: 'Enterprise customer experience platform' },
      { name: 'SAP Customer Experience', url: 'sap.com/products/crm', reason: 'Enterprise CRM solution' },
      { name: 'Zoho CRM', url: 'zoho.com/crm', reason: 'Alternative CRM for SMBs and enterprises' },
    ],
    valuePropositions: [
      'World\'s #1 CRM platform',
      'Complete customer 360 view',
      'AI-powered with Einstein',
      'Highly customizable and scalable',
    ],
    socialLinks: {
      twitter: 'https://twitter.com/salesforce',
      linkedin: 'https://linkedin.com/company/salesforce',
      facebook: 'https://facebook.com/salesforce',
      instagram: 'https://instagram.com/salesforce',
      youtube: 'https://youtube.com/user/salesforce',
    },
    voice: {
      tone: 'professional' as const,
      personality: ['innovative', 'trustworthy', 'enterprise-grade', 'customer-focused'],
      targetAudience: 'Enterprise businesses seeking comprehensive CRM and customer experience solutions',
      keyMessages: ['Customer success', 'Innovation', 'Trailblazer community', 'Customer 360'],
      avoidTopics: [],
    },
    visual: {
      primaryColor: '#00A1E0',
      secondaryColor: '#032D60',
      accentColor: '#FF538A',
      colorPalette: ['#00A1E0', '#032D60', '#FF538A'],
      fontFamily: 'Salesforce Sans',
    },
    benchmarkTier: 'gold' as const,
  },

  {
    name: 'Slack',
    domain: 'slack.com',
    tagline: 'Where work happens',
    description: 'Slack is a productivity platform that brings all your communication together in one place, making it easier to stay organized and get work done.',
    logoUrl: 'https://logo.clearbit.com/slack.com',
    industry: 'SaaS / B2B Software',
    keywords: ['slack', 'team communication', 'collaboration'],
    seoKeywords: ['team messaging', 'workplace communication', 'collaboration platform', 'chat software', 'remote work tools'],
    geoKeywords: ['what is slack', 'how to use slack for teams', 'best team communication app', 'slack vs microsoft teams'],
    competitors: [
      { name: 'Microsoft Teams', url: 'microsoft.com/microsoft-teams', reason: 'Direct competitor in team collaboration' },
      { name: 'Discord', url: 'discord.com', reason: 'Growing in workplace communication' },
      { name: 'Zoom Team Chat', url: 'zoom.us/team-chat', reason: 'Bundled with Zoom meetings' },
      { name: 'Google Chat', url: 'chat.google.com', reason: 'Part of Google Workspace' },
      { name: 'Mattermost', url: 'mattermost.com', reason: 'Open-source alternative' },
    ],
    valuePropositions: [
      'Centralized team communication',
      'Thousands of app integrations',
      'Channels for organized conversations',
      'Powerful search and archive',
    ],
    socialLinks: {
      twitter: 'https://twitter.com/slackhq',
      linkedin: 'https://linkedin.com/company/tiny-spec-inc',
      facebook: 'https://facebook.com/slackhq',
      instagram: 'https://instagram.com/slackhq',
      youtube: 'https://youtube.com/c/slackhq',
    },
    voice: {
      tone: 'friendly' as const,
      personality: ['playful', 'efficient', 'collaborative', 'modern'],
      targetAudience: 'Teams and organizations of all sizes looking for better workplace communication',
      keyMessages: ['Where work happens', 'Collaboration', 'Productivity', 'Integration'],
      avoidTopics: [],
    },
    visual: {
      primaryColor: '#611F69',
      secondaryColor: '#ECB22E',
      accentColor: '#2EB67D',
      colorPalette: ['#611F69', '#ECB22E', '#2EB67D', '#E01E5A'],
      fontFamily: 'Slack Circular',
    },
    benchmarkTier: 'gold' as const,
  },

  {
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
  },

  {
    name: 'Airtable',
    domain: 'airtable.com',
    tagline: 'The app platform that empowers anyone',
    description: 'Airtable is a low-code platform that brings together the flexibility of a spreadsheet with the power of a database and app-building capabilities.',
    logoUrl: 'https://logo.clearbit.com/airtable.com',
    industry: 'SaaS / B2B Software',
    keywords: ['airtable', 'database', 'spreadsheet'],
    seoKeywords: ['low-code platform', 'collaborative database', 'project tracking', 'workflow automation', 'no-code tools'],
    geoKeywords: ['what is airtable', 'how to use airtable', 'airtable vs excel', 'best database for teams'],
    competitors: [
      { name: 'Monday.com', url: 'monday.com', reason: 'Work management platform competitor' },
      { name: 'Smartsheet', url: 'smartsheet.com', reason: 'Spreadsheet-based project management' },
      { name: 'Notion', url: 'notion.so', reason: 'Competes in flexible workspace/database space' },
      { name: 'Asana', url: 'asana.com', reason: 'Project management competitor' },
      { name: 'Coda', url: 'coda.io', reason: 'Document-database hybrid platform' },
    ],
    valuePropositions: [
      'Combines spreadsheet ease with database power',
      'Low-code/no-code app building',
      'Flexible views (grid, calendar, kanban, gallery)',
      'Powerful automation and integrations',
    ],
    socialLinks: {
      twitter: 'https://twitter.com/airtable',
      linkedin: 'https://linkedin.com/company/airtable-com',
      facebook: 'https://facebook.com/airtable',
      instagram: 'https://instagram.com/airtable',
      youtube: 'https://youtube.com/c/airtable',
    },
    voice: {
      tone: 'friendly' as const,
      personality: ['empowering', 'flexible', 'innovative', 'collaborative'],
      targetAudience: 'Teams and businesses needing flexible workflow and data management without coding',
      keyMessages: ['Empowering anyone to build', 'Flexible platform', 'No-code/low-code', 'Database meets spreadsheet'],
      avoidTopics: [],
    },
    visual: {
      primaryColor: '#FF0000',
      secondaryColor: '#FFC700',
      accentColor: '#00B3E6',
      colorPalette: ['#FF0000', '#FFC700', '#00B3E6'],
      fontFamily: 'Source Sans Pro',
    },
    benchmarkTier: 'silver' as const,
  },
];

async function main() {
  console.log('\n🚀 Populating SaaS Industry Benchmark Brands\n');

  // Step 1: Ensure benchmark organization exists
  console.log('Step 1: Checking benchmark organization...');
  let org = await db.query.organizations.findFirst({
    where: eq(organizations.id, BENCHMARK_ORG_ID),
  });

  if (!org) {
    console.log('Creating benchmark organization...');
    [org] = await db
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
    console.log(`✅ Created organization: ${org.id}\n`);
  } else {
    console.log(`✅ Organization exists: ${org.id}\n`);
  }

  // Step 2: Insert brands
  console.log('Step 2: Inserting brands...\n');
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const brandData of saasBrands) {
    try {
      console.log(`Processing: ${brandData.name}...`);

      // Check if brand already exists
      const existing = await db.query.brands.findFirst({
        where: eq(brands.domain, brandData.domain),
      });

      if (existing) {
        console.log(`  ⏭️  Already exists, skipping\n`);
        skipCount++;
        continue;
      }

      // Insert brand
      await db.insert(brands).values({
        organizationId: BENCHMARK_ORG_ID,
        ...brandData,
        isBenchmark: true,
        lastEnrichedAt: new Date(),
        monitoringEnabled: false,
        isActive: true,
      });

      console.log(`  ✅ Inserted successfully\n`);
      successCount++;

      // Small delay between inserts
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`  ❌ Error inserting ${brandData.name}:`, error);
      errorCount++;
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Successfully inserted: ${successCount}`);
  console.log(`⏭️  Skipped (already exist): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`Total: ${saasBrands.length}`);
  console.log(`${'='.repeat(60)}\n`);
}

main()
  .then(() => {
    console.log('✅ Population complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
