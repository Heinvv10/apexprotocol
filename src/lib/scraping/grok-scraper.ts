/**
 * X/Twitter Grok AI Scraper (F098)
 * Scrapes Grok for brand mentions using web interface
 */

import {
  BaseScraper,
  type ScrapedMention,
  type ScraperConfig,
  type ScraperResult,
  scraperRateLimiter,
} from "./base-scraper";
import { browserlessScrape } from "./browserless";

export class GrokScraper extends BaseScraper {
  protected baseUrl = "https://x.com/i/grok";

  constructor(config?: Partial<ScraperConfig>) {
    super("grok", config);
  }

  /**
   * Check if Grok is accessible
   */
  async checkAccess(): Promise<boolean> {
    try {
      const result = await browserlessScrape(this.baseUrl, {
        waitFor: 5000,
      });
      return result.html.includes("Grok") || result.html.includes("X.com") || result.html.includes("twitter");
    } catch {
      return false;
    }
  }

  /**
   * Scrape Grok for brand mentions
   * Note: Grok requires X Premium subscription for access
   */
  async scrape(brandName: string, queries: string[]): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    let requestCount = 0;
    const retries = 0;

    try {
      for (const query of queries) {
        const searchQuery = query.includes(brandName)
          ? query
          : `${query} ${brandName}`;

        await scraperRateLimiter.waitForSlot(this.platform);
        requestCount++;

        const result = await this.scrapeQuery(brandName, searchQuery);

        if (result) {
          mentions.push(...result);
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
    } catch (error) {
      return {
        success: false,
        mentions,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          duration: Date.now() - startTime,
          retries,
          requestCount,
        },
      };
    }
  }

  /**
   * Scrape a single query from Grok
   */
  private async scrapeQuery(
    brandName: string,
    query: string
  ): Promise<ScrapedMention[] | null> {
    try {
      // Basic page scrape - Grok requires X Premium auth
      const result = await browserlessScrape(this.baseUrl, {
        waitFor: 5000,
      });

      const content = result.text || result.html;

      if (!content) {
        return null;
      }

      // Check if brand is mentioned
      const brandLower = brandName.toLowerCase();
      const contentLower = content.toLowerCase();

      if (!contentLower.includes(brandLower)) {
        return null;
      }

      const sentiment = this.analyzeSentiment(content, brandName);

      const mention: ScrapedMention = {
        platform: this.platform,
        query,
        response: content,
        snippetText: this.extractContext(content, brandName),
        sentiment,
        scrapedAt: new Date(),
        metadata: {
          model: "grok-2",
          requiresPremium: true,
        },
      };

      return [mention];
    } catch (error) {
      console.error("Error scraping Grok:", error);
      return null;
    }
  }

  /**
   * Parse HTML response to extract mentions (required by abstract base)
   */
  protected parseResponse(html: string, query: string): ScrapedMention[] {
    // For Grok, we use the scrapeQuery method instead
    return [];
  }

  /**
   * Extract context around brand mention
   */
  private extractContext(content: string, brandName: string): string {
    const brandLower = brandName.toLowerCase();
    const contentLower = content.toLowerCase();
    const index = contentLower.indexOf(brandLower);

    if (index === -1) {
      return content.slice(0, 500);
    }

    const start = Math.max(0, index - 200);
    const end = Math.min(content.length, index + brandName.length + 300);

    return content.slice(start, end);
  }

  /**
   * Basic sentiment analysis
   */
  private analyzeSentiment(
    content: string,
    brandName: string
  ): "positive" | "negative" | "neutral" {
    const brandLower = brandName.toLowerCase();

    const sentences = content.split(/[.!?]+/);
    const brandSentences = sentences.filter((s) =>
      s.toLowerCase().includes(brandLower)
    );

    if (brandSentences.length === 0) {
      return "neutral";
    }

    const combinedText = brandSentences.join(" ").toLowerCase();

    const positiveWords = [
      "best",
      "great",
      "excellent",
      "recommended",
      "leading",
      "top",
      "innovative",
      "reliable",
      "trusted",
      "popular",
      "quality",
      "outstanding",
      "superior",
      "impressive",
    ];
    const negativeWords = [
      "worst",
      "bad",
      "poor",
      "avoid",
      "issues",
      "problems",
      "unreliable",
      "expensive",
      "disappointing",
      "lacking",
      "inferior",
      "concerning",
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of positiveWords) {
      if (combinedText.includes(word)) positiveScore++;
    }
    for (const word of negativeWords) {
      if (combinedText.includes(word)) negativeScore++;
    }

    if (positiveScore > negativeScore) return "positive";
    if (negativeScore > positiveScore) return "negative";
    return "neutral";
  }
}

/**
 * Factory function to create Grok scraper
 */
export function createGrokScraper(
  config?: Partial<ScraperConfig>
): GrokScraper {
  return new GrokScraper(config);
}
