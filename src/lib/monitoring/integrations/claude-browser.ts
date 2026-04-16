/**
 * Claude Browser Integration
 *
 * Integrates the browser-based Claude query executor into the
 * multi-platform-query system. This is called by PLATFORM_CONFIG.
 *
 * Handles OAuth authentication, fallback to API, and error conversion.
 */

import { MultiPlatformQueryResult } from "../multi-platform-query";
import { createErrorResult, analyzeResponseForBrand } from "./shared-analysis";
import {
  getClaudeExecutor,
  cleanupClaudeExecutor,
  CaptchaDetectedError,
  RateLimitError,
  AuthenticationError,
} from "@/lib/browser-query";
import { Logger } from "@/lib/utils/logger";

const logger = new Logger("[ClaudeBrowser]");

/**
 * Query Claude using browser automation
 *
 * This function is called by multi-platform-query.ts and integrates
 * browser-based queries into the existing platform registry system.
 *
 * Features:
 * - OAuth session persistence (7-day cookie expiry)
 * - Multi-turn conversation context
 * - CAPTCHA detection with human-in-the-loop
 * - Rate limit handling with exponential backoff
 * - Citation extraction from markdown responses
 * - Graceful fallback to API if browser unavailable
 * - Streaming response detection
 */
export async function queryClaudeBrowser(
  brandId: string,
  integrationId: string,
  query: string,
  brandContext?: string
): Promise<MultiPlatformQueryResult> {
  try {
    const executor = getClaudeExecutor();

    // Execute query with browser automation
    const browserResult = await executor.executeQuery(query, integrationId, {
      timeoutMs: 40000, // Claude can be slower due to streaming
      maxRetries: 1, // Conservative retries due to OAuth
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

      logger.info(`Successfully queried Claude for brand: ${brandContext}`);

      return {
        platformName: "claude",
        platformId: integrationId,
        status: "success",
        response: browserResult.rawContent,
        metrics,
        responseTimeMs: browserResult.extractedData.responseTime || 0,
      };
    }

    // Handle failed queries
    logger.warn(`Claude browser query failed: ${browserResult.error}`);

    return {
      platformName: "claude",
      platformId: integrationId,
      status: "failed",
      response: "",
      metrics: { visibility: 0, position: null, confidence: 0 },
      responseTimeMs: browserResult.extractedData.responseTime || 0,
      error: browserResult.error || "Browser query failed",
    };
  } catch (error) {
    // Handle specific error types
    if (error instanceof AuthenticationError) {
      logger.warn(`Claude authentication required: ${error.message}`);

      return createErrorResult(
        "claude",
        integrationId,
        `Claude browser session expired. OAuth re-authentication required. Reason: ${error.reason || "unknown"}`
      );
    }

    if (error instanceof CaptchaDetectedError) {
      logger.warn(`CAPTCHA detected on Claude: ${error.message}`);

      // Log screenshot path for debugging
      if (error.screenshotPath) {
        logger.info(`Error screenshot saved to: ${error.screenshotPath}`);
      }

      return createErrorResult(
        "claude",
        integrationId,
        `CAPTCHA challenge detected. Manual verification required. See logs for screenshot: ${error.screenshotPath}`
      );
    }

    if (error instanceof RateLimitError) {
      logger.warn(`Claude rate limit detected: ${error.message}`);

      return createErrorResult(
        "claude",
        integrationId,
        `Claude rate limit exceeded. Retry after ${error.retryAfterSeconds || 30} seconds.`
      );
    }

    // Generic error handling
    logger.error(`Claude browser query error: ${error instanceof Error ? error.message : String(error)}`);

    return createErrorResult(
      "claude",
      integrationId,
      `Browser query failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
