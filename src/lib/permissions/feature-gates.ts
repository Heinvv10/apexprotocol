/**
 * Feature Gates Service (Phase 9.4)
 *
 * Controls access to premium features based on subscription tier.
 * Integrates with organization plan to enforce feature limits.
 */

// Plan types matching the database enum
export type Plan = "starter" | "professional" | "enterprise";

// Feature identifiers
export type FeatureId =
  | "competitive_discovery"
  | "competitive_benchmarking"
  | "competitive_tracking"
  | "google_places"
  | "location_reviews"
  | "executive_enrichment"
  | "influence_scoring"
  | "speaking_opportunities"
  | "opportunity_matching"
  | "api_access"
  | "white_label"
  | "custom_domain"
  | "advanced_analytics"
  | "bulk_export"
  | "priority_support";

// Resource types with limits
export type ResourceType =
  | "competitors"
  | "locations"
  | "people_enrichment"
  | "api_requests_daily"
  | "brands"
  | "users"
  | "ai_queries_monthly";

// ============================================================================
// Feature Access Configuration
// ============================================================================

/**
 * Defines which plans have access to each feature
 */
export const FEATURE_ACCESS: Record<FeatureId, Plan[]> = {
  // Competitive Intelligence (Phase 9.1)
  competitive_discovery: ["professional", "enterprise"],
  competitive_benchmarking: ["professional", "enterprise"],
  competitive_tracking: ["professional", "enterprise"],

  // Google Places Integration (Phase 9.2)
  google_places: ["professional", "enterprise"],
  location_reviews: ["professional", "enterprise"],

  // Executive Enrichment (Phase 9.3)
  executive_enrichment: ["professional", "enterprise"],
  influence_scoring: ["professional", "enterprise"],
  speaking_opportunities: ["enterprise"],
  opportunity_matching: ["enterprise"],

  // Platform Features
  api_access: ["enterprise"],
  white_label: ["enterprise"],
  custom_domain: ["enterprise"],
  advanced_analytics: ["professional", "enterprise"],
  bulk_export: ["professional", "enterprise"],
  priority_support: ["enterprise"],
};

// ============================================================================
// Resource Limits Configuration
// ============================================================================

/**
 * Defines resource limits per plan
 * "unlimited" represented as -1
 */
export const RESOURCE_LIMITS: Record<ResourceType, Record<Plan, number>> = {
  competitors: {
    starter: 0,
    professional: 5,
    enterprise: -1, // unlimited
  },
  locations: {
    starter: 0,
    professional: 3,
    enterprise: -1,
  },
  people_enrichment: {
    starter: 0,
    professional: 10,
    enterprise: -1,
  },
  api_requests_daily: {
    starter: 0,
    professional: 1000,
    enterprise: -1,
  },
  brands: {
    starter: 1,
    professional: 5,
    enterprise: -1,
  },
  users: {
    starter: 3,
    professional: 10,
    enterprise: -1,
  },
  ai_queries_monthly: {
    starter: 100,
    professional: 1000,
    enterprise: -1,
  },
};

// ============================================================================
// Plan Details
// ============================================================================

export interface PlanDetails {
  id: Plan;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
}

export const PLAN_DETAILS: Record<Plan, PlanDetails> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Essential GEO tools for small brands",
    monthlyPrice: 49,
    yearlyPrice: 470,
    features: [
      "1 brand",
      "3 team members",
      "Basic AI platform monitoring (3 platforms)",
      "1 automated scan per day",
      "Basic GEO score tracking",
      "Smart recommendations",
      "100 AI queries/month",
      "Email support",
    ],
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "Advanced intelligence for growing businesses",
    monthlyPrice: 149,
    yearlyPrice: 1430,
    highlighted: true,
    features: [
      "5 brands",
      "10 team members",
      "Real-time AI platform monitoring (7 platforms)",
      "Advanced daily tracking & alerts",
      "Competitive discovery (5 competitors)",
      "Google Places integration (3 locations)",
      "Executive enrichment (10 profiles)",
      "Advanced analytics",
      "1,000 AI queries/month",
      "Priority email support",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "Full platform access for large organizations",
    monthlyPrice: 499,
    yearlyPrice: 4790,
    features: [
      "Unlimited brands",
      "Unlimited team members",
      "Real-time AI platform monitoring (7 platforms)",
      "Unlimited monitoring with instant alerts",
      "Unlimited competitive tracking",
      "Unlimited locations",
      "Unlimited enrichment",
      "Speaking opportunities matching",
      "API access",
      "White-label & custom domain",
      "Unlimited AI queries",
      "Dedicated support",
    ],
  },
};

