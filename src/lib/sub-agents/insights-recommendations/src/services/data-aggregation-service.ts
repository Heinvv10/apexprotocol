import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Data Aggregation Service
 *
 * Provides comprehensive data collection and aggregation from multiple sources
 * including brand monitoring, site performance, content generation, social media,
 * and AI platform visibility data.
 */

// Data Source Type
export type DataSourceType =
  | 'brand_monitoring'
  | 'site_performance'
  | 'content_generation'
  | 'social_media'
  | 'ai_platform_visibility';

// Trend Direction
export type TrendDirection = 'up' | 'down' | 'stable';

// Configuration Schema
export const DataAggregationConfigSchema = z.object({
  enabledSources: z.array(z.enum([
    'brand_monitoring',
    'site_performance',
    'content_generation',
    'social_media',
    'ai_platform_visibility'
  ])).default(['brand_monitoring', 'site_performance', 'content_generation']),
  defaultDateRangeDays: z.number().min(1).default(30),
  maxDataPointsPerSource: z.number().min(1).default(1000),
  aggregationIntervalMinutes: z.number().min(1).default(60),
  trendThreshold: z.number().min(0).max(1).default(0.1) // 10% change = trend
});

export type DataAggregationConfig = z.infer<typeof DataAggregationConfigSchema>;

// Data Point
export interface DataPoint {
  id: string;
  metric: string;
  value: number;
  timestamp: Date;
  source: DataSourceType;
  metadata?: Record<string, unknown>;
}

// Data Source
export interface DataSource {
  id: string;
  type: DataSourceType;
  name: string;
  fetchData: (brandId: string, dateRange: { from: Date; to: Date }) => Promise<DataPoint[]>;
}

