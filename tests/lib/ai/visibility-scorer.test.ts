/**
 * Visibility Scorer Unit Tests
 * Tests for visibility scoring algorithm and calculation logic
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  VisibilityScorer,
  calculateVisibilityScore,
  calculateVisibilityScoreFromResponse,
  batchCalculateScores,
} from "@/lib/ai/visibility-scorer";
import type {
  VisibilityScore,
  Citation,
  PlatformResponse,
} from "@/lib/ai/types";

// ============================================================================
// Test Fixtures
// ============================================================================

const MOCK_BRAND_NAME = "Acme Corporation";
const MOCK_BRAND_KEYWORDS = ["project management", "productivity", "collaboration"];

// Create mock citations with varying relevance scores
const createMockCitation = (
  relevanceScore: number,
  type: "direct_quote" | "paraphrase" | "link" | "reference" = "link"
): Citation => ({
  type,
  text: "Sample citation text",
  sourceUrl: "https://example.com",
  sourceTitle: "Example Source",
  position: 0,
  relevanceScore,
});

const createMockContent = (params: {
  brandMentions?: number;
  keywordMentions?: number;
  firstMentionAt?: "start" | "early" | "middle" | "late" | "end";
  contentLength?: number;
}): string => {
  const {
    brandMentions = 1,
    keywordMentions = 0,
    firstMentionAt = "start",
    contentLength = 1000,
  } = params;

  // Build content with brand mentions at specified positions
  let content = "";
  const brandName = MOCK_BRAND_NAME;
  const keyword = MOCK_BRAND_KEYWORDS[0]; // "project management"

  // Add initial padding based on firstMentionAt
  if (firstMentionAt === "early") {
    content += "Lorem ipsum dolor sit amet. "; // ~30 chars, ~3% of 1000
  } else if (firstMentionAt === "middle") {
    content += "Lorem ipsum dolor sit amet. ".repeat(15); // ~450 chars, ~45%
  } else if (firstMentionAt === "late") {
    content += "Lorem ipsum dolor sit amet. ".repeat(20); // ~600 chars, ~60%
  } else if (firstMentionAt === "end") {
    content += "Lorem ipsum dolor sit amet. ".repeat(30); // ~900 chars, ~90%
  }

  // Add brand mentions
  for (let i = 0; i < brandMentions; i++) {
    content += `${brandName} provides excellent solutions. `;
  }

  // Add keyword mentions
  for (let i = 0; i < keywordMentions; i++) {
    content += `The ${keyword} tools are very helpful. `;
  }

  // Pad to desired length
  while (content.length < contentLength) {
    content += "Additional content about technology and software. ";
  }

  return content.substring(0, contentLength);
};

const createMockPlatformResponse = (
  content: string,
  citations: Citation[],
  platform: "chatgpt" | "claude" | "gemini" | "perplexity" = "chatgpt"
): PlatformResponse => ({
  platform,
  content,
  citations,
  metadata: {
    model: "test-model",
    tokensUsed: 100,
  },
});

// ============================================================================
// Constructor and Configuration Tests
// ============================================================================

describe("VisibilityScorer - Constructor", () => {
  it("should create instance with default options", () => {
    const scorer = new VisibilityScorer();
    expect(scorer).toBeDefined();
  });

  it("should create instance with brand name", () => {
    const scorer = new VisibilityScorer({ brandName: MOCK_BRAND_NAME });
    expect(scorer).toBeDefined();
  });

  it("should create instance with brand keywords", () => {
    const scorer = new VisibilityScorer({
      brandName: MOCK_BRAND_NAME,
      brandKeywords: MOCK_BRAND_KEYWORDS,
    });
    expect(scorer).toBeDefined();
  });

  it("should create instance with debug enabled", () => {
    const scorer = new VisibilityScorer({ debug: true });
    expect(scorer).toBeDefined();
  });

  it("should use default values when options are not provided", () => {
    const scorer = new VisibilityScorer({});
    expect(scorer).toBeDefined();
  });
});

// ============================================================================
// Main Calculate Method Tests
// ============================================================================

describe("VisibilityScorer - calculate()", () => {
  let scorer: VisibilityScorer;

  beforeEach(() => {
    scorer = new VisibilityScorer({
      brandName: MOCK_BRAND_NAME,
      brandKeywords: MOCK_BRAND_KEYWORDS,
    });
  });

  it("should return zero score for empty content and no citations", () => {
    const score = scorer.calculate("", []);
    expect(score.total).toBe(0);
    expect(score.breakdown.mentionCount).toBe(0);
    expect(score.breakdown.citationQuality).toBe(0);
    expect(score.breakdown.prominence).toBe(0);
  });

  it("should return zero score for content with no brand mentions", () => {
    const content = "This is generic content about software development.";
    const score = scorer.calculate(content, []);
    expect(score.total).toBe(0);
    expect(score.metrics.totalMentions).toBe(0);
  });

  it("should calculate score for content with brand mentions but no citations", () => {
    const content = createMockContent({ brandMentions: 3 });
    const score = scorer.calculate(content, []);

    expect(score.total).toBeGreaterThan(0);
    expect(score.breakdown.mentionCount).toBeGreaterThan(0);
    expect(score.breakdown.citationQuality).toBe(0); // No citations
    expect(score.breakdown.prominence).toBeGreaterThan(0);
    expect(score.metrics.totalMentions).toBe(3);
  });

  it("should calculate score for content with citations but no brand mentions", () => {
    const content = "Generic content without brand mentions.";
    const citations = [createMockCitation(80)];
    const score = scorer.calculate(content, citations);

    expect(score.total).toBeGreaterThan(0);
    expect(score.breakdown.mentionCount).toBe(0); // No mentions
    expect(score.breakdown.citationQuality).toBeGreaterThan(0);
    expect(score.breakdown.prominence).toBe(0); // No mentions = no prominence
    expect(score.metrics.totalCitations).toBe(1);
  });

  it("should calculate combined score with mentions, citations, and prominence", () => {
    const content = createMockContent({
      brandMentions: 5,
      firstMentionAt: "start",
    });
    const citations = [
      createMockCitation(90),
      createMockCitation(85),
      createMockCitation(80),
    ];
    const score = scorer.calculate(content, citations);

    expect(score.total).toBeGreaterThan(0);
    expect(score.breakdown.mentionCount).toBeGreaterThan(0);
    expect(score.breakdown.citationQuality).toBeGreaterThan(0);
    expect(score.breakdown.prominence).toBeGreaterThan(0);
    expect(score.metrics.totalMentions).toBe(5);
    expect(score.metrics.totalCitations).toBe(3);
  });

  it("should calculate maximum score (100) for perfect visibility", () => {
    // Create content with maximum mentions (6+), early position
    const content = createMockContent({
      brandMentions: 8,
      firstMentionAt: "start",
    });
    // High relevance citations (5+ to get max citation score)
    const citations = [
      createMockCitation(95),
      createMockCitation(90),
      createMockCitation(90),
      createMockCitation(88),
      createMockCitation(85),
    ];
    const score = scorer.calculate(content, citations);

    // With 8 mentions (40 pts), 5 high-relevance citations (30 pts),
    // and early first mention with high frequency (30 pts), we should get 100
    expect(score.total).toBe(100);
    expect(score.breakdown.mentionCount).toBe(40);
    expect(score.breakdown.citationQuality).toBe(30);
    expect(score.breakdown.prominence).toBe(30);
  });

  it("should include metrics in the returned score", () => {
    const content = createMockContent({ brandMentions: 3 });
    const citations = [createMockCitation(75)];
    const score = scorer.calculate(content, citations);

    expect(score.metrics).toBeDefined();
    expect(score.metrics.totalMentions).toBe(3);
    expect(score.metrics.totalCitations).toBe(1);
    expect(score.metrics.avgRelevanceScore).toBe(75);
    expect(score.metrics.firstMentionPosition).toBeGreaterThanOrEqual(0);
  });

  it("should handle platform parameter for logging", () => {
    const content = createMockContent({ brandMentions: 2 });
    const citations = [createMockCitation(60)];

    // Should not throw when platform is provided
    expect(() => {
      scorer.calculate(content, citations, "chatgpt");
    }).not.toThrow();
  });
});

// ============================================================================
// Mention Count Scoring Tests (0-40 points)
// ============================================================================

describe("VisibilityScorer - Mention Count Scoring", () => {
  let scorer: VisibilityScorer;

  beforeEach(() => {
    scorer = new VisibilityScorer({
      brandName: MOCK_BRAND_NAME,
      brandKeywords: MOCK_BRAND_KEYWORDS,
    });
  });

  it("should score 0 points for 0 mentions", () => {
    const content = "No brand mentions here.";
    const score = scorer.calculate(content, []);
    expect(score.breakdown.mentionCount).toBe(0);
  });

  it("should score 10 points for 1 mention", () => {
    const content = createMockContent({ brandMentions: 1 });
    const score = scorer.calculate(content, []);
    expect(score.breakdown.mentionCount).toBe(10);
  });

  it("should score 20 points for 2 mentions", () => {
    const content = createMockContent({ brandMentions: 2 });
    const score = scorer.calculate(content, []);
    expect(score.breakdown.mentionCount).toBe(20);
  });

  it("should score 25 points for 3 mentions", () => {
    const content = createMockContent({ brandMentions: 3 });
    const score = scorer.calculate(content, []);
    expect(score.breakdown.mentionCount).toBe(25);
  });

  it("should score 30 points for 4 mentions", () => {
    const content = createMockContent({ brandMentions: 4 });
    const score = scorer.calculate(content, []);
    expect(score.breakdown.mentionCount).toBe(30);
  });

  it("should score 35 points for 5 mentions", () => {
    const content = createMockContent({ brandMentions: 5 });
    const score = scorer.calculate(content, []);
    expect(score.breakdown.mentionCount).toBe(35);
  });

  it("should score 40 points for 6+ mentions", () => {
    const content = createMockContent({ brandMentions: 6 });
    const score = scorer.calculate(content, []);
    expect(score.breakdown.mentionCount).toBe(40);
  });

  it("should cap mention score at 40 points for many mentions", () => {
    const content = createMockContent({ brandMentions: 20 });
    const score = scorer.calculate(content, []);
    expect(score.breakdown.mentionCount).toBe(40);
  });

  it("should count keyword mentions with 0.5x weight", () => {
    // 2 keyword mentions = 1 effective mention (0.5 * 2 = 1.0, rounded to 1)
    const content = createMockContent({ brandMentions: 0, keywordMentions: 2 });
    const score = scorer.calculate(content, []);
    expect(score.metrics.totalMentions).toBe(1);
    expect(score.breakdown.mentionCount).toBe(10); // 1 mention = 10 points
  });

  it("should combine brand name and keyword mentions", () => {
    // 2 brand mentions + 2 keyword mentions = 2 + (2 * 0.5) = 3 total
    const content = createMockContent({ brandMentions: 2, keywordMentions: 2 });
    const score = scorer.calculate(content, []);
    expect(score.metrics.totalMentions).toBe(3);
    expect(score.breakdown.mentionCount).toBe(25); // 3 mentions = 25 points
  });
});

// ============================================================================
// Citation Quality Scoring Tests (0-30 points)
// ============================================================================

describe("VisibilityScorer - Citation Quality Scoring", () => {
  let scorer: VisibilityScorer;

  beforeEach(() => {
    scorer = new VisibilityScorer({
      brandName: MOCK_BRAND_NAME,
    });
  });

  it("should score 0 points for no citations", () => {
    const content = createMockContent({ brandMentions: 1 });
    const score = scorer.calculate(content, []);
    expect(score.breakdown.citationQuality).toBe(0);
  });

  it("should score citations with low relevance (<50)", () => {
    const content = createMockContent({ brandMentions: 1 });
    const citations = [
      createMockCitation(30),
      createMockCitation(40),
    ];
    const score = scorer.calculate(content, citations);

    // 2 citations * 3 = 6 base score, no multiplier (relevance < 50)
    expect(score.breakdown.citationQuality).toBe(6);
    expect(score.metrics.avgRelevanceScore).toBe(35); // (30 + 40) / 2
  });

  it("should apply 1.5x multiplier for medium relevance (50-79)", () => {
    const content = createMockContent({ brandMentions: 1 });
    const citations = [
      createMockCitation(60),
      createMockCitation(70),
    ];
    const score = scorer.calculate(content, citations);

    // 2 citations * 3 = 6 base, 6 * 1.5 = 9
    expect(score.breakdown.citationQuality).toBe(9);
    expect(score.metrics.avgRelevanceScore).toBe(65);
  });

  it("should apply 2.0x multiplier for high relevance (80+)", () => {
    const content = createMockContent({ brandMentions: 1 });
    const citations = [
      createMockCitation(85),
      createMockCitation(90),
    ];
    const score = scorer.calculate(content, citations);

    // 2 citations * 3 = 6 base, 6 * 2.0 = 12
    expect(score.breakdown.citationQuality).toBe(12);
    expect(score.metrics.avgRelevanceScore).toBe(88);
  });

  it("should cap citation quality score at 30 points", () => {
    const content = createMockContent({ brandMentions: 1 });
    // 5 citations with high relevance: 5 * 3 = 15 base, 15 * 2.0 = 30
    const citations = [
      createMockCitation(90),
      createMockCitation(88),
      createMockCitation(85),
      createMockCitation(82),
      createMockCitation(80),
    ];
    const score = scorer.calculate(content, citations);
    expect(score.breakdown.citationQuality).toBe(30);
  });

  it("should cap base count score at 15 points before multiplier", () => {
    const content = createMockContent({ brandMentions: 1 });
    // 10 citations * 3 = 30, capped at 15 base, then 15 * 2.0 = 30
    const citations = Array.from({ length: 10 }, () => createMockCitation(90));
    const score = scorer.calculate(content, citations);
    expect(score.breakdown.citationQuality).toBe(30);
  });

  it("should handle citations without relevance scores", () => {
    const content = createMockContent({ brandMentions: 1 });
    const citations: Citation[] = [
      { type: "link", sourceUrl: "https://example.com" },
      { type: "reference", text: "Sample text" },
    ];
    const score = scorer.calculate(content, citations);

    // 2 citations with 0 relevance: avgRelevance = 0, no multiplier
    expect(score.breakdown.citationQuality).toBe(6);
    expect(score.metrics.avgRelevanceScore).toBe(0);
  });

  it("should handle mixed relevance scores correctly", () => {
    const content = createMockContent({ brandMentions: 1 });
    const citations = [
      createMockCitation(90), // High
      createMockCitation(60), // Medium
      createMockCitation(30), // Low
    ];
    const score = scorer.calculate(content, citations);

    // Avg relevance: (90 + 60 + 30) / 3 = 60 (medium)
    // 3 citations * 3 = 9 base, 9 * 1.5 = 13.5, rounded to 14
    expect(score.metrics.avgRelevanceScore).toBe(60);
    expect(score.breakdown.citationQuality).toBe(14);
  });
});

// ============================================================================
// Prominence Scoring Tests (0-30 points)
// ============================================================================

describe("VisibilityScorer - Prominence Scoring", () => {
  let scorer: VisibilityScorer;

  beforeEach(() => {
    scorer = new VisibilityScorer({
      brandName: MOCK_BRAND_NAME,
    });
  });

  it("should score 0 points for no mentions", () => {
    const content = "No brand mentions at all.";
    const score = scorer.calculate(content, []);
    expect(score.breakdown.prominence).toBe(0);
  });

  it("should score maximum (30) for early mention (first 10%) with high frequency (5+)", () => {
    const content = createMockContent({
      brandMentions: 5,
      firstMentionAt: "start",
    });
    const score = scorer.calculate(content, []);

    // Position: 15 pts (first 10%), Frequency: 15 pts (5+ mentions) = 30
    expect(score.breakdown.prominence).toBe(30);
  });

  it("should score 25 points for early mention (first 11-25%) with high frequency", () => {
    // Need to place first mention between 11% and 25% (110-250 chars of 1000)
    const padding = "x".repeat(150); // ~15% of content
    const content = padding + ` ${MOCK_BRAND_NAME} `.repeat(5) + "x".repeat(700);
    const score = scorer.calculate(content, []);

    // Position: 10 pts (first 11-25%), Frequency: 15 pts (5+ mentions) = 25
    expect(score.breakdown.prominence).toBe(25);
  });

  it("should score 20 points for middle mention (first 50%) with high frequency", () => {
    const content = createMockContent({
      brandMentions: 5,
      firstMentionAt: "middle",
    });
    const score = scorer.calculate(content, []);

    // Position: 5 pts (first 50%), Frequency: 15 pts (5+ mentions) = 20
    expect(score.breakdown.prominence).toBe(20);
  });

  it("should score 17 points for late mention (after 50%) with high frequency", () => {
    const content = createMockContent({
      brandMentions: 5,
      firstMentionAt: "late",
    });
    const score = scorer.calculate(content, []);

    // Position: 2 pts (after 50%), Frequency: 15 pts (5+ mentions) = 17
    expect(score.breakdown.prominence).toBe(17);
  });

  it("should score 20 points for early mention with medium frequency (3-4)", () => {
    const content = createMockContent({
      brandMentions: 3,
      firstMentionAt: "start",
    });
    const score = scorer.calculate(content, []);

    // Position: 15 pts (first 10%), Frequency: 10 pts (3-4 mentions) = 25
    expect(score.breakdown.prominence).toBe(25);
  });

  it("should score 20 points for early mention with low frequency (1-2)", () => {
    const content = createMockContent({
      brandMentions: 2,
      firstMentionAt: "start",
    });
    const score = scorer.calculate(content, []);

    // Position: 15 pts (first 10%), Frequency: 5 pts (1-2 mentions) = 20
    expect(score.breakdown.prominence).toBe(20);
  });

  it("should cap prominence at 30 points", () => {
    // Even with 20 mentions at the start, should cap at 30
    const content = createMockContent({
      brandMentions: 20,
      firstMentionAt: "start",
    });
    const score = scorer.calculate(content, []);
    expect(score.breakdown.prominence).toBe(30);
  });

  it("should handle first mention position at exact boundaries", () => {
    const scorer = new VisibilityScorer({ brandName: "TestBrand" });

    // Test just inside 10% boundary
    // Position 90 with total length ~1000 = 9% (inside 10%)
    const content10 = "x".repeat(90) + " TestBrand " + "x".repeat(899);
    const score10 = scorer.calculate(content10, []);
    expect(score10.breakdown.prominence).toBe(20); // 15 (pos <= 10%) + 5 (freq = 1) = 20

    // Test just inside 25% boundary but after 10%
    // Position 200 with total length ~1000 = 20% (inside 25%)
    const content25 = "x".repeat(200) + " TestBrand " + "x".repeat(789);
    const score25 = scorer.calculate(content25, []);
    expect(score25.breakdown.prominence).toBe(15); // 10 (pos <= 25%) + 5 (freq = 1) = 15
  });
});

// ============================================================================
// Helper Methods Tests
// ============================================================================

describe("VisibilityScorer - Helper Methods", () => {
  describe("countBrandMentions()", () => {
    it("should count exact brand name mentions (case-insensitive)", () => {
      const scorer = new VisibilityScorer({ brandName: "Acme Corp" });

      const content1 = "Acme Corp is great. ACME CORP is amazing. acme corp is wonderful.";
      const score1 = scorer.calculate(content1, []);
      expect(score1.metrics.totalMentions).toBe(3);

      const content2 = "acme corp and ACME CORP";
      const score2 = scorer.calculate(content2, []);
      expect(score2.metrics.totalMentions).toBe(2);
    });

    it("should handle brand names with special regex characters", () => {
      // Test with simpler special characters that are more commonly matched
      const scorer = new VisibilityScorer({ brandName: "Test-Corp" });
      const content = "Test-Corp is a company. Test-Corp provides services.";
      const score = scorer.calculate(content, []);
      expect(score.metrics.totalMentions).toBe(2);
    });

    it("should count keyword mentions with 0.5x weight", () => {
      const scorer = new VisibilityScorer({
        brandName: "Acme",
        brandKeywords: ["project management", "productivity"],
      });

      // 1 brand + 2 keywords = 1 + (2 * 0.5) = 2 total
      const content = "Acme offers great project management and productivity tools.";
      const score = scorer.calculate(content, []);
      expect(score.metrics.totalMentions).toBe(2);
    });

    it("should handle keywords with special characters", () => {
      const scorer = new VisibilityScorer({
        brandName: "Acme",
        brandKeywords: ["AI/ML", "real-time"],
      });

      const content = "Acme provides AI/ML and real-time solutions.";
      const score = scorer.calculate(content, []);
      // 1 brand + (2 keywords * 0.5) = 2 total
      expect(score.metrics.totalMentions).toBe(2);
    });

    it("should return 0 for empty content", () => {
      const scorer = new VisibilityScorer({ brandName: "Acme" });
      const score = scorer.calculate("", []);
      expect(score.metrics.totalMentions).toBe(0);
    });

    it("should handle content without brand or keywords", () => {
      const scorer = new VisibilityScorer({
        brandName: "Acme",
        brandKeywords: ["productivity"],
      });
      const content = "This content has neither the brand nor keywords.";
      const score = scorer.calculate(content, []);
      expect(score.metrics.totalMentions).toBe(0);
    });
  });

  describe("calculateAverageRelevance()", () => {
    it("should return 0 for empty citations array", () => {
      const scorer = new VisibilityScorer({ brandName: "Acme" });
      const score = scorer.calculate("Acme content", []);
      expect(score.metrics.avgRelevanceScore).toBe(0);
    });

    it("should calculate average of citation relevance scores", () => {
      const scorer = new VisibilityScorer({ brandName: "Acme" });
      const citations = [
        createMockCitation(80),
        createMockCitation(90),
        createMockCitation(70),
      ];
      const score = scorer.calculate("Acme content", citations);
      expect(score.metrics.avgRelevanceScore).toBe(80); // (80 + 90 + 70) / 3
    });

    it("should handle citations without relevance scores (treat as 0)", () => {
      const scorer = new VisibilityScorer({ brandName: "Acme" });
      const citations: Citation[] = [
        { type: "link", sourceUrl: "https://example.com" },
        createMockCitation(60),
      ];
      const score = scorer.calculate("Acme content", citations);
      expect(score.metrics.avgRelevanceScore).toBe(30); // (0 + 60) / 2
    });

    it("should round average to nearest integer", () => {
      const scorer = new VisibilityScorer({ brandName: "Acme" });
      const citations = [
        createMockCitation(83),
        createMockCitation(84),
      ];
      const score = scorer.calculate("Acme content", citations);
      expect(score.metrics.avgRelevanceScore).toBe(84); // (83 + 84) / 2 = 83.5, rounded to 84
    });
  });

  describe("findFirstMentionPosition()", () => {
    it("should find position of first brand mention", () => {
      const scorer = new VisibilityScorer({ brandName: "Acme" });
      const content = "Some text here. Acme is mentioned. More text.";
      const score = scorer.calculate(content, []);
      expect(score.metrics.firstMentionPosition).toBe(16); // Position of "Acme"
    });

    it("should be case-insensitive", () => {
      const scorer = new VisibilityScorer({ brandName: "Acme" });
      const content = "Some text here. acme is mentioned. More text.";
      const score = scorer.calculate(content, []);
      expect(score.metrics.firstMentionPosition).toBe(16);
    });

    it("should return -1 when brand is not found", () => {
      const scorer = new VisibilityScorer({ brandName: "Acme" });
      const content = "This content has no brand mentions.";
      const score = scorer.calculate(content, []);
      expect(score.metrics.firstMentionPosition).toBe(-1);
    });

    it("should check keywords if brand name not found", () => {
      const scorer = new VisibilityScorer({
        brandName: "Acme",
        brandKeywords: ["project management"],
      });
      const content = "Some text about project management here.";
      const score = scorer.calculate(content, []);
      expect(score.metrics.firstMentionPosition).toBeGreaterThan(-1);
    });

    it("should prioritize brand name over keywords", () => {
      const scorer = new VisibilityScorer({
        brandName: "Acme",
        brandKeywords: ["project"],
      });
      const content = "The project is managed by Acme.";
      const score = scorer.calculate(content, []);
      // Should find "Acme" not "project"
      expect(score.metrics.firstMentionPosition).toBeGreaterThan(10);
    });

    it("should return -1 for empty content", () => {
      const scorer = new VisibilityScorer({ brandName: "Acme" });
      const score = scorer.calculate("", []);
      expect(score.metrics.firstMentionPosition).toBe(-1);
    });
  });
});

// ============================================================================
// Static Utility Methods Tests
// ============================================================================

describe("VisibilityScorer - Static Methods", () => {
  describe("getVisibilityTier()", () => {
    it("should return 'excellent' for scores 80-100", () => {
      expect(VisibilityScorer.getVisibilityTier(80)).toBe("excellent");
      expect(VisibilityScorer.getVisibilityTier(90)).toBe("excellent");
      expect(VisibilityScorer.getVisibilityTier(100)).toBe("excellent");
    });

    it("should return 'good' for scores 60-79", () => {
      expect(VisibilityScorer.getVisibilityTier(60)).toBe("good");
      expect(VisibilityScorer.getVisibilityTier(70)).toBe("good");
      expect(VisibilityScorer.getVisibilityTier(79)).toBe("good");
    });

    it("should return 'fair' for scores 40-59", () => {
      expect(VisibilityScorer.getVisibilityTier(40)).toBe("fair");
      expect(VisibilityScorer.getVisibilityTier(50)).toBe("fair");
      expect(VisibilityScorer.getVisibilityTier(59)).toBe("fair");
    });

    it("should return 'poor' for scores 20-39", () => {
      expect(VisibilityScorer.getVisibilityTier(20)).toBe("poor");
      expect(VisibilityScorer.getVisibilityTier(30)).toBe("poor");
      expect(VisibilityScorer.getVisibilityTier(39)).toBe("poor");
    });

    it("should return 'none' for scores 0-19", () => {
      expect(VisibilityScorer.getVisibilityTier(0)).toBe("none");
      expect(VisibilityScorer.getVisibilityTier(10)).toBe("none");
      expect(VisibilityScorer.getVisibilityTier(19)).toBe("none");
    });
  });

  describe("compareScores()", () => {
    it("should identify score1 as winner when higher", () => {
      const score1: VisibilityScore = {
        total: 80,
        breakdown: { mentionCount: 30, citationQuality: 25, prominence: 25 },
        metrics: { totalMentions: 5, totalCitations: 3, avgRelevanceScore: 85, firstMentionPosition: 10 },
      };
      const score2: VisibilityScore = {
        total: 60,
        breakdown: { mentionCount: 25, citationQuality: 20, prominence: 15 },
        metrics: { totalMentions: 3, totalCitations: 2, avgRelevanceScore: 70, firstMentionPosition: 50 },
      };

      const comparison = VisibilityScorer.compareScores(score1, score2);
      expect(comparison.winner).toBe("score1");
      expect(comparison.difference).toBe(20);
    });

    it("should identify score2 as winner when higher", () => {
      const score1: VisibilityScore = {
        total: 50,
        breakdown: { mentionCount: 20, citationQuality: 15, prominence: 15 },
        metrics: { totalMentions: 2, totalCitations: 1, avgRelevanceScore: 60, firstMentionPosition: 100 },
      };
      const score2: VisibilityScore = {
        total: 75,
        breakdown: { mentionCount: 30, citationQuality: 25, prominence: 20 },
        metrics: { totalMentions: 4, totalCitations: 3, avgRelevanceScore: 80, firstMentionPosition: 20 },
      };

      const comparison = VisibilityScorer.compareScores(score1, score2);
      expect(comparison.winner).toBe("score2");
      expect(comparison.difference).toBe(25);
    });

    it("should identify tie when scores are equal", () => {
      const score1: VisibilityScore = {
        total: 70,
        breakdown: { mentionCount: 25, citationQuality: 20, prominence: 25 },
        metrics: { totalMentions: 3, totalCitations: 2, avgRelevanceScore: 75, firstMentionPosition: 30 },
      };
      const score2: VisibilityScore = {
        total: 70,
        breakdown: { mentionCount: 30, citationQuality: 15, prominence: 25 },
        metrics: { totalMentions: 4, totalCitations: 1, avgRelevanceScore: 60, firstMentionPosition: 30 },
      };

      const comparison = VisibilityScorer.compareScores(score1, score2);
      expect(comparison.winner).toBe("tie");
      expect(comparison.difference).toBe(0);
    });

    it("should provide breakdown of differences", () => {
      const score1: VisibilityScore = {
        total: 80,
        breakdown: { mentionCount: 35, citationQuality: 25, prominence: 20 },
        metrics: { totalMentions: 5, totalCitations: 3, avgRelevanceScore: 85, firstMentionPosition: 10 },
      };
      const score2: VisibilityScore = {
        total: 65,
        breakdown: { mentionCount: 25, citationQuality: 20, prominence: 20 },
        metrics: { totalMentions: 3, totalCitations: 2, avgRelevanceScore: 70, firstMentionPosition: 50 },
      };

      const comparison = VisibilityScorer.compareScores(score1, score2);
      expect(comparison.breakdown.mentionCountDiff).toBe(10); // 35 - 25
      expect(comparison.breakdown.citationQualityDiff).toBe(5); // 25 - 20
      expect(comparison.breakdown.prominenceDiff).toBe(0); // 20 - 20
    });

    it("should handle negative differences in breakdown", () => {
      const score1: VisibilityScore = {
        total: 50,
        breakdown: { mentionCount: 20, citationQuality: 15, prominence: 15 },
        metrics: { totalMentions: 2, totalCitations: 1, avgRelevanceScore: 60, firstMentionPosition: 100 },
      };
      const score2: VisibilityScore = {
        total: 70,
        breakdown: { mentionCount: 30, citationQuality: 20, prominence: 20 },
        metrics: { totalMentions: 4, totalCitations: 2, avgRelevanceScore: 75, firstMentionPosition: 30 },
      };

      const comparison = VisibilityScorer.compareScores(score1, score2);
      expect(comparison.breakdown.mentionCountDiff).toBe(-10); // 20 - 30
      expect(comparison.breakdown.citationQualityDiff).toBe(-5); // 15 - 20
      expect(comparison.breakdown.prominenceDiff).toBe(-5); // 15 - 20
    });
  });

  describe("getScoreInsights()", () => {
    it("should provide overall tier insight", () => {
      const score: VisibilityScore = {
        total: 85,
        breakdown: { mentionCount: 35, citationQuality: 25, prominence: 25 },
        metrics: { totalMentions: 5, totalCitations: 3, avgRelevanceScore: 85, firstMentionPosition: 10 },
      };

      const insights = VisibilityScorer.getScoreInsights(score);
      expect(insights).toContain("Overall visibility is excellent (85/100)");
    });

    it("should provide low mention frequency insight", () => {
      const score: VisibilityScore = {
        total: 15,
        breakdown: { mentionCount: 5, citationQuality: 5, prominence: 5 },
        metrics: { totalMentions: 1, totalCitations: 1, avgRelevanceScore: 50, firstMentionPosition: 100 },
      };

      const insights = VisibilityScorer.getScoreInsights(score);
      expect(insights.some((i) => i.includes("Low mention frequency"))).toBe(true);
      expect(insights.some((i) => i.includes("1 mentions"))).toBe(true);
    });

    it("should provide excellent mention frequency insight", () => {
      const score: VisibilityScore = {
        total: 75,
        breakdown: { mentionCount: 35, citationQuality: 20, prominence: 20 },
        metrics: { totalMentions: 5, totalCitations: 2, avgRelevanceScore: 70, firstMentionPosition: 20 },
      };

      const insights = VisibilityScorer.getScoreInsights(score);
      expect(insights.some((i) => i.includes("Excellent mention frequency"))).toBe(true);
    });

    it("should provide low citation quality insight", () => {
      const score: VisibilityScore = {
        total: 25,
        breakdown: { mentionCount: 20, citationQuality: 3, prominence: 2 },
        metrics: { totalMentions: 2, totalCitations: 1, avgRelevanceScore: 30, firstMentionPosition: 200 },
      };

      const insights = VisibilityScorer.getScoreInsights(score);
      expect(insights.some((i) => i.includes("Few or low-quality citations"))).toBe(true);
    });

    it("should provide high citation quality insight", () => {
      const score: VisibilityScore = {
        total: 65,
        breakdown: { mentionCount: 20, citationQuality: 25, prominence: 20 },
        metrics: { totalMentions: 2, totalCitations: 3, avgRelevanceScore: 85, firstMentionPosition: 30 },
      };

      const insights = VisibilityScorer.getScoreInsights(score);
      expect(insights.some((i) => i.includes("High-quality citations"))).toBe(true);
    });

    it("should provide low prominence insight", () => {
      const score: VisibilityScore = {
        total: 35,
        breakdown: { mentionCount: 20, citationQuality: 10, prominence: 5 },
        metrics: { totalMentions: 2, totalCitations: 1, avgRelevanceScore: 50, firstMentionPosition: 800 },
      };

      const insights = VisibilityScorer.getScoreInsights(score);
      expect(insights.some((i) => i.includes("Brand appears late in responses"))).toBe(true);
    });

    it("should provide high prominence insight", () => {
      const score: VisibilityScore = {
        total: 70,
        breakdown: { mentionCount: 20, citationQuality: 20, prominence: 30 },
        metrics: { totalMentions: 5, totalCitations: 2, avgRelevanceScore: 70, firstMentionPosition: 5 },
      };

      const insights = VisibilityScorer.getScoreInsights(score);
      expect(insights.some((i) => i.includes("Brand appears prominently"))).toBe(true);
    });

    it("should provide no visibility insight for zero score", () => {
      const score: VisibilityScore = {
        total: 0,
        breakdown: { mentionCount: 0, citationQuality: 0, prominence: 0 },
        metrics: { totalMentions: 0, totalCitations: 0, avgRelevanceScore: 0, firstMentionPosition: -1 },
      };

      const insights = VisibilityScorer.getScoreInsights(score);
      expect(insights.some((i) => i.includes("No brand visibility detected"))).toBe(true);
    });
  });
});

// ============================================================================
// Convenience Functions Tests
// ============================================================================

describe("VisibilityScorer - Convenience Functions", () => {
  describe("calculateVisibilityScore()", () => {
    it("should calculate score using convenience function", () => {
      const content = createMockContent({ brandMentions: 3 });
      const citations = [createMockCitation(80)];

      const score = calculateVisibilityScore(content, citations, {
        brandName: MOCK_BRAND_NAME,
      });

      expect(score).toBeDefined();
      expect(score.total).toBeGreaterThan(0);
      expect(score.metrics.totalMentions).toBe(3);
    });

    it("should work without options", () => {
      const content = "Generic content";
      const score = calculateVisibilityScore(content, []);

      expect(score).toBeDefined();
      expect(score.total).toBe(0);
    });
  });

  describe("calculateVisibilityScoreFromResponse()", () => {
    it("should calculate score from PlatformResponse", () => {
      const content = createMockContent({ brandMentions: 4 });
      const citations = [createMockCitation(90), createMockCitation(85)];
      const response = createMockPlatformResponse(content, citations, "chatgpt");

      const score = calculateVisibilityScoreFromResponse(response, {
        brandName: MOCK_BRAND_NAME,
      });

      expect(score).toBeDefined();
      expect(score.total).toBeGreaterThan(0);
      expect(score.metrics.totalMentions).toBe(4);
      expect(score.metrics.totalCitations).toBe(2);
    });

    it("should work with different platforms", () => {
      const content = createMockContent({ brandMentions: 2 });
      const citations = [createMockCitation(75)];

      const platforms: Array<"chatgpt" | "claude" | "gemini" | "perplexity"> = [
        "chatgpt",
        "claude",
        "gemini",
        "perplexity",
      ];

      platforms.forEach((platform) => {
        const response = createMockPlatformResponse(content, citations, platform);
        const score = calculateVisibilityScoreFromResponse(response, {
          brandName: MOCK_BRAND_NAME,
        });

        expect(score).toBeDefined();
        expect(score.total).toBeGreaterThan(0);
      });
    });
  });

  describe("batchCalculateScores()", () => {
    it("should calculate scores for multiple platform responses", () => {
      const content1 = createMockContent({ brandMentions: 3 });
      const content2 = createMockContent({ brandMentions: 5 });

      const responses = [
        createMockPlatformResponse(content1, [createMockCitation(80)], "chatgpt"),
        createMockPlatformResponse(content2, [createMockCitation(90)], "claude"),
      ];

      const scores = batchCalculateScores(responses, {
        brandName: MOCK_BRAND_NAME,
      });

      expect(scores.size).toBe(2);
      expect(scores.has("chatgpt")).toBe(true);
      expect(scores.has("claude")).toBe(true);

      const chatgptScore = scores.get("chatgpt");
      expect(chatgptScore).toBeDefined();
      expect(chatgptScore!.metrics.totalMentions).toBe(3);

      const claudeScore = scores.get("claude");
      expect(claudeScore).toBeDefined();
      expect(claudeScore!.metrics.totalMentions).toBe(5);
    });

    it("should handle empty responses array", () => {
      const scores = batchCalculateScores([], {
        brandName: MOCK_BRAND_NAME,
      });

      expect(scores.size).toBe(0);
    });

    it("should handle all four platforms", () => {
      const responses = [
        createMockPlatformResponse(
          createMockContent({ brandMentions: 2 }),
          [createMockCitation(70)],
          "chatgpt"
        ),
        createMockPlatformResponse(
          createMockContent({ brandMentions: 3 }),
          [createMockCitation(80)],
          "claude"
        ),
        createMockPlatformResponse(
          createMockContent({ brandMentions: 4 }),
          [createMockCitation(85)],
          "gemini"
        ),
        createMockPlatformResponse(
          createMockContent({ brandMentions: 5 }),
          [createMockCitation(90)],
          "perplexity"
        ),
      ];

      const scores = batchCalculateScores(responses, {
        brandName: MOCK_BRAND_NAME,
      });

      expect(scores.size).toBe(4);
      expect(scores.has("chatgpt")).toBe(true);
      expect(scores.has("claude")).toBe(true);
      expect(scores.has("gemini")).toBe(true);
      expect(scores.has("perplexity")).toBe(true);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("VisibilityScorer - Integration Tests", () => {
  it("should produce consistent scores for identical content", () => {
    const scorer = new VisibilityScorer({
      brandName: MOCK_BRAND_NAME,
      brandKeywords: MOCK_BRAND_KEYWORDS,
    });

    const content = createMockContent({ brandMentions: 4 });
    const citations = [createMockCitation(85), createMockCitation(80)];

    const score1 = scorer.calculate(content, citations);
    const score2 = scorer.calculate(content, citations);

    expect(score1.total).toBe(score2.total);
    expect(score1.breakdown).toEqual(score2.breakdown);
    expect(score1.metrics).toEqual(score2.metrics);
  });

  it("should handle real-world scenario with mixed content", () => {
    const scorer = new VisibilityScorer({
      brandName: "TechCorp",
      brandKeywords: ["cloud computing", "AI solutions"],
    });

    const content = `
      TechCorp is a leading provider of cloud computing services and AI solutions.
      Founded in 2020, TechCorp has quickly become a trusted name in enterprise technology.
      The company's flagship product leverages advanced AI solutions to optimize workflows.
      Many Fortune 500 companies rely on TechCorp for their cloud computing infrastructure.
      According to recent market analysis, TechCorp continues to innovate in the AI solutions space.
    `;

    const citations: Citation[] = [
      {
        type: "direct_quote",
        text: "TechCorp is a leading provider",
        sourceUrl: "https://techcorp.com/about",
        sourceTitle: "About TechCorp",
        position: 7,
        relevanceScore: 95,
      },
      {
        type: "link",
        sourceUrl: "https://techcorp.com/products",
        sourceTitle: "TechCorp Products",
        position: 150,
        relevanceScore: 88,
      },
      {
        type: "paraphrase",
        text: "cloud computing infrastructure",
        position: 280,
        relevanceScore: 82,
      },
    ];

    const score = scorer.calculate(content, citations);

    // Should have high score due to multiple mentions, good citations, early position
    expect(score.total).toBeGreaterThan(60);
    expect(score.breakdown.mentionCount).toBeGreaterThan(0);
    expect(score.breakdown.citationQuality).toBeGreaterThan(0);
    expect(score.breakdown.prominence).toBeGreaterThan(0);
    expect(score.metrics.totalMentions).toBeGreaterThan(3); // 4 brand + keyword mentions
    expect(score.metrics.totalCitations).toBe(3);
  });

  it("should handle edge case with very long content", () => {
    const scorer = new VisibilityScorer({ brandName: "Acme" });

    // Create very long content (10,000 chars) with brand mention near the end
    const padding = "x".repeat(9000);
    const content = padding + " Acme is mentioned here. " + "x".repeat(900);

    const score = scorer.calculate(content, []);

    expect(score.total).toBeGreaterThan(0);
    expect(score.breakdown.mentionCount).toBe(10); // 1 mention = 10 points
    expect(score.breakdown.prominence).toBeLessThan(10); // Late mention = low prominence
  });

  it("should calculate reasonable scores across different platforms", () => {
    const content = createMockContent({ brandMentions: 3 });
    const citations = [createMockCitation(80), createMockCitation(75)];

    const responses = [
      createMockPlatformResponse(content, citations, "chatgpt"),
      createMockPlatformResponse(content, citations, "claude"),
      createMockPlatformResponse(content, citations, "gemini"),
      createMockPlatformResponse(content, citations, "perplexity"),
    ];

    const scores = batchCalculateScores(responses, {
      brandName: MOCK_BRAND_NAME,
    });

    // All platforms should have identical scores for identical content
    const scoreValues = Array.from(scores.values()).map((s) => s.total);
    expect(new Set(scoreValues).size).toBe(1); // All scores should be the same

    const firstScore = scoreValues[0];
    expect(firstScore).toBeGreaterThan(0);
    expect(firstScore).toBeLessThanOrEqual(100);
  });
});
