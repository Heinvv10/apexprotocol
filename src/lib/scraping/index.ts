/**
 * Scraping Module - Central exports for AI platform scrapers
 */

// Base scraper
export {
  BaseScraper,
  ScraperRateLimiter,
  scraperRateLimiter,
  type ScrapedMention,
  type ScraperConfig,
  type ScraperResult,
} from "./base-scraper";

// Browserless integration
export {
  getBrowserlessEndpoint,
  browserlessScreenshot,
  browserlessScrape,
  browserlessFunction,
  browserlessPdf,
  scrapeAIPlatform,
  BrowserlessSession,
} from "./browserless";

// Platform-specific scrapers
export { ChatGPTScraper, createChatGPTScraper } from "./chatgpt-scraper";
export { ClaudeScraper, createClaudeScraper } from "./claude-scraper";
export { PerplexityScraper, createPerplexityScraper } from "./perplexity-scraper";
export { GeminiScraper, createGeminiScraper } from "./gemini-scraper";
export { GrokScraper, createGrokScraper } from "./grok-scraper";
export { DeepSeekScraper, createDeepSeekScraper } from "./deepseek-scraper";

// Factory for creating scrapers
import { ChatGPTScraper } from "./chatgpt-scraper";
import { ClaudeScraper } from "./claude-scraper";
import { PerplexityScraper } from "./perplexity-scraper";
import { GeminiScraper } from "./gemini-scraper";
import { GrokScraper } from "./grok-scraper";
import { DeepSeekScraper } from "./deepseek-scraper";
import type { BaseScraper, ScraperConfig, ScraperResult } from "./base-scraper";

export type SupportedPlatform =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "grok"
  | "deepseek";

/**
 * Create a scraper for the specified AI platform
 */
export function createScraper(
  platform: SupportedPlatform,
  config?: Partial<ScraperConfig>
): BaseScraper {
  switch (platform) {
    case "chatgpt":
      return new ChatGPTScraper(config);
    case "claude":
      return new ClaudeScraper(config);
    case "perplexity":
      return new PerplexityScraper(config);
    case "gemini":
      return new GeminiScraper(config);
    case "grok":
      return new GrokScraper(config);
    case "deepseek":
      return new DeepSeekScraper(config);
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

/**
 * Scrape multiple platforms concurrently
 */
export async function scrapeMultiplePlatforms(
  platforms: SupportedPlatform[],
  brandName: string,
  queries: string[],
  config?: Partial<ScraperConfig>
): Promise<Map<SupportedPlatform, ScraperResult>> {
  const results = new Map<SupportedPlatform, ScraperResult>();

  const promises = platforms.map(async platform => {
    try {
      const scraper = createScraper(platform, config);
      const result = await scraper.scrape(brandName, queries);
      return { platform, result };
    } catch (error) {
      return {
        platform,
        result: {
          success: false,
          mentions: [],
          error: error instanceof Error ? error.message : String(error),
          metadata: { duration: 0, retries: 0, requestCount: 0 },
        } as ScraperResult,
      };
    }
  });

  const settled = await Promise.allSettled(promises);

  for (const result of settled) {
    if (result.status === "fulfilled") {
      results.set(result.value.platform, result.value.result);
    }
  }

  return results;
}

/**
 * Scraper Manager - Orchestrates scraping across multiple platforms
 */
export class ScraperManager {
  private scrapers: Map<SupportedPlatform, BaseScraper> = new Map();
  private config?: Partial<ScraperConfig>;

  constructor(config?: Partial<ScraperConfig>) {
    this.config = config;
  }

  /**
   * Get or create a scraper for a platform
   */
  private getScraper(platform: SupportedPlatform): BaseScraper {
    if (!this.scrapers.has(platform)) {
      this.scrapers.set(platform, createScraper(platform, this.config));
    }
    return this.scrapers.get(platform)!;
  }

  /**
   * Scrape a single platform
   */
  async scrapePlatform(
    platform: string,
    brandName: string,
    queries: string[]
  ): Promise<ScraperResult> {
    try {
      const scraper = this.getScraper(platform as SupportedPlatform);
      return await scraper.scrape(brandName, queries);
    } catch (error) {
      return {
        success: false,
        mentions: [],
        error: error instanceof Error ? error.message : String(error),
        metadata: { duration: 0, retries: 0, requestCount: 0 },
      };
    }
  }

  /**
   * Scrape multiple platforms
   */
  async scrapeAll(
    platforms: SupportedPlatform[],
    brandName: string,
    queries: string[]
  ): Promise<Map<SupportedPlatform, ScraperResult>> {
    return scrapeMultiplePlatforms(platforms, brandName, queries, this.config);
  }

  /**
   * Check platform access
   */
  async checkAccess(platform: SupportedPlatform): Promise<boolean> {
    try {
      const scraper = this.getScraper(platform);
      return await scraper.checkAccess();
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to create a ScraperManager
 */
export function createScraperManager(config?: Partial<ScraperConfig>): ScraperManager {
  return new ScraperManager(config);
}

/**
 * Check which platforms are accessible
 */
export async function checkPlatformAccess(): Promise<Map<SupportedPlatform, boolean>> {
  const platforms: SupportedPlatform[] = [
    "chatgpt",
    "claude",
    "perplexity",
    "gemini",
    "grok",
    "deepseek",
  ];
  const results = new Map<SupportedPlatform, boolean>();

  const promises = platforms.map(async platform => {
    try {
      const scraper = createScraper(platform);
      const accessible = await scraper.checkAccess();
      return { platform, accessible };
    } catch {
      return { platform, accessible: false };
    }
  });

  const settled = await Promise.all(promises);

  for (const { platform, accessible } of settled) {
    results.set(platform, accessible);
  }

  return results;
}
