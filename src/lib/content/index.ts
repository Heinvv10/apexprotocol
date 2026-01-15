/**
 * Content Module
 * Content inventory tracking and management
 *
 * F116: Content Inventory Tracking
 * Phase 4: Content Intelligence (brief generation, citation optimization, FAQ extraction)
 */

// Inventory Management
export {
  ContentInventoryManager,
  contentInventory,
  calculateGEOScore,
  formatAssetResponse,
  type ContentAsset,
  type ContentType,
  type ContentStatus,
  type GEOHealthScore,
  type SEOMetrics,
  type AIVisibilityMetrics,
  type OptimizationStatus,
  type ContentMetadata,
  type InventoryStats,
} from "./inventory";

// Content Brief Generator (Phase 4)
export {
  generateContentBrief,
  analyzeBriefAlignment,
  validateBriefQuality,
  type ContentBriefRequest,
  type ContentBrief,
  type BrandContext,
  type ContentType as BriefContentType,
  type RecommendedTitle,
  type HeaderStructure,
  type IntroductionBrief,
  type SectionBrief,
  type ConclusionBrief,
  type QuestionBrief,
  type SnippetOpportunity,
  type EntityMention,
  type LinkSuggestion,
  type SourceSuggestion,
  type CompetitorGap,
  type SchemaRecommendation,
  type PredictedScores,
  type BriefQualityReport,
  type BriefQualityIssue,
} from "./brief-generator";

// Citation Optimizer (Phase 4)
export {
  analyzeForCitation,
  quickCitationCheck,
  type CitationAnalysis,
  type CitationFactor,
  type CitationOpportunity,
  type PassageScore,
  type CitationRecommendation,
} from "./citation-optimizer";

// FAQ Extractor (Phase 4)
export {
  extractFAQsFromContent,
  extractFAQsWithAI,
  generateFAQSchema,
  extractAndValidateFAQs,
  validateFAQs,
  generateFAQSuggestions,
  type FAQItem,
  type FAQExtractionResult,
  type FAQSchemaMarkup,
  type FAQValidation,
} from "./faq-extractor";
