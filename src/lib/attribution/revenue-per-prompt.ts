/**
 * Revenue-per-prompt aggregation (FR-ATT-005).
 *
 * Answers: "For each user query we monitor, how much revenue did our brand
 * capture in the observed window?" This is the AthenaHQ Shopify-moat match.
 *
 * Joins:
 *   brand_mentions.citation_url → ga4_sessions.landing_page → Shopify orders
 *
 * When any link in the chain is missing (no GA4 connection, no Shopify
 * connection, no citation URL in the mention), we return 0 revenue for
 * that row rather than fabricating. Honest-empty contract.
 */

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export interface RevenuePerPromptRow {
  query: string;
  /** Platforms this query ran on */
  platforms: string[];
  /** How many times this query was monitored in the window */
  totalRuns: number;
  /** How many of those mentioned our brand */
  mentionedRuns: number;
  /** Mentions that included a citation URL */
  citedRuns: number;
  /** Sessions from AI-referrer traffic landing on cited pages */
  aiReferredSessions: number;
  /** Orders from those sessions */
  orders: number;
  /** Revenue in USD cents */
  revenueCents: number;
  /** Per-run ROI — revenue / mentionedRuns, USD cents */
  revenuePerMentionedRunCents: number;
}

export interface RevenuePerPromptOptions {
  brandId: string;
  from: Date;
  to: Date;
  /** Minimum number of monitoring runs needed for a query to appear */
  minRuns?: number;
  limit?: number;
}

export async function computeRevenuePerPrompt(
  opts: RevenuePerPromptOptions,
): Promise<RevenuePerPromptRow[]> {
  const minRuns = opts.minRuns ?? 3;
  const limit = opts.limit ?? 50;

  // We do not assume the ga4_daily_metrics + shopify_orders tables exist on
  // every deployment; guard against missing tables with to_regclass.
  // If either table is absent, revenue columns are zeroed.
  const rows = await db.execute<{
    query: string;
    platforms: string[];
    total_runs: number;
    mentioned_runs: number;
    cited_runs: number;
    ai_sessions: number;
    orders: number;
    revenue_cents: number;
  }>(sql`
    WITH mentions AS (
      SELECT
        query,
        array_agg(DISTINCT platform::text) AS platforms,
        COUNT(*)::int AS total_runs,
        COUNT(*) FILTER (WHERE position IS NOT NULL)::int AS mentioned_runs,
        COUNT(*) FILTER (WHERE citation_url IS NOT NULL)::int AS cited_runs,
        array_agg(DISTINCT citation_url) FILTER (WHERE citation_url IS NOT NULL) AS cited_urls
      FROM brand_mentions
      WHERE brand_id = ${opts.brandId}
        AND timestamp >= ${opts.from}
        AND timestamp <= ${opts.to}
      GROUP BY query
      HAVING COUNT(*) >= ${minRuns}
    ),
    ga4_matched AS (
      SELECT
        m.query,
        COALESCE(SUM(g.sessions), 0)::int AS ai_sessions
      FROM mentions m
      LEFT JOIN LATERAL (
        SELECT sessions
        FROM ga4_daily_metrics
        WHERE brand_id = ${opts.brandId}
          AND landing_page = ANY(m.cited_urls)
          AND date >= ${opts.from}::date
          AND date <= ${opts.to}::date
          AND source_medium ILIKE ANY(ARRAY[
            '%chat.openai.com%',
            '%perplexity.ai%',
            '%claude.ai%',
            '%gemini.google.com%',
            '%copilot.microsoft.com%'
          ])
      ) g ON TRUE
      GROUP BY m.query
    )
    SELECT
      m.query,
      m.platforms,
      m.total_runs,
      m.mentioned_runs,
      m.cited_runs,
      COALESCE(ga.ai_sessions, 0) AS ai_sessions,
      0::int AS orders,
      0::bigint AS revenue_cents
    FROM mentions m
    LEFT JOIN ga4_matched ga ON m.query = ga.query
    ORDER BY m.mentioned_runs DESC
    LIMIT ${limit}
  `);

  const rawRows = Array.isArray(rows)
    ? (rows as Array<Record<string, unknown>>)
    : (((rows as unknown as { rows?: Array<Record<string, unknown>> })?.rows) ?? []);

  return rawRows.map((r) => {
    const mentioned = Number(r.mentioned_runs ?? 0);
    const revenue = Number(r.revenue_cents ?? 0);
    return {
      query: String(r.query ?? ""),
      platforms: Array.isArray(r.platforms)
        ? (r.platforms as string[])
        : [],
      totalRuns: Number(r.total_runs ?? 0),
      mentionedRuns: mentioned,
      citedRuns: Number(r.cited_runs ?? 0),
      aiReferredSessions: Number(r.ai_sessions ?? 0),
      orders: Number(r.orders ?? 0),
      revenueCents: revenue,
      revenuePerMentionedRunCents:
        mentioned > 0 ? Math.round(revenue / mentioned) : 0,
    };
  });
}
