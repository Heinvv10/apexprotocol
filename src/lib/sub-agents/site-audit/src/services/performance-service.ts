import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Performance Service
 *
 * Provides comprehensive performance audit functionality including:
 * - Core Web Vitals analysis (LCP, FID, CLS, INP, TTFB)
 * - Lighthouse metrics parsing
 * - Resource analysis (images, JS, CSS)
 * - Caching analysis
 * - Compression analysis
 * - Performance scoring
 */

// Configuration Schema
export const PerformanceConfigSchema = z.object({
  enableLighthouse: z.boolean().default(true),
  lighthouseCategories: z.array(z.string()).default(['performance', 'accessibility', 'best-practices', 'seo']),
  mobileEmulation: z.boolean().default(true),
  timeout: z.number().min(0).default(60000),
  largeResourceThreshold: z.number().min(0).default(100000), // 100KB
  slowResourceThreshold: z.number().min(0).default(1000) // 1s
});

export type PerformanceConfig = z.infer<typeof PerformanceConfigSchema>;

// Types
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor';
export type PerformanceGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface WebVitalThreshold {
  good: number;
  poor: number;
}

export interface WebVitalResult {
  value: number;
  rating: WebVitalRating;
  threshold: WebVitalThreshold;
}

export interface CoreWebVitals {
  lcp: WebVitalResult;
  fid: WebVitalResult;
  cls: WebVitalResult;
  inp: WebVitalResult;
  ttfb: WebVitalResult;
  overallScore: number;
}

export interface LighthouseCategories {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface LighthouseAudit {
  id: string;
  title: string;
  score: number;
  value?: number;
  displayValue?: string;
}

export interface MobileDesktopComparison {
  lcpDifference: number;
  fidDifference: number;
  clsDifference: number;
  mobileSlower: boolean;
}

export interface Resource {
  url: string;
  type: string;
  size: number;
  loadTime: number;
  renderBlocking?: boolean;
}

export interface ResourceSummary {
  count: number;
  totalSize: number;
  averageLoadTime: number;
}

export interface ResourceAnalysis {
  totalSize: number;
  totalRequests: number;
  byType: Record<string, ResourceSummary>;
}

export interface ThirdPartyAnalysis {
  firstParty: ResourceSummary;
  thirdParty: { count: number; totalSize: number; domains: string[] };
}

export interface ImageData {
  url: string;
  size: number;
  width: number;
  height: number;
  format: string;
  displayWidth?: number;
  displayHeight?: number;
  loading?: string;
  aboveFold?: boolean;
}

export interface ImageOptimizationResult {
  totalImages: number;
  modernFormats: number;
  legacyFormats: number;
}

export interface OversizedImage {
  url: string;
  scalingFactor: number;
}

export interface LazyLoadingAnalysis {
  missingLazyLoad: ImageData[];
}

export interface ImageFormatRecommendation {
  url: string;
  currentFormat: string;
  suggestedFormat: string;
}

export interface ImageRecommendations {
  recommendations: ImageFormatRecommendation[];
  estimatedSavings: number;
}

export interface ScriptData {
  url: string;
  size: number;
  parsed: boolean;
}

export interface JavaScriptAnalysis {
  totalSize: number;
  bundleCount: number;
  largestBundle: { url: string; size: number };
}

export interface CoverageData {
  total: number;
  used: number;
}

export interface CoverageAnalysis {
  unusedBytes: number;
  unusedPercentage: number;
  mostUnused: Array<{ url: string; unusedPercentage: number }>;
}

export interface LongTask {
  duration: number;
  startTime: number;
  type: string;
}

export interface MainThreadBlockingAnalysis {
  totalBlockingTime: number;
  longTasks: LongTask[];
}

export interface CSSAnalysis {
  totalSize: number;
  fileCount: number;
}

export interface CSSCoverageAnalysis {
  unusedBytes: number;
  unusedPercentage: number;
}

export interface CSSRule {
  selector: string;
  isAboveFold: boolean;
  size: number;
}

export interface CriticalCSSAnalysis {
  criticalRules: CSSRule[];
  criticalSize: number;
}

export interface CachingAnalysis {
  withCaching: number;
  withoutCaching: number;
  longTermCached: number;
}

export interface CachingOpportunity {
  url: string;
  isStatic: boolean;
}

export interface CacheSavingsResult {
  potentialSavings: number;
}

export interface CompressionAnalysis {
  gzipped: number;
  brotli: number;
  uncompressed: number;
}

export interface CompressionOpportunity {
  url: string;
  estimatedSavings: number;
}

export interface CompressionOpportunities {
  opportunities: CompressionOpportunity[];
}

export interface PerformanceIssue {
  id: string;
  type: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric?: string;
  value?: number;
  threshold?: number;
  affectedResources?: string[];
}

export interface PerformanceRecommendation {
  issue: string;
  action: string;
  priority: number;
  estimatedImpact: string;
}

/**
 * Performance Service
 */
export class PerformanceService extends EventEmitter {
  private config: PerformanceConfig;
  private issues: PerformanceIssue[] = [];
  private issueIdCounter = 0;

