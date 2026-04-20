/**
 * Integration Tests for Content Optimization API Route
 * Tests for POST /api/optimize endpoint
 *
 * These tests verify the complete flow from API request through content analysis
 * to structured suggestions response.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_ORG_ID = "test-org-123";
const TEST_USER_ID = "test-user-456";

const mockAnalysisResult = {
  suggestions: [
    {
      id: "suggestion-1",
      type: "keyword" as const,
      description: "Add specific AI platform names for better targeting",
      originalText: "AI platforms",
      suggestedText: "AI platforms like ChatGPT, Claude, and Perplexity",
      confidence: 0.9,
      position: { from: 50, to: 62 },
    },
    {
      id: "suggestion-2",
      type: "structure" as const,
      description: "Break into bulleted list for better parseability",
      originalText: "We provide comprehensive analytics and actionable insights.",
      suggestedText: "We provide:\n- Comprehensive analytics\n- Actionable insights",
      confidence: 0.75,
    },
  ],
  overallScore: 75,
  citationProbability: "medium" as const,
  summary: "Content has good structure but could benefit from keyword optimization",
  tokenUsage: {
    prompt_tokens: 120,
    completion_tokens: 250,
    total_tokens: 370,
  },
};

const validContent = `
Our product helps businesses optimize their content for AI platforms.
We provide comprehensive analytics and actionable insights.
This is a sample content that is long enough to meet the minimum length requirement.
`;

const shortContent = "Too short";

const largeContent = "a".repeat(15000); // >10,000 characters

// ============================================================================
// Mocks
// ============================================================================

// Mock getOrganizationId
const mockGetOrganizationId = vi.fn();
vi.mock("@/lib/auth/supabase-server", () => ({
  getOrganizationId: () => mockGetOrganizationId(),
}));

// Mock content analyzer
const mockAnalyzeContent = vi.fn();
const mockAnalyzeLargeContent = vi.fn();
vi.mock("@/lib/ai/content-analyzer", () => ({
  analyzeContent: (content: string, config?: unknown) => mockAnalyzeContent(content, config),
  analyzeLargeContent: (content: string, config?: unknown) =>
    mockAnalyzeLargeContent(content, config),
}));

// ============================================================================
// Tests
// ============================================================================

describe("POST /api/optimize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user
    mockGetOrganizationId.mockResolvedValue(TEST_ORG_ID);
    mockAnalyzeContent.mockResolvedValue(mockAnalysisResult);
    mockAnalyzeLargeContent.mockResolvedValue(mockAnalysisResult);
  });

  describe("Authentication", () => {
    it("should return 401 when organization is not found", async () => {
      mockGetOrganizationId.mockResolvedValue(null);

      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Organization not found");
    });

    it("should allow authenticated requests", async () => {
      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockGetOrganizationId).toHaveBeenCalled();
    });
  });

  describe("Request Validation", () => {
    it("should return 400 when content is missing", async () => {
      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request parameters");
      expect(data.details).toBeDefined();
    });

    it("should return 400 when content is empty string", async () => {
      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: "" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request parameters");
    });

    it("should accept valid content", async () => {
      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should accept optional config parameters", async () => {
      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({
          content: validContent,
          config: {
            model: "gpt-4o",
            maxTokens: 2000,
            minContentLength: 50,
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockAnalyzeContent).toHaveBeenCalledWith(
        validContent,
        expect.objectContaining({
          model: "gpt-4o",
          maxTokens: 2000,
          minContentLength: 50,
        })
      );
    });
  });

  describe("Content Analysis", () => {
    it("should use analyzeContent for normal content", async () => {
      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      await POST(request);

      expect(mockAnalyzeContent).toHaveBeenCalledWith(validContent, undefined);
      expect(mockAnalyzeLargeContent).not.toHaveBeenCalled();
    });

    it("should use analyzeLargeContent for content >10,000 characters", async () => {
      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: largeContent }),
      });

      await POST(request);

      expect(mockAnalyzeLargeContent).toHaveBeenCalledWith(largeContent, undefined);
      expect(mockAnalyzeContent).not.toHaveBeenCalled();
    });

    it("should return structured analysis result", async () => {
      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.suggestions).toEqual(mockAnalysisResult.suggestions);
      expect(data.data.overallScore).toBe(75);
      expect(data.data.citationProbability).toBe("medium");
      expect(data.data.summary).toBeDefined();
      expect(data.data.tokenUsage).toBeDefined();
    });

    it("should include metadata in response", async () => {
      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.meta).toBeDefined();
      expect(data.meta.timestamp).toBeDefined();
      expect(new Date(data.meta.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for content too short error", async () => {
      mockAnalyzeContent.mockRejectedValue(
        new Error("Content too short. Minimum 50 words required.")
      );

      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: shortContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Content too short");
    });

    it("should return 429 for rate limit errors", async () => {
      mockAnalyzeContent.mockRejectedValue(new Error("API rate limit exceeded"));

      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe("API rate limit exceeded. Please try again later.");
    });

    it("should return 429 for quota errors", async () => {
      mockAnalyzeContent.mockRejectedValue(new Error("API quota exceeded"));

      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe("API rate limit exceeded. Please try again later.");
    });

    it("should return 500 for general errors", async () => {
      mockAnalyzeContent.mockRejectedValue(new Error("Unexpected API error"));

      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unexpected API error");
    });

    it("should return generic error for unknown errors", async () => {
      mockAnalyzeContent.mockRejectedValue("Unknown error");

      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("An unexpected error occurred during content analysis");
    });
  });

  describe("Integration Flow", () => {
    it("should complete full optimization flow successfully", async () => {
      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Verify authentication checked
      expect(mockGetOrganizationId).toHaveBeenCalled();

      // Verify content analyzed
      expect(mockAnalyzeContent).toHaveBeenCalledWith(validContent, undefined);

      // Verify response structure
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.suggestions).toHaveLength(2);
      expect(data.data.overallScore).toBe(75);
      expect(data.data.citationProbability).toBe("medium");
      expect(data.data.tokenUsage.total_tokens).toBe(370);
      expect(data.meta.timestamp).toBeDefined();
    });

    it("should pass config through to analyzer", async () => {
      const config = {
        model: "gpt-4o-mini",
        maxTokens: 1500,
        minContentLength: 100,
      };

      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent, config }),
      });

      await POST(request);

      expect(mockAnalyzeContent).toHaveBeenCalledWith(validContent, config);
    });
  });

  describe("Response Format", () => {
    it("should return consistent success response structure", async () => {
      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("meta");
      expect(data.data).toHaveProperty("suggestions");
      expect(data.data).toHaveProperty("overallScore");
      expect(data.data).toHaveProperty("citationProbability");
      expect(data.data).toHaveProperty("summary");
      expect(data.data).toHaveProperty("tokenUsage");
    });

    it("should return consistent error response structure", async () => {
      mockGetOrganizationId.mockResolvedValue(null);

      const { POST } = await import("@/app/api/optimize/route");
      const request = new NextRequest("http://localhost:3000/api/optimize", {
        method: "POST",
        body: JSON.stringify({ content: validContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(typeof data.error).toBe("string");
    });
  });
});
