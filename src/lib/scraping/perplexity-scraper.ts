/**
 * Perplexity AI Scraper (F096)
 * Scrapes Perplexity for brand mentions using web interface
 */

import {
  BaseScraper,
  type ScrapedMention,
  type ScraperConfig,
  type ScraperResult,
  scraperRateLimiter,
} from "./base-scraper";
import { browserlessScrape } from "./browserless";

export class PerplexityScraper extends BaseScraper {
  protected baseUrl = "https://www.perplexity.ai";

  constructor(config?: Partial<ScraperConfig>) {
    super("perplexity", config);
  }

  /**
   * Check if Perplexity is accessible
   */
  async checkAccess(): Promise<boolean> {
    try {
      const result = await browserlessScrape(this.baseUrl, {
        waitFor: 5000,
      });
      return result.html.includes("Perplexity") || result.html.includes("perplexity");
    } catch {
      return false;
    }
  }

  /**
   * Scrape a single query from Perplexity using URL-based search (implements template method)
   */
  protected async scrapeQuery(
    brandName: string,
    query: string
  ): Promise<ScrapedMention[]> {
    const searchQuery = query.includes(brandName) ? query : `${query} ${brandName}`;
    try {
      // Perplexity supports URL-based search
      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;

      const result = await browserlessScrape(searchUrl, {
        waitFor: 8000,
      });

      const content = result.text || result.html;

      if (!content) {
        return [];
      }

      // Check if brand is mentioned
      const brandLower = brandName.toLowerCase();
      const contentLower = content.toLowerCase();

      if (!contentLower.includes(brandLower)) {
        return [];
      }

      // Analyze sentiment
      const sentiment = this.analyzeSentiment(content, brandName);

      const mention: ScrapedMention = {
        platform: this.platform,
        query: searchQuery,
        response: content,
        snippetText: this.extractContext(content, brandName),
        sentiment,
        scrapedAt: new Date(),
        metadata: {
          url: searchUrl,
        },
      };

      return [mention];
    } catch (error) {
      console.error("Error scraping Perplexity:", error);
      throw error; // Let base class handle the error
    }
  }

  /**
   * Parse HTML response to extract mentions (required by abstract base)
   */
  protected parseResponse(html: string, query: string): ScrapedMention[] {
    // For Perplexity, we use the scrapeQuery method instead
    // This is just to satisfy the abstract base class
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

    // Find sentences containing the brand
    const sentences = content.split(/[.!?]+/);
    const brandSentences = sentences.filter((s) =>
      s.toLowerCase().includes(brandLower)
    );

    if (brandSentences.length === 0) {
      return "neutral";
    }

    const combinedText = brandSentences.join(" ").toLowerCase();

    // Simple keyword-based sentiment
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
 * Factory function to create Perplexity scraper
 */
export function createPerplexityScraper(
  config?: Partial<ScraperConfig>
): PerplexityScraper {
  return new PerplexityScraper(config);
}
