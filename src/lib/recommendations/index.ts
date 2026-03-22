/**
 * Recommendations Module
 * 
 * Smart, personalized recommendations with impact/effort scoring
 */

export {
  generateSmartRecommendations,
  completeRecommendation,
  getRecommendationEffectiveness,
  type SmartRecommendation,
  type RecommendationCategory,
  type ImpactLevel,
  type EffortLevel,
} from "./smart-engine";

// Additional exports from sub-modules
export { analyzeEntities, extractEntities, compareEntityCoverage, identifyCoverageGaps } from "./entity-extraction";
export { analyzeForVoiceSearch, calculateVoiceReadability, isVoiceSearchReady, optimizeForVoice, scoreForPlatform } from "./voice-readability";
export { autoScheduler, AutoScheduler, formatScheduleResponse, scheduleRecommendations } from "./auto-scheduling";
export { batchConvertToQA, convertToQA, mergeQAPairs, optimizeQAForFeaturedSnippets } from "./qa-converter";
export { combineSchemas, generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, generateHowToSchema, generateLocalBusinessSchema, generateOrganizationSchema, generatePageSchemas, generateProductSchema, generateSchema, generateScriptTag, generateWebPageSchema, suggestSchemaTypes } from "./schema-generator";
export { createTemplateFromRecommendation, findMatchingTemplate, renderTemplate, templateRegistry, TemplateRegistry, BUILT_IN_TEMPLATES } from "./templates";
export { generateBrandActionPlan, getAllImplementationGuides, getImplementationGuide, brandDefinitionGuide, metaDescriptionGuide, schemaMarkupGuide } from "./action-plan-generator";
export { generateRecommendations } from "./engine";
export { mlPriorityEngine, MLPriorityEngine, adjustPriority } from "./ml-priority";
