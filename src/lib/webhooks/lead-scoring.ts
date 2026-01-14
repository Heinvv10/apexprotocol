/**
 * Lead Scoring Engine
 * Calculates lead scores based on engagement metrics
 * Score types: leadScore (activity), mqlScore (qualification), sqlScore (sales-ready)
 */

export interface EmailEngagement {
  sent?: number;
  opened?: number;
  clicked?: number;
  bounced?: number;
  unsubscribed?: boolean;
}

export interface SocialEngagement {
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
}

export interface EngagementMetrics {
  emailClicks?: number;
  emailSent?: number;
  socialEngagements?: number;
  socialImpressions?: number;
}

export interface BonusScores {
  referral?: number;
  trial?: number;
  purchase?: number;
}

/**
 * Lead Scoring Engine
 * Implements scoring rules based on email engagement, social activity, and lead behavior
 */
export class LeadScoringEngine {
  // Scoring weights
  private readonly EMAIL_OPEN_POINTS = 5;
  private readonly EMAIL_CLICK_POINTS = 15;
  private readonly EMAIL_BOUNCE_PENALTY = 10;
  private readonly EMAIL_UNSUBSCRIBE_PENALTY = 50;

  private readonly SOCIAL_LIKE_POINTS = 3;
  private readonly SOCIAL_COMMENT_POINTS = 10;
  private readonly SOCIAL_SHARE_POINTS = 20;

  // Qualification thresholds
  private readonly MQL_ENGAGEMENT_RATE_THRESHOLD = 5; // 5%
  private readonly MQL_LEAD_SCORE_THRESHOLD = 50;
  private readonly SQL_MQL_SCORE_THRESHOLD = 50;
  private readonly SQL_BONUS = 20;

  private readonly MAX_SCORE = 100;

  /**
   * Email engagement scoring
   * Opens: 5pts, Clicks: 15pts, Bounces: -10pts, Unsubscribe: -50pts
   */
  calculateEmailEngagementScore(engagement: EmailEngagement): number {
    let score = 0;

    if (engagement.opened) {
      score += engagement.opened * this.EMAIL_OPEN_POINTS;
    }

    if (engagement.clicked) {
      score += engagement.clicked * this.EMAIL_CLICK_POINTS;
    }

    if (engagement.bounced) {
      score -= engagement.bounced * this.EMAIL_BOUNCE_PENALTY;
    }

    if (engagement.unsubscribed) {
      score -= this.EMAIL_UNSUBSCRIBE_PENALTY;
    }

    return Math.max(0, score);
  }

  /**
   * Social media engagement scoring
   * Likes: 3pts, Comments: 10pts, Shares: 20pts
   */
  calculateSocialEngagementScore(engagement: SocialEngagement): number {
    let score = 0;

    if (engagement.likes) {
      score += engagement.likes * this.SOCIAL_LIKE_POINTS;
    }

    if (engagement.comments) {
      score += engagement.comments * this.SOCIAL_COMMENT_POINTS;
    }

    if (engagement.shares) {
      score += engagement.shares * this.SOCIAL_SHARE_POINTS;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate engagement rate (for MQL qualification)
   * Returns percentage of engagements per impressions
   */
  calculateEngagementRate(engagement: EngagementMetrics): number {
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
    if (
      engagementRate >= this.MQL_ENGAGEMENT_RATE_THRESHOLD &&
      leadScore >= this.MQL_LEAD_SCORE_THRESHOLD
    ) {
      return Math.min(this.MAX_SCORE, leadScore);
    }
    return 0;
  }

  /**
   * Determine SQL score (Sales Qualified Lead)
   * Requires: mqlScore >= 50 AND multiple engagement types AND recent activity
   */
  calculateSQLScore(
    mqlScore: number,
    hasEmailEngagement: boolean,
    hasSocialEngagement: boolean,
    hasRecent: boolean
  ): number {
    if (
      mqlScore >= this.SQL_MQL_SCORE_THRESHOLD &&
      hasEmailEngagement &&
      hasSocialEngagement &&
      hasRecent
    ) {
      return Math.min(this.MAX_SCORE, mqlScore + this.SQL_BONUS);
    }
    return 0;
  }

  /**
   * Total lead score from all activities
   * Combines email score, social score, and bonus scores
   * Capped at 100
   */
  calculateTotalScore(
    emailScore: number,
    socialScore: number,
    bonusScores?: BonusScores
  ): number {
    let total = emailScore + socialScore;

    if (bonusScores) {
      if (bonusScores.referral) total += bonusScores.referral;
      if (bonusScores.trial) total += bonusScores.trial;
      if (bonusScores.purchase) total += bonusScores.purchase;
    }

    return Math.min(total, this.MAX_SCORE);
  }

  /**
   * Calculate full lead qualification scores
   */
  calculateLeadQualification(
    emailEngagement: EmailEngagement,
    socialEngagement: SocialEngagement,
    engagementMetrics: EngagementMetrics,
    hasRecent: boolean,
    bonusScores?: BonusScores
  ): {
    emailScore: number;
    socialScore: number;
    totalScore: number;
    engagementRate: number;
    mqlScore: number;
    sqlScore: number;
  } {
    const emailScore = this.calculateEmailEngagementScore(emailEngagement);
    const socialScore = this.calculateSocialEngagementScore(socialEngagement);
    const totalScore = this.calculateTotalScore(emailScore, socialScore, bonusScores);
    const engagementRate = this.calculateEngagementRate(engagementMetrics);
    const mqlScore = this.calculateMQLScore(totalScore, engagementRate);
    const sqlScore = this.calculateSQLScore(
      mqlScore,
      emailScore > 0,
      socialScore > 0,
      hasRecent
    );

    return {
      emailScore,
      socialScore,
      totalScore,
      engagementRate,
      mqlScore,
      sqlScore,
    };
  }
}

// Export singleton instance
export const leadScoringEngine = new LeadScoringEngine();
