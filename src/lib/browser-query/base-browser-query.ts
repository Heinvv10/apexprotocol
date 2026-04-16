/**
 * Base Browser Query Executor
 *
 * Abstract base class for platform-specific browser query implementations.
 * Handles session management, error detection, retries, and metrics collection.
 * Subclasses implement platform-specific DOM extraction and navigation logic.
 */

import { Browser, Page, LaunchOptions } from "puppeteer";
import {
  BrowserQueryResult,
  BrowserQueryError,
  DOMExtractor,
  PlatformBrowserConfig,
  RetryConfig,
  BrowserQueryMetrics,
  BrowserQueryOptions,
  TimeoutError,
  CaptchaDetectedError,
  RateLimitError,
  SessionExpiredError,
  ContentExtractionError,
  BrowserCrashError,
} from "./types";
import { Logger } from "@/lib/utils/logger";

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryOn: {
    timeout: true,
    captcha: true,
    rateLimit: true,
    networkError: true,
  },
};

export abstract class BaseBrowserQueryExecutor {
  protected logger: Logger;
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  protected platformConfig: PlatformBrowserConfig;
  protected retryConfig: RetryConfig;

  constructor(
    platformConfig: PlatformBrowserConfig,
    retryConfig: Partial<RetryConfig> = {}
  ) {
    this.platformConfig = platformConfig;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.logger = new Logger(`[BrowserQuery:${platformConfig.platformName}]`);
  }

  /**
   * Execute a query with automatic retry on failure
   */
  async executeQuery(
    query: string,
    integrationId: string,
    options: BrowserQueryOptions = {}
  ): Promise<BrowserQueryResult> {
    // Validate query before launching browser
    if (!query || !query.trim()) {
      return this.createErrorResult(
        query,
        integrationId,
        "Empty or whitespace-only query provided",
        undefined
      );
    }

    const startTime = new Date();
    let lastError: BrowserQueryError | Error | null = null;
    let retryCount = 0;
    const maxRetries = options.maxRetries ?? this.retryConfig.maxRetries;
    const timeoutMs = options.timeoutMs ?? this.platformConfig.pageLoadTimeoutMs ?? 30000;

    while (retryCount <= maxRetries) {
      try {
        this.logger.info(`Executing query (attempt ${retryCount + 1}/${maxRetries + 1}): ${query}`);

        // Initialize browser if needed
        if (!this.browser) {
          await this.initializeBrowser(options);
        }

        // Execute with timeout protection
        const result = await Promise.race([
          this.executeQueryInternal(query, integrationId, options),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new TimeoutError(`Query timeout after ${timeoutMs}ms`, timeoutMs)), timeoutMs)
          ),
        ]);

