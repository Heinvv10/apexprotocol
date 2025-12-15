/**
 * Monitor - Claude Scraper (F095)
 * Scrape Claude AI responses for brand mentions
 */

import {
  BaseScraper,
  ScrapedMention,
  ScraperConfig,
  ScraperResult,
  scraperRateLimiter,
} from "./base-scraper";
import { browserlessScrape } from "./browserless";
import Anthropic from "@anthropic-ai/sdk";

export class ClaudeScraper extends BaseScraper {
  private client: Anthropic | null = null;

  constructor(config?: Partial<ScraperConfig>) {
    super("claude", config);
    this.initClient();
  }

  private initClient(): void {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  /**
   * Check if Claude API is accessible
   */
  async checkAccess(): Promise<boolean> {
    try {
      if (this.client) {
        // Test API with minimal request
        const response = await this.client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 10,
          messages: [{ role: "user", content: "Hello" }],
        });
        return !!response.content;
      }

      // Fallback to checking the website
      const result = await browserlessScrape("https://claude.ai", {
        waitFor: 3000,
      });
      return result.html.includes("Claude") || result.html.includes("Anthropic");
    } catch {
      return false;
    }
  }

  /**
   * Scrape Claude for brand mentions using API
   */
  async scrape(brandName: string, queries: string[]): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    let retries = 0;
    let requestCount = 0;

    // Prefer API if available
    if (this.client) {
      return this.scrapeViaAPI(brandName, queries);
    }

    // Fallback to web scraping (limited functionality)
    for (const query of queries) {
      try {
        await scraperRateLimiter.waitForSlot("claude");
        requestCount++;

        // Note: Web scraping Claude requires authentication
        // This is a simplified implementation
        const result = await browserlessScrape("https://claude.ai", {
          waitFor: 5000,
        });

        const parsedMentions = this.parseResponse(result.html, query);
        const relevantMentions = parsedMentions.filter(
          mention =>
            mention.snippetText.toLowerCase().includes(brandName.toLowerCase())
        );

        mentions.push(...relevantMentions);

        await this.delay();
      } catch (error) {
        retries++;
        if (retries >= this.config.maxRetries) {
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
      }
    }

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
   * Scrape using Anthropic API (preferred method)
   */
  private async scrapeViaAPI(
    brandName: string,
    queries: string[]
  ): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    let retries = 0;
    let requestCount = 0;

    if (!this.client) {
      return {
        success: false,
        mentions: [],
        error: "Claude API client not initialized",
        metadata: {
          duration: 0,
          retries: 0,
          requestCount: 0,
        },
      };
    }

    for (const query of queries) {
      try {
        await scraperRateLimiter.waitForSlot("claude");
        requestCount++;

        const response = await this.client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: query,
            },
          ],
        });

        const content = response.content
          .filter(block => block.type === "text")
          .map(block => (block as Anthropic.TextBlock).text)
          .join("\n");

        // Check for brand mentions
        const detection = this.detectMentions(content, brandName);

        if (detection.hasBrandMention || content.length > 0) {
          mentions.push({
            platform: "claude",
            query,
            response: content,
            snippetText: detection.brandContext || content.substring(0, 500),
            competitorMentions: detection.competitorMentions.map(cm => ({
              name: cm.name,
              sentiment: "neutral",
              context: cm.context,
            })),
            metadata: {
              model: response.model,
              source: "api",
              inputTokens: response.usage.input_tokens,
              outputTokens: response.usage.output_tokens,
              stopReason: response.stop_reason,
            },
            scrapedAt: new Date(),
          });
        }

        await this.delay(500); // Shorter delay for API
      } catch (error) {
        retries++;
        console.error(`Claude API error for query "${query}":`, error);

        if (retries >= this.config.maxRetries) {
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

        // Check for rate limit errors
        if (error instanceof Anthropic.RateLimitError) {
          await this.delay(5000); // Longer delay for rate limits
        }
      }
    }

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
   * Parse HTML response (for web scraping fallback)
   */
  protected parseResponse(html: string, query: string): ScrapedMention[] {
    const mentions: ScrapedMention[] = [];

    // Extract conversation content from Claude.ai
    // Claude uses specific patterns for messages
    const messagePatterns = [
      /<div[^>]*class="[^"]*prose[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*data-testid="assistant-message"[^>]*>([\s\S]*?)<\/div>/gi,
    ];

    for (const pattern of messagePatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const content = this.sanitizeText(match[1]);
        if (content.length > 50) {
          mentions.push({
            platform: "claude",
            query,
            response: content,
            snippetText: content.substring(0, 500),
            metadata: {
              source: "web",
            },
            scrapedAt: new Date(),
          });
        }
      }
    }

    return mentions;
  }

  /**
   * Generate Claude-specific queries
   */
  generateQueries(brandName: string, industry?: string): string[] {
    const baseQueries = super.generateQueries(brandName, industry);

    // Add Claude-specific query patterns (Claude tends to give thoughtful, nuanced responses)
    const claudeQueries = [
      `What are the key strengths and weaknesses of ${brandName}?`,
      `How does ${brandName} compare to alternatives in the market?`,
      `What should I consider before using ${brandName}?`,
      `Can you provide an objective assessment of ${brandName}?`,
      `What's the reputation of ${brandName} in the industry?`,
    ];

    return [...baseQueries, ...claudeQueries];
  }

  /**
   * Batch scrape with optimized API usage
   */
  async batchScrape(
    brandName: string,
    queries: string[],
    batchSize: number = 5
  ): Promise<ScraperResult> {
    const startTime = Date.now();
    const allMentions: ScrapedMention[] = [];
    let totalRetries = 0;
    let totalRequests = 0;

    // Process in batches
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const result = await this.scrape(brandName, batch);

      allMentions.push(...result.mentions);
      totalRetries += result.metadata?.retries || 0;
      totalRequests += result.metadata?.requestCount || 0;

      if (!result.success) {
        return {
          success: false,
          mentions: allMentions,
          error: result.error,
          metadata: {
            duration: Date.now() - startTime,
            retries: totalRetries,
            requestCount: totalRequests,
          },
        };
      }

      // Delay between batches
      if (i + batchSize < queries.length) {
        await this.delay(2000);
      }
    }

    return {
      success: true,
      mentions: allMentions,
      metadata: {
        duration: Date.now() - startTime,
        retries: totalRetries,
        requestCount: totalRequests,
      },
    };
  }
}

// Factory function
export function createClaudeScraper(config?: Partial<ScraperConfig>): ClaudeScraper {
  return new ClaudeScraper(config);
}

export default ClaudeScraper;
