/**
 * Seed Competitive Intelligence Data for Notion brand
 * Usage: npx tsx scripts/seed-notion-competitive.ts
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

config({ path: ".env.local" });

import * as schema from "../src/lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

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

// Notion's competitors
const notionCompetitors = [
  { name: "Asana", domain: "asana.com" },
  { name: "Confluence", domain: "confluence.atlassian.com" },
  { name: "Evernote", domain: "evernote.com" },
  { name: "Monday.com", domain: "monday.com" },
  { name: "Trello", domain: "trello.com" },
];

const notionQueries = [
  "best productivity apps 2024",
  "notion vs confluence comparison",
  "top note-taking apps for teams",
  "project management tool recommendations",
  "all-in-one workspace software",
  "best wiki software for companies",
  "knowledge management platforms",
];

// Generate competitor mentions
function generateCompetitorMentions(brandId: string): schema.NewCompetitorMentionRecord[] {
  const mentions: schema.NewCompetitorMentionRecord[] = [];
  const mentionCount = randomInRange(60, 90);

  for (let i = 0; i < mentionCount; i++) {
    const competitor = randomItem(notionCompetitors);
    const platform = randomItem(platforms);
    const sentiment = randomItem(sentiments);
    const query = randomItem(notionQueries);
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
      context: `${competitor.name} was mentioned as a ${sentiment === "positive" ? "recommended" : sentiment === "negative" ? "less favorable" : "viable"} alternative for ${query.split(" ").slice(0, 4).join(" ")}.`,
      citationUrl: Math.random() > 0.5 ? `https://${competitor.domain}/features` : null,
      timestamp: daysAgo(daysBack),
      createdAt: daysAgo(daysBack),
    });
  }

  return mentions;
}

// Generate Share of Voice data
function generateShareOfVoice(brandId: string): schema.NewShareOfVoiceRecord[] {
  const sovRecords: schema.NewShareOfVoiceRecord[] = [];

  // Generate SOV data for the past 30 days
  for (let day = 0; day <= 30; day += 7) {
    const dateStr = dateString(day);

    // Per-platform SOV
    for (const platform of platforms) {
      const brandMentions = randomInRange(20, 50);
      const totalMentions = randomInRange(100, 180);
      const sovPercentage = ((brandMentions / totalMentions) * 100).toFixed(2);

      const competitorBreakdown: schema.CompetitorSOV[] = notionCompetitors.map((c) => {
        const mentions = randomInRange(8, 30);
        return {
          name: c.name,
          mentions,
          sovPercentage: Number(((mentions / totalMentions) * 100).toFixed(2)),
          avgPosition: Number((Math.random() * 4 + 1).toFixed(1)),
          sentiment: {
            positive: randomInRange(25, 55),
            neutral: randomInRange(30, 50),
            negative: randomInRange(5, 20),
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
        avgPosition: (Math.random() * 2.5 + 1).toFixed(2),
        topPositions: randomInRange(8, 20),
        positiveMentions: randomInRange(12, 28),
        neutralMentions: randomInRange(8, 18),
        negativeMentions: randomInRange(2, 8),
        competitorBreakdown,
        createdAt: daysAgo(day),
      });
    }

    // Aggregate "all" platform SOV
    const totalBrandMentions = randomInRange(140, 280);
    const totalAllMentions = randomInRange(600, 1000);

    sovRecords.push({
      id: createId(),
      brandId,
      date: dateStr,
      platform: "all",
      brandMentions: totalBrandMentions,
      totalMentions: totalAllMentions,
      sovPercentage: ((totalBrandMentions / totalAllMentions) * 100).toFixed(2),
      avgPosition: (Math.random() * 1.5 + 1.2).toFixed(2),
      topPositions: randomInRange(50, 100),
      positiveMentions: randomInRange(60, 120),
      neutralMentions: randomInRange(50, 90),
      negativeMentions: randomInRange(15, 40),
      competitorBreakdown: notionCompetitors.map((c) => ({
        name: c.name,
        mentions: randomInRange(40, 120),
        sovPercentage: Number((Math.random() * 12 + 5).toFixed(2)),
        avgPosition: Number((Math.random() * 3 + 2).toFixed(1)),
        sentiment: {
          positive: randomInRange(25, 45),
          neutral: randomInRange(35, 50),
          negative: randomInRange(10, 25),
        },
      })),
      createdAt: daysAgo(day),
    });
  }

  return sovRecords;
}

// Generate competitive gaps
function generateCompetitiveGaps(brandId: string): schema.NewCompetitiveGap[] {
  const gaps: schema.NewCompetitiveGap[] = [];

  const gapTemplates = [
    {
      gapType: "keyword",
      topic: "Team Collaboration",
      description: "Competitor ranks higher for team collaboration queries",
      searchVolume: randomInRange(8000, 25000),
      difficulty: randomInRange(45, 70),
      opportunity: randomInRange(65, 90),
    },
    {
      gapType: "content",
      topic: "Getting Started Guides",
      description: "Competitor has comprehensive onboarding content that gets cited",
      searchVolume: randomInRange(5000, 18000),
      difficulty: randomInRange(35, 55),
      opportunity: randomInRange(75, 95),
    },
    {
      gapType: "schema",
      topic: "HowTo Schema",
      description: "Competitor has HowTo schema implemented on tutorial pages",
      searchVolume: randomInRange(3000, 12000),
      difficulty: randomInRange(20, 40),
      opportunity: randomInRange(80, 98),
    },
    {
      gapType: "topic",
      topic: "Enterprise Features",
      description: "Competitor creates enterprise-focused content that AI platforms cite",
      searchVolume: randomInRange(2000, 10000),
      difficulty: randomInRange(50, 75),
      opportunity: randomInRange(55, 80),
    },
    {
      gapType: "keyword",
      topic: "Integration Guides",
      description: "Competitor has better integration documentation coverage",
      searchVolume: randomInRange(6000, 20000),
      difficulty: randomInRange(40, 65),
      opportunity: randomInRange(60, 85),
    },
    {
      gapType: "content",
      topic: "Use Case Templates",
      description: "Competitor provides more downloadable templates that get shared",
      searchVolume: randomInRange(10000, 35000),
      difficulty: randomInRange(30, 50),
      opportunity: randomInRange(70, 92),
    },
  ];

  const gapCount = randomInRange(10, 15);

  for (let i = 0; i < gapCount; i++) {
    const template = gapTemplates[i % gapTemplates.length];
    const competitor = randomItem(notionCompetitors);
    const daysBack = randomInRange(0, 14);

    gaps.push({
      id: createId(),
      brandId,
      gapType: template.gapType,
      keyword: `productivity ${template.topic.toLowerCase()}`,
      topic: template.topic,
      description: `${template.description}. ${competitor.name} is outperforming in this area.`,
      competitorName: competitor.name,
      competitorPosition: randomInRange(1, 3),
      competitorUrl: `https://${competitor.domain}/resources`,
      searchVolume: template.searchVolume,
      difficulty: template.difficulty,
      opportunity: template.opportunity,
      isResolved: Math.random() > 0.85,
      resolvedAt: Math.random() > 0.85 ? daysAgo(randomInRange(0, 5)) : null,
      discoveredAt: daysAgo(daysBack),
      createdAt: daysAgo(daysBack),
    });
  }

  return gaps;
}

// Generate competitive alerts
function generateCompetitiveAlerts(brandId: string): schema.NewCompetitiveAlert[] {
  const alerts: schema.NewCompetitiveAlert[] = [];

  const alertTemplates = [
    {
      alertType: "sov_drop",
      title: "Share of Voice Decreased",
      description: "Your share of voice on {{platform}} dropped by {{change}}% in the last 7 days",
      severity: "high",
    },
    {
      alertType: "competitor_gain",
      title: "Competitor Gaining Visibility",
      description: "{{competitor}} increased their AI visibility by {{change}}% on {{platform}}",
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
      title: "Competitor Featured in AI Overview",
      description: "{{competitor}} is now appearing in AI overviews for '{{keyword}}'",
      severity: "critical",
    },
    {
      alertType: "new_competitor",
      title: "New Competitor Detected",
      description: "{{competitor}} started appearing in AI responses for your tracked keywords",
      severity: "medium",
    },
    {
      alertType: "sov_drop",
      title: "Weekly SOV Decline",
      description: "Overall share of voice declined {{change}}% compared to last week",
      severity: "high",
    },
  ];

  const alertCount = randomInRange(8, 14);

  for (let i = 0; i < alertCount; i++) {
    const template = alertTemplates[i % alertTemplates.length];
    const competitor = randomItem(notionCompetitors);
    const platform = randomItem(platforms);
    const daysBack = randomInRange(0, 14);
    const change = randomInRange(5, 20);
    const previousVal = randomInRange(25, 45);
    const currentVal = previousVal - change;

    const description = template.description
      .replace("{{platform}}", platform)
      .replace("{{competitor}}", competitor.name)
      .replace("{{change}}", change.toString())
      .replace("{{previous}}", previousVal.toString())
      .replace("{{current}}", currentVal.toString())
      .replace("{{keyword}}", "best productivity tools");

    alerts.push({
      id: createId(),
      brandId,
      alertType: template.alertType,
      title: template.title,
      description,
      severity: template.severity as "low" | "medium" | "high" | "critical",
      competitorName: competitor.name,
      platform,
      keyword: "productivity software",
      previousValue: previousVal.toString(),
      currentValue: currentVal.toString(),
      isRead: Math.random() > 0.5,
      isDismissed: Math.random() > 0.92,
      triggeredAt: daysAgo(daysBack),
      readAt: Math.random() > 0.5 ? daysAgo(randomInRange(0, daysBack)) : null,
      createdAt: daysAgo(daysBack),
    });
  }

  return alerts;
}

// Generate competitor snapshots
function generateCompetitorSnapshots(brandId: string): schema.NewCompetitorSnapshot[] {
  const snapshots: schema.NewCompetitorSnapshot[] = [];

  for (let week = 0; week < 4; week++) {
    const dateStr = dateString(week * 7);

    for (const competitor of notionCompetitors) {
      const geoScore = randomInRange(60, 88);
      const mentionCount = randomInRange(35, 95);

      const platformBreakdown: schema.CompetitorPlatformMetrics[] = platforms.map((p) => ({
        platform: p,
        mentions: randomInRange(6, 18),
        avgPosition: Number((Math.random() * 3.5 + 1).toFixed(1)),
        sentiment: {
          positive: randomInRange(25, 55),
          neutral: randomInRange(30, 50),
          negative: randomInRange(5, 20),
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
        avgMentionPosition: Number((Math.random() * 2.5 + 1.5).toFixed(2)),
        sentimentScore: Number((Math.random() * 0.5 + 0.3).toFixed(2)),
        socialFollowers: randomInRange(50000, 800000),
        socialEngagementRate: Number((Math.random() * 4 + 1.5).toFixed(2)),
        contentPageCount: randomInRange(100, 800),
        blogPostCount: randomInRange(50, 300),
        lastContentPublished: daysAgo(randomInRange(0, 5)),
        schemaTypes: ["Organization", "FAQPage", "Article", "SoftwareApplication"].slice(
          0,
          randomInRange(2, 4)
        ),
        structuredDataScore: randomInRange(65, 95),
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

async function seedNotionCompetitiveData() {
  console.log("🚀 Seeding competitive data for Notion...\n");

  try {
    // Find Notion brand
    const notion = await db.query.brands.findFirst({
      where: (b, { eq }) => eq(b.name, "Notion"),
    });

    if (!notion) {
      console.error("❌ Notion brand not found!");
      process.exit(1);
    }

    console.log(`Found Notion brand: ${notion.id}\n`);

    // Clean existing competitive data
    console.log("Cleaning existing data...");
    await db.delete(schema.competitorMentions).where(eq(schema.competitorMentions.brandId, notion.id)).catch(() => {});
    await db.delete(schema.shareOfVoice).where(eq(schema.shareOfVoice.brandId, notion.id)).catch(() => {});
    await db.delete(schema.competitiveGaps).where(eq(schema.competitiveGaps.brandId, notion.id)).catch(() => {});
    await db.delete(schema.competitiveAlerts).where(eq(schema.competitiveAlerts.brandId, notion.id)).catch(() => {});
    await db.delete(schema.competitorSnapshots).where(eq(schema.competitorSnapshots.brandId, notion.id)).catch(() => {});

    // Generate and insert data
    console.log("Generating competitor mentions...");
    const mentions = generateCompetitorMentions(notion.id);
    for (let i = 0; i < mentions.length; i += 20) {
      await db.insert(schema.competitorMentions).values(mentions.slice(i, i + 20));
    }
    console.log(`  ✅ Created ${mentions.length} competitor mentions`);

    console.log("Generating Share of Voice data...");
    const sovRecords = generateShareOfVoice(notion.id);
    for (let i = 0; i < sovRecords.length; i += 20) {
      await db.insert(schema.shareOfVoice).values(sovRecords.slice(i, i + 20));
    }
    console.log(`  ✅ Created ${sovRecords.length} SOV records`);

    console.log("Generating competitive gaps...");
    const gaps = generateCompetitiveGaps(notion.id);
    await db.insert(schema.competitiveGaps).values(gaps);
    console.log(`  ✅ Created ${gaps.length} competitive gaps`);

    console.log("Generating competitive alerts...");
    const alerts = generateCompetitiveAlerts(notion.id);
    await db.insert(schema.competitiveAlerts).values(alerts);
    console.log(`  ✅ Created ${alerts.length} competitive alerts`);

    console.log("Generating competitor snapshots...");
    const snapshots = generateCompetitorSnapshots(notion.id);
    for (let i = 0; i < snapshots.length; i += 20) {
      await db.insert(schema.competitorSnapshots).values(snapshots.slice(i, i + 20));
    }
    console.log(`  ✅ Created ${snapshots.length} competitor snapshots`);

    console.log("\n✅ Notion competitive data seeded successfully!");
    console.log("\nSummary:");
    console.log(`  - Competitor Mentions: ${mentions.length}`);
    console.log(`  - Share of Voice Records: ${sovRecords.length}`);
    console.log(`  - Competitive Gaps: ${gaps.length}`);
    console.log(`  - Competitive Alerts: ${alerts.length}`);
    console.log(`  - Competitor Snapshots: ${snapshots.length}`);

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedNotionCompetitiveData();
