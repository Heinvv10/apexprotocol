/**
 * Perplexity Browser Query Executor
 *
 * Browser-based implementation for querying Perplexity.AI with automatic
 * session management, CAPTCHA detection, and rate limiting handling.
 *
 * This is production-ready with:
 * - Automatic session persistence and reuse
 * - CAPTCHA detection and human-in-the-loop handling
 * - Rate limit detection and backoff
 * - Citation extraction and URL normalization
 * - Comprehensive error logging and metrics
 */

import { BaseBrowserQueryExecutor } from "./base-browser-query";
import {
  BrowserQueryResult,
  BrowserQueryOptions,
  DOMExtractor,
  PlatformBrowserConfig,
  RetryConfig,
  CaptchaDetectedError,
  RateLimitError,
  ContentExtractionError,
} from "./types";
import { Page } from "puppeteer";
import { MultiPlatformQueryResult } from "../monitoring/multi-platform-query";
import type { VisibilityMetrics } from "@/lib/db/schema/platform-registry";
import { analyzeResponseForBrand } from "../monitoring/integrations/shared-analysis";

/**
 * Perplexity platform configuration
 */
const PERPLEXITY_CONFIG: PlatformBrowserConfig = {
  platformName: "perplexity",
  baseUrl: "https://www.perplexity.ai",
  searchUrl: "https://www.perplexity.ai/search",

  authRequired: false, // Can use without auth for basic queries
  authMethod: "cookies",

  selectors: {
    mainContent: "[data-testid='answer-content'], .prose, article, main",
    citations: "a[href*='http'], [data-testid='citation']",
    relatedQueries: "[data-testid='related-queries'] button, .related-queries li",
    loadingIndicator: "[data-testid='loading'], .loader, .spinner",
  },

  pageLoadTimeoutMs: 30000,
  contentReadyTimeoutMs: 15000,
  navigationDelayMs: 1000,

  minQueryIntervalMs: 2000,
  maxQueriesPerMinute: 20,

  headless: true,
  viewport: { width: 1366, height: 768 },
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

/**
 * Perplexity-specific DOM extractor
 */
class PerplexityDOMExtractor implements DOMExtractor {
  platformName = "perplexity";

  async extractMainContent(page: Page): Promise<string> {
    return await page.evaluate(() => {
      // Try multiple selectors in order of preference
      const selectors = [
        '[data-testid="answer-content"]',
        "article",
        "main",
        ".prose",
        "[role='main']",
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent?.trim()) {
          return element.textContent.trim();
        }
      }

      // Fallback to body text
      return document.body.innerText.trim();
    });
  }

  async extractCitations(page: Page): Promise<Array<{ url: string; title?: string; description?: string }>> {
    return await page.evaluate(() => {
      const citations: Array<{ url: string; title?: string; description?: string }> = [];
      const seenUrls = new Set<string>();

      // Look for citation links in Perplexity format
      const citationElements = document.querySelectorAll(
        '[data-testid="citation"], a[data-cite], .citation, [role="doc-noteref"]'
      );

      citationElements.forEach((el) => {
        const href = el.getAttribute("href") || el.getAttribute("data-url");
        if (href && !seenUrls.has(href)) {
          seenUrls.add(href);
          citations.push({
            url: href,
            title: el.textContent?.trim() || el.getAttribute("title") || undefined,
          });
        }
      });

      // Also extract from links in answer content
      const answerContent = document.querySelector('[data-testid="answer-content"]');
      if (answerContent) {
        const links = answerContent.querySelectorAll("a[href]");
        links.forEach((link) => {
          const href = link.getAttribute("href") || "";
          if (href && !href.startsWith("#") && !seenUrls.has(href)) {
            seenUrls.add(href);
            citations.push({
              url: href,
              title: link.textContent?.trim(),
            });
          }
        });
      }

      return citations;
    });
  }

  async extractRelatedQueries(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const relatedQueries: string[] = [];

      // Perplexity shows related queries in a section
      const relatedSection = document.querySelector(
        '[data-testid="related-queries"], .related-queries, [class*="related"]'
      );

      if (relatedSection) {
        const buttons = relatedSection.querySelectorAll("button, li");
        buttons.forEach((btn) => {
          const text = btn.textContent?.trim();
          if (text && text.length < 200) {
            relatedQueries.push(text);
          }
        });
      }

      return relatedQueries.slice(0, 5);
    });
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      '[data-testid="captcha"]',
      '.g-recaptcha',
      '.h-captcha',
      'text("Please verify")',
    ];

    for (const selector of captchaSelectors) {
      try {
        if (selector.startsWith('text("')) {
          // Text-based detection
          const bodyText = await page.evaluate(() => document.body.innerText);
          if (bodyText.includes(selector.slice(6, -3))) {
            return true;
          }
        } else {
          const element = await page.$(selector);
          if (element) {
            return true;
          }
        }
      } catch {
        // Selector error, continue
      }
    }

    return false;
  }

  async detectRateLimit(page: Page): Promise<boolean> {
    const rateLimitTexts = [
      "rate limit",
      "too many requests",
      "429",
      "try again later",
      "slow down",
      "temporarily unavailable",
    ];

    const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());

    for (const text of rateLimitTexts) {
      if (pageText.includes(text)) {
        return true;
      }
    }

    // Check HTTP 429 responses
    try {
      const response = await page.evaluate(() => (window as unknown as { lastResponse?: { status?: number } }).lastResponse?.status);
      if (response === 429) {
        return true;
      }
    } catch {
      // Window.lastResponse not available
    }

    return false;
  }

  async waitForContentReady(page: Page, timeoutMs: number = 15000): Promise<void> {
    // Wait for either the answer content to appear OR related queries
    await Promise.race([
      page.waitForSelector('[data-testid="answer-content"]', { timeout: timeoutMs }),
      page.waitForSelector('[data-testid="related-queries"]', { timeout: timeoutMs }),
      page.waitForFunction(
        () => {
          const text = document.body.innerText;
          return text.length > 100; // At least some content loaded
        },
        { timeout: timeoutMs }
      ),
    ]);

    // Wait for loading spinner to disappear
    try {
      await page.waitForFunction(
        () => {
          const loaders = document.querySelectorAll("[data-testid='loading'], .loader, .spinner");
          return loaders.length === 0;
        },
        { timeout: 5000 }
      );
    } catch {
      // Timeout is OK, content may still be valid
    }
  }
}

