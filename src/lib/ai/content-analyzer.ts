/**
 * Content Analyzer for GEO (Generative Engine Optimization)
 * Analyzes content and provides specific, actionable optimization suggestions
 */

import { sendMessage, GPT_MODELS, DEFAULT_MODELS } from "./openai";

/**
 * Suggestion types for content optimization
 */
export type SuggestionType = "keyword" | "structure" | "formatting";

/**
 * Individual content optimization suggestion
 */
export interface Suggestion {
  id: string;
  type: SuggestionType;
  description: string;
  originalText: string;
  suggestedText: string;
  confidence: number; // 0-1 scale
  position?: {
    from: number;
    to: number;
  };
}

/**
 * Analysis result containing suggestions and metadata
 */
export interface AnalysisResult {
  suggestions: Suggestion[];
  overallScore: number; // 0-100 scale
  citationProbability: "high" | "medium" | "low";
  summary: string;
  tokenUsage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Configuration for content analysis
 */
export interface AnalyzerConfig {
  model?: string;
  maxTokens?: number;
  minContentLength?: number;
  minWordCount?: number;
}

/**
 * Default analyzer configuration
 */
const DEFAULT_ANALYZER_CONFIG: Required<AnalyzerConfig> = {
  model: DEFAULT_MODELS.chat,
  maxTokens: 4096,
  minContentLength: 50,
  minWordCount: 0, // Word count check disabled by default; enforce via minContentLength (char-based)
};

/**
 * Count words in content (excluding HTML tags)
 */
function countWords(content: string): number {
  const cleanContent = content.replace(/<[^>]*>/g, "").trim();
  if (!cleanContent) return 0;
  return cleanContent.split(/\s+/).length;
}

/**
 * Strip HTML tags from content
 */
function stripHtml(content: string): string {
  return content.replace(/<[^>]*>/g, "").trim();
}

/**
 * GEO optimization system prompt
 * Defines the AI's role as a content optimization expert
 */
const GEO_SYSTEM_PROMPT = `You are an expert GEO (Generative Engine Optimization) content analyst.
Your role is to analyze content and provide specific, actionable optimization suggestions that will increase the likelihood of being cited by AI platforms like ChatGPT, Claude, Perplexity, and Google Gemini.

Focus on three key areas:
1. KEYWORDS: Identify opportunities to add or optimize keywords that AI systems commonly search for
2. STRUCTURE: Suggest structural improvements (headings, lists, paragraphs) that make content more parseable by AI
3. FORMATTING: Recommend formatting changes that improve clarity and authority signals

Guidelines:
- Provide specific, concrete suggestions (not vague guidance)
- Include exact text replacements when possible
- Prioritize high-impact, low-effort changes
- Assign confidence scores (0-1) based on expected impact
- Focus on semantic clarity and authoritative language
- Suggest structured data and schema-friendly patterns

Always respond with valid JSON following the specified format.`;

/**
 * Create user prompt for content analysis
 */
function createAnalysisPrompt(content: string): string {
  return `Analyze the following content for GEO optimization opportunities:

CONTENT TO ANALYZE:
${content}

Provide your analysis in this JSON format:
{
  "overallScore": <number 0-100>,
  "citationProbability": "<high|medium|low>",
  "summary": "<2-3 sentence summary of optimization opportunities>",
  "suggestions": [
    {
      "id": "<unique_id>",
      "type": "<keyword|structure|formatting>",
      "description": "<specific description of what to change and why>",
      "originalText": "<exact text to replace>",
      "suggestedText": "<exact replacement text>",
      "confidence": <number 0-1>,
      "position": {
        "from": <character position>,
        "to": <character position>
      }
    }
  ]
}

IMPORTANT:
- Generate 3-8 suggestions based on content length and quality
- originalText must be exact quotes from the content
- suggestedText must be specific, ready-to-use replacements
- Include character positions when possible for precise replacement
- Prioritize suggestions by confidence score
- If content is already well-optimized, provide positive feedback and 0-2 minor suggestions`;
}

/**
 * Parse AI response into structured AnalysisResult
 */
function parseAnalysisResponse(
  aiResponse: string,
  tokenUsage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
): AnalysisResult {
  try {
    // Extract JSON from response (handles markdown code blocks)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (
      typeof parsed.overallScore !== "number" ||
      !parsed.citationProbability ||
      !parsed.summary ||
      !Array.isArray(parsed.suggestions)
    ) {
      throw new Error("Invalid response structure");
    }

    // Ensure all suggestions have required fields
    const suggestions: Suggestion[] = parsed.suggestions.map(
      (s: any, index: number) => ({
        id: s.id || `suggestion-${index + 1}`,
        type: s.type || "keyword",
        description: s.description || "",
        originalText: s.originalText || "",
        suggestedText: s.suggestedText || "",
        confidence: Math.max(0, Math.min(1, s.confidence || 0.5)),
        position: s.position
          ? {
              from: s.position.from || 0,
              to: s.position.to || 0,
            }
          : undefined,
      })
    );

    // Handle case where content is already well-optimized (no suggestions)
    // Ensure summary reflects this positive outcome
    let summary = parsed.summary;
    if (suggestions.length === 0) {
      summary = parsed.summary.includes("well-optimized") || parsed.summary.includes("excellent")
        ? parsed.summary
        : `Content is already well-optimized for GEO. ${parsed.summary}`;
    }

    return {
      suggestions,
      overallScore: Math.max(0, Math.min(100, parsed.overallScore)),
      citationProbability: parsed.citationProbability,
      summary,
      tokenUsage,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Analyze content for GEO optimization opportunities
 *
 * @param content - The HTML or plain text content to analyze
 * @param config - Optional configuration for the analysis
 * @returns Analysis result with suggestions and metadata
 *
 * @throws Error if content is too short or API call fails
 *
 * @example
 * ```typescript
 * const result = await analyzeContent(editorContent);
 * console.log(`Overall score: ${result.overallScore}/100`);
 * result.suggestions.forEach(s => {
 *   console.log(`${s.type}: ${s.description}`);
 * });
 * ```
 */
export async function analyzeContent(
  content: string,
  config: AnalyzerConfig = {}
): Promise<AnalysisResult> {
  const finalConfig = { ...DEFAULT_ANALYZER_CONFIG, ...config };

  // Validate content length (both character and word count)
  const cleanContent = stripHtml(content);
  const wordCount = countWords(content);

  // Check minimum word count
  if (wordCount < finalConfig.minWordCount) {
    throw new Error(
      `Content too short for meaningful analysis. Please provide at least ${finalConfig.minWordCount} words of content (currently ${wordCount} words).`
    );
  }

  // Check minimum character count
  if (cleanContent.length < finalConfig.minContentLength) {
    throw new Error(
      `Content too short for analysis. Minimum ${finalConfig.minContentLength} characters required (currently ${cleanContent.length} characters).`
    );
  }

  // Send analysis request to OpenAI
  const response = await sendMessage(
    GEO_SYSTEM_PROMPT,
    createAnalysisPrompt(content),
    finalConfig.model,
    finalConfig.maxTokens
  );

  // Parse and return structured result
  return parseAnalysisResponse(response.content, response.usage);
}

/**
 * Chunk large content for analysis
 * Useful for content exceeding token limits (10k+ words)
 */
export function chunkContent(
  content: string,
  maxChunkSize: number = 5000
): string[] {
  const cleanContent = content.trim();
  if (cleanContent.length <= maxChunkSize) {
    return [cleanContent];
  }

  const chunks: string[] = [];
  let currentChunk = "";

  // Split by paragraphs to maintain context
  const paragraphs = cleanContent.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      // If single paragraph exceeds max size, split it
      if (paragraph.length > maxChunkSize) {
        const sentences = paragraph.split(/\.\s+/);
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence + ". ";
          } else {
            currentChunk += sentence + ". ";
          }
        }
      } else {
        currentChunk = paragraph + "\n\n";
      }
    } else {
      currentChunk += paragraph + "\n\n";
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Analyze large content by chunking
 * Combines suggestions from multiple chunks
 */
export async function analyzeLargeContent(
  content: string,
  config: AnalyzerConfig = {}
): Promise<AnalysisResult> {
  const chunks = chunkContent(content);

  // If content fits in a single chunk, use regular analysis
  if (chunks.length === 1) {
    return analyzeContent(content, config);
  }

  // Filter out chunks that are too short to analyze
  const validChunks = chunks.filter((chunk) => {
    const wordCount = countWords(chunk);
    return wordCount >= 20;
  });

  // If no valid chunks after filtering, throw error
  if (validChunks.length === 0) {
    throw new Error(
      "Content contains no sections long enough for meaningful analysis. Please provide more substantial content."
    );
  }

  // Analyze each valid chunk
  const results = await Promise.all(
    validChunks.map((chunk) => analyzeContent(chunk, config))
  );

  // Combine results
  const allSuggestions = results.flatMap((r) => r.suggestions);
  const avgScore =
    results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
  const totalTokens = results.reduce(
    (sum, r) => sum + r.tokenUsage.total_tokens,
    0
  );

  // Determine overall citation probability
  const highCount = results.filter(
    (r) => r.citationProbability === "high"
  ).length;
  const mediumCount = results.filter(
    (r) => r.citationProbability === "medium"
  ).length;
  let citationProbability: "high" | "medium" | "low" = "low";
  if (highCount > results.length / 2) citationProbability = "high";
  else if (highCount + mediumCount > results.length / 2)
    citationProbability = "medium";

  // Create comprehensive summary for large content
  const totalSuggestions = allSuggestions.length;
  const suggestionSummary =
    totalSuggestions === 0
      ? "No optimization suggestions needed."
      : `Found ${totalSuggestions} optimization ${totalSuggestions === 1 ? "suggestion" : "suggestions"}.`;

  return {
    suggestions: allSuggestions,
    overallScore: Math.round(avgScore),
    citationProbability,
    summary: `Analyzed ${validChunks.length} content sections. ${suggestionSummary} ${results[0]?.summary || ""}`.trim(),
    tokenUsage: {
      prompt_tokens: results.reduce(
        (sum, r) => sum + r.tokenUsage.prompt_tokens,
        0
      ),
      completion_tokens: results.reduce(
        (sum, r) => sum + r.tokenUsage.completion_tokens,
        0
      ),
      total_tokens: totalTokens,
    },
  };
}

/**
 * Validate suggestion applicability
 * Checks if a suggestion can be safely applied to content
 */
export function validateSuggestion(
  suggestion: Suggestion,
  content: string
): { valid: boolean; reason?: string } {
  if (!suggestion.originalText) {
    return { valid: false, reason: "Missing original text" };
  }

  if (!suggestion.suggestedText) {
    return { valid: false, reason: "Missing suggested text" };
  }

  // Check if original text exists in content
  if (!content.includes(suggestion.originalText)) {
    return {
      valid: false,
      reason: "Original text not found in content",
    };
  }

  return { valid: true };
}

/**
 * Apply a suggestion to content
 * Returns updated content with suggestion applied
 */
export function applySuggestion(
  content: string,
  suggestion: Suggestion
): string {
  const validation = validateSuggestion(suggestion, content);
  if (!validation.valid) {
    throw new Error(`Cannot apply suggestion: ${validation.reason}`);
  }

  // Replace first occurrence
  return content.replace(suggestion.originalText, suggestion.suggestedText);
}

/**
 * Apply multiple suggestions to content
 * Applies suggestions in order of confidence (highest first)
 */
export function applySuggestions(
  content: string,
  suggestions: Suggestion[]
): string {
  // Sort by confidence (highest first)
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => b.confidence - a.confidence
  );

  let updatedContent = content;
  const appliedSuggestions: string[] = [];

  for (const suggestion of sortedSuggestions) {
    try {
      const validation = validateSuggestion(suggestion, updatedContent);
      if (validation.valid) {
        updatedContent = applySuggestion(updatedContent, suggestion);
        appliedSuggestions.push(suggestion.id);
      }
    } catch (error) {
      // Skip suggestions that can't be applied
      continue;
    }
  }

  return updatedContent;
}
