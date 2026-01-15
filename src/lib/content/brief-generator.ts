/**
 * Content Brief Generator
 * Phase 4: AI-optimized content briefs for maximum visibility
 *
 * Generates comprehensive content briefs with:
 * - Recommended headers (H1, H2, H3)
 * - Questions to answer (AEO optimization)
 * - Entity mentions to include
 * - Competitor content gaps
 * - AI citability predictions
 */

import { routeMessage, LLMProvider } from "@/lib/ai/router";
import { trackUsage } from "@/lib/ai/token-tracker";

// Types
export interface ContentBriefRequest {
  brandId: string;
  targetKeyword: string;
  secondaryKeywords?: string[];
  contentType: ContentType;
  brandContext: BrandContext;
  competitorUrls?: string[];
  targetWordCount?: number;
  targetAudience?: string;
}

export interface BrandContext {
  name: string;
  industry?: string;
  description?: string;
  voice?: {
    tone?: string;
    targetAudience?: string;
    keyMessages?: string[];
    avoidTopics?: string[];
  };
  keywords?: string[];
  competitors?: Array<{ name: string; url?: string }>;
}

export type ContentType =
  | "blog_post"
  | "landing_page"
  | "product_description"
  | "how_to_guide"
  | "listicle"
  | "comparison"
  | "case_study"
  | "press_release"
  | "faq_page";

export interface ContentBrief {
  id: string;
  targetKeyword: string;
  contentType: ContentType;
  title: RecommendedTitle;
  metaDescription: string;
  targetWordCount: number;
  estimatedReadTime: string;

  // Structure
  headers: HeaderStructure;
  introduction: IntroductionBrief;
  sections: SectionBrief[];
  conclusion: ConclusionBrief;

  // AEO Optimization
  questionsToAnswer: QuestionBrief[];
  featuredSnippetOpportunities: SnippetOpportunity[];

  // SEO/GEO Elements
  entities: EntityMention[];
  internalLinkSuggestions: LinkSuggestion[];
  externalSourceSuggestions: SourceSuggestion[];

  // Competitor Analysis
  competitorGaps: CompetitorGap[];
  uniqueAngle: string;

  // Schema Recommendations
  recommendedSchemas: SchemaRecommendation[];

  // Scoring
  predictedScores: PredictedScores;

  // Metadata
  generatedAt: string;
  brandId: string;
}

export interface RecommendedTitle {
  primary: string;
  alternatives: string[];
  seoScore: number;
  aiCitabilityScore: number;
}

export interface HeaderStructure {
  h1: string;
  h2s: Array<{
    text: string;
    targetKeyword?: string;
    isQuestion: boolean;
  }>;
  h3s: Array<{
    text: string;
    parentH2Index: number;
    isQuestion: boolean;
  }>;
}

export interface IntroductionBrief {
  hook: string;
  keyPoints: string[];
  targetLength: number;
  includeDefinition: boolean;
}

export interface SectionBrief {
  heading: string;
  purpose: string;
  keyPoints: string[];
  targetLength: number;
  includeVisual: boolean;
  visualSuggestion?: string;
  entities: string[];
  keywords: string[];
}

export interface ConclusionBrief {
  summary: string[];
  callToAction: string;
  targetLength: number;
}

export interface QuestionBrief {
  question: string;
  answerGuidelines: string;
  placement: "introduction" | "section" | "faq" | "conclusion";
  sectionIndex?: number;
  featuredSnippetPotential: number; // 1-10
  voiceSearchRelevance: number; // 1-10
}

export interface SnippetOpportunity {
  type: "paragraph" | "list" | "table" | "definition";
  targetQuery: string;
  format: string;
  placement: string;
  competitorHasIt: boolean;
}

export interface EntityMention {
  entity: string;
  type: "person" | "organization" | "place" | "product" | "concept" | "event";
  importance: "required" | "recommended" | "optional";
  contextSuggestion: string;
}

export interface LinkSuggestion {
  anchorText: string;
  targetPage: string;
  reason: string;
}

export interface SourceSuggestion {
  type: "statistic" | "study" | "expert_quote" | "definition";
  topic: string;
  suggestedSources: string[];
  reason: string;
}