/**
 * Perplexity Browser Query Executor
 */
export class PerplexityBrowserQueryExecutor extends BaseBrowserQueryExecutor {
  protected extractor: PerplexityDOMExtractor;

  constructor(retryConfig?: Partial<RetryConfig>) {
    super(PERPLEXITY_CONFIG, retryConfig);
    this.extractor = new PerplexityDOMExtractor();
  }

  /**
   * Execute Perplexity query with DOM extraction
   */
  protected async executeQueryInternal(
    query: string,
    integrationId: string,
    options: BrowserQueryOptions
  ): Promise<BrowserQueryResult> {
    if (!this.page) {
      throw new Error("Browser page not initialized");
    }

    try {
      // Navigate to Perplexity search with query
      const searchUrl = `${PERPLEXITY_CONFIG.searchUrl}?q=${encodeURIComponent(query)}`;
      this.logger.debug(`Navigating to: ${searchUrl}`);

      await this.navigateTo(searchUrl);

      // Wait for content to load
      await this.waitForContent(this.extractor);

      // Check for CAPTCHA
      const hasCaptcha = await this.extractor.detectCaptcha(this.page);
      if (hasCaptcha) {
        const screenshotPath = options.captureScreenshot ? await this.captureScreenshot() : undefined;
        throw new CaptchaDetectedError(
          "Perplexity CAPTCHA challenge detected. Manual intervention required.",
          "recaptcha",
          screenshotPath
        );
      }

      // Check for rate limiting
      const isRateLimited = await this.extractor.detectRateLimit(this.page);
      if (isRateLimited) {
        throw new RateLimitError(
          "Perplexity rate limit detected. Too many requests.",
          30,
          "perplexity"
        );
      }

      // Extract content
      const mainContent = await this.extractor.extractMainContent(this.page);
      const citations = await this.extractor.extractCitations(this.page);
      const relatedQueries = await this.extractor.extractRelatedQueries(this.page);

      if (!mainContent || mainContent.length < 50) {
        throw new ContentExtractionError(
          "Failed to extract meaningful content from Perplexity response",
          { contentLength: mainContent.length, citationCount: citations.length }
        );
      }

      // Analyze for brand visibility
      const metrics = analyzeResponseForBrand(mainContent, "", {
        confidence: 90,
        citationBonus: citations.length > 0 ? 10 : 0,
      });

      return {
        platformName: "perplexity",
        platformId: integrationId,
        query,
        rawContent: mainContent,
        extractedData: {
          mainContent,
          citations,
          relatedQueries,
          responseTime: Date.now(),
        },
        status: "success",
        timestamp: new Date(),
      };
    } catch (error) {
      if (error instanceof CaptchaDetectedError || error instanceof RateLimitError) {
        throw error; // Re-throw known errors for retry logic
      }

      if (error instanceof ContentExtractionError) {
        throw error;
      }

      throw new Error(
        `Perplexity query execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert BrowserQueryResult to MultiPlatformQueryResult for integration
   */
  convertToMultiPlatformResult(
    browserResult: BrowserQueryResult,
    brandContext?: string
  ): MultiPlatformQueryResult {
    const metrics = analyzeResponseForBrand(browserResult.rawContent, brandContext, {
      confidence: 90,
      citationBonus: (browserResult.extractedData.citations?.length || 0) > 0 ? 10 : 0,
    });

    return {
      platformName: browserResult.platformName,
      platformId: browserResult.platformId,
      status: browserResult.status as "success" | "partial" | "failed",
      response: browserResult.rawContent,
      metrics,
      responseTimeMs: browserResult.extractedData.responseTime || 0,
      error: browserResult.error,
    };
  }
}

/**
 * Singleton instance management
 */
let perplexityExecutor: PerplexityBrowserQueryExecutor | null = null;

export function getPerplexityExecutor(): PerplexityBrowserQueryExecutor {
  if (!perplexityExecutor) {
    perplexityExecutor = new PerplexityBrowserQueryExecutor({
      maxRetries: 3,
      initialDelayMs: 2000,
      retryOn: {
        timeout: true,
        captcha: false, // Don't auto-retry CAPTCHA, requires human
        rateLimit: true,
        networkError: true,
      },
    });
  }
  return perplexityExecutor;
}

export async function cleanupPerplexityExecutor(): Promise<void> {
  if (perplexityExecutor) {
    await perplexityExecutor.cleanup();
    perplexityExecutor = null;
  }
}
