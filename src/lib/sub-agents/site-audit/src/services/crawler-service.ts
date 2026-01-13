import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Crawler Service
 *
 * Provides comprehensive website crawling functionality including:
 * - URL normalization and parsing
 * - Robots.txt parsing and compliance
 * - Sitemap parsing and validation
 * - Page metadata extraction
 * - Link extraction and analysis
 * - Crawl queue management with priorities
 * - Rate limiting and concurrent page limits
 */

// Configuration Schema
export const CrawlerConfigSchema = z.object({
  maxConcurrentPages: z.number().min(1).default(5),
  maxDepth: z.number().min(0).default(3),
  timeout: z.number().min(0).default(30000),
  respectRobotsTxt: z.boolean().default(true),
  userAgent: z.string().default('ApexBot/1.0 (+https://apex.com/bot)'),
  crawlDelay: z.number().min(0).default(0),
  maxRetries: z.number().min(0).default(3),
  retryDelay: z.number().min(0).default(1000),
  backoffMultiplier: z.number().min(1).default(2)
});

export type CrawlerConfig = z.infer<typeof CrawlerConfigSchema>;

// Types
export type CrawlPriority = 'high' | 'normal' | 'low';

export interface QueueItem {
  url: string;
  depth: number;
  priority: CrawlPriority;
  addedAt: number;
}

export interface PageMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical: string | null;
  robotsDirectives: string[];
  language: string | null;
}

export interface LinkExtraction {
  internal: string[];
  external: string[];
}

export interface HeadingStructure {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;
  structure: Array<{ level: number; text: string }>;
  hasProperHierarchy: boolean;
  issues: string[];
}

export interface ImageAnalysis {
  total: number;
  withAlt: number;
  withoutAlt: number;
  altTextCoverage: number;
  images: Array<{ src: string; alt: string | null }>;
}

export interface RobotsTxtData {
  exists: boolean;
  userAgents: string[];
  disallowedPaths: string[];
  allowedPaths: string[];
  crawlDelay: number;
  sitemapUrls: string[];
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

export interface SitemapData {
  urls: SitemapUrl[];
  isIndex: boolean;
  childSitemaps: string[];
  parseErrors: string[];
}

export interface SitemapValidation {
  missingFromSitemap: string[];
  orphanedInSitemap: string[];
}

export interface CrawlProgress {
  queued: number;
  visited: number;
  total: number;
  percentage: number;
}

export interface CrawlError {
  url: string;
  statusCode: number;
  message: string;
  timestamp: number;
}

export interface ErrorSummary {
  clientErrors: number;
  serverErrors: number;
  total: number;
}

export interface PageStats {
  loadTime: number;
  size: number;
  statusCode: number;
}

export interface CrawlStats {
  averageLoadTime: number;
  averagePageSize: number;
  totalSize: number;
  fastestPage: { url: string; loadTime: number };
  slowestPage: { url: string; loadTime: number };
}

export interface CrawlResult {
  domain: string;
  pagesFound: number;
  errorCount: number;
  startTime: number;
  endTime?: number;
}

// Priority weights
const PRIORITY_WEIGHTS: Record<CrawlPriority, number> = {
  high: 0,
  normal: 1,
  low: 2
};

/**
 * Crawler Service
 */
export class CrawlerService extends EventEmitter {
  private config: CrawlerConfig;
  private baseDomain: string = '';
  private queue: QueueItem[] = [];
  private visited: Set<string> = new Set();
  private errors: CrawlError[] = [];
  private pageStats: Map<string, PageStats> = new Map();
  private paused: boolean = false;
  private cancelled: boolean = false;
  private activePageFetches: Set<string> = new Set();
  private startTime: number = 0;

  constructor(config: Partial<CrawlerConfig> = {}) {
    super();
    this.config = CrawlerConfigSchema.parse(config);
  }

