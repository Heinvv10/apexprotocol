/**
 * Microsoft Copilot Adapter for Platform Analysis
 * Implements PlatformAdapter interface using Azure OpenAI SDK
 *
 * Note: Microsoft Copilot for consumers doesn't have a public API.
 * This adapter uses Azure OpenAI as the underlying service, which powers
 * enterprise Copilot deployments. For consumer Copilot monitoring,
 * manual testing or scraping approaches would be needed.
 */

import OpenAI from "openai";
import type { PlatformAdapter, PlatformResponse, Citation } from "./base";

/**
 * Copilot adapter for analyzing brand visibility using Azure OpenAI
 * This represents enterprise Copilot deployments powered by Azure OpenAI
 */
export class CopilotAdapter implements PlatformAdapter {
  readonly platform = "copilot" as const;
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";

    if (!apiKey || !endpoint) {
      throw new Error(
        "AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT environment variables are required. " +
          "Please add them to your .env.local file."
      );
    }

    // Azure OpenAI uses a different API format
    this.client = new OpenAI({
      apiKey,
      baseURL: `${endpoint}/openai/deployments/${deploymentName}`,
      defaultQuery: { "api-version": "2024-02-15-preview" },
      defaultHeaders: { "api-key": apiKey },
    });
  }

  /**
   * Analyze how Copilot/Azure OpenAI responds to a brand-related query
   *
   * @param query - The search query or question to ask
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

      // Call Azure OpenAI API
      const response = await this.client.chat.completions.create({
        model: "gpt-4", // This is ignored for Azure, uses deployment name
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
        throw new Error("No content in Copilot response");
      }

      // Extract citations from the response
      const citations = this.extractCitations(content, brandContext);

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
        provider: "azure-openai",
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
        throw new Error(`Copilot/Azure OpenAI API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extract citations from response content
   * Looks for [Source: ...] patterns and URLs
   */
  private extractCitations(content: string, brandContext: string): Citation[] {
    const citations: Citation[] = [];
    const brandName = this.extractBrandName(brandContext);
    let position = 0;

    // Pattern 1: [Source: URL or title] format
    const sourcePattern = /\[Source:\s*([^\]]+)\]/gi;
    let match;
    while ((match = sourcePattern.exec(content)) !== null) {
      const source = match[1].trim();
      const isUrl = source.startsWith("http");
      citations.push({
        type: isUrl ? "link" : "reference",
        sourceUrl: isUrl ? source : undefined,
        sourceTitle: isUrl ? undefined : source,
        text: source,
        position: position++,
        context: this.extractSnippet(content, match.index),
        relevanceScore: this.calculateRelevance(source, brandName),
      });
    }

    // Pattern 2: Direct URLs in content
    const urlPattern = /https?:\/\/[^\s\)>\]]+/gi;
    while ((match = urlPattern.exec(content)) !== null) {
      const url = match[0];
      // Avoid duplicates from [Source: URL] pattern
      if (!citations.some((c) => c.sourceUrl === url)) {
        citations.push({
          type: "link",
          sourceUrl: url,
          position: position++,
          context: this.extractSnippet(content, match.index),
          relevanceScore: this.calculateRelevance(url, brandName),
        });
      }
    }

    // Sort by relevance
    return citations.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  /**
   * Extract brand name from context for relevance scoring
   */
  private extractBrandName(brandContext: string): string {
    // Try to extract brand name from context
    const nameMatch = brandContext.match(/brand(?:\s+name)?[:\s]+([^\n,]+)/i);
    if (nameMatch) {
      return nameMatch[1].trim().toLowerCase();
    }
    // Fall back to first significant word
    return brandContext.split(/\s+/)[0]?.toLowerCase() || "";
  }

  /**
   * Calculate relevance score based on brand mention
   */
  private calculateRelevance(text: string, brandName: string): number {
    const lowerText = text.toLowerCase();
    if (lowerText.includes(brandName)) {
      return 0.9;
    }
    // Check for partial matches
    const brandWords = brandName.split(/\s+/);
    for (const word of brandWords) {
      if (word.length > 3 && lowerText.includes(word)) {
        return 0.6;
      }
    }
    return 0.3;
  }

  /**
   * Extract a snippet around the citation
   */
  private extractSnippet(content: string, position: number): string {
    const snippetLength = 150;
    const start = Math.max(0, position - snippetLength / 2);
    const end = Math.min(content.length, position + snippetLength / 2);
    let snippet = content.slice(start, end);

    // Clean up snippet
    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";

    return snippet.trim();
  }
}
