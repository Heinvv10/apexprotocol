import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CorrelationService,
  createCorrelationService,
  type CorrelationConfig,
  type CorrelationRequest,
  type CorrelationResult,
  type MetricCorrelation,
  type CausalRelationship,
  type SemanticRelationship
} from '../src/services/correlation-service';

describe('CorrelationService', () => {
  let service: CorrelationService;

  beforeEach(() => {
    service = createCorrelationService();
  });

  afterEach(() => {
    service.removeAllListeners();
  });

  describe('Initialization', () => {
    it('should create a service with default configuration', () => {
      const config = service.getConfig();

      expect(config.minCorrelationThreshold).toBe(0.5);
      expect(config.significanceLevel).toBe(0.05);
      expect(config.enableCausalInference).toBe(true);
      expect(config.enableSemanticAnalysis).toBe(true);
      expect(config.maxLagPeriods).toBe(7);
    });

    it('should create a service with custom configuration', () => {
      const customService = createCorrelationService({
        minCorrelationThreshold: 0.7,
        significanceLevel: 0.01,
        enableCausalInference: false,
        maxLagPeriods: 14
      });
      const config = customService.getConfig();

      expect(config.minCorrelationThreshold).toBe(0.7);
      expect(config.significanceLevel).toBe(0.01);
      expect(config.enableCausalInference).toBe(false);
      expect(config.maxLagPeriods).toBe(14);
    });

    it('should validate configuration with zod schema', () => {
      expect(() => createCorrelationService({
        minCorrelationThreshold: 1.5 // Invalid: must be <= 1
      })).toThrow();

      expect(() => createCorrelationService({
        significanceLevel: -0.1 // Invalid: must be >= 0
      })).toThrow();
    });

    it('should use factory function to create service', () => {
      const factoryService = createCorrelationService();
      expect(factoryService).toBeInstanceOf(CorrelationService);
    });
  });

  describe('Pearson Correlation', () => {
    it('should calculate perfect positive correlation', () => {
      const metricsA = [1, 2, 3, 4, 5];
      const metricsB = [2, 4, 6, 8, 10];

      const correlation = service.calculatePearsonCorrelation(metricsA, metricsB);

      expect(correlation).toBeCloseTo(1.0, 5);
    });

    it('should calculate perfect negative correlation', () => {
      const metricsA = [1, 2, 3, 4, 5];
      const metricsB = [10, 8, 6, 4, 2];

      const correlation = service.calculatePearsonCorrelation(metricsA, metricsB);

      expect(correlation).toBeCloseTo(-1.0, 5);
    });

    it('should calculate zero correlation for uncorrelated data', () => {
      const metricsA = [1, 2, 3, 4, 5];
      const metricsB = [3, 3, 3, 3, 3]; // Constant, no variance

      const correlation = service.calculatePearsonCorrelation(metricsA, metricsB);

      // When one series has no variance, correlation is undefined (NaN)
      expect(isNaN(correlation)).toBe(true);
    });

    it('should return NaN for mismatched array lengths', () => {
      const metricsA = [1, 2, 3, 4, 5];
      const metricsB = [1, 2, 3];

      const correlation = service.calculatePearsonCorrelation(metricsA, metricsB);

      expect(isNaN(correlation)).toBe(true);
    });

    it('should return NaN for empty arrays', () => {
      const correlation = service.calculatePearsonCorrelation([], []);

      expect(isNaN(correlation)).toBe(true);
    });

    it('should calculate moderate positive correlation', () => {
      const metricsA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const metricsB = [2, 3, 3, 5, 6, 7, 6, 9, 8, 11];

      const correlation = service.calculatePearsonCorrelation(metricsA, metricsB);

      expect(correlation).toBeGreaterThan(0.8);
      expect(correlation).toBeLessThan(1.0);
    });
  });

  describe('Cross-Platform Correlation Analysis', () => {
    it('should analyze correlations between metrics', async () => {
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          {
            name: 'mentions',
            values: [10, 20, 30, 40, 50],
            timestamps: [
              new Date('2024-01-01'),
              new Date('2024-01-02'),
              new Date('2024-01-03'),
              new Date('2024-01-04'),
              new Date('2024-01-05')
            ]
          },
          {
            name: 'engagement',
            values: [100, 200, 300, 400, 500],
            timestamps: [
              new Date('2024-01-01'),
              new Date('2024-01-02'),
              new Date('2024-01-03'),
              new Date('2024-01-04'),
              new Date('2024-01-05')
            ]
          }
        ]
      };

      const result = await service.analyze(request);

      expect(result.success).toBe(true);
      expect(result.correlations.length).toBeGreaterThan(0);
    });

    it('should identify significant correlations', async () => {
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          { name: 'metricA', values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], timestamps: [] },
          { name: 'metricB', values: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20], timestamps: [] }
        ]
      };

      const result = await service.analyze(request);

      expect(result.success).toBe(true);
      const correlation = result.correlations[0];
      expect(correlation.coefficient).toBeCloseTo(1.0, 5);
      expect(correlation.isSignificant).toBe(true);
    });

    it('should filter out weak correlations', async () => {
      const highThresholdService = createCorrelationService({
        minCorrelationThreshold: 0.95
      });

      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          { name: 'metricA', values: [1, 2, 3, 4, 5], timestamps: [] },
          { name: 'metricB', values: [1, 3, 2, 5, 4], timestamps: [] } // Weak correlation
        ]
      };

      const result = await highThresholdService.analyze(request);

      // Should have 0 correlations above 0.95 threshold
      expect(result.correlations.filter(c => Math.abs(c.coefficient) >= 0.95)).toHaveLength(0);
    });

    it('should emit analysis:start event', async () => {
      const spy = vi.fn();
      service.on('analysis:start', spy);

      await service.analyze({
        brandId: 'brand-123',
        metrics: [
          { name: 'a', values: [1, 2, 3], timestamps: [] },
          { name: 'b', values: [1, 2, 3], timestamps: [] }
        ]
      });

      expect(spy).toHaveBeenCalled();
    });

    it('should emit analysis:complete event', async () => {
      const spy = vi.fn();
      service.on('analysis:complete', spy);

      await service.analyze({
        brandId: 'brand-123',
        metrics: [
          { name: 'a', values: [1, 2, 3], timestamps: [] },
          { name: 'b', values: [1, 2, 3], timestamps: [] }
        ]
      });

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0].success).toBe(true);
    });
  });

  describe('Lagged Correlation Analysis', () => {
    it('should detect lagged correlations', async () => {
      // Metric B leads Metric A by one period
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          { name: 'leadingMetric', values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], timestamps: [] },
          { name: 'laggingMetric', values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], timestamps: [] }
        ],
        includeLaggedAnalysis: true
      };

      const result = await service.analyze(request);

      expect(result.success).toBe(true);
      expect(result.laggedCorrelations).toBeDefined();
    });

    it('should identify optimal lag period', async () => {
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          { name: 'cause', values: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], timestamps: [] },
          { name: 'effect', values: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90], timestamps: [] } // 1 period lag
        ],
        includeLaggedAnalysis: true
      };

      const result = await service.analyze(request);

      if (result.laggedCorrelations && result.laggedCorrelations.length > 0) {
        const bestLag = result.laggedCorrelations.reduce((best, curr) =>
          Math.abs(curr.coefficient) > Math.abs(best.coefficient) ? curr : best
        );
        expect(bestLag.lag).toBeDefined();
      }
    });
  });

  describe('Causal Inference', () => {
    it('should infer causal relationships when enabled', async () => {
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          { name: 'cause', values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], timestamps: [] },
          { name: 'effect', values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], timestamps: [] }
        ],
        includeCausalAnalysis: true
      };

      const result = await service.analyze(request);

      expect(result.causalRelationships).toBeDefined();
    });

    it('should not include causal analysis when disabled', async () => {
      const noCausalService = createCorrelationService({
        enableCausalInference: false
      });

      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          { name: 'a', values: [1, 2, 3, 4, 5], timestamps: [] },
          { name: 'b', values: [2, 3, 4, 5, 6], timestamps: [] }
        ],
        includeCausalAnalysis: true
      };

      const result = await noCausalService.analyze(request);

      expect(result.causalRelationships).toHaveLength(0);
    });

    it('should identify direction of causality', async () => {
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          { name: 'mentions', values: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], timestamps: [] },
          { name: 'engagement', values: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50], timestamps: [] }
        ],
        includeCausalAnalysis: true
      };

      const result = await service.analyze(request);

      if (result.causalRelationships && result.causalRelationships.length > 0) {
        const relationship = result.causalRelationships[0];
        expect(relationship.cause).toBeDefined();
        expect(relationship.effect).toBeDefined();
        expect(relationship.confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('Semantic Relationship Detection', () => {
    it('should detect semantic relationships between metrics', async () => {
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          { name: 'brand_sentiment', values: [0.7, 0.8, 0.75, 0.85, 0.9], timestamps: [] },
          { name: 'customer_satisfaction', values: [70, 80, 75, 85, 90], timestamps: [] }
        ],
        includeSemanticAnalysis: true
      };

      const result = await service.analyze(request);

      expect(result.semanticRelationships).toBeDefined();
    });

    it('should not include semantic analysis when disabled', async () => {
      const noSemanticService = createCorrelationService({
        enableSemanticAnalysis: false
      });

      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          { name: 'a', values: [1, 2, 3], timestamps: [] },
          { name: 'b', values: [4, 5, 6], timestamps: [] }
        ],
        includeSemanticAnalysis: true
      };

      const result = await noSemanticService.analyze(request);

      expect(result.semanticRelationships).toHaveLength(0);
    });
  });

  describe('Correlation Matrix', () => {
    it('should generate correlation matrix for multiple metrics', async () => {
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          { name: 'metric1', values: [1, 2, 3, 4, 5], timestamps: [] },
          { name: 'metric2', values: [2, 4, 6, 8, 10], timestamps: [] },
          { name: 'metric3', values: [5, 4, 3, 2, 1], timestamps: [] }
        ]
      };

      const matrix = await service.generateCorrelationMatrix(request);

      expect(matrix).toBeDefined();
      expect(matrix.metrics).toEqual(['metric1', 'metric2', 'metric3']);
      expect(matrix.values.length).toBe(3);
      expect(matrix.values[0].length).toBe(3);

      // Diagonal should be 1.0
      expect(matrix.values[0][0]).toBeCloseTo(1.0, 5);
      expect(matrix.values[1][1]).toBeCloseTo(1.0, 5);
      expect(matrix.values[2][2]).toBeCloseTo(1.0, 5);

      // metric1 and metric2 should be perfectly correlated
      expect(matrix.values[0][1]).toBeCloseTo(1.0, 5);

      // metric1 and metric3 should be negatively correlated
      expect(matrix.values[0][2]).toBeCloseTo(-1.0, 5);
    });
  });

  describe('Time Series Alignment', () => {
    it('should align time series data before correlation', async () => {
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          {
            name: 'metricA',
            values: [10, 20, 30],
            timestamps: [new Date('2024-01-01'), new Date('2024-01-02'), new Date('2024-01-03')]
          },
          {
            name: 'metricB',
            values: [15, 25, 35],
            timestamps: [new Date('2024-01-01'), new Date('2024-01-02'), new Date('2024-01-03')]
          }
        ]
      };

      const result = await service.analyze(request);

      expect(result.success).toBe(true);
    });

    it('should handle missing data points gracefully', async () => {
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          {
            name: 'metricA',
            values: [10, 20, 30, 40],
            timestamps: [
              new Date('2024-01-01'),
              new Date('2024-01-02'),
              new Date('2024-01-03'),
              new Date('2024-01-04')
            ]
          },
          {
            name: 'metricB',
            values: [15, 25], // Fewer data points
            timestamps: [new Date('2024-01-01'), new Date('2024-01-02')]
          }
        ]
      };

      const result = await service.analyze(request);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty metrics array', async () => {
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: []
      };

      const result = await service.analyze(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('At least 2 metrics are required for correlation analysis');
    });

    it('should handle single metric', async () => {
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [{ name: 'only', values: [1, 2, 3], timestamps: [] }]
      };

      const result = await service.analyze(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('At least 2 metrics are required for correlation analysis');
    });

    it('should handle missing brand ID', async () => {
      const request: CorrelationRequest = {
        brandId: '',
        metrics: [
          { name: 'a', values: [1, 2, 3], timestamps: [] },
          { name: 'b', values: [4, 5, 6], timestamps: [] }
        ]
      };

      const result = await service.analyze(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Brand ID is required');
    });
  });

  describe('Performance', () => {
    it('should include processing time in result', async () => {
      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          { name: 'a', values: [1, 2, 3, 4, 5], timestamps: [] },
          { name: 'b', values: [2, 4, 6, 8, 10], timestamps: [] }
        ]
      };

      const result = await service.analyze(request);

      expect(result.processingTime).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle large datasets efficiently', async () => {
      const largeValues = Array.from({ length: 1000 }, (_, i) => i);

      const request: CorrelationRequest = {
        brandId: 'brand-123',
        metrics: [
          { name: 'large1', values: largeValues, timestamps: [] },
          { name: 'large2', values: largeValues.map(v => v * 2), timestamps: [] }
        ]
      };

      const startTime = Date.now();
      const result = await service.analyze(request);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
