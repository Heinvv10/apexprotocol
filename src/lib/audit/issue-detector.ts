/**
 * Issue Detection (F105)
 * Detect missing schema, poor headings, thin content, etc.
 */

import type {
  CrawledPage,
  AuditIssue,
  IssueCategory,
  IssueSeverity,
  IssueImpact,
  AnalysisSummary,
} from "./types";
import { createId } from "@paralleldrive/cuid2";

// AI platforms affected by issues
const AI_PLATFORMS = {
  all: ["ChatGPT", "Claude", "Gemini", "Perplexity", "Grok", "DeepSeek"],
  search: ["Perplexity", "Gemini", "ChatGPT"],
  assistants: ["ChatGPT", "Claude", "Gemini"],
  conversational: ["ChatGPT", "Claude", "Grok"],
};

/**
 * Detect all issues in a crawled page
 */
export function detectIssues(page: CrawledPage): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Run all detectors
  issues.push(...detectSchemaIssues(page));
  issues.push(...detectMetaIssues(page));
  issues.push(...detectContentIssues(page));
  issues.push(...detectStructureIssues(page));
  issues.push(...detectLinkIssues(page));
  issues.push(...detectImageIssues(page));
  issues.push(...detectPerformanceIssues(page));

  // Sort by severity
  return issues.sort((a, b) => {
    const severityOrder: Record<IssueSeverity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Detect schema markup issues
 */
function detectSchemaIssues(page: CrawledPage): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // No schema markup at all
  if (page.schemaMarkup.length === 0) {
    issues.push(createIssue({
      category: "schema",
      severity: "critical",
      title: "No Schema Markup Found",
      description: "The page has no JSON-LD structured data. AI systems rely heavily on schema markup to understand page content and context.",
      recommendation: "Add JSON-LD schema markup with at least Organization and WebPage types. Consider Article, FAQ, or Product schemas based on content type.",
      impact: {
        description: "AI systems may misunderstand or skip this content entirely",
        affectedPlatforms: AI_PLATFORMS.all,
        potentialLoss: "Up to 70% reduction in AI visibility",
      },
      aiRelevance: "high",
    }));
    return issues; // No point checking other schema issues
  }

  // Invalid schema
  const invalidSchemas = page.schemaMarkup.filter((s) => !s.isValid);
  if (invalidSchemas.length > 0) {
    issues.push(createIssue({
      category: "schema",
      severity: "high",
      title: "Invalid Schema Markup",
      description: `${invalidSchemas.length} schema block(s) contain invalid JSON or syntax errors.`,
      element: invalidSchemas.map((s) => s.errors?.join(", ")).join("; "),
      recommendation: "Fix JSON syntax errors and validate schema using Google's Rich Results Test tool.",
      impact: {
        description: "Invalid schema is ignored by AI systems",
        affectedPlatforms: AI_PLATFORMS.search,
        potentialLoss: "Schema benefits completely lost",
      },
      aiRelevance: "high",
    }));
  }

  // Missing Organization schema
  const schemaTypes = page.schemaMarkup.map((s) => s.type.toLowerCase());
  if (!schemaTypes.includes("organization")) {
    issues.push(createIssue({
      category: "schema",
      severity: "high",
      title: "Missing Organization Schema",
      description: "No Organization schema found. This schema helps AI systems understand and verify your brand identity.",
      recommendation: "Add Organization schema with name, logo, URL, social profiles, and contact information.",
      impact: {
        description: "AI may not associate content with your brand",
        affectedPlatforms: AI_PLATFORMS.assistants,
        potentialLoss: "Brand mentions may not be attributed",
      },
      aiRelevance: "high",
    }));
  }

  // Missing FAQ schema (if questions exist)
  const hasQuestions = page.content.text.match(/\?/g)?.length || 0;
  if (hasQuestions >= 3 && !schemaTypes.includes("faqpage") && !schemaTypes.includes("question")) {
    issues.push(createIssue({
      category: "schema",
      severity: "medium",
      title: "FAQ Content Without Schema",
      description: `Page contains ${hasQuestions} questions but no FAQ schema. FAQ schema significantly improves AI featured snippet potential.`,
      recommendation: "Implement FAQPage schema for question-answer pairs.",
      impact: {
        description: "Missing opportunities for AI answer boxes",
        affectedPlatforms: AI_PLATFORMS.search,
        potentialLoss: "Featured snippet eligibility reduced",
      },
      aiRelevance: "high",
    }));
  }

  // Missing WebPage schema
  if (!schemaTypes.includes("webpage") && !schemaTypes.includes("article")) {
    issues.push(createIssue({
      category: "schema",
      severity: "medium",
      title: "Missing WebPage/Article Schema",
      description: "No WebPage or Article schema found. These schemas help AI understand the page's purpose and freshness.",
      recommendation: "Add WebPage or Article schema with datePublished, dateModified, and author information.",
      impact: {
        description: "AI may not understand content recency",
        affectedPlatforms: AI_PLATFORMS.assistants,
        potentialLoss: "Content may be deprioritized as stale",
      },
      aiRelevance: "medium",
    }));
  }

  return issues;
}

/**
 * Detect meta tag issues
 */
function detectMetaIssues(page: CrawledPage): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Missing meta description
  if (!page.metaDescription) {
    issues.push(createIssue({
      category: "meta",
      severity: "critical",
      title: "Missing Meta Description",
      description: "No meta description found. This is often the first text AI systems use to understand page content.",
      recommendation: "Add a compelling meta description (120-160 characters) that summarizes the page content and includes key topics.",
      impact: {
        description: "AI systems have less context for page understanding",
        affectedPlatforms: AI_PLATFORMS.all,
        potentialLoss: "Reduced relevance in AI responses",
      },
      aiRelevance: "high",
    }));
  } else if (page.metaDescription.length < 50) {
    issues.push(createIssue({
      category: "meta",
      severity: "high",
      title: "Meta Description Too Short",
      description: `Meta description is only ${page.metaDescription.length} characters. This provides insufficient context for AI systems.`,
      element: page.metaDescription,
      recommendation: "Expand meta description to 120-160 characters with descriptive, keyword-rich content.",
      impact: {
        description: "Limited context for AI understanding",
        affectedPlatforms: AI_PLATFORMS.search,
        potentialLoss: "May be outranked by better-described pages",
      },
      aiRelevance: "medium",
    }));
  } else if (page.metaDescription.length > 160) {
    issues.push(createIssue({
      category: "meta",
      severity: "low",
      title: "Meta Description Too Long",
      description: `Meta description is ${page.metaDescription.length} characters and will likely be truncated.`,
      recommendation: "Shorten to 120-160 characters, placing key information at the beginning.",
      impact: {
        description: "Key information may be cut off",
        affectedPlatforms: AI_PLATFORMS.search,
        potentialLoss: "Truncated descriptions less effective",
      },
      aiRelevance: "low",
    }));
  }

  // Missing or poor title
  if (!page.title) {
    issues.push(createIssue({
      category: "meta",
      severity: "critical",
      title: "Missing Page Title",
      description: "No title tag found. The title is critical for AI systems to understand page topic.",
      recommendation: "Add a descriptive title tag (50-60 characters) that clearly identifies the page topic.",
      impact: {
        description: "AI cannot properly categorize page",
        affectedPlatforms: AI_PLATFORMS.all,
        potentialLoss: "Page may be skipped in AI responses",
      },
      aiRelevance: "high",
    }));
  } else if (page.title.length < 30) {
    issues.push(createIssue({
      category: "meta",
      severity: "medium",
      title: "Page Title Too Short",
      description: `Title is only ${page.title.length} characters and may not provide enough context.`,
      element: page.title,
      recommendation: "Expand title to 50-60 characters with descriptive keywords.",
      impact: {
        description: "Limited topic understanding for AI",
        affectedPlatforms: AI_PLATFORMS.search,
        potentialLoss: "Reduced relevance signals",
      },
      aiRelevance: "medium",
    }));
  }

  // Missing OpenGraph
  const ogFields = Object.values(page.openGraph).filter((v) => v).length;
  if (ogFields === 0) {
    issues.push(createIssue({
      category: "meta",
      severity: "medium",
      title: "Missing OpenGraph Metadata",
      description: "No OpenGraph tags found. These help AI systems understand content for sharing and embedding contexts.",
      recommendation: "Add og:title, og:description, og:image, and og:type tags.",
      impact: {
        description: "Poor representation when shared or embedded",
        affectedPlatforms: AI_PLATFORMS.conversational,
        potentialLoss: "Content less likely to be cited with context",
      },
      aiRelevance: "medium",
    }));
  }

  return issues;
}

