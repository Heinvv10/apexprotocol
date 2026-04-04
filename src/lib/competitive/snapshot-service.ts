/**
 * Competitor Snapshot Service
 * Phase 9.1: Capture periodic snapshots of competitor metrics
 *
 * This service captures daily snapshots of competitor metrics for:
 * - Trend analysis over time
 * - Historical comparisons
 * - Change detection and alerts
 */

import { db } from "@/lib/db";
import {
  brands,
  brandMentions,
  competitorSnapshots,
  type Brand,
} from "@/lib/db/schema";
import { eq, and, gte, desc, sql, count } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Types
export interface SnapshotData {
  competitorName: string;
  competitorDomain: string;
  geoScore: number;
  aiMentionCount: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  socialFollowers: number;
  contentPageCount: number;
  structuredDataScore: number;
  platformBreakdown: Array<{
    platform: string;
    mentionCount: number;
    sentiment: string;
  }>;
}

export interface SnapshotResult {
  brandId: string;
  snapshotsCreated: number;
  competitorsProcessed: string[];
  errors: Array<{ competitor: string; error: string }>;
}

/**
 * Get co-occurrence data for a competitor from brand mentions
 */
async function getCompetitorCoOccurrence(
  brandId: string,
  competitorName: string,
  lookbackDays: number = 30
): Promise<{
  mentionCount: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number; unrecognized: number };
  platforms: Array<{ platform: string; count: number }>;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  // Get brand mentions where this competitor is mentioned
  const mentions = await db.query.brandMentions.findMany({
    where: and(
      eq(brandMentions.brandId, brandId),
      gte(brandMentions.timestamp, startDate)
    ),
  });

  // Filter mentions that include this competitor
  const competitorMentions = mentions.filter((m) => {
    const competitors = (m.competitors || []) as Array<{ name: string }>;
    return competitors.some(
      (c) => c.name.toLowerCase() === competitorName.toLowerCase()
    );
  });

  // Calculate sentiment breakdown
  const sentimentBreakdown = {
    positive: competitorMentions.filter((m) => m.sentiment === "positive").length,
    neutral: competitorMentions.filter((m) => m.sentiment === "neutral").length,
    negative: competitorMentions.filter((m) => m.sentiment === "negative").length,
    unrecognized: competitorMentions.filter((m) => m.sentiment === "unrecognized").length,
  };

  // Calculate platform breakdown
  const platformCounts = new Map<string, number>();
  for (const mention of competitorMentions) {
    const current = platformCounts.get(mention.platform) || 0;
    platformCounts.set(mention.platform, current + 1);
  }

  const platforms = Array.from(platformCounts.entries()).map(([platform, count]) => ({
    platform,
    count,
  }));

  return {
    mentionCount: competitorMentions.length,
    sentimentBreakdown,
    platforms,
  };
}

/**
 * Estimate a competitor's GEO score based on co-occurrence data
 * This is a simplified estimation - in production, you'd want actual monitoring
 */
function estimateCompetitorGEOScore(
  mentionCount: number,
  sentimentBreakdown: { positive: number; neutral: number; negative: number; unrecognized: number },
  platformCount: number
): number {
  const totalMentions = sentimentBreakdown.positive + sentimentBreakdown.neutral + sentimentBreakdown.negative;
  if (totalMentions === 0) return 50; // Default for no data

  // Calculate sentiment score (0-100)
  const sentimentScore =
    totalMentions > 0
      ? ((sentimentBreakdown.positive * 100 + sentimentBreakdown.neutral * 50) / totalMentions)
      : 50;

  // Platform diversity bonus
  const platformBonus = Math.min(platformCount * 5, 20);

  // Volume bonus (capped)
  const volumeBonus = Math.min(mentionCount * 2, 30);

  // Calculate final score
  const score = Math.round(sentimentScore * 0.5 + platformBonus + volumeBonus);
  return Math.min(100, Math.max(0, score));
}

/**
 * Capture snapshot for a single competitor
 */
async function captureCompetitorSnapshot(
  brandId: string,
  competitor: { name: string; url?: string },
  snapshotDate: string
): Promise<SnapshotData> {
  // Get co-occurrence data
  const coOccurrence = await getCompetitorCoOccurrence(brandId, competitor.name);

  // Estimate GEO score
  const geoScore = estimateCompetitorGEOScore(
    coOccurrence.mentionCount,
    coOccurrence.sentimentBreakdown,
    coOccurrence.platforms.length
  );

  // Platform breakdown
  const platformBreakdown = coOccurrence.platforms.map((p) => ({
    platform: p.platform,
    mentionCount: p.count,
    sentiment: "mixed", // Simplified
  }));

  return {
    competitorName: competitor.name,
    competitorDomain: competitor.url || "",
    geoScore,
    aiMentionCount: coOccurrence.mentionCount,
    sentimentBreakdown: coOccurrence.sentimentBreakdown,
    socialFollowers: 0, // Would come from social scanning
    contentPageCount: 0, // Would come from site crawling
    structuredDataScore: 50, // Default estimate
    platformBreakdown,
  };
}

/**
 * Store a snapshot in the database
 */
