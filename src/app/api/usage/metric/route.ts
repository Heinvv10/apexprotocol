import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Single Usage Metric API (F176)
 * GET /api/usage/metric - Get specific usage metric
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { stripeBillingManager, SUBSCRIPTION_PLANS } from "@/lib/billing/stripe";
import type { UsageMetric, UsageMetricType } from "@/hooks/useUsage";

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
    const metricType = searchParams.get("type") as UsageMetricType;

    if (!metricType) {
      return NextResponse.json(
        { error: "Missing metric type parameter" },
        { status: 400 }
      );
    }

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

    // Get usage from billing manager
    const rawUsage = subscription
      ? stripeBillingManager.getUsage(subscription.id)
      : null;

    // Normalize usage to common structure
    const usage = {
      mentions: rawUsage?.mentionsThisMonth ?? 0,
      audits: rawUsage?.auditsThisMonth ?? 0,
      ai_tokens: rawUsage?.aiTokensThisMonth ?? 0,
      content_pieces: rawUsage?.contentPiecesThisMonth ?? 0,
      api_calls: 0, // Not tracked in UsageMetrics, default to 0
    };

    // Generate history data
    const generateHistory = () => {
      const history: Array<{ date: string; value: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        history.push({
          date: date.toISOString().split("T")[0],
          value: Math.floor(Math.random() * 100) + 50,
        });
      }
      return history;
    };

    // Map metric type to actual values
    const metricConfigs: Record<
      UsageMetricType,
      { label: string; current: number; limit: number; unit: string }
    > = {
      ai_tokens: {
        label: "AI Tokens",
        current: usage.ai_tokens || 0,
        limit: plan.limits.aiTokensPerMonth,
        unit: "tokens",
      },
      api_calls: {
        label: "API Calls",
        current: usage.api_calls || 0,
        limit: 10000,
        unit: "calls",
      },
      scans: {
        label: "Brand Scans",
        current: usage.mentions || 0,
        limit: plan.limits.mentionsPerMonth,
        unit: "scans",
      },
      audits: {
        label: "Site Audits",
        current: usage.audits || 0,
        limit: plan.limits.auditsPerMonth,
        unit: "audits",
      },
      content_generations: {
        label: "Content Generations",
        current: usage.content_pieces || 0,
        limit: plan.limits.contentPiecesPerMonth,
        unit: "pieces",
      },
      mentions_tracked: {
        label: "Mentions Tracked",
        current: usage.mentions || 0,
        limit: plan.limits.mentionsPerMonth,
        unit: "mentions",
      },
      storage_mb: {
        label: "Storage",
        current: 2400,
        limit: 10240,
        unit: "mb",
      },
      team_members: {
        label: "Team Members",
        current: 3,
        limit: plan.limits.users,
        unit: "users",
      },
    };

    const config = metricConfigs[metricType];

    if (!config) {
      return NextResponse.json(
        { error: "Invalid metric type" },
        { status: 400 }
      );
    }

    const metric: UsageMetric = {
      type: metricType,
      label: config.label,
      current: config.current,
      limit: config.limit,
      unit: config.unit,
      percentage: Math.round((config.current / config.limit) * 100),
      trend: Math.round((Math.random() - 0.5) * 20),
      history: generateHistory(),
    };

    return NextResponse.json(metric);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch usage metric",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
