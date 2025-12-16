/**
 * AEO (Answer Engine Optimization) Score Calculator
 * Measures how well content is optimized for featured snippets,
 * zero-click results, and voice search
 */

export interface AEOScoreInput {
  // Featured Snippets
  featuredSnippetsOwned: number;
  featuredSnippetsCompetitors: number;
  snippetOpportunities: number;

  // People Also Ask
  paaRankings: number; // Number of PAA boxes appearing for
  paaOpportunities: number;

  // Voice Search Readiness
  averageReadingLevel: number; // 1-12 grade level
  questionBasedContent: number; // percentage of content starting with who/what/why/how
  conciseAnswers: number; // number of direct answer paragraphs under 50 words

  // Schema & Structured Data
  hasFAQSchema: boolean;
  hasHowToSchema: boolean;
  hasQASchema: boolean;
  hasArticleSchema: boolean;
  hasBreadcrumbSchema: boolean;

  // Content Structure
  listsAndTables: number; // count
  definitionBlocks: number; // count
  stepByStepContent: number; // count of numbered/ordered lists

  // AI Overview / SGE Readiness
  entityCoverage: number; // 0-100, how well entities are defined
  factualDensity: number; // 0-100, density of verifiable facts
  sourceCredibility: number; // 0-100, authority of cited sources
}

export interface AEOScoreResult {
  score: number;
  breakdown: {
    snippets: number;
    voiceReady: number;
    schema: number;
    structure: number;
    aiReady: number;
  };
  recommendations: string[];
  opportunities: AEOOpportunity[];
}

export interface AEOOpportunity {
  type: "featured_snippet" | "paa" | "voice" | "ai_overview";
  keyword?: string;
  currentOwner?: string;
  estimatedImpact: "high" | "medium" | "low";
  action: string;
}

/**
 * Calculate Featured Snippets Score
 */
function calculateSnippetsScore(input: AEOScoreInput): { score: number; opportunities: AEOOpportunity[] } {
  const opportunities: AEOOpportunity[] = [];

  // Calculate snippet ownership rate
  const totalSnippets = input.featuredSnippetsOwned + input.featuredSnippetsCompetitors;
  let ownershipScore = 0;

  if (totalSnippets > 0) {
    const ownershipRate = input.featuredSnippetsOwned / totalSnippets;
    ownershipScore = Math.round(ownershipRate * 50);
  }

  // Score for opportunities identified
  const opportunityScore = Math.min(30, input.snippetOpportunities * 3);

  // PAA presence
  const paaScore = Math.min(20, input.paaRankings * 4);

  const score = Math.min(100, ownershipScore + opportunityScore + paaScore);

  // Generate opportunities
  if (input.snippetOpportunities > 0) {
    opportunities.push({
      type: "featured_snippet",
      estimatedImpact: "high",
      action: `${input.snippetOpportunities} featured snippet opportunities identified - optimize content structure`,
    });
  }

  if (input.paaOpportunities > 0) {
    opportunities.push({
      type: "paa",
      estimatedImpact: "medium",
      action: `Target ${input.paaOpportunities} "People Also Ask" opportunities with Q&A content`,
    });
  }

  return { score, opportunities };
}

/**
 * Calculate Voice Search Readiness Score
 */
function calculateVoiceReadyScore(input: AEOScoreInput): { score: number; opportunities: AEOOpportunity[] } {
  const opportunities: AEOOpportunity[] = [];
  let score = 0;

  // Reading Level (30 points)
  // Ideal: Grade 6-9 for voice search
  if (input.averageReadingLevel >= 6 && input.averageReadingLevel <= 9) {
    score += 30;
  } else if (input.averageReadingLevel >= 5 && input.averageReadingLevel <= 10) {
    score += 20;
  } else if (input.averageReadingLevel > 10) {
    score += 10;
    opportunities.push({
      type: "voice",
      estimatedImpact: "medium",
      action: "Simplify content language for better voice search compatibility",
    });
  } else {
    score += 15;
  }

  // Question-Based Content (35 points)
  // Content that directly answers questions
  if (input.questionBasedContent >= 20) {
    score += 35;
  } else if (input.questionBasedContent >= 10) {
    score += 25;
  } else if (input.questionBasedContent >= 5) {
    score += 15;
    opportunities.push({
      type: "voice",
      estimatedImpact: "high",
      action: "Add more question-based headings (Who, What, Why, How, When)",
    });
  } else {
    score += 5;
    opportunities.push({
      type: "voice",
      estimatedImpact: "high",
      action: "Restructure content with question-and-answer format",
    });
  }

  // Concise Answers (35 points)
  // Short, direct answers that voice assistants can read
  if (input.conciseAnswers >= 10) {
    score += 35;
  } else if (input.conciseAnswers >= 5) {
    score += 25;
  } else if (input.conciseAnswers >= 2) {
    score += 15;
    opportunities.push({
      type: "voice",
      estimatedImpact: "medium",
      action: "Add more concise answer blocks (under 50 words) for voice search",
    });
  } else {
    score += 5;
  }

  return { score: Math.min(100, score), opportunities };
}

/**
 * Calculate Schema Score
 */
