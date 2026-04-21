/**
 * Period-over-period comparison (Phase 1.3)
 *
 * Computes MoM, QoQ, YoY deltas on key metrics:
 *   - GEO audit score
 *   - Mention volume
 *   - Citation count
 *   - Citation share (cited / total mentions)
 *   - Sentiment average
 *
 * Uses `brand_mentions` + `audits` tables — no schema additions needed.
 */

import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { audits, brandMentions } from "@/lib/db/schema";

export type ComparisonPeriod = "mom" | "qoq" | "yoy";

export interface PeriodMetrics {
  start: Date;
  end: Date;
  label: string;
  mentionCount: number;
  citationCount: number;
  citationShare: number;
  averageAuditScore: number | null;
  averageSentimentScore: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
}

export interface MetricDelta {
  metric:
    | "mentionCount"
    | "citationCount"
    | "citationShare"
    | "averageAuditScore"
    | "averageSentimentScore";
  current: number | null;
  previous: number | null;
  absoluteDelta: number | null;
  percentDelta: number | null;
  direction: "up" | "down" | "flat" | "n/a";
}

export interface PeriodComparisonResult {
  brandId: string;
  period: ComparisonPeriod;
  currentPeriod: PeriodMetrics;
  previousPeriod: PeriodMetrics;
  deltas: MetricDelta[];
}

const SENTIMENT_WEIGHTS = {
  positive: 1,
  neutral: 0,
  negative: -1,
  unrecognized: 0,
} as const;

