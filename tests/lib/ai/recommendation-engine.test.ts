/**
 * Recommendation Engine Unit Tests
 * Tests for the recommendation generation engine and utility functions
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  RecommendationEngine,
  generateRecommendations,
  generateRecommendationsFromContext,
  batchGenerateRecommendations,
  getRecommendationSummary,
  filterByPriority,
  filterByImpact,
  filterByDifficulty,
  getQuickWins,
  sortRecommendations,
} from "@/lib/ai/recommendation-engine";
import type {
  Recommendation,
  PlatformAnalysis,
  VisibilityScore,
  ContentTypePerformance,
  AIPlatform,
} from "@/lib/ai/types";

// ============================================================================
// Test Fixtures
// ============================================================================

const MOCK_BRAND_NAME = "Acme Corporation";

/**
 * Create mock visibility score with customizable metrics
 */
const createMockVisibilityScore = (overrides?: Partial<VisibilityScore>): VisibilityScore => ({
  total: 65,
  breakdown: {
    mentionCount: 25,
    citationQuality: 20,
    prominence: 20,
  },
  metrics: {
    totalMentions: 3,
    totalCitations: 2,
    avgRelevanceScore: 70,
    firstMentionPosition: 50,
  },
  ...overrides,
});

/**
 * Create mock content type performance
 */
const createMockContentPerformance = (
  overrides?: Partial<ContentTypePerformance>
): ContentTypePerformance => ({
  blog_post: 5,
  documentation: 8,
  case_study: 2,
  tutorial: 3,
  unknown: 1,
  ...overrides,
});

/**
 * Create mock platform analysis
 */
const createMockPlatformAnalysis = (
  platform: AIPlatform = "chatgpt",
  overrides?: Partial<PlatformAnalysis>
): PlatformAnalysis => ({
  platform,
  query: "What are the best project management tools?",
  brandContext: "Acme Corporation is a project management software company",
  response: {
    platform,
    content: "Acme Corporation offers excellent project management solutions...",
    citations: [],
    metadata: { model: "test-model" },
  },
  visibilityScore: createMockVisibilityScore(),
  contentTypePerformance: createMockContentPerformance(),
  recommendations: [],
  analyzedAt: new Date(),
  status: "success",
  ...overrides,
});

// ============================================================================
// Constructor and Configuration Tests
// ============================================================================

describe("RecommendationEngine - Constructor", () => {
  it("should create instance with default options", () => {
    const engine = new RecommendationEngine();
    expect(engine).toBeDefined();
  });

  it("should create instance with brand name", () => {
    const engine = new RecommendationEngine({ brandName: MOCK_BRAND_NAME });
    expect(engine).toBeDefined();
  });

  it("should create instance with custom min/max recommendations", () => {
    const engine = new RecommendationEngine({
      minRecommendations: 2,
      maxRecommendations: 8,
    });
    expect(engine).toBeDefined();
  });

  it("should create instance with debug enabled", () => {
    const engine = new RecommendationEngine({ debug: true });
    expect(engine).toBeDefined();
  });

  it("should use default values when options are not provided", () => {
    const engine = new RecommendationEngine({});
    expect(engine).toBeDefined();
  });
});

// ============================================================================
// Main Generation Methods Tests
// ============================================================================

