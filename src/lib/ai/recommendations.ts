/**
 * AI-Powered Recommendation Generator
 * Uses Claude AI to analyze brand visibility data and generate actionable recommendations
 */

import { getClaudeClient, CLAUDE_MODELS } from "./claude";
import { retry, isNonRetryableError } from "../utils/retry";

// ============================================================================
// Types
// ============================================================================

/**
 * Visibility data input structure for AI analysis
 */
export interface VisibilityData {
  brandId: string;
  brandName?: string;
  platforms: PlatformVisibility[];
  contentGaps: ContentGap[];
  competitorData: CompetitorMetrics[];
}

export interface PlatformVisibility {
  name: "ChatGPT" | "Claude" | "Perplexity" | "Gemini" | string;
  mentionRate: number; // 0-100 percentage
  averagePosition: number | null;
  sentiment: "positive" | "neutral" | "negative";
  citationFrequency: number;
}

export interface ContentGap {
  type: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  affectedPlatforms: string[];
}

export interface CompetitorMetrics {
  name: string;
  mentionRate: number;
  platforms: string[];
  advantageAreas?: string[];
}

/**
 * AI-generated recommendation output
 */
export interface AIRecommendationOutput {
  category:
    | "technical_seo"
    | "content_optimization"
    | "schema_markup"
    | "citation_building"
    | "brand_consistency"
    | "competitor_analysis"
    | "content_freshness"
    | "authority_building";
  priority: "critical" | "high" | "medium" | "low";
  impact: "high" | "medium" | "low";
  effort: "quick_win" | "moderate" | "major";
  title: string;
  description: string;
  steps: string[];
  aiPlatforms: string[];
  expectedOutcome: string;
  estimatedTimeframe: string;
}

/**
 * Generated recommendation ready for database insertion
 */
export interface GeneratedRecommendation extends AIRecommendationOutput {
  impactScore: number;
}

/**
 * Result from AI recommendation generation
 */
