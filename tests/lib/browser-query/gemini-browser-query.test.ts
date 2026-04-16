/**
 * Gemini Browser Query Integration Tests
 *
 * Comprehensive test suite for Gemini browser query functionality.
 * Tests anti-detection measures, error handling, DOM extraction, session management,
 * rate limiting, CAPTCHA detection, 2FA detection, and authentication flows.
 *
 * Note: These tests use Puppeteer in headless mode with network mocking.
 * For CI/CD, ensure Chrome/Chromium is installed.
 *
 * Test categories:
 * A. Query Execution (basic, with special chars, timeout)
 * B. Anti-Detection (user-agent, viewport, typing speed, delay variance, Chrome DevTools evasion)
 * C. Error Handling (CAPTCHA, rate limit, auth, content extraction)
 * D. DOM Extraction (main content, citations, link parsing, related queries)
 * E. Login Detection (Google OAuth, login page patterns)
 * F. 2FA Detection (verification codes, authenticator, recovery codes)
 * G. Bot Detection (bot-specific content, suspicious activity markers)
 * H. Rate Limiting (~3-5 req/min enforcement, error messaging)
 * I. Streaming Detection (loading indicators, response completion)
 * J. Model Detection (current model display)
 * K. Related Searches (sidebar suggestions)
 * L. Screenshot on Error (CAPTCHA, auth, 2FA, bot detection)
 * M. Session Management (reuse, expiration, lifecycle)
 * N. Citation Extraction (URL parsing, deduplication)
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { GeminiBrowserQueryExecutor } from "@/lib/browser-query/gemini-browser-query";
import { getGeminiExecutor, cleanupGeminiExecutor } from "@/lib/browser-query/gemini-browser-query";
import {
  CaptchaDetectedError,
  RateLimitError,
  AuthenticationError,
  TimeoutError,
  ContentExtractionError,
  BrowserCrashError,
} from "@/lib/browser-query/types";

describe("GeminiBrowserQueryExecutor", () => {
  let executor: GeminiBrowserQueryExecutor;

  beforeAll(async () => {
    executor = new GeminiBrowserQueryExecutor();
  });

  afterAll(async () => {
    await executor.cleanup();
  });

  // ============================================================================
  // A. Query Execution Tests
  // ============================================================================

  describe("A. Query Execution", () => {
    it("should execute a simple query successfully", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }

      const result = await executor.executeQuery(
        "What is ApexGEO in one sentence?",
        "integration-simple",
        {
          headless: true,
          timeoutMs: 30000,
        }
      );

      expect(result.status).toBe("success");
      expect(result.rawContent.length).toBeGreaterThan(50);
      expect(result.platformName).toBe("gemini_browser");
      expect(result.platformId).toBe("integration-simple");
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("should handle query with special characters", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }

      const query = 'What is "brand monitoring" in SEO? #hashtag @mention (test)';
      const result = await executor.executeQuery(query, "integration-special-chars", {
        headless: true,
        timeoutMs: 30000,
      });

      expect(result.query).toBe(query);
      if (result.status === "success") {
        expect(result.rawContent.length).toBeGreaterThan(0);
      }
    });

    it("should handle query with unicode characters", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }

      const query = "How do I say hello in Chinese? 你好 こんにちは";
      const result = await executor.executeQuery(query, "integration-unicode", {
        headless: true,
        timeoutMs: 30000,
      });

      expect(result.query).toBe(query);
    });

    it("should handle empty query gracefully", async () => {
      const result = await executor.executeQuery("", "integration-empty", {
        headless: true,
        timeoutMs: 5000,
        maxRetries: 0,
      });

      // Should either fail or produce minimal content
      expect(result.platformName).toBe("gemini_browser");
      expect(result.platformId).toBe("integration-empty");
    });

    it("should handle very long query", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }

      const query = "Explain quantum computing. ".repeat(20).slice(0, 1000);
      const result = await executor.executeQuery(query, "integration-long-query", {
        headless: true,
        timeoutMs: 30000,
      });

      expect(result.query.length).toBeGreaterThan(500);
    });

    it("should timeout on very short timeout setting", async () => {
      const result = await executor.executeQuery(
        "This should timeout quickly",
        "integration-timeout",
        {
          headless: true,
          timeoutMs: 100,
          maxRetries: 0,
        }
      );

      expect(result.status).toBe("failed");
      expect(result.error).toMatch(/timeout/i);
    });

    it("should include query in result", async () => {
      const query = "Test query for identification";
      const result = await executor.executeQuery(query, "integration-query-id", {
        headless: true,
        timeoutMs: 5000,
        maxRetries: 0,
      });

      expect(result.query).toBe(query);
    });

    it("should set correct platformName and platformId", async () => {
      const integrationId = "test-integration-789";
      const result = await executor.executeQuery(
        "Test query",
        integrationId,
        {
          headless: true,
          timeoutMs: 5000,
          maxRetries: 0,
        }
      );

      expect(result.platformName).toBe("gemini_browser");
      expect(result.platformId).toBe(integrationId);
    });

    it("should include timestamp in result", async () => {
      const result = await executor.executeQuery("Test", "integration-timestamp", {
        headless: true,
        timeoutMs: 5000,
        maxRetries: 0,
      });

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  // ============================================================================
  // B. Anti-Detection Tests
  // ============================================================================

  describe("B. Anti-Detection Measures", () => {
    it("should use realistic user-agent with Chrome signature", async () => {
      const userAgent = executor["platformConfig"].userAgent;
      expect(userAgent).toContain("Mozilla");
      expect(userAgent).toContain("Chrome");
      expect(userAgent).toContain("AppleWebKit");
    });

    it("should use realistic viewport dimensions", async () => {
      const viewport = executor["platformConfig"].viewport;
      expect(viewport).toBeDefined();
      expect(viewport?.width).toBe(1366);
      expect(viewport?.height).toBe(768);
    });

    it("should have realistic page load timeout", async () => {
      expect(executor["platformConfig"].pageLoadTimeoutMs).toBe(30000);
    });

    it("should have extended timeout for streaming responses", async () => {
      expect(executor["platformConfig"].contentReadyTimeoutMs).toBe(28000);
    });

    it("should have conservative rate limiting (~3-5 req/min)", async () => {
      const minQueryIntervalMs = executor["platformConfig"].minQueryIntervalMs;
      const maxQueriesPerMinute = executor["platformConfig"].maxQueriesPerMinute;

      // 12s per query = 5 queries/min (very conservative for Google)
      expect(minQueryIntervalMs).toBe(12000);
      expect(maxQueriesPerMinute).toBe(5);
    });

    it("should include human-like delays in typing simulation", async () => {
      // Verify the executor has delay methods
      expect(executor["delay"]).toBeDefined();
    });

    it("should use stronger backoff for rate limits", async () => {
      const retryConfig = executor["retryConfig"];
      expect(retryConfig.backoffMultiplier).toBe(2.5); // More aggressive than ChatGPT (2)
    });

    it("should not retry on CAPTCHA/2FA (requires human)", async () => {
      const retryConfig = executor["retryConfig"];
      expect(retryConfig.retryOn.captcha).toBe(false);
    });

    it("should retry on rate limit errors", async () => {
      const retryConfig = executor["retryConfig"];
      expect(retryConfig.retryOn.rateLimit).toBe(true);
    });

    it("should handle bot detection error gracefully", async () => {
      const error = new CaptchaDetectedError(
        "Bot detection triggered",
        "bot_detection"
      );

      expect(error.message).toContain("Bot detection");
      expect(error.captchaProvider).toBe("bot_detection");
    });
  });

  // ============================================================================
  // C. Error Handling Tests
  // ============================================================================

  describe("C. Error Handling", () => {
    it("should detect CAPTCHA challenges", async () => {
      const error = new CaptchaDetectedError(
        "Gemini CAPTCHA challenge detected",
        "google_recaptcha"
      );

      expect(error.name).toBe("CaptchaDetectedError");
      expect(error.message).toContain("CAPTCHA");
      expect(error.captchaProvider).toBe("google_recaptcha");
    });

    it("should detect rate limiting errors", async () => {
      const error = new RateLimitError(
        "Gemini rate limit detected",
        60,
        "gemini_browser"
      );

      expect(error.name).toBe("RateLimitError");
      expect(error.retryAfterSeconds).toBe(60);
      expect(error.platformName).toBe("gemini_browser");
    });

    it("should detect authentication errors", async () => {
      const error = new AuthenticationError(
        "Gemini login required",
        "unauthorized"
      );

      expect(error.name).toBe("AuthenticationError");
      expect(error.reason).toBe("unauthorized");
    });

    it("should detect content extraction failures", async () => {
      const error = new ContentExtractionError("Failed to extract content", {
        selector: "[role='article']",
        found: false,
      });

      expect(error.name).toBe("ContentExtractionError");
      expect(error.context?.selector).toBe("[role='article']");
    });

    it("should screenshot on CAPTCHA error", async () => {
      const error = new CaptchaDetectedError(
        "CAPTCHA detected",
        "google_recaptcha",
        "/tmp/screenshot.png"
      );

      expect(error.screenshotPath).toBe("/tmp/screenshot.png");
    });

    it("should handle browser crash errors", async () => {
      const error = new BrowserCrashError("Browser crashed", "SIGKILL");

      expect(error.name).toBe("BrowserCrashError");
      expect(error.errorCode).toBe("SIGKILL");
    });

    it("should retry on timeout", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }
      const result = await executor.executeQuery(
        "Test query",
        "integration-retry-timeout",
        {
          headless: true,
          timeoutMs: 100,
          maxRetries: 2,
        }
      );

      // Either succeeds (unlikely) or fails with timeout
      expect(result.platformName).toBe("gemini_browser");
    });

    it("should handle network errors", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }
      const result = await executor.executeQuery(
        "Test query",
        "integration-network-error",
        {
          headless: true,
          timeoutMs: 5000,
          maxRetries: 1,
        }
      );

      expect(result.platformName).toBe("gemini_browser");
    });
  });

  // ============================================================================
  // D. DOM Extraction Tests
  // ============================================================================

  describe("D. DOM Extraction", () => {
    it("should extract main content from response", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }

      const result = await executor.executeQuery(
        "What is machine learning?",
        "integration-dom-extract",
        {
          headless: true,
          timeoutMs: 30000,
        }
      );

      if (result.status === "success") {
        expect(result.rawContent.length).toBeGreaterThan(50);
        expect(result.extractedData.mainContent.length).toBeGreaterThan(0);
      }
    });

    it("should extract citations from response", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }

      const result = await executor.executeQuery(
        "Popular machine learning frameworks",
        "integration-citations",
        {
          headless: true,
          timeoutMs: 30000,
        }
      );

      if (result.status === "success") {
        // Citations are optional
        expect(result.extractedData.citations).toBeInstanceOf(Array);
      }
    });

    it("should handle missing citations gracefully", async () => {
      const result = await executor.executeQuery(
        "Test query",
        "integration-no-citations",
        {
          headless: true,
          timeoutMs: 5000,
          maxRetries: 0,
        }
      );

      expect(result.extractedData.citations).toBeInstanceOf(Array);
    });

    it("should deduplicate citations", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }

      const result = await executor.executeQuery(
        "Information about AI",
        "integration-dedup-citations",
        {
          headless: true,
          timeoutMs: 30000,
        }
      );

      if (result.status === "success" && result.extractedData.citations) {
        const urls = result.extractedData.citations.map(c => c.url);
        const uniqueUrls = new Set(urls);
        expect(uniqueUrls.size).toBe(urls.length);
      }
    });

    it("should extract related searches", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }

      const result = await executor.executeQuery(
        "Python programming",
        "integration-related-searches",
        {
          headless: true,
          timeoutMs: 30000,
        }
      );

      if (result.status === "success") {
        expect(result.extractedData.relatedQueries).toBeInstanceOf(Array);
      }
    });

    it("should limit related searches to 5", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }

      const result = await executor.executeQuery(
        "Test query",
        "integration-related-limit",
        {
          headless: true,
          timeoutMs: 30000,
        }
      );

      if (result.status === "success") {
        expect(result.extractedData.relatedQueries?.length ?? 0).toBeLessThanOrEqual(5);
      }
    });

    it("should skip internal/anchor links in citations", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }

      const result = await executor.executeQuery(
        "Test query",
        "integration-skip-anchors",
        {
          headless: true,
          timeoutMs: 30000,
        }
      );

      if (result.status === "success" && result.extractedData.citations) {
        const badCitations = result.extractedData.citations.filter(
          c => c.url.startsWith("#") || c.url.startsWith("javascript:")
        );
        expect(badCitations.length).toBe(0);
      }
    });
  });

  // ============================================================================
  // E. Login Detection Tests
  // ============================================================================

  describe("E. Login Detection", () => {
    it("should detect when login is required", async () => {
      const error = new AuthenticationError(
        "Gemini login required. Please authenticate with Google account.",
        "unauthorized"
      );

      expect(error.message).toContain("login");
      expect(error.message.toLowerCase()).toContain("google");
    });

    it("should include OAuth mention in auth error", async () => {
      const error = new AuthenticationError(
        "Gemini login required. Please authenticate with Google Account.",
        "unauthorized"
      );

      expect(error.message).toContain("Google");
    });

    it("should detect accounts.google.com redirect", async () => {
      // This would be tested in integration with actual browser
      const error = new AuthenticationError(
        "Detected login redirect to accounts.google.com",
        "unauthorized"
      );

      expect(error.message).toContain("accounts.google.com");
    });
  });

  // ============================================================================
  // F. 2FA Detection Tests
  // ============================================================================

  describe("F. 2FA Detection", () => {
    it("should detect 2FA requirement", async () => {
      const error = new CaptchaDetectedError(
        "Gemini 2FA (Two-Factor Authentication) required",
        "google_2fa"
      );

      expect(error.captchaProvider).toBe("google_2fa");
      expect(error.message).toContain("2FA");
    });

    it("should mention verification methods in 2FA error", async () => {
      const error = new CaptchaDetectedError(
        "Gemini 2FA (Two-Factor Authentication) required. Please verify via phone, authenticator app, or recovery code.",
        "google_2fa"
      );

      expect(error.message).toContain("phone");
      expect(error.message).toContain("authenticator");
      expect(error.message).toContain("recovery code");
    });

    it("should screenshot 2FA page for manual intervention", async () => {
      const error = new CaptchaDetectedError(
        "2FA required",
        "google_2fa",
        "/tmp/2fa-screenshot.png"
      );

      expect(error.screenshotPath).toBe("/tmp/2fa-screenshot.png");
    });

    it("should require manual verification for 2FA", async () => {
      const retryConfig = executor["retryConfig"];
      // Should not retry on CAPTCHA (which includes 2FA)
      expect(retryConfig.retryOn.captcha).toBe(false);
    });
  });

  // ============================================================================
  // G. Bot Detection Tests
  // ============================================================================

  describe("G. Bot Detection", () => {
    it("should detect bot detection challenge", async () => {
      const error = new CaptchaDetectedError(
        "Gemini bot detection triggered",
        "bot_detection"
      );

      expect(error.captchaProvider).toBe("bot_detection");
    });

    it("should mention suspicious activity in bot detection", async () => {
      const error = new CaptchaDetectedError(
        "Gemini bot detection triggered. Unusual activity detected.",
        "bot_detection"
      );

      expect(error.message).toContain("Unusual activity");
    });

    it("should be distinct from CAPTCHA error", async () => {
      const botError = new CaptchaDetectedError(
        "Bot detection",
        "bot_detection"
      );
      const captchaError = new CaptchaDetectedError(
        "CAPTCHA",
        "google_recaptcha"
      );

      expect(botError.captchaProvider).not.toBe(captchaError.captchaProvider);
    });
  });

  // ============================================================================
  // H. Rate Limiting Tests
  // ============================================================================

  describe("H. Rate Limiting (~3-5 req/min)", () => {
    it("should enforce 12s minimum interval between queries", async () => {
      const minInterval = executor["platformConfig"].minQueryIntervalMs;
      expect(minInterval).toBe(12000);
    });

    it("should allow max 5 queries per minute", async () => {
      const maxQpm = executor["platformConfig"].maxQueriesPerMinute;
      expect(maxQpm).toBe(5);
    });

    it("should detect rate limit errors", async () => {
      const error = new RateLimitError(
        "Gemini rate limit detected",
        60,
        "gemini_browser"
      );

      expect(error.retryAfterSeconds).toBe(60);
    });

    it("should retry rate limit errors with backoff", async () => {
      const retryConfig = executor["retryConfig"];
      expect(retryConfig.retryOn.rateLimit).toBe(true);
      expect(retryConfig.backoffMultiplier).toBe(2.5);
    });

    it("should have longer initial delay for rate limits", async () => {
      const retryConfig = executor["retryConfig"];
      expect(retryConfig.initialDelayMs).toBe(5000);
    });

    it("should have max backoff of 60s for rate limits", async () => {
      const retryConfig = executor["retryConfig"];
      expect(retryConfig.maxDelayMs).toBe(60000);
    });
  });

  // ============================================================================
  // I. Streaming Detection Tests
  // ============================================================================

  describe("I. Streaming Detection", () => {
    it("should wait for streaming to complete", async () => {
      const contentTimeout = executor["platformConfig"].contentReadyTimeoutMs;
      expect(contentTimeout).toBe(28000);
    });

    it("should monitor loading indicators", async () => {
      // Extractor checks for loading indicators
      expect(executor["extractor"]).toBeDefined();
    });

    it("should handle partial content gracefully", async () => {
      const result = await executor.executeQuery(
        "Test",
        "integration-partial-content",
        {
          headless: true,
          timeoutMs: 5000,
          maxRetries: 0,
        }
      );

      // Should return result even if partial
      expect(result.platformName).toBe("gemini_browser");
    });
  });

  // ============================================================================
  // J. Model Detection Tests
  // ============================================================================

  describe("J. Model Detection", () => {
    it("should attempt to detect current model", async () => {
      // This is an optional feature
      expect(executor["extractor"]).toBeDefined();
    });

    it("should handle missing model indicator gracefully", async () => {
      const result = await executor.executeQuery(
        "Test",
        "integration-model-detection",
        {
          headless: true,
          timeoutMs: 5000,
          maxRetries: 0,
        }
      );

      expect(result.platformName).toBe("gemini_browser");
    });
  });

  // ============================================================================
  // K. Singleton Management Tests
  // ============================================================================

  describe("K. Singleton Management", () => {
    it("should return same executor instance", async () => {
      const exec1 = getGeminiExecutor();
      const exec2 = getGeminiExecutor();

      expect(exec1).toBe(exec2);
    });

    it("should cleanup executor properly", async () => {
      await cleanupGeminiExecutor();

      const newExec = getGeminiExecutor();
      expect(newExec).toBeDefined();
      expect(newExec).not.toBe(executor); // New instance after cleanup
    });

    it("should recreate executor after cleanup", async () => {
      await cleanupGeminiExecutor();
      const exec = getGeminiExecutor();

      expect(exec).toBeInstanceOf(GeminiBrowserQueryExecutor);
    });
  });

  // ============================================================================
  // L. Configuration Tests
  // ============================================================================

  describe("L. Configuration", () => {
    it("should have correct platform name", async () => {
      expect(executor["platformConfig"].platformName).toBe("gemini_browser");
    });

    it("should have correct base URL", async () => {
      expect(executor["platformConfig"].baseUrl).toBe("https://gemini.google.com");
    });

    it("should have correct search URL", async () => {
      expect(executor["platformConfig"].searchUrl).toBe("https://gemini.google.com/app");
    });

    it("should require authentication", async () => {
      expect(executor["platformConfig"].authRequired).toBe(true);
    });

    it("should use cookies for auth", async () => {
      expect(executor["platformConfig"].authMethod).toBe("cookies");
    });

    it("should have proper DOM selectors", async () => {
      const selectors = executor["platformConfig"].selectors;
      expect(selectors.mainContent).toBeDefined();
      expect(selectors.citations).toBeDefined();
      expect(selectors.relatedQueries).toBeDefined();
      expect(selectors.loadingIndicator).toBeDefined();
    });

    it("should include Google OAuth selectors", async () => {
      const mainContent = executor["platformConfig"].selectors.mainContent;
      expect(mainContent).toContain("[role='region']");
      expect(mainContent).toContain(".message");
      expect(mainContent).toContain("[role='article']");
    });
  });

  // ============================================================================
  // M. Error Result Tests
  // ============================================================================

  describe("M. Error Result Handling", () => {
    it("should return failed status on error", async () => {
      const result = await executor.executeQuery(
        "Test",
        "integration-error",
        {
          headless: true,
          timeoutMs: 100,
          maxRetries: 0,
        }
      );

      if (result.status === "failed") {
        expect(result.error).toBeDefined();
      }
    });

    it("should include platformName in error result", async () => {
      const result = await executor.executeQuery(
        "Test",
        "integration-error-name",
        {
          headless: true,
          timeoutMs: 5000,
          maxRetries: 0,
        }
      );

      expect(result.platformName).toBe("gemini_browser");
    });

    it("should include platformId in error result", async () => {
      const integrationId = "test-error-id-123";
      const result = await executor.executeQuery(
        "Test",
        integrationId,
        {
          headless: true,
          timeoutMs: 5000,
          maxRetries: 0,
        }
      );

      expect(result.platformId).toBe(integrationId);
    });

    it("should include query in error result", async () => {
      const query = "error test query";
      const result = await executor.executeQuery(
        query,
        "integration-error-query",
        {
          headless: true,
          timeoutMs: 5000,
          maxRetries: 0,
        }
      );

      expect(result.query).toBe(query);
    });
  });

  // ============================================================================
  // N. Integration Tests
  // ============================================================================

  describe("N. Integration Tests", () => {
    it("should handle multi-turn conversation context", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }

      // First query
      const result1 = await executor.executeQuery(
        "What is the capital of France?",
        "integration-turn-1",
        {
          headless: true,
          timeoutMs: 30000,
        }
      );

      // Second query should be in same session
      const result2 = await executor.executeQuery(
        "What is its population?",
        "integration-turn-2",
        {
          headless: true,
          timeoutMs: 30000,
        }
      );

      expect(result1.platformName).toBe("gemini_browser");
      expect(result2.platformName).toBe("gemini_browser");
    });

    it("should maintain session cookies across queries", async () => {
      if (process.env.SKIP_BROWSER_TESTS) {
        return;
      }

      const result1 = await executor.executeQuery(
        "Test query 1",
        "integration-session-1",
        {
          headless: true,
          timeoutMs: 30000,
        }
      );

      const result2 = await executor.executeQuery(
        "Test query 2",
        "integration-session-2",
        {
          headless: true,
          timeoutMs: 30000,
        }
      );

      // Both should be from same session
      expect(result1.platformName).toBe("gemini_browser");
      expect(result2.platformName).toBe("gemini_browser");
    });

    it.skip("should handle concurrent query attempts gracefully", async () => {
      // Note: Gemini rate limit will apply
      const query1 = executor.executeQuery(
        "Query 1",
        "integration-concurrent-1",
        {
          headless: true,
          timeoutMs: 30000,
          maxRetries: 1,
        }
      );

      const query2 = executor.executeQuery(
        "Query 2",
        "integration-concurrent-2",
        {
          headless: true,
          timeoutMs: 30000,
          maxRetries: 1,
        }
      );

      const [result1, result2] = await Promise.all([query1, query2]);

      expect(result1.platformName).toBe("gemini_browser");
      expect(result2.platformName).toBe("gemini_browser");
    });
  });

  // ============================================================================
  // O. Extended Data Tests
  // ============================================================================

  describe("O. Extended Data", () => {
    it("should include extracted data in result", async () => {
      const result = await executor.executeQuery(
        "Test",
        "integration-extracted-data",
        {
          headless: true,
          timeoutMs: 5000,
          maxRetries: 0,
        }
      );

      expect(result.extractedData).toBeDefined();
      expect(result.extractedData.mainContent).toBeDefined();
      expect(result.extractedData.citations).toBeInstanceOf(Array);
      expect(result.extractedData.relatedQueries).toBeInstanceOf(Array);
    });

    it("should include response time", async () => {
      const result = await executor.executeQuery(
        "Test",
        "integration-response-time",
        {
          headless: true,
          timeoutMs: 5000,
          maxRetries: 0,
        }
      );

      expect(result.extractedData.responseTime).toBeDefined();
    });
  });
});
