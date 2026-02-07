import { db } from "@/lib/db";
import {
  platformQueryResults,
  type NewPlatformQueryResult,
  type VisibilityMetrics,
} from "@/lib/db/schema/platform-registry";
import {
  getActivePlatformsForBrand,
  recordSuccessfulQuery,
  recordFailedQuery,
} from "./platform-registry";
import { PLATFORM_CONFIG, type PlatformKey } from "./integrations";

export type QueryStatus = "success" | "partial" | "failed";

export interface MultiPlatformQueryResult {
  platformName: string;
  platformId: string;
  status: QueryStatus;
  response: string;
  metrics: VisibilityMetrics;
  responseTimeMs: number;
  error?: string;
}

export interface MultiPlatformQueryResponse {
  brandId: string;
  query: string;
  queryExecutedAt: Date;
  results: MultiPlatformQueryResult[];
  summary: {
    totalPlatforms: number;
    successfulPlatforms: number;
    failedPlatforms: number;
    averageVisibility: number;
    topVisibilityPlatform?: string;
  };
}

/**
 * Query all active platforms for a brand
 *
 * Executes the same query across all platforms the brand has enabled,
 * collecting visibility metrics and responses.
 */
export async function queryAllPlatforms(
  brandId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResponse> {
  const activePlatforms = await getActivePlatformsForBrand(brandId);

  if (activePlatforms.length === 0) {
    return {
      brandId,
      query,
      queryExecutedAt: new Date(),
      results: [],
      summary: {
        totalPlatforms: 0,
        successfulPlatforms: 0,
        failedPlatforms: 0,
        averageVisibility: 0,
      },
    };
  }

  const startTime = Date.now();
  const results: MultiPlatformQueryResult[] = [];

  // Execute queries in parallel with timeout protection
  const queryPromises = activePlatforms.map((platform) =>
    executeQueryForPlatform(
      brandId,
      platform.id,
      platform.name,
      query,
      brandContext
    ).catch((error) => ({
      platformName: platform.name,
      platformId: platform.id,
      status: "failed" as const,
      response: "",
      metrics: { visibility: 0, position: null, confidence: 0 },
      responseTimeMs: Date.now() - startTime,
      error: error.message,
    }))
  );

  const rawResults = await Promise.all(queryPromises);
  results.push(...rawResults);

  // Calculate summary metrics
  const successfulResults = results.filter((r) => r.status !== "failed");
  const visibilityScores = successfulResults.map((r) => r.metrics.visibility);
  const averageVisibility =
    visibilityScores.length > 0
      ? Math.round(
          visibilityScores.reduce((a, b) => a + b, 0) / visibilityScores.length
        )
      : 0;

  const topVisibility = Math.max(
    ...results.map((r) => r.metrics.visibility),
    0
  );
  const topVisibilityPlatform =
    topVisibility > 0
      ? results.find((r) => r.metrics.visibility === topVisibility)
          ?.platformName
      : undefined;

  return {
    brandId,
    query,
    queryExecutedAt: new Date(),
    results,
    summary: {
      totalPlatforms: activePlatforms.length,
      successfulPlatforms: successfulResults.length,
      failedPlatforms: results.filter((r) => r.status === "failed").length,
      averageVisibility,
      topVisibilityPlatform,
    },
  };
}

/**
 * Query a specific platform for a brand
 */
export async function querySpecificPlatform(
  brandId: string,
  platformId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  return executeQueryForPlatform(brandId, platformId, "", query, brandContext);
}

/**
 * Execute query for a single platform
 */
async function executeQueryForPlatform(
  brandId: string,
  platformId: string,
  platformName: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  const startTime = Date.now();

  try {
    // Registry-based dispatch: look up query function from PLATFORM_CONFIG
    const platformConfig = PLATFORM_CONFIG[platformName as PlatformKey];
    if (!platformConfig?.queryFn) {
      throw new Error(`Unknown platform: ${platformName}`);
    }

    const result = await platformConfig.queryFn(brandId, platformId, query, brandContext);

    // Record result to database
    const responseTimeMs = Date.now() - startTime;
    await recordQueryResult(
      brandId,
      platformId,
      query,
      result.response,
      result.metrics,
      result.status,
      responseTimeMs
    );

    // Update integration stats
    await recordSuccessfulQuery(platformId, responseTimeMs);

    return {
      ...result,
      responseTimeMs,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Record failure
    await recordFailedQuery(platformId, errorMessage);

    return {
      platformName,
      platformId,
      status: "failed",
      response: "",
      metrics: { visibility: 0, position: null, confidence: 0 },
      responseTimeMs,
      error: errorMessage,
    };
  }
}

/**
 * Record query result to database
 */
async function recordQueryResult(
  brandId: string,
  integrationId: string,
  query: string,
  response: string,
  metrics: VisibilityMetrics,
  status: QueryStatus,
  responseTimeMs: number
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Results expire after 30 days

  await db.insert(platformQueryResults).values({
    brandId,
    integrationId,
    query,
    response,
    parsedData: {
      metrics,
    },
    metrics,
    responseTimeMs,
    status,
    expiresAt,
  });
}

/**
 * Get query history for a brand
 */
export async function getQueryHistory(
  brandId: string,
  limit: number = 50
): Promise<typeof platformQueryResults.$inferSelect[]> {
  return db.query.platformQueryResults.findMany({
    where: (table, { eq, and, gt }) =>
      and(
        eq(table.brandId, brandId),
        gt(table.expiresAt, new Date())
      ),
    orderBy: (table, { desc }) => [desc(table.queryExecutedAt)],
    limit,
  });
}

/**
 * Get latest query result for a platform
 */
export async function getLatestQueryResult(
  brandId: string,
  platformId: string
): Promise<typeof platformQueryResults.$inferSelect | undefined> {
  const result = await db.query.platformQueryResults.findFirst({
    where: (table, { eq, and, gt }) =>
      and(
        eq(table.brandId, brandId),
        eq(table.integrationId, platformId),
        gt(table.expiresAt, new Date())
      ),
    orderBy: (table, { desc }) => [desc(table.queryExecutedAt)],
  });
  return result;
}

/**
 * Calculate platform comparison metrics
 */
export function calculateComparisonMetrics(
  results: MultiPlatformQueryResult[]
): Record<string, { visibility: number; position: number | null; confidence: number }> {
  const metrics: Record<
    string,
    { visibility: number; position: number | null; confidence: number }
  > = {};

  for (const result of results) {
    if (result.status !== "failed") {
      metrics[result.platformName] = {
        visibility: result.metrics.visibility,
        position: result.metrics.position ?? null,
        confidence: result.metrics.confidence,
      };
    }
  }

  return metrics;
}

/**
 * Batch query multiple brands across all platforms
 */
export async function batchQueryAllBrands(
  query: string,
  brandIds: string[],
  brandContext?: string
): Promise<Map<string, MultiPlatformQueryResponse>> {
  const results = new Map<string, MultiPlatformQueryResponse>();

  const queryPromises = brandIds.map((brandId) =>
    queryAllPlatforms(brandId, query, brandContext)
      .then((result) => ({ brandId, result }))
      .catch((error) => ({
        brandId,
        error: error.message,
      }))
  );

  const responses = await Promise.all(queryPromises);

  for (const response of responses) {
    if ("result" in response) {
      results.set(response.brandId, response.result);
    }
  }

  return results;
}