/**
 * Detect content quality issues
 */
function detectContentIssues(page: CrawledPage): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Thin content
  if (page.wordCount < 300) {
    issues.push(createIssue({
      category: "content",
      severity: page.wordCount < 100 ? "critical" : "high",
      title: "Thin Content",
      description: `Page has only ${page.wordCount} words. AI systems prefer comprehensive content with sufficient context.`,
      recommendation: "Expand content to at least 300-500 words. Include detailed explanations, examples, and related topics.",
      impact: {
        description: "Insufficient content for AI to extract meaningful answers",
        affectedPlatforms: AI_PLATFORMS.all,
        potentialLoss: "Page may be skipped as low-value",
      },
      aiRelevance: "high",
    }));
  }

  // No Q&A format
  const questions = page.content.text.match(/[^.!?]*\?/g) || [];
  if (questions.length === 0) {
    issues.push(createIssue({
      category: "content",
      severity: "medium",
      title: "No Q&A Format Content",
      description: "Page contains no question-answer style content. AI systems favor content that directly answers user questions.",
      recommendation: "Add FAQ section or restructure content as questions and answers about your topic.",
      impact: {
        description: "Content less likely to appear in direct answer features",
        affectedPlatforms: AI_PLATFORMS.search,
        potentialLoss: "Missing featured snippet opportunities",
      },
      aiRelevance: "high",
    }));
  }

  // No lists or tables
  if (page.content.lists === 0 && page.content.tables === 0) {
    issues.push(createIssue({
      category: "content",
      severity: "low",
      title: "No Structured Content Elements",
      description: "Page has no lists or tables. Structured content is easier for AI to parse and present.",
      recommendation: "Add bulleted/numbered lists for key points and tables for comparative data.",
      impact: {
        description: "Content harder for AI to extract key points",
        affectedPlatforms: AI_PLATFORMS.assistants,
        potentialLoss: "May be summarized less accurately",
      },
      aiRelevance: "medium",
    }));
  }

  return issues;
}

