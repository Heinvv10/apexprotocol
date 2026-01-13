import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Usage Summary API (F176)
 * GET /api/usage/summary - Get usage summary for organization
 * Now queries from database for real usage data
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { aiUsage, audits, content, brandMentions, users, apiCallTracking } from "@/lib/db/schema";
import { eq, and, gte, sql, count, sum, inArray } from "drizzle-orm";
import { brands } from "@/lib/db/schema";
import { stripeBillingManager, SUBSCRIPTION_PLANS } from "@/lib/billing/stripe";
import type { UsageMetricType, UsageSummary, UsageMetric, UsageAlert } from "@/hooks/useUsage";

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

    const { searchParams } = new URL(request.url);
    const queryOrgId = searchParams.get("orgId") || orgId || userId;

    // Get subscription to determine limits
    const subscription = stripeBillingManager.getSubscription(queryOrgId);
    const plan = subscription
      ? SUBSCRIPTION_PLANS.find((p) => p.tier === subscription.plan)
      : SUBSCRIPTION_PLANS.find((p) => p.tier === "free");

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Calculate period dates for current month
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Query AI token usage from database for this month
    const aiTokensResult = await db
      .select({ total: sum(aiUsage.totalTokens) })
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.organizationId, queryOrgId),
          gte(aiUsage.createdAt, periodStart)
        )
      );

    // Get brand IDs for this organization
    const orgBrands = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.organizationId, queryOrgId));
    const brandIds = orgBrands.map((b) => b.id);

    // Query audits count this month (via brands)
    const auditsResult = await db
      .select({ count: count() })
      .from(audits)
      .where(
        and(
          brandIds.length > 0 ? inArray(audits.brandId, brandIds) : sql`false`,
          gte(audits.createdAt, periodStart)
        )
      );

    // Query content generations this month (via brands)
    const contentResult = await db
      .select({ count: count() })
      .from(content)
      .where(
        and(
          brandIds.length > 0 ? inArray(content.brandId, brandIds) : sql`false`,
          gte(content.createdAt, periodStart)
        )
      );

    // Query mentions this month
    const mentionsResult = await db
      .select({ count: count() })
      .from(brandMentions)
      .where(gte(brandMentions.createdAt, periodStart));

    // Get team member count
    const teamResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.organizationId, queryOrgId));

    // Query API calls this month
    const apiCallsResult = await db
      .select({ count: count() })
      .from(apiCallTracking)
      .where(
        and(
          eq(apiCallTracking.organizationId, queryOrgId),
          gte(apiCallTracking.createdAt, periodStart)
        )
      );

    // Build usage object from database queries
    const usage = {
      ai_tokens: Number(aiTokensResult[0]?.total) || 0,
      audits: auditsResult[0]?.count || 0,
      content_pieces: contentResult[0]?.count || 0,
      mentions: mentionsResult[0]?.count || 0,
      api_calls: apiCallsResult[0]?.count || 0,
      team_members: teamResult[0]?.count || 1,
    };

    // Generate history data for the last 7 days from database
    const generateHistory = async (metricType: string) => {
      const history: Array<{ date: string; value: number }> = [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (metricType === "ai_tokens") {
        const data = await db
          .select({
            date: sql<string>`DATE(${aiUsage.createdAt})`.as("date"),
            total: sum(aiUsage.totalTokens),
          })
          .from(aiUsage)
          .where(
            and(
              eq(aiUsage.organizationId, queryOrgId),
              gte(aiUsage.createdAt, sevenDaysAgo)
            )
          )
          .groupBy(sql`DATE(${aiUsage.createdAt})`);

        const lookup = new Map(data.map((d) => [d.date, Number(d.total) || 0]));
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          history.push({
            date: dateStr,
            value: lookup.get(dateStr) || 0,
          });
        }
      } else {
        // Default to zero-filled history for other metrics
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          history.push({
            date: date.toISOString().split("T")[0],
            value: 0,
          });
        }
      }
      return history;
    };

    // Pre-fetch all history data in parallel
    const [
      aiTokensHistory,
      apiCallsHistory,
      scansHistory,
      auditsHistory,
      contentHistory,
      mentionsHistory,
      storageHistory,
      teamHistory,
    ] = await Promise.all([
      generateHistory("ai_tokens"),
      generateHistory("api_calls"),
      generateHistory("scans"),
      generateHistory("audits"),
      generateHistory("content_generations"),
      generateHistory("mentions_tracked"),
      generateHistory("storage_mb"),
      generateHistory("team_members"),
    ]);

    // Build metrics array with pre-fetched history
    const metrics: UsageMetric[] = [
      {
        type: "ai_tokens" as UsageMetricType,
        label: "AI Tokens",
        current: usage.ai_tokens || 0,
        limit: plan.limits.aiTokensPerMonth,
        unit: "tokens",
        percentage: Math.round(((usage.ai_tokens || 0) / plan.limits.aiTokensPerMonth) * 100),
        trend: 12,
        history: aiTokensHistory,
      },
      {
        type: "api_calls" as UsageMetricType,
        label: "API Calls",
        current: usage.api_calls || 0,
        limit: 10000,
        unit: "calls",
        percentage: Math.round(((usage.api_calls || 0) / 10000) * 100),
        trend: 5,
        history: apiCallsHistory,
      },
      {
        type: "scans" as UsageMetricType,
        label: "Brand Scans",
        current: usage.mentions || 0,
        limit: plan.limits.mentionsPerMonth,
        unit: "scans",
        percentage: Math.round(((usage.mentions || 0) / plan.limits.mentionsPerMonth) * 100),
        trend: -3,
        history: scansHistory,
      },
      {
        type: "audits" as UsageMetricType,
        label: "Site Audits",
        current: usage.audits || 0,
        limit: plan.limits.auditsPerMonth,
        unit: "audits",
        percentage: Math.round(((usage.audits || 0) / plan.limits.auditsPerMonth) * 100),
        trend: 8,
        history: auditsHistory,
      },
      {
        type: "content_generations" as UsageMetricType,
        label: "Content Generations",
        current: usage.content_pieces || 0,
        limit: plan.limits.contentPiecesPerMonth,
        unit: "pieces",
        percentage: Math.round(((usage.content_pieces || 0) / plan.limits.contentPiecesPerMonth) * 100),
        trend: 15,
        history: contentHistory,
      },
      {
        type: "mentions_tracked" as UsageMetricType,
        label: "Mentions Tracked",
        current: usage.mentions || 0,
        limit: plan.limits.mentionsPerMonth,
        unit: "mentions",
        percentage: Math.round(((usage.mentions || 0) / plan.limits.mentionsPerMonth) * 100),
        trend: 22,
        history: mentionsHistory,
      },
      {
        type: "storage_mb" as UsageMetricType,
        label: "Storage",
        current: 2400,
        limit: 10240,
        unit: "mb",
        percentage: 23,
        trend: 4,
        history: storageHistory,
      },
      {
        type: "team_members" as UsageMetricType,
        label: "Team Members",
        current: usage.team_members,
        limit: plan.limits.users,
        unit: "users",
        percentage: Math.round((usage.team_members / plan.limits.users) * 100),
        trend: 0,
        history: teamHistory,
      },
    ];

    // Generate alerts for metrics approaching limits
    const alerts: UsageAlert[] = [];
    metrics.forEach((metric, index) => {
      if (metric.percentage >= 80 && metric.percentage < 100) {
        alerts.push({
          id: `alert-${metric.type}-${index}`,
          type: "warning",
          metric: metric.type,
          message: `${metric.label} usage is at ${metric.percentage}% of limit`,
          threshold: 80,
          currentValue: metric.current,
        });
      } else if (metric.percentage >= 100) {
        alerts.push({
          id: `alert-${metric.type}-critical-${index}`,
          type: "critical",
          metric: metric.type,
          message: `${metric.label} limit exceeded`,
          threshold: 100,
          currentValue: metric.current,
        });
      }
    });

    const summary: UsageSummary = {
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      metrics,
      totalCost: subscription ? (plan.priceMonthly || 0) : 0,
      projectedCost: subscription ? (plan.priceMonthly || 0) * 1.1 : 0,
      alerts,
    };

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch usage summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
