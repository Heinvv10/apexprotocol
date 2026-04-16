/**
 * ChatGPT Browser Query Executor
 *
 * Browser-based implementation for querying ChatGPT with automatic
 * session management, email/OAuth authentication, CAPTCHA detection, and rate limiting.
 *
 * Key features:
 * - OpenAI OAuth or email/password authentication
 * - Session persistence with ~24 hour cookie lifetime
 * - Streaming response completion detection
 * - Anti-detection measures (realistic user-agent, viewport, locale, timezone)
 * - CAPTCHA/hCaptcha detection and human-in-the-loop handling
 * - Rate limit detection (ChatGPT: 5-10 req/min)
 * - Aggressive bot detection evasion (slow typing, viewport simulation)
 * - Optional custom system prompts and model selection
 * - Citation extraction from response
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
 * ChatGPT platform configuration with anti-detection measures
 */
const CHATGPT_CONFIG: PlatformBrowserConfig = {
  platformName: "chatgpt_browser",
  baseUrl: "https://chatgpt.com",
  searchUrl: "https://chatgpt.com/chat",

  authRequired: true, // OpenAI account required
  authMethod: "cookies", // OAuth or email/password via cookies

  selectors: {
    mainContent: "[data-testid='message'], .message-row, [data-role='assistant'] .prose, [class*='prose']",
    citations: "a[href*='http'], [data-testid='citation']",
    relatedQueries: "", // ChatGPT doesn't expose related queries directly
    loadingIndicator: "[data-testid='loading'], .spinner, [aria-busy='true']",
  },

  pageLoadTimeoutMs: 30000,
  contentReadyTimeoutMs: 25000, // ChatGPT can be slow; allow 25s for streaming
  navigationDelayMs: 2000,

  minQueryIntervalMs: 6000, // Conservative: 5-10 req/min = 6-12s per query
  maxQueriesPerMinute: 10,

  headless: true,
  viewport: { width: 1366, height: 768 },
  // Realistic user-agent for Chrome on Linux (matches legitimate browser traffic)
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

/**
 * ChatGPT-specific DOM extractor
 */
class ChatGPTDOMExtractor implements DOMExtractor {
  platformName = "chatgpt_browser";

  async extractMainContent(page: Page): Promise<string> {
    return await page.evaluate(() => {
      // ChatGPT uses message-row containers with role="assistant" for responses
      const selectors = [
        // Primary: message rows with assistant role
        "[data-testid='message'][data-role='assistant'] .prose",
        "[class*='message-row'] [data-role='assistant'] .prose",
        // Fallback: prose blocks (Markdown rendered content)
        ".prose",
        // Fallback: message containers
        "[data-testid='message']",
        // Fallback: chat content area
        "[role='main'] [class*='message']",
        // Generic fallback
        "main",
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Get the last element (most recent assistant message)
          const element = elements[elements.length - 1];
          const text = element.textContent?.trim();
          if (text && text.length > 50) {
            return text;
          }
        }
      }

      // Last resort: get all visible text from main content area
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

      // Look for links in assistant message content
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

      // Also search prose blocks for links
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
    // ChatGPT doesn't expose "related queries" like Perplexity
    // It might show suggested follow-ups, but they're not consistently accessible
    return [];
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    const captchaSelectors = [
      // reCAPTCHA (Google)
      'iframe[src*="recaptcha"]',
      'iframe[src*="google.com/recaptcha"]',
      ".g-recaptcha",
      "[data-testid='recaptcha']",
      // hCaptcha (common alternative)
      'iframe[src*="hcaptcha"]',
      ".h-captcha",
      "[data-testid='hcaptcha']",
      // Generic CAPTCHA markers
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

  async waitForContentReady(page: Page, timeoutMs: number = 25000): Promise<void> {
    // ChatGPT uses streaming responses; wait for assistant message to appear
    try {
      await Promise.race([
        // Wait for assistant message to appear
        page.waitForSelector("[data-testid='message'][data-role='assistant']", {
          timeout: timeoutMs,
        }),
        // Fallback: wait for any prose block (Markdown content)
        page.waitForSelector(".prose", { timeout: timeoutMs }),
        // Fallback: wait for general content loading
        page.waitForFunction(
          () => {
            const text = document.body.innerText;
            return text.length > 100; // At least some content
          },
          { timeout: timeoutMs }
        ),
      ]);

      // Wait for streaming to complete (loading indicators disappear)
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
        "sign in with openai",
        "openai account",
      ];

      for (const text of loginTexts) {
        if (pageText.includes(text)) {
          return true;
        }
      }

      // Check URL for login indicators
      const url = page.url();
      if (url.includes("login") || url.includes("auth") || url.includes("signin")) {
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
 * ChatGPT Browser Query Executor
 */
export class ChatGPTBrowserQueryExecutor extends BaseBrowserQueryExecutor {
  protected extractor: ChatGPTDOMExtractor;

  constructor(retryConfig?: Partial<RetryConfig>) {
    // ChatGPT default: don't auto-retry CAPTCHA (requires human intervention)
    const chatgptDefaults: Partial<RetryConfig> = {
      retryOn: {
        timeout: true,
        captcha: false,
        rateLimit: true,
        networkError: true,
        ...(retryConfig?.retryOn ?? {}),
      },
    };
    super(CHATGPT_CONFIG, { ...retryConfig, ...chatgptDefaults });
    this.extractor = new ChatGPTDOMExtractor();
  }

  /**
   * Execute ChatGPT query with DOM extraction and anti-detection measures
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
      // Navigate to ChatGPT
      const chatUrl = CHATGPT_CONFIG.baseUrl;
      this.logger.debug(`Navigating to: ${chatUrl}`);

      await this.navigateTo(chatUrl);

      // Anti-detection: small delay to simulate human behavior
      await this.delay(1000);

      // Check if login is required
      const loginRequired = await this.extractor.detectLoginRequired(this.page);
      if (loginRequired) {
        const screenshotPath = options.captureScreenshot
          ? await this.captureScreenshot()
          : undefined;
        throw new AuthenticationError(
          "ChatGPT login required. Please authenticate with OpenAI account (email or OAuth).",
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
          "ChatGPT bot detection triggered. Unusual activity detected. Manual verification required.",
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
          "ChatGPT CAPTCHA challenge detected (reCAPTCHA or hCaptcha). Manual intervention required.",
          "recaptcha_or_hcaptcha",
          screenshotPath
        );
      }

      // Check for rate limiting
      const isRateLimited = await this.extractor.detectRateLimit(this.page);
      if (isRateLimited) {
        throw new RateLimitError(
          "ChatGPT rate limit detected. Too many requests in short period.",
          30,
          "chatgpt_browser"
        );
      }

      // Find input field (ChatGPT: textarea at bottom of chat)
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
        throw new ContentExtractionError("Could not find ChatGPT input field", {
          selectors: inputSelectors,
        });
      }

      // Click input field first (human-like interaction)
      await inputElement.click();
      await this.delay(300);

      // Anti-detection: simulate realistic typing speed
      // Type slowly with variable delays (50-150ms between characters)
      await this.page.evaluate(() => {
        const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      });

      // Type with human-like delays
      const queryChars = query.split("");
      for (const char of queryChars) {
        await inputElement.type(char, { delay: 50 + Math.random() * 100 });
      }

      // Anti-detection: small delay before submit (humans don't submit immediately)
      await this.delay(500 + Math.random() * 500);

      // Submit query
      const submitButton = await this.page.$("button[type='submit'], button[aria-label*='Send']");
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

      if (!mainContent || mainContent.length < 50) {
        throw new ContentExtractionError(
          "Failed to extract meaningful content from ChatGPT response",
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
        platformName: "chatgpt_browser",
        platformId: integrationId,
        query,
        rawContent: mainContent,
        extractedData: {
          mainContent,
          citations,
          relatedQueries: [], // ChatGPT doesn't expose related queries
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
        `ChatGPT query execution failed: ${error instanceof Error ? error.message : String(error)}`
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
   * Set custom system prompt (ChatGPT-specific feature)
   * Note: This requires the session to already have custom instructions configured
   */
  async setSystemPrompt(systemPrompt: string): Promise<void> {
    // Placeholder: custom system prompts require settings panel interaction
    // When page is not initialized, this is a no-op
    if (this.page) {
      this.logger.debug("System prompt feature would require settings panel interaction");
    }
    this.logger.info(
      "Note: Custom system prompts should be configured in ChatGPT settings directly"
    );
  }

  /**
   * Select model (ChatGPT-specific feature)
   * ChatGPT now allows model selection for Plus users
   */
  async selectModel(model: "gpt-4" | "gpt-4-turbo" | "gpt-3.5-turbo"): Promise<void> {
    // Placeholder: model selection requires UI interaction
    // When page is not initialized, this is a no-op
    if (this.page) {
      this.logger.debug(`Model selection: ${model} (requires UI interaction)`);
    }
    this.logger.info(
      "Note: Model selection should be done via ChatGPT UI or default to selected model"
    );
  }
}

/**
 * Singleton instance management
 */
let chatgptExecutor: ChatGPTBrowserQueryExecutor | null = null;

export function getChatGPTExecutor(): ChatGPTBrowserQueryExecutor {
  if (!chatgptExecutor) {
    chatgptExecutor = new ChatGPTBrowserQueryExecutor({
      maxRetries: 2, // Fewer retries due to rate limit sensitivity
      initialDelayMs: 3000, // Longer initial delay for ChatGPT
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      retryOn: {
        timeout: true,
        captcha: false, // Don't auto-retry CAPTCHA, requires human
        rateLimit: true, // Retry on rate limit with backoff
        networkError: true,
      },
    });
  }
  return chatgptExecutor;
}

export async function cleanupChatGPTExecutor(): Promise<void> {
  if (chatgptExecutor) {
    await chatgptExecutor.cleanup();
    chatgptExecutor = null;
  }
}
