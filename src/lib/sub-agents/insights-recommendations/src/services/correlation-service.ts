import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Correlation Service
 *
 * Provides advanced correlation analysis including:
 * - Pearson correlation coefficients
 * - Cross-platform data mapping
 * - Lagged correlation analysis
 * - Causal inference modeling
 * - Semantic relationship detection
 */

// Configuration Schema
export const CorrelationConfigSchema = z.object({
  minCorrelationThreshold: z.number().min(-1).max(1).default(0.5),
  significanceLevel: z.number().min(0).max(1).default(0.05),
  enableCausalInference: z.boolean().default(true),
  enableSemanticAnalysis: z.boolean().default(true),
  maxLagPeriods: z.number().min(1).default(7)
});

export type CorrelationConfig = z.infer<typeof CorrelationConfigSchema>;

// Metric Data
export interface MetricData {
  name: string;
  values: number[];
  timestamps: Date[];
}

// Correlation Request
export interface CorrelationRequest {
  brandId: string;
  metrics: MetricData[];
  includeLaggedAnalysis?: boolean;
  includeCausalAnalysis?: boolean;
  includeSemanticAnalysis?: boolean;
}

// Metric Correlation
export interface MetricCorrelation {
  metricA: string;
  metricB: string;
  coefficient: number;
  pValue?: number;
  isSignificant: boolean;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
}

// Lagged Correlation
export interface LaggedCorrelation extends MetricCorrelation {
  lag: number;
  leadingMetric: string;
}

// Causal Relationship
export interface CausalRelationship {
  cause: string;
  effect: string;
  confidence: number;
  lag: number;
  mechanism?: string;
}

// Semantic Relationship
export interface SemanticRelationship {
  metricA: string;
  metricB: string;
  relationshipType: 'similar' | 'complementary' | 'opposing' | 'causal';
  confidence: number;
  description?: string;
}

// Correlation Matrix
export interface CorrelationMatrix {
  metrics: string[];
  values: number[][];
}

// Correlation Result
export interface CorrelationResult {
  success: boolean;
  brandId: string;
  correlations: MetricCorrelation[];
  laggedCorrelations?: LaggedCorrelation[];
  causalRelationships?: CausalRelationship[];
  semanticRelationships?: SemanticRelationship[];
  processingTime: number;
  error?: string;
}

/**
 * Correlation Service
 */
export class CorrelationService extends EventEmitter {
  private config: CorrelationConfig;

  constructor(config: Partial<CorrelationConfig> = {}) {
    super();
    this.config = CorrelationConfigSchema.parse(config);
  }

  /**
   * Get current configuration
   */
  getConfig(): CorrelationConfig {
    return { ...this.config };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      return NaN;
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    if (denominator === 0) {
      return NaN;
    }

    return numerator / denominator;
  }

  /**
   * Analyze correlations between metrics
   */
  async analyze(request: CorrelationRequest): Promise<CorrelationResult> {
    const startTime = Date.now();

    // Validate request
    if (!request.brandId) {
      return this.createErrorResult('Brand ID is required', startTime);
    }

    if (request.metrics.length < 2) {
      return this.createErrorResult('At least 2 metrics are required for correlation analysis', startTime);
    }

    this.emit('analysis:start', { brandId: request.brandId, metricCount: request.metrics.length });

    const correlations: MetricCorrelation[] = [];
    const laggedCorrelations: LaggedCorrelation[] = [];
    const causalRelationships: CausalRelationship[] = [];
    const semanticRelationships: SemanticRelationship[] = [];

    // Calculate pairwise correlations
    for (let i = 0; i < request.metrics.length; i++) {
      for (let j = i + 1; j < request.metrics.length; j++) {
        const metricA = request.metrics[i];
        const metricB = request.metrics[j];

        // Align data (use minimum length)
        const minLength = Math.min(metricA.values.length, metricB.values.length);
        const valuesA = metricA.values.slice(0, minLength);
        const valuesB = metricB.values.slice(0, minLength);

        if (minLength < 2) continue;

        const coefficient = this.calculatePearsonCorrelation(valuesA, valuesB);

        if (!isNaN(coefficient)) {
          const correlation: MetricCorrelation = {
            metricA: metricA.name,
            metricB: metricB.name,
            coefficient,
            isSignificant: Math.abs(coefficient) >= this.config.minCorrelationThreshold,
            strength: this.getCorrelationStrength(coefficient)
          };

          correlations.push(correlation);
        }

        // Lagged correlation analysis
        if (request.includeLaggedAnalysis) {
          const lagged = this.calculateLaggedCorrelations(
            metricA.name,
            metricB.name,
            valuesA,
            valuesB
          );
          laggedCorrelations.push(...lagged);
        }

        // Causal inference
        if (request.includeCausalAnalysis && this.config.enableCausalInference) {
          const causal = this.inferCausality(
            metricA.name,
            metricB.name,
            valuesA,
            valuesB
          );
          if (causal) {
            causalRelationships.push(causal);
          }
        }

        // Semantic analysis
        if (request.includeSemanticAnalysis && this.config.enableSemanticAnalysis) {
          const semantic = this.analyzeSemanticRelationship(
            metricA.name,
            metricB.name,
            coefficient
          );
          if (semantic) {
            semanticRelationships.push(semantic);
          }
        }
      }
    }

    const result: CorrelationResult = {
      success: true,
      brandId: request.brandId,
      correlations,
      laggedCorrelations: request.includeLaggedAnalysis ? laggedCorrelations : undefined,
      causalRelationships: request.includeCausalAnalysis ? causalRelationships : [],
      semanticRelationships: request.includeSemanticAnalysis ? semanticRelationships : [],
      processingTime: Date.now() - startTime
    };

    this.emit('analysis:complete', result);

    return result;
  }

