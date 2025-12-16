/**
 * Citation Optimizer
 * Phase 4: Analyze content for AI "citability"
 *
 * Analyzes content to determine how likely AI assistants
 * (ChatGPT, Claude, Gemini, Perplexity) are to cite it.
 *
 * Based on patterns that AI systems prefer:
 * - Clear, authoritative statements
 * - Well-structured information (lists, definitions)
 * - Factual content with sources
 * - Direct answers to common questions
 */

// Types
export interface CitationAnalysis {
  overallScore: number; // 0-100
  confidence: number; // How confident we are in this score
  factors: CitationFactor[];
  opportunities: CitationOpportunity[];
  aiReadabilityScore: number;
  passageScores: PassageScore[];
  recommendations: CitationRecommendation[];
}

export interface CitationFactor {
  name: string;
  score: number; // 0-100
  weight: number; // How much this factor matters
  details: string;
}

export interface CitationOpportunity {
  type: "definition" | "list" | "statistic" | "quote" | "step_by_step" | "comparison";
  location: string; // Where in content to add
  suggestion: string;
  impactEstimate: "high" | "medium" | "low";
}

export interface PassageScore {
  text: string;
  startIndex: number;
  endIndex: number;
  score: number;
  citationType: "definition" | "fact" | "list" | "answer" | "explanation";
  improvements: string[];
}

export interface CitationRecommendation {
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  recommendation: string;
  expectedImpact: number; // Expected score increase
}

// Content structure analysis
interface ContentStructure {
  paragraphs: string[];
  lists: ListItem[];
  headers: Header[];
  definitions: Definition[];
  questions: QuestionAnswer[];
  statistics: Statistic[];
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
}

interface ListItem {
  type: "ordered" | "unordered";
  items: string[];
  context: string;
}

interface Header {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  index: number;
}

interface Definition {
  term: string;
  definition: string;
  isExplicit: boolean;
}

interface QuestionAnswer {
  question: string;
  answer: string;
  isDirectAnswer: boolean;
}

interface Statistic {
  value: string;
  context: string;
  hasSource: boolean;
}

/**
 * Analyze content for AI citation potential
 */
export function analyzeForCitation(content: string): CitationAnalysis {
  // Parse content structure
  const structure = parseContentStructure(content);

  // Calculate individual factors
  const factors = calculateCitationFactors(structure, content);

  // Calculate overall score (weighted average)
  const overallScore = calculateOverallScore(factors);

  // Find citation opportunities
  const opportunities = findCitationOpportunities(structure, content);

  // Score individual passages
  const passageScores = scorePassages(content);

  // Generate recommendations
  const recommendations = generateRecommendations(factors, structure);

  // AI readability score
  const aiReadabilityScore = calculateAIReadability(structure);

  return {
    overallScore,
    confidence: calculateConfidence(structure),
    factors,
    opportunities,
    aiReadabilityScore,
    passageScores,
    recommendations,
  };
}

function parseContentStructure(content: string): ContentStructure {
  const paragraphs = content
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  const lists = extractLists(content);
  const headers = extractHeaders(content);
  const definitions = extractDefinitions(content);
  const questions = extractQuestionAnswers(content);
  const statistics = extractStatistics(content);

  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = content.split(/\s+/).filter((w) => w.length > 0);

  return {
    paragraphs,
    lists,
    headers,
    definitions,
    questions,
    statistics,
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: words.length / Math.max(sentences.length, 1),
  };
}

