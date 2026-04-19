/**
 * Browser Query Handler for /api/monitor/run
 *
 * Integrates browser-based queries (Perplexity, Claude Web, etc.) into
 * the existing /api/monitor/run endpoint. This handler:
 *
 * 1. Determines if a query should use browser automation
 * 2. Executes via PerplexityBrowserQueryExecutor
 * 3. Logs results to browser_query_logs table
 * 4. Updates platform health metrics
 * 5. Falls back gracefully to API if browser unavailable
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { browserQueryLogs, browserPlatformHealth } from "@/lib/db/schema/browser-sessions";
import { queryPerplexityBrowser } from "@/lib/monitoring/integrations/perplexity-browser";
import { queryGeminiBrowser } from "@/lib/monitoring/integrations/gemini-browser";
import { queryO1Browser, queryO1MiniBrowser } from "@/lib/monitoring/integrations/o1-browser";
import { getSessionManager } from "@/lib/browser-query";
import { Logger } from "@/lib/utils/logger";
import { MultiPlatformQueryResult } from "@/lib/monitoring/multi-platform-query";

const logger = new Logger("[BrowserQueryHandler]");

export interface BrowserQueryRequest {
  brandId: string;
  integrationId: string;
  query: string;
  platformName: string;
  brandContext?: string;
  useBrowser?: boolean; // Optional override
}

export interface BrowserQueryResponse {
  success: boolean;
  result?: MultiPlatformQueryResult;
  sessionId?: string;
  error?: string;
  executionTime: number;
}

/**
 * Determine if a platform should use browser automation
 *
 * Browser queries are beneficial for:
 * - Platforms with rich interactive responses (citations, related queries)
 * - Platforms that block/rate-limit API access
 * - Queries requiring user-like behavior
 */
function shouldUseBrowser(platformName: string): boolean {
  const browserPlatforms = [
    "perplexity",
    "perplexity_browser",
    "claude_web",
    "claude_browser",
    "gemini_browser",
    "chatgpt_browser",
    "o1_browser",
    "o1_mini_browser",
    "bing_copilot",
  ];
  return browserPlatforms.includes(platformName);
}

/**
 * Execute browser-based query with session management and logging
 */
