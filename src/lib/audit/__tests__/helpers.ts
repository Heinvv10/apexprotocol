/**
 * Test helpers for scoring fixtures. We expose parsePage through a public
 * seam so fixture tests can go HTML string → CrawlPage → scoreAudit without
 * touching the crawler / fetch layer.
 */

import { scoreAudit, type AuditScoreResult } from "../scoring";
import type { CrawlPage } from "../index";

// parsePage is not exported from "../index" (internal to the audit module).
// Re-implement by calling the cheerio analysis via a dynamic import of the
// inner function — if this becomes painful, export parsePage instead.
// For now: shell out to the same helpers the worker uses.
import * as cheerio from "cheerio";

function extractSchema(
  $: cheerio.CheerioAPI,
): Array<{ type: string; properties: Record<string, unknown> }> {
  const out: Array<{ type: string; properties: Record<string, unknown> }> = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).contents().text();
    try {
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      for (const item of arr) {
        if (item && typeof item === "object" && item["@type"]) {
          out.push({ type: String(item["@type"]), properties: item });
        }
      }
    } catch {
      // ignore malformed JSON-LD — real crawler does the same
    }
  });
  return out;
}

function extractHeadingStructure(
  $: cheerio.CheerioAPI,
): Array<{ level: 1 | 2 | 3 | 4 | 5 | 6; text: string }> {
  const out: Array<{ level: 1 | 2 | 3 | 4 | 5 | 6; text: string }> = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tag = (el as unknown as { tagName?: string }).tagName?.toLowerCase() ?? "h1";
    const level = Number(tag[1]) as 1 | 2 | 3 | 4 | 5 | 6;
    out.push({ level, text: $(el).text().trim() });
  });
  return out;
}

function calculateReadabilityScore(text: string): number {
  const words = text.split(/\s+/).filter((w) => w.length > 0).length;
  const sentences = text
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;
  const syllables = text.match(/[aeiouy]+/gi)?.length ?? 0;
  if (words === 0 || sentences === 0) return 30;
  const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  const score = Math.max(0, Math.min(100, 100 - grade * 3));
  return Math.round(score);
}

/**
 * HTML string → CrawlPage — mirrors src/lib/audit/index.ts `parsePage` so
 * fixtures exercise the same signal-extraction logic the worker uses.
 */
export async function parseHtmlFixture(
  url: string,
  html: string,
): Promise<CrawlPage> {
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
  const wordCount = body.split(/\s+/).filter((w) => w.length > 0).length;
  const paragraphCount = $("p").length;
  const imageCount = $("img").length;
  const linkCount = $("a").length;

  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (href.startsWith("http") || href.startsWith("//")) externalLinks.push(href);
    else if (href.startsWith("/") || href.startsWith("./")) internalLinks.push(href);
  });

  const schema = extractSchema($);
  const headingStructure = extractHeadingStructure($);
  const readabilityScore = calculateReadabilityScore(body);

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
    $("nav").length + $("main").length + $("article").length + $("aside").length +
    $("section").length + $("header").length + $("footer").length;

  const bareLinkPattern = /^\s*(click here|read more|here|learn more|more|this)\s*$/i;
  let bareLinkCount = 0;
  $("a[href]").each((_, el) => {
    if (bareLinkPattern.test($(el).text().trim())) bareLinkCount += 1;
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

export function scoreFixture(pages: CrawlPage[]): AuditScoreResult {
  return scoreAudit(pages);
}
