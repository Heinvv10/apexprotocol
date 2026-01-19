import { db } from "@/lib/db";
import {
  platformRegistry,
  platformIntegrations,
  type NewPlatformRegistry,
  type NewPlatformIntegration,
  type PlatformRegistry,
  type PlatformIntegration,
} from "@/lib/db/schema/platform-registry";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Platform Registry Service
 *
 * Handles all platform configuration, initialization, and monitoring setup.
 * Manages the lifecycle of platform integrations for each brand.
 */

/**
 * Initialize Tier 1 platforms in the registry
 * These are the 5 quick-win platforms for Phase 10 initial rollout
 */
export async function initializeTier1Platforms() {
  const tier1Platforms: NewPlatformRegistry[] = [
    {
      name: "openai_search",
      displayName: "OpenAI Search",
      description: "OpenAI's search platform integration for brand visibility monitoring",
      tier: "tier_1",
      enabled: true,
      apiEndpoint: "https://api.openai.com/v1/search",
      authMethod: "api_key",
      credentials: {},
      rateLimit: {
        requestsPerMinute: 20,
        requestsPerDay: 2000,
      },
      queryConfig: {
        maxRetries: 3,
        timeoutSeconds: 10,
        includeContext: true,
      },
      responseConfig: {
        parseJSON: true,
        extractPosition: true,
        extractSentiment: true,
      },
      features: {
        extractCitations: true,
        trackPosition: true,
        sentimentAnalysis: true,
      },
      metadata: {
        integrationLevel: "full",
        costPerQuery: 0.002,
        monthlyQuota: 100000,
        tags: ["official", "openai", "search"],
        releaseDate: "2024-09-01",
      },
    },
    {
      name: "bing_copilot",
      displayName: "Bing Copilot",
      description: "Microsoft's Bing Copilot integration for brand visibility",
      tier: "tier_1",
      enabled: true,
      apiEndpoint: "https://api.bing.com/copilot/search",
      authMethod: "api_key",
      credentials: {},
      rateLimit: {
        requestsPerMinute: 15,
        requestsPerDay: 1500,
      },
      queryConfig: {
        maxRetries: 3,
        timeoutSeconds: 12,
        includeContext: true,
      },
      responseConfig: {
        parseJSON: true,
        extractPosition: true,
        extractSentiment: true,
      },
      features: {
        extractCitations: true,
        trackPosition: true,
        sentimentAnalysis: true,
      },
      metadata: {
        integrationLevel: "full",
        costPerQuery: 0.001,
        monthlyQuota: 150000,
        tags: ["microsoft", "bing", "copilot"],
        releaseDate: "2024-06-01",
      },
    },
    {
      name: "notebooklm",
      displayName: "Google NotebookLM",
      description: "Google's NotebookLM for research and academic visibility",
      tier: "tier_1",
      enabled: true,
      apiEndpoint: "https://api.googleapis.com/notebook-lm/v1",
      authMethod: "oauth2",
      credentials: {},
      rateLimit: {
        requestsPerMinute: 10,
        requestsPerDay: 1000,
      },
      queryConfig: {
        maxRetries: 2,
        timeoutSeconds: 15,
        includeContext: true,
      },
      responseConfig: {
        parseJSON: true,
        extractPosition: true,
        extractSentiment: false,
      },
      features: {
        extractCitations: true,
        trackPosition: true,
        sentimentAnalysis: false,
        academicFocus: true,
      },
      metadata: {
        integrationLevel: "partial",
        costPerQuery: 0.0005,
        monthlyQuota: 50000,
        tags: ["google", "research", "academic"],
        releaseDate: "2024-07-01",
      },
    },
    {
      name: "cohere",
      displayName: "Cohere",
      description: "Cohere's LLM API for brand context extraction and analysis",
      tier: "tier_1",
      enabled: true,
      apiEndpoint: "https://api.cohere.com/v1/generate",
      authMethod: "api_key",
      credentials: {},
      rateLimit: {
        requestsPerMinute: 25,
        requestsPerDay: 2500,
      },
      queryConfig: {
        maxRetries: 3,
        timeoutSeconds: 8,
        includeContext: true,
      },
      responseConfig: {
        parseJSON: true,
        extractPosition: false,
        extractSentiment: true,
      },
      features: {
        extractCitations: true,
        trackPosition: false,
        sentimentAnalysis: true,
        contextGeneration: true,
      },
      metadata: {
        integrationLevel: "partial",
        costPerQuery: 0.003,
        monthlyQuota: 75000,
        tags: ["cohere", "llm", "api"],
        releaseDate: "2024-05-01",
      },
    },
    {
      name: "janus",
      displayName: "Janus (Claude API)",
      description: "Anthropic's Claude API for advanced brand analysis and monitoring",
      tier: "tier_1",
      enabled: true,
      apiEndpoint: "https://api.anthropic.com/v1/messages",
      authMethod: "api_key",
      credentials: {},
      rateLimit: {
        requestsPerMinute: 30,
        requestsPerDay: 3000,
      },
      queryConfig: {
        maxRetries: 3,
        timeoutSeconds: 10,
        includeContext: true,
      },
      responseConfig: {
        parseJSON: true,
        extractPosition: true,
        extractSentiment: true,
      },
      features: {
        extractCitations: true,
        trackPosition: true,
        sentimentAnalysis: true,
        advancedAnalysis: true,
      },
      metadata: {
        integrationLevel: "full",
        costPerQuery: 0.004,
        monthlyQuota: 100000,
        tags: ["anthropic", "claude", "api"],
        releaseDate: "2024-08-01",
      },
    },
  ];

  const results = [];
  for (const platform of tier1Platforms) {
    const existing = await db.query.platformRegistry.findFirst({
      where: eq(platformRegistry.name, platform.name),
    });

    if (!existing) {
      const created = await db
        .insert(platformRegistry)
        .values(platform)
        .returning();
      results.push({ status: "created", platform: created[0] });
    } else {
      results.push({ status: "exists", platform: existing });
    }
  }

  return results;
}

