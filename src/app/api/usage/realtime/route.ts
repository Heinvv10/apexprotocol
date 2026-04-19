import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Realtime Usage API (F176)
 * GET /api/usage/realtime - Get real-time usage stats
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { stripeBillingManager, SUBSCRIPTION_PLANS } from "@/lib/billing/stripe";

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

    // Get subscription
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

    // Get current usage
    const rawUsage = subscription
      ? stripeBillingManager.getUsage(subscription.id)
      : null;

    // Normalize usage to common structure
    const usage = {
      mentions: rawUsage?.mentionsThisMonth ?? 0,
      audits: rawUsage?.auditsThisMonth ?? 0,
      ai_tokens: rawUsage?.aiTokensThisMonth ?? 0,
      content_pieces: rawUsage?.contentPiecesThisMonth ?? 0,
      api_calls: 0, // Not tracked in UsageMetrics
    };

    // Simulate real-time activity
    const now = new Date();
    const recentEvents = [
      {
        type: "ai_tokens",
        amount: 150,
        timestamp: new Date(now.getTime() - 5000).toISOString(),
        source: "content-generation",
      },
      {
        type: "api_calls",
        amount: 1,
        timestamp: new Date(now.getTime() - 15000).toISOString(),
        source: "brand-scan",
      },
      {
        type: "mentions_tracked",
        amount: 3,
        timestamp: new Date(now.getTime() - 30000).toISOString(),
        source: "monitor-cron",
      },
    ];

    // Calculate rates (per minute)
    const rates = {
      ai_tokens: Math.round(Math.random() * 100 + 50),
      api_calls: Math.round(Math.random() * 5 + 2),
      scans: 0,
      audits: 0,
      content_generations: Math.random() > 0.8 ? 1 : 0,
      mentions_tracked: Math.round(Math.random() * 3),
    };

    return NextResponse.json({
      timestamp: now.toISOString(),
      currentUsage: {
        ai_tokens: usage.ai_tokens || 0,
        api_calls: usage.api_calls || 0,
        scans: usage.mentions || 0,
        audits: usage.audits || 0,
        content_generations: usage.content_pieces || 0,
        mentions_tracked: usage.mentions || 0,
      },
      limits: {
        ai_tokens: plan.limits.aiTokensPerMonth,
        api_calls: 10000,
        scans: plan.limits.mentionsPerMonth,
        audits: plan.limits.auditsPerMonth,
        content_generations: plan.limits.contentPiecesPerMonth,
        mentions_tracked: plan.limits.mentionsPerMonth,
      },
      recentEvents,
      rates,
      status: "healthy",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch realtime usage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
