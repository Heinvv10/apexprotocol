/**
 * Seed Competitive Intelligence Data
 * Populates competitor mentions, share of voice, competitive gaps, alerts, and snapshots
 * for the demo brands created by seed.ts
 *
 * Usage: npx tsx scripts/seed-competitive.ts
 */

import { db, schema } from '../src/lib/db';

import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

config({ path: ".env.local" });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
// AI Platforms
const platforms = ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"] as const;
const sentiments = ["positive", "neutral", "negative"] as const;

// Helper to generate dates in the past N days
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Helper to get date string in YYYY-MM-DD format
function dateString(days: number): string {
  return daysAgo(days).toISOString().split("T")[0];
}

// Helper to pick random item from array
function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Random number in range
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Brand competitor configurations
const brandCompetitorMap: Record<string, { competitors: Array<{ name: string; domain: string }>; industry: string }> = {
  "TechFlow Solutions": {
    industry: "Technology",
    competitors: [
      { name: "Monday.com", domain: "monday.com" },
      { name: "Asana", domain: "asana.com" },
      { name: "Notion", domain: "notion.so" },
      { name: "ClickUp", domain: "clickup.com" },
      { name: "Trello", domain: "trello.com" },
    ],
  },
  "GreenLeaf Organics": {
    industry: "Food & Beverage",
    competitors: [
      { name: "HelloFresh", domain: "hellofresh.com" },
      { name: "Thrive Market", domain: "thrivemarket.com" },
      { name: "Imperfect Foods", domain: "imperfectfoods.com" },
      { name: "Blue Apron", domain: "blueapron.com" },
      { name: "Sun Basket", domain: "sunbasket.com" },
    ],
  },
  "FinanceHub Pro": {
    industry: "Financial Services",
    competitors: [
      { name: "Mint", domain: "mint.com" },
      { name: "Personal Capital", domain: "personalcapital.com" },
      { name: "Betterment", domain: "betterment.com" },
      { name: "YNAB", domain: "ynab.com" },
      { name: "Wealthfront", domain: "wealthfront.com" },
    ],
  },
};

// Generate competitor mentions
function generateCompetitorMentions(
  brandId: string,
  brandName: string
): schema.NewCompetitorMentionRecord[] {
  const mentions: schema.NewCompetitorMentionRecord[] = [];
  const config = brandCompetitorMap[brandName];

  if (!config) return mentions;

  // Queries for each industry
  const queries: Record<string, string[]> = {
    Technology: [
      "best project management software 2024",
      "top workflow automation tools",
      "compare team productivity platforms",
      "enterprise task management solutions",
      "agile project management apps",
    ],
    "Food & Beverage": [
      "best organic meal delivery services",
      "farm to table food subscription",
      "healthy meal kit comparison",
      "sustainable food delivery options",
      "organic grocery delivery near me",
    ],
    "Financial Services": [
      "best personal finance apps 2024",
      "AI investment advisors comparison",
      "top budgeting apps for beginners",
      "robo-advisor recommendations",
      "wealth management platforms",
    ],
  };

  const industryQueries = queries[config.industry] || queries.Technology;

  // Generate 50-80 competitor mentions spread over 30 days
  const mentionCount = randomInRange(50, 80);

  for (let i = 0; i < mentionCount; i++) {
    const competitor = randomItem(config.competitors);
    const platform = randomItem(platforms);
    const sentiment = randomItem(sentiments);
    const query = randomItem(industryQueries);
    const daysBack = randomInRange(0, 30);

    mentions.push({
      id: createId(),
      brandId,
      competitorName: competitor.name,
      competitorDomain: competitor.domain,
      platform,
      query,
      position: randomInRange(1, 8),
      sentiment,
      context: `${competitor.name} was mentioned as a ${sentiment === "positive" ? "recommended" : sentiment === "negative" ? "less favorable" : "viable"} option for ${query.split(" ").slice(0, 3).join(" ")}.`,
      citationUrl: Math.random() > 0.5 ? `https://${competitor.domain}/features` : null,
      timestamp: daysAgo(daysBack),
      createdAt: daysAgo(daysBack),
    });
  }

  return mentions;
}

