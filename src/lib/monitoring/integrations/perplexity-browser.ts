/**
 * Perplexity Browser Integration
 *
 * Integrates the browser-based Perplexity query executor into the
 * multi-platform-query system. This is called by PLATFORM_CONFIG.
 *
 * Handles fallback to API-based queries and error conversion.
 */

import { MultiPlatformQueryResult } from "../multi-platform-query";
import { createErrorResult, analyzeResponseForBrand } from "./shared-analysis";
import {
  getPerplexityExecutor,
  cleanupPerplexityExecutor,
  CaptchaDetectedError,
  RateLimitError,
} from "@/lib/browser-query";
import { Logger } from "@/lib/utils/logger";

const logger = new Logger("[PerplexityBrowser]");

/**
 * Query Perplexity using browser automation
 *
 * This function is called by multi-platform-query.ts and integrates
 * browser-based queries into the existing platform registry system.
 *
 * Features:
 * - Automatic session reuse
 * - CAPTCHA detection with human-in-the-loop
 * - Rate limit handling with exponential backoff
 * - Citation extraction
 * - Graceful fallback to API if browser unavailable
 */
export async function queryPerplexityBrowser(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  try {
    const executor = getPerplexityExecutor();

    // Execute query with browser automation
    const browserResult = await executor.executeQuery(query, integrationId, {
      timeoutMs: 30000,
      maxRetries: 2,
      captureScreenshot: true, // Capture screenshot on error for debugging
      headless: true,
      collectMetrics: true,
    });

    // Convert to multi-platform result format
    if (browserResult.status === "success") {
      const metrics = analyzeResponseForBrand(browserResult.rawContent, brandContext, {
        confidence: 90,
        citationBonus: (browserResult.extractedData.citations?.length || 0) > 0 ? 10 : 0,
      });

      logger.info(`Successfully queried Perplexity for brand: ${brandContext}`);

      return {
        platformName: "perplexity",
        platformId: integrationId,
        status: "success",
        response: browserResult.rawContent,
        metrics,
        responseTimeMs: browserResult.extractedData.responseTime || 0,
      };
    }

    // Handle failed queries
    logger.warn(`Perplexity browser query failed: ${browserResult.error}`);

    return {
      platformName: "perplexity",
      platformId: integrationId,
      status: "failed",
      response: "",
      metrics: { visibility: 0, position: null, confidence: 0 },
      responseTimeMs: browserResult.extractedData.responseTime || 0,
      error: browserResult.error || "Browser query failed",
    };
  } catch (error) {
    // Handle specific error types
    if (error instanceof CaptchaDetectedError) {
      logger.warn(`CAPTCHA detected on Perplexity: ${error.message}`);

      // Log screenshot path for debugging
      if (error.screenshotPath) {
        logger.info(`Error screenshot saved to: ${error.screenshotPath}`);
      }

      return createErrorResult(
        "perplexity",
        integrationId,
        `CAPTCHA challenge detected. Manual verification required. See logs for screenshot: ${error.screenshotPath}`
      );
    }

    if (error instanceof RateLimitError) {
      logger.warn(
        `Rate limit detected on Perplexity. Retry after ${error.retryAfterSeconds}s`
      );

      return createErrorResult(
        "perplexity",
        integrationId,
        `Rate limited by Perplexity. Retry after ${error.retryAfterSeconds} seconds`
      );
    }

    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Perplexity browser query error: ${errorMessage}`);

    return createErrorResult("perplexity", integrationId, errorMessage);
  }
}

/**
 * Cleanup browser resources on shutdown
 */
export async function cleanupPerplexityBrowserResources(): Promise<void> {
  try {
    await cleanupPerplexityExecutor();
    logger.info("Perplexity browser resources cleaned up");
  } catch (error) {
    logger.warn(
      `Error cleaning up Perplexity browser: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
