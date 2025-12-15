/**
 * Entity Extraction NLP Module (F108)
 * NLP-based entity extraction for Content Gap Analysis
 */

import {
  ExtractedEntity,
  EntityType,
  EntityAnalysis,
} from "./types";

// Common entity patterns for recognition
const ENTITY_PATTERNS: Record<EntityType, RegExp[]> = {
  brand: [
    /\b(?:Inc\.|Corp\.|LLC|Ltd\.|Company|Co\.)\b/i,
    /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s(?:Inc|Corp|LLC|Ltd|Company|Co)\b/,
  ],
  product: [
    /\b(?:version|v\d+|pro|premium|enterprise|basic|starter)\b/i,
    /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s(?:Pro|Premium|Enterprise|Plus)\b/,
  ],
  person: [
    /\b(?:CEO|CTO|CFO|COO|President|Director|Manager|Dr\.|Prof\.)\s[A-Z][a-z]+\s[A-Z][a-z]+\b/,
    /\b[A-Z][a-z]+\s[A-Z][a-z]+(?:\s(?:Jr\.|Sr\.|III|IV))?\b/,
  ],
  organization: [
    /\b(?:University|Institute|Association|Foundation|Agency|Department|Ministry)\b/i,
    /\b[A-Z]{2,5}\b/, // Acronyms
  ],
  location: [
    /\b(?:City|State|Country|Province|Region|District)\b/i,
    /\b[A-Z][a-z]+(?:,\s[A-Z]{2})\b/, // City, State format
  ],
  feature: [
    /\b(?:feature|capability|function|tool|option|setting)\b/i,
    /\b(?:AI|ML|API|SDK|UI|UX)\s(?:integration|support|feature)\b/i,
  ],
  topic: [
    /\b(?:guide|tutorial|how-to|best practices|tips|strategy)\b/i,
    /\b(?:SEO|marketing|optimization|analytics|automation)\b/i,
  ],
  competitor: [], // Populated dynamically based on known competitors
};

// Stop words to filter out
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
  "be", "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "dare", "ought",
  "used", "this", "that", "these", "those", "i", "you", "he", "she", "it",
  "we", "they", "what", "which", "who", "whom", "whose", "where", "when",
  "why", "how", "all", "each", "every", "both", "few", "more", "most",
  "other", "some", "such", "no", "nor", "not", "only", "own", "same",
  "so", "than", "too", "very", "just", "also", "now", "here", "there",
]);

/**
 * Extract entities from text content
 */
export function extractEntities(
  content: string,
  options: {
    brandName?: string;
    knownCompetitors?: string[];
    minConfidence?: number;
    maxEntities?: number;
  } = {}
): ExtractedEntity[] {
  const {
    brandName,
    knownCompetitors = [],
    minConfidence = 0.5,
    maxEntities = 100,
  } = options;

  const entities: Map<string, ExtractedEntity> = new Map();

  // Normalize content
  const normalizedContent = content.toLowerCase();
  const words = tokenize(content);

  // Extract named entities using patterns
  for (const [type, patterns] of Object.entries(ENTITY_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = content.matchAll(new RegExp(pattern, "gi"));
      for (const match of matches) {
        const name = match[0].trim();
        if (name.length < 2 || STOP_WORDS.has(name.toLowerCase())) continue;

        addOrUpdateEntity(entities, {
          name,
          type: type as EntityType,
          confidence: 0.7,
          context: extractContext(content, match.index || 0),
        });
      }
    }
  }

  // Extract brand mentions
  if (brandName) {
    const brandRegex = new RegExp(`\\b${escapeRegex(brandName)}\\b`, "gi");
    const matches = content.matchAll(brandRegex);
    for (const match of matches) {
      addOrUpdateEntity(entities, {
        name: brandName,
        type: "brand",
        confidence: 1.0,
        context: extractContext(content, match.index || 0),
      });
    }
  }

  // Extract competitor mentions
  for (const competitor of knownCompetitors) {
    const competitorRegex = new RegExp(`\\b${escapeRegex(competitor)}\\b`, "gi");
    const matches = content.matchAll(competitorRegex);
    for (const match of matches) {
      addOrUpdateEntity(entities, {
        name: competitor,
        type: "competitor",
        confidence: 0.95,
        context: extractContext(content, match.index || 0),
      });
    }
  }

  // Extract noun phrases (potential entities)
  const nounPhrases = extractNounPhrases(words);
  for (const phrase of nounPhrases) {
    if (phrase.length < 2 || STOP_WORDS.has(phrase.toLowerCase())) continue;

    // Check if it's likely a proper noun
    if (/^[A-Z]/.test(phrase)) {
      const type = inferEntityType(phrase, normalizedContent);
      addOrUpdateEntity(entities, {
        name: phrase,
        type,
        confidence: 0.5,
        context: extractContext(content, content.indexOf(phrase)),
      });
    }
  }

  // Filter and sort entities
  const result = Array.from(entities.values())
    .filter((e) => e.confidence >= minConfidence)
    .sort((a, b) => {
      // Sort by occurrences first, then confidence
      if (b.occurrences !== a.occurrences) {
        return b.occurrences - a.occurrences;
      }
      return b.confidence - a.confidence;
    })
    .slice(0, maxEntities);

  return result;
}

