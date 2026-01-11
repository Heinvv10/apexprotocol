import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Insights Engine Service
 *
 * Provides intelligent insights generation including:
 * - Performance trend analysis
 * - Opportunity detection
 * - Risk assessment
 * - Anomaly detection
 * - Competitive intelligence
 */

// Insight Types
export type InsightType =
  | 'performance_trend'
  | 'opportunity'
  | 'risk'
  | 'anomaly'
  | 'competitive_intelligence'
  | 'correlation';

// Trend Direction
export type TrendDirection = 'up' | 'down' | 'stable';

// Configuration Schema
export const InsightsEngineConfigSchema = z.object({
  minConfidenceThreshold: z.number().min(0).max(100).default(70),
  enableTrendAnalysis: z.boolean().default(true),
  enableOpportunityDetection: z.boolean().default(true),
  enableRiskAssessment: z.boolean().default(true),
  enableAnomalyDetection: z.boolean().default(true),
  enableCompetitiveAnalysis: z.boolean().default(true),
  historicalWindowDays: z.number().min(1).default(90),
  anomalyStdDevThreshold: z.number().min(1).default(2)
});

export type InsightsEngineConfig = z.infer<typeof InsightsEngineConfigSchema>;

// Metric Data
export interface MetricData {
  current: number;
  previous: number;
  historical: number[];
  trend: TrendDirection;
}

// Competitor Data
export interface CompetitorInfo {
  name: string;
  shareOfVoice?: number;
  trend?: TrendDirection;
}

export interface CompetitorData {
  competitors?: CompetitorInfo[];
  industryAverage?: number;
  topPerformer?: number;
  averageMarketShare?: number;
  topCompetitorShare?: number;
}

// Insight Request
export interface InsightRequest {
  brandId: string;
  metrics: Record<string, MetricData>;
  competitorData?: CompetitorData;
  focusAreas?: InsightType[];
}

// Base Insight
export interface Insight {
  id: string;
  brandId: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  dataPoints: string[];
  createdAt: Date;
  expiresAt?: Date;
}

// Trend Insight
export interface TrendInsight extends Insight {
  type: 'performance_trend';
  metric: string;
  direction: TrendDirection;
  changePercent: number;
  historicalContext: string;
}

// Opportunity Insight
export interface OpportunityInsight extends Insight {
  type: 'opportunity';
  potentialImpact: {
    metric: string;
    improvement: number;
    timeframe: string;
  };
  actionRequired: string;
}

// Risk Insight
export interface RiskInsight extends Insight {
  type: 'risk';
  severity: 'high' | 'medium' | 'low';
  probability: number;
  mitigationSuggestions: string[];
}

// Anomaly Insight
export interface AnomalyInsight extends Insight {
  type: 'anomaly';
  metric: string;
  anomalyType: 'spike' | 'drop' | 'pattern_break';
  expectedValue: number;
  actualValue: number;
  deviation: number;
}

// Competitive Insight
export interface CompetitiveInsight extends Insight {
  type: 'competitive_intelligence';
  benchmarkPosition: 'above_average' | 'average' | 'below_average';
  competitorComparison?: {
    competitor: string;
    ourValue: number;
    theirValue: number;
    gap: number;
  }[];
}

// Insight Result
export interface InsightResult {
  success: boolean;
  brandId: string;
  insights: Insight[];
  processingTime: number;
  error?: string;
}

/**
 * Insights Engine Service
 */
export class InsightsEngineService extends EventEmitter {
  private config: InsightsEngineConfig;
  private insights: Map<string, Insight>;
  private idCounter: number = 0;

  constructor(config: Partial<InsightsEngineConfig> = {}) {
    super();
    this.config = InsightsEngineConfigSchema.parse(config);
    this.insights = new Map();
  }

  /**
   * Get current configuration
   */
  getConfig(): InsightsEngineConfig {
    return { ...this.config };
  }