function extractLists(content: string): ListItem[] {
  const lists: ListItem[] = [];

  // Ordered lists (1. 2. 3. or a) b) c))
  const orderedPattern = /(?:^|\n)((?:\s*(?:\d+\.|[a-z]\))\s+.+(?:\n|$))+)/gm;
  let match;
  while ((match = orderedPattern.exec(content)) !== null) {
    const items = match[1]
      .split(/\n/)
      .filter((line) => /^\s*(?:\d+\.|[a-z]\))/.test(line))
      .map((line) => line.replace(/^\s*(?:\d+\.|[a-z]\))\s*/, "").trim());

    if (items.length >= 2) {
      lists.push({
        type: "ordered",
        items,
        context: getContext(content, match.index),
      });
    }
  }

  // Unordered lists (- or *)
  const unorderedPattern = /(?:^|\n)((?:\s*[-*]\s+.+(?:\n|$))+)/gm;
  while ((match = unorderedPattern.exec(content)) !== null) {
    const items = match[1]
      .split(/\n/)
      .filter((line) => /^\s*[-*]\s/.test(line))
      .map((line) => line.replace(/^\s*[-*]\s*/, "").trim());

    if (items.length >= 2) {
      lists.push({
        type: "unordered",
        items,
        context: getContext(content, match.index),
      });
    }
  }

  return lists;
}

function extractHeaders(content: string): Header[] {
  const headers: Header[] = [];
  const headerPattern = /^(#{1,6})\s+(.+)$/gm;

  let match;
  while ((match = headerPattern.exec(content)) !== null) {
    headers.push({
      level: match[1].length as 1 | 2 | 3 | 4 | 5 | 6,
      text: match[2].trim(),
      index: match.index,
    });
  }

  return headers;
}

function extractDefinitions(content: string): Definition[] {
  const definitions: Definition[] = [];

  // Pattern: "X is Y" or "X refers to Y" or "X means Y"
  const definitionPatterns = [
    /([A-Z][^.]*?)\s+is\s+(a|an|the)?\s*([^.]+\.)/gi,
    /([A-Z][^.]*?)\s+refers to\s+([^.]+\.)/gi,
    /([A-Z][^.]*?)\s+means\s+([^.]+\.)/gi,
    /([A-Z][^.]*?)\s+can be defined as\s+([^.]+\.)/gi,
  ];

  for (const pattern of definitionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const term = match[1].trim();
      const definition = (match[3] || match[2]).trim();

      // Only include if term is reasonably short (likely a concept)
      if (term.split(/\s+/).length <= 5 && definition.length > 20) {
        definitions.push({
          term,
          definition,
          isExplicit: true,
        });
      }
    }
  }

  return definitions;
}

function extractQuestionAnswers(content: string): QuestionAnswer[] {
  const qaPairs: QuestionAnswer[] = [];

  // Pattern: Question followed by answer
  const qaPattern = /([^.!?\n]*\?)\s*\n?\s*([A-Z][^?]*\.)/g;

  let match;
  while ((match = qaPattern.exec(content)) !== null) {
    const question = match[1].trim();
    const answer = match[2].trim();

    // Validate it's a real Q&A pair
    if (
      question.length > 10 &&
      answer.length > 20 &&
      !question.startsWith("Is it") // Avoid rhetorical questions
    ) {
      qaPairs.push({
        question,
        answer,
        isDirectAnswer: answer.length < 200, // Short answers are more direct
      });
    }
  }

  return qaPairs;
}

function extractStatistics(content: string): Statistic[] {
  const statistics: Statistic[] = [];

  // Pattern: numbers with context (percentages, amounts, years)
  const statPattern =
    /(\d+(?:\.\d+)?%|\$\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|billion|trillion))?|\d{4}|(?:\d+(?:\.\d+)?\s*(?:times|x|percent|years|months|days|hours|minutes)))/gi;

  let match;
  while ((match = statPattern.exec(content)) !== null) {
    const value = match[1];
    const context = getContext(content, match.index);

    // Check if there's a source citation nearby
    const surroundingText = content.substring(
      Math.max(0, match.index - 100),
      Math.min(content.length, match.index + 200)
    );
    const hasSource =
      /according to|source:|study|research|report|survey/i.test(surroundingText);

    statistics.push({
      value,
      context,
      hasSource,
    });
  }

  return statistics;
}

function getContext(content: string, index: number): string {
  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + 50);
  return content.substring(start, end).trim();
}

