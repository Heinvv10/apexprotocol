/**
 * Prompt Radar v1 — orchestrates DataForSEO + GSC + seed corpora to surface
 * the prompts brands should care about.
 *
 * Requirements: FR-PRV-001/002/003/004/007/008.
 *
 * Data sources in priority order:
 *   1. GSC queries for the client's own domain (free, real intent)
 *   2. DataForSEO AI Optimization keyword volumes (paid, ~$300-800/mo)
 *   3. Seed corpora (LMSYS-Chat-1M, WildChat-1M) for industry clustering
 *      — loaded lazily, TODO in this version (requires data pipeline + Pinecone)
 *
 * Output: PromptRadarEntry[] — per-prompt volume band, source signals,
 * cluster assignment. The "honest-empty" contract applies: if we lack data
 * for a cell, we return null rather than fabricating.
 */

import { dataForSEOClient, type AIKeywordVolume } from "./dataforseo-client";
import {
  computeThresholds,
  assignBand,
  bandLabel,
  type VolumeBand,
} from "./volume-bands";
import { logger } from "@/lib/logger";

export interface PromptRadarEntry {
  keyword: string;
  band: VolumeBand;
  bandLabel: string;
  /** The raw volume used to assign the band. Null when source unavailable. */
  rawVolume: number | null;
  /** Most-recent 3-month trend from DFS, null if no data */
  trend: "up" | "down" | "flat" | null;
  sources: {
    dataforseo: boolean;
    gsc: boolean;
    seedCorpus: boolean;
  };
  /** Optional — topic cluster id (set post-clustering) */
  cluster?: string | null;
}

export interface GSCQuerySignal {
  query: string;
  impressions: number;
  clicks: number;
  position: number;
}

export interface PromptRadarInput {
  /** Seed keywords from client or derived from brand */
  seedKeywords?: string[];
  /** Live GSC queries for this brand's domain */
  gscQueries?: GSCQuerySignal[];
  /** DataForSEO location code — SA=2710, US=2840, UK=2826 */
  locationCode?: number;
  languageCode?: string;
  /** Cap how many keywords hit DFS — pricing safeguard */
  dataforseoBudgetLimit?: number;
}

export async function buildRadar(
  input: PromptRadarInput,
): Promise<PromptRadarEntry[]> {
  // 1. Union of all candidate keywords
  const candidateSet = new Set<string>();
  for (const k of input.seedKeywords ?? []) candidateSet.add(normalize(k));
  for (const q of input.gscQueries ?? []) candidateSet.add(normalize(q.query));

  // GSC queries tagged for source attribution
  const fromGsc = new Set(
    (input.gscQueries ?? []).map((q) => normalize(q.query)),
  );

  const candidates = Array.from(candidateSet).filter((k) => k.length > 0);

  // 2. DataForSEO enrichment — cap to budget
  const dfsBudget = input.dataforseoBudgetLimit ?? 500;
  const dfsKeywords = candidates.slice(0, dfsBudget);
  const volumesByKeyword = new Map<string, AIKeywordVolume>();
  let dfsAvailable = false;

  if (dataForSEOClient.enabled && dfsKeywords.length > 0) {
    try {
      const results = await dataForSEOClient.keywordVolumes(dfsKeywords, {
        locationCode: input.locationCode,
        languageCode: input.languageCode,
      });
      for (const r of results) {
        volumesByKeyword.set(normalize(r.keyword), r);
      }
      dfsAvailable = true;
    } catch (err) {
      logger.warn("prompt-radar.dataforseo_failed", {
        err: (err as Error).message,
        keywordCount: dfsKeywords.length,
      });
    }
  }

  // GSC impressions as backup volume signal when DFS is absent
  const gscVolumeByKeyword = new Map<string, number>();
  for (const q of input.gscQueries ?? []) {
    gscVolumeByKeyword.set(normalize(q.query), q.impressions);
  }

  // 3. Compute thresholds from whatever volume data we have
  const volumes = candidates
    .map((k) => {
      const dfs = volumesByKeyword.get(k);
      if (dfs && typeof dfs.search_volume === "number") return dfs.search_volume;
      const gsc = gscVolumeByKeyword.get(k);
      if (typeof gsc === "number") return gsc;
      return null;
    })
    .filter((v): v is number => v !== null);

  const thresholds = computeThresholds(volumes);

  // 4. Build the radar rows
  const entries: PromptRadarEntry[] = candidates.map((keyword) => {
    const dfs = volumesByKeyword.get(keyword);
    const gscImpr = gscVolumeByKeyword.get(keyword);
    const rawVolume =
      typeof dfs?.search_volume === "number"
        ? dfs.search_volume
        : typeof gscImpr === "number"
          ? gscImpr
          : null;

    const band: VolumeBand =
      rawVolume !== null ? assignBand(rawVolume, thresholds) : 1;

    return {
      keyword,
      band,
      bandLabel: bandLabel(band),
      rawVolume,
      trend: estimateTrend(dfs),
      sources: {
        dataforseo: !!dfs,
        gsc: fromGsc.has(keyword),
        seedCorpus: false,
      },
      cluster: null,
    };
  });

  logger.info("prompt-radar.built", {
    candidateCount: candidates.length,
    dfsEnriched: volumesByKeyword.size,
    gscBacked: gscVolumeByKeyword.size,
    dfsAvailable,
  });

  // Sort by band then raw volume
  return entries.sort((a, b) => {
    if (b.band !== a.band) return b.band - a.band;
    return (b.rawVolume ?? 0) - (a.rawVolume ?? 0);
  });
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function estimateTrend(
  dfs: AIKeywordVolume | undefined,
): "up" | "down" | "flat" | null {
  if (!dfs?.monthly_searches || dfs.monthly_searches.length < 3) return null;
  const recent = dfs.monthly_searches.slice(-3);
  const first = recent[0].search_volume;
  const last = recent[recent.length - 1].search_volume;
  if (first === 0) return null;
  const delta = (last - first) / first;
  if (delta > 0.15) return "up";
  if (delta < -0.15) return "down";
  return "flat";
}
