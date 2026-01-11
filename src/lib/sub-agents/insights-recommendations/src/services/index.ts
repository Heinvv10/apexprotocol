/**
 * Insights & Recommendations Sub-Agent Services
 *
 * This module exports all services for the Insights & Recommendations Sub-Agent.
 */

// Data Aggregation Service
export {
  DataAggregationService,
  createDataAggregationService,
  type DataAggregationConfig,
  type DataSourceType,
  type TrendDirection,
  type DataPoint,
  type DataSource,
  type AggregationRequest,
  type MetricSummary,
  type AggregationResult,
  type DataPointFilter
} from './data-aggregation-service';

// Correlation Service
export {
  CorrelationService,
  createCorrelationService,
  type CorrelationConfig,
  type MetricData,
  type CorrelationRequest,
  type MetricCorrelation,
  type LaggedCorrelation,
  type CausalRelationship,
  type SemanticRelationship,
  type CorrelationMatrix,
  type CorrelationResult
} from './correlation-service';

// Insights Engine Service
export {
  InsightsEngineService,
  createInsightsEngineService,
  type InsightsEngineConfig,
  type MetricData as InsightMetricData,
  type CompetitorData,
  type InsightRequest,
  type TrendInsight,
  type OpportunityInsight,
  type RiskInsight,
  type AnomalyInsight,
  type CompetitiveInsight,
  type Insight,
  type InsightResult
} from './insights-engine-service';

// Recommendation Workflow Service
export {
  RecommendationWorkflowService,
  createRecommendationWorkflowService,
  type RecommendationWorkflowConfig,
  type InsightInput,
  type RecommendationInput,
  type RecommendationStatus,
  type RecommendationPriority,
  type RecommendationCategory,
  type ActionItem,
  type StatusHistoryEntry,
  type Recommendation,
  type WorkflowResult,
  type StatusUpdateResult,
  type ActionUpdateResult,
  type WorkflowMetrics
} from './recommendation-workflow-service';

// Predictive Analytics Service
export {
  PredictiveAnalyticsService,
  createPredictiveAnalyticsService,
  type PredictiveAnalyticsConfig,
  type TimeSeriesData,
  type ForecastRequest,
  type PredictionPoint,
  type ForecastResult,
  type TrendPrediction,
  type AnomalyPrediction,
  type SeasonalPattern,
  type PredictionConfidence,
  type MultiMetricForecast,
  type MetricInput
} from './predictive-analytics-service';

// Cache Queue Service
export {
  CacheQueueService,
  createCacheQueueService,
  CacheQueueConfigSchema,
  type CacheQueueConfig,
  type CacheEntry,
  type CacheOptions,
  type CacheStats,
  type JobPriority,
  type JobStatus,
  type JobDefinition,
  type JobResult,
  type JobState,
  type AddJobResult,
  type QueueStats,
  type JobProcessor
} from './cache-queue-service';
