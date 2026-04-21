/**
 * Why Analysis Engine (Phase 2.1)
 *
 * Root-cause attribution for visibility changes. Given a brand and two
 * comparison windows (current vs. baseline), computes factor-level deltas
 * across:
 *   - content quality (audit category scores)
 *   - freshness (days since last audit / stale citations)
 *   - authority (average source authority)
 *   - citations (citation volume trend)
 *   - competitor push (SOV delta, if available)
 *   - sentiment (average sentiment delta)
 *
 * Ranks factors by absolute contribution, returns a natural-language
 * explanation plus the numeric breakdown for the UI.
 */

import { and, desc, eq, gte, lte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { audits, brandMentions } from "@/lib/db/schema";
import { analyzeBrandSources } from "@/lib/monitor/source-attribution";
import { buildSentimentTrajectory } from "@/lib/monitor/sentiment-trajectory";

export type WhyFactor =
  | "content"
  | "freshness"
  | "authority"
  | "citations"
  | "competitor"
  | "sentiment";

export interface FactorContribution {
  factor: WhyFactor;
  direction: "positive" | "negative" | "neutral";
  /** 0..100 — relative weight in the overall change */
  contributionPercent: number;
  /** The raw value of the metric in the current window */
  currentValue: number;
  /** The raw value of the metric in the baseline window */
  baselineValue: number;
  /** Normalized delta (positive = improvement) */
  normalizedDelta: number;
  summary: string;
  detail: string;
}

export interface WhyAnalysisResult {
  brandId: string;
  currentWindow: { start: Date; end: Date };
  baselineWindow: { start: Date; end: Date };
  overallScoreDelta: number;
  currentScore: number | null;
  baselineScore: number | null;
  factors: FactorContribution[];
  narrative: string;
  topDriver: WhyFactor | null;
}

export interface WhyAnalysisOptions {
  /** Length of each comparison window in days (default: 30) */
  windowDays?: number;
  /** Gap between windows in days (default: 0 — adjacent windows) */
  gapDays?: number;
}

async function fetchLatestAuditScoreInWindow(
  brandId: string,
  start: Date,
  end: Date,
): Promise<number | null> {
  const rows = await db
    .select({ overallScore: audits.overallScore })
    .from(audits)
    .where(
      and(
        eq(audits.brandId, brandId),
        eq(audits.status, "completed"),
        gte(audits.completedAt, start),
        lte(audits.completedAt, end),
      ),
    )
    .orderBy(desc(audits.completedAt))
    .limit(1);
  return rows[0]?.overallScore ?? null;
}

async function daysSinceLastAudit(brandId: string, asOf: Date): Promise<number | null> {
  const rows = await db
    .select({ completedAt: audits.completedAt })
    .from(audits)
    .where(
      and(
        eq(audits.brandId, brandId),
        eq(audits.status, "completed"),
        lt(audits.completedAt, asOf),
      ),
    )
    .orderBy(desc(audits.completedAt))
    .limit(1);
  const last = rows[0]?.completedAt;
  if (!last) return null;
  return Math.floor((asOf.getTime() - last.getTime()) / (24 * 60 * 60 * 1000));
}

async function mentionStatsInWindow(
  brandId: string,
  start: Date,
  end: Date,
): Promise<{ total: number; cited: number; avgSentimentScore: number }> {
  const rows = await db
    .select({
      sentiment: brandMentions.sentiment,
      citationUrl: brandMentions.citationUrl,
    })
    .from(brandMentions)
    .where(
      and(
        eq(brandMentions.brandId, brandId),
        gte(brandMentions.timestamp, start),
        lte(brandMentions.timestamp, end),
      ),
    );

  const total = rows.length;
  const cited = rows.filter((r) => r.citationUrl).length;
  const sentimentWeights = { positive: 1, neutral: 0, negative: -1, unrecognized: 0 } as const;
  const avgSentimentScore =
    total === 0
      ? 0
      : rows.reduce(
          (s, r) =>
            s + (sentimentWeights[(r.sentiment ?? "neutral") as keyof typeof sentimentWeights] ?? 0),
          0,
        ) / total;

  return { total, cited, avgSentimentScore };
}

function normalizeDelta(current: number, baseline: number, scale: number): number {
  if (scale === 0) return 0;
  return Math.max(-1, Math.min(1, (current - baseline) / scale));
}

function formatNumeric(n: number, decimals: number = 1): string {
  return n.toFixed(decimals);
}

function classifyDirection(
  normalizedDelta: number,
  thresholds = { dead: 0.05 },
): FactorContribution["direction"] {
  if (Math.abs(normalizedDelta) < thresholds.dead) return "neutral";
  return normalizedDelta > 0 ? "positive" : "negative";
}

export async function analyzeWhy(
  brandId: string,
  options: WhyAnalysisOptions = {},
): Promise<WhyAnalysisResult> {
  const windowDays = options.windowDays ?? 30;
  const gapDays = options.gapDays ?? 0;
  const dayMs = 24 * 60 * 60 * 1000;

  const currentEnd = new Date();
  const currentStart = new Date(currentEnd.getTime() - windowDays * dayMs);
  const baselineEnd = new Date(currentStart.getTime() - gapDays * dayMs);
  const baselineStart = new Date(baselineEnd.getTime() - windowDays * dayMs);

  const [
    currentScore,
    baselineScore,
    currentMentions,
    baselineMentions,
    currentSourcesAnalysis,
    baselineSourcesAnalysis,
    sentimentTrajectory,
    daysSinceAudit,
  ] = await Promise.all([
    fetchLatestAuditScoreInWindow(brandId, currentStart, currentEnd),
    fetchLatestAuditScoreInWindow(brandId, baselineStart, baselineEnd),
    mentionStatsInWindow(brandId, currentStart, currentEnd),
    mentionStatsInWindow(brandId, baselineStart, baselineEnd),
    analyzeBrandSources(brandId, { windowDays }),
    analyzeBrandSources(brandId, { windowDays: windowDays * 2 }),
    buildSentimentTrajectory(brandId, {
      windowDays: windowDays * 2,
      granularity: "day",
      includeForecast: false,
    }),
    daysSinceLastAudit(brandId, currentEnd),
  ]);

  const overallScoreDelta =
    currentScore !== null && baselineScore !== null ? currentScore - baselineScore : 0;

  const factors: FactorContribution[] = [];

  // --- Content (overall audit score as proxy for content/technical quality) ---
  if (currentScore !== null && baselineScore !== null) {
    const normalized = normalizeDelta(currentScore, baselineScore, 20);
    factors.push({
      factor: "content",
      direction: classifyDirection(normalized),
      contributionPercent: 0,
      currentValue: currentScore,
      baselineValue: baselineScore,
      normalizedDelta: normalized,
      summary: `Overall audit score ${currentScore >= baselineScore ? "rose" : "fell"} from ${baselineScore} to ${currentScore}`,
      detail: `Your audit score ${normalized >= 0 ? "improved" : "regressed"} by ${Math.abs(currentScore - baselineScore)} points versus the prior ${windowDays}-day window.`,
    });
  }

  // --- Freshness (days since last audit — high = bad) ---
  if (daysSinceAudit !== null) {
    const normalized = daysSinceAudit > windowDays ? -0.5 : 0;
    factors.push({
      factor: "freshness",
      direction: daysSinceAudit > windowDays ? "negative" : "neutral",
      contributionPercent: 0,
      currentValue: daysSinceAudit,
      baselineValue: windowDays,
      normalizedDelta: normalized,
      summary:
        daysSinceAudit > windowDays
          ? `Audit data is stale (${daysSinceAudit} days old)`
          : `Audit data is fresh (${daysSinceAudit} days old)`,
      detail:
        daysSinceAudit > windowDays
          ? `Your last completed audit is ${daysSinceAudit} days old, which exceeds the ${windowDays}-day window. AI engines may be citing outdated data about your brand.`
          : `Audit freshness is within tolerance.`,
    });
  }

  // --- Authority (average source authority delta) ---
  const currentAvgAuthority = currentSourcesAnalysis.summary.averageAuthority;
  const baselineAvgAuthority = baselineSourcesAnalysis.summary.averageAuthority;
  const authorityNormalized = normalizeDelta(currentAvgAuthority, baselineAvgAuthority, 20);
  factors.push({
    factor: "authority",
    direction: classifyDirection(authorityNormalized),
    contributionPercent: 0,
    currentValue: currentAvgAuthority,
    baselineValue: baselineAvgAuthority,
    normalizedDelta: authorityNormalized,
    summary: `Average source authority ${authorityNormalized >= 0 ? "strengthened" : "weakened"} from ${baselineAvgAuthority} to ${currentAvgAuthority}`,
    detail:
      authorityNormalized >= 0
        ? `Your citations are coming from higher-authority domains than before — AI engines give more weight to this.`
        : `Citation mix shifted toward lower-authority domains. Pursue coverage in stronger outlets.`,
  });

  // --- Citations (volume delta) ---
  const citationsNormalized =
    baselineMentions.cited === 0 && currentMentions.cited === 0
      ? 0
      : normalizeDelta(
          currentMentions.cited,
          baselineMentions.cited,
          Math.max(5, baselineMentions.cited),
        );
  factors.push({
    factor: "citations",
    direction: classifyDirection(citationsNormalized),
    contributionPercent: 0,
    currentValue: currentMentions.cited,
    baselineValue: baselineMentions.cited,
    normalizedDelta: citationsNormalized,
    summary: `Citation count ${currentMentions.cited > baselineMentions.cited ? "rose" : currentMentions.cited < baselineMentions.cited ? "fell" : "held steady"} from ${baselineMentions.cited} to ${currentMentions.cited}`,
    detail: `Over the current ${windowDays}-day window you received ${currentMentions.cited} citations (vs. ${baselineMentions.cited} in the baseline).`,
  });

  // --- Competitor (mention volume as a proxy — SOV proxy using cited/total ratio) ---
  const currentShare =
    currentMentions.total > 0 ? currentMentions.cited / currentMentions.total : 0;
  const baselineShare =
    baselineMentions.total > 0 ? baselineMentions.cited / baselineMentions.total : 0;
  const competitorNormalized = normalizeDelta(currentShare, baselineShare, 0.3);
  factors.push({
    factor: "competitor",
    direction: classifyDirection(competitorNormalized),
    contributionPercent: 0,
    currentValue: Math.round(currentShare * 100),
    baselineValue: Math.round(baselineShare * 100),
    normalizedDelta: competitorNormalized,
    summary:
      competitorNormalized >= 0
        ? `Your citation share of voice (${Math.round(currentShare * 100)}%) rose`
        : `Competitors gained share — your citation rate fell from ${Math.round(baselineShare * 100)}% to ${Math.round(currentShare * 100)}%`,
    detail: `Citation-to-mention ratio moved from ${formatNumeric(baselineShare * 100)}% to ${formatNumeric(currentShare * 100)}%. A decline usually signals competitor content is outranking yours.`,
  });

  // --- Sentiment (trajectory delta over recent vs prior) ---
  const sentimentBuckets = sentimentTrajectory.buckets;
  let sentimentCurrent = 0;
  let sentimentBaseline = 0;
  if (sentimentBuckets.length >= 2) {
    const midpoint = Math.floor(sentimentBuckets.length / 2);
    const baselineSlice = sentimentBuckets.slice(0, midpoint).filter((b) => b.total > 0);
    const currentSlice = sentimentBuckets.slice(midpoint).filter((b) => b.total > 0);
    sentimentBaseline =
      baselineSlice.length > 0
        ? baselineSlice.reduce((s, b) => s + b.sentimentScore, 0) / baselineSlice.length
        : 0;
    sentimentCurrent =
      currentSlice.length > 0
        ? currentSlice.reduce((s, b) => s + b.sentimentScore, 0) / currentSlice.length
        : 0;
  }
  const sentimentNormalized = normalizeDelta(sentimentCurrent, sentimentBaseline, 0.5);
  factors.push({
    factor: "sentiment",
    direction: classifyDirection(sentimentNormalized),
    contributionPercent: 0,
    currentValue: Math.round(sentimentCurrent * 100) / 100,
    baselineValue: Math.round(sentimentBaseline * 100) / 100,
    normalizedDelta: sentimentNormalized,
    summary: `Average sentiment ${sentimentNormalized >= 0 ? "improved" : "declined"} from ${formatNumeric(sentimentBaseline, 2)} to ${formatNumeric(sentimentCurrent, 2)}`,
    detail: `Sentiment is on a ${sentimentTrajectory.summary.trendDirection} trend with ${formatNumeric(sentimentTrajectory.summary.volatility * 100)}% volatility.`,
  });

  // Compute contribution percentages relative to absolute deltas
  const totalAbs = factors.reduce((s, f) => s + Math.abs(f.normalizedDelta), 0);
  for (const f of factors) {
    f.contributionPercent =
      totalAbs > 0 ? Math.round((Math.abs(f.normalizedDelta) / totalAbs) * 100) : 0;
  }

  // Sort by contribution descending
  factors.sort((a, b) => b.contributionPercent - a.contributionPercent);

  const topDriver = factors.length > 0 ? factors[0].factor : null;
  const narrative = buildNarrative({
    overallScoreDelta,
    currentScore,
    baselineScore,
    factors,
    topDriver,
  });

  return {
    brandId,
    currentWindow: { start: currentStart, end: currentEnd },
    baselineWindow: { start: baselineStart, end: baselineEnd },
    overallScoreDelta,
    currentScore,
    baselineScore,
    factors,
    narrative,
    topDriver,
  };
}

function buildNarrative(params: {
  overallScoreDelta: number;
  currentScore: number | null;
  baselineScore: number | null;
  factors: FactorContribution[];
  topDriver: WhyFactor | null;
}): string {
  if (params.currentScore === null || params.baselineScore === null) {
    return `Insufficient audit history to produce a 'why' analysis. Run at least two audits in consecutive windows, then retry.`;
  }

  const direction =
    params.overallScoreDelta > 0
      ? "rose"
      : params.overallScoreDelta < 0
        ? "fell"
        : "held steady";
  const head = `Your visibility score ${direction} ${Math.abs(params.overallScoreDelta)} points (${params.baselineScore} → ${params.currentScore}).`;

  const significant = params.factors.filter((f) => f.direction !== "neutral").slice(0, 3);
  if (significant.length === 0) {
    return `${head} No individual factor moved enough to explain the change — drivers are balanced.`;
  }

  const driverLines = significant.map((f, i) => {
    const verb = f.direction === "positive" ? "helped" : "hurt";
    return `${i + 1}. ${f.factor.charAt(0).toUpperCase()}${f.factor.slice(1)} ${verb} (~${f.contributionPercent}% of the move): ${f.summary}.`;
  });

  return `${head}\n\nTop contributors:\n${driverLines.join("\n")}`;
}
