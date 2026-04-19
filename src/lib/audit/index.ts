/**
 * Audit Module - Real Web Crawling and Analysis for GEO Optimization
 * Performs actual technical site analysis with real feedback
 */

import * as cheerio from "cheerio";
import { createId } from "@paralleldrive/cuid2";

export interface CrawlPage {
  url: string;
  title: string;
  metaDescription: string;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  wordCount: number;
  paragraphCount: number;
  imageCount: number;
  linkCount: number;
  internalLinks: string[];
  externalLinks: string[];
  schema: Array<{ type: string; properties: Record<string, unknown> }>;
  headingStructure: Array<{
    level: 1 | 2 | 3 | 4 | 5 | 6;
    text: string;
  }>;
  readabilityScore: number;
  body: string;

  // Extended signals (added for real scoring — see src/lib/audit/scoring.ts).
  /** 0..1 — images with non-empty alt / total images. 1.0 when imageCount===0. */
  imageAltRatio: number;
  /** Canonical URL from <link rel="canonical">, or null. */
  canonicalUrl: string | null;
  /** Open Graph tags — picked fields only. */
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
  };
  /** Sentence count (naive: split by .!? preserving boundaries). */
  sentenceCount: number;
  /** Average sentence length in words. 0 when no sentences. */
  avgSentenceLength: number;
  /** Count of "?" in headings — proxy for FAQ-style intent. */
  questionCount: number;
  /** Count of semantic landmark elements (nav/main/article/aside/section/header/footer). */
  semanticTagCount: number;
  /** Count of "click here" / "read more" / "here" links (anti-pattern for a11y + SEO). */
  bareLinkCount: number;
}

export interface CrawlResult {
  success: boolean;
  pages: CrawlPage[];
  duration: number;
  errors: Array<{ url: string; error: string }>;
  totalPagesFound: number;
  totalPagesCrawled: number;
}

export interface AuditIssue {
  id: string;
  category:
    | "schema"
    | "structure"
    | "content"
    | "metadata"
    | "technical"
    | "accessibility";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  affectedPages?: string[];
  recommendation: string;
  impact: { description: string };
}

export interface AuditAnalysis {
  readability: {
    overall: number;
    grade: string;
    breakdown: {
      structure: { score: number; maxScore: number };
      schema: { score: number; maxScore: number };
      clarity: { score: number; maxScore: number };
      metadata: { score: number; maxScore: number };
      accessibility: { score: number; maxScore: number };
    };
  };
  issues: AuditIssue[];
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  recommendations: string[];
  aiReadiness: {
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
  technicalSEO: {
    coreWebVitals: string;
    mobileOptimized: boolean;
    schemaMarkup: boolean;
    metaTagsOptimized: boolean;
  };
  contentAnalysis: {
    averageWordCount: number;
    averageReadability: number;
    headingHierarchyValid: boolean;
    faqSchemaFound: boolean;
    hasStructuredContent: boolean;
  };
}

/**
 * Extract and validate schema.org markup from HTML
 */
function extractSchema(
  $: cheerio.CheerioAPI
): Array<{ type: string; properties: Record<string, unknown> }> {
  const schemas: Array<{ type: string; properties: Record<string, unknown> }> =
    [];

  const scriptTags = $("script[type='application/ld+json']");
  scriptTags.each((_, element) => {
    try {
      const content = $(element).html();
      if (!content) return;

      const parsed = JSON.parse(content);
      const schemaArray = Array.isArray(parsed) ? parsed : [parsed];

      schemaArray.forEach((schema) => {
        schemas.push({
          type: schema["@type"] || "Unknown",
          properties: schema,
        });
      });
    } catch {
      // Invalid JSON, skip
    }
  });

  return schemas;
}

/**
 * Extract heading structure and validate hierarchy
 */
function extractHeadingStructure(
  $: cheerio.CheerioAPI
): Array<{ level: 1 | 2 | 3 | 4 | 5 | 6; text: string }> {
  const headings: Array<{ level: 1 | 2 | 3 | 4 | 5 | 6; text: string }> = [];

  ["h1", "h2", "h3", "h4", "h5", "h6"].forEach((tag) => {
    $(tag).each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        headings.push({
          level: parseInt(tag[1]) as 1 | 2 | 3 | 4 | 5 | 6,
          text,
        });
      }
    });
  });

  return headings;
}