  /**
   * Get current configuration
   */
  getConfig(): CrawlerConfig {
    return { ...this.config };
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    this.cancelled = true;
    this.queue = [];
    this.activePageFetches.clear();
  }

  /**
   * Set the base domain for crawling
   */
  setBaseDomain(domain: string): void {
    this.baseDomain = domain.toLowerCase().replace(/^www\./, '');
  }

  // ==================== URL Methods ====================

  /**
   * Normalize a URL
   * Preserves path case sensitivity while normalizing protocol and host to lowercase
   */
  normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Keep protocol and host lowercase, but preserve path case
      const protocol = parsed.protocol.toLowerCase();
      const host = parsed.host.toLowerCase();
      // Remove trailing slash from pathname
      let pathname = parsed.pathname.replace(/\/$/, '');
      if (pathname === '') pathname = '';
      return `${protocol}//${host}${pathname}`;
    } catch {
      // Fallback: only lowercase protocol/host portion
      return url.replace(/\/$/, '');
    }
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Check if URL is internal
   */
  isInternalUrl(url: string): boolean {
    if (!this.baseDomain) return false;
    const domain = this.extractDomain(url).toLowerCase().replace(/^www\./, '');
    return domain === this.baseDomain || domain.endsWith(`.${this.baseDomain}`);
  }

  /**
   * Resolve a relative URL
   */
  resolveUrl(relative: string, base: string): string {
    try {
      return new URL(relative, base).href;
    } catch {
      return relative;
    }
  }

