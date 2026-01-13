import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Purchase Additional Usage API (F176)
 * POST /api/usage/purchase - Purchase additional usage quota
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { stripeBillingManager } from "@/lib/billing/stripe";

// Pricing per unit for additional usage
const additionalUsagePricing: Record<string, number> = {
  ai_tokens: 0.001, // $0.001 per 1000 tokens
  api_calls: 0.01,
  scans: 0.5,
  audits: 2.0,
  content_generations: 0.25,
  mentions_tracked: 0.1,
  storage_mb: 0.05,
  team_members: 10.0,
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
      quantity: z.number().min(1),
    });

    const data = schema.parse(body);

    // Get subscription
    const subscription = stripeBillingManager.getSubscription(organizationId);

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription. Upgrade to purchase additional usage." },
        { status: 403 }
      );
    }

    // Calculate price
    const unitPrice = additionalUsagePricing[data.metric] || 1;
    const totalPrice = unitPrice * data.quantity;

    // In production, this would integrate with Stripe to process payment
    // For now, we simulate the purchase

    return NextResponse.json({
      success: true,
      purchase: {
        metric: data.metric,
        quantity: data.quantity,
        unitPrice,
        totalPrice,
        currency: "USD",
        status: "completed",
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        purchasedAt: new Date().toISOString(),
      },
      message: `Successfully purchased ${data.quantity} additional ${data.metric}`,
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
        error: "Failed to process purchase",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
