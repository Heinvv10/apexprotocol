/**
 * Platform-wide usage aggregated by organization.
 *
 * GET /api/admin/usage/by-org?days=7|30|90
 * Returns { data: [{organizationId, organizationName, tokens, cost, calls}, ...] }
 *
 * Super-admin only. Used by /admin/usage to render the "Top organizations"
 * leaderboard without exposing any single user's PII — only org-level totals.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiUsage, organizations, apiCallTracking } from "@/lib/db/schema";
import { sql, gte } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getUserId } from "@/lib/auth/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await isSuperAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get("days") || "30"), 1), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 1. Aggregate AI usage by org
    const aiRows = await db
      .select({
        organizationId: aiUsage.organizationId,
        tokens: sql<number>`COALESCE(SUM(${aiUsage.totalTokens}), 0)::int`,
        cost: sql<number>`COALESCE(SUM(${aiUsage.cost}::numeric), 0)::float`,
        aiCalls: sql<number>`COUNT(*)::int`,
      })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, since))
      .groupBy(aiUsage.organizationId);

    // 2. Aggregate API calls by org (independent of AI usage — may not overlap)
    const apiRows = await db
      .select({
        organizationId: apiCallTracking.organizationId,
        apiCalls: sql<number>`COUNT(*)::int`,
      })
      .from(apiCallTracking)
      .where(gte(apiCallTracking.createdAt, since))
      .groupBy(apiCallTracking.organizationId);

    // 3. Merge by orgId
    const byOrg: Record<string, { tokens: number; cost: number; calls: number }> = {};
    for (const r of aiRows) {
      byOrg[r.organizationId] = {
        tokens: Number(r.tokens) || 0,
        cost: Number(r.cost) || 0,
        calls: Number(r.aiCalls) || 0,
      };
    }
    for (const r of apiRows) {
      const entry = (byOrg[r.organizationId] ||= { tokens: 0, cost: 0, calls: 0 });
      entry.calls += Number(r.apiCalls) || 0;
    }

    // 4. Look up org names in one query
    const orgIds = Object.keys(byOrg);
    let nameMap: Record<string, string> = {};
    if (orgIds.length > 0) {
      const orgs = await db
        .select({ id: organizations.id, name: organizations.name })
        .from(organizations)
        .where(sql`${organizations.id} IN (${sql.join(orgIds.map((id) => sql`${id}`), sql`, `)})`);
      nameMap = Object.fromEntries(orgs.map((o) => [o.id, o.name]));
    }

    const data = Object.entries(byOrg)
      .map(([organizationId, v]) => ({
        organizationId,
        organizationName: nameMap[organizationId] ?? null,
        tokens: v.tokens,
        cost: v.cost,
        calls: v.calls,
      }))
      .sort((a, b) => b.tokens - a.tokens);

    return NextResponse.json({ success: true, data, period: { days, since: since.toISOString() } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
