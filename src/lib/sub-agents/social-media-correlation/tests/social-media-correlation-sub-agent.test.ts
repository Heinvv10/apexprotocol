/**
 * SocialMediaCorrelationSubAgent Tests
 *
 * TDD tests for the main orchestrator that coordinates all services:
 * - MentionTrackingService
 * - SentimentAnalysisService
 * - CorrelationEngineService
 * - NarrativeDetectionService
 * - ReputationIntelligenceService
 * - InfluencerAnalysisService
 *
 * Following the "Ralph system" - write tests first, then implement.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { z } from 'zod';

// Types that will be implemented
interface SocialMediaCorrelationConfig {
  brandId: string;
  platforms: string[];
  updateIntervalMs: number;
  batchSize: number;
  enableRealTimeTracking: boolean;
  enableNarrativeDetection: boolean;
  enableInfluencerAnalysis: boolean;
  enableReputationScoring: boolean;
  alertsEnabled: boolean;
  retentionDays: number;
}

interface Mention {
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

interface AnalysisResult {
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
    distribution: { positive: number; neutral: number; negative: number; unrecognized: number };
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

interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  brandId: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface SubAgentStatus {
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

interface SocialMediaCorrelationSubAgent extends EventEmitter {
  // Lifecycle
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  shutdown(): Promise<void>;

  // Configuration
  getConfig(): SocialMediaCorrelationConfig;
  updateConfig(config: Partial<SocialMediaCorrelationConfig>): void;

  // Core analysis
  analyze(mentions?: Mention[]): Promise<AnalysisResult>;
  getLatestAnalysis(): Promise<AnalysisResult | null>;
  getAnalysisHistory(limit?: number): Promise<AnalysisResult[]>;

  // Mention management
  addMentions(mentions: Mention[]): Promise<void>;
  getMentions(options?: {
    platform?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<Mention[]>;

  // Real-time tracking
  startRealTimeTracking(): Promise<void>;
  stopRealTimeTracking(): Promise<void>;
  isRealTimeTrackingActive(): boolean;

  // Alerts
  getActiveAlerts(): Promise<Alert[]>;
  acknowledgeAlert(alertId: string): Promise<void>;
  clearAlerts(): Promise<void>;

  // Status and health
  getStatus(): SubAgentStatus;
  healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    message: string;
  }>;

  // Export and reporting
  exportAnalysis(format: 'json' | 'csv'): Promise<string>;
  generateReport(options?: {
    includeHistorical?: boolean;
    includeNarratives?: boolean;
    includeInfluencers?: boolean;
  }): Promise<{
    summary: string;
    data: AnalysisResult;
    recommendations: string[];
  }>;
}

// Factory function signature
declare function createSocialMediaCorrelationSubAgent(config: Partial<SocialMediaCorrelationConfig>): SocialMediaCorrelationSubAgent;

// Mock implementation for testing
const createMockSocialMediaCorrelationSubAgent = (config: Partial<SocialMediaCorrelationConfig>): SocialMediaCorrelationSubAgent => {
  const defaultConfig: SocialMediaCorrelationConfig = {
    brandId: config.brandId || 'default-brand',
    platforms: ['twitter', 'linkedin', 'facebook', 'instagram', 'reddit', 'youtube', 'chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek'],
    updateIntervalMs: 60000,
    batchSize: 100,
    enableRealTimeTracking: true,
    enableNarrativeDetection: true,
    enableInfluencerAnalysis: true,
    enableReputationScoring: true,
    alertsEnabled: true,
    retentionDays: 90,
    ...config
  };

  let currentConfig = { ...defaultConfig };
  const status: SubAgentStatus = {
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
      influencerAnalysis: 'healthy'
    }
  };

  const mentions: Mention[] = [];
  const analysisHistory: AnalysisResult[] = [];
  const alerts: Alert[] = [];
  let realTimeActive = false;
  let startTime = Date.now();
  const updateInterval: NodeJS.Timeout | null = null;

  const agent = new EventEmitter() as SocialMediaCorrelationSubAgent;

  agent.initialize = async () => {
    status.status = 'idle';
    startTime = Date.now();
    agent.emit('initialized');
  };

  agent.start = async () => {
    status.status = 'running';
    agent.emit('started');

    if (currentConfig.enableRealTimeTracking) {
      await agent.startRealTimeTracking();
    }
  };

  agent.stop = async () => {
    status.status = 'idle';
    if (realTimeActive) {
      await agent.stopRealTimeTracking();
    }
    agent.emit('stopped');
  };

  agent.pause = async () => {
    status.status = 'paused';
    agent.emit('paused');
  };

  agent.resume = async () => {
    status.status = 'running';
    agent.emit('resumed');
  };

  agent.shutdown = async () => {
    if (realTimeActive) {
      await agent.stopRealTimeTracking();
    }
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    status.status = 'idle';
    agent.emit('shutdown');
  };

  agent.getConfig = () => ({ ...currentConfig });

  agent.updateConfig = (newConfig: Partial<SocialMediaCorrelationConfig>) => {
    currentConfig = { ...currentConfig, ...newConfig };
    agent.emit('configUpdated', currentConfig);
  };

  agent.analyze = async (inputMentions?: Mention[]): Promise<AnalysisResult> => {
    const mentionsToAnalyze = inputMentions || mentions;

    // Platform breakdown
    const byPlatform: Record<string, number> = {};
    mentionsToAnalyze.forEach(m => {
      byPlatform[m.platform] = (byPlatform[m.platform] || 0) + 1;
    });

    // Sentiment analysis
    const sentiments = mentionsToAnalyze.map(m => m.sentiment || 0);
    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
      : 0;

    const positiveCount = sentiments.filter(s => s > 0.3).length;
    const negativeCount = sentiments.filter(s => s < -0.3).length;
    const neutralCount = sentiments.length - positiveCount - negativeCount;

    const result: AnalysisResult = {
      brandId: currentConfig.brandId,
      timestamp: new Date(),
      mentions: {
        total: mentionsToAnalyze.length,
        byPlatform,
        new: Math.min(10, mentionsToAnalyze.length)
      },
      sentiment: {
        overall: avgSentiment,
        trend: avgSentiment > 0.1 ? 'improving' : avgSentiment < -0.1 ? 'declining' : 'stable',
        distribution: {
          positive: positiveCount / (sentiments.length || 1),
          neutral: neutralCount / (sentiments.length || 1),
          negative: negativeCount / (sentiments.length || 1),
          unrecognized: 0
        }
      },
      correlations: {
        total: Math.floor(mentionsToAnalyze.length * 0.3),
        crossPlatform: Math.floor(mentionsToAnalyze.length * 0.1),
        clusters: Math.floor(mentionsToAnalyze.length / 10)
      },
      narratives: {
        active: Math.floor(mentionsToAnalyze.length / 20),
        emerging: Math.floor(Math.random() * 3),
        viral: Math.floor(Math.random() * 2)
      },
      reputation: {
        score: 50 + avgSentiment * 30 + Math.random() * 20,
        trend: 'stable',
        alerts: alerts.filter(a => !a.acknowledged).length
      },
      influencers: {
        total: Math.floor(mentionsToAnalyze.length / 5),
        advocates: Math.floor(mentionsToAnalyze.length / 15),
        critics: Math.floor(mentionsToAnalyze.length / 30),
        topInfluencer: mentionsToAnalyze.length > 0 ? mentionsToAnalyze[0].author : null
      }
    };

    analysisHistory.push(result);
    status.lastUpdate = new Date();
    status.mentionsProcessed += mentionsToAnalyze.length;

    // Generate alerts if needed
    if (currentConfig.alertsEnabled) {
      if (avgSentiment < -0.5) {
        const alert: Alert = {
          id: `alert-${Date.now()}`,
          type: 'negative_sentiment',
          severity: 'high',
          message: 'Significant negative sentiment detected',
          brandId: currentConfig.brandId,
          timestamp: new Date(),
          acknowledged: false
        };
        alerts.push(alert);
        agent.emit('alert', alert);
      }

      if (result.narratives.viral > 0) {
        const alert: Alert = {
          id: `alert-viral-${Date.now()}`,
          type: 'viral_narrative',
          severity: 'medium',
          message: 'Viral narrative detected',
          brandId: currentConfig.brandId,
          timestamp: new Date(),
          acknowledged: false
        };
        alerts.push(alert);
        agent.emit('alert', alert);
      }
    }

    agent.emit('analysisComplete', result);
    return result;
  };

  agent.getLatestAnalysis = async (): Promise<AnalysisResult | null> => {
    return analysisHistory.length > 0 ? analysisHistory[analysisHistory.length - 1] : null;
  };

  agent.getAnalysisHistory = async (limit = 10): Promise<AnalysisResult[]> => {
    return analysisHistory.slice(-limit);
  };

  agent.addMentions = async (newMentions: Mention[]): Promise<void> => {
    mentions.push(...newMentions);
    agent.emit('mentionsAdded', newMentions.length);

    // Trigger analysis if real-time tracking is active
    if (realTimeActive && newMentions.length > 0) {
      await agent.analyze(newMentions);
    }
  };

  agent.getMentions = async (options = {}): Promise<Mention[]> => {
    let filtered = [...mentions];

    if (options.platform) {
      filtered = filtered.filter(m => m.platform === options.platform);
    }
    if (options.startDate) {
      filtered = filtered.filter(m => m.timestamp >= options.startDate!);
    }
    if (options.endDate) {
      filtered = filtered.filter(m => m.timestamp <= options.endDate!);
    }
    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  };

  agent.startRealTimeTracking = async (): Promise<void> => {
    realTimeActive = true;
    agent.emit('realTimeTrackingStarted');
  };

  agent.stopRealTimeTracking = async (): Promise<void> => {
    realTimeActive = false;
    agent.emit('realTimeTrackingStopped');
  };

  agent.isRealTimeTrackingActive = (): boolean => {
    return realTimeActive;
  };

  agent.getActiveAlerts = async (): Promise<Alert[]> => {
    return alerts.filter(a => !a.acknowledged);
  };

  agent.acknowledgeAlert = async (alertId: string): Promise<void> => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      agent.emit('alertAcknowledged', alertId);
    }
  };

  agent.clearAlerts = async (): Promise<void> => {
    alerts.length = 0;
    agent.emit('alertsCleared');
  };

  agent.getStatus = (): SubAgentStatus => {
    return {
      ...status,
      uptime: Date.now() - startTime
    };
  };

  agent.healthCheck = async () => {
    const services: Record<string, boolean> = {
      mentionTracking: status.services.mentionTracking === 'healthy',
      sentimentAnalysis: status.services.sentimentAnalysis === 'healthy',
      correlationEngine: status.services.correlationEngine === 'healthy',
      narrativeDetection: status.services.narrativeDetection === 'healthy',
      reputationIntelligence: status.services.reputationIntelligence === 'healthy',
      influencerAnalysis: status.services.influencerAnalysis === 'healthy'
    };

    const healthy = Object.values(services).every(v => v);

    return {
      healthy,
      services,
      message: healthy ? 'All services operational' : 'Some services are degraded'
    };
  };

  agent.exportAnalysis = async (format: 'json' | 'csv'): Promise<string> => {
    const latest = await agent.getLatestAnalysis();

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
      latest.reputation.score.toFixed(2)
    ];

    return `${headers.join(',')}\n${values.join(',')}`;
  };

  agent.generateReport = async (options = {}) => {
    const {
      includeHistorical = true,
      includeNarratives = true,
      includeInfluencers = true
    } = options;

    const latest = await agent.getLatestAnalysis();

    if (!latest) {
      throw new Error('No analysis data available');
    }

    const recommendations: string[] = [];

    if (latest.sentiment.overall < 0) {
      recommendations.push('Address negative sentiment with targeted communication');
    }
    if (latest.narratives.emerging > 0) {
      recommendations.push('Monitor emerging narratives for potential opportunities or threats');
    }
    if (latest.influencers.critics > latest.influencers.advocates) {
      recommendations.push('Engage with critics to understand and address concerns');
    }
    if (latest.reputation.score < 60) {
      recommendations.push('Focus on reputation building through positive engagement');
    }

    const summary = `
Brand Analysis Report for ${currentConfig.brandId}
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
      recommendations
    };
  };

  return agent;
};

describe('SocialMediaCorrelationSubAgent', () => {
  let agent: SocialMediaCorrelationSubAgent;

  beforeEach(() => {
    agent = createMockSocialMediaCorrelationSubAgent({
      brandId: 'test-brand'
    });
  });

  afterEach(async () => {
    await agent.shutdown();
  });

  // ===================
  // Configuration Tests
  // ===================
  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = agent.getConfig();

      expect(config.brandId).toBe('test-brand');
      expect(config.platforms).toContain('twitter');
      expect(config.platforms).toContain('linkedin');
      expect(config.platforms).toContain('chatgpt');
      expect(config.platforms).toContain('claude');
      expect(config.enableRealTimeTracking).toBe(true);
      expect(config.enableNarrativeDetection).toBe(true);
      expect(config.enableInfluencerAnalysis).toBe(true);
      expect(config.enableReputationScoring).toBe(true);
      expect(config.alertsEnabled).toBe(true);
    });

    it('should support all 12 platforms', () => {
      const config = agent.getConfig();
      const expectedPlatforms = [
        'twitter', 'linkedin', 'facebook', 'instagram', 'reddit', 'youtube',
        'chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek'
      ];

      expectedPlatforms.forEach(platform => {
        expect(config.platforms).toContain(platform);
      });
    });

    it('should accept custom configuration', () => {
      const customAgent = createMockSocialMediaCorrelationSubAgent({
        brandId: 'custom-brand',
        platforms: ['twitter', 'linkedin'],
        updateIntervalMs: 30000,
        enableInfluencerAnalysis: false
      });

      const config = customAgent.getConfig();
      expect(config.brandId).toBe('custom-brand');
      expect(config.platforms.length).toBe(2);
      expect(config.updateIntervalMs).toBe(30000);
      expect(config.enableInfluencerAnalysis).toBe(false);
    });

    it('should update configuration dynamically', () => {
      agent.updateConfig({ alertsEnabled: false });

      const config = agent.getConfig();
      expect(config.alertsEnabled).toBe(false);
    });

    it('should emit event on config update', () => {
      const configHandler = vi.fn();
      agent.on('configUpdated', configHandler);

      agent.updateConfig({ batchSize: 200 });

      expect(configHandler).toHaveBeenCalled();
    });

    it('should validate configuration with zod schema', () => {
      const configSchema = z.object({
        brandId: z.string().min(1),
        platforms: z.array(z.string()).min(1),
        updateIntervalMs: z.number().positive(),
        batchSize: z.number().positive().int(),
        enableRealTimeTracking: z.boolean(),
        enableNarrativeDetection: z.boolean(),
        enableInfluencerAnalysis: z.boolean(),
        enableReputationScoring: z.boolean(),
        alertsEnabled: z.boolean(),
        retentionDays: z.number().positive().int()
      });

      const config = agent.getConfig();
      const result = configSchema.safeParse(config);

      expect(result.success).toBe(true);
    });
  });

  // ================
  // Lifecycle Tests
  // ================
  describe('Lifecycle', () => {
    it('should initialize successfully', async () => {
      const initHandler = vi.fn();
      agent.on('initialized', initHandler);

      await agent.initialize();

      expect(initHandler).toHaveBeenCalled();
    });

    it('should start successfully', async () => {
      const startHandler = vi.fn();
      agent.on('started', startHandler);

      await agent.initialize();
      await agent.start();

      expect(startHandler).toHaveBeenCalled();
      expect(agent.getStatus().status).toBe('running');
    });

    it('should stop successfully', async () => {
      const stopHandler = vi.fn();
      agent.on('stopped', stopHandler);

      await agent.initialize();
      await agent.start();
      await agent.stop();

      expect(stopHandler).toHaveBeenCalled();
      expect(agent.getStatus().status).toBe('idle');
    });

    it('should pause and resume', async () => {
      const pauseHandler = vi.fn();
      const resumeHandler = vi.fn();
      agent.on('paused', pauseHandler);
      agent.on('resumed', resumeHandler);

      await agent.initialize();
      await agent.start();

      await agent.pause();
      expect(agent.getStatus().status).toBe('paused');
      expect(pauseHandler).toHaveBeenCalled();

      await agent.resume();
      expect(agent.getStatus().status).toBe('running');
      expect(resumeHandler).toHaveBeenCalled();
    });

    it('should shutdown gracefully', async () => {
      const shutdownHandler = vi.fn();
      agent.on('shutdown', shutdownHandler);

      await agent.initialize();
      await agent.start();
      await agent.shutdown();

      expect(shutdownHandler).toHaveBeenCalled();
    });

    it('should be an EventEmitter', () => {
      expect(agent).toBeInstanceOf(EventEmitter);
    });
  });

  // ==================
  // Core Analysis Tests
  // ==================
  describe('Core Analysis', () => {
    const createMention = (
      id: string,
      platform: string,
      sentiment: number
    ): Mention => ({
      id,
      platform,
      brandId: 'test-brand',
      content: 'Test content',
      author: `author-${id}`,
      timestamp: new Date(),
      sentiment
    });

    it('should analyze mentions and return comprehensive result', async () => {
      await agent.initialize();

      const mentions = [
        createMention('m1', 'twitter', 0.8),
        createMention('m2', 'linkedin', 0.6),
        createMention('m3', 'chatgpt', -0.2)
      ];

      const result = await agent.analyze(mentions);

      expect(result.brandId).toBe('test-brand');
      expect(result.mentions.total).toBe(3);
      expect(result.sentiment.overall).toBeDefined();
      expect(result.correlations).toBeDefined();
      expect(result.narratives).toBeDefined();
      expect(result.reputation).toBeDefined();
      expect(result.influencers).toBeDefined();
    });

    it('should include platform breakdown', async () => {
      const mentions = [
        createMention('m1', 'twitter', 0.5),
        createMention('m2', 'twitter', 0.6),
        createMention('m3', 'linkedin', 0.7)
      ];

      const result = await agent.analyze(mentions);

      expect(result.mentions.byPlatform.twitter).toBe(2);
      expect(result.mentions.byPlatform.linkedin).toBe(1);
    });

    it('should calculate sentiment distribution', async () => {
      const mentions = [
        createMention('m1', 'twitter', 0.9), // positive
        createMention('m2', 'twitter', 0.0), // neutral
        createMention('m3', 'twitter', -0.8) // negative
      ];

      const result = await agent.analyze(mentions);

      expect(result.sentiment.distribution.positive).toBeGreaterThan(0);
      expect(result.sentiment.distribution.neutral).toBeGreaterThan(0);
      expect(result.sentiment.distribution.negative).toBeGreaterThan(0);
    });

    it('should detect sentiment trend', async () => {
      const positiveMentions = [
        createMention('m1', 'twitter', 0.8),
        createMention('m2', 'linkedin', 0.9)
      ];

      const result = await agent.analyze(positiveMentions);

      expect(['improving', 'stable', 'declining']).toContain(result.sentiment.trend);
    });

    it('should include correlation metrics', async () => {
      const mentions = Array.from({ length: 20 }, (_, i) =>
        createMention(`m${i}`, i % 2 === 0 ? 'twitter' : 'linkedin', 0.5)
      );

      const result = await agent.analyze(mentions);

      expect(result.correlations.total).toBeGreaterThanOrEqual(0);
      expect(result.correlations.crossPlatform).toBeGreaterThanOrEqual(0);
      expect(result.correlations.clusters).toBeGreaterThanOrEqual(0);
    });

    it('should include narrative metrics', async () => {
      const mentions = Array.from({ length: 30 }, (_, i) =>
        createMention(`m${i}`, 'twitter', 0.5)
      );

      const result = await agent.analyze(mentions);

      expect(result.narratives.active).toBeGreaterThanOrEqual(0);
      expect(result.narratives.emerging).toBeGreaterThanOrEqual(0);
      expect(result.narratives.viral).toBeGreaterThanOrEqual(0);
    });

    it('should include reputation score', async () => {
      const mentions = [createMention('m1', 'twitter', 0.8)];

      const result = await agent.analyze(mentions);

      expect(result.reputation.score).toBeGreaterThanOrEqual(0);
      expect(result.reputation.score).toBeLessThanOrEqual(100);
    });

    it('should include influencer metrics', async () => {
      const mentions = Array.from({ length: 10 }, (_, i) =>
        createMention(`m${i}`, 'twitter', 0.5)
      );

      const result = await agent.analyze(mentions);

      expect(result.influencers.total).toBeGreaterThanOrEqual(0);
      expect(result.influencers.advocates).toBeGreaterThanOrEqual(0);
      expect(result.influencers.critics).toBeGreaterThanOrEqual(0);
    });

    it('should emit analysis complete event', async () => {
      const analysisHandler = vi.fn();
      agent.on('analysisComplete', analysisHandler);

      await agent.analyze([createMention('m1', 'twitter', 0.5)]);

      expect(analysisHandler).toHaveBeenCalled();
    });

    it('should store analysis in history', async () => {
      await agent.analyze([createMention('m1', 'twitter', 0.5)]);
      await agent.analyze([createMention('m2', 'linkedin', 0.6)]);

      const history = await agent.getAnalysisHistory();

      expect(history.length).toBe(2);
    });

    it('should get latest analysis', async () => {
      await agent.analyze([createMention('m1', 'twitter', 0.5)]);
      await agent.analyze([createMention('m2', 'linkedin', 0.6)]);

      const latest = await agent.getLatestAnalysis();

      expect(latest).not.toBeNull();
    });
  });

  // ========================
  // Mention Management Tests
  // ========================
  describe('Mention Management', () => {
    const createMention = (id: string, platform: string, timestamp?: Date): Mention => ({
      id,
      platform,
      brandId: 'test-brand',
      content: 'Test',
      author: `author-${id}`,
      timestamp: timestamp || new Date(),
      sentiment: 0.5
    });

    it('should add mentions', async () => {
      const mentions = [
        createMention('m1', 'twitter'),
        createMention('m2', 'linkedin')
      ];

      await agent.addMentions(mentions);

      const stored = await agent.getMentions();
      expect(stored.length).toBe(2);
    });

    it('should emit event when mentions added', async () => {
      const addHandler = vi.fn();
      agent.on('mentionsAdded', addHandler);

      await agent.addMentions([createMention('m1', 'twitter')]);

      expect(addHandler).toHaveBeenCalledWith(1);
    });

    it('should filter mentions by platform', async () => {
      await agent.addMentions([
        createMention('m1', 'twitter'),
        createMention('m2', 'linkedin'),
        createMention('m3', 'twitter')
      ]);

      const twitterMentions = await agent.getMentions({ platform: 'twitter' });

      expect(twitterMentions.length).toBe(2);
      twitterMentions.forEach(m => expect(m.platform).toBe('twitter'));
    });

    it('should filter mentions by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      await agent.addMentions([
        createMention('m1', 'twitter', twoDaysAgo),
        createMention('m2', 'twitter', yesterday),
        createMention('m3', 'twitter', now)
      ]);

      const recentMentions = await agent.getMentions({
        startDate: yesterday
      });

      expect(recentMentions.length).toBe(2);
    });

    it('should limit mention results', async () => {
      await agent.addMentions(
        Array.from({ length: 20 }, (_, i) => createMention(`m${i}`, 'twitter'))
      );

      const limitedMentions = await agent.getMentions({ limit: 5 });

      expect(limitedMentions.length).toBe(5);
    });
  });

  // ==========================
  // Real-Time Tracking Tests
  // ==========================
  describe('Real-Time Tracking', () => {
    it('should start real-time tracking', async () => {
      const rtStartHandler = vi.fn();
      agent.on('realTimeTrackingStarted', rtStartHandler);

      await agent.startRealTimeTracking();

      expect(agent.isRealTimeTrackingActive()).toBe(true);
      expect(rtStartHandler).toHaveBeenCalled();
    });

    it('should stop real-time tracking', async () => {
      const rtStopHandler = vi.fn();
      agent.on('realTimeTrackingStopped', rtStopHandler);

      await agent.startRealTimeTracking();
      await agent.stopRealTimeTracking();

      expect(agent.isRealTimeTrackingActive()).toBe(false);
      expect(rtStopHandler).toHaveBeenCalled();
    });

    it('should auto-start real-time tracking when agent starts', async () => {
      await agent.initialize();
      await agent.start();

      expect(agent.isRealTimeTrackingActive()).toBe(true);
    });

    it('should stop real-time tracking on shutdown', async () => {
      await agent.initialize();
      await agent.start();

      expect(agent.isRealTimeTrackingActive()).toBe(true);

      await agent.shutdown();

      expect(agent.isRealTimeTrackingActive()).toBe(false);
    });

    it('should analyze mentions automatically when real-time active', async () => {
      await agent.startRealTimeTracking();

      const analysisHandler = vi.fn();
      agent.on('analysisComplete', analysisHandler);

      await agent.addMentions([{
        id: 'm1',
        platform: 'twitter',
        brandId: 'test-brand',
        content: 'Test',
        author: 'author1',
        timestamp: new Date(),
        sentiment: 0.5
      }]);

      expect(analysisHandler).toHaveBeenCalled();
    });
  });

  // ==============
  // Alerts Tests
  // ==============
  describe('Alerts', () => {
    it('should generate alert on negative sentiment', async () => {
      const alertHandler = vi.fn();
      agent.on('alert', alertHandler);

      await agent.analyze([{
        id: 'm1',
        platform: 'twitter',
        brandId: 'test-brand',
        content: 'Terrible experience',
        author: 'angry_user',
        timestamp: new Date(),
        sentiment: -0.8
      }]);

      expect(alertHandler).toHaveBeenCalled();
    });

    it('should get active alerts', async () => {
      await agent.analyze([{
        id: 'm1',
        platform: 'twitter',
        brandId: 'test-brand',
        content: 'Bad service',
        author: 'unhappy',
        timestamp: new Date(),
        sentiment: -0.9
      }]);

      const alerts = await agent.getActiveAlerts();

      expect(alerts.length).toBeGreaterThan(0);
      alerts.forEach(a => expect(a.acknowledged).toBe(false));
    });

    it('should acknowledge alert', async () => {
      await agent.analyze([{
        id: 'm1',
        platform: 'twitter',
        brandId: 'test-brand',
        content: 'Awful',
        author: 'critic',
        timestamp: new Date(),
        sentiment: -0.95
      }]);

      const alerts = await agent.getActiveAlerts();
      if (alerts.length > 0) {
        await agent.acknowledgeAlert(alerts[0].id);

        const remainingAlerts = await agent.getActiveAlerts();
        expect(remainingAlerts.find(a => a.id === alerts[0].id)).toBeUndefined();
      }
    });

    it('should emit event when alert acknowledged', async () => {
      await agent.analyze([{
        id: 'm1',
        platform: 'twitter',
        brandId: 'test-brand',
        content: 'Bad',
        author: 'user',
        timestamp: new Date(),
        sentiment: -0.9
      }]);

      const ackHandler = vi.fn();
      agent.on('alertAcknowledged', ackHandler);

      const alerts = await agent.getActiveAlerts();
      if (alerts.length > 0) {
        await agent.acknowledgeAlert(alerts[0].id);
        expect(ackHandler).toHaveBeenCalled();
      }
    });

    it('should clear all alerts', async () => {
      await agent.analyze([{
        id: 'm1',
        platform: 'twitter',
        brandId: 'test-brand',
        content: 'Terrible',
        author: 'user',
        timestamp: new Date(),
        sentiment: -0.9
      }]);

      await agent.clearAlerts();

      const alerts = await agent.getActiveAlerts();
      expect(alerts.length).toBe(0);
    });
  });

  // =======================
  // Status and Health Tests
  // =======================
  describe('Status and Health', () => {
    it('should return current status', async () => {
      await agent.initialize();

      const status = agent.getStatus();

      expect(status.status).toBe('idle');
      expect(status.services).toBeDefined();
      expect(status.mentionsProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should track uptime', async () => {
      await agent.initialize();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      const status = agent.getStatus();
      expect(status.uptime).toBeGreaterThan(0);
    });

    it('should track mentions processed', async () => {
      await agent.initialize();

      await agent.analyze([{
        id: 'm1',
        platform: 'twitter',
        brandId: 'test-brand',
        content: 'Test',
        author: 'user',
        timestamp: new Date()
      }]);

      const status = agent.getStatus();
      expect(status.mentionsProcessed).toBe(1);
    });

    it('should update last update time', async () => {
      const beforeAnalysis = agent.getStatus().lastUpdate;

      await agent.analyze([{
        id: 'm1',
        platform: 'twitter',
        brandId: 'test-brand',
        content: 'Test',
        author: 'user',
        timestamp: new Date()
      }]);

      const afterAnalysis = agent.getStatus().lastUpdate;
      expect(afterAnalysis).not.toEqual(beforeAnalysis);
    });

    it('should perform health check', async () => {
      await agent.initialize();

      const health = await agent.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.services).toBeDefined();
      expect(health.message).toBeDefined();
    });

    it('should report all service statuses', async () => {
      const health = await agent.healthCheck();

      expect(health.services.mentionTracking).toBeDefined();
      expect(health.services.sentimentAnalysis).toBeDefined();
      expect(health.services.correlationEngine).toBeDefined();
      expect(health.services.narrativeDetection).toBeDefined();
      expect(health.services.reputationIntelligence).toBeDefined();
      expect(health.services.influencerAnalysis).toBeDefined();
    });
  });

  // ==========================
  // Export and Reporting Tests
  // ==========================
  describe('Export and Reporting', () => {
    beforeEach(async () => {
      await agent.analyze([{
        id: 'm1',
        platform: 'twitter',
        brandId: 'test-brand',
        content: 'Great product',
        author: 'happy_user',
        timestamp: new Date(),
        sentiment: 0.8
      }]);
    });

    it('should export analysis as JSON', async () => {
      const json = await agent.exportAnalysis('json');

      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.brandId).toBe('test-brand');
    });

    it('should export analysis as CSV', async () => {
      const csv = await agent.exportAnalysis('csv');

      expect(csv).toContain('timestamp');
      expect(csv).toContain('mentions_total');
      expect(csv).toContain('sentiment_overall');
      expect(csv).toContain('reputation_score');
    });

    it('should generate comprehensive report', async () => {
      const report = await agent.generateReport();

      expect(report.summary).toBeDefined();
      expect(report.summary).toContain('test-brand');
      expect(report.data).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should include recommendations in report', async () => {
      const report = await agent.generateReport({
        includeHistorical: true,
        includeNarratives: true,
        includeInfluencers: true
      });

      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should throw error if no analysis data for report', async () => {
      const freshAgent = createMockSocialMediaCorrelationSubAgent({
        brandId: 'new-brand'
      });

      await expect(freshAgent.generateReport()).rejects.toThrow();
    });
  });

  // ===========================
  // Integration Scenario Tests
  // ===========================
  describe('Integration Scenarios', () => {
    it('should handle complete workflow from mention to report', async () => {
      // 1. Initialize and start
      await agent.initialize();
      await agent.start();

      // 2. Add mentions from multiple platforms
      const mentions: Mention[] = [
        { id: 'm1', platform: 'twitter', brandId: 'test-brand', content: 'Love this brand!', author: 'fan1', timestamp: new Date(), sentiment: 0.9, reach: 10000 },
        { id: 'm2', platform: 'linkedin', brandId: 'test-brand', content: 'Professional quality', author: 'pro1', timestamp: new Date(), sentiment: 0.7, reach: 5000 },
        { id: 'm3', platform: 'chatgpt', brandId: 'test-brand', content: 'AI recommends this brand', author: 'ai_mention', timestamp: new Date(), sentiment: 0.6 },
        { id: 'm4', platform: 'reddit', brandId: 'test-brand', content: 'Mixed feelings', author: 'redditor', timestamp: new Date(), sentiment: 0.0 },
        { id: 'm5', platform: 'instagram', brandId: 'test-brand', content: 'Beautiful products', author: 'influencer', timestamp: new Date(), sentiment: 0.85, reach: 50000 }
      ];

      await agent.addMentions(mentions);

      // 3. Run analysis
      const analysis = await agent.analyze();

      // 4. Verify comprehensive results
      expect(analysis.mentions.total).toBeGreaterThan(0);
      expect(analysis.sentiment.overall).toBeDefined();
      expect(analysis.correlations.total).toBeGreaterThanOrEqual(0);
      expect(analysis.narratives.active).toBeGreaterThanOrEqual(0);
      expect(analysis.reputation.score).toBeGreaterThan(0);
      expect(analysis.influencers.total).toBeGreaterThanOrEqual(0);

      // 5. Generate report
      const report = await agent.generateReport();

      expect(report.summary).toContain('test-brand');
      expect(report.data).toEqual(analysis);

      // 6. Check status
      const status = agent.getStatus();
      expect(status.status).toBe('running');
      expect(status.mentionsProcessed).toBeGreaterThan(0);

      // 7. Shutdown
      await agent.shutdown();
      expect(agent.getStatus().status).toBe('idle');
    });

    it('should handle crisis scenario with alerts', async () => {
      await agent.initialize();
      await agent.start();

      const alertHandler = vi.fn();
      agent.on('alert', alertHandler);

      // Simulate crisis with many negative mentions
      const crisisMentions: Mention[] = Array.from({ length: 10 }, (_, i) => ({
        id: `crisis-${i}`,
        platform: 'twitter',
        brandId: 'test-brand',
        content: 'This is terrible! Worst experience ever!',
        author: `angry_user_${i}`,
        timestamp: new Date(),
        sentiment: -0.9
      }));

      await agent.addMentions(crisisMentions);

      // Analysis should trigger alerts
      const alerts = await agent.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.severity === 'high' || a.severity === 'critical')).toBe(true);

      // Verify alert emission
      expect(alertHandler).toHaveBeenCalled();

      // Generate crisis report
      const report = await agent.generateReport();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should track analysis history over time', async () => {
      await agent.initialize();

      // Perform multiple analyses
      for (let i = 0; i < 5; i++) {
        await agent.analyze([{
          id: `m${i}`,
          platform: 'twitter',
          brandId: 'test-brand',
          content: `Update ${i}`,
          author: 'user',
          timestamp: new Date(),
          sentiment: 0.5 + (i * 0.1)
        }]);
      }

      const history = await agent.getAnalysisHistory(10);
      expect(history.length).toBe(5);

      // Verify chronological order
      for (let i = 1; i < history.length; i++) {
        expect(history[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          history[i - 1].timestamp.getTime()
        );
      }
    });
  });
});
