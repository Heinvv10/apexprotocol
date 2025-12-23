/**
 * Tests for AI Recommendation Impact Scoring Algorithm
 * Tests the weighted scoring system with four key factors:
 * - Platform reach (40%)
 * - Visibility gap (30%)
 * - Traffic gain (20%)
 * - Competitive advantage (10%)
 */

import { describe, it, expect } from "vitest";
import {
  IMPACT_SCORING_WEIGHTS,
  calculatePlatformReachScore,
  calculateVisibilityGapScore,
  calculateTrafficGainScore,
  calculateCompetitiveAdvantageScore,
  extractImpactFactors,
  calculateWeightedImpactScore,
  determinePriorityFromScore,
  calculateRecommendationImpactScore,
  deduplicateRecommendations,
  type VisibilityData,
  type PlatformVisibility,
  type ContentGap,
  type CompetitorMetrics,
  type AIRecommendationOutput,
  type GeneratedRecommendation,
  type ImpactScoreFactors,
} from "./recommendations";

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockPlatformVisibility = (
  overrides: Partial<PlatformVisibility> = {}
): PlatformVisibility => ({
  name: "ChatGPT",
  mentionRate: 50,
  averagePosition: 3,
  sentiment: "neutral",
  citationFrequency: 10,
  ...overrides,
});

const createMockContentGap = (
  overrides: Partial<ContentGap> = {}
): ContentGap => ({
  type: "missing_schema",
  description: "Missing structured data for product pages",
  severity: "high",
  affectedPlatforms: ["ChatGPT", "Claude"],
  ...overrides,
});

const createMockCompetitor = (
  overrides: Partial<CompetitorMetrics> = {}
): CompetitorMetrics => ({
  name: "Competitor A",
  mentionRate: 70,
  platforms: ["ChatGPT", "Claude", "Perplexity"],
  advantageAreas: ["content freshness"],
  ...overrides,
});

const createMockRecommendation = (
  overrides: Partial<AIRecommendationOutput> = {}
): AIRecommendationOutput => ({
  category: "content_optimization",
  priority: "high",
  impact: "high",
  effort: "moderate",
  title: "Improve content structure for AI visibility",
  description: "Add structured data and improve content organization",
  steps: ["Step 1: Add schema markup", "Step 2: Improve headings"],
  aiPlatforms: ["ChatGPT", "Claude"],
  expectedOutcome: "Increased visibility across AI platforms",
  estimatedTimeframe: "2-4 weeks",
  ...overrides,
});

const createMockVisibilityData = (
  overrides: Partial<VisibilityData> = {}
): VisibilityData => ({
  brandId: "test-brand-123",
  brandName: "Test Brand",
  platforms: [
    createMockPlatformVisibility({ name: "ChatGPT", mentionRate: 30 }),
    createMockPlatformVisibility({ name: "Claude", mentionRate: 25 }),
    createMockPlatformVisibility({ name: "Perplexity", mentionRate: 40 }),
    createMockPlatformVisibility({ name: "Gemini", mentionRate: 20 }),
  ],
  contentGaps: [
    createMockContentGap({ severity: "critical", type: "missing_schema" }),
    createMockContentGap({ severity: "high", type: "outdated_content" }),
  ],
  competitorData: [
    createMockCompetitor({ name: "Competitor A", mentionRate: 70 }),
    createMockCompetitor({ name: "Competitor B", mentionRate: 60 }),
  ],
  ...overrides,
});

// ============================================================================
// IMPACT_SCORING_WEIGHTS Tests
// ============================================================================