// Generate Share of Voice data
function generateShareOfVoice(
  brandId: string,
  brandName: string
): schema.NewShareOfVoiceRecord[] {
  const sovRecords: schema.NewShareOfVoiceRecord[] = [];
  const config = brandCompetitorMap[brandName];

  if (!config) return sovRecords;

  // Generate SOV data for the past 30 days
  for (let day = 0; day <= 30; day += 7) {
    // Weekly snapshots
    const dateStr = dateString(day);

    // Per-platform SOV
    for (const platform of platforms) {
      const brandMentions = randomInRange(15, 40);
      const totalMentions = randomInRange(80, 150);
      const sovPercentage = ((brandMentions / totalMentions) * 100).toFixed(2);

      const competitorBreakdown: schema.CompetitorSOV[] = config.competitors.map((c) => {
        const mentions = randomInRange(5, 25);
        return {
          name: c.name,
          mentions,
          sovPercentage: Number(((mentions / totalMentions) * 100).toFixed(2)),
          avgPosition: Number((Math.random() * 4 + 1).toFixed(1)),
          sentiment: {
            positive: randomInRange(20, 50),
            neutral: randomInRange(30, 50),
            negative: randomInRange(5, 25),
          },
        };
      });

      sovRecords.push({
        id: createId(),
        brandId,
        date: dateStr,
        platform,
        brandMentions,
        totalMentions,
        sovPercentage,
        avgPosition: (Math.random() * 3 + 1).toFixed(2),
        topPositions: randomInRange(5, 15),
        positiveMentions: randomInRange(8, 20),
        neutralMentions: randomInRange(5, 15),
        negativeMentions: randomInRange(2, 8),
        competitorBreakdown,
        createdAt: daysAgo(day),
      });
    }

    // Aggregate "all" platform SOV
    const totalBrandMentions = randomInRange(100, 200);
    const totalAllMentions = randomInRange(500, 800);

    sovRecords.push({
      id: createId(),
      brandId,
      date: dateStr,
      platform: "all",
      brandMentions: totalBrandMentions,
      totalMentions: totalAllMentions,
      sovPercentage: ((totalBrandMentions / totalAllMentions) * 100).toFixed(2),
      avgPosition: (Math.random() * 2 + 1.5).toFixed(2),
      topPositions: randomInRange(30, 60),
      positiveMentions: randomInRange(40, 80),
      neutralMentions: randomInRange(30, 60),
      negativeMentions: randomInRange(10, 30),
      competitorBreakdown: config.competitors.map((c) => ({
        name: c.name,
        mentions: randomInRange(30, 100),
        sovPercentage: Number((Math.random() * 15 + 5).toFixed(2)),
        avgPosition: Number((Math.random() * 3 + 2).toFixed(1)),
        sentiment: {
          positive: randomInRange(20, 40),
          neutral: randomInRange(30, 50),
          negative: randomInRange(10, 30),
        },
      })),
      createdAt: daysAgo(day),
    });
  }

  return sovRecords;
}

