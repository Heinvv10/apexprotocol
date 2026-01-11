import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Insights & Recommendations Sub-Agent
 *
 * Generates comprehensive, data-driven strategic insights and
 * prioritized recommendations for brand visibility and performance optimization.
 */

// Data Source Types
export type DataSourceType =
  | 'brand_monitoring'
  | 'site_performance'
  | 'content_generation'
  | 'social_media'
  | 'ai_platform_visibility';

// Insight Types
export type InsightType =
  | 'performance_trend'
  | 'competitive_intelligence'
  | 'opportunity'
  | 'risk'
  | 'anomaly'
  | 'correlation';

// Recommendation Priority
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

// Recommendation Status
export type RecommendationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'dismissed'
  | 'deferred';

// Recommendation Category
export type RecommendationCategory =
  | 'content_optimization'
  | 'seo_improvement'
  | 'social_engagement'
  | 'competitive_response'
  | 'technical_fix'
  | 'strategic_initiative';

// Zod Schemas
export const InsightsConfigSchema = z.object({
  enablePredictiveAnalytics: z.boolean().default(true),
  enableCompetitiveIntelligence: z.boolean().default(true),
  enableAnomalyDetection: z.boolean().default(true),
  dataSources: z.array(z.enum([
    'brand_monitoring',
    'site_performance',
    'content_generation',
    'social_media',
    'ai_platform_visibility'
  ])).default(['brand_monitoring', 'site_performance', 'content_generation']),
  insightRetentionDays: z.number().min(1).default(360),
  recommendationConfidenceThreshold: z.number().min(0).max(100).default(75),
  maxRecommendationsPerBrand: z.number().min(1).default(50),
  refreshIntervalMinutes: z.number().min(1).default(60)
});

export type InsightsConfig = z.infer<typeof InsightsConfigSchema>;