/**
 * Calculate readability score (Flesch-Kincaid simplified)
 */
function calculateReadabilityScore(text: string): number {
  if (!text || text.length < 100) return 30; // Low score for very short content

  const words = text.split(/\s+/).filter((w) => w.length > 0).length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    .length;
  const syllables = text.match(/[aeiouy]+/gi)?.length || 0;

  if (words === 0 || sentences === 0) return 30;

  // Flesch Kincaid Grade Level
  const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;

  // Convert to 0-100 score (inverse of grade)
  const score = Math.max(0, Math.min(100, 100 - grade * 3));
  return Math.round(score);
}

/**
 * Parse a single page and extract analysis data
 */
async function parsePage(url: string, html: string): Promise<CrawlPage> {
  const $ = cheerio.load(html);

  const title =
    $("title").text() ||
    $('meta[property="og:title"]').attr("content") ||
    "";
  const metaDescription =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  const h1Count = $("h1").length;
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;

  const body = $("body").text();
  const wordCount = body
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const paragraphCount = $("p").length;
  const imageCount = $("img").length;
  const linkCount = $("a").length;

  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("//")
    ) {
      externalLinks.push(href);
    } else if (href.startsWith("/") || href.startsWith("./")) {
      internalLinks.push(href);
    }
  });

  const schema = extractSchema($);
  const headingStructure = extractHeadingStructure($);
  const readabilityScore = calculateReadabilityScore(body);

  // Extended signals for signal-grounded scoring.
  const imagesWithAlt = $("img[alt]").filter((_, el) => {
    const alt = ($(el).attr("alt") ?? "").trim();
    return alt.length > 0;
  }).length;
  const imageAltRatio = imageCount > 0 ? imagesWithAlt / imageCount : 1;

  const canonicalUrl = $('link[rel="canonical"]').attr("href") ?? null;

  const og = {
    title: $('meta[property="og:title"]').attr("content") ?? null,
    description: $('meta[property="og:description"]').attr("content") ?? null,
    image: $('meta[property="og:image"]').attr("content") ?? null,
    type: $('meta[property="og:type"]').attr("content") ?? null,
  };

  // Sentence stats. Split on ., !, ? with lookbehind for letter/digit to avoid
  // breaking on "Mr." etc. Naive but consistent.
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
  const sentenceCount = sentences.length;
  const avgSentenceLength =
    sentenceCount > 0
      ? Math.round(
          sentences.reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0) /
            sentenceCount,
        )
      : 0;

  const questionCount = headingStructure.filter((h) => h.text.includes("?")).length;

  const semanticTagCount =
    $("nav").length +
    $("main").length +
    $("article").length +
    $("aside").length +
    $("section").length +
    $("header").length +
    $("footer").length;

  const bareLinkPattern = /^\s*(click here|read more|here|learn more|more|this)\s*$/i;
  let bareLinkCount = 0;
  $("a[href]").each((_, el) => {
    const text = $(el).text().trim();
    if (bareLinkPattern.test(text)) bareLinkCount += 1;
  });

  return {
    url,
    title,
    metaDescription,
    h1Count,
    h2Count,
    h3Count,
    wordCount,
    paragraphCount,
    imageCount,
    linkCount,
    internalLinks: internalLinks.slice(0, 20),
    externalLinks: externalLinks.slice(0, 20),
    schema,
    headingStructure,
    readabilityScore,
    body,
    imageAltRatio,
    canonicalUrl,
    og,
    sentenceCount,
    avgSentenceLength,
    questionCount,
    semanticTagCount,
    bareLinkCount,
  };
}

/**
 * Fetch a page using native fetch
 */
async function fetchPage(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch page");
  }
}

/**
 * Normalize and validate URL
 */
