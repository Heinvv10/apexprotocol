/**
 * GET /api/v1/brands/:id/mentions
 *
 * List brand mentions, cursor-paginated. Filter by platform, since, sentiment.
 *
 * Query params:
 *   - limit (1..200, default 50)
 *   - cursor (opaque)
 *   - platform (chatgpt|claude|gemini|perplexity|grok|deepseek|copilot|...)
 *   - since (ISO timestamp)
 *   - sentiment (positive|neutral|negative|unrecognized)
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq, gte, lt, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands, brandMentions } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import { parsePagination, paginate } from "@/lib/api/v1/pagination";

type AiPlatform =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "grok"
  | "deepseek"
  | "copilot"
  | "openai_search"
  | "bing_copilot"
  | "notebooklm"
  | "cohere"
  | "janus"
  | "mistral"
  | "llama"
  | "yandexgpt"
  | "kimi"
  | "qwen";

const VALID_PLATFORMS: Set<string> = new Set([
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
  "grok",
  "deepseek",
  "copilot",
  "openai_search",
  "bing_copilot",
  "notebooklm",
  "cohere",
  "janus",
  "mistral",
  "llama",
  "yandexgpt",
  "kimi",
  "qwen",
]);
const VALID_SENTIMENTS = new Set([
  "positive",
  "neutral",
  "negative",
  "unrecognized",
]);

export const GET = withApiErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const auth = await requireV1Auth();
    const { id: brandId } = await params;
    const qp = request.nextUrl.searchParams;
    const pagination = parsePagination(qp);

    // Confirm brand is in caller's tenant (RLS also enforces this — belt+braces)
    const brandRows = await db
      .select({ id: brands.id })
      .from(brands)
      .where(
        and(eq(brands.id, brandId), eq(brands.organizationId, auth.tenantId)),
      )
      .limit(1);
    if (brandRows.length === 0) {
      throw new ApiError("not_found", `Brand "${brandId}" not found.`);
    }

    const filters: SQL[] = [eq(brandMentions.brandId, brandId)];

    const platform = qp.get("platform");
    if (platform) {
      if (!VALID_PLATFORMS.has(platform)) {
        throw new ApiError(
          "invalid_request",
          `Unknown platform "${platform}".`,
          { platform: "see enum values" },
        );
      }
      filters.push(eq(brandMentions.platform, platform as AiPlatform));
    }

    const sentiment = qp.get("sentiment");
    if (sentiment) {
      if (!VALID_SENTIMENTS.has(sentiment)) {
        throw new ApiError(
          "invalid_request",
          `Unknown sentiment "${sentiment}".`,
          { sentiment: "one of positive|neutral|negative|unrecognized" },
        );
      }
      filters.push(
        eq(
          brandMentions.sentiment,
          sentiment as "positive" | "neutral" | "negative" | "unrecognized",
        ),
      );
    }

    const since = qp.get("since");
    if (since) {
      const sinceDate = new Date(since);
      if (Number.isNaN(sinceDate.getTime())) {
        throw new ApiError("invalid_request", "Invalid `since` timestamp.");
      }
      filters.push(gte(brandMentions.timestamp, sinceDate));
    }

    // Cursor pagination on (timestamp, id) desc
    if (pagination.cursor) {
      filters.push(
        lt(brandMentions.timestamp, new Date(pagination.cursor.ts)),
      );
    }

    const rows = await db
      .select({
        id: brandMentions.id,
        platform: brandMentions.platform,
        query: brandMentions.query,
        sentiment: brandMentions.sentiment,
        position: brandMentions.position,
        citationUrl: brandMentions.citationUrl,
        competitors: brandMentions.competitors,
        timestamp: brandMentions.timestamp,
      })
      .from(brandMentions)
      .where(and(...filters))
      .orderBy(desc(brandMentions.timestamp), desc(brandMentions.id))
      .limit(pagination.limit + 1);

    // Adapt into shape the paginator expects (createdAt = timestamp)
    const adapted = rows.map((r) => ({ ...r, createdAt: r.timestamp }));
    const page = paginate(adapted, pagination);

    return NextResponse.json({
      data: page.data.map((r) => ({
        id: r.id,
        platform: r.platform,
        query: r.query,
        sentiment: r.sentiment,
        position: r.position,
        citation_url: r.citationUrl,
        competitors: r.competitors ?? [],
        timestamp: r.timestamp.toISOString(),
      })),
      pagination: page.pagination,
    });
  },
);