  /**
   * Generate a correlation matrix for multiple metrics
   */
  async generateCorrelationMatrix(request: CorrelationRequest): Promise<CorrelationMatrix> {
    const metrics = request.metrics.map(m => m.name);
    const n = metrics.length;
    const values: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          values[i][j] = 1.0;
        } else {
          const valuesA = request.metrics[i].values;
          const valuesB = request.metrics[j].values;
          const minLength = Math.min(valuesA.length, valuesB.length);

          values[i][j] = this.calculatePearsonCorrelation(
            valuesA.slice(0, minLength),
            valuesB.slice(0, minLength)
          );
        }
      }
    }

    return { metrics, values };
  }

  // Private methods

  private createErrorResult(error: string, startTime: number): CorrelationResult {
    return {
      success: false,
      brandId: '',
      correlations: [],
      causalRelationships: [],
      semanticRelationships: [],
      processingTime: Date.now() - startTime,
      error
    };
  }

  private getCorrelationStrength(coefficient: number): MetricCorrelation['strength'] {
    const abs = Math.abs(coefficient);
    if (abs >= 0.7) return 'strong';
    if (abs >= 0.4) return 'moderate';
    if (abs >= 0.2) return 'weak';
    return 'none';
  }

  private calculateLaggedCorrelations(
    nameA: string,
    nameB: string,
    valuesA: number[],
    valuesB: number[]
  ): LaggedCorrelation[] {
    const results: LaggedCorrelation[] = [];
    const maxLag = Math.min(this.config.maxLagPeriods, Math.floor(valuesA.length / 3));

    for (let lag = 1; lag <= maxLag; lag++) {
      // A leads B (B lags behind A)
      if (valuesA.length - lag >= 2) {
        const leadA = valuesA.slice(0, -lag);
        const lagB = valuesB.slice(lag);
        const minLen = Math.min(leadA.length, lagB.length);

        if (minLen >= 2) {
          const coefficient = this.calculatePearsonCorrelation(
            leadA.slice(0, minLen),
            lagB.slice(0, minLen)
          );

          if (!isNaN(coefficient) && Math.abs(coefficient) >= this.config.minCorrelationThreshold) {
            results.push({
              metricA: nameA,
              metricB: nameB,
              coefficient,
              lag,
              leadingMetric: nameA,
              isSignificant: Math.abs(coefficient) >= this.config.minCorrelationThreshold,
              strength: this.getCorrelationStrength(coefficient)
            });
          }
        }
      }

      // B leads A (A lags behind B)
      if (valuesB.length - lag >= 2) {
        const leadB = valuesB.slice(0, -lag);
        const lagA = valuesA.slice(lag);
        const minLen = Math.min(leadB.length, lagA.length);

        if (minLen >= 2) {
          const coefficient = this.calculatePearsonCorrelation(
            leadB.slice(0, minLen),
            lagA.slice(0, minLen)
          );

          if (!isNaN(coefficient) && Math.abs(coefficient) >= this.config.minCorrelationThreshold) {
            results.push({
              metricA: nameB,
              metricB: nameA,
              coefficient,
              lag,
              leadingMetric: nameB,
              isSignificant: Math.abs(coefficient) >= this.config.minCorrelationThreshold,
              strength: this.getCorrelationStrength(coefficient)
            });
          }
        }
      }
    }

    return results;
  }

  private inferCausality(
    nameA: string,
    nameB: string,
    valuesA: number[],
    valuesB: number[]
  ): CausalRelationship | null {
    // Simple Granger-like causality test
    // Check if past values of one metric help predict the other
    const laggedCorrs = this.calculateLaggedCorrelations(nameA, nameB, valuesA, valuesB);

    if (laggedCorrs.length === 0) return null;

    // Find the strongest lagged correlation
    const strongest = laggedCorrs.reduce((best, curr) =>
      Math.abs(curr.coefficient) > Math.abs(best.coefficient) ? curr : best
    );

    if (Math.abs(strongest.coefficient) < this.config.minCorrelationThreshold) {
      return null;
    }

    return {
      cause: strongest.leadingMetric,
      effect: strongest.leadingMetric === nameA ? nameB : nameA,
      confidence: Math.abs(strongest.coefficient),
      lag: strongest.lag,
      mechanism: `${strongest.leadingMetric} appears to lead ${strongest.leadingMetric === nameA ? nameB : nameA} by ${strongest.lag} period(s)`
    };
  }

  private analyzeSemanticRelationship(
    nameA: string,
    nameB: string,
    coefficient: number
  ): SemanticRelationship | null {
    if (isNaN(coefficient)) return null;

    let relationshipType: SemanticRelationship['relationshipType'];
    let description: string;

    if (coefficient >= 0.7) {
      relationshipType = 'similar';
      description = `${nameA} and ${nameB} show strong positive correlation, suggesting they measure similar phenomena`;
    } else if (coefficient <= -0.7) {
      relationshipType = 'opposing';
      description = `${nameA} and ${nameB} show strong negative correlation, suggesting they have an inverse relationship`;
    } else if (Math.abs(coefficient) >= 0.4) {
      relationshipType = 'complementary';
      description = `${nameA} and ${nameB} show moderate correlation, suggesting they complement each other`;
    } else {
      return null; // Too weak to establish semantic relationship
    }

    return {
      metricA: nameA,
      metricB: nameB,
      relationshipType,
      confidence: Math.abs(coefficient),
      description
    };
  }
}

/**
 * Factory function
 */
export function createCorrelationService(
  config: Partial<CorrelationConfig> = {}
): CorrelationService {
  return new CorrelationService(config);
}
