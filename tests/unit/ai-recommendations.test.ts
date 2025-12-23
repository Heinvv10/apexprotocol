/**
 * AI Recommendation Generator Unit Tests
 * Tests for recommendation generation, impact scoring, and deduplication logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the Claude client before importing the module
const mockClaudeCreate = vi.fn();

vi.mock("@/lib/ai/claude", () => ({
  getClaudeClient: vi.fn(() => ({
    messages: {
      create: mockClaudeCreate,
    },
  })),
  CLAUDE_MODELS: {
    SONNET_3_5: "claude-3-5-sonnet-20241022",
    HAIKU_3_5: "claude-3-5-haiku-20241022",
    OPUS_3: "claude-3-opus-20240229",
  },
  DEFAULT_MODELS: {
    default: "claude-3-5-sonnet-20241022",
  },
}));

// Import after mocking
import {
  generateAIRecommendations,
  calculatePlatformReachScore,
  calculateVisibilityGapScore,
  calculateTrafficGainScore,
  calculateCompetitiveAdvantageScore,
  extractImpactFactors,
  calculateWeightedImpactScore,
  determinePriorityFromScore,
  calculateRecommendationImpactScore,
  deduplicateRecommendations,
  IMPACT_SCORING_WEIGHTS,
  type VisibilityData,
  type PlatformVisibility,
  type ContentGap,
  type CompetitorMetrics,
  type AIRecommendationOutput,
  type GeneratedRecommendation,
} from "@/lib/ai/recommendations";

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a valid AI response with recommendations
 */
function createMockAIResponse(recommendations: Partial<AIRecommendationOutput>[] = []): {
  content: Array<{ type: "text"; text: string }>;
  usage: { input_tokens: number; output_tokens: number };
} {
  const defaultRec: AIRecommendationOutput = {
    category: "content_optimization",
    priority: "high",
    impact: "high",
    effort: "moderate",
    title: "Improve Content Quality",
    description: "Enhance content for better AI visibility",
    steps: ["Step 1: Analyze content", "Step 2: Optimize for AI"],
    aiPlatforms: ["ChatGPT", "Claude"],
    expectedOutcome: "Increased visibility by 20%",
    estimatedTimeframe: "2-4 weeks",
  };

  const recs = recommendations.length > 0
    ? recommendations.map((rec) => ({ ...defaultRec, ...rec }))
    : [defaultRec];

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ recommendations: recs }),
      },
    ],
    usage: { input_tokens: 500, output_tokens: 300 },
  };
}

/**
 * Create sample visibility data for testing
 */
function createSampleVisibilityData(
  overrides: Partial<VisibilityData> = {}
): VisibilityData {
  return {
    brandId: "test-brand-123",
    brandName: "Test Brand",
    platforms: [
      {
        name: "ChatGPT",
        mentionRate: 25,
        averagePosition: 3,
        sentiment: "positive",
        citationFrequency: 10,
      },
      {
        name: "Claude",
        mentionRate: 40,
        averagePosition: 2,
        sentiment: "neutral",
        citationFrequency: 15,
      },
      {
        name: "Perplexity",
        mentionRate: 15,
        averagePosition: 5,
        sentiment: "neutral",
        citationFrequency: 5,
      },
    ],
    contentGaps: [
      {
        type: "missing_schema",
        description: "Schema markup not implemented",
        severity: "high",
        affectedPlatforms: ["ChatGPT", "Claude"],
      },
      {
        type: "outdated_content",
        description: "Product pages need updating",
        severity: "medium",
        affectedPlatforms: ["Perplexity"],
      },
    ],
    competitorData: [
      {
        name: "Competitor A",
        mentionRate: 60,
        platforms: ["ChatGPT", "Claude", "Perplexity"],
        advantageAreas: ["FAQ content", "Technical docs"],
      },
      {
        name: "Competitor B",
        mentionRate: 45,
        platforms: ["ChatGPT", "Claude"],
        advantageAreas: ["Blog posts"],
      },
    ],
    ...overrides,
  };
}

/**
 * Create a sample recommendation for testing
 */
