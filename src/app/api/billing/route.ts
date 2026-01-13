import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Billing API (F132-F135)
 * GET /api/billing - Get subscription, plans, usage, invoices
 * POST /api/billing - Checkout, upgrade, cancel, portal
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import Stripe from "stripe";
import {
  stripeBillingManager,
  formatSubscriptionResponse,
  formatPlanResponse,
  SUBSCRIPTION_PLANS,
  type PlanTier,
  type UsageType,
} from "@/lib/billing/stripe";

const VALID_PLANS: PlanTier[] = ["free", "starter", "pro", "enterprise"];
const VALID_USAGE_TYPES: UsageType[] = ["mentions", "audits", "ai_tokens", "content_pieces", "api_calls"];

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
    const action = searchParams.get("action") || "subscription";

    switch (action) {
      case "subscription":
        return handleGetSubscription(organizationId);

      case "plans":
        return handleGetPlans();

      case "usage": {
        const type = searchParams.get("type") as UsageType | undefined;
        return handleGetUsage(organizationId, type);
      }

      case "invoices": {
        const limit = parseInt(searchParams.get("limit") || "10");
        return handleGetInvoices(organizationId, limit);
      }

      case "checkLimit": {
        const type = searchParams.get("type") as UsageType;
        const quantity = parseInt(searchParams.get("quantity") || "1");
        return handleCheckLimit(organizationId, type, quantity);
      }

      case "features":
        return handleGetFeatures(organizationId);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: subscription, plans, usage, invoices, checkLimit, features" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process billing request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

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
    const action = body.action;

    switch (action) {
      case "createCustomer":
        return handleCreateCustomer(organizationId, body);

      case "createCheckout":
        return handleCreateCheckout(organizationId, body);

      case "createSubscription":
        return handleCreateSubscription(organizationId, body);

      case "changePlan":
        return handleChangePlan(organizationId, body);

      case "cancelSubscription":
        return handleCancelSubscription(organizationId, body);

      case "reactivate":
        return handleReactivate(organizationId);

      case "createPortalSession":
        return handleCreatePortalSession(organizationId, body);

      case "recordUsage":
        return handleRecordUsage(organizationId, body);

      case "webhook":
        return handleWebhook(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: createCustomer, createCheckout, createSubscription, changePlan, cancelSubscription, reactivate, createPortalSession, recordUsage, webhook" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Billing operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetSubscription(organizationId: string) {
  const subscription = stripeBillingManager.getSubscription(organizationId);

  if (!subscription) {
    // Return free tier if no subscription
    const freePlan = SUBSCRIPTION_PLANS.find((p) => p.tier === "free");
    return NextResponse.json({
      success: true,
      subscription: null,
      effectivePlan: freePlan ? formatPlanResponse(freePlan) : null,
      message: "No active subscription - using free tier",
    });
  }

  return NextResponse.json({
    success: true,
    subscription: formatSubscriptionResponse(subscription),
  });
}

function handleGetPlans() {
  return NextResponse.json({
    success: true,
    plans: SUBSCRIPTION_PLANS.map(formatPlanResponse),
  });
}

function handleGetUsage(organizationId: string, type?: UsageType) {
  const subscription = stripeBillingManager.getSubscription(organizationId);

  if (!subscription) {
    return NextResponse.json({
      success: true,
      usage: null,
      message: "No active subscription",
    });
  }

  const usage = stripeBillingManager.getUsage(subscription.id);
  const events = stripeBillingManager.getUsageEvents(subscription.id, type, 100);

  return NextResponse.json({
    success: true,
    usage,
    recentEvents: events.map((e) => ({
      id: e.id,
      type: e.type,
      quantity: e.quantity,
      timestamp: e.timestamp.toISOString(),
    })),
  });
}

async function handleGetInvoices(organizationId: string, limit: number) {
  const subscription = stripeBillingManager.getSubscription(organizationId);

  if (!subscription) {
    return NextResponse.json({
      success: true,
      invoices: [],
      message: "No active subscription",
    });
  }

  const invoices = await stripeBillingManager.getInvoices(
    subscription.stripeCustomerId,
    limit
  );

  return NextResponse.json({
    success: true,
    invoices: invoices.map((inv) => ({
      id: inv.id,
      amount: inv.amount,
      currency: inv.currency,
      status: inv.status,
      periodStart: inv.periodStart.toISOString(),
      periodEnd: inv.periodEnd.toISOString(),
      pdfUrl: inv.pdfUrl,
      createdAt: inv.createdAt.toISOString(),
    })),
  });
}

function handleCheckLimit(
  organizationId: string,
  type: UsageType,
  quantity: number
) {
  if (!VALID_USAGE_TYPES.includes(type)) {
    return NextResponse.json(
      { error: "Invalid usage type" },
      { status: 400 }
    );
  }

  const subscription = stripeBillingManager.getSubscription(organizationId);

  if (!subscription) {
    // Check against free tier limits
    const freePlan = SUBSCRIPTION_PLANS.find((p) => p.tier === "free");
    if (!freePlan) {
      return NextResponse.json({ allowed: false, reason: "No plan available" });
    }

    let limit: number;
    switch (type) {
      case "mentions":
        limit = freePlan.limits.mentionsPerMonth;
        break;
      case "audits":
        limit = freePlan.limits.auditsPerMonth;
        break;
      case "ai_tokens":
        limit = freePlan.limits.aiTokensPerMonth;
        break;
      case "content_pieces":
        limit = freePlan.limits.contentPiecesPerMonth;
        break;
      default:
        limit = 0;
    }

    return NextResponse.json({
      success: true,
      allowed: quantity <= limit,
      current: 0,
      limit,
      remaining: limit,
    });
  }

  const result = stripeBillingManager.checkUsageLimit(
    subscription.id,
    type,
    quantity
  );

  return NextResponse.json({
    success: true,
    ...result,
  });
}

function handleGetFeatures(organizationId: string) {
  const subscription = stripeBillingManager.getSubscription(organizationId);
  const plan = subscription
    ? SUBSCRIPTION_PLANS.find((p) => p.tier === subscription.plan)
    : SUBSCRIPTION_PLANS.find((p) => p.tier === "free");

  if (!plan) {
    return NextResponse.json({
      success: false,
      error: "Plan not found",
    });
  }

  return NextResponse.json({
    success: true,
    plan: plan.tier,
    features: plan.features,
    limits: plan.limits,
  });
}

// POST handlers
async function handleCreateCustomer(organizationId: string, body: unknown) {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
  });

  const data = schema.parse(body);

  const customerId = await stripeBillingManager.createCustomer(organizationId, {
    email: data.email,
    name: data.name,
  });

  return NextResponse.json({
    success: true,
    customerId,
  });
}