async function storeSnapshot(
  brandId: string,
  snapshotDate: string,
  data: SnapshotData
): Promise<void> {
  // Calculate sentiment score from breakdown (-1 to 1)
  const totalSentiment = data.sentimentBreakdown.positive + data.sentimentBreakdown.neutral + data.sentimentBreakdown.negative;
  const sentimentScore = totalSentiment > 0
    ? (data.sentimentBreakdown.positive - data.sentimentBreakdown.negative) / totalSentiment
    : 0;

  // Transform platform breakdown to match schema type
  const platformBreakdown = data.platformBreakdown.map(p => ({
    platform: p.platform,
    mentions: p.mentionCount,
    avgPosition: 0,
    sentiment: {
      positive: data.sentimentBreakdown.positive,
      neutral: data.sentimentBreakdown.neutral,
      negative: data.sentimentBreakdown.negative,
    },
  }));

  await db.insert(competitorSnapshots).values({
    id: createId(),
    brandId,
    competitorName: data.competitorName,
    competitorDomain: data.competitorDomain || "",
    snapshotDate,
    geoScore: data.geoScore,
    aiMentionCount: data.aiMentionCount,
    sentimentScore,
    socialFollowers: data.socialFollowers,
    contentPageCount: data.contentPageCount,
    structuredDataScore: data.structuredDataScore,
    platformBreakdown,
    metadata: {
      sentimentBreakdown: data.sentimentBreakdown,
    },
  });
}

/**
 * Capture snapshots for all competitors of a brand
 */
export async function captureCompetitorSnapshots(
  brandId: string
): Promise<SnapshotResult> {
  const result: SnapshotResult = {
    brandId,
    snapshotsCreated: 0,
    competitorsProcessed: [],
    errors: [],
  };

  // Get brand with competitors
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  const competitors = (brand.competitors || []) as Array<{
    name: string;
    url?: string;
  }>;

  if (competitors.length === 0) {
    return result;
  }

  // Today's date for snapshot
  const today = new Date().toISOString().split("T")[0];

  // Check if we already have snapshots for today
  const existingSnapshots = await db.query.competitorSnapshots.findMany({
    where: and(
      eq(competitorSnapshots.brandId, brandId),
      eq(competitorSnapshots.snapshotDate, today)
    ),
  });

  const existingCompetitors = new Set(
    existingSnapshots.map((s) => s.competitorName.toLowerCase())
  );

  // Process each competitor
  for (const competitor of competitors) {
    // Skip if already snapshotted today
    if (existingCompetitors.has(competitor.name.toLowerCase())) {
      continue;
    }

    try {
      const snapshotData = await captureCompetitorSnapshot(
        brandId,
        competitor,
        today
      );

      await storeSnapshot(brandId, today, snapshotData);

      result.snapshotsCreated++;
      result.competitorsProcessed.push(competitor.name);
    } catch (error) {
      result.errors.push({
        competitor: competitor.name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}

/**
 * Capture snapshots for all brands in the system
 * Used by the cron job
 */
export async function captureAllBrandSnapshots(): Promise<{
  totalBrands: number;
  totalSnapshots: number;
  results: SnapshotResult[];
  errors: Array<{ brandId: string; error: string }>;
}> {
  const results: SnapshotResult[] = [];
  const errors: Array<{ brandId: string; error: string }> = [];

  // Get all active brands
  const allBrands = await db.query.brands.findMany();

  for (const brand of allBrands) {
    try {
      const result = await captureCompetitorSnapshots(brand.id);
      results.push(result);
    } catch (error) {
      errors.push({
        brandId: brand.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    totalBrands: allBrands.length,
    totalSnapshots: results.reduce((sum, r) => sum + r.snapshotsCreated, 0),
    results,
    errors,
  };
}

/**
 * Get historical snapshots for a competitor
 */
export async function getCompetitorHistory(
  brandId: string,
  competitorName: string,
  days: number = 30
): Promise<Array<{
  date: string;
  geoScore: number;
  aiMentionCount: number;
  sentimentScore: number;
  socialFollowers: number;
  contentPageCount: number;
}>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split("T")[0];

  const snapshots = await db.query.competitorSnapshots.findMany({
    where: and(
      eq(competitorSnapshots.brandId, brandId),
      eq(competitorSnapshots.competitorName, competitorName),
      gte(competitorSnapshots.snapshotDate, startDateStr)
    ),
    orderBy: desc(competitorSnapshots.snapshotDate),
  });

  return snapshots.map((s) => ({
    date: s.snapshotDate,
    geoScore: s.geoScore || 0,
    aiMentionCount: s.aiMentionCount || 0,
    sentimentScore: s.sentimentScore || 0,
    socialFollowers: s.socialFollowers || 0,
    contentPageCount: s.contentPageCount || 0,
  }));
}

/**
 * Get latest snapshots for all competitors of a brand
 */
export async function getLatestSnapshots(
  brandId: string
): Promise<Array<{
  competitorName: string;
  competitorDomain: string;
  geoScore: number;
  aiMentionCount: number;
  snapshotDate: string;
}>> {
  // Get brand competitors
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) return [];

  const competitors = (brand.competitors || []) as Array<{
    name: string;
    url?: string;
  }>;

  const latestSnapshots = [];

  for (const competitor of competitors) {
    const snapshot = await db.query.competitorSnapshots.findFirst({
      where: and(
        eq(competitorSnapshots.brandId, brandId),
        eq(competitorSnapshots.competitorName, competitor.name)
      ),
      orderBy: desc(competitorSnapshots.snapshotDate),
    });

    if (snapshot) {
      latestSnapshots.push({
        competitorName: snapshot.competitorName,
        competitorDomain: snapshot.competitorDomain,
        geoScore: snapshot.geoScore || 0,
        aiMentionCount: snapshot.aiMentionCount || 0,
        snapshotDate: snapshot.snapshotDate,
      });
    }
  }

  return latestSnapshots;
}

/**
 * Clean up old snapshots (retention policy)
 */
export async function cleanupOldSnapshots(
  retentionDays: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

  const result = await db
    .delete(competitorSnapshots)
    .where(sql`${competitorSnapshots.snapshotDate} < ${cutoffDateStr}`);

  return 0; // Drizzle doesn't return count on delete
}