// Aggregation Request
export interface AggregationRequest {
  brandId: string;
  sourceTypes?: DataSourceType[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Metric Summary
export interface MetricSummary {
  min: number;
  max: number;
  avg: number;
  stdDev?: number;
  trend: TrendDirection;
  count: number;
}

// Aggregation Result
export interface AggregationResult {
  success: boolean;
  brandId: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  sources: DataSourceType[];
  dataPoints: DataPoint[];
  summary: {
    totalDataPoints: number;
    metrics: Record<string, MetricSummary>;
  };
  processingTime: number;
  error?: string;
}

// Data Point Filter
export interface DataPointFilter {
  metric?: string;
  source?: DataSourceType;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * Data Aggregation Service
 */
export class DataAggregationService extends EventEmitter {
  private config: DataAggregationConfig;
  private sources: Map<string, DataSource>;
  private dataPoints: Map<string, DataPoint[]>; // brandId -> dataPoints

  constructor(config: Partial<DataAggregationConfig> = {}) {
    super();
    this.config = DataAggregationConfigSchema.parse(config);
    this.sources = new Map();
    this.dataPoints = new Map();
  }

  /**
   * Get current configuration
   */
  getConfig(): DataAggregationConfig {
    return { ...this.config };
  }

  /**
   * Register a data source
   */
  registerSource(source: DataSource): void {
    this.sources.set(source.id, source);
    this.emit('source:registered', { id: source.id, type: source.type, name: source.name });
  }

  /**
   * Check if a source is registered
   */
  hasSource(sourceId: string): boolean {
    return this.sources.has(sourceId);
  }

  /**
   * List all registered sources
   */
  listSources(): DataSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Unregister a data source
   */
  unregisterSource(sourceId: string): boolean {
    const result = this.sources.delete(sourceId);
    if (result) {
      this.emit('source:unregistered', { id: sourceId });
    }
    return result;
  }

  /**
   * Aggregate data from registered sources
   */
  async aggregate(request: AggregationRequest): Promise<AggregationResult> {
    const startTime = Date.now();

    // Validate request
    if (!request.brandId) {
      return this.createErrorResult(request.brandId, 'Brand ID is required', startTime);
    }

    this.emit('aggregation:start', { brandId: request.brandId });

    const dateRange = request.dateRange || {
      from: new Date(Date.now() - this.config.defaultDateRangeDays * 24 * 60 * 60 * 1000),
      to: new Date()
    };

    const sourceTypes = request.sourceTypes || this.config.enabledSources;
    const allDataPoints: DataPoint[] = [];
    const usedSources: DataSourceType[] = [];

    // Fetch from each source
    for (const source of this.sources.values()) {
      if (!sourceTypes.includes(source.type)) continue;

      try {
        const points = await source.fetchData(request.brandId, dateRange);

        // Limit data points per source
        const limitedPoints = points.slice(0, this.config.maxDataPointsPerSource);
        allDataPoints.push(...limitedPoints);

        if (!usedSources.includes(source.type)) {
          usedSources.push(source.type);
        }

        this.emit('source:fetched', {
          sourceId: source.id,
          sourceType: source.type,
          pointCount: limitedPoints.length
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.emit('source:error', {
          sourceId: source.id,
          sourceType: source.type,
          error: errorMessage
        });
        // Continue with other sources
      }
    }

    // Calculate summary
    const summary = this.calculateSummary(allDataPoints);

    const result: AggregationResult = {
      success: true,
      brandId: request.brandId,
      dateRange,
      sources: usedSources,
      dataPoints: allDataPoints,
      summary,
      processingTime: Date.now() - startTime
    };

    this.emit('aggregation:complete', result);

    return result;
  }

  /**
   * Add a data point manually
   */
  addDataPoint(brandId: string, dataPoint: DataPoint): void {
    if (!this.dataPoints.has(brandId)) {
      this.dataPoints.set(brandId, []);
    }
    this.dataPoints.get(brandId)!.push(dataPoint);
    this.emit('datapoint:added', { brandId, dataPoint });
  }

  /**
   * Get data points for a brand
   */
  getDataPoints(brandId: string, filter?: DataPointFilter): DataPoint[] {
    const points = this.dataPoints.get(brandId) || [];

    if (!filter) return [...points];

    return points.filter(point => {
      if (filter.metric && point.metric !== filter.metric) return false;
      if (filter.source && point.source !== filter.source) return false;
      if (filter.dateRange) {
        const time = point.timestamp.getTime();
        if (time < filter.dateRange.from.getTime() || time > filter.dateRange.to.getTime()) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Clear data points for a brand
   */
  clearDataPoints(brandId: string): void {
    this.dataPoints.delete(brandId);
    this.emit('datapoints:cleared', { brandId });
  }

  /**
   * Calculate metric summary for a specific metric
   */
  calculateMetricSummary(brandId: string, metric: string): MetricSummary | null {
    const points = this.getDataPoints(brandId, { metric });

    if (points.length === 0) return null;

    // Sort by timestamp for trend detection
    const sorted = [...points].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const values = sorted.map(p => p.value);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    // Calculate standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    // Detect trend
    const trend = this.detectTrend(values);

    return {
      min,
      max,
      avg,
      stdDev,
      trend,
      count: values.length
    };
  }

  // Private methods

  private createErrorResult(
    brandId: string,
    error: string,
    startTime: number
  ): AggregationResult {
    return {
      success: false,
      brandId,
      dateRange: { from: new Date(), to: new Date() },
      sources: [],
      dataPoints: [],
      summary: {
        totalDataPoints: 0,
        metrics: {}
      },
      processingTime: Date.now() - startTime,
      error
    };
  }

  private calculateSummary(dataPoints: DataPoint[]): AggregationResult['summary'] {
    const metricValues: Record<string, number[]> = {};
    const metricPoints: Record<string, DataPoint[]> = {};

    // Group by metric
    dataPoints.forEach(point => {
      if (!metricValues[point.metric]) {
        metricValues[point.metric] = [];
        metricPoints[point.metric] = [];
      }
      metricValues[point.metric].push(point.value);
      metricPoints[point.metric].push(point);
    });

    // Calculate summary for each metric
    const metrics: Record<string, MetricSummary> = {};

    Object.entries(metricValues).forEach(([metric, values]) => {
      const sorted = [...metricPoints[metric]].sort((a, b) =>
        a.timestamp.getTime() - b.timestamp.getTime()
      );
      const sortedValues = sorted.map(p => p.value);

      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      // Calculate standard deviation
      const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
      const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(avgSquaredDiff);

      // Detect trend
      const trend = this.detectTrend(sortedValues);

      metrics[metric] = {
        min,
        max,
        avg,
        stdDev,
        trend,
        count: values.length
      };
    });

    return {
      totalDataPoints: dataPoints.length,
      metrics
    };
  }

  private detectTrend(values: number[]): TrendDirection {
    if (values.length < 2) return 'stable';

    // Use linear regression to detect trend
    const n = values.length;
    const xSum = (n * (n - 1)) / 2; // Sum of 0, 1, 2, ..., n-1
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
    const x2Sum = values.reduce((sum, _, x) => sum + x * x, 0);

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);

    // Calculate average to determine relative change
    const avg = ySum / n;
    const relativeSlope = avg !== 0 ? Math.abs(slope / avg) : 0;

    // Determine trend based on threshold
    if (slope > 0 && relativeSlope > this.config.trendThreshold) {
      return 'up';
    } else if (slope < 0 && relativeSlope > this.config.trendThreshold) {
      return 'down';
    } else {
      return 'stable';
    }
  }
}

/**
 * Factory function
 */
export function createDataAggregationService(
  config: Partial<DataAggregationConfig> = {}
): DataAggregationService {
  return new DataAggregationService(config);
}