// ============================================================================
// Feature Gate Functions
// ============================================================================

/**
 * Check if a plan has access to a specific feature
 */
export function canAccessFeature(feature: FeatureId, plan: Plan): boolean {
  const allowedPlans = FEATURE_ACCESS[feature];
  return allowedPlans?.includes(plan) ?? false;
}

/**
 * Check if a plan has access to multiple features
 */
export function canAccessFeatures(
  features: FeatureId[],
  plan: Plan
): Record<FeatureId, boolean> {
  return features.reduce(
    (acc, feature) => {
      acc[feature] = canAccessFeature(feature, plan);
      return acc;
    },
    {} as Record<FeatureId, boolean>
  );
}

/**
 * Get the resource limit for a plan
 * Returns -1 for unlimited
 */
export function getResourceLimit(resource: ResourceType, plan: Plan): number {
  return RESOURCE_LIMITS[resource]?.[plan] ?? 0;
}

/**
 * Check if a resource limit has been reached
 */
export function isResourceLimitReached(
  resource: ResourceType,
  plan: Plan,
  currentUsage: number
): boolean {
  const limit = getResourceLimit(resource, plan);
  if (limit === -1) return false; // unlimited
  return currentUsage >= limit;
}

/**
 * Get remaining resource capacity
 * Returns -1 for unlimited
 */
export function getRemainingCapacity(
  resource: ResourceType,
  plan: Plan,
  currentUsage: number
): number {
  const limit = getResourceLimit(resource, plan);
  if (limit === -1) return -1; // unlimited
  return Math.max(0, limit - currentUsage);
}

/**
 * Get usage percentage (0-100)
 * Returns 0 for unlimited resources
 */
export function getUsagePercentage(
  resource: ResourceType,
  plan: Plan,
  currentUsage: number
): number {
  const limit = getResourceLimit(resource, plan);
  if (limit === -1 || limit === 0) return 0;
  return Math.min(100, Math.round((currentUsage / limit) * 100));
}

// ============================================================================
// Upgrade Helpers
// ============================================================================

/**
 * Get the minimum plan required for a feature
 */
export function getMinimumPlanForFeature(feature: FeatureId): Plan | null {
  const plans = FEATURE_ACCESS[feature];
  if (!plans || plans.length === 0) return null;

  // Return the lowest tier plan that has access
  const planOrder: Plan[] = ["starter", "professional", "enterprise"];
  for (const plan of planOrder) {
    if (plans.includes(plan)) return plan;
  }
  return null;
}

/**
 * Get the next upgrade plan from current plan
 */
export function getNextPlan(currentPlan: Plan): Plan | null {
  switch (currentPlan) {
    case "starter":
      return "professional";
    case "professional":
      return "enterprise";
    case "enterprise":
      return null;
  }
}

/**
 * Get features that would be unlocked by upgrading
 */
export function getUnlockedFeaturesByUpgrade(
  currentPlan: Plan,
  targetPlan: Plan
): FeatureId[] {
  const currentFeatures = Object.entries(FEATURE_ACCESS)
    .filter(([, plans]) => plans.includes(currentPlan))
    .map(([feature]) => feature as FeatureId);

  const targetFeatures = Object.entries(FEATURE_ACCESS)
    .filter(([, plans]) => plans.includes(targetPlan))
    .map(([feature]) => feature as FeatureId);

  return targetFeatures.filter((f) => !currentFeatures.includes(f));
}

/**
 * Get resource limit increases by upgrading
 */
