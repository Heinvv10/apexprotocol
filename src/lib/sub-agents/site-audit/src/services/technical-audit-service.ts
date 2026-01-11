import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Technical Audit Service
 *
 * Provides comprehensive technical SEO audit functionality including:
 * - Indexability analysis
 * - Crawlability analysis
 * - Security analysis (SSL, headers, mixed content)
 * - Redirect analysis
 * - HTTP status analysis
 * - Technical issue detection
 */

// Configuration Schema
export const TechnicalAuditConfigSchema = z.object({
  checkSSL: z.boolean().default(true),
  checkRedirects: z.boolean().default(true),
  checkIndexability: z.boolean().default(true),
  maxRedirectChain: z.number().min(1).default(5),
  thinContentThreshold: z.number().min(1).default(300),
  maxUrlLength: z.number().min(1).default(200)
});

export type TechnicalAuditConfig = z.infer<typeof TechnicalAuditConfigSchema>;

// Types
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface IndexabilityResult {
  isIndexable: boolean;
  robotsMetaTag: string | null;
  xRobotsTag: string | null;
  blockingReasons: string[];
  canonicalUrl: string | null;
  hasCanonicalMismatch: boolean;
  pagination: {
    hasPrev: boolean;
    hasNext: boolean;
    prevUrl: string | null;
    nextUrl: string | null;
  };
}

export interface CrawlabilityResult {
  isAllowed: boolean;
  robotsTxtExists: boolean;
  blockingRule: string | null;
}

export interface InternalLinkingResult {
  orphanPages: string[];
  wellLinkedPages: string[];
  averageInternalLinks: number;
}

export interface CrawlDepthResult {
  maxDepth: number;
  averageDepth: number;
  depthDistribution: Record<number, number>;
}

export interface SSLResult {
  isSecure: boolean;
  daysUntilExpiry: number;
  protocol: string;
  expiryWarning: boolean;
  issues: string[];
}

export interface MixedContentResult {
  hasMixedContent: boolean;
  insecureResources: string[];
}

export interface SecurityHeadersResult {
  hasHSTS: boolean;
  hasXContentTypeOptions: boolean;
  hasXFrameOptions: boolean;
  hasCSP: boolean;
  missingHeaders: string[];
  securityScore: number;
}

export interface RedirectItem {
  from: string;
  to: string;
  statusCode: number;
}

export interface RedirectChainResult {
  chainLength: number;
  hasRedirectLoop: boolean;
  isTooLong: boolean;
  finalUrl: string;
  issues: string[];
}

export interface StatusCodeResult {
  successful: number;
  redirects: number;
  clientErrors: number;
  serverErrors: number;
}

export interface Soft404Result {
  isSoft404: boolean;
  confidence: number;
}

export interface DuplicateGroup {
  contentHash: string;
  urls: string[];
}

export interface DuplicateContentResult {
  duplicateGroups: DuplicateGroup[];
  totalDuplicates: number;
}

export interface ThinContentResult {
  isThinContent: boolean;
  wordCount: number;
  recommendation: string;
}

export interface UrlAnalysisResult {
  mixedCaseUrls: string[];
  tooLongUrls: string[];
  urlsWithSpaces: string[];
  underscoreUrls: string[];
}

export interface TechnicalIssue {
  id: string;
  type: string;
  url: string;
  description: string;
  severity: IssueSeverity;
  recommendation?: string;
}

export interface IssueSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface PageData {
  url: string;
  statusCode: number;
  headers: Record<string, string>;
  html: string;
}

export interface RobotsData {
  exists: boolean;
  disallowedPaths: string[];
  allowedPaths: string[];
  crawlDelay: number;
}

export interface CrawlData {
  pages: Array<{ url: string; statusCode: number; depth: number }>;
  errors: Array<{ url: string; statusCode: number }>;
  robotsTxt: RobotsData;
  sitemap: { urls: string[]; isIndex: boolean };
}

export interface TechnicalAuditResult {
  domain: string;
  pagesAnalyzed: number;
  technicalScore: number;
  issues: TechnicalIssue[];
  recommendations: string[];
}

