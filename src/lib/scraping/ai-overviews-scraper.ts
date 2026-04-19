/**
 * Google AI Overviews scraper.
 *
 * Requirement: FR-MON-008.
 *
 * Uses SerpAPI's Google Search results → `ai_overview` block for programmatic
 * access. Alternative path via DataForSEO is left as TODO — SerpAPI has
 * the cleanest structured response today.
 *
 * Pricing note: AIO doesn't appear on every query; if no AI overview is
 * rendered for a prompt, we record a mention-free response rather than
 * retrying.
 */

import {
  BaseScraper,
  ScrapedMention,
  ScraperConfig,
  ScraperResult,
  scraperRateLimiter,
} from "./base-scraper";
import { logger } from "@/lib/logger";

interface SerpAPIResult {
  search_metadata?: { status?: string };
  ai_overview?: {
    text_blocks?: Array<{ snippet?: string; type?: string }>;
    references?: Array<{ link?: string; title?: string; source?: string }>;
  };
  error?: string;
}

export class AIOverviewsScraper extends BaseScraper {
  private serpApiKey?: string;
  private geoLocation: string;

  constructor(config?: Partial<ScraperConfig> & { geoLocation?: string }) {
    super("google_ai_overviews", config);
    this.serpApiKey = process.env.SERPAPI_KEY;
    this.geoLocation = config?.geoLocation ?? "za"; // Default: South Africa
  }

  async checkAccess(): Promise<boolean> {
    if (!this.serpApiKey) return false;
    try {
      const res = await fetch(
        `https://serpapi.com/account?api_key=${this.serpApiKey}`,
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  protected parseResponse(): ScrapedMention[] {
    // Not used — this scraper consumes structured JSON from SerpAPI directly.
    return [];
  }

  protected async scrapeQuery(
    brandName: string,
    query: string,
  ): Promise<ScrapedMention[]> {
    if (!this.serpApiKey) {
      throw new Error("SERPAPI_KEY not configured");
    }

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", this.serpApiKey);
    url.searchParams.set("engine", "google");
    url.searchParams.set("gl", this.geoLocation);
    url.searchParams.set("hl", "en");
    // Explicitly request AI overview blocks
    url.searchParams.set("no_cache", "true");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": this.config.userAgent ?? "Apex/1.0" },
    });
    if (!res.ok) {
      throw new Error(`SerpAPI ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as SerpAPIResult;

    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    const aio = data.ai_overview;
    if (!aio || !aio.text_blocks || aio.text_blocks.length === 0) {
      // No AI Overview rendered for this query — not a failure, just nothing.
      return [];
    }

    const responseText = aio.text_blocks
      .map((b) => b.snippet ?? "")
      .filter(Boolean)
      .join("\n\n");

    const cited = (aio.references ?? []).find((r) =>
      r.source?.toLowerCase().includes(brandName.toLowerCase()) ||
      r.title?.toLowerCase().includes(brandName.toLowerCase()) ||
      r.link?.toLowerCase().includes(brandName.toLowerCase()),
    );

    return [
      {
        platform: this.platform,
        query,
        response: responseText,
        snippetText: responseText.slice(0, 500),
        citationUrl: cited?.link,
        citationContext: cited?.title,
        metadata: {
          references: aio.references?.length ?? 0,
          geoLocation: this.geoLocation,
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
        const queryMentions = await this.scrapeQuery(brandName, query);
        mentions.push(...queryMentions);
        await new Promise((r) => setTimeout(r, this.config.delay));
      } catch (err) {
        retries++;
        logger.warn("ai_overviews.query_failed", {
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

export function createAIOverviewsScraper(
  config?: Partial<ScraperConfig> & { geoLocation?: string },
): AIOverviewsScraper {
  return new AIOverviewsScraper(config);
}
