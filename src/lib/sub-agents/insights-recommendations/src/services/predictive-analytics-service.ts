import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Predictive Analytics Service
 *
 * Provides advanced predictive analytics including:
 * - Time series forecasting
 * - Trend prediction and reversal detection
 * - Anomaly prediction
 * - Seasonal pattern detection
 * - Multi-metric correlation forecasting
 */

// Configuration Schema
export const PredictiveAnalyticsConfigSchema = z.object({
  forecastHorizon: z.number().min(1).max(90).default(7),
  confidenceLevel: z.number().min(0.5).max(0.99).default(0.95),
  minDataPoints: z.number().min(3).default(5),
  seasonalityDetection: z.boolean().default(true),
  anomalyThreshold: z.number().min(1).max(5).default(2) // Standard deviations
});

export type PredictiveAnalyticsConfig = z.infer<typeof PredictiveAnalyticsConfigSchema>;

// Time Series Data
export interface TimeSeriesData {
  values: number[];
  timestamps: Date[];
}

// Forecast Request
export interface ForecastRequest {
  brandId: string;
  metric: string;
  timeSeries: TimeSeriesData;
}

// Prediction Point
export interface PredictionPoint {
  timestamp: Date;
  value: number;
  confidence: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

// Forecast Result
export interface ForecastResult {
  success: boolean;
  brandId: string;
  metric: string;
  predictions: PredictionPoint[];
  trendDirection: 'up' | 'down' | 'stable';
  overallConfidence: number;
  processingTime: number;
  error?: string;
}

// Trend Prediction
export interface TrendPrediction {
  currentTrend: 'up' | 'down' | 'stable';
  predictedTrend: 'up' | 'down' | 'stable';
  trendStrength: number;
  changeConfidence: number;
  reversalDetected: boolean;
  reversalPoint?: number;
}

// Anomaly Prediction
export interface AnomalyPrediction {
  timestamp: Date;
  risk: 'high' | 'medium' | 'low';
  probability: number;
  expectedRange: {
    min: number;
    max: number;
  };
}

// Seasonal Pattern
export interface SeasonalPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  period: number;
  strength: number;
  peakPoints: number[];
  troughPoints: number[];
}

// Prediction Confidence
export interface PredictionConfidence {
  overall: number;
  dataQuality: number;
  trendConsistency: number;
  volatility: number;
}

// Multi-Metric Result
export interface MultiMetricForecast {
  success: boolean;
  forecasts: Array<ForecastResult & { metric: string }>;
  correlations: Array<{
    metricA: string;
    metricB: string;
    correlation: number;
  }>;
  processingTime: number;
}

// Metric Input
export interface MetricInput {
  name: string;
  values: number[];
}

/**
 * Predictive Analytics Service
 */
export class PredictiveAnalyticsService extends EventEmitter {
  private config: PredictiveAnalyticsConfig;
  private cache: Map<string, { result: ForecastResult; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute cache

  constructor(config: Partial<PredictiveAnalyticsConfig> = {}) {
    super();
    this.config = PredictiveAnalyticsConfigSchema.parse(config);
  }

  /**
   * Get current configuration
   */
  getConfig(): PredictiveAnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Generate forecast from historical data
   */
  async forecast(request: ForecastRequest): Promise<ForecastResult> {
    const startTime = Date.now();

    // Validate request
    const validationError = this.validateForecastRequest(request);
    if (validationError) {
      return {
        success: false,
        brandId: request.brandId || '',
        metric: request.metric || '',
        predictions: [],
        trendDirection: 'stable',
        overallConfidence: 0,
        processingTime: Date.now() - startTime,
        error: validationError
      };
    }

    // Check cache
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { ...cached.result, processingTime: Date.now() - startTime };
    }

    const { values, timestamps } = request.timeSeries;

    // Calculate trend
    const trendDirection = this.calculateTrendDirection(values);

    // Calculate base statistics
    const stats = this.calculateStatistics(values);

    // Generate predictions
    const predictions: PredictionPoint[] = [];
    const lastTimestamp = timestamps[timestamps.length - 1];
    const lastValue = values[values.length - 1];

    for (let i = 1; i <= this.config.forecastHorizon; i++) {
      const timestamp = new Date(lastTimestamp.getTime() + i * 24 * 60 * 60 * 1000);
      const predictedValue = this.predictValue(values, i, trendDirection);
      const confidence = this.calculatePointConfidence(i, stats.volatility);
      const intervalWidth = stats.stdDev * this.getConfidenceMultiplier() * Math.sqrt(i);

      predictions.push({
        timestamp,
        value: predictedValue,
        confidence,
        confidenceInterval: {
          lower: predictedValue - intervalWidth,
          upper: predictedValue + intervalWidth
        }
      });
    }

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(stats);

    const result: ForecastResult = {
      success: true,
      brandId: request.brandId,
      metric: request.metric,
      predictions,
      trendDirection,
      overallConfidence,
      processingTime: Date.now() - startTime
    };

    // Cache result
    this.cache.set(cacheKey, { result, timestamp: Date.now() });

    this.emit('forecast:completed', result);

    return result;
  }