  constructor(config: Partial<PerformanceConfig> = {}) {
    super();
    this.config = PerformanceConfigSchema.parse(config);
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    this.issues = [];
  }

  // ==================== Core Web Vitals ====================

  private getRating(value: number, good: number, poor: number, lowerIsBetter = true): WebVitalRating {
    if (lowerIsBetter) {
      if (value <= good) return 'good';
      if (value <= poor) return 'needs-improvement';
      return 'poor';
    } else {
      if (value >= good) return 'good';
      if (value >= poor) return 'needs-improvement';
      return 'poor';
    }
  }

  /**
   * Analyze LCP
   */
  analyzeLCP(value: number): WebVitalResult {
    const threshold = { good: 2500, poor: 4000 };
    return {
      value,
      rating: this.getRating(value, threshold.good, threshold.poor),
      threshold
    };
  }

  /**
   * Analyze FID
   */
  analyzeFID(value: number): WebVitalResult {
    const threshold = { good: 100, poor: 300 };
    return {
      value,
      rating: this.getRating(value, threshold.good, threshold.poor),
      threshold
    };
  }

  /**
   * Analyze CLS
   */
  analyzeCLS(value: number): WebVitalResult {
    const threshold = { good: 0.1, poor: 0.25 };
    return {
      value,
      rating: this.getRating(value, threshold.good, threshold.poor),
      threshold
    };
  }

  /**
   * Analyze INP
   */
  analyzeINP(value: number): WebVitalResult {
    const threshold = { good: 200, poor: 500 };
    return {
      value,
      rating: this.getRating(value, threshold.good, threshold.poor),
      threshold
    };
  }

  /**
   * Analyze TTFB
   */
  analyzeTTFB(value: number): WebVitalResult {
    const threshold = { good: 800, poor: 1800 };
    return {
      value,
      rating: this.getRating(value, threshold.good, threshold.poor),
      threshold
    };
  }

  /**
   * Analyze all Web Vitals
   */
  analyzeWebVitals(metrics: { lcp: number; fid: number; cls: number; inp: number; ttfb: number }): CoreWebVitals {
    const lcp = this.analyzeLCP(metrics.lcp);
    const fid = this.analyzeFID(metrics.fid);
    const cls = this.analyzeCLS(metrics.cls);
    const inp = this.analyzeINP(metrics.inp);
    const ttfb = this.analyzeTTFB(metrics.ttfb);

    // Calculate overall score
    const ratingScores: Record<WebVitalRating, number> = { good: 100, 'needs-improvement': 50, poor: 0 };
    const scores = [lcp, fid, cls, inp, ttfb].map(m => ratingScores[m.rating]);
    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return { lcp, fid, cls, inp, ttfb, overallScore };
  }

  // ==================== Lighthouse ====================

  /**
   * Parse Lighthouse score
   */
  parseLighthouseScore(data: { categories: { performance: { score: number } } }): { performance: number } {
    return { performance: Math.round(data.categories.performance.score * 100) };
  }

  /**
   * Parse all Lighthouse categories
   */
  parseLighthouseCategories(data: {
    categories: {
      performance: { score: number };
      accessibility: { score: number };
      'best-practices': { score: number };
      seo: { score: number };
    };
  }): LighthouseCategories {
    return {
      performance: Math.round(data.categories.performance.score * 100),
      accessibility: Math.round(data.categories.accessibility.score * 100),
      bestPractices: Math.round(data.categories['best-practices'].score * 100),
      seo: Math.round(data.categories.seo.score * 100)
    };
  }

