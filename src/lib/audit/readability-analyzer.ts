/**
 * AI Readability Analyzer (F104)
 * Algorithm scoring content for AI understanding (structure, schema, clarity)
 */

import type {
  CrawledPage,
  ReadabilityScore,
  ReadabilityBreakdown,
  CategoryScore,
  ScoreFactor,
} from "./types";

// Scoring weights for each category
const CATEGORY_WEIGHTS = {
  structure: 0.25,
  schema: 0.30,
  clarity: 0.20,
  metadata: 0.15,
  accessibility: 0.10,
};

/**
 * Analyze a page's readability for AI systems
 */
export function analyzeReadability(page: CrawledPage): ReadabilityScore {
  const breakdown = analyzeBreakdown(page);
  const overall = calculateOverallScore(breakdown);
  const grade = getGrade(overall);

  return {
    overall,
    breakdown,
    grade,
  };
}

/**
 * Analyze all categories and return breakdown
 */
function analyzeBreakdown(page: CrawledPage): ReadabilityBreakdown {
  return {
    structure: analyzeStructure(page),
    schema: analyzeSchema(page),
    clarity: analyzeClarity(page),
    metadata: analyzeMetadata(page),
    accessibility: analyzeAccessibility(page),
  };
}

/**
 * Analyze content structure (headings, hierarchy, organization)
 */
function analyzeStructure(page: CrawledPage): CategoryScore {
  const factors: ScoreFactor[] = [];

  // Check H1 presence and uniqueness
  const h1Factor: ScoreFactor = {
    name: "H1 Tag Presence",
    score: 0,
    maxScore: 20,
    details: "",
    passed: false,
  };
  if (page.h1Tags.length === 1) {
    h1Factor.score = 20;
    h1Factor.passed = true;
    h1Factor.details = "Single H1 tag found - optimal for AI parsing";
  } else if (page.h1Tags.length === 0) {
    h1Factor.details = "No H1 tag found - critical for AI context";
  } else {
    h1Factor.score = 10;
    h1Factor.details = `Multiple H1 tags (${page.h1Tags.length}) - may confuse AI systems`;
  }
  factors.push(h1Factor);

  // Check heading hierarchy
  const hierarchyFactor: ScoreFactor = {
    name: "Heading Hierarchy",
    score: 0,
    maxScore: 25,
    details: "",
    passed: false,
  };
  const hierarchy = checkHeadingHierarchy(page.content.headings);
  if (hierarchy.isValid) {
    hierarchyFactor.score = 25;
    hierarchyFactor.passed = true;
    hierarchyFactor.details = "Proper heading hierarchy (H1→H2→H3...)";
  } else {
    hierarchyFactor.score = hierarchy.score;
    hierarchyFactor.details = hierarchy.issues.join("; ");
  }
  factors.push(hierarchyFactor);

  // Check content organization
  const organizationFactor: ScoreFactor = {
    name: "Content Organization",
    score: 0,
    maxScore: 20,
    details: "",
    passed: false,
  };
  const hasLists = page.content.lists > 0;
  const hasParagraphs = page.content.paragraphs >= 3;
  const hasMultipleSections = page.h2Tags.length >= 2;

  let orgScore = 0;
  const orgDetails: string[] = [];

  if (hasParagraphs) {
    orgScore += 7;
    orgDetails.push(`${page.content.paragraphs} paragraphs`);
  }
  if (hasLists) {
    orgScore += 7;
    orgDetails.push(`${page.content.lists} lists`);
  }
  if (hasMultipleSections) {
    orgScore += 6;
    orgDetails.push(`${page.h2Tags.length} sections`);
  }

  organizationFactor.score = orgScore;
  organizationFactor.passed = orgScore >= 14;
  organizationFactor.details = orgDetails.join(", ") || "Poor content organization";
  factors.push(organizationFactor);

  // Check content length
  const lengthFactor: ScoreFactor = {
    name: "Content Length",
    score: 0,
    maxScore: 15,
    details: "",
    passed: false,
  };
  if (page.wordCount >= 300 && page.wordCount <= 3000) {
    lengthFactor.score = 15;
    lengthFactor.passed = true;
    lengthFactor.details = `${page.wordCount} words - optimal for AI comprehension`;
  } else if (page.wordCount < 100) {
    lengthFactor.score = 5;
    lengthFactor.details = `${page.wordCount} words - thin content may lack context`;
  } else if (page.wordCount > 5000) {
    lengthFactor.score = 10;
    lengthFactor.details = `${page.wordCount} words - very long content may lose focus`;
  } else {
    lengthFactor.score = 12;
    lengthFactor.details = `${page.wordCount} words`;
  }
  factors.push(lengthFactor);

  // Tables and data
  const dataFactor: ScoreFactor = {
    name: "Structured Data Elements",
    score: page.content.tables > 0 || page.content.codeBlocks > 0 ? 20 : 0,
    maxScore: 20,
    details: `${page.content.tables} tables, ${page.content.codeBlocks} code blocks`,
    passed: page.content.tables > 0 || page.content.codeBlocks > 0,
  };
  factors.push(dataFactor);

  return calculateCategoryScore(factors, CATEGORY_WEIGHTS.structure);
}

