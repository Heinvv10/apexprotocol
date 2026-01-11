/**
 * Content Generation Sub-Agent Services
 *
 * This module exports all services for the Content Generation Sub-Agent.
 */

// Brand Voice Learning
export {
  BrandVoiceService,
  createBrandVoiceService,
  type BrandVoice,
  type BrandVoiceConfig,
  type VoiceAnalysisResult,
  type TonePattern,
  type VocabularyProfile,
  type ContentStyleProfile,
  type VoiceAdaptationResult
} from './brand-voice-service';

// Multi-Platform Content Optimizer
export {
  PlatformOptimizerService,
  createPlatformOptimizerService,
  type PlatformOptimizerConfig,
  type ContentPlatform,
  type OptimizedContent,
  type PlatformConstraints,
  type OptimizationRequest,
  type OptimizationResult,
  type BatchOptimizationResult
} from './platform-optimizer-service';

// Content Type Handler
export {
  ContentTypeHandlerService,
  createContentTypeHandlerService,
  type ContentTypeConfig,
  type ContentType,
  type ContentLength,
  type ContentGenerationRequest,
  type ContentGenerationResult,
  type ContentStructure,
  type GeneratedSection
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
  type Citations
} from './research-service';

// Performance Prediction
export {
  PerformancePredictionService,
  createPerformancePredictionService,
  type PredictionConfig,
  type PredictionRequest,
  type PredictionResult,
  type EngagementPrediction,
  type ABTestSuggestion,
  type PlatformInsights,
  type BenchmarkComparison,
  type ImprovementRecommendation
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
