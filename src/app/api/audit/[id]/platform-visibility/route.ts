/**
 * Real AI platform visibility for an audit.
 *
 * GET /api/audit/[id]/platform-visibility
 *
 * Returns one row per AI platform we monitor, based on the audit's
 * owning brand's actual `brand_mentions`. Replaces the previous
 * useAIReadiness hook that fabricated per-platform scores by
 * multiplying `aiReadiness.score` by a deterministic constant
 * (0.95 for ChatGPT, 0.92 for Claude, etc.) — identical for every
 * brand with the same readiness score, and divorced from what the
 * platforms actually said.
 *
 * Visibility is computed from:
 *   - `total`     — count of mentions on that platform in the window
 *   - `mentioned` — mentions where the brand name actually appears
 *                   in the response (citationUrl IS NOT NULL is a
 *                   stronger signal; we fall back to sentiment
 *                   ≠ 'unrecognized' as a softer proxy)
 *   - `score`     — mentioned / total as 0-100, 0 if we haven't
 *                   queried that platform yet
 *   - `lastDetected` — the real timestamp of the most recent mention
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audits, brandMentions, brands } from "@/lib/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";

type PlatformRow = {
  name: string;
  slug: string;
  icon: string;
  status: "visible" | "partial" | "not-visible" | "not-tracked";
  score: number;
  totalMentions: number;
  mentioned: number;
  positive: number;
  citations: number;
  lastDetected: string | null;
};

// Kept in sync with monitor-worker's WORKER_CONFIG.platforms.
const PLATFORMS: Array<{ slug: string; name: string; icon: string }> = [
  { slug: "chatgpt", name: "ChatGPT (OpenAI)", icon: "🤖" },
  { slug: "claude", name: "Claude (Anthropic)", icon: "🧠" },
  { slug: "gemini", name: "Google Gemini", icon: "✨" },
  { slug: "perplexity", name: "Perplexity", icon: "🔍" },
  { slug: "grok", name: "Grok (xAI)", icon: "⚡" },
  { slug: "deepseek", name: "DeepSeek", icon: "🌊" },
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = await getOrganizationId();
    const { id: auditId } = await params;

    const audit = await db.query.audits.findFirst({
      where: eq(audits.id, auditId),
    });
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Authz: the audit's brand must belong to the caller's org (super-admin
    // bypass lives in isSuperAdmin()). Skip the check when there's no orgId
    // yet — API-key / JWT callers go through the route-handler guard.
    if (orgId) {
      const brand = await db.query.brands.findFirst({
        where: eq(brands.id, audit.brandId),
      });
      if (brand && brand.organizationId !== orgId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Look back 30 days from the audit's completedAt (or createdAt) so
    // "visibility" tracks the state of the brand when the audit ran, not
    // current state — older audits stay meaningful.
    const anchor = audit.completedAt ?? audit.createdAt ?? new Date();
    const windowStart = new Date(anchor.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = await db
      .select({
        platform: brandMentions.platform,
        total: sql<number>`COUNT(*)::int`,
        mentioned: sql<number>`COUNT(*) FILTER (WHERE ${brandMentions.sentiment} <> 'unrecognized')::int`,
        positive: sql<number>`COUNT(*) FILTER (WHERE ${brandMentions.sentiment} = 'positive')::int`,
        citations: sql<number>`COUNT(*) FILTER (WHERE ${brandMentions.citationUrl} IS NOT NULL)::int`,
        lastDetected: sql<string | null>`MAX(${brandMentions.createdAt})::text`,
      })
      .from(brandMentions)
      .where(
        and(
          eq(brandMentions.brandId, audit.brandId),
          gte(brandMentions.createdAt, windowStart),
        ),
      )
      .groupBy(brandMentions.platform);

    const byPlatform = new Map(stats.map((s) => [s.platform as string, s]));

    const rows: PlatformRow[] = PLATFORMS.map((p) => {
      const s = byPlatform.get(p.slug);
      if (!s || s.total === 0) {
        return {
          name: p.name,
          slug: p.slug,
          icon: p.icon,
          status: "not-tracked",
          score: 0,
          totalMentions: 0,
          mentioned: 0,
          positive: 0,
          citations: 0,
          lastDetected: null,
        };
      }
      const score = s.total > 0 ? Math.round((s.mentioned / s.total) * 100) : 0;
      const status: PlatformRow["status"] =
        score >= 70 ? "visible" : score >= 30 ? "partial" : "not-visible";
      return {
        name: p.name,
        slug: p.slug,
        icon: p.icon,
        status,
        score,
        totalMentions: s.total,
        mentioned: s.mentioned,
        positive: s.positive,
        citations: s.citations,
        lastDetected: s.lastDetected,
      };
    });

    // Sort most-visible first so the UI can render a leaderboard naturally.
    rows.sort((a, b) => b.score - a.score);

    // Give the caller a single "most recent" mention timestamp across every
    // platform — useful for showing "Last monitored: 3 hours ago".
    const lastOverall = await db
      .select({ at: brandMentions.createdAt })
      .from(brandMentions)
      .where(eq(brandMentions.brandId, audit.brandId))
      .orderBy(desc(brandMentions.createdAt))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        brandId: audit.brandId,
        window: { start: windowStart.toISOString(), end: anchor.toISOString() },
        platforms: rows,
        summary: {
          tracked: rows.filter((r) => r.totalMentions > 0).length,
          visible: rows.filter((r) => r.status === "visible").length,
          totalMentions: rows.reduce((s, r) => s + r.totalMentions, 0),
          averageScore:
            rows.filter((r) => r.totalMentions > 0).length > 0
              ? Math.round(
                  rows
                    .filter((r) => r.totalMentions > 0)
                    .reduce((s, r) => s + r.score, 0) /
                    rows.filter((r) => r.totalMentions > 0).length,
                )
              : 0,
        },
        lastMentionAt: lastOverall[0]?.at ?? null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
