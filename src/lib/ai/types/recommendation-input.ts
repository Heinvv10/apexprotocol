/**
 * AI Recommendation Types
 * Type definitions for AI-powered recommendation generation input/output
 */

// ============================================================================
// AI Platform Types
// ============================================================================

/**
 * Supported AI platforms for visibility tracking
 */
export type AIPlatform = "ChatGPT" | "Claude" | "Perplexity" | "Gemini";

/**
 * Sentiment classification for platform mentions
 */
export type SentimentType = "positive" | "neutral" | "negative";

/**
 * Severity levels for content gaps
 */
export type GapSeverity = "critical" | "high" | "medium" | "low";

// ============================================================================
// Recommendation Category & Priority Types
// (Aligned with database schema enums)
// ============================================================================

/**
 * Recommendation categories matching database enum
 */
export type RecommendationCategory =
  | "technical_seo"
  | "content_optimization"
  | "schema_markup"
  | "citation_building"
  | "brand_consistency"
  | "competitor_analysis"
  | "content_freshness"
  | "authority_building";

/**
 * Priority levels matching database enum
 */
export type PriorityLevel = "critical" | "high" | "medium" | "low";

/**
 * Impact levels matching database enum
 */
export type ImpactLevel = "high" | "medium" | "low";

/**
 * Effort levels matching database enum
 */
export type EffortLevel = "quick_win" | "moderate" | "major";

/**
 * Recommendation source types matching database enum
 */
export type RecommendationSource = "audit" | "monitoring" | "content" | "manual";

/**
 * Recommendation status types matching database enum
 */
export type RecommendationStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "dismissed";

// ============================================================================
// Visibility Data Input Types (Input to AI)
// ============================================================================

/**
 * Platform visibility metrics for a single AI platform
 */
export interface PlatformVisibility {
  /** Platform name (e.g., "ChatGPT", "Claude") */
  name: AIPlatform | string;
  /** Percentage of queries where brand is mentioned (0-100) */
  mentionRate: number;
  /** Average position in AI responses (1 = first mention, null = not ranked) */
  averagePosition: number | null;
  /** Overall sentiment of mentions */
  sentiment: SentimentType;
  /** Number of citations/references to brand content */
  citationFrequency: number;
}

/**
 * Identified content gap requiring attention
 */
export interface ContentGap {
  /** Type of content gap (e.g., "missing_faq", "outdated_schema") */
  type: string;
  /** Detailed description of the gap */
  description: string;
  /** Severity level indicating urgency */
  severity: GapSeverity;
  /** List of AI platforms affected by this gap */
  affectedPlatforms: string[];
}

/**
 * Competitor visibility metrics for comparison
 */
export interface CompetitorMetrics {
  /** Competitor brand name */
  name: string;
  /** Competitor's mention rate percentage (0-100) */
  mentionRate: number;
  /** Platforms where competitor is visible */
  platforms: string[];
  /** Areas where competitor has advantage over the brand */
  advantageAreas?: string[];
}

/**
 * Complete visibility data input for AI analysis
 * This is the primary input structure for recommendation generation
 */
export interface VisibilityData {
  /** Unique identifier for the brand being analyzed */
  brandId: string;
  /** Optional brand name for context in prompts */
  brandName?: string;
  /** Visibility metrics across AI platforms */
  platforms: PlatformVisibility[];
  /** Identified content gaps to address */
  contentGaps: ContentGap[];
  /** Competitor visibility data for comparison */
  competitorData: CompetitorMetrics[];
}

// ============================================================================
// AI Recommendation Output Types (Raw from Claude)
// ============================================================================

/**
 * Raw recommendation output from Claude AI
 * This matches the JSON structure requested in the system prompt
 */
export interface AIRecommendationOutput {
  /** Category of the recommendation */
  category: RecommendationCategory;
  /** Priority level based on impact and urgency */
  priority: PriorityLevel;
  /** Expected impact on visibility */
  impact: ImpactLevel;
  /** Implementation effort required */
  effort: EffortLevel;
  /** Concise recommendation title (max 200 chars) */
  title: string;
  /** Detailed description explaining the recommendation */
  description: string;
  /** Ordered list of actionable implementation steps */
  steps: string[];
  /** AI platforms this recommendation targets */
  aiPlatforms: string[];
  /** Expected measurable outcome */
  expectedOutcome: string;
  /** Estimated time to implement (e.g., "2-4 weeks") */
  estimatedTimeframe: string;
}

/**
 * Parsed response structure from Claude containing recommendations
 */