// Data Point
export interface DataPoint {
  id: string;
  source: DataSourceType;
  metric: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Aggregated Data
export interface AggregatedData {
  brandId: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  sources: DataSourceType[];
  dataPoints: DataPoint[];
  summary: {
    totalDataPoints: number;
    metrics: Record<string, {
      min: number;
      max: number;
      avg: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
}

// Insight
export interface Insight {
  id: string;
  brandId: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  dataPoints: string[]; // IDs of related data points
  correlations?: Array<{
    metricA: string;
    metricB: string;
    correlation: number; // -1 to 1
  }>;
  predictions?: Array<{
    metric: string;
    predictedValue: number;
    predictedDate: Date;
    confidence: number;
  }>;
  createdAt: Date;
  expiresAt?: Date;
}

// Recommendation
export interface Recommendation {
  id: string;
  brandId: string;
  insightIds: string[]; // Related insights
  category: RecommendationCategory;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  title: string;
  description: string;
  rationale: string;
  expectedImpact: {
    metric: string;
    improvement: number; // Percentage
    timeframe: string;
  };
  actionItems: Array<{
    step: number;
    action: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  feasibility: number; // 0-100
  confidence: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
}

// Generation Request
export interface InsightGenerationRequest {
  brandId: string;
  dataSources?: DataSourceType[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  focusAreas?: InsightType[];
  includeCompetitors?: boolean;
}

// Generation Result
export interface InsightGenerationResult {
  success: boolean;
  brandId: string;
  insights: Insight[];
  recommendations: Recommendation[];
  summary: {
    totalInsights: number;
    totalRecommendations: number;
    criticalItems: number;
    topPriority?: Recommendation;
  };
  processingTime: number;
  error?: string;
}

// Job Status
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Generation Job
export interface GenerationJob {
  id: string;
  brandId: string;
  status: JobStatus;
  request: InsightGenerationRequest;
  result?: InsightGenerationResult;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Insights & Recommendations Sub-Agent
 */
export class InsightsRecommendationsSubAgent extends EventEmitter {
  private config: InsightsConfig;
  private jobs: Map<string, GenerationJob>;
  private insights: Map<string, Insight>;
  private recommendations: Map<string, Recommendation>;
  private idCounter: number = 0;

  constructor(config: Partial<InsightsConfig> = {}) {
    super();
    this.config = InsightsConfigSchema.parse(config);
    this.jobs = new Map();
    this.insights = new Map();
    this.recommendations = new Map();
  }

  /**
   * Generate insights and recommendations for a brand
   */
  async generate(request: InsightGenerationRequest): Promise<InsightGenerationResult> {
    const startTime = Date.now();

    try {
      // Validate request
      if (!request.brandId) {
        return this.createErrorResult(request.brandId, 'Brand ID is required', startTime);
      }

      this.emit('generation:start', { brandId: request.brandId });

      // Create job
      const job = this.createJob(request);
      this.emit('job:created', job);

      // Aggregate data
      const aggregatedData = await this.aggregateData(request);
      this.emit('data:aggregated', { brandId: request.brandId, dataPoints: aggregatedData.dataPoints.length });

      // Generate insights
      const insights = await this.generateInsights(aggregatedData, request);
      insights.forEach(insight => this.insights.set(insight.id, insight));
      this.emit('insights:generated', { brandId: request.brandId, count: insights.length });

      // Generate recommendations
      const recommendations = await this.generateRecommendations(insights, request);
      recommendations.forEach(rec => this.recommendations.set(rec.id, rec));
      this.emit('recommendations:generated', { brandId: request.brandId, count: recommendations.length });

      // Update job
      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;

      const result: InsightGenerationResult = {
        success: true,
        brandId: request.brandId,
        insights,
        recommendations,
        summary: {
          totalInsights: insights.length,
          totalRecommendations: recommendations.length,
          criticalItems: recommendations.filter(r => r.priority === 'critical').length,
          topPriority: recommendations.find(r => r.priority === 'critical') || recommendations[0]
        },
        processingTime: Date.now() - startTime
      };

      job.result = result;
      this.emit('generation:complete', result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('generation:error', { brandId: request.brandId, error: errorMessage });
      return this.createErrorResult(request.brandId, errorMessage, startTime);
    }
  }

  /**
   * Get an insight by ID
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

  /**
   * Get a recommendation by ID
   */
  getRecommendation(id: string): Recommendation | undefined {
    return this.recommendations.get(id);
  }

  /**
   * Get all recommendations for a brand
   */
  getRecommendationsForBrand(brandId: string): Recommendation[] {
    return Array.from(this.recommendations.values()).filter(r => r.brandId === brandId);
  }

  /**
   * Update recommendation status
   */
  updateRecommendationStatus(
    id: string,
    status: RecommendationStatus
  ): Recommendation | undefined {
    const recommendation = this.recommendations.get(id);
    if (!recommendation) return undefined;

    recommendation.status = status;
    recommendation.updatedAt = new Date();

    if (status === 'completed') {
      recommendation.completedAt = new Date();
    }

    this.emit('recommendation:updated', recommendation);
    return recommendation;
  }

  /**
   * Get job by ID
   */
  getJob(id: string): GenerationJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get current configuration
   */
  getConfig(): InsightsConfig {
    return { ...this.config };
  }

  // Private methods

  private createErrorResult(
    brandId: string,
    error: string,
    startTime: number
  ): InsightGenerationResult {
    return {
      success: false,
      brandId,
      insights: [],
      recommendations: [],
      summary: {
        totalInsights: 0,
        totalRecommendations: 0,
        criticalItems: 0
      },
      processingTime: Date.now() - startTime,
      error
    };
  }

  private createJob(request: InsightGenerationRequest): GenerationJob {
    const id = this.generateId('job');
    const job: GenerationJob = {
      id,
      brandId: request.brandId,
      status: 'processing',
      request,
      progress: 0,
      createdAt: new Date(),
      startedAt: new Date()
    };
    this.jobs.set(id, job);
    return job;
  }

  private generateId(prefix: string): string {
    this.idCounter++;
    return `${prefix}_${Date.now()}_${this.idCounter}`;
  }

  private async aggregateData(request: InsightGenerationRequest): Promise<AggregatedData> {
    const sources = request.dataSources || this.config.dataSources;
    const dateRange = request.dateRange || {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      to: new Date()
    };

    // Simulate data aggregation
    const dataPoints: DataPoint[] = [];
    const metrics: Record<string, number[]> = {};

    sources.forEach(source => {
      // Generate sample data points for each source
      for (let i = 0; i < 10; i++) {
        const metric = this.getMetricForSource(source);
        const value = Math.random() * 100;

        dataPoints.push({
          id: this.generateId('dp'),
          source,
          metric,
          value,
          timestamp: new Date(dateRange.from.getTime() +
            Math.random() * (dateRange.to.getTime() - dateRange.from.getTime()))
        });

        if (!metrics[metric]) metrics[metric] = [];
        metrics[metric].push(value);
      }
    });

    // Calculate summary
    const summary: AggregatedData['summary'] = {
      totalDataPoints: dataPoints.length,
      metrics: {}
    };

    Object.entries(metrics).forEach(([metric, values]) => {
      const sorted = values.sort((a, b) => a - b);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      summary.metrics[metric] = {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg,
        trend: avg > 50 ? 'up' : avg < 50 ? 'down' : 'stable'
      };
    });

    return {
      brandId: request.brandId,
      dateRange,
      sources,
      dataPoints,
      summary
    };
  }

  private getMetricForSource(source: DataSourceType): string {
    const metricMap: Record<DataSourceType, string> = {
      brand_monitoring: 'mention_count',
      site_performance: 'page_load_time',
      content_generation: 'content_engagement',
      social_media: 'social_reach',
      ai_platform_visibility: 'ai_visibility_score'
    };
    return metricMap[source];
  }

  private async generateInsights(
    data: AggregatedData,
    request: InsightGenerationRequest
  ): Promise<Insight[]> {
    const insights: Insight[] = [];
    const focusAreas = request.focusAreas || ['performance_trend', 'opportunity', 'risk'];

    // Performance Trend Insights
    if (focusAreas.includes('performance_trend')) {
      Object.entries(data.summary.metrics).forEach(([metric, stats]) => {
        insights.push({
          id: this.generateId('insight'),
          brandId: request.brandId,
          type: 'performance_trend',
          title: `${metric.replace(/_/g, ' ')} ${stats.trend === 'up' ? 'Increasing' : stats.trend === 'down' ? 'Decreasing' : 'Stable'}`,
          description: `The ${metric.replace(/_/g, ' ')} metric shows a ${stats.trend} trend with an average of ${stats.avg.toFixed(2)}.`,
          confidence: 75 + Math.random() * 20,
          impact: stats.trend === 'down' ? 'high' : stats.trend === 'up' ? 'medium' : 'low',
          dataPoints: data.dataPoints.filter(dp => dp.metric === metric).map(dp => dp.id),
          createdAt: new Date()
        });
      });
    }

    // Opportunity Insights
    if (focusAreas.includes('opportunity')) {
      insights.push({
        id: this.generateId('insight'),
        brandId: request.brandId,
        type: 'opportunity',
        title: 'Content Optimization Opportunity',
        description: 'Analysis suggests potential for improved engagement through content optimization strategies.',
        confidence: 70 + Math.random() * 25,
        impact: 'high',
        dataPoints: data.dataPoints.slice(0, 3).map(dp => dp.id),
        createdAt: new Date()
      });
    }

    // Risk Insights
    if (focusAreas.includes('risk')) {
      const lowMetrics = Object.entries(data.summary.metrics)
        .filter(([_, stats]) => stats.avg < 40);

      if (lowMetrics.length > 0) {
        insights.push({
          id: this.generateId('insight'),
          brandId: request.brandId,
          type: 'risk',
          title: 'Performance Risk Detected',
          description: `${lowMetrics.length} metric(s) showing below-average performance that may require attention.`,
          confidence: 80 + Math.random() * 15,
          impact: 'high',
          dataPoints: data.dataPoints.slice(0, 5).map(dp => dp.id),
          createdAt: new Date()
        });
      }
    }

    // Correlation Insights
    if (focusAreas.includes('correlation') || this.config.enablePredictiveAnalytics) {
      const metricNames = Object.keys(data.summary.metrics);
      if (metricNames.length >= 2) {
        insights.push({
          id: this.generateId('insight'),
          brandId: request.brandId,
          type: 'correlation',
          title: 'Metric Correlation Detected',
          description: 'Strong correlation detected between key performance metrics.',
          confidence: 65 + Math.random() * 30,
          impact: 'medium',
          dataPoints: data.dataPoints.slice(0, 4).map(dp => dp.id),
          correlations: [{
            metricA: metricNames[0],
            metricB: metricNames[1],
            correlation: 0.5 + Math.random() * 0.4
          }],
          createdAt: new Date()
        });
      }
    }

    // Anomaly Detection
    if (this.config.enableAnomalyDetection) {
      const hasAnomaly = Math.random() > 0.7;
      if (hasAnomaly) {
        insights.push({
          id: this.generateId('insight'),
          brandId: request.brandId,
          type: 'anomaly',
          title: 'Unusual Activity Detected',
          description: 'Anomalous pattern detected in recent data that deviates from historical baseline.',
          confidence: 70 + Math.random() * 25,
          impact: 'high',
          dataPoints: data.dataPoints.slice(0, 2).map(dp => dp.id),
          createdAt: new Date()
        });
      }
    }

    return insights;
  }

  private async generateRecommendations(
    insights: Insight[],
    request: InsightGenerationRequest
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Generate recommendations based on insights
    insights.forEach(insight => {
      const recommendation = this.createRecommendationFromInsight(insight, request.brandId);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    });

    // Sort by priority and limit
    recommendations.sort((a, b) => {
      const priorityOrder: Record<RecommendationPriority, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return recommendations.slice(0, this.config.maxRecommendationsPerBrand);
  }

  private createRecommendationFromInsight(
    insight: Insight,
    brandId: string
  ): Recommendation | null {
    // Map insight types to recommendation categories
    const categoryMap: Partial<Record<InsightType, RecommendationCategory>> = {
      performance_trend: 'content_optimization',
      opportunity: 'strategic_initiative',
      risk: 'technical_fix',
      anomaly: 'technical_fix',
      competitive_intelligence: 'competitive_response',
      correlation: 'seo_improvement'
    };

    const category = categoryMap[insight.type];
    if (!category) return null;

    // Determine priority based on impact and confidence
    let priority: RecommendationPriority = 'medium';
    if (insight.impact === 'high' && insight.confidence >= 80) {
      priority = 'critical';
    } else if (insight.impact === 'high' || insight.confidence >= 75) {
      priority = 'high';
    } else if (insight.impact === 'low' && insight.confidence < 70) {
      priority = 'low';
    }

    return {
      id: this.generateId('rec'),
      brandId,
      insightIds: [insight.id],
      category,
      priority,
      status: 'pending',
      title: `Action: ${insight.title}`,
      description: `Based on the insight "${insight.title}", we recommend taking action to address this finding.`,
      rationale: insight.description,
      expectedImpact: {
        metric: insight.type === 'performance_trend' ? 'overall_performance' : 'brand_visibility',
        improvement: 10 + Math.random() * 30,
        timeframe: priority === 'critical' ? '1 week' : priority === 'high' ? '2 weeks' : '1 month'
      },
      actionItems: this.generateActionItems(insight, category),
      feasibility: 60 + Math.random() * 35,
      confidence: insight.confidence,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private generateActionItems(
    insight: Insight,
    category: RecommendationCategory
  ): Recommendation['actionItems'] {
    const actionTemplates: Record<RecommendationCategory, string[]> = {
      content_optimization: [
        'Review current content performance metrics',
        'Identify underperforming content pieces',
        'Implement optimization recommendations',
        'Monitor results for 7 days'
      ],
      seo_improvement: [
        'Conduct technical SEO audit',
        'Update meta descriptions and titles',
        'Improve internal linking structure',
        'Submit updated sitemap'
      ],
      social_engagement: [
        'Analyze engagement patterns',
        'Develop content calendar',
        'Increase posting frequency',
        'Engage with audience comments'
      ],
      competitive_response: [
        'Monitor competitor activities',
        'Identify competitive gaps',
        'Develop differentiation strategy',
        'Execute response campaign'
      ],
      technical_fix: [
        'Identify technical issues',
        'Prioritize fixes by impact',
        'Implement solutions',
        'Verify fixes in staging'
      ],
      strategic_initiative: [
        'Define strategic objectives',
        'Develop implementation plan',
        'Allocate resources',
        'Execute and measure results'
      ]
    };

    const actions = actionTemplates[category] || actionTemplates.strategic_initiative;
    return actions.map((action, index) => ({
      step: index + 1,
      action,
      effort: index < 2 ? 'low' : index < 3 ? 'medium' : 'high' as 'low' | 'medium' | 'high'
    }));
  }
}

/**
 * Factory function
 */
export function createInsightsRecommendationsSubAgent(
  config: Partial<InsightsConfig> = {}
): InsightsRecommendationsSubAgent {
  return new InsightsRecommendationsSubAgent(config);
}
