/**
 * Recommendation Feedback System (F113)
 * User feedback and rating on recommendations for ML improvement
 */

import { createId } from "@paralleldrive/cuid2";

// Feedback types
export interface RecommendationFeedback {
  id: string;
  recommendationId: string;
  brandId: string;
  userId: string;
  rating: FeedbackRating;
  helpful: boolean;
  comment?: string;
  tags?: FeedbackTag[];
  outcome?: FeedbackOutcome;
  metrics?: FeedbackMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export type FeedbackTag =
  | "too_complex"
  | "not_relevant"
  | "already_done"
  | "not_actionable"
  | "missing_context"
  | "incorrect"
  | "helpful"
  | "accurate"
  | "easy_to_implement"
  | "high_impact";

export interface FeedbackOutcome {
  implemented: boolean;
  implementedAt?: Date;
  success: boolean;
  impactMeasured?: number; // 0-100
  notes?: string;
}

export interface FeedbackMetrics {
  beforeScore?: number;
  afterScore?: number;
  timeToImplement?: number; // minutes
  effortRating?: number; // 1-5
}

// Aggregated feedback statistics
export interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  helpfulPercentage: number;
  implementationRate: number;
  successRate: number;
  tagDistribution: Record<FeedbackTag, number>;
  averageImpact: number;
}

/**
 * Feedback Manager class
 */
export class FeedbackManager {
  private feedback: Map<string, RecommendationFeedback> = new Map();
  private byRecommendation: Map<string, string[]> = new Map();
  private byBrand: Map<string, string[]> = new Map();

  /**
   * Submit feedback for a recommendation
   */
  submitFeedback(params: {
    recommendationId: string;
    brandId: string;
    userId: string;
    rating: FeedbackRating;
    helpful: boolean;
    comment?: string;
    tags?: FeedbackTag[];
  }): RecommendationFeedback {
    const id = createId();
    const feedback: RecommendationFeedback = {
      id,
      recommendationId: params.recommendationId,
      brandId: params.brandId,
      userId: params.userId,
      rating: params.rating,
      helpful: params.helpful,
      comment: params.comment,
      tags: params.tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.feedback.set(id, feedback);

    // Index by recommendation
    const recFeedback = this.byRecommendation.get(params.recommendationId) || [];
    recFeedback.push(id);
    this.byRecommendation.set(params.recommendationId, recFeedback);

    // Index by brand
    const brandFeedback = this.byBrand.get(params.brandId) || [];
    brandFeedback.push(id);
    this.byBrand.set(params.brandId, brandFeedback);

    return feedback;
  }

  /**
   * Update feedback with outcome
   */
  updateOutcome(
    feedbackId: string,
    outcome: FeedbackOutcome
  ): RecommendationFeedback | undefined {
    const feedback = this.feedback.get(feedbackId);
    if (!feedback) return undefined;

    feedback.outcome = outcome;
    feedback.updatedAt = new Date();
    this.feedback.set(feedbackId, feedback);

    return feedback;
  }

  /**
   * Update feedback with metrics
   */
  updateMetrics(
    feedbackId: string,
    metrics: FeedbackMetrics
  ): RecommendationFeedback | undefined {
    const feedback = this.feedback.get(feedbackId);
    if (!feedback) return undefined;

    feedback.metrics = metrics;
    feedback.updatedAt = new Date();
    this.feedback.set(feedbackId, feedback);

    return feedback;
  }

  /**
   * Get feedback by ID
   */
  getFeedback(id: string): RecommendationFeedback | undefined {
    return this.feedback.get(id);
  }

  /**
   * Get all feedback for a recommendation
   */
  getRecommendationFeedback(recommendationId: string): RecommendationFeedback[] {
    const feedbackIds = this.byRecommendation.get(recommendationId) || [];
    return feedbackIds
      .map((id) => this.feedback.get(id))
      .filter((f): f is RecommendationFeedback => f !== undefined);
  }

  /**
   * Get all feedback for a brand
   */
  getBrandFeedback(brandId: string): RecommendationFeedback[] {
    const feedbackIds = this.byBrand.get(brandId) || [];
    return feedbackIds
      .map((id) => this.feedback.get(id))
      .filter((f): f is RecommendationFeedback => f !== undefined);
  }

  /**
   * Get feedback statistics for a recommendation
   */
  getRecommendationStats(recommendationId: string): FeedbackStats {
    const feedback = this.getRecommendationFeedback(recommendationId);
    return this.calculateStats(feedback);
  }

  /**
   * Get feedback statistics for a brand
   */
  getBrandStats(brandId: string): FeedbackStats {
    const feedback = this.getBrandFeedback(brandId);
    return this.calculateStats(feedback);
  }

  /**
   * Get global feedback statistics
   */
  getGlobalStats(): FeedbackStats {
    const allFeedback = Array.from(this.feedback.values());
    return this.calculateStats(allFeedback);
  }

  /**
   * Calculate statistics from feedback array
   */
  private calculateStats(feedback: RecommendationFeedback[]): FeedbackStats {
    if (feedback.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        helpfulPercentage: 0,
        implementationRate: 0,
        successRate: 0,
        tagDistribution: {} as Record<FeedbackTag, number>,
        averageImpact: 0,
      };
    }

    // Calculate averages
    const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
    const helpfulCount = feedback.filter((f) => f.helpful).length;

    // Implementation stats
    const withOutcome = feedback.filter((f) => f.outcome);
    const implemented = withOutcome.filter((f) => f.outcome?.implemented);
    const successful = implemented.filter((f) => f.outcome?.success);

    // Tag distribution
    const tagDistribution: Record<string, number> = {};
    for (const f of feedback) {
      for (const tag of f.tags || []) {
        tagDistribution[tag] = (tagDistribution[tag] || 0) + 1;
      }
    }

    // Impact calculation
    const impactValues = withOutcome
      .filter((f) => f.outcome?.impactMeasured !== undefined)
      .map((f) => f.outcome!.impactMeasured!);
    const averageImpact =
      impactValues.length > 0
        ? impactValues.reduce((sum, v) => sum + v, 0) / impactValues.length
        : 0;

    return {
      totalFeedback: feedback.length,
      averageRating: totalRating / feedback.length,
      helpfulPercentage: (helpfulCount / feedback.length) * 100,
      implementationRate:
        withOutcome.length > 0
          ? (implemented.length / withOutcome.length) * 100
          : 0,
      successRate:
        implemented.length > 0
          ? (successful.length / implemented.length) * 100
          : 0,
      tagDistribution: tagDistribution as Record<FeedbackTag, number>,
      averageImpact,
    };
  }