function calculateCitationFactors(
  structure: ContentStructure,
  content: string
): CitationFactor[] {
  const factors: CitationFactor[] = [];

  // 1. Definition Clarity (20% weight)
  const definitionScore = Math.min(100, structure.definitions.length * 15);
  factors.push({
    name: "Definition Clarity",
    score: definitionScore,
    weight: 0.2,
    details: `Found ${structure.definitions.length} clear definitions. AI systems love content that defines terms explicitly.`,
  });

  // 2. Structure Quality (20% weight)
  const hasGoodHeaders = structure.headers.length >= 3;
  const hasLists = structure.lists.length >= 1;
  const structureScore =
    (hasGoodHeaders ? 40 : 0) +
    (hasLists ? 40 : 0) +
    Math.min(20, structure.headers.length * 5);
  factors.push({
    name: "Content Structure",
    score: structureScore,
    weight: 0.2,
    details: `${structure.headers.length} headers, ${structure.lists.length} lists. Well-structured content is easier for AI to parse.`,
  });

  // 3. Direct Answers (25% weight)
  const directAnswerScore = Math.min(100, structure.questions.length * 20);
  factors.push({
    name: "Direct Answers",
    score: directAnswerScore,
    weight: 0.25,
    details: `Found ${structure.questions.length} Q&A pairs. Direct answers are highly citable.`,
  });

  // 4. Factual Density (15% weight)
  const factsWithSources = structure.statistics.filter((s) => s.hasSource).length;
  const factualScore =
    Math.min(60, structure.statistics.length * 10) +
    Math.min(40, factsWithSources * 20);
  factors.push({
    name: "Factual Density",
    score: factualScore,
    weight: 0.15,
    details: `${structure.statistics.length} statistics found, ${factsWithSources} with sources. Sourced facts increase credibility.`,
  });

  // 5. Sentence Clarity (10% weight)
  const idealSentenceLength = 18;
  const sentenceLengthDeviation = Math.abs(
    structure.avgSentenceLength - idealSentenceLength
  );
  const clarityScore = Math.max(0, 100 - sentenceLengthDeviation * 3);
  factors.push({
    name: "Sentence Clarity",
    score: clarityScore,
    weight: 0.1,
    details: `Average sentence length: ${structure.avgSentenceLength.toFixed(1)} words. Optimal is 15-20 words.`,
  });

  // 6. Content Depth (10% weight)
  const idealWordCount = 1500;
  const wordCountRatio = structure.wordCount / idealWordCount;
  const depthScore =
    wordCountRatio >= 0.5 && wordCountRatio <= 2
      ? Math.min(100, wordCountRatio * 70)
      : Math.max(0, 100 - Math.abs(wordCountRatio - 1) * 50);
  factors.push({
    name: "Content Depth",
    score: depthScore,
    weight: 0.1,
    details: `${structure.wordCount} words. Ideal range is 750-3000 words for comprehensive coverage.`,
  });

  return factors;
}

function calculateOverallScore(factors: CitationFactor[]): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const factor of factors) {
    totalWeightedScore += factor.score * factor.weight;
    totalWeight += factor.weight;
  }

  return Math.round(totalWeightedScore / totalWeight);
}

