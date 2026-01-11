/**
 * Insights & Recommendations Sub-Agent
 *
 * A comprehensive sub-agent for generating data-driven strategic insights
 * and prioritized recommendations for brand visibility optimization.
 */

// Main Agent
export {
  InsightsRecommendationsSubAgent,
  createInsightsRecommendationsSubAgent,
  type InsightsConfig,
  type DataSourceType,
  type InsightType,
  type RecommendationPriority,
  type RecommendationStatus,
  type RecommendationCategory,
  type DataPoint,
  type AggregatedData,
  type Insight,
  type Recommendation,
  type InsightGenerationRequest,
  type InsightGenerationResult,
  type JobStatus,
  type GenerationJob
} from './insights-recommendations-sub-agent';

// Services - Re-export all services for advanced usage
export * from './services';