        this.logger.info(`Query successful: ${query}`);
        return result;
      } catch (error) {
        lastError = error as BrowserQueryError | Error;

        // Determine if we should retry
        const shouldRetry = this.shouldRetryError(error as Error, retryCount, maxRetries);

        if (shouldRetry) {
          const delayMs = this.calculateBackoffDelay(retryCount);
          this.logger.warn(`Query failed (${error instanceof Error ? error.message : String(error)}), retrying in ${delayMs}ms...`);
          retryCount++;
          await this.delay(delayMs);
          await this.resetBrowserState();
        } else {
          this.logger.error(`Query failed permanently: ${error instanceof Error ? error.message : String(error)}`);
          break;
        }
      }
    }

    // All retries exhausted
    return this.createErrorResult(
      query,
      integrationId,
      lastError instanceof Error ? lastError.message : String(lastError),
      options.captureScreenshot ? await this.captureScreenshot() : undefined
    );
  }

  /**
   * Internal query execution (platform-specific)
   * Subclasses must implement this
   */
  protected abstract executeQueryInternal(
    query: string,
    integrationId: string,
    options: BrowserQueryOptions
  ): Promise<BrowserQueryResult>;

  /**
   * Initialize Puppeteer browser
   */
  protected async initializeBrowser(options: BrowserQueryOptions): Promise<void> {
    try {
      this.logger.debug(`Initializing browser for ${this.platformConfig.platformName}`);

      const puppeteer = await import("puppeteer");
      const launchOptions: LaunchOptions = {
        headless: options.headless ?? this.platformConfig.headless ?? true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      };

      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();

      // Set viewport
      const viewport = this.platformConfig.viewport ?? { width: 1366, height: 768 };
      await this.page.setViewport(viewport);

      // Set user agent
      if (this.platformConfig.userAgent) {
        await this.page.setUserAgent(this.platformConfig.userAgent);
      }

      this.logger.debug(`Browser initialized successfully`);
    } catch (error) {
      throw new BrowserCrashError(
        `Failed to initialize browser: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Navigate to URL with error handling
   */
  protected async navigateTo(url: string, timeoutMs?: number): Promise<void> {
    if (!this.page) {
      throw new BrowserCrashError("Page not initialized");
    }

    try {
      await this.page.goto(url, {
        waitUntil: "networkidle2",
        timeout: timeoutMs ?? 30000,
      });
    } catch (error) {
      throw new TimeoutError(
        `Navigation to ${url} failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Wait for content to be ready (platform-specific)
   */
  protected async waitForContent(extractor: DOMExtractor, timeoutMs?: number): Promise<void> {
    if (!this.page) {
      throw new BrowserCrashError("Page not initialized");
    }

    try {
      const timeout = timeoutMs ?? this.platformConfig.contentReadyTimeoutMs ?? 15000;
      await extractor.waitForContentReady(this.page, timeout);
    } catch (error) {
      throw new TimeoutError(
        `Content ready timeout: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Capture screenshot for debugging errors
   */
  protected async captureScreenshot(filename?: string): Promise<string> {
    if (!this.page) {
      return "";
    }

    try {
      const timestamp = new Date().getTime();
      const path = filename ?? `/tmp/apex-browser-error-${timestamp}.png`;
      await this.page.screenshot({ path, fullPage: true });
      this.logger.debug(`Screenshot saved to ${path}`);
      return path;
    } catch (error) {
      this.logger.warn(`Failed to capture screenshot: ${error instanceof Error ? error.message : String(error)}`);
      return "";
    }
  }

  /**
   * Determine if error is retryable
   */
  protected shouldRetryError(error: Error, retryCount: number, maxRetries: number): boolean {
    if (retryCount >= maxRetries) {
      return false;
    }

    // Check if specific error type should be retried
    if (error instanceof TimeoutError && this.retryConfig.retryOn.timeout) {
      return true;
    }
    if (error instanceof CaptchaDetectedError && this.retryConfig.retryOn.captcha) {
      return true;
    }
    if (error instanceof RateLimitError && this.retryConfig.retryOn.rateLimit) {
      return true;
    }

    // Generic network errors
    const message = error.message.toLowerCase();
    if (
      this.retryConfig.retryOn.networkError &&
      (message.includes("econnrefused") ||
        message.includes("etimedout") ||
        message.includes("enotfound") ||
        message.includes("network"))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  protected calculateBackoffDelay(retryCount: number): number {
    const baseDelay = this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, retryCount);

    // Add jitter (random 0-10% variation) before applying cap
    const jitter = baseDelay * 0.1 * Math.random();
    const delayWithJitter = baseDelay + jitter;

    // Cap at maxDelayMs (applied after jitter to guarantee the cap is respected)
    return Math.floor(Math.min(delayWithJitter, this.retryConfig.maxDelayMs));
  }

  /**
   * Reset browser state for retry
   */
  protected async resetBrowserState(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
    } catch (error) {
      this.logger.warn(`Failed to close page: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Cleanup browser on shutdown
   */
  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      this.logger.debug("Browser cleanup completed");
    } catch (error) {
      this.logger.error(`Cleanup error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Utility: delay
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create standardized error result
   */
  protected createErrorResult(
    query: string,
    integrationId: string,
    errorMessage: string,
    screenshotPath?: string
  ): BrowserQueryResult {
    return {
      platformName: this.platformConfig.platformName,
      platformId: integrationId,
      query,
      rawContent: "",
      extractedData: {
        mainContent: "",
        citations: [],
        relatedQueries: [],
        responseTime: Date.now(),
      },
      status: "failed",
      timestamp: new Date(),
      screenshotPath,
      error: errorMessage,
    };
  }
}
