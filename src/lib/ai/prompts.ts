/**
 * Prompt Templates - Reusable prompts for AI operations
 * F089: Templating system for sentiment, suggestions, analysis
 */

// Template variable substitution
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | boolean | undefined>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(placeholder, String(value ?? ""));
  }
  return result;
}

// Base prompt templates
export const PROMPTS = {
  // Sentiment Analysis
  SENTIMENT_ANALYSIS: {
    system: `You are an expert sentiment analysis system for brand monitoring.
Analyze the sentiment of AI-generated mentions about brands.
Focus on: tone, intent, accuracy of claims, and potential impact on brand perception.
Always provide a numerical score from -1 (very negative) to +1 (very positive).`,
    user: `Analyze the sentiment of this AI platform mention about "{{brandName}}":

Platform: {{platform}}
Query: {{query}}
Response: {{response}}

Provide your analysis in this JSON format:
{
  "score": <number between -1 and 1>,
  "label": "<positive|neutral|negative>",
  "confidence": <number between 0 and 1>,
  "aspects": {
    "accuracy": "<accurate|partially_accurate|inaccurate>",
    "tone": "<favorable|neutral|unfavorable>",
    "prominence": "<primary|secondary|mentioned>"
  },
  "summary": "<one sentence summary>",
  "keyPhrases": ["<key phrase 1>", "<key phrase 2>"]
}`,
  },

  // Content Suggestion Generation
  CONTENT_SUGGESTIONS: {
    system: `You are an expert GEO (Generative Engine Optimization) strategist.
Your role is to suggest content improvements that will increase brand visibility in AI-generated responses.
Focus on: structured data, semantic clarity, authoritative sourcing, and comprehensive coverage.`,
    user: `Generate content suggestions to improve AI visibility for "{{brandName}}":

Current Context:
- Industry: {{industry}}
- Current GEO Score: {{geoScore}}/100
- Primary Keywords: {{keywords}}
- Competitor Brands: {{competitors}}
- Weak Areas: {{weakAreas}}

Generate 5 specific, actionable content suggestions in this JSON format:
{
  "suggestions": [
    {
      "title": "<suggestion title>",
      "description": "<detailed description>",
      "impact": "<high|medium|low>",
      "effort": "<high|medium|low>",
      "category": "<schema|content|technical|authority>",
      "implementation": "<specific steps to implement>"
    }
  ]
}`,
  },

  // Competitor Analysis
  COMPETITOR_ANALYSIS: {
    system: `You are an expert competitive intelligence analyst for AI visibility.
Analyze how brands appear in AI-generated responses compared to competitors.
Focus on: positioning, share of voice, unique differentiators, and opportunities.`,
    user: `Analyze competitive positioning in AI responses for "{{brandName}}":

Brand Mentions:
{{brandMentions}}

Competitor Mentions ({{competitorName}}):
{{competitorMentions}}

Platform: {{platform}}
Topic: {{topic}}

Provide analysis in this JSON format:
{
  "shareOfVoice": {
    "brand": <percentage>,
    "competitor": <percentage>
  },
  "positioning": {
    "brand": "<how brand is positioned>",
    "competitor": "<how competitor is positioned>"
  },
  "strengths": ["<brand strength 1>", "<brand strength 2>"],
  "opportunities": ["<opportunity 1>", "<opportunity 2>"],
  "threats": ["<threat 1>", "<threat 2>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}`,
  },

  // Query Intent Classification
  QUERY_INTENT: {
    system: `You are an expert at classifying search query intent for brand monitoring.
Categorize queries by: purchase intent, informational need, comparison intent, and brand specificity.`,
    user: `Classify the intent of this query and its relevance to "{{brandName}}":

Query: "{{query}}"
Context: {{context}}

Provide classification in this JSON format:
{
  "primaryIntent": "<informational|navigational|transactional|comparison>",
  "purchaseIntent": "<high|medium|low|none>",
  "brandRelevance": "<direct|indirect|tangential>",
  "competitorMention": <true|false>,
  "stageOfJourney": "<awareness|consideration|decision|retention>",
  "confidence": <number between 0 and 1>
}`,
  },

  // Content Quality Analysis
  CONTENT_QUALITY: {
    system: `You are an expert content quality analyst for AI optimization.
Evaluate content for its likelihood to be cited by AI systems.
Focus on: clarity, authority signals, structure, factual accuracy, and comprehensiveness.`,
    user: `Analyze this content's quality for AI citation potential:

Content Title: {{title}}
Content: {{content}}
Target Keywords: {{keywords}}

Provide analysis in this JSON format:
{
  "overallScore": <number 0-100>,
  "dimensions": {
    "clarity": <0-100>,
    "authority": <0-100>,
    "structure": <0-100>,
    "comprehensiveness": <0-100>,
    "freshness": <0-100>
  },
  "aiCitationProbability": "<high|medium|low>",
  "improvements": [
    {
      "area": "<area to improve>",
      "suggestion": "<specific suggestion>",
      "priority": "<high|medium|low>"
    }
  ],
  "missingElements": ["<element 1>", "<element 2>"]
}`,
  },

  // Brand Voice Extraction
  BRAND_VOICE: {
    system: `You are an expert brand voice analyst.
Extract and codify brand voice characteristics from sample content.
Focus on: tone, vocabulary, sentence structure, and distinctive patterns.`,
    user: `Analyze the brand voice from these content samples for "{{brandName}}":

Sample 1: {{sample1}}
Sample 2: {{sample2}}
Sample 3: {{sample3}}

Extract brand voice profile in this JSON format:
{
  "voiceAttributes": {
    "tone": ["<attribute 1>", "<attribute 2>"],
    "personality": ["<trait 1>", "<trait 2>"],
    "values": ["<value 1>", "<value 2>"]
  },
  "writingStyle": {
    "sentenceLength": "<short|medium|long|varied>",
    "vocabulary": "<simple|moderate|sophisticated>",
    "formality": "<casual|professional|formal>"
  },
  "distinctivePatterns": ["<pattern 1>", "<pattern 2>"],
  "doNotUse": ["<avoid 1>", "<avoid 2>"],
  "examplePhrases": ["<phrase 1>", "<phrase 2>"]
}`,
  },

  // Recommendation Generation
  RECOMMENDATION_GENERATION: {
    system: `You are an expert GEO strategist generating actionable recommendations.
Create specific, prioritized recommendations to improve AI visibility.
Focus on: impact, feasibility, and clear implementation steps.`,
    user: `Generate recommendations for "{{brandName}}" based on this audit data:

Current State:
- GEO Score: {{geoScore}}/100
- Visibility Score: {{visibilityScore}}/100
- Citation Rate: {{citationRate}}%
- Top Platforms: {{platforms}}

Issues Found:
{{issues}}

Generate prioritized recommendations in this JSON format:
{
  "recommendations": [
    {
      "id": "<unique_id>",
      "title": "<clear action title>",
      "description": "<detailed description>",
      "category": "<schema|content|technical|authority|competitive>",
      "impact": "<high|medium|low>",
      "effort": "<high|medium|low>",
      "priority": <1-10>,
      "estimatedImprovement": "<expected score improvement>",
      "steps": [
        "<step 1>",
        "<step 2>",
        "<step 3>"
      ],
      "resources": ["<resource 1>", "<resource 2>"],
      "deadline": "<suggested timeframe>"
    }
  ]
}`,
  },

  // Summary Generation
  SUMMARY_GENERATION: {
    system: `You are an expert at generating concise, insightful summaries for brand monitoring dashboards.
Create executive-level summaries that highlight key insights and trends.`,
    user: `Generate a summary of AI visibility performance for "{{brandName}}":

Time Period: {{period}}
GEO Score Change: {{scoreChange}}
Total Mentions: {{totalMentions}}
Sentiment Distribution: {{sentimentDistribution}}
Top Platforms: {{topPlatforms}}
Key Events: {{keyEvents}}

Generate summary in this JSON format:
{
  "headline": "<one line headline>",
  "summary": "<2-3 sentence executive summary>",
  "keyInsights": [
    "<insight 1>",
    "<insight 2>",
    "<insight 3>"
  ],
  "trends": {
    "positive": ["<positive trend 1>"],
    "negative": ["<negative trend 1>"],
    "neutral": ["<neutral observation 1>"]
  },
  "actionItems": ["<action 1>", "<action 2>"],
  "outlook": "<positive|stable|concerning>"
}`,
  },
} as const;