export function getResourceIncreasesByUpgrade(
  currentPlan: Plan,
  targetPlan: Plan
): Record<ResourceType, { current: number; target: number; increase: string }> {
  const result: Record<
    ResourceType,
    { current: number; target: number; increase: string }
  > = {} as Record<ResourceType, { current: number; target: number; increase: string }>;

  for (const resource of Object.keys(RESOURCE_LIMITS) as ResourceType[]) {
    const current = RESOURCE_LIMITS[resource][currentPlan];
    const target = RESOURCE_LIMITS[resource][targetPlan];

    let increase: string;
    if (target === -1) {
      increase = "Unlimited";
    } else if (current === 0) {
      increase = `+${target}`;
    } else {
      increase = `+${target - current}`;
    }

    result[resource] = { current, target, increase };
  }

  return result;
}

// ============================================================================
// Feature Display Helpers
// ============================================================================

/**
 * Human-readable feature names
 */
export const FEATURE_NAMES: Record<FeatureId, string> = {
  competitive_discovery: "Competitor Discovery",
  competitive_benchmarking: "Competitive Benchmarking",
  competitive_tracking: "Competitive Tracking",
  google_places: "Google Places Integration",
  location_reviews: "Location Reviews Analysis",
  executive_enrichment: "Executive Enrichment",
  influence_scoring: "Influence Scoring",
  speaking_opportunities: "Speaking Opportunities",
  opportunity_matching: "Opportunity Matching",
  api_access: "API Access",
  white_label: "White-Label Branding",
  custom_domain: "Custom Domain",
  advanced_analytics: "Advanced Analytics",
  bulk_export: "Bulk Export",
  priority_support: "Priority Support",
};

/**
 * Human-readable resource names
 */
export const RESOURCE_NAMES: Record<ResourceType, string> = {
  competitors: "Competitors",
  locations: "Locations",
  people_enrichment: "Enriched Profiles",
  api_requests_daily: "Daily API Requests",
  brands: "Brands",
  users: "Team Members",
  ai_queries_monthly: "Monthly AI Queries",
};

/**
 * Format limit for display
 */
export function formatLimit(limit: number): string {
  if (limit === -1) return "Unlimited";
  if (limit === 0) return "Not available";
  return limit.toLocaleString();
}

// ============================================================================
// Type Exports
// ============================================================================

export interface FeatureGateResult {
  allowed: boolean;
  feature: FeatureId;
  currentPlan: Plan;
  requiredPlan: Plan | null;
  message: string;
}

export interface ResourceGateResult {
  allowed: boolean;
  resource: ResourceType;
  currentPlan: Plan;
  limit: number;
  currentUsage: number;
  remaining: number;
  percentage: number;
  message: string;
}

/**
 * Check feature access and return detailed result
 */
export function checkFeatureAccess(
  feature: FeatureId,
  plan: Plan
): FeatureGateResult {
  const allowed = canAccessFeature(feature, plan);
  const requiredPlan = getMinimumPlanForFeature(feature);
  const featureName = FEATURE_NAMES[feature];

  return {
    allowed,
    feature,
    currentPlan: plan,
    requiredPlan,
    message: allowed
      ? `You have access to ${featureName}`
      : `${featureName} requires ${requiredPlan ? PLAN_DETAILS[requiredPlan].name : "an upgrade"}`,
  };
}

/**
 * Check resource limit and return detailed result
 */
export function checkResourceLimit(
  resource: ResourceType,
  plan: Plan,
  currentUsage: number
): ResourceGateResult {
  const limit = getResourceLimit(resource, plan);
  const remaining = getRemainingCapacity(resource, plan, currentUsage);
  const percentage = getUsagePercentage(resource, plan, currentUsage);
  const allowed = !isResourceLimitReached(resource, plan, currentUsage);
  const resourceName = RESOURCE_NAMES[resource];

  let message: string;
  if (limit === -1) {
    message = `Unlimited ${resourceName.toLowerCase()}`;
  } else if (limit === 0) {
    message = `${resourceName} not available on your plan`;
  } else if (allowed) {
    message = `${remaining} of ${limit} ${resourceName.toLowerCase()} remaining`;
  } else {
    message = `${resourceName} limit reached (${limit})`;
  }

  return {
    allowed,
    resource,
    currentPlan: plan,
    limit,
    currentUsage,
    remaining,
    percentage,
    message,
  };
}