// Generate competitive gaps
function generateCompetitiveGaps(
  brandId: string,
  brandName: string
): schema.NewCompetitiveGap[] {
  const gaps: schema.NewCompetitiveGap[] = [];
  const config = brandCompetitorMap[brandName];

  if (!config) return gaps;

  const gapTemplates = [
    {
      gapType: "keyword",
      topic: "Feature Comparison",
      description: "Competitor ranks higher for feature comparison queries",
      searchVolume: randomInRange(5000, 20000),
      difficulty: randomInRange(40, 70),
      opportunity: randomInRange(60, 90),
    },
    {
      gapType: "content",
      topic: "How-To Guides",
      description: "Competitor has comprehensive how-to content that gets cited",
      searchVolume: randomInRange(3000, 15000),
      difficulty: randomInRange(30, 60),
      opportunity: randomInRange(70, 95),
    },
    {
      gapType: "schema",
      topic: "FAQ Schema",
      description: "Competitor has FAQ schema implemented on key pages",
      searchVolume: randomInRange(2000, 10000),
      difficulty: randomInRange(20, 40),
      opportunity: randomInRange(80, 98),
    },
    {
      gapType: "topic",
      topic: "Industry Trends",
      description: "Competitor creates trend analysis content that AI platforms cite",
      searchVolume: randomInRange(1000, 8000),
      difficulty: randomInRange(50, 75),
      opportunity: randomInRange(50, 80),
    },
    {
      gapType: "keyword",
      topic: "Best Of Lists",
      description: "Competitor consistently appears in best-of roundups",
      searchVolume: randomInRange(8000, 30000),
      difficulty: randomInRange(60, 85),
      opportunity: randomInRange(40, 70),
    },
  ];

  // Create 8-12 gaps per brand
  const gapCount = randomInRange(8, 12);

  for (let i = 0; i < gapCount; i++) {
    const template = gapTemplates[i % gapTemplates.length];
    const competitor = randomItem(config.competitors);
    const daysBack = randomInRange(0, 14);

    gaps.push({
      id: createId(),
      brandId,
      gapType: template.gapType,
      keyword: `${config.industry.toLowerCase()} ${template.topic.toLowerCase()}`,
      topic: template.topic,
      description: `${template.description}. ${competitor.name} is outperforming in this area.`,
      competitorName: competitor.name,
      competitorPosition: randomInRange(1, 3),
      competitorUrl: `https://${competitor.domain}/resources`,
      searchVolume: template.searchVolume,
      difficulty: template.difficulty,
      opportunity: template.opportunity,
      isResolved: Math.random() > 0.8, // 20% resolved
      resolvedAt: Math.random() > 0.8 ? daysAgo(randomInRange(0, 5)) : null,
      discoveredAt: daysAgo(daysBack),
      createdAt: daysAgo(daysBack),
    });
  }

  return gaps;
}

// Generate competitive alerts
function generateCompetitiveAlerts(
  brandId: string,
  brandName: string
): schema.NewCompetitiveAlert[] {
  const alerts: schema.NewCompetitiveAlert[] = [];
  const config = brandCompetitorMap[brandName];

  if (!config) return alerts;

  const alertTemplates = [
    {
      alertType: "sov_drop",
      title: "Share of Voice Decreased",
      description: "Your share of voice on {{platform}} dropped by {{change}}% in the last 7 days",
      severity: "high",
    },
    {
      alertType: "competitor_gain",
      title: "Competitor Gaining Ground",
      description: "{{competitor}} increased their AI visibility by {{change}}% on {{platform}}",
      severity: "medium",
    },
    {
      alertType: "new_competitor",
      title: "New Competitor Detected",
      description: "{{competitor}} is now appearing in AI responses for your tracked keywords",
      severity: "medium",
    },
    {
      alertType: "position_loss",
      title: "Position Drop Alert",
      description: "Your average position on {{platform}} dropped from {{previous}} to {{current}}",
      severity: "high",
    },
    {
      alertType: "competitor_gain",
      title: "Competitor Featured Snippet Win",
      description: "{{competitor}} now owns the featured snippet for '{{keyword}}'",
      severity: "critical",
    },
  ];

  // Create 6-10 alerts per brand
  const alertCount = randomInRange(6, 10);

  for (let i = 0; i < alertCount; i++) {
    const template = alertTemplates[i % alertTemplates.length];
    const competitor = randomItem(config.competitors);
    const platform = randomItem(platforms);
    const daysBack = randomInRange(0, 14);
    const change = randomInRange(5, 25);
    const previousVal = randomInRange(20, 40);
    const currentVal = previousVal - change;

    let title = template.title;
    let description = template.description
      .replace("{{platform}}", platform)
      .replace("{{competitor}}", competitor.name)
      .replace("{{change}}", change.toString())
      .replace("{{previous}}", previousVal.toString())
      .replace("{{current}}", currentVal.toString())
      .replace("{{keyword}}", `best ${config.industry.toLowerCase()} tools`);

    alerts.push({
      id: createId(),
      brandId,
      alertType: template.alertType,
      title,
      description,
      severity: template.severity as "low" | "medium" | "high" | "critical",
      competitorName: competitor.name,
      platform,
      keyword: `${config.industry.toLowerCase()} software`,
      previousValue: previousVal.toString(),
      currentValue: currentVal.toString(),
      isRead: Math.random() > 0.6, // 40% unread
      isDismissed: Math.random() > 0.9, // 10% dismissed
      triggeredAt: daysAgo(daysBack),
      readAt: Math.random() > 0.6 ? daysAgo(randomInRange(0, daysBack)) : null,
      createdAt: daysAgo(daysBack),
    });
  }

  return alerts;
}