export interface GenerationResult {
  success: boolean;
  recommendations: GeneratedRecommendation[];
  tokenUsage?: {
    input: number;
    output: number;
  };
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const MIN_IMPACT_THRESHOLD = 30;
const DEFAULT_MAX_RECOMMENDATIONS = 10;

// Logging prefix for observability
const LOG_PREFIX = "[AI:Recommendations]";

/**
 * System prompt for Claude to generate recommendations
 */
const RECOMMENDATION_SYSTEM_PROMPT = `You are a Generative Engine Optimization (GEO) expert analyzing brand visibility data across AI platforms (ChatGPT, Claude, Perplexity, Gemini). Your task is to generate prioritized, actionable recommendations to improve brand visibility.

IMPORTANT INSTRUCTIONS:
1. Analyze the provided visibility data carefully
2. Generate 5-10 specific, actionable recommendations
3. Each recommendation must target specific AI platforms
4. Steps must be concrete actions (not vague suggestions)
5. Prioritize based on impact and effort

Respond ONLY with valid JSON matching this exact structure:
{
  "recommendations": [
    {
      "category": "technical_seo | content_optimization | schema_markup | citation_building | brand_consistency | competitor_analysis | content_freshness | authority_building",
      "priority": "critical | high | medium | low",
      "impact": "high | medium | low",
      "effort": "quick_win | moderate | major",
      "title": "Concise recommendation title",
      "description": "Detailed explanation of the recommendation and why it matters",
      "steps": ["Step 1: Specific action", "Step 2: Another action", "..."],
      "aiPlatforms": ["ChatGPT", "Claude", "..."],
      "expectedOutcome": "Measurable expected result",
      "estimatedTimeframe": "e.g., '1-2 weeks'"
    }
  ]
}

GUIDELINES:
- critical priority: Visibility gap >50% vs competitors, affects 3+ platforms
- high priority: Visibility gap 30-50%, affects 2+ platforms
- medium priority: Visibility gap 15-30%, affects 1-2 platforms
- low priority: Minor optimization opportunities

- quick_win effort: <1 day, no technical skills needed
- moderate effort: 1-5 days, some technical knowledge
- major effort: >1 week, significant development work

Ensure each step is platform-specific and actionable. Non-technical users should be able to follow the steps.`;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate AI-powered recommendations from visibility data
 */
export async function generateAIRecommendations(
  visibilityData: VisibilityData,
  options: {
    maxRecommendations?: number;
    minImpactThreshold?: number;
  } = {}
): Promise<GenerationResult> {
  const generationStartTime = Date.now();
  const {
    maxRecommendations = DEFAULT_MAX_RECOMMENDATIONS,
    minImpactThreshold = MIN_IMPACT_THRESHOLD,
  } = options;

  // Log generation request
  console.info(
    `${LOG_PREFIX} Starting recommendation generation`,
    {
      brandId: visibilityData.brandId,
      platformCount: visibilityData.platforms.length,
      contentGapsCount: visibilityData.contentGaps.length,
      competitorCount: visibilityData.competitorData.length,
      maxRecommendations,
      minImpactThreshold,
    }
  );

  // Validate input
  if (!visibilityData.brandId) {
    console.warn(`${LOG_PREFIX} Validation failed: Brand ID is required`);
    return {
      success: false,
      recommendations: [],
      error: "Brand ID is required",
    };
  }

  // Check if there's enough data to analyze
  if (
    visibilityData.platforms.length === 0 &&
    visibilityData.contentGaps.length === 0
  ) {
    console.info(
      `${LOG_PREFIX} Insufficient data for analysis`,
      { brandId: visibilityData.brandId }
    );
    return {
      success: true,
      recommendations: [],
      error: "Insufficient visibility data for analysis",
    };
  }

  // Build the analysis prompt
  const userPrompt = buildAnalysisPrompt(visibilityData);
  const promptLength = userPrompt.length;
  const systemPromptLength = RECOMMENDATION_SYSTEM_PROMPT.length;

  console.info(
    `${LOG_PREFIX} Prompt constructed`,
    {
      brandId: visibilityData.brandId,
      userPromptLength: promptLength,
      systemPromptLength,
      totalPromptLength: promptLength + systemPromptLength,
    }
  );

  // ðŸŸ¢ WORKING: Call Claude with retry utility (replaces manual retry loop)
  // Preserves all existing behavior: same retry config, error classification, and logging
  try {
    const result = await retry(
      async () => {
        const attemptStartTime = Date.now();
        const apiResult = await callClaudeForRecommendations(userPrompt);
        const aiResponseTime = Date.now() - attemptStartTime;

        // Log AI response metrics (preserved from original)
        console.info(
          `${LOG_PREFIX} AI response received`,
          {
            brandId: visibilityData.brandId,
            responseTimeMs: aiResponseTime,
            inputTokens: apiResult.usage.input,
            outputTokens: apiResult.usage.output,
            totalTokens: apiResult.usage.input + apiResult.usage.output,
            responseLength: apiResult.text.length,
          }
        );

        // Parse and validate recommendations
        const recommendations = parseAndValidateRecommendations(
          apiResult.text,
          visibilityData
        );

        // Return result with metadata for success handling
        return {
          recommendations,
          usage: apiResult.usage,
          aiResponseTime,
        };
      },
      {
        // Same retry configuration as original (MAX_RETRIES=3, RETRY_DELAY_MS=1000ms)
        maxRetries: MAX_RETRIES,
        baseDelay: RETRY_DELAY_MS,
        backoffMultiplier: 2,

        // Preserve error classification: don't retry on Invalid JSON (line 303 pattern)
        shouldRetry: (error) => !isNonRetryableError(error),

        // Preserve retry attempt logging (line 224-227 pattern)
        onRetry: (info) => {
          console.info(
            `${LOG_PREFIX} Retry attempt ${info.attempt}/${info.maxAttempts}`,
            { brandId: visibilityData.brandId }
          );
          console.info(
            `${LOG_PREFIX} Waiting ${info.delayMs}ms before retry`,
            { brandId: visibilityData.brandId }
          );
        },

        // Preserve error logging (line 293-300 pattern)
        onError: (error, attempt) => {
          console.warn(
            `${LOG_PREFIX} AI call failed (attempt ${attempt}/${MAX_RETRIES + 1})`,
            {
              brandId: visibilityData.brandId,
              error: error.message,
            }
          );

          // Log when non-retryable error is detected (line 304-308 pattern)
          if (isNonRetryableError(error)) {
            console.error(
              `${LOG_PREFIX} Invalid JSON response from AI - not retrying`,
              { brandId: visibilityData.brandId }
            );
          }
        },
      }
    );

    // Calculate impact scores and filter (preserved from original)
    const scoredRecommendations = result.recommendations
      .map((rec) => ({
        ...rec,
        impactScore: calculateRecommendationImpactScore(rec, visibilityData),
      }))
      .filter((rec) => rec.impactScore >= minImpactThreshold)
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, maxRecommendations);

    const totalTime = Date.now() - generationStartTime;

    // Log successful generation summary (preserved from original line 265-282)
    console.info(
      `${LOG_PREFIX} Generation completed successfully`,
      {
        brandId: visibilityData.brandId,
        totalTimeMs: totalTime,
        aiResponseTimeMs: result.aiResponseTime,
        rawRecommendations: result.recommendations.length,
        filteredRecommendations: scoredRecommendations.length,
        inputTokens: result.usage.input,
        outputTokens: result.usage.output,
        priorityBreakdown: {
          critical: scoredRecommendations.filter((r) => r.priority === "critical").length,
          high: scoredRecommendations.filter((r) => r.priority === "high").length,
          medium: scoredRecommendations.filter((r) => r.priority === "medium").length,
          low: scoredRecommendations.filter((r) => r.priority === "low").length,
        },
      }
    );

    return {
      success: true,
      recommendations: scoredRecommendations,
      tokenUsage: result.usage,
    };
  } catch (error) {
    // Handle retry exhaustion (preserved from original line 323-337)
    const lastError = error instanceof Error ? error : new Error(String(error));
    const totalTime = Date.now() - generationStartTime;

    console.error(
      `${LOG_PREFIX} Generation failed after all retries`,
      {
        brandId: visibilityData.brandId,
        totalTimeMs: totalTime,
        error: lastError.message,
      }
    );

    return {
      success: false,
      recommendations: [],
      error: lastError.message || "Failed to generate recommendations",
    };
  }
}

