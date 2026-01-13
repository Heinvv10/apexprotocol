/**
 * PerformanceModelService
 * AI platform performance modeling and optimization for brand monitoring
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export type AIPlatform = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'grok' | 'deepseek';
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type AccelerationType = 'accelerating' | 'decelerating' | 'stable';
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export const PerformanceModelConfigSchema = z.object({
  brandName: z.string().default('Default'),
  platforms: z.array(z.string()).min(1, 'At least one platform is required'),
  benchmarkAgainstIndustry: z.boolean().default(true),
  trackCompetitors: z.array(z.string()).default([]),
  alertThreshold: z.number().min(0).max(1).default(0.3),
});

export type PerformanceModelConfig = z.infer<typeof PerformanceModelConfigSchema>;

export interface ResponseData {
  query: string;
  response: string;
  accuracy: number;
  issue?: string;
}

export interface CitationData {
  totalResponses: number;
  responseWithCitation: number;
}

export interface PerformanceData {
  platform: AIPlatform | string;
  period: { start: Date; end: Date };
  mentions: number;
  impressions: number;
  sentimentAverage: number;
  responseQuality: number;
  responses?: ResponseData[];
  citationData?: CitationData;
  competitorName?: string;
  brandName?: string;
}

export interface PerformanceMetrics {
  visibilityScore: number;
  responseAccuracy: number;
  citationRate?: number;
  qualityIssues: string[];
  warning?: string;
  calculatedAt: Date;
}

export interface MultiPlatformMetrics {
  overallScore: number;
  platformScores: Record<string, number>;
  bestPerforming: string;
  worstPerforming: string;
}

export interface BenchmarkComparison {
  rankings: { name: string; score: number }[];
  gaps: {
    mentions: { behindBy: number; competitor?: string };
    impressions: { behindBy: number; competitor?: string };
    sentiment: { behindBy: number; competitor?: string };
  };
  marketPosition: string;
}

export interface TrendAnalysis {
  mentionsChange: number;
  impressionsChange: number;
  sentimentChange: number;
  qualityChange: number;
  direction: TrendDirection;
}

export interface GrowthVelocity {
  rate: number;
  acceleration: AccelerationType;
  projectedGrowth: number;
}

export interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  estimatedImpact: number;
  estimatedROI: number;
  actions: string[];
  targetMetric: string;
}

export interface PlatformComparison {
  rankings: { platform: string; score: number }[];
  bestPerforming: string;
  worstPerforming: string;
}

export interface PlatformOpportunity {
  platform: string;
  type: 'underutilized' | 'growing' | 'declining';
  potentialGain: number;
  recommendation: string;
}

export interface ScoreBreakdown {
  totalScore: number;
  components: {
    visibility: number;
    sentiment: number;
    quality: number;
    reach: number;
  };
  contributions: {
    visibility: number;
    sentiment: number;
    quality: number;
    reach: number;
  };
}

export interface ForecastPrediction {
  period: { start: Date; end: Date };
  mentions: number;
  impressions: number;
  visibilityScore: number;
}

export interface Forecast {
  predictions: ForecastPrediction[];
  confidenceIntervals: {
    upper: number[];
    lower: number[];
  };
  methodology: string;
}

export interface MarketShare {
  apex: number;
  competitors: Record<string, number>;
}

export interface PlatformPerformance {
  platform: string;
  score: number;
  trend: TrendDirection;
}

export interface PerformanceStats {
  totalCalculations: number;
  averageCalculationTimeMs: number;
  platformsAnalyzed: Set<string>;
  lastCalculation?: Date;
}

// ============================================================================
// Service Interface
// ============================================================================

export interface PerformanceModelService extends EventEmitter {
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  // Configuration
  getConfig(): PerformanceModelConfig;
  updateConfig(config: Partial<PerformanceModelConfig>): void;

  // Metrics Calculation
  calculateMetrics(data: PerformanceData): Promise<PerformanceMetrics>;
  calculateMultiPlatformMetrics(dataPoints: PerformanceData[]): Promise<MultiPlatformMetrics>;
  getScoreBreakdown(data: PerformanceData): Promise<ScoreBreakdown>;

  // Competitor Analysis
  compareWithCompetitors(brandData: PerformanceData, competitorData: PerformanceData[]): Promise<BenchmarkComparison>;
  calculateMarketShare(allData: PerformanceData[]): Promise<MarketShare>;

  // Trend Analysis
  analyzeTrend(current: PerformanceData, previous: PerformanceData): Promise<TrendAnalysis>;
  calculateGrowthVelocity(dataPoints: PerformanceData[]): Promise<GrowthVelocity>;

  // Recommendations
  generateRecommendations(data: PerformanceData): Promise<OptimizationRecommendation[]>;

  // Platform Comparison
  comparePlatforms(dataPoints: PerformanceData[]): Promise<PlatformComparison>;
  identifyOpportunities(dataPoints: PerformanceData[]): Promise<PlatformOpportunity[]>;

  // Forecasting
  forecastPerformance(historicalData: PerformanceData[], options: { weeks: number }): Promise<Forecast>;

  // Statistics
  getStats(): PerformanceStats;
  resetStats(): void;
}

// ============================================================================
// Service Implementation
// ============================================================================

const KNOWN_PLATFORMS = ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek'];

class PerformanceModelServiceImpl extends EventEmitter implements PerformanceModelService {
  private config: PerformanceModelConfig;
  private stats: PerformanceStats;
  private calculationTimes: number[] = [];
  private initialized = false;

  constructor(config: Partial<PerformanceModelConfig> = {}) {
    super();
    // Provide defaults if not specified
    const configWithDefaults = {
      platforms: config.platforms || ['chatgpt'],
      ...config,
    };
    this.config = PerformanceModelConfigSchema.parse(configWithDefaults);
    this.stats = this.createEmptyStats();
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    this.emit('shutdown');
  }

  getConfig(): PerformanceModelConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<PerformanceModelConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  async calculateMetrics(data: PerformanceData): Promise<PerformanceMetrics> {
    const startTime = Date.now();

    // Handle null/invalid input
    if (!data) {
      this.emit('error', new Error('Invalid input: null or undefined'));
      return {
        visibilityScore: 0,
        responseAccuracy: 0,
        qualityIssues: [],
        calculatedAt: new Date(),
      };
    }

    try {
      // Handle empty data
      if (data.mentions === 0 && data.impressions === 0) {
        return {
          visibilityScore: 0,
          responseAccuracy: data.responseQuality,
          qualityIssues: [],
          calculatedAt: new Date(),
        };
      }

      // Check for unknown platform
      let warning: string | undefined;
      if (!KNOWN_PLATFORMS.includes(data.platform)) {
        warning = 'unknown_platform';
      }

      // Calculate visibility score (0-100 scale)
      const mentionScore = Math.min(100, (data.mentions / 500) * 100);
      const impressionScore = Math.min(100, (data.impressions / 100000) * 100);
      const sentimentScore = ((data.sentimentAverage + 1) / 2) * 100; // Convert -1 to 1 → 0 to 100
      const qualityScore = data.responseQuality * 100;

      // Weighted average
      const visibilityScore = Math.round(
        (mentionScore * 0.25) +
        (impressionScore * 0.25) +
        (sentimentScore * 0.25) +
        (qualityScore * 0.25)
      );

      // Response accuracy
      let responseAccuracy = data.responseQuality;
      if (data.responses && data.responses.length > 0) {
        responseAccuracy = data.responses.reduce((sum, r) => sum + r.accuracy, 0) / data.responses.length;
      }

      // Quality issues
      const qualityIssues: string[] = [];
      if (data.responses) {
        for (const response of data.responses) {
          if (response.issue && !qualityIssues.includes(response.issue)) {
            qualityIssues.push(response.issue);
          }
        }
      }

      // Citation rate (for perplexity and similar)
      let citationRate: number | undefined;
      if (data.citationData) {
        citationRate = data.citationData.responseWithCitation / data.citationData.totalResponses;
      }

      // Check for performance degradation and alert
      if (visibilityScore < this.config.alertThreshold * 100) {
        this.emit('performanceAlert', {
          type: 'degradation',
          score: visibilityScore,
          threshold: this.config.alertThreshold * 100,
          platform: data.platform,
        });
      }

      // Update stats
      const endTime = Date.now();
      this.updateStats(endTime - startTime, data.platform);

      return {
        visibilityScore,
        responseAccuracy,
        citationRate,
        qualityIssues,
        warning,
        calculatedAt: new Date(),
      };
    } catch (error) {
      this.emit('error', error);
      return {
        visibilityScore: 0,
        responseAccuracy: 0,
        qualityIssues: [],
        calculatedAt: new Date(),
      };
    }
  }

  async calculateMultiPlatformMetrics(dataPoints: PerformanceData[]): Promise<MultiPlatformMetrics> {
    const platformScores: Record<string, number> = {};

    for (const data of dataPoints) {
      const metrics = await this.calculateMetrics(data);
      platformScores[data.platform] = metrics.visibilityScore;
    }

    const scores = Object.entries(platformScores);
    const sorted = scores.sort((a, b) => b[1] - a[1]);

    const overallScore = scores.length > 0
      ? scores.reduce((sum, [, score]) => sum + score, 0) / scores.length
      : 0;

    return {
      overallScore,
      platformScores,
      bestPerforming: sorted[0]?.[0] || '',
      worstPerforming: sorted[sorted.length - 1]?.[0] || '',
    };
  }

  async getScoreBreakdown(data: PerformanceData): Promise<ScoreBreakdown> {
    const mentionScore = Math.min(100, (data.mentions / 500) * 100);
    const impressionScore = Math.min(100, (data.impressions / 100000) * 100);
    const sentimentScore = ((data.sentimentAverage + 1) / 2) * 100;
    const qualityScore = data.responseQuality * 100;

    const totalScore = Math.round(
      (mentionScore * 0.25) +
      (impressionScore * 0.25) +
      (sentimentScore * 0.25) +
      (qualityScore * 0.25)
    );

    return {
      totalScore,
      components: {
        visibility: mentionScore,
        sentiment: sentimentScore,
        quality: qualityScore,
        reach: impressionScore,
      },
      contributions: {
        visibility: 0.25,
        sentiment: 0.25,
        quality: 0.25,
        reach: 0.25,
      },
    };
  }

  async compareWithCompetitors(
    brandData: PerformanceData,
    competitorData: PerformanceData[]
  ): Promise<BenchmarkComparison> {
    const brandMetrics = await this.calculateMetrics(brandData);

    const rankings: { name: string; score: number }[] = [
      { name: this.config.brandName, score: brandMetrics.visibilityScore },
    ];

    let maxMentions = brandData.mentions;
    let maxMentionsCompetitor: string | undefined;
    let maxImpressions = brandData.impressions;
    let maxImpressionsCompetitor: string | undefined;
    let maxSentiment = brandData.sentimentAverage;
    let maxSentimentCompetitor: string | undefined;

    for (const competitor of competitorData) {
      const competitorMetrics = await this.calculateMetrics(competitor);
      rankings.push({
        name: competitor.competitorName || 'Unknown',
        score: competitorMetrics.visibilityScore,
      });

      // Track maximums for gap analysis
      if (competitor.mentions > maxMentions) {
        maxMentions = competitor.mentions;
        maxMentionsCompetitor = competitor.competitorName;
      }
      if (competitor.impressions > maxImpressions) {
        maxImpressions = competitor.impressions;
        maxImpressionsCompetitor = competitor.competitorName;
      }
      if (competitor.sentimentAverage > maxSentiment) {
        maxSentiment = competitor.sentimentAverage;
        maxSentimentCompetitor = competitor.competitorName;
      }

      // Alert on significant competitor gains
      if (competitorMetrics.visibilityScore > brandMetrics.visibilityScore * 1.5) {
        this.emit('competitorAlert', {
          type: 'significant_gain',
          competitor: competitor.competitorName,
          competitorScore: competitorMetrics.visibilityScore,
          brandScore: brandMetrics.visibilityScore,
        });
      }
    }

    // Sort rankings by score
    rankings.sort((a, b) => b.score - a.score);

    // Calculate gaps
    const gaps = {
      mentions: {
        behindBy: Math.max(0, maxMentions - brandData.mentions),
        competitor: maxMentionsCompetitor,
      },
      impressions: {
        behindBy: Math.max(0, maxImpressions - brandData.impressions),
        competitor: maxImpressionsCompetitor,
      },
      sentiment: {
        behindBy: Math.max(0, maxSentiment - brandData.sentimentAverage),
        competitor: maxSentimentCompetitor,
      },
    };

    // Determine market position
    const brandRank = rankings.findIndex(r => r.name === this.config.brandName) + 1;
    let marketPosition: string;
    if (brandRank === 1) {
      marketPosition = 'leader';
    } else if (brandRank <= Math.ceil(rankings.length / 3)) {
      marketPosition = 'top tier';
    } else if (brandRank <= Math.ceil(rankings.length * 2 / 3)) {
      marketPosition = 'mid tier';
    } else {
      marketPosition = 'lower tier';
    }

    return { rankings, gaps, marketPosition };
  }

  async calculateMarketShare(allData: PerformanceData[]): Promise<MarketShare> {
    const totalMentions = allData.reduce((sum, d) => sum + d.mentions, 0);

    if (totalMentions === 0) {
      return { apex: 0, competitors: {} };
    }

    let apexShare = 0;
    const competitors: Record<string, number> = {};

    for (const data of allData) {
      const share = data.mentions / totalMentions;
      if (data.brandName === 'Apex' || (!data.competitorName && !data.brandName)) {
        apexShare = share;
      } else if (data.competitorName) {
        competitors[data.competitorName.toLowerCase()] = share;
      }
    }

    return { apex: apexShare, competitors };
  }

  async analyzeTrend(current: PerformanceData, previous: PerformanceData): Promise<TrendAnalysis> {
    const mentionsChange = previous.mentions > 0
      ? (current.mentions - previous.mentions) / previous.mentions
      : 0;
    const impressionsChange = previous.impressions > 0
      ? (current.impressions - previous.impressions) / previous.impressions
      : 0;
    const sentimentChange = current.sentimentAverage - previous.sentimentAverage;
    const qualityChange = current.responseQuality - previous.responseQuality;

    // Determine overall direction
    const overallChange = (mentionsChange + impressionsChange + sentimentChange + qualityChange) / 4;
    let direction: TrendDirection;
    if (overallChange > 0.05) {
      direction = 'improving';
    } else if (overallChange < -0.05) {
      direction = 'declining';
    } else {
      direction = 'stable';
    }

    return {
      mentionsChange,
      impressionsChange,
      sentimentChange,
      qualityChange,
      direction,
    };
  }

  async calculateGrowthVelocity(dataPoints: PerformanceData[]): Promise<GrowthVelocity> {
    if (dataPoints.length < 2) {
      return { rate: 0, acceleration: 'stable', projectedGrowth: 0 };
    }

    // Sort by period start
    const sorted = Array.from(dataPoints).sort(
      (a, b) => a.period.start.getTime() - b.period.start.getTime()
    );

    // Calculate growth rates between consecutive periods
    const growthRates: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev.mentions > 0) {
        growthRates.push((curr.mentions - prev.mentions) / prev.mentions);
      }
    }

    if (growthRates.length === 0) {
      return { rate: 0, acceleration: 'stable', projectedGrowth: 0 };
    }

    // Average growth rate
    const rate = growthRates.reduce((sum, r) => sum + r, 0) / growthRates.length;

    // Calculate acceleration (change in growth rate)
    let acceleration: AccelerationType = 'stable';
    if (growthRates.length >= 2) {
      const firstHalf = growthRates.slice(0, Math.floor(growthRates.length / 2));
      const secondHalf = growthRates.slice(Math.floor(growthRates.length / 2));
      const avgFirst = firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length;

      if (avgSecond > avgFirst + 0.1) {
        acceleration = 'accelerating';
      } else if (avgSecond < avgFirst - 0.1) {
        acceleration = 'decelerating';
      }
    }

    // Project future growth (simple extrapolation)
    const lastMentions = sorted[sorted.length - 1].mentions;
    const projectedGrowth = lastMentions * (1 + rate);

    return { rate, acceleration, projectedGrowth };
  }

  async generateRecommendations(data: PerformanceData): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    let idCounter = 1;

    // Low mentions recommendation
    if (data.mentions < 100) {
      recommendations.push({
        id: `rec-${idCounter++}`,
        title: 'Increase Brand Mentions',
        description: 'Your brand has low visibility on AI platforms. Focus on creating more AI-discoverable content.',
        priority: data.mentions < 30 ? 'high' : 'medium',
        estimatedImpact: 0.4,
        estimatedROI: 2.5,
        actions: [
          'Create FAQ content optimized for AI responses',
          'Publish authoritative content on high-visibility sites',
          'Ensure structured data is properly implemented',
        ],
        targetMetric: 'mentions',
      });
    }

    // Low sentiment recommendation
    if (data.sentimentAverage < 0.5) {
      recommendations.push({
        id: `rec-${idCounter++}`,
        title: 'Improve Brand Sentiment',
        description: 'Brand sentiment is below optimal levels. Address negative perceptions.',
        priority: data.sentimentAverage < 0.3 ? 'high' : 'medium',
        estimatedImpact: 0.35,
        estimatedROI: 2.0,
        actions: [
          'Address common complaints in public forums',
          'Highlight positive customer testimonials',
          'Improve product/service based on feedback',
        ],
        targetMetric: 'sentiment',
      });
    }

    // Low response quality recommendation
    if (data.responseQuality < 0.7) {
      recommendations.push({
        id: `rec-${idCounter++}`,
        title: 'Enhance AI Response Quality',
        description: 'AI platforms are providing low-quality responses about your brand.',
        priority: data.responseQuality < 0.5 ? 'high' : 'medium',
        estimatedImpact: 0.45,
        estimatedROI: 3.0,
        actions: [
          'Update Wikipedia and other knowledge sources',
          'Create comprehensive brand documentation',
          'Correct misinformation through official channels',
        ],
        targetMetric: 'quality',
      });
    }

    // Low impressions recommendation
    if (data.impressions < 20000) {
      recommendations.push({
        id: `rec-${idCounter++}`,
        title: 'Expand Reach',
        description: 'Your brand has limited reach on AI platforms.',
        priority: data.impressions < 10000 ? 'high' : 'medium',
        estimatedImpact: 0.3,
        estimatedROI: 1.8,
        actions: [
          'Partner with industry publications',
          'Increase PR activities',
          'Optimize for long-tail queries',
        ],
        targetMetric: 'impressions',
      });
    }

    // Sort by priority
    const priorityOrder: Record<RecommendationPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }

  async comparePlatforms(dataPoints: PerformanceData[]): Promise<PlatformComparison> {
    const rankings: { platform: string; score: number }[] = [];

    for (const data of dataPoints) {
      const metrics = await this.calculateMetrics(data);
      rankings.push({
        platform: data.platform,
        score: metrics.visibilityScore,
      });
    }

    rankings.sort((a, b) => b.score - a.score);

    return {
      rankings,
      bestPerforming: rankings[0]?.platform || '',
      worstPerforming: rankings[rankings.length - 1]?.platform || '',
    };
  }

  async identifyOpportunities(dataPoints: PerformanceData[]): Promise<PlatformOpportunity[]> {
    const opportunities: PlatformOpportunity[] = [];

    // Calculate average performance
    const avgMentions = dataPoints.reduce((sum, d) => sum + d.mentions, 0) / dataPoints.length;
    const avgImpressions = dataPoints.reduce((sum, d) => sum + d.impressions, 0) / dataPoints.length;

    for (const data of dataPoints) {
      // Underutilized: high quality but low volume
      if (data.responseQuality > 0.7 && data.mentions < avgMentions * 0.5) {
        opportunities.push({
          platform: data.platform,
          type: 'underutilized',
          potentialGain: avgMentions - data.mentions,
          recommendation: `Increase content targeting ${data.platform} to capitalize on high response quality`,
        });
      }

      // Declining: significantly below average
      if (data.mentions < avgMentions * 0.3 && data.impressions < avgImpressions * 0.3) {
        opportunities.push({
          platform: data.platform,
          type: 'declining',
          potentialGain: avgMentions * 0.5,
          recommendation: `Investigate declining performance on ${data.platform}`,
        });
      }
    }

    return opportunities;
  }

  async forecastPerformance(
    historicalData: PerformanceData[],
    options: { weeks: number }
  ): Promise<Forecast> {
    const sorted = Array.from(historicalData).sort(
      (a, b) => a.period.start.getTime() - b.period.start.getTime()
    );

    // Calculate growth rate
    const velocity = await this.calculateGrowthVelocity(sorted);

    // Generate predictions
    const predictions: ForecastPrediction[] = [];
    const lastData = sorted[sorted.length - 1];
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    let currentMentions = lastData.mentions;
    let currentImpressions = lastData.impressions;

    for (let i = 0; i < options.weeks; i++) {
      const weekStart = new Date(lastData.period.end.getTime() + (i * weekMs));
      const weekEnd = new Date(weekStart.getTime() + weekMs);

      currentMentions = Math.round(currentMentions * (1 + velocity.rate));
      currentImpressions = Math.round(currentImpressions * (1 + velocity.rate * 0.8));

      const visibilityScore = Math.min(100, Math.round(
        (currentMentions / 500 * 25) +
        (currentImpressions / 100000 * 25) +
        (lastData.sentimentAverage * 25) +
        (lastData.responseQuality * 25)
      ));

      predictions.push({
        period: { start: weekStart, end: weekEnd },
        mentions: currentMentions,
        impressions: currentImpressions,
        visibilityScore,
      });
    }

    // Calculate confidence intervals
    const uncertainty = 0.2; // 20% uncertainty
    const confidenceIntervals = {
      upper: predictions.map(p => Math.round(p.mentions * (1 + uncertainty))),
      lower: predictions.map(p => Math.round(p.mentions * (1 - uncertainty))),
    };

    return {
      predictions,
      confidenceIntervals,
      methodology: 'linear_extrapolation',
    };
  }

  getStats(): PerformanceStats {
    return {
      totalCalculations: this.stats.totalCalculations,
      averageCalculationTimeMs: this.stats.averageCalculationTimeMs,
      platformsAnalyzed: new Set(this.stats.platformsAnalyzed),
      lastCalculation: this.stats.lastCalculation,
    };
  }

  resetStats(): void {
    this.stats = this.createEmptyStats();
    this.calculationTimes = [];
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private updateStats(calculationTimeMs: number, platform: string): void {
    this.stats.totalCalculations++;
    this.stats.lastCalculation = new Date();
    this.stats.platformsAnalyzed.add(platform);

    this.calculationTimes.push(calculationTimeMs);
    this.stats.averageCalculationTimeMs =
      this.calculationTimes.reduce((sum, t) => sum + t, 0) / this.calculationTimes.length;
  }

  private createEmptyStats(): PerformanceStats {
    return {
      totalCalculations: 0,
      averageCalculationTimeMs: 0,
      platformsAnalyzed: new Set(),
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createPerformanceModelService(
  config: Partial<PerformanceModelConfig> = {}
): PerformanceModelService {
  return new PerformanceModelServiceImpl(config);
}
