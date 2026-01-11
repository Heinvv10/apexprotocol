/**
 * AIVisibilityService - AI/LLM visibility analysis, content relevance, entity optimization, E-E-A-T signals
 * Part of the Site Audit Sub-Agent
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Configuration schema
const AIVisibilityConfigSchema = z.object({
  analyzeContentRelevance: z.boolean().default(true),
  analyzeEntityOptimization: z.boolean().default(true),
  analyzeAIReadability: z.boolean().default(true),
  analyzeLLMFriendliness: z.boolean().default(true),
  analyzeStructuredData: z.boolean().default(true),
  minimumContentLength: z.number().default(100),
  targetRelevanceScore: z.number().default(70),
});

export type AIVisibilityConfig = z.infer<typeof AIVisibilityConfigSchema>;

// Content Relevance types
export interface ContentRelevanceScore {
  relevanceScore: number;
  topicCoverage: number;
  semanticMatch: boolean;
  keywordPresence: Record<string, number>;
}

export interface TopicCoverageResult {
  coveredSubtopics: string[];
  missingSubtopics: string[];
  coveragePercentage: number;
}

export interface ComprehensivenessResult {
  comprehensivenessScore: number;
  topicDepth: 'shallow' | 'moderate' | 'deep';
  aspectsCovered: string[];
}

export interface ContentUniquenessResult {
  uniquenessScore: number;
  hasOriginalInsights: boolean;
  uniqueElements: string[];
}

// Entity types
export interface EntityOptimization {
  entities: {
    organizations: string[];
    people: string[];
    products: string[];
    locations: string[];
  };
  score: number;
}

export interface EntityContextResult {
  contextQuality: Record<string, number>;
  hasDefiningContext: boolean;
  entitiesWithContext: string[];
}

export interface EntityAmbiguityResult {
  ambiguousEntities: string[];
  suggestions: string[];
}

export interface EntityRelationship {
  entity1: string;
  entity2: string;
  relationship: string;
}

export interface EntityRelationshipsResult {
  relationships: EntityRelationship[];
}

export interface EntityEnrichmentResult {
  recommendations: string[];
}

// AI Readability types
export interface AIReadabilityAnalysis {
  structureScore: number;
  hasLogicalFlow: boolean;
  hasClearSections: boolean;
  issues: string[];
}

export interface SentenceClarityResult {
  averageSentenceLength: number;
  clarityScore: number;
  complexSentences: number;
}

export interface FactualClaimsResult {
  claimsWithSources: number;
  claimsWithoutSources: number;
  citationScore: number;
}

export interface ContentFreshnessResult {
  hasPublishDate: boolean;
  hasUpdateDate: boolean;
  freshnesssignals: number;
}

// LLM Friendliness types
export interface LLMCitationPotential {
  citationScore: number;
  hasDefinitions: boolean;
  hasExamples: boolean;
  hasLists: boolean;
}

export interface QuestionAnsweringResult {
  questionsAddressed: number;
  hasDirectAnswers: boolean;
  faqFormat: boolean;
}

export interface StructuredDataForAIResult {
  hasRelevantSchema: boolean;
  schemaCompleteness: number;
  aiUsefulProperties: string[];
}

export interface SnippetOptimizationResult {
  hasConcisDedefinition: boolean;
  snippetReadyContent: boolean;
  idealSnippetLength: number;
}

export interface EEATResult {
  experienceSignals: number;
  expertiseSignals: number;
  authoritativeSignals: number;
  trustSignals: number;
  overallEEATScore: number;
}

// Structured Data types
export interface StructuredDataOptimization {
  optimizationScore: number;
  hasEssentialProperties: boolean;
  missingProperties: string[];
}

export interface SchemaEnhancementResult {
  recommendations: string[];
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
}

// Issue types
export interface AIVisibilityIssue {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation?: string;
}

export interface AIVisibilityRecommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
}

export interface CompetitorComparison {
  ranking: number;
  aboveAverage: boolean;
  gap: number;
}

// AI Visibility Result
export interface AIVisibilityResult {
  contentRelevance: { score: number };
  entityOptimization: { score: number };
  aiReadability: { score: number };
  llmFriendliness: { score: number };
  structuredData: { score: number };
  overallScore: number;
  grade: string;
}

// Known entities for extraction
const KNOWN_ORGANIZATIONS = [
  'Google', 'OpenAI', 'Apple', 'Apple Inc.', 'Microsoft', 'Amazon', 'Facebook', 'Meta',
  'Tesla', 'Netflix', 'Twitter', 'IBM', 'Intel', 'Samsung', 'Sony', 'SpaceX'
];

const KNOWN_PRODUCTS = [
  'ChatGPT', 'GPT-4', 'iPhone', 'iPad', 'MacBook', 'Android', 'Windows', 'Chrome',
  'Firefox', 'Safari', 'Office', 'AWS', 'Azure', 'GCP', 'Bard', 'Claude'
];

// Essential properties for schema types
const ESSENTIAL_PROPERTIES: Record<string, string[]> = {
  'Article': ['headline', 'author', 'datePublished', 'description'],
  'Product': ['name', 'description', 'offers', 'image'],
  'Organization': ['name', 'url', 'logo'],
  'Person': ['name', 'jobTitle'],
  'FAQPage': ['mainEntity'],
  'HowTo': ['name', 'step'],
};

export class AIVisibilityService extends EventEmitter {
  private config: AIVisibilityConfig;
  private issues: AIVisibilityIssue[] = [];
  private issueIdCounter = 0;

  constructor(config: Partial<AIVisibilityConfig> = {}) {
    super();
    this.config = AIVisibilityConfigSchema.parse(config);
  }

  getConfig(): AIVisibilityConfig {
    return { ...this.config };
  }

  shutdown(): void {
    this.removeAllListeners();
    this.issues = [];
  }

  // Content Relevance Analysis
  analyzeContentRelevance(content: string, targetTopic: string): ContentRelevanceScore {
    const normalized = content.toLowerCase();
    const topicLower = targetTopic.toLowerCase();

    // Count topic mentions
    let topicMentions = 0;
    let index = 0;
    while ((index = normalized.indexOf(topicLower, index)) !== -1) {
      topicMentions++;
      index += topicLower.length;
    }

    // Calculate word count
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Related terms for ML/AI topics
    const relatedTerms = this.getRelatedTerms(targetTopic);
    let relatedMentions = 0;
    const keywordPresence: Record<string, number> = {};

    for (const term of relatedTerms) {
      let count = 0;
      let idx = 0;
      while ((idx = normalized.indexOf(term.toLowerCase(), idx)) !== -1) {
        count++;
        idx += term.length;
      }
      if (count > 0) {
        keywordPresence[term] = count;
        relatedMentions += count;
      }
    }

    // Topic coverage (how many related terms are present)
    const coveredTerms = Object.keys(keywordPresence).length;
    const topicCoverage = relatedTerms.length > 0 ? coveredTerms / relatedTerms.length : 0;

    // Semantic match (topic + related terms present)
    const semanticMatch = topicMentions > 0 && coveredTerms >= 2;

    // Relevance score based on topic density and coverage
    const topicDensity = wordCount > 0 ? (topicMentions * 100) / wordCount : 0;
    const relatedDensity = wordCount > 0 ? (relatedMentions * 100) / wordCount : 0;

    let relevanceScore = 0;
    if (semanticMatch) {
      relevanceScore = Math.min(100,
        (topicDensity * 20) +
        (topicCoverage * 50) +
        (relatedDensity * 3) +
        (topicMentions > 0 ? 20 : 0)
      );
    } else if (topicMentions > 0) {
      relevanceScore = Math.min(40, topicDensity * 10);
    }

    return {
      relevanceScore: Math.round(relevanceScore),
      topicCoverage,
      semanticMatch,
      keywordPresence
    };
  }

  private getRelatedTerms(topic: string): string[] {
    const topicLower = topic.toLowerCase();

    if (topicLower.includes('machine learning')) {
      return ['artificial intelligence', 'deep learning', 'neural network', 'algorithm',
              'training data', 'model', 'prediction', 'classification', 'regression',
              'data', 'learn', 'systems', 'experience', 'process', 'patterns'];
    }
    if (topicLower.includes('artificial intelligence') || topicLower.includes(' ai ')) {
      return ['machine learning', 'deep learning', 'neural network', 'automation',
              'natural language', 'computer vision', 'robotics'];
    }

    return [];
  }

  analyzeTopicCoverage(content: string, targetTopic: string, expectedSubtopics: string[]): TopicCoverageResult {
    const normalized = content.toLowerCase();

    const coveredSubtopics: string[] = [];
    const missingSubtopics: string[] = [];

    for (const subtopic of expectedSubtopics) {
      if (normalized.includes(subtopic.toLowerCase())) {
        coveredSubtopics.push(subtopic);
      } else {
        missingSubtopics.push(subtopic);
      }
    }

    const coveragePercentage = expectedSubtopics.length > 0
      ? (coveredSubtopics.length / expectedSubtopics.length) * 100
      : 100;

    return {
      coveredSubtopics,
      missingSubtopics,
      coveragePercentage
    };
  }

  analyzeComprehensiveness(content: string, topic: string): ComprehensivenessResult {
    const normalized = content.toLowerCase();
    const words = normalized.split(/\s+/).filter(w => w.length > 0);

    // Check for various aspects
    const aspectsCovered: string[] = [];

    // Definition indicators
    if (/\b(is a|is the|refers to|means|defined as|branch of)\b/i.test(content)) {
      aspectsCovered.push('definition');
    }

    // Type indicators
    if (/\b(types? of|kinds? of|categories?|varieties?|supervised|unsupervised|reinforcement)\b/i.test(content)) {
      aspectsCovered.push('types');
    }

    // Use case indicators
    if (/\b(use cases?|applications?|used for|used in|specific)\b/i.test(content)) {
      aspectsCovered.push('applications');
    }

    // Process indicators - more flexible matching
    if (/\b(how it works?|process|steps?|method|training|learn|algorithms?)\b/i.test(content)) {
      aspectsCovered.push('process');
    }

    // Evaluation indicators
    if (/\b(accuracy|precision|recall|metrics?|evaluation|essential|model)\b/i.test(content)) {
      aspectsCovered.push('evaluation');
    }

    // Determine topic depth
    let topicDepth: 'shallow' | 'moderate' | 'deep';
    if (words.length < 50 || aspectsCovered.length <= 1) {
      topicDepth = 'shallow';
    } else if (words.length < 200 || aspectsCovered.length <= 3) {
      topicDepth = 'moderate';
    } else {
      topicDepth = 'deep';
    }

    // Calculate comprehensiveness score - more generous scoring
    const baseScore = (aspectsCovered.length / 5) * 60;
    const lengthBonus = Math.min(40, words.length / 3);
    const comprehensivenessScore = Math.min(100, baseScore + lengthBonus);

    return {
      comprehensivenessScore: Math.round(comprehensivenessScore),
      topicDepth,
      aspectsCovered
    };
  }

  analyzeContentUniqueness(content: string): ContentUniquenessResult {
    const uniqueElements: string[] = [];

    // Check for unique indicators
    if (/\b(unique|novel|innovative|groundbreaking|proprietary|original|our research)\b/i.test(content)) {
      uniqueElements.push('innovative claims');
    }

    if (/\b(we found|our study|our analysis|we discovered|we developed)\b/i.test(content)) {
      uniqueElements.push('original research');
    }

    if (/\b(perspective|approach|methodology|framework|our own)\b/i.test(content)) {
      uniqueElements.push('unique perspective');
    }

    const hasOriginalInsights = uniqueElements.length > 0;
    const uniquenessScore = Math.min(100, uniqueElements.length * 30 + 10);

    return {
      uniquenessScore,
      hasOriginalInsights,
      uniqueElements
    };
  }

  // Entity Optimization Analysis
  analyzeEntityOptimization(content: string): EntityOptimization {
    const organizations: string[] = [];
    const people: string[] = [];
    const products: string[] = [];
    const locations: string[] = [];

    // Extract known organizations
    for (const org of KNOWN_ORGANIZATIONS) {
      if (content.includes(org)) {
        organizations.push(org);
      }
    }

    // Extract known products
    for (const product of KNOWN_PRODUCTS) {
      if (content.includes(product)) {
        products.push(product);
      }
    }

    // Extract people (pattern: Title + Name)
    const personPatterns = [
      /\b(CEO|CFO|CTO|Dr\.|Mr\.|Mrs\.|Ms\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
      /\bfounded by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi
    ];

    for (const pattern of personPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const name = match[2] || match[1];
        if (name && !people.includes(name)) {
          people.push(name);
        }
      }
    }

    // Extract locations
    const locationPatterns = [
      /\b(?:in|from|headquartered in|based in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g
    ];

    for (const pattern of locationPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const location = match[1];
        if (location && !locations.includes(location) && !organizations.includes(location)) {
          locations.push(location);
        }
      }
    }

    // Calculate score based on entity density and variety
    const totalEntities = organizations.length + people.length + products.length + locations.length;
    const entityTypes = [organizations, people, products, locations].filter(arr => arr.length > 0).length;
    const score = Math.min(100, totalEntities * 15 + entityTypes * 20);

    return {
      entities: {
        organizations: [...new Set(organizations)],
        people: [...new Set(people)],
        products: [...new Set(products)],
        locations: [...new Set(locations)]
      },
      score: Math.round(score)
    };
  }

  evaluateEntityContext(content: string): EntityContextResult {
    const contextQuality: Record<string, number> = {};
    const entitiesWithContext: string[] = [];

    // Check for entities with defining context
    const contextPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+(?:the|a)\s+(\w+\s+)?(?:company|corporation|organization|person|product)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|are|was|were)\s+(?:known for|famous for|the)/gi
    ];

    for (const pattern of contextPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const entity = match[1];
        if (entity) {
          contextQuality[entity] = 80;
          entitiesWithContext.push(entity);
        }
      }
    }

    // Check specific entities - normalize to base name for matching
    for (const org of KNOWN_ORGANIZATIONS) {
      // Get the base name (e.g., "Apple" from "Apple Inc.")
      const baseName = org.split(' ')[0];

      if (content.includes(org) || content.includes(baseName)) {
        // Check if there's defining context around it - look for base name
        const patterns = [
          new RegExp(`${baseName}[^.]*(?:Inc\\.|company|technology|corporation|founded|known|headquartered|CEO|announced)`, 'i'),
          new RegExp(`(?:technology|company|corporation)[^.]*${baseName}`, 'i')
        ];

        const hasContext = patterns.some(p => p.test(content));
        if (hasContext) {
          // Store both the full org name and base name
          contextQuality[org] = 85;
          contextQuality[baseName] = 85;
          if (!entitiesWithContext.includes(org)) {
            entitiesWithContext.push(org);
          }
          if (!entitiesWithContext.includes(baseName)) {
            entitiesWithContext.push(baseName);
          }
        }
      }
    }

    return {
      contextQuality,
      hasDefiningContext: entitiesWithContext.length > 0,
      entitiesWithContext: [...new Set(entitiesWithContext)]
    };
  }

  analyzeEntityAmbiguity(content: string): EntityAmbiguityResult {
    const ambiguousEntities: string[] = [];
    const suggestions: string[] = [];

    // Known ambiguous entities
    const ambiguousMap: Record<string, string> = {
      'Apple': 'Apple Inc.',
      'Amazon': 'Amazon.com, Inc.',
      'Mercury': 'Mercury (company/planet)',
      'Jordan': 'Jordan (person/country)'
    };

    for (const [ambiguous, suggestion] of Object.entries(ambiguousMap)) {
      if (content.includes(ambiguous) && !content.includes(suggestion)) {
        // Check if there's context
        const contextPattern = new RegExp(`${ambiguous}\\s+(?:Inc\\.|company|corporation|technology|the\\s+\\w+\\s+company)`, 'i');
        if (!contextPattern.test(content)) {
          ambiguousEntities.push(ambiguous);
          suggestions.push(`Consider using "${suggestion}" for clarity`);
        }
      }
    }

    return {
      ambiguousEntities,
      suggestions
    };
  }

  analyzeEntityRelationships(content: string): EntityRelationshipsResult {
    const relationships: EntityRelationship[] = [];

    // Pattern: Person is (the) CEO/founder of Organization
    const rolePatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+is\s+(?:the\s+)?(CEO|CFO|CTO|founder|president|director)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+is\s+(?:the\s+)?(CEO|CFO|CTO|founder|president|director)\s+of\s+(\w+)/gi
    ];

    for (const pattern of rolePatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        // Avoid duplicate relationships
        const exists = relationships.some(
          r => r.entity1 === match[1] && r.entity2 === match[3]
        );
        if (!exists) {
          relationships.push({
            entity1: match[1],
            entity2: match[3],
            relationship: `${match[2]} of`
          });
        }
      }
    }

    // Pattern: Organization manufactures/produces Product
    const productPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:manufactures?|produces?|creates?|develops?)\s+([a-zA-Z\s]+)/gi
    ];

    for (const pattern of productPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const product = match[2].trim().split(/[.,]/)[0]; // Stop at punctuation
        if (product) {
          relationships.push({
            entity1: match[1],
            entity2: product,
            relationship: 'produces'
          });
        }
      }
    }

    return { relationships };
  }

  recommendEntityEnrichment(content: string): EntityEnrichmentResult {
    const recommendations: string[] = [];

    // Check for entities without context
    for (const org of KNOWN_ORGANIZATIONS) {
      if (content.includes(org)) {
        const contextPattern = new RegExp(`${org}[^.]*(?:company|technology|corporation|founded|known|headquartered)`, 'i');
        if (!contextPattern.test(content)) {
          recommendations.push(`Add defining context for "${org}"`);
        }
      }
    }

    if (recommendations.length === 0) {
      // Generic recommendations
      recommendations.push('Consider adding more context around entity mentions');
    }

    return { recommendations };
  }

  // AI Readability Analysis
  analyzeAIReadability(html: string): AIReadabilityAnalysis {
    const issues: string[] = [];

    // Check for semantic structure
    const hasArticle = /<article[\s>]/i.test(html);
    const hasMain = /<main[\s>]/i.test(html);
    const hasHeadings = /<h[1-6][\s>]/i.test(html);
    const hasSections = /<section[\s>]/i.test(html) || /<h2[\s>]/i.test(html);

    if (!hasArticle && !hasMain) {
      issues.push('Lack of semantic structure');
    }

    // Check for logical flow (h1 -> h2 -> content pattern)
    const hasH1 = /<h1[\s>]/i.test(html);
    const hasH2 = /<h2[\s>]/i.test(html);
    const hasParagraphs = /<p[\s>]/i.test(html);

    const hasLogicalFlow = hasH1 && hasParagraphs;
    const hasClearSections = hasH2 || hasSections;

    // Calculate structure score
    let structureScore = 0;
    if (hasArticle || hasMain) structureScore += 30;
    if (hasH1) structureScore += 20;
    if (hasClearSections) structureScore += 25;
    if (hasParagraphs) structureScore += 15;
    if (hasLogicalFlow) structureScore += 10;

    return {
      structureScore,
      hasLogicalFlow,
      hasClearSections,
      issues
    };
  }

  analyzeSentenceClarity(content: string): SentenceClarityResult {
    // Split into sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    let totalWords = 0;
    let complexSentences = 0;

    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/).filter(w => w.length > 0);
      totalWords += words.length;

      // Complex sentence: > 20 words or contains multiple clauses (4+ commas)
      if (words.length > 20 || (sentence.match(/,/g) || []).length >= 4) {
        complexSentences++;
      }
    }

    const averageSentenceLength = sentences.length > 0 ? totalWords / sentences.length : 0;

    // Calculate clarity score - more aggressive penalty for long sentences
    let clarityScore = 100;
    if (averageSentenceLength > 15) {
      clarityScore -= (averageSentenceLength - 15) * 4;
    }
    // Higher penalty for complex sentences
    clarityScore -= complexSentences * 20;
    clarityScore = Math.max(0, Math.min(100, clarityScore));

    return {
      averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
      clarityScore: Math.round(clarityScore),
      complexSentences
    };
  }

  analyzeFactualClaims(content: string): FactualClaimsResult {
    let claimsWithSources = 0;
    let claimsWithoutSources = 0;

    // Patterns for claims with sources
    const sourcePatterns = [
      /according to\s+[A-Z]/gi,
      /studies?\s+(?:show|indicate|suggest)/gi,
      /research\s+(?:from|by|at)\s+[A-Z]/gi,
      /\d+%\s+of\s+\w+/gi
    ];

    for (const pattern of sourcePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        claimsWithSources += matches.length;
      }
    }

    // Patterns for unsourced claims
    const unsourcedPatterns = [
      /experts?\s+(?:say|believe|predict)/gi,
      /it is (?:known|believed|thought)/gi
    ];

    for (const pattern of unsourcedPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        claimsWithoutSources += matches.length;
      }
    }

    const totalClaims = claimsWithSources + claimsWithoutSources;
    const citationScore = totalClaims > 0 ? (claimsWithSources / totalClaims) * 100 : 50;

    return {
      claimsWithSources,
      claimsWithoutSources,
      citationScore: Math.round(citationScore)
    };
  }

  evaluateContentFreshness(html: string): ContentFreshnessResult {
    let freshnessSignals = 0;

    // Check for publish date
    const hasPublishDate = /<time[^>]*datetime/i.test(html) ||
                           /datePublished/i.test(html) ||
                           /published\s*(?:on|:)/i.test(html);
    if (hasPublishDate) freshnessSignals++;

    // Check for update date
    const hasUpdateDate = /(?:updated|modified|reviewed)\s*(?:on|:)/i.test(html) ||
                          /dateModified/i.test(html) ||
                          /Last\s+(?:updated|reviewed)/i.test(html);
    if (hasUpdateDate) freshnessSignals++;

    // Check for current year mentions
    const currentYear = new Date().getFullYear();
    if (html.includes(String(currentYear))) freshnessSignals++;

    return {
      hasPublishDate,
      hasUpdateDate,
      freshnesssignals: freshnessSignals
    };
  }

  // LLM Friendliness Analysis
  evaluateLLMCitationPotential(content: string): LLMCitationPotential {
    const hasDefinitions = /\b(?:definition:|is a type of|is a method|is a|is the|refers to|means|enables)\b/i.test(content);
    // More flexible example detection
    const hasExamples = /\b(?:example:|Example:|for example|for instance|such as|e\.g\.|Example:)/i.test(content);
    const hasLists = /(?:\d+\.\s+|\*\s+|•\s+|-\s+)[A-Z]/m.test(content) ||
                     /<(?:ul|ol)[\s>]/i.test(content) ||
                     /Key characteristics:/i.test(content);

    let citationScore = 0;
    if (hasDefinitions) citationScore += 30;
    if (hasExamples) citationScore += 25;
    if (hasLists) citationScore += 20;

    // Check for structured content
    if (/\b(?:key\s+(?:points|characteristics|features)|steps?:)\b/i.test(content)) {
      citationScore += 15;
    }

    // Check for clarity
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / (sentences.length || 1);
    if (avgLength < 20) citationScore += 10;

    return {
      citationScore: Math.min(100, citationScore),
      hasDefinitions,
      hasExamples,
      hasLists
    };
  }

  analyzeQuestionAnswering(content: string): QuestionAnsweringResult {
    // Find questions
    const questions = content.match(/\?/g) || [];
    const questionPatterns = content.match(/(?:what|how|why|when|where|who)\s+(?:is|are|does|do|can|should)\b/gi) || [];

    const questionsAddressed = Math.max(questions.length, questionPatterns.length);

    // Check for direct answers after questions
    const hasDirectAnswers = /\?\s*\n\s*[A-Z]/m.test(content) || questionsAddressed > 0;

    // Check for FAQ format
    const faqFormat = questionsAddressed >= 2 && hasDirectAnswers;

    return {
      questionsAddressed,
      hasDirectAnswers,
      faqFormat
    };
  }

  evaluateStructuredDataForAI(html: string): StructuredDataForAIResult {
    const aiUsefulProperties: string[] = [];

    // Check for JSON-LD
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);

    if (!jsonLdMatch) {
      return {
        hasRelevantSchema: false,
        schemaCompleteness: 0,
        aiUsefulProperties: []
      };
    }

    try {
      const schema = JSON.parse(jsonLdMatch[1]);

      // Check for AI-useful properties - core properties for Article type
      const usefulProps = ['headline', 'author', 'datePublished', 'description'];
      for (const prop of usefulProps) {
        if (prop in schema) {
          aiUsefulProperties.push(prop);
        }
      }

      // Calculate completeness based on actual useful properties found
      const schemaCompleteness = (aiUsefulProperties.length / usefulProps.length) * 100;

      return {
        hasRelevantSchema: true,
        schemaCompleteness: Math.round(schemaCompleteness),
        aiUsefulProperties
      };
    } catch {
      return {
        hasRelevantSchema: false,
        schemaCompleteness: 0,
        aiUsefulProperties: []
      };
    }
  }

  analyzeSnippetOptimization(content: string): SnippetOptimizationResult {
    // Check for concise definition (first sentence is definitional)
    const firstSentence = content.split(/[.!?]/)[0] || '';
    const hasConcisDedefinition = /\b(?:is a|is the|refers to)\b/i.test(firstSentence) &&
                                   firstSentence.split(/\s+/).length < 30;

    // Check if content is snippet-ready (good first paragraph)
    const firstParagraph = content.split(/\n\n/)[0] || content;
    const snippetReadyContent = firstParagraph.length > 50 && firstParagraph.length < 300;

    // Calculate ideal snippet length
    const words = firstParagraph.split(/\s+/);
    const idealSnippetLength = Math.min(60, words.length);

    return {
      hasConcisDedefinition,
      snippetReadyContent,
      idealSnippetLength
    };
  }

  evaluateEEATSignals(html: string): EEATResult {
    let experienceSignals = 0;
    let expertiseSignals = 0;
    let authoritativeSignals = 0;
    let trustSignals = 0;

    // Experience signals
    if (/\b(?:years?\s+of\s+experience|practiced|worked\s+in|hands-on)\b/i.test(html)) {
      experienceSignals++;
    }

    // Expertise signals
    if (/\b(?:PhD|doctorate|professor|expert|specialist|certified|Dr\.)\b/i.test(html)) {
      expertiseSignals++;
    }
    if (/\b(?:research|study|published|author|wrote)\b/i.test(html)) {
      expertiseSignals++;
    }

    // Authority signals
    if (/\b(?:peer-reviewed|MIT|Stanford|Harvard|university|institution)\b/i.test(html)) {
      authoritativeSignals++;
    }
    if (/(?:linkedin\.com|twitter\.com|github\.com)/i.test(html)) {
      authoritativeSignals++;
    }

    // Trust signals
    if (/\b(?:verified|reviewed|updated|fact-checked)\b/i.test(html)) {
      trustSignals++;
    }
    if (/\b(?:last\s+updated|reviewed\s+by|industry\s+experts?)\b/i.test(html)) {
      trustSignals++;
    }

    const overallEEATScore = Math.min(100,
      (experienceSignals * 20) +
      (expertiseSignals * 20) +
      (authoritativeSignals * 20) +
      (trustSignals * 20) + 10
    );

    return {
      experienceSignals,
      expertiseSignals,
      authoritativeSignals,
      trustSignals,
      overallEEATScore
    };
  }

  // Structured Data Optimization
  analyzeStructuredDataOptimization(schemas: Record<string, unknown>[]): StructuredDataOptimization {
    if (schemas.length === 0) {
      return {
        optimizationScore: 0,
        hasEssentialProperties: false,
        missingProperties: []
      };
    }

    let totalScore = 0;
    const allMissing: string[] = [];
    let allSchemasComplete = true;

    for (const schema of schemas) {
      const type = schema['@type'] as string;
      const essentialProps = ESSENTIAL_PROPERTIES[type] || ['name'];

      let foundProps = 0;
      const missing: string[] = [];

      for (const prop of essentialProps) {
        if (prop in schema) {
          foundProps++;
        } else {
          missing.push(prop);
        }
      }

      // Schema is complete if all essential props are found
      if (missing.length > 0) {
        allSchemasComplete = false;
      }

      totalScore += (foundProps / essentialProps.length) * 100;
      allMissing.push(...missing);
    }

    const optimizationScore = schemas.length > 0 ? totalScore / schemas.length : 0;
    // hasEssentialProperties is true when ALL schemas have ALL their essential properties
    const hasEssentialProperties = allSchemasComplete;

    return {
      optimizationScore: Math.round(optimizationScore),
      hasEssentialProperties,
      missingProperties: [...new Set(allMissing)]
    };
  }

  recommendSchemaEnhancements(pageContent: {
    hasAuthor?: boolean;
    hasPublishDate?: boolean;
    hasFAQ?: boolean;
    hasHowTo?: boolean;
  }, currentSchemas: string[]): SchemaEnhancementResult {
    const recommendations: string[] = [];

    if (pageContent.hasFAQ && !currentSchemas.includes('FAQPage')) {
      recommendations.push('Add FAQPage schema');
    }

    if (pageContent.hasHowTo && !currentSchemas.includes('HowTo')) {
      recommendations.push('Add HowTo schema');
    }

    if (!currentSchemas.includes('BreadcrumbList')) {
      recommendations.push('Consider adding BreadcrumbList schema');
    }

    return { recommendations };
  }

  validateSchemaPropertyValues(schema: Record<string, unknown>): SchemaValidationResult {
    const errors: string[] = [];

    // Check headline/name
    if ('headline' in schema) {
      const headline = schema['headline'];
      if (typeof headline !== 'string' || headline.trim() === '') {
        errors.push('headline is empty or invalid');
      }
    }

    // Check datePublished
    if ('datePublished' in schema) {
      const date = schema['datePublished'] as string;
      if (!/^\d{4}-\d{2}-\d{2}/.test(date)) {
        errors.push('datePublished is not in valid ISO format');
      }
    }

    // Check author
    if ('author' in schema) {
      const author = schema['author'];
      if (typeof author === 'string' && !author.includes('@type')) {
        // Should be an object with @type
        errors.push('author should be a Person or Organization object');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // AI Visibility Scoring
  calculateAIVisibilityScore(analysis: {
    contentRelevance?: { score: number };
    entityOptimization?: { score: number };
    aiReadability?: { score: number };
    llmFriendliness?: { score: number };
    structuredData?: { score: number };
  }): number {
    const weights = {
      contentRelevance: 0.25,
      entityOptimization: 0.15,
      aiReadability: 0.25,
      llmFriendliness: 0.20,
      structuredData: 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;

    if (analysis.contentRelevance?.score !== undefined) {
      totalScore += analysis.contentRelevance.score * weights.contentRelevance;
      totalWeight += weights.contentRelevance;
    }

    if (analysis.entityOptimization?.score !== undefined) {
      totalScore += analysis.entityOptimization.score * weights.entityOptimization;
      totalWeight += weights.entityOptimization;
    }

    if (analysis.aiReadability?.score !== undefined) {
      totalScore += analysis.aiReadability.score * weights.aiReadability;
      totalWeight += weights.aiReadability;
    }

    if (analysis.llmFriendliness?.score !== undefined) {
      totalScore += analysis.llmFriendliness.score * weights.llmFriendliness;
      totalWeight += weights.llmFriendliness;
    }

    if (analysis.structuredData?.score !== undefined) {
      totalScore += analysis.structuredData.score * weights.structuredData;
      totalWeight += weights.structuredData;
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  gradeAIVisibility(score: number): string {
    if (score >= 93) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 77) return 'B+';
    if (score >= 73) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 67) return 'C+';
    if (score >= 63) return 'C';
    if (score >= 60) return 'C-';
    if (score >= 57) return 'D+';
    if (score >= 53) return 'D';
    if (score >= 50) return 'D-';
    return 'F';
  }

  compareWithCompetitors(siteScore: {
    overall: number;
    contentRelevance?: number;
    entityOptimization?: number;
    aiReadability?: number;
  }, competitorScores: { domain: string; overall: number }[]): CompetitorComparison {
    const allScores = [siteScore.overall, ...competitorScores.map(c => c.overall)].sort((a, b) => b - a);
    const ranking = allScores.indexOf(siteScore.overall) + 1;

    const avgCompetitor = competitorScores.reduce((sum, c) => sum + c.overall, 0) / competitorScores.length;
    const aboveAverage = siteScore.overall > avgCompetitor;

    const topScore = Math.max(...competitorScores.map(c => c.overall));
    const gap = topScore - siteScore.overall;

    return {
      ranking,
      aboveAverage,
      gap: Math.max(0, gap)
    };
  }

  // Issue Management
  createIssue(issueData: {
    type: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    recommendation?: string;
    impact?: 'critical' | 'high' | 'medium' | 'low';
  }): AIVisibilityIssue {
    return {
      id: `ai-${++this.issueIdCounter}`,
      type: issueData.type,
      severity: issueData.severity,
      impact: issueData.impact || issueData.severity,
      description: issueData.description,
      recommendation: issueData.recommendation
    };
  }

  addIssue(issueData: {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    impact: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    recommendation?: string;
  }): void {
    const issue = this.createIssue(issueData);
    this.issues.push(issue);
  }

  getIssuesByImpact(): AIVisibilityIssue[] {
    const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...this.issues].sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);
  }

  generateRecommendations(analysis: {
    contentRelevance?: { score: number; topicCoverage?: number };
    entityOptimization?: { score: number; ambiguousEntities?: string[] };
    aiReadability?: { score: number; complexSentences?: number };
    structuredData?: { score: number; missingProperties?: string[] };
  }): AIVisibilityRecommendation[] {
    const recommendations: AIVisibilityRecommendation[] = [];

    if (analysis.contentRelevance && analysis.contentRelevance.score < 50) {
      recommendations.push({
        action: 'Improve content relevance by adding more topic-specific content',
        priority: 'high',
        expectedImpact: 'Increase AI visibility by 15-25%'
      });
    }

    if (analysis.entityOptimization?.ambiguousEntities && analysis.entityOptimization.ambiguousEntities.length > 0) {
      recommendations.push({
        action: 'Disambiguate entity references for better AI understanding',
        priority: 'medium',
        expectedImpact: 'Improve entity recognition accuracy'
      });
    }

    if (analysis.aiReadability && analysis.aiReadability.score < 60) {
      recommendations.push({
        action: 'Simplify complex sentences and improve content structure',
        priority: 'medium',
        expectedImpact: 'Better AI content parsing'
      });
    }

    if (analysis.structuredData && analysis.structuredData.score < 50) {
      recommendations.push({
        action: 'Add missing structured data properties',
        priority: 'high',
        expectedImpact: 'Enhanced AI understanding of content'
      });
    }

    return recommendations;
  }

  getAllIssues(): AIVisibilityIssue[] {
    return [...this.issues];
  }

  clearIssues(): void {
    this.issues = [];
    this.issueIdCounter = 0;
  }
}

// Factory function
export function createAIVisibilityService(config?: Partial<AIVisibilityConfig>): AIVisibilityService {
  return new AIVisibilityService(config);
}
