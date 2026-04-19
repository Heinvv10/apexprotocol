/**
 * Volume-band scoring (FR-PRV-007, 🏆 category-leading).
 *
 * We DO NOT quote fake "62,400 monthly prompts" numbers. Our Phase-1 data
 * sources (DataForSEO, GSC, LMSYS) don't support that precision without
 * a panel data license. Instead we surface calibrated 1-5 bands:
 *
 *   Band 5 — Very high  (top 1% of keywords by volume in this dataset)
 *   Band 4 — High       (top 5%)
 *   Band 3 — Moderate   (top 25%)
 *   Band 2 — Low        (top 50%)
 *   Band 1 — Rare       (bottom 50%)
 *
 * Calibration: percentile-based against the dataset we have. We explicitly
 * publish the percentile thresholds so users can reproduce the classifier.
 */

export type VolumeBand = 1 | 2 | 3 | 4 | 5;

export interface VolumeBandThresholds {
  p99: number; // Band 5 threshold
  p95: number; // Band 4 threshold
  p75: number; // Band 3 threshold
  p50: number; // Band 2 threshold
}

export function computeThresholds(volumes: number[]): VolumeBandThresholds {
  if (volumes.length === 0) {
    return { p99: 0, p95: 0, p75: 0, p50: 0 };
  }
  const sorted = [...volumes].sort((a, b) => a - b);
  return {
    p99: percentile(sorted, 0.99),
    p95: percentile(sorted, 0.95),
    p75: percentile(sorted, 0.75),
    p50: percentile(sorted, 0.5),
  };
}

export function assignBand(
  volume: number,
  thresholds: VolumeBandThresholds,
): VolumeBand {
  if (volume >= thresholds.p99) return 5;
  if (volume >= thresholds.p95) return 4;
  if (volume >= thresholds.p75) return 3;
  if (volume >= thresholds.p50) return 2;
  return 1;
}

export function bandLabel(band: VolumeBand): string {
  switch (band) {
    case 5:
      return "Very high";
    case 4:
      return "High";
    case 3:
      return "Moderate";
    case 2:
      return "Low";
    case 1:
      return "Rare";
  }
}

function percentile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 0) return 0;
  const pos = (sortedAsc.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (base + 1 < sortedAsc.length) {
    return (
      sortedAsc[base] + rest * (sortedAsc[base + 1] - sortedAsc[base])
    );
  }
  return sortedAsc[base];
}
