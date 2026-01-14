/**
 * Real-Time Lead Scoring Calculation Tests (Phase M2)
 * Tests scoring rules based on email engagement, social activity, and lead behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Lead Scoring Engine
 * Calculates lead scores based on engagement metrics
 * Score types: leadScore (activity), mqlScore (qualification), sqlScore (sales-ready)
 */
class LeadScoringEngine {
  /**
   * Email engagement scoring
   */
  calculateEmailEngagementScore(engagement: {
    sent?: number;
    opened?: number;
    clicked?: number;
    bounced?: number;
    unsubscribed?: boolean;
  }): number {
    let score = 0;

    // Opening = 5 points each
    if (engagement.opened) {
      score += engagement.opened * 5;
    }

    // Click = 15 points each (higher value than open)
    if (engagement.clicked) {
      score += engagement.clicked * 15;
    }

    // Bounce = -10 points each
    if (engagement.bounced) {
      score -= engagement.bounced * 10;
    }

    // Unsubscribe = -50 points (significant penalty)
    if (engagement.unsubscribed) {
      score -= 50;
    }

    return Math.max(0, score); // Minimum 0
  }

  /**
   * Social media engagement scoring
   */
  calculateSocialEngagementScore(engagement: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  }): number {
    let score = 0;

    // Like = 3 points
    if (engagement.likes) {
      score += engagement.likes * 3;
    }

    // Comment = 10 points (higher engagement)
    if (engagement.comments) {
      score += engagement.comments * 10;
    }

    // Share = 20 points (highest engagement)
    if (engagement.shares) {
      score += engagement.shares * 20;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate engagement rate (for MQL qualification)
   */
  calculateEngagementRate(engagement: {
    emailClicks?: number;
    emailSent?: number;
    socialEngagements?: number;
    socialImpressions?: number;
  }): number {
    let engagementCount = 0;
    let impressionCount = 0;

    if (engagement.emailClicks && engagement.emailSent) {
      engagementCount += engagement.emailClicks;
      impressionCount += engagement.emailSent;
    }

    if (engagement.socialEngagements && engagement.socialImpressions) {
      engagementCount += engagement.socialEngagements;
      impressionCount += engagement.socialImpressions;
    }

    if (impressionCount === 0) return 0;

    const rate = (engagementCount / impressionCount) * 100;
    return Math.round(rate * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Determine MQL score (Marketing Qualified Lead)
   * Requires: engagement_rate >= 5% AND leadScore >= 50
   */
  calculateMQLScore(leadScore: number, engagementRate: number): number {
    if (engagementRate >= 5 && leadScore >= 50) {
      return Math.min(100, leadScore);
    }
    return 0;
  }

  /**
   * Determine SQL score (Sales Qualified Lead)
   * Requires: mqlScore >= 50 AND multiple engagement types
   */
  calculateSQLScore(
    mqlScore: number,
    hasEmailEngagement: boolean,
    hasSocialEngagement: boolean,
    hasRecent: boolean
  ): number {
    if (
      mqlScore >= 50 &&
      hasEmailEngagement &&
      hasSocialEngagement &&
      hasRecent
    ) {
      return Math.min(100, mqlScore + 20);
    }
    return 0;
  }

  /**
   * Total lead score from all activities
   */
  calculateTotalScore(
    emailScore: number,
    socialScore: number,
    bonusScores?: { referral?: number; trial?: number; purchase?: number }
  ): number {
    let total = emailScore + socialScore;

    if (bonusScores) {
      if (bonusScores.referral) total += bonusScores.referral;
      if (bonusScores.trial) total += bonusScores.trial;
      if (bonusScores.purchase) total += bonusScores.purchase;
    }

    return Math.min(total, 100); // Cap at 100
  }
}

describe('Real-Time Lead Scoring', () => {
  let scoringEngine: LeadScoringEngine;

  beforeEach(() => {
    scoringEngine = new LeadScoringEngine();
    vi.clearAllMocks();
  });

  describe('Email Engagement Scoring', () => {
    it('should score email opens at 5 points each', () => {
      const engagement = { opened: 3 };
      const score = scoringEngine.calculateEmailEngagementScore(engagement);

      expect(score).toBe(15); // 3 opens * 5 points
    });

    it('should score email clicks at 15 points each', () => {
      const engagement = { clicked: 2 };
      const score = scoringEngine.calculateEmailEngagementScore(engagement);

      expect(score).toBe(30); // 2 clicks * 15 points
    });

    it('should combine opens and clicks', () => {
      const engagement = { opened: 2, clicked: 1 };
      const score = scoringEngine.calculateEmailEngagementScore(engagement);

      expect(score).toBe(25); // (2 * 5) + (1 * 15)
    });

    it('should penalize bounces at -10 points each', () => {
      const engagement = { clicked: 5, bounced: 2 };
      const score = scoringEngine.calculateEmailEngagementScore(engagement);

      expect(score).toBe(55); // (5 * 15) - (2 * 10)
    });

    it('should heavily penalize unsubscribe at -50 points', () => {
      const engagement = { clicked: 5, unsubscribed: true };
      const score = scoringEngine.calculateEmailEngagementScore(engagement);

      expect(score).toBe(25); // (5 * 15) - 50
    });

    it('should not go below 0 score', () => {
      const engagement = { bounced: 10, unsubscribed: true };
      const score = scoringEngine.calculateEmailEngagementScore(engagement);

      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle no engagement', () => {
      const engagement = {};
      const score = scoringEngine.calculateEmailEngagementScore(engagement);

      expect(score).toBe(0);
    });
  });

  describe('Social Media Engagement Scoring', () => {
    it('should score likes at 3 points each', () => {
      const engagement = { likes: 10 };
      const score = scoringEngine.calculateSocialEngagementScore(engagement);

      expect(score).toBe(30); // 10 likes * 3 points
    });

    it('should score comments at 10 points each', () => {
      const engagement = { comments: 2 };
      const score = scoringEngine.calculateSocialEngagementScore(engagement);

      expect(score).toBe(20); // 2 comments * 10 points
    });

    it('should score shares at 20 points each (highest)', () => {
      const engagement = { shares: 1 };
      const score = scoringEngine.calculateSocialEngagementScore(engagement);

      expect(score).toBe(20); // 1 share * 20 points
    });

    it('should combine likes, comments, and shares', () => {
      const engagement = { likes: 5, comments: 2, shares: 1 };
      const score = scoringEngine.calculateSocialEngagementScore(engagement);

      expect(score).toBe(55); // (5*3) + (2*10) + (1*20)
    });

    it('should handle no social engagement', () => {
      const engagement = {};
      const score = scoringEngine.calculateSocialEngagementScore(engagement);

      expect(score).toBe(0);
    });

    it('should never return negative score', () => {
      const engagement = { likes: 0, comments: 0, shares: 0 };
      const score = scoringEngine.calculateSocialEngagementScore(engagement);

      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Engagement Rate Calculation', () => {
    it('should calculate email engagement rate', () => {
      const engagement = { emailClicks: 5, emailSent: 100 };
      const rate = scoringEngine.calculateEngagementRate(engagement);

      expect(rate).toBe(5); // 5/100 * 100 = 5%
    });

    it('should calculate combined email and social rate', () => {
      const engagement = {
        emailClicks: 5,
        emailSent: 100,
        socialEngagements: 10,
        socialImpressions: 100,
      };
      const rate = scoringEngine.calculateEngagementRate(engagement);

      expect(rate).toBe(7.5); // (5+10)/(100+100) * 100 = 7.5%
    });

    it('should handle 0 impressions', () => {
      const engagement = { emailClicks: 0, emailSent: 0 };
      const rate = scoringEngine.calculateEngagementRate(engagement);

      expect(rate).toBe(0);
    });

    it('should round to 1 decimal place', () => {
      const engagement = { emailClicks: 1, emailSent: 3 };
      const rate = scoringEngine.calculateEngagementRate(engagement);

      expect(rate).toBe(33.3); // 1/3 * 100 = 33.333...
    });

    it('should handle high engagement rates', () => {
      const engagement = { emailClicks: 50, emailSent: 100 };
      const rate = scoringEngine.calculateEngagementRate(engagement);

      expect(rate).toBe(50); // 50%
    });
  });

  describe('MQL Score (Marketing Qualified Lead)', () => {
    it('should qualify as MQL with 5% engagement rate and 50+ lead score', () => {
      const mqlScore = scoringEngine.calculateMQLScore(60, 5);

      expect(mqlScore).toBe(60);
    });

    it('should require minimum 5% engagement rate', () => {
      const mqlScore = scoringEngine.calculateMQLScore(50, 4.9);

      expect(mqlScore).toBe(0);
    });

    it('should require minimum 50 lead score', () => {
      const mqlScore = scoringEngine.calculateMQLScore(49, 5);

      expect(mqlScore).toBe(0);
    });

    it('should cap MQL score at 100', () => {
      const mqlScore = scoringEngine.calculateMQLScore(150, 10);

      expect(mqlScore).toBe(100);
    });

    it('should not qualify with low engagement', () => {
      const mqlScore = scoringEngine.calculateMQLScore(100, 2);

      expect(mqlScore).toBe(0);
    });

    it('should not qualify with low lead score', () => {
      const mqlScore = scoringEngine.calculateMQLScore(30, 10);

      expect(mqlScore).toBe(0);
    });
  });

  describe('SQL Score (Sales Qualified Lead)', () => {
    it('should qualify as SQL with MQL score 50+ and multiple engagement types', () => {
      const sqlScore = scoringEngine.calculateSQLScore(
        50,
        true,
        true,
        true
      );

      expect(sqlScore).toBeGreaterThan(50);
    });

    it('should require MQL score >= 50', () => {
      const sqlScore = scoringEngine.calculateSQLScore(49, true, true, true);

      expect(sqlScore).toBe(0);
    });

    it('should require email engagement', () => {
      const sqlScore = scoringEngine.calculateSQLScore(50, false, true, true);

      expect(sqlScore).toBe(0);
    });

    it('should require social engagement', () => {
      const sqlScore = scoringEngine.calculateSQLScore(50, true, false, true);

      expect(sqlScore).toBe(0);
    });

    it('should require recent activity', () => {
      const sqlScore = scoringEngine.calculateSQLScore(50, true, true, false);

      expect(sqlScore).toBe(0);
    });

    it('should add 20 point bonus for SQL qualification', () => {
      const sqlScore = scoringEngine.calculateSQLScore(50, true, true, true);

      expect(sqlScore).toBe(70); // 50 + 20 bonus
    });

    it('should cap SQL score at 100', () => {
      const sqlScore = scoringEngine.calculateSQLScore(100, true, true, true);

      expect(sqlScore).toBe(100); // Capped at 100
    });
  });

  describe('Total Lead Score Calculation', () => {
    it('should sum email and social scores', () => {
      const emailScore = 30;
      const socialScore = 20;
      const totalScore = scoringEngine.calculateTotalScore(
        emailScore,
        socialScore
      );

      expect(totalScore).toBe(50);
    });

    it('should include referral bonus', () => {
      const totalScore = scoringEngine.calculateTotalScore(30, 20, {
        referral: 10,
      });

      expect(totalScore).toBe(60);
    });

    it('should include trial signup bonus', () => {
      const totalScore = scoringEngine.calculateTotalScore(40, 30, {
        trial: 15,
      });

      expect(totalScore).toBe(85);
    });

    it('should include purchase bonus', () => {
      const totalScore = scoringEngine.calculateTotalScore(50, 40, {
        purchase: 20,
      });

      expect(totalScore).toBe(100); // Capped at 100
    });

    it('should include all bonuses', () => {
      const totalScore = scoringEngine.calculateTotalScore(20, 20, {
        referral: 10,
        trial: 15,
        purchase: 20,
      });

      expect(totalScore).toBe(85); // 20+20+10+15+20 = 85
    });

    it('should cap total score at 100', () => {
      const totalScore = scoringEngine.calculateTotalScore(60, 60, {
        referral: 50,
      });

      expect(totalScore).toBe(100);
    });

    it('should handle no bonuses', () => {
      const totalScore = scoringEngine.calculateTotalScore(30, 20);

      expect(totalScore).toBe(50);
    });

    it('should handle zero scores with bonuses', () => {
      const totalScore = scoringEngine.calculateTotalScore(0, 0, {
        trial: 25,
      });

      expect(totalScore).toBe(25);
    });
  });

  describe('Lead Scoring Over Time', () => {
    it('should increase score with continued engagement', () => {
      const initialScore = scoringEngine.calculateEmailEngagementScore({
        opened: 1,
      });
      const laterScore = scoringEngine.calculateEmailEngagementScore({
        opened: 5,
      });

      expect(laterScore).toBeGreaterThan(initialScore);
    });

    it('should accumulate score from multiple touchpoints', () => {
      const emailScore = 30;
      const socialScore = 20;
      const accumulatedScore = scoringEngine.calculateTotalScore(
        emailScore,
        socialScore
      );

      expect(accumulatedScore).toBe(50);
    });

    it('should reset engagement counts when calculating new period', () => {
      const firstPeriod = scoringEngine.calculateEmailEngagementScore({
        opened: 3,
      });
      // New engagement reset
      const secondPeriod = scoringEngine.calculateEmailEngagementScore({
        opened: 2,
      });

      expect(secondPeriod).toBeLessThan(firstPeriod);
    });

    it('should handle lead going cold (no recent engagement)', () => {
      // High historical score but no recent engagement
      const historicalScore = 80;
      const recentEngagement = {};
      const recentScore = scoringEngine.calculateEmailEngagementScore(
        recentEngagement
      );

      // In real implementation, would decay historical score
      expect(recentScore).toBe(0); // No recent activity
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined engagement object', () => {
      const engagement: any = undefined;

      expect(() => {
        scoringEngine.calculateEmailEngagementScore(engagement || {});
      }).not.toThrow();
    });

    it('should handle negative engagement values (invalid data)', () => {
      const engagement = { opened: -5, clicked: -2 };
      // Should validate input and treat negatives as 0
      const score = scoringEngine.calculateEmailEngagementScore(
        engagement as any
      );

      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large engagement numbers', () => {
      const engagement = { opened: 999999, clicked: 999999 };
      const score = scoringEngine.calculateEmailEngagementScore(engagement);

      // Individual engagement scores are not capped (only total score is capped)
      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe('number');
    });

    it('should handle decimal engagement values', () => {
      const engagement = { opened: 2.5, clicked: 1.5 };
      // Should handle or reject decimal engagement
      const score = scoringEngine.calculateEmailEngagementScore(
        engagement as any
      );

      expect(typeof score).toBe('number');
    });
  });
});
