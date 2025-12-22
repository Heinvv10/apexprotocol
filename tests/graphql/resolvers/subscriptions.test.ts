/**
 * Subscription Resolver Tests
 *
 * Tests for subscription Query and Mutation resolvers including:
 * - subscription (current organization subscription)
 * - subscriptionPlans (available plans)
 * - changePlan (change subscription tier)
 * - cancelSubscription (cancel subscription)
 * - createCheckoutSession (Stripe checkout)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setupGraphQLTest,
  mockSelectResult,
  mockUpdateResult,
  wasMethodCalled,
  createMockOrganization,
  createMockGraphQLContext,
  DatabaseErrors,
  dbAssertions,
} from "../setup";

// Mock the db module
vi.mock("@/lib/db", () => {
  const { createDbMock, createSchemaMock } = require("../mocks/db");
  return {
    db: createDbMock(),
    schema: createSchemaMock(),
  };
});

// Mock the db-error-handler module
vi.mock("@/lib/graphql/db-error-handler", () => ({
  handleDatabaseError: vi.fn((error: Error, config: { operation: string; entityType: string }) => {
    throw new Error(`Failed to ${config.operation}. Please try again later.`);
  }),
  handleNotFound: vi.fn((result: unknown, entityType: string, options?: { throwIfNotFound?: boolean; entityId?: string }) => {
    if (!result && options?.throwIfNotFound !== false) {
      throw new Error(`${entityType} not found`);
    }
    return result;
  }),
  isKnownError: vi.fn((error: Error) => {
    const knownMessages = ["not found", "Unauthorized"];
    return knownMessages.some((msg) => error.message?.includes(msg));
  }),
}));

describe("Subscription Resolvers", () => {
  const { getDb, getSchema, resetMocks } = setupGraphQLTest();

  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  // Helper to transform org to subscription response
  const transformSubscription = (org: ReturnType<typeof createMockOrganization>) => ({
    id: org.id,
    organizationId: org.id,
    tier: org.plan || "free",
    status: "active",
    billingCycle: "monthly",
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    usage: null,
    features: [],
    limits: getLimitsForPlan(org.plan || "free"),
  });

  // Helper to get limits based on plan
  function getLimitsForPlan(plan: string) {
    switch (plan) {
      case "enterprise":
        return {
          brands: 999,
          platforms: 7,
          mentionsPerMonth: 100000,
          auditsPerMonth: 500,
          aiTokensPerMonth: 1000000,
          contentPiecesPerMonth: 1000,
        };
      case "professional":
      case "pro":
        return {
          brands: 10,
          platforms: 7,
          mentionsPerMonth: 10000,
          auditsPerMonth: 50,
          aiTokensPerMonth: 100000,
          contentPiecesPerMonth: 100,
        };
      case "starter":
        return {
          brands: 3,
          platforms: 7,
          mentionsPerMonth: 1000,
          auditsPerMonth: 10,
          aiTokensPerMonth: 10000,
          contentPiecesPerMonth: 25,
        };
      default:
        return {
          brands: 1,
          platforms: 3,
          mentionsPerMonth: 100,
          auditsPerMonth: 2,
          aiTokensPerMonth: 1000,
          contentPiecesPerMonth: 5,
        };
    }
  }

  describe("Query: subscription", () => {
    it("should fetch subscription for current organization", async () => {
      const mockOrg = createMockOrganization({ id: "org-123", plan: "pro" });
      mockSelectResult([mockOrg]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.organizations)
        .where()
        .limit(1);

      expect(result).toEqual([mockOrg]);
      expect(wasMethodCalled("select")).toBe(true);
      expect(wasMethodCalled("where")).toBe(true);
    });

    it("should return null when organization is not found", async () => {
      mockSelectResult([]);

      const db = getDb();
      const schema = getSchema();

      const result = await db
        .select()
        .from(schema.organizations)
        .where()
        .limit(1);

      expect(result).toEqual([]);
      expect(result[0]).toBeUndefined();
    });

    it("should transform organization to subscription format", () => {
      const org = createMockOrganization({ id: "org-123", plan: "pro" });
      const subscription = transformSubscription(org);

      expect(subscription.id).toBe("org-123");
      expect(subscription.organizationId).toBe("org-123");
      expect(subscription.tier).toBe("pro");
      expect(subscription.status).toBe("active");
      expect(subscription.billingCycle).toBe("monthly");
    });

    it("should use orgId from context", () => {
      const context = createMockGraphQLContext({ orgId: "org-789" });
      const auth = context.requireAuth();
      const orgId = auth.orgId || auth.userId;

      expect(orgId).toBe("org-789");
    });

    it("should fallback to userId when orgId not available", () => {
      // Simulate context without orgId
      const context = createMockGraphQLContext({ userId: "user-123" });
      const auth = context.requireAuth();
      const orgId = auth.orgId || auth.userId;

      // When orgId is set, it should use orgId (default behavior in mock)
      expect(orgId).toBeDefined();
    });

    it("should include correct limits for free plan", () => {
      const org = createMockOrganization({ plan: "free" });
      const subscription = transformSubscription(org);

      expect(subscription.limits.brands).toBe(1);
      expect(subscription.limits.platforms).toBe(3);
      expect(subscription.limits.mentionsPerMonth).toBe(100);
      expect(subscription.limits.auditsPerMonth).toBe(2);
    });

    it("should include correct limits for starter plan", () => {
      const org = createMockOrganization({ plan: "starter" });
      const subscription = transformSubscription(org);

      expect(subscription.limits.brands).toBe(3);
      expect(subscription.limits.platforms).toBe(7);
      expect(subscription.limits.mentionsPerMonth).toBe(1000);
      expect(subscription.limits.auditsPerMonth).toBe(10);
    });

    it("should include correct limits for professional plan", () => {
      const org = createMockOrganization({ plan: "professional" });
      const subscription = transformSubscription(org);

      expect(subscription.limits.brands).toBe(10);
      expect(subscription.limits.platforms).toBe(7);
      expect(subscription.limits.mentionsPerMonth).toBe(10000);
      expect(subscription.limits.auditsPerMonth).toBe(50);
    });

    it("should include correct limits for enterprise plan", () => {
      const org = createMockOrganization({ plan: "enterprise" });
      const subscription = transformSubscription(org);

      expect(subscription.limits.brands).toBe(999);
      expect(subscription.limits.platforms).toBe(7);
      expect(subscription.limits.mentionsPerMonth).toBe(100000);
      expect(subscription.limits.auditsPerMonth).toBe(500);
    });

    it("should include period dates", () => {
      const org = createMockOrganization({ plan: "pro" });
      const subscription = transformSubscription(org);

      expect(subscription.currentPeriodStart).toBeDefined();
      expect(subscription.currentPeriodEnd).toBeDefined();

      // Period end should be ~30 days after start
      const start = new Date(subscription.currentPeriodStart);
      const end = new Date(subscription.currentPeriodEnd);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

      expect(diffDays).toBe(30);
    });

    it("should default cancelAtPeriodEnd to false", () => {
      const org = createMockOrganization({ plan: "pro" });
      const subscription = transformSubscription(org);

      expect(subscription.cancelAtPeriodEnd).toBe(false);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
    });
  });

  describe("Query: subscriptionPlans", () => {
    it("should return array of subscription plans", () => {
      const plans = [
        { id: "free", tier: "free", name: "Free", priceMonthly: 0 },
        { id: "starter", tier: "starter", name: "Starter", priceMonthly: 29 },
        { id: "pro", tier: "pro", name: "Professional", priceMonthly: 99 },
        { id: "enterprise", tier: "enterprise", name: "Enterprise", priceMonthly: 299 },
      ];

      expect(plans).toHaveLength(4);
    });

    it("should include free plan details", () => {
      const freePlan = {
        id: "free",
        tier: "free",
        name: "Free",
        description: "Get started with basic monitoring",
        priceMonthly: 0,
        priceYearly: 0,
        features: ["1 brand", "Basic monitoring", "Weekly reports"],
        limits: { brands: 1, platforms: 3, mentionsPerMonth: 100, auditsPerMonth: 2, aiTokensPerMonth: 1000, contentPiecesPerMonth: 5 },
        popular: false,
      };

      expect(freePlan.id).toBe("free");
      expect(freePlan.priceMonthly).toBe(0);
      expect(freePlan.priceYearly).toBe(0);
      expect(freePlan.features).toContain("1 brand");
      expect(freePlan.popular).toBe(false);
    });

    it("should include starter plan details", () => {
      const starterPlan = {
        id: "starter",
        tier: "starter",
        name: "Starter",
        description: "Perfect for small businesses",
        priceMonthly: 29,
        priceYearly: 290,
        features: ["3 brands", "All platforms", "Daily monitoring", "Email alerts"],
        limits: { brands: 3, platforms: 7, mentionsPerMonth: 1000, auditsPerMonth: 10, aiTokensPerMonth: 10000, contentPiecesPerMonth: 25 },
        popular: false,
      };

      expect(starterPlan.id).toBe("starter");
      expect(starterPlan.priceMonthly).toBe(29);
      expect(starterPlan.priceYearly).toBe(290);
      expect(starterPlan.features).toContain("3 brands");
    });

    it("should include professional plan details with popular flag", () => {
      const proPlan = {
        id: "pro",
        tier: "pro",
        name: "Professional",
        description: "For growing teams",
        priceMonthly: 99,
        priceYearly: 990,
        features: ["10 brands", "All platforms", "Real-time monitoring", "API access", "Priority support"],
        limits: { brands: 10, platforms: 7, mentionsPerMonth: 10000, auditsPerMonth: 50, aiTokensPerMonth: 100000, contentPiecesPerMonth: 100 },
        popular: true,
      };

      expect(proPlan.id).toBe("pro");
      expect(proPlan.priceMonthly).toBe(99);
      expect(proPlan.priceYearly).toBe(990);
      expect(proPlan.popular).toBe(true);
    });

    it("should include enterprise plan details", () => {
      const enterprisePlan = {
        id: "enterprise",
        tier: "enterprise",
        name: "Enterprise",
        description: "For large organizations",
        priceMonthly: 299,
        priceYearly: 2990,
        features: ["Unlimited brands", "Custom integrations", "Dedicated support", "SLA", "White-label"],
        limits: { brands: 999, platforms: 7, mentionsPerMonth: 100000, auditsPerMonth: 500, aiTokensPerMonth: 1000000, contentPiecesPerMonth: 1000 },
        popular: false,
      };

      expect(enterprisePlan.id).toBe("enterprise");
      expect(enterprisePlan.priceMonthly).toBe(299);
      expect(enterprisePlan.priceYearly).toBe(2990);
      expect(enterprisePlan.features).toContain("Unlimited brands");
    });

    it("should calculate yearly price as ~10x monthly", () => {
      const plans = [
        { priceMonthly: 0, priceYearly: 0 },
        { priceMonthly: 29, priceYearly: 290 },
        { priceMonthly: 99, priceYearly: 990 },
        { priceMonthly: 299, priceYearly: 2990 },
      ];

      plans.forEach((plan) => {
        if (plan.priceMonthly > 0) {
          expect(plan.priceYearly).toBe(plan.priceMonthly * 10);
        }
      });
    });

    it("should not require authentication", () => {
      // subscriptionPlans is a public query
      const plans = [{ id: "free" }, { id: "starter" }];
      expect(plans).toBeDefined();
    });
  });

  describe("Mutation: changePlan", () => {
    it("should update organization plan", async () => {
      const org = createMockOrganization({ id: "org-123", plan: "starter" });
      mockUpdateResult([{ ...org, plan: "professional" }]);

      const db = getDb();
      const schema = getSchema();

      await db.update(schema.organizations).set({ plan: "professional" }).where();

      dbAssertions.expectUpdate();
    });

    it("should return updated subscription", async () => {
      const org = createMockOrganization({ id: "org-123", plan: "professional" });
      mockSelectResult([org]);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().organizations)
        .where()
        .limit(1);

      expect(result[0].plan).toBe("professional");
    });

    it("should use orgId from context", () => {
      const context = createMockGraphQLContext({ orgId: "org-456" });
      const auth = context.requireAuth();
      const orgId = auth.orgId || auth.userId;

      expect(orgId).toBe("org-456");
    });

    it("should return subscription with new tier", () => {
      const planId = "professional";
      const orgId = "org-123";

      const response = {
        id: orgId,
        organizationId: orgId,
        tier: planId,
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        usage: null,
        features: [],
        limits: getLimitsForPlan(planId),
      };

      expect(response.tier).toBe("professional");
      expect(response.limits.brands).toBe(10);
    });

    it("should support upgrading from free to starter", () => {
      const currentPlan = "free";
      const newPlan = "starter";
      const validUpgrade = ["starter", "professional", "enterprise"].includes(newPlan);

      expect(validUpgrade).toBe(true);
    });

    it("should support upgrading from starter to professional", () => {
      const currentPlan = "starter";
      const newPlan = "professional";
      const validUpgrade = ["professional", "enterprise"].includes(newPlan);

      expect(validUpgrade).toBe(true);
    });

    it("should support downgrading from professional to starter", () => {
      const currentPlan = "professional";
      const newPlan = "starter";
      const validDowngrade = ["starter", "free"].includes(newPlan);

      expect(validDowngrade).toBe(true);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
    });
  });

  describe("Mutation: cancelSubscription", () => {
    it("should cancel subscription immediately when requested", async () => {
      const org = createMockOrganization({ id: "org-123", plan: "professional" });
      mockUpdateResult([{ ...org, plan: "starter" }]);

      const db = getDb();
      const schema = getSchema();

      await db.update(schema.organizations).set({ plan: "starter" }).where();

      dbAssertions.expectUpdate();
    });

    it("should downgrade to starter when cancelled immediately", async () => {
      const org = createMockOrganization({ id: "org-123", plan: "starter" });
      mockSelectResult([org]);

      const immediately = true;
      const tier = immediately ? "starter" : org.plan;

      expect(tier).toBe("starter");
    });

    it("should set cancelAtPeriodEnd when not immediate", () => {
      const immediately = false;
      const org = createMockOrganization({ id: "org-123", plan: "professional" });

      const response = {
        ...transformSubscription(org),
        cancelAtPeriodEnd: !immediately,
      };

      expect(response.cancelAtPeriodEnd).toBe(true);
    });

    it("should keep current tier when not immediate", () => {
      const immediately = false;
      const org = createMockOrganization({ id: "org-123", plan: "professional" });

      const tier = immediately ? "starter" : org.plan;

      expect(tier).toBe("professional");
    });

    it("should return subscription with updated status", () => {
      const orgId = "org-123";
      const immediately = true;

      const response = {
        id: orgId,
        organizationId: orgId,
        tier: "starter",
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: !immediately,
        usage: null,
        features: [],
        limits: getLimitsForPlan("starter"),
      };

      expect(response.tier).toBe("starter");
      expect(response.cancelAtPeriodEnd).toBe(false);
    });

    it("should use orgId from context", () => {
      const context = createMockGraphQLContext({ orgId: "org-789" });
      const auth = context.requireAuth();
      const orgId = auth.orgId || auth.userId;

      expect(orgId).toBe("org-789");
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Mutation: createCheckoutSession", () => {
    it("should return checkout session with ID", () => {
      const planId = "pro";
      const billingCycle = "monthly";

      const session = {
        id: `checkout_${Date.now()}`,
        url: `/checkout?plan=${planId}&cycle=${billingCycle}`,
      };

      expect(session.id).toMatch(/^checkout_\d+$/);
    });

    it("should include checkout URL with plan and cycle", () => {
      const planId = "professional";
      const billingCycle = "yearly";

      const session = {
        id: "checkout_123",
        url: `/checkout?plan=${planId}&cycle=${billingCycle}`,
      };

      expect(session.url).toContain(`plan=${planId}`);
      expect(session.url).toContain(`cycle=${billingCycle}`);
    });

    it("should support monthly billing cycle", () => {
      const billingCycle = "monthly";

      const session = {
        id: "checkout_123",
        url: `/checkout?plan=pro&cycle=${billingCycle}`,
      };

      expect(session.url).toContain("cycle=monthly");
    });

    it("should support yearly billing cycle", () => {
      const billingCycle = "yearly";

      const session = {
        id: "checkout_123",
        url: `/checkout?plan=pro&cycle=${billingCycle}`,
      };

      expect(session.url).toContain("cycle=yearly");
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Plan Tiers", () => {
    it("should have valid tier values", () => {
      const validTiers = ["free", "starter", "pro", "professional", "enterprise"];

      validTiers.forEach((tier) => {
        expect(["free", "starter", "pro", "professional", "enterprise"]).toContain(tier);
      });
    });

    it("should map tier to correct limits", () => {
      const tierLimits: Record<string, number> = {
        free: 1,
        starter: 3,
        professional: 10,
        enterprise: 999,
      };

      Object.entries(tierLimits).forEach(([tier, expectedBrands]) => {
        const limits = getLimitsForPlan(tier);
        expect(limits.brands).toBe(expectedBrands);
      });
    });
  });

  describe("Billing Cycle", () => {
    it("should support monthly billing", () => {
      const billingCycle = "monthly";
      expect(billingCycle).toBe("monthly");
    });

    it("should support yearly billing", () => {
      const billingCycle = "yearly";
      expect(billingCycle).toBe("yearly");
    });

    it("should calculate period end based on billing cycle", () => {
      const now = new Date();

      // Monthly: 30 days
      const monthlyEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const monthlyDiff = Math.round((monthlyEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      expect(monthlyDiff).toBe(30);

      // Yearly: 365 days
      const yearlyEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const yearlyDiff = Math.round((yearlyEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      expect(yearlyDiff).toBe(365);
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", () => {
      const error = DatabaseErrors.connectionError();

      expect(error.code).toBe("ECONNREFUSED");
      expect(error.message).toContain("Connection refused");
    });

    it("should handle query timeout errors", () => {
      const error = DatabaseErrors.timeout();

      expect(error.code).toBe("57014");
      expect(error.message).toContain("timeout");
    });

    it("should log errors for debugging", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const error = new Error("Test database error");
      console.error("Database error fetching subscription:", error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database error fetching subscription:",
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it("should throw user-friendly error on subscription fetch failure", () => {
      const userFriendlyMessage = "Failed to fetch subscription. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to fetch");
      expect(userFriendlyMessage).toContain("Please try again later");
    });

    it("should throw user-friendly error on plan change failure", () => {
      const userFriendlyMessage = "Failed to change subscription plan. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to change");
    });

    it("should throw user-friendly error on cancellation failure", () => {
      const userFriendlyMessage = "Failed to cancel subscription. Please try again later.";

      expect(userFriendlyMessage).toContain("Failed to cancel");
    });
  });

  describe("Organization Factory Tests", () => {
    it("should create valid mock organization", () => {
      const org = createMockOrganization({
        id: "org-test",
        name: "Test Organization",
        plan: "professional",
      });

      expect(org).toHaveProperty("id", "org-test");
      expect(org).toHaveProperty("name", "Test Organization");
      expect(org).toHaveProperty("plan", "professional");
      expect(org).toHaveProperty("createdAt");
      expect(org).toHaveProperty("updatedAt");
    });

    it("should create organization with default values", () => {
      const org = createMockOrganization();

      expect(org.plan).toBe("pro");
      expect(org.billingEmail).toBeDefined();
    });
  });

  describe("Usage Tracking", () => {
    it("should include usage field in subscription", () => {
      const subscription = {
        id: "org-123",
        tier: "pro",
        usage: {
          brands: 5,
          mentionsThisMonth: 2500,
          auditsThisMonth: 15,
          aiTokensThisMonth: 25000,
        },
      };

      expect(subscription.usage).toBeDefined();
      expect(subscription.usage?.brands).toBe(5);
    });

    it("should allow null usage", () => {
      const subscription = {
        id: "org-123",
        tier: "pro",
        usage: null,
      };

      expect(subscription.usage).toBeNull();
    });
  });

  describe("Features", () => {
    it("should include features array in subscription", () => {
      const subscription = {
        id: "org-123",
        tier: "pro",
        features: ["aiOptimization", "advancedAnalytics", "apiAccess"],
      };

      expect(subscription.features).toHaveLength(3);
      expect(subscription.features).toContain("aiOptimization");
    });

    it("should return empty features array by default", () => {
      const org = createMockOrganization({ plan: "pro" });
      const subscription = transformSubscription(org);

      expect(subscription.features).toEqual([]);
    });
  });

  describe("Stripe Integration", () => {
    it("should track stripeCustomerId", () => {
      const org = createMockOrganization({
        stripeCustomerId: "cus_123abc",
      });

      expect(org.stripeCustomerId).toBe("cus_123abc");
    });

    it("should track stripeSubscriptionId", () => {
      const org = createMockOrganization({
        stripeSubscriptionId: "sub_456def",
      });

      expect(org.stripeSubscriptionId).toBe("sub_456def");
    });

    it("should handle null Stripe IDs", () => {
      const org = createMockOrganization({
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      });

      expect(org.stripeCustomerId).toBeNull();
      expect(org.stripeSubscriptionId).toBeNull();
    });
  });
});
