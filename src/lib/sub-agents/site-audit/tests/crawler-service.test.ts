import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CrawlerService,
  createCrawlerService,
  type CrawlerConfig,
  type CrawlResult,
  type PageData,
  type RobotsTxtData,
  type SitemapData,
  type CrawlStatus
} from '../src/services/crawler-service';

describe('CrawlerService', () => {
  let service: CrawlerService;

  beforeEach(() => {
    service = createCrawlerService();
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('Configuration', () => {
    it('should create service with default configuration', () => {
      const config = service.getConfig();
      expect(config.maxConcurrentPages).toBe(5);
      expect(config.maxDepth).toBe(3);
      expect(config.timeout).toBe(30000);
      expect(config.respectRobotsTxt).toBe(true);
      expect(config.userAgent).toContain('ApexBot');
    });

    it('should accept custom configuration', () => {
      const customService = createCrawlerService({
        maxConcurrentPages: 10,
        maxDepth: 5,
        timeout: 60000,
        respectRobotsTxt: false
      });
      const config = customService.getConfig();
      expect(config.maxConcurrentPages).toBe(10);
      expect(config.maxDepth).toBe(5);
      expect(config.timeout).toBe(60000);
      expect(config.respectRobotsTxt).toBe(false);
      customService.shutdown();
    });

    it('should validate configuration values', () => {
      expect(() => createCrawlerService({ maxConcurrentPages: 0 })).toThrow();
      expect(() => createCrawlerService({ maxDepth: -1 })).toThrow();
      expect(() => createCrawlerService({ timeout: -100 })).toThrow();
    });
  });

  describe('URL Parsing and Normalization', () => {
    it('should normalize URLs correctly', () => {
      expect(service.normalizeUrl('https://example.com/')).toBe('https://example.com');
      expect(service.normalizeUrl('https://example.com/page/')).toBe('https://example.com/page');
      expect(service.normalizeUrl('HTTPS://EXAMPLE.COM/Page')).toBe('https://example.com/Page');
    });

    it('should extract domain from URL', () => {
      expect(service.extractDomain('https://www.example.com/page')).toBe('www.example.com');
      expect(service.extractDomain('https://subdomain.example.com:8080/path')).toBe('subdomain.example.com');
    });

    it('should identify internal vs external links', () => {
      service.setBaseDomain('example.com');
      expect(service.isInternalUrl('https://example.com/page')).toBe(true);
      expect(service.isInternalUrl('https://www.example.com/page')).toBe(true);
      expect(service.isInternalUrl('https://blog.example.com/post')).toBe(true);
      expect(service.isInternalUrl('https://other-site.com/page')).toBe(false);
    });

    it('should handle relative URLs', () => {
      const baseUrl = 'https://example.com/folder/page.html';
      expect(service.resolveUrl('/about', baseUrl)).toBe('https://example.com/about');
      expect(service.resolveUrl('../other', baseUrl)).toBe('https://example.com/other');
      expect(service.resolveUrl('sibling.html', baseUrl)).toBe('https://example.com/folder/sibling.html');
    });

    it('should filter crawlable URLs', () => {
      expect(service.isCrawlableUrl('https://example.com/page.html')).toBe(true);
      expect(service.isCrawlableUrl('https://example.com/page')).toBe(true);
      expect(service.isCrawlableUrl('javascript:void(0)')).toBe(false);
      expect(service.isCrawlableUrl('mailto:test@example.com')).toBe(false);
      expect(service.isCrawlableUrl('#anchor')).toBe(false);
      expect(service.isCrawlableUrl('tel:+1234567890')).toBe(false);
    });
  });

  describe('Robots.txt Parsing', () => {
    it('should parse simple robots.txt', async () => {
      const robotsTxt = `
User-agent: *
Disallow: /admin/
Disallow: /private/
Allow: /public/
Crawl-delay: 2
      `;
      const result = await service.parseRobotsTxt(robotsTxt, 'https://example.com');

      expect(result.userAgents).toContain('*');
      expect(result.disallowedPaths).toContain('/admin/');
      expect(result.disallowedPaths).toContain('/private/');
      expect(result.allowedPaths).toContain('/public/');
      expect(result.crawlDelay).toBe(2);
    });

    it('should handle multiple user-agents', async () => {
      const robotsTxt = `
User-agent: Googlebot
Disallow: /google-only/

User-agent: ApexBot
Disallow: /apex-blocked/
Allow: /

User-agent: *
Disallow: /blocked/
      `;
      const result = await service.parseRobotsTxt(robotsTxt, 'https://example.com');

      expect(result.userAgents).toContain('Googlebot');
      expect(result.userAgents).toContain('ApexBot');
      expect(result.userAgents).toContain('*');
    });

    it('should extract sitemap URLs from robots.txt', async () => {
      const robotsTxt = `
User-agent: *
Disallow: /admin/

Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-news.xml
      `;
      const result = await service.parseRobotsTxt(robotsTxt, 'https://example.com');

      expect(result.sitemapUrls).toContain('https://example.com/sitemap.xml');
      expect(result.sitemapUrls).toContain('https://example.com/sitemap-news.xml');
    });

    it('should check if URL is allowed by robots.txt', async () => {
      const robotsTxt = `
User-agent: *
Disallow: /admin/
Disallow: /private/*
Allow: /admin/public/
      `;
      const robotsData = await service.parseRobotsTxt(robotsTxt, 'https://example.com');

      expect(service.isUrlAllowed('https://example.com/page', robotsData)).toBe(true);
      expect(service.isUrlAllowed('https://example.com/admin/', robotsData)).toBe(false);
      expect(service.isUrlAllowed('https://example.com/admin/public/', robotsData)).toBe(true);
      expect(service.isUrlAllowed('https://example.com/private/data', robotsData)).toBe(false);
    });

    it('should handle empty or missing robots.txt', async () => {
      const result = await service.parseRobotsTxt('', 'https://example.com');
      expect(result.disallowedPaths).toHaveLength(0);
      expect(result.allowedPaths).toHaveLength(0);
      expect(result.exists).toBe(false);
    });
  });

  describe('Sitemap Parsing', () => {
    it('should parse XML sitemap', async () => {
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

      const result = await service.parseSitemap(sitemapXml, 'https://example.com/sitemap.xml');

      expect(result.urls).toHaveLength(2);
      expect(result.urls[0].loc).toBe('https://example.com/');
      expect(result.urls[0].lastmod).toBe('2024-01-01');
      expect(result.urls[0].priority).toBe(1.0);
      expect(result.urls[1].loc).toBe('https://example.com/about');
    });

    it('should parse sitemap index', async () => {
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-posts.xml</loc>
    <lastmod>2024-01-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-pages.xml</loc>
    <lastmod>2024-01-15</lastmod>
  </sitemap>
</sitemapindex>`;

      const result = await service.parseSitemap(sitemapIndex, 'https://example.com/sitemap.xml');

      expect(result.isIndex).toBe(true);
      expect(result.childSitemaps).toHaveLength(2);
      expect(result.childSitemaps[0]).toBe('https://example.com/sitemap-posts.xml');
    });

    it('should handle malformed sitemap gracefully', async () => {
      const malformedXml = '<urlset><url><loc>https://example.com</url></urlset>';

      const result = await service.parseSitemap(malformedXml, 'https://example.com/sitemap.xml');

      expect(result.parseErrors).toBeDefined();
      expect(result.parseErrors.length).toBeGreaterThan(0);
    });

    it('should validate sitemap URLs against actual pages', async () => {
      const sitemapData: SitemapData = {
        urls: [
          { loc: 'https://example.com/', lastmod: '2024-01-01', priority: 1.0 },
          { loc: 'https://example.com/missing', lastmod: '2024-01-01', priority: 0.5 }
        ],
        isIndex: false,
        childSitemaps: [],
        parseErrors: []
      };

      const crawledUrls = new Set(['https://example.com/', 'https://example.com/about']);
      const validation = service.validateSitemap(sitemapData, crawledUrls);

      expect(validation.missingFromSitemap).toContain('https://example.com/about');
      expect(validation.orphanedInSitemap).toContain('https://example.com/missing');
    });
  });

  describe('Page Crawling', () => {
    it('should extract page metadata', () => {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test Page Title</title>
  <meta name="description" content="Test description">
  <meta name="keywords" content="test, keywords">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://example.com/page">
</head>
<body>
  <h1>Main Heading</h1>
  <p>Content</p>
</body>
</html>`;

      const metadata = service.extractPageMetadata(html, 'https://example.com/page');

      expect(metadata.title).toBe('Test Page Title');
      expect(metadata.description).toBe('Test description');
      expect(metadata.keywords).toContain('test');
      expect(metadata.canonical).toBe('https://example.com/page');
      expect(metadata.robotsDirectives).toContain('index');
      expect(metadata.robotsDirectives).toContain('follow');
      expect(metadata.language).toBe('en');
    });

    it('should extract all links from page', () => {
      const html = `
<html>
<body>
  <a href="/internal-page">Internal</a>
  <a href="https://example.com/another">Another Internal</a>
  <a href="https://external.com/page">External</a>
  <a href="javascript:void(0)">JS Link</a>
  <a href="#section">Anchor</a>
</body>
</html>`;

      service.setBaseDomain('example.com');
      const links = service.extractLinks(html, 'https://example.com/');

      expect(links.internal).toContain('https://example.com/internal-page');
      expect(links.internal).toContain('https://example.com/another');
      expect(links.external).toContain('https://external.com/page');
      expect(links.internal).not.toContain('javascript:void(0)');
    });

    it('should extract heading structure', () => {
      const html = `
<html>
<body>
  <h1>Main Title</h1>
  <h2>Section 1</h2>
  <p>Content</p>
  <h2>Section 2</h2>
  <h3>Subsection 2.1</h3>
  <h3>Subsection 2.2</h3>
  <h2>Section 3</h2>
</body>
</html>`;

      const headings = service.extractHeadingStructure(html);

      expect(headings.h1Count).toBe(1);
      expect(headings.h2Count).toBe(3);
      expect(headings.h3Count).toBe(2);
      expect(headings.structure[0].level).toBe(1);
      expect(headings.structure[0].text).toBe('Main Title');
      expect(headings.hasProperHierarchy).toBe(true);
    });

    it('should detect heading hierarchy issues', () => {
      const html = `
<html>
<body>
  <h2>Section without H1</h2>
  <h4>Skipped H3</h4>
</body>
</html>`;

      const headings = service.extractHeadingStructure(html);

      expect(headings.h1Count).toBe(0);
      expect(headings.hasProperHierarchy).toBe(false);
      expect(headings.issues).toContain('Missing H1');
      expect(headings.issues).toContain('Skipped heading level');
    });

    it('should extract images with alt text analysis', () => {
      const html = `
<html>
<body>
  <img src="/image1.jpg" alt="Description of image 1">
  <img src="/image2.jpg" alt="">
  <img src="/image3.jpg">
  <img src="/image4.jpg" alt="Another good description">
</body>
</html>`;

      const images = service.extractImages(html, 'https://example.com/');

      expect(images.total).toBe(4);
      expect(images.withAlt).toBe(2);
      expect(images.withoutAlt).toBe(2);
      expect(images.altTextCoverage).toBe(0.5);
    });
  });

  describe('Crawl Queue Management', () => {
    it('should manage crawl queue with priorities', () => {
      service.addToQueue('https://example.com/', 0, 'high');
      service.addToQueue('https://example.com/page1', 1, 'normal');
      service.addToQueue('https://example.com/page2', 1, 'low');
      service.addToQueue('https://example.com/important', 1, 'high');

      const next = service.getNextFromQueue();
      // URLs are normalized (trailing slash removed)
      expect(next?.url).toBe('https://example.com');

      const next2 = service.getNextFromQueue();
      expect(next2?.url).toBe('https://example.com/important');
    });

    it('should respect max depth limit', () => {
      const customService = createCrawlerService({ maxDepth: 2 });
      customService.setBaseDomain('example.com');

      customService.addToQueue('https://example.com/', 0);
      customService.addToQueue('https://example.com/level1', 1);
      customService.addToQueue('https://example.com/level2', 2);
      customService.addToQueue('https://example.com/level3', 3);

      expect(customService.getQueueSize()).toBe(3); // Only depth 0, 1, 2
      customService.shutdown();
    });

    it('should not add duplicate URLs', () => {
      service.addToQueue('https://example.com/page', 0);
      service.addToQueue('https://example.com/page', 0);
      service.addToQueue('https://example.com/page/', 0); // With trailing slash

      expect(service.getQueueSize()).toBe(1);
    });

    it('should track visited URLs', () => {
      service.markVisited('https://example.com/page1');
      service.markVisited('https://example.com/page2');

      expect(service.isVisited('https://example.com/page1')).toBe(true);
      expect(service.isVisited('https://example.com/page3')).toBe(false);
      expect(service.getVisitedCount()).toBe(2);
    });
  });

  describe('Crawl Execution', () => {
    it('should emit events during crawl', async () => {
      const events: string[] = [];

      service.on('crawl:start', () => events.push('start'));
      service.on('crawl:page', () => events.push('page'));
      service.on('crawl:complete', () => events.push('complete'));
      service.on('crawl:error', () => events.push('error'));

      // Mock a simple crawl
      service.emit('crawl:start', { url: 'https://example.com' });
      service.emit('crawl:page', { url: 'https://example.com', status: 200 });
      service.emit('crawl:complete', { pagesCount: 1 });

      expect(events).toContain('start');
      expect(events).toContain('page');
      expect(events).toContain('complete');
    });

    it('should provide crawl progress', () => {
      service.addToQueue('https://example.com/', 0);
      service.addToQueue('https://example.com/page1', 1);
      service.addToQueue('https://example.com/page2', 1);
      service.markVisited('https://example.com/');

      const progress = service.getCrawlProgress();

      expect(progress.queued).toBe(2);
      expect(progress.visited).toBe(1);
      expect(progress.total).toBe(3);
      expect(progress.percentage).toBeCloseTo(33.33, 0);
    });

    it('should handle crawl pause and resume', () => {
      expect(service.isPaused()).toBe(false);

      service.pause();
      expect(service.isPaused()).toBe(true);

      service.resume();
      expect(service.isPaused()).toBe(false);
    });

    it('should cancel crawl gracefully', () => {
      service.addToQueue('https://example.com/', 0);
      service.addToQueue('https://example.com/page1', 1);

      service.cancel();

      expect(service.isCancelled()).toBe(true);
      expect(service.getQueueSize()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should track page errors', () => {
      service.recordError('https://example.com/404', 404, 'Not Found');
      service.recordError('https://example.com/500', 500, 'Server Error');
      service.recordError('https://example.com/timeout', 0, 'Timeout');

      const errors = service.getErrors();

      expect(errors).toHaveLength(3);
      expect(errors[0].url).toBe('https://example.com/404');
      expect(errors[0].statusCode).toBe(404);
    });

    it('should categorize errors', () => {
      service.recordError('https://example.com/404', 404, 'Not Found');
      service.recordError('https://example.com/403', 403, 'Forbidden');
      service.recordError('https://example.com/500', 500, 'Server Error');
      service.recordError('https://example.com/503', 503, 'Service Unavailable');

      const summary = service.getErrorSummary();

      expect(summary.clientErrors).toBe(2);
      expect(summary.serverErrors).toBe(2);
      expect(summary.total).toBe(4);
    });

    it('should retry failed requests with backoff', async () => {
      const retryConfig = service.getRetryConfig();

      expect(retryConfig.maxRetries).toBe(3);
      expect(retryConfig.backoffMultiplier).toBe(2);
      expect(retryConfig.initialDelay).toBe(1000);
    });
  });

  describe('Crawl Results', () => {
    it('should generate comprehensive crawl result', () => {
      // Simulate crawl data
      service.setBaseDomain('example.com');
      service.markVisited('https://example.com/');
      service.markVisited('https://example.com/about');
      service.markVisited('https://example.com/contact');
      service.recordError('https://example.com/missing', 404, 'Not Found');

      const result = service.generateCrawlResult();

      expect(result.domain).toBe('example.com');
      expect(result.pagesFound).toBe(3);
      expect(result.errorCount).toBe(1);
      expect(result.startTime).toBeDefined();
    });

    it('should calculate crawl statistics', () => {
      service.recordPageStats('https://example.com/', {
        loadTime: 500,
        size: 50000,
        statusCode: 200
      });
      service.recordPageStats('https://example.com/page1', {
        loadTime: 800,
        size: 75000,
        statusCode: 200
      });
      service.recordPageStats('https://example.com/page2', {
        loadTime: 300,
        size: 25000,
        statusCode: 200
      });

      const stats = service.getCrawlStats();

      expect(stats.averageLoadTime).toBeCloseTo(533.33, 0);
      expect(stats.averagePageSize).toBeCloseTo(50000, 0);
      expect(stats.totalSize).toBe(150000);
      expect(stats.fastestPage.loadTime).toBe(300);
      expect(stats.slowestPage.loadTime).toBe(800);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect crawl delay', () => {
      const customService = createCrawlerService({ crawlDelay: 1000 });
      const config = customService.getConfig();
      expect(config.crawlDelay).toBe(1000);
      customService.shutdown();
    });

    it('should enforce concurrent page limit', () => {
      const customService = createCrawlerService({ maxConcurrentPages: 3 });

      customService.startPageFetch('https://example.com/1');
      customService.startPageFetch('https://example.com/2');
      customService.startPageFetch('https://example.com/3');

      expect(customService.canStartNewFetch()).toBe(false);

      customService.endPageFetch('https://example.com/1');
      expect(customService.canStartNewFetch()).toBe(true);

      customService.shutdown();
    });
  });
});
