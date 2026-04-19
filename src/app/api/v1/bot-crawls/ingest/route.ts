/**
 * POST /api/v1/bot-crawls/ingest
 *
 * Ingest endpoint for server-side AI-crawler logs (FR-MON-033).
 *
 * Designed to accept:
 *   - Cloudflare Logpush POST (JSON array of HTTP request objects)
 *   - Vercel Log Drain forward
 *   - Arbitrary curl payloads for self-hosted nginx access logs
 *
 * Auth: API key + a brand_id query param scoping incoming rows to a
 * specific brand. The caller (user's log-shipping infra) includes both
 * so we don't have to guess which brand a request belongs to based on
 * Host header.
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { brands, botCrawls } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import {
  classifyUserAgent,
  isKnownAiCrawler,
  redactIp,
} from "@/lib/bot-crawl/user-agent-classifier";
import { logger } from "@/lib/logger";

const EventSchema = z.object({
  user_agent: z.string().min(1).max(2048),
  path: z.string().min(1).max(2048),
  http_status: z.number().int().optional(),
  ip: z.string().max(64).optional(),
  response_bytes: z.number().int().nonnegative().optional(),
  latency_ms: z.number().int().nonnegative().optional(),
  occurred_at: z.string().datetime().optional(),
});

const BodySchema = z.object({
  brand_id: z.string().min(1),
  /** Source tag — "cloudflare_logpush", "vercel_log_drain", "nginx", etc. */
  source: z.string().min(1).max(64),
  events: z.array(EventSchema).min(1).max(5000),
});

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const auth = await requireV1Auth();
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError("invalid_request", "Validation failed.");
  }

  const brandRows = await db
    .select({ id: brands.id })
    .from(brands)
    .where(
      and(
        eq(brands.id, parsed.data.brand_id),
        eq(brands.organizationId, auth.tenantId),
      ),
    )
    .limit(1);
  if (brandRows.length === 0) {
    throw new ApiError("not_found", "Brand not found.");
  }

  // Filter to known AI crawlers only — non-AI traffic is not our product
  const filtered = parsed.data.events.filter((e) =>
    isKnownAiCrawler(e.user_agent),
  );

  if (filtered.length === 0) {
    return NextResponse.json({
      data: { accepted: 0, filtered_non_ai: parsed.data.events.length },
    });
  }

  const rows = filtered.map((e) => ({
    brandId: parsed.data.brand_id,
    crawler: classifyUserAgent(e.user_agent),
    userAgent: e.user_agent,
    path: e.path,
    httpStatus: e.http_status,
    ipRedacted: redactIp(e.ip ?? null),
    responseBytes: e.response_bytes,
    latencyMs: e.latency_ms,
    source: parsed.data.source,
    occurredAt: e.occurred_at ? new Date(e.occurred_at) : new Date(),
  }));

  try {
    await db.insert(botCrawls).values(rows);
  } catch (err) {
    logger.error("bot_crawls.insert_failed", {
      count: rows.length,
      err: (err as Error).message,
    });
    throw new ApiError("internal_error", "Failed to write crawl events.");
  }

  return NextResponse.json({
    data: {
      accepted: rows.length,
      filtered_non_ai: parsed.data.events.length - rows.length,
    },
  });
});
