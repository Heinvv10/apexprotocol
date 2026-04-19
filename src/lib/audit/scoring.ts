/**
 * Audit scoring — signal-grounded, not issue-weighted.
 *
 * Replaces the `constant − issues × weight` formulas that previously
 * lived at src/lib/audit/index.ts:599-612. Each category derives its
 * 0..100 raw score from measurable page signals extracted by parsePage().
 * The composed overall uses the canonical weights in score-decomposition.ts.
 *
 * Design intent: make the score auditable. Every rawScore carries an
 * evidence trail — specific reasons why a given category got its number.
 * When a user asks "why 73?" we can point at the reasons.
 *
 * All functions here are pure: given CrawlPage[], return the score. No DB,
 * no LLM, no network. Runs in the worker and in fixture tests equally.
 */

import type { CrawlPage } from "./index";
import {
  AUDIT_FACTORS,
  composeDecomposition,
  type EvidenceItem,
  type FactorInput,
  type FactorKey,
  type ScoreDecomposition,
} from "./score-decomposition";

export interface CategoryScore {
  rawScore: number;
  evidence: EvidenceItem[];
}

/**
 * Structure: heading hierarchy, landmark tags, paragraph density. What
 * makes the page easy to parse both for humans and for LLMs picking out
 * quotable chunks.
 */
export function scoreStructure(pages: CrawlPage[]): CategoryScore {
  if (pages.length === 0) return { rawScore: 0, evidence: [] };
  const scores = pages.map((page) => {
    const ev: EvidenceItem[] = [];
    let score = 100;
    if (page.h1Count === 0) {
      score -= 25;
      ev.push({ summary: "Missing H1 tag", polarity: "negative", weight: 0.9 });
    } else if (page.h1Count > 1) {
      score -= 15;
      ev.push({ summary: `${page.h1Count} H1 tags (should be exactly 1)`, polarity: "negative", weight: 0.6 });
    } else {
      ev.push({ summary: "Single H1 tag", polarity: "positive", weight: 0.4 });
    }
    if (page.h2Count < 2) {
      score -= 10;
      ev.push({ summary: `Only ${page.h2Count} H2 sections`, polarity: "negative", weight: 0.4 });
    } else {
      ev.push({ summary: `${page.h2Count} H2 sections for scannability`, polarity: "positive", weight: 0.3 });
    }
    const skips = countHeadingSkips(page.headingStructure);
    if (skips > 0) {
      score -= Math.min(20, skips * 10);
      ev.push({ summary: `${skips} heading-level skip(s) (e.g. H1→H3)`, polarity: "negative", weight: 0.5 });
    }
    if (page.semanticTagCount < 2) {
      score -= 10;
      ev.push({ summary: "Few semantic landmarks (nav/main/article/…)", polarity: "negative", weight: 0.4 });
    } else if (page.semanticTagCount >= 4) {
      ev.push({ summary: `${page.semanticTagCount} semantic landmark elements`, polarity: "positive", weight: 0.4 });
    }
    if (page.paragraphCount < 3) {
      score -= 10;
      ev.push({ summary: "Thin content (<3 paragraphs)", polarity: "negative", weight: 0.5 });
    }
    return { score: clamp(score), evidence: ev };
  });
  return averageAcrossPages(scores);
}

/**
 * Schema: JSON-LD presence + coverage of the high-value schema.org types
 * that drive AI citations and rich results.
 */
