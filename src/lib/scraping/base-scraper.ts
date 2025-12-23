/**
 * Base Scraper - Abstract class for AI platform scrapers
 */

export interface ScrapedMention {
  platform: string;
  query: string;
  response: string;
  snippetText: string;
  sentiment?: "positive" | "negative" | "neutral" | "mixed";
  sentimentScore?: number;
  citationUrl?: string;
  citationContext?: string;
  competitorMentions?: Array<{
    name: string;
    sentiment: string;
    context: string;
  }>;
  metadata?: Record<string, unknown>;
  scrapedAt: Date;
}

export interface ScraperConfig {
  maxRetries: number;
  timeout: number;
  delay: number; // Delay between requests
  userAgent?: string;
  cookies?: Array<{ name: string; value: string; domain: string }>;
}

export interface ScraperResult {
  success: boolean;
  mentions: ScrapedMention[];
  error?: string;
  metadata?: {
    duration: number;
    retries: number;
    requestCount: number;
  };
}

export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected platform: string;

  constructor(platform: string, config?: Partial<ScraperConfig>) {
    this.platform = platform;
    this.config = {
      maxRetries: config?.maxRetries ?? 3,
      timeout: config?.timeout ?? 60000,
      delay: config?.delay ?? 2000,
      userAgent: config?.userAgent ?? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      cookies: config?.cookies,
    };
  }

  /**
   * Template method: Scrape for brand mentions with built-in error handling and retry logic
   */
  async scrape(brandName: string, queries: string[]): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    let retries = 0;
    let requestCount = 0;

    for (const query of queries) {
      try {
        await scraperRateLimiter.waitForSlot(this.platform);
        requestCount++;

        const queryMentions = await this.scrapeQuery(brandName, query);
        mentions.push(...queryMentions);

        await this.delay();
      } catch (error) {
        retries++;
        console.error(`${this.platform} error for query "${query}":`, error);

        if (retries >= this.config.maxRetries) {
          return this.buildErrorResult(mentions, error, startTime, retries, requestCount);
        }

        // Allow subclasses to handle specific error types
        await this.handleError(error);
      }
    }

    return this.buildSuccessResult(mentions, startTime, retries, requestCount);
  }

  /**
   * Subclasses must implement: Scrape a single query
   */
  protected abstract scrapeQuery(
    brandName: string,
    query: string
  ): Promise<ScrapedMention[]>;

  /**
   * Check if platform is accessible
   */
  abstract checkAccess(): Promise<boolean>;

  /**
   * Parse response to extract mentions (for web scraping fallback)
   */
  protected abstract parseResponse(
    html: string,
    query: string
  ): ScrapedMention[];

  /**
   * Handle platform-specific errors (e.g., rate limits)
   * Override this in subclasses for custom error handling
   */
  protected async handleError(error: unknown): Promise<void> {
    // Default: no special handling
  }

  /**
   * Build success result with metadata
   */
  protected buildSuccessResult(
    mentions: ScrapedMention[],
    startTime: number,
    retries: number,
    requestCount: number
  ): ScraperResult {
    return {
      success: true,
      mentions,
      metadata: {
        duration: Date.now() - startTime,
        retries,
        requestCount,
      },
    };
  }

  /**
   * Build error result with metadata
   */
  protected buildErrorResult(
    mentions: ScrapedMention[],
    error: unknown,
    startTime: number,
    retries: number,
    requestCount: number
  ): ScraperResult {
    return {
      success: false,
      mentions,
      error: `Max retries exceeded: ${error instanceof Error ? error.message : String(error)}`,
      metadata: {
        duration: Date.now() - startTime,
        retries,
        requestCount,
      },
    };
  }

  /**
   * Helper to delay between requests
   */
  protected async delay(ms?: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms ?? this.config.delay));
  }

  /**
   * Helper to detect brand mentions in text
   */
  protected detectMentions(
    text: string,
    brandName: string,
    competitors: string[] = []
  ): {
    hasBrandMention: boolean;
    brandContext: string;
    competitorMentions: Array<{ name: string; context: string }>;
  } {
    const brandRegex = new RegExp(brandName, "gi");
    const brandMatches = text.match(brandRegex);

    let brandContext = "";
    if (brandMatches) {
      // Extract context around brand mention
      const index = text.toLowerCase().indexOf(brandName.toLowerCase());
      const start = Math.max(0, index - 100);
      const end = Math.min(text.length, index + brandName.length + 100);
      brandContext = text.substring(start, end);
    }

    const competitorMentions = competitors
      .filter(competitor => text.toLowerCase().includes(competitor.toLowerCase()))
      .map(competitor => {
        const index = text.toLowerCase().indexOf(competitor.toLowerCase());
        const start = Math.max(0, index - 100);
        const end = Math.min(text.length, index + competitor.length + 100);
        return {
          name: competitor,
          context: text.substring(start, end),
        };
      });

    return {
      hasBrandMention: !!brandMatches,
      brandContext,
      competitorMentions,
    };
  }

  /**
   * Helper to sanitize text
   */
  protected sanitizeText(text: string): string {
    return text
      .replace(/\s+/g, " ")
      .replace(/[^\x20-\x7E\n]/g, "")
      .trim();
  }

  /**
   * Helper to extract URLs from text
   */
  protected extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    return text.match(urlRegex) || [];
  }

  /**
   * Generate search queries for a brand
   */
  generateQueries(brandName: string, industry?: string): string[] {
    const baseQueries = [
      `What is ${brandName}?`,
      `Tell me about ${brandName}`,
      `${brandName} review`,
      `Is ${brandName} good?`,
      `${brandName} alternatives`,
      `Best ${brandName} features`,
      `${brandName} pricing`,
      `${brandName} vs competitors`,
    ];

    if (industry) {
      baseQueries.push(
        `Best ${industry} companies`,
        `Top ${industry} software`,
        `${industry} tools recommendation`,
        `Which ${industry} solution is best?`
      );
    }

    return baseQueries;
  }
}

/**
 * Rate limiter for scrapers
 */
export class ScraperRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, { count: number; windowMs: number }> = new Map();

  constructor() {
    // Default limits per platform (requests per minute)
    this.limits.set("chatgpt", { count: 10, windowMs: 60000 });
    this.limits.set("claude", { count: 10, windowMs: 60000 });
    this.limits.set("gemini", { count: 15, windowMs: 60000 });
    this.limits.set("perplexity", { count: 20, windowMs: 60000 });
    this.limits.set("grok", { count: 10, windowMs: 60000 });
    this.limits.set("deepseek", { count: 15, windowMs: 60000 });
  }

  canRequest(platform: string): boolean {
    const limit = this.limits.get(platform);
    if (!limit) return true;

    const now = Date.now();
    const requests = this.requests.get(platform) || [];

    // Remove old requests
    const validRequests = requests.filter(t => now - t < limit.windowMs);
    this.requests.set(platform, validRequests);

    return validRequests.length < limit.count;
  }

  recordRequest(platform: string): void {
    const requests = this.requests.get(platform) || [];
    requests.push(Date.now());
    this.requests.set(platform, requests);
  }

  async waitForSlot(platform: string): Promise<void> {
    while (!this.canRequest(platform)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this.recordRequest(platform);
  }
}

// Singleton rate limiter
export const scraperRateLimiter = new ScraperRateLimiter();
