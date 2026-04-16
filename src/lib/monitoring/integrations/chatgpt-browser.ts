/**
 * ChatGPT Browser Integration
 *
 * Integration endpoint for ChatGPT browser-based queries into the
 * multi-platform query system.
 *
 * This module:
 * - Provides queryFunction for platform-config registration
 * - Handles session reuse and lifecycle management
 * - Converts browser results to MultiPlatformQueryResult format
 * - Manages error handling and retries
 */

import { MultiPlatformQueryResult } from "../multi-platform-query";
import {
  getChatGPTExecutor,
  cleanupChatGPTExecutor,
  ChatGPTBrowserQueryExecutor,
} from "@/lib/browser-query/chatgpt-browser-query";
import { BrowserQueryResult } from "@/lib/browser-query/types";
import { Logger } from "@/lib/utils/logger";

const logger = new Logger("[ChatGPTBrowserIntegration]");

/**
 * Main query function for ChatGPT browser integration
 *
 * Executes a query via ChatGPT.com with browser automation,
 * returning results in standard MultiPlatformQueryResult format.
 */
export async function queryChatGPTBrowser(
  query: string,
  integrationId: string,
  options?: {
    timeoutMs?: number;
    captureScreenshot?: boolean;
    headless?: boolean;
    maxRetries?: number;
  }
): Promise<MultiPlatformQueryResult> {
  let executor: ChatGPTBrowserQueryExecutor | null = null;

  try {
    executor = getChatGPTExecutor();

    logger.info(`Executing ChatGPT browser query: "${query}"`);

    // Execute query with browser automation
    const browserResult = await executor.executeQuery(query, integrationId, {
      timeoutMs: options?.timeoutMs ?? 25000, // 25s timeout for ChatGPT streaming
      captureScreenshot: options?.captureScreenshot ?? false,
      headless: options?.headless ?? true,
      maxRetries: options?.maxRetries ?? 2,
    });

    // Convert to standard result format
    const multiPlatformResult = executor.convertToMultiPlatformResult(browserResult);

    logger.info(
      `ChatGPT browser query completed with status: ${multiPlatformResult.status}`
    );

    return multiPlatformResult;
  } catch (error) {
    logger.error(
      `ChatGPT browser query failed: ${error instanceof Error ? error.message : String(error)}`
    );

    // Return error result in standard format
    return {
      platformName: "chatgpt_browser",
      platformId: integrationId,
      status: "failed",
      response: "",
      metrics: {
        confidence: 0,
        relevance: 0,
        brandMentioned: false,
      },
      responseTimeMs: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Cleanup resources
 * Call this during application shutdown
 */
export async function cleanupChatGPTBrowser(): Promise<void> {
  try {
    logger.debug("Cleaning up ChatGPT browser executor");
    await cleanupChatGPTExecutor();
    logger.debug("ChatGPT browser executor cleaned up successfully");
  } catch (error) {
    logger.warn(
      `Cleanup error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Health check for ChatGPT browser integration
 * Verifies that the browser automation infrastructure is available
 */
export async function healthCheckChatGPTBrowser(): Promise<{
  status: "healthy" | "unhealthy";
  message: string;
}> {
  try {
    const executor = getChatGPTExecutor();

    // Basic check: executor exists and is valid
    if (!executor) {
      return {
        status: "unhealthy",
        message: "ChatGPT browser executor not initialized",
      };
    }

    // Note: We don't do a full network test as it requires auth
    // Just verify the executor is ready
    return {
      status: "healthy",
      message: "ChatGPT browser executor is ready",
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
