/**
 * Citation Parser for AI Platform Responses
 *
 * Extracts and categorizes citations from AI platform responses.
 * Supports multiple citation types: direct quotes, paraphrases, links, and references.
 */

import type {
  Citation,
  CitationType,
  CitationPattern,
  ParsedCitation,
  ContentType,
} from "./types";

/**
 * Configuration for citation parsing
 */
export interface CitationParserOptions {
  /** Brand name to identify brand mentions */
  brandName?: string;
  /** Brand-related keywords for relevance scoring */
  brandKeywords?: string[];
  /** Minimum text length for valid citations */
  minTextLength?: number;
  /** Maximum text length for valid citations */
  maxTextLength?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Citation Parser Class
 *
 * Parses platform responses to extract and categorize citations.
 * Uses pattern matching and heuristics to identify different citation types.
 */
export class CitationParser {
  private options: Required<CitationParserOptions>;
  private patterns: CitationPattern[];

  constructor(options: CitationParserOptions = {}) {
    this.options = {
      brandName: options.brandName || "",
      brandKeywords: options.brandKeywords || [],
      minTextLength: options.minTextLength || 20,
      maxTextLength: options.maxTextLength || 500,
      debug: options.debug || false,
    };

    this.patterns = this.buildCitationPatterns();
  }

  /**
   * Parse citations from platform response content
   *
   * @param content - The response text from an AI platform
   * @param platform - The platform that generated the response (optional, for logging)
   * @returns Array of parsed citations with confidence scores
   *
   * @example
   * ```typescript
   * const parser = new CitationParser({ brandName: "Acme Corp" });
   * const citations = parser.parse(responseContent);
   * console.log(`Found ${citations.length} citations`);
   * ```
   */
  parse(content: string, platform?: string): ParsedCitation[] {
    const citations: ParsedCitation[] = [];

    if (!content || content.trim().length === 0) {
      return citations;
    }

    // Extract different types of citations
    citations.push(...this.extractExplicitCitations(content));
    citations.push(...this.extractUrls(content));
    citations.push(...this.extractDirectQuotes(content));
    citations.push(...this.extractBrandMentions(content));

    // Deduplicate and sort by position
    const uniqueCitations = this.deduplicateCitations(citations);

    // Calculate final confidence scores
    const scoredCitations = this.calculateConfidenceScores(
      uniqueCitations,
      content
    );

    if (this.options.debug) {
      console.log(
        `[CitationParser${platform ? ` - ${platform}` : ""}] Extracted ${
          scoredCitations.length
        } citations`
      );
    }

    return scoredCitations;
  }