/**
 * Get platform by name
 */
export async function getPlatformByName(
  name: string
): Promise<PlatformRegistry | undefined> {
  const result = await db.query.platformRegistry.findFirst({
    where: eq(platformRegistry.name, name),
  });
  return result;
}

/**
 * Get all platforms for a specific tier
 */
export async function getPlatformsByTier(
  tier: "tier_1" | "tier_2" | "tier_3" | "tier_4"
): Promise<PlatformRegistry[]> {
  const result = await db.query.platformRegistry.findMany({
    where: eq(platformRegistry.tier, tier),
  });
  return result;
}

/**
 * Get all enabled platforms
 */
export async function getEnabledPlatforms(): Promise<PlatformRegistry[]> {
  const result = await db.query.platformRegistry.findMany({
    where: eq(platformRegistry.enabled, true),
  });
  return result;
}

/**
 * Enable platform for a brand
 */
export async function enablePlatformForBrand(
  brandId: string,
  platformId: string
): Promise<PlatformIntegration> {
  const existing = await db.query.platformIntegrations.findFirst({
    where: and(
      eq(platformIntegrations.brandId, brandId),
      eq(platformIntegrations.platformId, platformId)
    ),
  });

  if (existing) {
    const updated = await db
      .update(platformIntegrations)
      .set({
        status: "configured",
        isMonitoring: true,
        updatedAt: new Date(),
      })
      .where(eq(platformIntegrations.id, existing.id))
      .returning();
    return updated[0];
  } else {
    const created = await db
      .insert(platformIntegrations)
      .values({
        brandId,
        platformId,
        status: "configured",
        isMonitoring: true,
      })
      .returning();
    return created[0];
  }
}

/**
 * Disable platform for a brand
 */
export async function disablePlatformForBrand(
  brandId: string,
  platformId: string
): Promise<void> {
  await db
    .update(platformIntegrations)
    .set({
      isMonitoring: false,
      status: "inactive",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(platformIntegrations.brandId, brandId),
        eq(platformIntegrations.platformId, platformId)
      )
    );
}

/**
 * Get brand's platform integrations
 */
