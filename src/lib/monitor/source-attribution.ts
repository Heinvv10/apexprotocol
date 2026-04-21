/**
 * Source Attribution (Phase 5.1)
 *
 * Scores cited sources by authority + freshness, and recommends sources to
 * strengthen. Inputs come from the existing `brand_mentions.citation_url`
 * column — no schema changes required.
 */

import { and, eq, gte, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandMentions } from "@/lib/db/schema";

export interface SourceAuthority {
  domain: string;
  authorityScore: number;
  freshnessScore: number;
  compositeScore: number;
  citationCount: number;
  uniquePlatforms: number;
  firstCitedAt: Date;
  lastCitedAt: Date;
  daysSinceLastCitation: number;
  tldTier: "top" | "strong" | "mid" | "weak";
  isKnownAuthority: boolean;
  urls: Array<{ url: string; count: number; lastCitedAt: Date }>;
}

export interface SourceRecommendation {
  type: "strengthen_stale" | "diversify_low_authority" | "double_down_strong";
  priority: "high" | "medium" | "low";
  domain: string;
  rationale: string;
  suggestedAction: string;
}

export interface SourceAttributionResult {
  brandId: string;
  windowDays: number;
  sources: SourceAuthority[];
  recommendations: SourceRecommendation[];
  summary: {
    totalSources: number;
    uniqueDomains: number;
    averageAuthority: number;
    averageFreshness: number;
    staleSourceCount: number;
  };
}

/**
 * High-authority domain list. Kept intentionally small — the authority signal
 * is a blend of this list, TLD tier, and citation frequency.
 */
const KNOWN_AUTHORITY_DOMAINS = new Set<string>([
  "wikipedia.org",
  "nytimes.com",
  "bbc.com",
  "bbc.co.uk",
  "reuters.com",
  "bloomberg.com",
  "forbes.com",
  "wsj.com",
  "economist.com",
  "nature.com",
  "science.org",
  "pubmed.ncbi.nlm.nih.gov",
  "arxiv.org",
  "ieee.org",
  "acm.org",
  "github.com",
  "stackoverflow.com",
  "developer.mozilla.org",
  "w3.org",
  "gartner.com",
  "hbr.org",
  "mit.edu",
  "stanford.edu",
  "harvard.edu",
  "ox.ac.uk",
  "cam.ac.uk",
]);

function tldTier(domain: string): SourceAuthority["tldTier"] {
  const lower = domain.toLowerCase();
  if (lower.endsWith(".gov") || lower.endsWith(".gov.uk")) return "top";
  if (lower.endsWith(".edu") || lower.endsWith(".ac.uk")) return "top";
  if (lower.endsWith(".org") || lower.endsWith(".int")) return "strong";
  if (lower.endsWith(".com") || lower.endsWith(".net")) return "mid";
  return "weak";
}

function tldScore(tier: SourceAuthority["tldTier"]): number {
  switch (tier) {
    case "top":
      return 40;
    case "strong":
      return 25;
    case "mid":
      return 15;
    case "weak":
      return 5;
  }
}

