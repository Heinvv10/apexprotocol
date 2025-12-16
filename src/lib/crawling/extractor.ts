/**
 * Enhanced DOM Extractor (Phase 7.0)
 *
 * Cheerio-based extraction utilities that ENHANCE (not replace) existing crawlers.
 * Provides CSS selector capabilities for robust DOM parsing.
 *
 * Usage:
 *   import { createExtractor } from "@/lib/crawling/extractor";
 *   const extractor = createExtractor(html);
 *   const teamMembers = extractor.extractTeamMembers();
 */

import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import {
  extractTeamPatterns,
  type TeamMember,
  type TeamExtractionResult,
} from "./team-discovery";
import {
  extractSocialPatterns,
  type SocialLink,
  type SocialExtractionResult,
} from "./social-discovery";

// ============================================================================
// Types
// ============================================================================

export interface HeadingStructure {
  h1: string[];
  h2: string[];
  h3: string[];
}

export interface MetaData {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  robots: string;
  canonical: string;
}

export interface OpenGraphData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  siteName: string;
}

export interface TwitterCardData {
  card: string;
  title: string;
  description: string;
  image: string;
  site: string;
  creator: string;
}

export interface ImageData {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  isLogo?: boolean;
}

export interface LinkData {
  href: string;
  text: string;
  rel?: string;
  isExternal: boolean;
  isNoFollow: boolean;
}

export interface JsonLdSchema {
  "@type": string;
  "@context"?: string;
  [key: string]: unknown;
}

export interface ExtractorResult {
  // Basic metadata
  extractTitle: () => string;
  extractMetaDescription: () => string;
  extractMeta: () => MetaData;

  // Structured data
  extractHeadings: () => HeadingStructure;
  extractOpenGraph: () => OpenGraphData;
  extractTwitterCard: () => TwitterCardData;
  extractJsonLd: () => JsonLdSchema[];

  // Content extraction
  extractImages: () => ImageData[];
  extractLinks: () => LinkData[];
  extractMainContent: () => string;
  extractTextContent: () => string;

  // Phase 7 specific (Team/Social)
  extractTeamMembers: () => TeamExtractionResult;
  extractSocialLinks: () => SocialExtractionResult;

  // Advanced queries
  query: (selector: string) => string[];
  queryOne: (selector: string) => string | null;
  queryAttr: (selector: string, attr: string) => string | null;
  exists: (selector: string) => boolean;

  // Raw access for advanced use
  $: CheerioAPI;
}

// ============================================================================
// Core Extractor Factory
// ============================================================================

/**
 * Create an extractor instance for the given HTML
 *
 * @example
 * const extractor = createExtractor(html);
 * const title = extractor.extractTitle();
 * const team = extractor.extractTeamMembers();
 */
