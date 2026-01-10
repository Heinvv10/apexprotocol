/**
 * Performance Tests for ML Forecasting
 *
 * Verifies performance targets:
 * - Prediction API: <2s response time
 * - Training: <5min for model training
 * - Forecasting: <100ms for 90-day forecast
 *
 * Run with: npm run test:performance
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  forecastGeoScore,
  batchForecast,
  clearForecastCache,
  getForecastCacheStats,
  type ForecastConfig,
  type BatchForecastInput,
} from "@/lib/ml/forecaster";
import type { HistoricalDataPoint } from "@/lib/ml/data-pipeline";

/**
 * Generate synthetic historical data for testing
 */
function generateHistoricalData(
  days: number,
  baseScore: number = 75,
  variance: number = 5
): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Add some trend and noise
    const trend = (i / days) * 10; // Slight upward trend
    const noise = (Math.random() - 0.5) * variance;
    const score = Math.min(100, Math.max(0, baseScore + trend + noise));

    data.push({
      date,
      score,
      brandId: "test-brand",
    });
  }

  return data;
}

describe("Forecaster Performance", () => {
  beforeEach(() => {
    clearForecastCache();
  });

  describe("Single Forecast Performance", () => {
    it("should complete 90-day forecast in under 100ms", async () => {
      const data = generateHistoricalData(180);
      const config: ForecastConfig = { periods: 90 };

      const startTime = performance.now();
      const result = await forecastGeoScore(data, config);
      const endTime = performance.now();

      const elapsedMs = endTime - startTime;

      expect(result.predictions).toHaveLength(90);
      expect(elapsedMs).toBeLessThan(100);
      expect(result.timing?.totalMs).toBeLessThan(100);
    });

    it("should complete 30-day forecast in under 50ms", async () => {
      const data = generateHistoricalData(180);
      const config: ForecastConfig = { periods: 30 };

      const startTime = performance.now();
      const result = await forecastGeoScore(data, config);
      const endTime = performance.now();

      const elapsedMs = endTime - startTime;

      expect(result.predictions).toHaveLength(30);
      expect(elapsedMs).toBeLessThan(50);
    });

    it("should handle large datasets (365 days) in under 200ms", async () => {
      const data = generateHistoricalData(365);
      const config: ForecastConfig = { periods: 90 };

      const startTime = performance.now();
      const result = await forecastGeoScore(data, config);
      const endTime = performance.now();

      const elapsedMs = endTime - startTime;

      expect(result.predictions).toHaveLength(90);
      expect(elapsedMs).toBeLessThan(200);
    });
  });

  describe("Cache Performance", () => {
    it("should return cached result in under 5ms", async () => {
      const data = generateHistoricalData(180);
      const config: ForecastConfig = { periods: 90, cacheKey: "perf-test" };

      // First call - cache miss
      await forecastGeoScore(data, config);

      // Second call - cache hit
      const startTime = performance.now();
      const result = await forecastGeoScore(data, config);
      const endTime = performance.now();

      const elapsedMs = endTime - startTime;

      expect(result.cached).toBe(true);
      expect(elapsedMs).toBeLessThan(5);
    });

    it("should manage cache size efficiently", async () => {
      const config: ForecastConfig = { periods: 30 };

      // Generate 50 different forecasts (minimum 91 days to satisfy 90-day validation)
      for (let i = 0; i < 50; i++) {
        const data = generateHistoricalData(91 + i);
        await forecastGeoScore(data, {
          ...config,
          cacheKey: `perf-test-${i}`,
        });
      }

      const stats = getForecastCacheStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
    });
  });

  describe("Batch Forecast Performance", () => {
    it("should process 5 forecasts in parallel under 200ms", async () => {
      const inputs: BatchForecastInput[] = [];

      for (let i = 0; i < 5; i++) {
        inputs.push({
          id: `brand-${i}`,
          data: generateHistoricalData(180),
          config: { periods: 90 },
        });
      }

      const startTime = performance.now();
      const result = await batchForecast(inputs, 5);
      const endTime = performance.now();

      const elapsedMs = endTime - startTime;

      expect(result.successCount).toBe(5);
      expect(result.failureCount).toBe(0);
      expect(elapsedMs).toBeLessThan(200);
      expect(result.totalMs).toBeLessThan(200);
    });

    it("should process 10 forecasts with concurrency 5 under 400ms", async () => {
      const inputs: BatchForecastInput[] = [];

      for (let i = 0; i < 10; i++) {
        inputs.push({
          id: `brand-${i}`,
          data: generateHistoricalData(180),
          config: { periods: 90 },
        });
      }

      const startTime = performance.now();
      const result = await batchForecast(inputs, 5);
      const endTime = performance.now();

      const elapsedMs = endTime - startTime;

      expect(result.successCount).toBe(10);
      expect(elapsedMs).toBeLessThan(400);
    });
  });

  describe("Memory Efficiency", () => {
    it("should not leak memory with repeated forecasts", async () => {
      const config: ForecastConfig = { periods: 90 };

      // Record initial memory
      const initialMemory = process.memoryUsage().heapUsed;

      // Run 100 forecasts
      for (let i = 0; i < 100; i++) {
        const data = generateHistoricalData(180);
        await forecastGeoScore(data, { ...config, skipCache: true });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Check memory increase is reasonable (< 50MB)
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

      expect(memoryIncrease).toBeLessThan(50);
    });
  });

  describe("Performance Timing Accuracy", () => {
    it("should provide accurate timing breakdown", async () => {
      const data = generateHistoricalData(180);
      const config: ForecastConfig = { periods: 90 };

      const result = await forecastGeoScore(data, config);

      expect(result.timing).toBeDefined();
      expect(result.timing!.dataPreparationMs).toBeGreaterThanOrEqual(0);
      expect(result.timing!.regressionCalculationMs).toBeGreaterThanOrEqual(0);
      expect(result.timing!.predictionGenerationMs).toBeGreaterThanOrEqual(0);
      expect(result.timing!.totalMs).toBeGreaterThanOrEqual(0);

      // Total should be approximately the sum of components
      const componentSum =
        result.timing!.dataPreparationMs +
        result.timing!.regressionCalculationMs +
        result.timing!.predictionGenerationMs;

      // Allow for some overhead (within 50ms)
      expect(Math.abs(result.timing!.totalMs - componentSum)).toBeLessThan(50);
    });
  });

  describe("API Response Time Simulation", () => {
    it("should simulate API response under 2s target", async () => {
      // Simulate full API workflow:
      // 1. Auth check (~50ms simulated)
      // 2. Cache check
      // 3. Data extraction
      // 4. Forecasting
      // 5. DB write (~100ms simulated)

      const startTime = performance.now();

      // Simulate auth delay
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Generate and forecast
      const data = generateHistoricalData(180);
      const config: ForecastConfig = { periods: 90, cacheKey: "api-sim" };
      const result = await forecastGeoScore(data, config);

      // Simulate DB write delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      const endTime = performance.now();
      const totalMs = endTime - startTime;

      expect(result.predictions).toHaveLength(90);
      expect(totalMs).toBeLessThan(2000); // API target: <2s
    });

    it("should meet training time target under 5 minutes", async () => {
      // Training involves processing historical data and generating forecasts
      // With batch processing, even 100 brands should complete quickly

      const startTime = performance.now();

      const inputs: BatchForecastInput[] = [];
      for (let i = 0; i < 20; i++) {
        inputs.push({
          id: `training-brand-${i}`,
          data: generateHistoricalData(365), // Full year of data
          config: { periods: 90 },
        });
      }

      const result = await batchForecast(inputs, 5);

      const endTime = performance.now();
      const totalMs = endTime - startTime;

      expect(result.successCount).toBe(20);
      expect(totalMs).toBeLessThan(5 * 60 * 1000); // Training target: <5min
      // In reality, 20 forecasts should complete in under 1 second
      expect(totalMs).toBeLessThan(1000);
    });
  });
});

describe("Performance Regression Tests", () => {
  beforeEach(() => {
    clearForecastCache();
  });

  it("should maintain consistent performance across runs", async () => {
    const data = generateHistoricalData(180);
    const config: ForecastConfig = { periods: 90, skipCache: true };
    const timings: number[] = [];

    // Run 10 forecasts and check consistency
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      await forecastGeoScore(data, config);
      const endTime = performance.now();
      timings.push(endTime - startTime);
    }

    // Calculate average and standard deviation
    const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
    const variance =
      timings.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) /
      timings.length;
    const stdDev = Math.sqrt(variance);

    // Standard deviation should be reasonable (less than 50% of average)
    expect(stdDev).toBeLessThan(avg * 0.5);

    // Average should be under target
    expect(avg).toBeLessThan(100);
  });
});