  /**
   * Generate insights from metrics
   */
  async generateInsights(request: InsightRequest): Promise<InsightResult> {
    const startTime = Date.now();

    // Validate request
    if (!request.brandId) {
      return this.createErrorResult('Brand ID is required', startTime);
    }

    this.emit('generation:start', { brandId: request.brandId });

    const insights: Insight[] = [];
    const focusAreas = request.focusAreas || [
      'performance_trend',
      'opportunity',
      'risk',
      'anomaly',
      'competitive_intelligence'
    ];

    // Generate trend insights
    if (focusAreas.includes('performance_trend') && this.config.enableTrendAnalysis) {
      const trendInsights = this.generateTrendInsights(request);
      insights.push(...trendInsights);
    }

    // Generate opportunity insights
    if (focusAreas.includes('opportunity') && this.config.enableOpportunityDetection) {
      const opportunityInsights = this.generateOpportunityInsights(request);
      insights.push(...opportunityInsights);
    }

    // Generate risk insights
    if (focusAreas.includes('risk') && this.config.enableRiskAssessment) {
      const riskInsights = this.generateRiskInsights(request);
      insights.push(...riskInsights);
    }

    // Generate anomaly insights
    if (focusAreas.includes('anomaly') && this.config.enableAnomalyDetection) {
      const anomalyInsights = this.generateAnomalyInsights(request);
      insights.push(...anomalyInsights);
    }

    // Generate competitive insights
    if (focusAreas.includes('competitive_intelligence') && this.config.enableCompetitiveAnalysis) {
      const competitiveInsights = this.generateCompetitiveInsights(request);
      insights.push(...competitiveInsights);
    }

    // Filter by confidence threshold
    const filteredInsights = insights.filter(i => i.confidence >= this.config.minConfidenceThreshold);

    // Store insights
    filteredInsights.forEach(insight => {
      this.insights.set(insight.id, insight);
      this.emit('insight:generated', insight);
    });

    const result: InsightResult = {
      success: true,
      brandId: request.brandId,
      insights: filteredInsights,
      processingTime: Date.now() - startTime
    };

    this.emit('generation:complete', result);

    return result;
  }

  /**
   * Get insight by ID
   */
  getInsight(id: string): Insight | undefined {
    return this.insights.get(id);
  }

  /**
   * Get all insights for a brand
   */
  getInsightsForBrand(brandId: string): Insight[] {
    return Array.from(this.insights.values()).filter(i => i.brandId === brandId);
  }

  // Private methods

  private createErrorResult(error: string, startTime: number): InsightResult {
    return {
      success: false,
      brandId: '',
      insights: [],
      processingTime: Date.now() - startTime,
      error
    };
  }

  private generateId(): string {
    this.idCounter++;
    return `insight_${Date.now()}_${this.idCounter}`;
  }

  private generateTrendInsights(request: InsightRequest): TrendInsight[] {
    const insights: TrendInsight[] = [];

    Object.entries(request.metrics).forEach(([metricName, data]) => {
      const changePercent = data.previous !== 0
        ? ((data.current - data.previous) / data.previous) * 100
        : 0;

      const direction = data.trend;
      const confidence = this.calculateTrendConfidence(data);
      const impact = this.assessImpact(Math.abs(changePercent));

      if (Math.abs(changePercent) >= 5) { // Only report significant changes
        const directionWord = direction === 'up' ? 'Increasing' : direction === 'down' ? 'Decreasing' : 'Stable';

        insights.push({
          id: this.generateId(),
          brandId: request.brandId,
          type: 'performance_trend',
          title: `${metricName.replace(/_/g, ' ')} ${directionWord}`,
          description: `The ${metricName.replace(/_/g, ' ')} metric has ${direction === 'up' ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(1)}% compared to the previous period.`,
          confidence,
          impact,
          dataPoints: [metricName],
          createdAt: new Date(),
          metric: metricName,
          direction,
          changePercent,
          historicalContext: this.getHistoricalContext(data)
        });
      }
    });

    return insights;
  }

  private generateOpportunityInsights(request: InsightRequest): OpportunityInsight[] {
    const insights: OpportunityInsight[] = [];

    Object.entries(request.metrics).forEach(([metricName, data]) => {
      // Growing metrics represent opportunities
      if (data.trend === 'up') {
        const changePercent = data.previous !== 0
          ? ((data.current - data.previous) / data.previous) * 100
          : 0;

        if (changePercent >= 10) {
          insights.push({
            id: this.generateId(),
            brandId: request.brandId,
            type: 'opportunity',
            title: `Growth Opportunity in ${metricName.replace(/_/g, ' ')}`,
            description: `The ${metricName.replace(/_/g, ' ')} shows strong growth momentum, suggesting potential for further optimization.`,
            confidence: this.calculateTrendConfidence(data),
            impact: 'high',
            dataPoints: [metricName],
            createdAt: new Date(),
            potentialImpact: {
              metric: metricName,
              improvement: Math.min(changePercent * 1.5, 50),
              timeframe: '3 months'
            },
            actionRequired: `Capitalize on the positive trend in ${metricName.replace(/_/g, ' ')} with targeted optimization strategies.`
          });
        }
      }

      // Compare to competitor data if available
      if (request.competitorData?.industryAverage && data.current < request.competitorData.industryAverage) {
        insights.push({
          id: this.generateId(),
          brandId: request.brandId,
          type: 'opportunity',
          title: `Market Gap Opportunity for ${metricName.replace(/_/g, ' ')}`,
          description: `Performance is below industry average, indicating room for improvement.`,
          confidence: 75,
          impact: 'medium',
          dataPoints: [metricName],
          createdAt: new Date(),
          potentialImpact: {
            metric: metricName,
            improvement: ((request.competitorData.industryAverage - data.current) / data.current) * 100,
            timeframe: '6 months'
          },
          actionRequired: 'Analyze top performers and implement best practices.'
        });
      }
    });

    return insights;
  }

