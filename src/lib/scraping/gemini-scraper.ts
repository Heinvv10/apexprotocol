/**
 * Google Gemini AI Scraper (F097)
 * Scrapes Gemini for brand mentions using API or web interface
 */

import {
  BaseScraper,
  type ScrapedMention,
  type ScraperConfig,
  type ScraperResult,
  scraperRateLimiter,
} from "./base-scraper";
import { browserlessScrape } from "./browserless";

export class GeminiScraper extends BaseScraper {
  protected baseUrl = "https://gemini.google.com";
  private apiKey?: string;

  constructor(config?: Partial<ScraperConfig>) {
    super("gemini", config);
    this.apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  }

  /**
   * Check if Gemini is accessible
   */
  async checkAccess(): Promise<boolean> {
    try {
      // Try API first
      if (this.apiKey) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${this.apiKey}`
        );
        return response.ok;
      }

      // Fallback to web check
      const result = await browserlessScrape(this.baseUrl, {
        waitFor: 5000,
      });
      return result.html.includes("Gemini") || result.html.includes("Google");
    } catch {
      return false;
    }
  }

  /**
   * Scrape Gemini for brand mentions
   */
  async scrape(brandName: string, queries: string[]): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    let requestCount = 0;
    const retries = 0;

    try {
      // Prefer API if available
      if (this.apiKey) {
        return this.scrapeViaApi(brandName, queries);
      }

      // Fallback to web scraping (limited)
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
   * Scrape via Gemini API
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
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: searchQuery }],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          console.error("Gemini API error:", response.status);
          continue;
        }

        const data = await response.json();
        const content =
          data.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
            model: "gemini-pro",
            viaApi: true,
          },
        });
      } catch (error) {
        console.error("Gemini API request failed:", error);
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
   * Scrape a single query from Gemini web interface
   */
  private async scrapeQuery(
    brandName: string,
    query: string
  ): Promise<ScrapedMention[] | null> {
    try {
      // Basic page scrape - Gemini requires auth for interaction
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
          model: "gemini-pro",
          viaApi: false,
        },
      };

      return [mention];
    } catch (error) {
      console.error("Error scraping Gemini:", error);
      return null;
    }
  }

  /**
   * Parse HTML response to extract mentions (required by abstract base)
   */
  protected parseResponse(html: string, query: string): ScrapedMention[] {
    // For Gemini, we use the scrapeQuery method instead
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
      "powerful",
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
      "slow",
      "buggy",
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
 * Factory function to create Gemini scraper
 */
export function createGeminiScraper(
  config?: Partial<ScraperConfig>
): GeminiScraper {
  return new GeminiScraper(config);
}