/**
 * Analyze schema markup for AI systems
 */
function analyzeSchema(page: CrawledPage): CategoryScore {
  const factors: ScoreFactor[] = [];

  // Check for any schema markup
  const hasSchemaFactor: ScoreFactor = {
    name: "Schema Markup Present",
    score: 0,
    maxScore: 30,
    details: "",
    passed: false,
  };
  if (page.schemaMarkup.length > 0) {
    const validSchemas = page.schemaMarkup.filter((s) => s.isValid);
    hasSchemaFactor.score = 30;
    hasSchemaFactor.passed = true;
    hasSchemaFactor.details = `${validSchemas.length} valid schema(s) found`;
  } else {
    hasSchemaFactor.details = "No JSON-LD schema markup found - critical for AI";
  }
  factors.push(hasSchemaFactor);

  // Check schema validity
  const validityFactor: ScoreFactor = {
    name: "Schema Validity",
    score: 0,
    maxScore: 20,
    details: "",
    passed: false,
  };
  const invalidSchemas = page.schemaMarkup.filter((s) => !s.isValid);
  if (invalidSchemas.length === 0 && page.schemaMarkup.length > 0) {
    validityFactor.score = 20;
    validityFactor.passed = true;
    validityFactor.details = "All schema markup is valid";
  } else if (invalidSchemas.length > 0) {
    validityFactor.score = 10;
    validityFactor.details = `${invalidSchemas.length} invalid schema(s) found`;
  } else {
    validityFactor.details = "No schema to validate";
  }
  factors.push(validityFactor);

  // Check for key schema types
  const schemaTypes = page.schemaMarkup.map((s) => s.type.toLowerCase());
  const keyTypes = ["organization", "webpage", "article", "product", "faqpage", "breadcrumblist"];
  const foundKeyTypes = keyTypes.filter((t) => schemaTypes.includes(t));

  const keyTypesFactor: ScoreFactor = {
    name: "AI-Relevant Schema Types",
    score: Math.min(foundKeyTypes.length * 10, 30),
    maxScore: 30,
    details: foundKeyTypes.length > 0
      ? `Found: ${foundKeyTypes.join(", ")}`
      : "Missing key types (Organization, Article, FAQ, etc.)",
    passed: foundKeyTypes.length >= 2,
  };
  factors.push(keyTypesFactor);

  // Check for FAQ schema (highly valuable for AI)
  const faqFactor: ScoreFactor = {
    name: "FAQ Schema",
    score: 0,
    maxScore: 20,
    details: "",
    passed: false,
  };
  if (schemaTypes.includes("faqpage") || schemaTypes.includes("question")) {
    faqFactor.score = 20;
    faqFactor.passed = true;
    faqFactor.details = "FAQ schema present - excellent for AI featured snippets";
  } else {
    faqFactor.details = "No FAQ schema - consider adding for AI visibility";
  }
  factors.push(faqFactor);

  return calculateCategoryScore(factors, CATEGORY_WEIGHTS.schema);
}

/**
 * Analyze content clarity for AI understanding
 */