  private generateRiskInsights(request: InsightRequest): RiskInsight[] {
    const insights: RiskInsight[] = [];

    Object.entries(request.metrics).forEach(([metricName, data]) => {
      // Declining metrics represent risks
      if (data.trend === 'down') {
        const changePercent = data.previous !== 0
          ? ((data.current - data.previous) / data.previous) * 100
          : 0;

        if (changePercent <= -10) {
          const severity = Math.abs(changePercent) >= 30 ? 'high' : Math.abs(changePercent) >= 20 ? 'medium' : 'low';

          insights.push({
            id: this.generateId(),
            brandId: request.brandId,
            type: 'risk',
            title: `Declining ${metricName.replace(/_/g, ' ')} Risk`,
            description: `The ${metricName.replace(/_/g, ' ')} has declined by ${Math.abs(changePercent).toFixed(1)}%, requiring attention.`,
            confidence: this.calculateTrendConfidence(data),
            impact: severity === 'high' ? 'high' : 'medium',
            dataPoints: [metricName],
            createdAt: new Date(),
            severity,
            probability: Math.min(80 + Math.abs(changePercent), 95),
            mitigationSuggestions: this.generateMitigationSuggestions(metricName, severity)
          });
        }
      }
    });

    return insights;
  }

  private generateAnomalyInsights(request: InsightRequest): AnomalyInsight[] {
    const insights: AnomalyInsight[] = [];

    Object.entries(request.metrics).forEach(([metricName, data]) => {
      if (data.historical.length < 3) return;

      const mean = data.historical.reduce((a, b) => a + b, 0) / data.historical.length;
      const stdDev = Math.sqrt(
        data.historical.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.historical.length
      );

      const deviation = stdDev !== 0 ? Math.abs(data.current - mean) / stdDev : 0;

      if (deviation >= this.config.anomalyStdDevThreshold) {
        const anomalyType = data.current > mean ? 'spike' : 'drop';

        insights.push({
          id: this.generateId(),
          brandId: request.brandId,
          type: 'anomaly',
          title: `Unusual ${anomalyType} in ${metricName.replace(/_/g, ' ')}`,
          description: `An unusual ${anomalyType} was detected in ${metricName.replace(/_/g, ' ')}. The current value deviates significantly from historical patterns.`,
          confidence: Math.min(70 + deviation * 5, 95),
          impact: 'high',
          dataPoints: [metricName],
          createdAt: new Date(),
          metric: metricName,
          anomalyType,
          expectedValue: mean,
          actualValue: data.current,
          deviation
        });
      }
    });

    return insights;
  }

