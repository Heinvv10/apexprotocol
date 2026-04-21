import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DataAggregationService,
  createDataAggregationService,
  type DataAggregationConfig,
  type DataSource,
  type DataPoint,
  type AggregationRequest,
  type AggregationResult,
  type MetricSummary,
  type TrendDirection
} from '../src/services/data-aggregation-service';

describe('DataAggregationService', () => {
  let service: DataAggregationService;

  beforeEach(() => {
    service = createDataAggregationService();
  });

  afterEach(() => {
    service.removeAllListeners();
  });

  describe('Initialization', () => {
    it('should create a service with default configuration', () => {
      const config = service.getConfig();

      expect(config.enabledSources).toContain('brand_monitoring');
      expect(config.enabledSources).toContain('site_performance');
      expect(config.enabledSources).toContain('content_generation');
      expect(config.defaultDateRangeDays).toBe(30);
      expect(config.maxDataPointsPerSource).toBe(1000);
      expect(config.aggregationIntervalMinutes).toBe(60);
    });

    it('should create a service with custom configuration', () => {
      const customService = createDataAggregationService({
        enabledSources: ['brand_monitoring', 'social_media'],
        defaultDateRangeDays: 60,
        maxDataPointsPerSource: 500
      });
      const config = customService.getConfig();

      expect(config.enabledSources).toEqual(['brand_monitoring', 'social_media']);
      expect(config.defaultDateRangeDays).toBe(60);
      expect(config.maxDataPointsPerSource).toBe(500);
    });

    it('should validate configuration with zod schema', () => {
      expect(() => createDataAggregationService({
        defaultDateRangeDays: 0 // Invalid: must be >= 1
      })).toThrow();

      expect(() => createDataAggregationService({
        maxDataPointsPerSource: -1 // Invalid: must be >= 1
      })).toThrow();
    });

    it('should use factory function to create service', () => {
      const factoryService = createDataAggregationService();
      expect(factoryService).toBeInstanceOf(DataAggregationService);
    });
  });

  describe('Data Source Registration', () => {
    it('should register a data source', () => {
      const source: DataSource = {
        id: 'test-source',
        type: 'brand_monitoring',
        name: 'Test Brand Monitor',
        fetchData: async () => []
      };

      service.registerSource(source);

      expect(service.hasSource('test-source')).toBe(true);
    });

    it('should list registered data sources', () => {
      service.registerSource({
        id: 'source-1',
        type: 'brand_monitoring',
        name: 'Source 1',
        fetchData: async () => []
      });
      service.registerSource({
        id: 'source-2',
        type: 'site_performance',
        name: 'Source 2',
        fetchData: async () => []
      });

      const sources = service.listSources();

      expect(sources).toHaveLength(2);
      expect(sources.map(s => s.id)).toContain('source-1');
      expect(sources.map(s => s.id)).toContain('source-2');
    });

    it('should unregister a data source', () => {
      service.registerSource({
        id: 'test-source',
        type: 'brand_monitoring',
        name: 'Test Source',
        fetchData: async () => []
      });

      expect(service.hasSource('test-source')).toBe(true);

      service.unregisterSource('test-source');

      expect(service.hasSource('test-source')).toBe(false);
    });

    it('should emit source:registered event', () => {
      const spy = vi.fn();
      service.on('source:registered', spy);

      service.registerSource({
        id: 'test-source',
        type: 'brand_monitoring',
        name: 'Test Source',
        fetchData: async () => []
      });

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0].id).toBe('test-source');
    });
  });

  describe('Data Aggregation', () => {
    beforeEach(() => {
      // Register mock data sources
      service.registerSource({
        id: 'brand-monitor',
        type: 'brand_monitoring',
        name: 'Brand Monitor',
        fetchData: async (brandId, dateRange) => [
          { id: 'dp-1', metric: 'mention_count', value: 100, timestamp: new Date(), source: 'brand_monitoring' },
          { id: 'dp-2', metric: 'mention_count', value: 120, timestamp: new Date(), source: 'brand_monitoring' },
          { id: 'dp-3', metric: 'sentiment_score', value: 0.75, timestamp: new Date(), source: 'brand_monitoring' }
        ]
      });

      service.registerSource({
        id: 'site-perf',
        type: 'site_performance',
        name: 'Site Performance',
        fetchData: async (brandId, dateRange) => [
          { id: 'dp-4', metric: 'page_load_time', value: 2.5, timestamp: new Date(), source: 'site_performance' },
          { id: 'dp-5', metric: 'page_load_time', value: 2.3, timestamp: new Date(), source: 'site_performance' }
        ]
      });
    });

    it('should aggregate data from all sources', async () => {
      const request: AggregationRequest = {
        brandId: 'brand-123'
      };

      const result = await service.aggregate(request);

      expect(result.success).toBe(true);
      expect(result.brandId).toBe('brand-123');
      expect(result.dataPoints.length).toBeGreaterThan(0);
    });

    it('should aggregate data from specific sources', async () => {
      const request: AggregationRequest = {
        brandId: 'brand-123',
        sourceTypes: ['brand_monitoring']
      };

      const result = await service.aggregate(request);

      expect(result.success).toBe(true);
      result.dataPoints.forEach(dp => {
        expect(dp.source).toBe('brand_monitoring');
      });
    });

    it('should aggregate data within date range', async () => {
      const request: AggregationRequest = {
        brandId: 'brand-123',
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31')
        }
      };

      const result = await service.aggregate(request);

      expect(result.success).toBe(true);
      expect(result.dateRange.from).toEqual(new Date('2024-01-01'));
      expect(result.dateRange.to).toEqual(new Date('2024-01-31'));
    });

    it('should use default date range if not specified', async () => {
      const request: AggregationRequest = {
        brandId: 'brand-123'
      };

      const result = await service.aggregate(request);

      expect(result.success).toBe(true);
      expect(result.dateRange.from).toBeInstanceOf(Date);
      expect(result.dateRange.to).toBeInstanceOf(Date);
    });

    it('should fail when brand ID is missing', async () => {
      const request: AggregationRequest = {
        brandId: ''
      };

      const result = await service.aggregate(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Brand ID is required');
    });

    it('should calculate metric summaries', async () => {
      const request: AggregationRequest = {
        brandId: 'brand-123'
      };

      const result = await service.aggregate(request);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalDataPoints).toBeGreaterThan(0);
      expect(Object.keys(result.summary.metrics).length).toBeGreaterThan(0);
    });

    it('should calculate min, max, avg for each metric', async () => {
      const request: AggregationRequest = {
        brandId: 'brand-123'
      };

      const result = await service.aggregate(request);

      Object.values(result.summary.metrics).forEach((metric: MetricSummary) => {
        expect(metric.min).toBeDefined();
        expect(metric.max).toBeDefined();
        expect(metric.avg).toBeDefined();
        expect(metric.min).toBeLessThanOrEqual(metric.max);
        expect(metric.avg).toBeGreaterThanOrEqual(metric.min);
        expect(metric.avg).toBeLessThanOrEqual(metric.max);
      });
    });

    it('should detect trend direction for each metric', async () => {
      const request: AggregationRequest = {
        brandId: 'brand-123'
      };

      const result = await service.aggregate(request);

      Object.values(result.summary.metrics).forEach((metric: MetricSummary) => {
        expect(['up', 'down', 'stable']).toContain(metric.trend);
      });
    });

    it('should emit aggregation:start event', async () => {
      const spy = vi.fn();
      service.on('aggregation:start', spy);

      await service.aggregate({ brandId: 'brand-123' });

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0].brandId).toBe('brand-123');
    });

    it('should emit aggregation:complete event', async () => {
      const spy = vi.fn();
      service.on('aggregation:complete', spy);

      await service.aggregate({ brandId: 'brand-123' });

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0].success).toBe(true);
    });

    it('should emit source:fetched event for each source', async () => {
      const spy = vi.fn();
      service.on('source:fetched', spy);

      await service.aggregate({ brandId: 'brand-123' });

      expect(spy).toHaveBeenCalledTimes(2); // Two sources registered
    });
  });

  describe('Data Point Management', () => {
    it('should add data points manually', () => {
      const dataPoint: DataPoint = {
        id: 'manual-dp-1',
        metric: 'custom_metric',
        value: 42,
        timestamp: new Date(),
        source: 'brand_monitoring'
      };

      service.addDataPoint('brand-123', dataPoint);

      const stored = service.getDataPoints('brand-123');
      expect(stored).toContainEqual(expect.objectContaining({ id: 'manual-dp-1' }));
    });

    it('should get data points for a brand', () => {
      service.addDataPoint('brand-1', {
        id: 'dp-1',
        metric: 'metric_a',
        value: 10,
        timestamp: new Date(),
        source: 'brand_monitoring'
      });
      service.addDataPoint('brand-2', {
        id: 'dp-2',
        metric: 'metric_b',
        value: 20,
        timestamp: new Date(),
        source: 'site_performance'
      });

      const brand1Points = service.getDataPoints('brand-1');
      const brand2Points = service.getDataPoints('brand-2');

      expect(brand1Points).toHaveLength(1);
      expect(brand2Points).toHaveLength(1);
      expect(brand1Points[0].id).toBe('dp-1');
      expect(brand2Points[0].id).toBe('dp-2');
    });

    it('should get data points filtered by metric', () => {
      service.addDataPoint('brand-123', {
        id: 'dp-1',
        metric: 'metric_a',
        value: 10,
        timestamp: new Date(),
        source: 'brand_monitoring'
      });
      service.addDataPoint('brand-123', {
        id: 'dp-2',
        metric: 'metric_b',
        value: 20,
        timestamp: new Date(),
        source: 'brand_monitoring'
      });

      const filtered = service.getDataPoints('brand-123', { metric: 'metric_a' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].metric).toBe('metric_a');
    });

    it('should get data points filtered by source', () => {
      service.addDataPoint('brand-123', {
        id: 'dp-1',
        metric: 'metric_a',
        value: 10,
        timestamp: new Date(),
        source: 'brand_monitoring'
      });
      service.addDataPoint('brand-123', {
        id: 'dp-2',
        metric: 'metric_b',
        value: 20,
        timestamp: new Date(),
        source: 'site_performance'
      });

      const filtered = service.getDataPoints('brand-123', { source: 'brand_monitoring' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].source).toBe('brand_monitoring');
    });

    it('should clear data points for a brand', () => {
      service.addDataPoint('brand-123', {
        id: 'dp-1',
        metric: 'metric_a',
        value: 10,
        timestamp: new Date(),
        source: 'brand_monitoring'
      });

      expect(service.getDataPoints('brand-123')).toHaveLength(1);

      service.clearDataPoints('brand-123');

      expect(service.getDataPoints('brand-123')).toHaveLength(0);
    });
  });

  describe('Metric Calculations', () => {
    beforeEach(() => {
      // Add time-series data for trend detection
      const now = Date.now();
      const points: DataPoint[] = [
        { id: 'dp-1', metric: 'increasing', value: 10, timestamp: new Date(now - 5 * 86400000), source: 'brand_monitoring' },
        { id: 'dp-2', metric: 'increasing', value: 20, timestamp: new Date(now - 4 * 86400000), source: 'brand_monitoring' },
        { id: 'dp-3', metric: 'increasing', value: 30, timestamp: new Date(now - 3 * 86400000), source: 'brand_monitoring' },
        { id: 'dp-4', metric: 'increasing', value: 40, timestamp: new Date(now - 2 * 86400000), source: 'brand_monitoring' },
        { id: 'dp-5', metric: 'increasing', value: 50, timestamp: new Date(now - 1 * 86400000), source: 'brand_monitoring' },

        { id: 'dp-6', metric: 'decreasing', value: 50, timestamp: new Date(now - 5 * 86400000), source: 'brand_monitoring' },
        { id: 'dp-7', metric: 'decreasing', value: 40, timestamp: new Date(now - 4 * 86400000), source: 'brand_monitoring' },
        { id: 'dp-8', metric: 'decreasing', value: 30, timestamp: new Date(now - 3 * 86400000), source: 'brand_monitoring' },
        { id: 'dp-9', metric: 'decreasing', value: 20, timestamp: new Date(now - 2 * 86400000), source: 'brand_monitoring' },
        { id: 'dp-10', metric: 'decreasing', value: 10, timestamp: new Date(now - 1 * 86400000), source: 'brand_monitoring' },

        { id: 'dp-11', metric: 'stable', value: 30, timestamp: new Date(now - 5 * 86400000), source: 'brand_monitoring' },
        { id: 'dp-12', metric: 'stable', value: 31, timestamp: new Date(now - 4 * 86400000), source: 'brand_monitoring' },
        { id: 'dp-13', metric: 'stable', value: 29, timestamp: new Date(now - 3 * 86400000), source: 'brand_monitoring' },
        { id: 'dp-14', metric: 'stable', value: 30, timestamp: new Date(now - 2 * 86400000), source: 'brand_monitoring' },
        { id: 'dp-15', metric: 'stable', value: 30, timestamp: new Date(now - 1 * 86400000), source: 'brand_monitoring' }
      ];

      points.forEach(p => service.addDataPoint('brand-123', p));
    });

    it('should detect upward trend', () => {
      const summary = service.calculateMetricSummary('brand-123', 'increasing');

      expect(summary!.trend).toBe('up');
    });

    it('should detect downward trend', () => {
      const summary = service.calculateMetricSummary('brand-123', 'decreasing');

      expect(summary!.trend).toBe('down');
    });

    it('should detect stable trend', () => {
      const summary = service.calculateMetricSummary('brand-123', 'stable');

      expect(summary!.trend).toBe('stable');
    });

    it('should calculate correct min value', () => {
      const summary = service.calculateMetricSummary('brand-123', 'increasing');

      expect(summary!.min).toBe(10);
    });

    it('should calculate correct max value', () => {
      const summary = service.calculateMetricSummary('brand-123', 'increasing');

      expect(summary!.max).toBe(50);
    });

    it('should calculate correct average', () => {
      const summary = service.calculateMetricSummary('brand-123', 'increasing');

      expect(summary!.avg).toBe(30); // (10+20+30+40+50) / 5 = 30
    });

    it('should calculate standard deviation', () => {
      const summary = service.calculateMetricSummary('brand-123', 'increasing');

      expect(summary!.stdDev).toBeDefined();
      expect(summary!.stdDev).toBeGreaterThan(0);
    });

    it('should return null for non-existent metric', () => {
      const summary = service.calculateMetricSummary('brand-123', 'non_existent');

      expect(summary).toBeNull();
    });
  });

  describe('Cross-Source Mapping', () => {
    beforeEach(() => {
      // Create service with social_media enabled
      service = createDataAggregationService({
        enabledSources: ['brand_monitoring', 'social_media']
      });

      service.registerSource({
        id: 'source-1',
        type: 'brand_monitoring',
        name: 'Source 1',
        fetchData: async () => [
          { id: 'dp-1', metric: 'mentions', value: 100, timestamp: new Date(), source: 'brand_monitoring' }
        ]
      });
      service.registerSource({
        id: 'source-2',
        type: 'social_media',
        name: 'Source 2',
        fetchData: async () => [
          { id: 'dp-2', metric: 'social_reach', value: 5000, timestamp: new Date(), source: 'social_media' }
        ]
      });
    });

    it('should map data across sources', async () => {
      const result = await service.aggregate({ brandId: 'brand-123' });

      expect(result.sources).toContain('brand_monitoring');
      expect(result.sources).toContain('social_media');
    });

    it('should identify source for each data point', async () => {
      const result = await service.aggregate({ brandId: 'brand-123' });

      result.dataPoints.forEach(dp => {
        expect(dp.source).toBeTruthy();
        expect(['brand_monitoring', 'site_performance', 'content_generation', 'social_media', 'ai_platform_visibility']).toContain(dp.source);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle source fetch errors gracefully', async () => {
      service.registerSource({
        id: 'failing-source',
        type: 'brand_monitoring',
        name: 'Failing Source',
        fetchData: async () => {
          throw new Error('Network error');
        }
      });

      const result = await service.aggregate({ brandId: 'brand-123' });

      // Should not completely fail, but may have partial results
      expect(result).toBeDefined();
    });

    it('should emit error event on source failure', async () => {
      const spy = vi.fn();
      service.on('source:error', spy);

      service.registerSource({
        id: 'failing-source',
        type: 'brand_monitoring',
        name: 'Failing Source',
        fetchData: async () => {
          throw new Error('Network error');
        }
      });

      await service.aggregate({ brandId: 'brand-123' });

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0].error).toBe('Network error');
    });

    it('should continue aggregation when one source fails', async () => {
      service.registerSource({
        id: 'failing-source',
        type: 'brand_monitoring',
        name: 'Failing Source',
        fetchData: async () => {
          throw new Error('Network error');
        }
      });

      service.registerSource({
        id: 'working-source',
        type: 'site_performance',
        name: 'Working Source',
        fetchData: async () => [
          { id: 'dp-1', metric: 'load_time', value: 2.5, timestamp: new Date(), source: 'site_performance' }
        ]
      });

      const result = await service.aggregate({ brandId: 'brand-123' });

      expect(result.success).toBe(true);
      expect(result.dataPoints.length).toBeGreaterThan(0);
    });
  });

  describe('Concurrency', () => {
    it('should handle concurrent aggregation requests', async () => {
      service.registerSource({
        id: 'source-1',
        type: 'brand_monitoring',
        name: 'Source 1',
        fetchData: async () => {
          await new Promise(r => setTimeout(r, 10));
          return [{ id: 'dp-1', metric: 'metric_a', value: 10, timestamp: new Date(), source: 'brand_monitoring' }];
        }
      });

      const results = await Promise.all([
        service.aggregate({ brandId: 'brand-1' }),
        service.aggregate({ brandId: 'brand-2' }),
        service.aggregate({ brandId: 'brand-3' })
      ]);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      expect(results[0].brandId).toBe('brand-1');
      expect(results[1].brandId).toBe('brand-2');
      expect(results[2].brandId).toBe('brand-3');
    });
  });

  describe('Performance', () => {
    it('should respect maxDataPointsPerSource limit', async () => {
      const limitedService = createDataAggregationService({
        maxDataPointsPerSource: 5
      });

      // Generate many data points
      const manyPoints: DataPoint[] = Array.from({ length: 20 }, (_, i) => ({
        id: `dp-${i}`,
        metric: 'test_metric',
        value: i,
        timestamp: new Date(),
        source: 'brand_monitoring' as const
      }));

      limitedService.registerSource({
        id: 'large-source',
        type: 'brand_monitoring',
        name: 'Large Source',
        fetchData: async () => manyPoints
      });

      const result = await limitedService.aggregate({ brandId: 'brand-123' });

      expect(result.dataPoints.length).toBeLessThanOrEqual(5);
    });

    it('should include processing time in result', async () => {
      service.registerSource({
        id: 'source-1',
        type: 'brand_monitoring',
        name: 'Source 1',
        fetchData: async () => [{ id: 'dp-1', metric: 'metric', value: 10, timestamp: new Date(), source: 'brand_monitoring' }]
      });

      const result = await service.aggregate({ brandId: 'brand-123' });

      expect(result.processingTime).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });
  });
});