  /**
   * Predict trend changes
   */
  async predictTrend(brandId: string, data: TimeSeriesData): Promise<TrendPrediction> {
    const { values } = data;

    if (values.length < 3) {
      return {
        currentTrend: 'stable',
        predictedTrend: 'stable',
        trendStrength: 0,
        changeConfidence: 0,
        reversalDetected: false
      };
    }

    const currentTrend = this.calculateTrendDirection(values);
    const trendStrength = this.calculateTrendStrength(values);

    // Detect reversal
    const reversalInfo = this.detectReversal(values);

    // Predict future trend based on recent momentum
    const recentValues = values.slice(-5);
    const predictedTrend = this.calculateTrendDirection(recentValues);

    const prediction: TrendPrediction = {
      currentTrend,
      predictedTrend,
      trendStrength,
      changeConfidence: reversalInfo.detected ? 75 : 25,
      reversalDetected: reversalInfo.detected,
      reversalPoint: reversalInfo.point
    };

    if (reversalInfo.detected) {
      this.emit('trend:reversal', { brandId, prediction });
    }

    return prediction;
  }

  /**
   * Predict potential anomalies
   */
  async predictAnomalies(brandId: string, data: TimeSeriesData): Promise<AnomalyPrediction[]> {
    const { values, timestamps } = data;
    const predictions: AnomalyPrediction[] = [];

    if (values.length < 3) return predictions;

    const stats = this.calculateStatistics(values);
    const volatility = stats.stdDev / stats.mean;

    // Generate predictions for next periods
    for (let i = 1; i <= this.config.forecastHorizon; i++) {
      const timestamp = new Date(timestamps[timestamps.length - 1].getTime() + i * 24 * 60 * 60 * 1000);

      // Higher volatility means higher anomaly risk
      const risk = this.calculateAnomalyRisk(volatility);
      const probability = Math.min(volatility * 50, 90);

      const expectedMean = stats.mean + (stats.trend * i);
      const marginOfError = stats.stdDev * this.config.anomalyThreshold;

      predictions.push({
        timestamp,
        risk,
        probability,
        expectedRange: {
          min: expectedMean - marginOfError,
          max: expectedMean + marginOfError
        }
      });
    }

    // Emit event for high-risk predictions
    const highRiskPredictions = predictions.filter(p => p.risk === 'high');
    if (highRiskPredictions.length > 0) {
      this.emit('anomaly:predicted', { brandId, predictions: highRiskPredictions });
    }

    return predictions;
  }

  /**
   * Detect seasonal patterns
   */
  async detectSeasonalPatterns(brandId: string, data: TimeSeriesData): Promise<SeasonalPattern[]> {
    const { values } = data;
    const patterns: SeasonalPattern[] = [];

    if (!this.config.seasonalityDetection || values.length < 14) {
      return patterns;
    }

    // Check for weekly pattern (period = 7)
    const weeklyPattern = this.detectPeriodPattern(values, 7);
    if (weeklyPattern) {
      patterns.push({
        type: 'weekly',
        period: 7,
        strength: weeklyPattern.strength,
        peakPoints: weeklyPattern.peaks,
        troughPoints: weeklyPattern.troughs
      });
    }

    // Check for monthly pattern (period = 30)
    if (values.length >= 60) {
      const monthlyPattern = this.detectPeriodPattern(values, 30);
      if (monthlyPattern) {
        patterns.push({
          type: 'monthly',
          period: 30,
          strength: monthlyPattern.strength,
          peakPoints: monthlyPattern.peaks,
          troughPoints: monthlyPattern.troughs
        });
      }
    }

    return patterns;
  }

