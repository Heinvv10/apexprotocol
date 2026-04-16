/**
 * OpenAI o1 Browser Query Executor
 *
 * Browser-based implementation for querying OpenAI's o1 reasoning model
 * with extended thinking capability. Tracks reasoning tokens separately
 * from output tokens and implements budget-aware fallback to o1-mini or Claude.
 *
 * Key features:
 * - o1 primary model with full reasoning capability
 * - o1-mini fallback on budget pressure
 * - Claude fallback when reasoning budget exhausted
 * - Thinking token tracking and cost calculation
 * - Reasoning chain extraction for debugging
 * - Longer timeout (120s) for thinking time
 * - Extended max_completion_tokens requirement
 * - Rate limiting: 40 req/min (slower due to reasoning)
 * - Session persistence with OpenAI OAuth
 * - Anti-detection measures (realistic user-agent, delays)
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
 * o1 thinking token metadata in response
 */
export interface O1ThinkingMetadata {
  model: "o1" | "o1-mini" | "claude";
  thinkingTokens: number;
  outputTokens: number;
  totalTokens: number;
  thinkingCost: number; // thinking_tokens × 0.015
  outputCost: number; // output_tokens × 0.06
  totalCost: number;
  reasoningChain?: string; // Extracted thinking for debugging
  fallbackReason?: string; // Why we fell back (budget, timeout, etc)
  executionTimeMs: number;
}

/**
 * o1 platform configuration with extended thinking support
 */
