/**
 * NarrativeDetectionService
 * Identifies emerging narratives, trends, and coordinated messaging patterns
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Configuration schema
const narrativeDetectionConfigSchema = z.object({
  minMentionsForNarrative: z.number().positive().int().default(5),
  narrativeTimeWindowHours: z.number().positive().default(48),
  trendThreshold: z.number().min(0).max(1).default(0.2),
  viralityThreshold: z.number().positive().default(100),
  coordinationDetectionEnabled: z.boolean().default(true),
  emergingNarrativeAlertEnabled: z.boolean().default(true),
  batchSize: z.number().positive().int().default(100),
});

export type NarrativeDetectionConfig = z.infer<typeof narrativeDetectionConfigSchema>;

export interface Mention {
  id: string;
  platform: string;
  brandId: string;
  content: string;
  author: string;
  timestamp: Date;
  sentiment?: number;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface Narrative {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  mentions: Mention[];
  sentiment: {
    average: number;
    distribution: { positive: number; neutral: number; negative: number };
  };
  platforms: string[];
  timeRange: { start: Date; end: Date };
  velocity: number; // mentions per hour
  reach: number; // estimated audience
  isEmerging: boolean;
  isViral: boolean;
  confidenceScore: number;
}

export interface TrendData {
  keyword: string;
  mentionCount: number;
  growthRate: number; // percentage change
  platforms: string[];
  firstSeen: Date;
  lastSeen: Date;
  peakTime: Date;
  isRising: boolean;
  isFalling: boolean;
}

export interface CoordinationPattern {
  id: string;
  type: 'timing' | 'content' | 'network' | 'hashtag';
  involvedAuthors: string[];
  involvedMentions: Mention[];
  similarityScore: number;
  timingPatternMs: number;
  confidence: number;
  description: string;
}

export interface NarrativeStats {
  totalNarrativesDetected: number;
  emergingNarratives: number;
  viralNarratives: number;
  trendsIdentified: number;
  coordinationPatternsDetected: number;
  processingTimeMs: number;
}

/**
 * NarrativeDetectionService
 * Provides narrative detection, trend analysis, and coordination detection
 */
export class NarrativeDetectionService extends EventEmitter {
  private config: NarrativeDetectionConfig;
  private stats: NarrativeStats = {
    totalNarrativesDetected: 0,
    emergingNarratives: 0,
    viralNarratives: 0,
    trendsIdentified: 0,
    coordinationPatternsDetected: 0,
    processingTimeMs: 0,
  };
  private trackedKeywords = new Set<string>();
  private narrativeAlertCallbacks: ((narrative: Narrative) => void)[] = [];
  private detectedNarratives: Narrative[] = [];
  private detectedTrends: TrendData[] = [];
  private isInitialized: boolean = false;

  constructor(config: Partial<NarrativeDetectionConfig> = {}) {
    super();
    this.config = narrativeDetectionConfigSchema.parse(config);
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false;
    this.detectedNarratives = [];
    this.detectedTrends = [];
    this.trackedKeywords.clear();
    this.narrativeAlertCallbacks = [];
    this.emit('shutdown');
  }

  getConfig(): NarrativeDetectionConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<NarrativeDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  // =============================
  // Core Narrative Detection
  // =============================