  /**
   * Forecast multiple metrics
   */
  async forecastMultiple(brandId: string, metrics: MetricInput[]): Promise<MultiMetricForecast> {
    const startTime = Date.now();
    const forecasts: Array<ForecastResult & { metric: string }> = [];

    const baseTimestamps = Array.from({ length: metrics[0]?.values.length || 0 }, (_, i) =>
      new Date(Date.now() - (metrics[0].values.length - i) * 24 * 60 * 60 * 1000)
    );

    for (const metric of metrics) {
      const result = await this.forecast({
        brandId,
        metric: metric.name,
        timeSeries: {
          values: metric.values,
          timestamps: baseTimestamps.slice(0, metric.values.length)
        }
      });

      forecasts.push({ ...result, metric: metric.name });
    }

    // Calculate correlations
    const correlations = this.calculateMetricCorrelations(metrics);

    return {
      success: true,
      forecasts,
      correlations,
      processingTime: Date.now() - startTime
    };
  }

  // Private methods

  private validateForecastRequest(request: ForecastRequest): string | null {
    if (!request.brandId) return 'Brand ID is required';
    if (!request.metric) return 'Metric name is required';
    if (!request.timeSeries) return 'Time series data is required';
    if (!request.timeSeries.values || request.timeSeries.values.length === 0) {
      return 'Time series values cannot be empty';
    }
    if (!request.timeSeries.timestamps || request.timeSeries.timestamps.length === 0) {
      return 'Time series timestamps cannot be empty';
    }
    if (request.timeSeries.values.length !== request.timeSeries.timestamps.length) {
      return 'Values and timestamps must have the same length';
    }
    if (request.timeSeries.values.length < this.config.minDataPoints) {
      return `Insufficient data points. Minimum required: ${this.config.minDataPoints}`;
    }
    return null;
  }

  private calculateTrendDirection(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    const n = values.length;
    const xSum = (n * (n - 1)) / 2;
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
    const x2Sum = values.reduce((sum, _, x) => sum + x * x, 0);

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const avg = ySum / n;
    const relativeSlope = avg !== 0 ? Math.abs(slope / avg) : 0;

    if (slope > 0 && relativeSlope > 0.01) return 'up';
    if (slope < 0 && relativeSlope > 0.01) return 'down';
    return 'stable';
  }

  private calculateTrendStrength(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const xSum = (n * (n - 1)) / 2;
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
    const x2Sum = values.reduce((sum, _, x) => sum + x * x, 0);
    const y2Sum = values.reduce((sum, y) => sum + y * y, 0);

    const numerator = n * xySum - xSum * ySum;
    const denominator = Math.sqrt((n * x2Sum - xSum * xSum) * (n * y2Sum - ySum * ySum));

    if (denominator === 0) return 0;

    // R-squared value
    const correlation = numerator / denominator;
    return Math.abs(correlation);
  }

  private calculateStatistics(values: number[]): {
    mean: number;
    stdDev: number;
    volatility: number;
    trend: number;
  } {
    const validValues = values.filter(v => !isNaN(v));
    const n = validValues.length;

    if (n === 0) return { mean: 0, stdDev: 0, volatility: 0, trend: 0 };

    const mean = validValues.reduce((a, b) => a + b, 0) / n;
    const variance = validValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const volatility = mean !== 0 ? stdDev / mean : 0;

    // Calculate trend (slope)
    const xSum = (n * (n - 1)) / 2;
    const ySum = validValues.reduce((a, b) => a + b, 0);
    const xySum = validValues.reduce((sum, y, x) => sum + x * y, 0);
    const x2Sum = validValues.reduce((sum, _, x) => sum + x * x, 0);
    const trend = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);