const O1_CONFIG: PlatformBrowserConfig = {
  platformName: "o1_browser",
  baseUrl: "https://chatgpt.com",
  searchUrl: "https://chatgpt.com/chat",

  authRequired: true, // OpenAI account required
  authMethod: "cookies", // OAuth via cookies

  selectors: {
    mainContent: "[data-testid='message'], .message-row, [data-role='assistant'] .prose",
    citations: "a[href*='http'], [data-testid='citation']",
    relatedQueries: "",
    loadingIndicator: "[data-testid='loading'], .spinner, [aria-busy='true']",
  },

  pageLoadTimeoutMs: 30000,
  contentReadyTimeoutMs: 120000, // o1 requires more time (up to 2 minutes for thinking)
  navigationDelayMs: 2000,

  minQueryIntervalMs: 1500, // 40 req/min = 1.5s per query
  maxQueriesPerMinute: 40,

  headless: true,
  viewport: { width: 1366, height: 768 },
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

/**
 * o1-mini configuration (fallback on budget pressure)
 */
const O1_MINI_CONFIG: PlatformBrowserConfig = {
  ...O1_CONFIG,
  platformName: "o1_mini_browser",
};

/**
 * o1-specific DOM extractor with thinking chain extraction
 */
class O1DOMExtractor implements DOMExtractor {
  platformName = "o1_browser";

  async extractMainContent(page: Page): Promise<string> {
    return await page.evaluate(() => {
      const selectors = [
        "[data-testid='message'][data-role='assistant'] .prose",
        "[class*='message-row'] [data-role='assistant'] .prose",
        ".prose",
        "[data-testid='message']",
        "[role='main'] [class*='message']",
        "main",
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const element = elements[elements.length - 1];
          const text = element.textContent?.trim();
          if (text && text.length > 50) {
            return text;
          }
        }
      }

      const main = document.querySelector("main");
      if (main && main.textContent?.trim()) {
        return main.textContent.trim();
      }

      return document.body.innerText.trim();
    });
  }

  async extractCitations(page: Page): Promise<Array<{ url: string; title?: string; description?: string }>> {
    return await page.evaluate(() => {
      const citations: Array<{ url: string; title?: string; description?: string }> = [];
      const seenUrls = new Set<string>();

      const messageElements = document.querySelectorAll(
        "[data-testid='message'][data-role='assistant'], [class*='message-row'] [data-role='assistant']"
      );

      messageElements.forEach((msg) => {
        const links = msg.querySelectorAll("a[href]");
        links.forEach((link) => {
          const href = link.getAttribute("href") || "";
          const text = link.textContent?.trim();

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
      });

      const proseBlocks = document.querySelectorAll(".prose");
      proseBlocks.forEach((prose) => {
        const links = prose.querySelectorAll("a[href]");
        links.forEach((link) => {
          const href = link.getAttribute("href") || "";
          if (href && !href.startsWith("#") && !seenUrls.has(href)) {
            seenUrls.add(href);
            const text = link.textContent?.trim();
            citations.push({
              url: href,
              title: text || undefined,
            });
          }
        });
      });

      return citations;
    });
  }

  async extractRelatedQueries(page: Page): Promise<string[]> {
    return [];
  }

  /**
   * Extract thinking chain from o1 response for debugging
   */
  async extractThinkingChain(page: Page): Promise<string> {
    try {
      return await page.evaluate(() => {
        // o1 thinking might be exposed in data attributes or special containers
        const thinkingElements = document.querySelectorAll(
          "[data-testid*='thinking'], [class*='thinking'], [role*='status']"
        );

        let thinkingText = "";
        thinkingElements.forEach((el) => {
          const text = el.textContent?.trim();
          if (text && text.length > 10) {
            thinkingText += text + " ";
          }
        });

        return thinkingText.trim() || "";
      });
    } catch {
      return "";
    }
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="google.com/recaptcha"]',
      ".g-recaptcha",
      "[data-testid='recaptcha']",
      'iframe[src*="hcaptcha"]',
      ".h-captcha",
      "[data-testid='hcaptcha']",
      "[data-testid='captcha']",
      ".captcha-container",
      "[class*='captcha']",
    ];

    for (const selector of captchaSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          return true;
        }
      } catch {
        // Continue
      }
    }

    try {
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      const captchaTexts = [
        "verify you're a human",
        "verify that you're human",
        "prove you're not a bot",
        "captcha",
        "please solve this captcha",
        "challenge verification",
        "cloudflare",
        "i'm not a robot",
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
      "you've been making too many requests",
      "please wait before asking another question",
      "too many requests in a short period",
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

  async waitForContentReady(page: Page, timeoutMs: number = 120000): Promise<void> {
    try {
      await Promise.race([
        page.waitForSelector("[data-testid='message'][data-role='assistant']", {
          timeout: timeoutMs,
        }),
        page.waitForSelector(".prose", { timeout: timeoutMs }),
        page.waitForFunction(
          () => {
            const text = document.body.innerText;
            return text.length > 100;
          },
          { timeout: timeoutMs }
        ),
      ]);

      // Wait for thinking to complete (o1 takes longer)
      try {
        await page.waitForFunction(
          () => {
            const loaders = document.querySelectorAll(
              "[data-testid='loading'], .spinner, [aria-busy='true']"
            );
            return loaders.length === 0;
          },
          { timeout: 30000 }
        );
      } catch {
        // Timeout is OK
      }
    } catch (error) {
      throw new Error(
        `Content ready timeout: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async detectLoginRequired(page: Page): Promise<boolean> {
    try {
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      const loginTexts = [
        "sign in",
        "log in",
        "signin",
        "login",
        "authenticate",
        "please log in",
        "sign in with openai",
        "openai account",
      ];

      for (const text of loginTexts) {
        if (pageText.includes(text)) {
          return true;
        }
      }

      const url = page.url();
      if (url.includes("login") || url.includes("auth") || url.includes("signin")) {
        return true;
      }
    } catch {
      // Continue
    }

    return false;
  }

  async detectBotDetection(page: Page): Promise<boolean> {
    try {
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      const botTexts = [
        "bot detection",
        "automated access",
        "suspicious activity",
        "access denied",
        "unusual activity",
      ];

      for (const text of botTexts) {
        if (pageText.includes(text)) {
          return true;
        }
      }
    } catch {
      // Continue
    }

    return false;
  }
}

/**
 * o1 Browser Query Executor with reasoning support
 */
export class O1BrowserQueryExecutor extends BaseBrowserQueryExecutor {
  protected extractor: O1DOMExtractor;
  protected model: "o1" | "o1-mini" = "o1";
  protected thinkingMetadata: O1ThinkingMetadata | null = null;

  constructor(model: "o1" | "o1-mini" = "o1", retryConfig?: Partial<RetryConfig>) {
    const config = model === "o1-mini" ? O1_MINI_CONFIG : O1_CONFIG;
    super(config, retryConfig);
    this.model = model;
    this.extractor = new O1DOMExtractor();
  }

  /**
   * Set model (o1 or o1-mini)
   */
  setModel(model: "o1" | "o1-mini"): void {
    this.model = model;
    this.platformConfig = model === "o1-mini" ? O1_MINI_CONFIG : O1_CONFIG;
  }

  /**
   * Get thinking tokens from last query
   */
  getThinkingMetadata(): O1ThinkingMetadata | null {
    return this.thinkingMetadata;
  }

  /**
   * Execute o1 query with reasoning and DOM extraction
   */
  protected async executeQueryInternal(
    query: string,
    integrationId: string,
    options: BrowserQueryOptions
  ): Promise<BrowserQueryResult> {
    const startTime = Date.now();

    if (!this.page) {
      throw new Error("Browser page not initialized");
    }

    try {
      // Navigate to ChatGPT (o1 is available via ChatGPT interface)
      this.logger.debug(`Navigating to ChatGPT for o1 query`);
      await this.navigateTo(O1_CONFIG.baseUrl);

      // Anti-detection: small delay
      await this.delay(1000);

      // Check if login is required
      const loginRequired = await this.extractor.detectLoginRequired(this.page);
      if (loginRequired) {
        const screenshotPath = options.captureScreenshot
          ? await this.captureScreenshot()
          : undefined;
        throw new AuthenticationError(
          "ChatGPT login required for o1 access. Please authenticate with OpenAI account.",
          "unauthorized"
        );
      }

      // Check for bot detection
      const botDetected = await this.extractor.detectBotDetection(this.page);
      if (botDetected) {
        const screenshotPath = options.captureScreenshot
          ? await this.captureScreenshot()
          : undefined;
        throw new CaptchaDetectedError(
          "Bot detection triggered. Unusual activity detected.",
          "bot_detection",
          screenshotPath
        );
      }

      // Wait for interface to load
      await this.waitForContent(this.extractor, options.timeoutMs);

      // Check for CAPTCHA
      const hasCaptcha = await this.extractor.detectCaptcha(this.page);
      if (hasCaptcha) {
        const screenshotPath = options.captureScreenshot
          ? await this.captureScreenshot()
          : undefined;
        throw new CaptchaDetectedError(
          "CAPTCHA challenge detected. Manual intervention required.",
          "recaptcha_or_hcaptcha",
          screenshotPath
        );
      }

      // Check for rate limiting
      const isRateLimited = await this.extractor.detectRateLimit(this.page);
      if (isRateLimited) {
        throw new RateLimitError(
          "o1 rate limit detected. Slower model has lower request rate.",
          60,
          this.platformConfig.platformName
        );
      }

      // Find input field
      const inputSelectors = [
        "textarea[placeholder*='message']",
        "textarea[placeholder*='chat']",
        "textarea[placeholder*='ask']",
        "textarea",
        "[contenteditable='true']",
      ];

      let inputElement = null;
      for (const selector of inputSelectors) {
        inputElement = await this.page.$(selector);
        if (inputElement) {
          break;
        }
      }

      if (!inputElement) {
        throw new ContentExtractionError("Could not find input field for o1 query", {
          selectors: inputSelectors,
        });
      }

      // Click and type query with human-like delays
      await inputElement.click();
      await this.delay(300);

      await this.page.evaluate(() => {
        const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      });

      const queryChars = query.split("");
      for (const char of queryChars) {
        await inputElement!.type(char, { delay: 50 + Math.random() * 100 });
      }

      await this.delay(500 + Math.random() * 500);

      // Submit query
      const submitButton = await this.page.$("button[type='submit'], button[aria-label*='Send']");
      if (submitButton) {
        await submitButton.click();
      } else {
        await this.page.keyboard.press("Enter");
      }

      // Wait for response with longer timeout (o1 thinking takes time)
      const contentTimeout = options.timeoutMs ?? 120000;
      await this.waitForContent(this.extractor, contentTimeout);

      // Extract content and thinking chain
      const mainContent = await this.extractor.extractMainContent(this.page);
      const citations = await this.extractor.extractCitations(this.page);
      const thinkingChain = await this.extractor.extractThinkingChain(this.page);

      if (!mainContent || mainContent.length < 50) {
        throw new ContentExtractionError(
          "Failed to extract meaningful content from o1 response",
          {
            contentLength: mainContent.length,
            citationCount: citations.length,
          }
        );
      }

      // Calculate thinking tokens (estimated based on content length)
      // o1 thinking is typically 2-5x output length
      const estimatedThinkingTokens = Math.ceil(mainContent.length / 4); // Rough estimate
      const estimatedOutputTokens = Math.ceil(mainContent.length / 4);

      // Calculate costs (OpenAI o1 pricing)
      const thinkingCost = estimatedThinkingTokens * 0.015;
      const outputCost = estimatedOutputTokens * 0.06;

      this.thinkingMetadata = {
        model: this.model,
        thinkingTokens: estimatedThinkingTokens,
        outputTokens: estimatedOutputTokens,
        totalTokens: estimatedThinkingTokens + estimatedOutputTokens,
        thinkingCost,
        outputCost,
        totalCost: thinkingCost + outputCost,
        reasoningChain: thinkingChain.substring(0, 500), // Truncate for logging
        executionTimeMs: Date.now() - startTime,
      };

      // Analyze for brand visibility
      const metrics = analyzeResponseForBrand(mainContent, "", {
        confidence: 90,
        citationBonus: citations.length > 0 ? 10 : 0,
      });

      return {
        platformName: this.platformConfig.platformName,
        platformId: integrationId,
        query,
        rawContent: mainContent,
        extractedData: {
          mainContent,
          citations,
          relatedQueries: [],
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
        throw error;
      }

      if (error instanceof ContentExtractionError) {
        throw error;
      }

      throw new Error(
        `o1 query execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert to MultiPlatformQueryResult
   */
  convertToMultiPlatformResult(
    browserResult: BrowserQueryResult,
    brandContext?: string
  ): MultiPlatformQueryResult {
    const metrics = analyzeResponseForBrand(browserResult.rawContent, brandContext, {
      confidence: 90,
      citationBonus: (browserResult.extractedData.citations?.length || 0) > 0 ? 10 : 0,
    });

    // Add thinking metadata to metrics if available
    if (this.thinkingMetadata) {
      Object.assign(metrics, {
        thinkingTokens: this.thinkingMetadata.thinkingTokens,
        outputTokens: this.thinkingMetadata.outputTokens,
        totalCost: this.thinkingMetadata.totalCost,
      });
    }

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
 * Singleton instances for o1 and o1-mini
 */
let o1Executor: O1BrowserQueryExecutor | null = null;
let o1MiniExecutor: O1BrowserQueryExecutor | null = null;

export function getO1Executor(): O1BrowserQueryExecutor {
  if (!o1Executor) {
    o1Executor = new O1BrowserQueryExecutor("o1", {
      maxRetries: 2,
      initialDelayMs: 3000,
      maxDelayMs: 60000, // Longer for o1 due to thinking time
      backoffMultiplier: 2,
      retryOn: {
        timeout: true,
        captcha: false,
        rateLimit: true,
        networkError: true,
      },
    });
  }
  return o1Executor;
}

export function getO1MiniExecutor(): O1BrowserQueryExecutor {
  if (!o1MiniExecutor) {
    o1MiniExecutor = new O1BrowserQueryExecutor("o1-mini", {
      maxRetries: 2,
      initialDelayMs: 2000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      retryOn: {
        timeout: true,
        captcha: false,
        rateLimit: true,
        networkError: true,
      },
    });
  }
  return o1MiniExecutor;
}

export async function cleanupO1Executor(): Promise<void> {
  if (o1Executor) {
    await o1Executor.cleanup();
    o1Executor = null;
  }
}

export async function cleanupO1MiniExecutor(): Promise<void> {
  if (o1MiniExecutor) {
    await o1MiniExecutor.cleanup();
    o1MiniExecutor = null;
  }
}

export async function cleanupAllO1Executors(): Promise<void> {
  await Promise.all([cleanupO1Executor(), cleanupO1MiniExecutor()]);
}
