/**
 * Microsoft Copilot scraper.
 *
 * Requirement: FR-MON-007.
 *
 * Copilot has no public chat API at time of writing. Two viable paths:
 *   1. Azure OpenAI deployment with `gpt-4o` + Bing search grounding
 *      (closest to the Copilot surface)
 *   2. Browserless against copilot.microsoft.com
 *
 * This scraper uses path (1) — cleaner, less fragile. The grounding tool
 * is configured via LiteLLM proxy so we share the same routing + budget
 * machinery as other LLM calls.
 *
 * If AZURE_OPENAI_* env vars are absent, `checkAccess` returns false and
 * the scraper will be skipped by the orchestrator.
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

export class CopilotScraper extends BaseScraper {
  private hasAzureConfig: boolean;

  constructor(config?: Partial<ScraperConfig>) {
    super("copilot", config);
    this.hasAzureConfig =
      !!process.env.AZURE_OPENAI_API_KEY &&
      !!process.env.AZURE_OPENAI_ENDPOINT;
  }

  async checkAccess(): Promise<boolean> {
    return this.hasAzureConfig;
  }

  protected parseResponse(): ScrapedMention[] {
    return [];
  }

  protected async scrapeQuery(
    _brandName: string,
    query: string,
  ): Promise<ScrapedMention[]> {
    if (!this.hasAzureConfig) {
      throw new Error(
        "AZURE_OPENAI_API_KEY / AZURE_OPENAI_ENDPOINT not configured",
      );
    }

    // Route through LiteLLM proxy using Azure deployment as the model alias.
    // LiteLLM config.yaml should define "copilot" -> azure/gpt-4o with
    // Bing grounding tools attached. Without that config we surface a clear
    // error so operators know what to fix.
    const response = await chat({
      model: "copilot",
      operation: "scrape.copilot",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a search-grounded assistant. Answer the query using current web information. If you cite sources, include URLs.",
        },
        { role: "user", content: query },
      ],
    });

    return [
      {
        platform: this.platform,
        query,
        response: response.content,
        snippetText: response.content.slice(0, 500),
        metadata: {
          model: response.model,
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
        logger.warn("copilot.query_failed", {
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

export function createCopilotScraper(
  config?: Partial<ScraperConfig>,
): CopilotScraper {
  return new CopilotScraper(config);
}