/**
 * Detect structure issues
 */
function detectStructureIssues(page: CrawledPage): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // No H1 tag
  if (page.h1Tags.length === 0) {
    issues.push(createIssue({
      category: "structure",
      severity: "critical",
      title: "Missing H1 Tag",
      description: "No H1 heading found. The H1 is crucial for AI systems to understand the main topic.",
      recommendation: "Add a single, descriptive H1 tag that clearly states the page's main topic.",
      impact: {
        description: "AI cannot identify main topic",
        affectedPlatforms: AI_PLATFORMS.all,
        potentialLoss: "Page relevance significantly reduced",
      },
      aiRelevance: "high",
    }));
  } else if (page.h1Tags.length > 1) {
    issues.push(createIssue({
      category: "structure",
      severity: "high",
      title: "Multiple H1 Tags",
      description: `Page has ${page.h1Tags.length} H1 tags. Multiple H1s confuse AI about the main topic.`,
      element: page.h1Tags.join(", "),
      recommendation: "Use only one H1 tag for the main heading. Convert others to H2 or lower.",
      impact: {
        description: "Unclear page hierarchy for AI parsing",
        affectedPlatforms: AI_PLATFORMS.all,
        potentialLoss: "Topic may be misidentified",
      },
      aiRelevance: "high",
    }));
  }

  // No H2 subheadings
  if (page.h2Tags.length === 0 && page.wordCount > 300) {
    issues.push(createIssue({
      category: "structure",
      severity: "high",
      title: "No H2 Subheadings",
      description: "Long content with no H2 subheadings. Subheadings help AI break down content into sections.",
      recommendation: "Add H2 subheadings to divide content into logical sections (every 200-300 words).",
      impact: {
        description: "AI cannot easily segment content",
        affectedPlatforms: AI_PLATFORMS.assistants,
        potentialLoss: "Content harder to reference in parts",
      },
      aiRelevance: "medium",
    }));
  }

  // Check heading hierarchy
  const headings = page.content.headings;
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1].level;
    const curr = headings[i].level;
    if (curr > prev + 1) {
      issues.push(createIssue({
        category: "structure",
        severity: "medium",
        title: "Broken Heading Hierarchy",
        description: `Heading level skipped from H${prev} to H${curr}. AI systems expect logical hierarchy.`,
        element: `"${headings[i - 1].text}" (H${prev}) → "${headings[i].text}" (H${curr})`,
        recommendation: "Fix heading hierarchy to flow logically: H1 → H2 → H3, without skipping levels.",
        impact: {
          description: "Content structure unclear to AI",
          affectedPlatforms: AI_PLATFORMS.assistants,
          potentialLoss: "Section relationships may be misunderstood",
        },
        aiRelevance: "medium",
      }));
      break; // Only report first occurrence
    }
  }

  return issues;
}