export interface CompetitorGap {
  topic: string;
  description: string;
  opportunity: string;
  priority: "high" | "medium" | "low";
}

export interface SchemaRecommendation {
  type: string;
  reason: string;
  requiredFields: string[];
  priority: "required" | "recommended" | "optional";
}

export interface PredictedScores {
  seoScore: number;
  geoScore: number;
  aeoScore: number;
  overallScore: number;
  confidence: number;
}

// Quality validation thresholds
const QUALITY_THRESHOLDS = {
  minH2Sections: 5,
  maxH2Sections: 10,
  minH3PerH2: 1,
  minQuestions: 6,
  minEntities: 5,
  minSnippetOpportunities: 2,
  minCompetitorGaps: 2,
  minSectionLength: 200,
  maxSectionLength: 600,
};

export interface BriefQualityReport {
  isValid: boolean;
  overallQuality: "excellent" | "good" | "fair" | "poor";
  qualityScore: number; // 0-100
  issues: BriefQualityIssue[];
  suggestions: string[];
}

export interface BriefQualityIssue {
  severity: "error" | "warning" | "info";
  field: string;
  message: string;
  actual?: number | string;
  expected?: number | string;
}

/**
 * Generate a comprehensive content brief
 */
export async function generateContentBrief(
  request: ContentBriefRequest,
  trackingInfo?: { orgId: string; userId: string }
): Promise<ContentBrief> {
  const {
    brandId,
    targetKeyword,
    secondaryKeywords = [],
    contentType,
    brandContext,
    competitorUrls = [],
    targetWordCount = 1500,
    targetAudience,
  } = request;

  const systemPrompt = buildSystemPrompt(brandContext, contentType);
  const userPrompt = buildUserPrompt({
    targetKeyword,
    secondaryKeywords,
    contentType,
    competitorUrls,
    targetWordCount,
    targetAudience: targetAudience || brandContext.voice?.targetAudience,
  });

  const response = await routeMessage(systemPrompt, userPrompt, {
    provider: "claude" as LLMProvider,
    maxTokens: 8000,
  });

  // Track usage if tracking info provided
  if (trackingInfo) {
    await trackUsage({
      organizationId: trackingInfo.orgId,
      userId: trackingInfo.userId,
      provider: response.provider,
      model: response.model,
      operation: "content_brief_generation",
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    });
  }

  // Parse the response
  const briefData = parseContentBriefResponse(response.content);

  return {
    id: generateBriefId(),
    targetKeyword,
    contentType,
    targetWordCount,
    brandId,
    generatedAt: new Date().toISOString(),
    ...briefData,
  };
}

function buildSystemPrompt(
  brandContext: BrandContext,
  contentType: ContentType
): string {
  const contentTypeDescriptions: Record<ContentType, string> = {
    blog_post: "informative blog article",
    landing_page: "conversion-focused landing page",
    product_description: "compelling product description",
    how_to_guide: "step-by-step instructional guide",
    listicle: "list-based article",
    comparison: "comparison or versus article",
    case_study: "detailed case study",
    press_release: "professional press release",
    faq_page: "comprehensive FAQ page",
  };

  return `You are an expert content strategist specializing in AI-optimized content that ranks in both traditional search engines AND gets cited by AI assistants (ChatGPT, Claude, Gemini, Perplexity).

Your task is to create a comprehensive content brief for a ${contentTypeDescriptions[contentType]}.

BRAND CONTEXT:
- Brand: ${brandContext.name}
- Industry: ${brandContext.industry || "Not specified"}
- Description: ${brandContext.description || "Not provided"}
- Voice/Tone: ${brandContext.voice?.tone || "Professional"}
- Target Audience: ${brandContext.voice?.targetAudience || "General"}
- Key Messages: ${brandContext.voice?.keyMessages?.join(", ") || "None specified"}
- Topics to Avoid: ${brandContext.voice?.avoidTopics?.join(", ") || "None"}
- Known Competitors: ${brandContext.competitors?.map((c) => c.name).join(", ") || "None specified"}

OPTIMIZATION GOALS:
1. SEO: Optimize for Google/Bing search rankings
2. GEO: Structure content to be cited by AI assistants
3. AEO: Target featured snippets and zero-click results

You must respond with valid JSON matching the specified schema.`;
}

