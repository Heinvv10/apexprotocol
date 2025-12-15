/**
 * Stripe Billing Integration (F132-F135)
 * Subscription management, usage metering, and customer portal
 */

import { createId } from "@paralleldrive/cuid2";
import Stripe from "stripe";

// Initialize Stripe (will use STRIPE_SECRET_KEY from env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

// Billing types
export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: PlanTier;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  features: PlanFeature[];
  limits: PlanLimits;
  popular?: boolean;
  enterpriseCustom?: boolean;
}

export type PlanTier = "free" | "starter" | "pro" | "enterprise";

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

export interface PlanLimits {
  brands: number;
  platforms: number;
  users: number;
  mentionsPerMonth: number;
  auditsPerMonth: number;
  aiTokensPerMonth: number;
  contentPiecesPerMonth: number;
  customIntegrations: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  dedicatedAccountManager: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  billingCycle: "monthly" | "yearly";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  usage: UsageMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";

export interface UsageMetrics {
  mentionsThisMonth: number;
  auditsThisMonth: number;
  aiTokensThisMonth: number;
  contentPiecesThisMonth: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface UsageEvent {
  id: string;
  subscriptionId: string;
  type: UsageType;
  quantity: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export type UsageType =
  | "mentions"
  | "audits"
  | "ai_tokens"
  | "content_pieces"
  | "api_calls";

export type BillingCycle = "monthly" | "yearly";

export type UsageRecord = UsageEvent;

export interface CheckoutSession {
  sessionId: string;
  url: string;
  customerId?: string;
  plan?: PlanTier;
  billingCycle?: BillingCycle;
  status?: "open" | "complete" | "expired";
}

export interface PortalSession {
  url: string;
  returnUrl?: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  periodStart: Date;
  periodEnd: Date;
  pdfUrl?: string;
  createdAt: Date;
}

/**
 * Default subscription plans
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    tier: "free",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "USD",
    features: [
      { name: "1 Brand", included: true },
      { name: "3 AI Platforms", included: true },
      { name: "100 Mentions/month", included: true, limit: "100" },
      { name: "2 Audits/month", included: true, limit: "2" },
      { name: "Basic Reports", included: true },
      { name: "Email Notifications", included: true },
      { name: "API Access", included: false },
      { name: "Custom Integrations", included: false },
      { name: "White Label", included: false },
    ],
    limits: {
      brands: 1,
      platforms: 3,
      users: 1,
      mentionsPerMonth: 100,
      auditsPerMonth: 2,
      aiTokensPerMonth: 10000,
      contentPiecesPerMonth: 5,
      customIntegrations: false,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false,
      dedicatedAccountManager: false,
    },
  },
  {
    id: "starter",
    name: "Starter",
    tier: "starter",
    priceMonthly: 49,
    priceYearly: 470, // ~20% discount
    currency: "USD",
    features: [
      { name: "3 Brands", included: true },
      { name: "5 AI Platforms", included: true },
      { name: "1,000 Mentions/month", included: true, limit: "1,000" },
      { name: "10 Audits/month", included: true, limit: "10" },
      { name: "Advanced Reports", included: true },
      { name: "Email + Slack Notifications", included: true },
      { name: "Basic API Access", included: true },
      { name: "Custom Integrations", included: false },
      { name: "White Label", included: false },
    ],
    limits: {
      brands: 3,
      platforms: 5,
      users: 3,
      mentionsPerMonth: 1000,
      auditsPerMonth: 10,
      aiTokensPerMonth: 50000,
      contentPiecesPerMonth: 20,
      customIntegrations: false,
      apiAccess: true,
      whiteLabel: false,
      prioritySupport: false,
      dedicatedAccountManager: false,
    },
  },
  {
    id: "pro",
    name: "Pro",
    tier: "pro",
    priceMonthly: 149,
    priceYearly: 1430, // ~20% discount
    currency: "USD",
    popular: true,
    features: [
      { name: "10 Brands", included: true },
      { name: "All 7+ AI Platforms", included: true },
      { name: "10,000 Mentions/month", included: true, limit: "10,000" },
      { name: "50 Audits/month", included: true, limit: "50" },
      { name: "Full Analytics Suite", included: true },
      { name: "All Notification Channels", included: true },
      { name: "Full API Access", included: true },
      { name: "Custom Integrations", included: true },
      { name: "Priority Support", included: true },
      { name: "White Label", included: false },
    ],
    limits: {
      brands: 10,
      platforms: 7,
      users: 10,
      mentionsPerMonth: 10000,
      auditsPerMonth: 50,
      aiTokensPerMonth: 200000,
      contentPiecesPerMonth: 100,
      customIntegrations: true,
      apiAccess: true,
      whiteLabel: false,
      prioritySupport: true,
      dedicatedAccountManager: false,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tier: "enterprise",
    priceMonthly: 499,
    priceYearly: 4790, // ~20% discount
    currency: "USD",
    enterpriseCustom: true,
    features: [
      { name: "Unlimited Brands", included: true },
      { name: "All AI Platforms + Custom", included: true },
      { name: "Unlimited Mentions", included: true },
      { name: "Unlimited Audits", included: true },
      { name: "Custom Analytics", included: true },
      { name: "All Channels + Custom", included: true },
      { name: "Full API + Webhooks", included: true },
      { name: "Custom Integrations", included: true },
      { name: "White Label Ready", included: true },
      { name: "Dedicated Account Manager", included: true },
      { name: "SLA Guarantee", included: true },
    ],
    limits: {
      brands: -1, // Unlimited
      platforms: -1, // Unlimited
      users: -1, // Unlimited
      mentionsPerMonth: -1,
      auditsPerMonth: -1,
      aiTokensPerMonth: -1,
      contentPiecesPerMonth: -1,
      customIntegrations: true,
      apiAccess: true,
      whiteLabel: true,
      prioritySupport: true,
      dedicatedAccountManager: true,
    },
  },
];

/**
 * Stripe Billing Manager
 */
export class StripeBillingManager {
  private subscriptions: Map<string, Subscription> = new Map();
  private usageEvents: Map<string, UsageEvent[]> = new Map();
  private invoices: Map<string, Invoice[]> = new Map();

  constructor() {}

  /**
   * Create Stripe customer for organization
   */
  async createCustomer(
    organizationId: string,
    data: {
      email: string;
      name: string;
      metadata?: Record<string, string>;
    }
  ): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        metadata: {
          organizationId,
          ...data.metadata,
        },
      });

