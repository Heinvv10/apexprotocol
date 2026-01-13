/**
 * Brand Monitoring Sub-Agent
 * Comprehensive brand monitoring system for tracking mentions, sentiment,
 * trends, risks, and performance across AI platforms and social media.
 *
 * @module brand-monitoring
 */

// ============================================================================
// Main Orchestrator
// ============================================================================

export {
  createBrandMonitoringSubAgent,
  type BrandMonitoringSubAgent,
  type BrandMonitoringConfig,
  type MonitoringResult,
  type MonitoringSession,
  type MonitoringOptions,
  type MonitoringInsights,
  type AgentCapabilities,
  type CollaborationRequest,
  type CollaborationResponse,
  type AgentState,
  type AgentStats,
  type HealthCheck,
  type HealthStatus,
  type SessionStatus,
  type ServiceStatus,
  type PlatformConfig,
  type AlertThresholds,
  type TimeRange,
  type MentionsByPlatform,
  type SentimentAnalysis,
  type TrendData,
  type RiskData,
  type PerformanceData,
  type CrossPlatformData,
  type InsightRecommendation,
  type MonitoringSchedule,
  type AgentAlert,
} from './brand-monitoring-sub-agent';

// ============================================================================
// Platform Adapter Service
// ============================================================================

export {
  createPlatformAdapterService,
  type PlatformAdapterService,
  type PlatformAdapterConfig,
  type PlatformAdapter,
  type PlatformCredentials,
  type PlatformType,
  type RateLimit,
  type PlatformResponse,
  type AdapterStats,
  type AdapterHealth,
  type AggregatedStats,
  PlatformAdapterSchema,
  PlatformAdapterConfigSchema,
  PlatformCredentialsSchema,
  RateLimitSchema,
} from './services/platform-adapter-service';

// ============================================================================
// Mention Extraction Service
// ============================================================================

export {
  createMentionExtractionService,
  type MentionExtractionService,
  type MentionExtractionConfig,
  type RawContent,
  type ExtractedMention,
  type MentionContext,
  type EntityReference,
  type ExtractionEntities,
  type ExtractionResult,
  type ExtractionStats,
  type DuplicateGroup,
  MentionExtractionConfigSchema,
} from './services/mention-extraction-service';

// ============================================================================
// Sentiment Scoring Service
// ============================================================================

export {
  createSentimentScoringService,
  type SentimentScoringService,
  type SentimentScoringConfig,
  type SentimentInput,
  type SentimentScore,
  type SentimentDimension,
  type EmotionBreakdown,
  type AspectSentiment,
  type AspectSentimentResult,
  type ComparativeSentiment,
  type SentimentAggregation,
  type SentimentTrend,
  type SentimentStats,
  SentimentScoringConfigSchema,
} from './services/sentiment-scoring-service';

// ============================================================================
// Trend Detection Service
// ============================================================================

export {
  createTrendDetectionService,
  type TrendDetectionService,
  type TrendDetectionConfig,
  type TrendInput,
  type TrendType,
  type DetectedTrend,
  type TrendPattern,
  type TrendVelocity,
  type EmergingTopic,
  type TrendAnomaly,
  type TrendForecast,
  type TrendResult,
  type PlatformComparison as TrendPlatformComparison,
  type TrendStats,
  TrendDetectionConfigSchema,
} from './services/trend-detection-service';

// ============================================================================
// Risk Assessment Service
// ============================================================================

export {
  createRiskAssessmentService,
  type RiskAssessmentService,
  type RiskAssessmentConfig,
  type RiskInput,
  type RiskAssessment,
  type ThreatLevel,
  type RiskCategory,
  type ThreatType,
  type RiskMitigation,
  type RiskAlert,
  type RiskImpact,
  type RiskTrend,
  type BatchRiskResult,
  type CorrelatedRisk,
  type HistoricalPatterns,
  type HistoricalComparison,
  type RiskStats,
  type MitigationUrgency,
  type SensitivityLevel,
  RiskAssessmentConfigSchema,
} from './services/risk-assessment-service';

// ============================================================================
// Performance Model Service
// ============================================================================

export {
  createPerformanceModelService,
  type PerformanceModelService,
  type PerformanceModelConfig,
  type PerformanceData as PerformanceMetricData,
  type PerformanceMetrics,
  type MultiPlatformMetrics,
  type BenchmarkComparison,
  type TrendAnalysis,
  type GrowthVelocity,
  type OptimizationRecommendation,
  type PlatformComparison,
  type PlatformOpportunity,
  type ScoreBreakdown,
  type Forecast,
  type ForecastPrediction,
  type MarketShare,
  type PlatformPerformance,
  type PerformanceStats,
  type AIPlatform,
  type TrendDirection,
  type AccelerationType,
  type RecommendationPriority,
  PerformanceModelConfigSchema,
} from './services/performance-model-service';

// ============================================================================
// Re-export common types for convenience
// ============================================================================

/**
 * Factory function to create a fully configured brand monitoring sub-agent.
 *
 * @example
 * ```typescript
 * import { createBrandMonitoringSubAgent } from '@/lib/sub-agents/brand-monitoring';
 *
 * const agent = createBrandMonitoringSubAgent({
 *   brandName: 'Apex',
 *   brandAliases: ['Apex Platform', 'Apex AI'],
 *   platforms: [
 *     { id: 'chatgpt', type: 'ai_search', name: 'ChatGPT', enabled: true },
 *     { id: 'claude', type: 'ai_search', name: 'Claude', enabled: true },
 *   ],
 *   monitoringFrequency: 'hourly',
 * });
 *
 * await agent.initialize();
 * const result = await agent.monitor();
 * console.log(result.insights);
 * ```
 */

/**
 * Version information
 */
export const VERSION = '1.0.0';
export const AGENT_ID = 'brand-monitoring-sub-agent';