function buildUserPrompt(options: {
  targetKeyword: string;
  secondaryKeywords: string[];
  contentType: ContentType;
  competitorUrls: string[];
  targetWordCount: number;
  targetAudience?: string;
}): string {
  const {
    targetKeyword,
    secondaryKeywords,
    contentType,
    targetWordCount,
    targetAudience,
  } = options;

  return `Create a comprehensive content brief for:

TARGET KEYWORD: "${targetKeyword}"
SECONDARY KEYWORDS: ${secondaryKeywords.length > 0 ? secondaryKeywords.join(", ") : "None specified"}
CONTENT TYPE: ${contentType}
TARGET WORD COUNT: ${targetWordCount}
TARGET AUDIENCE: ${targetAudience || "Not specified"}

Generate a JSON response with this exact structure:
{
  "title": {
    "primary": "Main title with keyword",
    "alternatives": ["Alt 1", "Alt 2", "Alt 3"],
    "seoScore": 85,
    "aiCitabilityScore": 78
  },
  "metaDescription": "155-160 char meta description",
  "estimatedReadTime": "X min read",
  "headers": {
    "h1": "Main heading",
    "h2s": [
      { "text": "Section heading", "targetKeyword": "keyword or null", "isQuestion": false }
    ],
    "h3s": [
      { "text": "Subsection", "parentH2Index": 0, "isQuestion": false }
    ]
  },
  "introduction": {
    "hook": "Opening hook sentence",
    "keyPoints": ["Point 1", "Point 2", "Point 3"],
    "targetLength": 150,
    "includeDefinition": true
  },
  "sections": [
    {
      "heading": "Section heading",
      "purpose": "Why this section matters",
      "keyPoints": ["Point 1", "Point 2"],
      "targetLength": 300,
      "includeVisual": true,
      "visualSuggestion": "Infographic showing...",
      "entities": ["Entity 1", "Entity 2"],
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "conclusion": {
    "summary": ["Key takeaway 1", "Key takeaway 2"],
    "callToAction": "CTA text",
    "targetLength": 150
  },
  "questionsToAnswer": [
    {
      "question": "What is X?",
      "answerGuidelines": "Brief, authoritative definition",
      "placement": "introduction",
      "featuredSnippetPotential": 9,
      "voiceSearchRelevance": 8
    }
  ],
  "featuredSnippetOpportunities": [
    {
      "type": "paragraph",
      "targetQuery": "what is X",
      "format": "40-60 word definition paragraph",
      "placement": "Introduction after hook",
      "competitorHasIt": false
    }
  ],
  "entities": [
    {
      "entity": "Entity name",
      "type": "concept",
      "importance": "required",
      "contextSuggestion": "How to naturally mention it"
    }
  ],
  "internalLinkSuggestions": [
    {
      "anchorText": "anchor text",
      "targetPage": "suggested page type",
      "reason": "why link here"
    }
  ],
  "externalSourceSuggestions": [
    {
      "type": "statistic",
      "topic": "topic area",
      "suggestedSources": ["Source 1", "Source 2"],
      "reason": "why this adds credibility"
    }
  ],
  "competitorGaps": [
    {
      "topic": "Gap topic",
      "description": "What competitors miss",
      "opportunity": "How to capitalize",
      "priority": "high"
    }
  ],
  "uniqueAngle": "What makes this content different",
  "recommendedSchemas": [
    {
      "type": "Article",
      "reason": "Why this schema",
      "requiredFields": ["headline", "author", "datePublished"],
      "priority": "required"
    }
  ],
  "predictedScores": {
    "seoScore": 82,
    "geoScore": 78,
    "aeoScore": 85,
    "overallScore": 81,
    "confidence": 75
  }
}

IMPORTANT:
- Include at least 5-7 H2 sections
- Include 2-3 H3s per H2
- Generate 8-10 questions to answer
- Identify at least 3 featured snippet opportunities
- List 5-10 relevant entities
- Suggest 3-5 competitor gaps
- Recommend appropriate schema types`;
}

