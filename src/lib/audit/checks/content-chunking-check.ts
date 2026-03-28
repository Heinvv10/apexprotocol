/**
 * Content Chunking Score Check
 * Analyzes page content structure for AI-readability and chunking optimization
 */

import { createId } from "@paralleldrive/cuid2";
import * as cheerio from "cheerio";
import type { AuditIssue } from "@/lib/db/schema/audits";

export interface ContentChunkingResult {
  score: number;
  issues: AuditIssue[];
  breakdown: {
    faqSchema: number;
    headingStructure: number;
    paragraphLength: number;
    listUsage: number;
    contentDepth: number;
  };
}

/**
 * Check for FAQ schema in the page
 */
function checkFaqSchema($: cheerio.CheerioAPI): boolean {
  const scriptTags = $("script[type='application/ld+json']");
  let hasFaqSchema = false;

  scriptTags.each((_, element) => {
    try {
      const content = $(element).html();
      if (!content) return;

      const parsed = JSON.parse(content);
      const schemas = Array.isArray(parsed) ? parsed : [parsed];

      for (const schema of schemas) {
        if (schema["@type"] === "FAQPage" || schema["@type"] === "QAPage") {
          hasFaqSchema = true;
        }
        // Also check for nested FAQ in @graph
        if (schema["@graph"] && Array.isArray(schema["@graph"])) {
          for (const item of schema["@graph"]) {
            if (item["@type"] === "FAQPage" || item["@type"] === "QAPage") {
              hasFaqSchema = true;
            }
          }
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  });

  return hasFaqSchema;
}

/**
 * Analyze heading structure
 */
function analyzeHeadingStructure($: cheerio.CheerioAPI): {
  hasH2H3: boolean;
  hierarchyValid: boolean;
  headingCount: number;
} {
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;
  const h1Count = $("h1").length;

  // Check for H2/H3 presence
  const hasH2H3 = h2Count > 0 || h3Count > 0;

  // Check hierarchy validity
  let hierarchyValid = true;
  const headings: { level: number; index: number }[] = [];

  $("h1, h2, h3, h4, h5, h6").each((index, element) => {
    const tagName = element.tagName.toLowerCase();
    const level = parseInt(tagName[1], 10);
    headings.push({ level, index });
  });

  // Check for skipped levels
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level - headings[i - 1].level > 1) {
      hierarchyValid = false;
      break;
    }
  }

  // Should start with H1
  if (headings.length > 0 && headings[0].level !== 1) {
    hierarchyValid = false;
  }

  return {
    hasH2H3,
    hierarchyValid,
    headingCount: h1Count + h2Count + h3Count,
  };
}

/**
 * Analyze paragraph lengths
 */
function analyzeParagraphs($: cheerio.CheerioAPI): {
  avgWordCount: number;
  totalParagraphs: number;
  wellChunked: boolean;
} {
  const paragraphs: number[] = [];

  $("p").each((_, element) => {
    const text = $(element).text().trim();
    if (text.length > 0) {
      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
      paragraphs.push(wordCount);
    }
  });

  if (paragraphs.length === 0) {
    return {
      avgWordCount: 0,
      totalParagraphs: 0,
      wellChunked: false,
    };
  }

  const avgWordCount =
    paragraphs.reduce((sum, count) => sum + count, 0) / paragraphs.length;

  // Well chunked if average paragraph is under 300 words
  const wellChunked = avgWordCount < 300;

  return {
    avgWordCount: Math.round(avgWordCount),
    totalParagraphs: paragraphs.length,
    wellChunked,
  };
}

/**
 * Check for lists (numbered and bulleted)
 */
function analyzeLists($: cheerio.CheerioAPI): {
  hasLists: boolean;
  listCount: number;
} {
  const ulCount = $("ul").length;
  const olCount = $("ol").length;

  return {
    hasLists: ulCount > 0 || olCount > 0,
    listCount: ulCount + olCount,
  };
}

/**
 * Calculate total word count
 */
function getTotalWordCount($: cheerio.CheerioAPI): number {
  const bodyText = $("body").text();
  const words = bodyText.split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

/**
 * Check content chunking and AI-readability
 * @param url - The URL to analyze
 * @returns ContentChunkingResult with score 0-100 and any issues
 */
export async function checkContentChunking(
  url: string
): Promise<ContentChunkingResult> {
  const issues: AuditIssue[] = [];
  const breakdown = {
    faqSchema: 0,
    headingStructure: 0,
    paragraphLength: 0,
    listUsage: 0,
    contentDepth: 0,
  };

  try {
    // Fetch the page
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (compatible; ApexGEO-Auditor/1.0)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        score: 0,
        issues: [
          {
            id: createId(),
            category: "content",
            severity: "high",
            title: "Unable to fetch page content",
            description: `Failed to fetch ${url} - HTTP ${response.status}`,
            recommendation: "Ensure the page is accessible and returns valid HTML.",
            impact: "Cannot analyze content structure for AI optimization.",
          },
        ],
        breakdown,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Check FAQ schema (+25 points)
    const hasFaqSchema = checkFaqSchema($);
    if (hasFaqSchema) {
      breakdown.faqSchema = 25;
    } else {
      issues.push({
        id: createId(),
        category: "schema",
        severity: "medium",
        title: "No FAQ schema detected",
        description:
          "The page does not include FAQPage structured data. FAQ schema helps AI models extract question-answer pairs directly, significantly improving the chance of being cited in AI responses.",
        recommendation:
          "Add FAQPage schema markup to pages with Q&A content. Structure your content as clear questions and answers that can be marked up with FAQ schema.",
        impact:
          "AI platforms may miss extractable Q&A content, reducing citation opportunities for direct-answer queries.",
      });
    }

    // 2. Check heading structure (+20 points)
    const headingAnalysis = analyzeHeadingStructure($);
    if (headingAnalysis.hasH2H3) {
      breakdown.headingStructure = headingAnalysis.hierarchyValid ? 20 : 10;
    }
    if (!headingAnalysis.hasH2H3) {
      issues.push({
        id: createId(),
        category: "structure",
        severity: "medium",
        title: "Missing H2/H3 heading structure",
        description:
          "The page lacks H2 or H3 headings to organize content. Well-structured headings help AI models understand content hierarchy and topic segmentation.",
        recommendation:
          "Add H2 headings for main sections and H3 headings for subsections. Use descriptive heading text that summarizes each section's content.",
        impact:
          "AI models may struggle to understand content organization, potentially misinterpreting or skipping sections.",
      });
    } else if (!headingAnalysis.hierarchyValid) {
      issues.push({
        id: createId(),
        category: "structure",
        severity: "low",
        title: "Heading hierarchy has gaps",
        description:
          "The heading structure skips levels (e.g., H1 to H3 without H2). This can confuse AI models parsing content structure.",
        recommendation:
          "Maintain proper heading hierarchy: H1 → H2 → H3, without skipping levels.",
        impact:
          "Minor impact on AI parsing - content may still be understood but with reduced structural clarity.",
      });
    }

    // 3. Check paragraph lengths (+20 points)
    const paragraphAnalysis = analyzeParagraphs($);
    if (paragraphAnalysis.wellChunked && paragraphAnalysis.totalParagraphs > 0) {
      breakdown.paragraphLength = 20;
    } else if (paragraphAnalysis.totalParagraphs > 0) {
      breakdown.paragraphLength = 10;
    }
    if (paragraphAnalysis.avgWordCount >= 300) {
      issues.push({
        id: createId(),
        category: "content",
        severity: "medium",
        title: "Paragraphs are too long for optimal AI extraction",
        description: `Average paragraph length is ${paragraphAnalysis.avgWordCount} words. AI models prefer shorter, focused paragraphs (under 300 words) that can be easily extracted and cited.`,
        recommendation:
          "Break up long paragraphs into shorter, focused chunks. Each paragraph should cover a single idea or point that could stand alone as a citation.",
        impact:
          "Long paragraphs may be truncated or skipped by AI models, reducing the chance of accurate citations.",
      });
    }

    // 4. Check for lists (+15 points)
    const listAnalysis = analyzeLists($);
    if (listAnalysis.hasLists) {
      breakdown.listUsage = 15;
    } else {
      issues.push({
        id: createId(),
        category: "content",
        severity: "low",
        title: "No numbered or bulleted lists found",
        description:
          "The page does not use bulleted or numbered lists. Lists are highly effective for AI extraction and often appear in AI-generated responses.",
        recommendation:
          "Where appropriate, present information as lists (features, steps, benefits, etc.). Lists are easily parsed by AI and frequently cited.",
        impact:
          "Missing opportunity for list-style citations which are common in AI responses.",
      });
    }

    // 5. Check content depth (+20 points)
    const totalWords = getTotalWordCount($);
    if (totalWords >= 500) {
      breakdown.contentDepth = 20;
    } else if (totalWords >= 300) {
      breakdown.contentDepth = 10;
    }
    if (totalWords < 500) {
      issues.push({
        id: createId(),
        category: "content",
        severity: totalWords < 300 ? "high" : "medium",
        title: "Insufficient content depth",
        description: `The page has only ${totalWords} words. Pages with less than 500 words may not provide enough context for AI models to confidently cite as a source.`,
        recommendation:
          "Expand the page content to at least 500 words with comprehensive coverage of the topic. Focus on answering common questions and providing unique value.",
        impact:
          "Thin content is less likely to be selected as a citation source by AI models.",
      });
    }

    // Calculate total score
    const totalScore =
      breakdown.faqSchema +
      breakdown.headingStructure +
      breakdown.paragraphLength +
      breakdown.listUsage +
      breakdown.contentDepth;

    return {
      score: totalScore,
      issues,
      breakdown,
    };
  } catch (error) {
    // Handle timeout or network errors gracefully
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      score: 0,
      issues: [
        {
          id: createId(),
          category: "content",
          severity: "low",
          title: "Error analyzing content structure",
          description: `Failed to analyze content: ${errorMessage}`,
          recommendation: "Ensure the page is accessible and returns valid HTML.",
          impact: "Cannot verify content structure optimization for AI.",
        },
      ],
      breakdown,
    };
  }
}