function findCitationOpportunities(
  structure: ContentStructure,
  content: string
): CitationOpportunity[] {
  const opportunities: CitationOpportunity[] = [];

  // Opportunity 1: Add definitions if missing
  if (structure.definitions.length < 2) {
    opportunities.push({
      type: "definition",
      location: "Introduction section",
      suggestion:
        "Add clear definitions for key terms. Use format: '[Term] is [definition].'",
      impactEstimate: "high",
    });
  }

  // Opportunity 2: Add lists for processes
  if (
    structure.lists.length < 2 &&
    /how to|steps|process|guide/i.test(content)
  ) {
    opportunities.push({
      type: "list",
      location: "Main content body",
      suggestion:
        "Convert process descriptions into numbered lists. AI systems frequently cite step-by-step content.",
      impactEstimate: "high",
    });
  }

  // Opportunity 3: Add statistics
  if (structure.statistics.length < 3) {
    opportunities.push({
      type: "statistic",
      location: "Supporting arguments",
      suggestion:
        "Include relevant statistics with sources. Example: 'According to [Source], 78% of...'",
      impactEstimate: "medium",
    });
  }

  // Opportunity 4: Add comparison tables
  if (/vs|versus|compare|comparison|difference/i.test(content)) {
    const hasComparisonStructure =
      structure.lists.some((l) => l.items.length >= 3) ||
      content.includes("|"); // Markdown table
    if (!hasComparisonStructure) {
      opportunities.push({
        type: "comparison",
        location: "Comparison section",
        suggestion:
          "Add a comparison table or structured pros/cons list. AI systems love to cite comparative content.",
        impactEstimate: "high",
      });
    }
  }

  // Opportunity 5: Add direct Q&A sections
  if (structure.questions.length < 3) {
    opportunities.push({
      type: "step_by_step",
      location: "End of article",
      suggestion:
        "Add an FAQ section with common questions and direct answers. Format: 'Q: [Question]? A: [Direct answer].'",
      impactEstimate: "high",
    });
  }

  return opportunities;
}

function scorePassages(content: string): PassageScore[] {
  const passages: PassageScore[] = [];
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 50);

  for (const para of paragraphs.slice(0, 10)) {
    // Limit to first 10 paragraphs
    const startIndex = content.indexOf(para);
    const endIndex = startIndex + para.length;

    let score = 50; // Base score
    let citationType: PassageScore["citationType"] = "explanation";
    const improvements: string[] = [];

    // Check for definition pattern
    if (/is\s+(a|an|the)?\s*[^.]+\./i.test(para) && para.length < 200) {
      score += 15;
      citationType = "definition";
    }

    // Check for list pattern
    if (/^\s*[-*\d]\.\s/m.test(para)) {
      score += 10;
      citationType = "list";
    }

    // Check for direct answer pattern
    if (/^(Yes|No|The answer is|In short|Simply put)/i.test(para)) {
      score += 20;
      citationType = "answer";
    }

    // Check for factual content
    if (/\d+%|\$\d+|according to|study|research/i.test(para)) {
      score += 10;
      citationType = "fact";
    }

    // Length penalty for very long paragraphs
    if (para.length > 400) {
      score -= 10;
      improvements.push("Break into smaller paragraphs (ideal: 50-150 words)");
    }

    // Passive voice penalty
    if (/was\s+\w+ed|were\s+\w+ed|is\s+being|are\s+being/i.test(para)) {
      score -= 5;
      improvements.push("Consider using active voice for clarity");
    }

    // Missing specific details
    if (!/\d+/.test(para) && para.length > 100) {
      improvements.push("Consider adding specific numbers or statistics");
    }

    passages.push({
      text: para.substring(0, 200) + (para.length > 200 ? "..." : ""),
      startIndex,
      endIndex,
      score: Math.max(0, Math.min(100, score)),
      citationType,
      improvements,
    });
  }

  return passages.sort((a, b) => b.score - a.score);
}