function computeWindows(period: ComparisonPeriod, reference: Date): {
  current: { start: Date; end: Date; label: string };
  previous: { start: Date; end: Date; label: string };
} {
  const end = new Date(reference);
  end.setUTCHours(23, 59, 59, 999);

  if (period === "mom") {
    // Current = last 30 days; previous = 30 days before that
    const currentStart = new Date(end);
    currentStart.setUTCDate(currentStart.getUTCDate() - 29);
    currentStart.setUTCHours(0, 0, 0, 0);
    const previousEnd = new Date(currentStart);
    previousEnd.setUTCMilliseconds(previousEnd.getUTCMilliseconds() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setUTCDate(previousStart.getUTCDate() - 29);
    previousStart.setUTCHours(0, 0, 0, 0);
    return {
      current: { start: currentStart, end, label: "Last 30 days" },
      previous: {
        start: previousStart,
        end: previousEnd,
        label: "Prior 30 days",
      },
    };
  }

  if (period === "qoq") {
    const currentStart = new Date(end);
    currentStart.setUTCDate(currentStart.getUTCDate() - 89);
    currentStart.setUTCHours(0, 0, 0, 0);
    const previousEnd = new Date(currentStart);
    previousEnd.setUTCMilliseconds(previousEnd.getUTCMilliseconds() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setUTCDate(previousStart.getUTCDate() - 89);
    previousStart.setUTCHours(0, 0, 0, 0);
    return {
      current: { start: currentStart, end, label: "Last quarter" },
      previous: {
        start: previousStart,
        end: previousEnd,
        label: "Prior quarter",
      },
    };
  }

  // yoy
  const currentStart = new Date(end);
  currentStart.setUTCDate(currentStart.getUTCDate() - 364);
  currentStart.setUTCHours(0, 0, 0, 0);
  const previousEnd = new Date(currentStart);
  previousEnd.setUTCMilliseconds(previousEnd.getUTCMilliseconds() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - 364);
  previousStart.setUTCHours(0, 0, 0, 0);
  return {
    current: { start: currentStart, end, label: "Last year" },
    previous: { start: previousStart, end: previousEnd, label: "Prior year" },
  };
}

async function fetchPeriodMetrics(
  brandId: string,
  window: { start: Date; end: Date; label: string },
): Promise<PeriodMetrics> {
  const [mentionRows, auditRows] = await Promise.all([
    db
      .select({
        sentiment: brandMentions.sentiment,
        citationUrl: brandMentions.citationUrl,
      })
      .from(brandMentions)
      .where(
        and(
          eq(brandMentions.brandId, brandId),
          gte(brandMentions.timestamp, window.start),
          lte(brandMentions.timestamp, window.end),
        ),
      ),
    db
      .select({
        overallScore: audits.overallScore,
        completedAt: audits.completedAt,
      })
      .from(audits)
      .where(
        and(
          eq(audits.brandId, brandId),
          eq(audits.status, "completed"),
          gte(audits.completedAt, window.start),
          lte(audits.completedAt, window.end),
        ),
      )
      .orderBy(asc(audits.completedAt)),
  ]);

  const mentionCount = mentionRows.length;
  const citationCount = mentionRows.filter((r) => r.citationUrl).length;
  const citationShare = mentionCount > 0 ? citationCount / mentionCount : 0;

  const sentimentSum = mentionRows.reduce(
    (s, r) =>
      s +
      (SENTIMENT_WEIGHTS[(r.sentiment ?? "neutral") as keyof typeof SENTIMENT_WEIGHTS] ??
        0),
    0,
  );
  const averageSentimentScore =
    mentionCount > 0 ? sentimentSum / mentionCount : 0;

  const scores = auditRows
    .map((a) => a.overallScore)
    .filter((s): s is number => s !== null);
  const averageAuditScore =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  return {
    start: window.start,
    end: window.end,
    label: window.label,
    mentionCount,
    citationCount,
    citationShare,
    averageAuditScore,
    averageSentimentScore,
    positiveCount: mentionRows.filter((r) => r.sentiment === "positive").length,
    neutralCount: mentionRows.filter((r) => r.sentiment === "neutral").length,
    negativeCount: mentionRows.filter((r) => r.sentiment === "negative").length,
  };
}

function computeDelta(
  metric: MetricDelta["metric"],
  current: number | null,
  previous: number | null,
): MetricDelta {
  if (current === null && previous === null) {
    return {
      metric,
      current,
      previous,
      absoluteDelta: null,
      percentDelta: null,
      direction: "n/a",
    };
  }
  if (previous === null || previous === 0) {
    if (current === null) {
      return {
        metric,
        current,
        previous,
        absoluteDelta: null,
        percentDelta: null,
        direction: "n/a",
      };
    }
    return {
      metric,
      current,
      previous,
      absoluteDelta: current,
      percentDelta: null,
      direction: current > 0 ? "up" : current < 0 ? "down" : "flat",
    };
  }
  if (current === null) {
    return {
      metric,
      current,
      previous,
      absoluteDelta: -previous,
      percentDelta: -100,
      direction: "down",
    };
  }
  const absoluteDelta = current - previous;
  const percentDelta = (absoluteDelta / Math.abs(previous)) * 100;
  const direction =
    Math.abs(percentDelta) < 0.5 ? "flat" : percentDelta > 0 ? "up" : "down";
  return { metric, current, previous, absoluteDelta, percentDelta, direction };
}

export async function compareBrandPeriods(
  brandId: string,
  period: ComparisonPeriod,
  options: { reference?: Date } = {},
): Promise<PeriodComparisonResult> {
  const reference = options.reference ?? new Date();
  const windows = computeWindows(period, reference);

  const [currentPeriod, previousPeriod] = await Promise.all([
    fetchPeriodMetrics(brandId, windows.current),
    fetchPeriodMetrics(brandId, windows.previous),
  ]);

  const deltas: MetricDelta[] = [
    computeDelta("mentionCount", currentPeriod.mentionCount, previousPeriod.mentionCount),
    computeDelta("citationCount", currentPeriod.citationCount, previousPeriod.citationCount),
    computeDelta("citationShare", currentPeriod.citationShare, previousPeriod.citationShare),
    computeDelta(
      "averageAuditScore",
      currentPeriod.averageAuditScore,
      previousPeriod.averageAuditScore,
    ),
    computeDelta(
      "averageSentimentScore",
      currentPeriod.averageSentimentScore,
      previousPeriod.averageSentimentScore,
    ),
  ];

  return {
    brandId,
    period,
    currentPeriod,
    previousPeriod,
    deltas,
  };
}

/**
 * Convenience: fetch MoM + QoQ + YoY in parallel.
 */
export async function compareBrandAllPeriods(
  brandId: string,
  reference?: Date,
): Promise<Record<ComparisonPeriod, PeriodComparisonResult>> {
  const [mom, qoq, yoy] = await Promise.all([
    compareBrandPeriods(brandId, "mom", { reference }),
    compareBrandPeriods(brandId, "qoq", { reference }),
    compareBrandPeriods(brandId, "yoy", { reference }),
  ]);
  return { mom, qoq, yoy };
}

// Re-export desc for downstream consumers that want the latest audit
export { desc };