  /**
   * Extract Lighthouse audits
   */
  extractLighthouseAudits(data: {
    audits: Record<string, { id: string; title: string; score: number; numericValue?: number; displayValue?: string }>;
  }): Record<string, { score: number; value?: number }> {
    const result: Record<string, { score: number; value?: number }> = {};

    for (const [id, audit] of Object.entries(data.audits)) {
      result[id] = {
        score: Math.round(audit.score * 100),
        value: audit.numericValue
      };
    }

    return result;
  }

  /**
   * Get failed audits
   */
  getFailedAudits(data: {
    audits: Record<string, { score: number; title: string }>;
  }): Array<{ id: string; title: string; score: number }> {
    return Object.entries(data.audits)
      .filter(([, audit]) => audit.score < 0.9)
      .map(([id, audit]) => ({ id, title: audit.title, score: audit.score }))
      .sort((a, b) => a.score - b.score);
  }

  /**
   * Compare mobile vs desktop
   */
  compareMobileDesktop(
    mobile: { lcp: number; fid: number; cls: number },
    desktop: { lcp: number; fid: number; cls: number }
  ): MobileDesktopComparison {
    return {
      lcpDifference: mobile.lcp - desktop.lcp,
      fidDifference: mobile.fid - desktop.fid,
      clsDifference: mobile.cls - desktop.cls,
      mobileSlower: mobile.lcp > desktop.lcp
    };
  }

  // ==================== Resource Analysis ====================

  /**
   * Analyze resources
   */
  analyzeResources(resources: Resource[]): ResourceAnalysis {
    const byType: Record<string, ResourceSummary> = {};
    let totalSize = 0;

    for (const resource of resources) {
      totalSize += resource.size;

      if (!byType[resource.type]) {
        byType[resource.type] = { count: 0, totalSize: 0, averageLoadTime: 0 };
      }
      byType[resource.type].count++;
      byType[resource.type].totalSize += resource.size;
    }

    // Calculate average load times
    for (const type of Object.keys(byType)) {
      const typeResources = resources.filter(r => r.type === type);
      byType[type].averageLoadTime = typeResources.reduce((sum, r) => sum + r.loadTime, 0) / typeResources.length;
    }

    return {
      totalSize,
      totalRequests: resources.length,
      byType
    };
  }

  /**
   * Find large resources
   */
  findLargeResources(resources: Resource[], threshold: number): Resource[] {
    return resources
      .filter(r => r.size > threshold)
      .sort((a, b) => b.size - a.size);
  }

  /**
   * Find slow resources
   */
  findSlowResources(resources: Resource[], threshold: number): Resource[] {
    return resources
      .filter(r => r.loadTime > threshold)
      .sort((a, b) => b.loadTime - a.loadTime);
  }

  /**
   * Find render-blocking resources
   */
  findRenderBlockingResources(resources: Array<Resource & { renderBlocking?: boolean }>): Resource[] {
    return resources.filter(r => r.renderBlocking);
  }

  /**
   * Analyze third-party resources
   */
  analyzeThirdPartyResources(resources: Resource[], baseDomain: string): ThirdPartyAnalysis {
    const firstParty: Resource[] = [];
    const thirdParty: Resource[] = [];
    const thirdPartyDomains = new Set<string>();

    for (const resource of resources) {
      try {
        const domain = new URL(resource.url).hostname;
        if (domain.includes(baseDomain) || baseDomain.includes(domain)) {
          firstParty.push(resource);
        } else {
          thirdParty.push(resource);
          thirdPartyDomains.add(domain);
        }
      } catch {
        firstParty.push(resource);
      }
    }

    return {
      firstParty: {
        count: firstParty.length,
        totalSize: firstParty.reduce((sum, r) => sum + r.size, 0),
        averageLoadTime: firstParty.length > 0
          ? firstParty.reduce((sum, r) => sum + r.loadTime, 0) / firstParty.length
          : 0
      },
      thirdParty: {
        count: thirdParty.length,
        totalSize: thirdParty.reduce((sum, r) => sum + r.size, 0),
        domains: Array.from(thirdPartyDomains)
      }
    };
  }

  // ==================== Image Analysis ====================

  /**
   * Analyze image optimization
   */
  analyzeImageOptimization(images: ImageData[]): ImageOptimizationResult {
    const modernFormats = ['webp', 'avif'];
    let modern = 0;
    let legacy = 0;

    for (const image of images) {
      if (modernFormats.includes(image.format.toLowerCase())) {
        modern++;
      } else {
        legacy++;
      }
    }

    return {
      totalImages: images.length,
      modernFormats: modern,
      legacyFormats: legacy
    };
  }

