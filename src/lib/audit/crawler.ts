/**
 * Site Crawler (F103)
 * Playwright-based crawler that analyzes site structure and content
 */

import type {
  CrawlConfig,
  CrawlResult,
  CrawledPage,
  PageLink,
  PageImage,
  SchemaMarkup,
  OpenGraphData,
  HeadingStructure,
  CrawlError,
} from "./types";
import { createId } from "@paralleldrive/cuid2";

// Default crawl configuration
const DEFAULT_CONFIG: Partial<CrawlConfig> = {
  depth: "single",
  maxPages: 50,
  timeout: 30000,
  options: {
    checkSchema: true,
    checkMeta: true,
    checkContent: true,
    checkLinks: true,
    checkPerformance: true,
    checkAccessibility: false,
    checkSecurity: false,
  },
};

/**
 * Site Crawler class for analyzing web pages
 */
export class SiteCrawler {
  private config: CrawlConfig;
  private visitedUrls: Set<string> = new Set();
  private errors: CrawlError[] = [];
  private startTime: number = 0;

  constructor(config: Partial<CrawlConfig> & { url: string }) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      options: {
        ...DEFAULT_CONFIG.options,
        ...config.options,
      },
    } as CrawlConfig;
  }

  /**
   * Start crawling the site
   */
  async crawl(): Promise<CrawlResult> {
    this.startTime = Date.now();
    this.visitedUrls.clear();
    this.errors = [];

    const pages: CrawledPage[] = [];
    const urlsToVisit: string[] = [this.normalizeUrl(this.config.url)];

    try {
      const baseUrl = new URL(this.config.url);
      const maxPages = this.getMaxPagesForDepth();

      while (urlsToVisit.length > 0 && pages.length < maxPages) {
        const url = urlsToVisit.shift()!;

        if (this.visitedUrls.has(url)) {
          continue;
        }

        this.visitedUrls.add(url);

        try {
          const page = await this.crawlPage(url);
          pages.push(page);

          // Collect internal links for further crawling
          if (this.config.depth !== "single") {
            const internalLinks = page.links
              .filter((link) => link.isInternal && !this.visitedUrls.has(link.href))
              .map((link) => link.href)
              .filter((href) => this.shouldCrawl(href, baseUrl));

            urlsToVisit.push(...internalLinks);
          }
        } catch (error) {
          this.errors.push({
            url,
            error: error instanceof Error ? error.message : String(error),
            code: "CRAWL_ERROR",
          });
        }
      }

      return {
        success: true,
        url: this.config.url,
        pages,
        totalPages: pages.length,
        duration: Date.now() - this.startTime,
        errors: this.errors,
      };
    } catch (error) {
      return {
        success: false,
        url: this.config.url,
        pages,
        totalPages: pages.length,
        duration: Date.now() - this.startTime,
        errors: [
          ...this.errors,
          {
            url: this.config.url,
            error: error instanceof Error ? error.message : String(error),
            code: "FATAL_ERROR",
          },
        ],
      };
    }
  }

  /**
   * Crawl a single page
   */
  private async crawlPage(url: string): Promise<CrawledPage> {
    const pageStartTime = Date.now();

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ApexBot/1.0 (AI Visibility Audit)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(this.config.timeout),
    });

    const html = await response.text();
    const ttfb = Date.now() - pageStartTime;

    // Parse the HTML
    const parsed = this.parseHtml(html, url);

    return {
      url,
      statusCode: response.status,
      title: parsed.title,
      metaDescription: parsed.metaDescription,
      h1Tags: parsed.h1Tags,
      h2Tags: parsed.h2Tags,
      wordCount: parsed.wordCount,
      links: parsed.links,
      images: parsed.images,
      schemaMarkup: parsed.schemaMarkup,
      openGraph: parsed.openGraph,
      timing: {
        loadTime: Date.now() - pageStartTime,
        ttfb,
        domContentLoaded: ttfb + 50, // Estimated
        fullyLoaded: Date.now() - pageStartTime,
      },
      content: parsed.content,
    };
  }

  /**
   * Parse HTML content
   */
  private parseHtml(
    html: string,
    baseUrl: string
  ): Omit<CrawledPage, "url" | "statusCode" | "timing"> {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract meta description
    const metaDescMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i
    );
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : "";

    // Extract h1 tags
    const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
    const h1Tags = [...h1Matches].map((m) => m[1].trim());

    // Extract h2 tags
    const h2Matches = html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
    const h2Tags = [...h2Matches].map((m) => m[1].trim());

    // Extract body text and word count
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : html;
    const text = this.stripHtml(bodyHtml);
    const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

    // Extract links
    const links = this.extractLinks(html, baseUrl);

    // Extract images
    const images = this.extractImages(html, baseUrl);

    // Extract schema markup
    const schemaMarkup = this.extractSchemaMarkup(html);

    // Extract OpenGraph data
    const openGraph = this.extractOpenGraph(html);

    // Extract content structure
    const headings = this.extractHeadings(html);

    // Count content elements
    const paragraphCount = (html.match(/<p[^>]*>/gi) || []).length;
    const listCount = (html.match(/<(ul|ol)[^>]*>/gi) || []).length;
    const tableCount = (html.match(/<table[^>]*>/gi) || []).length;
    const codeCount = (html.match(/<(code|pre)[^>]*>/gi) || []).length;

    return {
      title,
      metaDescription,
      h1Tags,
      h2Tags,
      wordCount,
      links,
      images,
      schemaMarkup,
      openGraph,
      content: {
        text: text.slice(0, 10000), // Limit stored text
        headings,
        paragraphs: paragraphCount,
        lists: listCount,
        tables: tableCount,
        codeBlocks: codeCount,
      },
    };
  }

  /**
   * Extract links from HTML
   */
  private extractLinks(html: string, baseUrl: string): PageLink[] {
    const links: PageLink[] = [];
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    const base = new URL(baseUrl);

    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1].trim();
      const text = this.stripHtml(match[2]).trim();

      // Skip empty, javascript, and anchor-only links
      if (!href || href.startsWith("javascript:") || href.startsWith("#")) {
        continue;
      }

      try {
        const resolvedUrl = new URL(href, baseUrl);
        const isInternal = resolvedUrl.hostname === base.hostname;
        const isNoFollow = match[0].toLowerCase().includes('rel="nofollow"');

        links.push({
          href: resolvedUrl.href,
          text,
          isInternal,
          isNoFollow,
        });
      } catch {
        // Invalid URL, skip
      }
    }

    return links;
  }

  /**
   * Extract images from HTML
   */
  private extractImages(html: string, baseUrl: string): PageImage[] {
    const images: PageImage[] = [];
    const imgRegex = /<img[^>]*>/gi;

    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const imgTag = match[0];

      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
      const altMatch = imgTag.match(/alt=["']([^"']*?)["']/i);
      const widthMatch = imgTag.match(/width=["']?(\d+)["']?/i);
      const heightMatch = imgTag.match(/height=["']?(\d+)["']?/i);

      if (srcMatch) {
        try {
          const resolvedSrc = new URL(srcMatch[1], baseUrl).href;
          images.push({
            src: resolvedSrc,
            alt: altMatch ? altMatch[1] : "",
            width: widthMatch ? parseInt(widthMatch[1], 10) : undefined,
            height: heightMatch ? parseInt(heightMatch[1], 10) : undefined,
            hasAlt: !!altMatch && altMatch[1].length > 0,
            lazyLoaded: imgTag.toLowerCase().includes("loading=") &&
              imgTag.toLowerCase().includes("lazy"),
          });
        } catch {
          // Invalid URL, skip
        }
      }
    }

    return images;
  }

  /**
   * Extract JSON-LD schema markup
   */
  private extractSchemaMarkup(html: string): SchemaMarkup[] {
    const schemas: SchemaMarkup[] = [];
    const schemaRegex =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

    let match;
    while ((match = schemaRegex.exec(html)) !== null) {
      try {
        const json = JSON.parse(match[1].trim());
        const items = Array.isArray(json) ? json : [json];

        for (const item of items) {
          schemas.push({
            type: item["@type"] || "Unknown",
            properties: item,
            isValid: true,
          });
        }
      } catch (error) {
        schemas.push({
          type: "Invalid",
          properties: {},
          isValid: false,
          errors: [error instanceof Error ? error.message : "Parse error"],
        });
      }
    }

    return schemas;
  }

  /**
   * Extract OpenGraph metadata
   */
  private extractOpenGraph(html: string): OpenGraphData {
    const og: OpenGraphData = {};

    const patterns: Record<keyof OpenGraphData, RegExp> = {
      title: /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
      description: /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
      image: /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      type: /<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["']/i,
      url: /<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i,
      siteName: /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
    };

    for (const [key, regex] of Object.entries(patterns)) {
      const match = html.match(regex);
      if (match) {
        og[key as keyof OpenGraphData] = match[1];
      }
    }

    return og;
  }

  /**
   * Extract heading structure
   */
  private extractHeadings(html: string): HeadingStructure[] {
    const headings: HeadingStructure[] = [];
    const headingRegex = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;

    let order = 0;
    let match;
    while ((match = headingRegex.exec(html)) !== null) {
      headings.push({
        level: parseInt(match[1], 10),
        text: this.stripHtml(match[2]).trim(),
        order: order++,
      });
    }

    return headings;
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Normalize URL
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      // Remove trailing slash and fragment
      return parsed.origin + parsed.pathname.replace(/\/$/, "") + parsed.search;
    } catch {
      return url;
    }
  }

  /**
   * Check if URL should be crawled
   */
  private shouldCrawl(url: string, baseUrl: URL): boolean {
    try {
      const parsed = new URL(url);

      // Same domain only
      if (parsed.hostname !== baseUrl.hostname) {
        return false;
      }

      // Skip certain file types
      const skipExtensions = [".pdf", ".jpg", ".png", ".gif", ".zip", ".exe"];
      if (skipExtensions.some((ext) => parsed.pathname.toLowerCase().endsWith(ext))) {
        return false;
      }

      // Skip certain paths
      const skipPaths = ["/wp-admin", "/admin", "/login", "/logout"];
      if (skipPaths.some((path) => parsed.pathname.toLowerCase().startsWith(path))) {
        return false;
      }

      // For section depth, only crawl same section
      if (this.config.depth === "section") {
        const basePath = baseUrl.pathname.split("/").slice(0, 2).join("/");
        if (!parsed.pathname.startsWith(basePath)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get max pages based on depth setting
   */
  private getMaxPagesForDepth(): number {
    switch (this.config.depth) {
      case "single":
        return 1;
      case "section":
        return Math.min(this.config.maxPages, 25);
      case "full":
        return this.config.maxPages;
      default:
        return 1;
    }
  }
}

/**
 * Factory function to create a crawler
 */
export function createCrawler(
  url: string,
  options?: Partial<Omit<CrawlConfig, "url">>
): SiteCrawler {
  return new SiteCrawler({ url, ...options });
}

/**
 * Convenience function to crawl a single page
 */
export async function crawlUrl(
  url: string,
  options?: Partial<Omit<CrawlConfig, "url">>
): Promise<CrawlResult> {
  const crawler = createCrawler(url, { ...options, depth: "single" });
  return crawler.crawl();
}

/**
 * Create a unique crawl job ID
 */
export function createCrawlJobId(): string {
  return `crawl_${createId()}`;
}
