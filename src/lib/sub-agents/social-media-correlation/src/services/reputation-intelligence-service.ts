/**
 * ReputationIntelligenceService
 * Aggregates sentiment, mentions, and narratives into comprehensive reputation scores
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Configuration schema
const reputationIntelligenceConfigSchema = z.object({
  scoreWeights: z
    .object({
      sentiment: z.number().min(0).max(1).default(0.35),
      volume: z.number().min(0).max(1).default(0.15),
      reach: z.number().min(0).max(1).default(0.2),
      engagement: z.number().min(0).max(1).default(0.2),
      consistency: z.number().min(0).max(1).default(0.1),
    })
    .default({
      sentiment: 0.35,
      volume: 0.15,
      reach: 0.2,
      engagement: 0.2,
      consistency: 0.1,
    }),
  historicalWindowDays: z.number().positive().int().default(90),
  alertThresholds: z
    .object({
      criticalDrop: z.number().positive().default(15),
      significantChange: z.number().positive().default(10),
      minorChange: z.number().positive().default(5),
    })
    .default({
      criticalDrop: 15,
      significantChange: 10,
      minorChange: 5,
    }),
  benchmarkEnabled: z.boolean().default(true),
  realTimeUpdatesEnabled: z.boolean().default(true),
});

export type ReputationIntelligenceConfig = z.infer<typeof reputationIntelligenceConfigSchema>;

export interface Mention {
  id: string;
  platform: string;
  brandId: string;
  content: string;
  author: string;
  timestamp: Date;
  sentiment?: number;
  reach?: number;
  engagement?: {
    likes: number;
    shares: number;
    comments: number;
  };
}

export interface ReputationScore {
  overall: number; // 0-100
  components: {
    sentiment: number;
    volume: number;
    reach: number;
    engagement: number;
    consistency: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
  timestamp: Date;
}

export interface ReputationReport {
  brandId: string;
  currentScore: ReputationScore;
  historicalScores: ReputationScore[];
  platformBreakdown: Record<string, ReputationScore>;
  topPositiveFactors: string[];
  topNegativeFactors: string[];
  recommendations: string[];
  competitorComparison?: {
    brandId: string;
    scoreDifference: number;
    position: number;
  }[];
  timeRange: { start: Date; end: Date };
}

export interface ReputationAlert {
  id: string;
  type: 'critical_drop' | 'significant_change' | 'recovery' | 'new_high' | 'competitor_overtake';
  severity: 'low' | 'medium' | 'high' | 'critical';
  brandId: string;
  message: string;
  scoreBefore: number;
  scoreAfter: number;
  timestamp: Date;
  triggeredBy: string[];
}

export interface BenchmarkData {
  industry: string;
  averageScore: number;
  topQuartileScore: number;
  bottomQuartileScore: number;
  sampleSize: number;
}

export interface ReputationStats {
  reportsGenerated: number;
  alertsTriggered: number;
  brandsMonitored: number;
  averageScoreAcrossBrands: number;
  processingTimeMs: number;
}

/**
 * ReputationIntelligenceService
 * Provides reputation scoring, reporting, and alerting
 */
export class ReputationIntelligenceService extends EventEmitter {
  private config: ReputationIntelligenceConfig;
  private stats: ReputationStats = {
    reportsGenerated: 0,
    alertsTriggered: 0,
    brandsMonitored: 0,
    averageScoreAcrossBrands: 0,
    processingTimeMs: 0,
  };
  private brandScores = new Map<string, ReputationScore[]>();
  private activeAlerts: ReputationAlert[] = [];
  private alertCallbacks: ((alert: ReputationAlert) => void)[] = [];
  private isInitialized: boolean = false;

  constructor(config: Partial<ReputationIntelligenceConfig> = {}) {
    super();
    this.config = reputationIntelligenceConfigSchema.parse(config);
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false;
    this.brandScores.clear();
    this.activeAlerts = [];
    this.alertCallbacks = [];
    this.emit('shutdown');
  }