function parseContentBriefResponse(content: string): Omit<
  ContentBrief,
  "id" | "targetKeyword" | "contentType" | "targetWordCount" | "brandId" | "generatedAt"
> {
  try {
    // Extract JSON from response
    const jsonMatch =
      content.match(/```json\n?([\s\S]*?)\n?```/) ||
      content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    // Validate and provide defaults
    return {
      title: parsed.title || {
        primary: "Untitled Brief",
        alternatives: [],
        seoScore: 0,
        aiCitabilityScore: 0,
      },
      metaDescription: parsed.metaDescription || "",
      estimatedReadTime: parsed.estimatedReadTime || "5 min read",
      headers: parsed.headers || { h1: "", h2s: [], h3s: [] },
      introduction: parsed.introduction || {
        hook: "",
        keyPoints: [],
        targetLength: 150,
        includeDefinition: false,
      },
      sections: parsed.sections || [],
      conclusion: parsed.conclusion || {
        summary: [],
        callToAction: "",
        targetLength: 150,
      },
      questionsToAnswer: parsed.questionsToAnswer || [],
      featuredSnippetOpportunities: parsed.featuredSnippetOpportunities || [],
      entities: parsed.entities || [],
      internalLinkSuggestions: parsed.internalLinkSuggestions || [],
      externalSourceSuggestions: parsed.externalSourceSuggestions || [],
      competitorGaps: parsed.competitorGaps || [],
      uniqueAngle: parsed.uniqueAngle || "",
      recommendedSchemas: parsed.recommendedSchemas || [],
      predictedScores: parsed.predictedScores || {
        seoScore: 0,
        geoScore: 0,
        aeoScore: 0,
        overallScore: 0,
        confidence: 0,
      },
    };
  } catch (error) {
    console.error("Failed to parse content brief response:", error);
    // Return minimal valid structure
    return {
      title: {
        primary: "Failed to generate brief",
        alternatives: [],
        seoScore: 0,
        aiCitabilityScore: 0,
      },
      metaDescription: "",
      estimatedReadTime: "0 min",
      headers: { h1: "", h2s: [], h3s: [] },
      introduction: {
        hook: "",
        keyPoints: [],
        targetLength: 0,
        includeDefinition: false,
      },
      sections: [],
      conclusion: { summary: [], callToAction: "", targetLength: 0 },
      questionsToAnswer: [],
      featuredSnippetOpportunities: [],
      entities: [],
      internalLinkSuggestions: [],
      externalSourceSuggestions: [],
      competitorGaps: [],
      uniqueAngle: "",
      recommendedSchemas: [],
      predictedScores: {
        seoScore: 0,
        geoScore: 0,
        aeoScore: 0,
        overallScore: 0,
        confidence: 0,
      },
    };
  }
}

