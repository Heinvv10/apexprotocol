/**
 * Content Generation Sub-Agent Services
 *
 * This module exports all services for the Content Generation Sub-Agent.
 */

// Brand Voice Learning
export {
  BrandVoiceService,
  createBrandVoiceService,
  type BrandVoiceTrainingData,
  type BrandVoiceConfig,
  type ToneAnalysis,
  type StyleAnalysis,
  type VocabularyProfile,
  type MessagingPatterns,
  type PersonalityProfile,
  type BrandVoiceAnalysis,
  type ContentAnalysisResult
} from './brand-voice-service';

// Multi-Platform Content Optimizer
export {
  PlatformOptimizerService,
  createPlatformOptimizerService,
  type PlatformOptimizerConfig,
  type Platform,
  type PlatformConstraints,
  type ContentToOptimize,
  type OptimizedContent,
  type PlatformBestPractices,
  type OptimizationResult,
  type BatchOptimizationResult
} from './platform-optimizer-service';

// Content Type Handler
export {
  ContentTypeHandlerService,
  createContentTypeHandlerService,
  type ContentTypeConfig,
  type ContentType,
  type BrandVoiceInput,
  type ContentTypeInput,
  type BlogPostConfig,
  type SocialMediaConfig,
  type MarketingCopyConfig,
  type TechnicalDocsConfig,
  type PressReleaseConfig,
  type ContentTypeConfiguration,
  type ContentTypeOutput,
  type ContentGenerationResult,
  type ContentValidation,
  type ContentTemplate
} from './content-type-handler-service';

// Research Service
export {
  ResearchService,
  createResearchService,
  type ResearchConfig,
  type ResearchRequest,
  type ResearchResult,
  type ResearchSource,
  type ResearchDepth,
  type SourceInfo,
  type FactCheck,
  type FactCheckStatus,
  type ContentOutline,
  type OutlineSection,
  type PlagiarismAnalysis,
  type Citation,
  type Citations
} from './research-service';

// Performance Prediction
export {
  PerformancePredictionService,
  createPerformancePredictionService,
  type PerformancePredictionConfig,
  type ContentAnalysisInput,
  type ABTestSuggestion,
  type EngagementFactors,
  type PlatformInsights,
  type Recommendation,
  type BenchmarkComparison,
  type PerformancePrediction,
  type PredictionResult
} from './performance-prediction-service';

// Caching Service
export {
  CachingService,
  createCachingService,
  type CacheConfig,
  type CacheEntry,
  type CacheStats,
  type EvictionPolicy,
  type SetOptions
} from './caching-service';

// Job Queue Service
export {
  JobQueueService,
  createJobQueueService,
  type JobConfig,
  type Job,
  type JobInput,
  type JobStatus,
  type JobPriority,
  type JobContext,
  type JobHandler,
  type JobFilter,
  type QueueStats,
  type CleanupOptions
} from './job-queue-service';