  /**
   * Check if URL is crawlable
   */
  isCrawlableUrl(url: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.startsWith('javascript:')) return false;
    if (lowerUrl.startsWith('mailto:')) return false;
    if (lowerUrl.startsWith('tel:')) return false;
    if (lowerUrl.startsWith('#')) return false;
    if (lowerUrl.startsWith('data:')) return false;
    return true;
  }

  // ==================== Robots.txt Methods ====================

  /**
   * Parse robots.txt content
   */
  async parseRobotsTxt(content: string, baseUrl: string): Promise<RobotsTxtData> {
    const result: RobotsTxtData = {
      exists: content.trim().length > 0,
      userAgents: [],
      disallowedPaths: [],
      allowedPaths: [],
      crawlDelay: 0,
      sitemapUrls: []
    };

    if (!content.trim()) {
      return result;
    }

    const lines = content.split('\n');
    let currentUserAgent = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      const directive = trimmed.substring(0, colonIndex).toLowerCase().trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      switch (directive) {
        case 'user-agent':
          currentUserAgent = value;
          if (!result.userAgents.includes(value)) {
            result.userAgents.push(value);
          }
          break;
        case 'disallow':
          if (value) {
            result.disallowedPaths.push(value);
          }
          break;
        case 'allow':
          if (value) {
            result.allowedPaths.push(value);
          }
          break;
        case 'crawl-delay':
          result.crawlDelay = parseInt(value, 10) || 0;
          break;
        case 'sitemap':
          result.sitemapUrls.push(value);
          break;
      }
    }

    return result;
  }

  /**
   * Check if URL is allowed by robots.txt
   */
  isUrlAllowed(url: string, robotsData: RobotsTxtData): boolean {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname;

      // Check allowed paths first (more specific rules)
      for (const allowedPath of robotsData.allowedPaths) {
        if (path.startsWith(allowedPath)) {
          return true;
        }
      }

      // Check disallowed paths
      for (const disallowedPath of robotsData.disallowedPaths) {
        const pattern = disallowedPath.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}`);
        if (regex.test(path)) {
          return false;
        }
      }

      return true;
    } catch {
      return true;
    }
  }

  // ==================== Sitemap Methods ====================

  /**
   * Parse sitemap XML content
   */
  async parseSitemap(content: string, sitemapUrl: string): Promise<SitemapData> {
    const result: SitemapData = {
      urls: [],
      isIndex: false,
      childSitemaps: [],
      parseErrors: []
    };

    try {
      // Check for basic XML validity
      // Detect malformed XML by looking for unclosed tags
      const openTags = content.match(/<url[^/>]*>/gi) || [];
      const closeTags = content.match(/<\/url>/gi) || [];
      if (openTags.length !== closeTags.length) {
        result.parseErrors.push('Malformed XML: unclosed or mismatched URL tags');
      }

      // Check if it's a sitemap index
      if (content.includes('<sitemapindex')) {
        result.isIndex = true;
        const sitemapMatches = content.matchAll(/<sitemap[^>]*>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi);
        for (const match of sitemapMatches) {
          result.childSitemaps.push(match[1].trim());
        }
      } else {
        // Regular sitemap
        const urlMatches = content.matchAll(/<url[^>]*>([\s\S]*?)<\/url>/gi);
        for (const match of urlMatches) {
          const urlBlock = match[1];
          const locMatch = urlBlock.match(/<loc>([^<]+)<\/loc>/i);
          const lastmodMatch = urlBlock.match(/<lastmod>([^<]+)<\/lastmod>/i);
          const changefreqMatch = urlBlock.match(/<changefreq>([^<]+)<\/changefreq>/i);
          const priorityMatch = urlBlock.match(/<priority>([^<]+)<\/priority>/i);

          if (locMatch) {
            result.urls.push({
              loc: locMatch[1].trim(),
              lastmod: lastmodMatch?.[1].trim(),
              changefreq: changefreqMatch?.[1].trim(),
              priority: priorityMatch ? parseFloat(priorityMatch[1]) : undefined
            });
          }
        }
      }
    } catch (error) {
      result.parseErrors.push(error instanceof Error ? error.message : 'Parse error');
    }

    return result;
  }

  /**
   * Validate sitemap against crawled URLs
   */
  validateSitemap(sitemapData: SitemapData, crawledUrls: Set<string>): SitemapValidation {
    const sitemapUrlSet = new Set(sitemapData.urls.map(u => u.loc));

    const missingFromSitemap: string[] = [];
    const orphanedInSitemap: string[] = [];

    // Find URLs crawled but not in sitemap
    for (const url of crawledUrls) {
      if (!sitemapUrlSet.has(url)) {
        missingFromSitemap.push(url);
      }
    }

    // Find URLs in sitemap but not crawled
    for (const url of sitemapUrlSet) {
      if (!crawledUrls.has(url)) {
        orphanedInSitemap.push(url);
      }
    }

    return { missingFromSitemap, orphanedInSitemap };
  }

  // ==================== Page Extraction Methods ====================

  /**
   * Extract page metadata from HTML
   */
  extractPageMetadata(html: string, url: string): PageMetadata {
    const result: PageMetadata = {
      title: '',
      description: '',
      keywords: [],
      canonical: null,
      robotsDirectives: [],
      language: null
    };

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }

    // Extract meta description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (descMatch) {
      result.description = descMatch[1].trim();
    }

    // Extract meta keywords
    const keywordsMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i);
    if (keywordsMatch) {
      result.keywords = keywordsMatch[1].split(',').map(k => k.trim());
    }

    // Extract canonical
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    if (canonicalMatch) {
      result.canonical = canonicalMatch[1].trim();
    }

    // Extract robots meta
    const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
    if (robotsMatch) {
      result.robotsDirectives = robotsMatch[1].split(',').map(d => d.trim());
    }

    // Extract language
    const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
    if (langMatch) {
      result.language = langMatch[1].trim();
    }

    return result;
  }

  /**
   * Extract links from HTML
   */
  extractLinks(html: string, baseUrl: string): LinkExtraction {
    const result: LinkExtraction = {
      internal: [],
      external: []
    };

    const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi);
    for (const match of linkMatches) {
      const href = match[1].trim();
      if (!this.isCrawlableUrl(href)) continue;

      const absoluteUrl = this.resolveUrl(href, baseUrl);
      if (this.isInternalUrl(absoluteUrl)) {
        const normalized = this.normalizeUrl(absoluteUrl);
        if (!result.internal.includes(normalized)) {
          result.internal.push(normalized);
        }
      } else {
        if (!result.external.includes(absoluteUrl)) {
          result.external.push(absoluteUrl);
        }
      }
    }

    return result;
  }

  /**
   * Extract heading structure from HTML
   */
  extractHeadingStructure(html: string): HeadingStructure {
    const result: HeadingStructure = {
      h1Count: 0,
      h2Count: 0,
      h3Count: 0,
      h4Count: 0,
      h5Count: 0,
      h6Count: 0,
      structure: [],
      hasProperHierarchy: true,
      issues: []
    };

    const headingMatches = html.matchAll(/<h([1-6])[^>]*>([^<]*(?:<[^/h][^>]*>[^<]*)*)<\/h\1>/gi);
    let lastLevel = 0;

    for (const match of headingMatches) {
      const level = parseInt(match[1], 10);
      const text = match[2].replace(/<[^>]+>/g, '').trim();

      const countKey = `h${level}Count` as 'h1Count' | 'h2Count' | 'h3Count' | 'h4Count' | 'h5Count' | 'h6Count';
      result[countKey] = result[countKey] + 1;
      result.structure.push({ level, text });

      // Check hierarchy
      if (lastLevel > 0 && level > lastLevel + 1) {
        result.hasProperHierarchy = false;
        if (!result.issues.includes('Skipped heading level')) {
          result.issues.push('Skipped heading level');
        }
      }
      lastLevel = level;
    }

    if (result.h1Count === 0) {
      result.hasProperHierarchy = false;
      result.issues.push('Missing H1');
    }

    return result;
  }

  /**
   * Extract images from HTML
   */
  extractImages(html: string, baseUrl: string): ImageAnalysis {
    const result: ImageAnalysis = {
      total: 0,
      withAlt: 0,
      withoutAlt: 0,
      altTextCoverage: 0,
      images: []
    };

    const imgMatches = html.matchAll(/<img[^>]+>/gi);
    for (const match of imgMatches) {
      const imgTag = match[0];
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
      const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);

      const src = srcMatch ? this.resolveUrl(srcMatch[1], baseUrl) : '';
      const alt = altMatch ? altMatch[1] : null;

      result.images.push({ src, alt });
      result.total++;

      if (alt && alt.trim().length > 0) {
        result.withAlt++;
      } else {
        result.withoutAlt++;
      }
    }

    result.altTextCoverage = result.total > 0 ? result.withAlt / result.total : 0;

    return result;
  }

  // ==================== Queue Management ====================

  /**
   * Add URL to crawl queue
   */
  addToQueue(url: string, depth: number, priority: CrawlPriority = 'normal'): void {
    if (depth > this.config.maxDepth) return;

    const normalized = this.normalizeUrl(url);
    if (this.visited.has(normalized)) return;
    if (this.queue.some(item => item.url === normalized)) return;

    this.queue.push({
      url: normalized,
      depth,
      priority,
      addedAt: Date.now()
    });

    this.sortQueue();
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      const priorityDiff = PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.addedAt - b.addedAt;
    });
  }

  /**
   * Get next item from queue
   */
  getNextFromQueue(): QueueItem | null {
    return this.queue.shift() || null;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Mark URL as visited
   */
  markVisited(url: string): void {
    this.visited.add(this.normalizeUrl(url));
  }

  /**
   * Check if URL was visited
   */
  isVisited(url: string): boolean {
    return this.visited.has(this.normalizeUrl(url));
  }

  /**
   * Get visited count
   */
  getVisitedCount(): number {
    return this.visited.size;
  }

  // ==================== Crawl Progress ====================

  /**
   * Get crawl progress
   */
  getCrawlProgress(): CrawlProgress {
    // Filter out URLs that have been visited from the queue count
    const queued = this.queue.filter(item => !this.visited.has(item.url)).length;
    const visited = this.visited.size;
    const total = queued + visited;
    const percentage = total > 0 ? (visited / total) * 100 : 0;

    return { queued, visited, total, percentage };
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Pause crawling
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume crawling
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * Check if cancelled
   */
  isCancelled(): boolean {
    return this.cancelled;
  }

  /**
   * Cancel crawl
   */
  cancel(): void {
    this.cancelled = true;
    this.queue = [];
  }

  // ==================== Error Tracking ====================

  /**
   * Record a page error
   */
  recordError(url: string, statusCode: number, message: string): void {
    this.errors.push({
      url,
      statusCode,
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Get all errors
   */
  getErrors(): CrawlError[] {
    return [...this.errors];
  }

  /**
   * Get error summary
   */
  getErrorSummary(): ErrorSummary {
    let clientErrors = 0;
    let serverErrors = 0;

    for (const error of this.errors) {
      if (error.statusCode >= 400 && error.statusCode < 500) {
        clientErrors++;
      } else if (error.statusCode >= 500) {
        serverErrors++;
      }
    }

    return {
      clientErrors,
      serverErrors,
      total: this.errors.length
    };
  }

  /**
   * Get retry configuration
   */
  getRetryConfig(): { maxRetries: number; backoffMultiplier: number; initialDelay: number } {
    return {
      maxRetries: this.config.maxRetries,
      backoffMultiplier: this.config.backoffMultiplier,
      initialDelay: this.config.retryDelay
    };
  }

  // ==================== Page Stats ====================

  /**
   * Record page statistics
   */
  recordPageStats(url: string, stats: PageStats): void {
    this.pageStats.set(this.normalizeUrl(url), stats);
  }

  /**
   * Get crawl statistics
   */
  getCrawlStats(): CrawlStats {
    const stats = Array.from(this.pageStats.entries());
    if (stats.length === 0) {
      return {
        averageLoadTime: 0,
        averagePageSize: 0,
        totalSize: 0,
        fastestPage: { url: '', loadTime: 0 },
        slowestPage: { url: '', loadTime: 0 }
      };
    }

    let totalLoadTime = 0;
    let totalSize = 0;
    let fastest = { url: '', loadTime: Infinity };
    let slowest = { url: '', loadTime: 0 };

    for (const [url, stat] of stats) {
      totalLoadTime += stat.loadTime;
      totalSize += stat.size;

      if (stat.loadTime < fastest.loadTime) {
        fastest = { url, loadTime: stat.loadTime };
      }
      if (stat.loadTime > slowest.loadTime) {
        slowest = { url, loadTime: stat.loadTime };
      }
    }

    return {
      averageLoadTime: totalLoadTime / stats.length,
      averagePageSize: totalSize / stats.length,
      totalSize,
      fastestPage: fastest,
      slowestPage: slowest
    };
  }

  // ==================== Crawl Results ====================

  /**
   * Generate crawl result
   */
  generateCrawlResult(): CrawlResult {
    return {
      domain: this.baseDomain,
      pagesFound: this.visited.size,
      errorCount: this.errors.length,
      startTime: this.startTime || Date.now(),
      endTime: Date.now()
    };
  }

  // ==================== Rate Limiting ====================

  /**
   * Start page fetch tracking
   */
  startPageFetch(url: string): void {
    this.activePageFetches.add(url);
  }

  /**
   * End page fetch tracking
   */
  endPageFetch(url: string): void {
    this.activePageFetches.delete(url);
  }

  /**
   * Check if new fetch can start
   */
  canStartNewFetch(): boolean {
    return this.activePageFetches.size < this.config.maxConcurrentPages;
  }
}

/**
 * Factory function
 */
export function createCrawlerService(config: Partial<CrawlerConfig> = {}): CrawlerService {
  return new CrawlerService(config);
}