      return customer.id;
    } catch (error) {
      // Return mock customer ID for development
      return `cus_${createId()}`;
    }
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(
    organizationId: string,
    options: {
      customerId: string;
      plan: PlanTier;
      billingCycle: "monthly" | "yearly";
      successUrl: string;
      cancelUrl: string;
      trialDays?: number;
    }
  ): Promise<{ sessionId: string; url: string }> {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === options.plan);
    if (!plan) {
      throw new Error(`Plan not found: ${options.plan}`);
    }

    const priceId =
      options.billingCycle === "yearly"
        ? plan.stripePriceIdYearly
        : plan.stripePriceIdMonthly;

    try {
      const session = await stripe.checkout.sessions.create({
        customer: options.customerId,
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        subscription_data: options.trialDays
          ? { trial_period_days: options.trialDays }
          : undefined,
        metadata: {
          organizationId,
          plan: options.plan,
          billingCycle: options.billingCycle,
        },
      });

      return {
        sessionId: session.id,
        url: session.url || options.successUrl,
      };
    } catch (error) {
      // Return mock session for development
      const sessionId = `cs_${createId()}`;
      return {
        sessionId,
        url: `${options.successUrl}?session_id=${sessionId}`,
      };
    }
  }

  /**
   * Create subscription (after checkout or direct)
   */
  createSubscription(
    organizationId: string,
    data: {
      stripeCustomerId: string;
      stripeSubscriptionId?: string;
      plan: PlanTier;
      billingCycle: "monthly" | "yearly";
      status?: SubscriptionStatus;
    }
  ): Subscription {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (data.billingCycle === "yearly" ? 12 : 1));

    const subscription: Subscription = {
      id: createId(),
      organizationId,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      plan: data.plan,
      status: data.status || "active",
      billingCycle: data.billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      usage: {
        mentionsThisMonth: 0,
        auditsThisMonth: 0,
        aiTokensThisMonth: 0,
        contentPiecesThisMonth: 0,
        periodStart: now,
        periodEnd: periodEnd,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.subscriptions.set(subscription.id, subscription);
    this.usageEvents.set(subscription.id, []);

    return subscription;
  }

  /**
   * Get subscription for organization
   */
  getSubscription(organizationId: string): Subscription | undefined {
    return Array.from(this.subscriptions.values()).find(
      (s) => s.organizationId === organizationId
    );
  }

  /**
   * Get subscription by ID
   */
  getSubscriptionById(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Update subscription
   */
  updateSubscription(
    subscriptionId: string,
    updates: Partial<Omit<Subscription, "id" | "organizationId" | "createdAt">>
  ): Subscription | undefined {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return undefined;

    Object.assign(subscription, updates, { updatedAt: new Date() });
    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return undefined;

    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: !immediately,
        });

        if (immediately) {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        }
      } catch (error) {
        // Continue with local update
      }
    }

    subscription.cancelAtPeriodEnd = !immediately;
    if (immediately) {
      subscription.status = "canceled";
    }
    subscription.updatedAt = new Date();

    return subscription;
  }

  /**
   * Upgrade/downgrade subscription
   */
  async changePlan(
    subscriptionId: string,
    newPlan: PlanTier,
    billingCycle?: "monthly" | "yearly"
  ): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return undefined;

    const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === newPlan);
    if (!plan) {
      throw new Error(`Plan not found: ${newPlan}`);
    }

    const cycle = billingCycle || subscription.billingCycle;
    const priceId = cycle === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

    if (subscription.stripeSubscriptionId && priceId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );

        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: priceId,
            },
          ],
          proration_behavior: "create_prorations",
        });
      } catch (error) {
        // Continue with local update
      }
    }

    subscription.plan = newPlan;
    subscription.billingCycle = cycle;
    subscription.updatedAt = new Date();

    return subscription;
  }

  /**
   * Record usage event
   */
  recordUsage(
    subscriptionId: string,
    type: UsageType,
    quantity: number,
    metadata?: Record<string, unknown>
  ): UsageEvent {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const event: UsageEvent = {
      id: createId(),
      subscriptionId,
      type,
      quantity,
      metadata,
      timestamp: new Date(),
    };

    // Update usage metrics
    switch (type) {
      case "mentions":
        subscription.usage.mentionsThisMonth += quantity;
        break;
      case "audits":
        subscription.usage.auditsThisMonth += quantity;
        break;
      case "ai_tokens":
        subscription.usage.aiTokensThisMonth += quantity;
        break;
      case "content_pieces":
        subscription.usage.contentPiecesThisMonth += quantity;
        break;
    }

    // Store event
    const events = this.usageEvents.get(subscriptionId) || [];
    events.push(event);
    this.usageEvents.set(subscriptionId, events);

    return event;
  }

  /**
   * Get usage for subscription
   */
  getUsage(subscriptionId: string): UsageMetrics | undefined {
    return this.subscriptions.get(subscriptionId)?.usage;
  }

  /**
   * Get usage events
   */
  getUsageEvents(
    subscriptionId: string,
    type?: UsageType,
    limit: number = 100
  ): UsageEvent[] {
    let events = this.usageEvents.get(subscriptionId) || [];

    if (type) {
      events = events.filter((e) => e.type === type);
    }

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Check if usage limit reached
   */
  checkUsageLimit(
    subscriptionId: string,
    type: UsageType,
    additionalQuantity: number = 1
  ): { allowed: boolean; current: number; limit: number; remaining: number } {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return { allowed: false, current: 0, limit: 0, remaining: 0 };
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === subscription.plan);
    if (!plan) {
      return { allowed: false, current: 0, limit: 0, remaining: 0 };
    }

    let current: number;
    let limit: number;

    switch (type) {
      case "mentions":
        current = subscription.usage.mentionsThisMonth;
        limit = plan.limits.mentionsPerMonth;
        break;
      case "audits":
        current = subscription.usage.auditsThisMonth;
        limit = plan.limits.auditsPerMonth;
        break;
      case "ai_tokens":
        current = subscription.usage.aiTokensThisMonth;
        limit = plan.limits.aiTokensPerMonth;
        break;
      case "content_pieces":
        current = subscription.usage.contentPiecesThisMonth;
        limit = plan.limits.contentPiecesPerMonth;
        break;
      default:
        return { allowed: true, current: 0, limit: -1, remaining: -1 };
    }

    // Unlimited (-1)
    if (limit === -1) {
      return { allowed: true, current, limit: -1, remaining: -1 };
    }

    const remaining = limit - current;
    const allowed = current + additionalQuantity <= limit;

    return { allowed, current, limit, remaining };
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return { url: session.url };
    } catch (error) {
      // Return mock portal URL for development
      return { url: `${returnUrl}?portal=mock` };
    }
  }

  /**
   * Get invoices for subscription
   */
  async getInvoices(
    customerId: string,
    limit: number = 10
  ): Promise<Invoice[]> {
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: customerId,
        limit,
      });

      return stripeInvoices.data.map((inv) => {
        const subscriptionId = (inv as unknown as { subscription?: string }).subscription ?? "";
        return {
          id: createId(),
          subscriptionId,
          stripeInvoiceId: inv.id,
          amount: inv.amount_due / 100,
          currency: inv.currency.toUpperCase(),
          status: inv.status as Invoice["status"],
          periodStart: new Date(inv.period_start * 1000),
          periodEnd: new Date(inv.period_end * 1000),
          pdfUrl: inv.invoice_pdf || undefined,
          createdAt: new Date(inv.created * 1000),
        };
      });
    } catch (error) {
      // Return mock invoices for development
      return [];
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(
    event: Stripe.Event
  ): Promise<{ handled: boolean; action?: string }> {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        const plan = session.metadata?.plan as PlanTier;
        const billingCycle = session.metadata?.billingCycle as "monthly" | "yearly";

        if (organizationId && plan) {
          this.createSubscription(organizationId, {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            plan,
            billingCycle: billingCycle || "monthly",
            status: "active",
          });
        }
        return { handled: true, action: "subscription_created" };
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subData = subscription as unknown as {
          current_period_end?: number;
          cancel_at_period_end?: boolean;
          status?: string;
        };
        const existing = Array.from(this.subscriptions.values()).find(
          (s) => s.stripeSubscriptionId === subscription.id
        );

        if (existing) {
          this.updateSubscription(existing.id, {
            status: (subData.status ?? "active") as SubscriptionStatus,
            cancelAtPeriodEnd: subData.cancel_at_period_end ?? false,
            currentPeriodEnd: subData.current_period_end
              ? new Date(subData.current_period_end * 1000)
              : new Date(),
          });
        }
        return { handled: true, action: "subscription_updated" };
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const existing = Array.from(this.subscriptions.values()).find(
          (s) => s.stripeSubscriptionId === subscription.id
        );

        if (existing) {
          this.updateSubscription(existing.id, {
            status: "canceled",
          });
        }
        return { handled: true, action: "subscription_canceled" };
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubId = (invoice as unknown as { subscription?: string }).subscription;
        // Reset usage on successful payment
        const subscription = Array.from(this.subscriptions.values()).find(
          (s) => s.stripeSubscriptionId === invoiceSubId
        );

        if (subscription) {
          subscription.usage = {
            mentionsThisMonth: 0,
            auditsThisMonth: 0,
            aiTokensThisMonth: 0,
            contentPiecesThisMonth: 0,
            periodStart: new Date(),
            periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          };
        }
        return { handled: true, action: "invoice_paid" };
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const failedInvoiceSubId = (invoice as unknown as { subscription?: string }).subscription;
        const subscription = Array.from(this.subscriptions.values()).find(
          (s) => s.stripeSubscriptionId === failedInvoiceSubId
        );

        if (subscription) {
          this.updateSubscription(subscription.id, {
            status: "past_due",
          });
        }
        return { handled: true, action: "payment_failed" };
      }

      default:
        return { handled: false };
    }
  }

  /**
   * Get all plans
   */
  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  /**
   * Get plan by tier
   */
  getPlan(tier: PlanTier): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find((p) => p.tier === tier);
  }

  /**
   * Check feature access
   */
  hasFeatureAccess(
    subscriptionId: string,
    feature: keyof PlanLimits
  ): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === subscription.plan);
    if (!plan) return false;

    const value = plan.limits[feature];
    return typeof value === "boolean" ? value : value !== 0;
  }
}

