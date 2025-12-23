/**
 * Monitor - ChatGPT Scraper (F094)
 * Scrape ChatGPT responses for brand mentions
 */

import {
  BaseScraper,
  ScrapedMention,
  ScraperConfig,
  ScraperResult,
  scraperRateLimiter,
} from "./base-scraper";
import { browserlessScrape, browserlessFunction } from "./browserless";

export class ChatGPTScraper extends BaseScraper {
  private apiKey?: string;

  constructor(config?: Partial<ScraperConfig>) {
    super("chatgpt", config);
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  /**
   * Check if ChatGPT API is accessible
   */
  async checkAccess(): Promise<boolean> {
    try {
      // Try the API approach first
      if (this.apiKey) {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        });
        return response.ok;
      }

      // Fallback to checking the website
      const result = await browserlessScrape("https://chat.openai.com", {
        waitFor: 3000,
      });
      return result.html.includes("ChatGPT") || result.html.includes("OpenAI");
    } catch {
      return false;
    }
  }

  /**
   * Scrape a single query (implements template method)
   */
  protected async scrapeQuery(brandName: string, query: string): Promise<ScrapedMention[]> {
    // Prefer API if available
    if (this.apiKey) {
      return this.scrapeQueryViaAPI(brandName, query);
    }

    // Fallback to web scraping (limited functionality)
    return this.scrapeQueryViaWeb(brandName, query);
  }

  /**
   * Scrape using OpenAI API (preferred method)
   */
  private async scrapeQueryViaAPI(
    brandName: string,
    query: string
  ): Promise<ScrapedMention[]> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Check for brand mentions
    const detection = this.detectMentions(content, brandName);

    if (detection.hasBrandMention || content.length > 0) {
      return [{
        platform: "chatgpt",
        query,
        response: content,
        snippetText: detection.brandContext || content.substring(0, 500),
        competitorMentions: detection.competitorMentions.map(cm => ({
          name: cm.name,
          sentiment: "neutral",
          context: cm.context,
        })),
        metadata: {
          model: "gpt-4-turbo-preview",
          source: "api",
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
        },
        scrapedAt: new Date(),
      }];
    }

    return [];
  }

  /**
   * Scrape using web scraping (fallback)
   */
  private async scrapeQueryViaWeb(
    brandName: string,
    query: string
  ): Promise<ScrapedMention[]> {
    // Note: Web scraping ChatGPT requires authentication
    // This is a simplified implementation
    const result = await browserlessScrape("https://chat.openai.com", {
      waitFor: 5000,
    });

    const parsedMentions = this.parseResponse(result.html, query);
    return parsedMentions.filter(
      mention =>
        mention.snippetText.toLowerCase().includes(brandName.toLowerCase())
    );
  }

  /**
   * Parse HTML response (for web scraping fallback)
   */
  protected parseResponse(html: string, query: string): ScrapedMention[] {
    const mentions: ScrapedMention[] = [];

    // Extract conversation content
    // ChatGPT uses specific class names for messages
    const messageRegex = /<div[^>]*data-message-author-role="assistant"[^>]*>([\s\S]*?)<\/div>/gi;
    const matches = html.matchAll(messageRegex);

    for (const match of matches) {
      const content = this.sanitizeText(match[1]);
      if (content.length > 50) {
        mentions.push({
          platform: "chatgpt",
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

    return mentions;
  }

  /**
   * Generate ChatGPT-specific queries
   */
  generateQueries(brandName: string, industry?: string): string[] {
    const baseQueries = super.generateQueries(brandName, industry);

    // Add ChatGPT-specific query patterns
    const chatgptQueries = [
      `Can you recommend ${brandName}?`,
      `What are the pros and cons of ${brandName}?`,
      `Compare ${brandName} to its competitors`,
      `Should I use ${brandName} for my business?`,
      `What do people say about ${brandName}?`,
    ];

    return [...baseQueries, ...chatgptQueries];
  }
}

// Factory function
export function createChatGPTScraper(config?: Partial<ScraperConfig>): ChatGPTScraper {
  return new ChatGPTScraper(config);
}

export default ChatGPTScraper;