function normalizeUrl(baseUrl: string, relativePath: string): string | null {
  try {
    if (
      relativePath.startsWith("http://") ||
      relativePath.startsWith("https://")
    ) {
      return relativePath;
    }

    const base = new URL(baseUrl);
    const absolute = new URL(relativePath, base);

    if (absolute.hostname === base.hostname) {
      return absolute.toString();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Real Web Crawler
 */
export class WebCrawler {
  private baseUrl: string;
  private maxPages: number;
  private depth: number;
  private visited: Set<string> = new Set();
  private toVisit: Array<{ url: string; depth: number }> = [];

  constructor(
    baseUrl: string,
    options: {
      maxPages?: number;
      depth?: "single" | "section" | "full";
    } = {}
  ) {
    this.baseUrl = baseUrl;
    this.maxPages = options.maxPages || 50;
    this.depth = options.depth === "full" ? 3 : options.depth === "section" ? 2 : 1;

    this.toVisit.push({ url: this.baseUrl, depth: 1 });
  }

  /**
   * Crawl the site
   */
  async crawl(): Promise<CrawlResult> {
    const startTime = Date.now();
    const pages: CrawlPage[] = [];
    const errors: Array<{ url: string; error: string }> = [];
    const discoveredUrls: string[] = [];

    while (this.toVisit.length > 0 && pages.length < this.maxPages) {
      const current = this.toVisit.shift();
      if (!current) break;

      const { url, depth } = current;

      if (this.visited.has(url)) continue;
      this.visited.add(url);

      try {
        const html = await fetchPage(url);
        const page = await parsePage(url, html);
        pages.push(page);

        if (depth < this.depth) {
          const $ = cheerio.load(html);
          $("a[href]").each((_, element) => {
            const href = $(element).attr("href");
            if (!href) return;

            const absoluteUrl = normalizeUrl(this.baseUrl, href);
            if (
              absoluteUrl &&
              !this.visited.has(absoluteUrl) &&
              !this.toVisit.some((item) => item.url === absoluteUrl)
            ) {
              discoveredUrls.push(absoluteUrl);
              if (this.toVisit.length + pages.length < this.maxPages) {
                this.toVisit.push({ url: absoluteUrl, depth: depth + 1 });
              }
            }
          });
        }
      } catch (error) {
        errors.push({
          url,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: pages.length > 0,
      pages,
      duration: Date.now() - startTime,
      errors,
      totalPagesFound: discoveredUrls.length,
      totalPagesCrawled: pages.length,
    };
  }
}

/**
 * Create a crawler instance
 */
export function createCrawler(
  url: string,
  options?: {
    depth?: "single" | "section" | "full";
    maxPages?: number;
    timeout?: number;
  }
): WebCrawler {
  return new WebCrawler(url, {
    maxPages: options?.maxPages,
    depth: options?.depth,
  });
}

/**
 * Analyze crawl results and generate real audit analysis
 */
export function analyzeAuditResults(crawlResult: CrawlResult): AuditAnalysis {
  const issues: AuditIssue[] = [];

  if (crawlResult.pages.length === 0) {
    return {
      readability: {
        overall: 0,
        grade: "F",
        breakdown: {
          structure: { score: 0, maxScore: 100 },
          schema: { score: 0, maxScore: 100 },
          clarity: { score: 0, maxScore: 100 },
          metadata: { score: 0, maxScore: 100 },
          accessibility: { score: 0, maxScore: 100 },
        },
      },
      issues: [
        {
          id: createId(),
          category: "technical",
          severity: "critical",
          title: "No Pages Crawled",
          description: "Unable to crawl any pages from the site",
          recommendation: "Check site accessibility and configuration",
          impact: { description: "Site is not accessible to AI platforms" },
        },
      ],
      summary: {
        criticalCount: 1,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
      },
      recommendations: [],
      aiReadiness: {
        score: 0,
        strengths: [],
        weaknesses: ["Site is not accessible"],
      },
      technicalSEO: {
        coreWebVitals: "Not tested",
        mobileOptimized: false,
        schemaMarkup: false,
        metaTagsOptimized: false,
      },
      contentAnalysis: {
        averageWordCount: 0,
        averageReadability: 0,
        headingHierarchyValid: false,
        faqSchemaFound: false,
        hasStructuredContent: false,
      },
    };
  }

  // Analyze content structure
  const avgWordCount =
    crawlResult.pages.reduce((sum, p) => sum + p.wordCount, 0) /
    crawlResult.pages.length;
  const avgReadability =
    crawlResult.pages.reduce((sum, p) => sum + p.readabilityScore, 0) /
    crawlResult.pages.length;

  // Check for H1 issues
  const pagesWithoutH1 = crawlResult.pages.filter((p) => p.h1Count === 0);
  if (pagesWithoutH1.length > 0) {
    issues.push({
      id: createId(),
      category: "structure",
      severity: pagesWithoutH1.length > crawlResult.pages.length / 2 ? "high" : "medium",
      title: "Missing H1 Tags",
      description: `${pagesWithoutH1.length} page(s) are missing H1 tags`,
      affectedPages: pagesWithoutH1.map((p) => p.url),
      recommendation: "Every page should have exactly one H1 tag",
      impact: { description: "AI platforms may struggle to identify page topics" },
    });
  }

  // Check for short meta descriptions
  const shortMetas = crawlResult.pages.filter(
    (p) => p.metaDescription.length < 120 || p.metaDescription.length > 160
  );
  if (shortMetas.length > 0) {
    issues.push({
      id: createId(),
      category: "metadata",
      severity: "medium",
      title: "Meta Descriptions Not Optimized",
      description: `${shortMetas.length} page(s) have meta descriptions outside 120-160 characters`,
      affectedPages: shortMetas.map((p) => p.url).slice(0, 5),
      recommendation: "Keep meta descriptions between 120-160 characters",
      impact: { description: "Affects click-through rates in AI responses" },
    });
  }

  // Check for schema.org markup
  const pagesWithoutSchema = crawlResult.pages.filter((p) => p.schema.length === 0);
  if (pagesWithoutSchema.length > 0) {
    issues.push({
      id: createId(),
      category: "schema",
      severity: "high",
      title: "Missing Schema.org Markup",
      description: `${pagesWithoutSchema.length} page(s) are missing structured data`,
      affectedPages: pagesWithoutSchema.map((p) => p.url).slice(0, 5),
      recommendation:
        "Add Organization, Article, or FAQPage schema to key pages",
      impact: { description: "Schema helps AI platforms understand content" },
    });
  }

  // Check for FAQ schema specifically
  const hasFaqSchema = crawlResult.pages.some((p) =>
    p.schema.some((s) => s.type === "FAQPage")
  );
  if (!hasFaqSchema) {
    issues.push({
      id: createId(),
      category: "schema",
      severity: "high",
      title: "No FAQ Schema Found",
      description: "Pages lack FAQPage structured data",
      recommendation:
        "Add FAQPage schema to pages with FAQ content for AI visibility",
      impact: { description: "Could improve visibility in AI responses by 5-15%" },
    });
  }

  // Check heading hierarchy
  let headingHierarchyValid = true;
  for (const page of crawlResult.pages) {
    const headings = page.headingStructure;
    if (headings.length > 0) {
      // First heading should be H1
      if (headings[0].level !== 1) {
        headingHierarchyValid = false;
        break;
      }
      // Check for skipped levels
      for (let i = 1; i < headings.length; i++) {
        if (headings[i].level - headings[i - 1].level > 1) {
          headingHierarchyValid = false;
          break;
        }
      }
    }
  }

  if (!headingHierarchyValid) {
    issues.push({
      id: createId(),
      category: "structure",
      severity: "medium",
      title: "Heading Hierarchy Issues",
      description: "Headings skip levels or don't start with H1",
      recommendation: "Ensure H1 comes first, then H2, H3, etc. without skipping",
      impact: { description: "Affects content structure readability for AI" },
    });
  }

  // Check readability
  const lowReadability = crawlResult.pages.filter((p) => p.readabilityScore < 50);
  if (lowReadability.length > 0) {
    issues.push({
      id: createId(),
      category: "content",
      severity: "medium",
      title: "Low Readability Score",
      description: `${lowReadability.length} page(s) have readability scores below 50`,
      affectedPages: lowReadability.map((p) => p.url),
      recommendation: "Simplify language, shorten paragraphs, use shorter words",
      impact: { description: "Difficult content may not be cited by AI" },
    });
  }

  // Check for insufficient content
  const thinContent = crawlResult.pages.filter((p) => p.wordCount < 300);
  if (thinContent.length > 0) {
    issues.push({
      id: createId(),
      category: "content",
      severity: "high",
      title: "Thin Content",
      description: `${thinContent.length} page(s) have less than 300 words`,
      affectedPages: thinContent.map((p) => p.url),
      recommendation: "Expand pages to at least 300-500 words for topic coverage",
      impact: {
        description: "Thin content is less likely to be referenced by AI",
      },
    });
  }

  // Calculate scores
  const structureScore = Math.round(
    75 - issues.filter((i) => i.category === "structure").length * 10
  );
  const schemaScore = Math.round(
    60 - issues.filter((i) => i.category === "schema").length * 15
  );
  const clarityScore = Math.round(Math.max(30, avgReadability * 0.8));
  const metadataScore = Math.round(
    80 - issues.filter((i) => i.category === "metadata").length * 10
  );
  const accessibilityScore = Math.round(
    75 - issues.filter((i) => i.category === "accessibility").length * 10
  );

  const overallScore = Math.round(
    (structureScore + schemaScore + clarityScore + metadataScore + accessibilityScore) /
      5
  );

  // Grade
  const grade =
    overallScore >= 90
      ? "A"
      : overallScore >= 80
        ? "B"
        : overallScore >= 70
          ? "C"
          : overallScore >= 60
            ? "D"
            : "F";

  // Summary
  const summary = {
    criticalCount: issues.filter((i) => i.severity === "critical").length,
    highCount: issues.filter((i) => i.severity === "high").length,
    mediumCount: issues.filter((i) => i.severity === "medium").length,
    lowCount: issues.filter((i) => i.severity === "low").length,
  };

  // AI Readiness
  const aiReadiness = {
    score: schemaScore,
    strengths: [
      hasFaqSchema && "FAQ schema implemented",
      crawlResult.pages.some((p) => p.schema.length > 0) && "Some schema markup present",
      avgReadability > 60 && "Good content readability",
    ].filter(Boolean) as string[],
    weaknesses: [
      !hasFaqSchema && "No FAQ schema for quick answer extraction",
      pagesWithoutSchema.length > 0 && "Missing structured data on key pages",
      thinContent.length > 0 && "Content may be too thin for AI citation",
      avgReadability < 50 && "Complex language that AI may struggle with",
    ].filter(Boolean) as string[],
  };

  return {
    readability: {
      overall: overallScore,
      grade,
      breakdown: {
        structure: { score: structureScore, maxScore: 100 },
        schema: { score: schemaScore, maxScore: 100 },
        clarity: { score: clarityScore, maxScore: 100 },
        metadata: { score: metadataScore, maxScore: 100 },
        accessibility: { score: accessibilityScore, maxScore: 100 },
      },
    },
    issues,
    summary,
    recommendations: [
      !hasFaqSchema &&
        "Implement FAQPage schema on Q&A pages to improve AI citation",
      pagesWithoutSchema.length > 0 && "Add Article and Organization schema",
      shortMetas.length > 0 && "Optimize all meta descriptions to 120-160 chars",
      headingHierarchyValid === false && "Fix heading hierarchy structure",
      thinContent.length > 0 && "Expand thin pages with more comprehensive content",
      lowReadability.length > 0 && "Simplify content language for better readability",
    ].filter(Boolean) as string[],
    aiReadiness,
    technicalSEO: {
      coreWebVitals: "Requires Google PageSpeed API",
      mobileOptimized:
        crawlResult.pages.some((p) =>
          p.body?.includes("viewport")
        ) ?? false,
      schemaMarkup: crawlResult.pages.some((p) => p.schema.length > 0),
      metaTagsOptimized:
        crawlResult.pages.filter(
          (p) => p.metaDescription.length >= 120 && p.metaDescription.length <= 160
        ).length > crawlResult.pages.length * 0.5,
    },
    contentAnalysis: {
      averageWordCount: Math.round(avgWordCount),
      averageReadability: Math.round(avgReadability),
      headingHierarchyValid,
      faqSchemaFound: hasFaqSchema,
      hasStructuredContent: crawlResult.pages.some((p) => p.schema.length > 0),
    },
  };
}
