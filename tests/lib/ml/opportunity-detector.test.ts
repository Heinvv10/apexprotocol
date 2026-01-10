/**
 * Tests for Opportunity Detection Algorithm
 * Tests upward trend detection, confidence filtering, and impact ranking
 */

import { describe, it, expect } from "vitest";
import {
  detectOpportunities,
  filterByEntityType,
  getOpportunitySummary,
  calculateOpportunityScore,
  isHighQualityOpportunity,
  type OpportunityEntity,
  type DetectedOpportunity,
  type EntityType,
} from "../../../src/lib/ml/opportunity-detector";
import type { ForecastPrediction } from "../../../src/lib/ml/forecaster";

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Generate mock predictions with upward trend
 */
function generateUpwardPredictions(
  startScore: number,
  endScore: number,
  days: number,
  confidence: number = 0.8
): ForecastPrediction[] {
  const predictions: ForecastPrediction[] = [];
  const scoreIncrement = (endScore - startScore) / days;
  const startDate = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i + 1);

    const predictedValue = startScore + scoreIncrement * (i + 1);

    predictions.push({
      date,
      predictedValue,
      confidenceLower: predictedValue - 5,
      confidenceUpper: predictedValue + 5,
      confidence: confidence - i * 0.001, // Slight decrease over time
    });
  }

  return predictions;
}

/**
 * Generate mock predictions with downward trend
 */
function generateDownwardPredictions(
  startScore: number,
  endScore: number,
  days: number,
  confidence: number = 0.8
): ForecastPrediction[] {
  return generateUpwardPredictions(startScore, endScore, days, confidence);
}

/**
 * Generate mock predictions with stable trend
 */
function generateStablePredictions(
  score: number,
  days: number,
  confidence: number = 0.8
): ForecastPrediction[] {
  return generateUpwardPredictions(score, score, days, confidence);
}

/**
 * Create mock opportunity entity
 */
function createMockEntity(
  entityType: EntityType,
  id: string,
  name: string,
  currentScore: number,
  predictions: ForecastPrediction[]
): OpportunityEntity {
  return {
    entityType,
    entityId: id,
    entityName: name,
    currentScore,
    predictions,
  };
}

// ============================================================================
// detectOpportunities Tests
// ============================================================================

