/**
 * PerformanceModelService Tests
 * TDD tests for AI platform performance modeling and optimization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PerformanceModelService,
  createPerformanceModelService,
  type PerformanceModelConfig,
  type PerformanceData,
  type PerformanceMetrics,
  type OptimizationRecommendation,
  type PlatformPerformance,
  type BenchmarkComparison,
} from '../src/services/performance-model-service';

describe('PerformanceModelService', () => {
  let service: PerformanceModelService;

  const defaultConfig: Partial<PerformanceModelConfig> = {
    brandName: 'Apex',
    platforms: ['chatgpt', 'claude', 'gemini', 'perplexity'],
    benchmarkAgainstIndustry: true,
    trackCompetitors: ['Semrush', 'Ahrefs'],
  };

  beforeEach(() => {
    service = createPerformanceModelService(defaultConfig);
  });

  describe('Initialization', () => {
    it('should create service with default config', () => {
      const defaultService = createPerformanceModelService();
      expect(defaultService).toBeDefined();
      expect(defaultService.getConfig()).toBeDefined();
    });

    it('should create service with custom config', () => {
      expect(service.getConfig().brandName).toBe('Apex');
      expect(service.getConfig().platforms).toHaveLength(4);
    });

    it('should emit initialized event', async () => {
      const handler = vi.fn();
      service.on('initialized', handler);
      await service.initialize();
      expect(handler).toHaveBeenCalled();
    });

    it('should validate platforms are provided', () => {
      expect(() => createPerformanceModelService({ platforms: [] })).toThrow();
    });
  });

  describe('Visibility Score Calculation', () => {
    it('should calculate overall visibility score', async () => {
      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 150,
        impressions: 50000,
        sentimentAverage: 0.6,
        responseQuality: 0.8,
      };

      const metrics = await service.calculateMetrics(data);
      expect(metrics.visibilityScore).toBeDefined();
      expect(metrics.visibilityScore).toBeGreaterThan(0);
      expect(metrics.visibilityScore).toBeLessThanOrEqual(100);
    });

    it('should weight metrics appropriately', async () => {
      const highMentionsData: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 500,
        impressions: 10000,
        sentimentAverage: 0.5,
        responseQuality: 0.5,
      };

      const highSentimentData: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 100,
        impressions: 10000,
        sentimentAverage: 0.9,
        responseQuality: 0.5,
      };

      const mentionsMetrics = await service.calculateMetrics(highMentionsData);
      const sentimentMetrics = await service.calculateMetrics(highSentimentData);

      // Both should contribute to visibility but in different ways
      expect(mentionsMetrics.visibilityScore).toBeGreaterThan(0);
      expect(sentimentMetrics.visibilityScore).toBeGreaterThan(0);
    });

    it('should calculate platform-specific scores', async () => {
      const platforms = ['chatgpt', 'claude', 'gemini'] as const;
      const dataPoints: PerformanceData[] = platforms.map(platform => ({
        platform,
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 100,
        impressions: 30000,
        sentimentAverage: 0.6,
        responseQuality: 0.7,
      }));

      const metrics = await service.calculateMultiPlatformMetrics(dataPoints);
      expect(metrics.platformScores.chatgpt).toBeDefined();
      expect(metrics.platformScores.claude).toBeDefined();
      expect(metrics.platformScores.gemini).toBeDefined();
    });
  });

  describe('Response Quality Analysis', () => {
    it('should measure response accuracy', async () => {
      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 100,
        impressions: 30000,
        sentimentAverage: 0.6,
        responseQuality: 0.85,
        responses: [
          { query: 'What is Apex?', response: 'Apex is a GEO platform...', accuracy: 0.9 },
          { query: 'Is Apex good?', response: 'Apex has positive reviews...', accuracy: 0.8 },
        ],
      };

      const metrics = await service.calculateMetrics(data);
      expect(metrics.responseAccuracy).toBeCloseTo(0.85, 1);
    });

    it('should identify response quality issues', async () => {
      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 100,
        impressions: 30000,
        sentimentAverage: 0.6,
        responseQuality: 0.4,
        responses: [
          { query: 'What is Apex?', response: 'I don\'t have information...', accuracy: 0.2, issue: 'hallucination' },
          { query: 'Apex pricing', response: 'Apex costs $100...', accuracy: 0.3, issue: 'outdated' },
        ],
      };

      const metrics = await service.calculateMetrics(data);
      expect(metrics.qualityIssues).toContain('hallucination');
      expect(metrics.qualityIssues).toContain('outdated');
    });

    it('should calculate citation rate', async () => {
      const data: PerformanceData = {
        platform: 'perplexity',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 100,
        impressions: 30000,
        sentimentAverage: 0.6,
        responseQuality: 0.8,
        citationData: {
          totalResponses: 100,
          responseWithCitation: 75,
        },
      };

      const metrics = await service.calculateMetrics(data);
      expect(metrics.citationRate).toBe(0.75);
    });
  });

  describe('Competitor Benchmarking', () => {
    it('should compare against competitors', async () => {
      const brandData: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 150,
        impressions: 50000,
        sentimentAverage: 0.7,
        responseQuality: 0.8,
      };

      const competitorData: PerformanceData[] = [
        {
          platform: 'chatgpt',
          period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
          mentions: 200,
          impressions: 70000,
          sentimentAverage: 0.6,
          responseQuality: 0.7,
          competitorName: 'Semrush',
        },
      ];

      const comparison = await service.compareWithCompetitors(brandData, competitorData);
      expect(comparison.rankings).toBeDefined();
      expect(comparison.gaps).toBeDefined();
    });

    it('should calculate market share', async () => {
      const allData: PerformanceData[] = [
        { platform: 'chatgpt', period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') }, mentions: 100, impressions: 40000, sentimentAverage: 0.6, responseQuality: 0.8, brandName: 'Apex' },
        { platform: 'chatgpt', period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') }, mentions: 150, impressions: 60000, sentimentAverage: 0.5, responseQuality: 0.7, competitorName: 'Semrush' },
        { platform: 'chatgpt', period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') }, mentions: 50, impressions: 20000, sentimentAverage: 0.7, responseQuality: 0.75, competitorName: 'Ahrefs' },
      ];

      const marketShare = await service.calculateMarketShare(allData);
      expect(marketShare.apex).toBeCloseTo(0.33, 1);
    });

    it('should identify competitive gaps', async () => {
      const brandData: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 100,
        impressions: 30000,
        sentimentAverage: 0.6,
        responseQuality: 0.7,
      };

      const competitorData: PerformanceData[] = [
        {
          platform: 'chatgpt',
          period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
          mentions: 300,
          impressions: 100000,
          sentimentAverage: 0.8,
          responseQuality: 0.9,
          competitorName: 'Semrush',
        },
      ];

      const comparison = await service.compareWithCompetitors(brandData, competitorData);
      expect(comparison.gaps.mentions).toBeDefined();
      expect(comparison.gaps.mentions.behindBy).toBe(200);
    });
  });

  describe('Trend Analysis', () => {
    it('should calculate period-over-period change', async () => {
      const currentPeriod: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-02-01'), end: new Date('2024-02-29') },
        mentions: 200,
        impressions: 60000,
        sentimentAverage: 0.7,
        responseQuality: 0.85,
      };

      const previousPeriod: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 150,
        impressions: 50000,
        sentimentAverage: 0.6,
        responseQuality: 0.8,
      };

      const trend = await service.analyzeTrend(currentPeriod, previousPeriod);
      expect(trend.mentionsChange).toBeCloseTo(0.33, 1);
      expect(trend.direction).toBe('improving');
    });

    it('should detect declining performance', async () => {
      const currentPeriod: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-02-01'), end: new Date('2024-02-29') },
        mentions: 100,
        impressions: 30000,
        sentimentAverage: 0.4,
        responseQuality: 0.6,
      };

      const previousPeriod: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 200,
        impressions: 60000,
        sentimentAverage: 0.7,
        responseQuality: 0.85,
      };

      const trend = await service.analyzeTrend(currentPeriod, previousPeriod);
      expect(trend.direction).toBe('declining');
    });

    it('should calculate growth velocity', async () => {
      const dataPoints: PerformanceData[] = [
        { platform: 'chatgpt', period: { start: new Date('2024-01-01'), end: new Date('2024-01-07') }, mentions: 50, impressions: 15000, sentimentAverage: 0.5, responseQuality: 0.7 },
        { platform: 'chatgpt', period: { start: new Date('2024-01-08'), end: new Date('2024-01-14') }, mentions: 75, impressions: 22000, sentimentAverage: 0.55, responseQuality: 0.72 },
        { platform: 'chatgpt', period: { start: new Date('2024-01-15'), end: new Date('2024-01-21') }, mentions: 110, impressions: 33000, sentimentAverage: 0.6, responseQuality: 0.75 },
        { platform: 'chatgpt', period: { start: new Date('2024-01-22'), end: new Date('2024-01-28') }, mentions: 160, impressions: 48000, sentimentAverage: 0.65, responseQuality: 0.78 },
      ];

      const velocity = await service.calculateGrowthVelocity(dataPoints);
      expect(velocity.rate).toBeGreaterThan(0);
      expect(velocity.acceleration).toBe('accelerating');
    });
  });

  describe('Optimization Recommendations', () => {
    it('should generate optimization recommendations', async () => {
      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 50,
        impressions: 15000,
        sentimentAverage: 0.4,
        responseQuality: 0.5,
      };

      const recommendations = await service.generateRecommendations(data);
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should prioritize recommendations by impact', async () => {
      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 20,
        impressions: 5000,
        sentimentAverage: 0.3,
        responseQuality: 0.4,
      };

      const recommendations = await service.generateRecommendations(data);
      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[0].estimatedImpact).toBeGreaterThan(0);
    });

    it('should include actionable steps', async () => {
      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 30,
        impressions: 10000,
        sentimentAverage: 0.5,
        responseQuality: 0.6,
      };

      const recommendations = await service.generateRecommendations(data);
      expect(recommendations[0].actions).toBeDefined();
      expect(recommendations[0].actions.length).toBeGreaterThan(0);
    });

    it('should estimate recommendation ROI', async () => {
      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 100,
        impressions: 30000,
        sentimentAverage: 0.5,
        responseQuality: 0.6,
      };

      const recommendations = await service.generateRecommendations(data);
      expect(recommendations[0].estimatedROI).toBeDefined();
    });
  });

  describe('Platform Comparison', () => {
    it('should compare performance across platforms', async () => {
      const dataPoints: PerformanceData[] = [
        { platform: 'chatgpt', period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') }, mentions: 200, impressions: 60000, sentimentAverage: 0.7, responseQuality: 0.85 },
        { platform: 'claude', period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') }, mentions: 150, impressions: 45000, sentimentAverage: 0.8, responseQuality: 0.9 },
        { platform: 'gemini', period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') }, mentions: 100, impressions: 30000, sentimentAverage: 0.6, responseQuality: 0.75 },
      ];

      const comparison = await service.comparePlatforms(dataPoints);
      expect(comparison.rankings).toBeDefined();
      expect(comparison.bestPerforming).toBe('chatgpt');
    });

    it('should identify platform-specific opportunities', async () => {
      const dataPoints: PerformanceData[] = [
        { platform: 'chatgpt', period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') }, mentions: 200, impressions: 60000, sentimentAverage: 0.7, responseQuality: 0.85 },
        { platform: 'perplexity', period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') }, mentions: 20, impressions: 5000, sentimentAverage: 0.8, responseQuality: 0.9 },
      ];

      const opportunities = await service.identifyOpportunities(dataPoints);
      expect(opportunities).toContainEqual(
        expect.objectContaining({ platform: 'perplexity', type: 'underutilized' })
      );
    });
  });

  describe('Score Breakdown', () => {
    it('should provide detailed score breakdown', async () => {
      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 150,
        impressions: 50000,
        sentimentAverage: 0.7,
        responseQuality: 0.85,
      };

      const breakdown = await service.getScoreBreakdown(data);
      expect(breakdown.components).toBeDefined();
      expect(breakdown.components.visibility).toBeDefined();
      expect(breakdown.components.sentiment).toBeDefined();
      expect(breakdown.components.quality).toBeDefined();
    });

    it('should show contribution of each factor', async () => {
      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 150,
        impressions: 50000,
        sentimentAverage: 0.7,
        responseQuality: 0.85,
      };

      const breakdown = await service.getScoreBreakdown(data);
      const totalContribution = Object.values(breakdown.contributions).reduce((a, b) => a + b, 0);
      expect(totalContribution).toBeCloseTo(1, 1);
    });
  });

  describe('Forecasting', () => {
    it('should forecast future performance', async () => {
      const historicalData: PerformanceData[] = [
        { platform: 'chatgpt', period: { start: new Date('2024-01-01'), end: new Date('2024-01-07') }, mentions: 100, impressions: 30000, sentimentAverage: 0.6, responseQuality: 0.75 },
        { platform: 'chatgpt', period: { start: new Date('2024-01-08'), end: new Date('2024-01-14') }, mentions: 120, impressions: 35000, sentimentAverage: 0.65, responseQuality: 0.78 },
        { platform: 'chatgpt', period: { start: new Date('2024-01-15'), end: new Date('2024-01-21') }, mentions: 140, impressions: 40000, sentimentAverage: 0.7, responseQuality: 0.8 },
        { platform: 'chatgpt', period: { start: new Date('2024-01-22'), end: new Date('2024-01-28') }, mentions: 160, impressions: 45000, sentimentAverage: 0.72, responseQuality: 0.82 },
      ];

      const forecast = await service.forecastPerformance(historicalData, { weeks: 4 });
      expect(forecast.predictions).toHaveLength(4);
      expect(forecast.predictions[0].mentions).toBeGreaterThan(160);
    });

    it('should provide forecast confidence intervals', async () => {
      const historicalData: PerformanceData[] = [
        { platform: 'chatgpt', period: { start: new Date('2024-01-01'), end: new Date('2024-01-07') }, mentions: 100, impressions: 30000, sentimentAverage: 0.6, responseQuality: 0.75 },
        { platform: 'chatgpt', period: { start: new Date('2024-01-08'), end: new Date('2024-01-14') }, mentions: 120, impressions: 35000, sentimentAverage: 0.65, responseQuality: 0.78 },
      ];

      const forecast = await service.forecastPerformance(historicalData, { weeks: 2 });
      expect(forecast.confidenceIntervals).toBeDefined();
      expect(forecast.confidenceIntervals.upper).toHaveLength(2);
      expect(forecast.confidenceIntervals.lower).toHaveLength(2);
    });
  });

  describe('Alerts', () => {
    it('should alert on performance degradation', async () => {
      const alertHandler = vi.fn();
      service.on('performanceAlert', alertHandler);

      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 20,
        impressions: 5000,
        sentimentAverage: 0.2,
        responseQuality: 0.3,
      };

      await service.calculateMetrics(data);
      expect(alertHandler).toHaveBeenCalled();
    });

    it('should alert on significant competitor gains', async () => {
      const alertHandler = vi.fn();
      service.on('competitorAlert', alertHandler);

      const brandData: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 100,
        impressions: 30000,
        sentimentAverage: 0.6,
        responseQuality: 0.7,
      };

      const competitorData: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 500,
        impressions: 150000,
        sentimentAverage: 0.85,
        responseQuality: 0.95,
        competitorName: 'Semrush',
      };

      await service.compareWithCompetitors(brandData, [competitorData]);
      expect(alertHandler).toHaveBeenCalled();
    });
  });

  describe('Configuration Updates', () => {
    it('should update platforms list', () => {
      service.updateConfig({ platforms: ['chatgpt', 'claude'] });
      expect(service.getConfig().platforms).toHaveLength(2);
    });

    it('should update competitors list', () => {
      service.updateConfig({ trackCompetitors: ['Moz', 'Conductor'] });
      expect(service.getConfig().trackCompetitors).toContain('Moz');
    });

    it('should emit configUpdated event', () => {
      const handler = vi.fn();
      service.on('configUpdated', handler);
      service.updateConfig({ benchmarkAgainstIndustry: false });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty data', async () => {
      const emptyData: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 0,
        impressions: 0,
        sentimentAverage: 0,
        responseQuality: 0,
      };

      const metrics = await service.calculateMetrics(emptyData);
      expect(metrics.visibilityScore).toBe(0);
    });

    it('should handle invalid platform', async () => {
      const invalidData: PerformanceData = {
        platform: 'invalid_platform' as 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 100,
        impressions: 30000,
        sentimentAverage: 0.6,
        responseQuality: 0.7,
      };

      const metrics = await service.calculateMetrics(invalidData);
      expect(metrics.warning).toContain('unknown_platform');
    });

    it('should emit error event on failure', async () => {
      const errorHandler = vi.fn();
      service.on('error', errorHandler);

      await service.calculateMetrics(null as unknown as PerformanceData);
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should track calculation statistics', async () => {
      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 100,
        impressions: 30000,
        sentimentAverage: 0.6,
        responseQuality: 0.7,
      };

      await service.calculateMetrics(data);
      await service.calculateMetrics(data);

      const stats = service.getStats();
      expect(stats.totalCalculations).toBe(2);
    });

    it('should track average calculation time', async () => {
      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 100,
        impressions: 30000,
        sentimentAverage: 0.6,
        responseQuality: 0.7,
      };

      await service.calculateMetrics(data);
      const stats = service.getStats();
      expect(stats.averageCalculationTimeMs).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      const data: PerformanceData = {
        platform: 'chatgpt',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        mentions: 100,
        impressions: 30000,
        sentimentAverage: 0.6,
        responseQuality: 0.7,
      };

      await service.calculateMetrics(data);
      service.resetStats();
      expect(service.getStats().totalCalculations).toBe(0);
    });
  });

  describe('Lifecycle', () => {
    it('should shutdown gracefully', async () => {
      const handler = vi.fn();
      service.on('shutdown', handler);
      await service.shutdown();
      expect(handler).toHaveBeenCalled();
    });
  });
});
