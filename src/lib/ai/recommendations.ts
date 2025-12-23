/**
 * AI-Powered Recommendation Generator
 * Uses Claude AI to analyze brand visibility data and generate actionable recommendations
 */

import { getClaudeClient, CLAUDE_MODELS, DEFAULT_MODELS } from "./claude";

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
  const {
    maxRecommendations = DEFAULT_MAX_RECOMMENDATIONS,
    minImpactThreshold = MIN_IMPACT_THRESHOLD,
  } = options;

  // Validate input
  if (!visibilityData.brandId) {
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
    return {
      success: true,
      recommendations: [],
      error: "Insufficient visibility data for analysis",
    };
  }

  // Build the analysis prompt
  const userPrompt = buildAnalysisPrompt(visibilityData);

  // Call Claude with retry logic
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callClaudeForRecommendations(userPrompt);

      // Parse and validate recommendations
      const recommendations = parseAndValidateRecommendations(
        result.text,
        visibilityData
      );

      // Calculate impact scores and filter
      const scoredRecommendations = recommendations
        .map((rec) => ({
          ...rec,
          impactScore: calculateRecommendationImpactScore(rec, visibilityData),
        }))
        .filter((rec) => rec.impactScore >= minImpactThreshold)
        .sort((a, b) => b.impactScore - a.impactScore)
        .slice(0, maxRecommendations);

      return {
        success: true,
        recommendations: scoredRecommendations,
        tokenUsage: result.usage,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation errors
      if (lastError.message.includes("Invalid JSON")) {
        break;
      }

      // Wait before retry with exponential backoff
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  return {
    success: false,
    recommendations: [],
    error: lastError?.message || "Failed to generate recommendations",
  };
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
 */
function parseAndValidateRecommendations(
  responseText: string,
  visibilityData: VisibilityData
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
 * Calculate impact score for a recommendation based on visibility data context
 */
function calculateRecommendationImpactScore(
  recommendation: AIRecommendationOutput,
  visibilityData: VisibilityData
): number {
  let score = 50; // Base score

  // Priority weight (40%)
  const priorityScores: Record<AIRecommendationOutput["priority"], number> = {
    critical: 40,
    high: 30,
    medium: 20,
    low: 10,
  };
  score += priorityScores[recommendation.priority] * 0.4;

  // Impact level weight (30%)
  const impactScores: Record<AIRecommendationOutput["impact"], number> = {
    high: 30,
    medium: 20,
    low: 10,
  };
  score += impactScores[recommendation.impact] * 0.3;

  // Platform coverage weight (20%)
  const platformCount = recommendation.aiPlatforms.length;
  const platformScore = Math.min(platformCount * 5, 20);
  score += platformScore;

  // Effort inverse weight (10%) - easier = higher score
  const effortScores: Record<AIRecommendationOutput["effort"], number> = {
    quick_win: 10,
    moderate: 5,
    major: 0,
  };
  score += effortScores[recommendation.effort];

  // Bonus for addressing critical content gaps
  const criticalGaps = visibilityData.contentGaps.filter(
    (gap) => gap.severity === "critical"
  );
  if (criticalGaps.length > 0) {
    const addressesCriticalGap = criticalGaps.some((gap) =>
      recommendation.description.toLowerCase().includes(gap.type.toLowerCase())
    );
    if (addressesCriticalGap) {
      score += 10;
    }
  }

  // Bonus for targeting low-visibility platforms
  const lowVisibilityPlatforms = visibilityData.platforms.filter(
    (p) => p.mentionRate < 30
  );
  const targetsLowVisibility = lowVisibilityPlatforms.some((p) =>
    recommendation.aiPlatforms.some(
      (rp) => rp.toLowerCase() === p.name.toLowerCase()
    )
  );
  if (targetsLowVisibility) {
    score += 5;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