export function scoreSchema(pages: CrawlPage[]): CategoryScore {
  if (pages.length === 0) return { rawScore: 0, evidence: [] };
  const scores = pages.map((page) => {
    const ev: EvidenceItem[] = [];
    let score = 20; // baseline — no schema = 20, not 0 (a bare page can still rank)
    const types = new Set(page.schema.map((s) => s.type.toLowerCase()));
    if (types.size > 0) {
      score += 25;
      ev.push({ summary: `${types.size} JSON-LD block(s) found`, polarity: "positive", weight: 0.5 });
    } else {
      ev.push({ summary: "No JSON-LD structured data", polarity: "negative", weight: 0.9 });
    }
    if (types.has("organization")) {
      score += 15;
      ev.push({ summary: "Organization schema present", polarity: "positive", weight: 0.4 });
    }
    if (types.has("article") || types.has("product") || types.has("softwareapplication") || types.has("service")) {
      score += 15;
      ev.push({ summary: "Entity-type schema (Article/Product/Service) present", polarity: "positive", weight: 0.4 });
    }
    if (types.has("faqpage")) {
      score += 10;
      ev.push({ summary: "FAQPage schema present (high LLM citation value)", polarity: "positive", weight: 0.5 });
    } else if (page.questionCount > 0) {
      score -= 5;
      ev.push({ summary: `${page.questionCount} question heading(s) but no FAQPage schema`, polarity: "negative", weight: 0.4 });
    }
    if (types.has("breadcrumblist")) {
      score += 5;
      ev.push({ summary: "BreadcrumbList present", polarity: "positive", weight: 0.2 });
    }
    if (types.has("website")) {
      score += 5;
      ev.push({ summary: "WebSite schema present", polarity: "positive", weight: 0.2 });
    }
    return { score: clamp(score), evidence: ev };
  });
  return averageAcrossPages(scores);
}

/**
 * Clarity: readability + sentence-length discipline. The old formula
 * used a floor of 30 regardless of actual score — now it actually uses
 * the measured Flesch-Kincaid value.
 */
export function scoreClarity(pages: CrawlPage[]): CategoryScore {
  if (pages.length === 0) return { rawScore: 0, evidence: [] };
  const scores = pages.map((page) => {
    const ev: EvidenceItem[] = [];
    // Readability is already scored 0-100 (scaled Flesch-Kincaid) in parsePage.
    // Allocate 60 points for it; reachable with a score ≥ 60.
    const readabilityContribution = Math.min(60, Math.round(page.readabilityScore * 0.6));
    let score = readabilityContribution;
    if (page.readabilityScore >= 60) {
      ev.push({ summary: `Readability ${page.readabilityScore}/100 (ease of reading)`, polarity: "positive", weight: 0.6 });
    } else if (page.readabilityScore < 40) {
      ev.push({ summary: `Readability ${page.readabilityScore}/100 — text is dense`, polarity: "negative", weight: 0.6 });
    } else {
      ev.push({ summary: `Readability ${page.readabilityScore}/100`, polarity: "neutral", weight: 0.3 });
    }
    // Sentence length: 12-22 words is ideal per AP style + plain-language guides.
    if (page.avgSentenceLength >= 12 && page.avgSentenceLength <= 22) {
      score += 20;
      ev.push({ summary: `Avg sentence ${page.avgSentenceLength} words (ideal range)`, polarity: "positive", weight: 0.4 });
    } else if (page.avgSentenceLength > 30) {
      ev.push({ summary: `Avg sentence ${page.avgSentenceLength} words — too long`, polarity: "negative", weight: 0.4 });
    } else if (page.avgSentenceLength > 0 && page.avgSentenceLength < 8) {
      ev.push({ summary: `Avg sentence ${page.avgSentenceLength} words — choppy`, polarity: "negative", weight: 0.3 });
    }
    // Question density: rewards Q&A content structure (LLMs love it).
    if (page.questionCount > 0) {
      score += 10;
      ev.push({ summary: `${page.questionCount} question headings (Q&A format)`, polarity: "positive", weight: 0.3 });
    }
    // Paragraph-length sanity: long walls of text are penalized indirectly
    // via the ratio of wordCount to paragraphCount.
    if (page.paragraphCount > 0) {
      const wordsPerPara = Math.round(page.wordCount / page.paragraphCount);
      if (wordsPerPara <= 100) {
        score += 10;
        ev.push({ summary: `${wordsPerPara} words/paragraph (scannable)`, polarity: "positive", weight: 0.3 });
      } else if (wordsPerPara > 200) {
        ev.push({ summary: `${wordsPerPara} words/paragraph — walls of text`, polarity: "negative", weight: 0.3 });
      }
    }
    return { score: clamp(score), evidence: ev };
  });
  return averageAcrossPages(scores);
}

/**
 * Metadata: title, description, canonical, Open Graph. These are the
 * discoverability signals search engines (and AI crawlers) rely on.
 */
