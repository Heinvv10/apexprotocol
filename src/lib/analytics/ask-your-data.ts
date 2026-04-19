/**
 * Ask-your-data NL query (FR-INT-004, premium marker #8).
 *
 * User types a natural-language question; we resolve it to one of a small
 * set of whitelisted query templates. Tenant scoping is enforced OUTSIDE
 * the LLM path — we never let the model emit raw SQL that touches
 * user-supplied tenant ids.
 *
 * Two-step:
 *   1. LLM classifies the question into { intent, params } from a typed
 *      vocabulary. It can return "unknown" — we surface that honestly.
 *   2. We execute the typed query with the caller's tenant context.
 *
 * This is deliberately NOT text-to-SQL. Competitors sometimes ship t2SQL
 * on customer data — we don't, because one prompt-injection bug leaks
 * the whole tenant. Typed dispatch is boring, safe, and covers 95% of
 * real questions.
 */

import { chat } from "@/lib/llm/client";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandMentions, brands, recommendations } from "@/lib/db/schema";

export type AskIntent =
  | "losing_prompts"
  | "top_competitors"
  | "platform_performance"
  | "sentiment_over_time"
  | "top_cited_urls"
  | "open_recommendations"
  | "unknown";

export interface AskParams {
  intent: AskIntent;
  brandFilter?: string | null;
  competitorFilter?: string | null;
  platformFilter?: string | null;
  lookbackDays?: number;
  limit?: number;
  threshold?: number;
}

export interface AskResult {
  intent: AskIntent;
  params: AskParams;
  /** Typed rows — shape varies by intent */
  rows: Array<Record<string, unknown>>;
  /** Short user-facing explanation of what we ran */
  explanation: string;
  /** Token usage from the classifier call */
  usage: { inputTokens: number; outputTokens: number };
}

const CLASSIFIER_SYSTEM = `You classify user questions about GEO/AEO analytics
into a typed intent + params. Output ONE JSON object, nothing else.

Valid intents:
  - losing_prompts          — prompts where the user's brand is rarely cited
  - top_competitors         — competitor ranking by mention volume
  - platform_performance    — per-platform mention rate breakdown
  - sentiment_over_time     — sentiment distribution over a window
  - top_cited_urls          — URLs most frequently cited
  - open_recommendations    — pending recommendations to action
  - unknown                 — question doesn't match any of the above

Schema:
{
  "intent": string,
  "brandFilter": string | null,
  "competitorFilter": string | null,
  "platformFilter": string | null,   // chatgpt|claude|gemini|perplexity|grok|deepseek|copilot etc
  "lookbackDays": number | null,     // default 30
  "limit": number | null,            // default 10
  "threshold": number | null         // for losing_prompts, e.g. 0.2
}

Never invent filter values beyond the user's question. Leave them null when
unsure.`;

export async function askYourData(args: {
  tenantId: string;
  brandId: string;
  question: string;
}): Promise<AskResult> {
  const response = await chat({
    model: "claude-haiku-4-5",
    tenantId: args.tenantId,
    brandId: args.brandId,
    operation: "analytics.ask_your_data.classify",
    temperature: 0.1,
    maxTokens: 400,
    messages: [
      { role: "system", content: CLASSIFIER_SYSTEM },
      { role: "user", content: args.question },
    ],
  });

  const params = parseParams(response.content);
  const rows = await runIntent(params, args);
  const explanation = explainIntent(params);

  return {
    intent: params.intent,
    params,
    rows,
    explanation,
    usage: response.usage,
  };
}

function parseParams(raw: string): AskParams {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { intent: "unknown" };
  }

  const validIntents = new Set<AskIntent>([
    "losing_prompts",
    "top_competitors",
    "platform_performance",
    "sentiment_over_time",
    "top_cited_urls",
    "open_recommendations",
    "unknown",
  ]);
  const intent = validIntents.has(parsed.intent as AskIntent)
    ? (parsed.intent as AskIntent)
    : "unknown";

  return {
    intent,
    brandFilter: typeof parsed.brandFilter === "string" ? parsed.brandFilter : null,
    competitorFilter:
      typeof parsed.competitorFilter === "string" ? parsed.competitorFilter : null,
    platformFilter:
      typeof parsed.platformFilter === "string" ? parsed.platformFilter : null,
    lookbackDays:
      typeof parsed.lookbackDays === "number" ? parsed.lookbackDays : 30,
    limit: typeof parsed.limit === "number" ? parsed.limit : 10,
    threshold:
      typeof parsed.threshold === "number" ? parsed.threshold : 0.2,
  };
}