/**
 * Detect link issues
 */
function detectLinkIssues(page: CrawledPage): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Non-descriptive links
  const badLinkTexts = ["click here", "read more", "learn more", "here", "link", "this"];
  const badLinks = page.links.filter((link) =>
    badLinkTexts.includes(link.text.toLowerCase().trim())
  );
  if (badLinks.length > 0) {
    issues.push(createIssue({
      category: "links",
      severity: "medium",
      title: "Non-Descriptive Link Text",
      description: `${badLinks.length} link(s) use generic text like "click here". AI systems use link text to understand linked content.`,
      element: badLinks.slice(0, 3).map((l) => `"${l.text}" → ${l.href}`).join("; "),
      recommendation: "Replace generic link text with descriptive phrases that explain the linked content.",
      impact: {
        description: "AI cannot understand link context",
        affectedPlatforms: AI_PLATFORMS.all,
        potentialLoss: "Link context and relationships lost",
      },
      aiRelevance: "medium",
    }));
  }

  // No internal links
  const internalLinks = page.links.filter((l) => l.isInternal);
  if (internalLinks.length < 2 && page.wordCount > 200) {
    issues.push(createIssue({
      category: "links",
      severity: "medium",
      title: "Insufficient Internal Linking",
      description: `Only ${internalLinks.length} internal link(s). Internal links help AI understand content relationships.`,
      recommendation: "Add relevant internal links to related pages on your site.",
      impact: {
        description: "AI sees content as isolated/unconnected",
        affectedPlatforms: AI_PLATFORMS.search,
        potentialLoss: "Topical authority signals weakened",
      },
      aiRelevance: "medium",
    }));
  }

  return issues;
}

/**
 * Detect image issues
 */
