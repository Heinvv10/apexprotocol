/**
 * Sentiment Trajectory Analysis (Phase 5.2)
 *
 * Builds time-bucketed sentiment series from brand_mentions, detects shift
 * triggers (buckets with disproportionate deltas), and feeds the series into
 * the existing ML forecaster to predict near-term trend.
 */

import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandMentions } from "@/lib/db/schema";
import { forecastGeoScore } from "@/lib/ml/forecaster";
import type { HistoricalDataPoint } from "@/lib/ml/data-pipeline";
import type { ForecastResult } from "@/lib/ml/forecaster";

export type SentimentBucketGranularity = "day" | "week";

export interface SentimentBucket {
  periodStart: Date;
  periodEnd: Date;
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  unrecognized: number;
  /** Normalized sentiment score in [-1, 1] */
  sentimentScore: number;
  /** Change vs. prior bucket's score, or null for first bucket */
  delta: number | null;
  /** Topics/queries most prevalent in this window */
  topQueries: string[];
  /** Platforms contributing mentions in this window */
  platforms: string[];
}

export interface SentimentTrigger {
  /** Index into the trajectory buckets */
  bucketIndex: number;
  periodStart: Date;
  direction: "positive_shift" | "negative_shift";
  magnitude: number;
  sentimentBefore: number;
  sentimentAfter: number;
  mentionCountBefore: number;
  mentionCountAfter: number;
  /** Representative queries from the triggered bucket */
  sampleQueries: string[];
  sampleResponses: string[];
  platforms: string[];
}

export interface SentimentTrajectoryResult {
  brandId: string;
  granularity: SentimentBucketGranularity;
  windowStart: Date;
  windowEnd: Date;
  buckets: SentimentBucket[];
  triggers: SentimentTrigger[];
  forecast: ForecastResult | null;
  summary: {
    totalMentions: number;
    overallSentimentScore: number;
    trendDirection: "improving" | "declining" | "stable";
    volatility: number;
  };
}

export interface SentimentTrajectoryOptions {
  /** Default: 90 days back */
  windowDays?: number;
  /** Default: "day" */
  granularity?: SentimentBucketGranularity;
  /** Min absolute delta to flag a trigger, default 0.2 */
  triggerThreshold?: number;
  /** Max sample queries per trigger, default 3 */
  triggerSampleLimit?: number;
  /** Run the forecaster over the bucket series, default true */
  includeForecast?: boolean;
}

const SCORE_WEIGHTS = { positive: 1, neutral: 0, negative: -1, unrecognized: 0 };

function startOfBucket(date: Date, granularity: SentimentBucketGranularity): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  if (granularity === "week") {
    const day = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - day);
  }
  return d;
}