// Generate competitor snapshots
function generateCompetitorSnapshots(
  brandId: string,
  brandName: string
): schema.NewCompetitorSnapshot[] {
  const snapshots: schema.NewCompetitorSnapshot[] = [];
  const config = brandCompetitorMap[brandName];

  if (!config) return snapshots;

  // Generate snapshots for past 4 weeks
  for (let week = 0; week < 4; week++) {
    const dateStr = dateString(week * 7);

    for (const competitor of config.competitors) {
      const geoScore = randomInRange(55, 85);
      const mentionCount = randomInRange(30, 80);

      const platformBreakdown: schema.CompetitorPlatformMetrics[] = platforms.map((p) => ({
        platform: p,
        mentions: randomInRange(5, 15),
        avgPosition: Number((Math.random() * 4 + 1).toFixed(1)),
        sentiment: {
          positive: randomInRange(20, 50),
          neutral: randomInRange(30, 50),
          negative: randomInRange(5, 25),
        },
      }));

      snapshots.push({
        id: createId(),
        brandId,
        competitorName: competitor.name,
        competitorDomain: competitor.domain,
        snapshotDate: dateStr,
        geoScore,
        aiMentionCount: mentionCount,
        avgMentionPosition: Number((Math.random() * 3 + 1.5).toFixed(2)),
        sentimentScore: Number((Math.random() * 0.6 + 0.2).toFixed(2)), // 0.2 to 0.8
        socialFollowers: randomInRange(10000, 500000),
        socialEngagementRate: Number((Math.random() * 3 + 1).toFixed(2)),
        contentPageCount: randomInRange(50, 500),
        blogPostCount: randomInRange(20, 200),
        lastContentPublished: daysAgo(randomInRange(0, 7)),
        schemaTypes: ["Organization", "FAQPage", "Article", "Product"].slice(
          0,
          randomInRange(2, 4)
        ),
        structuredDataScore: randomInRange(60, 95),
        platformBreakdown,
        metadata: {
          crawledAt: daysAgo(week * 7).toISOString(),
          dataSource: "automated_scan",
        },
        createdAt: daysAgo(week * 7),
      });
    }
  }

  return snapshots;
}