// Template types
export type PromptTemplate = keyof typeof PROMPTS;

/**
 * Get a rendered prompt pair (system + user)
 */
export function getPrompt(
  template: PromptTemplate,
  variables: Record<string, string | number | boolean | undefined>
): { system: string; user: string } {
  const promptPair = PROMPTS[template];
  return {
    system: renderTemplate(promptPair.system, variables),
    user: renderTemplate(promptPair.user, variables),
  };
}

/**
 * Validate that all required variables are provided
 */
export function validateVariables(
  template: PromptTemplate,
  variables: Record<string, string | number | boolean | undefined>
): { valid: boolean; missing: string[] } {
  const promptPair = PROMPTS[template];
  const combined = promptPair.system + promptPair.user;

  // Extract all variable placeholders
  const placeholders = combined.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
  const requiredVars = [
    ...new Set(placeholders.map((p) => p.replace(/[{}\s]/g, ""))),
  ];

  const missing = requiredVars.filter(
    (v) => variables[v] === undefined || variables[v] === ""
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Create a custom prompt from scratch
 */
export function createCustomPrompt(
  systemPrompt: string,
  userPromptTemplate: string
): (variables: Record<string, string | number | boolean | undefined>) => {
  system: string;
  user: string;
} {
  return (variables) => ({
    system: renderTemplate(systemPrompt, variables),
    user: renderTemplate(userPromptTemplate, variables),
  });
}

/**
 * Estimate token count for a prompt
 */
export function estimatePromptTokens(prompt: {
  system: string;
  user: string;
}): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil((prompt.system.length + prompt.user.length) / 4);
}
