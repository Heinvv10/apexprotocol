/**
 * Recommendations Engine Types
 * Type definitions for the smart recommendations system
 */

// Recommendation source types
export type RecommendationSource =
  | "monitor"
  | "audit"
  | "content"
  | "schema"
  | "entity"
  | "voice"
  | "qa";

// Recommendation category types
export type RecommendationCategory =
  | "schema"
  | "content"
  | "technical"
  | "seo"
  | "voice"
  | "entity"
  | "qa";

// Priority levels
export type PriorityLevel = "critical" | "high" | "medium" | "low";

// Recommendation data
export interface Recommendation {
  id: string;
  brandId: string;
  source: RecommendationSource;
  category: RecommendationCategory;
  priority: PriorityLevel;
  priorityScore: number; // 0-100
  title: string;
  description: string;
  impact: RecommendationImpact;
  effort: RecommendationEffort;
  urgency: number; // 0-100
  confidence: number; // 0-100
  actionItems: ActionItem[];
  metadata: RecommendationMetadata;
  codeSnippet?: string;
  relatedIssues?: string[];
  relatedRecommendations?: string[];
  aiPlatforms?: string[];
  status: "pending" | "in_progress" | "completed" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationImpact {
  score: number; // 0-100
  description: string;
  expectedOutcome: string;
  affectedMetrics: string[];
}

export interface RecommendationEffort {
  score: number; // 0-100 (lower = easier)
  description: string;
  estimatedTime: string;
  requiredSkills: string[];
}

export interface ActionItem {
  id: string;
  order: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface RecommendationMetadata {
  generatedBy: string;
  sourceData?: Record<string, unknown>;
  lastUpdated: Date;
  version: number;
}

// Priority scoring weights
export interface PriorityWeights {
  impact: number; // Default 0.40
  effort: number; // Default 0.30
  urgency: number; // Default 0.20
  confidence: number; // Default 0.10
}

// Entity extraction types
export interface ExtractedEntity {
  name: string;
  type: EntityType;
  confidence: number;
  occurrences: number;
  platforms: string[];
  context: string[];
}

export type EntityType =
  | "brand"
  | "product"
  | "person"
  | "organization"
  | "location"
  | "feature"
  | "topic"
  | "competitor";

export interface EntityAnalysis {
  entities: ExtractedEntity[];
  brandMentions: number;
  competitorMentions: Map<string, number>;
  coverageGaps: string[];
  platformBreakdown: Map<string, ExtractedEntity[]>;
}

// Schema generation types
export type SchemaType =
  | "Organization"
  | "LocalBusiness"
  | "FAQPage"
  | "HowTo"
  | "Product"
  | "Article"
  | "WebPage"
  | "BreadcrumbList";

export interface SchemaSnippet {
  type: SchemaType;
  jsonLd: string;
  isValid: boolean;
  warnings: string[];
}

// Voice readability types
export interface VoiceReadabilityScore {
  fleschKincaid: number;
  fleschReadingEase: number;
  averageSentenceLength: number;
  averageSyllablesPerWord: number;
  grade: "excellent" | "good" | "average" | "poor";
  suggestions: VoiceOptimizationSuggestion[];
}

export interface VoiceOptimizationSuggestion {
  original: string;
  suggestion: string;
  reason: string;
}

// Q&A conversion types
export interface QAPair {
  question: string;
  answer: string;
  sourceText: string;
  confidence: number;
}

export interface QAConversionResult {
  pairs: QAPair[];
  originalContent: string;
  coverage: number; // Percentage of content converted
  faqSchema?: string;
}