describe("IMPACT_SCORING_WEIGHTS", () => {
  it("should have correct default weights totaling 100%", () => {
    const totalWeight =
      IMPACT_SCORING_WEIGHTS.platformReach +
      IMPACT_SCORING_WEIGHTS.visibilityGap +
      IMPACT_SCORING_WEIGHTS.trafficGain +
      IMPACT_SCORING_WEIGHTS.competitiveAdvantage;

    // Use toBeCloseTo for floating point comparison
    expect(totalWeight).toBeCloseTo(1.0, 10);
  });

  it("should have platform reach at 40%", () => {
    expect(IMPACT_SCORING_WEIGHTS.platformReach).toBe(0.4);
  });

  it("should have visibility gap at 30%", () => {
    expect(IMPACT_SCORING_WEIGHTS.visibilityGap).toBe(0.3);
  });

  it("should have traffic gain at 20%", () => {
    expect(IMPACT_SCORING_WEIGHTS.trafficGain).toBe(0.2);
  });

  it("should have competitive advantage at 10%", () => {
    expect(IMPACT_SCORING_WEIGHTS.competitiveAdvantage).toBe(0.1);
  });
});

// ============================================================================
// calculatePlatformReachScore Tests
// ============================================================================

describe("calculatePlatformReachScore", () => {
  it("should return 25 for 1 platform", () => {
    const score = calculatePlatformReachScore(["ChatGPT"], 4);
    expect(score).toBe(25);
  });

  it("should return 50 for 2 platforms", () => {
    const score = calculatePlatformReachScore(["ChatGPT", "Claude"], 4);
    expect(score).toBe(50);
  });

  it("should return 75 for 3 platforms", () => {
    const score = calculatePlatformReachScore(
      ["ChatGPT", "Claude", "Perplexity"],
      4
    );
    expect(score).toBe(75);
  });

  it("should return 100 for 4+ platforms", () => {
    const score = calculatePlatformReachScore(
      ["ChatGPT", "Claude", "Perplexity", "Gemini"],
      4
    );
    expect(score).toBe(100);
  });

  it("should cap at 100 for more than 4 platforms", () => {
    const score = calculatePlatformReachScore(
      ["ChatGPT", "Claude", "Perplexity", "Gemini", "Other"],
      5
    );
    expect(score).toBe(100);
  });

  it("should add bonus when targeting all available platforms", () => {
    // Targeting all 2 platforms in data
    const score = calculatePlatformReachScore(["ChatGPT", "Claude"], 2);
    // Base 50 + 10 bonus = 60
    expect(score).toBe(60);
  });

  it("should return 0 for empty platforms array", () => {
    const score = calculatePlatformReachScore([], 4);
    expect(score).toBe(0);
  });
});

// ============================================================================
// calculateVisibilityGapScore Tests
// ============================================================================