export interface AIRecommendationResponse {
  recommendations: AIRecommendationOutput[];
}

// ============================================================================
// Generated Recommendation Types (Mapped to DB Schema)
// ============================================================================

/**
 * Generated recommendation with calculated impact score
 * Ready for database insertion
 */
export interface GeneratedRecommendation extends AIRecommendationOutput {
  /** Calculated impact score (0-100) based on priority, impact, effort, and context */
  impactScore: number;
}

/**
 * Recommendation prepared for database insertion
 * Maps GeneratedRecommendation fields to database schema
 */
export interface RecommendationForInsertion {
  brandId: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  priority: PriorityLevel;
  impact: ImpactLevel;
  effort: EffortLevel;
  status: RecommendationStatus;
  source: RecommendationSource;
  steps: string[];
  estimatedTime?: string;
  notes?: string;
}

// ============================================================================
// Generation Result Types
// ============================================================================

/**
 * Token usage tracking for AI API calls
 */
export interface TokenUsage {
  /** Number of input tokens used */
  input: number;
  /** Number of output tokens generated */
  output: number;
}

/**
 * Result from AI recommendation generation
 */
export interface GenerationResult {
  /** Whether generation was successful */
  success: boolean;
  /** Generated recommendations with impact scores */
  recommendations: GeneratedRecommendation[];
  /** Optional token usage statistics */
  tokenUsage?: TokenUsage;
  /** Error message if generation failed */
  error?: string;
}

/**
 * Summary statistics for recommendation generation
 */
export interface GenerationSummary {
  /** Total recommendations generated */
  total: number;
  /** Count of critical priority recommendations */
  critical: number;
  /** Count of high priority recommendations */
  high: number;
  /** Count of medium priority recommendations */
  medium: number;
  /** Count of low priority recommendations */
  low: number;
  /** Number of recommendations persisted to database */
  persisted: number;
  /** Number of duplicates that were skipped */
  duplicatesSkipped: number;
}

/**
 * Complete response from recommendation generation API
 */
export interface GenerationApiResponse {
  /** Whether the request was successful */
  success: boolean;
  /** ISO timestamp of generation */
  generatedAt: string;
  /** Summary statistics */
  summary: GenerationSummary;
  /** Array of generated recommendations with database IDs */
  recommendations: (GeneratedRecommendation & { id?: string })[];
  /** Optional warning message (e.g., for insufficient data) */
  warning?: string;
}

// ============================================================================
// Deduplication Types
// ============================================================================

/**
 * Result from recommendation deduplication
 */
export interface DeduplicationResult {
  /** Unique recommendations to insert */
  unique: GeneratedRecommendation[];
  /** Recommendations identified as duplicates */
  duplicates: GeneratedRecommendation[];
}

// ============================================================================
// Generation Options Types
// ============================================================================

/**
 * Options for AI recommendation generation
 */
export interface GenerationOptions {
  /** Maximum number of recommendations to return (default: 10) */
  maxRecommendations?: number;
  /** Minimum impact score threshold (0-100, default: 30) */
  minImpactThreshold?: number;
  /** Whether to skip duplicate detection (default: false) */
  skipDeduplication?: boolean;
}

/**
 * Request body for generate recommendations API endpoint
 */
export interface GenerateRecommendationsRequest {
  /** Brand ID to generate recommendations for */
  brandId: string;
  /** Include monitor data in analysis (default: true) */
  includeMonitor?: boolean;
  /** Include audit data in analysis (default: true) */
  includeAudit?: boolean;
  /** Maximum recommendations to generate (default: 10) */
  maxRecommendations?: number;
  /** Whether to use AI generation (default: true, false for rule-based) */
  useAI?: boolean;
}

// ============================================================================
// Impact Scoring Types
// ============================================================================

/**
 * Weights for impact score calculation
 */
export interface ImpactScoringWeights {
  /** Weight for priority factor (default: 0.40) */
  priority: number;
  /** Weight for impact level factor (default: 0.30) */
  impact: number;
  /** Weight for platform coverage (default: 0.20) */
  platformCoverage: number;
  /** Weight for effort (inverse - easier = higher, default: 0.10) */
  effort: number;
}

/**
 * Score mappings for priority levels
 */
export type PriorityScoreMap = Record<PriorityLevel, number>;

/**
 * Score mappings for impact levels
 */
export type ImpactScoreMap = Record<ImpactLevel, number>;

/**
 * Score mappings for effort levels (inverse - lower effort = higher score)
 */
export type EffortScoreMap = Record<EffortLevel, number>;