/**
 * Perform full entity analysis on content
 */
export function analyzeEntities(
  content: string,
  options: {
    brandName?: string;
    knownCompetitors?: string[];
    platforms?: string[];
  } = {}
): EntityAnalysis {
  const { brandName, knownCompetitors = [], platforms = [] } = options;

  const entities = extractEntities(content, {
    brandName,
    knownCompetitors,
    minConfidence: 0.4,
  });

  // Count brand mentions
  const brandMentions = brandName
    ? entities.find((e) => e.name.toLowerCase() === brandName.toLowerCase())?.occurrences || 0
    : 0;

  // Count competitor mentions
  const competitorMentions = new Map<string, number>();
  for (const competitor of knownCompetitors) {
    const entity = entities.find(
      (e) => e.name.toLowerCase() === competitor.toLowerCase() && e.type === "competitor"
    );
    if (entity) {
      competitorMentions.set(competitor, entity.occurrences);
    }
  }

  // Identify coverage gaps
  const coverageGaps = identifyCoverageGaps(entities, {
    brandName,
    knownCompetitors,
    content,
  });

  // Platform breakdown (assign entities to platforms based on context)
  const platformBreakdown = new Map<string, ExtractedEntity[]>();
  for (const platform of platforms) {
    platformBreakdown.set(
      platform,
      entities.filter((e) => e.platforms.includes(platform))
    );
  }

  return {
    entities,
    brandMentions,
    competitorMentions,
    coverageGaps,
    platformBreakdown,
  };
}

/**
 * Identify content gaps based on entity analysis
 */
export function identifyCoverageGaps(
  entities: ExtractedEntity[],
  context: {
    brandName?: string;
    knownCompetitors?: string[];
    content: string;
  }
): string[] {
  const gaps: string[] = [];

  // Check if brand is mentioned
  if (context.brandName) {
    const brandEntity = entities.find(
      (e) => e.name.toLowerCase() === context.brandName!.toLowerCase()
    );
    if (!brandEntity || brandEntity.occurrences < 3) {
      gaps.push(`Low brand mention frequency for "${context.brandName}"`);
    }
  }

  // Check competitor vs brand ratio
  const brandMentions = context.brandName
    ? entities.find((e) => e.name.toLowerCase() === context.brandName!.toLowerCase())?.occurrences || 0
    : 0;

  for (const competitor of context.knownCompetitors || []) {
    const competitorEntity = entities.find(
      (e) => e.name.toLowerCase() === competitor.toLowerCase()
    );
    if (competitorEntity && competitorEntity.occurrences > brandMentions * 1.5) {
      gaps.push(`Competitor "${competitor}" mentioned more than brand (${competitorEntity.occurrences} vs ${brandMentions})`);
    }
  }

  // Check for missing entity types
  const entityTypes = new Set(entities.map((e) => e.type));
  const importantTypes: EntityType[] = ["product", "feature", "topic"];
  for (const type of importantTypes) {
    if (!entityTypes.has(type)) {
      gaps.push(`No ${type} entities detected - consider adding ${type}-related content`);
    }
  }

  // Check topic coverage
  const topicEntities = entities.filter((e) => e.type === "topic");
  if (topicEntities.length < 3) {
    gaps.push("Limited topic coverage - expand content to cover more relevant topics");
  }

  // Check for authority signals
  const personEntities = entities.filter((e) => e.type === "person");
  const orgEntities = entities.filter((e) => e.type === "organization");
  if (personEntities.length === 0 && orgEntities.length === 0) {
    gaps.push("No authority signals (experts, organizations) - consider adding expert quotes or citations");
  }

  return gaps;
}

/**
 * Compare entities across multiple content pieces
 */