function calculateSchemaScore(input: AEOScoreInput): { score: number; opportunities: AEOOpportunity[] } {
  const opportunities: AEOOpportunity[] = [];
  let score = 0;

  // FAQ Schema (25 points) - Most important for AEO
  if (input.hasFAQSchema) {
    score += 25;
  } else {
    opportunities.push({
      type: "featured_snippet",
      estimatedImpact: "high",
      action: "Implement FAQ Schema markup for Q&A content",
    });
  }

  // HowTo Schema (25 points)
  if (input.hasHowToSchema) {
    score += 25;
  } else if (input.stepByStepContent > 0) {
    opportunities.push({
      type: "featured_snippet",
      estimatedImpact: "high",
      action: "Add HowTo Schema to step-by-step content",
    });
  }

  // Q&A Schema (20 points)
  if (input.hasQASchema) {
    score += 20;
  }

  // Article Schema (15 points)
  if (input.hasArticleSchema) {
    score += 15;
  }

  // Breadcrumb Schema (15 points)
  if (input.hasBreadcrumbSchema) {
    score += 15;
  }

  return { score: Math.min(100, score), opportunities };
}

/**
 * Calculate Content Structure Score
 */
function calculateStructureScore(input: AEOScoreInput): { score: number } {
  let score = 0;

  // Lists and Tables (40 points)
  // Google loves well-structured content
  if (input.listsAndTables >= 5) {
    score += 40;
  } else if (input.listsAndTables >= 3) {
    score += 30;
  } else if (input.listsAndTables >= 1) {
    score += 20;
  }

  // Definition Blocks (30 points)
  if (input.definitionBlocks >= 3) {
    score += 30;
  } else if (input.definitionBlocks >= 1) {
    score += 20;
  }

  // Step-by-Step Content (30 points)
  if (input.stepByStepContent >= 3) {
    score += 30;
  } else if (input.stepByStepContent >= 1) {
    score += 20;
  }

  return { score: Math.min(100, score) };
}

/**
 * Calculate AI Overview / SGE Readiness Score
 */
function calculateAIReadyScore(input: AEOScoreInput): { score: number; opportunities: AEOOpportunity[] } {
  const opportunities: AEOOpportunity[] = [];

  // Entity Coverage (35 points)
  const entityScore = Math.round((input.entityCoverage / 100) * 35);

  // Factual Density (35 points)
  const factualScore = Math.round((input.factualDensity / 100) * 35);

  // Source Credibility (30 points)
  const credibilityScore = Math.round((input.sourceCredibility / 100) * 30);

  const score = entityScore + factualScore + credibilityScore;

  if (input.entityCoverage < 60) {
    opportunities.push({
      type: "ai_overview",
      estimatedImpact: "high",
      action: "Define key entities (people, places, concepts) more clearly in content",
    });
  }

  if (input.factualDensity < 50) {
    opportunities.push({
      type: "ai_overview",
      estimatedImpact: "medium",
      action: "Increase factual, verifiable information density",
    });
  }

  if (input.sourceCredibility < 60) {
    opportunities.push({
      type: "ai_overview",
      estimatedImpact: "medium",
      action: "Cite more authoritative sources to improve credibility",
    });
  }

  return { score: Math.min(100, score), opportunities };
}

/**
 * Calculate Complete AEO Score
 */
export function calculateAEOScore(input: AEOScoreInput): AEOScoreResult {
  const snippets = calculateSnippetsScore(input);
  const voiceReady = calculateVoiceReadyScore(input);
  const schema = calculateSchemaScore(input);
  const structure = calculateStructureScore(input);
  const aiReady = calculateAIReadyScore(input);

  // Weighted average
  const overallScore = Math.round(
    snippets.score * 0.25 +
    voiceReady.score * 0.20 +
    schema.score * 0.20 +
    structure.score * 0.15 +
    aiReady.score * 0.20
  );

  // Combine all opportunities
  const allOpportunities = [
    ...snippets.opportunities,
    ...voiceReady.opportunities,
    ...schema.opportunities,
    ...aiReady.opportunities,
  ];

  // Generate recommendations from opportunities
  const recommendations = allOpportunities
    .sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.estimatedImpact] - impactOrder[b.estimatedImpact];
    })
    .slice(0, 5)
    .map((opp) => opp.action);

  return {
    score: overallScore,
    breakdown: {
      snippets: snippets.score,
      voiceReady: voiceReady.score,
      schema: schema.score,
      structure: structure.score,
      aiReady: aiReady.score,
    },
    recommendations,
    opportunities: allOpportunities,
  };
}

/**
 * Create default AEO input for a new/unknown site
 */
export function createDefaultAEOInput(): AEOScoreInput {
  return {
    featuredSnippetsOwned: 0,
    featuredSnippetsCompetitors: 5,
    snippetOpportunities: 10,
    paaRankings: 2,
    paaOpportunities: 15,
    averageReadingLevel: 8,
    questionBasedContent: 10,
    conciseAnswers: 3,
    hasFAQSchema: false,
    hasHowToSchema: false,
    hasQASchema: false,
    hasArticleSchema: true,
    hasBreadcrumbSchema: true,
    listsAndTables: 4,
    definitionBlocks: 2,
    stepByStepContent: 1,
    entityCoverage: 60,
    factualDensity: 55,
    sourceCredibility: 50,
  };
}
