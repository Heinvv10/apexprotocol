import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Usage History API (F176)
 * GET /api/usage/history - Get usage history over time
 * Now queries from database for real AI token usage
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { aiUsage, audits, content, brandMentions, users, apiCallTracking, storageTracking } from "@/lib/db/schema";
import { eq, and, gte, sql, count, inArray } from "drizzle-orm";
import { brands } from "@/lib/db/schema";
import type { UsageHistory, UsageMetricType } from "@/hooks/useUsage";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const organizationId = orgId || userId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    // Determine number of days from period
    let days = 30;
    if (period === "7d") days = 7;
    else if (period === "14d") days = 14;
    else if (period === "30d") days = 30;
    else if (period === "90d") days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Query AI token usage from database grouped by date
    const aiUsageData = await db
      .select({
        date: sql<string>`DATE(${aiUsage.createdAt})`.as("date"),
        totalTokens: sql<number>`SUM(${aiUsage.totalTokens})`.as("total_tokens"),
      })
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.organizationId, organizationId),
          gte(aiUsage.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(${aiUsage.createdAt})`);

    // Get brand IDs for this organization
    const orgBrands = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.organizationId, organizationId));
    const brandIds = orgBrands.map((b) => b.id);

    // Query audits per day (via brands)
    const auditData = await db
      .select({
        date: sql<string>`DATE(${audits.createdAt})`.as("date"),
        count: count(),
      })
      .from(audits)
      .where(
        and(
          brandIds.length > 0 ? inArray(audits.brandId, brandIds) : sql`false`,
          gte(audits.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(${audits.createdAt})`);

    // Query content generations per day (via brands)
    const contentData = await db
      .select({
        date: sql<string>`DATE(${content.createdAt})`.as("date"),
        count: count(),
      })
      .from(content)
      .where(
        and(
          brandIds.length > 0 ? inArray(content.brandId, brandIds) : sql`false`,
          gte(content.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(${content.createdAt})`);

    // Query mentions per day
    const mentionsData = await db
      .select({
        date: sql<string>`DATE(${brandMentions.createdAt})`.as("date"),
        count: count(),
      })
      .from(brandMentions)
      .where(gte(brandMentions.createdAt, startDate))
      .groupBy(sql`DATE(${brandMentions.createdAt})`);

    // Query API calls per day
    const apiCallsData = await db
      .select({
        date: sql<string>`DATE(${apiCallTracking.createdAt})`.as("date"),
        count: count(),
      })
      .from(apiCallTracking)
      .where(
        and(
          eq(apiCallTracking.organizationId, organizationId),
          gte(apiCallTracking.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(${apiCallTracking.createdAt})`);

    // Query storage usage per day (aggregated by date)
    const storageData = await db
      .select({
        date: sql<string>`DATE(${storageTracking.createdAt})`.as("date"),
        totalBytes: sql<number>`SUM(${storageTracking.sizeBytes})`.as("total_bytes"),
      })
      .from(storageTracking)
      .where(
        and(
          eq(storageTracking.organizationId, organizationId),
          gte(storageTracking.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(${storageTracking.createdAt})`);

    // Get team member count
    const teamCount = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.organizationId, organizationId));

    const teamMembers = teamCount[0]?.count || 1;

    // Create lookup maps for quick access
    const aiLookup = new Map(aiUsageData.map((d) => [d.date, d.totalTokens || 0]));
    const auditLookup = new Map(auditData.map((d) => [d.date, d.count || 0]));
    const contentLookup = new Map(contentData.map((d) => [d.date, d.count || 0]));
    const mentionsLookup = new Map(mentionsData.map((d) => [d.date, d.count || 0]));
    const apiCallsLookup = new Map(apiCallsData.map((d) => [d.date, d.count || 0]));
    const storageLookup = new Map(storageData.map((d) => [d.date, Math.round((d.totalBytes || 0) / (1024 * 1024))]));

    // Build history data for each day
    const data: Array<{
      date: string;
      metrics: Record<UsageMetricType, number>;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      data.push({
        date: dateStr,
        metrics: {
          ai_tokens: aiLookup.get(dateStr) || 0,
          api_calls: apiCallsLookup.get(dateStr) || 0,
          scans: mentionsLookup.get(dateStr) || 0,
          audits: auditLookup.get(dateStr) || 0,
          content_generations: contentLookup.get(dateStr) || 0,
          mentions_tracked: mentionsLookup.get(dateStr) || 0,
          storage_mb: storageLookup.get(dateStr) || 0,
          team_members: teamMembers,
        } as Record<UsageMetricType, number>,
      });
    }

    const history: UsageHistory = {
      period,
      data,
    };

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch usage history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
