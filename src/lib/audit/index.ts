/**
 * Audit Module - Central exports
 * Provides site crawling, readability analysis, and issue detection
 */

// Types
export type {
  CrawlConfig,
  CrawlOptions,
  CrawledPage,
  PageLink,
  PageImage,
  SchemaMarkup,
  OpenGraphData,
  PageTiming,
  ContentData,
  HeadingStructure,
  ReadabilityScore,
  ReadabilityBreakdown,
  CategoryScore,
  ScoreFactor,
  AuditIssue,
  IssueCategory,
  IssueSeverity,
  IssueImpact,
  CrawlResult,
  CrawlError,
  AnalysisResult,
  AnalysisSummary,
} from "./types";

// Crawler (F103)
export {
  SiteCrawler,
  createCrawler,
  crawlUrl,
  createCrawlJobId,
} from "./crawler";

// Readability Analyzer (F104)
export {
  analyzeReadability,
  analyzeMultiplePages,
} from "./readability-analyzer";

// Issue Detection (F105)
export {
  detectIssues,
  detectIssuesMultiple,
  generateSummary,
} from "./issue-detector";

// Combined analysis function
import type { CrawlResult, AnalysisResult } from "./types";
import { analyzeMultiplePages } from "./readability-analyzer";
import { detectIssuesMultiple } from "./issue-detector";

/**
 * Run complete audit analysis on crawl results
 */
export function analyzeAuditResults(crawlResult: CrawlResult): AnalysisResult {
  const readability = analyzeMultiplePages(crawlResult.pages);
  const { allIssues, summary } = detectIssuesMultiple(crawlResult.pages);

  // Generate recommendations based on top issues
  const recommendations = allIssues
    .filter((i) => i.severity === "critical" || i.severity === "high")
    .slice(0, 10)
    .map((i) => i.recommendation);

  return {
    readability,
    issues: allIssues,
    recommendations,
    summary,
  };
}

/**
 * Quick audit of a single URL
 */
export async function quickAudit(url: string): Promise<{
  crawlResult: CrawlResult;
  analysis: AnalysisResult;
}> {
  const { crawlUrl } = await import("./crawler");
  const crawlResult = await crawlUrl(url);
  const analysis = analyzeAuditResults(crawlResult);

  return {
    crawlResult,
    analysis,
  };
}