function generateRecommendations(
  factors: CitationFactor[],
  structure: ContentStructure
): CitationRecommendation[] {
  const recommendations: CitationRecommendation[] = [];

  // Sort factors by score to find weakest areas
  const sortedFactors = [...factors].sort((a, b) => a.score - b.score);

  for (const factor of sortedFactors.slice(0, 3)) {
    // Focus on 3 weakest areas
    if (factor.score < 70) {
      switch (factor.name) {
        case "Definition Clarity":
          recommendations.push({
            priority: factor.score < 30 ? "critical" : "high",
            category: "Definitions",
            recommendation:
              "Add explicit definitions for key concepts. Start sentences with '[Term] is...' or '[Term] refers to...'",
            expectedImpact: Math.round((70 - factor.score) * factor.weight),
          });
          break;

        case "Content Structure":
          recommendations.push({
            priority: factor.score < 30 ? "critical" : "high",
            category: "Structure",
            recommendation:
              "Improve content structure with clear H2/H3 headings and bulleted/numbered lists for key points.",
            expectedImpact: Math.round((70 - factor.score) * factor.weight),
          });
          break;

        case "Direct Answers":
          recommendations.push({
            priority: factor.score < 30 ? "critical" : "high",
            category: "Q&A Format",
            recommendation:
              "Add an FAQ section or format existing content as questions with direct answers.",
            expectedImpact: Math.round((70 - factor.score) * factor.weight),
          });
          break;

        case "Factual Density":
          recommendations.push({
            priority: "medium",
            category: "Facts & Sources",
            recommendation:
              "Include more statistics and cite sources. Format: 'According to [Source], [statistic].'",
            expectedImpact: Math.round((70 - factor.score) * factor.weight),
          });
          break;

        case "Sentence Clarity":
          recommendations.push({
            priority: "low",
            category: "Readability",
            recommendation:
              "Adjust sentence length to average 15-20 words. Break up long sentences, combine short fragments.",
            expectedImpact: Math.round((70 - factor.score) * factor.weight),
          });
          break;

        case "Content Depth":
          recommendations.push({
            priority: structure.wordCount < 500 ? "high" : "medium",
            category: "Content Length",
            recommendation:
              structure.wordCount < 750
                ? "Expand content to at least 750 words for comprehensive coverage."
                : "Consider trimming content to focus on key points.",
            expectedImpact: Math.round((70 - factor.score) * factor.weight),
          });
          break;
      }
    }
  }

  return recommendations.sort(
    (a, b) =>
      (a.priority === "critical" ? 0 : a.priority === "high" ? 1 : a.priority === "medium" ? 2 : 3) -
      (b.priority === "critical" ? 0 : b.priority === "high" ? 1 : b.priority === "medium" ? 2 : 3)
  );
}

function calculateAIReadability(structure: ContentStructure): number {
  let score = 50; // Base score

  // Good sentence length bonus
  if (structure.avgSentenceLength >= 12 && structure.avgSentenceLength <= 22) {
    score += 15;
  }

  // Headers bonus
  if (structure.headers.length >= 3) {
    score += 15;
  }

  // Lists bonus
  if (structure.lists.length >= 1) {
    score += 10;
  }

  // Definitions bonus
  if (structure.definitions.length >= 2) {
    score += 10;
  }

  return Math.min(100, score);
}

function calculateConfidence(structure: ContentStructure): number {
  // Higher confidence when we have more structure to analyze
  let confidence = 50;

  if (structure.wordCount > 500) confidence += 15;
  if (structure.headers.length >= 2) confidence += 10;
  if (structure.paragraphs.length >= 3) confidence += 10;
  if (structure.lists.length >= 1) confidence += 10;
  if (structure.wordCount > 1000) confidence += 5;

  return Math.min(95, confidence);
}

/**
 * Quick check for citation potential (lightweight version)
 */
export function quickCitationCheck(content: string): {
  score: number;
  topIssue: string | null;
} {
  const structure = parseContentStructure(content);

  // Quick heuristics
  let score = 40;

  if (structure.definitions.length >= 1) score += 15;
  if (structure.lists.length >= 1) score += 15;
  if (structure.headers.length >= 2) score += 10;
  if (structure.questions.length >= 1) score += 15;
  if (structure.avgSentenceLength >= 12 && structure.avgSentenceLength <= 22)
    score += 5;

  // Find top issue
  let topIssue: string | null = null;

  if (structure.definitions.length === 0) {
    topIssue = "Add explicit definitions for key terms";
  } else if (structure.lists.length === 0) {
    topIssue = "Add lists to break up information";
  } else if (structure.questions.length === 0) {
    topIssue = "Add FAQ section with direct answers";
  }

  return { score: Math.min(100, score), topIssue };
}
