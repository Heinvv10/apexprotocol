/**
 * GET /api/v1/brands/:id/prompt-gaps
 *
 * Prompts where this brand is cited below the mention-rate threshold —
 * the MONITOR→CREATE loop entry point (FR-CRE-014, 🏆 category-leading).
 *
 * Query params:
 *   - lookback_days (1..180, default 30)
 *   - threshold (0..1, default 0.2)
 *   - min_runs (1..50, default 3)
 *   - limit (1..100, default 20)
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import { findPromptGaps } from "@/lib/ai/prompt-gap-analyzer";

function clampInt(
  raw: string | null,
  def: number,
  min: number,
  max: number,
): number {
  if (!raw) return def;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
}

function clampFloat(
  raw: string | null,
  def: number,
  min: number,
  max: number,
): number {
  if (!raw) return def;
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
}

export const GET = withApiErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const auth = await requireV1Auth();
    const { id: brandId } = await params;
    const qp = request.nextUrl.searchParams;

    const brandRows = await db
      .select({ id: brands.id, name: brands.name })
      .from(brands)
      .where(
        and(eq(brands.id, brandId), eq(brands.organizationId, auth.tenantId)),
      )
      .limit(1);
    if (brandRows.length === 0) {
      throw new ApiError("not_found", `Brand "${brandId}" not found.`);
    }

    const gaps = await findPromptGaps({
      brandId,
      lookbackDays: clampInt(qp.get("lookback_days"), 30, 1, 180),
      mentionRateThreshold: clampFloat(qp.get("threshold"), 0.2, 0, 1),
      minRuns: clampInt(qp.get("min_runs"), 3, 1, 50),
      limit: clampInt(qp.get("limit"), 20, 1, 100),
    });

    return NextResponse.json({
      data: gaps.map((g) => ({
        query: g.query,
        total_runs: g.totalRuns,
        mentioned_runs: g.mentionedRuns,
        mentioned_rate: g.mentionedRate,
        losing_platforms: g.losingPlatforms.map((p) => ({
          platform: p.platform,
          total_runs: p.totalRuns,
          mentioned_runs: p.mentionedRuns,
          mentioned_rate: p.mentionedRate,
        })),
        top_competitors: g.topCompetitors,
        competitor_snippets: g.competitorSnippets,
      })),
      meta: {
        brand_id: brandId,
        brand_name: brandRows[0].name,
        gap_count: gaps.length,
      },
    });
  },
);