function detectImageIssues(page: CrawledPage): AuditIssue[] {
  const issues: AuditIssue[] = [];

  if (page.images.length === 0) {
    return issues; // No images to check
  }

  // Missing alt text
  const missingAlt = page.images.filter((img) => !img.hasAlt);
  if (missingAlt.length > 0) {
    issues.push(createIssue({
      category: "images",
      severity: missingAlt.length > 5 ? "high" : "medium",
      title: "Images Missing Alt Text",
      description: `${missingAlt.length} of ${page.images.length} images have no alt text. Alt text helps AI understand image content.`,
      element: missingAlt.slice(0, 3).map((i) => i.src).join("; "),
      recommendation: "Add descriptive alt text to all images explaining what they show.",
      impact: {
        description: "AI cannot understand image content",
        affectedPlatforms: AI_PLATFORMS.all,
        potentialLoss: "Visual content context lost",
      },
      aiRelevance: "medium",
    }));
  }

  // Generic alt text
  const genericAlts = ["image", "img", "photo", "picture", "screenshot"];
  const genericAltImages = page.images.filter(
    (img) => img.hasAlt && genericAlts.includes(img.alt.toLowerCase().trim())
  );
  if (genericAltImages.length > 0) {
    issues.push(createIssue({
      category: "images",
      severity: "low",
      title: "Generic Image Alt Text",
      description: `${genericAltImages.length} images have generic alt text like "image" or "photo".`,
      recommendation: "Write specific, descriptive alt text that explains image content and context.",
      impact: {
        description: "Alt text provides no useful context",
        affectedPlatforms: AI_PLATFORMS.assistants,
        potentialLoss: "Image context not available",
      },
      aiRelevance: "low",
    }));
  }

  return issues;
}

/**
 * Detect performance issues (basic)
 */
function detectPerformanceIssues(page: CrawledPage): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Slow load time
  if (page.timing.loadTime > 5000) {
    issues.push(createIssue({
      category: "performance",
      severity: page.timing.loadTime > 10000 ? "high" : "medium",
      title: "Slow Page Load Time",
      description: `Page took ${(page.timing.loadTime / 1000).toFixed(1)}s to load. AI crawlers have timeout limits.`,
      recommendation: "Optimize page performance: compress images, minimize JS/CSS, use caching.",
      impact: {
        description: "AI crawlers may timeout or skip slow pages",
        affectedPlatforms: AI_PLATFORMS.search,
        potentialLoss: "Page may not be fully indexed",
      },
      aiRelevance: "medium",
    }));
  }

  // Slow TTFB
  if (page.timing.ttfb > 2000) {
    issues.push(createIssue({
      category: "performance",
      severity: "medium",
      title: "Slow Server Response",
      description: `Time to First Byte (TTFB) is ${page.timing.ttfb}ms. Slow server response affects crawl efficiency.`,
      recommendation: "Optimize server response time with caching, CDN, or server upgrades.",
      impact: {
        description: "Slower crawling may reduce index freshness",
        affectedPlatforms: AI_PLATFORMS.search,
        potentialLoss: "Content updates may be delayed in AI knowledge",
      },
      aiRelevance: "low",
    }));
  }

  return issues;
}

/**
 * Helper: Create an issue with defaults
 */
function createIssue(params: {
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
}): AuditIssue {
  return {
    id: createId(),
    ...params,
  };
}

/**
 * Generate analysis summary from issues
 */
export function generateSummary(issues: AuditIssue[]): AnalysisSummary {
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const highCount = issues.filter((i) => i.severity === "high").length;
  const mediumCount = issues.filter((i) => i.severity === "medium").length;
  const lowCount = issues.filter((i) => i.severity === "low").length;

  // Get top priorities (critical and high issues)
  const topPriorities = issues
    .filter((i) => i.severity === "critical" || i.severity === "high")
    .slice(0, 5)
    .map((i) => i.title);

  return {
    totalIssues: issues.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    topPriorities,
  };
}

/**
 * Detect issues across multiple pages
 */
export function detectIssuesMultiple(pages: CrawledPage[]): {
  allIssues: AuditIssue[];
  summary: AnalysisSummary;
  pageIssues: Map<string, AuditIssue[]>;
} {
  const pageIssues = new Map<string, AuditIssue[]>();
  const allIssues: AuditIssue[] = [];

  for (const page of pages) {
    const issues = detectIssues(page);
    pageIssues.set(page.url, issues);
    allIssues.push(...issues);
  }

  return {
    allIssues,
    summary: generateSummary(allIssues),
    pageIssues,
  };
}
