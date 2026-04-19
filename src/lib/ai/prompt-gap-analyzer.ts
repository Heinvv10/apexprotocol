/**
 * Prompt Gap Analyzer — finds prompts where a brand underperforms and
 * produces the context needed to kick off content generation.
 *
 * Requirement: FR-CRE-014 (MONITOR → CREATE loop, 🏆 category-leading).
 *
 * The loop: users see a prompt where their brand is cited <20% of the time
 * → click "Write about this" → we feed this analyzer's output straight into
 * content-generator.ts. No copy-paste, no context loss.
 */

import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandMentions, brands } from "@/lib/db/schema";

export interface PromptGap {
  query: string;
  /** Total runs of this query we've seen for this brand */
  totalRuns: number;
  /** Runs where our brand was mentioned */
  mentionedRuns: number;
  mentionedRate: number;
  /** Platforms on which we lose — which is where content effort should target */
  losingPlatforms: Array<{
    platform: string;
    totalRuns: number;
    mentionedRuns: number;
    mentionedRate: number;
  }>;
  /** Who IS winning these queries — content competitors */
  topCompetitors: Array<{ name: string; mentions: number }>;
  /** Sample competitor responses — context for the brief */
  competitorSnippets: Array<{
    platform: string;
    excerpt: string;
    competitor?: string;
  }>;
}

export interface GapAnalyzerOptions {
  brandId: string;
  /** Look back this many days — default 30 */
  lookbackDays?: number;
  /** Only surface prompts where our mention rate is below this — default 0.2 (20%) */
  mentionRateThreshold?: number;
  /** Need at least this many runs to be meaningful — default 3 */
  minRuns?: number;
  /** Max prompts returned — default 20 */
  limit?: number;
}

interface RawRow {
  query: string;
  platform: string;
  is_mentioned: boolean;
  competitors: Array<{ name: string; sentiment?: string }> | null;
  response: string;
}

export async function findPromptGaps(
  opts: GapAnalyzerOptions,
): Promise<PromptGap[]> {
  const lookback = opts.lookbackDays ?? 30;
  const threshold = opts.mentionRateThreshold ?? 0.2;
  const minRuns = opts.minRuns ?? 3;
  const limit = opts.limit ?? 20;
  const since = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);

  // Aggregate per-query, per-platform
  const rows = await db
    .select({
      query: brandMentions.query,
      platform: brandMentions.platform,
      // position IS NOT NULL implies brand was mentioned
      isMentioned: sql<boolean>`${brandMentions.position} IS NOT NULL`,
      competitors: brandMentions.competitors,
      response: brandMentions.response,
    })
    .from(brandMentions)
    .where(
      and(
        eq(brandMentions.brandId, opts.brandId),
        gte(brandMentions.timestamp, since),
      ),
    );

  // Group by query
  const byQuery = new Map<string, RawRow[]>();
  for (const r of rows) {
    const list = byQuery.get(r.query) ?? [];
    list.push({
      query: r.query,
      platform: r.platform,
      is_mentioned: r.isMentioned,
      competitors: r.competitors as RawRow["competitors"],
      response: r.response,
    });
    byQuery.set(r.query, list);
  }

  const gaps: PromptGap[] = [];

  for (const [query, items] of byQuery.entries()) {
    if (items.length < minRuns) continue;

    const mentionedRuns = items.filter((i) => i.is_mentioned).length;
    const rate = mentionedRuns / items.length;
    if (rate >= threshold) continue;

    // Per-platform rollup
    const byPlatform = new Map<
      string,
      { total: number; mentioned: number; snippets: RawRow[] }
    >();
    for (const i of items) {
      const p = byPlatform.get(i.platform) ?? {
        total: 0,
        mentioned: 0,
        snippets: [],
      };
      p.total += 1;
      if (i.is_mentioned) p.mentioned += 1;
      p.snippets.push(i);
      byPlatform.set(i.platform, p);
    }

    const losingPlatforms = Array.from(byPlatform.entries())
      .map(([platform, s]) => ({
        platform,
        totalRuns: s.total,
        mentionedRuns: s.mentioned,
        mentionedRate: s.mentioned / s.total,
      }))
      .filter((p) => p.mentionedRate < threshold)
      .sort((a, b) => a.mentionedRate - b.mentionedRate);

    // Top competitors across all runs of this query
    const competitorCounts = new Map<string, number>();
    for (const i of items) {
      for (const comp of i.competitors ?? []) {
        if (!comp?.name) continue;
        competitorCounts.set(
          comp.name,
          (competitorCounts.get(comp.name) ?? 0) + 1,
        );
      }
    }
    const topCompetitors = Array.from(competitorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, mentions]) => ({ name, mentions }));

    // One excerpt per losing platform — the cheapest context signal
    const competitorSnippets = losingPlatforms.slice(0, 3).map((lp) => {
      const sample = byPlatform
        .get(lp.platform)!
        .snippets.find((s) => !s.is_mentioned && s.response.length > 100);
      return {
        platform: lp.platform,
        excerpt: (sample?.response ?? "").slice(0, 500),
        competitor: topCompetitors[0]?.name,
      };
    });

    gaps.push({
      query,
      totalRuns: items.length,
      mentionedRuns,
      mentionedRate: rate,
      losingPlatforms,
      topCompetitors,
      competitorSnippets,
    });
  }

  return gaps.sort((a, b) => a.mentionedRate - b.mentionedRate).slice(0, limit);
}

