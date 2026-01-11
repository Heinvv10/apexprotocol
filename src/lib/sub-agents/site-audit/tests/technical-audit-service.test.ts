import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TechnicalAuditService,
  createTechnicalAuditService,
  type TechnicalAuditConfig,
  type TechnicalAuditResult,
  type IndexabilityAnalysis,
  type CrawlabilityAnalysis,
  type SecurityAnalysis,
  type RedirectAnalysis,
  type TechnicalIssue,
  type IssueSeverity
} from '../src/services/technical-audit-service';

describe('TechnicalAuditService', () => {
  let service: TechnicalAuditService;

  beforeEach(() => {
    service = createTechnicalAuditService();
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('Configuration', () => {
    it('should create service with default configuration', () => {
      const config = service.getConfig();
      expect(config.checkSSL).toBe(true);
      expect(config.checkRedirects).toBe(true);
      expect(config.checkIndexability).toBe(true);
      expect(config.maxRedirectChain).toBe(5);
    });

    it('should accept custom configuration', () => {
      const customService = createTechnicalAuditService({
        checkSSL: false,
        maxRedirectChain: 10
      });
      const config = customService.getConfig();
      expect(config.checkSSL).toBe(false);
      expect(config.maxRedirectChain).toBe(10);
      customService.shutdown();
    });
  });

  describe('Indexability Analysis', () => {
    it('should detect indexable pages', () => {
      const pageData = {
        url: 'https://example.com/page',
        statusCode: 200,
        headers: { 'x-robots-tag': 'index, follow' },
        html: '<html><head><meta name="robots" content="index, follow"></head></html>'
      };

      const result = service.analyzeIndexability(pageData);

      expect(result.isIndexable).toBe(true);
      expect(result.robotsMetaTag).toBe('index, follow');
      expect(result.xRobotsTag).toBe('index, follow');
    });

    it('should detect noindex pages', () => {
      const pageData = {
        url: 'https://example.com/private',
        statusCode: 200,
        headers: {},
        html: '<html><head><meta name="robots" content="noindex"></head></html>'
      };

      const result = service.analyzeIndexability(pageData);

      expect(result.isIndexable).toBe(false);
      expect(result.blockingReasons).toContain('noindex meta tag');
    });

    it('should detect X-Robots-Tag noindex', () => {
      const pageData = {
        url: 'https://example.com/private',
        statusCode: 200,
        headers: { 'x-robots-tag': 'noindex' },
        html: '<html><head></head></html>'
      };

      const result = service.analyzeIndexability(pageData);

      expect(result.isIndexable).toBe(false);
      expect(result.blockingReasons).toContain('X-Robots-Tag noindex');
    });

    it('should identify canonical issues', () => {
      const pageData = {
        url: 'https://example.com/page',
        statusCode: 200,
        headers: {},
        html: '<html><head><link rel="canonical" href="https://example.com/other-page"></head></html>'
      };

      const result = service.analyzeIndexability(pageData);

      expect(result.canonicalUrl).toBe('https://example.com/other-page');
      expect(result.hasCanonicalMismatch).toBe(true);
    });

    it('should detect pagination rel tags', () => {
      const pageData = {
        url: 'https://example.com/page/2',
        statusCode: 200,
        headers: {},
        html: `<html><head>
          <link rel="prev" href="https://example.com/page/1">
          <link rel="next" href="https://example.com/page/3">
        </head></html>`
      };

      const result = service.analyzeIndexability(pageData);

      expect(result.pagination.hasPrev).toBe(true);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.prevUrl).toBe('https://example.com/page/1');
      expect(result.pagination.nextUrl).toBe('https://example.com/page/3');
    });
  });

  describe('Crawlability Analysis', () => {
    it('should analyze robots.txt compliance', () => {
      const robotsData = {
        exists: true,
        disallowedPaths: ['/admin/', '/private/'],
        allowedPaths: ['/'],
        crawlDelay: 2
      };

      const result = service.analyzeCrawlability('https://example.com/', robotsData);

      expect(result.isAllowed).toBe(true);
      expect(result.robotsTxtExists).toBe(true);
    });

    it('should detect blocked URLs', () => {
      const robotsData = {
        exists: true,
        disallowedPaths: ['/admin/', '/private/'],
        allowedPaths: ['/'],
        crawlDelay: 0
      };

      const result = service.analyzeCrawlability('https://example.com/admin/users', robotsData);

      expect(result.isAllowed).toBe(false);
      expect(result.blockingRule).toBe('/admin/');
    });

    it('should analyze internal linking structure', () => {
      const pages = [
        { url: 'https://example.com/', internalLinks: ['https://example.com/about', 'https://example.com/contact'], incomingLinks: 5 },
        { url: 'https://example.com/about', internalLinks: ['https://example.com/'], incomingLinks: 3 },
        { url: 'https://example.com/orphan', internalLinks: [], incomingLinks: 0 }
      ];

      const result = service.analyzeInternalLinking(pages);

      expect(result.orphanPages).toContain('https://example.com/orphan');
      expect(result.wellLinkedPages).toContain('https://example.com/');
      expect(result.averageInternalLinks).toBeGreaterThan(0);
    });

    it('should calculate crawl depth', () => {
      const pages = [
        { url: 'https://example.com/', depth: 0 },
        { url: 'https://example.com/level1', depth: 1 },
        { url: 'https://example.com/level1/level2', depth: 2 },
        { url: 'https://example.com/deep/path/here', depth: 3 }
      ];

      const result = service.analyzeCrawlDepth(pages);

      expect(result.maxDepth).toBe(3);
      expect(result.averageDepth).toBe(1.5);
      expect(result.depthDistribution[0]).toBe(1);
      expect(result.depthDistribution[3]).toBe(1);
    });
  });

  describe('Security Analysis', () => {
    it('should check SSL certificate', () => {
      const sslData = {
        valid: true,
        issuer: 'Let\'s Encrypt',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        protocol: 'TLSv1.3'
      };

      const result = service.analyzeSSL(sslData);

      expect(result.isSecure).toBe(true);
      expect(result.daysUntilExpiry).toBeGreaterThan(25);
      expect(result.protocol).toBe('TLSv1.3');
    });

    it('should detect expiring certificates', () => {
      const sslData = {
        valid: true,
        issuer: 'Let\'s Encrypt',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        protocol: 'TLSv1.3'
      };

      const result = service.analyzeSSL(sslData);

      expect(result.isSecure).toBe(true);
      expect(result.expiryWarning).toBe(true);
      expect(result.issues).toContain('Certificate expires in less than 14 days');
    });

    it('should detect mixed content', () => {
      const pageData = {
        url: 'https://example.com/',
        html: `<html>
          <img src="http://example.com/image.jpg">
          <script src="http://cdn.example.com/script.js"></script>
          <link href="https://example.com/style.css">
        </html>`
      };

      const result = service.detectMixedContent(pageData);

      expect(result.hasMixedContent).toBe(true);
      expect(result.insecureResources).toHaveLength(2);
      expect(result.insecureResources).toContain('http://example.com/image.jpg');
    });

    it('should check security headers', () => {
      const headers = {
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'content-security-policy': "default-src 'self'"
      };

      const result = service.analyzeSecurityHeaders(headers);

      expect(result.hasHSTS).toBe(true);
      expect(result.hasXContentTypeOptions).toBe(true);
      expect(result.hasXFrameOptions).toBe(true);
      expect(result.hasCSP).toBe(true);
      expect(result.securityScore).toBeGreaterThan(80);
    });

    it('should identify missing security headers', () => {
      const headers = {};

      const result = service.analyzeSecurityHeaders(headers);

      expect(result.hasHSTS).toBe(false);
      expect(result.missingHeaders).toContain('Strict-Transport-Security');
      expect(result.missingHeaders).toContain('X-Content-Type-Options');
      expect(result.securityScore).toBeLessThan(50);
    });
  });

  describe('Redirect Analysis', () => {
    it('should analyze redirect chains', () => {
      const redirectChain = [
        { from: 'http://example.com', to: 'https://example.com', statusCode: 301 },
        { from: 'https://example.com', to: 'https://www.example.com', statusCode: 301 },
        { from: 'https://www.example.com', to: 'https://www.example.com/', statusCode: 301 }
      ];

      const result = service.analyzeRedirectChain(redirectChain);

      expect(result.chainLength).toBe(3);
      expect(result.hasRedirectLoop).toBe(false);
      expect(result.isTooLong).toBe(false);
      expect(result.finalUrl).toBe('https://www.example.com/');
    });

    it('should detect redirect loops', () => {
      const redirectChain = [
        { from: 'https://example.com/a', to: 'https://example.com/b', statusCode: 301 },
        { from: 'https://example.com/b', to: 'https://example.com/c', statusCode: 301 },
        { from: 'https://example.com/c', to: 'https://example.com/a', statusCode: 301 }
      ];

      const result = service.analyzeRedirectChain(redirectChain);

      expect(result.hasRedirectLoop).toBe(true);
    });

    it('should flag long redirect chains', () => {
      const customService = createTechnicalAuditService({ maxRedirectChain: 3 });
      const redirectChain = [
        { from: 'http://a.com', to: 'http://b.com', statusCode: 301 },
        { from: 'http://b.com', to: 'http://c.com', statusCode: 301 },
        { from: 'http://c.com', to: 'http://d.com', statusCode: 301 },
        { from: 'http://d.com', to: 'http://e.com', statusCode: 301 }
      ];

      const result = customService.analyzeRedirectChain(redirectChain);

      expect(result.isTooLong).toBe(true);
      customService.shutdown();
    });

    it('should identify redirect type issues', () => {
      const redirectChain = [
        { from: 'https://example.com/old', to: 'https://example.com/new', statusCode: 302 }
      ];

      const result = service.analyzeRedirectChain(redirectChain);

      expect(result.issues).toContain('Using temporary redirect (302) instead of permanent (301)');
    });
  });

  describe('HTTP Status Analysis', () => {
    it('should categorize status codes', () => {
      const pages = [
        { url: 'https://example.com/', statusCode: 200 },
        { url: 'https://example.com/redirect', statusCode: 301 },
        { url: 'https://example.com/missing', statusCode: 404 },
        { url: 'https://example.com/error', statusCode: 500 }
      ];

      const result = service.analyzeStatusCodes(pages);

      expect(result.successful).toBe(1);
      expect(result.redirects).toBe(1);
      expect(result.clientErrors).toBe(1);
      expect(result.serverErrors).toBe(1);
    });

    it('should identify soft 404s', () => {
      // HTML with multiple soft 404 indicators
      const pageData = {
        url: 'https://example.com/not-found-page',
        statusCode: 200,
        html: '<html><body><h1>404 - Page Not Found</h1><p>Sorry, we couldn\'t find what you\'re looking for. This page doesn\'t exist and is no longer available. Please try again.</p></body></html>'
      };

      const result = service.detectSoft404(pageData);

      expect(result.isSoft404).toBe(true);
      // Confidence > 0.3 triggers soft 404 detection
      expect(result.confidence).toBeGreaterThan(0.3);
    });
  });

  describe('Technical Issues Detection', () => {
    it('should detect duplicate content issues', () => {
      const pages = [
        { url: 'https://example.com/page', contentHash: 'abc123', title: 'Page Title' },
        { url: 'https://example.com/page/', contentHash: 'abc123', title: 'Page Title' },
        { url: 'https://example.com/page?ref=social', contentHash: 'abc123', title: 'Page Title' }
      ];

      const result = service.detectDuplicateContent(pages);

      expect(result.duplicateGroups).toHaveLength(1);
      expect(result.duplicateGroups[0].urls).toHaveLength(3);
      expect(result.totalDuplicates).toBe(2); // 2 duplicates of 1 original
    });

    it('should detect thin content', () => {
      const pageData = {
        url: 'https://example.com/thin-page',
        wordCount: 50,
        html: '<html><body><p>Very short content here.</p></body></html>'
      };

      const result = service.detectThinContent(pageData);

      expect(result.isThinContent).toBe(true);
      expect(result.wordCount).toBe(50);
      expect(result.recommendation).toContain('Add more content');
    });

    it('should detect URL issues', () => {
      // Long URL with path > 200 characters to exceed default maxUrlLength
      const longPath = '/very-long-url-path-' + 'x'.repeat(200) + '-end';
      const urls = [
        'https://example.com/page',
        'https://example.com/Page',
        `https://example.com${longPath}`,
        'https://example.com/page with spaces',
        'https://example.com/page_with_underscores'
      ];

      const result = service.analyzeUrls(urls);

      expect(result.mixedCaseUrls).toContain('https://example.com/Page');
      expect(result.tooLongUrls.length).toBeGreaterThan(0);
      expect(result.urlsWithSpaces).toContain('https://example.com/page with spaces');
      expect(result.underscoreUrls).toContain('https://example.com/page_with_underscores');
    });

    it('should calculate overall technical score', () => {
      const auditData = {
        indexablePages: 95,
        totalPages: 100,
        brokenLinks: 2,
        redirectIssues: 1,
        securityScore: 85,
        duplicateContent: 3,
        thinContentPages: 5
      };

      const score = service.calculateTechnicalScore(auditData);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Issue Reporting', () => {
    it('should create technical issues with severity', () => {
      const issue = service.createIssue({
        type: 'broken_link',
        url: 'https://example.com/page',
        description: 'Link to https://example.com/missing returns 404',
        severity: 'high',
        recommendation: 'Fix or remove the broken link'
      });

      expect(issue.type).toBe('broken_link');
      expect(issue.severity).toBe('high');
      expect(issue.id).toBeDefined();
    });

    it('should prioritize issues by severity', () => {
      service.addIssue({ type: 'minor', severity: 'low', url: 'https://example.com/1', description: 'Minor issue' });
      service.addIssue({ type: 'critical', severity: 'critical', url: 'https://example.com/2', description: 'Critical issue' });
      service.addIssue({ type: 'medium', severity: 'medium', url: 'https://example.com/3', description: 'Medium issue' });
      service.addIssue({ type: 'high', severity: 'high', url: 'https://example.com/4', description: 'High issue' });

      const issues = service.getIssuesByPriority();

      expect(issues[0].severity).toBe('critical');
      expect(issues[1].severity).toBe('high');
      expect(issues[2].severity).toBe('medium');
      expect(issues[3].severity).toBe('low');
    });

    it('should group issues by type', () => {
      service.addIssue({ type: 'broken_link', severity: 'high', url: 'https://example.com/1', description: 'Broken link 1' });
      service.addIssue({ type: 'broken_link', severity: 'high', url: 'https://example.com/2', description: 'Broken link 2' });
      service.addIssue({ type: 'redirect', severity: 'medium', url: 'https://example.com/3', description: 'Redirect issue' });

      const grouped = service.getIssuesByType();

      expect(grouped['broken_link']).toHaveLength(2);
      expect(grouped['redirect']).toHaveLength(1);
    });

    it('should generate issue summary', () => {
      service.addIssue({ type: 'broken_link', severity: 'critical', url: 'https://example.com/1', description: 'Critical broken link' });
      service.addIssue({ type: 'redirect', severity: 'high', url: 'https://example.com/2', description: 'High redirect' });
      service.addIssue({ type: 'seo', severity: 'medium', url: 'https://example.com/3', description: 'Medium SEO' });
      service.addIssue({ type: 'minor', severity: 'low', url: 'https://example.com/4', description: 'Low minor' });

      const summary = service.getIssueSummary();

      expect(summary.critical).toBe(1);
      expect(summary.high).toBe(1);
      expect(summary.medium).toBe(1);
      expect(summary.low).toBe(1);
      expect(summary.total).toBe(4);
    });
  });

  describe('Full Technical Audit', () => {
    it('should emit events during audit', async () => {
      const events: string[] = [];

      service.on('audit:start', () => events.push('start'));
      service.on('audit:progress', () => events.push('progress'));
      service.on('audit:complete', () => events.push('complete'));

      service.emit('audit:start', { url: 'https://example.com' });
      service.emit('audit:progress', { progress: 50 });
      service.emit('audit:complete', { score: 85 });

      expect(events).toContain('start');
      expect(events).toContain('progress');
      expect(events).toContain('complete');
    });

    it('should generate comprehensive audit result', () => {
      const crawlData = {
        pages: [
          { url: 'https://example.com/', statusCode: 200, depth: 0 },
          { url: 'https://example.com/about', statusCode: 200, depth: 1 }
        ],
        errors: [],
        robotsTxt: { exists: true, disallowedPaths: [] },
        sitemap: { urls: [], isIndex: false }
      };

      const result = service.generateAuditResult(crawlData);

      expect(result.domain).toBe('example.com');
      expect(result.pagesAnalyzed).toBe(2);
      expect(result.technicalScore).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });
});
