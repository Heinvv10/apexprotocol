/**
 * Share of Voice Calculator
 * Phase 5: Calculate and track SOV across AI platforms
 *
 * Measures brand visibility relative to competitors across AI-powered search.
 */

import { db } from "@/lib/db";
import {
  brandMentions,
  shareOfVoice,
  type CompetitorSOV,
  type NewShareOfVoiceRecord,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

// Types
export interface SOVPeriod {
  start: Date;
  end: Date;
}

export interface PlatformSOV {
  platform: string;
  brandMentions: number;
  totalMentions: number;
  percentage: number;
  avgPosition: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface SOVSnapshot {
  date: Date;
  overall: number;
  platforms: PlatformSOV[];
  competitors: CompetitorSOV[];
  change: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface SOVTrend {
  period: SOVPeriod;
  snapshots: Array<{
    date: Date;
    sov: number;
  }>;
  average: number;
  peak: number;
  low: number;
  volatility: number;
}

/**
 * Calculate Share of Voice for a specific period
 */
export async function calculateSOV(
  brandId: string,
  period: SOVPeriod
): Promise<SOVSnapshot> {
  // Get all brand mentions in the period
  const mentions = await db.query.brandMentions.findMany({
    where: and(
      eq(brandMentions.brandId, brandId),
      gte(brandMentions.timestamp, period.start),
      lte(brandMentions.timestamp, period.end)
    ),
  });

  // Aggregate by platform
  const platformData = new Map<
    string,
    {
      brandMentions: number;
      competitorMentions: number;
      positions: number[];
      sentiments: { positive: number; neutral: number; negative: number; unrecognized: number };
    }
  >();

  // Track competitor totals
  const competitorData = new Map<
    string,
    {
      mentions: number;
      positions: number[];
      sentiments: { positive: number; neutral: number; negative: number; unrecognized: number };
    }
  >();

  for (const mention of mentions) {
    const platform = mention.platform;

    // Initialize platform data if needed
    if (!platformData.has(platform)) {
      platformData.set(platform, {
        brandMentions: 0,
        competitorMentions: 0,
        positions: [],
        sentiments: { positive: 0, neutral: 0, negative: 0, unrecognized: 0 },
      });
    }

    const pData = platformData.get(platform)!;
    pData.brandMentions++;
    if (mention.position) {
      pData.positions.push(mention.position);
    }
    pData.sentiments[mention.sentiment]++;

    // Process competitor mentions
    const competitors = mention.competitors || [];
    for (const comp of competitors) {
      pData.competitorMentions++;

      if (!competitorData.has(comp.name)) {
        competitorData.set(comp.name, {
          mentions: 0,
          positions: [],
          sentiments: { positive: 0, neutral: 0, negative: 0, unrecognized: 0 },
        });
      }

      const cData = competitorData.get(comp.name)!;
      cData.mentions++;
      if (comp.position) {
        cData.positions.push(comp.position);
      }
      cData.sentiments[comp.sentiment]++;
    }
  }

  // Calculate platform SOV
  const platforms: PlatformSOV[] = [];
  let totalBrandMentions = 0;
  let totalAllMentions = 0;

  for (const [platform, data] of platformData) {
    const total = data.brandMentions + data.competitorMentions;
    totalBrandMentions += data.brandMentions;
    totalAllMentions += total;

    platforms.push({
      platform,
      brandMentions: data.brandMentions,
      totalMentions: total,
      percentage: total > 0 ? (data.brandMentions / total) * 100 : 0,
      avgPosition:
        data.positions.length > 0
          ? data.positions.reduce((a, b) => a + b, 0) / data.positions.length
          : 0,
      sentimentBreakdown: data.sentiments,
    });
  }

  // Calculate competitor SOV
  const competitors: CompetitorSOV[] = [];
  for (const [name, data] of competitorData) {
    const sovPercentage =
      totalAllMentions > 0 ? (data.mentions / totalAllMentions) * 100 : 0;
    const avgPosition =
      data.positions.length > 0
        ? data.positions.reduce((a, b) => a + b, 0) / data.positions.length
        : 0;

    competitors.push({
      name,
      mentions: data.mentions,
      sovPercentage: Math.round(sovPercentage * 100) / 100,
      avgPosition: Math.round(avgPosition * 100) / 100,
      sentiment: data.sentiments,
    });
  }

  // Sort competitors by SOV
  competitors.sort((a, b) => b.sovPercentage - a.sovPercentage);

  // Calculate overall SOV
  const overallSOV =
    totalAllMentions > 0 ? (totalBrandMentions / totalAllMentions) * 100 : 0;

  // Calculate changes (requires historical data)
  const changes = await calculateSOVChanges(brandId, overallSOV);

  return {
    date: new Date(),
    overall: Math.round(overallSOV * 100) / 100,
    platforms,
    competitors,
    change: changes,
  };
}

/**
 * Calculate SOV changes compared to previous periods
 */
async function calculateSOVChanges(
  brandId: string,
  currentSOV: number
): Promise<{ daily: number; weekly: number; monthly: number }> {
  const now = new Date();

  // Get yesterday's SOV
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const dailyRecord = await db.query.shareOfVoice.findFirst({
    where: and(
      eq(shareOfVoice.brandId, brandId),
      eq(shareOfVoice.platform, "all"),
      sql`${shareOfVoice.date} = ${yesterday.toISOString().split("T")[0]}`
    ),
  });

  // Get last week's SOV
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const weeklyRecord = await db.query.shareOfVoice.findFirst({
    where: and(
      eq(shareOfVoice.brandId, brandId),
      eq(shareOfVoice.platform, "all"),
      sql`${shareOfVoice.date} = ${lastWeek.toISOString().split("T")[0]}`
    ),
  });

  // Get last month's SOV
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const monthlyRecord = await db.query.shareOfVoice.findFirst({
    where: and(
      eq(shareOfVoice.brandId, brandId),
      eq(shareOfVoice.platform, "all"),
      sql`${shareOfVoice.date} = ${lastMonth.toISOString().split("T")[0]}`
    ),
  });

  const dailySOV = dailyRecord?.sovPercentage
    ? parseFloat(dailyRecord.sovPercentage)
    : currentSOV;
  const weeklySOV = weeklyRecord?.sovPercentage
    ? parseFloat(weeklyRecord.sovPercentage)
    : currentSOV;
  const monthlySOV = monthlyRecord?.sovPercentage
    ? parseFloat(monthlyRecord.sovPercentage)
    : currentSOV;

  return {
    daily: Math.round((currentSOV - dailySOV) * 100) / 100,
    weekly: Math.round((currentSOV - weeklySOV) * 100) / 100,
    monthly: Math.round((currentSOV - monthlySOV) * 100) / 100,
  };
}

/**
 * Store daily SOV snapshot
 */
export async function storeDailySOV(
  brandId: string,
  snapshot: SOVSnapshot
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  // Store overall SOV
  const overallRecord: NewShareOfVoiceRecord = {
    brandId,
    date: today,
    platform: "all",
    brandMentions: snapshot.platforms.reduce((sum, p) => sum + p.brandMentions, 0),
    totalMentions: snapshot.platforms.reduce((sum, p) => sum + p.totalMentions, 0),
    sovPercentage: snapshot.overall.toString(),
    avgPosition: (
      snapshot.platforms.reduce(
        (sum, p) => sum + p.avgPosition * p.brandMentions,
        0
      ) / Math.max(1, snapshot.platforms.reduce((sum, p) => sum + p.brandMentions, 0))
    ).toString(),
    topPositions: snapshot.platforms.reduce((sum, p) => {
      return sum + (p.avgPosition > 0 && p.avgPosition <= 3 ? p.brandMentions : 0);
    }, 0),
    positiveMentions: snapshot.platforms.reduce(
      (sum, p) => sum + p.sentimentBreakdown.positive,
      0
    ),
    neutralMentions: snapshot.platforms.reduce(
      (sum, p) => sum + p.sentimentBreakdown.neutral,
      0
    ),
    negativeMentions: snapshot.platforms.reduce(
      (sum, p) => sum + p.sentimentBreakdown.negative,
      0
    ),
    competitorBreakdown: snapshot.competitors,
  };

  await db
    .insert(shareOfVoice)
    .values(overallRecord)
    .onConflictDoUpdate({
      target: [shareOfVoice.brandId, shareOfVoice.date, shareOfVoice.platform],
      set: {
        brandMentions: overallRecord.brandMentions,
        totalMentions: overallRecord.totalMentions,
        sovPercentage: overallRecord.sovPercentage,
        avgPosition: overallRecord.avgPosition,
        topPositions: overallRecord.topPositions,
        positiveMentions: overallRecord.positiveMentions,
        neutralMentions: overallRecord.neutralMentions,
        negativeMentions: overallRecord.negativeMentions,
        competitorBreakdown: overallRecord.competitorBreakdown,
      },
    });

  // Store per-platform SOV
  for (const platform of snapshot.platforms) {
    const platformRecord: NewShareOfVoiceRecord = {
      brandId,
      date: today,
      platform: platform.platform,
      brandMentions: platform.brandMentions,
      totalMentions: platform.totalMentions,
      sovPercentage: platform.percentage.toString(),
      avgPosition: platform.avgPosition.toString(),
      topPositions: platform.avgPosition > 0 && platform.avgPosition <= 3 ? platform.brandMentions : 0,
      positiveMentions: platform.sentimentBreakdown.positive,
      neutralMentions: platform.sentimentBreakdown.neutral,
      negativeMentions: platform.sentimentBreakdown.negative,
      competitorBreakdown: [],
    };

    await db
      .insert(shareOfVoice)
      .values(platformRecord)
      .onConflictDoUpdate({
        target: [shareOfVoice.brandId, shareOfVoice.date, shareOfVoice.platform],
        set: {
          brandMentions: platformRecord.brandMentions,
          totalMentions: platformRecord.totalMentions,
          sovPercentage: platformRecord.sovPercentage,
          avgPosition: platformRecord.avgPosition,
          topPositions: platformRecord.topPositions,
          positiveMentions: platformRecord.positiveMentions,
          neutralMentions: platformRecord.neutralMentions,
          negativeMentions: platformRecord.negativeMentions,
        },
      });
  }
}

/**
 * Get SOV trend over time
 */
export async function getSOVTrend(
  brandId: string,
  days: number = 30
): Promise<SOVTrend> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const records = await db.query.shareOfVoice.findMany({
    where: and(
      eq(shareOfVoice.brandId, brandId),
      eq(shareOfVoice.platform, "all"),
      gte(shareOfVoice.date, startDate.toISOString().split("T")[0])
    ),
    orderBy: shareOfVoice.date,
  });

  const snapshots = records.map((r) => ({
    date: new Date(r.date),
    sov: parseFloat(r.sovPercentage || "0"),
  }));

  const values = snapshots.map((s) => s.sov);
  const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const peak = values.length > 0 ? Math.max(...values) : 0;
  const low = values.length > 0 ? Math.min(...values) : 0;

  // Calculate volatility (standard deviation)
  const variance =
    values.length > 0
      ? values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length
      : 0;
  const volatility = Math.sqrt(variance);

  return {
    period: {
      start: startDate,
      end: new Date(),
    },
    snapshots,
    average: Math.round(average * 100) / 100,
    peak: Math.round(peak * 100) / 100,
    low: Math.round(low * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
  };
}

/**
 * Compare SOV with specific competitor
 */
export async function compareWithCompetitor(
  brandId: string,
  competitorName: string,
  days: number = 30
): Promise<{
  brand: { sov: number; trend: number };
  competitor: { sov: number; trend: number };
  gap: number;
  platforms: Array<{
    platform: string;
    brandSOV: number;
    competitorSOV: number;
    gap: number;
  }>;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const mentions = await db.query.brandMentions.findMany({
    where: and(
      eq(brandMentions.brandId, brandId),
      gte(brandMentions.timestamp, startDate)
    ),
  });

  // Calculate brand and competitor mentions per platform
  const platformStats = new Map<
    string,
    { brand: number; competitor: number; total: number }
  >();

  let totalBrand = 0;
  let totalCompetitor = 0;
  let total = 0;

  for (const mention of mentions) {
    const platform = mention.platform;

    if (!platformStats.has(platform)) {
      platformStats.set(platform, { brand: 0, competitor: 0, total: 0 });
    }

    const stats = platformStats.get(platform)!;
    stats.brand++;
    stats.total++;
    totalBrand++;
    total++;

    const competitors = mention.competitors || [];
    for (const comp of competitors) {
      stats.total++;
      total++;
      if (comp.name.toLowerCase() === competitorName.toLowerCase()) {
        stats.competitor++;
        totalCompetitor++;
      }
    }
  }

  const brandSOV = total > 0 ? (totalBrand / total) * 100 : 0;
  const competitorSOV = total > 0 ? (totalCompetitor / total) * 100 : 0;

  // Calculate per-platform comparison
  const platforms: Array<{
    platform: string;
    brandSOV: number;
    competitorSOV: number;
    gap: number;
  }> = [];

  for (const [platform, stats] of platformStats) {
    const bSOV = stats.total > 0 ? (stats.brand / stats.total) * 100 : 0;
    const cSOV = stats.total > 0 ? (stats.competitor / stats.total) * 100 : 0;
    platforms.push({
      platform,
      brandSOV: Math.round(bSOV * 100) / 100,
      competitorSOV: Math.round(cSOV * 100) / 100,
      gap: Math.round((bSOV - cSOV) * 100) / 100,
    });
  }

  return {
    brand: { sov: Math.round(brandSOV * 100) / 100, trend: 0 },
    competitor: { sov: Math.round(competitorSOV * 100) / 100, trend: 0 },
    gap: Math.round((brandSOV - competitorSOV) * 100) / 100,
    platforms,
  };
}
