/**
 * Gemini Browser Query Executor
 *
 * Browser-based implementation for querying Google Gemini with automatic
 * session management, Google OAuth authentication, CAPTCHA detection, and rate limiting.
 *
 * Key features:
 * - Google OAuth/2FA authentication with session persistence
 * - Multi-turn conversation context management
 * - Streaming response completion detection
 * - Citation extraction from response
 * - Related searches/suggestions detection
 * - Aggressive anti-detection measures (Chrome DevTools Protocol evasion)
 * - CAPTCHA and 2FA detection with human-in-the-loop handling
 * - Rate limit detection (Google: ~3-5 req/min)
 * - Model detection and selection
 * - ~30 day Google session cookie persistence
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
import type { VisibilityMetrics } from "@/lib/db/schema/platform-registry";
import { analyzeResponseForBrand } from "../monitoring/integrations/shared-analysis";

/**
 * Gemini platform configuration with aggressive anti-detection measures
 */
const GEMINI_CONFIG: PlatformBrowserConfig = {
  platformName: "gemini_browser",
  baseUrl: "https://gemini.google.com",
  searchUrl: "https://gemini.google.com/app", // App interface

  authRequired: true, // Google Account required
  authMethod: "cookies", // Google OAuth via cookies

  selectors: {
    mainContent: "[role='region'], .message, [role='article'], [data-testid='response']",
    citations: "a[href*='http'], [data-testid='citation']",
    relatedQueries: "[data-testid='related-searches'] button, .related-searches li, .suggestions button",
    loadingIndicator: "[data-testid='loading'], .spinner, [aria-busy='true'], .typing-indicator",
  },

  pageLoadTimeoutMs: 30000,
  contentReadyTimeoutMs: 28000, // Gemini can be slow with streaming
  navigationDelayMs: 2000,

  minQueryIntervalMs: 12000, // Conservative: 3-5 req/min = 12-20s per query
  maxQueriesPerMinute: 5,

  headless: true,
  viewport: { width: 1366, height: 768 },
  // Realistic Chrome user-agent (Google signature detection avoidance)
  // Include mobile-like variations to blend in
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Google Chrome/125.0.6422.142",
};

/**
 * Gemini-specific DOM extractor
 */
class GeminiDOMExtractor implements DOMExtractor {
  platformName = "gemini_browser";

  async extractMainContent(page: Page): Promise<string> {
    return await page.evaluate(() => {
      // Gemini uses various content structures; try multiple selectors
      const selectors = [
        // Primary: message containers with proper role
        "[role='region'] [role='article']",
        "[role='article']",
        ".message",
        "[data-testid='response']",
        // Fallback: prose/markdown content
        "[class*='prose']",
        "[class*='markdown']",
        // Generic content areas
        "[role='main']",
        "main",
      ];

      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            // Get the last element (most recent response)
            const element = elements[elements.length - 1];
            const text = element.textContent?.trim();
            if (text && text.length > 50) {
              return text;
            }
          }
        } catch {
          // Selector error, continue
        }
      }

      // Last resort: get all visible text from main content area
      const main = document.querySelector("[role='main']") || document.querySelector("main");
      if (main && main.textContent?.trim()) {
        const text = main.textContent.trim();
        if (text.length > 50) {
          return text;
        }
      }

