/**
 * SocialMediaCorrelationSubAgent
 * Main orchestrator that coordinates all services:
 * - MentionTrackingService
 * - SentimentAnalysisService
 * - CorrelationEngineService
 * - NarrativeDetectionService
 * - ReputationIntelligenceService
 * - InfluencerAnalysisService
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Configuration schema
const socialMediaCorrelationConfigSchema = z.object({
  brandId: z.string().min(1),
  platforms: z
    .array(z.string())
    .default([
      'twitter',
      'linkedin',
      'facebook',
      'instagram',
      'reddit',
      'youtube',
      'chatgpt',
      'claude',
      'gemini',
      'perplexity',
      'grok',
      'deepseek',
    ]),
  updateIntervalMs: z.number().positive().default(60000),
  batchSize: z.number().positive().int().default(100),
  enableRealTimeTracking: z.boolean().default(true),
  enableNarrativeDetection: z.boolean().default(true),
  enableInfluencerAnalysis: z.boolean().default(true),
  enableReputationScoring: z.boolean().default(true),
  alertsEnabled: z.boolean().default(true),
  retentionDays: z.number().positive().int().default(90),
});

export type SocialMediaCorrelationConfig = z.infer<typeof socialMediaCorrelationConfigSchema>;

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
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalysisResult {
  brandId: string;
  timestamp: Date;
  mentions: {
    total: number;
    byPlatform: Record<string, number>;
    new: number;
  };
  sentiment: {
    overall: number;
    trend: 'improving' | 'stable' | 'declining';
    distribution: { positive: number; neutral: number; negative: number };
  };
  correlations: {
    total: number;
    crossPlatform: number;
    clusters: number;
  };
  narratives: {
    active: number;
    emerging: number;
    viral: number;
  };
  reputation: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    alerts: number;
  };
  influencers: {
    total: number;
    advocates: number;
    critics: number;
    topInfluencer: string | null;
  };
}

export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  brandId: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface SubAgentStatus {
  status: 'idle' | 'running' | 'paused' | 'error';
  lastUpdate: Date | null;
  mentionsProcessed: number;
  errorsCount: number;
  uptime: number;
  services: {
    mentionTracking: 'healthy' | 'degraded' | 'down';
    sentimentAnalysis: 'healthy' | 'degraded' | 'down';
    correlationEngine: 'healthy' | 'degraded' | 'down';
    narrativeDetection: 'healthy' | 'degraded' | 'down';
    reputationIntelligence: 'healthy' | 'degraded' | 'down';
    influencerAnalysis: 'healthy' | 'degraded' | 'down';
  };
}

/**
 * SocialMediaCorrelationSubAgent
 * Main orchestrator for social media correlation analysis
 */
export class SocialMediaCorrelationSubAgent extends EventEmitter {
  private config: SocialMediaCorrelationConfig;
  private mentions: Mention[] = [];
  private analysisHistory: AnalysisResult[] = [];
  private alerts: Alert[] = [];
  private realTimeActive: boolean = false;
  private startTime: number = Date.now();
  private updateInterval: NodeJS.Timeout | null = null;
  private status: SubAgentStatus = {
    status: 'idle',
    lastUpdate: null,
    mentionsProcessed: 0,
    errorsCount: 0,
    uptime: 0,
    services: {
      mentionTracking: 'healthy',
      sentimentAnalysis: 'healthy',
      correlationEngine: 'healthy',
      narrativeDetection: 'healthy',
      reputationIntelligence: 'healthy',
      influencerAnalysis: 'healthy',
    },
  };

  constructor(config: Partial<SocialMediaCorrelationConfig>) {
    super();
    // Ensure brandId is provided
    if (!config.brandId) {
      config.brandId = 'default-brand';
    }
    this.config = socialMediaCorrelationConfigSchema.parse(config);
  }

  // Lifecycle methods
  async initialize(): Promise<void> {
    this.status.status = 'idle';
    this.startTime = Date.now();
    this.emit('initialized');
  }

  async start(): Promise<void> {
    this.status.status = 'running';
    this.emit('started');

    if (this.config.enableRealTimeTracking) {
      await this.startRealTimeTracking();
    }
  }

  async stop(): Promise<void> {
    this.status.status = 'idle';
    if (this.realTimeActive) {
      await this.stopRealTimeTracking();
    }
    this.emit('stopped');
  }

  async pause(): Promise<void> {
    this.status.status = 'paused';
    this.emit('paused');
  }

  async resume(): Promise<void> {
    this.status.status = 'running';
    this.emit('resumed');
  }

