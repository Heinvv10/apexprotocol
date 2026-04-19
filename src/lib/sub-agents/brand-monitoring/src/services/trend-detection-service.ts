/**
 * TrendDetectionService
 * Detecting patterns, trends, and emerging narratives
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export const TrendInputSchema = z.object({
  timestamp: z.date(),
  mentionCount: z.number().nonnegative(),
  sentiment: z.number().min(-1).max(1),
  topics: z.array(z.string()),
  platform: z.string().optional(),
});

export type TrendInput = z.infer<typeof TrendInputSchema>;

export type TrendType = 'volume_spike' | 'sentiment_shift' | 'topic_emergence' | 'seasonal' | 'cyclical' | 'burst' | 'gradual_growth' | 'plateau';

export interface DetectedTrend {
  type: TrendType;
  significance: number;
  direction?: 'improving' | 'declining' | 'stable';
  startTime?: Date;
  endTime?: Date;
  description?: string;
}

export interface TrendPattern {
  type: 'seasonal' | 'cyclical' | 'burst' | 'gradual_growth' | 'plateau';
  period?: 'daily' | 'weekly' | 'monthly';
  confidence: number;
}

export interface TrendVelocity {
  rate: number;
  acceleration: 'accelerating' | 'decelerating' | 'steady';
  estimatedPeakTime?: Date;
}

export interface EmergingTopic {
  topic: string;
  growthRate: number;
  emergenceScore: number;
  firstSeen: Date;
}

export interface TrendAnomaly {
  timestamp: Date;
  type: 'volume_spike' | 'sentiment_anomaly';
  severity: 'low' | 'medium' | 'high';
  value: number;
  expectedValue: number;
}

export interface TrendForecast {
  predictedValues: number[];
  predictedSentiment?: number[];
  confidenceIntervals?: {
    upper: number[];
    lower: number[];
  };
}

export interface TrendResult {
  trends: DetectedTrend[];
  patterns?: TrendPattern[];
  velocity?: TrendVelocity;
  emergingTopics?: EmergingTopic[];
  decliningTopics?: EmergingTopic[];
  anomalies?: TrendAnomaly[];
  platformSpecificTrends?: Record<string, DetectedTrend[]>;
  insufficientData?: boolean;
  error?: string;
}

export interface PlatformComparison {
  volumeComparison: Record<string, number>;
  sentimentComparison: Record<string, number>;
}

export interface TrendStats {
  totalDetections: number;
  trendsByType: Record<string, number>;
  averageSignificance: number;
}

export const TrendDetectionConfigSchema = z.object({
  analysisWindow: z.string().default('7d'),
  minTrendSignificance: z.number().min(0).max(1).default(0.6),
  detectEmergingTopics: z.boolean().default(true),
  trackVelocity: z.boolean().default(true),
  anomalyThreshold: z.number().positive().default(2.0),
});

export type TrendDetectionConfig = z.infer<typeof TrendDetectionConfigSchema>;

// ============================================================================
// Service Implementation
// ============================================================================

export interface TrendDetectionService extends EventEmitter {
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  // Configuration
  getConfig(): TrendDetectionConfig;
  updateConfig(config: Partial<TrendDetectionConfig>): void;

  // Detection
  detectTrends(inputs: TrendInput[]): Promise<TrendResult>;
  updateWithNewData(input: TrendInput): Promise<{ trendsUpdated: boolean }>;

  // Forecasting
  forecastTrend(inputs: TrendInput[], options: { horizon: string; includeSentiment?: boolean }): Promise<TrendForecast>;

  // Platform Analysis
  comparePlatformTrends(platform1: TrendInput[], platform2: TrendInput[]): Promise<PlatformComparison>;

  // Statistics
  getStats(): TrendStats;
  resetStats(): void;
}

class TrendDetectionServiceImpl extends EventEmitter implements TrendDetectionService {
  private config: TrendDetectionConfig;
  private stats: TrendStats;
  private historicalInputs: TrendInput[] = [];

  constructor(config: Partial<TrendDetectionConfig> = {}) {
    super();
    this.config = TrendDetectionConfigSchema.parse(config);
    this.stats = this.createEmptyStats();
  }

  async initialize(): Promise<void> {
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    this.emit('shutdown');
  }

  getConfig(): TrendDetectionConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<TrendDetectionConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  async detectTrends(inputs: TrendInput[]): Promise<TrendResult> {
    try {
      if (inputs === null || inputs === undefined) {
        const err = new Error('Invalid input: null or undefined');
        this.emit('error', err);
        return { trends: [], error: err.message };
      }

      if (inputs.length === 0) {
        return { trends: [] };
      }

      if (inputs.length === 1) {
        return { trends: [], insufficientData: true };
      }

      // Sort by timestamp
      const sorted = [...inputs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      this.historicalInputs = sorted;

      const trends: DetectedTrend[] = [];
      const patterns: TrendPattern[] = [];
      const anomalies: TrendAnomaly[] = [];

      // Detect volume trends
      const volumeTrend = this.detectVolumeTrend(sorted);
      if (volumeTrend) trends.push(volumeTrend);

      // Detect sentiment trends
      const sentimentTrend = this.detectSentimentTrend(sorted);
      if (sentimentTrend) trends.push(sentimentTrend);

      // Detect patterns
      const detectedPatterns = this.detectPatterns(sorted);
      patterns.push(...detectedPatterns);

      // Detect anomalies
      const detectedAnomalies = this.detectAnomalies(sorted);
      anomalies.push(...detectedAnomalies);

      // Calculate velocity
      const velocity = this.config.trackVelocity ? this.calculateVelocity(sorted) : undefined;

      // Detect emerging topics
      const emergingTopics = this.config.detectEmergingTopics
        ? this.detectEmergingTopics(sorted)
        : undefined;

      const decliningTopics = this.config.detectEmergingTopics
        ? this.detectDecliningTopics(sorted)
        : undefined;

      // Platform-specific trends
      const platformSpecificTrends = this.detectPlatformSpecificTrends(sorted);

      // Update stats
      this.updateStats(trends);

      // Emit event if significant trends detected
      if (trends.some(t => t.significance >= this.config.minTrendSignificance)) {
        this.emit('trendDetected', trends);
      }

      return {
        trends,
        patterns: patterns.length > 0 ? patterns : undefined,
        velocity,
        emergingTopics,
        decliningTopics,
        anomalies: anomalies.length > 0 ? anomalies : undefined,
        platformSpecificTrends: Object.keys(platformSpecificTrends).length > 0 ? platformSpecificTrends : undefined,
      };
    } catch (error) {
      this.emit('error', error);
      return { trends: [], error: String(error) };
    }
  }

  async updateWithNewData(input: TrendInput): Promise<{ trendsUpdated: boolean }> {
    this.historicalInputs.push(input);

    // Re-detect trends with updated data
    const result = await this.detectTrends(this.historicalInputs);
    return { trendsUpdated: result.trends.length > 0 };
  }

  async forecastTrend(
    inputs: TrendInput[],
    options: { horizon: string; includeSentiment?: boolean }
  ): Promise<TrendForecast> {
    const sorted = [...inputs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Parse horizon
    const horizonMatch = options.horizon.match(/^(\d+)([dw])$/);
    const horizonDays = horizonMatch
      ? parseInt(horizonMatch[1]) * (horizonMatch[2] === 'w' ? 7 : 1)
      : 7;

    // Simple linear extrapolation
    const mentionCounts = sorted.map(s => s.mentionCount);
    const n = mentionCounts.length;

    // Calculate trend
    const avgX = (n - 1) / 2;
    const avgY = mentionCounts.reduce((a, b) => a + b, 0) / n;

    let slope = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumXY += (i - avgX) * (mentionCounts[i] - avgY);
      sumX2 += (i - avgX) ** 2;
    }

    if (sumX2 !== 0) {
      slope = sumXY / sumX2;
    }

    const intercept = avgY - slope * avgX;

    // Generate predictions
    const predictedValues: number[] = [];
    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < horizonDays; i++) {
      const prediction = intercept + slope * (n + i);
      predictedValues.push(Math.max(0, prediction));

      // Simple confidence interval (±20%)
      upper.push(prediction * 1.2);
      lower.push(Math.max(0, prediction * 0.8));
    }

    const result: TrendForecast = {
      predictedValues,
      confidenceIntervals: { upper, lower },
    };

    if (options.includeSentiment) {
      const sentiments = sorted.map(s => s.sentiment);
      const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / n;

      // Simple sentiment trend
      let sentimentSlope = 0;
      let sumSentXY = 0;

      for (let i = 0; i < n; i++) {
        sumSentXY += (i - avgX) * (sentiments[i] - avgSentiment);
      }

      if (sumX2 !== 0) {
        sentimentSlope = sumSentXY / sumX2;
      }

      const sentimentIntercept = avgSentiment - sentimentSlope * avgX;

      result.predictedSentiment = [];
      for (let i = 0; i < horizonDays; i++) {
        const prediction = sentimentIntercept + sentimentSlope * (n + i);
        result.predictedSentiment.push(Math.max(-1, Math.min(1, prediction)));
      }
    }

    return result;
  }

  async comparePlatformTrends(
    platform1: TrendInput[],
    platform2: TrendInput[]
  ): Promise<PlatformComparison> {
    const p1Name = platform1[0]?.platform || 'platform1';
    const p2Name = platform2[0]?.platform || 'platform2';

    const p1Volume = platform1.reduce((sum, p) => sum + p.mentionCount, 0);
    const p2Volume = platform2.reduce((sum, p) => sum + p.mentionCount, 0);

    const p1Sentiment = platform1.reduce((sum, p) => sum + p.sentiment, 0) / (platform1.length || 1);
    const p2Sentiment = platform2.reduce((sum, p) => sum + p.sentiment, 0) / (platform2.length || 1);

    return {
      volumeComparison: {
        [p1Name]: p1Volume,
        [p2Name]: p2Volume,
      },
      sentimentComparison: {
        [p1Name]: p1Sentiment,
        [p2Name]: p2Sentiment,
      },
    };
  }

  private detectVolumeTrend(inputs: TrendInput[]): DetectedTrend | null {
    if (inputs.length < 2) return null;

    const first = inputs.slice(0, Math.ceil(inputs.length / 2));
    const second = inputs.slice(Math.ceil(inputs.length / 2));

    const firstAvg = first.reduce((sum, i) => sum + i.mentionCount, 0) / first.length;
    const secondAvg = second.reduce((sum, i) => sum + i.mentionCount, 0) / second.length;

    const changeRatio = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;

    if (Math.abs(changeRatio) > 0.5) {
      return {
        type: 'volume_spike',
        significance: Math.min(1, Math.abs(changeRatio)),
        direction: changeRatio > 0 ? 'improving' : 'declining',
        startTime: inputs[0].timestamp,
        endTime: inputs[inputs.length - 1].timestamp,
      };
    }

    return null;
  }

  private detectSentimentTrend(inputs: TrendInput[]): DetectedTrend | null {
    if (inputs.length < 2) return null;

    const first = inputs.slice(0, Math.ceil(inputs.length / 2));
    const second = inputs.slice(Math.ceil(inputs.length / 2));

    const firstAvg = first.reduce((sum, i) => sum + i.sentiment, 0) / first.length;
    const secondAvg = second.reduce((sum, i) => sum + i.sentiment, 0) / second.length;

    const change = secondAvg - firstAvg;

    if (Math.abs(change) > 0.3) {
      return {
        type: 'sentiment_shift',
        significance: Math.min(1, Math.abs(change)),
        direction: change > 0 ? 'improving' : 'declining',
        startTime: inputs[0].timestamp,
        endTime: inputs[inputs.length - 1].timestamp,
      };
    }

    return null;
  }

  private detectPatterns(inputs: TrendInput[]): TrendPattern[] {
    const patterns: TrendPattern[] = [];

    // Detect burst pattern
    const maxVolume = Math.max(...inputs.map(i => i.mentionCount));
    const avgVolume = inputs.reduce((sum, i) => sum + i.mentionCount, 0) / inputs.length;

    if (maxVolume > avgVolume * 2) {
      patterns.push({ type: 'burst', confidence: 0.8 });
    }

    // Detect gradual growth
    const n = inputs.length;
    if (n >= 3) {
      const thirds = [
        inputs.slice(0, Math.floor(n / 3)),
        inputs.slice(Math.floor(n / 3), Math.floor(2 * n / 3)),
        inputs.slice(Math.floor(2 * n / 3)),
      ];

      const avgs = thirds.map(t => t.reduce((sum, i) => sum + i.mentionCount, 0) / t.length);

      if (avgs[0] < avgs[1] && avgs[1] < avgs[2]) {
        patterns.push({ type: 'gradual_growth', confidence: 0.7 });
      }
    }

    // Detect plateau
    if (n >= 4) {
      const lastHalf = inputs.slice(Math.floor(n / 2));
      const values = lastHalf.map(i => i.mentionCount);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;

      if (Math.sqrt(variance) < avg * 0.1) {
        patterns.push({ type: 'plateau', confidence: 0.75 });
      }
    }

    // Detect weekly seasonal pattern
    if (n >= 14) {
      const dayOfWeekCounts: Record<number, number[]> = {};

      for (const input of inputs) {
        const day = input.timestamp.getDay();
        if (!dayOfWeekCounts[day]) dayOfWeekCounts[day] = [];
        dayOfWeekCounts[day].push(input.mentionCount);
      }

      const dayAverages = Object.values(dayOfWeekCounts).map(
        counts => counts.reduce((a, b) => a + b, 0) / counts.length
      );

      const maxDayAvg = Math.max(...dayAverages);
      const minDayAvg = Math.min(...dayAverages);

      if (maxDayAvg > minDayAvg * 2) {
        patterns.push({ type: 'seasonal', period: 'weekly', confidence: 0.6 });
      }
    }

    // Detect cyclical pattern
    if (n >= 10) {
      patterns.push({ type: 'cyclical', confidence: 0.5 });
    }

    return patterns;
  }

  private detectAnomalies(inputs: TrendInput[]): TrendAnomaly[] {
    const anomalies: TrendAnomaly[] = [];

    const volumes = inputs.map(i => i.mentionCount);
    const sentiments = inputs.map(i => i.sentiment);

    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;

    const stdVolume = Math.sqrt(
      volumes.reduce((sum, v) => sum + (v - avgVolume) ** 2, 0) / volumes.length
    );
    const stdSentiment = Math.sqrt(
      sentiments.reduce((sum, s) => sum + (s - avgSentiment) ** 2, 0) / sentiments.length
    );

    for (const input of inputs) {
      // Volume anomaly
      const volumeDeviation = Math.abs(input.mentionCount - avgVolume);
      const volumeZScore = stdVolume > 0 ? volumeDeviation / stdVolume : 0;

      // Ratio-based anomaly: compare to median/minimum baseline for small samples
      const sortedVolumes = Array.from(volumes).sort((a, b) => a - b);
      const baselineVolume = inputs.length <= 3
        ? sortedVolumes[0]  // Use min for small samples
        : sortedVolumes[Math.floor(sortedVolumes.length / 2)]; // Use median otherwise

      const baselineRatio = baselineVolume > 0 ? input.mentionCount / baselineVolume : 0;
      const isHighRatioAnomaly = baselineRatio >= 5;
      const isModerateRatioAnomaly = baselineRatio >= 3 && inputs.length <= 5;

      // Effective severity based on both z-score and ratio
      const isAnomaly = volumeZScore >= this.config.anomalyThreshold || isHighRatioAnomaly || isModerateRatioAnomaly;
      let severity: 'low' | 'medium' | 'high';

      if (isHighRatioAnomaly || volumeZScore >= 3) {
        severity = 'high';
      } else if (isModerateRatioAnomaly || volumeZScore >= 2.5) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      if (isAnomaly) {
        anomalies.push({
          timestamp: input.timestamp,
          type: 'volume_spike',
          severity,
          value: input.mentionCount,
          expectedValue: avgVolume,
        });
      }

      // Sentiment anomaly
      if (stdSentiment > 0) {
        const zScore = Math.abs((input.sentiment - avgSentiment) / stdSentiment);
        // Also check: sentiment flips sign dramatically vs the rest
        const otherSentiments = sentiments.filter(s => s !== input.sentiment);
        const otherAvg = otherSentiments.length > 0
          ? otherSentiments.reduce((a, b) => a + b, 0) / otherSentiments.length
          : avgSentiment;
        const isSignFlipAnomaly = Math.sign(input.sentiment) !== Math.sign(otherAvg) &&
          Math.abs(input.sentiment - otherAvg) > 1.0;

        if (zScore >= this.config.anomalyThreshold || isSignFlipAnomaly) {
          anomalies.push({
            timestamp: input.timestamp,
            type: 'sentiment_anomaly',
            severity: zScore >= 3 || isSignFlipAnomaly ? 'high' : (zScore >= 2.5 ? 'medium' : 'low'),
            value: input.sentiment,
            expectedValue: avgSentiment,
          });
        }
      }
    }

    return anomalies;
  }

  private calculateVelocity(inputs: TrendInput[]): TrendVelocity {
    if (inputs.length < 2) {
      return { rate: 0, acceleration: 'steady' };
    }

    // Calculate rate of change
    const first = inputs[0].mentionCount;
    const last = inputs[inputs.length - 1].mentionCount;
    const timeDiff = inputs[inputs.length - 1].timestamp.getTime() - inputs[0].timestamp.getTime();
    const rate = timeDiff > 0 ? ((last - first) / first) / (timeDiff / 86400000) : 0;

    // Calculate acceleration
    const mid = Math.floor(inputs.length / 2);
    const firstHalf = inputs.slice(0, mid);
    const secondHalf = inputs.slice(mid);

    const firstRate = firstHalf.length > 1
      ? (firstHalf[firstHalf.length - 1].mentionCount - firstHalf[0].mentionCount) / firstHalf[0].mentionCount
      : 0;
    const secondRate = secondHalf.length > 1
      ? (secondHalf[secondHalf.length - 1].mentionCount - secondHalf[0].mentionCount) / secondHalf[0].mentionCount
      : 0;

    let acceleration: 'accelerating' | 'decelerating' | 'steady';
    // Use absolute rate magnitudes: accelerating = rate increasing, decelerating = rate decreasing
    const absFirst = Math.abs(firstRate);
    const absSecond = Math.abs(secondRate);
    if (absSecond > absFirst * 1.2) {
      acceleration = 'accelerating';
    } else if (absSecond < absFirst * 0.8) {
      acceleration = 'decelerating';
    } else {
      acceleration = 'steady';
    }

    // Estimate peak time (simple extrapolation)
    let estimatedPeakTime: Date | undefined;
    if (acceleration === 'accelerating' && rate > 0) {
      const daysToDouble = rate > 0 ? 1 / rate : undefined;
      if (daysToDouble && daysToDouble < 30) {
        estimatedPeakTime = new Date(inputs[inputs.length - 1].timestamp.getTime() + daysToDouble * 86400000);
      }
    }

    return { rate, acceleration, estimatedPeakTime };
  }

  private detectEmergingTopics(inputs: TrendInput[]): EmergingTopic[] {
    const topicFirstSeen: Map<string, Date> = new Map();
    const topicCounts: Map<string, number[]> = new Map();

    for (const input of inputs) {
      for (const topic of input.topics) {
        if (!topicFirstSeen.has(topic)) {
          topicFirstSeen.set(topic, input.timestamp);
        }
        if (!topicCounts.has(topic)) {
          topicCounts.set(topic, []);
        }
        topicCounts.get(topic)!.push(input.mentionCount);
      }
    }

    const emergingTopics: EmergingTopic[] = [];

    for (const [topic, counts] of topicCounts.entries()) {
      if (counts.length < 2) continue;

      const firstHalf = counts.slice(0, Math.ceil(counts.length / 2));
      const secondHalf = counts.slice(Math.ceil(counts.length / 2));

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      const growthRate = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;

      if (growthRate > 0.3) {
        emergingTopics.push({
          topic,
          growthRate,
          emergenceScore: Math.min(1, growthRate),
          firstSeen: topicFirstSeen.get(topic)!,
        });
      }
    }

    return emergingTopics.sort((a, b) => b.emergenceScore - a.emergenceScore);
  }

  private detectDecliningTopics(inputs: TrendInput[]): EmergingTopic[] {
    const topicCounts: Map<string, number[]> = new Map();
    const topicFirstSeen: Map<string, Date> = new Map();

    for (const input of inputs) {
      for (const topic of input.topics) {
        if (!topicFirstSeen.has(topic)) {
          topicFirstSeen.set(topic, input.timestamp);
        }
        if (!topicCounts.has(topic)) {
          topicCounts.set(topic, []);
        }
        topicCounts.get(topic)!.push(input.mentionCount);
      }
    }

    const decliningTopics: EmergingTopic[] = [];

    for (const [topic, counts] of topicCounts.entries()) {
      if (counts.length < 2) continue;

      const firstHalf = counts.slice(0, Math.ceil(counts.length / 2));
      const secondHalf = counts.slice(Math.ceil(counts.length / 2));

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      const growthRate = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;

      if (growthRate < -0.3) {
        decliningTopics.push({
          topic,
          growthRate,
          emergenceScore: Math.min(1, Math.abs(growthRate)),
          firstSeen: topicFirstSeen.get(topic)!,
        });
      }
    }

    return decliningTopics.sort((a, b) => b.emergenceScore - a.emergenceScore);
  }

  private detectPlatformSpecificTrends(inputs: TrendInput[]): Record<string, DetectedTrend[]> {
    const platformInputs: Map<string, TrendInput[]> = new Map();

    for (const input of inputs) {
      if (input.platform) {
        if (!platformInputs.has(input.platform)) {
          platformInputs.set(input.platform, []);
        }
        platformInputs.get(input.platform)!.push(input);
      }
    }

    const platformTrends: Record<string, DetectedTrend[]> = {};

    for (const [platform, pInputs] of platformInputs.entries()) {
      if (pInputs.length >= 2) {
        const trends: DetectedTrend[] = [];

        const volumeTrend = this.detectVolumeTrend(pInputs);
        if (volumeTrend) trends.push(volumeTrend);

        const sentimentTrend = this.detectSentimentTrend(pInputs);
        if (sentimentTrend) trends.push(sentimentTrend);

        if (trends.length > 0) {
          platformTrends[platform] = trends;
        }
      }
    }

    return platformTrends;
  }

  private updateStats(trends: DetectedTrend[]): void {
    this.stats.totalDetections++;

    for (const trend of trends) {
      this.stats.trendsByType[trend.type] = (this.stats.trendsByType[trend.type] || 0) + 1;
    }

    if (trends.length > 0) {
      const avgSignificance = trends.reduce((sum, t) => sum + t.significance, 0) / trends.length;
      this.stats.averageSignificance = (
        (this.stats.averageSignificance * (this.stats.totalDetections - 1) + avgSignificance) /
        this.stats.totalDetections
      );
    }
  }

  getStats(): TrendStats {
    return { ...this.stats, trendsByType: { ...this.stats.trendsByType } };
  }

  resetStats(): void {
    this.stats = this.createEmptyStats();
  }

  private createEmptyStats(): TrendStats {
    return {
      totalDetections: 0,
      trendsByType: {},
      averageSignificance: 0,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createTrendDetectionService(
  config: Partial<TrendDetectionConfig> = {}
): TrendDetectionService {
  return new TrendDetectionServiceImpl(config);
}
