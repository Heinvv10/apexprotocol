/**
 * Tests for Content Analyzer - GEO Optimization Engine
 * Tests content analysis, suggestion generation, and application logic
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeContent,
  analyzeLargeContent,
  chunkContent,
  validateSuggestion,
  applySuggestion,
  applySuggestions,
  type Suggestion,
  type AnalysisResult,
  type SuggestionType,
} from "../../../src/lib/ai/content-analyzer";
import * as openai from "../../../src/lib/ai/openai";

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockSuggestion = (
  overrides: Partial<Suggestion> = {}
): Suggestion => ({
  id: "suggestion-1",
  type: "keyword",
  description: "Add target keyword for better AI visibility",
  originalText: "our product",
  suggestedText: "our AI-powered product",
  confidence: 0.85,
  position: {
    from: 10,
    to: 21,
  },
  ...overrides,
});

const createMockAnalysisResult = (
  overrides: Partial<AnalysisResult> = {}
): AnalysisResult => ({
  suggestions: [createMockSuggestion()],
  overallScore: 75,
  citationProbability: "medium",
  summary: "Content has moderate optimization potential",
  tokenUsage: {
    prompt_tokens: 100,
    completion_tokens: 200,
    total_tokens: 300,
  },
  ...overrides,
});

const sampleContent = `
Our product helps businesses optimize their content for AI platforms.
We provide comprehensive analytics and actionable insights.
`;

const mockOpenAIResponse = {
  content: JSON.stringify({
    overallScore: 75,
    citationProbability: "medium",
    summary: "Content has good structure but could benefit from keyword optimization",
    suggestions: [
      {
        id: "suggestion-1",
        type: "keyword",
        description: "Add specific AI platform names for better targeting",
        originalText: "AI platforms",
        suggestedText: "AI platforms like ChatGPT, Claude, and Perplexity",
        confidence: 0.9,
        position: { from: 50, to: 62 },
      },
      {
        id: "suggestion-2",
        type: "structure",
        description: "Break into bulleted list for better parseability",
        originalText: "We provide comprehensive analytics and actionable insights.",
        suggestedText:
          "We provide:\n- Comprehensive analytics\n- Actionable insights",
        confidence: 0.75,
      },
    ],
  }),
  usage: {
    prompt_tokens: 120,
    completion_tokens: 250,
    total_tokens: 370,
  },
};

// ============================================================================
// analyzeContent Tests
// ============================================================================

describe("analyzeContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should analyze content and return structured result", async () => {
    vi.spyOn(openai, "sendMessage").mockResolvedValue(mockOpenAIResponse);

    const result = await analyzeContent(sampleContent);

    expect(result).toHaveProperty("suggestions");
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("citationProbability");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("tokenUsage");
  });

  it("should throw error for content shorter than minimum length", async () => {
    const shortContent = "Too short";

    await expect(analyzeContent(shortContent)).rejects.toThrow(
      /Content too short/
    );
  });

  it("should use custom configuration when provided", async () => {
    const sendMessageSpy = vi
      .spyOn(openai, "sendMessage")
      .mockResolvedValue(mockOpenAIResponse);

    await analyzeContent(sampleContent, {
      model: "gpt-4o-mini",
      maxTokens: 2000,
    });

    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      "gpt-4o-mini",
      2000
    );
  });

  it("should handle custom minimum content length", async () => {
    vi.spyOn(openai, "sendMessage").mockResolvedValue(mockOpenAIResponse);

    const shortContent = "This is a short piece of content.";

    // Should fail with default minContentLength (50)
    await expect(analyzeContent(shortContent)).rejects.toThrow();

    // Should succeed with lower minContentLength
    await expect(
      analyzeContent(shortContent, { minContentLength: 10 })
    ).resolves.toBeDefined();
  });

  it("should strip HTML tags when validating content length", async () => {
    vi.spyOn(openai, "sendMessage").mockResolvedValue(mockOpenAIResponse);

    const htmlContent = "<p>" + "a".repeat(60) + "</p>";

    await expect(analyzeContent(htmlContent)).resolves.toBeDefined();
  });

  it("should parse JSON response correctly", async () => {
    vi.spyOn(openai, "sendMessage").mockResolvedValue(mockOpenAIResponse);

    const result = await analyzeContent(sampleContent);

    expect(result.suggestions).toHaveLength(2);
    expect(result.suggestions[0].id).toBe("suggestion-1");
    expect(result.suggestions[0].type).toBe("keyword");
    expect(result.overallScore).toBe(75);
    expect(result.citationProbability).toBe("medium");
  });

  it("should handle JSON wrapped in markdown code blocks", async () => {
    const wrappedResponse = {
      content: "```json\n" + mockOpenAIResponse.content + "\n```",
      usage: mockOpenAIResponse.usage,
    };

    vi.spyOn(openai, "sendMessage").mockResolvedValue(wrappedResponse);

    const result = await analyzeContent(sampleContent);

    expect(result.suggestions).toHaveLength(2);
    expect(result.overallScore).toBe(75);
  });

  it("should throw error for invalid JSON response", async () => {
    vi.spyOn(openai, "sendMessage").mockResolvedValue({
      content: "Invalid response without JSON",
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });

    await expect(analyzeContent(sampleContent)).rejects.toThrow(
      /Failed to parse AI response/
    );
  });

  it("should validate response structure", async () => {
    const invalidResponse = {
      content: JSON.stringify({
        // Missing required fields
        suggestions: [],
      }),
      usage: mockOpenAIResponse.usage,
    };

    vi.spyOn(openai, "sendMessage").mockResolvedValue(invalidResponse);

    await expect(analyzeContent(sampleContent)).rejects.toThrow(
      /Invalid response structure/
    );
  });

  it("should clamp overallScore to 0-100 range", async () => {
    const responseWithHighScore = {
      content: JSON.stringify({
        overallScore: 150, // Invalid high score
        citationProbability: "high",
        summary: "Test",
        suggestions: [],
      }),
      usage: mockOpenAIResponse.usage,
    };

    vi.spyOn(openai, "sendMessage").mockResolvedValue(responseWithHighScore);

    const result = await analyzeContent(sampleContent);

    expect(result.overallScore).toBe(100);
  });

  it("should clamp confidence scores to 0-1 range", async () => {
    const responseWithInvalidConfidence = {
      content: JSON.stringify({
        overallScore: 75,
        citationProbability: "medium",
        summary: "Test",
        suggestions: [
          {
            id: "test",
            type: "keyword",
            description: "Test",
            originalText: "test",
            suggestedText: "test improved",
            confidence: 1.5, // Invalid
          },
        ],
      }),
      usage: mockOpenAIResponse.usage,
    };

    vi.spyOn(openai, "sendMessage").mockResolvedValue(
      responseWithInvalidConfidence
    );

    const result = await analyzeContent(sampleContent);

    expect(result.suggestions[0].confidence).toBe(1);
  });

  it("should generate default IDs for suggestions without IDs", async () => {
    const responseWithoutIds = {
      content: JSON.stringify({
        overallScore: 75,
        citationProbability: "medium",
        summary: "Test",
        suggestions: [
          {
            type: "keyword",
            description: "Test",
            originalText: "test",
            suggestedText: "test improved",
            confidence: 0.8,
          },
        ],
      }),
      usage: mockOpenAIResponse.usage,
    };

    vi.spyOn(openai, "sendMessage").mockResolvedValue(responseWithoutIds);

    const result = await analyzeContent(sampleContent);

    expect(result.suggestions[0].id).toBe("suggestion-1");
  });
});

// ============================================================================
// chunkContent Tests
// ============================================================================

describe("chunkContent", () => {
  it("should return single chunk for content below max size", () => {
    const content = "Short content piece";
    const chunks = chunkContent(content, 1000);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(content);
  });

  it("should split long content into multiple chunks", () => {
    const longContent = "paragraph\n\n".repeat(500);
    const chunks = chunkContent(longContent, 1000);

    expect(chunks.length).toBeGreaterThan(1);
  });

  it("should split on paragraph boundaries", () => {
    const content = "Para 1\n\nPara 2\n\nPara 3\n\nPara 4";
    const chunks = chunkContent(content, 20);

    chunks.forEach((chunk) => {
      expect(chunk.trim()).not.toContain("Para 1Para 2"); // No paragraphs merged
    });
  });

  it("should handle content with only single paragraphs", () => {
    const content = "a".repeat(10000);
    const chunks = chunkContent(content, 1000);

    expect(chunks.length).toBeGreaterThan(1);
  });

  it("should trim whitespace from chunks", () => {
    const content = "Para 1\n\n\n\nPara 2";
    const chunks = chunkContent(content, 20);

    chunks.forEach((chunk) => {
      expect(chunk).toBe(chunk.trim());
    });
  });
});

// ============================================================================
// analyzeLargeContent Tests
// ============================================================================

describe("analyzeLargeContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use regular analyzeContent for small content", async () => {
    vi.spyOn(openai, "sendMessage").mockResolvedValue(mockOpenAIResponse);

    const result = await analyzeLargeContent(sampleContent);

    expect(result).toHaveProperty("suggestions");
  });

  it("should chunk and analyze large content", async () => {
    const largeContent = "paragraph\n\n".repeat(500);

    vi.spyOn(openai, "sendMessage").mockResolvedValue(mockOpenAIResponse);

    const result = await analyzeLargeContent(largeContent);

    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("should combine suggestions from multiple chunks", async () => {
    const largeContent = "paragraph\n\n".repeat(500);

    vi.spyOn(openai, "sendMessage").mockResolvedValue(mockOpenAIResponse);

    const result = await analyzeLargeContent(largeContent);

    // Should have suggestions from multiple analyses
    expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
  });

  it("should average overall scores from chunks", async () => {
    const largeContent = "paragraph\n\n".repeat(500);

    vi.spyOn(openai, "sendMessage").mockResolvedValue(mockOpenAIResponse);

    const result = await analyzeLargeContent(largeContent);

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("should aggregate token usage", async () => {
    const largeContent = "paragraph\n\n".repeat(500);

    vi.spyOn(openai, "sendMessage").mockResolvedValue(mockOpenAIResponse);

    const result = await analyzeLargeContent(largeContent);

    expect(result.tokenUsage.total_tokens).toBeGreaterThan(0);
  });
});

// ============================================================================
// validateSuggestion Tests
// ============================================================================

describe("validateSuggestion", () => {
  it("should validate suggestion with matching content", () => {
    const suggestion = createMockSuggestion({
      originalText: "our product",
    });
    const content = "We love our product and services";

    const result = validateSuggestion(suggestion, content);

    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("should reject suggestion with missing original text", () => {
    const suggestion = createMockSuggestion({
      originalText: "",
    });
    const content = "Some content";

    const result = validateSuggestion(suggestion, content);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Missing original text");
  });

  it("should reject suggestion with missing suggested text", () => {
    const suggestion = createMockSuggestion({
      suggestedText: "",
    });
    const content = "our product";

    const result = validateSuggestion(suggestion, content);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Missing suggested text");
  });

  it("should reject suggestion when original text not in content", () => {
    const suggestion = createMockSuggestion({
      originalText: "not in content",
    });
    const content = "This is different content";

    const result = validateSuggestion(suggestion, content);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Original text not found in content");
  });
});

// ============================================================================
// applySuggestion Tests
// ============================================================================

describe("applySuggestion", () => {
  it("should apply valid suggestion to content", () => {
    const suggestion = createMockSuggestion({
      originalText: "our product",
      suggestedText: "our AI-powered product",
    });
    const content = "We love our product";

    const result = applySuggestion(content, suggestion);

    expect(result).toBe("We love our AI-powered product");
  });

  it("should only replace first occurrence", () => {
    const suggestion = createMockSuggestion({
      originalText: "product",
      suggestedText: "solution",
    });
    const content = "Our product is the best product";

    const result = applySuggestion(content, suggestion);

    expect(result).toBe("Our solution is the best product");
  });

  it("should throw error for invalid suggestion", () => {
    const suggestion = createMockSuggestion({
      originalText: "not found",
    });
    const content = "Different content";

    expect(() => applySuggestion(content, suggestion)).toThrow(
      /Cannot apply suggestion/
    );
  });

  it("should preserve content structure", () => {
    const suggestion = createMockSuggestion({
      originalText: "word",
      suggestedText: "term",
    });
    const content = "First word in sentence.\nSecond line.";

    const result = applySuggestion(content, suggestion);

    expect(result).toBe("First term in sentence.\nSecond line.");
    expect(result).toContain("\n"); // Newline preserved
  });
});

// ============================================================================
// applySuggestions Tests
// ============================================================================

describe("applySuggestions", () => {
  it("should apply multiple suggestions in confidence order", () => {
    const suggestions = [
      createMockSuggestion({
        id: "s1",
        originalText: "first",
        suggestedText: "1st",
        confidence: 0.5,
      }),
      createMockSuggestion({
        id: "s2",
        originalText: "second",
        suggestedText: "2nd",
        confidence: 0.9,
      }),
      createMockSuggestion({
        id: "s3",
        originalText: "third",
        suggestedText: "3rd",
        confidence: 0.7,
      }),
    ];
    const content = "first second third";

    const result = applySuggestions(content, suggestions);

    expect(result).toBe("1st 2nd 3rd");
  });

  it("should skip invalid suggestions and continue", () => {
    const suggestions = [
      createMockSuggestion({
        originalText: "exists",
        suggestedText: "replacement",
        confidence: 0.9,
      }),
      createMockSuggestion({
        originalText: "not found",
        suggestedText: "won't apply",
        confidence: 0.8,
      }),
      createMockSuggestion({
        originalText: "also exists",
        suggestedText: "another",
        confidence: 0.7,
      }),
    ];
    const content = "This exists and also exists";

    const result = applySuggestions(content, suggestions);

    expect(result).toContain("replacement");
    expect(result).toContain("another");
    expect(result).not.toContain("won't apply");
  });

  it("should handle empty suggestions array", () => {
    const content = "Unchanged content";

    const result = applySuggestions(content, []);

    expect(result).toBe(content);
  });

  it("should not modify original content or suggestions", () => {
    const suggestions = [
      createMockSuggestion({
        originalText: "test",
        suggestedText: "exam",
      }),
    ];
    const originalContent = "This is a test";
    const originalSuggestions = [...suggestions];

    applySuggestions(originalContent, suggestions);

    expect(suggestions).toEqual(originalSuggestions);
  });

  it("should handle overlapping suggestions gracefully", () => {
    const suggestions = [
      createMockSuggestion({
        id: "s1",
        originalText: "the product",
        suggestedText: "our solution",
        confidence: 0.9,
      }),
      createMockSuggestion({
        id: "s2",
        originalText: "product",
        suggestedText: "service",
        confidence: 0.8,
      }),
    ];
    const content = "Check out the product";

    const result = applySuggestions(content, suggestions);

    // Higher confidence suggestion should be applied first
    expect(result).toBe("Check out our solution");
  });
});

// ============================================================================
// Suggestion Types Tests
// ============================================================================

describe("Suggestion Types", () => {
  it("should support keyword type suggestions", () => {
    const suggestion = createMockSuggestion({ type: "keyword" });
    expect(suggestion.type).toBe("keyword");
  });

  it("should support structure type suggestions", () => {
    const suggestion = createMockSuggestion({ type: "structure" });
    expect(suggestion.type).toBe("structure");
  });

  it("should support formatting type suggestions", () => {
    const suggestion = createMockSuggestion({ type: "formatting" });
    expect(suggestion.type).toBe("formatting");
  });

  it("should include confidence score", () => {
    const suggestion = createMockSuggestion({ confidence: 0.85 });
    expect(suggestion.confidence).toBe(0.85);
    expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
    expect(suggestion.confidence).toBeLessThanOrEqual(1);
  });

  it("should include optional position information", () => {
    const suggestion = createMockSuggestion({
      position: { from: 10, to: 20 },
    });
    expect(suggestion.position).toBeDefined();
    expect(suggestion.position?.from).toBe(10);
    expect(suggestion.position?.to).toBe(20);
  });

  it("should allow suggestions without position", () => {
    const suggestion = createMockSuggestion({ position: undefined });
    expect(suggestion.position).toBeUndefined();
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("Content Analyzer Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should complete full analysis workflow", async () => {
    const content = `
      Our platform helps businesses optimize content for AI platforms.
      We provide comprehensive analytics and actionable insights.
    `;

    const workflowResponse = {
      content: JSON.stringify({
        overallScore: 75,
        citationProbability: "medium",
        summary: "Content has good structure but could benefit from optimization",
        suggestions: [
          {
            id: "suggestion-1",
            type: "keyword",
            description: "Add specific platform names",
            originalText: "AI platforms",
            suggestedText: "AI platforms like ChatGPT and Claude",
            confidence: 0.9,
          },
          {
            id: "suggestion-2",
            type: "structure",
            description: "Break into list",
            originalText: "We provide comprehensive analytics and actionable insights.",
            suggestedText: "We provide:\n- Comprehensive analytics\n- Actionable insights",
            confidence: 0.8,
          },
        ],
      }),
      usage: mockOpenAIResponse.usage,
    };

    vi.spyOn(openai, "sendMessage").mockResolvedValue(workflowResponse);

    // Analyze
    const analysis = await analyzeContent(content);

    expect(analysis.suggestions.length).toBeGreaterThan(0);

    // Validate suggestions
    const validationResults = analysis.suggestions.map((s) =>
      validateSuggestion(s, content)
    );
    const validSuggestions = analysis.suggestions.filter(
      (s, i) => validationResults[i].valid
    );

    expect(validSuggestions.length).toBeGreaterThan(0);

    // Apply suggestions
    const optimizedContent = applySuggestions(content, validSuggestions);

    expect(optimizedContent).not.toBe(content);
    expect(optimizedContent).toContain("ChatGPT");
  });

  it("should handle edge case: already optimized content", async () => {
    const optimizedResponse = {
      content: JSON.stringify({
        overallScore: 95,
        citationProbability: "high",
        summary: "Content is already well-optimized",
        suggestions: [],
      }),
      usage: mockOpenAIResponse.usage,
    };

    vi.spyOn(openai, "sendMessage").mockResolvedValue(optimizedResponse);

    const result = await analyzeContent(sampleContent);

    expect(result.overallScore).toBeGreaterThan(90);
    expect(result.citationProbability).toBe("high");
    expect(result.suggestions).toHaveLength(0);
  });

  it("should handle content with mixed suggestion types", async () => {
    const mixedResponse = {
      content: JSON.stringify({
        overallScore: 70,
        citationProbability: "medium",
        summary: "Mix of improvements needed",
        suggestions: [
          {
            id: "s1",
            type: "keyword",
            description: "Add keywords",
            originalText: "text1",
            suggestedText: "improved1",
            confidence: 0.9,
          },
          {
            id: "s2",
            type: "structure",
            description: "Restructure",
            originalText: "text2",
            suggestedText: "improved2",
            confidence: 0.8,
          },
          {
            id: "s3",
            type: "formatting",
            description: "Format better",
            originalText: "text3",
            suggestedText: "improved3",
            confidence: 0.7,
          },
        ],
      }),
      usage: mockOpenAIResponse.usage,
    };

    vi.spyOn(openai, "sendMessage").mockResolvedValue(mixedResponse);

    const result = await analyzeContent(sampleContent);

    const types = result.suggestions.map((s) => s.type);
    expect(types).toContain("keyword");
    expect(types).toContain("structure");
    expect(types).toContain("formatting");
  });
});