  async detectNarratives(mentions: Mention[]): Promise<Narrative[]> {
    const startTime = Date.now();
    const narratives: Narrative[] = [];

    // Group mentions by keywords/topics
    const keywordGroups = new Map<string, Mention[]>();

    for (const mention of mentions) {
      const words = mention.content.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 4) {
          // Only consider meaningful words
          if (!keywordGroups.has(word)) {
            keywordGroups.set(word, []);
          }
          keywordGroups.get(word)!.push(mention);
        }
      }
    }

    // Create narratives for keyword groups that meet threshold
    for (const [keyword, groupMentions] of Array.from(keywordGroups)) {
      if (groupMentions.length >= this.config.minMentionsForNarrative) {
        const timestamps = groupMentions.map((m) => m.timestamp.getTime());
        const platforms = Array.from(new Set(groupMentions.map((m) => m.platform)));
        const sentiments = groupMentions.map((m) => m.sentiment || 0);
        const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;

        const timeRangeMs = Math.max(...timestamps) - Math.min(...timestamps);
        const velocity = groupMentions.length / (timeRangeMs / (60 * 60 * 1000) || 1);

        const isViral = velocity >= this.config.viralityThreshold;
        const isEmerging =
          timestamps.filter((t) => t > Date.now() - 6 * 60 * 60 * 1000).length >
          groupMentions.length * 0.7;

        const narrative: Narrative = {
          id: `narrative-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: `Narrative about "${keyword}"`,
          description: `Discussion centered around ${keyword}`,
          keywords: [keyword],
          mentions: groupMentions,
          sentiment: {
            average: avgSentiment,
            distribution: {
              positive: sentiments.filter((s) => s > 0.3).length / sentiments.length,
              neutral:
                sentiments.filter((s) => s >= -0.3 && s <= 0.3).length / sentiments.length,
              negative: sentiments.filter((s) => s < -0.3).length / sentiments.length,
            },
          },
          platforms,
          timeRange: {
            start: new Date(Math.min(...timestamps)),
            end: new Date(Math.max(...timestamps)),
          },
          velocity,
          reach: groupMentions.length * 1000, // Estimated
          isEmerging,
          isViral,
          confidenceScore: Math.min(1, groupMentions.length / 20),
        };

        narratives.push(narrative);
        this.detectedNarratives.push(narrative);

        if (isEmerging && this.config.emergingNarrativeAlertEnabled) {
          this.narrativeAlertCallbacks.forEach((cb) => cb(narrative));
          this.emit('emergingNarrative', narrative);
        }
      }
    }

    // Update stats
    this.stats.totalNarrativesDetected += narratives.length;
    this.stats.emergingNarratives += narratives.filter((n) => n.isEmerging).length;
    this.stats.viralNarratives += narratives.filter((n) => n.isViral).length;
    this.stats.processingTimeMs += Date.now() - startTime;

    this.emit('narrativesDetected', narratives);
    return narratives;
  }

  async analyzeNarrative(narrative: Narrative): Promise<{
    themes: string[];
    keyInfluencers: string[];
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    const authorCounts = new Map<string, number>();
    narrative.mentions.forEach((m) => {
      authorCounts.set(m.author, (authorCounts.get(m.author) || 0) + 1);
    });

    const keyInfluencers = Array.from(authorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([author]) => author);

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (narrative.sentiment.average < -0.5 || narrative.isViral) {
      riskLevel = 'high';
    } else if (narrative.sentiment.average < -0.2 || narrative.velocity > 50) {
      riskLevel = 'medium';
    }

    const recommendations: string[] = [];
    if (riskLevel === 'high') {
      recommendations.push('Monitor closely and prepare response strategy');
    }
    if (narrative.isEmerging) {
      recommendations.push('Track narrative evolution over next 24 hours');
    }
    if (narrative.sentiment.average < 0) {
      recommendations.push('Consider proactive communication to address concerns');
    }

    return {
      themes: narrative.keywords,
      keyInfluencers,
      riskLevel,
      recommendations,
    };
  }

  // =============================
  // Trend Detection
  // =============================

  async detectTrends(mentions: Mention[]): Promise<TrendData[]> {
    const startTime = Date.now();
    const keywordStats = new Map<
      string,
      {
        mentions: Mention[];
        timestamps: number[];
      }
    >();

    for (const mention of mentions) {
      const hashtags = mention.content.match(/#\w+/g) || [];
      for (const hashtag of hashtags) {
        const keyword = hashtag.toLowerCase();
        if (!keywordStats.has(keyword)) {
          keywordStats.set(keyword, { mentions: [], timestamps: [] });
        }
        const stats = keywordStats.get(keyword)!;
        stats.mentions.push(mention);
        stats.timestamps.push(mention.timestamp.getTime());
      }
    }

    const trends: TrendData[] = [];

    for (const [keyword, data] of Array.from(keywordStats)) {
      if (data.mentions.length >= 3) {
        const sortedTimestamps = [...data.timestamps].sort((a, b) => a - b);
        const firstHalf = sortedTimestamps.slice(0, Math.floor(sortedTimestamps.length / 2));
        const secondHalf = sortedTimestamps.slice(Math.floor(sortedTimestamps.length / 2));

        const growthRate =
          secondHalf.length > 0 && firstHalf.length > 0
            ? ((secondHalf.length - firstHalf.length) / firstHalf.length) * 100
            : 0;

        const platforms = Array.from(new Set(data.mentions.map((m) => m.platform)));

        trends.push({
          keyword,
          mentionCount: data.mentions.length,
          growthRate,
          platforms,
          firstSeen: new Date(Math.min(...sortedTimestamps)),
          lastSeen: new Date(Math.max(...sortedTimestamps)),
          peakTime: new Date(sortedTimestamps[Math.floor(sortedTimestamps.length / 2)]),
          isRising: growthRate > this.config.trendThreshold * 100,
          isFalling: growthRate < -this.config.trendThreshold * 100,
        });
      }
    }

    this.detectedTrends.push(...trends);
    this.stats.trendsIdentified += trends.length;
    this.stats.processingTimeMs += Date.now() - startTime;

    this.emit('trendsDetected', trends);
    return trends.sort((a, b) => b.mentionCount - a.mentionCount);
  }

  async getTopTrends(limit = 10): Promise<TrendData[]> {
    return [...this.detectedTrends]
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, limit);
  }

  trackKeyword(keyword: string): void {
    this.trackedKeywords.add(keyword.toLowerCase());
    this.emit('keywordTracked', keyword);
  }

  untrackKeyword(keyword: string): void {
    this.trackedKeywords.delete(keyword.toLowerCase());
    this.emit('keywordUntracked', keyword);
  }

  // =============================
  // Virality Analysis
  // =============================

  calculateViralityScore(mentions: Mention[]): number {
    if (mentions.length === 0) return 0;

    const timestamps = mentions.map((m) => m.timestamp.getTime()).sort((a, b) => a - b);
    const timeRangeHours =
      (timestamps[timestamps.length - 1] - timestamps[0]) / (60 * 60 * 1000);

    const platformDiversity = new Set(mentions.map((m) => m.platform)).size;
    const authorDiversity = new Set(mentions.map((m) => m.author)).size;

    // When timeRangeHours is 0, use mentions.length as velocity
    const velocity = timeRangeHours === 0 ? mentions.length : mentions.length / timeRangeHours;

    return velocity * 0.5 + platformDiversity * 10 + authorDiversity * 2;
  }

  async predictViralPotential(narrative: Narrative): Promise<{
    probability: number;
    factors: string[];
    timeToViralHours: number | null;
  }> {
    const velocity = narrative.velocity;
    const platforms = narrative.platforms.length;
    const sentiment = narrative.sentiment.average;

    const factors: string[] = [];
    let probability = 0.1;

    if (velocity > 20) {
      probability += 0.3;
      factors.push('High velocity');
    }
    if (platforms >= 3) {
      probability += 0.2;
      factors.push('Multi-platform spread');
    }
    if (narrative.isEmerging) {
      probability += 0.2;
      factors.push('Emerging narrative');
    }
    if (Math.abs(sentiment) > 0.5) {
      probability += 0.1;
      factors.push('Strong sentiment');
    }

    probability = Math.min(1, probability);

    const timeToViralHours = probability > 0.5 ? Math.round((1 - probability) * 24) : null;

    return { probability, factors, timeToViralHours };
  }

  // =============================
  // Coordination Detection
  // =============================

  async detectCoordinatedBehavior(mentions: Mention[]): Promise<CoordinationPattern[]> {
    if (!this.config.coordinationDetectionEnabled) return [];

    const patterns: CoordinationPattern[] = [];

    // Check timing patterns
    const timingAnalysis = await this.analyzeTimingPatterns(mentions);
    if (timingAnalysis.isCoordinated) {
      patterns.push({
        id: `coord-timing-${Date.now()}`,
        type: 'timing',
        involvedAuthors: Array.from(new Set(mentions.map((m) => m.author))),
        involvedMentions: mentions,
        similarityScore: 0.9,
        timingPatternMs: timingAnalysis.intervalMs,
        confidence: timingAnalysis.confidence,
        description: `Coordinated timing pattern detected with ${timingAnalysis.intervalMs}ms intervals`,
      });
    }

    // Check content similarity
    const contentAnalysis = await this.detectContentSimilarityPatterns(mentions);
    if (contentAnalysis.duplicateRate > 0.5) {
      patterns.push({
        id: `coord-content-${Date.now()}`,
        type: 'content',
        involvedAuthors: Array.from(new Set(mentions.map((m) => m.author))),
        involvedMentions: mentions,
        similarityScore: contentAnalysis.duplicateRate,
        timingPatternMs: 0,
        confidence: contentAnalysis.duplicateRate,
        description: `${Math.round(contentAnalysis.duplicateRate * 100)}% content similarity detected`,
      });
    }

    this.stats.coordinationPatternsDetected += patterns.length;
    this.emit('coordinationDetected', patterns);
    return patterns;
  }

  async analyzeTimingPatterns(mentions: Mention[]): Promise<{
    isCoordinated: boolean;
    intervalMs: number;
    confidence: number;
  }> {
    if (mentions.length < 3) {
      return { isCoordinated: false, intervalMs: 0, confidence: 0 };
    }

    const timestamps = mentions.map((m) => m.timestamp.getTime()).sort((a, b) => a - b);
    const intervals: number[] = [];

    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Low standard deviation relative to mean suggests coordination
    const coefficientOfVariation = stdDev / avgInterval;
    const isCoordinated = coefficientOfVariation < 0.3 && avgInterval < 60000; // Less than 1 min average

    return {
      isCoordinated,
      intervalMs: Math.round(avgInterval),
      confidence: isCoordinated ? Math.max(0, 1 - coefficientOfVariation) : 0,
    };
  }

  async detectContentSimilarityPatterns(mentions: Mention[]): Promise<{
    clusters: { content: string; count: number }[];
    duplicateRate: number;
  }> {
    const contentCounts = new Map<string, number>();

    for (const mention of mentions) {
      const normalized = mention.content.toLowerCase().trim();
      contentCounts.set(normalized, (contentCounts.get(normalized) || 0) + 1);
    }

    const clusters = Array.from(contentCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([content, count]) => ({ content: content.substring(0, 100), count }))
      .sort((a, b) => b.count - a.count);

    const duplicateCount = clusters.reduce((sum, c) => sum + c.count, 0);
    const duplicateRate = mentions.length > 0 ? duplicateCount / mentions.length : 0;

    return { clusters, duplicateRate };
  }

  // =============================
  // Emerging Narrative Alerts
  // =============================

  async getEmergingNarratives(): Promise<Narrative[]> {
    return this.detectedNarratives.filter((n) => n.isEmerging);
  }

  subscribeToNarrativeAlerts(callback: (narrative: Narrative) => void): void {
    this.narrativeAlertCallbacks.push(callback);
  }

  unsubscribeFromNarrativeAlerts(callback: (narrative: Narrative) => void): void {
    const index = this.narrativeAlertCallbacks.indexOf(callback);
    if (index > -1) {
      this.narrativeAlertCallbacks.splice(index, 1);
    }
  }

  // =============================
  // Statistics
  // =============================

  getStats(): NarrativeStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalNarrativesDetected: 0,
      emergingNarratives: 0,
      viralNarratives: 0,
      trendsIdentified: 0,
      coordinationPatternsDetected: 0,
      processingTimeMs: 0,
    };
    this.detectedNarratives = [];
    this.detectedTrends = [];
  }
}

/**
 * Factory function to create NarrativeDetectionService
 */
export function createNarrativeDetectionService(
  config: Partial<NarrativeDetectionConfig> = {}
): NarrativeDetectionService {
  return new NarrativeDetectionService(config);
}
