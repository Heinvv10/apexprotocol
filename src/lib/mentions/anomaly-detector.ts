/**
 * Statistical anomaly detection on brand mention streams.
 *
 * Requirement: FR-MON-029 anomaly detection (3σ threshold).
 *
 * Computes per-day rolling stats (mean + stdev) over a trailing window, then
 * flags today's value as an anomaly if it's >3σ from the mean. Two signals:
 *   1. Mention rate — sudden drop or surge in brand-mention count
 *   2. Sentiment ratio — sudden negative-sentiment surge
 *
 * Deliberately simple. More sophisticated anomaly methods (STL, Prophet,
 * EWMA Page-Hinkley) are reserved for dedicated forecasting — this catches
 * the "obvious" events that warrant an immediate alert.
 */

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type AnomalyKind = "mention_drop" | "mention_surge" | "sentiment_drop";

export interface AnomalyFinding {
  brandId: string;
  kind: AnomalyKind;
  severity: "info" | "warning" | "critical";
  current: number;
  baselineMean: number;
  baselineStdev: number;
  zScore: number;
  windowDays: number;
  detectedAt: string;
  summary: string;
}

interface DetectOptions {
  brandId: string;
  /** Rolling window for baseline calc — default 28 days */
  windowDays?: number;
  /** Minimum samples required to compute a baseline — default 14 */
  minSamples?: number;
  /** Z-score threshold — default 3 (~0.3% false positive rate) */
  threshold?: number;
}

function zScore(current: number, mean: number, stdev: number): number {
  if (stdev === 0) return 0;
  return (current - mean) / stdev;
}

function severityForZ(z: number): "info" | "warning" | "critical" {
  const a = Math.abs(z);
  if (a >= 5) return "critical";
  if (a >= 4) return "warning";
  return "info";
}

/**
 * Pull daily counts for a brand, then diff yesterday vs. the preceding
 * window.  Returns 0..N findings — one per kind that tripped the threshold.
 */
export async function detectAnomalies(
  opts: DetectOptions,
): Promise<AnomalyFinding[]> {
  const windowDays = opts.windowDays ?? 28;
  const minSamples = opts.minSamples ?? 14;
  const threshold = opts.threshold ?? 3;

  // Pull daily aggregates for the trailing window + 1 (yesterday = "current")
  const rows = await db.execute<{
    day: string;
    mention_count: number;
    negative_count: number;
    total_count: number;
  }>(sql`
    WITH days AS (
      SELECT generate_series(
        (CURRENT_DATE - INTERVAL '${sql.raw(String(windowDays))} days')::date,
        CURRENT_DATE::date,
        INTERVAL '1 day'
      )::date AS day
    )
    SELECT
      days.day::text AS day,
      COALESCE(SUM(CASE WHEN m.position IS NOT NULL THEN 1 ELSE 0 END), 0)::int AS mention_count,
      COALESCE(SUM(CASE WHEN m.sentiment = 'negative' THEN 1 ELSE 0 END), 0)::int AS negative_count,
      COALESCE(COUNT(m.id), 0)::int AS total_count
    FROM days
    LEFT JOIN brand_mentions m
      ON m.brand_id = ${opts.brandId}
     AND m.timestamp::date = days.day
    GROUP BY days.day
    ORDER BY days.day ASC
  `);

  const series = Array.isArray(rows)
    ? rows
    : ((rows as unknown as { rows: Array<{ day: string; mention_count: number; negative_count: number; total_count: number }> }).rows ?? []);

  if (series.length < minSamples + 1) return [];

  const current = series[series.length - 1];
  const baseline = series.slice(0, -1);

  const findings: AnomalyFinding[] = [];
  const now = new Date().toISOString();

  // --- Mention count anomalies ---
  const mentionCounts = baseline.map((r) => Number(r.mention_count));
  const mMean = mean(mentionCounts);
  const mStd = stdev(mentionCounts, mMean);
  const mZ = zScore(Number(current.mention_count), mMean, mStd);

  if (Math.abs(mZ) >= threshold) {
    const kind: AnomalyKind =
      mZ < 0 ? "mention_drop" : "mention_surge";
    findings.push({
      brandId: opts.brandId,
      kind,
      severity: severityForZ(mZ),
      current: Number(current.mention_count),
      baselineMean: mMean,
      baselineStdev: mStd,
      zScore: mZ,
      windowDays,
      detectedAt: now,
      summary:
        kind === "mention_drop"
          ? `Brand mentions fell to ${current.mention_count} today vs. baseline avg ${mMean.toFixed(1)} (${mZ.toFixed(1)}σ below normal).`
          : `Brand mentions surged to ${current.mention_count} today vs. baseline avg ${mMean.toFixed(1)} (${mZ.toFixed(1)}σ above normal).`,
    });
  }

  // --- Sentiment anomalies ---
  // Proportion of negative-sentiment rows, z-scored against baseline
  const baselineNegRatios = baseline
    .filter((r) => Number(r.total_count) > 0)
    .map(
      (r) => Number(r.negative_count) / Number(r.total_count),
    );
  if (baselineNegRatios.length >= minSamples && Number(current.total_count) > 0) {
    const currentRatio =
      Number(current.negative_count) / Number(current.total_count);
    const nMean = mean(baselineNegRatios);
    const nStd = stdev(baselineNegRatios, nMean);
    const nZ = zScore(currentRatio, nMean, nStd);

    if (nZ >= threshold) {
      findings.push({
        brandId: opts.brandId,
        kind: "sentiment_drop",
        severity: severityForZ(nZ),
        current: currentRatio,
        baselineMean: nMean,
        baselineStdev: nStd,
        zScore: nZ,
        windowDays,
        detectedAt: now,
        summary: `Negative sentiment ratio spiked to ${(currentRatio * 100).toFixed(1)}% today vs. baseline ${(nMean * 100).toFixed(1)}% (${nZ.toFixed(1)}σ above normal).`,
      });
    }
  }

  return findings;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdev(xs: number[], mu: number): number {
  if (xs.length < 2) return 0;
  const variance =
    xs.reduce((acc, x) => acc + (x - mu) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}
