/**
 * TrendDetectionService Tests
 * TDD tests for detecting patterns, trends, and emerging narratives
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TrendDetectionService,
  createTrendDetectionService,
  type TrendDetectionConfig,
  type TrendInput,
  type DetectedTrend,
  type TrendPattern,
  type EmergingTopic,
  type TrendVelocity,
} from '../src/services/trend-detection-service';

describe('TrendDetectionService', () => {
  let service: TrendDetectionService;

  const defaultConfig: Partial<TrendDetectionConfig> = {
    analysisWindow: '7d',
    minTrendSignificance: 0.6,
    detectEmergingTopics: true,
    trackVelocity: true,
  };

  beforeEach(() => {
    service = createTrendDetectionService(defaultConfig);
  });

  describe('Initialization', () => {
    it('should create service with default config', () => {
      const defaultService = createTrendDetectionService();
      expect(defaultService).toBeDefined();
      expect(defaultService.getConfig()).toBeDefined();
    });

    it('should create service with custom config', () => {
      expect(service.getConfig().analysisWindow).toBe('7d');
      expect(service.getConfig().minTrendSignificance).toBe(0.6);
    });

    it('should emit initialized event', async () => {
      const handler = vi.fn();
      service.on('initialized', handler);
      await service.initialize();
      expect(handler).toHaveBeenCalled();
    });

    it('should accept different analysis windows', () => {
      const hourlyService = createTrendDetectionService({ analysisWindow: '24h' });
      expect(hourlyService.getConfig().analysisWindow).toBe('24h');

      const monthlyService = createTrendDetectionService({ analysisWindow: '30d' });
      expect(monthlyService.getConfig().analysisWindow).toBe('30d');
    });
  });

  describe('Trend Detection', () => {
    it('should detect volume spike trend', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 10, sentiment: 0.5, topics: ['feature'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 15, sentiment: 0.5, topics: ['feature'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 50, sentiment: 0.5, topics: ['feature'] },
        { timestamp: new Date('2024-01-04'), mentionCount: 80, sentiment: 0.5, topics: ['feature'] },
        { timestamp: new Date('2024-01-05'), mentionCount: 120, sentiment: 0.5, topics: ['feature'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.trends).toContainEqual(
        expect.objectContaining({ type: 'volume_spike' })
      );
    });

    it('should detect sentiment shift trend', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 50, sentiment: 0.7, topics: ['product'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 50, sentiment: 0.5, topics: ['product'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 50, sentiment: 0.2, topics: ['product'] },
        { timestamp: new Date('2024-01-04'), mentionCount: 50, sentiment: -0.1, topics: ['product'] },
        { timestamp: new Date('2024-01-05'), mentionCount: 50, sentiment: -0.4, topics: ['product'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.trends).toContainEqual(
        expect.objectContaining({ type: 'sentiment_shift', direction: 'declining' })
      );
    });

    it('should detect topic emergence trend', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 50, sentiment: 0.5, topics: ['feature-a'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 50, sentiment: 0.5, topics: ['feature-a', 'new-feature'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 60, sentiment: 0.5, topics: ['new-feature', 'feature-a'] },
        { timestamp: new Date('2024-01-04'), mentionCount: 70, sentiment: 0.6, topics: ['new-feature'] },
        { timestamp: new Date('2024-01-05'), mentionCount: 90, sentiment: 0.7, topics: ['new-feature'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.emergingTopics).toContainEqual(
        expect.objectContaining({ topic: 'new-feature' })
      );
    });

    it('should detect seasonal pattern', async () => {
      // Weekly pattern with Monday spikes
      const inputs: TrendInput[] = [];
      for (let week = 0; week < 4; week++) {
        for (let day = 0; day < 7; day++) {
          const date = new Date('2024-01-01');
          date.setDate(date.getDate() + week * 7 + day);
          inputs.push({
            timestamp: date,
            mentionCount: day === 1 ? 100 : 30, // Monday spike
            sentiment: 0.5,
            topics: ['general'],
          });
        }
      }

      const result = await service.detectTrends(inputs);
      expect(result.patterns).toContainEqual(
        expect.objectContaining({ type: 'seasonal', period: 'weekly' })
      );
    });

    it('should calculate trend significance', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 10, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 100, sentiment: 0.5, topics: ['test'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.trends[0]?.significance).toBeGreaterThan(0);
      expect(result.trends[0]?.significance).toBeLessThanOrEqual(1);
    });
  });

  describe('Trend Velocity', () => {
    it('should calculate trend velocity', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01T00:00:00'), mentionCount: 10, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T01:00:00'), mentionCount: 20, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T02:00:00'), mentionCount: 40, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T03:00:00'), mentionCount: 80, sentiment: 0.5, topics: ['test'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.velocity).toBeDefined();
      expect(result.velocity?.rate).toBeGreaterThan(0);
    });

    it('should classify velocity as accelerating', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01T00:00:00'), mentionCount: 10, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T01:00:00'), mentionCount: 15, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T02:00:00'), mentionCount: 25, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T03:00:00'), mentionCount: 50, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T04:00:00'), mentionCount: 100, sentiment: 0.5, topics: ['test'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.velocity?.acceleration).toBe('accelerating');
    });

    it('should classify velocity as decelerating', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01T00:00:00'), mentionCount: 100, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T01:00:00'), mentionCount: 80, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T02:00:00'), mentionCount: 70, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T03:00:00'), mentionCount: 65, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T04:00:00'), mentionCount: 62, sentiment: 0.5, topics: ['test'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.velocity?.acceleration).toBe('decelerating');
    });

    it('should provide time to peak estimate', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01T00:00:00'), mentionCount: 10, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T01:00:00'), mentionCount: 30, sentiment: 0.5, topics: ['test'] },
        { timestamp: new Date('2024-01-01T02:00:00'), mentionCount: 60, sentiment: 0.5, topics: ['test'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.velocity?.estimatedPeakTime).toBeDefined();
    });
  });

  describe('Emerging Topics', () => {
    it('should identify emerging topics', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 50, sentiment: 0.5, topics: ['existing'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 55, sentiment: 0.5, topics: ['existing', 'emerging'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 70, sentiment: 0.5, topics: ['emerging', 'existing'] },
        { timestamp: new Date('2024-01-04'), mentionCount: 100, sentiment: 0.5, topics: ['emerging'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.emergingTopics).toBeDefined();
      expect(result.emergingTopics?.length).toBeGreaterThan(0);
    });

    it('should calculate topic growth rate', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 10, sentiment: 0.5, topics: ['topic-a'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 20, sentiment: 0.5, topics: ['topic-a'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 40, sentiment: 0.5, topics: ['topic-a'] },
      ];

      const result = await service.detectTrends(inputs);
      const emergingTopic = result.emergingTopics?.find(t => t.topic === 'topic-a');
      expect(emergingTopic?.growthRate).toBeGreaterThan(0);
    });

    it('should identify declining topics', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 100, sentiment: 0.5, topics: ['declining-topic'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 70, sentiment: 0.5, topics: ['declining-topic'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 40, sentiment: 0.5, topics: ['declining-topic'] },
        { timestamp: new Date('2024-01-04'), mentionCount: 15, sentiment: 0.5, topics: ['declining-topic'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.decliningTopics).toContainEqual(
        expect.objectContaining({ topic: 'declining-topic' })
      );
    });

    it('should rank topics by emergence score', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 20, sentiment: 0.5, topics: ['slow-grower', 'fast-grower'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 50, sentiment: 0.5, topics: ['fast-grower'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 25, sentiment: 0.5, topics: ['slow-grower'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 100, sentiment: 0.5, topics: ['fast-grower'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 30, sentiment: 0.5, topics: ['slow-grower'] },
      ];

      const result = await service.detectTrends(inputs);
      const sortedTopics = result.emergingTopics?.sort((a, b) => b.emergenceScore - a.emergenceScore);
      if (sortedTopics && sortedTopics.length >= 2) {
        expect(sortedTopics[0].topic).toBe('fast-grower');
      }
    });
  });

  describe('Pattern Recognition', () => {
    it('should detect cyclical patterns', async () => {
      const inputs: TrendInput[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        inputs.push({
          timestamp: date,
          mentionCount: 50 + 30 * Math.sin(i * Math.PI / 7), // 2-week cycle
          sentiment: 0.5,
          topics: ['general'],
        });
      }

      const result = await service.detectTrends(inputs);
      expect(result.patterns).toContainEqual(
        expect.objectContaining({ type: 'cyclical' })
      );
    });

    it('should detect burst patterns', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), mentionCount: 20, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-01T10:05:00'), mentionCount: 200, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-01T10:10:00'), mentionCount: 500, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-01T10:15:00'), mentionCount: 300, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-01T10:20:00'), mentionCount: 50, sentiment: 0.5, topics: ['topic'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.patterns).toContainEqual(
        expect.objectContaining({ type: 'burst' })
      );
    });

    it('should detect gradual growth pattern', async () => {
      const inputs: TrendInput[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        inputs.push({
          timestamp: date,
          mentionCount: 10 + i * 2, // Linear growth
          sentiment: 0.5,
          topics: ['general'],
        });
      }

      const result = await service.detectTrends(inputs);
      expect(result.patterns).toContainEqual(
        expect.objectContaining({ type: 'gradual_growth' })
      );
    });

    it('should detect plateau pattern', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 10, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 30, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 50, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-04'), mentionCount: 52, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-05'), mentionCount: 51, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-06'), mentionCount: 50, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-07'), mentionCount: 49, sentiment: 0.5, topics: ['topic'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.patterns).toContainEqual(
        expect.objectContaining({ type: 'plateau' })
      );
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect anomalous data points', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 50, sentiment: 0.5, topics: ['normal'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 52, sentiment: 0.5, topics: ['normal'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 500, sentiment: 0.5, topics: ['normal'] }, // Anomaly
        { timestamp: new Date('2024-01-04'), mentionCount: 48, sentiment: 0.5, topics: ['normal'] },
        { timestamp: new Date('2024-01-05'), mentionCount: 51, sentiment: 0.5, topics: ['normal'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.anomalies).toContainEqual(
        expect.objectContaining({
          timestamp: expect.any(Date),
          type: 'volume_spike',
        })
      );
    });

    it('should detect sentiment anomalies', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 50, sentiment: 0.7, topics: ['topic'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 50, sentiment: 0.65, topics: ['topic'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 50, sentiment: -0.8, topics: ['topic'] }, // Anomaly
        { timestamp: new Date('2024-01-04'), mentionCount: 50, sentiment: 0.68, topics: ['topic'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.anomalies).toContainEqual(
        expect.objectContaining({ type: 'sentiment_anomaly' })
      );
    });

    it('should calculate anomaly severity', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 50, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 1000, sentiment: 0.5, topics: ['topic'] }, // Severe anomaly
      ];

      const result = await service.detectTrends(inputs);
      expect(result.anomalies?.[0]?.severity).toBe('high');
    });
  });

  describe('Trend Forecasting', () => {
    it('should forecast trend continuation', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 10, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 20, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 30, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-04'), mentionCount: 40, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-05'), mentionCount: 50, sentiment: 0.5, topics: ['topic'] },
      ];

      const forecast = await service.forecastTrend(inputs, { horizon: '7d' });
      expect(forecast.predictedValues).toHaveLength(7);
      expect(forecast.predictedValues[0]).toBeGreaterThan(50);
    });

    it('should provide forecast confidence intervals', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 50, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 55, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 60, sentiment: 0.5, topics: ['topic'] },
      ];

      const forecast = await service.forecastTrend(inputs, { horizon: '3d' });
      expect(forecast.confidenceIntervals).toBeDefined();
      expect(forecast.confidenceIntervals?.upper).toHaveLength(3);
      expect(forecast.confidenceIntervals?.lower).toHaveLength(3);
    });

    it('should forecast sentiment trends', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 50, sentiment: 0.3, topics: ['topic'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 50, sentiment: 0.4, topics: ['topic'] },
        { timestamp: new Date('2024-01-03'), mentionCount: 50, sentiment: 0.5, topics: ['topic'] },
      ];

      const forecast = await service.forecastTrend(inputs, { horizon: '3d', includeSentiment: true });
      expect(forecast.predictedSentiment).toBeDefined();
      expect(forecast.predictedSentiment?.[0]).toBeGreaterThan(0.5);
    });
  });

  describe('Cross-Platform Analysis', () => {
    it('should compare trends across platforms', async () => {
      const twitterInputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 100, sentiment: 0.6, topics: ['topic'], platform: 'twitter' },
        { timestamp: new Date('2024-01-02'), mentionCount: 150, sentiment: 0.7, topics: ['topic'], platform: 'twitter' },
      ];

      const linkedinInputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 30, sentiment: 0.8, topics: ['topic'], platform: 'linkedin' },
        { timestamp: new Date('2024-01-02'), mentionCount: 35, sentiment: 0.85, topics: ['topic'], platform: 'linkedin' },
      ];

      const comparison = await service.comparePlatformTrends(twitterInputs, linkedinInputs);
      expect(comparison.volumeComparison).toBeDefined();
      expect(comparison.sentimentComparison).toBeDefined();
    });

    it('should identify platform-specific trends', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 100, sentiment: 0.6, topics: ['twitter-trend'], platform: 'twitter' },
        { timestamp: new Date('2024-01-02'), mentionCount: 200, sentiment: 0.6, topics: ['twitter-trend'], platform: 'twitter' },
        { timestamp: new Date('2024-01-01'), mentionCount: 30, sentiment: 0.5, topics: ['general'], platform: 'linkedin' },
        { timestamp: new Date('2024-01-02'), mentionCount: 32, sentiment: 0.5, topics: ['general'], platform: 'linkedin' },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.platformSpecificTrends?.twitter).toBeDefined();
      expect(result.platformSpecificTrends?.twitter?.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Updates', () => {
    it('should update trends with new data point', async () => {
      const initialInputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 50, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 55, sentiment: 0.5, topics: ['topic'] },
      ];

      await service.detectTrends(initialInputs);

      const newInput: TrendInput = {
        timestamp: new Date('2024-01-03'),
        mentionCount: 100,
        sentiment: 0.5,
        topics: ['topic'],
      };

      const updated = await service.updateWithNewData(newInput);
      expect(updated.trendsUpdated).toBe(true);
    });

    it('should emit trendDetected event on significant change', async () => {
      const handler = vi.fn();
      service.on('trendDetected', handler);

      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 10, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 100, sentiment: 0.5, topics: ['topic'] },
      ];

      await service.detectTrends(inputs);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Configuration Updates', () => {
    it('should update analysis window', () => {
      service.updateConfig({ analysisWindow: '30d' });
      expect(service.getConfig().analysisWindow).toBe('30d');
    });

    it('should update significance threshold', () => {
      service.updateConfig({ minTrendSignificance: 0.8 });
      expect(service.getConfig().minTrendSignificance).toBe(0.8);
    });

    it('should emit configUpdated event', () => {
      const handler = vi.fn();
      service.on('configUpdated', handler);
      service.updateConfig({ detectEmergingTopics: false });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty input', async () => {
      const result = await service.detectTrends([]);
      expect(result.trends).toHaveLength(0);
      expect(result.error).toBeUndefined();
    });

    it('should handle single data point', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 50, sentiment: 0.5, topics: ['topic'] },
      ];

      const result = await service.detectTrends(inputs);
      expect(result.insufficientData).toBe(true);
    });

    it('should emit error event on failure', async () => {
      const handler = vi.fn();
      service.on('error', handler);

      const invalidInputs = null as unknown as TrendInput[];
      await service.detectTrends(invalidInputs);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should track detection statistics', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 10, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 50, sentiment: 0.5, topics: ['topic'] },
      ];

      await service.detectTrends(inputs);
      const stats = service.getStats();
      expect(stats.totalDetections).toBe(1);
    });

    it('should track trends by type', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 10, sentiment: 0.7, topics: ['topic'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 100, sentiment: -0.5, topics: ['topic'] },
      ];

      await service.detectTrends(inputs);
      const stats = service.getStats();
      expect(stats.trendsByType).toBeDefined();
    });

    it('should reset statistics', async () => {
      const inputs: TrendInput[] = [
        { timestamp: new Date('2024-01-01'), mentionCount: 10, sentiment: 0.5, topics: ['topic'] },
        { timestamp: new Date('2024-01-02'), mentionCount: 100, sentiment: 0.5, topics: ['topic'] },
      ];

      await service.detectTrends(inputs);
      service.resetStats();
      expect(service.getStats().totalDetections).toBe(0);
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