export function scoreMetadata(pages: CrawlPage[]): CategoryScore {
  if (pages.length === 0) return { rawScore: 0, evidence: [] };
  const scores = pages.map((page) => {
    const ev: EvidenceItem[] = [];
    let score = 0;
    // Title: 30-60 chars is the SERP-safe range.
    const titleLen = page.title.trim().length;
    if (titleLen >= 30 && titleLen <= 60) {
      score += 25;
      ev.push({ summary: `Title ${titleLen} chars (optimal)`, polarity: "positive", weight: 0.4 });
    } else if (titleLen > 0 && titleLen < 30) {
      score += 10;
      ev.push({ summary: `Title ${titleLen} chars — too short`, polarity: "negative", weight: 0.3 });
    } else if (titleLen > 60) {
      score += 12;
      ev.push({ summary: `Title ${titleLen} chars — will be truncated in SERP`, polarity: "negative", weight: 0.4 });
    } else {
      ev.push({ summary: "Missing <title>", polarity: "negative", weight: 0.9 });
    }
    // Meta description: 120-160 chars ideal.
    const descLen = page.metaDescription.trim().length;
    if (descLen >= 120 && descLen <= 160) {
      score += 25;
      ev.push({ summary: `Meta description ${descLen} chars (optimal)`, polarity: "positive", weight: 0.4 });
    } else if (descLen > 0 && descLen < 120) {
      score += 10;
      ev.push({ summary: `Meta description ${descLen} chars — too short`, polarity: "negative", weight: 0.3 });
    } else if (descLen > 160) {
      score += 12;
      ev.push({ summary: `Meta description ${descLen} chars — will be truncated`, polarity: "negative", weight: 0.3 });
    } else {
      ev.push({ summary: "Missing meta description", polarity: "negative", weight: 0.7 });
    }
    // Canonical URL.
    if (page.canonicalUrl) {
      score += 15;
      ev.push({ summary: "Canonical URL present", polarity: "positive", weight: 0.3 });
    } else {
      ev.push({ summary: "No canonical URL (<link rel=canonical>)", polarity: "negative", weight: 0.4 });
    }
    // Open Graph: need all 3 core fields for quality social previews.
    const ogComplete = page.og.title && page.og.description && page.og.image;
    if (ogComplete) {
      score += 25;
      ev.push({ summary: "Open Graph tags complete (title+desc+image)", polarity: "positive", weight: 0.4 });
    } else if (page.og.title || page.og.description) {
      score += 10;
      ev.push({ summary: "Open Graph tags partial", polarity: "negative", weight: 0.3 });
    } else {
      ev.push({ summary: "No Open Graph tags", polarity: "negative", weight: 0.4 });
    }
    if (page.og.type) {
      score += 10;
      ev.push({ summary: `og:type=${page.og.type}`, polarity: "positive", weight: 0.2 });
    }
    return { score: clamp(score), evidence: ev };
  });
  return averageAcrossPages(scores);
}

/**
 * Accessibility: alt text, semantic HTML, link text quality. These also
 * double as AI-crawlability signals — alt text is the #1 way LLMs understand
 * images; bare "click here" links give no context.
 */
