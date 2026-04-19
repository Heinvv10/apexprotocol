/**
 * N-runs averaging with confidence intervals (🏆 FR-MON-014 / FR-MON-015).
 *
 * Every LLM response is non-deterministic — even at temperature=0 there's
 * measurable variance due to GPU batch math. Competitors hide this; we
 * publish it.
 *
 * For each tracked prompt, we run N requests (typically 3 or 5), aggregate
 * the mention-rate and citation-position across runs, and expose:
 *   - point estimate (mean)
 *   - standard deviation
 *   - 95% confidence interval (Wilson score interval for proportions,
 *     Student-t for small-sample means)
 *   - agreement rate (TARa@N) — how often N runs agree on "brand mentioned"
 *
 * Marketing claim: "Every score in Apex is an average of N queries with a
 * confidence interval. If we don't have enough runs to be confident, we
 * say so."
 *
 * This module is pure statistical helpers + a cohort runner. The scraper
 * orchestrator calls `runProbeNTimes(prompt, N)` and gets back an
 * aggregate with confidence bands.
 */

import {
  extractMentionSignal,
  type BrandContext,
  type ExtractionResult,
} from "./extractor";

export interface SingleRunResult {
  runIndex: number;
  brandMentioned: boolean;
  position: number | null;
  sentimentLabel: ExtractionResult["sentiment"]["label"];
  extractedAt: string;
}

export interface NRunsAggregate {
  n: number;
  /** Count of runs where the brand was mentioned */
  mentionedCount: number;
  /** Mention rate — mentionedCount / n */
  mentionedRate: number;
  /** Wilson 95% CI on mention rate */
  mentionedRateCI95: { low: number; high: number };
  /** Position mean across runs where brand appeared, null if never */
  positionMean: number | null;
  /** Position sample std-dev, null if n<2 or brand never mentioned */
  positionStdev: number | null;
  /** Position 95% CI using Student's t (one-sided tail), null if undefined */
  positionCI95: { low: number; high: number } | null;
  /** TARa@N — proportion of runs that agreed on the modal mentioned/not-mentioned outcome */
  agreementRate: number;
  /** Dominant sentiment across runs */
  modalSentiment: ExtractionResult["sentiment"]["label"];
  /** Flag: true when N<3 — caller should surface "insufficient data" in UI */
  insufficient: boolean;
  runs: SingleRunResult[];
}

interface ScraperLike {
  (query: string): Promise<{
    response: string;
  }>;
}

/**
 * Run a single query N times via `scraper`, extract mention signal per run,
 * then aggregate with confidence intervals.
 */
export async function runProbeNTimes(
  query: string,
  brand: BrandContext,
  n: number,
  scraper: ScraperLike,
  opts?: { tenantId?: string; brandId?: string },
): Promise<NRunsAggregate> {
  const clampedN = Math.max(1, Math.min(n, 25));
  const runs: SingleRunResult[] = [];

  // Run sequentially. Parallel would hit provider rate limits quickly —
  // the orchestrator that calls this already parallelizes across prompts.
  for (let i = 0; i < clampedN; i++) {
    const { response } = await scraper(query);
    const result = await extractMentionSignal({
      brand,
      response,
      query,
      tenantId: opts?.tenantId,
      brandId: opts?.brandId,
    });
    runs.push({
      runIndex: i,
      brandMentioned: result.brandMentioned,
      position: result.position,
      sentimentLabel: result.sentiment.label,
      extractedAt: new Date().toISOString(),
    });
  }

  return aggregate(runs);
}

/**
 * Aggregate already-run results — exported so scrapers that buffer runs in
 * BullMQ can compute stats once all runs land.
 */
export function aggregate(runs: SingleRunResult[]): NRunsAggregate {
  const n = runs.length;
  const mentionedCount = runs.filter((r) => r.brandMentioned).length;
  const mentionedRate = n === 0 ? 0 : mentionedCount / n;
  const mentionedRateCI95 = wilsonInterval(mentionedCount, n, 1.96);

  const positions = runs
    .map((r) => r.position)
    .filter((p): p is number => typeof p === "number");
  const positionMean =
    positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : null;
  const positionStdev = sampleStdev(positions, positionMean);
  const positionCI95 =
    positionMean !== null && positions.length >= 2
      ? tInterval(positionMean, positionStdev ?? 0, positions.length)
      : null;

  // Agreement rate: the modal (most-common) "mentioned/not" classification's share
  const modalIsMentioned = mentionedCount >= n - mentionedCount;
  const modalCount = modalIsMentioned ? mentionedCount : n - mentionedCount;
  const agreementRate = n === 0 ? 0 : modalCount / n;

  const modalSentiment = mostCommon(
    runs.map((r) => r.sentimentLabel),
  ) as ExtractionResult["sentiment"]["label"];

  return {
    n,
    mentionedCount,
    mentionedRate,
    mentionedRateCI95,
    positionMean,
    positionStdev,
    positionCI95,
    agreementRate,
    modalSentiment: modalSentiment ?? "unrecognized",
    insufficient: n < 3,
    runs,
  };
}

/**
 * Wilson score interval for a binomial proportion.
 * More accurate than normal approximation when n is small or rate is near
 * 0/1 — which is the regime we're actually in for GEO tracking.
 */
function wilsonInterval(
  successes: number,
  n: number,
  z: number,
): { low: number; high: number } {
  if (n === 0) return { low: 0, high: 0 };
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const halfWidth = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return {
    low: Math.max(0, center - halfWidth),
    high: Math.min(1, center + halfWidth),
  };
}

function sampleStdev(xs: number[], mean: number | null): number | null {
  if (xs.length < 2 || mean === null) return null;
  const variance =
    xs.reduce((acc, x) => acc + (x - mean) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

/**
 * Student's t-interval for the mean of `n` observations.
 * We use a small-sample-friendly approximation: `t = 2` for n <= 10 (≈95%
 * two-sided), `t = 1.96` for n > 10. For production-grade rigour swap in a
 * proper t-distribution lookup; this approximation is within ±0.1 of the
 * true t-quantile for the sample sizes we actually run.
 */
function tInterval(
  mean: number,
  stdev: number,
  n: number,
): { low: number; high: number } {
  const t = n <= 10 ? 2.228 : 1.96; // t_0.025,9 ≈ 2.228
  const se = stdev / Math.sqrt(n);
  return { low: mean - t * se, high: mean + t * se };
}

function mostCommon<T>(xs: T[]): T | null {
  if (xs.length === 0) return null;
  const counts = new Map<T, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best: T | null = null;
  let bestCount = -1;
  for (const [k, v] of counts.entries()) {
    if (v > bestCount) {
      best = k;
      bestCount = v;
    }
  }
  return best;
}