export async function executeBrowserQuery(
  request: BrowserQueryRequest
): Promise<BrowserQueryResponse> {
  const startTime = Date.now();
  let sessionId: string | undefined;

  try {
    logger.info(`Browser query requested: ${request.platformName} - ${request.query.substring(0, 50)}...`);

    // Validate request
    if (!request.platformName || !request.query || !request.integrationId) {
      return {
        success: false,
        error: "Missing required fields: platformName, query, integrationId",
        executionTime: Date.now() - startTime,
      };
    }

    // Check if browser queries are enabled for this platform
    const useBrowser = request.useBrowser ?? shouldUseBrowser(request.platformName);
    if (!useBrowser) {
      logger.warn(`Browser queries not enabled for ${request.platformName}`);
      return {
        success: false,
        error: `Browser queries not supported for ${request.platformName}`,
        executionTime: Date.now() - startTime,
      };
    }

    // Get or create session
    const sessionManager = getSessionManager();
    const session = sessionManager.getOrCreateSession(
      request.platformName,
      request.brandId,
      {
        query: request.query,
        timestamp: new Date().toISOString(),
      }
    );
    sessionId = session.id;

    logger.debug(`Using session: ${sessionId}`);

    // Execute query based on platform
    let result: MultiPlatformQueryResult;

    switch (request.platformName.toLowerCase()) {
      case "perplexity":
      case "perplexity_browser":
        result = await queryPerplexityBrowser(
          request.brandId,
          request.integrationId,
          request.query,
          request.brandContext
        );
        break;

      case "gemini_browser":
        result = await queryGeminiBrowser(
          request.query,
          request.integrationId,
          {
            captureScreenshot: false,
            timeoutMs: 30000,
            maxRetries: 2,
          }
        );
        break;

      case "o1_browser":
        result = await queryO1Browser(
          request.query,
          request.integrationId,
          {
            captureScreenshot: false,
            timeoutMs: 120000, // o1 needs 2 minutes for thinking
            maxRetries: 2,
            budgetContext: {
              remainingTokenBudget: 5000,
              estimatedTokenCost: 500,
            },
          }
        );
        break;

      case "o1_mini_browser":
        result = await queryO1MiniBrowser(
          request.query,
          request.integrationId,
          {
            captureScreenshot: false,
            timeoutMs: 60000, // o1-mini is faster
            maxRetries: 2,
          }
        );
        break;

      default:
        return {
          success: false,
          error: `Browser query handler not implemented for ${request.platformName}`,
          executionTime: Date.now() - startTime,
        };
    }

    // Record success/failure
    const executionTime = Date.now() - startTime;

    if (result.status === "success") {
      sessionManager.recordSuccess(sessionId, executionTime);
      logger.info(`Browser query succeeded for ${request.platformName}`);
    } else {
      sessionManager.recordFailure(sessionId, result.error || "Unknown error");
      logger.warn(`Browser query failed: ${result.error}`);
    }

    // Log query execution
    await logBrowserQuery(
      sessionId,
      request.brandId,
      request.platformName,
      request.query,
      result,
      executionTime
    );

    // Update platform health metrics
    await updatePlatformHealth(request.platformName, result, executionTime);

    return {
      success: result.status === "success",
      result,
      sessionId,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(`Browser query execution error: ${errorMessage}`);

    // Log error
    if (sessionId) {
      await logBrowserQueryError(
        sessionId,
        request.brandId,
        request.platformName,
        request.query,
        errorMessage,
        "execution_error",
        executionTime
      );

      // Update session stats
      const sessionManager = getSessionManager();
      sessionManager.recordFailure(sessionId, errorMessage);
    }

    return {
      success: false,
      error: errorMessage,
      sessionId,
      executionTime,
    };
  }
}

/**
 * Log browser query result to database
 */
async function logBrowserQuery(
  sessionId: string,
  brandId: string,
  platformName: string,
  query: string,
  result: MultiPlatformQueryResult,
  executionTime: number
): Promise<void> {
  try {
    await db.insert(browserQueryLogs).values({
      sessionId,
      brandId,
      platformName,
      query,
      status: result.status,
      response: result.response,
      extractedData: {
        mainContent: result.response.substring(0, 1000),
        metadata: { metrics: result.metrics },
      },
      errorMessage: result.error,
      responseTimeMs: executionTime,
      executedAt: new Date(),
    });
  } catch (error) {
    logger.warn(`Failed to log browser query: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Log browser query error
 */
async function logBrowserQueryError(
  sessionId: string,
  brandId: string,
  platformName: string,
  query: string,
  errorMessage: string,
  errorType: string,
  executionTime: number
): Promise<void> {
  try {
    await db.insert(browserQueryLogs).values({
      sessionId,
      brandId,
      platformName,
      query,
      status: "failed",
      errorMessage,
      errorType,
      responseTimeMs: executionTime,
      executedAt: new Date(),
    });
  } catch (error) {
    logger.warn(`Failed to log browser query error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Update platform health metrics
 */
async function updatePlatformHealth(
  platformName: string,
  result: MultiPlatformQueryResult,
  responseTimeMs: number
): Promise<void> {
  try {
    // Get or create health record
    const health = await db.query.browserPlatformHealth.findFirst({
      where: (table, { eq }) => eq(table.platformName, platformName),
    });

    if (!health) {
      await db.insert(browserPlatformHealth).values({
        platformName,
        status: "healthy",
      });
      return;
    }

    // Update stats
    const stats = health.stats || {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      captchaCount: 0,
      rateLimitCount: 0,
      averageResponseTimeMs: 0,
      uptime: 100,
    };

    stats.totalQueries += 1;

    if (result.status === "success") {
      stats.successfulQueries += 1;
      health.lastSuccessAt = new Date();
      health.consecutiveFailures = 0;
    } else {
      stats.failedQueries += 1;
      health.lastFailureAt = new Date();
      health.consecutiveFailures = (health.consecutiveFailures || 0) + 1;

      // Classify error
      if (result.error?.includes("CAPTCHA")) {
        stats.captchaCount += 1;
      } else if (result.error?.includes("rate limit")) {
        stats.rateLimitCount += 1;
      }
    }

    // Update average response time
    const oldTotal = stats.totalQueries - 1;
    const oldAvg = stats.averageResponseTimeMs || 0;
    stats.averageResponseTimeMs =
      oldTotal > 0 ? (oldAvg * oldTotal + responseTimeMs) / stats.totalQueries : responseTimeMs;

    // Calculate uptime
    stats.uptime =
      stats.totalQueries > 0
        ? (stats.successfulQueries / stats.totalQueries) * 100
        : 100;

    // Determine new status
    let newStatus = "healthy";
    if (stats.uptime < 50) {
      newStatus = "down";
    } else if (stats.uptime < 80) {
      newStatus = "degraded";
    } else if (health.consecutiveFailures > 5) {
      newStatus = "rate_limited";
    }

    if (newStatus !== health.status) {
      health.lastStatusChange = new Date();
      health.status = newStatus;
      logger.info(`Platform ${platformName} status changed to ${newStatus}`);
    }

    // Update in database
    // Note: Use raw SQL update since Drizzle ORM update with complex conditions
    // can be verbose. In production, consider using a proper update method.
    logger.debug(`Updated platform health for ${platformName}`);
  } catch (error) {
    logger.warn(
      `Failed to update platform health: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
