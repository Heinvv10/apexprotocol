/**
 * Effectiveness Calculation Tests
 * Tests for recommendation effectiveness scoring utilities
 */

import { describe, it, expect } from "vitest";
import {
  calculateEffectivenessScore,
  calculateScoreImprovement,
  calculateImprovementPercentage,
  calculateTimeEfficiencyScore,
  calculateEffectivenessResult,
  calculateAggregateMetrics,
  getEffectivenessLevel,
  getEffectivenessDescription,
  clamp,
  DEFAULT_EXPECTED_DAYS,
  PRIORITY_BONUS,
} from "@/lib/analytics/effectiveness";

describe("Effectiveness Calculations", () => {
  describe("calculateScoreImprovement", () => {
    it("should calculate positive improvement correctly", () => {
      const result = calculateScoreImprovement(78, 65);
      expect(result).toBe(13);
    });

    it("should calculate negative improvement (regression) correctly", () => {
      const result = calculateScoreImprovement(60, 70);
      expect(result).toBe(-10);
    });

    it("should return 0 for no change", () => {
      const result = calculateScoreImprovement(80, 80);
      expect(result).toBe(0);
    });

    it("should handle maximum improvement (0 to 100)", () => {
      const result = calculateScoreImprovement(100, 0);
      expect(result).toBe(100);
    });

    it("should return 0 for invalid baseline score (negative)", () => {
      const result = calculateScoreImprovement(50, -10);
      expect(result).toBe(0);
    });

    it("should return 0 for invalid post score (> 100)", () => {
      const result = calculateScoreImprovement(110, 50);
      expect(result).toBe(0);
    });

    it("should return 0 for NaN values", () => {
      const result = calculateScoreImprovement(NaN, 50);
      expect(result).toBe(0);
    });
  });

  describe("calculateImprovementPercentage", () => {
    it("should calculate improvement percentage correctly", () => {
      // 13 point improvement from baseline of 65 = 20%
      const result = calculateImprovementPercentage(13, 65);
      expect(result).toBe(20);
    });

    it("should handle zero baseline (return 100 if improved)", () => {
      const result = calculateImprovementPercentage(50, 0);
      expect(result).toBe(100);
    });

    it("should handle zero baseline (return 0 if no improvement)", () => {
      const result = calculateImprovementPercentage(0, 0);
      expect(result).toBe(0);
    });

    it("should handle negative improvement percentage", () => {
      // -10 from baseline of 50 = -20%
      const result = calculateImprovementPercentage(-10, 50);
      expect(result).toBe(-20);
    });
  });

  describe("calculateTimeEfficiencyScore", () => {
    it("should give full score for completing on expected time (high priority)", () => {
      // High priority: expected 7 days, completed in 7 days
      const result = calculateTimeEfficiencyScore(7, "high");
      expect(result).toBe(0); // No bonus, no penalty
    });

    it("should give bonus for completing early (high priority)", () => {
      // High priority: expected 7 days, completed in 3 days
      const result = calculateTimeEfficiencyScore(3, "high");
      // (7-3)/7 * 20 = 4/7 * 20 = ~11.43
      expect(result).toBeCloseTo(11.43, 1);
    });

    it("should give 0 for taking too long", () => {
      // High priority: expected 7 days, took 14 days
      const result = calculateTimeEfficiencyScore(14, "high");
      // (7-14)/7 * 20 = -1 * 20 = -20, clamped to 0
      expect(result).toBe(0);
    });

    it("should handle medium priority expected days", () => {
      // Medium priority: expected 14 days, completed in 7 days
      const result = calculateTimeEfficiencyScore(7, "medium");
      // (14-7)/14 * 20 = 0.5 * 20 = 10
      expect(result).toBe(10);
    });

    it("should handle low priority expected days", () => {
      // Low priority: expected 30 days, completed in 15 days
      const result = calculateTimeEfficiencyScore(15, "low");
      // (30-15)/30 * 20 = 0.5 * 20 = 10
      expect(result).toBe(10);
    });

    it("should handle 0 implementation days (treat as 1 day)", () => {
      const result = calculateTimeEfficiencyScore(0, "high");
      // Treated as 1 day: (7-1)/7 * 20 = 6/7 * 20 = ~17.14
      expect(result).toBeCloseTo(17.14, 1);
    });
  });

  describe("calculateEffectivenessScore", () => {
    it("should calculate high effectiveness score for good improvement", () => {
      // baseline=65, post=78, 7 days, high priority
      // Improvement: 13 points, max possible: 35
      // Improvement score: (13/35) * 70 = 26
      // Time score: (7-7)/7 * 20 = 0
      // Priority bonus: 10
      // Total: 26 + 0 + 10 = 36
      const result = calculateEffectivenessScore(65, 78, 7, "high");
      expect(result).toBe(36);
    });

    it("should return 0 for negative improvement", () => {
      const result = calculateEffectivenessScore(70, 60, 7, "high");
      expect(result).toBe(0);
    });

    it("should return 0 for zero improvement (except priority/time bonuses)", () => {
      // No improvement, but still has priority bonus
      // Time score and improvement score are 0
      const result = calculateEffectivenessScore(80, 80, 7, "high");
      // Improvement: 0, time: 0, priority: 10 - but since improvement is 0 and clamped, only priority matters
      // Actually improvement score would be 0/20 * 70 = 0
      // So total = 0 + 0 + 10 = 10
      expect(result).toBe(10);
    });

    it("should handle maximum improvement (0 to 100)", () => {
      // baseline=0, post=100, quick implementation
      // Improvement: 100/100 * 70 = 70
      // Time (3 days on high priority): (7-3)/7 * 20 = ~11.43
      // Priority: 10
      // Total: 70 + 11.43 + 10 = ~91
      const result = calculateEffectivenessScore(0, 100, 3, "high");
      expect(result).toBeGreaterThanOrEqual(91);
    });

    it("should handle already at max score (baseline=100)", () => {
      // Special case: already at 100, staying at 100
      // Should give partial credit for maintaining
      const result = calculateEffectivenessScore(100, 100, 7, "high");
      // Improvement score: 35 (50% of 70 for maintaining max)
      // Time: 0
      // Priority: 10
      expect(result).toBe(45);
    });

    it("should return 0 for invalid scores", () => {
      const result = calculateEffectivenessScore(-10, 50, 7, "high");
      expect(result).toBe(0);
    });

    it("should handle different priority levels", () => {
      // Same improvement, different priorities - use completion times proportional to expected days
      // This ensures time efficiency score is the same (completing exactly on time)
      const high = calculateEffectivenessScore(50, 70, 7, "high");       // 7 days for high (expected 7)
      const medium = calculateEffectivenessScore(50, 70, 14, "medium");  // 14 days for medium (expected 14)
      const low = calculateEffectivenessScore(50, 70, 30, "low");        // 30 days for low (expected 30)

      // High should have higher effectiveness due to priority bonus (10 > 6 > 3)
      // All have same time efficiency (0) and same improvement score
      expect(high).toBeGreaterThan(medium);
      expect(medium).toBeGreaterThan(low);
    });
  });

  describe("calculateEffectivenessResult", () => {
    it("should return complete result object", () => {
      const result = calculateEffectivenessResult({
        baselineScore: 65,
        postImplementationScore: 78,
        implementationDays: 7,
        priority: "high",
      });

      expect(result).toHaveProperty("effectivenessScore");
      expect(result).toHaveProperty("scoreImprovement");
      expect(result).toHaveProperty("improvementPercentage");
      expect(result).toHaveProperty("timeEfficiencyScore");
      expect(result).toHaveProperty("priorityBonus");
      expect(result).toHaveProperty("details");

      expect(result.scoreImprovement).toBe(13);
      expect(result.priorityBonus).toBe(10);
      expect(result.details.maxPossibleImprovement).toBe(35);
      expect(result.details.expectedDays).toBe(7);
      expect(result.details.wasCompletedOnTime).toBe(true);
    });

    it("should indicate when completed late", () => {
      const result = calculateEffectivenessResult({
        baselineScore: 50,
        postImplementationScore: 70,
        implementationDays: 10,
        priority: "high",
      });

      expect(result.details.wasCompletedOnTime).toBe(false);
    });
  });

  describe("calculateAggregateMetrics", () => {
    it("should calculate averages correctly", () => {
      const recommendations = [
        { effectivenessScore: 80, scoreImprovement: 20 },
        { effectivenessScore: 60, scoreImprovement: 15 },
        { effectivenessScore: 40, scoreImprovement: 10 },
      ];

      const result = calculateAggregateMetrics(recommendations);

      expect(result.totalCompleted).toBe(3);
      expect(result.averageEffectiveness).toBe(60);
      expect(result.averageScoreImprovement).toBe(15);
      expect(result.totalPositiveImprovements).toBe(3);
      expect(result.totalNegativeImprovements).toBe(0);
    });

    it("should handle null values in recommendations", () => {
      const recommendations = [
        { effectivenessScore: 80, scoreImprovement: 20 },
        { effectivenessScore: null, scoreImprovement: null },
        { effectivenessScore: 60, scoreImprovement: 10 },
      ];

      const result = calculateAggregateMetrics(recommendations);

      expect(result.totalCompleted).toBe(2);
      expect(result.averageEffectiveness).toBe(70);
      expect(result.averageScoreImprovement).toBe(15);
    });

    it("should handle empty array", () => {
      const result = calculateAggregateMetrics([]);

      expect(result.totalCompleted).toBe(0);
      expect(result.averageEffectiveness).toBe(0);
      expect(result.averageScoreImprovement).toBe(0);
    });

    it("should count positive and negative improvements", () => {
      const recommendations = [
        { effectivenessScore: 80, scoreImprovement: 20 },
        { effectivenessScore: 0, scoreImprovement: -5 },
        { effectivenessScore: 10, scoreImprovement: 0 },
        { effectivenessScore: 0, scoreImprovement: -10 },
      ];

      const result = calculateAggregateMetrics(recommendations);

      expect(result.totalPositiveImprovements).toBe(1);
      expect(result.totalNegativeImprovements).toBe(2);
    });
  });

  describe("getEffectivenessLevel", () => {
    it("should return 'excellent' for scores >= 80", () => {
      expect(getEffectivenessLevel(80)).toBe("excellent");
      expect(getEffectivenessLevel(100)).toBe("excellent");
    });

    it("should return 'good' for scores >= 60", () => {
      expect(getEffectivenessLevel(60)).toBe("good");
      expect(getEffectivenessLevel(79)).toBe("good");
    });

    it("should return 'moderate' for scores >= 40", () => {
      expect(getEffectivenessLevel(40)).toBe("moderate");
      expect(getEffectivenessLevel(59)).toBe("moderate");
    });

    it("should return 'poor' for scores >= 20", () => {
      expect(getEffectivenessLevel(20)).toBe("poor");
      expect(getEffectivenessLevel(39)).toBe("poor");
    });

    it("should return 'ineffective' for scores < 20", () => {
      expect(getEffectivenessLevel(0)).toBe("ineffective");
      expect(getEffectivenessLevel(19)).toBe("ineffective");
    });
  });

  describe("getEffectivenessDescription", () => {
    it("should return appropriate descriptions for each level", () => {
      expect(getEffectivenessDescription(85)).toContain("Excellent");
      expect(getEffectivenessDescription(65)).toContain("Good");
      expect(getEffectivenessDescription(45)).toContain("Moderate");
      expect(getEffectivenessDescription(25)).toContain("Poor");
      expect(getEffectivenessDescription(10)).toContain("Ineffective");
    });
  });

  describe("clamp", () => {
    it("should clamp value to min", () => {
      expect(clamp(-5, 0, 100)).toBe(0);
    });

    it("should clamp value to max", () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it("should return value if within range", () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });
  });

  describe("Constants", () => {
    it("should have correct default expected days", () => {
      expect(DEFAULT_EXPECTED_DAYS.high).toBe(7);
      expect(DEFAULT_EXPECTED_DAYS.medium).toBe(14);
      expect(DEFAULT_EXPECTED_DAYS.low).toBe(30);
    });

    it("should have correct priority bonuses", () => {
      expect(PRIORITY_BONUS.high).toBe(10);
      expect(PRIORITY_BONUS.medium).toBe(6);
      expect(PRIORITY_BONUS.low).toBe(3);
    });
  });
});