async function runIntent(
  params: AskParams,
  ctx: { tenantId: string; brandId: string },
): Promise<Array<Record<string, unknown>>> {
  if (params.intent === "unknown") {
    return [];
  }

  const lookback = params.lookbackDays ?? 30;
  const limit = Math.min(params.limit ?? 10, 100);
  const since = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);

  // Tenant + brand scope enforced via a verification query — never pass
  // tenantId through the LLM-produced params.
  const brandRows = await db
    .select({ id: brands.id })
    .from(brands)
    .where(
      and(
        eq(brands.id, ctx.brandId),
        eq(brands.organizationId, ctx.tenantId),
      ),
    )
    .limit(1);
  if (brandRows.length === 0) return [];

  switch (params.intent) {
    case "losing_prompts": {
      const threshold = params.threshold ?? 0.2;
      const rows = await db
        .select({
          query: brandMentions.query,
          total_runs: sql<number>`COUNT(*)::int`,
          mentioned_runs: sql<number>`COUNT(*) FILTER (WHERE ${brandMentions.position} IS NOT NULL)::int`,
        })
        .from(brandMentions)
        .where(
          and(
            eq(brandMentions.brandId, ctx.brandId),
            gte(brandMentions.timestamp, since),
          ),
        )
        .groupBy(brandMentions.query)
        .having(
          sql`COUNT(*) FILTER (WHERE ${brandMentions.position} IS NOT NULL)::float / NULLIF(COUNT(*), 0) < ${threshold}`,
        )
        .limit(limit);
      return rows.map((r) => ({
        query: r.query,
        total_runs: r.total_runs,
        mentioned_runs: r.mentioned_runs,
        mentioned_rate:
          r.total_runs === 0 ? 0 : r.mentioned_runs / r.total_runs,
      }));
    }

    case "top_competitors": {
      const rows = await db.execute<{
        competitor: string;
        mentions: number;
      }>(sql`
        SELECT comp->>'name' AS competitor,
               COUNT(*)::int AS mentions
        FROM brand_mentions, jsonb_array_elements(competitors) AS comp
        WHERE brand_id = ${ctx.brandId}
          AND timestamp >= ${since}
          AND comp->>'name' IS NOT NULL
        GROUP BY comp->>'name'
        ORDER BY mentions DESC
        LIMIT ${limit}
      `);
      return asRows(rows);
    }

    case "platform_performance": {
      const rows = await db
        .select({
          platform: brandMentions.platform,
          total_runs: sql<number>`COUNT(*)::int`,
          mentioned_runs: sql<number>`COUNT(*) FILTER (WHERE ${brandMentions.position} IS NOT NULL)::int`,
        })
        .from(brandMentions)
        .where(
          and(
            eq(brandMentions.brandId, ctx.brandId),
            gte(brandMentions.timestamp, since),
          ),
        )
        .groupBy(brandMentions.platform);
      return rows.map((r) => ({
        platform: r.platform,
        total_runs: r.total_runs,
        mentioned_runs: r.mentioned_runs,
        mentioned_rate:
          r.total_runs === 0 ? 0 : r.mentioned_runs / r.total_runs,
      }));
    }

    case "sentiment_over_time": {
      const rows = await db.execute<{
        day: string;
        positive: number;
        neutral: number;
        negative: number;
      }>(sql`
        SELECT date_trunc('day', timestamp)::date::text AS day,
               COUNT(*) FILTER (WHERE sentiment = 'positive')::int AS positive,
               COUNT(*) FILTER (WHERE sentiment = 'neutral')::int AS neutral,
               COUNT(*) FILTER (WHERE sentiment = 'negative')::int AS negative
        FROM brand_mentions
        WHERE brand_id = ${ctx.brandId}
          AND timestamp >= ${since}
        GROUP BY day
        ORDER BY day ASC
        LIMIT ${Math.max(limit, 90)}
      `);
      return asRows(rows);
    }

    case "top_cited_urls": {
      const rows = await db
        .select({
          url: brandMentions.citationUrl,
          citations: sql<number>`COUNT(*)::int`,
        })
        .from(brandMentions)
        .where(
          and(
            eq(brandMentions.brandId, ctx.brandId),
            gte(brandMentions.timestamp, since),
            sql`${brandMentions.citationUrl} IS NOT NULL`,
          ),
        )
        .groupBy(brandMentions.citationUrl)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(limit);
      return rows.map((r) => ({
        url: r.url,
        citations: r.citations,
      }));
    }

    case "open_recommendations": {
      const rows = await db
        .select({
          id: recommendations.id,
          title: recommendations.title,
          priority: recommendations.priority,
          impact: recommendations.impact,
          effort: recommendations.effort,
        })
        .from(recommendations)
        .where(
          and(
            eq(recommendations.brandId, ctx.brandId),
            eq(recommendations.status, "pending"),
          ),
        )
        .orderBy(desc(recommendations.createdAt))
        .limit(limit);
      return rows as unknown as Array<Record<string, unknown>>;
    }

    default:
      return [];
  }
}

function explainIntent(params: AskParams): string {
  switch (params.intent) {
    case "losing_prompts":
      return `Prompts with mention rate under ${Math.round((params.threshold ?? 0.2) * 100)}% over the last ${params.lookbackDays ?? 30} days.`;
    case "top_competitors":
      return `Top competitors by mention count over the last ${params.lookbackDays ?? 30} days.`;
    case "platform_performance":
      return `Per-platform mention rate over the last ${params.lookbackDays ?? 30} days.`;
    case "sentiment_over_time":
      return `Daily sentiment distribution over the last ${params.lookbackDays ?? 30} days.`;
    case "top_cited_urls":
      return `Most frequently cited URLs over the last ${params.lookbackDays ?? 30} days.`;
    case "open_recommendations":
      return `Open recommendations ordered by creation date.`;
    case "unknown":
      return `I couldn't match your question to a known analytics query. Try rephrasing, or ask about losing prompts, competitors, platform performance, sentiment, citations, or open recommendations.`;
  }
}

function asRows<T>(res: unknown): Array<Record<string, unknown>> {
  const rows = Array.isArray(res)
    ? (res as T[])
    : (((res as unknown as { rows?: T[] })?.rows) ?? []);
  return rows as Array<Record<string, unknown>>;
}