function extractDomain(urlString: string): string | null {
  try {
    const u = new URL(urlString);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Authority score (0..100) = TLD tier + known-authority bonus + citation
 * frequency + cross-platform diversity. Clamped to 100.
 */
function computeAuthority(params: {
  tier: SourceAuthority["tldTier"];
  isKnownAuthority: boolean;
  citationCount: number;
  uniquePlatforms: number;
  globalMaxCitations: number;
}): number {
  const base = tldScore(params.tier);
  const knownBonus = params.isKnownAuthority ? 30 : 0;
  // Log-scale citation frequency so a few wins don't dominate
  const freqBonus =
    params.globalMaxCitations > 0
      ? Math.min(
          20,
          (Math.log10(1 + params.citationCount) /
            Math.log10(1 + params.globalMaxCitations)) *
            20,
        )
      : 0;
  const platformBonus = Math.min(10, params.uniquePlatforms * 2);
  return Math.min(100, Math.round(base + knownBonus + freqBonus + platformBonus));
}

/**
 * Freshness score (0..100). 0 days = 100, 30 days = ~70, 90 days = ~30,
 * 180 days ≈ 0. Exponential decay with half-life ~60 days.
 */
function computeFreshness(daysSince: number): number {
  const halfLife = 60;
  const decay = Math.pow(0.5, daysSince / halfLife);
  return Math.max(0, Math.min(100, Math.round(decay * 100)));
}

export async function analyzeBrandSources(
  brandId: string,
  options: { windowDays?: number; limit?: number } = {},
): Promise<SourceAttributionResult> {
  const windowDays = options.windowDays ?? 90;
  const limit = options.limit ?? 50;

  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      citationUrl: brandMentions.citationUrl,
      platform: brandMentions.platform,
      timestamp: brandMentions.timestamp,
    })
    .from(brandMentions)
    .where(
      and(
        eq(brandMentions.brandId, brandId),
        gte(brandMentions.timestamp, windowStart),
        isNotNull(brandMentions.citationUrl),
      ),
    );

  // Group per domain
  const byDomain = new Map<
    string,
    {
      urls: Map<string, { count: number; lastCitedAt: Date }>;
      platforms: Set<string>;
      firstCitedAt: Date;
      lastCitedAt: Date;
      citationCount: number;
    }
  >();

  for (const r of rows) {
    if (!r.citationUrl) continue;
    const domain = extractDomain(r.citationUrl);
    if (!domain) continue;

    let entry = byDomain.get(domain);
    if (!entry) {
      entry = {
        urls: new Map(),
        platforms: new Set(),
        firstCitedAt: r.timestamp,
        lastCitedAt: r.timestamp,
        citationCount: 0,
      };
      byDomain.set(domain, entry);
    }
    entry.citationCount++;
    entry.platforms.add(r.platform);
    if (r.timestamp < entry.firstCitedAt) entry.firstCitedAt = r.timestamp;
    if (r.timestamp > entry.lastCitedAt) entry.lastCitedAt = r.timestamp;

    const existing = entry.urls.get(r.citationUrl);
    if (existing) {
      existing.count++;
      if (r.timestamp > existing.lastCitedAt) existing.lastCitedAt = r.timestamp;
    } else {
      entry.urls.set(r.citationUrl, { count: 1, lastCitedAt: r.timestamp });
    }
  }

  const globalMaxCitations = Array.from(byDomain.values()).reduce(
    (max, e) => Math.max(max, e.citationCount),
    0,
  );

  const now = Date.now();
  const sources: SourceAuthority[] = Array.from(byDomain.entries()).map(
    ([domain, entry]) => {
      const tier = tldTier(domain);
      const isKnownAuthority = KNOWN_AUTHORITY_DOMAINS.has(domain);
      const daysSinceLast = Math.floor(
        (now - entry.lastCitedAt.getTime()) / (24 * 60 * 60 * 1000),
      );
      const authorityScore = computeAuthority({
        tier,
        isKnownAuthority,
        citationCount: entry.citationCount,
        uniquePlatforms: entry.platforms.size,
        globalMaxCitations,
      });
      const freshnessScore = computeFreshness(daysSinceLast);
      const compositeScore = Math.round(
        authorityScore * 0.7 + freshnessScore * 0.3,
      );

      const urls = Array.from(entry.urls.entries())
        .map(([url, u]) => ({ url, count: u.count, lastCitedAt: u.lastCitedAt }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        domain,
        authorityScore,
        freshnessScore,
        compositeScore,
        citationCount: entry.citationCount,
        uniquePlatforms: entry.platforms.size,
        firstCitedAt: entry.firstCitedAt,
        lastCitedAt: entry.lastCitedAt,
        daysSinceLastCitation: daysSinceLast,
        tldTier: tier,
        isKnownAuthority,
        urls,
      };
    },
  );

  sources.sort((a, b) => b.compositeScore - a.compositeScore);
  const topSources = sources.slice(0, limit);

  const recommendations = buildRecommendations(topSources);

  const totalCitations = sources.reduce((s, x) => s + x.citationCount, 0);
  const averageAuthority =
    sources.length > 0
      ? sources.reduce((s, x) => s + x.authorityScore, 0) / sources.length
      : 0;
  const averageFreshness =
    sources.length > 0
      ? sources.reduce((s, x) => s + x.freshnessScore, 0) / sources.length
      : 0;
  const staleSourceCount = sources.filter((s) => s.daysSinceLastCitation > 60)
    .length;

  return {
    brandId,
    windowDays,
    sources: topSources,
    recommendations,
    summary: {
      totalSources: totalCitations,
      uniqueDomains: sources.length,
      averageAuthority: Math.round(averageAuthority),
      averageFreshness: Math.round(averageFreshness),
      staleSourceCount,
    },
  };
}

function buildRecommendations(sources: SourceAuthority[]): SourceRecommendation[] {
  const recs: SourceRecommendation[] = [];

  // Strengthen stale high-authority sources
  for (const s of sources) {
    if (s.daysSinceLastCitation > 45 && s.authorityScore >= 55) {
      recs.push({
        type: "strengthen_stale",
        priority: s.daysSinceLastCitation > 90 ? "high" : "medium",
        domain: s.domain,
        rationale: `${s.domain} carries authority (${s.authorityScore}/100) but was last cited ${s.daysSinceLastCitation} days ago.`,
        suggestedAction: `Refresh content linking or republish reference material that cites ${s.domain}.`,
      });
    }
  }

  // Diversify if top sources are low-authority
  const topFive = sources.slice(0, 5);
  const lowAuthorityTop = topFive.filter((s) => s.authorityScore < 40);
  if (lowAuthorityTop.length >= 3 && sources.length >= 5) {
    recs.push({
      type: "diversify_low_authority",
      priority: "high",
      domain: lowAuthorityTop.map((s) => s.domain).join(", "),
      rationale:
        "Your top citation sources are below the authority threshold (40/100). AI engines down-weight weak sources.",
      suggestedAction:
        "Pursue earned citations from higher-tier outlets (industry publications, academic/.edu, .gov references, or top trade press).",
    });
  }

  // Double down on strongest composite sources
  const strongest = sources.filter((s) => s.compositeScore >= 75).slice(0, 3);
  for (const s of strongest) {
    recs.push({
      type: "double_down_strong",
      priority: "low",
      domain: s.domain,
      rationale: `${s.domain} is a top performer (${s.compositeScore} composite, ${s.citationCount} citations across ${s.uniquePlatforms} platforms).`,
      suggestedAction: `Submit updated data, commentary, or expert quotes to ${s.domain} to sustain citation velocity.`,
    });
  }

  return recs;
}
