/**
 * DeepSeek AI Scraper (F099)
 * Scrapes DeepSeek for brand mentions using web interface or API
 */

import {
  BaseScraper,
  type ScrapedMention,
  type ScraperConfig,
  type ScraperResult,
  scraperRateLimiter,
} from "./base-scraper";
import { browserlessScrape } from "./browserless";

export class DeepSeekScraper extends BaseScraper {
  protected baseUrl = "https://chat.deepseek.com";
  private apiKey?: string;

  constructor(config?: Partial<ScraperConfig>) {
    super("deepseek", config);
    this.apiKey = process.env.DEEPSEEK_API_KEY;
  }

  /**
   * Check if DeepSeek is accessible
   */
  async checkAccess(): Promise<boolean> {
    try {
      // Try API first
      if (this.apiKey) {
        const response = await fetch("https://api.deepseek.com/v1/models", {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        });
        return response.ok;
      }

      // Fallback to web check
      const result = await browserlessScrape(this.baseUrl, {
        waitFor: 5000,
      });
      return result.html.includes("DeepSeek") || result.html.includes("deepseek");
    } catch {
      return false;
    }
  }

  /**
   * Scrape DeepSeek for brand mentions
   */
  async scrape(brandName: string, queries: string[]): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    let requestCount = 0;
    const retries = 0;

    try {
      // Try API first if available
      if (this.apiKey) {
        return await this.scrapeViaApi(brandName, queries);
      }

      // Fall back to web scraping
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
   * Scrape via DeepSeek API (if available)
   */
  private async scrapeViaApi(
    brandName: string,
    queries: string[]
  ): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    let requestCount = 0;

    for (const query of queries) {
      const searchQuery = query.includes(brandName)
        ? query
        : `${query} ${brandName}`;

      await scraperRateLimiter.waitForSlot(this.platform);
      requestCount++;

      try {
        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "user",
                content: searchQuery,
              },
            ],
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          console.error("DeepSeek API error:", response.status);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";

        if (!content) continue;

        // Check if brand is mentioned
        const brandLower = brandName.toLowerCase();
        if (!content.toLowerCase().includes(brandLower)) continue;

        const sentiment = this.analyzeSentiment(content, brandName);

        mentions.push({
          platform: this.platform,
          query: searchQuery,
          response: content,
          snippetText: this.extractContext(content, brandName),
          sentiment,
          scrapedAt: new Date(),
          metadata: {
            model: "deepseek-chat",
            viaApi: true,
            usage: {
              promptTokens: data.usage?.prompt_tokens,
              completionTokens: data.usage?.completion_tokens,
            },
          },
        });
      } catch (error) {
        console.error("DeepSeek API request failed:", error);
      }
    }

    return {
      success: true,
      mentions,
      metadata: {
        duration: Date.now() - startTime,
        retries: 0,
        requestCount,
      },
    };
  }

  /**
   * Scrape a single query from DeepSeek web interface
   */
  private async scrapeQuery(
    brandName: string,
    query: string
  ): Promise<ScrapedMention[] | null> {
    try {
      // Basic page scrape - DeepSeek requires auth for interaction
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
          model: "deepseek-chat",
          viaApi: false,
        },
      };

      return [mention];
    } catch (error) {
      console.error("Error scraping DeepSeek:", error);
      return null;
    }
  }

  /**
   * Parse HTML response to extract mentions (required by abstract base)
   */
  protected parseResponse(html: string, query: string): ScrapedMention[] {
    // For DeepSeek, we use the scrapeQuery method instead
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
      "efficient",
      "advanced",
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
      "limited",
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
 * Factory function to create DeepSeek scraper
 */
export function createDeepSeekScraper(
  config?: Partial<ScraperConfig>
): DeepSeekScraper {
  return new DeepSeekScraper(config);
}
