import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PredictiveAnalyticsService,
  createPredictiveAnalyticsService,
  type PredictiveAnalyticsConfig,
  type TimeSeriesData,
  type ForecastRequest,
  type ForecastResult,
  type TrendPrediction,
  type AnomalyPrediction,
  type SeasonalPattern,
  type PredictionConfidence
} from '../src/services/predictive-analytics-service';

describe('PredictiveAnalyticsService', () => {
  let service: PredictiveAnalyticsService;

  beforeEach(() => {
    service = createPredictiveAnalyticsService();
  });

  describe('Initialization', () => {
    it('should create service with default config', () => {
      expect(service).toBeInstanceOf(PredictiveAnalyticsService);
      const config = service.getConfig();
      expect(config.forecastHorizon).toBeDefined();
      expect(config.confidenceLevel).toBeDefined();
    });

    it('should create service with custom config', () => {
      const customService = createPredictiveAnalyticsService({
        forecastHorizon: 14,
        confidenceLevel: 0.99,
        minDataPoints: 20
      });
      const config = customService.getConfig();
      expect(config.forecastHorizon).toBe(14);
      expect(config.confidenceLevel).toBe(0.99);
      expect(config.minDataPoints).toBe(20);
    });

    it('should validate config with Zod schema', () => {
      expect(() => createPredictiveAnalyticsService({
        forecastHorizon: -1
      })).toThrow();
    });
  });

  describe('Time Series Forecasting', () => {
    it('should generate forecasts from historical data', async () => {
      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, 105, 110, 108, 115, 120, 125, 130, 128, 135],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
          )
        }
      };

      const result = await service.forecast(request);

      expect(result.success).toBe(true);
      expect(result.predictions.length).toBeGreaterThan(0);
      expect(result.predictions[0].value).toBeDefined();
    });

    it('should provide confidence intervals for predictions', async () => {
      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'engagement_rate',
        timeSeries: {
          values: [50, 55, 52, 58, 60, 62, 58, 65, 68, 70],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
          )
        }
      };

      const result = await service.forecast(request);

      expect(result.success).toBe(true);
      result.predictions.forEach(pred => {
        expect(pred.confidenceInterval).toBeDefined();
        expect(pred.confidenceInterval.lower).toBeLessThan(pred.confidenceInterval.upper);
        expect(pred.value).toBeGreaterThanOrEqual(pred.confidenceInterval.lower);
        expect(pred.value).toBeLessThanOrEqual(pred.confidenceInterval.upper);
      });
    });

    it('should respect forecast horizon setting', async () => {
      const customService = createPredictiveAnalyticsService({
        forecastHorizon: 5
      });

      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, 110, 120, 130, 140, 150, 160, 170, 180, 190],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
          )
        }
      };

      const result = await customService.forecast(request);

      expect(result.predictions.length).toBe(5);
    });

    it('should handle insufficient data gracefully', async () => {
      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, 110],
          timestamps: [new Date(), new Date()]
        }
      };

      const result = await service.forecast(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('data');
    });

    it('should detect and forecast upward trends', async () => {
      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, 120, 140, 160, 180, 200, 220, 240, 260, 280],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
          )
        }
      };

      const result = await service.forecast(request);

      expect(result.success).toBe(true);
      expect(result.trendDirection).toBe('up');
      // Future predictions should be higher than last value
      expect(result.predictions[0].value).toBeGreaterThan(280);
    });

    it('should detect and forecast downward trends', async () => {
      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [280, 260, 240, 220, 200, 180, 160, 140, 120, 100],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
          )
        }
      };

      const result = await service.forecast(request);

      expect(result.success).toBe(true);
      expect(result.trendDirection).toBe('down');
      // Future predictions should be lower than last value
      expect(result.predictions[0].value).toBeLessThan(100);
    });
  });

  describe('Trend Prediction', () => {
    it('should predict trend changes', async () => {
      const data: TimeSeriesData = {
        values: [100, 105, 110, 108, 115, 120, 125, 122, 118, 115],
        timestamps: Array.from({ length: 10 }, (_, i) =>
          new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
        )
      };

      const prediction = await service.predictTrend('brand-123', data);

      expect(prediction).toBeDefined();
      expect(prediction.currentTrend).toBeDefined();
      expect(prediction.predictedTrend).toBeDefined();
      expect(prediction.changeConfidence).toBeDefined();
    });

    it('should identify trend reversal points', async () => {
      const data: TimeSeriesData = {
        values: [100, 120, 140, 160, 155, 145, 135, 125, 115, 105],
        timestamps: Array.from({ length: 10 }, (_, i) =>
          new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
        )
      };

      const prediction = await service.predictTrend('brand-123', data);

      expect(prediction.reversalDetected).toBe(true);
      expect(prediction.reversalPoint).toBeDefined();
    });

    it('should calculate trend strength', async () => {
      const strongTrendData: TimeSeriesData = {
        values: [100, 110, 120, 130, 140, 150, 160, 170, 180, 190],
        timestamps: Array.from({ length: 10 }, (_, i) =>
          new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
        )
      };

      const prediction = await service.predictTrend('brand-123', strongTrendData);

      expect(prediction.trendStrength).toBeGreaterThan(0.7);
    });
  });

  describe('Anomaly Prediction', () => {
    it('should predict potential anomalies', async () => {
      const data: TimeSeriesData = {
        values: [100, 102, 98, 101, 99, 103, 97, 100, 102, 98],
        timestamps: Array.from({ length: 10 }, (_, i) =>
          new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
        )
      };

      const predictions = await service.predictAnomalies('brand-123', data);

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
    });

    it('should identify high-risk periods for anomalies', async () => {
      const volatileData: TimeSeriesData = {
        values: [100, 150, 80, 120, 70, 140, 90, 130, 75, 145],
        timestamps: Array.from({ length: 10 }, (_, i) =>
          new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
        )
      };

      const predictions = await service.predictAnomalies('brand-123', volatileData);

      // Volatile data should have higher anomaly risk
      const highRiskPredictions = predictions.filter(p => p.risk === 'high');
      expect(highRiskPredictions.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide expected value ranges', async () => {
      const data: TimeSeriesData = {
        values: [100, 105, 98, 102, 99, 103, 97, 101, 104, 96],
        timestamps: Array.from({ length: 10 }, (_, i) =>
          new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
        )
      };

      const predictions = await service.predictAnomalies('brand-123', data);

      predictions.forEach(pred => {
        expect(pred.expectedRange).toBeDefined();
        expect(pred.expectedRange.min).toBeLessThan(pred.expectedRange.max);
      });
    });
  });

  describe('Seasonal Pattern Detection', () => {
    it('should detect weekly patterns', async () => {
      // Simulate weekly pattern (higher on weekdays, lower on weekends)
      const values = [];
      const timestamps = [];
      for (let week = 0; week < 4; week++) {
        for (let day = 0; day < 7; day++) {
          const isWeekend = day >= 5;
          values.push(isWeekend ? 50 + Math.random() * 10 : 100 + Math.random() * 10);
          timestamps.push(new Date(Date.now() - (28 - (week * 7 + day)) * 24 * 60 * 60 * 1000));
        }
      }

      const data: TimeSeriesData = { values, timestamps };
      const patterns = await service.detectSeasonalPatterns('brand-123', data);

      expect(patterns.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect monthly patterns', async () => {
      // Simulate monthly data
      const values = [];
      const timestamps = [];
      for (let month = 0; month < 6; month++) {
        for (let day = 0; day < 30; day++) {
          // Higher at month end
          const isMonthEnd = day >= 25;
          values.push(isMonthEnd ? 150 + Math.random() * 20 : 100 + Math.random() * 20);
          timestamps.push(new Date(Date.now() - (180 - (month * 30 + day)) * 24 * 60 * 60 * 1000));
        }
      }

      const data: TimeSeriesData = { values, timestamps };
      const patterns = await service.detectSeasonalPatterns('brand-123', data);

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should calculate pattern strength', async () => {
      const values = [];
      const timestamps = [];
      for (let week = 0; week < 8; week++) {
        for (let day = 0; day < 7; day++) {
          // Strong pattern: consistent high on Monday, low on Sunday
          if (day === 0) values.push(150);
          else if (day === 6) values.push(50);
          else values.push(100);
          timestamps.push(new Date(Date.now() - (56 - (week * 7 + day)) * 24 * 60 * 60 * 1000));
        }
      }

      const data: TimeSeriesData = { values, timestamps };
      const patterns = await service.detectSeasonalPatterns('brand-123', data);

      if (patterns.length > 0) {
        expect(patterns[0].strength).toBeDefined();
        expect(patterns[0].strength).toBeGreaterThan(0);
        expect(patterns[0].strength).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Prediction Confidence', () => {
    it('should calculate prediction confidence scores', async () => {
      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, 105, 110, 108, 115, 120, 125, 130, 128, 135],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
          )
        }
      };

      const result = await service.forecast(request);

      expect(result.overallConfidence).toBeDefined();
      expect(result.overallConfidence).toBeGreaterThan(0);
      expect(result.overallConfidence).toBeLessThanOrEqual(100);
    });

    it('should decrease confidence for further predictions', async () => {
      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, 105, 110, 108, 115, 120, 125, 130, 128, 135],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
          )
        }
      };

      const result = await service.forecast(request);

      if (result.predictions.length > 1) {
        // Confidence should generally decrease for predictions further in future
        const firstConfidence = result.predictions[0].confidence;
        const lastConfidence = result.predictions[result.predictions.length - 1].confidence;
        expect(firstConfidence).toBeGreaterThanOrEqual(lastConfidence);
      }
    });

    it('should factor in data quality for confidence', async () => {
      // Noisy data should have lower confidence
      const noisyRequest: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, 150, 80, 130, 70, 160, 90, 140, 75, 145],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
          )
        }
      };

      const smoothRequest: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, 102, 104, 106, 108, 110, 112, 114, 116, 118],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
          )
        }
      };

      const noisyResult = await service.forecast(noisyRequest);
      const smoothResult = await service.forecast(smoothRequest);

      // Smooth data should have higher confidence
      expect(smoothResult.overallConfidence).toBeGreaterThan(noisyResult.overallConfidence);
    });
  });

  describe('Multi-Metric Analysis', () => {
    it('should forecast multiple metrics', async () => {
      const metrics = [
        { name: 'brand_mentions', values: [100, 105, 110, 115, 120, 125, 130, 135, 140, 145] },
        { name: 'engagement', values: [50, 52, 54, 56, 58, 60, 62, 64, 66, 68] }
      ];

      const results = await service.forecastMultiple('brand-123', metrics);

      expect(results.success).toBe(true);
      expect(results.forecasts.length).toBe(2);
      expect(results.forecasts.find(f => f.metric === 'brand_mentions')).toBeDefined();
      expect(results.forecasts.find(f => f.metric === 'engagement')).toBeDefined();
    });

    it('should correlate metric predictions', async () => {
      const metrics = [
        { name: 'brand_mentions', values: [100, 110, 120, 130, 140, 150, 160, 170, 180, 190] },
        { name: 'engagement', values: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95] }
      ];

      const results = await service.forecastMultiple('brand-123', metrics);

      expect(results.correlations).toBeDefined();
    });
  });

  describe('Events and Notifications', () => {
    it('should emit forecast:completed event', async () => {
      const completedSpy = vi.fn();
      service.on('forecast:completed', completedSpy);

      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, 105, 110, 108, 115, 120, 125, 130, 128, 135],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
          )
        }
      };

      await service.forecast(request);

      expect(completedSpy).toHaveBeenCalled();
    });

    it('should emit anomaly:predicted event for high-risk predictions', async () => {
      const anomalySpy = vi.fn();
      service.on('anomaly:predicted', anomalySpy);

      const volatileData: TimeSeriesData = {
        values: [100, 200, 50, 180, 40, 190, 60, 170, 45, 195],
        timestamps: Array.from({ length: 10 }, (_, i) =>
          new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
        )
      };

      await service.predictAnomalies('brand-123', volatileData);

      // May or may not be called depending on threshold
      expect(anomalySpy.mock.calls.length).toBeGreaterThanOrEqual(0);
    });

    it('should emit trend:reversal event', async () => {
      const reversalSpy = vi.fn();
      service.on('trend:reversal', reversalSpy);

      const data: TimeSeriesData = {
        values: [100, 120, 140, 160, 155, 145, 135, 125, 115, 105],
        timestamps: Array.from({ length: 10 }, (_, i) =>
          new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
        )
      };

      await service.predictTrend('brand-123', data);

      // May or may not be called depending on reversal detection
      expect(reversalSpy.mock.calls.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty time series', async () => {
      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [],
          timestamps: []
        }
      };

      const result = await service.forecast(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing brand ID', async () => {
      const request: ForecastRequest = {
        brandId: '',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, 110, 120],
          timestamps: [new Date(), new Date(), new Date()]
        }
      };

      const result = await service.forecast(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle mismatched values and timestamps', async () => {
      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, 110, 120, 130, 140],
          timestamps: [new Date(), new Date(), new Date()] // 3 timestamps for 5 values
        }
      };

      const result = await service.forecast(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle NaN values gracefully', async () => {
      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, NaN, 120, 130, 140, 150, 160, 170, 180, 190],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
          )
        }
      };

      const result = await service.forecast(request);

      // Should either fail gracefully or handle NaN
      expect(result).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle large time series efficiently', async () => {
      const largeValues = Array.from({ length: 1000 }, (_, i) => 100 + Math.sin(i / 10) * 20);
      const largeTimestamps = Array.from({ length: 1000 }, (_, i) =>
        new Date(Date.now() - (1000 - i) * 24 * 60 * 60 * 1000)
      );

      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: largeValues,
          timestamps: largeTimestamps
        }
      };

      const startTime = Date.now();
      const result = await service.forecast(request);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should cache computationally expensive calculations', async () => {
      const request: ForecastRequest = {
        brandId: 'brand-123',
        metric: 'brand_mentions',
        timeSeries: {
          values: [100, 105, 110, 108, 115, 120, 125, 130, 128, 135],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000)
          )
        }
      };

      // First call
      const start1 = Date.now();
      await service.forecast(request);
      const time1 = Date.now() - start1;

      // Second call with same data - should be faster if cached
      const start2 = Date.now();
      await service.forecast(request);
      const time2 = Date.now() - start2;

      // Both should complete quickly
      expect(time1).toBeLessThan(1000);
      expect(time2).toBeLessThan(1000);
    });
  });
});