/**
 * Build the "seed context" string for content generation from a gap.
 * The content-generator consumes this as an extra user-message block so the
 * draft addresses the exact prompt+platform gap + quotes competitor snippets
 * it needs to beat.
 */
export function buildBriefSeed(
  brandName: string,
  gap: PromptGap,
): { briefPrompt: string; talkingPoints: string[] } {
  const topComp =
    gap.topCompetitors.length > 0
      ? `${gap.topCompetitors[0].name} (mentioned ${gap.topCompetitors[0].mentions}× in these runs)`
      : "no dominant competitor yet";

  const losingList = gap.losingPlatforms
    .map(
      (p) =>
        `  - ${p.platform}: ${Math.round(p.mentionedRate * 100)}% mention rate over ${p.totalRuns} runs`,
    )
    .join("\n");

  const snippets = gap.competitorSnippets
    .filter((s) => s.excerpt.length > 0)
    .map(
      (s) =>
        `From ${s.platform} (${s.competitor ?? "competitor"}):\n"${s.excerpt.trim()}"`,
    )
    .join("\n\n");

  const briefPrompt = [
    `The brand "${brandName}" is being left out of AI answers for this user query:`,
    ``,
    `  "${gap.query}"`,
    ``,
    `Current performance:`,
    `  Overall: ${gap.mentionedRuns}/${gap.totalRuns} runs mention the brand (${Math.round(gap.mentionedRate * 100)}%)`,
    losingList,
    ``,
    `Top cited entities right now: ${topComp}.`,
    ``,
    `Competitor response excerpts — use these to understand what's working for them:`,
    ``,
    snippets.length > 0 ? snippets : "(no competitor excerpts captured yet)",
    ``,
    `Write content that would credibly be cited IN PLACE OF the above for this exact query.`,
  ].join("\n");

  const talkingPoints = [
    `Directly answer the query: "${gap.query}"`,
    `Include claims a citation-generating LLM would want to quote`,
    `Structure for extraction — clear Q→A pairs, scannable headings, concrete numbers`,
    topComp !== "no dominant competitor yet"
      ? `Differentiate from ${gap.topCompetitors[0].name} specifically`
      : null,
  ].filter(Boolean) as string[];

  return { briefPrompt, talkingPoints };
}

/**
 * Resolve a brand ID → brand name, used by the API route to avoid requiring
 * callers to pass the name they already know.
 */
export async function getBrandName(brandId: string): Promise<string | null> {
  const rows = await db
    .select({ name: brands.name })
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1);
  return rows[0]?.name ?? null;
}