describe("calculateVisibilityGapScore", () => {
  it("should return 50 for empty platforms array", () => {
    const score = calculateVisibilityGapScore([], ["ChatGPT"]);
    expect(score).toBe(50);
  });

  it("should return 50 when no platforms match targeted platforms", () => {
    const platforms = [
      createMockPlatformVisibility({ name: "Gemini", mentionRate: 80 }),
    ];
    const score = calculateVisibilityGapScore(platforms, ["ChatGPT"]);
    expect(score).toBe(50);
  });

  it("should return high score (80-100) for critical visibility gap (>50%)", () => {
    const platforms = [
      createMockPlatformVisibility({ name: "ChatGPT", mentionRate: 30 }), // 70% gap
    ];
    const score = calculateVisibilityGapScore(platforms, ["ChatGPT"]);
    expect(score).toBeGreaterThanOrEqual(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should return high score (60-79) for significant gap (30-50%)", () => {
    const platforms = [
      createMockPlatformVisibility({ name: "ChatGPT", mentionRate: 60 }), // 40% gap
    ];
    const score = calculateVisibilityGapScore(platforms, ["ChatGPT"]);
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThan(80);
  });

  it("should return medium score (40-59) for moderate gap (15-30%)", () => {
    const platforms = [
      createMockPlatformVisibility({ name: "ChatGPT", mentionRate: 75 }), // 25% gap
    ];
    const score = calculateVisibilityGapScore(platforms, ["ChatGPT"]);
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThan(60);
  });

  it("should return low score (0-39) for minor gap (<15%)", () => {
    const platforms = [
      createMockPlatformVisibility({ name: "ChatGPT", mentionRate: 90 }), // 10% gap
    ];
    const score = calculateVisibilityGapScore(platforms, ["ChatGPT"]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(40);
  });

  it("should calculate average gap across multiple platforms", () => {
    const platforms = [
      createMockPlatformVisibility({ name: "ChatGPT", mentionRate: 20 }), // 80% gap
      createMockPlatformVisibility({ name: "Claude", mentionRate: 40 }), // 60% gap
      // Average gap = 70%, which is critical
    ];
    const score = calculateVisibilityGapScore(platforms, ["ChatGPT", "Claude"]);
    expect(score).toBeGreaterThanOrEqual(80);
  });
});

// ============================================================================
// calculateTrafficGainScore Tests
// ============================================================================

describe("calculateTrafficGainScore", () => {
  it("should return higher score for high impact recommendations", () => {
    const highImpactScore = calculateTrafficGainScore("high", "moderate", [], []);
    const lowImpactScore = calculateTrafficGainScore("low", "moderate", [], []);

    expect(highImpactScore).toBeGreaterThan(lowImpactScore);
  });

  it("should return higher score for quick_win effort", () => {
    const quickWinScore = calculateTrafficGainScore("medium", "quick_win", [], []);
    const majorScore = calculateTrafficGainScore("medium", "major", [], []);

    expect(quickWinScore).toBeGreaterThan(majorScore);
  });

  it("should add bonus for addressing critical content gaps", () => {
    const contentGaps: ContentGap[] = [
      createMockContentGap({
        severity: "critical",
        affectedPlatforms: ["ChatGPT"],
      }),
    ];

    const withGapScore = calculateTrafficGainScore(
      "medium",
      "moderate",
      contentGaps,
      ["ChatGPT"]
    );
    const withoutGapScore = calculateTrafficGainScore(
      "medium",
      "moderate",
      [],
      ["ChatGPT"]
    );

    expect(withGapScore).toBeGreaterThan(withoutGapScore);
  });

  it("should cap score at 100", () => {
    const contentGaps: ContentGap[] = [
      createMockContentGap({
        severity: "critical",
        affectedPlatforms: ["ChatGPT"],
      }),
    ];

    const score = calculateTrafficGainScore(
      "high",
      "quick_win",
      contentGaps,
      ["ChatGPT"]
    );
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should return base score for minimal inputs", () => {
    const score = calculateTrafficGainScore("low", "major", [], []);
    // Base 50 + 5 (low impact) + 0 (major effort) = 55
    expect(score).toBe(55);
  });
});

// ============================================================================
// calculateCompetitiveAdvantageScore Tests
// ============================================================================

describe("calculateCompetitiveAdvantageScore", () => {
  it("should return 50 for empty competitors array", () => {
    const platforms = [createMockPlatformVisibility()];
    const score = calculateCompetitiveAdvantageScore([], platforms, ["ChatGPT"]);
    expect(score).toBe(50);
  });

  it("should return 50 for empty platforms array", () => {
    const competitors = [createMockCompetitor()];
    const score = calculateCompetitiveAdvantageScore(competitors, [], ["ChatGPT"]);
    expect(score).toBe(50);
  });

  it("should return high score for large competitive gap (>40%)", () => {
    const platforms = [
      createMockPlatformVisibility({ name: "ChatGPT", mentionRate: 20 }),
    ];
    const competitors = [createMockCompetitor({ mentionRate: 70 })]; // 50% gap

    const score = calculateCompetitiveAdvantageScore(
      competitors,
      platforms,
      ["ChatGPT"]
    );
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it("should return moderate score for significant gap (20-40%)", () => {
    const platforms = [
      createMockPlatformVisibility({ name: "ChatGPT", mentionRate: 40 }),
    ];
    const competitors = [createMockCompetitor({ mentionRate: 70 })]; // 30% gap

    const score = calculateCompetitiveAdvantageScore(
      competitors,
      platforms,
      ["ChatGPT"]
    );
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThan(80);
  });

  it("should return low score when ahead of competitors", () => {
    const platforms = [
      createMockPlatformVisibility({ name: "ChatGPT", mentionRate: 80 }),
    ];
    const competitors = [createMockCompetitor({ mentionRate: 60 })]; // No gap (ahead)

    const score = calculateCompetitiveAdvantageScore(
      competitors,
      platforms,
      ["ChatGPT"]
    );
    expect(score).toBeLessThan(40); // Competitive gap is 0 or negative
  });

  it("should average across multiple competitors", () => {
    const platforms = [
      createMockPlatformVisibility({ name: "ChatGPT", mentionRate: 30 }),
    ];
    const competitors = [
      createMockCompetitor({ mentionRate: 70 }), // 40% gap
      createMockCompetitor({ mentionRate: 50 }), // 20% gap
      // Average competitor rate = 60%, gap = 30%
    ];

    const score = calculateCompetitiveAdvantageScore(
      competitors,
      platforms,
      ["ChatGPT"]
    );
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThan(80);
  });
});

// ============================================================================
// extractImpactFactors Tests
// ============================================================================

describe("extractImpactFactors", () => {
  it("should extract all four impact factors", () => {
    const recommendation = createMockRecommendation();
    const visibilityData = createMockVisibilityData();

    const factors = extractImpactFactors(recommendation, visibilityData);

    expect(factors).toHaveProperty("platformReachScore");
    expect(factors).toHaveProperty("visibilityGapScore");
    expect(factors).toHaveProperty("trafficGainScore");
    expect(factors).toHaveProperty("competitiveAdvantageScore");
  });

  it("should return scores in valid range (0-100)", () => {
    const recommendation = createMockRecommendation();
    const visibilityData = createMockVisibilityData();

    const factors = extractImpactFactors(recommendation, visibilityData);

    expect(factors.platformReachScore).toBeGreaterThanOrEqual(0);
    expect(factors.platformReachScore).toBeLessThanOrEqual(100);
    expect(factors.visibilityGapScore).toBeGreaterThanOrEqual(0);
    expect(factors.visibilityGapScore).toBeLessThanOrEqual(100);
    expect(factors.trafficGainScore).toBeGreaterThanOrEqual(0);
    expect(factors.trafficGainScore).toBeLessThanOrEqual(100);
    expect(factors.competitiveAdvantageScore).toBeGreaterThanOrEqual(0);
    expect(factors.competitiveAdvantageScore).toBeLessThanOrEqual(100);
  });

  it("should handle empty visibility data gracefully", () => {
    const recommendation = createMockRecommendation();
    const visibilityData = createMockVisibilityData({
      platforms: [],
      contentGaps: [],
      competitorData: [],
    });

    const factors = extractImpactFactors(recommendation, visibilityData);

    // Should return default scores
    expect(factors.visibilityGapScore).toBe(50);
    expect(factors.competitiveAdvantageScore).toBe(50);
  });
});

// ============================================================================
// calculateWeightedImpactScore Tests
// ============================================================================

describe("calculateWeightedImpactScore", () => {
  it("should apply correct weights to factors", () => {
    const factors: ImpactScoreFactors = {
      platformReachScore: 100,
      visibilityGapScore: 100,
      trafficGainScore: 100,
      competitiveAdvantageScore: 100,
    };

    const score = calculateWeightedImpactScore(factors);
    // 100 * 0.4 + 100 * 0.3 + 100 * 0.2 + 100 * 0.1 = 100
    expect(score).toBe(100);
  });

  it("should calculate weighted average correctly", () => {
    const factors: ImpactScoreFactors = {
      platformReachScore: 80, // 0.4 * 80 = 32
      visibilityGapScore: 60, // 0.3 * 60 = 18
      trafficGainScore: 40, // 0.2 * 40 = 8
      competitiveAdvantageScore: 20, // 0.1 * 20 = 2
    };

    const score = calculateWeightedImpactScore(factors);
    // 32 + 18 + 8 + 2 = 60
    expect(score).toBe(60);
  });

  it("should allow custom weights", () => {
    const factors: ImpactScoreFactors = {
      platformReachScore: 100,
      visibilityGapScore: 0,
      trafficGainScore: 0,
      competitiveAdvantageScore: 0,
    };

    const customWeights = {
      platformReach: 1.0,
      visibilityGap: 0,
      trafficGain: 0,
      competitiveAdvantage: 0,
    };

    const score = calculateWeightedImpactScore(factors, customWeights);
    expect(score).toBe(100);
  });

  it("should return 0 for all zero factors", () => {
    const factors: ImpactScoreFactors = {
      platformReachScore: 0,
      visibilityGapScore: 0,
      trafficGainScore: 0,
      competitiveAdvantageScore: 0,
    };

    const score = calculateWeightedImpactScore(factors);
    expect(score).toBe(0);
  });

  it("should round to 2 decimal places", () => {
    const factors: ImpactScoreFactors = {
      platformReachScore: 33,
      visibilityGapScore: 33,
      trafficGainScore: 33,
      competitiveAdvantageScore: 33,
    };

    const score = calculateWeightedImpactScore(factors);
    // Should be 33 (all same values, weighted sum = 33)
    expect(score).toBe(33);
  });
});

// ============================================================================
// determinePriorityFromScore Tests
// ============================================================================

describe("determinePriorityFromScore", () => {
  it('should return "critical" for score >= 80 with 3+ platforms and high visibility gap', () => {
    const priority = determinePriorityFromScore(85, 3, 85);
    expect(priority).toBe("critical");
  });

  it('should return "high" for score >= 60', () => {
    const priority = determinePriorityFromScore(65, 2, 50);
    expect(priority).toBe("high");
  });

  it('should return "high" for 2+ platforms with significant visibility gap', () => {
    const priority = determinePriorityFromScore(55, 2, 65);
    expect(priority).toBe("high");
  });

  it('should return "medium" for score >= 40', () => {
    const priority = determinePriorityFromScore(45, 1, 30);
    expect(priority).toBe("medium");
  });

  it('should return "medium" for moderate visibility gap', () => {
    const priority = determinePriorityFromScore(35, 1, 45);
    expect(priority).toBe("medium");
  });

  it('should return "low" for score < 40 and low visibility gap', () => {
    const priority = determinePriorityFromScore(30, 1, 20);
    expect(priority).toBe("low");
  });

  it("should prioritize score threshold for critical over platform count", () => {
    // Score is high but only 2 platforms - should be high, not critical
    const priority = determinePriorityFromScore(85, 2, 85);
    expect(priority).toBe("high");
  });
});

// ============================================================================
// calculateRecommendationImpactScore Tests
// ============================================================================

describe("calculateRecommendationImpactScore", () => {
  it("should return score in valid range (0-100)", () => {
    const recommendation = createMockRecommendation();
    const visibilityData = createMockVisibilityData();

    const score = calculateRecommendationImpactScore(
      recommendation,
      visibilityData
    );

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should give higher score to critical priority recommendations", () => {
    const criticalRec = createMockRecommendation({ priority: "critical" });
    const lowRec = createMockRecommendation({ priority: "low" });
    const visibilityData = createMockVisibilityData();

    const criticalScore = calculateRecommendationImpactScore(
      criticalRec,
      visibilityData
    );
    const lowScore = calculateRecommendationImpactScore(lowRec, visibilityData);

    expect(criticalScore).toBeGreaterThan(lowScore);
  });

  it("should give higher score when addressing critical content gaps", () => {
    const recAddressingGap = createMockRecommendation({
      title: "Fix missing_schema issue",
      description: "Address the missing_schema content gap",
    });
    const genericRec = createMockRecommendation({
      title: "Generic improvement",
      description: "General optimization",
    });

    const visibilityData = createMockVisibilityData({
      contentGaps: [
        createMockContentGap({ severity: "critical", type: "missing_schema" }),
      ],
    });

    const gapScore = calculateRecommendationImpactScore(
      recAddressingGap,
      visibilityData
    );
    const genericScore = calculateRecommendationImpactScore(
      genericRec,
      visibilityData
    );

    expect(gapScore).toBeGreaterThan(genericScore);
  });

  it("should give higher score for targeting low-visibility platforms", () => {
    const visibilityData = createMockVisibilityData({
      platforms: [
        createMockPlatformVisibility({ name: "ChatGPT", mentionRate: 10 }), // Low visibility
        createMockPlatformVisibility({ name: "Claude", mentionRate: 80 }), // High visibility
      ],
    });

    const lowVisRec = createMockRecommendation({
      aiPlatforms: ["ChatGPT"], // Targets low visibility platform
    });
    const highVisRec = createMockRecommendation({
      aiPlatforms: ["Claude"], // Targets high visibility platform
    });

    const lowVisScore = calculateRecommendationImpactScore(
      lowVisRec,
      visibilityData
    );
    const highVisScore = calculateRecommendationImpactScore(
      highVisRec,
      visibilityData
    );

    expect(lowVisScore).toBeGreaterThan(highVisScore);
  });

  it("should handle empty visibility data", () => {
    const recommendation = createMockRecommendation();
    const visibilityData = createMockVisibilityData({
      platforms: [],
      contentGaps: [],
      competitorData: [],
    });

    const score = calculateRecommendationImpactScore(
      recommendation,
      visibilityData
    );

    // Should still return a valid score
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should give higher score for recommendations targeting more platforms", () => {
    const multiPlatformRec = createMockRecommendation({
      aiPlatforms: ["ChatGPT", "Claude", "Perplexity", "Gemini"],
    });
    const singlePlatformRec = createMockRecommendation({
      aiPlatforms: ["ChatGPT"],
    });
    const visibilityData = createMockVisibilityData();

    const multiScore = calculateRecommendationImpactScore(
      multiPlatformRec,
      visibilityData
    );
    const singleScore = calculateRecommendationImpactScore(
      singlePlatformRec,
      visibilityData
    );

    expect(multiScore).toBeGreaterThan(singleScore);
  });

  it("should return integer score (rounded)", () => {
    const recommendation = createMockRecommendation();
    const visibilityData = createMockVisibilityData();

    const score = calculateRecommendationImpactScore(
      recommendation,
      visibilityData
    );

    expect(Number.isInteger(score)).toBe(true);
  });
});

// ============================================================================
// deduplicateRecommendations Tests
// ============================================================================

describe("deduplicateRecommendations", () => {
  const createMockGeneratedRecommendation = (
    overrides: Partial<GeneratedRecommendation> = {}
  ): GeneratedRecommendation => ({
    ...createMockRecommendation(),
    impactScore: 75,
    ...overrides,
  });

  it("should identify exact duplicate titles", () => {
    const recommendations: GeneratedRecommendation[] = [
      createMockGeneratedRecommendation({ title: "Improve SEO" }),
      createMockGeneratedRecommendation({ title: "Improve SEO" }),
    ];

    const result = deduplicateRecommendations(recommendations);

    expect(result.unique.length).toBe(1);
    expect(result.duplicates.length).toBe(1);
  });

  it("should identify case-insensitive duplicates", () => {
    const recommendations: GeneratedRecommendation[] = [
      createMockGeneratedRecommendation({ title: "Improve SEO" }),
      createMockGeneratedRecommendation({ title: "improve seo" }),
    ];

    const result = deduplicateRecommendations(recommendations);

    expect(result.unique.length).toBe(1);
    expect(result.duplicates.length).toBe(1);
  });

  it("should identify duplicates against existing titles", () => {
    const recommendations: GeneratedRecommendation[] = [
      createMockGeneratedRecommendation({ title: "New Recommendation" }),
      createMockGeneratedRecommendation({ title: "Existing Title" }),
    ];

    const existingTitles = ["Existing Title"];
    const result = deduplicateRecommendations(recommendations, existingTitles);

    expect(result.unique.length).toBe(1);
    expect(result.unique[0].title).toBe("New Recommendation");
    expect(result.duplicates.length).toBe(1);
  });

  it("should identify similar titles with >80% similarity", () => {
    // These titles share 5/6 words = 83% Jaccard similarity
    const recommendations: GeneratedRecommendation[] = [
      createMockGeneratedRecommendation({
        title: "Improve content structure for AI visibility now",
      }),
      createMockGeneratedRecommendation({
        title: "Improve content structure for AI visibility",
      }),
    ];

    const result = deduplicateRecommendations(recommendations);

    expect(result.unique.length).toBe(1);
    expect(result.duplicates.length).toBe(1);
  });

  it("should keep dissimilar titles", () => {
    const recommendations: GeneratedRecommendation[] = [
      createMockGeneratedRecommendation({ title: "Add schema markup" }),
      createMockGeneratedRecommendation({ title: "Build citations" }),
      createMockGeneratedRecommendation({ title: "Improve content" }),
    ];

    const result = deduplicateRecommendations(recommendations);

    expect(result.unique.length).toBe(3);
    expect(result.duplicates.length).toBe(0);
  });

  it("should handle empty recommendations array", () => {
    const result = deduplicateRecommendations([]);

    expect(result.unique.length).toBe(0);
    expect(result.duplicates.length).toBe(0);
  });

  it("should normalize titles by removing special characters", () => {
    const recommendations: GeneratedRecommendation[] = [
      createMockGeneratedRecommendation({ title: "Improve SEO!" }),
      createMockGeneratedRecommendation({ title: "Improve SEO" }),
    ];

    const result = deduplicateRecommendations(recommendations);

    expect(result.unique.length).toBe(1);
    expect(result.duplicates.length).toBe(1);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("Impact Scoring Integration", () => {
  it("should produce consistent scores for same input", () => {
    const recommendation = createMockRecommendation();
    const visibilityData = createMockVisibilityData();

    const score1 = calculateRecommendationImpactScore(
      recommendation,
      visibilityData
    );
    const score2 = calculateRecommendationImpactScore(
      recommendation,
      visibilityData
    );

    expect(score1).toBe(score2);
  });

  it("should rank recommendations correctly by score", () => {
    const visibilityData = createMockVisibilityData();

    const criticalRec = createMockRecommendation({
      priority: "critical",
      impact: "high",
      effort: "quick_win",
      aiPlatforms: ["ChatGPT", "Claude", "Perplexity", "Gemini"],
    });

    const lowRec = createMockRecommendation({
      priority: "low",
      impact: "low",
      effort: "major",
      aiPlatforms: ["ChatGPT"],
    });

    const criticalScore = calculateRecommendationImpactScore(
      criticalRec,
      visibilityData
    );
    const lowScore = calculateRecommendationImpactScore(lowRec, visibilityData);

    expect(criticalScore).toBeGreaterThan(lowScore);
    // Critical should have significantly higher score
    expect(criticalScore - lowScore).toBeGreaterThan(20);
  });

  it("should handle real-world scenario with multiple recommendations", () => {
    const visibilityData = createMockVisibilityData({
      platforms: [
        createMockPlatformVisibility({ name: "ChatGPT", mentionRate: 15 }),
        createMockPlatformVisibility({ name: "Claude", mentionRate: 20 }),
        createMockPlatformVisibility({ name: "Perplexity", mentionRate: 25 }),
        createMockPlatformVisibility({ name: "Gemini", mentionRate: 10 }),
      ],
      contentGaps: [
        createMockContentGap({
          severity: "critical",
          type: "missing_schema",
          affectedPlatforms: ["ChatGPT", "Claude"],
        }),
      ],
      competitorData: [
        createMockCompetitor({ mentionRate: 75 }),
        createMockCompetitor({ mentionRate: 65 }),
      ],
    });

    const recommendations: AIRecommendationOutput[] = [
      createMockRecommendation({
        title: "Add missing_schema markup",
        priority: "critical",
        impact: "high",
        aiPlatforms: ["ChatGPT", "Claude", "Perplexity", "Gemini"],
      }),
      createMockRecommendation({
        title: "Optimize content structure",
        priority: "high",
        impact: "medium",
        aiPlatforms: ["ChatGPT", "Claude"],
      }),
      createMockRecommendation({
        title: "Minor formatting fix",
        priority: "low",
        impact: "low",
        aiPlatforms: ["ChatGPT"],
      }),
    ];

    const scores = recommendations.map((rec) =>
      calculateRecommendationImpactScore(rec, visibilityData)
    );

    // Scores should be in descending order
    expect(scores[0]).toBeGreaterThan(scores[1]);
    expect(scores[1]).toBeGreaterThan(scores[2]);

    // All scores should be valid
    scores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