  /**
   * Extract explicit citation patterns like [Source: URL or title]
   * These are the most reliable citations as they're explicitly formatted
   */
  private extractExplicitCitations(content: string): ParsedCitation[] {
    const citations: ParsedCitation[] = [];
    const patterns = [
      /\[Source:\s*([^\]]+)\]/gi,
      /\[Ref:\s*([^\]]+)\]/gi,
      /\[Citation:\s*([^\]]+)\]/gi,
      /\[See:\s*([^\]]+)\]/gi,
      /\(Source:\s*([^)]+)\)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const citationText = match[1].trim();
        const urlMatch = citationText.match(/(https?:\/\/[^\s]+)/);

        citations.push({
          type: urlMatch ? "link" : "reference",
          text: citationText,
          sourceUrl: urlMatch ? urlMatch[1] : undefined,
          sourceTitle: urlMatch ? undefined : citationText,
          position: match.index,
          context: this.extractContext(content, match.index),
          relevanceScore: this.calculateRelevanceScore(citationText),
          contentType: this.inferContentType(citationText, urlMatch?.[1]),
          rawMatch: match[0],
          confidence: 0.95, // High confidence for explicit citations
        });
      }
    }

    return citations;
  }

  /**
   * Extract standalone URLs from content
   * URLs are strong signals of citation
   */
  private extractUrls(content: string): ParsedCitation[] {
    const citations: ParsedCitation[] = [];
    const urlPattern =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

    let match;
    while ((match = urlPattern.exec(content)) !== null) {
      const url = match[0];

      citations.push({
        type: "link",
        sourceUrl: url,
        sourceTitle: this.extractTitleFromUrl(url),
        position: match.index,
        context: this.extractContext(content, match.index),
        relevanceScore: this.calculateRelevanceScore(url),
        contentType: this.inferContentType("", url),
        rawMatch: match[0],
        confidence: 0.85, // High confidence for URLs
      });
    }

    return citations;
  }

  /**
   * Extract direct quotes (text in quotation marks)
   * Quotes longer than minimum length are considered citations
   */
  private extractDirectQuotes(content: string): ParsedCitation[] {
    const citations: ParsedCitation[] = [];
    const quotePatterns = [
      /"([^"]{20,500})"/g, // Double quotes
      /\u201c([^\u201d]{20,500})\u201d/g, // Curly double quotes
      /\u2018([^\u2019]{20,500})\u2019/g, // Single curly quotes
    ];

    for (const pattern of quotePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const quotedText = match[1].trim();

        // Skip if too short or too long
        if (
          quotedText.length < this.options.minTextLength ||
          quotedText.length > this.options.maxTextLength
        ) {
          continue;
        }

        citations.push({
          type: "direct_quote",
          text: quotedText,
          position: match.index,
          context: this.extractContext(content, match.index),
          relevanceScore: this.calculateRelevanceScore(quotedText),
          contentType: "unknown",
          rawMatch: match[0],
          confidence: 0.75, // Medium-high confidence for quotes
        });
      }
    }

    return citations;
  }

  /**
   * Extract brand mentions as paraphrases
   * Identifies sentences or phrases that mention the brand
   */
  private extractBrandMentions(content: string): ParsedCitation[] {
    const citations: ParsedCitation[] = [];

    if (!this.options.brandName) {
      return citations;
    }

    // Create regex to find sentences containing brand name
    const brandPattern = new RegExp(
      `([^.!?]*\\b${this.escapeRegex(this.options.brandName)}\\b[^.!?]*)`,
      "gi"
    );

    let match;
    while ((match = brandPattern.exec(content)) !== null) {
      const mentionText = match[1].trim();

      // Skip if too short or too long
      if (
        mentionText.length < this.options.minTextLength ||
        mentionText.length > this.options.maxTextLength
      ) {
        continue;
      }

      citations.push({
        type: "paraphrase",
        text: mentionText,
        position: match.index,
        context: this.extractContext(content, match.index),
        relevanceScore: this.calculateRelevanceScore(mentionText),
        contentType: "unknown",
        rawMatch: match[0],
        confidence: 0.6, // Medium confidence for brand mentions
      });
    }

    return citations;
  }

  /**
   * Build citation patterns for matching
   * Defines the regex patterns used to identify citations
   */
  private buildCitationPatterns(): CitationPattern[] {
    return [
      {
        pattern: /\[Source:\s*([^\]]+)\]/gi,
        type: "reference",
        priority: 10,
      },
      {
        pattern: /https?:\/\/[^\s]+/gi,
        type: "link",
        priority: 9,
      },
      {
        pattern: /"([^"]{20,500})"/g,
        type: "direct_quote",
        priority: 8,
      },
      {
        pattern: /\(Source:\s*([^)]+)\)/gi,
        type: "reference",
        priority: 7,
      },
    ];
  }

  /**
   * Extract surrounding context for a citation
   *
   * @param content - Full response content
   * @param index - Position of the citation in content
   * @param contextLength - Number of characters to extract before and after (default: 100)
   * @returns Surrounding context
   */
  private extractContext(
    content: string,
    index: number,
    contextLength: number = 100
  ): string {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + contextLength);
    let context = content.slice(start, end);

    // Add ellipsis if truncated
    if (start > 0) {
      context = "..." + context;
    }
    if (end < content.length) {
      context = context + "...";
    }

    return context.trim();
  }

  /**
   * Calculate relevance score for a citation based on brand mentions and keywords
   *
   * @param text - Citation text or URL
   * @returns Relevance score (0-100)
   */
  private calculateRelevanceScore(text: string): number {
    if (!text) return 30; // Default low score

    const lowerText = text.toLowerCase();
    let score = 30; // Base score

    // Check for exact brand name match
    if (this.options.brandName) {
      const lowerBrand = this.options.brandName.toLowerCase();
      if (lowerText.includes(lowerBrand)) {
        score += 40; // +40 for exact brand match
      } else {
        // Check for partial brand word matches
        const brandWords = lowerBrand.split(/\s+/);
        const matchCount = brandWords.filter((word) =>
          lowerText.includes(word)
        ).length;
        if (matchCount > 0) {
          score += matchCount * 10; // +10 per matching word
        }
      }
    }

    // Check for brand-related keywords
    if (this.options.brandKeywords.length > 0) {
      const keywordMatches = this.options.brandKeywords.filter((keyword) =>
        lowerText.includes(keyword.toLowerCase())
      ).length;
      score += keywordMatches * 5; // +5 per keyword match
    }

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Infer content type from citation text or URL
   *
   * @param text - Citation text
   * @param url - Citation URL
   * @returns Inferred content type
   */
  private inferContentType(text: string, url?: string): ContentType {
    const lowerText = (text + " " + (url || "")).toLowerCase();

    // Check for content type indicators
    if (
      lowerText.includes("blog") ||
      lowerText.includes("/blog/") ||
      lowerText.includes("article")
    ) {
      return "blog_post";
    }

    if (
      lowerText.includes("docs") ||
      lowerText.includes("documentation") ||
      lowerText.includes("guide") ||
      lowerText.includes("/docs/")
    ) {
      return "documentation";
    }

    if (
      lowerText.includes("case study") ||
      lowerText.includes("case-study") ||
      lowerText.includes("customer story")
    ) {
      return "case_study";
    }

    if (
      lowerText.includes("press release") ||
      lowerText.includes("news") ||
      lowerText.includes("/press/")
    ) {
      return "press_release";
    }

    if (
      lowerText.includes("whitepaper") ||
      lowerText.includes("white paper") ||
      lowerText.includes("research")
    ) {
      return "whitepaper";
    }

    if (
      lowerText.includes("tutorial") ||
      lowerText.includes("how-to") ||
      lowerText.includes("walkthrough")
    ) {
      return "tutorial";
    }

    if (lowerText.includes("faq") || lowerText.includes("frequently asked")) {
      return "faq";
    }

    if (
      lowerText.includes("product") ||
      lowerText.includes("features") ||
      lowerText.includes("/product/")
    ) {
      return "product_page";
    }

    if (
      lowerText.includes("youtube.com") ||
      lowerText.includes("vimeo.com") ||
      lowerText.includes("video")
    ) {
      return "video";
    }

    if (
      lowerText.includes("podcast") ||
      lowerText.includes("episode") ||
      lowerText.includes("audio")
    ) {
      return "podcast";
    }

    if (
      lowerText.includes("twitter.com") ||
      lowerText.includes("linkedin.com") ||
      lowerText.includes("facebook.com")
    ) {
      return "social_media";
    }

    return "unknown";
  }

  /**
   * Extract a title from a URL
   *
   * @param url - The URL to extract a title from
   * @returns Extracted title or domain name
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace("www.", "");

      // Try to extract from path
      const pathParts = urlObj.pathname
        .split("/")
        .filter((part) => part.length > 0);

      if (pathParts.length > 0) {
        // Get last meaningful path segment
        const lastSegment = pathParts[pathParts.length - 1];
        const title = lastSegment
          .replace(/[-_]/g, " ")
          .replace(/\.[^.]+$/, "") // Remove extension
          .trim();

        if (title.length > 3) {
          return title.charAt(0).toUpperCase() + title.slice(1);
        }
      }

      // Fallback to hostname
      return hostname;
    } catch (error) {
      // Invalid URL, return as-is
      return url;
    }
  }

  /**
   * Remove duplicate citations and sort by position
   *
   * @param citations - Array of citations potentially containing duplicates
   * @returns Deduplicated and sorted citations
   */
  private deduplicateCitations(
    citations: ParsedCitation[]
  ): ParsedCitation[] {
    const seen = new Map<string, ParsedCitation>();

    for (const citation of citations) {
      // Create a unique key for each citation
      const key = this.createCitationKey(citation);

      // Keep the citation with higher confidence if duplicate
      const existing = seen.get(key);
      if (!existing || citation.confidence > existing.confidence) {
        seen.set(key, citation);
      }
    }

    // Convert to array and sort by position
    return Array.from(seen.values()).sort(
      (a, b) => (a.position || 0) - (b.position || 0)
    );
  }

  /**
   * Create a unique key for a citation
   *
   * @param citation - The citation to create a key for
   * @returns Unique key string
   */
  private createCitationKey(citation: ParsedCitation): string {
    // Use type and text/url as key components
    const identifier = citation.text || citation.sourceUrl || "";
    return `${citation.type}:${identifier.toLowerCase().trim()}`;
  }

  /**
   * Calculate final confidence scores for citations
   * Adjusts confidence based on position, context, and relevance
   *
   * @param citations - Citations to score
   * @param content - Original content
   * @returns Citations with updated confidence scores
   */
  private calculateConfidenceScores(
    citations: ParsedCitation[],
    content: string
  ): ParsedCitation[] {
    const totalLength = content.length;

    return citations.map((citation, index) => {
      let confidence = citation.confidence;

      // Boost confidence for earlier citations (first mention is often most important)
      const position = citation.position || 0;
      const positionRatio = position / totalLength;
      if (positionRatio < 0.2) {
        // First 20% of content
        confidence += 0.05;
      }

      // Boost confidence for high relevance scores
      if (citation.relevanceScore && citation.relevanceScore >= 80) {
        confidence += 0.1;
      }

      // Cap at 1.0
      confidence = Math.min(confidence, 1.0);

      return {
        ...citation,
        confidence,
      };
    });
  }

  /**
   * Escape special regex characters in a string
   *
   * @param str - String to escape
   * @returns Escaped string safe for use in RegExp
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Filter citations by type
   *
   * @param citations - Citations to filter
   * @param type - Citation type to filter by
   * @returns Filtered citations
   */
  static filterByType(
    citations: ParsedCitation[],
    type: CitationType
  ): ParsedCitation[] {
    return citations.filter((c) => c.type === type);
  }

  /**
   * Filter citations by minimum confidence score
   *
   * @param citations - Citations to filter
   * @param minConfidence - Minimum confidence score (0-1)
   * @returns Filtered citations
   */
  static filterByConfidence(
    citations: ParsedCitation[],
    minConfidence: number
  ): ParsedCitation[] {
    return citations.filter((c) => c.confidence >= minConfidence);
  }

  /**
   * Filter citations by minimum relevance score
   *
   * @param citations - Citations to filter
   * @param minRelevance - Minimum relevance score (0-100)
   * @returns Filtered citations
   */
  static filterByRelevance(
    citations: ParsedCitation[],
    minRelevance: number
  ): ParsedCitation[] {
    return citations.filter(
      (c) => (c.relevanceScore || 0) >= minRelevance
    );
  }

  /**
   * Get citation statistics
   *
   * @param citations - Citations to analyze
   * @returns Statistics about the citations
   */
  static getStatistics(citations: ParsedCitation[]): {
    total: number;
    byType: Record<CitationType, number>;
    avgConfidence: number;
    avgRelevance: number;
  } {
    const byType: Record<CitationType, number> = {
      direct_quote: 0,
      paraphrase: 0,
      link: 0,
      reference: 0,
    };

    let totalConfidence = 0;
    let totalRelevance = 0;

    for (const citation of citations) {
      byType[citation.type]++;
      totalConfidence += citation.confidence;
      totalRelevance += citation.relevanceScore || 0;
    }

    return {
      total: citations.length,
      byType,
      avgConfidence: citations.length > 0 ? totalConfidence / citations.length : 0,
      avgRelevance: citations.length > 0 ? totalRelevance / citations.length : 0,
    };
  }
}

/**
 * Parse citations from content (convenience function)
 *
 * @param content - The response text to parse
 * @param options - Parser options
 * @returns Array of parsed citations
 *
 * @example
 * ```typescript
 * const citations = parseCitations(responseContent, { brandName: "Acme Corp" });
 * console.log(`Found ${citations.length} citations`);
 * ```
 */
export function parseCitations(
  content: string,
  options?: CitationParserOptions
): ParsedCitation[] {
  const parser = new CitationParser(options);
  return parser.parse(content);
}

/**
 * Convert ParsedCitation to Citation (removes parser-specific fields)
 *
 * @param parsedCitation - Parsed citation to convert
 * @returns Standard citation object
 */
export function toCitation(parsedCitation: ParsedCitation): Citation {
  const { rawMatch, confidence, ...citation } = parsedCitation;
  return citation;
}

/**
 * Convert array of ParsedCitations to Citations
 *
 * @param parsedCitations - Array of parsed citations
 * @returns Array of standard citations
 */
export function toCitations(parsedCitations: ParsedCitation[]): Citation[] {
  return parsedCitations.map(toCitation);
}