function analyzeClarity(page: CrawledPage): CategoryScore {
  const factors: ScoreFactor[] = [];
  const text = page.content.text;

  // Sentence complexity (average sentence length)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0
    ? Math.round(page.wordCount / sentences.length)
    : 0;

  const sentenceFactor: ScoreFactor = {
    name: "Sentence Complexity",
    score: 0,
    maxScore: 25,
    details: "",
    passed: false,
  };
  if (avgSentenceLength >= 10 && avgSentenceLength <= 20) {
    sentenceFactor.score = 25;
    sentenceFactor.passed = true;
    sentenceFactor.details = `${avgSentenceLength} words/sentence - optimal`;
  } else if (avgSentenceLength < 10) {
    sentenceFactor.score = 20;
    sentenceFactor.details = `${avgSentenceLength} words/sentence - very short sentences`;
  } else if (avgSentenceLength <= 25) {
    sentenceFactor.score = 20;
    sentenceFactor.details = `${avgSentenceLength} words/sentence - slightly complex`;
  } else {
    sentenceFactor.score = 10;
    sentenceFactor.details = `${avgSentenceLength} words/sentence - may be too complex for AI`;
  }
  factors.push(sentenceFactor);

  // Title clarity
  const titleFactor: ScoreFactor = {
    name: "Title Clarity",
    score: 0,
    maxScore: 25,
    details: "",
    passed: false,
  };
  if (page.title.length >= 30 && page.title.length <= 60) {
    titleFactor.score = 25;
    titleFactor.passed = true;
    titleFactor.details = `Title length: ${page.title.length} chars - optimal`;
  } else if (page.title.length < 30) {
    titleFactor.score = 15;
    titleFactor.details = `Title too short (${page.title.length} chars)`;
  } else if (page.title.length <= 70) {
    titleFactor.score = 20;
    titleFactor.details = `Title slightly long (${page.title.length} chars)`;
  } else {
    titleFactor.score = 10;
    titleFactor.details = `Title too long (${page.title.length} chars) - may be truncated`;
  }
  factors.push(titleFactor);

  // Question-answer format detection
  const qaFactor: ScoreFactor = {
    name: "Q&A Format Content",
    score: 0,
    maxScore: 25,
    details: "",
    passed: false,
  };
  const questions = text.match(/[^.!?]*\?/g) || [];
  if (questions.length >= 3) {
    qaFactor.score = 25;
    qaFactor.passed = true;
    qaFactor.details = `${questions.length} questions detected - great for AI`;
  } else if (questions.length >= 1) {
    qaFactor.score = 15;
    qaFactor.details = `${questions.length} question(s) - consider adding more Q&A`;
  } else {
    qaFactor.details = "No Q&A format detected - consider adding FAQs";
  }
  factors.push(qaFactor);

  // Direct/concise language
  const directnessFactor: ScoreFactor = {
    name: "Direct Language",
    score: 0,
    maxScore: 25,
    details: "",
    passed: false,
  };
  // Check for filler words (simplified)
  const fillerPatterns = /\b(very|really|basically|actually|literally|just|simply)\b/gi;
  const fillerMatches = text.match(fillerPatterns) || [];
  const fillerRatio = page.wordCount > 0 ? fillerMatches.length / page.wordCount : 0;

  if (fillerRatio < 0.01) {
    directnessFactor.score = 25;
    directnessFactor.passed = true;
    directnessFactor.details = "Direct, concise language";
  } else if (fillerRatio < 0.02) {
    directnessFactor.score = 20;
    directnessFactor.details = "Mostly direct language";
  } else {
    directnessFactor.score = 15;
    directnessFactor.details = "Consider removing filler words";
  }
  factors.push(directnessFactor);

  return calculateCategoryScore(factors, CATEGORY_WEIGHTS.clarity);
}

/**
 * Analyze metadata completeness
 */