  /**
   * Find oversized images
   */
  findOversizedImages(images: Array<ImageData & { displayWidth?: number; displayHeight?: number }>): OversizedImage[] {
    return images
      .filter(img => img.displayWidth && img.width > img.displayWidth * 1.5)
      .map(img => ({
        url: img.url,
        scalingFactor: img.width / (img.displayWidth || img.width)
      }));
  }

  /**
   * Analyze lazy loading
   */
  analyzeLazyLoading(images: Array<ImageData & { loading?: string; aboveFold?: boolean }>): LazyLoadingAnalysis {
    return {
      missingLazyLoad: images.filter(img => !img.aboveFold && img.loading !== 'lazy')
    };
  }

  /**
   * Recommend image formats
   */
  recommendImageFormats(images: ImageData[]): ImageRecommendations {
    const recommendations: ImageFormatRecommendation[] = [];
    let estimatedSavings = 0;

    for (const image of images) {
      if (!['webp', 'avif'].includes(image.format.toLowerCase())) {
        recommendations.push({
          url: image.url,
          currentFormat: image.format,
          suggestedFormat: 'webp'
        });
        estimatedSavings += image.size * 0.3; // Estimate 30% savings
      }
    }

    return { recommendations, estimatedSavings };
  }

  // ==================== JavaScript Analysis ====================

  /**
   * Analyze JavaScript
   */
  analyzeJavaScript(scripts: ScriptData[]): JavaScriptAnalysis {
    const totalSize = scripts.reduce((sum, s) => sum + s.size, 0);
    const largest = scripts.reduce((max, s) => s.size > max.size ? s : max, { url: '', size: 0 });

    return {
      totalSize,
      bundleCount: scripts.length,
      largestBundle: largest
    };
  }

  /**
   * Analyze JavaScript coverage
   */
  analyzeJavaScriptCoverage(coverage: Record<string, CoverageData>): CoverageAnalysis {
    let totalBytes = 0;
    let unusedBytes = 0;
    const results: Array<{ url: string; unusedPercentage: number }> = [];

    for (const [url, data] of Object.entries(coverage)) {
      totalBytes += data.total;
      unusedBytes += data.total - data.used;
      results.push({
        url,
        unusedPercentage: ((data.total - data.used) / data.total) * 100
      });
    }

    return {
      unusedBytes,
      unusedPercentage: totalBytes > 0 ? (unusedBytes / totalBytes) * 100 : 0,
      mostUnused: results.sort((a, b) => b.unusedPercentage - a.unusedPercentage)
    };
  }

  /**
   * Analyze main thread blocking
   */
  analyzeMainThreadBlocking(tasks: LongTask[]): MainThreadBlockingAnalysis {
    const longTaskThreshold = 50; // ms
    const longTasks = tasks.filter(t => t.duration > longTaskThreshold);
    const totalBlockingTime = longTasks.reduce((sum, t) => sum + (t.duration - longTaskThreshold), 0);

    return { totalBlockingTime, longTasks };
  }

  // ==================== CSS Analysis ====================

  /**
   * Analyze CSS
   */
  analyzeCSS(stylesheets: Array<{ url: string; size: number }>): CSSAnalysis {
    return {
      totalSize: stylesheets.reduce((sum, s) => sum + s.size, 0),
      fileCount: stylesheets.length
    };
  }

  /**
   * Analyze CSS coverage
   */
  analyzeCSSCoverage(coverage: Record<string, CoverageData>): CSSCoverageAnalysis {
    let totalBytes = 0;
    let unusedBytes = 0;

    for (const data of Object.values(coverage)) {
      totalBytes += data.total;
      unusedBytes += data.total - data.used;
    }

    return {
      unusedBytes,
      unusedPercentage: totalBytes > 0 ? (unusedBytes / totalBytes) * 100 : 0
    };
  }

  /**
   * Identify critical CSS
   */
  identifyCriticalCSS(rules: CSSRule[]): CriticalCSSAnalysis {
    const criticalRules = rules.filter(r => r.isAboveFold);
    const criticalSize = criticalRules.reduce((sum, r) => sum + r.size, 0);

    return { criticalRules, criticalSize };
  }

