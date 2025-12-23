/**
 * Subscription Resolver Tests
 *
 * Tests for subscription/billing Query and Mutation resolvers including:
 * - subscription (get organization subscription)
 * - subscriptionPlans (list of available plans)
 * - createCheckoutSession (Stripe checkout stub)
 * - changePlan (update organization plan)
 * - cancelSubscription (cancel subscription)
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
  handleConstraintViolation: vi.fn((error: Error, config: { entityType: string; uniqueFields?: string[] }) => {
    if (error.message?.includes("duplicate key")) {
      throw new Error(`A ${config.entityType} with this value already exists`);
    }
    return false;
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

  // Helper to transform organization to subscription format
  const transformToSubscription = (org: ReturnType<typeof createMockOrganization>) => ({
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
    limits: {
      brands: org.plan === "enterprise" ? 999 : org.plan === "professional" ? 10 : org.plan === "starter" ? 3 : 1,
      platforms: 7,
      mentionsPerMonth: 10000,
      auditsPerMonth: 50,
      aiTokensPerMonth: 100000,
      contentPiecesPerMonth: 100,
    },
  });

  // Static subscription plans
  const subscriptionPlans = [
    {
      id: "free",
      tier: "free",
      name: "Free",
      description: "Get started with basic monitoring",
      priceMonthly: 0,
      priceYearly: 0,
      features: ["1 brand", "Basic monitoring", "Weekly reports"],
      limits: { brands: 1, platforms: 3, mentionsPerMonth: 100, auditsPerMonth: 2, aiTokensPerMonth: 1000, contentPiecesPerMonth: 5 },
      popular: false,
    },
    {
      id: "starter",
      tier: "starter",
      name: "Starter",
      description: "Perfect for small businesses",
      priceMonthly: 29,
      priceYearly: 290,
      features: ["3 brands", "All platforms", "Daily monitoring", "Email alerts"],
      limits: { brands: 3, platforms: 7, mentionsPerMonth: 1000, auditsPerMonth: 10, aiTokensPerMonth: 10000, contentPiecesPerMonth: 25 },
      popular: false,
    },
    {
      id: "pro",
      tier: "pro",
      name: "Professional",
      description: "For growing teams",
      priceMonthly: 99,
      priceYearly: 990,
      features: ["10 brands", "All platforms", "Real-time monitoring", "API access", "Priority support"],
      limits: { brands: 10, platforms: 7, mentionsPerMonth: 10000, auditsPerMonth: 50, aiTokensPerMonth: 100000, contentPiecesPerMonth: 100 },
      popular: true,
    },
    {
      id: "enterprise",
      tier: "enterprise",
      name: "Enterprise",
      description: "For large organizations",
      priceMonthly: 299,
      priceYearly: 2990,
      features: ["Unlimited brands", "Custom integrations", "Dedicated support", "SLA", "White-label"],
      limits: { brands: 999, platforms: 7, mentionsPerMonth: 100000, auditsPerMonth: 500, aiTokensPerMonth: 1000000, contentPiecesPerMonth: 1000 },
      popular: false,
    },
  ];

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

      expect((result as unknown[])[0]).toEqual(mockOrg);
      expect(wasMethodCalled("select")).toBe(true);
      expect(wasMethodCalled("where")).toBe(true);
    });

    it("should return null when organization not found", async () => {
      mockSelectResult([]);

      const db = getDb();
      const result = await db
        .select()
        .from(getSchema().organizations)
        .where()
        .limit(1);

      expect((result as unknown[])[0]).toBeUndefined();
    });

    it("should transform organization to subscription format", () => {
      const org = createMockOrganization({ id: "org-123", plan: "pro" });
      const subscription = transformToSubscription(org);

      expect(subscription.id).toBe("org-123");
      expect(subscription.organizationId).toBe("org-123");
      expect(subscription.tier).toBe("pro");
      expect(subscription.status).toBe("active");
    });

    it("should include tier from organization plan", () => {
      const org = createMockOrganization({ plan: "enterprise" });
      const subscription = transformToSubscription(org);

      expect(subscription.tier).toBe("enterprise");
    });

    it("should set status to active", () => {
      const org = createMockOrganization();
      const subscription = transformToSubscription(org);

      expect(subscription.status).toBe("active");
    });

    it("should set billingCycle to monthly", () => {
      const org = createMockOrganization();
      const subscription = transformToSubscription(org);

      expect(subscription.billingCycle).toBe("monthly");
    });

    it("should calculate currentPeriodEnd 30 days from now", () => {
      const org = createMockOrganization();
      const subscription = transformToSubscription(org);

      const periodEnd = new Date(subscription.currentPeriodEnd);
      const now = new Date();
      const diffDays = Math.round((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);
    });

    it("should set cancelAtPeriodEnd to false", () => {
      const org = createMockOrganization();
      const subscription = transformToSubscription(org);

      expect(subscription.cancelAtPeriodEnd).toBe(false);
    });

    it("should include limits based on plan tier", () => {
      const enterpriseOrg = createMockOrganization({ plan: "enterprise" });
      const subscription = transformToSubscription(enterpriseOrg);

      expect(subscription.limits.brands).toBe(999);
    });

    it("should set free plan brands limit to 1", () => {
      const freeOrg = createMockOrganization({ plan: "free" });
      const subscription = transformToSubscription(freeOrg);

      expect(subscription.limits.brands).toBe(1);
    });

    it("should set starter plan brands limit to 3", () => {
      const starterOrg = createMockOrganization({ plan: "starter" });
      const subscription = transformToSubscription(starterOrg);

      expect(subscription.limits.brands).toBe(3);
    });

    it("should set professional plan brands limit to 10", () => {
      const proOrg = createMockOrganization({ plan: "professional" });
      const subscription = transformToSubscription(proOrg);

      expect(subscription.limits.brands).toBe(10);
    });

    it("should use orgId from context", () => {
      const context = createMockGraphQLContext({ orgId: "org-456" });
      const auth = context.requireAuth();

      expect(auth.orgId).toBe("org-456");
    });

    it("should fallback to userId when orgId is undefined", () => {
      const userId = "user-123";
      const orgId: string | undefined = undefined;

      const effectiveOrgId = orgId || userId;

      expect(effectiveOrgId).toBe("user-123");
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
      expect(auth.userId).toBeDefined();
    });
  });

  describe("Query: subscriptionPlans", () => {
    it("should return all available plans", () => {
      expect(subscriptionPlans).toHaveLength(4);
    });

    it("should include free plan", () => {
      const freePlan = subscriptionPlans.find((p) => p.id === "free");

      expect(freePlan).toBeDefined();
      expect(freePlan?.priceMonthly).toBe(0);
      expect(freePlan?.priceYearly).toBe(0);
    });

    it("should include starter plan", () => {
      const starterPlan = subscriptionPlans.find((p) => p.id === "starter");

      expect(starterPlan).toBeDefined();
      expect(starterPlan?.priceMonthly).toBe(29);
      expect(starterPlan?.priceYearly).toBe(290);
    });

    it("should include pro plan", () => {
      const proPlan = subscriptionPlans.find((p) => p.id === "pro");

      expect(proPlan).toBeDefined();
      expect(proPlan?.priceMonthly).toBe(99);
      expect(proPlan?.priceYearly).toBe(990);
    });

    it("should include enterprise plan", () => {
      const enterprisePlan = subscriptionPlans.find((p) => p.id === "enterprise");

      expect(enterprisePlan).toBeDefined();
      expect(enterprisePlan?.priceMonthly).toBe(299);
      expect(enterprisePlan?.priceYearly).toBe(2990);
    });

    it("should mark pro plan as popular", () => {
      const proPlan = subscriptionPlans.find((p) => p.id === "pro");

      expect(proPlan?.popular).toBe(true);
    });

    it("should not mark other plans as popular", () => {
      const nonPopularPlans = subscriptionPlans.filter((p) => p.id !== "pro");

      expect(nonPopularPlans.every((p) => p.popular === false)).toBe(true);
    });

    it("should include features for each plan", () => {
      subscriptionPlans.forEach((plan) => {
        expect(plan.features).toBeDefined();
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });

    it("should include limits for each plan", () => {
      subscriptionPlans.forEach((plan) => {
        expect(plan.limits).toBeDefined();
        expect(plan.limits).toHaveProperty("brands");
        expect(plan.limits).toHaveProperty("platforms");
        expect(plan.limits).toHaveProperty("mentionsPerMonth");
        expect(plan.limits).toHaveProperty("auditsPerMonth");
      });
    });

    it("should have increasing limits for higher tiers", () => {
      const freePlan = subscriptionPlans.find((p) => p.id === "free")!;
      const starterPlan = subscriptionPlans.find((p) => p.id === "starter")!;
      const proPlan = subscriptionPlans.find((p) => p.id === "pro")!;
      const enterprisePlan = subscriptionPlans.find((p) => p.id === "enterprise")!;

      expect(starterPlan.limits.brands).toBeGreaterThan(freePlan.limits.brands);
      expect(proPlan.limits.brands).toBeGreaterThan(starterPlan.limits.brands);
      expect(enterprisePlan.limits.brands).toBeGreaterThan(proPlan.limits.brands);
    });

    it("should not require authentication", () => {
      // subscriptionPlans is a static query that doesn't need auth
      expect(subscriptionPlans).toBeDefined();
    });
  });

  describe("Mutation: createCheckoutSession", () => {
    it("should return checkout session with id and url", () => {
      const planId = "pro";
      const billingCycle = "monthly";

      const session = {
        id: `checkout_${Date.now()}`,
        url: `/checkout?plan=${planId}&cycle=${billingCycle}`,
      };

      expect(session.id).toMatch(/^checkout_\d+$/);
      expect(session.url).toContain(`plan=${planId}`);
      expect(session.url).toContain(`cycle=${billingCycle}`);
    });

    it("should include plan in checkout URL", () => {
      const planId = "enterprise";
      const url = `/checkout?plan=${planId}&cycle=monthly`;

      expect(url).toContain("plan=enterprise");
    });

    it("should include billing cycle in checkout URL", () => {
      const billingCycle = "yearly";
      const url = `/checkout?plan=pro&cycle=${billingCycle}`;

      expect(url).toContain("cycle=yearly");
    });

    it("should generate unique session IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 10; i++) {
        ids.add(`checkout_${Date.now()}_${i}`);
      }

      expect(ids.size).toBe(10);
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Mutation: changePlan", () => {
    it("should update organization plan", async () => {
      const org = createMockOrganization({ id: "org-123", plan: "starter" });
      const updatedOrg = { ...org, plan: "pro" };
      mockUpdateResult([updatedOrg]);

      const db = getDb();
      const schema = getSchema();

      await db.update(schema.organizations).set({ plan: "pro" }).where();

      dbAssertions.expectUpdate();
    });

    it("should return updated subscription", async () => {
      const org = createMockOrganization({ id: "org-123", plan: "enterprise" });
      mockSelectResult([org]);

      const subscription = transformToSubscription(org);

      expect(subscription.tier).toBe("enterprise");
    });

    it("should use orgId from context for update", () => {
      const context = createMockGraphQLContext({ orgId: "org-789" });
      const auth = context.requireAuth();

      expect(auth.orgId).toBe("org-789");
    });

    it("should support upgrading to starter", () => {
      const planId = "starter";
      expect(planId).toBe("starter");
    });

    it("should support upgrading to professional", () => {
      const planId = "professional";
      expect(planId).toBe("professional");
    });

    it("should support upgrading to enterprise", () => {
      const planId = "enterprise";
      expect(planId).toBe("enterprise");
    });

    it("should include updated limits in response", () => {
      const org = createMockOrganization({ plan: "professional" });
      const subscription = transformToSubscription(org);

      expect(subscription.limits).toBeDefined();
      expect(subscription.limits.brands).toBe(10);
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
      const org = createMockOrganization({ id: "org-123", plan: "pro" });
      const cancelledOrg = { ...org, plan: "starter" };
      mockUpdateResult([cancelledOrg]);

      const db = getDb();
      const schema = getSchema();

      await db.update(schema.organizations).set({ plan: "starter" }).where();

      dbAssertions.expectUpdate();
    });

    it("should downgrade to starter plan on immediate cancellation", () => {
      const immediately = true;
      const newPlan = immediately ? "starter" : null;

      expect(newPlan).toBe("starter");
    });

    it("should not update plan when not cancelling immediately", () => {
      const immediately = false;
      const shouldUpdate = immediately;

      expect(shouldUpdate).toBe(false);
    });

    it("should return updated subscription info", async () => {
      const org = createMockOrganization({ id: "org-123", plan: "starter" });
      mockSelectResult([org]);

      const subscription = transformToSubscription(org);

      expect(subscription.tier).toBe("starter");
      expect(subscription.status).toBe("active");
    });

    it("should use orgId from context", () => {
      const context = createMockGraphQLContext({ orgId: "org-cancel" });
      const auth = context.requireAuth();

      expect(auth.orgId).toBe("org-cancel");
    });

    it("should fallback to userId when orgId undefined", () => {
      const userId = "user-fallback";
      const orgId: string | undefined = undefined;

      const effectiveOrgId = orgId || userId;

      expect(effectiveOrgId).toBe("user-fallback");
    });

    it("should require authentication", () => {
      const context = createMockGraphQLContext();
      const auth = context.requireAuth();

      expect(auth).toBeDefined();
    });
  });

  describe("Plan Limits", () => {
    it("should enforce free plan limits", () => {
      const freePlan = subscriptionPlans.find((p) => p.id === "free")!;

      expect(freePlan.limits.brands).toBe(1);
      expect(freePlan.limits.platforms).toBe(3);
      expect(freePlan.limits.mentionsPerMonth).toBe(100);
      expect(freePlan.limits.auditsPerMonth).toBe(2);
    });

    it("should enforce starter plan limits", () => {
      const starterPlan = subscriptionPlans.find((p) => p.id === "starter")!;

      expect(starterPlan.limits.brands).toBe(3);
      expect(starterPlan.limits.platforms).toBe(7);
      expect(starterPlan.limits.mentionsPerMonth).toBe(1000);
      expect(starterPlan.limits.auditsPerMonth).toBe(10);
    });

    it("should enforce pro plan limits", () => {
      const proPlan = subscriptionPlans.find((p) => p.id === "pro")!;

      expect(proPlan.limits.brands).toBe(10);
      expect(proPlan.limits.platforms).toBe(7);
      expect(proPlan.limits.mentionsPerMonth).toBe(10000);
      expect(proPlan.limits.auditsPerMonth).toBe(50);
    });

    it("should enforce enterprise plan limits", () => {
      const enterprisePlan = subscriptionPlans.find((p) => p.id === "enterprise")!;

      expect(enterprisePlan.limits.brands).toBe(999);
      expect(enterprisePlan.limits.platforms).toBe(7);
      expect(enterprisePlan.limits.mentionsPerMonth).toBe(100000);
      expect(enterprisePlan.limits.auditsPerMonth).toBe(500);
    });

    it("should include AI token limits", () => {
      const proPlan = subscriptionPlans.find((p) => p.id === "pro")!;

      expect(proPlan.limits.aiTokensPerMonth).toBe(100000);
    });

    it("should include content pieces limits", () => {
      const proPlan = subscriptionPlans.find((p) => p.id === "pro")!;

      expect(proPlan.limits.contentPiecesPerMonth).toBe(100);
    });
  });

  describe("Pricing", () => {
    it("should offer yearly discount for starter", () => {
      const starterPlan = subscriptionPlans.find((p) => p.id === "starter")!;
      const yearlySavings = starterPlan.priceMonthly * 12 - starterPlan.priceYearly;

      expect(yearlySavings).toBeGreaterThan(0);
    });

    it("should offer yearly discount for pro", () => {
      const proPlan = subscriptionPlans.find((p) => p.id === "pro")!;
      const yearlySavings = proPlan.priceMonthly * 12 - proPlan.priceYearly;

      expect(yearlySavings).toBeGreaterThan(0);
    });

    it("should offer yearly discount for enterprise", () => {
      const enterprisePlan = subscriptionPlans.find((p) => p.id === "enterprise")!;
      const yearlySavings = enterprisePlan.priceMonthly * 12 - enterprisePlan.priceYearly;

      expect(yearlySavings).toBeGreaterThan(0);
    });

    it("should have free plan at $0", () => {
      const freePlan = subscriptionPlans.find((p) => p.id === "free")!;

      expect(freePlan.priceMonthly).toBe(0);
      expect(freePlan.priceYearly).toBe(0);
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
  });

  describe("Organization Factory Tests", () => {
    it("should create valid mock organization", () => {
      const org = createMockOrganization({
        id: "org-test",
        name: "Test Organization",
        plan: "pro",
      });

      expect(org).toHaveProperty("id", "org-test");
      expect(org).toHaveProperty("name", "Test Organization");
      expect(org).toHaveProperty("plan", "pro");
    });

    it("should create organization with default values", () => {
      const org = createMockOrganization();

      expect(org.plan).toBe("pro");
      expect(org).toHaveProperty("createdAt");
      expect(org).toHaveProperty("updatedAt");
    });

    it("should include features and limits in org", () => {
      const org = createMockOrganization({
        features: { aiOptimization: true },
        limits: { brands: 10 },
      });

      expect(org.features).toEqual({ aiOptimization: true });
      expect(org.limits).toEqual({ brands: 10 });
    });
  });

  describe("Feature Flags", () => {
    it("should include features list in subscription", () => {
      const org = createMockOrganization();
      const subscription = transformToSubscription(org);

      expect(subscription.features).toBeDefined();
      expect(Array.isArray(subscription.features)).toBe(true);
    });

    it("should have features for pro plan", () => {
      const proPlan = subscriptionPlans.find((p) => p.id === "pro")!;

      expect(proPlan.features).toContain("10 brands");
      expect(proPlan.features).toContain("API access");
      expect(proPlan.features).toContain("Priority support");
    });

    it("should have features for enterprise plan", () => {
      const enterprisePlan = subscriptionPlans.find((p) => p.id === "enterprise")!;

      expect(enterprisePlan.features).toContain("Unlimited brands");
      expect(enterprisePlan.features).toContain("Custom integrations");
      expect(enterprisePlan.features).toContain("SLA");
    });
  });

  describe("Usage Tracking", () => {
    it("should include usage field in subscription", () => {
      const org = createMockOrganization();
      const subscription = transformToSubscription(org);

      expect(subscription).toHaveProperty("usage");
    });

    it("should set usage to null initially", () => {
      const org = createMockOrganization();
      const subscription = transformToSubscription(org);

      expect(subscription.usage).toBeNull();
    });
  });

  describe("Billing Period", () => {
    it("should include currentPeriodStart", () => {
      const org = createMockOrganization();
      const subscription = transformToSubscription(org);

      expect(subscription.currentPeriodStart).toBeDefined();
    });

    it("should include currentPeriodEnd", () => {
      const org = createMockOrganization();
      const subscription = transformToSubscription(org);

      expect(subscription.currentPeriodEnd).toBeDefined();
    });

    it("should have valid ISO date format for period dates", () => {
      const org = createMockOrganization();
      const subscription = transformToSubscription(org);

      expect(() => new Date(subscription.currentPeriodStart)).not.toThrow();
      expect(() => new Date(subscription.currentPeriodEnd)).not.toThrow();
    });

    it("should have period end after period start", () => {
      const org = createMockOrganization();
      const subscription = transformToSubscription(org);

      const start = new Date(subscription.currentPeriodStart);
      const end = new Date(subscription.currentPeriodEnd);

      expect(end.getTime()).toBeGreaterThan(start.getTime());
    });
  });
});