function advanceBucket(date: Date, granularity: SentimentBucketGranularity): Date {
  const next = new Date(date);
  if (granularity === "week") next.setUTCDate(next.getUTCDate() + 7);
  else next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function computeVolatility(deltas: Array<number | null>): number {
  const clean = deltas.filter((d): d is number => d !== null);
  if (clean.length === 0) return 0;
  const mean = clean.reduce((a, b) => a + b, 0) / clean.length;
  const variance =
    clean.reduce((a, b) => a + (b - mean) ** 2, 0) / clean.length;
  return Math.sqrt(variance);
}

export async function buildSentimentTrajectory(
  brandId: string,
  options: SentimentTrajectoryOptions = {},
): Promise<SentimentTrajectoryResult> {
  const windowDays = options.windowDays ?? 90;
  const granularity = options.granularity ?? "day";
  const triggerThreshold = options.triggerThreshold ?? 0.2;
  const sampleLimit = options.triggerSampleLimit ?? 3;
  const includeForecast = options.includeForecast ?? true;

  const windowEnd = new Date();
  const windowStart = new Date(
    windowEnd.getTime() - windowDays * 24 * 60 * 60 * 1000,
  );

  const mentions = await db
    .select({
      timestamp: brandMentions.timestamp,
      sentiment: brandMentions.sentiment,
      query: brandMentions.query,
      response: brandMentions.response,
      platform: brandMentions.platform,
    })
    .from(brandMentions)
    .where(
      and(
        eq(brandMentions.brandId, brandId),
        gte(brandMentions.timestamp, windowStart),
        lte(brandMentions.timestamp, windowEnd),
      ),
    )
    .orderBy(asc(brandMentions.timestamp));

  if (mentions.length === 0) {
    return {
      brandId,
      granularity,
      windowStart,
      windowEnd,
      buckets: [],
      triggers: [],
      forecast: null,
      summary: {
        totalMentions: 0,
        overallSentimentScore: 0,
        trendDirection: "stable",
        volatility: 0,
      },
    };
  }

  // Group mentions into buckets keyed by bucket start ISO
  const grouped = new Map<
    string,
    {
      periodStart: Date;
      items: typeof mentions;
    }
  >();

  for (const m of mentions) {
    const start = startOfBucket(m.timestamp, granularity);
    const key = start.toISOString();
    const existing = grouped.get(key);
    if (existing) existing.items.push(m);
    else grouped.set(key, { periodStart: start, items: [m] });
  }

  // Fill bucket series including empties
  const bucketStarts: Date[] = [];
  let cursor = startOfBucket(windowStart, granularity);
  while (cursor <= windowEnd) {
    bucketStarts.push(new Date(cursor));
    cursor = advanceBucket(cursor, granularity);
  }

  const buckets: SentimentBucket[] = [];
  let prevScore: number | null = null;

  for (const start of bucketStarts) {
    const periodEnd = advanceBucket(start, granularity);
    const entry = grouped.get(start.toISOString());
    const items = entry?.items ?? [];

    const counts = { positive: 0, neutral: 0, negative: 0, unrecognized: 0 };
    let weighted = 0;
    const queryTally = new Map<string, number>();
    const platformSet = new Set<string>();

    for (const m of items) {
      const key = (m.sentiment ?? "neutral") as keyof typeof counts;
      counts[key]++;
      weighted += SCORE_WEIGHTS[key];
      queryTally.set(m.query, (queryTally.get(m.query) ?? 0) + 1);
      if (m.platform) platformSet.add(m.platform);
    }

    const total = items.length;
    const sentimentScore = total > 0 ? weighted / total : 0;
    const delta = prevScore === null ? null : sentimentScore - prevScore;
    prevScore = sentimentScore;

    const topQueries = Array.from(queryTally.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([q]) => q);

    buckets.push({
      periodStart: start,
      periodEnd,
      total,
      positive: counts.positive,
      neutral: counts.neutral,
      negative: counts.negative,
      unrecognized: counts.unrecognized,
      sentimentScore,
      delta,
      topQueries,
      platforms: Array.from(platformSet),
    });
  }

  // Trigger detection: buckets with |delta| >= threshold AND meaningful volume
  const triggers: SentimentTrigger[] = [];
  for (let i = 1; i < buckets.length; i++) {
    const bucket = buckets[i];
    const prev = buckets[i - 1];
    if (bucket.delta === null) continue;
    if (Math.abs(bucket.delta) < triggerThreshold) continue;
    // Require at least 3 mentions in the triggering bucket
    if (bucket.total < 3) continue;

    const originalItems =
      grouped.get(bucket.periodStart.toISOString())?.items ?? [];

    triggers.push({
      bucketIndex: i,
      periodStart: bucket.periodStart,
      direction: bucket.delta >= 0 ? "positive_shift" : "negative_shift",
      magnitude: Math.abs(bucket.delta),
      sentimentBefore: prev.sentimentScore,
      sentimentAfter: bucket.sentimentScore,
      mentionCountBefore: prev.total,
      mentionCountAfter: bucket.total,
      sampleQueries: bucket.topQueries.slice(0, sampleLimit),
      sampleResponses: originalItems
        .slice(0, sampleLimit)
        .map((m) => m.response.slice(0, 280)),
      platforms: bucket.platforms,
    });
  }

  triggers.sort((a, b) => b.magnitude - a.magnitude);

  // Forecast trend using existing forecaster (re-purposed for sentiment)
  let forecast: ForecastResult | null = null;
  if (includeForecast && buckets.filter((b) => b.total > 0).length >= 10) {
    const historical: HistoricalDataPoint[] = buckets
      .filter((b) => b.total > 0)
      .map((b) => ({
        date: b.periodStart,
        // Rescale [-1,1] → [0,100] so the forecaster's score-space checks hold
        score: Math.round((b.sentimentScore + 1) * 50),
      }));
    try {
      forecast = await forecastGeoScore(historical, {
        periods: granularity === "week" ? 8 : 30,
        cacheKey: `sentiment-trajectory:${brandId}:${granularity}`,
      });
    } catch {
      forecast = null;
    }
  }

  const overall =
    mentions.length > 0
      ? mentions.reduce(
          (sum, m) => sum + (SCORE_WEIGHTS[(m.sentiment ?? "neutral") as keyof typeof SCORE_WEIGHTS] ?? 0),
          0,
        ) / mentions.length
      : 0;

  const recentBuckets = buckets.slice(-5).filter((b) => b.total > 0);
  let trendDirection: "improving" | "declining" | "stable" = "stable";
  if (recentBuckets.length >= 2) {
    const first = recentBuckets[0].sentimentScore;
    const last = recentBuckets[recentBuckets.length - 1].sentimentScore;
    const trendDelta = last - first;
    if (trendDelta > 0.1) trendDirection = "improving";
    else if (trendDelta < -0.1) trendDirection = "declining";
  }

  return {
    brandId,
    granularity,
    windowStart,
    windowEnd,
    buckets,
    triggers,
    forecast,
    summary: {
      totalMentions: mentions.length,
      overallSentimentScore: overall,
      trendDirection,
      volatility: computeVolatility(buckets.map((b) => b.delta)),
    },
  };
}
