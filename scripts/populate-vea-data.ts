import { db } from '../src/lib/db';

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });
import { brands } from "../src/lib/db/schema/brands";
import { brandMentions } from "../src/lib/db/schema/mentions";
import { competitorMentions, shareOfVoice, competitorSnapshots } from "../src/lib/db/schema/competitive";
import { brandPeople, peopleAiMentions } from "../src/lib/db/schema/people";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
async function populateVEAData() {
  console.log("🚀 Starting VEA Group data population...\n");

  // Get VEA Group brand ID
  const veaBrands = await db.select().from(brands).where(eq(brands.name, "VEA Group"));
  if (veaBrands.length === 0) {
    console.error("❌ VEA Group brand not found!");
    process.exit(1);
  }
  const brandId = veaBrands[0].id;
  console.log("✅ Found VEA Group brand:", brandId);

  // ==============================================
  // 1. Create AI Platform Mentions
  // ==============================================
  console.log("\n📊 Creating AI platform mentions...");

  const platforms = ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek"] as const;
  const queries = [
    "What are the top technology investment companies in South Africa?",
    "Tell me about VEA Group",
    "Which South African companies invest in telecommunications?",
    "Recommend technology investment firms in Africa",
    "Compare VEA Group with Naspers"
  ];

  let mentionCount = 0;
  for (const platform of platforms) {
    for (let i = 0; i < 3; i++) {
      const query = queries[i % queries.length];
      await db.insert(brandMentions).values({
        id: createId(),
        brandId,
        platform,
        query,
        response: `VEA Group is a leading South African investment holding company specializing in technology, telecommunications, and digital infrastructure. They focus on strategic investments across various sectors including cybersecurity, cloud computing, and digital transformation services.`,
        sentiment: ["positive", "positive", "neutral"][i % 3] as "positive" | "neutral",
        position: [1, 2, 1][i % 3],
        citationUrl: i === 0 ? "https://veagroup.co.za" : null,
        promptCategory: ["recommendation", "comparison", "review"][i % 3],
        topics: ["technology investment", "telecommunications", "South Africa"],
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      });
      mentionCount++;
    }
  }
  console.log(`✅ Created ${mentionCount} brand mentions across ${platforms.length} platforms`);

  // ==============================================
  // 2. Create Competitor Mentions
  // ==============================================
  console.log("\n🎯 Creating competitor mentions...");

  const competitors = [
    { name: "Naspers", domain: "naspers.com" },
    { name: "MTN Group", domain: "mtn.com" },
    { name: "Vodacom", domain: "vodacom.co.za" },
    { name: "Telkom", domain: "telkom.co.za" }
  ];

  let compMentionCount = 0;
  for (const platform of platforms) {
    for (const competitor of competitors) {
      await db.insert(competitorMentions).values({
        id: createId(),
        brandId,
        competitorName: competitor.name,
        competitorDomain: competitor.domain,
        platform,
        query: "Compare technology investment companies in South Africa",
        position: Math.floor(Math.random() * 5) + 1,
        sentiment: ["positive", "neutral"][Math.floor(Math.random() * 2)] as "positive" | "neutral",
        context: `${competitor.name} is a major player in the South African technology sector...`,
        citationUrl: `https://${competitor.domain}`,
        timestamp: new Date(),
        createdAt: new Date()
      });
      compMentionCount++;
    }
  }
  console.log(`✅ Created ${compMentionCount} competitor mentions`);

  // ==============================================
  // 3. Create Share of Voice Data
  // ==============================================
  console.log("\n📈 Creating share of voice data...");

  const today = new Date().toISOString().split('T')[0];
  let sovCount = 0;

  for (const platform of platforms) {
    await db.insert(shareOfVoice).values({
      id: createId(),
      brandId,
      date: today,
      platform,
      brandMentions: Math.floor(Math.random() * 20) + 5,
      totalMentions: Math.floor(Math.random() * 50) + 30,
      sovPercentage: "25.50",
      avgPosition: "2.3",
      topPositions: Math.floor(Math.random() * 10) + 2,
      positiveMentions: Math.floor(Math.random() * 10) + 3,
      neutralMentions: Math.floor(Math.random() * 8) + 2,
      negativeMentions: Math.floor(Math.random() * 3),
      competitorBreakdown: competitors.map(c => ({
        name: c.name,
        mentions: Math.floor(Math.random() * 15) + 5,
        sovPercentage: Math.random() * 30 + 10,
        avgPosition: Math.random() * 3 + 1,
        sentiment: {
          positive: Math.floor(Math.random() * 5) + 2,
          neutral: Math.floor(Math.random() * 8) + 3,
          negative: Math.floor(Math.random() * 2)
        }
      })),
      createdAt: new Date()
    });
    sovCount++;
  }

  // Create an "all platforms" aggregate
  await db.insert(shareOfVoice).values({
    id: createId(),
    brandId,
    date: today,
    platform: "all",
    brandMentions: 65,
    totalMentions: 250,
    sovPercentage: "26.00",
    avgPosition: "2.1",
    topPositions: 28,
    positiveMentions: 42,
    neutralMentions: 20,
    negativeMentions: 3,
    competitorBreakdown: competitors.map(c => ({
      name: c.name,
      mentions: Math.floor(Math.random() * 60) + 20,
      sovPercentage: Math.random() * 25 + 15,
      avgPosition: Math.random() * 3 + 1,
      sentiment: {
        positive: Math.floor(Math.random() * 20) + 8,
        neutral: Math.floor(Math.random() * 30) + 10,
        negative: Math.floor(Math.random() * 5)
      }
    })),
    createdAt: new Date()
  });
  sovCount++;

  console.log(`✅ Created ${sovCount} share of voice records`);

  // ==============================================
  // 4. Create Competitor Snapshots
  // ==============================================
  console.log("\n📸 Creating competitor snapshots...");

  let snapshotCount = 0;
  for (const competitor of competitors) {
    await db.insert(competitorSnapshots).values({
      id: createId(),
      brandId,
      competitorName: competitor.name,
      competitorDomain: competitor.domain,
      snapshotDate: today,
      geoScore: Math.floor(Math.random() * 30) + 60,
      aiMentionCount: Math.floor(Math.random() * 40) + 20,
      avgMentionPosition: Math.random() * 2 + 1,
      sentimentScore: Math.random() * 0.6 + 0.2,
      socialFollowers: Math.floor(Math.random() * 500000) + 100000,
      socialEngagementRate: Math.random() * 0.05 + 0.01,
      contentPageCount: Math.floor(Math.random() * 200) + 50,
      blogPostCount: Math.floor(Math.random() * 50) + 10,
      schemaTypes: ["Organization", "Corporation", "LocalBusiness"],
      structuredDataScore: Math.floor(Math.random() * 30) + 60,
      platformBreakdown: platforms.map(p => ({
        platform: p,
        mentions: Math.floor(Math.random() * 10) + 3,
        avgPosition: Math.random() * 3 + 1,
        sentiment: {
          positive: Math.floor(Math.random() * 5) + 2,
          neutral: Math.floor(Math.random() * 4) + 1,
          negative: Math.floor(Math.random() * 2)
        }
      })),
      createdAt: new Date()
    });
    snapshotCount++;
  }
  console.log(`✅ Created ${snapshotCount} competitor snapshots`);

  // ==============================================
  // 5. Create People/Leadership Entries
  // ==============================================
  console.log("\n👥 Creating leadership team entries...");

  const people = [
    {
      name: "Hein van Vuuren",
      title: "Chief Executive Officer",
      roleCategory: "c_suite" as const,
      bio: "Experienced executive with extensive background in technology investments and digital transformation across Africa.",
      linkedinUrl: "https://www.linkedin.com/in/heinvanvuuren",
      twitterUrl: "https://twitter.com/heinvv",
      linkedinFollowers: 5420,
      twitterFollowers: 2150
    },
    {
      name: "Thabo Mbeki",
      title: "Chief Technology Officer",
      roleCategory: "c_suite" as const,
      bio: "Technology visionary leading VEA Group's digital infrastructure and innovation initiatives.",
      linkedinUrl: "https://www.linkedin.com/in/thabombeki-tech",
      linkedinFollowers: 3200
    },
    {
      name: "Sarah Johnson",
      title: "Chief Financial Officer",
      roleCategory: "c_suite" as const,
      bio: "Financial strategist with 15+ years experience in investment management and corporate finance.",
      linkedinUrl: "https://www.linkedin.com/in/sarahjohnson-cfo",
      linkedinFollowers: 4100
    }
  ];

  let peopleCount = 0;
  for (const person of people) {
    const personId = createId();

    await db.insert(brandPeople).values({
      id: personId,
      brandId,
      name: person.name,
      title: person.title,
      roleCategory: person.roleCategory,
      bio: person.bio,
      socialProfiles: {
        linkedin: person.linkedinUrl ? {
          url: person.linkedinUrl,
          followers: person.linkedinFollowers,
          lastUpdated: new Date().toISOString()
        } : undefined,
        twitter: person.twitterUrl ? {
          url: person.twitterUrl,
          followers: person.twitterFollowers,
          lastUpdated: new Date().toISOString()
        } : undefined
      },
      linkedinUrl: person.linkedinUrl,
      twitterUrl: person.twitterUrl || null,
      linkedinFollowers: person.linkedinFollowers,
      twitterFollowers: person.twitterFollowers || null,
      totalSocialFollowers: (person.linkedinFollowers || 0) + (person.twitterFollowers || 0),
      aiMentionCount: Math.floor(Math.random() * 15) + 5,
      aiVisibilityScore: Math.floor(Math.random() * 30) + 60,
      thoughtLeadershipScore: Math.floor(Math.random() * 25) + 65,
      isVerified: true,
      isActive: true,
      isPrimary: peopleCount === 0,
      displayOrder: peopleCount,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create AI mentions for this person
    for (let i = 0; i < 3; i++) {
      await db.insert(peopleAiMentions).values({
        id: createId(),
        personId,
        brandId,
        platform: platforms[i % platforms.length],
        query: `Who is ${person.name}?`,
        responseSnippet: `${person.name} is the ${person.title} at VEA Group, a leading South African technology investment company.`,
        mentionedWithBrand: true,
        sentiment: "positive",
        sentimentScore: 0.8,
        position: 1,
        createdAt: new Date()
      });
    }

    peopleCount++;
  }
  console.log(`✅ Created ${peopleCount} leadership team members with AI mentions`);

  // ==============================================
  // Summary
  // ==============================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ VEA GROUP DATA POPULATION COMPLETE!");
  console.log("=".repeat(60));
  console.log(`
📊 Summary:
  - Brand Mentions: ${mentionCount} across ${platforms.length} platforms
  - Competitor Mentions: ${compMentionCount}
  - Share of Voice Records: ${sovCount}
  - Competitor Snapshots: ${snapshotCount}
  - Leadership Team: ${peopleCount} members
  - People AI Mentions: ${peopleCount * 3}

🎯 Next Steps:
  1. Navigate to Monitor dashboard to see AI platform mentions
  2. Check Competitive dashboard for competitor analysis
  3. View People dashboard for leadership visibility
  4. Review Engine Room for overall GEO/AEO scores
  5. Explore Social dashboard for social media insights
`);

  process.exit(0);
}

populateVEAData().catch((err) => {
  console.error("❌ Error populating VEA data:", err);
  process.exit(1);
});