function generateBriefId(): string {
  return `brief_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Analyze existing content against a brief to measure alignment
 */
export function analyzeBriefAlignment(
  brief: ContentBrief,
  content: string
): {
  overallAlignment: number;
  headersUsed: number;
  questionsAnswered: number;
  entitiesMentioned: number;
  recommendations: string[];
} {
  const contentLower = content.toLowerCase();

  // Check headers
  const allHeaders = [
    brief.headers.h1,
    ...brief.headers.h2s.map((h) => h.text),
    ...brief.headers.h3s.map((h) => h.text),
  ];
  const headersFound = allHeaders.filter(
    (h) => h && contentLower.includes(h.toLowerCase())
  );
  const headersUsed = Math.round((headersFound.length / allHeaders.length) * 100);

  // Check questions
  const questionsAnswered = brief.questionsToAnswer.filter((q) =>
    contentLower.includes(q.question.toLowerCase().replace("?", ""))
  ).length;
  const questionsPercent = Math.round(
    (questionsAnswered / brief.questionsToAnswer.length) * 100
  );

  // Check entities
  const entitiesFound = brief.entities.filter((e) =>
    contentLower.includes(e.entity.toLowerCase())
  );
  const entitiesMentioned = Math.round(
    (entitiesFound.length / brief.entities.length) * 100
  );

  // Generate recommendations
  const recommendations: string[] = [];

  if (headersUsed < 70) {
    recommendations.push(
      `Use more recommended headers. Currently using ${headersUsed}% of suggested headers.`
    );
  }

  if (questionsPercent < 60) {
    recommendations.push(
      `Answer more target questions. Only ${questionsAnswered} of ${brief.questionsToAnswer.length} questions addressed.`
    );
  }

  if (entitiesMentioned < 50) {
    const missingRequired = brief.entities
      .filter(
        (e) =>
          e.importance === "required" &&
          !contentLower.includes(e.entity.toLowerCase())
      )
      .map((e) => e.entity);
    if (missingRequired.length > 0) {
      recommendations.push(
        `Missing required entities: ${missingRequired.join(", ")}`
      );
    }
  }

  // Overall alignment
  const overallAlignment = Math.round(
    (headersUsed * 0.3 + questionsPercent * 0.4 + entitiesMentioned * 0.3)
  );

  return {
    overallAlignment,
    headersUsed,
    questionsAnswered: questionsPercent,
    entitiesMentioned,
    recommendations,
  };
}

/**
 * Validate content brief quality and provide feedback
 * Ensures the AI generated sufficient, high-quality content
 */
export function validateBriefQuality(brief: ContentBrief): BriefQualityReport {
  const issues: BriefQualityIssue[] = [];
  const suggestions: string[] = [];
  let qualityScore = 100;

  // Check H2 sections count
  const h2Count = brief.headers.h2s.length;
  if (h2Count < QUALITY_THRESHOLDS.minH2Sections) {
    issues.push({
      severity: "error",
      field: "headers.h2s",
      message: `Insufficient H2 sections`,
      actual: h2Count,
      expected: `${QUALITY_THRESHOLDS.minH2Sections}+`,
    });
    qualityScore -= 15;
    suggestions.push("Add more main sections (H2 headings) to provide comprehensive coverage");
  } else if (h2Count > QUALITY_THRESHOLDS.maxH2Sections) {
    issues.push({
      severity: "warning",
      field: "headers.h2s",
      message: `Too many H2 sections may dilute focus`,
      actual: h2Count,
      expected: `${QUALITY_THRESHOLDS.minH2Sections}-${QUALITY_THRESHOLDS.maxH2Sections}`,
    });
    qualityScore -= 5;
  }

  // Check H3 subsections
  const h3Count = brief.headers.h3s.length;
  const avgH3PerH2 = h2Count > 0 ? h3Count / h2Count : 0;
  if (avgH3PerH2 < QUALITY_THRESHOLDS.minH3PerH2) {
    issues.push({
      severity: "warning",
      field: "headers.h3s",
      message: `Low H3 density per H2 section`,
      actual: avgH3PerH2.toFixed(1),
      expected: `${QUALITY_THRESHOLDS.minH3PerH2}+ per H2`,
    });
    qualityScore -= 5;
    suggestions.push("Add subsections (H3 headings) to break down complex topics");
  }

  // Check questions to answer
  const questionCount = brief.questionsToAnswer.length;
  if (questionCount < QUALITY_THRESHOLDS.minQuestions) {
    issues.push({
      severity: "error",
      field: "questionsToAnswer",
      message: `Insufficient questions for AEO optimization`,
      actual: questionCount,
      expected: `${QUALITY_THRESHOLDS.minQuestions}+`,
    });
    qualityScore -= 15;
    suggestions.push("Add more questions to answer for better AI assistant visibility");
  }

  // Check entities
  const entityCount = brief.entities.length;
  if (entityCount < QUALITY_THRESHOLDS.minEntities) {
    issues.push({
      severity: "warning",
      field: "entities",
      message: `Few entity mentions suggested`,
      actual: entityCount,
      expected: `${QUALITY_THRESHOLDS.minEntities}+`,
    });
    qualityScore -= 10;
    suggestions.push("Include more named entities (people, organizations, concepts) for semantic richness");
  }

  // Check required entities exist
  const requiredEntities = brief.entities.filter((e) => e.importance === "required");
  if (requiredEntities.length === 0 && entityCount > 0) {
    issues.push({
      severity: "info",
      field: "entities",
      message: `No entities marked as required`,
    });
    suggestions.push("Consider marking key entities as 'required' for content completeness");
  }

  // Check featured snippet opportunities
  const snippetCount = brief.featuredSnippetOpportunities.length;
  if (snippetCount < QUALITY_THRESHOLDS.minSnippetOpportunities) {
    issues.push({
      severity: "warning",
      field: "featuredSnippetOpportunities",
      message: `Few snippet opportunities identified`,
      actual: snippetCount,
      expected: `${QUALITY_THRESHOLDS.minSnippetOpportunities}+`,
    });
    qualityScore -= 5;
  }

  // Check competitor gaps
  const gapCount = brief.competitorGaps.length;
  if (gapCount < QUALITY_THRESHOLDS.minCompetitorGaps) {
    issues.push({
      severity: "info",
      field: "competitorGaps",
      message: `Few competitor gaps identified`,
      actual: gapCount,
      expected: `${QUALITY_THRESHOLDS.minCompetitorGaps}+`,
    });
  }

  // Check sections have reasonable lengths
  const sectionsWithBadLength = brief.sections.filter(
    (s) =>
      s.targetLength < QUALITY_THRESHOLDS.minSectionLength ||
      s.targetLength > QUALITY_THRESHOLDS.maxSectionLength
  );
  if (sectionsWithBadLength.length > 0) {
    issues.push({
      severity: "info",
      field: "sections",
      message: `${sectionsWithBadLength.length} section(s) have unusual target lengths`,
      actual: sectionsWithBadLength.map((s) => s.targetLength).join(", "),
      expected: `${QUALITY_THRESHOLDS.minSectionLength}-${QUALITY_THRESHOLDS.maxSectionLength}`,
    });
  }

  // Check schema recommendations
  if (brief.recommendedSchemas.length === 0) {
    issues.push({
      severity: "warning",
      field: "recommendedSchemas",
      message: `No schema markup recommended`,
    });
    qualityScore -= 5;
    suggestions.push("Add schema markup recommendations for better search visibility");
  }

  // Check title quality
  if (!brief.title.primary || brief.title.primary.length < 30) {
    issues.push({
      severity: "warning",
      field: "title",
      message: `Title may be too short for SEO`,
      actual: brief.title.primary?.length || 0,
      expected: "30-60 characters",
    });
    qualityScore -= 5;
  }

  // Check meta description
  if (!brief.metaDescription || brief.metaDescription.length < 120) {
    issues.push({
      severity: "warning",
      field: "metaDescription",
      message: `Meta description may be too short`,
      actual: brief.metaDescription?.length || 0,
      expected: "120-160 characters",
    });
    qualityScore -= 5;
  } else if (brief.metaDescription.length > 160) {
    issues.push({
      severity: "info",
      field: "metaDescription",
      message: `Meta description may be truncated in search results`,
      actual: brief.metaDescription.length,
      expected: "120-160 characters",
    });
  }

  // Check unique angle
  if (!brief.uniqueAngle || brief.uniqueAngle.length < 20) {
    issues.push({
      severity: "info",
      field: "uniqueAngle",
      message: `Unique angle is missing or vague`,
    });
    suggestions.push("Define a clear unique angle to differentiate content from competitors");
  }

  // Ensure score doesn't go below 0
  qualityScore = Math.max(0, qualityScore);

  // Determine overall quality rating
  let overallQuality: BriefQualityReport["overallQuality"];
  if (qualityScore >= 85) {
    overallQuality = "excellent";
  } else if (qualityScore >= 70) {
    overallQuality = "good";
  } else if (qualityScore >= 50) {
    overallQuality = "fair";
  } else {
    overallQuality = "poor";
  }

  // Check if valid (no critical errors)
  const hasErrors = issues.some((i) => i.severity === "error");
  const isValid = !hasErrors && qualityScore >= 50;

  return {
    isValid,
    overallQuality,
    qualityScore,
    issues,
    suggestions,
  };
}
