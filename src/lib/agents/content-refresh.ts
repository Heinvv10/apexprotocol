/**
 * Apex Agent — Content Refresh (FR-AGT-003).
 *
 * Finds content that was cited in the past but isn't being cited anymore,
 * and suggests targeted updates. The "your article was quoted in ChatGPT
 * 6 months ago but dropped off — here's why + what to change" loop.
 *
 * Data source: brand_mentions.citation_url — we group by URL and look at
 * the trend of mentions over time.
 */

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { chat } from "@/lib/llm/client";

export interface ContentRefreshParams {
  brandId: string;
  tenantId: string;
  /** How many URLs to surface per run — default 5 */
  topN?: number;
  /** Minimum mentions in the "historical" window to qualify — default 3 */
  minHistoricalMentions?: number;
}

export interface DecliningUrl {
  url: string;
  historicalMentions: number;
  recentMentions: number;
  decline: number;
  /** Platforms where the drop was steepest */
  platformsAffected: string[];
  /** LLM-suggested updates for the page */
  suggestedUpdates: string[];
}

export interface ContentRefreshOutput {
  decliningUrls: DecliningUrl[];
  historicalWindow: { from: string; to: string };
  recentWindow: { from: string; to: string };
  summary: string;
}

export async function runContentRefresh(
  params: ContentRefreshParams,
): Promise<ContentRefreshOutput> {
  const topN = params.topN ?? 5;
  const minHistorical = params.minHistoricalMentions ?? 3;
  const now = new Date();
  const recentFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const historicalFrom = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const historicalTo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Union of URLs cited in either window
  const rows = await db.execute<{
    url: string;
    historical_mentions: number;
    recent_mentions: number;
    platforms: string[] | null;
  }>(sql`
    WITH historical AS (
      SELECT citation_url, COUNT(*)::int AS cnt, array_agg(DISTINCT platform::text) AS platforms
      FROM brand_mentions
      WHERE brand_id = ${params.brandId}
        AND citation_url IS NOT NULL
        AND timestamp >= ${historicalFrom}
        AND timestamp < ${historicalTo}
      GROUP BY citation_url
    ),
    recent AS (
      SELECT citation_url, COUNT(*)::int AS cnt, array_agg(DISTINCT platform::text) AS platforms
      FROM brand_mentions
      WHERE brand_id = ${params.brandId}
        AND citation_url IS NOT NULL
        AND timestamp >= ${recentFrom}
      GROUP BY citation_url
    )
    SELECT
      COALESCE(h.citation_url, r.citation_url) AS url,
      COALESCE(h.cnt, 0) AS historical_mentions,
      COALESCE(r.cnt, 0) AS recent_mentions,
      h.platforms AS platforms
    FROM historical h
    FULL OUTER JOIN recent r ON h.citation_url = r.citation_url
    WHERE COALESCE(h.cnt, 0) >= ${minHistorical}
      AND COALESCE(r.cnt, 0) < COALESCE(h.cnt, 0)
    ORDER BY (COALESCE(h.cnt, 0) - COALESCE(r.cnt, 0)) DESC
    LIMIT ${topN}
  `);

  const candidates = asRows<{
    url: string;
    historical_mentions: number;
    recent_mentions: number;
    platforms: string[] | null;
  }>(rows);

  const deltas: DecliningUrl[] = [];

  for (const c of candidates) {
    const suggested = await suggestUpdates({
      url: c.url,
      brandId: params.brandId,
      tenantId: params.tenantId,
    });
    deltas.push({
      url: c.url,
      historicalMentions: Number(c.historical_mentions),
      recentMentions: Number(c.recent_mentions),
      decline:
        Number(c.historical_mentions) - Number(c.recent_mentions),
      platformsAffected: c.platforms ?? [],
      suggestedUpdates: suggested,
    });
  }

  const summary =
    deltas.length === 0
      ? "No URLs showed a meaningful citation decline in this window."
      : `${deltas.length} URL(s) dropping out of AI answers — top: ${deltas[0].url} (${deltas[0].historicalMentions} → ${deltas[0].recentMentions}).`;

  return {
    decliningUrls: deltas,
    historicalWindow: {
      from: historicalFrom.toISOString(),
      to: historicalTo.toISOString(),
    },
    recentWindow: { from: recentFrom.toISOString(), to: now.toISOString() },
    summary,
  };
}

async function suggestUpdates(args: {
  url: string;
  brandId: string;
  tenantId: string;
}): Promise<string[]> {
  // Lightweight — one Claude call suggesting 3 concrete updates.
  // No page-fetch yet (that's Sprint 5 answer-quality work); ask the LLM
  // to reason from the URL + metadata alone.
  try {
    const response = await chat({
      model: "claude-haiku-4-5",
      tenantId: args.tenantId,
      brandId: args.brandId,
      operation: "agent.content_refresh.suggest",
      temperature: 0.3,
      maxTokens: 500,
      messages: [
        {
          role: "system",
          content:
            "You are a content-refresh advisor. Given a URL that's losing AI citations, return 3 concrete updates the page needs to win citations back. Output as a JSON array of 3 short strings, nothing else.",
        },
        {
          role: "user",
          content: `URL: ${args.url}\n\nReturn 3 updates.`,
        },
      ],
    });
    const cleaned = response.content
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map(String).slice(0, 3);
    }
    return [];
  } catch {
    return [];
  }
}

function asRows<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  return ((res as { rows?: T[] })?.rows ?? []) as T[];
}
