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
   * Scrape a single query (implements template method)
   */
  protected async scrapeQuery(
    brandName: string,
    query: string
  ): Promise<ScrapedMention[]> {
    const searchQuery = query.includes(brandName) ? query : `${query} ${brandName}`;

    // Prefer API if available
    if (this.apiKey) {
      return this.scrapeQueryViaApi(brandName, searchQuery);
    }

    // Fallback to web scraping (limited)
    return this.scrapeQueryViaWeb(brandName, searchQuery);
  }

  /**
   * Scrape via Gemini API
   */
  private async scrapeQueryViaApi(
    brandName: string,
    query: string
  ): Promise<ScrapedMention[]> {
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
              parts: [{ text: query }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!content) {
      return [];
    }

    // Check if brand is mentioned
    const brandLower = brandName.toLowerCase();
    if (!content.toLowerCase().includes(brandLower)) {
      return [];
    }

    const sentiment = this.analyzeSentiment(content, brandName);

    return [{
      platform: this.platform,
      query,
      response: content,
      snippetText: this.extractContext(content, brandName),
      sentiment,
      scrapedAt: new Date(),
      metadata: {
        model: "gemini-pro",
        viaApi: true,
      },
    }];
  }

  /**
   * Scrape a single query from Gemini web interface
   */
  private async scrapeQueryViaWeb(
    brandName: string,
    query: string
  ): Promise<ScrapedMention[]> {
    try {
      // Basic page scrape - Gemini requires auth for interaction
      const result = await browserlessScrape(this.baseUrl, {
        waitFor: 5000,
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
      throw error; // Let base class handle the error
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
      return content.substring(0, 500);
    }

    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + brandName.length + 100);
    return content.substring(start, end);
  }

  /**
   * Basic sentiment analysis
   */
  private analyzeSentiment(
    content: string,
    brandName: string
  ): "positive" | "negative" | "neutral" | "mixed" {
    const contentLower = content.toLowerCase();

    // Simple keyword-based sentiment
    const positiveKeywords = ["good", "great", "excellent", "recommend", "best", "love"];
    const negativeKeywords = ["bad", "poor", "terrible", "avoid", "worst", "hate"];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const keyword of positiveKeywords) {
      if (contentLower.includes(keyword)) positiveCount++;
    }

    for (const keyword of negativeKeywords) {
      if (contentLower.includes(keyword)) negativeCount++;
    }

    if (positiveCount > 0 && negativeCount > 0) return "mixed";
    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }
}

// Factory function
export function createGeminiScraper(config?: Partial<ScraperConfig>): GeminiScraper {
  return new GeminiScraper(config);
}

export default GeminiScraper;