    return { mean, stdDev, volatility, trend };
  }

  private predictValue(values: number[], periodsAhead: number, trend: 'up' | 'down' | 'stable'): number {
    const n = values.length;
    const lastValue = values[n - 1];

    // Simple linear extrapolation
    const stats = this.calculateStatistics(values);
    let predicted = lastValue + stats.trend * periodsAhead;

    // Apply dampening for longer forecasts
    const dampening = 1 - (periodsAhead / (this.config.forecastHorizon * 2));
    predicted = lastValue + (predicted - lastValue) * Math.max(dampening, 0.5);

    return predicted;
  }

  private calculatePointConfidence(periodsAhead: number, volatility: number): number {
    const baseConfidence = 85;
    const decayPerPeriod = 5;
    const volatilityPenalty = volatility * 20;

    return Math.max(
      30,
      baseConfidence - (periodsAhead * decayPerPeriod) - volatilityPenalty
    );
  }

  private calculateOverallConfidence(stats: { stdDev: number; mean: number; volatility: number }): number {
    let confidence = 70;

    // Lower confidence for high volatility
    if (stats.volatility > 0.5) confidence -= 20;
    else if (stats.volatility > 0.3) confidence -= 10;
    else if (stats.volatility < 0.1) confidence += 10;

    return Math.min(95, Math.max(30, confidence));
  }

  private getConfidenceMultiplier(): number {
    // Z-score for confidence level
    const confidenceMultipliers: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };

    const level = Math.round(this.config.confidenceLevel * 100) / 100;
    return confidenceMultipliers[level] || 1.96;
  }

  private detectReversal(values: number[]): { detected: boolean; point?: number } {
    if (values.length < 6) return { detected: false };

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstTrend = this.calculateTrendDirection(firstHalf);
    const secondTrend = this.calculateTrendDirection(secondHalf);

    if (firstTrend !== secondTrend && firstTrend !== 'stable' && secondTrend !== 'stable') {
      return {
        detected: true,
        point: Math.floor(values.length / 2)
      };
    }

    return { detected: false };
  }

  private calculateAnomalyRisk(volatility: number): 'high' | 'medium' | 'low' {
    if (volatility > 0.5) return 'high';
    if (volatility > 0.2) return 'medium';
    return 'low';
  }

  private detectPeriodPattern(values: number[], period: number): {
    strength: number;
    peaks: number[];
    troughs: number[];
  } | null {
    if (values.length < period * 2) return null;

    // Calculate autocorrelation at the given period
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - period; i++) {
      numerator += (values[i] - mean) * (values[i + period] - mean);
    }

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    const autocorrelation = denominator !== 0 ? numerator / denominator : 0;

    if (autocorrelation < 0.3) return null;

    // Find peaks and troughs in a typical period
    const samplePeriod = values.slice(0, period);
    const peaks: number[] = [];
    const troughs: number[] = [];

    for (let i = 1; i < samplePeriod.length - 1; i++) {
      if (samplePeriod[i] > samplePeriod[i - 1] && samplePeriod[i] > samplePeriod[i + 1]) {
        peaks.push(i);
      }
      if (samplePeriod[i] < samplePeriod[i - 1] && samplePeriod[i] < samplePeriod[i + 1]) {
        troughs.push(i);
      }
    }

    return {
      strength: autocorrelation,
      peaks,
      troughs
    };
  }

  private calculateMetricCorrelations(metrics: MetricInput[]): Array<{
    metricA: string;
    metricB: string;
    correlation: number;
  }> {
    const correlations: Array<{ metricA: string; metricB: string; correlation: number }> = [];

    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const metricA = metrics[i];
        const metricB = metrics[j];

        const minLength = Math.min(metricA.values.length, metricB.values.length);
        const valuesA = metricA.values.slice(0, minLength);
        const valuesB = metricB.values.slice(0, minLength);

        const correlation = this.calculatePearsonCorrelation(valuesA, valuesB);

        correlations.push({
          metricA: metricA.name,
          metricB: metricB.name,
          correlation
        });
      }
    }

    return correlations;
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  private getCacheKey(request: ForecastRequest): string {
    const valuesHash = request.timeSeries.values.slice(-10).join(',');
    return `${request.brandId}-${request.metric}-${valuesHash}`;
  }
}

/**
 * Factory function
 */
export function createPredictiveAnalyticsService(
  config: Partial<PredictiveAnalyticsConfig> = {}
): PredictiveAnalyticsService {
  return new PredictiveAnalyticsService(config);
}
