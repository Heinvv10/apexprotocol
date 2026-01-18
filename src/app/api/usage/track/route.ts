import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Usage Tracking API (F176)
 * POST /api/usage/track - Track usage event
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { stripeBillingManager } from "@/lib/billing/stripe";
import type { UsageType } from "@/lib/billing/stripe";

// Map hook metric types to billing types
const metricToBillingType: Record<string, UsageType> = {
  ai_tokens: "ai_tokens",
  api_calls: "api_calls",
  scans: "mentions",
  audits: "audits",
  content_generations: "content_pieces",
  mentions_tracked: "mentions",
};

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    const schema = z.object({
      metric: z.enum([
        "ai_tokens",
        "api_calls",
        "scans",
        "audits",
        "content_generations",
        "mentions_tracked",
        "storage_mb",
        "team_members",
      ]),
      amount: z.number().min(1).default(1),
      metadata: z.record(z.string(), z.unknown()).optional(),
    });

    const data = schema.parse(body);

    // Get subscription
    const subscription = stripeBillingManager.getSubscription(organizationId);

    if (!subscription) {
      // For free tier, just acknowledge the tracking (no actual billing)
      return NextResponse.json({
        success: true,
        tracked: {
          metric: data.metric,
          amount: data.amount,
          timestamp: new Date().toISOString(),
        },
        message: "Usage tracked (free tier)",
      });
    }

    // Map to billing type
    const billingType = metricToBillingType[data.metric];

    if (!billingType) {
      // For metrics not tracked in billing, just acknowledge
      return NextResponse.json({
        success: true,
        tracked: {
          metric: data.metric,
          amount: data.amount,
          timestamp: new Date().toISOString(),
        },
        message: `Usage tracked for ${data.metric}`,
      });
    }

    // Check limit first
    const limitCheck = stripeBillingManager.checkUsageLimit(
      subscription.id,
      billingType,
      data.amount
    );

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Usage limit exceeded",
          metric: data.metric,
          current: limitCheck.current,
          limit: limitCheck.limit,
          remaining: limitCheck.remaining,
        },
        { status: 403 }
      );
    }

    // Record usage
    const event = stripeBillingManager.recordUsage(
      subscription.id,
      billingType,
      data.amount,
      data.metadata
    );

    return NextResponse.json({
      success: true,
      tracked: {
        id: event.id,
        metric: data.metric,
        amount: event.quantity,
        timestamp: event.timestamp.toISOString(),
      },
      usage: stripeBillingManager.getUsage(subscription.id),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to track usage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