  /**
   * Get recommendations needing review based on poor feedback
   */
  getRecommendationsNeedingReview(threshold: number = 3): string[] {
    const recommendations: string[] = [];

    for (const [recId, feedbackIds] of this.byRecommendation) {
      const feedback = feedbackIds
        .map((id) => this.feedback.get(id))
        .filter((f): f is RecommendationFeedback => f !== undefined);

      if (feedback.length < 3) continue; // Need minimum feedback

      const avgRating =
        feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;

      if (avgRating < threshold) {
        recommendations.push(recId);
      }
    }

    return recommendations;
  }

  /**
   * Export feedback for ML training
   */
  exportForTraining(): TrainingData[] {
    return Array.from(this.feedback.values())
      .filter((f) => f.outcome !== undefined)
      .map((f) => ({
        recommendationId: f.recommendationId,
        rating: f.rating,
        helpful: f.helpful,
        tags: f.tags || [],
        implemented: f.outcome?.implemented || false,
        success: f.outcome?.success || false,
        impact: f.outcome?.impactMeasured,
        timeToImplement: f.metrics?.timeToImplement,
        effortRating: f.metrics?.effortRating,
        beforeScore: f.metrics?.beforeScore,
        afterScore: f.metrics?.afterScore,
      }));
  }
}

// Training data type for ML
export interface TrainingData {
  recommendationId: string;
  rating: number;
  helpful: boolean;
  tags: FeedbackTag[];
  implemented: boolean;
  success: boolean;
  impact?: number;
  timeToImplement?: number;
  effortRating?: number;
  beforeScore?: number;
  afterScore?: number;
}

/**
 * Create feedback API response
 */
export function formatFeedbackResponse(feedback: RecommendationFeedback) {
  return {
    id: feedback.id,
    recommendationId: feedback.recommendationId,
    rating: feedback.rating,
    helpful: feedback.helpful,
    comment: feedback.comment,
    tags: feedback.tags,
    outcome: feedback.outcome
      ? {
          implemented: feedback.outcome.implemented,
          success: feedback.outcome.success,
          impact: feedback.outcome.impactMeasured,
        }
      : null,
    createdAt: feedback.createdAt.toISOString(),
  };
}

// Export singleton manager
export const feedbackManager = new FeedbackManager();