  getConfig(): ReputationIntelligenceConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ReputationIntelligenceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  // =============================
  // Core Reputation Scoring
  // =============================

  async calculateReputationScore(brandId: string, mentions: Mention[]): Promise<ReputationScore> {
    const startTime = Date.now();

    // Calculate sentiment component (0-100)
    const sentiments = mentions.map((m) => m.sentiment || 0);
    const avgSentiment =
      sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0;
    const sentimentScore = ((avgSentiment + 1) / 2) * 100; // Convert -1 to 1 range to 0-100

    // Calculate volume component (based on mention count)
    const volumeScore = Math.min(100, mentions.length * 2);

    // Calculate reach component
    const totalReach = mentions.reduce((sum, m) => sum + (m.reach || 0), 0);
    const reachScore = Math.min(100, totalReach / 1000);

    // Calculate engagement component
    const totalEngagement = mentions.reduce((sum, m) => {
      const eng = m.engagement || { likes: 0, shares: 0, comments: 0 };
      return sum + eng.likes + eng.shares * 2 + eng.comments * 3;
    }, 0);
    const engagementScore = Math.min(100, totalEngagement / 100);

    // Calculate consistency (standard deviation of sentiment)
    const variance =
      sentiments.length > 1
        ? sentiments.reduce((sum, s) => sum + Math.pow(s - avgSentiment, 2), 0) / sentiments.length
        : 0;
    const consistencyScore = 100 - Math.min(100, Math.sqrt(variance) * 50);

    // Calculate weighted overall score
    const {
      sentiment: sw,
      volume: vw,
      reach: rw,
      engagement: ew,
      consistency: cw,
    } = this.config.scoreWeights;
    const overall =
      sentimentScore * sw +
      volumeScore * vw +
      reachScore * rw +
      engagementScore * ew +
      consistencyScore * cw;

    // Determine trend
    const existingScores = this.brandScores.get(brandId) || [];
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (existingScores.length > 0) {
      const lastScore = existingScores[existingScores.length - 1].overall;
      if (overall > lastScore + 5) trend = 'improving';
      else if (overall < lastScore - 5) trend = 'declining';
    }

    const score: ReputationScore = {
      overall: Math.round(overall * 10) / 10,
      components: {
        sentiment: Math.round(sentimentScore * 10) / 10,
        volume: Math.round(volumeScore * 10) / 10,
        reach: Math.round(reachScore * 10) / 10,
        engagement: Math.round(engagementScore * 10) / 10,
        consistency: Math.round(consistencyScore * 10) / 10,
      },
      trend,
      confidence: Math.min(1, mentions.length / 50),
      timestamp: new Date(),
    };

    this.stats.processingTimeMs += Date.now() - startTime;
    return score;
  }

  async getReputationScore(brandId: string): Promise<ReputationScore | null> {
    const scores = this.brandScores.get(brandId);
    return scores && scores.length > 0 ? scores[scores.length - 1] : null;
  }

  async updateReputationScore(brandId: string, mentions: Mention[]): Promise<ReputationScore> {
    const score = await this.calculateReputationScore(brandId, mentions);

    if (!this.brandScores.has(brandId)) {
      this.brandScores.set(brandId, []);
      this.stats.brandsMonitored++;
    }

    this.brandScores.get(brandId)!.push(score);

    // Check for alerts
    const alerts = await this.checkForAlerts(brandId, score);
    if (alerts.length > 0) {
      this.stats.alertsTriggered += alerts.length;
      this.activeAlerts.push(...alerts);
      alerts.forEach((alert) => {
        this.alertCallbacks.forEach((cb) => cb(alert));
        this.emit('alert', alert);
      });
    }

    // Update average score
    let totalScore = 0;
    let count = 0;
    this.brandScores.forEach((scores) => {
      if (scores.length > 0) {
        totalScore += scores[scores.length - 1].overall;
        count++;
      }
    });
    this.stats.averageScoreAcrossBrands = count > 0 ? totalScore / count : 0;

    this.emit('scoreUpdated', { brandId, score });
    return score;
  }