export async function getBrandPlatformIntegrations(
  brandId: string
): Promise<(PlatformIntegration & { platform?: PlatformRegistry })[]> {
  const result = await db.query.platformIntegrations.findMany({
    where: eq(platformIntegrations.brandId, brandId),
    with: {
      platform: true,
    },
  });
  return result;
}

/**
 * Get active platforms for a brand
 */
export async function getActivePlatformsForBrand(
  brandId: string
): Promise<PlatformRegistry[]> {
  const integrations = await db.query.platformIntegrations.findMany({
    where: and(
      eq(platformIntegrations.brandId, brandId),
      eq(platformIntegrations.isMonitoring, true)
    ),
    with: {
      platform: true,
    },
  });

  return integrations.map((i) => i.platform).filter(Boolean) as PlatformRegistry[];
}

/**
 * Update platform integration status
 */
export async function updateIntegrationStatus(
  integrationId: string,
  status: "not_configured" | "configured" | "active" | "inactive" | "error",
  error?: string
): Promise<PlatformIntegration> {
  const updates: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
    lastAttemptAt: new Date(),
  };

  if (error) {
    updates.lastError = error;
    updates.consecutiveFailures = 1; // Will be incremented by caller if needed
  } else if (status === "active") {
    updates.lastSuccessAt = new Date();
    updates.consecutiveFailures = 0;
  }

  const updated = await db
    .update(platformIntegrations)
    .set(updates)
    .where(eq(platformIntegrations.id, integrationId))
    .returning();

  return updated[0];
}

/**
 * Record successful query execution
 */
export async function recordSuccessfulQuery(
  integrationId: string,
  responseTimeMs: number
): Promise<void> {
  const integration = await db.query.platformIntegrations.findFirst({
    where: eq(platformIntegrations.id, integrationId),
  });

  if (!integration) return;

  const stats = integration.stats as Record<string, number>;
  const avgTime =
    stats.averageResponseTimeMs === 0
      ? responseTimeMs
      : (stats.averageResponseTimeMs * stats.totalQueries + responseTimeMs) /
        (stats.totalQueries + 1);

  await db
    .update(platformIntegrations)
    .set({
      status: "active",
      consecutiveFailures: 0,
      lastSuccessAt: new Date(),
      stats: {
        totalQueries: stats.totalQueries + 1,
        successfulQueries: stats.successfulQueries + 1,
        failedQueries: stats.failedQueries,
        averageResponseTimeMs: Math.round(avgTime),
      },
      updatedAt: new Date(),
    })
    .where(eq(platformIntegrations.id, integrationId));
}

/**
 * Record failed query execution
 */
export async function recordFailedQuery(
  integrationId: string,
  error: string
): Promise<void> {
  const integration = await db.query.platformIntegrations.findFirst({
    where: eq(platformIntegrations.id, integrationId),
  });

  if (!integration) return;

  const stats = integration.stats as Record<string, number>;
  const consecutiveFailures = (integration.consecutiveFailures || 0) + 1;

  // Mark as error status if too many consecutive failures
  const newStatus =
    consecutiveFailures > 3 ? ("error" as const) : integration.status;

  await db
    .update(platformIntegrations)
    .set({
      status: newStatus,
      consecutiveFailures: consecutiveFailures,
      lastError: error,
      lastAttemptAt: new Date(),
      stats: {
        totalQueries: stats.totalQueries + 1,
        successfulQueries: stats.successfulQueries,
        failedQueries: stats.failedQueries + 1,
        averageResponseTimeMs: stats.averageResponseTimeMs,
      },
      updatedAt: new Date(),
    })
    .where(eq(platformIntegrations.id, integrationId));
}

/**
 * Initialize default platforms for a new brand
 */
export async function initializeBrandPlatforms(
  brandId: string,
  tier: "tier_1" | "tier_2" | "tier_3" | "tier_4" = "tier_1"
): Promise<PlatformIntegration[]> {
  const platforms = await getPlatformsByTier(tier);

  const integrations = await Promise.all(
    platforms.map((p) => enablePlatformForBrand(brandId, p.id))
  );

  return integrations;
}
