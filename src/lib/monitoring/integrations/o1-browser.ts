/**
 * OpenAI o1 Browser Integration
 *
 * Integration endpoint for o1 reasoning model browser-based queries into the
 * multi-platform query system. Includes fallback logic for o1-mini and Claude
 * when budget pressure or timeouts occur.
 *
 * This module:
 * - Provides queryFunction for platform-config registration
 * - Manages o1/o1-mini model selection with budget awareness
 * - Converts browser results to MultiPlatformQueryResult format
 * - Tracks thinking token costs separately
 * - Handles reasoning timeouts and fallback chains
 * - Manages session lifecycle
 */

import { MultiPlatformQueryResult } from "../multi-platform-query";
import {
  getO1Executor,
  getO1MiniExecutor,
  cleanupO1Executor,
  cleanupO1MiniExecutor,
  O1BrowserQueryExecutor,
  O1ThinkingMetadata,
} from "@/lib/browser-query/o1-browser-query";
import { getClaudeExecutor, cleanupClaudeExecutor } from "@/lib/browser-query/claude-browser-query";
import { BrowserQueryResult } from "@/lib/browser-query/types";
import { Logger } from "@/lib/utils/logger";

const logger = new Logger("[O1BrowserIntegration]");

/**
 * Budget context for fallback decisions
 */
interface BudgetContext {
  remainingTokenBudget?: number;
  estimatedTokenCost?: number;
  preferredModel?: "o1" | "o1-mini" | "claude";
}

/**
 * Query o1 reasoning model with fallback to o1-mini or Claude
 *
 * Strategy:
 * 1. Try o1 (primary reasoning model)
 * 2. On timeout/thinking error: fallback to o1-mini
 * 3. On rate limit or budget exhaustion: fallback to Claude
 */