  // =============================
  // Reputation Reports
  // =============================

  async generateReport(
    brandId: string,
    options: {
      includeHistorical?: boolean;
      includePlatformBreakdown?: boolean;
      includeRecommendations?: boolean;
      timeRangeDays?: number;
    } = {}
  ): Promise<ReputationReport> {
    const {
      includeHistorical = true,
      includePlatformBreakdown = true,
      includeRecommendations = true,
      timeRangeDays = 30,
    } = options;

    const startTime = Date.now();
    const currentScore = await this.getReputationScore(brandId);

    if (!currentScore) {
      throw new Error(`No reputation data for brand ${brandId}`);
    }

    const historicalScores = includeHistorical
      ? await this.getHistoricalScores(brandId, timeRangeDays)
      : [];

    const platformBreakdown = includePlatformBreakdown
      ? await this.compareAcrossPlatforms(brandId)
      : {};

    const topPositiveFactors: string[] = [];
    const topNegativeFactors: string[] = [];
    const recommendations: string[] = [];

    // Analyze components for factors
    if (currentScore.components.sentiment > 70) {
      topPositiveFactors.push('Strong positive sentiment');
    } else if (currentScore.components.sentiment < 40) {
      topNegativeFactors.push('Negative sentiment trend');
      recommendations.push('Address negative feedback with targeted communication');
    }

    if (currentScore.components.engagement > 70) {
      topPositiveFactors.push('High engagement levels');
    } else if (currentScore.components.engagement < 30) {
      topNegativeFactors.push('Low audience engagement');
      recommendations.push('Increase interactive content to boost engagement');
    }

    if (currentScore.components.reach > 70) {
      topPositiveFactors.push('Strong brand visibility');
    }

    if (currentScore.trend === 'declining') {
      topNegativeFactors.push('Declining reputation trend');
      recommendations.push('Investigate recent negative mentions');
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - timeRangeDays * 24 * 60 * 60 * 1000);

    const report: ReputationReport = {
      brandId,
      currentScore,
      historicalScores,
      platformBreakdown,
      topPositiveFactors,
      topNegativeFactors,
      recommendations: includeRecommendations ? recommendations : [],
      timeRange: { start: startDate, end: endDate },
    };

    this.stats.reportsGenerated++;
    this.stats.processingTimeMs += Date.now() - startTime;

    this.emit('reportGenerated', report);
    return report;
  }

  async getHistoricalScores(brandId: string, days = 30): Promise<ReputationScore[]> {
    const scores = this.brandScores.get(brandId) || [];
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return scores.filter((s) => s.timestamp >= cutoff);
  }

  // =============================
  // Platform-Specific Analysis
  // =============================

  async getScoreByPlatform(brandId: string, platform: string): Promise<ReputationScore | null> {
    // In real implementation, would filter mentions by platform
    const scores = this.brandScores.get(brandId);
    return scores && scores.length > 0 ? scores[scores.length - 1] : null;
  }

  async compareAcrossPlatforms(brandId: string): Promise<Record<string, ReputationScore>> {
    const baseScore = await this.getReputationScore(brandId);
    if (!baseScore) return {};

    // Mock platform-specific scores
    const platforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'reddit'];
    const result: Record<string, ReputationScore> = {};

    platforms.forEach((platform) => {
      const variation = (Math.random() - 0.5) * 20;
      result[platform] = {
        ...baseScore,
        overall: Math.max(0, Math.min(100, baseScore.overall + variation)),
        timestamp: new Date(),
      };
    });