  // ==================== Caching Analysis ====================

  /**
   * Analyze caching
   */
  analyzeCaching(resources: Array<{ url: string; headers: Record<string, string> }>): CachingAnalysis {
    let withCaching = 0;
    let longTermCached = 0;

    for (const resource of resources) {
      const cacheControl = resource.headers['cache-control'] || '';
      if (cacheControl) {
        withCaching++;
        const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
        if (maxAgeMatch && parseInt(maxAgeMatch[1]) >= 86400 * 30) {
          longTermCached++;
        }
      }
    }

    return {
      withCaching,
      withoutCaching: resources.length - withCaching,
      longTermCached
    };
  }

  /**
   * Find caching opportunities
   */
  findCachingOpportunities(resources: Array<{ url: string; headers: Record<string, string>; isStatic: boolean }>): {
    opportunities: CachingOpportunity[];
  } {
    const opportunities = resources
      .filter(r => r.isStatic && !r.headers['cache-control'])
      .map(r => ({ url: r.url, isStatic: r.isStatic }));

    return { opportunities };
  }

  /**
   * Calculate cache savings
   */
  calculateCacheSavings(resources: Array<{ url: string; size: number; headers: Record<string, string>; requestCount: number }>): CacheSavingsResult {
    let potentialSavings = 0;

    for (const resource of resources) {
      if (!resource.headers['cache-control'] && resource.requestCount > 1) {
        potentialSavings += resource.size * (resource.requestCount - 1);
      }
    }

    return { potentialSavings };
  }

  // ==================== Compression Analysis ====================

  /**
   * Analyze compression
   */
  analyzeCompression(resources: Array<{ url: string; headers: Record<string, string>; size: number }>): CompressionAnalysis {
    let gzipped = 0;
    let brotli = 0;

    for (const resource of resources) {
      const encoding = resource.headers['content-encoding'] || '';
      if (encoding.includes('br')) {
        brotli++;
      } else if (encoding.includes('gzip')) {
        gzipped++;
      }
    }

    return {
      gzipped,
      brotli,
      uncompressed: resources.length - gzipped - brotli
    };
  }

  /**
   * Find compression opportunities
   */
  findCompressionOpportunities(resources: Array<{ url: string; headers: Record<string, string>; size: number; type: string }>): CompressionOpportunities {
    const compressibleTypes = ['script', 'stylesheet', 'html', 'json'];
    const opportunities = resources
      .filter(r =>
        compressibleTypes.includes(r.type) &&
        r.size > 1000 &&
        !r.headers['content-encoding']
      )
      .map(r => ({
        url: r.url,
        estimatedSavings: r.size * 0.7 // Estimate 70% compression
      }));

    return { opportunities };
  }

  // ==================== Scoring ====================

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(metrics: {
    webVitals: { overallScore: number };
    lighthouse: { performance: number };
    resourceOptimization: number;
    caching: number;
  }): number {
    const weights = {
      webVitals: 0.4,
      lighthouse: 0.3,
      resourceOptimization: 0.15,
      caching: 0.15
    };

    return Math.round(
      metrics.webVitals.overallScore * weights.webVitals +
      metrics.lighthouse.performance * weights.lighthouse +
      metrics.resourceOptimization * weights.resourceOptimization +
      metrics.caching * weights.caching
    );
  }

  /**
   * Grade performance
   */
  gradePerformance(score: number): PerformanceGrade {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // ==================== Issue Management ====================

  /**
   * Create issue
   */
  createIssue(data: {
    type: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    metric?: string;
    value?: number;
    threshold?: number;
    affectedResources?: string[];
  }): PerformanceIssue {
    return {
      id: `perf-issue-${++this.issueIdCounter}`,
      ...data
    };
  }

  /**
   * Add issue
   */
  addIssue(data: Parameters<typeof this.createIssue>[0]): void {
    this.issues.push(this.createIssue(data));
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(): PerformanceRecommendation[] {
    return this.issues.map((issue, index) => ({
      issue: issue.type,
      action: issue.description,
      priority: index + 1,
      estimatedImpact: issue.severity === 'critical' ? 'High' : issue.severity === 'high' ? 'Medium' : 'Low'
    }));
  }
}

/**
 * Factory function
 */
export function createPerformanceService(config: Partial<PerformanceConfig> = {}): PerformanceService {
  return new PerformanceService(config);
}
