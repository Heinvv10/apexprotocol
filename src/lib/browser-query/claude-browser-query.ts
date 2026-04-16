/**
 * Claude Browser Query Executor
 *
 * Browser-based implementation for querying Claude.ai with automatic
 * session management, OAuth authentication, CAPTCHA detection, and rate limiting handling.
 *
 * Key features:
 * - Google/GitHub OAuth session persistence and reuse
 * - Multi-turn conversation context management
 * - Streaming response completion detection
 * - Citation extraction from response
 * - CAPTCHA detection and rate limiting
 * - 7-day session cookie persistence
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
  AuthenticationError,
  ContentExtractionError,
} from "./types";
import { Page } from "puppeteer";
import { MultiPlatformQueryResult } from "../monitoring/multi-platform-query";
import { analyzeResponseForBrand } from "../monitoring/integrations/shared-analysis";

/**
 * Claude platform configuration
 */
const CLAUDE_CONFIG: PlatformBrowserConfig = {
  platformName: "claude",
  baseUrl: "https://claude.ai",
  searchUrl: "https://claude.ai/chat", // Claude uses /chat for conversations

  authRequired: true, // OAuth required
  authMethod: "cookies", // Google/GitHub OAuth via cookies

  selectors: {
    mainContent: "[data-testid='message-content'], .prose, [role='article'], .chat-message:last-child",
    citations: "a[href*='http'], [data-testid='citation']",
    relatedQueries: "", // Claude doesn't have "related queries" - it's conversation-based
    loadingIndicator: "[data-testid='loading'], .spinner, [aria-busy='true']",
  },

  pageLoadTimeoutMs: 30000,
  contentReadyTimeoutMs: 20000, // Claude responses can be slower due to streaming
  navigationDelayMs: 1000,

  minQueryIntervalMs: 2000,
  maxQueriesPerMinute: 15, // Conservative rate limit

  headless: true,
  viewport: { width: 1366, height: 768 },
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

/**
 * Claude-specific DOM extractor
 */
class ClaudeDOMExtractor implements DOMExtractor {
  platformName = "claude";

  async extractMainContent(page: Page): Promise<string> {
    return await page.evaluate(() => {
      // Try multiple selectors for Claude's message container
      const selectors = [
        "[data-testid='message-content']", // Claude's test ID
        ".prose", // Markdown rendered content
        "[role='article']", // Semantic role
        ".chat-message:last-child", // Last message in chat
        "div[class*='message']", // Generic message selector
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Get the last element (most recent message)
          const element = elements[elements.length - 1];
          const text = element.textContent?.trim();
          if (text && text.length > 50) {
            return text;
          }
        }
      }

      // Fallback to main content area
      const mainContent = document.querySelector("main");
      if (mainContent && mainContent.textContent?.trim()) {
        return mainContent.textContent.trim();
      }

      // Last resort: get visible text from chat area
      return document.body.innerText.trim();
    });
  }

  async extractCitations(page: Page): Promise<Array<{ url: string; title?: string; description?: string }>> {
    return await page.evaluate(() => {
      const citations: Array<{ url: string; title?: string; description?: string }> = [];
      const seenUrls = new Set<string>();

      // Claude often includes citations in the message content
      const messageContent = document.querySelector(
        "[data-testid='message-content'], .prose, [role='article']"
      );

      if (messageContent) {
        const links = messageContent.querySelectorAll("a[href]");
        links.forEach((link) => {
          const href = link.getAttribute("href") || "";
          const text = link.textContent?.trim();

          // Skip internal links, anchors, and duplicates
          if (
            href &&
            !href.startsWith("#") &&
            !href.startsWith("javascript:") &&
            !seenUrls.has(href) &&
            text
          ) {
            seenUrls.add(href);
            citations.push({
              url: href,
              title: text,
            });
          }
        });
      }

      // Also check for explicit citation markers
      const citationElements = document.querySelectorAll(
        "[data-testid='citation'], [role='doc-noteref'], .citation"
      );

      citationElements.forEach((el) => {
        const href = el.getAttribute("href") || el.getAttribute("data-url") || "";
        if (href && !seenUrls.has(href)) {
          seenUrls.add(href);
          citations.push({
            url: href,
            title: el.textContent?.trim() || el.getAttribute("title") || undefined,
          });
        }
      });

      return citations;
    });
  }

  async extractRelatedQueries(page: Page): Promise<string[]> {
    // Claude doesn't have "related queries" like Perplexity
    // It has follow-up suggestions in some cases, but they're not always visible
    return [];
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      "[data-testid='captcha']",
      ".g-recaptcha",
      ".h-captcha",
    ];

    for (const selector of captchaSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          return true;
        }
      } catch {
        // Selector error, continue
      }
    }

    // Check for CAPTCHA challenge text
    try {
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      const captchaTexts = [
        "verify",
        "captcha",
        "prove you're not a robot",
        "security challenge",
      ];

      for (const text of captchaTexts) {
        if (pageText.includes(text)) {
          return true;
        }
      }
    } catch {
      // Continue
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
      "message limit",
      "usage limit",
    ];

    try {
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());

      for (const text of rateLimitTexts) {
        if (pageText.includes(text)) {
          return true;
        }
      }
    } catch {
      // Continue
    }

    return false;
  }

  async waitForContentReady(page: Page, timeoutMs: number = 20000): Promise<void> {
    // Claude uses streaming, so we need to wait for the response to complete
    // Look for either message content OR absence of loading indicator

    try {
      // First, wait for a message to appear
      await Promise.race([
        page.waitForSelector("[data-testid='message-content']", { timeout: timeoutMs }),
        page.waitForSelector(".prose", { timeout: timeoutMs }),
        page.waitForSelector("[role='article']", { timeout: timeoutMs }),
        page.waitForFunction(
          () => {
            const text = document.body.innerText;
            return text.length > 100; // At least some content loaded
          },
          { timeout: timeoutMs }
        ),
      ]);

      // Wait for loading indicator to disappear (streaming complete)
      try {
        await page.waitForFunction(
          () => {
            const loaders = document.querySelectorAll(
              "[data-testid='loading'], .spinner, [aria-busy='true']"
            );
            return loaders.length === 0;
          },
          { timeout: 10000 }
        );
      } catch {
        // Timeout is OK, content may still be valid
        // Claude's streaming might not have a clear "done" indicator
      }
    } catch (error) {
      throw new Error(
        `Content ready timeout: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Detect if OAuth login is required
   */
  async detectOAuthLoginRequired(page: Page): Promise<boolean> {
    try {
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      const loginTexts = [
        "sign in with google",
        "sign in with github",
        "log in",
        "authenticate",
        "oauth",
      ];

      for (const text of loginTexts) {
        if (pageText.includes(text)) {
          return true;
        }
      }

      // Check for login page URL patterns
      const url = page.url();
      if (
        url.includes("login") ||
        url.includes("auth") ||
        url.includes("signin")
      ) {
        return true;
      }
    } catch {
      // Continue
    }

    return false;
  }
}

/**
 * Claude Browser Query Executor
 */
export class ClaudeBrowserQueryExecutor extends BaseBrowserQueryExecutor {
  protected extractor: ClaudeDOMExtractor;
  private conversationHistory: string[] = []; // Track multi-turn context

  constructor(retryConfig?: Partial<RetryConfig>) {
    super(CLAUDE_CONFIG, retryConfig);
    this.extractor = new ClaudeDOMExtractor();
  }

  /**
   * Execute Claude query with DOM extraction
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
      // Navigate to Claude chat
      const chatUrl = CLAUDE_CONFIG.baseUrl;
      this.logger.debug(`Navigating to: ${chatUrl}`);

      await this.navigateTo(chatUrl);

      // Check if OAuth login is required
      const loginRequired = await this.extractor.detectOAuthLoginRequired(this.page);
      if (loginRequired) {
        const screenshotPath = options.captureScreenshot ? await this.captureScreenshot() : undefined;
        throw new AuthenticationError(
          "Claude OAuth login required. Please authenticate via Google or GitHub.",
          "unauthorized"
        );
      }

      // Wait for chat interface to load
      await this.waitForContent(this.extractor);

      // Check for CAPTCHA
      const hasCaptcha = await this.extractor.detectCaptcha(this.page);
      if (hasCaptcha) {
        const screenshotPath = options.captureScreenshot ? await this.captureScreenshot() : undefined;
        throw new CaptchaDetectedError(
          "Claude CAPTCHA challenge detected. Manual intervention required.",
          "recaptcha",
          screenshotPath
        );
      }

      // Check for rate limiting
      const isRateLimited = await this.extractor.detectRateLimit(this.page);
      if (isRateLimited) {
        throw new RateLimitError(
          "Claude rate limit detected. Too many requests.",
          30,
          "claude"
        );
      }

      // Input the query
      const inputSelector = "textarea, input[type='text'], [contenteditable='true']";
      const inputElement = await this.page.$(inputSelector);

      if (!inputElement) {
        throw new ContentExtractionError(
          "Could not find Claude input field",
          { selector: inputSelector }
        );
      }

      // Clear and type query
      await this.page.evaluate((selector) => {
        const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
        if (el) {
          el.value = "";
          el.focus();
        }
      }, inputSelector);

      await inputElement.type(query, { delay: 50 }); // Slow typing to avoid detection issues

      // Submit query
      const submitButton = await this.page.$("button[type='submit'], button:has-text('Send')");
      if (submitButton) {
        await submitButton.click();
      } else {
        // Try pressing Enter
        await this.page.keyboard.press("Enter");
      }

      // Wait for response to arrive and streaming to complete
      await this.waitForContent(this.extractor);

      // Extract content
      const mainContent = await this.extractor.extractMainContent(this.page);
      const citations = await this.extractor.extractCitations(this.page);

      if (!mainContent || mainContent.length < 50) {
        throw new ContentExtractionError(
          "Failed to extract meaningful content from Claude response",
          { contentLength: mainContent.length, citationCount: citations.length }
        );
      }

      // Add to conversation history for multi-turn context
      this.conversationHistory.push(query);
      this.conversationHistory.push(mainContent);

      // Analyze for brand visibility
      const metrics = analyzeResponseForBrand(mainContent, "", {
        confidence: 90,
        citationBonus: citations.length > 0 ? 10 : 0,
      });

      return {
        platformName: "claude",
        platformId: integrationId,
        query,
        rawContent: mainContent,
        extractedData: {
          mainContent,
          citations,
          relatedQueries: [], // Claude doesn't have related queries
          responseTime: Date.now(),
        },
        status: "success",
        timestamp: new Date(),
      };
    } catch (error) {
      if (
        error instanceof CaptchaDetectedError ||
        error instanceof RateLimitError ||
        error instanceof AuthenticationError
      ) {
        throw error; // Re-throw known errors for retry logic
      }

      if (error instanceof ContentExtractionError) {
        throw error;
      }

      throw new Error(
        `Claude query execution failed: ${error instanceof Error ? error.message : String(error)}`
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

  /**
   * Clear conversation history (start fresh session)
   */
  clearConversationHistory(): void {
    this.conversationHistory = [];
    this.logger.debug("Conversation history cleared");
  }

  /**
   * Get current conversation history
   */
  getConversationHistory(): string[] {
    return [...this.conversationHistory];
  }
}

/**
 * Singleton instance management
 */
let claudeExecutor: ClaudeBrowserQueryExecutor | null = null;

export function getClaudeExecutor(): ClaudeBrowserQueryExecutor {
  if (!claudeExecutor) {
    claudeExecutor = new ClaudeBrowserQueryExecutor({
      maxRetries: 2, // Fewer retries than Perplexity due to OAuth complexity
      initialDelayMs: 2000,
      retryOn: {
        timeout: true,
        captcha: false, // Don't auto-retry CAPTCHA, requires human
        rateLimit: true,
        networkError: true,
      },
    });
  }
  return claudeExecutor;
}

export async function cleanupClaudeExecutor(): Promise<void> {
  if (claudeExecutor) {
    await claudeExecutor.cleanup();
    claudeExecutor = null;
  }
}