/**
 * Call Claude API for recommendation generation
 */
async function callClaudeForRecommendations(
  prompt: string
): Promise<{ text: string; usage: { input: number; output: number } }> {
  const client = getClaudeClient();

  const response = await client.messages.create({
    model: CLAUDE_MODELS.SONNET_3_5,
    max_tokens: 4096,
    temperature: 0.3, // Lower temperature for more consistent output
    system: RECOMMENDATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Extract text from response
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  return {
    text: textContent.text,
    usage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}

/**
 * Build the analysis prompt from visibility data
 */
function buildAnalysisPrompt(data: VisibilityData): string {
  const sections: string[] = [];

  // Brand context
  sections.push(`## Brand Analysis Request`);
  sections.push(`Brand ID: ${data.brandId}`);
  if (data.brandName) {
    sections.push(`Brand Name: ${data.brandName}`);
  }

  // Platform visibility metrics
  if (data.platforms.length > 0) {
    sections.push(`\n## Platform Visibility Metrics`);
    for (const platform of data.platforms) {
      sections.push(`### ${platform.name}`);
      sections.push(`- Mention Rate: ${platform.mentionRate}%`);
      sections.push(
        `- Average Position: ${platform.averagePosition ?? "Not ranked"}`
      );
      sections.push(`- Sentiment: ${platform.sentiment}`);
      sections.push(`- Citation Frequency: ${platform.citationFrequency}`);
    }
  }

  // Content gaps
  if (data.contentGaps.length > 0) {
    sections.push(`\n## Identified Content Gaps`);
    for (const gap of data.contentGaps) {
      sections.push(
        `- [${gap.severity.toUpperCase()}] ${gap.type}: ${gap.description}`
      );
      if (gap.affectedPlatforms.length > 0) {
        sections.push(`  Affected platforms: ${gap.affectedPlatforms.join(", ")}`);
      }
    }
  }

  // Competitor data
  if (data.competitorData.length > 0) {
    sections.push(`\n## Competitor Analysis`);
    for (const competitor of data.competitorData) {
      sections.push(`### ${competitor.name}`);
      sections.push(`- Mention Rate: ${competitor.mentionRate}%`);
      sections.push(`- Active Platforms: ${competitor.platforms.join(", ")}`);
      if (competitor.advantageAreas && competitor.advantageAreas.length > 0) {
        sections.push(
          `- Competitive Advantages: ${competitor.advantageAreas.join(", ")}`
        );
      }
    }
  }

  sections.push(
    `\n## Instructions\nBased on the above data, generate prioritized recommendations to improve this brand's visibility across AI platforms. Focus on the most impactful opportunities first.`
  );

  return sections.join("\n");
}

/**
 * Parse and validate recommendations from Claude response
 * @param responseText - Raw text response from Claude
 * @param _visibilityData - Reserved for future context-aware validation
 */
function parseAndValidateRecommendations(
  responseText: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _visibilityData: VisibilityData
): AIRecommendationOutput[] {
  // Try to extract JSON from response
  let jsonText = responseText.trim();

  // Handle markdown code blocks
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  // Parse JSON
  let parsed: { recommendations?: unknown[] };
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Invalid JSON in Claude response: ${responseText.slice(0, 200)}`);
  }

  // Validate structure
  if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
    throw new Error("Claude response missing recommendations array");
  }

  // Validate and map each recommendation
  const validRecommendations: AIRecommendationOutput[] = [];

  for (const rec of parsed.recommendations) {
    if (!isValidRecommendation(rec)) {
      continue; // Skip invalid recommendations
    }

    validRecommendations.push({
      category: validateCategory(rec.category),
      priority: validatePriority(rec.priority),
      impact: validateImpact(rec.impact),
      effort: validateEffort(rec.effort),
      title: String(rec.title).slice(0, 200),
      description: String(rec.description).slice(0, 1000),
      steps: validateSteps(rec.steps),
      aiPlatforms: validatePlatforms(rec.aiPlatforms),
      expectedOutcome: String(rec.expectedOutcome || "").slice(0, 500),
      estimatedTimeframe: String(rec.estimatedTimeframe || "2-4 weeks").slice(
        0,
        50
      ),
    });
  }

  return validRecommendations;
}

/**
 * Check if a recommendation object has required fields
 */
function isValidRecommendation(rec: unknown): rec is Record<string, unknown> {
  if (typeof rec !== "object" || rec === null) {
    return false;
  }

  const r = rec as Record<string, unknown>;
  return (
    typeof r.title === "string" &&
    typeof r.description === "string" &&
    r.title.length > 0 &&
    r.description.length > 0
  );
}

/**
 * Validate and normalize category
 */
function validateCategory(
  category: unknown
): AIRecommendationOutput["category"] {
  const validCategories: AIRecommendationOutput["category"][] = [
    "technical_seo",
    "content_optimization",
    "schema_markup",
    "citation_building",
    "brand_consistency",
    "competitor_analysis",
    "content_freshness",
    "authority_building",
  ];

  const cat = String(category).toLowerCase().replace(/\s+/g, "_");
  if (validCategories.includes(cat as AIRecommendationOutput["category"])) {
    return cat as AIRecommendationOutput["category"];
  }
  return "content_optimization"; // Default
}

/**
 * Validate and normalize priority
 */
function validatePriority(
  priority: unknown
): AIRecommendationOutput["priority"] {
  const validPriorities: AIRecommendationOutput["priority"][] = [
    "critical",
    "high",
    "medium",
    "low",
  ];

  const p = String(priority).toLowerCase();
  if (validPriorities.includes(p as AIRecommendationOutput["priority"])) {
    return p as AIRecommendationOutput["priority"];
  }
  return "medium"; // Default
}

/**
 * Validate and normalize impact
 */
function validateImpact(impact: unknown): AIRecommendationOutput["impact"] {
  const validImpacts: AIRecommendationOutput["impact"][] = [
    "high",
    "medium",
    "low",
  ];

  const i = String(impact).toLowerCase();
  if (validImpacts.includes(i as AIRecommendationOutput["impact"])) {
    return i as AIRecommendationOutput["impact"];
  }
  return "medium"; // Default
}

/**
 * Validate and normalize effort
 */
function validateEffort(effort: unknown): AIRecommendationOutput["effort"] {
  const validEfforts: AIRecommendationOutput["effort"][] = [
    "quick_win",
    "moderate",
    "major",
  ];

  const e = String(effort).toLowerCase().replace(/\s+/g, "_");
  if (validEfforts.includes(e as AIRecommendationOutput["effort"])) {
    return e as AIRecommendationOutput["effort"];
  }
  return "moderate"; // Default
}

/**
 * Validate and normalize steps array
 */
function validateSteps(steps: unknown): string[] {
  if (!Array.isArray(steps)) {
    return ["Review and implement this recommendation"];
  }

  return steps
    .filter((step): step is string => typeof step === "string" && step.length > 0)
    .slice(0, 10) // Max 10 steps
    .map((step) => step.slice(0, 500)); // Max 500 chars per step
}

/**
 * Validate and normalize AI platforms
 */
function validatePlatforms(platforms: unknown): string[] {
  if (!Array.isArray(platforms)) {
    return ["General AI platforms"];
  }

  const validPlatforms = ["ChatGPT", "Claude", "Perplexity", "Gemini"];
  return platforms
    .filter((p): p is string => typeof p === "string" && p.length > 0)
    .map((p) => {
      // Normalize platform names
      const normalized = p.trim();
      for (const valid of validPlatforms) {
        if (normalized.toLowerCase().includes(valid.toLowerCase())) {
          return valid;
        }
      }
      return normalized;
    })
    .slice(0, 4);
}

// ============================================================================
// Impact Scoring
// ============================================================================

/**
 * Default weights for impact scoring as per specification
 * Platform reach (40%), Visibility gap (30%), Traffic gain (20%), Competitive advantage (10%)
 */
export const IMPACT_SCORING_WEIGHTS = {
  platformReach: 0.40,
  visibilityGap: 0.30,
  trafficGain: 0.20,
  competitiveAdvantage: 0.10,
};

/**
 * Impact score factors extracted from visibility data and recommendation
 */
export interface ImpactScoreFactors {
  platformReachScore: number;      // 0-100: Based on number of platforms affected
  visibilityGapScore: number;      // 0-100: Based on current vs target mention rate
  trafficGainScore: number;        // 0-100: Based on estimated traffic improvement
  competitiveAdvantageScore: number; // 0-100: Based on gap vs competitors
}

/**
 * Calculate platform reach score based on number of AI platforms affected
 * More platforms = higher score (max 100 for 4+ platforms)
 */
export function calculatePlatformReachScore(
  targetedPlatforms: string[],
  totalPlatformsInData: number
): number {
  const platformCount = targetedPlatforms.length;

  // Base score based on platform count
  // 1 platform = 25, 2 = 50, 3 = 75, 4+ = 100
  const baseScore = Math.min(platformCount * 25, 100);

  // Bonus if targeting all available platforms in data
  const coverageBonus = totalPlatformsInData > 0 &&
    platformCount >= totalPlatformsInData ? 10 : 0;

  return Math.min(100, baseScore + coverageBonus);
}

/**
 * Calculate visibility gap severity score
 * Lower current visibility = higher priority score
 */
export function calculateVisibilityGapScore(
  platforms: PlatformVisibility[],
  targetedPlatforms: string[]
): number {
  if (platforms.length === 0) {
    return 50; // Default score when no platform data
  }

  // Find platforms targeted by this recommendation
  const relevantPlatforms = platforms.filter((p) =>
    targetedPlatforms.some(
      (tp) => tp.toLowerCase() === p.name.toLowerCase()
    )
  );

  if (relevantPlatforms.length === 0) {
    return 50; // Default if no matching platforms
  }

  // Calculate average visibility gap (100 - mentionRate = gap)
  const avgGap = relevantPlatforms.reduce((sum, p) => {
    const gap = 100 - p.mentionRate;
    return sum + gap;
  }, 0) / relevantPlatforms.length;

  // Score based on gap severity
  // Gap > 50% = critical (score 80-100)
  // Gap 30-50% = high (score 60-79)
  // Gap 15-30% = medium (score 40-59)
  // Gap < 15% = low (score 0-39)
  if (avgGap > 50) {
    return Math.min(100, 80 + (avgGap - 50) * 0.4);
  } else if (avgGap > 30) {
    return 60 + (avgGap - 30) * 0.95;
  } else if (avgGap > 15) {
    return 40 + (avgGap - 15) * 1.33;
  } else {
    return avgGap * 2.67;
  }
}

/**
 * Calculate expected traffic gain score based on recommendation impact and effort
 */
export function calculateTrafficGainScore(
  impact: AIRecommendationOutput["impact"],
  effort: AIRecommendationOutput["effort"],
  contentGaps: ContentGap[],
  targetedPlatforms: string[]
): number {
  let score = 50; // Base score

  // Impact level contributes significantly
  const impactBonus: Record<AIRecommendationOutput["impact"], number> = {
    high: 30,
    medium: 15,
    low: 5,
  };
  score += impactBonus[impact];

  // Lower effort = quicker realization of gains
  const effortBonus: Record<AIRecommendationOutput["effort"], number> = {
    quick_win: 15,
    moderate: 8,
    major: 0,
  };
  score += effortBonus[effort];

  // Bonus for addressing critical/high severity gaps
  const criticalHighGaps = contentGaps.filter(
    (gap) => gap.severity === "critical" || gap.severity === "high"
  );

  // Check if targeted platforms have critical gaps
  const addressesCriticalGap = criticalHighGaps.some((gap) =>
    gap.affectedPlatforms.some((platform) =>
      targetedPlatforms.some(
        (tp) => tp.toLowerCase() === platform.toLowerCase()
      )
    )
  );

  if (addressesCriticalGap) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate competitive advantage score based on competitor data
 */
export function calculateCompetitiveAdvantageScore(
  competitors: CompetitorMetrics[],
  platforms: PlatformVisibility[],
  targetedPlatforms: string[]
): number {
  if (competitors.length === 0 || platforms.length === 0) {
    return 50; // Default when no competitor data
  }

  // Calculate average brand mention rate on targeted platforms
  const relevantPlatforms = platforms.filter((p) =>
    targetedPlatforms.some(
      (tp) => tp.toLowerCase() === p.name.toLowerCase()
    )
  );

  if (relevantPlatforms.length === 0) {
    return 50;
  }

  const brandAvgMentionRate = relevantPlatforms.reduce(
    (sum, p) => sum + p.mentionRate, 0
  ) / relevantPlatforms.length;

  // Calculate average competitor mention rate
  const competitorAvgMentionRate = competitors.reduce(
    (sum, c) => sum + c.mentionRate, 0
  ) / competitors.length;

  // Calculate competitive gap (how much behind competitors)
  const competitiveGap = Math.max(0, competitorAvgMentionRate - brandAvgMentionRate);

  // Score based on competitive gap
  // Gap > 40% = critical competitive disadvantage (80-100)
  // Gap 20-40% = significant gap (60-79)
  // Gap 10-20% = moderate gap (40-59)
  // Gap < 10% = minor gap (0-39)
  if (competitiveGap > 40) {
    return Math.min(100, 80 + (competitiveGap - 40) * 0.5);
  } else if (competitiveGap > 20) {
    return 60 + (competitiveGap - 20);
  } else if (competitiveGap > 10) {
    return 40 + (competitiveGap - 10) * 2;
  } else {
    return competitiveGap * 4;
  }
}

/**
 * Extract all impact score factors for a recommendation
 */
export function extractImpactFactors(
  recommendation: AIRecommendationOutput,
  visibilityData: VisibilityData
): ImpactScoreFactors {
  const targetedPlatforms = recommendation.aiPlatforms;

  return {
    platformReachScore: calculatePlatformReachScore(
      targetedPlatforms,
      visibilityData.platforms.length
    ),
    visibilityGapScore: calculateVisibilityGapScore(
      visibilityData.platforms,
      targetedPlatforms
    ),
    trafficGainScore: calculateTrafficGainScore(
      recommendation.impact,
      recommendation.effort,
      visibilityData.contentGaps,
      targetedPlatforms
    ),
    competitiveAdvantageScore: calculateCompetitiveAdvantageScore(
      visibilityData.competitorData,
      visibilityData.platforms,
      targetedPlatforms
    ),
  };
}

/**
 * Calculate weighted impact score from individual factors
 */
export function calculateWeightedImpactScore(
  factors: ImpactScoreFactors,
  weights: typeof IMPACT_SCORING_WEIGHTS = IMPACT_SCORING_WEIGHTS
): number {
  const score =
    factors.platformReachScore * weights.platformReach +
    factors.visibilityGapScore * weights.visibilityGap +
    factors.trafficGainScore * weights.trafficGain +
    factors.competitiveAdvantageScore * weights.competitiveAdvantage;

  return Math.round(score * 100) / 100;
}

/**
 * Determine priority level based on impact score and platform count
 * Following specification thresholds:
 * - critical: Score >= 80, affects 3+ platforms, gap > 50%
 * - high: Score 60-79, affects 2+ platforms, gap 30-50%
 * - medium: Score 40-59, affects 1-2 platforms, gap 15-30%
 * - low: Score < 40, single platform, gap < 15%
 */
export function determinePriorityFromScore(
  score: number,
  platformCount: number,
  visibilityGapScore: number
): AIRecommendationOutput["priority"] {
  // Critical: Score >= 80, 3+ platforms, high visibility gap
  if (score >= 80 && platformCount >= 3 && visibilityGapScore >= 80) {
    return "critical";
  }

  // High: Score 60-79 or 2+ platforms with significant gap
  if (score >= 60 || (platformCount >= 2 && visibilityGapScore >= 60)) {
    return "high";
  }

  // Medium: Score 40-59 or moderate visibility gap
  if (score >= 40 || visibilityGapScore >= 40) {
    return "medium";
  }

  return "low";
}

/**
 * Calculate impact score for a recommendation based on visibility data context
 * Uses weighted scoring algorithm with four key factors:
 * - Platform reach (40%): Number of AI platforms affected
 * - Visibility gap (30%): Current vs target mention rate
 * - Traffic gain (20%): Estimated traffic improvement potential
 * - Competitive advantage (10%): Gap vs competitors
 */
export function calculateRecommendationImpactScore(
  recommendation: AIRecommendationOutput,
  visibilityData: VisibilityData
): number {
  // Extract all scoring factors
  const factors = extractImpactFactors(recommendation, visibilityData);

  // Calculate base weighted score
  let score = calculateWeightedImpactScore(factors);

  // Apply priority-based adjustment (AI-assigned priority as validation)
  const priorityAdjustment: Record<AIRecommendationOutput["priority"], number> = {
    critical: 10,
    high: 5,
    medium: 0,
    low: -5,
  };
  score += priorityAdjustment[recommendation.priority];

  // Bonus for addressing critical content gaps directly
  const criticalGaps = visibilityData.contentGaps.filter(
    (gap) => gap.severity === "critical"
  );
  if (criticalGaps.length > 0) {
    const addressesCriticalGap = criticalGaps.some((gap) =>
      recommendation.description.toLowerCase().includes(gap.type.toLowerCase()) ||
      recommendation.title.toLowerCase().includes(gap.type.toLowerCase())
    );
    if (addressesCriticalGap) {
      score += 5;
    }
  }

  // Bonus for targeting low-visibility platforms directly
  const lowVisibilityPlatforms = visibilityData.platforms.filter(
    (p) => p.mentionRate < 30
  );
  const targetsLowVisibility = lowVisibilityPlatforms.some((p) =>
    recommendation.aiPlatforms.some(
      (rp) => rp.toLowerCase() === p.name.toLowerCase()
    )
  );
  if (targetsLowVisibility) {
    score += 3;
  }

  // Ensure score is within valid range
  return Math.min(100, Math.max(0, Math.round(score)));
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Deduplicate recommendations by fuzzy title matching
 */
export function deduplicateRecommendations(
  recommendations: GeneratedRecommendation[],
  existingTitles: string[] = []
): {
  unique: GeneratedRecommendation[];
  duplicates: GeneratedRecommendation[];
} {
  const unique: GeneratedRecommendation[] = [];
  const duplicates: GeneratedRecommendation[] = [];
  const seenTitles = new Set(existingTitles.map(normalizeTitle));

  for (const rec of recommendations) {
    const normalizedTitle = normalizeTitle(rec.title);

    // Check for exact or fuzzy match
    let isDuplicate = seenTitles.has(normalizedTitle);

    if (!isDuplicate) {
      // Check for similarity with existing titles
      for (const existingTitle of Array.from(seenTitles)) {
        if (calculateSimilarity(normalizedTitle, existingTitle) > 0.8) {
          isDuplicate = true;
          break;
        }
      }
    }

    if (isDuplicate) {
      duplicates.push(rec);
    } else {
      unique.push(rec);
      seenTitles.add(normalizedTitle);
    }
  }

  return { unique, duplicates };
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Calculate Jaccard similarity between two strings
 */
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(" "));
  const wordsB = new Set(b.split(" "));

  const intersection = new Set(
    Array.from(wordsA).filter((x) => wordsB.has(x))
  );
  const union = new Set(Array.from(wordsA).concat(Array.from(wordsB)));

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}