/**
 * Technical Audit Service
 */
export class TechnicalAuditService extends EventEmitter {
  private config: TechnicalAuditConfig;
  private issues: TechnicalIssue[] = [];
  private issueIdCounter = 0;

  constructor(config: Partial<TechnicalAuditConfig> = {}) {
    super();
    this.config = TechnicalAuditConfigSchema.parse(config);
  }

  /**
   * Get current configuration
   */
  getConfig(): TechnicalAuditConfig {
    return { ...this.config };
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    this.issues = [];
  }

  // ==================== Indexability Analysis ====================

  /**
   * Analyze page indexability
   */
  analyzeIndexability(pageData: { url: string; statusCode: number; headers: Record<string, string>; html: string }): IndexabilityResult {
    const result: IndexabilityResult = {
      isIndexable: true,
      robotsMetaTag: null,
      xRobotsTag: null,
      blockingReasons: [],
      canonicalUrl: null,
      hasCanonicalMismatch: false,
      pagination: {
        hasPrev: false,
        hasNext: false,
        prevUrl: null,
        nextUrl: null
      }
    };

    // Extract robots meta tag
    const robotsMetaMatch = pageData.html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
    if (robotsMetaMatch) {
      result.robotsMetaTag = robotsMetaMatch[1].trim();
      if (result.robotsMetaTag.toLowerCase().includes('noindex')) {
        result.isIndexable = false;
        result.blockingReasons.push('noindex meta tag');
      }
    }

    // Check X-Robots-Tag header
    const xRobotsTag = pageData.headers['x-robots-tag'];
    if (xRobotsTag) {
      result.xRobotsTag = xRobotsTag;
      if (xRobotsTag.toLowerCase().includes('noindex')) {
        result.isIndexable = false;
        result.blockingReasons.push('X-Robots-Tag noindex');
      }
    }

    // Extract canonical
    const canonicalMatch = pageData.html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    if (canonicalMatch) {
      result.canonicalUrl = canonicalMatch[1].trim();
      if (result.canonicalUrl !== pageData.url) {
        result.hasCanonicalMismatch = true;
      }
    }

    // Extract pagination
    const prevMatch = pageData.html.match(/<link[^>]+rel=["']prev["'][^>]+href=["']([^"']+)["']/i);
    if (prevMatch) {
      result.pagination.hasPrev = true;
      result.pagination.prevUrl = prevMatch[1].trim();
    }

    const nextMatch = pageData.html.match(/<link[^>]+rel=["']next["'][^>]+href=["']([^"']+)["']/i);
    if (nextMatch) {
      result.pagination.hasNext = true;
      result.pagination.nextUrl = nextMatch[1].trim();
    }

    return result;
  }

  // ==================== Crawlability Analysis ====================

  /**
   * Analyze crawlability based on robots.txt
   */
  analyzeCrawlability(url: string, robotsData: RobotsData): CrawlabilityResult {
    const result: CrawlabilityResult = {
      isAllowed: true,
      robotsTxtExists: robotsData.exists,
      blockingRule: null
    };

    try {
      const parsed = new URL(url);
      const path = parsed.pathname;

      for (const disallowedPath of robotsData.disallowedPaths) {
        if (path.startsWith(disallowedPath)) {
          result.isAllowed = false;
          result.blockingRule = disallowedPath;
          break;
        }
      }
    } catch {
      // Invalid URL
    }

    return result;
  }

  /**
   * Analyze internal linking structure
   */
  analyzeInternalLinking(pages: Array<{ url: string; internalLinks: string[]; incomingLinks: number }>): InternalLinkingResult {
    const orphanPages: string[] = [];
    const wellLinkedPages: string[] = [];
    let totalLinks = 0;

    for (const page of pages) {
      totalLinks += page.internalLinks.length;
      if (page.incomingLinks === 0) {
        orphanPages.push(page.url);
      }
      if (page.incomingLinks >= 3) {
        wellLinkedPages.push(page.url);
      }
    }

    return {
      orphanPages,
      wellLinkedPages,
      averageInternalLinks: pages.length > 0 ? totalLinks / pages.length : 0
    };
  }

  /**
   * Analyze crawl depth
   */
  analyzeCrawlDepth(pages: Array<{ url: string; depth: number }>): CrawlDepthResult {
    if (pages.length === 0) {
      return { maxDepth: 0, averageDepth: 0, depthDistribution: {} };
    }

    const depthDistribution: Record<number, number> = {};
    let maxDepth = 0;
    let totalDepth = 0;

    for (const page of pages) {
      depthDistribution[page.depth] = (depthDistribution[page.depth] || 0) + 1;
      if (page.depth > maxDepth) maxDepth = page.depth;
      totalDepth += page.depth;
    }

    return {
      maxDepth,
      averageDepth: totalDepth / pages.length,
      depthDistribution
    };
  }

  // ==================== Security Analysis ====================

  /**
   * Analyze SSL certificate
   */
  analyzeSSL(sslData: { valid: boolean; issuer: string; expiresAt: Date; protocol: string }): SSLResult {
    const now = Date.now();
    const expiresAt = sslData.expiresAt.getTime();
    const daysUntilExpiry = Math.floor((expiresAt - now) / (24 * 60 * 60 * 1000));
    const issues: string[] = [];

    if (daysUntilExpiry < 14) {
      issues.push('Certificate expires in less than 14 days');
    }

    return {
      isSecure: sslData.valid,
      daysUntilExpiry,
      protocol: sslData.protocol,
      expiryWarning: daysUntilExpiry < 14,
      issues
    };
  }

  /**
   * Detect mixed content
   */
  detectMixedContent(pageData: { url: string; html: string }): MixedContentResult {
    const insecureResources: string[] = [];

    // Check for http:// resources on https:// page
    if (pageData.url.startsWith('https://')) {
      const httpMatches = pageData.html.matchAll(/(?:src|href)=["'](http:\/\/[^"']+)["']/gi);
      for (const match of httpMatches) {
        insecureResources.push(match[1]);
      }
    }

    return {
      hasMixedContent: insecureResources.length > 0,
      insecureResources
    };
  }

  /**
   * Analyze security headers
   */
  analyzeSecurityHeaders(headers: Record<string, string>): SecurityHeadersResult {
    const lowercaseHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      lowercaseHeaders[key.toLowerCase()] = value;
    }

    const hasHSTS = 'strict-transport-security' in lowercaseHeaders;
    const hasXContentTypeOptions = 'x-content-type-options' in lowercaseHeaders;
    const hasXFrameOptions = 'x-frame-options' in lowercaseHeaders;
    const hasCSP = 'content-security-policy' in lowercaseHeaders;

    const missingHeaders: string[] = [];
    if (!hasHSTS) missingHeaders.push('Strict-Transport-Security');
    if (!hasXContentTypeOptions) missingHeaders.push('X-Content-Type-Options');
    if (!hasXFrameOptions) missingHeaders.push('X-Frame-Options');
    if (!hasCSP) missingHeaders.push('Content-Security-Policy');

    // Calculate score (25 points each header)
    const score = [hasHSTS, hasXContentTypeOptions, hasXFrameOptions, hasCSP]
      .filter(Boolean).length * 25;

    return {
      hasHSTS,
      hasXContentTypeOptions,
      hasXFrameOptions,
      hasCSP,
      missingHeaders,
      securityScore: score
    };
  }

  // ==================== Redirect Analysis ====================

  /**
   * Analyze redirect chain
   */
  analyzeRedirectChain(redirectChain: RedirectItem[]): RedirectChainResult {
    const result: RedirectChainResult = {
      chainLength: redirectChain.length,
      hasRedirectLoop: false,
      isTooLong: redirectChain.length > this.config.maxRedirectChain,
      finalUrl: redirectChain.length > 0 ? redirectChain[redirectChain.length - 1].to : '',
      issues: []
    };

    // Check for loops
    const visited = new Set<string>();
    for (const redirect of redirectChain) {
      if (visited.has(redirect.to)) {
        result.hasRedirectLoop = true;
        break;
      }
      visited.add(redirect.from);
    }

    // Check for 302 redirects that should be 301
    for (const redirect of redirectChain) {
      if (redirect.statusCode === 302) {
        result.issues.push('Using temporary redirect (302) instead of permanent (301)');
        break;
      }
    }

    return result;
  }

  // ==================== HTTP Status Analysis ====================

  /**
   * Analyze status codes
   */
  analyzeStatusCodes(pages: Array<{ url: string; statusCode: number }>): StatusCodeResult {
    let successful = 0;
    let redirects = 0;
    let clientErrors = 0;
    let serverErrors = 0;

    for (const page of pages) {
      if (page.statusCode >= 200 && page.statusCode < 300) {
        successful++;
      } else if (page.statusCode >= 300 && page.statusCode < 400) {
        redirects++;
      } else if (page.statusCode >= 400 && page.statusCode < 500) {
        clientErrors++;
      } else if (page.statusCode >= 500) {
        serverErrors++;
      }
    }

    return { successful, redirects, clientErrors, serverErrors };
  }

  /**
   * Detect soft 404 pages
   */
  detectSoft404(pageData: { url: string; statusCode: number; html: string }): Soft404Result {
    if (pageData.statusCode !== 200) {
      return { isSoft404: false, confidence: 0 };
    }

    const lowerHtml = pageData.html.toLowerCase();
    const indicators = [
      'page not found',
      'not found',
      '404',
      'couldn\'t find',
      'could not find',
      'doesn\'t exist',
      'does not exist',
      'no longer available',
      'page missing'
    ];

    let matchCount = 0;
    for (const indicator of indicators) {
      if (lowerHtml.includes(indicator)) {
        matchCount++;
      }
    }

    const confidence = matchCount / indicators.length;
    return {
      isSoft404: confidence > 0.3,
      confidence
    };
  }

  // ==================== Technical Issue Detection ====================

  /**
   * Detect duplicate content
   */
  detectDuplicateContent(pages: Array<{ url: string; contentHash: string; title: string }>): DuplicateContentResult {
    const hashGroups: Map<string, string[]> = new Map();

    for (const page of pages) {
      if (!hashGroups.has(page.contentHash)) {
        hashGroups.set(page.contentHash, []);
      }
      hashGroups.get(page.contentHash)!.push(page.url);
    }

    const duplicateGroups: DuplicateGroup[] = [];
    let totalDuplicates = 0;

    for (const [hash, urls] of hashGroups) {
      if (urls.length > 1) {
        duplicateGroups.push({ contentHash: hash, urls });
        totalDuplicates += urls.length - 1;
      }
    }

    return { duplicateGroups, totalDuplicates };
  }

  /**
   * Detect thin content
   */
  detectThinContent(pageData: { url: string; wordCount: number; html: string }): ThinContentResult {
    const isThin = pageData.wordCount < this.config.thinContentThreshold;

    return {
      isThinContent: isThin,
      wordCount: pageData.wordCount,
      recommendation: isThin ? 'Add more content (aim for at least 300 words)' : ''
    };
  }

  /**
   * Analyze URLs for issues
   */
  analyzeUrls(urls: string[]): UrlAnalysisResult {
    const result: UrlAnalysisResult = {
      mixedCaseUrls: [],
      tooLongUrls: [],
      urlsWithSpaces: [],
      underscoreUrls: []
    };

    for (const url of urls) {
      try {
        const parsed = new URL(url);
        const path = parsed.pathname;

        // Check for mixed case
        if (path !== path.toLowerCase()) {
          result.mixedCaseUrls.push(url);
        }

        // Check length
        if (path.length > this.config.maxUrlLength) {
          result.tooLongUrls.push(url);
        }

        // Check for spaces
        if (path.includes(' ') || path.includes('%20')) {
          result.urlsWithSpaces.push(url);
        }

        // Check for underscores
        if (path.includes('_')) {
          result.underscoreUrls.push(url);
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return result;
  }

  /**
   * Calculate technical score
   */
  calculateTechnicalScore(auditData: {
    indexablePages: number;
    totalPages: number;
    brokenLinks: number;
    redirectIssues: number;
    securityScore: number;
    duplicateContent: number;
    thinContentPages: number;
  }): number {
    let score = 100;

    // Indexability (30 points)
    const indexableRatio = auditData.totalPages > 0
      ? auditData.indexablePages / auditData.totalPages
      : 1;
    score -= (1 - indexableRatio) * 30;

    // Broken links (20 points)
    const brokenRatio = auditData.totalPages > 0
      ? auditData.brokenLinks / auditData.totalPages
      : 0;
    score -= Math.min(brokenRatio * 100, 20);

    // Security (20 points)
    score -= (100 - auditData.securityScore) * 0.2;

    // Redirects (10 points)
    score -= Math.min(auditData.redirectIssues * 2, 10);

    // Duplicates (10 points)
    const dupRatio = auditData.totalPages > 0
      ? auditData.duplicateContent / auditData.totalPages
      : 0;
    score -= Math.min(dupRatio * 50, 10);

    // Thin content (10 points)
    const thinRatio = auditData.totalPages > 0
      ? auditData.thinContentPages / auditData.totalPages
      : 0;
    score -= Math.min(thinRatio * 50, 10);

    return Math.max(0, Math.min(100, score));
  }

  // ==================== Issue Management ====================

  /**
   * Create a technical issue
   */
  createIssue(data: {
    type: string;
    url: string;
    description: string;
    severity: IssueSeverity;
    recommendation?: string;
  }): TechnicalIssue {
    return {
      id: `tech-issue-${++this.issueIdCounter}`,
      ...data
    };
  }

  /**
   * Add an issue
   */
  addIssue(data: {
    type: string;
    severity: IssueSeverity;
    url: string;
    description: string;
    recommendation?: string;
  }): void {
    this.issues.push(this.createIssue(data));
  }

  /**
   * Get issues sorted by priority
   */
  getIssuesByPriority(): TechnicalIssue[] {
    const severityOrder: Record<IssueSeverity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    };

    return [...this.issues].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
  }

  /**
   * Get issues grouped by type
   */
  getIssuesByType(): Record<string, TechnicalIssue[]> {
    const grouped: Record<string, TechnicalIssue[]> = {};

    for (const issue of this.issues) {
      if (!grouped[issue.type]) {
        grouped[issue.type] = [];
      }
      grouped[issue.type].push(issue);
    }

    return grouped;
  }

  /**
   * Get issue summary
   */
  getIssueSummary(): IssueSummary {
    const summary: IssueSummary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: this.issues.length
    };

    for (const issue of this.issues) {
      summary[issue.severity]++;
    }

    return summary;
  }

  // ==================== Result Generation ====================

  /**
   * Generate comprehensive audit result
   */
  generateAuditResult(crawlData: CrawlData): TechnicalAuditResult {
    const domain = crawlData.pages.length > 0
      ? new URL(crawlData.pages[0].url).hostname
      : '';

    return {
      domain,
      pagesAnalyzed: crawlData.pages.length,
      technicalScore: this.calculateTechnicalScore({
        indexablePages: crawlData.pages.filter(p => p.statusCode === 200).length,
        totalPages: crawlData.pages.length,
        brokenLinks: crawlData.errors.length,
        redirectIssues: 0,
        securityScore: 75,
        duplicateContent: 0,
        thinContentPages: 0
      }),
      issues: this.getIssuesByPriority(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const issuesByType = this.getIssuesByType();

    if (issuesByType['broken_link']?.length > 0) {
      recommendations.push(`Fix ${issuesByType['broken_link'].length} broken links`);
    }
    if (issuesByType['redirect']?.length > 0) {
      recommendations.push(`Review ${issuesByType['redirect'].length} redirect issues`);
    }
    if (issuesByType['security']?.length > 0) {
      recommendations.push('Improve security headers configuration');
    }

    return recommendations;
  }
}

/**
 * Factory function
 */
export function createTechnicalAuditService(config: Partial<TechnicalAuditConfig> = {}): TechnicalAuditService {
  return new TechnicalAuditService(config);
}