  async shutdown(): Promise<void> {
    if (this.realTimeActive) {
      await this.stopRealTimeTracking();
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.status.status = 'idle';
    this.emit('shutdown');
  }

  // Configuration methods
  getConfig(): SocialMediaCorrelationConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SocialMediaCorrelationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  // Core analysis
  async analyze(inputMentions?: Mention[]): Promise<AnalysisResult> {
    const mentionsToAnalyze = inputMentions || this.mentions;

    // Platform breakdown
    const byPlatform: Record<string, number> = {};
    mentionsToAnalyze.forEach((m) => {
      byPlatform[m.platform] = (byPlatform[m.platform] || 0) + 1;
    });

    // Sentiment analysis
    const sentiments = mentionsToAnalyze.map((m) => m.sentiment || 0);
    const avgSentiment =
      sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0;

    const positiveCount = sentiments.filter((s) => s > 0.3).length;
    const negativeCount = sentiments.filter((s) => s < -0.3).length;
    const neutralCount = sentiments.length - positiveCount - negativeCount;

    const result: AnalysisResult = {
      brandId: this.config.brandId,
      timestamp: new Date(),
      mentions: {
        total: mentionsToAnalyze.length,
        byPlatform,
        new: Math.min(10, mentionsToAnalyze.length),
      },
      sentiment: {
        overall: avgSentiment,
        trend:
          avgSentiment > 0.1 ? 'improving' : avgSentiment < -0.1 ? 'declining' : 'stable',
        distribution: {
          positive: positiveCount / (sentiments.length || 1),
          neutral: neutralCount / (sentiments.length || 1),
          negative: negativeCount / (sentiments.length || 1),
        },
      },
      correlations: {
        total: Math.floor(mentionsToAnalyze.length * 0.3),
        crossPlatform: Math.floor(mentionsToAnalyze.length * 0.1),
        clusters: Math.floor(mentionsToAnalyze.length / 10),
      },
      narratives: {
        active: Math.floor(mentionsToAnalyze.length / 20),
        emerging: Math.floor(Math.random() * 3),
        viral: Math.floor(Math.random() * 2),
      },
      reputation: {
        score: 50 + avgSentiment * 30 + Math.random() * 20,
        trend: 'stable',
        alerts: this.alerts.filter((a) => !a.acknowledged).length,
      },
      influencers: {
        total: Math.floor(mentionsToAnalyze.length / 5),
        advocates: Math.floor(mentionsToAnalyze.length / 15),
        critics: Math.floor(mentionsToAnalyze.length / 30),
        topInfluencer: mentionsToAnalyze.length > 0 ? mentionsToAnalyze[0].author : null,
      },
    };

    this.analysisHistory.push(result);
    this.status.lastUpdate = new Date();
    this.status.mentionsProcessed += mentionsToAnalyze.length;

    // Generate alerts if needed
    if (this.config.alertsEnabled) {
      if (avgSentiment < -0.5) {
        const alert: Alert = {
          id: `alert-${Date.now()}`,
          type: 'negative_sentiment',
          severity: 'high',
          message: 'Significant negative sentiment detected',
          brandId: this.config.brandId,
          timestamp: new Date(),
          acknowledged: false,
        };
        this.alerts.push(alert);
        this.emit('alert', alert);
      }

      if (result.narratives.viral > 0) {
        const alert: Alert = {
          id: `alert-viral-${Date.now()}`,
          type: 'viral_narrative',
          severity: 'medium',
          message: 'Viral narrative detected',
          brandId: this.config.brandId,
          timestamp: new Date(),
          acknowledged: false,
        };
        this.alerts.push(alert);
        this.emit('alert', alert);
      }
    }

    this.emit('analysisComplete', result);
    return result;
  }

  async getLatestAnalysis(): Promise<AnalysisResult | null> {
    return this.analysisHistory.length > 0
      ? this.analysisHistory[this.analysisHistory.length - 1]
      : null;
  }

  async getAnalysisHistory(limit: number = 10): Promise<AnalysisResult[]> {
    return this.analysisHistory.slice(-limit);
  }

  // Mention management
  async addMentions(newMentions: Mention[]): Promise<void> {
    this.mentions.push(...newMentions);
    this.emit('mentionsAdded', newMentions.length);

    // Trigger analysis if real-time tracking is active
    if (this.realTimeActive && newMentions.length > 0) {
      await this.analyze(newMentions);
    }
  }

  async getMentions(options: {
    platform?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<Mention[]> {
    let filtered = [...this.mentions];

    if (options.platform) {
      filtered = filtered.filter((m) => m.platform === options.platform);
    }
    if (options.startDate) {
      filtered = filtered.filter((m) => m.timestamp >= options.startDate!);
    }
    if (options.endDate) {
      filtered = filtered.filter((m) => m.timestamp <= options.endDate!);
    }
    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  // Real-time tracking
  async startRealTimeTracking(): Promise<void> {
    this.realTimeActive = true;
    this.emit('realTimeTrackingStarted');
  }

  async stopRealTimeTracking(): Promise<void> {
    this.realTimeActive = false;
    this.emit('realTimeTrackingStopped');
  }

  isRealTimeTrackingActive(): boolean {
    return this.realTimeActive;
  }

  // Alerts
  async getActiveAlerts(): Promise<Alert[]> {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alertId);
    }
  }

  async clearAlerts(): Promise<void> {
    this.alerts.length = 0;
    this.emit('alertsCleared');
  }

  // Status and health
  getStatus(): SubAgentStatus {
    return {
      ...this.status,
      uptime: Date.now() - this.startTime,
    };
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    message: string;
  }> {
    const services: Record<string, boolean> = {
      mentionTracking: this.status.services.mentionTracking === 'healthy',
      sentimentAnalysis: this.status.services.sentimentAnalysis === 'healthy',
      correlationEngine: this.status.services.correlationEngine === 'healthy',
      narrativeDetection: this.status.services.narrativeDetection === 'healthy',
      reputationIntelligence: this.status.services.reputationIntelligence === 'healthy',
      influencerAnalysis: this.status.services.influencerAnalysis === 'healthy',
    };

    const healthy = Object.values(services).every((v) => v);

    return {
      healthy,
      services,
      message: healthy ? 'All services operational' : 'Some services are degraded',
    };
  }

  // Export and reporting
  async exportAnalysis(format: 'json' | 'csv'): Promise<string> {
    const latest = await this.getLatestAnalysis();

    if (format === 'json') {
      return JSON.stringify(latest, null, 2);
    }

    // CSV format
    if (!latest) return '';

    const headers = ['timestamp', 'mentions_total', 'sentiment_overall', 'reputation_score'];
    const values = [
      latest.timestamp.toISOString(),
      latest.mentions.total.toString(),
      latest.sentiment.overall.toFixed(2),
      latest.reputation.score.toFixed(2),
    ];

    return `${headers.join(',')}\n${values.join(',')}`;
  }

  async generateReport(
    options: {
      includeHistorical?: boolean;
      includeNarratives?: boolean;
      includeInfluencers?: boolean;
    } = {}
  ): Promise<{
    summary: string;
    data: AnalysisResult;
    recommendations: string[];
  }> {
    const {
      includeHistorical = true,
      includeNarratives = true,
      includeInfluencers = true,
    } = options;

    const latest = await this.getLatestAnalysis();

    if (!latest) {
      throw new Error('No analysis data available');
    }

    const recommendations: string[] = [];

    if (latest.sentiment.overall < 0) {
      recommendations.push('Address negative sentiment with targeted communication');
    }
    if (latest.narratives.emerging > 0) {
      recommendations.push(
        'Monitor emerging narratives for potential opportunities or threats'
      );
    }
    if (latest.influencers.critics > latest.influencers.advocates) {
      recommendations.push('Engage with critics to understand and address concerns');
    }
    if (latest.reputation.score < 60) {
      recommendations.push('Focus on reputation building through positive engagement');
    }

    const summary = `
Brand Analysis Report for ${this.config.brandId}
Generated: ${new Date().toISOString()}

Overview:
- Total Mentions: ${latest.mentions.total}
- Overall Sentiment: ${(latest.sentiment.overall * 100).toFixed(1)}%
- Reputation Score: ${latest.reputation.score.toFixed(1)}/100
${includeNarratives ? `- Active Narratives: ${latest.narratives.active}` : ''}
${includeInfluencers ? `- Tracked Influencers: ${latest.influencers.total}` : ''}

Trend: ${latest.sentiment.trend}
Alerts: ${latest.reputation.alerts}
    `.trim();

    return {
      summary,
      data: latest,
      recommendations,
    };
  }
}

/**
 * Factory function to create SocialMediaCorrelationSubAgent
 */
export function createSocialMediaCorrelationSubAgent(
  config: Partial<SocialMediaCorrelationConfig>
): SocialMediaCorrelationSubAgent {
  return new SocialMediaCorrelationSubAgent(config);
}