export async function queryO1Browser(
  query: string,
  integrationId: string,
  options?: {
    timeoutMs?: number;
    captureScreenshot?: boolean;
    headless?: boolean;
    maxRetries?: number;
    budgetContext?: BudgetContext;
    forceModel?: "o1" | "o1-mini";
  }
): Promise<MultiPlatformQueryResult> {
  const startTime = Date.now();
  let lastError: Error | null = null;
  let fallbackReason: string | undefined;
  let usedModel: "o1" | "o1-mini" | "claude" = options?.forceModel ?? "o1";
  let thinkingMetadata: O1ThinkingMetadata | undefined;

  try {
    // Determine starting model based on budget
    if (options?.budgetContext?.preferredModel) {
      usedModel = options.budgetContext.preferredModel;
    } else if (
      options?.budgetContext?.remainingTokenBudget &&
      options.budgetContext.remainingTokenBudget < 2000
    ) {
      logger.info("Token budget low, starting with o1-mini");
      usedModel = "o1-mini";
    }

    // Try primary model (o1 or o1-mini based on budget)
    if (usedModel === "o1" || usedModel === "o1-mini") {
      try {
        logger.info(`Executing ${usedModel} browser query: "${query.substring(0, 50)}..."`);

        const executor = usedModel === "o1" ? getO1Executor() : getO1MiniExecutor();

        const browserResult = await executor.executeQuery(query, integrationId, {
          timeoutMs: options?.timeoutMs ?? 120000, // o1 needs 2 minutes for thinking
          captureScreenshot: options?.captureScreenshot ?? false,
          headless: options?.headless ?? true,
          maxRetries: options?.maxRetries ?? 2,
        });

        // Capture thinking metadata if available
        thinkingMetadata = executor.getThinkingMetadata() || undefined;

        // Convert to standard result format
        const multiPlatformResult = executor.convertToMultiPlatformResult(browserResult);

        logger.info(`${usedModel} browser query completed with status: ${multiPlatformResult.status}`);

        // Attach thinking metadata to response
        if (thinkingMetadata) {
          Object.assign(multiPlatformResult.metrics, {
            thinkingTokens: thinkingMetadata.thinkingTokens,
            outputTokens: thinkingMetadata.outputTokens,
            totalCost: thinkingMetadata.totalCost,
            model: thinkingMetadata.model,
          });
        }

        return multiPlatformResult;
      } catch (error) {
        lastError = error as Error;

        // Determine if we should fallback
        const errorMessage = (error as Error).message.toLowerCase();

        // Timeout or thinking-related errors -> try o1-mini
        if (
          errorMessage.includes("timeout") &&
          errorMessage.includes("thinking") &&
          usedModel === "o1"
        ) {
          logger.warn(`o1 thinking timeout, falling back to o1-mini`);
          fallbackReason = "o1_thinking_timeout";
          usedModel = "o1-mini";
          // Continue to fallback attempt below
        }
        // Rate limit -> try Claude instead
        else if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
          logger.warn(`o1/o1-mini rate limited, falling back to Claude`);
          fallbackReason = "rate_limit";
          usedModel = "claude";
          // Continue to fallback attempt below
        }
        // Other errors -> try fallback
        else if (usedModel === "o1") {
          logger.warn(`o1 query failed, attempting o1-mini fallback`);
          fallbackReason = "o1_error";
          usedModel = "o1-mini";
          // Continue to fallback attempt below
        }
        // o1-mini already failed, try Claude
        else if (usedModel === "o1-mini") {
          logger.warn(`o1-mini query failed, attempting Claude fallback`);
          fallbackReason = "o1_mini_error";
          usedModel = "claude";
          // Continue to fallback attempt below
        } else {
          // No more fallbacks, throw error
          throw error;
        }
      }
    }

    // Fallback to o1-mini if needed
    if (usedModel === "o1-mini" && fallbackReason) {
      try {
        logger.info(`Attempting o1-mini fallback: "${query.substring(0, 50)}..."`);

        const executor = getO1MiniExecutor();

        const browserResult = await executor.executeQuery(query, integrationId, {
          timeoutMs: options?.timeoutMs ?? 60000, // o1-mini is faster
          captureScreenshot: options?.captureScreenshot ?? false,
          headless: options?.headless ?? true,
          maxRetries: options?.maxRetries ?? 2,
        });

        thinkingMetadata = executor.getThinkingMetadata() || undefined;
        const multiPlatformResult = executor.convertToMultiPlatformResult(browserResult);

        // Mark that fallback was used
        Object.assign(multiPlatformResult.metrics, {
          fallbackReason,
          originalModel: fallbackReason.includes("o1_") ? "o1" : "o1",
        });

        logger.info(`o1-mini fallback succeeded`);

        return multiPlatformResult;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`o1-mini fallback failed: ${(error as Error).message}`);

        // Try Claude as final fallback
        usedModel = "claude";
        fallbackReason = "o1_mini_fallback_failed";
      }
    }

    // Final fallback to Claude
    if (usedModel === "claude") {
      try {
        logger.info(`Attempting Claude fallback: "${query.substring(0, 50)}..."`);

        const executor = getClaudeExecutor();

        const browserResult = await executor.executeQuery(query, integrationId, {
          timeoutMs: options?.timeoutMs ?? 30000,
          captureScreenshot: options?.captureScreenshot ?? false,
          headless: options?.headless ?? true,
          maxRetries: options?.maxRetries ?? 2,
        });

        const multiPlatformResult = executor.convertToMultiPlatformResult(browserResult);

        // Mark that fallback was used
        Object.assign(multiPlatformResult.metrics, {
          fallbackReason,
          originalModel: "o1",
          fallbackModel: "claude",
        });

        logger.info(`Claude fallback succeeded`);

        return multiPlatformResult;
      } catch (error) {
        logger.error(`Claude fallback also failed: ${(error as Error).message}`);
        lastError = error as Error;
      }
    }

    // All attempts exhausted
    throw lastError || new Error("All o1 fallback chains exhausted");
  } catch (error) {
    logger.error(
      `o1 browser query failed: ${error instanceof Error ? error.message : String(error)}`
    );

    // Return error result in standard format
    return {
      platformName: "o1_browser",
      platformId: integrationId,
      status: "failed",
      response: "",
      metrics: {
        visibility: 0,
        position: null,
        confidence: 0,
      },
      responseTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Query o1-mini specifically (for budget-constrained scenarios)
 */
export async function queryO1MiniBrowser(
  query: string,
  integrationId: string,
  options?: {
    timeoutMs?: number;
    captureScreenshot?: boolean;
    headless?: boolean;
    maxRetries?: number;
  }
): Promise<MultiPlatformQueryResult> {
  return queryO1Browser(query, integrationId, {
    ...options,
    forceModel: "o1-mini",
  });
}

/**
 * Cleanup resources
 * Call this during application shutdown
 */
export async function cleanupO1Browser(): Promise<void> {
  try {
    logger.debug("Cleaning up o1 browser executors");
    await Promise.all([cleanupO1Executor(), cleanupO1MiniExecutor(), cleanupClaudeExecutor()]);
    logger.debug("o1 browser executors cleaned up successfully");
  } catch (error) {
    logger.warn(`Cleanup error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Health check for o1 browser integration
 */
export async function healthCheckO1Browser(): Promise<{
  status: "healthy" | "unhealthy";
  message: string;
  metadata?: Record<string, unknown>;
}> {
  try {
    const o1Executor = getO1Executor();
    const o1MiniExecutor = getO1MiniExecutor();

    if (!o1Executor || !o1MiniExecutor) {
      return {
        status: "unhealthy",
        message: "o1 browser executors not initialized",
      };
    }

    return {
      status: "healthy",
      message: "o1 browser executors are ready with fallback chain",
      metadata: {
        models: ["o1", "o1-mini", "claude"],
        thinking_timeout_ms: 120000,
        rate_limit_requests_per_minute: 40,
        fallback_enabled: true,
      },
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get thinking metadata from last executed query
 * Useful for analytics and cost tracking
 */
export function getLastThinkingMetadata(): O1ThinkingMetadata | undefined {
  try {
    const executor = getO1Executor();
    return executor.getThinkingMetadata() || undefined;
  } catch {
    return undefined;
  }
}