async function handleCreateCheckout(organizationId: string, body: unknown) {
  const schema = z.object({
    customerId: z.string().min(1),
    plan: z.enum(VALID_PLANS as [string, ...string[]]),
    billingCycle: z.enum(["monthly", "yearly"]),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
    trialDays: z.number().min(0).max(30).optional(),
  });

  const data = schema.parse(body);

  const session = await stripeBillingManager.createCheckoutSession(
    organizationId,
    {
      customerId: data.customerId,
      plan: data.plan as PlanTier,
      billingCycle: data.billingCycle,
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
      trialDays: data.trialDays,
    }
  );

  return NextResponse.json({
    success: true,
    sessionId: session.sessionId,
    url: session.url,
  });
}

function handleCreateSubscription(organizationId: string, body: unknown) {
  const schema = z.object({
    stripeCustomerId: z.string().min(1),
    stripeSubscriptionId: z.string().optional(),
    plan: z.enum(VALID_PLANS as [string, ...string[]]),
    billingCycle: z.enum(["monthly", "yearly"]),
  });

  const data = schema.parse(body);

  const subscription = stripeBillingManager.createSubscription(organizationId, {
    stripeCustomerId: data.stripeCustomerId,
    stripeSubscriptionId: data.stripeSubscriptionId,
    plan: data.plan as PlanTier,
    billingCycle: data.billingCycle,
  });

  return NextResponse.json({
    success: true,
    message: "Subscription created",
    subscription: formatSubscriptionResponse(subscription),
  });
}