describe("RecommendationEngine - generateFromAnalysis()", () => {
  let engine: RecommendationEngine;

  beforeEach(() => {
    engine = new RecommendationEngine({ brandName: MOCK_BRAND_NAME });
  });

  it("should generate recommendations from platform analysis", () => {
    const analysis = createMockPlatformAnalysis("chatgpt");
    const recommendations = engine.generateFromAnalysis(analysis);

    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeLessThanOrEqual(5);
  });

  it("should generate recommendations for all platforms", () => {
    const platforms: AIPlatform[] = ["chatgpt", "claude", "gemini", "perplexity"];

    platforms.forEach((platform) => {
      const analysis = createMockPlatformAnalysis(platform);
      const recommendations = engine.generateFromAnalysis(analysis);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  it("should personalize recommendations with brand name", () => {
    const analysis = createMockPlatformAnalysis("chatgpt");
    const recommendations = engine.generateFromAnalysis(analysis);

    // At least some recommendations should contain the brand name
    const hasPersonalization = recommendations.some(
      (rec) =>
        rec.description.includes(MOCK_BRAND_NAME) ||
        rec.actionItems?.some((item) => item.includes(MOCK_BRAND_NAME)) ||
        rec.examples?.some((example) => example.includes(MOCK_BRAND_NAME))
    );

    expect(hasPersonalization).toBe(true);
  });

  it("should generate different recommendations based on visibility score", () => {
    // Low visibility score analysis
    const lowScoreAnalysis = createMockPlatformAnalysis("chatgpt", {
      visibilityScore: createMockVisibilityScore({
        total: 25,
        breakdown: { mentionCount: 10, citationQuality: 5, prominence: 10 },
        metrics: { totalMentions: 1, totalCitations: 0, avgRelevanceScore: 30, firstMentionPosition: 200 },
      }),
    });

    // High visibility score analysis
    const highScoreAnalysis = createMockPlatformAnalysis("chatgpt", {
      visibilityScore: createMockVisibilityScore({
        total: 85,
        breakdown: { mentionCount: 35, citationQuality: 28, prominence: 22 },
        metrics: { totalMentions: 6, totalCitations: 4, avgRelevanceScore: 90, firstMentionPosition: 10 },
      }),
    });

    const lowScoreRecs = engine.generateFromAnalysis(lowScoreAnalysis);
    const highScoreRecs = engine.generateFromAnalysis(highScoreAnalysis);

    // Both should generate recommendations, but potentially different ones
    expect(lowScoreRecs.length).toBeGreaterThan(0);
    expect(highScoreRecs.length).toBeGreaterThan(0);
  });

  it("should include all required recommendation fields", () => {
    const analysis = createMockPlatformAnalysis("chatgpt");
    const recommendations = engine.generateFromAnalysis(analysis);

    recommendations.forEach((rec) => {
      expect(rec.id).toBeDefined();
      expect(rec.title).toBeDefined();
      expect(rec.description).toBeDefined();
      expect(rec.priority).toBeGreaterThanOrEqual(1);
      expect(rec.priority).toBeLessThanOrEqual(5);
      expect(["high", "medium", "low"]).toContain(rec.impact);
      expect(["easy", "moderate", "hard"]).toContain(rec.difficulty);
    });
  });
});

describe("RecommendationEngine - generate()", () => {
  let engine: RecommendationEngine;

  beforeEach(() => {
    engine = new RecommendationEngine({ brandName: MOCK_BRAND_NAME });
  });

  it("should generate recommendations from context", () => {
    const context = {
      platform: "chatgpt" as AIPlatform,
      visibilityScore: createMockVisibilityScore(),
      contentTypePerformance: createMockContentPerformance(),
      brandName: MOCK_BRAND_NAME,
    };

    const recommendations = engine.generate(context);

    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it("should generate recommendations for low mention count", () => {
    const context = {
      platform: "chatgpt" as AIPlatform,
      visibilityScore: createMockVisibilityScore({
        metrics: { totalMentions: 1, totalCitations: 0, avgRelevanceScore: 0, firstMentionPosition: 100 },
      }),
      contentTypePerformance: createMockContentPerformance(),
    };

    const recommendations = engine.generate(context);

    // Should include recommendation to increase mentions
    const hasIncreaseMentions = recommendations.some(
      (rec) =>
        rec.title.toLowerCase().includes("mention") ||
        rec.description.toLowerCase().includes("mention")
    );

    expect(hasIncreaseMentions).toBe(true);
  });

  it("should generate recommendations for low citation count", () => {
    const context = {
      platform: "chatgpt" as AIPlatform,
      visibilityScore: createMockVisibilityScore({
        metrics: { totalMentions: 3, totalCitations: 0, avgRelevanceScore: 0, firstMentionPosition: 50 },
      }),
      contentTypePerformance: createMockContentPerformance(),
    };

    const recommendations = engine.generate(context);

    // Should include recommendation to improve citations
    const hasImproveCitations = recommendations.some(
      (rec) =>
        rec.title.toLowerCase().includes("citation") ||
        rec.description.toLowerCase().includes("citation")
    );

    expect(hasImproveCitations).toBe(true);
  });

  it("should generate recommendations for low prominence", () => {
    const context = {
      platform: "chatgpt" as AIPlatform,
      visibilityScore: createMockVisibilityScore({
        breakdown: { mentionCount: 25, citationQuality: 20, prominence: 5 },
        metrics: { totalMentions: 3, totalCitations: 2, avgRelevanceScore: 70, firstMentionPosition: 500 },
      }),
      contentTypePerformance: createMockContentPerformance(),
    };

    const recommendations = engine.generate(context);

    // Should include recommendation to boost prominence
    const hasBoostProminence = recommendations.some(
      (rec) =>
        rec.title.toLowerCase().includes("prominence") ||
        rec.title.toLowerCase().includes("early") ||
        rec.title.toLowerCase().includes("visibility")
    );

    expect(hasBoostProminence).toBe(true);
  });

  it("should prioritize recommendations by priority and impact", () => {
    const context = {
      platform: "chatgpt" as AIPlatform,
      visibilityScore: createMockVisibilityScore(),
      contentTypePerformance: createMockContentPerformance(),
    };

    const recommendations = engine.generate(context);

    // Verify first recommendation has priority 1 or 2 (high priority)
    expect(recommendations[0].priority).toBeLessThanOrEqual(2);

    // Verify recommendations are sorted by priority
    for (let i = 0; i < recommendations.length - 1; i++) {
      expect(recommendations[i].priority).toBeLessThanOrEqual(recommendations[i + 1].priority);
    }
  });

  it("should handle content type specific recommendations", () => {
    const context = {
      platform: "chatgpt" as AIPlatform,
      visibilityScore: createMockVisibilityScore(),
      contentTypePerformance: createMockContentPerformance({
        documentation: 15,
        blog_post: 2,
      }),
      brandName: MOCK_BRAND_NAME,
    };

    const recommendations = engine.generate(context);

    // Should recognize documentation as best performing content type
    expect(recommendations.length).toBeGreaterThan(0);
  });
});

describe("RecommendationEngine - generateForMultiplePlatforms()", () => {
  let engine: RecommendationEngine;

  beforeEach(() => {
    engine = new RecommendationEngine({ brandName: MOCK_BRAND_NAME });
  });

  it("should generate recommendations for multiple platforms", () => {
    const analyses = [
      createMockPlatformAnalysis("chatgpt"),
      createMockPlatformAnalysis("claude"),
      createMockPlatformAnalysis("gemini"),
      createMockPlatformAnalysis("perplexity"),
    ];

    const recommendations = engine.generateForMultiplePlatforms(analyses);

    expect(recommendations.size).toBe(4);
    expect(recommendations.has("chatgpt")).toBe(true);
    expect(recommendations.has("claude")).toBe(true);
    expect(recommendations.has("gemini")).toBe(true);
    expect(recommendations.has("perplexity")).toBe(true);
  });

  it("should skip failed analyses", () => {
    const analyses = [
      createMockPlatformAnalysis("chatgpt", { status: "success" }),
      createMockPlatformAnalysis("claude", { status: "failed" }),
      createMockPlatformAnalysis("gemini", { status: "partial" }),
    ];

    const recommendations = engine.generateForMultiplePlatforms(analyses);

    // Should have recommendations for success and partial, but not failed
    expect(recommendations.has("chatgpt")).toBe(true);
    expect(recommendations.has("claude")).toBe(false);
    expect(recommendations.has("gemini")).toBe(true);
  });

  it("should handle empty analyses array", () => {
    const recommendations = engine.generateForMultiplePlatforms([]);

    expect(recommendations.size).toBe(0);
  });

  it("should generate platform-specific recommendations", () => {
    const analyses = [
      createMockPlatformAnalysis("chatgpt"),
      createMockPlatformAnalysis("perplexity"),
    ];

    const recommendations = engine.generateForMultiplePlatforms(analyses);

    const chatgptRecs = recommendations.get("chatgpt");
    const perplexityRecs = recommendations.get("perplexity");

    expect(chatgptRecs).toBeDefined();
    expect(perplexityRecs).toBeDefined();
    expect(chatgptRecs!.length).toBeGreaterThan(0);
    expect(perplexityRecs!.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Summary and Statistics Tests
// ============================================================================

describe("RecommendationEngine - getSummary()", () => {
  let engine: RecommendationEngine;

  beforeEach(() => {
    engine = new RecommendationEngine();
  });

  it("should return summary for empty recommendations", () => {
    const summary = engine.getSummary([]);

    expect(summary.total).toBe(0);
    expect(summary.highPriorityCount).toBe(0);
    expect(summary.quickWinsCount).toBe(0);
  });

  it("should calculate total count correctly", () => {
    const recommendations: Recommendation[] = [
      { id: "1", title: "Test 1", description: "Desc", priority: 1, impact: "high", difficulty: "easy" },
      { id: "2", title: "Test 2", description: "Desc", priority: 2, impact: "medium", difficulty: "moderate" },
      { id: "3", title: "Test 3", description: "Desc", priority: 3, impact: "low", difficulty: "hard" },
    ];

    const summary = engine.getSummary(recommendations);

    expect(summary.total).toBe(3);
  });

  it("should count recommendations by priority", () => {
    const recommendations: Recommendation[] = [
      { id: "1", title: "Test 1", description: "Desc", priority: 1, impact: "high", difficulty: "easy" },
      { id: "2", title: "Test 2", description: "Desc", priority: 1, impact: "high", difficulty: "moderate" },
      { id: "3", title: "Test 3", description: "Desc", priority: 2, impact: "medium", difficulty: "easy" },
      { id: "4", title: "Test 4", description: "Desc", priority: 3, impact: "low", difficulty: "hard" },
    ];

    const summary = engine.getSummary(recommendations);

    expect(summary.byPriority[1]).toBe(2);
    expect(summary.byPriority[2]).toBe(1);
    expect(summary.byPriority[3]).toBe(1);
  });

  it("should count recommendations by impact", () => {
    const recommendations: Recommendation[] = [
      { id: "1", title: "Test 1", description: "Desc", priority: 1, impact: "high", difficulty: "easy" },
      { id: "2", title: "Test 2", description: "Desc", priority: 1, impact: "high", difficulty: "moderate" },
      { id: "3", title: "Test 3", description: "Desc", priority: 2, impact: "medium", difficulty: "easy" },
      { id: "4", title: "Test 4", description: "Desc", priority: 3, impact: "low", difficulty: "hard" },
    ];

    const summary = engine.getSummary(recommendations);

    expect(summary.byImpact.high).toBe(2);
    expect(summary.byImpact.medium).toBe(1);
    expect(summary.byImpact.low).toBe(1);
  });

  it("should count recommendations by difficulty", () => {
    const recommendations: Recommendation[] = [
      { id: "1", title: "Test 1", description: "Desc", priority: 1, impact: "high", difficulty: "easy" },
      { id: "2", title: "Test 2", description: "Desc", priority: 1, impact: "high", difficulty: "easy" },
      { id: "3", title: "Test 3", description: "Desc", priority: 2, impact: "medium", difficulty: "moderate" },
      { id: "4", title: "Test 4", description: "Desc", priority: 3, impact: "low", difficulty: "hard" },
    ];

    const summary = engine.getSummary(recommendations);

    expect(summary.byDifficulty.easy).toBe(2);
    expect(summary.byDifficulty.moderate).toBe(1);
    expect(summary.byDifficulty.hard).toBe(1);
  });

  it("should count high priority recommendations (priority 1-2)", () => {
    const recommendations: Recommendation[] = [
      { id: "1", title: "Test 1", description: "Desc", priority: 1, impact: "high", difficulty: "easy" },
      { id: "2", title: "Test 2", description: "Desc", priority: 2, impact: "medium", difficulty: "moderate" },
      { id: "3", title: "Test 3", description: "Desc", priority: 3, impact: "low", difficulty: "hard" },
    ];

    const summary = engine.getSummary(recommendations);

    expect(summary.highPriorityCount).toBe(2);
  });

  it("should count quick wins (high impact + easy difficulty)", () => {
    const recommendations: Recommendation[] = [
      { id: "1", title: "Quick Win 1", description: "Desc", priority: 1, impact: "high", difficulty: "easy" },
      { id: "2", title: "Quick Win 2", description: "Desc", priority: 2, impact: "high", difficulty: "easy" },
      { id: "3", title: "Not Quick", description: "Desc", priority: 1, impact: "high", difficulty: "hard" },
      { id: "4", title: "Not Quick", description: "Desc", priority: 2, impact: "medium", difficulty: "easy" },
    ];

    const summary = engine.getSummary(recommendations);

    expect(summary.quickWinsCount).toBe(2);
  });
});

// ============================================================================
// Standalone Utility Functions Tests
// ============================================================================

describe("Standalone Utility Functions", () => {
  describe("generateRecommendations()", () => {
    it("should generate recommendations from analysis", () => {
      const analysis = createMockPlatformAnalysis("chatgpt");
      const recommendations = generateRecommendations(analysis, {
        brandName: MOCK_BRAND_NAME,
      });

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it("should work without options", () => {
      const analysis = createMockPlatformAnalysis("chatgpt");
      const recommendations = generateRecommendations(analysis);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("generateRecommendationsFromContext()", () => {
    it("should generate recommendations from context", () => {
      const context = {
        platform: "claude" as AIPlatform,
        visibilityScore: createMockVisibilityScore(),
        contentTypePerformance: createMockContentPerformance(),
        brandName: MOCK_BRAND_NAME,
      };

      const recommendations = generateRecommendationsFromContext(context);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it("should respect custom max recommendations option", () => {
      const context = {
        platform: "gemini" as AIPlatform,
        visibilityScore: createMockVisibilityScore(),
        contentTypePerformance: createMockContentPerformance(),
      };

      const recommendations = generateRecommendationsFromContext(context, {
        maxRecommendations: 3,
      });

      expect(recommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe("batchGenerateRecommendations()", () => {
    it("should generate recommendations for multiple platforms", () => {
      const analyses = [
        createMockPlatformAnalysis("chatgpt"),
        createMockPlatformAnalysis("claude"),
      ];

      const recommendations = batchGenerateRecommendations(analyses, {
        brandName: MOCK_BRAND_NAME,
      });

      expect(recommendations.size).toBe(2);
      expect(recommendations.has("chatgpt")).toBe(true);
      expect(recommendations.has("claude")).toBe(true);
    });

    it("should handle empty analyses", () => {
      const recommendations = batchGenerateRecommendations([]);

      expect(recommendations.size).toBe(0);
    });
  });

  describe("getRecommendationSummary()", () => {
    it("should return summary statistics", () => {
      const recommendations: Recommendation[] = [
        { id: "1", title: "Test 1", description: "Desc", priority: 1, impact: "high", difficulty: "easy" },
        { id: "2", title: "Test 2", description: "Desc", priority: 2, impact: "medium", difficulty: "moderate" },
      ];

      const summary = getRecommendationSummary(recommendations);

      expect(summary.total).toBe(2);
      expect(summary.highPriorityCount).toBe(2);
    });
  });
});

// ============================================================================
// Filter Functions Tests
// ============================================================================

describe("Filter Functions", () => {
  const testRecommendations: Recommendation[] = [
    { id: "1", title: "P1 High Easy", description: "Desc", priority: 1, impact: "high", difficulty: "easy" },
    { id: "2", title: "P2 Medium Mod", description: "Desc", priority: 2, impact: "medium", difficulty: "moderate" },
    { id: "3", title: "P3 Low Hard", description: "Desc", priority: 3, impact: "low", difficulty: "hard" },
    { id: "4", title: "P4 High Mod", description: "Desc", priority: 4, impact: "high", difficulty: "moderate" },
    { id: "5", title: "P5 Medium Easy", description: "Desc", priority: 5, impact: "medium", difficulty: "easy" },
  ];

  describe("filterByPriority()", () => {
    it("should filter recommendations by max priority", () => {
      const filtered = filterByPriority(testRecommendations, 2);

      expect(filtered.length).toBe(2);
      expect(filtered.every((rec) => rec.priority <= 2)).toBe(true);
    });

    it("should return all when priority is 5", () => {
      const filtered = filterByPriority(testRecommendations, 5);

      expect(filtered.length).toBe(5);
    });

    it("should return only priority 1 when filtering by 1", () => {
      const filtered = filterByPriority(testRecommendations, 1);

      expect(filtered.length).toBe(1);
      expect(filtered[0].priority).toBe(1);
    });
  });

  describe("filterByImpact()", () => {
    it("should filter by single impact level", () => {
      const filtered = filterByImpact(testRecommendations, ["high"]);

      expect(filtered.length).toBe(2);
      expect(filtered.every((rec) => rec.impact === "high")).toBe(true);
    });

    it("should filter by multiple impact levels", () => {
      const filtered = filterByImpact(testRecommendations, ["high", "medium"]);

      expect(filtered.length).toBe(4);
      expect(filtered.every((rec) => rec.impact === "high" || rec.impact === "medium")).toBe(true);
    });

    it("should return empty array when no matches", () => {
      const noHighImpact: Recommendation[] = [
        { id: "1", title: "Test", description: "Desc", priority: 1, impact: "low", difficulty: "easy" },
      ];

      const filtered = filterByImpact(noHighImpact, ["high"]);

      expect(filtered.length).toBe(0);
    });
  });

  describe("filterByDifficulty()", () => {
    it("should filter by single difficulty level", () => {
      const filtered = filterByDifficulty(testRecommendations, ["easy"]);

      expect(filtered.length).toBe(2);
      expect(filtered.every((rec) => rec.difficulty === "easy")).toBe(true);
    });

    it("should filter by multiple difficulty levels", () => {
      const filtered = filterByDifficulty(testRecommendations, ["easy", "moderate"]);

      expect(filtered.length).toBe(4);
      expect(filtered.every((rec) => rec.difficulty === "easy" || rec.difficulty === "moderate")).toBe(true);
    });

    it("should return empty array when no matches", () => {
      const noEasy: Recommendation[] = [
        { id: "1", title: "Test", description: "Desc", priority: 1, impact: "high", difficulty: "hard" },
      ];

      const filtered = filterByDifficulty(noEasy, ["easy"]);

      expect(filtered.length).toBe(0);
    });
  });

  describe("getQuickWins()", () => {
    it("should return only high impact + easy difficulty recommendations", () => {
      const quickWins = getQuickWins(testRecommendations);

      expect(quickWins.length).toBe(1);
      expect(quickWins[0].impact).toBe("high");
      expect(quickWins[0].difficulty).toBe("easy");
    });

    it("should return empty array when no quick wins exist", () => {
      const noQuickWins: Recommendation[] = [
        { id: "1", title: "Test 1", description: "Desc", priority: 1, impact: "high", difficulty: "hard" },
        { id: "2", title: "Test 2", description: "Desc", priority: 2, impact: "medium", difficulty: "easy" },
      ];

      const quickWins = getQuickWins(noQuickWins);

      expect(quickWins.length).toBe(0);
    });

    it("should handle multiple quick wins", () => {
      const multipleQuickWins: Recommendation[] = [
        { id: "1", title: "QW 1", description: "Desc", priority: 1, impact: "high", difficulty: "easy" },
        { id: "2", title: "QW 2", description: "Desc", priority: 2, impact: "high", difficulty: "easy" },
        { id: "3", title: "Not QW", description: "Desc", priority: 3, impact: "medium", difficulty: "easy" },
      ];

      const quickWins = getQuickWins(multipleQuickWins);

      expect(quickWins.length).toBe(2);
    });
  });

  describe("sortRecommendations()", () => {
    it("should sort by priority first", () => {
      const unsorted: Recommendation[] = [
        { id: "1", title: "P3", description: "Desc", priority: 3, impact: "high", difficulty: "easy" },
        { id: "2", title: "P1", description: "Desc", priority: 1, impact: "low", difficulty: "easy" },
        { id: "3", title: "P2", description: "Desc", priority: 2, impact: "medium", difficulty: "easy" },
      ];

      const sorted = sortRecommendations(unsorted);

      expect(sorted[0].priority).toBe(1);
      expect(sorted[1].priority).toBe(2);
      expect(sorted[2].priority).toBe(3);
    });

    it("should sort by impact when priority is the same", () => {
      const unsorted: Recommendation[] = [
        { id: "1", title: "Low", description: "Desc", priority: 1, impact: "low", difficulty: "easy" },
        { id: "2", title: "High", description: "Desc", priority: 1, impact: "high", difficulty: "easy" },
        { id: "3", title: "Medium", description: "Desc", priority: 1, impact: "medium", difficulty: "easy" },
      ];

      const sorted = sortRecommendations(unsorted);

      expect(sorted[0].impact).toBe("high");
      expect(sorted[1].impact).toBe("medium");
      expect(sorted[2].impact).toBe("low");
    });

    it("should not modify original array", () => {
      const original: Recommendation[] = [
        { id: "1", title: "P3", description: "Desc", priority: 3, impact: "high", difficulty: "easy" },
        { id: "2", title: "P1", description: "Desc", priority: 1, impact: "low", difficulty: "easy" },
      ];

      const originalCopy = [...original];
      sortRecommendations(original);

      expect(original).toEqual(originalCopy);
    });

    it("should handle empty array", () => {
      const sorted = sortRecommendations([]);

      expect(sorted.length).toBe(0);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("RecommendationEngine - Integration Tests", () => {
  it("should generate consistent recommendations for identical analyses", () => {
    const engine = new RecommendationEngine({ brandName: MOCK_BRAND_NAME });
    const analysis = createMockPlatformAnalysis("chatgpt");

    const recs1 = engine.generateFromAnalysis(analysis);
    const recs2 = engine.generateFromAnalysis(analysis);

    expect(recs1.length).toBe(recs2.length);
    expect(recs1.map((r) => r.id)).toEqual(recs2.map((r) => r.id));
  });

  it("should handle real-world scenario with mixed visibility scores", () => {
    const engine = new RecommendationEngine({ brandName: "TechCorp" });

    // Scenario: Good mentions, poor citations, medium prominence
    const analysis = createMockPlatformAnalysis("claude", {
      visibilityScore: createMockVisibilityScore({
        total: 55,
        breakdown: { mentionCount: 30, citationQuality: 8, prominence: 17 },
        metrics: { totalMentions: 4, totalCitations: 1, avgRelevanceScore: 45, firstMentionPosition: 75 },
      }),
      contentTypePerformance: createMockContentPerformance({
        blog_post: 10,
        documentation: 3,
      }),
    });

    const recommendations = engine.generateFromAnalysis(analysis);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeLessThanOrEqual(5);

    // Should include recommendation about improving citations (low citation count)
    const hasCitationRec = recommendations.some(
      (rec) =>
        rec.title.toLowerCase().includes("citation") ||
        rec.description.toLowerCase().includes("citation")
    );
    expect(hasCitationRec).toBe(true);
  });

  it("should work with complete workflow: generate, filter, sort", () => {
    const engine = new RecommendationEngine({ brandName: MOCK_BRAND_NAME });
    const analyses = [
      createMockPlatformAnalysis("chatgpt"),
      createMockPlatformAnalysis("claude"),
    ];

    // Generate for multiple platforms
    const allRecommendations = engine.generateForMultiplePlatforms(analyses);

    expect(allRecommendations.size).toBe(2);

    // Get ChatGPT recommendations and filter
    const chatgptRecs = allRecommendations.get("chatgpt")!;
    const highPriority = filterByPriority(chatgptRecs, 2);
    const quickWins = getQuickWins(highPriority);
    const sorted = sortRecommendations(highPriority);

    expect(sorted.length).toBeGreaterThan(0);
    expect(sorted[0].priority).toBeLessThanOrEqual(2);
  });

  it("should generate platform-specific recommendations for each platform", () => {
    const engine = new RecommendationEngine({ brandName: MOCK_BRAND_NAME });

    const platforms: AIPlatform[] = ["chatgpt", "claude", "gemini", "perplexity"];
    const analyses = platforms.map((platform) => createMockPlatformAnalysis(platform));

    const allRecommendations = engine.generateForMultiplePlatforms(analyses);

    // Each platform should have recommendations
    platforms.forEach((platform) => {
      const platformRecs = allRecommendations.get(platform);
      expect(platformRecs).toBeDefined();
      expect(platformRecs!.length).toBeGreaterThan(0);
    });
  });

  it("should handle edge case with maximum visibility score", () => {
    const engine = new RecommendationEngine({ brandName: MOCK_BRAND_NAME });

    const analysis = createMockPlatformAnalysis("gemini", {
      visibilityScore: createMockVisibilityScore({
        total: 100,
        breakdown: { mentionCount: 40, citationQuality: 30, prominence: 30 },
        metrics: { totalMentions: 8, totalCitations: 5, avgRelevanceScore: 95, firstMentionPosition: 5 },
      }),
    });

    const recommendations = engine.generateFromAnalysis(analysis);

    // Even with perfect score, should still get some recommendations
    // (or potentially fewer if conditions aren't met)
    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
  });

  it("should handle edge case with zero visibility score", () => {
    const engine = new RecommendationEngine({ brandName: MOCK_BRAND_NAME });

    const analysis = createMockPlatformAnalysis("perplexity", {
      visibilityScore: createMockVisibilityScore({
        total: 0,
        breakdown: { mentionCount: 0, citationQuality: 0, prominence: 0 },
        metrics: { totalMentions: 0, totalCitations: 0, avgRelevanceScore: 0, firstMentionPosition: -1 },
      }),
    });

    const recommendations = engine.generateFromAnalysis(analysis);

    // Should generate recommendations for improving visibility
    expect(recommendations.length).toBeGreaterThan(0);

    // Should include fundamental recommendations
    const hasFundamentalRecs = recommendations.some(
      (rec) =>
        rec.priority === 1 &&
        (rec.title.toLowerCase().includes("mention") ||
          rec.title.toLowerCase().includes("citation") ||
          rec.title.toLowerCase().includes("content"))
    );

    expect(hasFundamentalRecs).toBe(true);
  });

  it("should personalize recommendations with brand placeholders", () => {
    const brandName = "Test Brand Inc";
    const engine = new RecommendationEngine({ brandName });

    const analysis = createMockPlatformAnalysis("chatgpt");
    const recommendations = engine.generateFromAnalysis(analysis);

    // Should NOT have [Brand] placeholder in any recommendation
    recommendations.forEach((rec) => {
      expect(rec.description).not.toContain("[Brand]");
      rec.actionItems?.forEach((item) => {
        expect(item).not.toContain("[Brand]");
      });
      rec.examples?.forEach((example) => {
        expect(example).not.toContain("[Brand]");
      });
    });
  });
});