      return document.body.innerText.trim();
    });
  }

  async extractCitations(page: Page): Promise<Array<{ url: string; title?: string; description?: string }>> {
    return await page.evaluate(() => {
      const citations: Array<{ url: string; title?: string; description?: string }> = [];
      const seenUrls = new Set<string>();

      // Look for links in response content
      const responseElements = document.querySelectorAll("[role='article'], [data-testid='response'], .message");

      responseElements.forEach((msg) => {
        try {
          const links = msg.querySelectorAll("a[href]");
          links.forEach((link) => {
            const href = link.getAttribute("href") || "";
            const text = link.textContent?.trim();

            if (
              href &&
              !href.startsWith("#") &&
              !href.startsWith("javascript:") &&
              !href.startsWith("google.com/search") &&
              !seenUrls.has(href) &&
              text &&
              text.length > 0
            ) {
              seenUrls.add(href);
              citations.push({
                url: href,
                title: text,
              });
            }
          });
        } catch {
          // Continue
        }
      });

      // Also search prose/markdown blocks for links
      const contentBlocks = document.querySelectorAll("[class*='prose'], [class*='markdown']");
      contentBlocks.forEach((block) => {
        try {
          const links = block.querySelectorAll("a[href]");
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
        } catch {
          // Continue
        }
      });

      return citations;
    });
  }

  async extractRelatedQueries(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const relatedQueries: string[] = [];

      // Gemini shows related searches/suggestions
      const relatedSelectors = [
        "[data-testid='related-searches']",
        ".related-searches",
        ".suggestions",
        "[class*='related']",
        "[class*='suggestion']",
      ];

      for (const selector of relatedSelectors) {
        try {
          const section = document.querySelector(selector);
          if (section) {
            const items = section.querySelectorAll("button, li, a, [role='button']");
            items.forEach((item) => {
              const text = item.textContent?.trim();
              if (text && text.length < 200 && text.length > 5) {
                relatedQueries.push(text);
              }
            });
          }
        } catch {
          // Continue
        }
      }

      return relatedQueries.slice(0, 5);
    });
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    const captchaSelectors = [
      // Google reCAPTCHA
      'iframe[src*="recaptcha"]',
      'iframe[src*="google.com/recaptcha"]',
      ".g-recaptcha",
      "[data-testid='recaptcha']",
      "[aria-label*='recaptcha']",
      // Google challenge page
      'form[action*="identify"]',
      '[jsname="oJeZkb"]', // Google CAPTCHA container
      // hCaptcha alternative
      'iframe[src*="hcaptcha"]',
      ".h-captcha",
      "[data-testid='hcaptcha']",
      // Generic CAPTCHA markers
      "[data-testid='captcha']",
      ".captcha-container",
      "[class*='captcha']",
      "[class*='challenge']",
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
        "verify you're a human",
        "verify that you're human",
        "prove you're not a bot",
        "captcha",
        "please solve this captcha",
        "challenge verification",
        "suspicious activity",
        "verify it's you",
        "prove it's you",
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
      "please wait",
      "too many queries",
      "come back later",
      "quota exceeded",
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

  async waitForContentReady(page: Page, timeoutMs: number = 28000): Promise<void> {
    // Gemini uses streaming responses; wait for response to appear and complete.
    // Attach a silent .catch() to each race branch so the loser's eventual
    // rejection (e.g. "detached Frame" after cleanup) doesn't surface as an
    // unhandled rejection once the race has already settled.
    const selectorPromise = page.waitForSelector(
      "[role='article'], .message, [data-testid='response']",
      { timeout: timeoutMs }
    );
    const fallbackPromise = page.waitForFunction(
      () => document.body.innerText.length > 100,
      { timeout: timeoutMs }
    );
    selectorPromise.catch(() => {});
    fallbackPromise.catch(() => {});

    try {
      await Promise.race([selectorPromise, fallbackPromise]);

      // Wait for streaming to complete (loading indicators disappear)
      try {
        await page.waitForFunction(
          () => {
            const loaders = document.querySelectorAll(
              "[data-testid='loading'], .spinner, [aria-busy='true'], .typing-indicator"
            );
            return loaders.length === 0;
          },
          { timeout: 15000 }
        );
      } catch {
        // Timeout is OK; content may still be valid even if streaming not fully complete
      }
    } catch (error) {
      throw new Error(
        `Content ready timeout: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Detect if login is required
   */
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
        "sign in with google",
        "google account",
        "accounts.google.com",
      ];

      for (const text of loginTexts) {
        if (pageText.includes(text)) {
          return true;
        }
      }

      // Check URL for login indicators
      const url = page.url();
      if (
        url.includes("accounts.google.com") ||
        url.includes("/signin") ||
        url.includes("/login") ||
        url.includes("/auth")
      ) {
        return true;
      }
    } catch {
      // Continue
    }

    return false;
  }

  /**
   * Detect 2FA requirement
   */
  async detect2FARequired(page: Page): Promise<boolean> {
    try {
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      const twoFATexts = [
        "2-step verification",
        "2fa",
        "two-factor",
        "verification code",
        "enter your code",
        "check your phone",
        "authenticator app",
        "recovery code",
      ];

      for (const text of twoFATexts) {
        if (pageText.includes(text)) {
          return true;
        }
      }

      // Check URL for 2FA indicators
      const url = page.url();
      if (url.includes("/signin/challenge") || url.includes("/signin/2fa")) {
        return true;
      }
    } catch {
      // Continue
    }

    return false;
  }

  /**
   * Detect bot detection / security challenge
   */
  async detectBotDetection(page: Page): Promise<boolean> {
    try {
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      const botTexts = [
        "bot detection",
        "automated access",
        "suspicious activity",
        "access denied",
        "unusual activity",
        "unauthorized access",
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

  /**
   * Detect current model
   */
  async detectCurrentModel(page: Page): Promise<string | null> {
    try {
      const model = await page.evaluate(() => {
        // Look for model selector or display
        const modelSelectors = [
          "[data-testid='model-selector']",
          "[aria-label*='model']",
          "[class*='model']",
          "[data-current-model]",
        ];

        for (const selector of modelSelectors) {
          try {
            const element = document.querySelector(selector);
            if (element && element.textContent) {
              const text = element.textContent.trim();
              if (text.includes("Gemini") || text.includes("Claude") || text.includes("GPT")) {
                return text;
              }
            }
          } catch {
            // Continue
          }
        }

        return null;
      });

      return model;
    } catch {
      return null;
    }
  }
}

/**
 * Gemini Browser Query Executor
 */
/**
 * Gemini-specific retry defaults applied at construction time so that
 * `new GeminiBrowserQueryExecutor()` (no args) reflects Gemini's strict
 * rate-limit requirements without callers having to pass them explicitly.
 */
const GEMINI_DEFAULT_RETRY: Partial<RetryConfig> = {
  maxRetries: 2,
  initialDelayMs: 5000,
  maxDelayMs: 60000,
  backoffMultiplier: 2.5,
  retryOn: {
    timeout: true,
    captcha: false, // CAPTCHA/2FA requires human; don't auto-retry
    rateLimit: true,
    networkError: true,
  },
};

export class GeminiBrowserQueryExecutor extends BaseBrowserQueryExecutor {
  protected extractor: GeminiDOMExtractor;

  constructor(retryConfig?: Partial<RetryConfig>) {
    // Merge Gemini defaults first, then caller overrides on top
    super(GEMINI_CONFIG, { ...GEMINI_DEFAULT_RETRY, ...retryConfig });
    this.extractor = new GeminiDOMExtractor();
  }

  /**
   * Execute Gemini query with DOM extraction and aggressive anti-detection measures
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
      // Enhanced anti-detection: disable headless indicators
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => false,
        });
        Object.defineProperty(navigator, "plugins", {
          get: () => [1, 2, 3, 4, 5],
        });
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"],
        });
        (window as any).chrome = {
          runtime: {},
        };
      });

      // Navigate to Gemini
      const geminiUrl = GEMINI_CONFIG.baseUrl + "/app";
      this.logger.debug(`Navigating to: ${geminiUrl}`);

      await this.navigateTo(geminiUrl);

      // Anti-detection: human-like delay
      await this.delay(1500 + Math.random() * 1000);

      // Check if login is required
      const loginRequired = await this.extractor.detectLoginRequired(this.page);
      if (loginRequired) {
        const screenshotPath = options.captureScreenshot
          ? await this.captureScreenshot()
          : undefined;
        throw new AuthenticationError(
          "Gemini login required. Please authenticate with Google Account (may require 2FA).",
          "unauthorized"
        );
      }

      // Check for 2FA requirement
      const twoFARequired = await this.extractor.detect2FARequired(this.page);
      if (twoFARequired) {
        const screenshotPath = options.captureScreenshot
          ? await this.captureScreenshot()
          : undefined;
        throw new CaptchaDetectedError(
          "Gemini 2FA (Two-Factor Authentication) required. Please verify via phone, authenticator app, or recovery code. Manual intervention needed.",
          "google_2fa",
          screenshotPath
        );
      }

      // Check for bot detection
      const botDetected = await this.extractor.detectBotDetection(this.page);
      if (botDetected) {
        const screenshotPath = options.captureScreenshot
          ? await this.captureScreenshot()
          : undefined;
        throw new CaptchaDetectedError(
          "Gemini bot detection triggered. Unusual activity detected. Manual verification required.",
          "bot_detection",
          screenshotPath
        );
      }

      // Wait for chat interface to load
      await this.waitForContent(this.extractor);

      // Check for CAPTCHA
      const hasCaptcha = await this.extractor.detectCaptcha(this.page);
      if (hasCaptcha) {
        const screenshotPath = options.captureScreenshot
          ? await this.captureScreenshot()
          : undefined;
        throw new CaptchaDetectedError(
          "Gemini CAPTCHA challenge detected (reCAPTCHA). Google is very aggressive about CAPTCHA. Manual intervention required.",
          "google_recaptcha",
          screenshotPath
        );
      }

      // Check for rate limiting
      const isRateLimited = await this.extractor.detectRateLimit(this.page);
      if (isRateLimited) {
        throw new RateLimitError(
          "Gemini rate limit detected. Google enforces strict rate limits (~3-5 req/min).",
          60,
          "gemini_browser"
        );
      }

      // Find input field (Gemini: textarea or contenteditable)
      const inputSelectors = [
        "textarea[placeholder*='message']",
        "textarea[placeholder*='ask']",
        "textarea[placeholder*='chat']",
        "textarea",
        "[contenteditable='true'][role='textbox']",
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
        throw new ContentExtractionError("Could not find Gemini input field", {
          selectors: inputSelectors,
        });
      }

      // Click input field first (human-like interaction)
      await inputElement.click();
      await this.delay(400 + Math.random() * 300);

      // Anti-detection: simulate realistic typing speed with variable delays
      // Type slowly with delays between 60-180ms per character
      await this.page.evaluate(() => {
        const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      });

      // Type with human-like delays
      const queryChars = query.split("");
      for (const char of queryChars) {
        await inputElement.type(char, { delay: 60 + Math.random() * 120 });
      }

      // Anti-detection: variable delay before submit
      await this.delay(800 + Math.random() * 700);

      // Submit query
      const submitButton = await this.page.$("button[type='submit'], button[aria-label*='Send'], [aria-label*='send']");
      if (submitButton) {
        await submitButton.click();
      } else {
        // Fallback: press Enter
        await this.page.keyboard.press("Enter");
      }

      // Wait for response to arrive and streaming to complete
      await this.waitForContent(this.extractor);

      // Extract content
      const mainContent = await this.extractor.extractMainContent(this.page);
      const citations = await this.extractor.extractCitations(this.page);
      const relatedQueries = await this.extractor.extractRelatedQueries(this.page);
      const currentModel = await this.extractor.detectCurrentModel(this.page);

      if (!mainContent || mainContent.length < 50) {
        throw new ContentExtractionError(
          "Failed to extract meaningful content from Gemini response",
          {
            contentLength: mainContent.length,
            citationCount: citations.length,
          }
        );
      }

      // Analyze for brand visibility
      const metrics = analyzeResponseForBrand(mainContent, "", {
        confidence: 90,
        citationBonus: citations.length > 0 ? 10 : 0,
      });

      return {
        platformName: "gemini_browser",
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
        `Gemini query execution failed: ${error instanceof Error ? error.message : String(error)}`
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
let geminiExecutor: GeminiBrowserQueryExecutor | null = null;

export function getGeminiExecutor(): GeminiBrowserQueryExecutor {
  if (!geminiExecutor) {
    geminiExecutor = new GeminiBrowserQueryExecutor({
      maxRetries: 2, // Fewer retries due to rate limit sensitivity
      initialDelayMs: 5000, // Longer initial delay for Gemini (stricter rate limit)
      maxDelayMs: 60000,
      backoffMultiplier: 2.5, // More aggressive backoff
      retryOn: {
        timeout: true,
        captcha: false, // Don't auto-retry CAPTCHA/2FA, requires human
        rateLimit: true, // Retry on rate limit with backoff
        networkError: true,
      },
    });
  }
  return geminiExecutor;
}

export async function cleanupGeminiExecutor(): Promise<void> {
  if (geminiExecutor) {
    await geminiExecutor.cleanup();
    geminiExecutor = null;
  }
}