async function handleChangePlan(organizationId: string, body: unknown) {
  const schema = z.object({
    plan: z.enum(VALID_PLANS as [string, ...string[]]),
    billingCycle: z.enum(["monthly", "yearly"]).optional(),
  });

  const data = schema.parse(body);

  const subscription = stripeBillingManager.getSubscription(organizationId);
  if (!subscription) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 404 }
    );
  }

  const updated = await stripeBillingManager.changePlan(
    subscription.id,
    data.plan as PlanTier,
    data.billingCycle
  );

  if (!updated) {
    return NextResponse.json(
      { error: "Failed to change plan" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Plan changed to ${data.plan}`,
    subscription: formatSubscriptionResponse(updated),
  });
}

async function handleCancelSubscription(organizationId: string, body: unknown) {
  const schema = z.object({
    immediately: z.boolean().optional(),
  });

  const data = schema.parse(body);

  const subscription = stripeBillingManager.getSubscription(organizationId);
  if (!subscription) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 404 }
    );
  }

  const updated = await stripeBillingManager.cancelSubscription(
    subscription.id,
    data.immediately
  );

  if (!updated) {
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: data.immediately
      ? "Subscription canceled immediately"
      : "Subscription will be canceled at period end",
    subscription: formatSubscriptionResponse(updated),
  });
}

function handleReactivate(organizationId: string) {
  const subscription = stripeBillingManager.getSubscription(organizationId);
  if (!subscription) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 404 }
    );
  }

  const updated = stripeBillingManager.updateSubscription(subscription.id, {
    cancelAtPeriodEnd: false,
    status: "active",
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Subscription reactivated",
    subscription: formatSubscriptionResponse(updated),
  });
}

async function handleCreatePortalSession(organizationId: string, body: unknown) {
  const schema = z.object({
    returnUrl: z.string().url(),
  });

  const data = schema.parse(body);

  const subscription = stripeBillingManager.getSubscription(organizationId);
  if (!subscription) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 404 }
    );
  }

  const session = await stripeBillingManager.createPortalSession(
    subscription.stripeCustomerId,
    data.returnUrl
  );

  return NextResponse.json({
    success: true,
    url: session.url,
  });
}

function handleRecordUsage(organizationId: string, body: unknown) {
  const schema = z.object({
    type: z.enum(VALID_USAGE_TYPES as [string, ...string[]]),
    quantity: z.number().min(1),
    metadata: z.record(z.string(), z.unknown()).optional(),
  });

  const data = schema.parse(body);

  const subscription = stripeBillingManager.getSubscription(organizationId);
  if (!subscription) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 404 }
    );
  }

  // Check limit first
  const limitCheck = stripeBillingManager.checkUsageLimit(
    subscription.id,
    data.type as UsageType,
    data.quantity
  );

  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: "Usage limit exceeded",
        current: limitCheck.current,
        limit: limitCheck.limit,
        remaining: limitCheck.remaining,
      },
      { status: 403 }
    );
  }

  const event = stripeBillingManager.recordUsage(
    subscription.id,
    data.type as UsageType,
    data.quantity,
    data.metadata
  );

  return NextResponse.json({
    success: true,
    event: {
      id: event.id,
      type: event.type,
      quantity: event.quantity,
      timestamp: event.timestamp.toISOString(),
    },
    newUsage: stripeBillingManager.getUsage(subscription.id),
  });
}

async function handleWebhook(body: unknown) {
  const schema = z.object({
    type: z.string(),
    data: z.object({
      object: z.record(z.string(), z.unknown()),
    }),
  });

  const event = schema.parse(body);

  const result = await stripeBillingManager.handleWebhook(event as unknown as Stripe.Event);

  return NextResponse.json({
    success: true,
    handled: result.handled,
    action: result.action,
  });
}