function analyzeMetadata(page: CrawledPage): CategoryScore {
  const factors: ScoreFactor[] = [];

  // Meta description
  const descFactor: ScoreFactor = {
    name: "Meta Description",
    score: 0,
    maxScore: 30,
    details: "",
    passed: false,
  };
  if (page.metaDescription.length >= 120 && page.metaDescription.length <= 160) {
    descFactor.score = 30;
    descFactor.passed = true;
    descFactor.details = `${page.metaDescription.length} chars - optimal`;
  } else if (page.metaDescription.length >= 50) {
    descFactor.score = 20;
    descFactor.details = `${page.metaDescription.length} chars - not optimal length`;
  } else if (page.metaDescription.length > 0) {
    descFactor.score = 10;
    descFactor.details = `${page.metaDescription.length} chars - too short`;
  } else {
    descFactor.details = "Missing meta description - critical for AI snippets";
  }
  factors.push(descFactor);

  // OpenGraph data
  const ogFactor: ScoreFactor = {
    name: "OpenGraph Metadata",
    score: 0,
    maxScore: 25,
    details: "",
    passed: false,
  };
  const ogFields = Object.values(page.openGraph).filter((v) => v).length;
  if (ogFields >= 4) {
    ogFactor.score = 25;
    ogFactor.passed = true;
    ogFactor.details = `${ogFields} OG fields - comprehensive`;
  } else if (ogFields >= 2) {
    ogFactor.score = 15;
    ogFactor.details = `${ogFields} OG fields - incomplete`;
  } else if (ogFields >= 1) {
    ogFactor.score = 5;
    ogFactor.details = "Minimal OG data";
  } else {
    ogFactor.details = "No OpenGraph metadata";
  }
  factors.push(ogFactor);

  // Canonical URL
  const canonicalFactor: ScoreFactor = {
    name: "URL Structure",
    score: 0,
    maxScore: 20,
    details: "",
    passed: false,
  };
  const url = new URL(page.url);
  const pathSegments = url.pathname.split("/").filter((s) => s);
  if (pathSegments.length <= 3 && !url.pathname.includes("_") && !url.search) {
    canonicalFactor.score = 20;
    canonicalFactor.passed = true;
    canonicalFactor.details = "Clean, readable URL structure";
  } else {
    canonicalFactor.score = 10;
    canonicalFactor.details = "URL could be cleaner for AI crawling";
  }
  factors.push(canonicalFactor);

  // Image alt text coverage
  const altFactor: ScoreFactor = {
    name: "Image Alt Text",
    score: 0,
    maxScore: 25,
    details: "",
    passed: false,
  };
  const imagesWithAlt = page.images.filter((img) => img.hasAlt).length;
  const altRatio = page.images.length > 0 ? imagesWithAlt / page.images.length : 1;
  if (altRatio >= 0.9) {
    altFactor.score = 25;
    altFactor.passed = true;
    altFactor.details = `${Math.round(altRatio * 100)}% images have alt text`;
  } else if (altRatio >= 0.5) {
    altFactor.score = 15;
    altFactor.details = `Only ${Math.round(altRatio * 100)}% images have alt text`;
  } else {
    altFactor.score = 5;
    altFactor.details = `${Math.round(altRatio * 100)}% images missing alt text`;
  }
  factors.push(altFactor);

  return calculateCategoryScore(factors, CATEGORY_WEIGHTS.metadata);
}

/**
 * Analyze accessibility factors relevant to AI
 */