function createSampleRecommendation(
  overrides: Partial<AIRecommendationOutput> = {}
): AIRecommendationOutput {
  return {
    category: "content_optimization",
    priority: "high",
    impact: "high",
    effort: "moderate",
    title: "Test Recommendation",
    description: "This is a test recommendation",
    steps: ["Step 1", "Step 2", "Step 3"],
    aiPlatforms: ["ChatGPT", "Claude"],
    expectedOutcome: "Improved visibility",
    estimatedTimeframe: "2 weeks",
    ...overrides,
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe("AI Recommendation Generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console output during tests
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateAIRecommendations", () => {
    it("should return valid recommendation array on successful generation", async () => {
      mockClaudeCreate.mockResolvedValueOnce(createMockAIResponse([
        { title: "Recommendation 1", priority: "critical" },
        { title: "Recommendation 2", priority: "high" },
        { title: "Recommendation 3", priority: "medium" },
      ]));

      const visibilityData = createSampleVisibilityData();
      const result = await generateAIRecommendations(visibilityData);

      expect(result.success).toBe(true);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.tokenUsage).toBeDefined();
      expect(result.tokenUsage?.input).toBe(500);
      expect(result.tokenUsage?.output).toBe(300);
    });

    it("should return recommendations with impact scores", async () => {
      mockClaudeCreate.mockResolvedValueOnce(createMockAIResponse([
        { title: "High Impact Rec", priority: "critical", impact: "high" },
      ]));

      const visibilityData = createSampleVisibilityData();
      const result = await generateAIRecommendations(visibilityData);

      expect(result.success).toBe(true);
      expect(result.recommendations[0]).toHaveProperty("impactScore");
      expect(typeof result.recommendations[0].impactScore).toBe("number");
      expect(result.recommendations[0].impactScore).toBeGreaterThanOrEqual(0);
      expect(result.recommendations[0].impactScore).toBeLessThanOrEqual(100);
    });

    it("should return empty array for missing brand ID", async () => {
      const visibilityData = createSampleVisibilityData({ brandId: "" });
      const result = await generateAIRecommendations(visibilityData);

      expect(result.success).toBe(false);
      expect(result.recommendations).toEqual([]);
      expect(result.error).toBe("Brand ID is required");
      expect(mockClaudeCreate).not.toHaveBeenCalled();
    });

    it("should return empty array for insufficient visibility data", async () => {
      const visibilityData = createSampleVisibilityData({
        platforms: [],
        contentGaps: [],
      });
      const result = await generateAIRecommendations(visibilityData);

      expect(result.success).toBe(true);
      expect(result.recommendations).toEqual([]);
      expect(result.error).toBe("Insufficient visibility data for analysis");
      expect(mockClaudeCreate).not.toHaveBeenCalled();
    });

    it("should filter out recommendations below minimum impact threshold", async () => {
      // Create recommendations with varying impacts
      mockClaudeCreate.mockResolvedValueOnce(createMockAIResponse([
        { title: "High Impact", priority: "critical", impact: "high", aiPlatforms: ["ChatGPT", "Claude", "Perplexity", "Gemini"] },
        { title: "Low Impact", priority: "low", impact: "low", aiPlatforms: ["ChatGPT"] },
      ]));

      const visibilityData = createSampleVisibilityData();
      const result = await generateAIRecommendations(visibilityData, {
        minImpactThreshold: 50,
      });

      expect(result.success).toBe(true);
      // All recommendations should meet the threshold
      result.recommendations.forEach((rec) => {
        expect(rec.impactScore).toBeGreaterThanOrEqual(50);
      });
    });

    it("should limit recommendations to maxRecommendations", async () => {
      mockClaudeCreate.mockResolvedValueOnce(createMockAIResponse([
        { title: "Rec 1" },
        { title: "Rec 2" },
        { title: "Rec 3" },
        { title: "Rec 4" },
        { title: "Rec 5" },
      ]));

      const visibilityData = createSampleVisibilityData();
      const result = await generateAIRecommendations(visibilityData, {
        maxRecommendations: 3,
        minImpactThreshold: 0, // Disable threshold for this test
      });

      expect(result.success).toBe(true);
      expect(result.recommendations.length).toBeLessThanOrEqual(3);
    });

    it("should sort recommendations by impact score descending", async () => {
      mockClaudeCreate.mockResolvedValueOnce(createMockAIResponse([
        { title: "Low Priority", priority: "low", impact: "low" },
        { title: "Critical Priority", priority: "critical", impact: "high", aiPlatforms: ["ChatGPT", "Claude", "Perplexity", "Gemini"] },
        { title: "Medium Priority", priority: "medium", impact: "medium" },
      ]));

      const visibilityData = createSampleVisibilityData();
      const result = await generateAIRecommendations(visibilityData, {
        minImpactThreshold: 0,
      });

      expect(result.success).toBe(true);
      // Verify descending order by impact score
      for (let i = 1; i < result.recommendations.length; i++) {
        expect(result.recommendations[i - 1].impactScore).toBeGreaterThanOrEqual(
          result.recommendations[i].impactScore
        );
      }
    });

    it("should handle AI API failure with graceful error", async () => {
      mockClaudeCreate.mockRejectedValue(new Error("API rate limit exceeded"));

      const visibilityData = createSampleVisibilityData();
      const result = await generateAIRecommendations(visibilityData);

      expect(result.success).toBe(false);
      expect(result.recommendations).toEqual([]);
      expect(result.error).toBe("API rate limit exceeded");
    });

    it("should retry on API failure up to MAX_RETRIES", async () => {
      mockClaudeCreate
        .mockRejectedValueOnce(new Error("Temporary error"))
        .mockRejectedValueOnce(new Error("Temporary error"))
        .mockResolvedValueOnce(createMockAIResponse([{ title: "Success after retry" }]));

      const visibilityData = createSampleVisibilityData();
      const result = await generateAIRecommendations(visibilityData);

      expect(result.success).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(mockClaudeCreate).toHaveBeenCalledTimes(3);
    });

    it("should not retry on invalid JSON errors", async () => {
      mockClaudeCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "This is not valid JSON at all" }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const visibilityData = createSampleVisibilityData();
      const result = await generateAIRecommendations(visibilityData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid JSON");
      // Should only be called once - no retry for JSON errors
      expect(mockClaudeCreate).toHaveBeenCalledTimes(1);
    });

    it("should handle malformed AI response missing recommendations array", async () => {
      // First mock fails with malformed response (no recommendations array)
      // Then retry also fails similarly, exhausting retries
      mockClaudeCreate.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify({ data: [] }) }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const visibilityData = createSampleVisibilityData();
      const result = await generateAIRecommendations(visibilityData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("missing recommendations array");
    });

    it("should handle JSON wrapped in markdown code blocks", async () => {
      const jsonContent = JSON.stringify({
        recommendations: [{
          title: "Test Rec",
          description: "Test description",
          category: "content_optimization",
          priority: "high",
          impact: "high",
          effort: "moderate",
          steps: ["Step 1"],
          aiPlatforms: ["ChatGPT"],
          expectedOutcome: "Better visibility",
          estimatedTimeframe: "1 week",
        }],
      });

      mockClaudeCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: `\`\`\`json\n${jsonContent}\n\`\`\`` }],
        usage: { input_tokens: 100, output_tokens: 100 },
      });

      const visibilityData = createSampleVisibilityData();
      const result = await generateAIRecommendations(visibilityData);

      expect(result.success).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should validate and normalize recommendation fields", async () => {
      const invalidRecommendation: Record<string, unknown> = {
        title: "Valid Recommendation",
        description: "Valid description",
        category: "INVALID_CATEGORY", // Should be normalized
        priority: "SUPER_HIGH", // Should be normalized
        impact: "MASSIVE", // Should be normalized
        effort: "EASY", // Should be normalized
      };
      mockClaudeCreate.mockResolvedValueOnce(createMockAIResponse([invalidRecommendation]));

      const visibilityData = createSampleVisibilityData();
      const result = await generateAIRecommendations(visibilityData);

      expect(result.success).toBe(true);
      if (result.recommendations.length > 0) {
        const rec = result.recommendations[0];
        // Check fields are normalized to valid values
        expect(["technical_seo", "content_optimization", "schema_markup", "citation_building",
                "brand_consistency", "competitor_analysis", "content_freshness", "authority_building"
        ]).toContain(rec.category);
        expect(["critical", "high", "medium", "low"]).toContain(rec.priority);
        expect(["high", "medium", "low"]).toContain(rec.impact);
        expect(["quick_win", "moderate", "major"]).toContain(rec.effort);
      }
    });

    it("should skip recommendations with missing required fields", async () => {
      mockClaudeCreate.mockResolvedValueOnce({
        content: [{
          type: "text",
          text: JSON.stringify({
            recommendations: [
              { title: "Valid", description: "Has required fields" },
              { title: "", description: "" }, // Empty fields - should be skipped
              { noTitle: true }, // Missing title - should be skipped
            ],
          }),
        }],
        usage: { input_tokens: 100, output_tokens: 100 },
      });

      const visibilityData = createSampleVisibilityData();
      const result = await generateAIRecommendations(visibilityData);

      expect(result.success).toBe(true);
      // Only the valid recommendation should be included
      expect(result.recommendations.length).toBe(1);
      expect(result.recommendations[0].title).toBe("Valid");
    });
  });

  describe("calculatePlatformReachScore", () => {
    it("should return 25 for single platform", () => {
      const score = calculatePlatformReachScore(["ChatGPT"], 4);
      expect(score).toBe(25);
    });

    it("should return 50 for two platforms", () => {
      const score = calculatePlatformReachScore(["ChatGPT", "Claude"], 4);
      expect(score).toBe(50);
    });

    it("should return 75 for three platforms", () => {
      const score = calculatePlatformReachScore(["ChatGPT", "Claude", "Perplexity"], 4);
      expect(score).toBe(75);
    });

    it("should return 100 for four or more platforms", () => {
      const score = calculatePlatformReachScore(
        ["ChatGPT", "Claude", "Perplexity", "Gemini"],
        4
      );
      expect(score).toBe(100);
    });

    it("should add coverage bonus when targeting all available platforms", () => {
      const score = calculatePlatformReachScore(["ChatGPT", "Claude"], 2);
      // 50 base + 10 bonus = 60, capped at 100
      expect(score).toBe(60);
    });

    it("should cap score at 100", () => {
      const score = calculatePlatformReachScore(
        ["ChatGPT", "Claude", "Perplexity", "Gemini", "Bing"],
        5
      );
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should return 0 for empty platforms", () => {
      const score = calculatePlatformReachScore([], 4);
      expect(score).toBe(0);
    });
  });

  describe("calculateVisibilityGapScore", () => {
    it("should return 50 for empty platform data", () => {
      const score = calculateVisibilityGapScore([], ["ChatGPT"]);
      expect(score).toBe(50);
    });

    it("should return 50 when no matching platforms found", () => {
      const platforms: PlatformVisibility[] = [
        { name: "Claude", mentionRate: 50, averagePosition: 2, sentiment: "neutral", citationFrequency: 10 },
      ];
      const score = calculateVisibilityGapScore(platforms, ["ChatGPT"]);
      expect(score).toBe(50);
    });

    it("should return high score for critical visibility gap (>50%)", () => {
      const platforms: PlatformVisibility[] = [
        { name: "ChatGPT", mentionRate: 20, averagePosition: 5, sentiment: "neutral", citationFrequency: 5 },
      ];
      // Gap = 100 - 20 = 80%
      const score = calculateVisibilityGapScore(platforms, ["ChatGPT"]);
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it("should return moderate score for high visibility gap (30-50%)", () => {
      const platforms: PlatformVisibility[] = [
        { name: "ChatGPT", mentionRate: 60, averagePosition: 3, sentiment: "positive", citationFrequency: 15 },
      ];
      // Gap = 100 - 60 = 40%
      const score = calculateVisibilityGapScore(platforms, ["ChatGPT"]);
      expect(score).toBeGreaterThanOrEqual(60);
      expect(score).toBeLessThan(80);
    });

    it("should return medium score for medium visibility gap (15-30%)", () => {
      const platforms: PlatformVisibility[] = [
        { name: "ChatGPT", mentionRate: 75, averagePosition: 2, sentiment: "positive", citationFrequency: 20 },
      ];
      // Gap = 100 - 75 = 25%
      const score = calculateVisibilityGapScore(platforms, ["ChatGPT"]);
      expect(score).toBeGreaterThanOrEqual(40);
      expect(score).toBeLessThan(60);
    });

    it("should return low score for low visibility gap (<15%)", () => {
      const platforms: PlatformVisibility[] = [
        { name: "ChatGPT", mentionRate: 90, averagePosition: 1, sentiment: "positive", citationFrequency: 30 },
      ];
      // Gap = 100 - 90 = 10%
      const score = calculateVisibilityGapScore(platforms, ["ChatGPT"]);
      expect(score).toBeLessThan(40);
    });

    it("should calculate average gap across multiple platforms", () => {
      const platforms: PlatformVisibility[] = [
        { name: "ChatGPT", mentionRate: 20, averagePosition: 5, sentiment: "neutral", citationFrequency: 5 },
        { name: "Claude", mentionRate: 80, averagePosition: 1, sentiment: "positive", citationFrequency: 25 },
      ];
      // Average gap = ((100-20) + (100-80)) / 2 = 50%
      const score = calculateVisibilityGapScore(platforms, ["ChatGPT", "Claude"]);
      expect(score).toBeGreaterThanOrEqual(60);
    });
  });

  describe("calculateTrafficGainScore", () => {
    it("should start with base score of 50", () => {
      const score = calculateTrafficGainScore("low", "major", [], ["ChatGPT"]);
      // 50 base + 5 (low impact) + 0 (major effort) = 55
      expect(score).toBe(55);
    });

    it("should add 30 for high impact", () => {
      const score = calculateTrafficGainScore("high", "major", [], ["ChatGPT"]);
      // 50 base + 30 (high impact) + 0 (major effort) = 80
      expect(score).toBe(80);
    });

    it("should add 15 for quick_win effort", () => {
      const score = calculateTrafficGainScore("low", "quick_win", [], ["ChatGPT"]);
      // 50 base + 5 (low impact) + 15 (quick_win) = 70
      expect(score).toBe(70);
    });

    it("should add bonus for addressing critical gaps", () => {
      const contentGaps: ContentGap[] = [
        { type: "missing_schema", description: "Critical gap", severity: "critical", affectedPlatforms: ["ChatGPT"] },
      ];
      const score = calculateTrafficGainScore("medium", "moderate", contentGaps, ["ChatGPT"]);
      // 50 base + 15 (medium impact) + 8 (moderate effort) + 10 (critical gap) = 83
      expect(score).toBe(83);
    });

    it("should cap score at 100", () => {
      const contentGaps: ContentGap[] = [
        { type: "missing_schema", description: "Critical gap", severity: "critical", affectedPlatforms: ["ChatGPT"] },
      ];
      const score = calculateTrafficGainScore("high", "quick_win", contentGaps, ["ChatGPT"]);
      // 50 + 30 + 15 + 10 = 105, capped at 100
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should not add bonus when gap platforms don't match", () => {
      const contentGaps: ContentGap[] = [
        { type: "missing_schema", description: "Critical gap", severity: "critical", affectedPlatforms: ["Perplexity"] },
      ];
      const score = calculateTrafficGainScore("medium", "moderate", contentGaps, ["ChatGPT"]);
      // 50 base + 15 (medium impact) + 8 (moderate effort) = 73 (no gap bonus)
      expect(score).toBe(73);
    });
  });

  describe("calculateCompetitiveAdvantageScore", () => {
    it("should return 50 for empty competitor data", () => {
      const platforms: PlatformVisibility[] = [
        { name: "ChatGPT", mentionRate: 50, averagePosition: 2, sentiment: "neutral", citationFrequency: 10 },
      ];
      const score = calculateCompetitiveAdvantageScore([], platforms, ["ChatGPT"]);
      expect(score).toBe(50);
    });

    it("should return 50 for empty platform data", () => {
      const competitors: CompetitorMetrics[] = [
        { name: "Competitor A", mentionRate: 70, platforms: ["ChatGPT"] },
      ];
      const score = calculateCompetitiveAdvantageScore(competitors, [], ["ChatGPT"]);
      expect(score).toBe(50);
    });

    it("should return high score for critical competitive gap (>40%)", () => {
      const platforms: PlatformVisibility[] = [
        { name: "ChatGPT", mentionRate: 20, averagePosition: 5, sentiment: "neutral", citationFrequency: 5 },
      ];
      const competitors: CompetitorMetrics[] = [
        { name: "Competitor A", mentionRate: 80, platforms: ["ChatGPT"] },
      ];
      // Gap = 80 - 20 = 60%
      const score = calculateCompetitiveAdvantageScore(competitors, platforms, ["ChatGPT"]);
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it("should return moderate score for significant competitive gap (20-40%)", () => {
      const platforms: PlatformVisibility[] = [
        { name: "ChatGPT", mentionRate: 40, averagePosition: 3, sentiment: "neutral", citationFrequency: 10 },
      ];
      const competitors: CompetitorMetrics[] = [
        { name: "Competitor A", mentionRate: 70, platforms: ["ChatGPT"] },
      ];
      // Gap = 70 - 40 = 30%
      const score = calculateCompetitiveAdvantageScore(competitors, platforms, ["ChatGPT"]);
      expect(score).toBeGreaterThanOrEqual(60);
      expect(score).toBeLessThan(80);
    });

    it("should return low score when ahead of competitors", () => {
      const platforms: PlatformVisibility[] = [
        { name: "ChatGPT", mentionRate: 80, averagePosition: 1, sentiment: "positive", citationFrequency: 30 },
      ];
      const competitors: CompetitorMetrics[] = [
        { name: "Competitor A", mentionRate: 50, platforms: ["ChatGPT"] },
      ];
      // Gap = 50 - 80 = -30%, treated as 0
      const score = calculateCompetitiveAdvantageScore(competitors, platforms, ["ChatGPT"]);
      expect(score).toBe(0);
    });
  });

  describe("extractImpactFactors", () => {
    it("should extract all impact factors correctly", () => {
      const recommendation = createSampleRecommendation({
        aiPlatforms: ["ChatGPT", "Claude"],
        impact: "high",
        effort: "quick_win",
      });
      const visibilityData = createSampleVisibilityData();

      const factors = extractImpactFactors(recommendation, visibilityData);

      expect(factors).toHaveProperty("platformReachScore");
      expect(factors).toHaveProperty("visibilityGapScore");
      expect(factors).toHaveProperty("trafficGainScore");
      expect(factors).toHaveProperty("competitiveAdvantageScore");
      expect(typeof factors.platformReachScore).toBe("number");
      expect(typeof factors.visibilityGapScore).toBe("number");
      expect(typeof factors.trafficGainScore).toBe("number");
      expect(typeof factors.competitiveAdvantageScore).toBe("number");
    });

    it("should use recommendation aiPlatforms for calculations", () => {
      const singlePlatformRec = createSampleRecommendation({ aiPlatforms: ["ChatGPT"] });
      const multiPlatformRec = createSampleRecommendation({
        aiPlatforms: ["ChatGPT", "Claude", "Perplexity", "Gemini"],
      });
      const visibilityData = createSampleVisibilityData();

      const singleFactors = extractImpactFactors(singlePlatformRec, visibilityData);
      const multiFactors = extractImpactFactors(multiPlatformRec, visibilityData);

      expect(multiFactors.platformReachScore).toBeGreaterThan(singleFactors.platformReachScore);
    });
  });

  describe("calculateWeightedImpactScore", () => {
    it("should use default weights from IMPACT_SCORING_WEIGHTS", () => {
      expect(IMPACT_SCORING_WEIGHTS.platformReach).toBe(0.40);
      expect(IMPACT_SCORING_WEIGHTS.visibilityGap).toBe(0.30);
      expect(IMPACT_SCORING_WEIGHTS.trafficGain).toBe(0.20);
      expect(IMPACT_SCORING_WEIGHTS.competitiveAdvantage).toBe(0.10);
    });

    it("should calculate weighted score correctly", () => {
      const factors = {
        platformReachScore: 100,
        visibilityGapScore: 100,
        trafficGainScore: 100,
        competitiveAdvantageScore: 100,
      };

      const score = calculateWeightedImpactScore(factors);
      expect(score).toBe(100);
    });

    it("should apply weights proportionally", () => {
      const factors = {
        platformReachScore: 100,
        visibilityGapScore: 0,
        trafficGainScore: 0,
        competitiveAdvantageScore: 0,
      };

      const score = calculateWeightedImpactScore(factors);
      expect(score).toBe(40); // 100 * 0.40
    });

    it("should round to two decimal places", () => {
      const factors = {
        platformReachScore: 33,
        visibilityGapScore: 33,
        trafficGainScore: 33,
        competitiveAdvantageScore: 33,
      };

      const score = calculateWeightedImpactScore(factors);
      expect(score).toBe(33);
    });

    it("should allow custom weights", () => {
      const factors = {
        platformReachScore: 100,
        visibilityGapScore: 100,
        trafficGainScore: 100,
        competitiveAdvantageScore: 100,
      };

      const customWeights = {
        platformReach: 0.25,
        visibilityGap: 0.25,
        trafficGain: 0.25,
        competitiveAdvantage: 0.25,
      };

      const score = calculateWeightedImpactScore(factors, customWeights);
      expect(score).toBe(100);
    });
  });

  describe("determinePriorityFromScore", () => {
    it("should return critical for score >= 80 with 3+ platforms and high visibility gap", () => {
      const priority = determinePriorityFromScore(85, 3, 85);
      expect(priority).toBe("critical");
    });

    it("should return high for score 60-79", () => {
      const priority = determinePriorityFromScore(65, 2, 50);
      expect(priority).toBe("high");
    });

    it("should return high for 2+ platforms with significant gap", () => {
      const priority = determinePriorityFromScore(55, 2, 65);
      expect(priority).toBe("high");
    });

    it("should return medium for score 40-59", () => {
      const priority = determinePriorityFromScore(45, 1, 35);
      expect(priority).toBe("medium");
    });

    it("should return low for score < 40 with low visibility gap", () => {
      const priority = determinePriorityFromScore(30, 1, 25);
      expect(priority).toBe("low");
    });

    it("should prioritize visibility gap score for medium determination", () => {
      const priority = determinePriorityFromScore(35, 1, 45);
      expect(priority).toBe("medium");
    });
  });

  describe("calculateRecommendationImpactScore", () => {
    it("should return score between 0 and 100", () => {
      const recommendation = createSampleRecommendation();
      const visibilityData = createSampleVisibilityData();

      const score = calculateRecommendationImpactScore(recommendation, visibilityData);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should add priority adjustment for critical priority", () => {
      const criticalRec = createSampleRecommendation({ priority: "critical" });
      const lowRec = createSampleRecommendation({ priority: "low" });
      const visibilityData = createSampleVisibilityData();

      const criticalScore = calculateRecommendationImpactScore(criticalRec, visibilityData);
      const lowScore = calculateRecommendationImpactScore(lowRec, visibilityData);

      // Critical should have higher score due to +10 adjustment vs -5 for low
      expect(criticalScore).toBeGreaterThan(lowScore);
    });

    it("should add bonus for addressing critical content gaps", () => {
      const recommendation = createSampleRecommendation({
        title: "Fix missing_schema issues",
        description: "Implement missing_schema markup",
      });
      const visibilityData = createSampleVisibilityData({
        contentGaps: [
          { type: "missing_schema", description: "Critical schema issue", severity: "critical", affectedPlatforms: ["ChatGPT"] },
        ],
      });

      const score = calculateRecommendationImpactScore(recommendation, visibilityData);

      // Should include bonus for addressing critical gap
      expect(score).toBeGreaterThan(50);
    });

    it("should add bonus for targeting low-visibility platforms", () => {
      const recommendation = createSampleRecommendation({
        aiPlatforms: ["Perplexity"], // Low visibility platform (15%)
      });
      const visibilityData = createSampleVisibilityData({
        platforms: [
          { name: "Perplexity", mentionRate: 10, averagePosition: 5, sentiment: "neutral", citationFrequency: 2 },
        ],
      });

      const score = calculateRecommendationImpactScore(recommendation, visibilityData);

      // Should get bonus for targeting low-visibility platform
      expect(score).toBeGreaterThan(0);
    });

    it("should return higher scores for high impact, low effort recommendations", () => {
      const easyHighImpactRec = createSampleRecommendation({
        impact: "high",
        effort: "quick_win",
        priority: "critical",
        aiPlatforms: ["ChatGPT", "Claude", "Perplexity", "Gemini"],
      });
      const hardLowImpactRec = createSampleRecommendation({
        impact: "low",
        effort: "major",
        priority: "low",
        aiPlatforms: ["ChatGPT"],
      });
      const visibilityData = createSampleVisibilityData();

      const easyScore = calculateRecommendationImpactScore(easyHighImpactRec, visibilityData);
      const hardScore = calculateRecommendationImpactScore(hardLowImpactRec, visibilityData);

      expect(easyScore).toBeGreaterThan(hardScore);
    });
  });

  describe("deduplicateRecommendations", () => {
    it("should return all unique recommendations when no duplicates", () => {
      const recommendations: GeneratedRecommendation[] = [
        { ...createSampleRecommendation({ title: "Recommendation A" }), impactScore: 80 },
        { ...createSampleRecommendation({ title: "Recommendation B" }), impactScore: 70 },
        { ...createSampleRecommendation({ title: "Recommendation C" }), impactScore: 60 },
      ];

      const result = deduplicateRecommendations(recommendations);

      expect(result.unique.length).toBe(3);
      expect(result.duplicates.length).toBe(0);
    });

    it("should identify exact title duplicates", () => {
      const recommendations: GeneratedRecommendation[] = [
        { ...createSampleRecommendation({ title: "Same Title" }), impactScore: 80 },
        { ...createSampleRecommendation({ title: "Same Title" }), impactScore: 70 },
        { ...createSampleRecommendation({ title: "Different Title" }), impactScore: 60 },
      ];

      const result = deduplicateRecommendations(recommendations);

      expect(result.unique.length).toBe(2);
      expect(result.duplicates.length).toBe(1);
    });

    it("should identify duplicates case-insensitively", () => {
      const recommendations: GeneratedRecommendation[] = [
        { ...createSampleRecommendation({ title: "IMPROVE CONTENT" }), impactScore: 80 },
        { ...createSampleRecommendation({ title: "improve content" }), impactScore: 70 },
      ];

      const result = deduplicateRecommendations(recommendations);

      expect(result.unique.length).toBe(1);
      expect(result.duplicates.length).toBe(1);
    });

    it("should detect similar titles using fuzzy matching (>80% similarity)", () => {
      const recommendations: GeneratedRecommendation[] = [
        { ...createSampleRecommendation({ title: "Improve content quality for AI platforms" }), impactScore: 80 },
        { ...createSampleRecommendation({ title: "Improve content quality for AI" }), impactScore: 70 },
      ];

      const result = deduplicateRecommendations(recommendations);

      expect(result.unique.length).toBe(1);
      expect(result.duplicates.length).toBe(1);
    });

    it("should filter against existing titles", () => {
      const recommendations: GeneratedRecommendation[] = [
        { ...createSampleRecommendation({ title: "New Recommendation" }), impactScore: 80 },
        { ...createSampleRecommendation({ title: "Existing Recommendation" }), impactScore: 70 },
      ];
      const existingTitles = ["Existing Recommendation", "Another Existing"];

      const result = deduplicateRecommendations(recommendations, existingTitles);

      expect(result.unique.length).toBe(1);
      expect(result.unique[0].title).toBe("New Recommendation");
      expect(result.duplicates.length).toBe(1);
    });

    it("should keep the first occurrence and mark later as duplicates", () => {
      const recommendations: GeneratedRecommendation[] = [
        { ...createSampleRecommendation({ title: "First" }), impactScore: 50 },
        { ...createSampleRecommendation({ title: "First" }), impactScore: 90 },
      ];

      const result = deduplicateRecommendations(recommendations);

      expect(result.unique.length).toBe(1);
      expect(result.unique[0].impactScore).toBe(50); // First one kept
      expect(result.duplicates[0].impactScore).toBe(90); // Second one marked as duplicate
    });

    it("should handle empty input", () => {
      const result = deduplicateRecommendations([]);

      expect(result.unique.length).toBe(0);
      expect(result.duplicates.length).toBe(0);
    });

    it("should normalize titles by removing special characters and extra spaces", () => {
      const recommendations: GeneratedRecommendation[] = [
        { ...createSampleRecommendation({ title: "Improve   Content!  Quality" }), impactScore: 80 },
        { ...createSampleRecommendation({ title: "Improve Content Quality" }), impactScore: 70 },
      ];

      const result = deduplicateRecommendations(recommendations);

      expect(result.unique.length).toBe(1);
      expect(result.duplicates.length).toBe(1);
    });
  });
});
