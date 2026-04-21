import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PerformanceService,
  createPerformanceService,
  type PerformanceConfig,
  type CoreWebVitals,
  type ResourceAnalysis,
  type PerformanceIssue,
  type Resource,
  type ImageData
} from '../src/services/performance-service';

describe('PerformanceService', () => {
  let service: PerformanceService;

  beforeEach(() => {
    service = createPerformanceService();
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('Configuration', () => {
    it('should create service with default configuration', () => {
      const config = service.getConfig();
      expect(config.enableLighthouse).toBe(true);
      expect(config.lighthouseCategories).toContain('performance');
      expect(config.mobileEmulation).toBe(true);
      expect(config.timeout).toBe(60000);
    });

    it('should accept custom configuration', () => {
      const customService = createPerformanceService({
        enableLighthouse: false,
        mobileEmulation: false,
        timeout: 30000
      });
      const config = customService.getConfig();
      expect(config.enableLighthouse).toBe(false);
      expect(config.mobileEmulation).toBe(false);
      expect(config.timeout).toBe(30000);
      customService.shutdown();
    });

    it('should validate configuration values', () => {
      expect(() => createPerformanceService({ timeout: -1 })).toThrow();
    });
  });

  describe('Core Web Vitals Analysis', () => {
    it('should analyze LCP (Largest Contentful Paint)', () => {
      const metrics = { lcp: 2800 }; // 2.8 seconds - between good (2.5s) and poor (4s)

      const result = service.analyzeLCP(metrics.lcp);

      expect(result.value).toBe(2800);
      expect(result.rating).toBe('needs-improvement');
      expect(result.threshold.good).toBe(2500);
      expect(result.threshold.poor).toBe(4000);
    });

    it('should rate good LCP', () => {
      const result = service.analyzeLCP(1500); // 1.5 seconds
      expect(result.rating).toBe('good');
    });

    it('should rate poor LCP', () => {
      const result = service.analyzeLCP(5000); // 5 seconds
      expect(result.rating).toBe('poor');
    });

    it('should analyze FID (First Input Delay)', () => {
      const metrics = { fid: 150 }; // 150ms

      const result = service.analyzeFID(metrics.fid);

      expect(result.value).toBe(150);
      expect(result.rating).toBe('needs-improvement');
      expect(result.threshold.good).toBe(100);
      expect(result.threshold.poor).toBe(300);
    });

    it('should analyze CLS (Cumulative Layout Shift)', () => {
      const metrics = { cls: 0.15 };

      const result = service.analyzeCLS(metrics.cls);

      expect(result.value).toBe(0.15);
      expect(result.rating).toBe('needs-improvement');
      expect(result.threshold.good).toBe(0.1);
      expect(result.threshold.poor).toBe(0.25);
    });

    it('should analyze INP (Interaction to Next Paint)', () => {
      const metrics = { inp: 250 }; // 250ms

      const result = service.analyzeINP(metrics.inp);

      expect(result.value).toBe(250);
      expect(result.rating).toBe('needs-improvement');
      expect(result.threshold.good).toBe(200);
      expect(result.threshold.poor).toBe(500);
    });

    it('should analyze TTFB (Time to First Byte)', () => {
      const metrics = { ttfb: 1000 }; // 1000ms - between good (800ms) and poor (1800ms)

      const result = service.analyzeTTFB(metrics.ttfb);

      expect(result.value).toBe(1000);
      expect(result.rating).toBe('needs-improvement');
      expect(result.threshold.good).toBe(800);
      expect(result.threshold.poor).toBe(1800);
    });

    it('should generate complete Core Web Vitals report', () => {
      const metrics = {
        lcp: 2000,
        fid: 80,
        cls: 0.05,
        inp: 180,
        ttfb: 400
      };

      const result = service.analyzeWebVitals(metrics);

      expect(result.lcp.rating).toBe('good');
      expect(result.fid.rating).toBe('good');
      expect(result.cls.rating).toBe('good');
      expect(result.inp.rating).toBe('good');
      expect(result.ttfb.rating).toBe('good');
      expect(result.overallScore).toBeGreaterThan(90);
    });

    it('should calculate Web Vitals score with mixed ratings', () => {
      const metrics = {
        lcp: 3000,  // needs-improvement
        fid: 50,    // good
        cls: 0.3,   // poor
        inp: 180,   // good
        ttfb: 400   // good
      };

      const result = service.analyzeWebVitals(metrics);

      expect(result.overallScore).toBeLessThan(80);
      expect(result.overallScore).toBeGreaterThan(40);
    });
  });

  describe('Lighthouse Metrics', () => {
    it('should parse Lighthouse performance score', () => {
      const lighthouseData = {
        categories: {
          performance: { score: 0.85 }
        }
      };

      const result = service.parseLighthouseScore(lighthouseData);

      expect(result.performance).toBe(85);
    });

    it('should parse all Lighthouse categories', () => {
      const lighthouseData = {
        categories: {
          performance: { score: 0.85 },
          accessibility: { score: 0.92 },
          'best-practices': { score: 0.88 },
          seo: { score: 0.95 }
        }
      };

      const result = service.parseLighthouseCategories(lighthouseData);

      expect(result.performance).toBe(85);
      expect(result.accessibility).toBe(92);
      expect(result.bestPractices).toBe(88);
      expect(result.seo).toBe(95);
    });

    it('should extract Lighthouse audits', () => {
      const lighthouseData = {
        audits: {
          'first-contentful-paint': {
            id: 'first-contentful-paint',
            title: 'First Contentful Paint',
            score: 0.9,
            numericValue: 1200,
            displayValue: '1.2 s'
          },
          'speed-index': {
            id: 'speed-index',
            title: 'Speed Index',
            score: 0.75,
            numericValue: 3500,
            displayValue: '3.5 s'
          }
        }
      };

      const result = service.extractLighthouseAudits(lighthouseData);

      expect(result['first-contentful-paint'].score).toBe(90);
      expect(result['first-contentful-paint'].value).toBe(1200);
      expect(result['speed-index'].score).toBe(75);
    });

    it('should identify failed Lighthouse audits', () => {
      const lighthouseData = {
        audits: {
          'render-blocking-resources': { score: 0, title: 'Eliminate render-blocking resources' },
          'uses-responsive-images': { score: 0.5, title: 'Properly size images' },
          'efficient-animated-content': { score: 1, title: 'Use video formats for animated content' }
        }
      };

      const result = service.getFailedAudits(lighthouseData);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('render-blocking-resources');
    });

    it('should calculate mobile vs desktop performance difference', () => {
      const mobileMetrics = { lcp: 3000, fid: 150, cls: 0.15 };
      const desktopMetrics = { lcp: 1500, fid: 50, cls: 0.05 };

      const result = service.compareMobileDesktop(mobileMetrics, desktopMetrics);

      expect(result.lcpDifference).toBe(1500);
      expect(result.fidDifference).toBe(100);
      expect(result.clsDifference).toBeCloseTo(0.1); // Use toBeCloseTo for floating point
      expect(result.mobileSlower).toBe(true);
    });
  });

  describe('Resource Analysis', () => {
    it('should analyze page resources', () => {
      const resources = [
        { url: 'https://example.com/style.css', type: 'stylesheet', size: 50000, loadTime: 200 },
        { url: 'https://example.com/app.js', type: 'script', size: 150000, loadTime: 500 },
        { url: 'https://example.com/image.jpg', type: 'image', size: 200000, loadTime: 800 },
        { url: 'https://example.com/font.woff2', type: 'font', size: 30000, loadTime: 150 }
      ];

      const result = service.analyzeResources(resources);

      expect(result.totalSize).toBe(430000);
      expect(result.totalRequests).toBe(4);
      expect(result.byType.stylesheet.count).toBe(1);
      expect(result.byType.script.count).toBe(1);
      expect(result.byType.image.count).toBe(1);
    });

    it('should identify large resources', () => {
      const resources = [
        { url: 'https://example.com/small.js', type: 'script', size: 10000, loadTime: 50 },
        { url: 'https://example.com/large.js', type: 'script', size: 500000, loadTime: 1000 },
        { url: 'https://example.com/huge-image.jpg', type: 'image', size: 2000000, loadTime: 3000 }
      ];

      const result = service.findLargeResources(resources, 100000);

      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('https://example.com/huge-image.jpg');
    });

    it('should identify slow resources', () => {
      const resources = [
        { url: 'https://example.com/fast.js', type: 'script', size: 10000, loadTime: 50 },
        { url: 'https://example.com/slow.js', type: 'script', size: 50000, loadTime: 2000 },
        { url: 'https://example.com/very-slow.css', type: 'stylesheet', size: 20000, loadTime: 3000 }
      ];

      const result = service.findSlowResources(resources, 1000);

      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('https://example.com/very-slow.css');
    });

    it('should detect render-blocking resources', () => {
      const resources = [
        { url: 'https://example.com/critical.css', type: 'stylesheet', renderBlocking: true, size: 20000 },
        { url: 'https://example.com/async.js', type: 'script', renderBlocking: false, size: 50000 },
        { url: 'https://example.com/sync.js', type: 'script', renderBlocking: true, size: 30000 }
      ] as Array<Resource & { renderBlocking?: boolean }>;

      const result = service.findRenderBlockingResources(resources);

      expect(result).toHaveLength(2);
      expect(result.some(r => r.url.includes('critical.css'))).toBe(true);
    });

    it('should analyze third-party resources', () => {
      const resources = [
        { url: 'https://example.com/app.js', type: 'script', size: 50000 },
        { url: 'https://cdn.example.com/lib.js', type: 'script', size: 30000 },
        { url: 'https://analytics.google.com/analytics.js', type: 'script', size: 20000 },
        { url: 'https://fonts.googleapis.com/css', type: 'stylesheet', size: 5000 }
      ] as Resource[];

      const result = service.analyzeThirdPartyResources(resources, 'example.com');

      expect(result.firstParty.count).toBe(2);
      expect(result.thirdParty.count).toBe(2);
      expect(result.thirdParty.domains).toContain('analytics.google.com');
      expect(result.thirdParty.domains).toContain('fonts.googleapis.com');
    });
  });

  describe('Image Optimization Analysis', () => {
    it('should detect unoptimized images', () => {
      const images = [
        { url: 'https://example.com/photo.jpg', size: 500000, width: 800, height: 600, format: 'jpeg' },
        { url: 'https://example.com/icon.png', size: 50000, width: 100, height: 100, format: 'png' },
        { url: 'https://example.com/hero.webp', size: 100000, width: 1920, height: 1080, format: 'webp' }
      ];

      const result = service.analyzeImageOptimization(images);

      expect(result.totalImages).toBe(3);
      expect(result.modernFormats).toBe(1);
      expect(result.legacyFormats).toBe(2);
    });

    it('should identify oversized images', () => {
      const images = [
        { url: 'https://example.com/large.jpg', size: 2000000, width: 4000, height: 3000, displayWidth: 800, displayHeight: 600 },
        { url: 'https://example.com/right-size.jpg', size: 50000, width: 800, height: 600, displayWidth: 800, displayHeight: 600 }
      ] as Array<ImageData & { displayWidth?: number; displayHeight?: number }>;

      const result = service.findOversizedImages(images);

      expect(result).toHaveLength(1);
      expect(result[0].url).toContain('large.jpg');
      expect(result[0].scalingFactor).toBeGreaterThan(1);
    });

    it('should detect missing lazy loading', () => {
      const images = [
        { url: 'https://example.com/above-fold.jpg', loading: 'eager', aboveFold: true },
        { url: 'https://example.com/below-fold.jpg', loading: 'eager', aboveFold: false },
        { url: 'https://example.com/lazy.jpg', loading: 'lazy', aboveFold: false }
      ] as Array<ImageData & { loading?: string; aboveFold?: boolean }>;

      const result = service.analyzeLazyLoading(images);

      expect(result.missingLazyLoad).toHaveLength(1);
      expect(result.missingLazyLoad[0].url).toContain('below-fold.jpg');
    });

    it('should recommend modern image formats', () => {
      const images = [
        { url: 'https://example.com/photo.jpg', format: 'jpeg', size: 200000 },
        { url: 'https://example.com/graphic.png', format: 'png', size: 150000 },
        { url: 'https://example.com/animation.gif', format: 'gif', size: 500000 }
      ] as ImageData[];

      const result = service.recommendImageFormats(images);

      expect(result.recommendations).toHaveLength(3);
      expect(result.recommendations[0].suggestedFormat).toBe('webp');
      expect(result.estimatedSavings).toBeGreaterThan(0);
    });
  });

  describe('JavaScript Analysis', () => {
    it('should analyze JavaScript bundle sizes', () => {
      const scripts = [
        { url: 'https://example.com/vendor.js', size: 300000, parsed: true },
        { url: 'https://example.com/app.js', size: 150000, parsed: true },
        { url: 'https://example.com/chunk-1.js', size: 50000, parsed: true }
      ];

      const result = service.analyzeJavaScript(scripts);

      expect(result.totalSize).toBe(500000);
      expect(result.bundleCount).toBe(3);
      expect(result.largestBundle.url).toContain('vendor.js');
    });

    it('should detect unused JavaScript', () => {
      const coverage = {
        'https://example.com/app.js': { total: 100000, used: 60000 },
        'https://example.com/unused.js': { total: 50000, used: 5000 }
      };

      const result = service.analyzeJavaScriptCoverage(coverage);

      expect(result.unusedBytes).toBe(85000);
      expect(result.unusedPercentage).toBeCloseTo(56.67, 0);
      expect(result.mostUnused[0].url).toContain('unused.js');
    });

    it('should identify main thread blocking', () => {
      const tasks = [
        { duration: 100, startTime: 0, type: 'script' },   // > 50ms threshold, blocking = 50
        { duration: 300, startTime: 100, type: 'script' }, // > 50ms threshold, blocking = 250
        { duration: 50, startTime: 400, type: 'layout' }   // = 50ms, not a long task
      ];

      const result = service.analyzeMainThreadBlocking(tasks);

      // Total blocking time = (100-50) + (300-50) = 50 + 250 = 300ms
      expect(result.totalBlockingTime).toBe(300);
      expect(result.longTasks).toHaveLength(2); // 100ms and 300ms tasks
    });
  });

  describe('CSS Analysis', () => {
    it('should analyze CSS file sizes', () => {
      const stylesheets = [
        { url: 'https://example.com/main.css', size: 80000 },
        { url: 'https://example.com/components.css', size: 40000 }
      ];

      const result = service.analyzeCSS(stylesheets);

      expect(result.totalSize).toBe(120000);
      expect(result.fileCount).toBe(2);
    });

    it('should detect unused CSS', () => {
      const coverage = {
        'https://example.com/main.css': { total: 80000, used: 40000 }
      };

      const result = service.analyzeCSSCoverage(coverage);

      expect(result.unusedBytes).toBe(40000);
      expect(result.unusedPercentage).toBe(50);
    });

    it('should identify critical CSS candidates', () => {
      const rules = [
        { selector: '.above-fold-element', isAboveFold: true, size: 500 },
        { selector: '.below-fold-element', isAboveFold: false, size: 300 },
        { selector: 'header', isAboveFold: true, size: 200 }
      ];

      const result = service.identifyCriticalCSS(rules);

      expect(result.criticalRules).toHaveLength(2);
      expect(result.criticalSize).toBe(700);
    });
  });

  describe('Caching Analysis', () => {
    it('should analyze cache headers', () => {
      const resources: Array<{ url: string; headers: Record<string, string> }> = [
        { url: 'https://example.com/app.js', headers: { 'cache-control': 'max-age=31536000' } },
        { url: 'https://example.com/api/data', headers: { 'cache-control': 'no-cache' } },
        { url: 'https://example.com/style.css', headers: {} }
      ];

      const result = service.analyzeCaching(resources);

      expect(result.withCaching).toBe(2);
      expect(result.withoutCaching).toBe(1);
      expect(result.longTermCached).toBe(1);
    });

    it('should identify caching opportunities', () => {
      const resources = [
        { url: 'https://example.com/vendor.js', headers: {}, isStatic: true },
        { url: 'https://example.com/logo.png', headers: {}, isStatic: true },
        { url: 'https://example.com/api/data', headers: {}, isStatic: false }
      ];

      const result = service.findCachingOpportunities(resources);

      expect(result.opportunities).toHaveLength(2);
    });

    it('should calculate potential cache savings', () => {
      const resources = [
        { url: 'https://example.com/app.js', size: 100000, headers: {}, requestCount: 10 }
      ];

      const result = service.calculateCacheSavings(resources);

      expect(result.potentialSavings).toBe(900000); // 9 requests * 100000 bytes
    });
  });

  describe('Compression Analysis', () => {
    it('should detect compression usage', () => {
      const resources: Array<{ url: string; headers: Record<string, string>; size: number }> = [
        { url: 'https://example.com/app.js', headers: { 'content-encoding': 'gzip' }, size: 50000 },
        { url: 'https://example.com/style.css', headers: { 'content-encoding': 'br' }, size: 20000 },
        { url: 'https://example.com/data.json', headers: {}, size: 30000 }
      ];

      const result = service.analyzeCompression(resources);

      expect(result.gzipped).toBe(1);
      expect(result.brotli).toBe(1);
      expect(result.uncompressed).toBe(1);
    });

    it('should find compression opportunities', () => {
      const resources = [
        { url: 'https://example.com/large.js', headers: {}, size: 100000, type: 'script' },
        { url: 'https://example.com/small.js', headers: {}, size: 500, type: 'script' },
        { url: 'https://example.com/image.jpg', headers: {}, size: 200000, type: 'image' }
      ];

      const result = service.findCompressionOpportunities(resources);

      expect(result.opportunities).toHaveLength(1); // Only large.js (images don't compress well)
      expect(result.opportunities[0].url).toContain('large.js');
    });
  });

  describe('Performance Scoring', () => {
    it('should calculate overall performance score', () => {
      const metrics = {
        webVitals: { overallScore: 85 },
        lighthouse: { performance: 90 },
        resourceOptimization: 80,
        caching: 70
      };

      const score = service.calculatePerformanceScore(metrics);

      expect(score).toBeGreaterThan(70);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should grade performance', () => {
      expect(service.gradePerformance(95)).toBe('A');
      expect(service.gradePerformance(85)).toBe('B');
      expect(service.gradePerformance(75)).toBe('C');
      expect(service.gradePerformance(65)).toBe('D');
      expect(service.gradePerformance(45)).toBe('F');
    });
  });

  describe('Performance Issues', () => {
    it('should create performance issues with severity', () => {
      const issue = service.createIssue({
        type: 'slow_lcp',
        description: 'LCP is 4.5 seconds, exceeding the 2.5s threshold',
        severity: 'high',
        metric: 'LCP',
        value: 4500,
        threshold: 2500
      });

      expect(issue.type).toBe('slow_lcp');
      expect(issue.severity).toBe('high');
    });

    it('should generate recommendations from issues', () => {
      service.addIssue({
        type: 'large_images',
        description: '5 images exceed 500KB',
        severity: 'medium',
        affectedResources: ['image1.jpg', 'image2.jpg']
      });

      const recommendations = service.generateRecommendations();

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].issue).toBe('large_images');
    });
  });

  describe('Event Handling', () => {
    it('should emit events during analysis', async () => {
      const events: string[] = [];

      service.on('analysis:start', () => events.push('start'));
      service.on('analysis:progress', () => events.push('progress'));
      service.on('analysis:complete', () => events.push('complete'));

      service.emit('analysis:start', { url: 'https://example.com' });
      service.emit('analysis:progress', { progress: 50 });
      service.emit('analysis:complete', { score: 85 });

      expect(events).toContain('start');
      expect(events).toContain('progress');
      expect(events).toContain('complete');
    });
  });
});