export function createExtractor(html: string): ExtractorResult {
  const $ = cheerio.load(html);

  return {
    // ========================================================================
    // Basic Metadata
    // ========================================================================

    extractTitle: () => $("title").text().trim(),

    extractMetaDescription: () =>
      $('meta[name="description"]').attr("content")?.trim() || "",

    extractMeta: () => ({
      title: $("title").text().trim(),
      description:
        $('meta[name="description"]').attr("content")?.trim() || "",
      keywords: (
        $('meta[name="keywords"]').attr("content")?.trim() || ""
      )
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      author: $('meta[name="author"]').attr("content")?.trim() || "",
      robots: $('meta[name="robots"]').attr("content")?.trim() || "",
      canonical: $('link[rel="canonical"]').attr("href")?.trim() || "",
    }),

    // ========================================================================
    // Structured Data
    // ========================================================================

    extractHeadings: () => ({
      h1: $("h1")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean),
      h2: $("h2")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean),
      h3: $("h3")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean),
    }),

    extractOpenGraph: () => ({
      title: $('meta[property="og:title"]').attr("content")?.trim() || "",
      description:
        $('meta[property="og:description"]').attr("content")?.trim() || "",
      image: $('meta[property="og:image"]').attr("content")?.trim() || "",
      url: $('meta[property="og:url"]').attr("content")?.trim() || "",
      type: $('meta[property="og:type"]').attr("content")?.trim() || "",
      siteName:
        $('meta[property="og:site_name"]').attr("content")?.trim() || "",
    }),

    extractTwitterCard: () => ({
      card: $('meta[name="twitter:card"]').attr("content")?.trim() || "",
      title: $('meta[name="twitter:title"]').attr("content")?.trim() || "",
      description:
        $('meta[name="twitter:description"]').attr("content")?.trim() || "",
      image: $('meta[name="twitter:image"]').attr("content")?.trim() || "",
      site: $('meta[name="twitter:site"]').attr("content")?.trim() || "",
      creator:
        $('meta[name="twitter:creator"]').attr("content")?.trim() || "",
    }),

    extractJsonLd: () => {
      const schemas: JsonLdSchema[] = [];
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const content = $(el).html();
          if (content) {
            const parsed = JSON.parse(content);
            // Handle both single objects and arrays
            if (Array.isArray(parsed)) {
              schemas.push(...parsed);
            } else {
              schemas.push(parsed);
            }
          }
        } catch {
          // Invalid JSON-LD, skip
        }
      });
      return schemas;
    },

    // ========================================================================
    // Content Extraction
    // ========================================================================

    extractImages: () => {
      const images: ImageData[] = [];
      $("img").each((_, el) => {
        const $img = $(el);
        const src = $img.attr("src") || $img.attr("data-src") || "";
        if (!src) return;

        const alt = $img.attr("alt") || "";
        const srcLower = src.toLowerCase();
        const altLower = alt.toLowerCase();

        images.push({
          src,
          alt,
          width: parseInt($img.attr("width") || "0", 10) || undefined,
          height: parseInt($img.attr("height") || "0", 10) || undefined,
          isLogo:
            srcLower.includes("logo") ||
            altLower.includes("logo") ||
            $img.closest("header, .header, [class*='logo']").length > 0,
        });
      });
      return images;
    },

    extractLinks: () => {
      const links: LinkData[] = [];
      $("a[href]").each((_, el) => {
        const $link = $(el);
        const href = $link.attr("href") || "";
        if (!href || href.startsWith("#") || href.startsWith("javascript:"))
          return;

        const rel = $link.attr("rel") || "";
        links.push({
          href,
          text: $link.text().trim(),
          rel: rel || undefined,
          isExternal:
            href.startsWith("http") && !href.includes(getBaseHost($, href)),
          isNoFollow: rel.includes("nofollow"),
        });
      });
      return links;
    },

    extractMainContent: () => {
      // Try to find main content area
      const mainSelectors = [
        "main",
        "article",
        '[role="main"]',
        "#main",
        "#content",
        ".main-content",
        ".content",
      ];

      for (const selector of mainSelectors) {
        const content = $(selector).first().text().trim();
        if (content && content.length > 100) {
          return cleanText(content);
        }
      }

      // Fallback to body
      return cleanText($("body").text());
    },

    extractTextContent: () => {
      // Remove script, style, and navigation elements
      const $clone = $.root().clone();
      $clone
        .find("script, style, nav, header, footer, aside, noscript")
        .remove();
      return cleanText($clone.text());
    },

    // ========================================================================
    // Phase 7 Specific: Team & Social
    // ========================================================================

    extractTeamMembers: () => extractTeamPatterns($),

    extractSocialLinks: () => extractSocialPatterns($),

    // ========================================================================
    // Advanced Queries
    // ========================================================================

    query: (selector: string) =>
      $(selector)
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean),

    queryOne: (selector: string) => $(selector).first().text().trim() || null,

    queryAttr: (selector: string, attr: string) =>
      $(selector).first().attr(attr)?.trim() || null,

    exists: (selector: string) => $(selector).length > 0,

    // Raw Cheerio access for advanced use cases
    $,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Clean extracted text content
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/\n\s*\n/g, "\n") // Remove empty lines
    .trim();
}

/**
 * Get base host from URL or current page
 */
function getBaseHost($: CheerioAPI, href: string): string {
  try {
    // Try to get from canonical link
    const canonical = $('link[rel="canonical"]').attr("href");
    if (canonical) {
      return new URL(canonical).host;
    }
    // Try to get from og:url
    const ogUrl = $('meta[property="og:url"]').attr("content");
    if (ogUrl) {
      return new URL(ogUrl).host;
    }
    // Fallback: try to parse from href itself (won't work for relative URLs)
    return new URL(href).host;
  } catch {
    return "";
  }
}

// ============================================================================
// Convenience Functions (for simple one-off extractions)
// ============================================================================

/**
 * Quick extraction of team members from HTML
 */
export function extractTeamFromHtml(html: string): TeamMember[] {
  return createExtractor(html).extractTeamMembers().members;
}

/**
 * Quick extraction of social links from HTML
 */
export function extractSocialsFromHtml(html: string): SocialLink[] {
  return createExtractor(html).extractSocialLinks().links;
}

/**
 * Quick extraction of JSON-LD schemas from HTML
 */
export function extractSchemasFromHtml(html: string): JsonLdSchema[] {
  return createExtractor(html).extractJsonLd();
}

// Re-export types from sub-modules
export type { TeamMember, TeamExtractionResult } from "./team-discovery";
export type { SocialLink, SocialExtractionResult } from "./social-discovery";
