/**
 * ChatGPT Search (web-enabled) scraper.
 *
 * Requirement: FR-MON-012.
 *
 * Distinct from base ChatGPT because web-grounded answers differ
 * materially — they cite URLs, the training-cutoff dodge disappears,
 * and brand mentions reflect live search results.
 *
 * Routes through LiteLLM proxy to OpenAI's `gpt-4o-search-preview` (or
 * whichever search-enabled model alias we configure in litellm/config.yaml).
 */

import {
  BaseScraper,
  ScrapedMention,
  ScraperConfig,
  ScraperResult,
  scraperRateLimiter,
} from "./base-scraper";
import { chat } from "@/lib/llm/client";
import { logger } from "@/lib/logger";

export class ChatGPTSearchScraper extends BaseScraper {
  constructor(config?: Partial<ScraperConfig>) {
    super("openai_search", config);
  }

  async checkAccess(): Promise<boolean> {
    return !!process.env.OPENAI_API_KEY;
  }

  protected parseResponse(): ScrapedMention[] {
    return [];
  }

  protected async scrapeQuery(
    _brandName: string,
    query: string,
  ): Promise<ScrapedMention[]> {
    const response = await chat({
      model: "gpt-4o-search-preview",
      operation: "scrape.chatgpt_search",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a web-search grounded assistant. Use current search results and always cite URLs.",
        },
        { role: "user", content: query },
      ],
    });

    // Extract any markdown-style links from the response for citation tracking.
    // LLM already embeds them inline — we don't need a structured tool-call
    // result.
    const urlRegex = /https?:\/\/[^\s)"']+/g;
    const urls = response.content.match(urlRegex) ?? [];
    const firstUrl = urls[0];

    return [
      {
        platform: this.platform,
        query,
        response: response.content,
        snippetText: response.content.slice(0, 500),
        citationUrl: firstUrl,
        metadata: {
          model: response.model,
          urlsInResponse: urls.length,
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
        },
        scrapedAt: new Date(),
      },
    ];
  }

  async scrape(brandName: string, queries: string[]): Promise<ScraperResult> {
    const startTime = Date.now();
    const mentions: ScrapedMention[] = [];
    let retries = 0;
    let requestCount = 0;

    for (const query of queries) {
      try {
        await scraperRateLimiter.waitForSlot(this.platform);
        requestCount++;
        const results = await this.scrapeQuery(brandName, query);
        mentions.push(...results);
        await new Promise((r) => setTimeout(r, this.config.delay));
      } catch (err) {
        retries++;
        logger.warn("chatgpt_search.query_failed", {
          query,
          err: (err as Error).message,
        });
        if (retries >= this.config.maxRetries) {
          return {
            success: false,
            mentions,
            error: (err as Error).message,
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
}

export function createChatGPTSearchScraper(
  config?: Partial<ScraperConfig>,
): ChatGPTSearchScraper {
  return new ChatGPTSearchScraper(config);
}