    return result;
  }

  // =============================
  // Trend Analysis
  // =============================

  async analyzeTrend(
    brandId: string,
    days = 30
  ): Promise<{
    trend: 'improving' | 'stable' | 'declining';
    changePercent: number;
    periodDays: number;
    significantEvents: string[];
  }> {
    const scores = await this.getHistoricalScores(brandId, days);

    if (scores.length < 2) {
      return {
        trend: 'stable' as const,
        changePercent: 0,
        periodDays: days,
        significantEvents: [],
      };
    }

    const firstScore = scores[0].overall;
    const lastScore = scores[scores.length - 1].overall;
    const changePercent = ((lastScore - firstScore) / firstScore) * 100;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (changePercent > 5) trend = 'improving';
    else if (changePercent < -5) trend = 'declining';

    const significantEvents: string[] = [];
    for (let i = 1; i < scores.length; i++) {
      const change = scores[i].overall - scores[i - 1].overall;
      if (Math.abs(change) > 10) {
        significantEvents.push(
          `${change > 0 ? 'Increase' : 'Decrease'} of ${Math.abs(change).toFixed(1)} points`
        );
      }
    }

    return { trend, changePercent, periodDays: days, significantEvents };
  }

  async predictFutureScore(
    brandId: string,
    daysAhead: number
  ): Promise<{
    predictedScore: number;
    confidence: number;
    factors: string[];
  }> {
    const scores = await this.getHistoricalScores(brandId, 90);

    if (scores.length < 3) {
      const current = await this.getReputationScore(brandId);
      return {
        predictedScore: current?.overall || 50,
        confidence: 0.2,
        factors: ['Insufficient historical data'],
      };
    }

    // Simple linear projection
    const recentScores = scores.slice(-7);
    const avgChange =
      recentScores.length > 1
        ? (recentScores[recentScores.length - 1].overall - recentScores[0].overall) /
          recentScores.length
        : 0;

    const currentScore = scores[scores.length - 1].overall;
    const predictedScore = Math.max(0, Math.min(100, currentScore + avgChange * daysAhead));

    const factors: string[] = [];
    if (avgChange > 0) factors.push('Positive momentum');
    if (avgChange < 0) factors.push('Negative momentum');
    if (scores.length > 30) factors.push('Strong historical baseline');

    return {
      predictedScore: Math.round(predictedScore * 10) / 10,
      confidence: Math.min(0.8, scores.length / 50),
      factors,
    };
  }

  // =============================
  // Alerting
  // =============================

  async checkForAlerts(brandId: string, newScore: ReputationScore): Promise<ReputationAlert[]> {
    const alerts: ReputationAlert[] = [];
    const previousScore = await this.getReputationScore(brandId);

    if (!previousScore) return alerts;

    const change = newScore.overall - previousScore.overall;
    const { criticalDrop, significantChange } = this.config.alertThresholds;

    if (change <= -criticalDrop) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'critical_drop',
        severity: 'critical',
        brandId,
        message: `Critical reputation drop: ${change.toFixed(1)} points`,
        scoreBefore: previousScore.overall,
        scoreAfter: newScore.overall,
        timestamp: new Date(),
        triggeredBy: ['score_change'],
      });
    } else if (change <= -significantChange) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'significant_change',
        severity: 'high',
        brandId,
        message: `Significant reputation decline: ${change.toFixed(1)} points`,
        scoreBefore: previousScore.overall,
        scoreAfter: newScore.overall,
        timestamp: new Date(),
        triggeredBy: ['score_change'],
      });
    } else if (
      change >= significantChange &&
      previousScore.overall < 50 &&
      newScore.overall >= 50
    ) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'recovery',
        severity: 'low',
        brandId,
        message: `Reputation recovery detected: +${change.toFixed(1)} points`,
        scoreBefore: previousScore.overall,
        scoreAfter: newScore.overall,
        timestamp: new Date(),
        triggeredBy: ['score_improvement'],
      });
    }

    return alerts;
  }

  async getActiveAlerts(brandId?: string): Promise<ReputationAlert[]> {
    if (brandId) {
      return this.activeAlerts.filter((a) => a.brandId === brandId);
    }
    return [...this.activeAlerts];
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const index = this.activeAlerts.findIndex((a) => a.id === alertId);
    if (index > -1) {
      this.activeAlerts.splice(index, 1);
      this.emit('alertAcknowledged', alertId);
    }
  }

  subscribeToAlerts(callback: (alert: ReputationAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  unsubscribeFromAlerts(callback: (alert: ReputationAlert) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  // =============================
  // Benchmarking
  // =============================

  // BROKEN: Returns synthetic benchmark data (Math.random()). A real implementation needs
  // an industry-aggregated benchmarks table or an external data feed. Callers in production
  // should not depend on this. See audit 2026-04-22.
  async getBenchmarkData(industry: string): Promise<BenchmarkData> {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_STUB_SUBAGENTS !== '1') {
      throw new Error(
        'getBenchmarkData returns synthetic data and is disabled in production. ' +
        'Wire a real benchmark source before enabling (ALLOW_STUB_SUBAGENTS=1 only for staging).'
      );
    }
    return {
      industry,
      averageScore: 55 + Math.random() * 20,
      topQuartileScore: 75 + Math.random() * 15,
      bottomQuartileScore: 30 + Math.random() * 15,
      sampleSize: 100 + Math.floor(Math.random() * 500),
    };
  }

  async compareToIndustry(
    brandId: string,
    industry: string
  ): Promise<{
    brandScore: number;
    industryAverage: number;
    percentile: number;
    position: 'above_average' | 'average' | 'below_average';
  }> {
    const brandScore = await this.getReputationScore(brandId);
    const benchmark = await this.getBenchmarkData(industry);

    const score = brandScore?.overall || 50;
    const percentile = Math.min(
      100,
      Math.max(
        0,
        ((score - benchmark.bottomQuartileScore) /
          (benchmark.topQuartileScore - benchmark.bottomQuartileScore)) *
          100
      )
    );

    let position: 'above_average' | 'average' | 'below_average' = 'average';
    if (score > benchmark.averageScore + 10) position = 'above_average';
    else if (score < benchmark.averageScore - 10) position = 'below_average';

    return {
      brandScore: score,
      industryAverage: benchmark.averageScore,
      percentile,
      position,
    };
  }

  async compareToCompetitors(
    brandId: string,
    competitorIds: string[]
  ): Promise<{
    rankings: { brandId: string; score: number; position: number }[];
    brandPosition: number;
  }> {
    const brandScore = await this.getReputationScore(brandId);
    const allBrands = [brandId, ...competitorIds];

    // BROKEN: Competitor scores are Math.random() — no real competitor-score source
    // is wired yet. Guarded via NODE_ENV so the stub can't silently ship to users.
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_STUB_SUBAGENTS !== '1') {
      throw new Error(
        'compareToCompetitors returns synthetic competitor scores and is disabled in production.'
      );
    }
    const rankings = await Promise.all(
      allBrands.map(async (id) => {
        const score =
          id === brandId ? brandScore?.overall || 50 : 40 + Math.random() * 40;
        return { brandId: id, score, position: 0 };
      })
    );

    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((r, i) => {
      r.position = i + 1;
    });

    const brandPosition = rankings.find((r) => r.brandId === brandId)?.position || 0;

    return { rankings, brandPosition };
  }

  // =============================
  // Statistics
  // =============================

  getStats(): ReputationStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      reportsGenerated: 0,
      alertsTriggered: 0,
      brandsMonitored: 0,
      averageScoreAcrossBrands: 0,
      processingTimeMs: 0,
    };
  }
}

/**
 * Factory function to create ReputationIntelligenceService
 */
export function createReputationIntelligenceService(
  config: Partial<ReputationIntelligenceConfig> = {}
): ReputationIntelligenceService {
  return new ReputationIntelligenceService(config);
}