// Singleton instance
export const stripeBillingManager = new StripeBillingManager();

/**
 * Format subscription for API response
 */
export function formatSubscriptionResponse(subscription: Subscription) {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === subscription.plan);

  return {
    id: subscription.id,
    plan: subscription.plan,
    planName: plan?.name,
    status: subscription.status,
    billingCycle: subscription.billingCycle,
    currentPeriodStart: subscription.currentPeriodStart.toISOString(),
    currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    usage: {
      mentions: {
        current: subscription.usage.mentionsThisMonth,
        limit: plan?.limits.mentionsPerMonth || 0,
      },
      audits: {
        current: subscription.usage.auditsThisMonth,
        limit: plan?.limits.auditsPerMonth || 0,
      },
      aiTokens: {
        current: subscription.usage.aiTokensThisMonth,
        limit: plan?.limits.aiTokensPerMonth || 0,
      },
      contentPieces: {
        current: subscription.usage.contentPiecesThisMonth,
        limit: plan?.limits.contentPiecesPerMonth || 0,
      },
    },
    createdAt: subscription.createdAt.toISOString(),
  };
}

/**
 * Format plan for API response
 */
export function formatPlanResponse(plan: SubscriptionPlan) {
  return {
    id: plan.id,
    name: plan.name,
    tier: plan.tier,
    priceMonthly: plan.priceMonthly,
    priceYearly: plan.priceYearly,
    currency: plan.currency,
    features: plan.features,
    limits: plan.limits,
    popular: plan.popular,
    enterpriseCustom: plan.enterpriseCustom,
  };
}