function analyzeAccessibility(page: CrawledPage): CategoryScore {
  const factors: ScoreFactor[] = [];

  // Link descriptiveness
  const linkFactor: ScoreFactor = {
    name: "Descriptive Links",
    score: 0,
    maxScore: 35,
    details: "",
    passed: false,
  };
  const badLinkTexts = ["click here", "read more", "learn more", "here", "link"];
  const badLinks = page.links.filter((link) =>
    badLinkTexts.includes(link.text.toLowerCase().trim())
  ).length;
  const goodLinkRatio = page.links.length > 0
    ? (page.links.length - badLinks) / page.links.length
    : 1;

  if (goodLinkRatio >= 0.9) {
    linkFactor.score = 35;
    linkFactor.passed = true;
    linkFactor.details = "Links have descriptive text";
  } else {
    linkFactor.score = Math.round(goodLinkRatio * 35);
    linkFactor.details = `${badLinks} links with non-descriptive text`;
  }
  factors.push(linkFactor);

  // Semantic HTML usage
  const semanticFactor: ScoreFactor = {
    name: "Semantic Structure",
    score: 0,
    maxScore: 35,
    details: "",
    passed: false,
  };
  const hasHeadings = page.h1Tags.length > 0 && page.h2Tags.length > 0;
  const hasLists = page.content.lists > 0;
  const hasParagraphs = page.content.paragraphs > 0;

  let semanticScore = 0;
  if (hasHeadings) semanticScore += 15;
  if (hasLists) semanticScore += 10;
  if (hasParagraphs) semanticScore += 10;

  semanticFactor.score = semanticScore;
  semanticFactor.passed = semanticScore >= 25;
  semanticFactor.details = hasHeadings ? "Good semantic HTML structure" : "Missing semantic elements";
  factors.push(semanticFactor);

  // Content navigability
  const navFactor: ScoreFactor = {
    name: "Content Navigability",
    score: 0,
    maxScore: 30,
    details: "",
    passed: false,
  };
  const internalLinks = page.links.filter((l) => l.isInternal).length;
  if (internalLinks >= 5) {
    navFactor.score = 30;
    navFactor.passed = true;
    navFactor.details = `${internalLinks} internal links - good navigation`;
  } else if (internalLinks >= 2) {
    navFactor.score = 20;
    navFactor.details = `${internalLinks} internal links - could improve`;
  } else {
    navFactor.score = 10;
    navFactor.details = "Few internal links - isolated content";
  }
  factors.push(navFactor);

  return calculateCategoryScore(factors, CATEGORY_WEIGHTS.accessibility);
}

/**
 * Helper: Check heading hierarchy
 */
function checkHeadingHierarchy(headings: { level: number; text: string }[]): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  if (headings.length === 0) {
    return { isValid: false, score: 0, issues: ["No headings found"] };
  }

  const issues: string[] = [];
  let score = 25;

  // Check if first heading is H1
  if (headings[0].level !== 1) {
    issues.push("First heading is not H1");
    score -= 10;
  }

  // Check for skipped levels
  for (let i = 1; i < headings.length; i++) {
    const prevLevel = headings[i - 1].level;
    const currLevel = headings[i].level;
    if (currLevel > prevLevel + 1) {
      issues.push(`Skipped heading level: H${prevLevel} → H${currLevel}`);
      score -= 5;
    }
  }

  return {
    isValid: issues.length === 0,
    score: Math.max(0, score),
    issues,
  };
}

/**
 * Helper: Calculate category score from factors
 */
function calculateCategoryScore(factors: ScoreFactor[], weight: number): CategoryScore {
  const score = factors.reduce((sum, f) => sum + f.score, 0);
  const maxScore = factors.reduce((sum, f) => sum + f.maxScore, 0);

  return {
    score,
    maxScore,
    weight,
    factors,
  };
}

/**
 * Helper: Calculate overall score from breakdown
 */
function calculateOverallScore(breakdown: ReadabilityBreakdown): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [, category] of Object.entries(breakdown)) {
    const normalized = category.maxScore > 0
      ? (category.score / category.maxScore) * 100
      : 0;
    weightedSum += normalized * category.weight;
    totalWeight += category.weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Helper: Get grade from score
 */
function getGrade(score: number): ReadabilityScore["grade"] {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "average";
  if (score >= 40) return "poor";
  return "critical";
}

/**
 * Analyze multiple pages and return average
 */
export function analyzeMultiplePages(pages: CrawledPage[]): ReadabilityScore {
  if (pages.length === 0) {
    return {
      overall: 0,
      breakdown: {
        structure: { score: 0, maxScore: 100, weight: 0.25, factors: [] },
        schema: { score: 0, maxScore: 100, weight: 0.30, factors: [] },
        clarity: { score: 0, maxScore: 100, weight: 0.20, factors: [] },
        metadata: { score: 0, maxScore: 100, weight: 0.15, factors: [] },
        accessibility: { score: 0, maxScore: 100, weight: 0.10, factors: [] },
      },
      grade: "critical",
    };
  }

  const results = pages.map((page) => analyzeReadability(page));
  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.overall, 0) / results.length
  );

  // Use first page's breakdown as representative
  return {
    overall: avgScore,
    breakdown: results[0].breakdown,
    grade: getGrade(avgScore),
  };
}
