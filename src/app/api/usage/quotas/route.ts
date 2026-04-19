import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Usage Quotas API (F176)
 * GET /api/usage/quotas - Get usage quotas and limits
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { stripeBillingManager, SUBSCRIPTION_PLANS } from "@/lib/billing/stripe";
import type { UsageQuota, UsageMetricType } from "@/hooks/useUsage";

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

    // Calculate reset date (end of current month)
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const quotas: UsageQuota[] = [
      {
        metric: "ai_tokens" as UsageMetricType,
        limit: plan.limits.aiTokensPerMonth,
        resetDate: resetDate.toISOString(),
        canPurchaseMore: plan.tier !== "free",
        additionalUnitPrice: 0.001,
      },
      {
        metric: "api_calls" as UsageMetricType,
        limit: 10000,
        resetDate: resetDate.toISOString(),
        canPurchaseMore: plan.tier !== "free",
        additionalUnitPrice: 0.01,
      },
      {
        metric: "scans" as UsageMetricType,
        limit: plan.limits.mentionsPerMonth,
        resetDate: resetDate.toISOString(),
        canPurchaseMore: true,
        additionalUnitPrice: 0.5,
      },
      {
        metric: "audits" as UsageMetricType,
        limit: plan.limits.auditsPerMonth,
        resetDate: resetDate.toISOString(),
        canPurchaseMore: true,
        additionalUnitPrice: 2.0,
      },
      {
        metric: "content_generations" as UsageMetricType,
        limit: plan.limits.contentPiecesPerMonth,
        resetDate: resetDate.toISOString(),
        canPurchaseMore: true,
        additionalUnitPrice: 0.25,
      },
      {
        metric: "mentions_tracked" as UsageMetricType,
        limit: plan.limits.mentionsPerMonth,
        resetDate: resetDate.toISOString(),
        canPurchaseMore: true,
        additionalUnitPrice: 0.1,
      },
      {
        metric: "storage_mb" as UsageMetricType,
        limit: 10240, // 10 GB
        resetDate: "", // Storage doesn't reset
        canPurchaseMore: true,
        additionalUnitPrice: 0.05,
      },
      {
        metric: "team_members" as UsageMetricType,
        limit: plan.limits.users,
        resetDate: "", // Team members don't reset
        canPurchaseMore: plan.tier !== "enterprise",
        additionalUnitPrice: 10.0,
      },
    ];

    return NextResponse.json({ quotas });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch usage quotas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