export function scoreAccessibility(pages: CrawlPage[]): CategoryScore {
  if (pages.length === 0) return { rawScore: 0, evidence: [] };
  const scores = pages.map((page) => {
    const ev: EvidenceItem[] = [];
    let score = 0;
    // Image alt text — primary a11y + AI signal.
    if (page.imageCount === 0) {
      score += 25; // neutral credit when no images present
      ev.push({ summary: "No images (no alt-text burden)", polarity: "neutral", weight: 0.2 });
    } else if (page.imageAltRatio >= 0.95) {
      score += 35;
      ev.push({ summary: `${Math.round(page.imageAltRatio * 100)}% images have alt text`, polarity: "positive", weight: 0.5 });
    } else if (page.imageAltRatio >= 0.7) {
      score += 20;
      ev.push({ summary: `${Math.round(page.imageAltRatio * 100)}% images have alt text (target 95%+)`, polarity: "negative", weight: 0.4 });
    } else {
      ev.push({ summary: `Only ${Math.round(page.imageAltRatio * 100)}% images have alt text`, polarity: "negative", weight: 0.7 });
    }
    // Semantic landmarks.
    if (page.semanticTagCount >= 3) {
      score += 20;
      ev.push({ summary: `${page.semanticTagCount} semantic landmarks`, polarity: "positive", weight: 0.4 });
    } else if (page.semanticTagCount > 0) {
      score += 10;
    } else {
      ev.push({ summary: "No semantic landmarks (<nav>/<main>/...)", polarity: "negative", weight: 0.5 });
    }
    // Heading hierarchy (no skips).
    const skips = countHeadingSkips(page.headingStructure);
    if (skips === 0 && page.headingStructure.length > 0) {
      score += 20;
      ev.push({ summary: "Heading hierarchy valid (no level skips)", polarity: "positive", weight: 0.3 });
    } else if (skips > 0) {
      ev.push({ summary: `${skips} heading-level skip(s)`, polarity: "negative", weight: 0.4 });
    }
    // Link count + bare-link penalty.
    if (page.linkCount >= 3) {
      score += 15;
      ev.push({ summary: `${page.linkCount} links (site is navigable)`, polarity: "positive", weight: 0.2 });
    }
    if (page.bareLinkCount > 0) {
      score -= Math.min(10, page.bareLinkCount * 3);
      ev.push({ summary: `${page.bareLinkCount} bare "click here"/"read more" link(s)`, polarity: "negative", weight: 0.3 });
    } else if (page.linkCount > 0) {
      score += 10;
      ev.push({ summary: "No bare link anti-patterns", polarity: "positive", weight: 0.2 });
    }
    return { score: clamp(score), evidence: ev };
  });
  return averageAcrossPages(scores);
}

export interface AuditScoreResult {
  overall: number;
  categoryScores: Record<FactorKey, number>;
  decomposition: ScoreDecomposition;
  /** Per-category evidence trail — for the debug route and the UI's "why?" popover. */
  evidence: Record<FactorKey, EvidenceItem[]>;
}

/**
 * Top-level orchestrator. Call this instead of the old
 * `constant − issues × weight` formulas.
 */
export function scoreAudit(pages: CrawlPage[]): AuditScoreResult {
  const structure = scoreStructure(pages);
  const schema = scoreSchema(pages);
  const clarity = scoreClarity(pages);
  const metadata = scoreMetadata(pages);
  const accessibility = scoreAccessibility(pages);

  const factorInputs: FactorInput[] = [
    { key: "structure", rawScore: structure.rawScore, evidence: structure.evidence },
    { key: "schema", rawScore: schema.rawScore, evidence: schema.evidence },
    { key: "clarity", rawScore: clarity.rawScore, evidence: clarity.evidence },
    { key: "metadata", rawScore: metadata.rawScore, evidence: metadata.evidence },
    { key: "accessibility", rawScore: accessibility.rawScore, evidence: accessibility.evidence },
  ];

  const decomposition = composeDecomposition(factorInputs);

  return {
    overall: decomposition.overall,
    categoryScores: {
      structure: structure.rawScore,
      schema: schema.rawScore,
      clarity: clarity.rawScore,
      metadata: metadata.rawScore,
      accessibility: accessibility.rawScore,
    },
    decomposition,
    evidence: {
      structure: structure.evidence,
      schema: schema.evidence,
      clarity: clarity.evidence,
      metadata: metadata.evidence,
      accessibility: accessibility.evidence,
    },
  };
}

// ---------- helpers ----------

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function countHeadingSkips(
  headings: Array<{ level: number; text: string }>,
): number {
  let skips = 0;
  let prev = 0;
  for (const h of headings) {
    if (prev > 0 && h.level > prev + 1) skips += 1;
    prev = h.level;
  }
  return skips;
}

function averageAcrossPages(
  scores: Array<{ score: number; evidence: EvidenceItem[] }>,
): CategoryScore {
  const total = scores.reduce((s, x) => s + x.score, 0);
  const avg = Math.round(total / scores.length);
  // Collect evidence from the first page (primary) + dedupe summaries across
  // subsequent pages. Keeps the evidence trail useful without exploding.
  const seen = new Set<string>();
  const evidence: EvidenceItem[] = [];
  for (const s of scores) {
    for (const e of s.evidence) {
      if (seen.has(e.summary)) continue;
      seen.add(e.summary);
      evidence.push(e);
      if (evidence.length >= 12) break;
    }
    if (evidence.length >= 12) break;
  }
  return { rawScore: avg, evidence };
}

// Re-export for convenience.
export { AUDIT_FACTORS };