export function compareEntityCoverage(
  contentPieces: Array<{ id: string; content: string; platform?: string }>,
  options: {
    brandName?: string;
    knownCompetitors?: string[];
  } = {}
): {
  commonEntities: ExtractedEntity[];
  uniqueEntities: Map<string, ExtractedEntity[]>;
  gaps: string[];
} {
  const allEntities: Map<string, ExtractedEntity[]> = new Map();
  const entityCounts: Map<string, number> = new Map();

  // Extract entities from each piece
  for (const piece of contentPieces) {
    const entities = extractEntities(piece.content, options);
    allEntities.set(piece.id, entities);

    for (const entity of entities) {
      const key = `${entity.name.toLowerCase()}_${entity.type}`;
      entityCounts.set(key, (entityCounts.get(key) || 0) + 1);
    }
  }

  // Find common entities (appear in >50% of content)
  const threshold = Math.ceil(contentPieces.length / 2);
  const commonEntityKeys = new Set(
    Array.from(entityCounts.entries())
      .filter(([, count]) => count >= threshold)
      .map(([key]) => key)
  );

  // Aggregate common entities
  const commonEntities: Map<string, ExtractedEntity> = new Map();
  for (const [, entities] of allEntities) {
    for (const entity of entities) {
      const key = `${entity.name.toLowerCase()}_${entity.type}`;
      if (commonEntityKeys.has(key)) {
        if (commonEntities.has(key)) {
          const existing = commonEntities.get(key)!;
          existing.occurrences += entity.occurrences;
          existing.confidence = Math.max(existing.confidence, entity.confidence);
        } else {
          commonEntities.set(key, { ...entity });
        }
      }
    }
  }

  // Find unique entities per content piece
  const uniqueEntities: Map<string, ExtractedEntity[]> = new Map();
  for (const [id, entities] of allEntities) {
    const unique = entities.filter((e) => {
      const key = `${e.name.toLowerCase()}_${e.type}`;
      return !commonEntityKeys.has(key);
    });
    uniqueEntities.set(id, unique);
  }

  // Identify coverage gaps
  const gaps: string[] = [];
  if (options.brandName) {
    const brandKey = `${options.brandName.toLowerCase()}_brand`;
    if (!commonEntityKeys.has(brandKey)) {
      gaps.push("Brand is not consistently mentioned across content");
    }
  }

  return {
    commonEntities: Array.from(commonEntities.values()),
    uniqueEntities,
    gaps,
  };
}

// Helper functions

function tokenize(text: string): string[] {
  return text
    .split(/[\s.,!?;:()[\]{}'"<>\/\\|`~@#$%^&*+=]+/)
    .filter((word) => word.length > 0);
}

function extractNounPhrases(words: string[]): string[] {
  const phrases: string[] = [];
  let currentPhrase: string[] = [];

  for (const word of words) {
    if (/^[A-Z]/.test(word) && !STOP_WORDS.has(word.toLowerCase())) {
      currentPhrase.push(word);
    } else {
      if (currentPhrase.length > 0) {
        phrases.push(currentPhrase.join(" "));
        currentPhrase = [];
      }
    }
  }

  if (currentPhrase.length > 0) {
    phrases.push(currentPhrase.join(" "));
  }

  return phrases;
}

function extractContext(content: string, index: number, contextLength: number = 100): string[] {
  const start = Math.max(0, index - contextLength);
  const end = Math.min(content.length, index + contextLength);
  const context = content.slice(start, end).trim();
  return [context];
}

function inferEntityType(phrase: string, normalizedContent: string): EntityType {
  const lowerPhrase = phrase.toLowerCase();

  // Check context clues
  if (normalizedContent.includes(`${lowerPhrase} inc`) ||
      normalizedContent.includes(`${lowerPhrase} corp`) ||
      normalizedContent.includes(`${lowerPhrase} company`)) {
    return "organization";
  }

  if (normalizedContent.includes(`ceo ${lowerPhrase}`) ||
      normalizedContent.includes(`dr. ${lowerPhrase}`) ||
      normalizedContent.includes(`mr. ${lowerPhrase}`) ||
      normalizedContent.includes(`ms. ${lowerPhrase}`)) {
    return "person";
  }

  if (normalizedContent.includes(`${lowerPhrase} feature`) ||
      normalizedContent.includes(`${lowerPhrase} tool`)) {
    return "feature";
  }

  if (normalizedContent.includes(`in ${lowerPhrase}`) ||
      normalizedContent.includes(`at ${lowerPhrase}`) ||
      normalizedContent.includes(`${lowerPhrase} city`)) {
    return "location";
  }

  // Default to topic if no clear type
  return "topic";
}

function addOrUpdateEntity(
  entities: Map<string, ExtractedEntity>,
  data: {
    name: string;
    type: EntityType;
    confidence: number;
    context: string[];
    platform?: string;
  }
): void {
  const key = `${data.name.toLowerCase()}_${data.type}`;
  const existing = entities.get(key);

  if (existing) {
    existing.occurrences += 1;
    existing.confidence = Math.max(existing.confidence, data.confidence);
    existing.context = [...new Set([...existing.context, ...data.context])].slice(0, 5);
    if (data.platform && !existing.platforms.includes(data.platform)) {
      existing.platforms.push(data.platform);
    }
  } else {
    entities.set(key, {
      name: data.name,
      type: data.type,
      confidence: data.confidence,
      occurrences: 1,
      platforms: data.platform ? [data.platform] : [],
      context: data.context,
    });
  }
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