  private generateCompetitiveInsights(request: InsightRequest): CompetitiveInsight[] {
    const insights: CompetitiveInsight[] = [];

    if (!request.competitorData) return insights;

    Object.entries(request.metrics).forEach(([metricName, data]) => {
      let benchmarkPosition: CompetitiveInsight['benchmarkPosition'] = 'average';
      let comparisonText = '';

      // Generate insight when industryAverage is provided
      if (request.competitorData?.industryAverage) {
        const ratio = data.current / request.competitorData.industryAverage;
        if (ratio > 1.1) {
          benchmarkPosition = 'above_average';
          comparisonText = 'above industry average';
        } else if (ratio < 0.9) {
          benchmarkPosition = 'below_average';
          comparisonText = 'below industry average';
        } else {
          comparisonText = 'at industry average';
        }

        insights.push({
          id: this.generateId(),
          brandId: request.brandId,
          type: 'competitive_intelligence',
          title: `Competitive Position for ${metricName.replace(/_/g, ' ')}`,
          description: `Your ${metricName.replace(/_/g, ' ')} is currently ${comparisonText}.`,
          confidence: 80,
          impact: benchmarkPosition === 'below_average' ? 'high' : 'medium',
          dataPoints: [metricName],
          createdAt: new Date(),
          benchmarkPosition,
          competitorComparison: request.competitorData.competitors?.map(comp => ({
            competitor: comp.name,
            ourValue: data.current,
            theirValue: comp.shareOfVoice || 0,
            gap: data.current - (comp.shareOfVoice || 0)
          }))
        });
      }
      // Generate insight when competitors array is provided (without industryAverage)
      else if (request.competitorData?.competitors && request.competitorData.competitors.length > 0) {
        // Calculate benchmark position based on competitor comparison
        const competitorValues = request.competitorData.competitors.map(c => c.shareOfVoice || 0);
        const avgCompetitorValue = competitorValues.reduce((a, b) => a + b, 0) / competitorValues.length;

        if (data.current > avgCompetitorValue * 1.1) {
          benchmarkPosition = 'above_average';
          comparisonText = 'performing better than competitors';
        } else if (data.current < avgCompetitorValue * 0.9) {
          benchmarkPosition = 'below_average';
          comparisonText = 'performing below competitors';
        } else {
          comparisonText = 'on par with competitors';
        }

        insights.push({
          id: this.generateId(),
          brandId: request.brandId,
          type: 'competitive_intelligence',
          title: `Competitive Analysis for ${metricName.replace(/_/g, ' ')}`,
          description: `Your ${metricName.replace(/_/g, ' ')} is currently ${comparisonText}.`,
          confidence: 75,
          impact: benchmarkPosition === 'below_average' ? 'high' : 'medium',
          dataPoints: [metricName],
          createdAt: new Date(),
          benchmarkPosition,
          competitorComparison: request.competitorData.competitors.map(comp => ({
            competitor: comp.name,
            ourValue: data.current,
            theirValue: comp.shareOfVoice || 0,
            gap: data.current - (comp.shareOfVoice || 0)
          }))
        });
      }
    });

    return insights;
  }

  private calculateTrendConfidence(data: MetricData): number {
    const historicalLength = data.historical.length;
    const baseConfidence = Math.min(50 + historicalLength * 5, 85);

    // Increase confidence for consistent trends
    let consistentPoints = 0;
    for (let i = 1; i < data.historical.length; i++) {
      const direction = data.historical[i] > data.historical[i - 1] ? 'up' : data.historical[i] < data.historical[i - 1] ? 'down' : 'stable';
      if (direction === data.trend) consistentPoints++;
    }

    const consistencyBonus = (consistentPoints / Math.max(data.historical.length - 1, 1)) * 15;

    return Math.min(baseConfidence + consistencyBonus, 95);
  }

  private assessImpact(changePercent: number): 'high' | 'medium' | 'low' {
    if (changePercent >= 25) return 'high';
    if (changePercent >= 10) return 'medium';
    return 'low';
  }

  private getHistoricalContext(data: MetricData): string {
    const len = data.historical.length;
    if (len < 2) return 'Insufficient historical data';

    const start = data.historical[0];
    const end = data.historical[len - 1];
    const overallChange = start !== 0 ? ((end - start) / start) * 100 : 0;

    if (overallChange > 20) return 'Strong positive trajectory over the historical period';
    if (overallChange > 5) return 'Moderate positive growth over the historical period';
    if (overallChange < -20) return 'Significant decline over the historical period';
    if (overallChange < -5) return 'Moderate decline over the historical period';
    return 'Relatively stable over the historical period';
  }

  private generateMitigationSuggestions(metricName: string, severity: 'high' | 'medium' | 'low'): string[] {
    const baseSuggestions = [
      `Conduct a root cause analysis for ${metricName.replace(/_/g, ' ')} decline`,
      'Review recent changes that may have affected performance',
      'Benchmark against competitors to identify improvement areas'
    ];

    if (severity === 'high') {
      return [
        'Immediate action required: escalate to stakeholders',
        ...baseSuggestions,
        'Consider allocating additional resources to address the issue'
      ];
    }

    if (severity === 'medium') {
      return [
        ...baseSuggestions,
        'Monitor closely over the next period'
      ];
    }

    return [
      'Continue monitoring the metric',
      'Review if this aligns with expected seasonal patterns'
    ];
  }
}

/**
 * Factory function
 */
export function createInsightsEngineService(
  config: Partial<InsightsEngineConfig> = {}
): InsightsEngineService {
  return new InsightsEngineService(config);
}
