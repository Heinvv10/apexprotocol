/**
 * Perplexity Adapter for Platform Analysis
 * Implements PlatformAdapter interface using OpenAI SDK with custom baseURL
 */

import OpenAI from "openai";
import type { PlatformAdapter, PlatformResponse, Citation } from "./base";

/**
 * Perplexity adapter for analyzing brand visibility in Perplexity responses
 * Note: Uses OpenAI SDK with custom baseURL pointing to Perplexity API
 */
export class PerplexityAdapter implements PlatformAdapter {
  readonly platform = "perplexity" as const;
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      throw new Error(
        "PERPLEXITY_API_KEY environment variable is not set. " +
          "Please add it to your .env.local file."
      );
    }

    // Perplexity uses OpenAI SDK with custom baseURL
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.perplexity.ai",
    });
  }

  /**
   * Analyze how Perplexity responds to a brand-related query
   *
   * @param query - The search query or question to ask Perplexity
   * @param brandContext - Context about the brand to help identify mentions
   * @returns Promise resolving to normalized platform response with citations
   */
  async analyze(query: string, brandContext: string): Promise<PlatformResponse> {
    try {
      // Create system prompt that includes brand context
      const systemPrompt = `You are a helpful assistant analyzing brand visibility.

Brand context: ${brandContext}

When answering questions, if the brand is relevant to the query, include specific information about it.
If you reference any sources, websites, or specific information, please include citations in your response using the format [Source: URL or title].`;

      // Call Perplexity API (using OpenAI SDK with custom baseURL)
      // Note: As of Feb 2025, llama-3.1-sonar models were deprecated
      // Use "sonar" or "sonar-pro" models instead
      const response = await this.client.chat.completions.create({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      // Extract content from response
      const content = response.choices[0]?.message?.content || "";

      if (!content) {
        throw new Error("No content in Perplexity response");
      }

      // Extract citations from the response
      // Perplexity may include search_results in the response
      const citations = this.extractCitations(
        content,
        brandContext,
        (response as any).search_results
      );

      // Build metadata
      const metadata = {
        model: response.model,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
        finish_reason: response.choices[0]?.finish_reason,
        created: response.created,
        search_results_count: (response as any).search_results?.length || 0,
      };

      return {
        platform: this.platform,
        content,
        citations,
        metadata,
      };
    } catch (error) {
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Perplexity API error: ${error.message}`);
      }
      throw new Error("Unknown error occurred while calling Perplexity API");
    }
  }

  /**
   * Extract citations from Perplexity response content
   * Looks for URLs, explicit citations, brand mentions, and search_results
   *
   * @param content - The response text from Perplexity
   * @param brandContext - Brand context to identify brand mentions
   * @param searchResults - Optional search results from Perplexity API response
   * @returns Array of extracted citations
   */
  private extractCitations(
    content: string,
    brandContext: string,
    searchResults?: Array<{ url: string; title?: string; snippet?: string }>
  ): Citation[] {
    const citations: Citation[] = [];
    let position = 0;

    // Extract brand name from context for mention detection
    const brandNameMatch = brandContext.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    const brandName = brandNameMatch ? brandNameMatch[1] : "";

    // 1. Extract citations from search_results if available (Perplexity-specific)
    if (searchResults && Array.isArray(searchResults)) {
      for (const result of searchResults) {
        if (result.url) {
          citations.push({
            type: "link",
            sourceUrl: result.url,
            sourceTitle: result.title,
            text: result.snippet,
            position: position++,
            relevanceScore: this.calculateRelevanceScore(
              result.snippet || result.title || result.url,
              brandName
            ),
          });
        }
      }
    }

    // 2. Extract explicit citation patterns like [Source: URL or title]
    const explicitCitationRegex = /\[Source:\s*([^\]]+)\]/gi;
    let match;

    while ((match = explicitCitationRegex.exec(content)) !== null) {
      const citationText = match[1].trim();
      const urlMatch = citationText.match(/(https?:\/\/[^\s]+)/);

      citations.push({
        type: urlMatch ? "link" : "reference",
        text: citationText,
        sourceUrl: urlMatch ? urlMatch[1] : undefined,
        sourceTitle: urlMatch ? undefined : citationText,
        position: position++,
        context: this.getContext(content, match.index),
        relevanceScore: this.calculateRelevanceScore(citationText, brandName),
      });
    }

    // 3. Extract standalone URLs
    const urlRegex = /https?:\/\/[^\s]+/gi;
    const urls = content.match(urlRegex) || [];

    for (const url of urls) {
      // Skip if already captured in explicit citations or search results
      if (citations.some((c) => c.sourceUrl === url)) {
        continue;
      }

      const urlIndex = content.indexOf(url);
      citations.push({
        type: "link",
        sourceUrl: url,
        position: position++,
        context: this.getContext(content, urlIndex),
        relevanceScore: this.calculateRelevanceScore(url, brandName),
      });
    }

    // 4. Extract quoted text (potential direct quotes)
    const quoteRegex = /"([^"]{20,200})"/g;
    while ((match = quoteRegex.exec(content)) !== null) {
      const quotedText = match[1];

      citations.push({
        type: "direct_quote",
        text: quotedText,
        position: position++,
        context: this.getContext(content, match.index),
        relevanceScore: this.calculateRelevanceScore(quotedText, brandName),
      });
    }

    // 5. Detect brand mentions as paraphrases
    if (brandName) {
      const brandMentionRegex = new RegExp(
        `([^.!?]*\\b${brandName}\\b[^.!?]*)`,
        "gi"
      );

      while ((match = brandMentionRegex.exec(content)) !== null) {
        const mentionText = match[1].trim();

        // Skip if too short or already captured
        if (
          mentionText.length < 20 ||
          citations.some((c) => c.text === mentionText)
        ) {
          continue;
        }

        citations.push({
          type: "paraphrase",
          text: mentionText,
          position: position++,
          context: this.getContext(content, match.index),
          relevanceScore: this.calculateRelevanceScore(mentionText, brandName),
        });
      }
    }

    // Sort by position and remove duplicates
    return this.deduplicateCitations(citations);
  }

  /**
   * Get surrounding context for a citation
   *
   * @param content - Full response content
   * @param index - Position of the citation in content
   * @returns Surrounding context (50 chars before and after)
   */
  private getContext(content: string, index: number | undefined): string {
    if (index === undefined) return "";

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + 50);
    const context = content.slice(start, end);

    return start > 0 ? `...${context}` : context;
  }

  /**
   * Calculate relevance score for a citation based on brand mentions
   *
   * @param text - Citation text
   * @param brandName - Brand name to look for
   * @returns Relevance score (0-100)
   */
  private calculateRelevanceScore(text: string, brandName: string): number {
    if (!brandName) return 50; // Neutral score if no brand name

    const lowerText = text.toLowerCase();
    const lowerBrand = brandName.toLowerCase();

    // Direct brand mention = high relevance
    if (lowerText.includes(lowerBrand)) {
      return 90;
    }

    // Check for brand-related keywords
    const brandWords = lowerBrand.split(/\s+/);
    const matchCount = brandWords.filter((word) =>
      lowerText.includes(word)
    ).length;

    if (matchCount > 0) {
      return Math.min(50 + matchCount * 15, 85);
    }

    // Default relevance
    return 30;
  }

  /**
   * Remove duplicate citations and sort by position
   *
   * @param citations - Array of citations potentially containing duplicates
   * @returns Deduplicated and sorted citations
   */
  private deduplicateCitations(citations: Citation[]): Citation[] {
    const seen = new Set<string>();
    const unique: Citation[] = [];

    for (const citation of citations) {
      // Create a unique key for each citation
      const key = `${citation.type}:${citation.text || citation.sourceUrl}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(citation);
      }
    }

    // Sort by position
    return unique.sort((a, b) => (a.position || 0) - (b.position || 0));
  }
}