describe("detectOpportunities", () => {
  it("should detect upward trends with >70% confidence", () => {
    const entities: OpportunityEntity[] = [
      createMockEntity(
        "keyword",
        "kw-1",
        "AI Marketing",
        60,
        generateUpwardPredictions(60, 80, 90, 0.85)
      ),
      createMockEntity(
        "topic",
        "tp-1",
        "Content Strategy",
        50,
        generateUpwardPredictions(50, 70, 90, 0.80) // Increased from 0.75 to stay above 0.7
      ),
    ];

    const opportunities = detectOpportunities(entities);

    expect(opportunities.length).toBe(2);
    expect(opportunities[0].trend).toBe("increasing");
    expect(opportunities[0].confidence).toBeGreaterThan(0.7);
    expect(opportunities[1].trend).toBe("increasing");
    expect(opportunities[1].confidence).toBeGreaterThan(0.7);
  });

  it("should filter out downward trends", () => {
    const entities: OpportunityEntity[] = [
      createMockEntity(
        "keyword",
        "kw-1",
        "Declining Term",
        80,
        generateDownwardPredictions(80, 60, 90, 0.85)
      ),
      createMockEntity(
        "keyword",
        "kw-2",
        "Growing Term",
        60,
        generateUpwardPredictions(60, 80, 90, 0.85)
      ),
    ];

    const opportunities = detectOpportunities(entities);

    expect(opportunities.length).toBe(1);
    expect(opportunities[0].entityName).toBe("Growing Term");
    expect(opportunities[0].trend).toBe("increasing");
  });

  it("should filter out low confidence predictions (<70%)", () => {
    const entities: OpportunityEntity[] = [
      createMockEntity(
        "keyword",
        "kw-1",
        "Low Confidence",
        60,
        generateUpwardPredictions(60, 80, 90, 0.6) // 60% confidence
      ),
      createMockEntity(
        "keyword",
        "kw-2",
        "High Confidence",
        60,
        generateUpwardPredictions(60, 80, 90, 0.85) // 85% confidence
      ),
    ];

    const opportunities = detectOpportunities(entities);

    expect(opportunities.length).toBe(1);
    expect(opportunities[0].entityName).toBe("High Confidence");
    expect(opportunities[0].confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("should rank opportunities by impact (magnitude * confidence)", () => {
    const entities: OpportunityEntity[] = [
      // High impact at day 60: 60 -> 80 = 33.33%, confidence 0.80 - 0.06 = 0.74, score = 24.67
      createMockEntity(
        "keyword",
        "kw-1",
        "High Impact",
        60,
        generateUpwardPredictions(60, 90, 90, 0.80)
      ),
      // Medium impact at day 60: 60 -> 73.33 = 22.22%, confidence 0.85 - 0.06 = 0.79, score = 17.55
      createMockEntity(
        "keyword",
        "kw-2",
        "Medium Impact",
        60,
        generateUpwardPredictions(60, 80, 90, 0.85)
      ),
      // Low impact at day 60: 60 -> 66.67 = 11.11%, confidence 0.90 - 0.06 = 0.84, score = 9.33
      createMockEntity(
        "keyword",
        "kw-3",
        "Low Impact",
        60,
        generateUpwardPredictions(60, 70, 90, 0.90)
      ),
    ];

    const opportunities = detectOpportunities(entities);

    expect(opportunities.length).toBe(3); // All pass the 10% minImpact threshold
    expect(opportunities[0].entityName).toBe("High Impact");
    expect(opportunities[1].entityName).toBe("Medium Impact");
    expect(opportunities[2].entityName).toBe("Low Impact");

    // Verify ranking by impact score
    const score0 = calculateOpportunityScore(opportunities[0]);
    const score1 = calculateOpportunityScore(opportunities[1]);
    const score2 = calculateOpportunityScore(opportunities[2]);

    expect(score0).toBeGreaterThan(score1);
    expect(score1).toBeGreaterThan(score2);
  });

  it("should return top 10 opportunities by default", () => {
    const entities: OpportunityEntity[] = [];

    // Create 15 entities with varying impact
    for (let i = 0; i < 15; i++) {
      entities.push(
        createMockEntity(
          "keyword",
          `kw-${i}`,
          `Keyword ${i}`,
          60,
          generateUpwardPredictions(60, 60 + (i + 1) * 2, 90, 0.8)
        )
      );
    }

    const opportunities = detectOpportunities(entities);

    expect(opportunities.length).toBe(10);
    // Should return the highest impact opportunities
    expect(opportunities[0].impact).toBeGreaterThan(opportunities[9].impact);
  });

  it("should respect custom maxResults config", () => {
    const entities: OpportunityEntity[] = [];

    for (let i = 0; i < 10; i++) {
      entities.push(
        createMockEntity(
          "keyword",
          `kw-${i}`,
          `Keyword ${i}`,
          60,
          generateUpwardPredictions(60, 80, 90, 0.8)
        )
      );
    }

    const opportunities = detectOpportunities(entities, { maxResults: 5 });

    expect(opportunities.length).toBe(5);
  });

  it("should respect custom minConfidence config", () => {
    const entities: OpportunityEntity[] = [
      createMockEntity(
        "keyword",
        "kw-1",
        "High Confidence",
        60,
        generateUpwardPredictions(60, 80, 90, 0.91) // Higher to stay above 0.85 at day 60
      ),
      createMockEntity(
        "keyword",
        "kw-2",
        "Medium Confidence",
        60,
        generateUpwardPredictions(60, 80, 90, 0.81) // Higher but below 0.85 at day 60
      ),
    ];

    const opportunities = detectOpportunities(entities, { minConfidence: 0.85 });

    expect(opportunities.length).toBe(1);
    expect(opportunities[0].entityName).toBe("High Confidence");
  });

  it("should respect custom minImpact config", () => {
    const entities: OpportunityEntity[] = [
      // 50% impact
      createMockEntity(
        "keyword",
        "kw-1",
        "High Impact",
        60,
        generateUpwardPredictions(60, 90, 90, 0.8)
      ),
      // 16.7% impact
      createMockEntity(
        "keyword",
        "kw-2",
        "Low Impact",
        60,
        generateUpwardPredictions(60, 70, 90, 0.8)
      ),
    ];

    const opportunities = detectOpportunities(entities, { minImpact: 20 });

    expect(opportunities.length).toBe(1);
    expect(opportunities[0].entityName).toBe("High Impact");
  });

  it("should handle entities with no predictions", () => {
    const entities: OpportunityEntity[] = [
      createMockEntity("keyword", "kw-1", "No Predictions", 60, []),
      createMockEntity(
        "keyword",
        "kw-2",
        "With Predictions",
        60,
        generateUpwardPredictions(60, 80, 90, 0.8)
      ),
    ];

    const opportunities = detectOpportunities(entities);

    expect(opportunities.length).toBe(1);
    expect(opportunities[0].entityName).toBe("With Predictions");
  });

  it("should handle empty entity list", () => {
    const opportunities = detectOpportunities([]);

    expect(opportunities.length).toBe(0);
  });

  it("should filter out stable trends", () => {
    const entities: OpportunityEntity[] = [
      createMockEntity(
        "keyword",
        "kw-1",
        "Stable",
        60,
        generateStablePredictions(60, 90, 0.8)
      ),
      createMockEntity(
        "keyword",
        "kw-2",
        "Growing",
        60,
        generateUpwardPredictions(60, 80, 90, 0.8)
      ),
    ];

    const opportunities = detectOpportunities(entities);

    // Stable trend has 0% impact, should be filtered out
    expect(opportunities.length).toBe(1);
    expect(opportunities[0].entityName).toBe("Growing");
  });

  it("should use different timeframes based on preference", () => {
    const predictions = generateUpwardPredictions(60, 90, 90, 0.8);
    const entity = createMockEntity("keyword", "kw-1", "Test", 60, predictions);

    const shortTerm = detectOpportunities([entity], {
      timeframePreference: "short",
    });
    const mediumTerm = detectOpportunities([entity], {
      timeframePreference: "medium",
    });
    const longTerm = detectOpportunities([entity], {
      timeframePreference: "long",
    });

    expect(shortTerm[0].timeframe).toBeLessThan(mediumTerm[0].timeframe);
    expect(mediumTerm[0].timeframe).toBeLessThan(longTerm[0].timeframe);
  });

  it("should include all required fields in detected opportunities", () => {
    const entities: OpportunityEntity[] = [
      createMockEntity(
        "keyword",
        "kw-1",
        "Test Keyword",
        60,
        generateUpwardPredictions(60, 80, 90, 0.85)
      ),
    ];

    const opportunities = detectOpportunities(entities);

    expect(opportunities.length).toBe(1);

    const opp = opportunities[0];
    expect(opp.entityType).toBe("keyword");
    expect(opp.entityId).toBe("kw-1");
    expect(opp.entityName).toBe("Test Keyword");
    expect(opp.currentScore).toBe(60);
    expect(opp.predictedScore).toBeGreaterThan(60);
    expect(opp.impact).toBeGreaterThan(0);
    expect(opp.confidence).toBeGreaterThan(0.7);
    expect(opp.timeframe).toBeGreaterThan(0);
    expect(opp.targetDate).toBeInstanceOf(Date);
    expect(opp.trend).toBe("increasing");
    expect(opp.explanation).toContain("Test Keyword");
  });

  it("should calculate impact as percentage change", () => {
    // 60 -> 90 over 90 days, but default uses day 60 (medium timeframe)
    // At day 60: 60 + (90-60) * 60/90 = 60 + 20 = 80
    // Impact = (80 - 60) / 60 * 100 = 33.33% increase
    const entities: OpportunityEntity[] = [
      createMockEntity(
        "keyword",
        "kw-1",
        "Test",
        60,
        generateUpwardPredictions(60, 90, 90, 0.8)
      ),
    ];

    const opportunities = detectOpportunities(entities);

    expect(opportunities[0].impact).toBeCloseTo(33.33, 1); // 33.33% increase at day 60
  });
});

// ============================================================================
// filterByEntityType Tests
// ============================================================================

describe("filterByEntityType", () => {
  it("should filter opportunities by entity type", () => {
    const opportunities: DetectedOpportunity[] = [
      {
        entityType: "keyword",
        entityId: "kw-1",
        entityName: "Keyword 1",
        currentScore: 60,
        predictedScore: 80,
        impact: 33.3,
        confidence: 0.8,
        timeframe: 90,
        targetDate: new Date(),
        trend: "increasing",
        explanation: "Test",
      },
      {
        entityType: "topic",
        entityId: "tp-1",
        entityName: "Topic 1",
        currentScore: 50,
        predictedScore: 70,
        impact: 40,
        confidence: 0.75,
        timeframe: 90,
        targetDate: new Date(),
        trend: "increasing",
        explanation: "Test",
      },
    ];

    const keywordOpps = filterByEntityType(opportunities, "keyword");
    const topicOpps = filterByEntityType(opportunities, "topic");

    expect(keywordOpps.length).toBe(1);
    expect(keywordOpps[0].entityType).toBe("keyword");

    expect(topicOpps.length).toBe(1);
    expect(topicOpps[0].entityType).toBe("topic");
  });
});

// ============================================================================
// getOpportunitySummary Tests
// ============================================================================

describe("getOpportunitySummary", () => {
  it("should calculate summary statistics", () => {
    const opportunities: DetectedOpportunity[] = [
      {
        entityType: "keyword",
        entityId: "kw-1",
        entityName: "Keyword 1",
        currentScore: 60,
        predictedScore: 80,
        impact: 33.3,
        confidence: 0.8,
        timeframe: 90,
        targetDate: new Date(),
        trend: "increasing",
        explanation: "Test",
      },
      {
        entityType: "topic",
        entityId: "tp-1",
        entityName: "Topic 1",
        currentScore: 50,
        predictedScore: 70,
        impact: 40,
        confidence: 0.9,
        timeframe: 90,
        targetDate: new Date(),
        trend: "increasing",
        explanation: "Test",
      },
    ];

    const summary = getOpportunitySummary(opportunities);

    expect(summary.totalOpportunities).toBe(2);
    expect(summary.averageImpact).toBeCloseTo(36.65, 1);
    expect(summary.averageConfidence).toBeCloseTo(0.85, 2);
    expect(summary.byEntityType.keyword).toBe(1);
    expect(summary.byEntityType.topic).toBe(1);
    expect(summary.topOpportunity).toBe(opportunities[0]);
  });

  it("should handle empty opportunities list", () => {
    const summary = getOpportunitySummary([]);

    expect(summary.totalOpportunities).toBe(0);
    expect(summary.averageImpact).toBe(0);
    expect(summary.averageConfidence).toBe(0);
    expect(summary.byEntityType.keyword).toBe(0);
    expect(summary.topOpportunity).toBeNull();
  });
});

// ============================================================================
// calculateOpportunityScore Tests
// ============================================================================

describe("calculateOpportunityScore", () => {
  it("should calculate score as impact * confidence", () => {
    const opportunity: DetectedOpportunity = {
      entityType: "keyword",
      entityId: "kw-1",
      entityName: "Test",
      currentScore: 60,
      predictedScore: 90,
      impact: 50, // 50%
      confidence: 0.8, // 80%
      timeframe: 90,
      targetDate: new Date(),
      trend: "increasing",
      explanation: "Test",
    };

    const score = calculateOpportunityScore(opportunity);

    expect(score).toBe(40); // 50 * 0.8 = 40
  });
});

// ============================================================================
// isHighQualityOpportunity Tests
// ============================================================================

describe("isHighQualityOpportunity", () => {
  it("should return true for high quality opportunities", () => {
    const opportunity: DetectedOpportunity = {
      entityType: "keyword",
      entityId: "kw-1",
      entityName: "Test",
      currentScore: 60,
      predictedScore: 90,
      impact: 50,
      confidence: 0.85,
      timeframe: 90,
      targetDate: new Date(),
      trend: "increasing",
      explanation: "Test",
    };

    expect(isHighQualityOpportunity(opportunity)).toBe(true);
  });

  it("should return false for low confidence opportunities", () => {
    const opportunity: DetectedOpportunity = {
      entityType: "keyword",
      entityId: "kw-1",
      entityName: "Test",
      currentScore: 60,
      predictedScore: 90,
      impact: 50,
      confidence: 0.65, // Below 0.7 threshold
      timeframe: 90,
      targetDate: new Date(),
      trend: "increasing",
      explanation: "Test",
    };

    expect(isHighQualityOpportunity(opportunity)).toBe(false);
  });

  it("should return false for low impact opportunities", () => {
    const opportunity: DetectedOpportunity = {
      entityType: "keyword",
      entityId: "kw-1",
      entityName: "Test",
      currentScore: 60,
      predictedScore: 65,
      impact: 8.3, // Below 10% threshold
      confidence: 0.85,
      timeframe: 90,
      targetDate: new Date(),
      trend: "increasing",
      explanation: "Test",
    };

    expect(isHighQualityOpportunity(opportunity)).toBe(false);
  });

  it("should respect custom thresholds", () => {
    const opportunity: DetectedOpportunity = {
      entityType: "keyword",
      entityId: "kw-1",
      entityName: "Test",
      currentScore: 60,
      predictedScore: 75,
      impact: 25,
      confidence: 0.75,
      timeframe: 90,
      targetDate: new Date(),
      trend: "increasing",
      explanation: "Test",
    };

    expect(isHighQualityOpportunity(opportunity, 0.8, 20)).toBe(false); // Confidence too low
    expect(isHighQualityOpportunity(opportunity, 0.7, 30)).toBe(false); // Impact too low
    expect(isHighQualityOpportunity(opportunity, 0.7, 20)).toBe(true); // Both meet thresholds
  });
});
