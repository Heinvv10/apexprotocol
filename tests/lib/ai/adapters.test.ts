/**
 * Platform Adapter Unit Tests
 * Tests for all AI platform adapters (ChatGPT, Claude, Gemini, Perplexity)
 * with mock API responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PlatformResponse, Citation } from "@/lib/ai/adapters/base";

// ============================================================================
// Mocks
// ============================================================================

// Mock OpenAI SDK (used by ChatGPT and Perplexity adapters)
const mockOpenAICreate = vi.fn();
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate,
      },
    },
  })),
}));

// Mock Anthropic SDK (used by Claude adapter)
const mockAnthropicCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: mockAnthropicCreate,
    },
  })),
}));

// Mock Google Gemini SDK (used by Gemini adapter)
const mockGeminiGenerateContent = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGeminiGenerateContent,
    },
  })),
}));

// Import adapters after mocking
import { ChatGPTAdapter } from "@/lib/ai/adapters/chatgpt";
import { ClaudeAdapter } from "@/lib/ai/adapters/claude";
import { GeminiAdapter } from "@/lib/ai/adapters/gemini";
import { PerplexityAdapter } from "@/lib/ai/adapters/perplexity";

// ============================================================================
// Test Fixtures
// ============================================================================

const MOCK_BRAND_CONTEXT = `Acme Corporation is a leading software company specializing in project management tools.
Founded in 2015, Acme has helped over 10,000 teams improve productivity.
Website: https://acme.com`;

const MOCK_QUERY = "What are the best project management tools?";

const MOCK_RESPONSE_WITH_CITATIONS = `Based on recent market analysis, Acme Corporation offers excellent project management solutions.
Their platform includes features like task tracking, team collaboration, and reporting.
[Source: https://acme.com/features]

According to a recent study, "Acme Corporation has revolutionized team productivity" with their innovative approach.
The company is trusted by Fortune 500 companies for managing complex projects.

Key benefits include:
- Real-time collaboration
- Advanced analytics from https://acme.com/analytics
- Seamless integrations

Many teams have found Acme Corporation to be a game-changer for their workflows.`;

const MOCK_RESPONSE_WITHOUT_CITATIONS = `Project management tools help teams stay organized and productive.
There are many options available in the market today.`;

const createMockOpenAIResponse = (content: string) => ({
  id: "chatcmpl-test123",
  object: "chat.completion",
  created: 1234567890,
  model: "gpt-4",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content,
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 50,
    completion_tokens: 100,
    total_tokens: 150,
  },
});

const createMockAnthropicResponse = (content: string) => ({
  id: "msg_test123",
  type: "message",
  role: "assistant",
  model: "claude-3-5-sonnet-20241022",
  content: [
    {
      type: "text",
      text: content,
    },
  ],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: {
    input_tokens: 50,
    output_tokens: 100,
  },
});

const createMockGeminiResponse = (content: string) => ({
  text: content,
  modelVersion: "gemini-2.0-flash-001",
  responseId: "resp_test123",
  usageMetadata: {
    promptTokenCount: 50,
    candidatesTokenCount: 100,
    totalTokenCount: 150,
  },
  candidates: [
    {
      finishReason: "STOP",
    },
  ],
});

const createMockPerplexityResponse = (content: string, searchResults?: any[]) => ({
  id: "pplx-test123",
  object: "chat.completion",
  created: 1234567890,
  model: "llama-3.1-sonar-small-128k-online",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content,
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 50,
    completion_tokens: 100,
    total_tokens: 150,
  },
  search_results: searchResults || [],
});

// ============================================================================
// Environment Setup
// ============================================================================

const originalEnv = process.env;

beforeEach(() => {
  vi.clearAllMocks();

  // Set required API keys
  process.env = {
    ...originalEnv,
    OPENAI_API_KEY: "sk-test-openai",
    ANTHROPIC_API_KEY: "sk-ant-test-anthropic",
    GEMINI_API_KEY: "test-gemini-key",
    PERPLEXITY_API_KEY: "pplx-test-key",
  };
});

afterEach(() => {
  process.env = originalEnv;
});

// ============================================================================
// ChatGPT Adapter Tests
// ============================================================================

describe("ChatGPTAdapter", () => {
  describe("constructor", () => {
    it("should throw error when OPENAI_API_KEY is not set", () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new ChatGPTAdapter()).toThrow(
        "OPENAI_API_KEY environment variable is not set"
      );
    });

    it("should create instance successfully with valid API key", () => {
      const adapter = new ChatGPTAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe("chatgpt");
    });
  });

  describe("analyze", () => {
    it("should return normalized PlatformResponse with citations", async () => {
      mockOpenAICreate.mockResolvedValue(
        createMockOpenAIResponse(MOCK_RESPONSE_WITH_CITATIONS)
      );

      const adapter = new ChatGPTAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result).toBeDefined();
      expect(result.platform).toBe("chatgpt");
      expect(result.content).toBe(MOCK_RESPONSE_WITH_CITATIONS);
      expect(result.citations).toBeDefined();
      expect(Array.isArray(result.citations)).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.model).toBe("gpt-4");
    });

    it("should extract citations from response content", async () => {
      mockOpenAICreate.mockResolvedValue(
        createMockOpenAIResponse(MOCK_RESPONSE_WITH_CITATIONS)
      );

      const adapter = new ChatGPTAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result.citations.length).toBeGreaterThan(0);

      // Should extract URL citations
      const urlCitations = result.citations.filter((c) => c.type === "link");
      expect(urlCitations.length).toBeGreaterThan(0);

      // Should extract direct quotes
      const quoteCitations = result.citations.filter(
        (c) => c.type === "direct_quote"
      );
      expect(quoteCitations.length).toBeGreaterThan(0);

      // Should extract brand mentions (paraphrases)
      const paraphraseCitations = result.citations.filter(
        (c) => c.type === "paraphrase"
      );
      expect(paraphraseCitations.length).toBeGreaterThan(0);
    });

    it("should handle response without citations", async () => {
      mockOpenAICreate.mockResolvedValue(
        createMockOpenAIResponse(MOCK_RESPONSE_WITHOUT_CITATIONS)
      );

      const adapter = new ChatGPTAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result).toBeDefined();
      expect(result.content).toBe(MOCK_RESPONSE_WITHOUT_CITATIONS);
      expect(result.citations).toBeDefined();
      expect(Array.isArray(result.citations)).toBe(true);
    });

    it("should include metadata with usage information", async () => {
      mockOpenAICreate.mockResolvedValue(
        createMockOpenAIResponse(MOCK_RESPONSE_WITH_CITATIONS)
      );

      const adapter = new ChatGPTAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.model).toBe("gpt-4");
      expect(result.metadata.usage).toBeDefined();
      expect(result.metadata.usage.prompt_tokens).toBe(50);
      expect(result.metadata.usage.completion_tokens).toBe(100);
      expect(result.metadata.usage.total_tokens).toBe(150);
    });

    it("should throw error when API call fails", async () => {
      mockOpenAICreate.mockRejectedValue(new Error("API rate limit exceeded"));

      const adapter = new ChatGPTAdapter();

      await expect(
        adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT)
      ).rejects.toThrow("ChatGPT API error: API rate limit exceeded");
    });

    it("should throw error when response has no content", async () => {
      mockOpenAICreate.mockResolvedValue({
        ...createMockOpenAIResponse(""),
        choices: [{ message: { content: null } }],
      });

      const adapter = new ChatGPTAdapter();

      await expect(
        adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT)
      ).rejects.toThrow("No content in ChatGPT response");
    });

    it("should calculate relevance scores for citations", async () => {
      mockOpenAICreate.mockResolvedValue(
        createMockOpenAIResponse(MOCK_RESPONSE_WITH_CITATIONS)
      );

      const adapter = new ChatGPTAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      result.citations.forEach((citation) => {
        expect(citation.relevanceScore).toBeDefined();
        expect(citation.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(citation.relevanceScore).toBeLessThanOrEqual(100);
      });
    });
  });
});

// ============================================================================
// Claude Adapter Tests
// ============================================================================

describe("ClaudeAdapter", () => {
  describe("constructor", () => {
    it("should throw error when ANTHROPIC_API_KEY is not set", () => {
      delete process.env.ANTHROPIC_API_KEY;
      expect(() => new ClaudeAdapter()).toThrow(
        "ANTHROPIC_API_KEY environment variable is not set"
      );
    });

    it("should create instance successfully with valid API key", () => {
      const adapter = new ClaudeAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe("claude");
    });
  });

  describe("analyze", () => {
    it("should return normalized PlatformResponse with citations", async () => {
      mockAnthropicCreate.mockResolvedValue(
        createMockAnthropicResponse(MOCK_RESPONSE_WITH_CITATIONS)
      );

      const adapter = new ClaudeAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result).toBeDefined();
      expect(result.platform).toBe("claude");
      expect(result.content).toBe(MOCK_RESPONSE_WITH_CITATIONS);
      expect(result.citations).toBeDefined();
      expect(Array.isArray(result.citations)).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it("should extract citations from response content", async () => {
      mockAnthropicCreate.mockResolvedValue(
        createMockAnthropicResponse(MOCK_RESPONSE_WITH_CITATIONS)
      );

      const adapter = new ClaudeAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result.citations.length).toBeGreaterThan(0);

      // Should extract multiple types of citations
      const citationTypes = new Set(result.citations.map((c) => c.type));
      expect(citationTypes.size).toBeGreaterThan(1);
    });

    it("should include metadata with Anthropic-specific fields", async () => {
      mockAnthropicCreate.mockResolvedValue(
        createMockAnthropicResponse(MOCK_RESPONSE_WITH_CITATIONS)
      );

      const adapter = new ClaudeAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.model).toBe("claude-3-5-sonnet-20241022");
      expect(result.metadata.usage).toBeDefined();
      expect(result.metadata.usage.input_tokens).toBe(50);
      expect(result.metadata.usage.output_tokens).toBe(100);
      expect(result.metadata.stop_reason).toBe("end_turn");
    });

    it("should throw error when API call fails", async () => {
      mockAnthropicCreate.mockRejectedValue(
        new Error("Invalid authentication token")
      );

      const adapter = new ClaudeAdapter();

      await expect(
        adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT)
      ).rejects.toThrow("Claude API error: Invalid authentication token");
    });

    it("should throw error when response has no text content", async () => {
      mockAnthropicCreate.mockResolvedValue({
        ...createMockAnthropicResponse(""),
        content: [{ type: "image" }],
      });

      const adapter = new ClaudeAdapter();

      await expect(
        adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT)
      ).rejects.toThrow("No text content in Claude response");
    });

    it("should throw error when text content is empty", async () => {
      mockAnthropicCreate.mockResolvedValue({
        ...createMockAnthropicResponse(""),
        content: [{ type: "text", text: "" }],
      });

      const adapter = new ClaudeAdapter();

      await expect(
        adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT)
      ).rejects.toThrow("Empty content in Claude response");
    });
  });
});

// ============================================================================
// Gemini Adapter Tests
// ============================================================================

describe("GeminiAdapter", () => {
  describe("constructor", () => {
    it("should throw error when GEMINI_API_KEY is not set", () => {
      delete process.env.GEMINI_API_KEY;
      expect(() => new GeminiAdapter()).toThrow(
        "GEMINI_API_KEY environment variable is not set"
      );
    });

    it("should create instance successfully with valid API key", () => {
      const adapter = new GeminiAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe("gemini");
    });
  });

  describe("analyze", () => {
    it("should return normalized PlatformResponse with citations", async () => {
      mockGeminiGenerateContent.mockResolvedValue(
        createMockGeminiResponse(MOCK_RESPONSE_WITH_CITATIONS)
      );

      const adapter = new GeminiAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result).toBeDefined();
      expect(result.platform).toBe("gemini");
      expect(result.content).toBe(MOCK_RESPONSE_WITH_CITATIONS);
      expect(result.citations).toBeDefined();
      expect(Array.isArray(result.citations)).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it("should extract citations from response content", async () => {
      mockGeminiGenerateContent.mockResolvedValue(
        createMockGeminiResponse(MOCK_RESPONSE_WITH_CITATIONS)
      );

      const adapter = new GeminiAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result.citations.length).toBeGreaterThan(0);

      // Should have citations with positions
      result.citations.forEach((citation) => {
        expect(citation.position).toBeDefined();
        expect(citation.position).toBeGreaterThanOrEqual(0);
      });
    });

    it("should include metadata with Gemini-specific fields", async () => {
      mockGeminiGenerateContent.mockResolvedValue(
        createMockGeminiResponse(MOCK_RESPONSE_WITH_CITATIONS)
      );

      const adapter = new GeminiAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.model).toBe("gemini-2.0-flash-001");
      expect(result.metadata.usage).toBeDefined();
      expect(result.metadata.usage.prompt_tokens).toBe(50);
      expect(result.metadata.usage.completion_tokens).toBe(100);
      expect(result.metadata.usage.total_tokens).toBe(150);
    });

    it("should throw error when API call fails", async () => {
      mockGeminiGenerateContent.mockRejectedValue(
        new Error("API key not valid")
      );

      const adapter = new GeminiAdapter();

      await expect(
        adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT)
      ).rejects.toThrow("Gemini API error: API key not valid");
    });

    it("should throw error when response has no content", async () => {
      mockGeminiGenerateContent.mockResolvedValue({
        ...createMockGeminiResponse(""),
        text: null,
      });

      const adapter = new GeminiAdapter();

      await expect(
        adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT)
      ).rejects.toThrow("No content in Gemini response");
    });
  });
});

// ============================================================================
// Perplexity Adapter Tests
// ============================================================================

describe("PerplexityAdapter", () => {
  describe("constructor", () => {
    it("should throw error when PERPLEXITY_API_KEY is not set", () => {
      delete process.env.PERPLEXITY_API_KEY;
      expect(() => new PerplexityAdapter()).toThrow(
        "PERPLEXITY_API_KEY environment variable is not set"
      );
    });

    it("should create instance successfully with valid API key", () => {
      const adapter = new PerplexityAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe("perplexity");
    });
  });

  describe("analyze", () => {
    it("should return normalized PlatformResponse with citations", async () => {
      mockOpenAICreate.mockResolvedValue(
        createMockPerplexityResponse(MOCK_RESPONSE_WITH_CITATIONS)
      );

      const adapter = new PerplexityAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result).toBeDefined();
      expect(result.platform).toBe("perplexity");
      expect(result.content).toBe(MOCK_RESPONSE_WITH_CITATIONS);
      expect(result.citations).toBeDefined();
      expect(Array.isArray(result.citations)).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it("should extract citations from search_results", async () => {
      const searchResults = [
        {
          url: "https://acme.com/features",
          title: "Acme Features",
          snippet: "Acme Corporation provides comprehensive project management",
        },
        {
          url: "https://acme.com/pricing",
          title: "Acme Pricing",
          snippet: "Affordable pricing for teams of all sizes",
        },
      ];

      mockOpenAICreate.mockResolvedValue(
        createMockPerplexityResponse(MOCK_RESPONSE_WITH_CITATIONS, searchResults)
      );

      const adapter = new PerplexityAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      // Should extract citations from search_results
      const searchResultCitations = result.citations.filter(
        (c) => c.sourceTitle === "Acme Features" || c.sourceTitle === "Acme Pricing"
      );
      expect(searchResultCitations.length).toBeGreaterThan(0);
    });

    it("should include search_results_count in metadata", async () => {
      const searchResults = [
        { url: "https://example.com/1", title: "Example 1" },
        { url: "https://example.com/2", title: "Example 2" },
      ];

      mockOpenAICreate.mockResolvedValue(
        createMockPerplexityResponse(MOCK_RESPONSE_WITH_CITATIONS, searchResults)
      );

      const adapter = new PerplexityAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.search_results_count).toBe(2);
    });

    it("should handle response without search_results", async () => {
      mockOpenAICreate.mockResolvedValue(
        createMockPerplexityResponse(MOCK_RESPONSE_WITH_CITATIONS)
      );

      const adapter = new PerplexityAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      expect(result).toBeDefined();
      expect(result.citations).toBeDefined();
      expect(result.metadata.search_results_count).toBe(0);
    });

    it("should throw error when API call fails", async () => {
      mockOpenAICreate.mockRejectedValue(new Error("Network timeout"));

      const adapter = new PerplexityAdapter();

      await expect(
        adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT)
      ).rejects.toThrow("Perplexity API error: Network timeout");
    });

    it("should throw error when response has no content", async () => {
      mockOpenAICreate.mockResolvedValue({
        ...createMockPerplexityResponse(""),
        choices: [{ message: { content: "" } }],
      });

      const adapter = new PerplexityAdapter();

      await expect(
        adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT)
      ).rejects.toThrow("No content in Perplexity response");
    });
  });
});

// ============================================================================
// Citation Extraction Tests (Common Behavior)
// ============================================================================

describe("Citation Extraction (Common Behavior)", () => {
  describe("ChatGPTAdapter citation extraction", () => {
    it("should extract explicit citations with [Source: ...] format", async () => {
      const content = "Check out this info. [Source: https://acme.com/docs]";
      mockOpenAICreate.mockResolvedValue(createMockOpenAIResponse(content));

      const adapter = new ChatGPTAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      const explicitCitations = result.citations.filter(
        (c) => c.sourceUrl === "https://acme.com/docs"
      );
      expect(explicitCitations.length).toBeGreaterThan(0);
    });

    it("should extract standalone URLs", async () => {
      const content = "Visit https://acme.com for more information.";
      mockOpenAICreate.mockResolvedValue(createMockOpenAIResponse(content));

      const adapter = new ChatGPTAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      const urlCitations = result.citations.filter((c) => c.type === "link");
      expect(urlCitations.length).toBeGreaterThan(0);
    });

    it("should extract direct quotes", async () => {
      const content = 'According to experts, "Acme Corporation revolutionized project management tools" in recent years.';
      mockOpenAICreate.mockResolvedValue(createMockOpenAIResponse(content));

      const adapter = new ChatGPTAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      const quoteCitations = result.citations.filter(
        (c) => c.type === "direct_quote"
      );
      expect(quoteCitations.length).toBeGreaterThan(0);
    });

    it("should extract brand mentions as paraphrases", async () => {
      const content = "Acme Corporation has been leading the market with innovative solutions for team collaboration.";
      mockOpenAICreate.mockResolvedValue(createMockOpenAIResponse(content));

      const adapter = new ChatGPTAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      const paraphraseCitations = result.citations.filter(
        (c) => c.type === "paraphrase"
      );
      expect(paraphraseCitations.length).toBeGreaterThan(0);
    });

    it("should deduplicate citations", async () => {
      const content = `Visit https://acme.com for info.
      Also check https://acme.com for details.
      [Source: https://acme.com]`;
      mockOpenAICreate.mockResolvedValue(createMockOpenAIResponse(content));

      const adapter = new ChatGPTAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      // Should deduplicate the same URL
      const uniqueUrls = new Set(
        result.citations.map((c) => c.sourceUrl).filter(Boolean)
      );
      const urlCitations = result.citations.filter((c) => c.sourceUrl);
      expect(uniqueUrls.size).toBe(urlCitations.length);
    });

    it("should sort citations by position", async () => {
      mockOpenAICreate.mockResolvedValue(createMockOpenAIResponse(MOCK_RESPONSE_WITH_CITATIONS));

      const adapter = new ChatGPTAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      // Verify citations are sorted by position
      const positions = result.citations.map((c) => c.position || 0);
      const sortedPositions = [...positions].sort((a, b) => a - b);
      expect(positions).toEqual(sortedPositions);
    });
  });

  describe("ClaudeAdapter citation extraction", () => {
    it("should extract explicit citations with [Source: ...] format", async () => {
      const content = "Check out this info. [Source: https://acme.com/docs]";
      mockAnthropicCreate.mockResolvedValue(createMockAnthropicResponse(content));

      const adapter = new ClaudeAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      const explicitCitations = result.citations.filter(
        (c) => c.sourceUrl === "https://acme.com/docs"
      );
      expect(explicitCitations.length).toBeGreaterThan(0);
    });

    it("should extract standalone URLs", async () => {
      const content = "Visit https://acme.com for more information.";
      mockAnthropicCreate.mockResolvedValue(createMockAnthropicResponse(content));

      const adapter = new ClaudeAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      const urlCitations = result.citations.filter((c) => c.type === "link");
      expect(urlCitations.length).toBeGreaterThan(0);
    });

    it("should extract direct quotes", async () => {
      const content = 'According to experts, "Acme Corporation revolutionized project management tools" in recent years.';
      mockAnthropicCreate.mockResolvedValue(createMockAnthropicResponse(content));

      const adapter = new ClaudeAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      const quoteCitations = result.citations.filter(
        (c) => c.type === "direct_quote"
      );
      expect(quoteCitations.length).toBeGreaterThan(0);
    });

    it("should extract brand mentions as paraphrases", async () => {
      const content = "Acme Corporation has been leading the market with innovative solutions for team collaboration.";
      mockAnthropicCreate.mockResolvedValue(createMockAnthropicResponse(content));

      const adapter = new ClaudeAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      const paraphraseCitations = result.citations.filter(
        (c) => c.type === "paraphrase"
      );
      expect(paraphraseCitations.length).toBeGreaterThan(0);
    });

    it("should deduplicate citations", async () => {
      const content = `Visit https://acme.com for info.
      Also check https://acme.com for details.
      [Source: https://acme.com]`;
      mockAnthropicCreate.mockResolvedValue(createMockAnthropicResponse(content));

      const adapter = new ClaudeAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      // Should deduplicate the same URL
      const uniqueUrls = new Set(
        result.citations.map((c) => c.sourceUrl).filter(Boolean)
      );
      const urlCitations = result.citations.filter((c) => c.sourceUrl);
      expect(uniqueUrls.size).toBe(urlCitations.length);
    });

    it("should sort citations by position", async () => {
      mockAnthropicCreate.mockResolvedValue(createMockAnthropicResponse(MOCK_RESPONSE_WITH_CITATIONS));

      const adapter = new ClaudeAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      // Verify citations are sorted by position
      const positions = result.citations.map((c) => c.position || 0);
      const sortedPositions = [...positions].sort((a, b) => a - b);
      expect(positions).toEqual(sortedPositions);
    });
  });

  describe("GeminiAdapter citation extraction", () => {
    it("should extract explicit citations with [Source: ...] format", async () => {
      const content = "Check out this info. [Source: https://acme.com/docs]";
      mockGeminiGenerateContent.mockResolvedValue(createMockGeminiResponse(content));

      const adapter = new GeminiAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      const explicitCitations = result.citations.filter(
        (c) => c.sourceUrl === "https://acme.com/docs"
      );
      expect(explicitCitations.length).toBeGreaterThan(0);
    });

    it("should extract standalone URLs", async () => {
      const content = "Visit https://acme.com for more information.";
      mockGeminiGenerateContent.mockResolvedValue(createMockGeminiResponse(content));

      const adapter = new GeminiAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      const urlCitations = result.citations.filter((c) => c.type === "link");
      expect(urlCitations.length).toBeGreaterThan(0);
    });

    it("should extract direct quotes", async () => {
      const content = 'According to experts, "Acme Corporation revolutionized project management tools" in recent years.';
      mockGeminiGenerateContent.mockResolvedValue(createMockGeminiResponse(content));

      const adapter = new GeminiAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      const quoteCitations = result.citations.filter(
        (c) => c.type === "direct_quote"
      );
      expect(quoteCitations.length).toBeGreaterThan(0);
    });

    it("should extract brand mentions as paraphrases", async () => {
      const content = "Acme Corporation has been leading the market with innovative solutions for team collaboration.";
      mockGeminiGenerateContent.mockResolvedValue(createMockGeminiResponse(content));

      const adapter = new GeminiAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      const paraphraseCitations = result.citations.filter(
        (c) => c.type === "paraphrase"
      );
      expect(paraphraseCitations.length).toBeGreaterThan(0);
    });

    it("should deduplicate citations", async () => {
      const content = `Visit https://acme.com for info.
      Also check https://acme.com for details.
      [Source: https://acme.com]`;
      mockGeminiGenerateContent.mockResolvedValue(createMockGeminiResponse(content));

      const adapter = new GeminiAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      // Should deduplicate the same URL
      const uniqueUrls = new Set(
        result.citations.map((c) => c.sourceUrl).filter(Boolean)
      );
      const urlCitations = result.citations.filter((c) => c.sourceUrl);
      expect(uniqueUrls.size).toBe(urlCitations.length);
    });

    it("should sort citations by position", async () => {
      mockGeminiGenerateContent.mockResolvedValue(createMockGeminiResponse(MOCK_RESPONSE_WITH_CITATIONS));

      const adapter = new GeminiAdapter();
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      // Verify citations are sorted by position
      const positions = result.citations.map((c) => c.position || 0);
      const sortedPositions = [...positions].sort((a, b) => a - b);
      expect(positions).toEqual(sortedPositions);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("Adapter Integration Tests", () => {
  it("all adapters should implement consistent interface", async () => {
    mockOpenAICreate.mockResolvedValue(
      createMockOpenAIResponse(MOCK_RESPONSE_WITH_CITATIONS)
    );
    mockAnthropicCreate.mockResolvedValue(
      createMockAnthropicResponse(MOCK_RESPONSE_WITH_CITATIONS)
    );
    mockGeminiGenerateContent.mockResolvedValue(
      createMockGeminiResponse(MOCK_RESPONSE_WITH_CITATIONS)
    );

    const adapters = [
      new ChatGPTAdapter(),
      new ClaudeAdapter(),
      new GeminiAdapter(),
      new PerplexityAdapter(),
    ];

    for (const adapter of adapters) {
      const result = await adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT);

      // All should return same structure
      expect(result).toBeDefined();
      expect(result.platform).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.citations).toBeDefined();
      expect(Array.isArray(result.citations)).toBe(true);
      expect(result.metadata).toBeDefined();
    }
  });

  it("all adapters should have unique platform identifiers", () => {
    const adapters = [
      new ChatGPTAdapter(),
      new ClaudeAdapter(),
      new GeminiAdapter(),
      new PerplexityAdapter(),
    ];

    const platforms = adapters.map((a) => a.platform);
    const uniquePlatforms = new Set(platforms);

    expect(uniquePlatforms.size).toBe(adapters.length);
    expect(platforms).toEqual(["chatgpt", "claude", "gemini", "perplexity"]);
  });

  it("all adapters should handle errors consistently", async () => {
    const errorMessage = "API Error";
    mockOpenAICreate.mockRejectedValue(new Error(errorMessage));
    mockAnthropicCreate.mockRejectedValue(new Error(errorMessage));
    mockGeminiGenerateContent.mockRejectedValue(new Error(errorMessage));

    const adapters = [
      { adapter: new ChatGPTAdapter(), name: "ChatGPT" },
      { adapter: new ClaudeAdapter(), name: "Claude" },
      { adapter: new GeminiAdapter(), name: "Gemini" },
      { adapter: new PerplexityAdapter(), name: "Perplexity" },
    ];

    for (const { adapter, name } of adapters) {
      await expect(
        adapter.analyze(MOCK_QUERY, MOCK_BRAND_CONTEXT)
      ).rejects.toThrow(`${name} API error: ${errorMessage}`);
    }
  });
});