async function seedCompetitiveData() {
  console.log("🚀 Starting competitive data seed...\n");

  try {
    // Get existing brands from apex-demo organization
    const org = await db.query.organizations.findFirst({
      where: (o, { eq }) => eq(o.slug, "apex-demo"),
    });

    if (!org) {
      console.error("❌ Demo organization not found! Run seed.ts first.");
      process.exit(1);
    }

    const brands = await db.query.brands.findMany({
      where: (b, { eq }) => eq(b.organizationId, org.id),
    });

    if (brands.length === 0) {
      console.error("❌ No brands found! Run seed.ts first.");
      process.exit(1);
    }

    console.log(`Found ${brands.length} brands to populate competitive data for.\n`);

    let totalCompetitorMentions = 0;
    let totalSOV = 0;
    let totalGaps = 0;
    let totalAlerts = 0;
    let totalSnapshots = 0;

    for (const brand of brands) {
      console.log(`\n📊 Processing: ${brand.name}`);

      // Clean existing competitive data for this brand
      console.log("  Cleaning existing data...");
      await db.delete(schema.competitorMentions).where(eq(schema.competitorMentions.brandId, brand.id)).catch(() => {});
      await db.delete(schema.shareOfVoice).where(eq(schema.shareOfVoice.brandId, brand.id)).catch(() => {});
      await db.delete(schema.competitiveGaps).where(eq(schema.competitiveGaps.brandId, brand.id)).catch(() => {});
      await db.delete(schema.competitiveAlerts).where(eq(schema.competitiveAlerts.brandId, brand.id)).catch(() => {});
      await db.delete(schema.competitorSnapshots).where(eq(schema.competitorSnapshots.brandId, brand.id)).catch(() => {});

      // Generate and insert competitor mentions
      console.log("  Generating competitor mentions...");
      const mentions = generateCompetitorMentions(brand.id, brand.name);
      if (mentions.length > 0) {
        for (let i = 0; i < mentions.length; i += 20) {
          await db.insert(schema.competitorMentions).values(mentions.slice(i, i + 20));
        }
        totalCompetitorMentions += mentions.length;
        console.log(`    ✅ Created ${mentions.length} competitor mentions`);
      }

      // Generate and insert Share of Voice
      console.log("  Generating Share of Voice data...");
      const sovRecords = generateShareOfVoice(brand.id, brand.name);
      if (sovRecords.length > 0) {
        for (let i = 0; i < sovRecords.length; i += 20) {
          await db.insert(schema.shareOfVoice).values(sovRecords.slice(i, i + 20));
        }
        totalSOV += sovRecords.length;
        console.log(`    ✅ Created ${sovRecords.length} SOV records`);
      }

      // Generate and insert Competitive Gaps
      console.log("  Generating competitive gaps...");
      const gaps = generateCompetitiveGaps(brand.id, brand.name);
      if (gaps.length > 0) {
        await db.insert(schema.competitiveGaps).values(gaps);
        totalGaps += gaps.length;
        console.log(`    ✅ Created ${gaps.length} competitive gaps`);
      }

      // Generate and insert Competitive Alerts
      console.log("  Generating competitive alerts...");
      const alerts = generateCompetitiveAlerts(brand.id, brand.name);
      if (alerts.length > 0) {
        await db.insert(schema.competitiveAlerts).values(alerts);
        totalAlerts += alerts.length;
        console.log(`    ✅ Created ${alerts.length} competitive alerts`);
      }

      // Generate and insert Competitor Snapshots
      console.log("  Generating competitor snapshots...");
      const snapshots = generateCompetitorSnapshots(brand.id, brand.name);
      if (snapshots.length > 0) {
        for (let i = 0; i < snapshots.length; i += 20) {
          await db.insert(schema.competitorSnapshots).values(snapshots.slice(i, i + 20));
        }
        totalSnapshots += snapshots.length;
        console.log(`    ✅ Created ${snapshots.length} competitor snapshots`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ COMPETITIVE DATA SEED COMPLETE");
    console.log("=".repeat(60));
    console.log("\nSummary:");
    console.log(`  - Competitor Mentions: ${totalCompetitorMentions}`);
    console.log(`  - Share of Voice Records: ${totalSOV}`);
    console.log(`  - Competitive Gaps: ${totalGaps}`);
    console.log(`  - Competitive Alerts: ${totalAlerts}`);
    console.log(`  - Competitor Snapshots: ${totalSnapshots}`);
    console.log("\n🎉 Done!\n");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedCompetitiveData();
