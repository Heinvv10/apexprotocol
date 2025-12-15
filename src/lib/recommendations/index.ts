/**
 * Recommendations Module
 * Smart recommendations engine for AI visibility optimization
 *
 * F106: Recommendations - Engine Core
 * F107: Recommendations - Priority Scoring
 * F108: Entity Extraction NLP
 * F109: Schema Code Snippet Generator
 * F110: Voice Search Readability Scoring
 * F111: Q&A Format Converter
 * F112: Recommendation Templates System
 * F113: Recommendation Feedback System
 * F114: ML-based Priority Adjustment
 * F115: Auto-scheduling Recommendations
 */

// Types
export * from "./types";

// F106: Engine Core
export {
  RecommendationsEngine,
  createRecommendationsEngine,
  generateRecommendations,
  type MonitorData,
  type MentionData,
  type SentimentData,
  type CompetitorData,
  type AuditData,
  type CategoryScore,
  type AuditIssue,
  type EngineConfig,
} from "./engine";

// F107: Priority Scoring
export {
  calculatePriorityScore,
  getPriorityLevel,
  calculateImpactScore,
  calculateEffortScore,
  calculateUrgencyScore,
  calculateConfidenceScore,
  sortByPriority,
  filterByPriorityLevel,
  groupByPriority,
  DEFAULT_WEIGHTS,
} from "./priority-scoring";

// F108: Entity Extraction NLP
export {
  extractEntities,
  analyzeEntities,
  identifyCoverageGaps,
  compareEntityCoverage,
} from "./entity-extraction";

// F109: Schema Code Snippet Generator
export {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateProductSchema,
  generateArticleSchema,
  generateWebPageSchema,
  generateBreadcrumbSchema,
  generateSchema,
  suggestSchemaTypes,
  generatePageSchemas,
  generateScriptTag,
  combineSchemas,
} from "./schema-generator";

// F110: Voice Search Readability Scoring
export {
  calculateVoiceReadability,
  analyzeForVoiceSearch,
  optimizeForVoice,
  scoreForPlatform,
  isVoiceSearchReady,
} from "./voice-readability";

// F111: Q&A Format Converter
export {
  convertToQA,
  optimizeQAForFeaturedSnippets,
  batchConvertToQA,
  mergeQAPairs,
} from "./qa-converter";

// F112: Recommendation Templates System
export {
  TemplateRegistry,
  templateRegistry,
  renderTemplate,
  findMatchingTemplate,
  createTemplateFromRecommendation,
  BUILT_IN_TEMPLATES,
  type RecommendationTemplate,
  type TemplateVariable,
  type TemplateMetadata,
  type ActionItemTemplate,
} from "./templates";

// F113: Recommendation Feedback System
export {
  FeedbackManager,
  feedbackManager,
  formatFeedbackResponse,
  type RecommendationFeedback,
  type FeedbackRating,
  type FeedbackTag,
  type FeedbackOutcome,
  type FeedbackMetrics,
  type FeedbackStats,
  type TrainingData,
} from "./feedback";

// F114: ML-based Priority Adjustment
export {
  MLPriorityEngine,
  mlPriorityEngine,
  adjustPriority,
  trainModel,
  type MLPriorityModel,
  type MLWeights,
  type ModelMetrics,
  type PredictionResult,
  type PredictionFactors,
} from "./ml-priority";

// F115: Auto-scheduling Recommendations
export {
  AutoScheduler,
  autoScheduler,
  scheduleRecommendations,
  formatScheduleResponse,
  type ScheduledRecommendation,
  type ScheduleStatus,
  type ScheduleConfig,
  type ScheduleResult,
  type ScheduleConflict,
  type ScheduleMetrics,
} from "./auto-scheduling";
