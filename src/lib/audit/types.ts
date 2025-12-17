/**
 * Audit Module Types
 * Type definitions for site crawling and analysis
 */

// Crawl configuration
export interface CrawlConfig {
  url: string;
  depth: "single" | "section" | "full";
  maxPages: number;
  timeout: number; // milliseconds
  options: CrawlOptions;
}

export interface CrawlOptions {
  checkSchema: boolean;
  checkMeta: boolean;
  checkContent: boolean;
  checkLinks: boolean;
  checkPerformance: boolean;
  checkAccessibility: boolean;
  checkSecurity: boolean;
}

// Page data from crawling
export interface CrawledPage {
  url: string;
  statusCode: number;
  title: string;
  metaDescription: string;
  h1Tags: string[];
  h2Tags: string[];
  wordCount: number;
  links: PageLink[];
  images: PageImage[];
  schemaMarkup: SchemaMarkup[];
  openGraph: OpenGraphData;
  timing: PageTiming;
  content: ContentData;
  appleTouchIcon?: string;
  favicon?: string;
}

export interface PageLink {
  href: string;
  text: string;
  isInternal: boolean;
  isNoFollow: boolean;
  status?: number;
}

export interface PageImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  hasAlt: boolean;
  lazyLoaded: boolean;
}

export interface SchemaMarkup {
  type: string;
  properties: Record<string, unknown>;
  isValid: boolean;
  errors?: string[];
}

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  url?: string;
  siteName?: string;
}

export interface PageTiming {
  loadTime: number;
  ttfb: number; // Time to first byte
  domContentLoaded: number;
  fullyLoaded: number;
}

export interface ContentData {
  text: string;
  headings: HeadingStructure[];
  paragraphs: number;
  lists: number;
  tables: number;
  codeBlocks: number;
}

export interface HeadingStructure {
  level: number;
  text: string;
  order: number;
}

// Readability Analysis
export interface ReadabilityScore {
  overall: number; // 0-100
  breakdown: ReadabilityBreakdown;
  grade: "excellent" | "good" | "average" | "poor" | "critical";
}

export interface ReadabilityBreakdown {
  structure: CategoryScore;
  schema: CategoryScore;
  clarity: CategoryScore;
  metadata: CategoryScore;
  accessibility: CategoryScore;
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  weight: number;
  factors: ScoreFactor[];
}

export interface ScoreFactor {
  name: string;
  score: number;
  maxScore: number;
  details: string;
  passed: boolean;
}

// Issue Detection
export interface AuditIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  element?: string;
  location?: string;
  recommendation: string;
  impact: IssueImpact;
  aiRelevance: "high" | "medium" | "low";
  references?: string[];
}

export type IssueCategory =
  | "schema"
  | "meta"
  | "content"
  | "structure"
  | "links"
  | "images"
  | "performance"
  | "accessibility"
  | "security";

export type IssueSeverity = "critical" | "high" | "medium" | "low";

export interface IssueImpact {
  description: string;
  affectedPlatforms: string[];
  potentialLoss: string;
}

// Crawl Result
export interface CrawlResult {
  success: boolean;
  url: string;
  pages: CrawledPage[];
  totalPages: number;
  duration: number;
  errors: CrawlError[];
}

export interface CrawlError {
  url: string;
  error: string;
  code?: string;
}

// Analysis Result
export interface AnalysisResult {
  readability: ReadabilityScore;
  issues: AuditIssue[];
  recommendations: string[];
  summary: AnalysisSummary;
}

export interface AnalysisSummary {
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  topPriorities: string[];
}
