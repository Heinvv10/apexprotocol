/**
 * MentionExtractionService
 * Semantic mention extraction with context awareness
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export const ContentSourceSchema = z.object({
  platform: z.string(),
  url: z.string().optional(),
  author: z.string().optional(),
});

export type ContentSource = z.infer<typeof ContentSourceSchema>;

export const RawContentSchema = z.object({
  id: z.string(),
  text: z.string(),
  source: ContentSourceSchema,
  timestamp: z.date(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type RawContent = z.infer<typeof RawContentSchema>;

export interface MentionContext {
  before: string;
  after: string;
  topics?: string[];
  keywords?: string[];
}

export interface EntityReference {
  type: 'competitor' | 'person' | 'organization' | 'product';
  name: string;
  confidence: number;
}

export interface ExtractedMention {
  id: string;
  contentId: string;
  matchedTerm: string;
  position: 'start' | 'middle' | 'end';
  confidence: number;
  relevanceScore: number;
  context?: MentionContext;
  timestamp: Date;
}

export interface ExtractionEntities {
  competitors: string[];
  people: string[];
  organizations: string[];
  products: string[];
}

export interface ExtractionResult {
  contentId: string;
  mentions: ExtractedMention[];
  entities?: ExtractionEntities;
  sourceValidated: boolean;
  sourceFlags?: string[];
  detectedLanguage: string;
  error?: string;
}

export interface ExtractionStats {
  totalProcessed: number;
  totalMentionsFound: number;
  averageConfidence: number;
  averageProcessingTimeMs: number;
}

export interface DuplicateGroup {
  mentions: ExtractedMention[];
  similarity: number;
}

export const MentionExtractionConfigSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  brandAliases: z.array(z.string()).default([]),
  minConfidence: z.number().min(0).max(1).default(0.7),
  includePartialMatches: z.boolean().default(true),
  contextWindowSize: z.number().positive().default(50),
  detectEntities: z.boolean().default(true),
  detectLanguage: z.boolean().default(true),
});

export type MentionExtractionConfig = z.infer<typeof MentionExtractionConfigSchema>;

// ============================================================================
// Service Implementation
// ============================================================================

export interface MentionExtractionService extends EventEmitter {
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  // Configuration
  getConfig(): MentionExtractionConfig;
  updateConfig(config: Partial<MentionExtractionConfig>): void;

  // Extraction
  extractMentions(content: RawContent): Promise<ExtractionResult>;
  extractMentionsBatch(contents: RawContent[]): Promise<ExtractionResult[]>;

  // Deduplication
  findDuplicates(mentions: ExtractedMention[]): Promise<DuplicateGroup[]>;
  calculateSimilarity(text1: string, text2: string): number;

  // Statistics
  getStats(): ExtractionStats;
  resetStats(): void;
}

class MentionExtractionServiceImpl extends EventEmitter implements MentionExtractionService {
  private config: MentionExtractionConfig;
  private stats: ExtractionStats;
  private initialized = false;

  constructor(config: Partial<MentionExtractionConfig> = {}) {
    super();

    if (config.brandName === '') {
      throw new Error('Brand name is required');
    }

    this.config = MentionExtractionConfigSchema.parse({
      brandName: config.brandName || 'DefaultBrand',
      ...config,
    });

    this.stats = this.createEmptyStats();
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    this.emit('shutdown');
  }

  getConfig(): MentionExtractionConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<MentionExtractionConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  async extractMentions(content: RawContent): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!content || typeof content.text !== 'string') {
        const err = new Error('Invalid content input');
        if (this.listenerCount('error') > 0) {
          this.emit('error', err);
        }
        return {
          contentId: content?.id || 'unknown',
          mentions: [],
          sourceValidated: false,
          detectedLanguage: 'unknown',
          error: 'Invalid content input',
        };
      }

      if (!content.text || content.text.trim() === '') {
        return {
          contentId: content.id,
          mentions: [],
          sourceValidated: true,
          detectedLanguage: 'en',
        };
      }

      const mentions = this.findMentions(content);
      const entities = this.extractEntities(content.text);
      const language = this.detectLanguage(content.text);
      const { validated, flags } = this.validateSource(content);

      this.updateStats(mentions, Date.now() - startTime);

      return {
        contentId: content.id,
        mentions,
        entities,
        sourceValidated: validated,
        sourceFlags: flags,
        detectedLanguage: language,
      };
    } catch (error) {
      this.emit('error', error);
      return {
        contentId: content?.id || 'unknown',
        mentions: [],
        sourceValidated: false,
        detectedLanguage: 'unknown',
        error: String(error),
      };
    }
  }

  async extractMentionsBatch(contents: RawContent[]): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];
    const total = contents.length;

    for (let i = 0; i < contents.length; i++) {
      const result = await this.extractMentions(contents[i]);
      results.push(result);

      this.emit('batchProgress', {
        processed: i + 1,
        total,
        percentage: ((i + 1) / total) * 100,
      });
    }

    return results;
  }

  private findMentions(content: RawContent): ExtractedMention[] {
    const text = content.text;
    const lowerText = text.toLowerCase();

    // Sort search terms by length descending so longer (more specific) matches take precedence
    const searchTerms = [this.config.brandName, ...this.config.brandAliases]
      .sort((a, b) => b.length - a.length);

    // Track which character positions have been claimed by a match (to avoid overlap)
    const claimedRanges: Array<{ start: number; end: number }> = [];

    const mentions: ExtractedMention[] = [];

    for (const term of searchTerms) {
      const lowerTerm = term.toLowerCase();
      let startIndex = 0;
      let index: number;

      while ((index = lowerText.indexOf(lowerTerm, startIndex)) !== -1) {
        const end = index + term.length;

        // Skip if this range overlaps with an already-claimed longer match
        const overlaps = claimedRanges.some(r => index < r.end && end > r.start);

        if (!overlaps) {
          const confidence = this.calculateConfidence(text, index, term);

          if (confidence >= this.config.minConfidence || this.config.includePartialMatches) {
            const position = this.determinePosition(text, index, term.length);
            const context = this.extractContext(text, index, term.length);
            const relevanceScore = this.calculateRelevance(text, term);

            mentions.push({
              id: `${content.id}-${index}`,
              contentId: content.id,
              matchedTerm: term,
              position,
              confidence,
              relevanceScore,
              context,
              timestamp: content.timestamp,
            });

            claimedRanges.push({ start: index, end });
          }
        }

        startIndex = index + 1;
      }
    }

    return mentions;
  }

  private calculateConfidence(text: string, index: number, term: string): number {
    // Check if it's a word boundary match
    const before = text[index - 1] || ' ';
    const after = text[index + term.length] || ' ';
    const isWordBoundary = /\s|[.,!?;:]/.test(before) && /\s|[.,!?;:]/.test(after);
    // Detect hyphenated/compound usage (e.g. "Apex-like") — lower confidence than true word boundary
    const isCompoundUsage = /[-]/.test(after) || /[-]/.test(before);

    // Check for context clues that suggest it's about the brand
    const contextWindow = text.substring(
      Math.max(0, index - 50),
      Math.min(text.length, index + term.length + 50)
    ).toLowerCase();

    const brandContextKeywords = ['platform', 'software', 'tool', 'service', 'company', 'app', 'product'];
    const hasContext = brandContextKeywords.some(kw => contextWindow.includes(kw));

    // Check for non-brand usage (e.g., "apex of the mountain")
    const nonBrandPatterns = ['apex of', 'the apex', 'at apex', 'apex predator'];
    const isNonBrand = nonBrandPatterns.some(pattern =>
      contextWindow.includes(pattern.toLowerCase())
    );

    let confidence = 0.5;

    if (isWordBoundary) confidence += 0.2;
    if (isCompoundUsage) confidence -= 0.1; // Hyphenated usage is less likely to be a direct mention
    if (hasContext) confidence += 0.2;
    if (isNonBrand) confidence -= 0.4;
    if (term.length > this.config.brandName.length) confidence += 0.1; // Alias match

    return Math.max(0, Math.min(1, confidence));
  }

  private determinePosition(text: string, index: number, termLength: number): 'start' | 'middle' | 'end' {
    const textLength = text.length;
    const endIndex = index + termLength;
    const threshold = textLength * 0.25;

    if (index < threshold) return 'start';
    if (endIndex > textLength - threshold) return 'end';
    return 'middle';
  }

  private extractContext(text: string, index: number, termLength: number): MentionContext {
    const windowSize = this.config.contextWindowSize;

    const beforeStart = Math.max(0, index - windowSize);
    const afterEnd = Math.min(text.length, index + termLength + windowSize);

    const before = text.substring(beforeStart, index).trim();
    const after = text.substring(index + termLength, afterEnd).trim();

    const fullContext = text.substring(beforeStart, afterEnd).toLowerCase();
    const topics = this.extractTopics(fullContext);
    // Extract keywords from the full text to capture all relevant terms
    const keywords = this.extractKeywords(text.toLowerCase());

    return { before, after, topics, keywords };
  }

  private extractTopics(text: string): string[] {
    const topicPatterns = [
      'SEO', 'GEO', 'marketing', 'analytics', 'AI', 'automation',
      'brand monitoring', 'competitor analysis', 'content',
    ];

    return topicPatterns.filter(topic =>
      text.toLowerCase().includes(topic.toLowerCase())
    );
  }

  private extractKeywords(text: string): string[] {
    const keywordPatterns = [
      'enterprise', 'brand monitoring', 'competitor analysis',
      'platform', 'solution', 'pricing', 'features', 'support',
    ];

    return keywordPatterns.filter(kw =>
      text.toLowerCase().includes(kw.toLowerCase())
    );
  }

  private calculateRelevance(text: string, term: string): number {
    const lowerText = text.toLowerCase();
    const termCount = (lowerText.match(new RegExp(term.toLowerCase(), 'g')) || []).length;
    const wordCount = text.split(/\s+/).length;

    const density = termCount / wordCount;
    const hasPositiveContext = /great|excellent|amazing|love|best|recommend/.test(lowerText);
    const hasNegativeContext = /bad|terrible|hate|worst|avoid|problem/.test(lowerText);

    let relevance = Math.min(1, density * 10);
    if (hasPositiveContext || hasNegativeContext) relevance += 0.2;

    return Math.min(1, relevance);
  }

  private extractEntities(text: string): ExtractionEntities {
    const entities: ExtractionEntities = {
      competitors: [],
      people: [],
      organizations: [],
      products: [],
    };

    // Known competitors
    const competitors = ['Semrush', 'Ahrefs', 'Moz', 'Conductor', 'BrightEdge'];
    entities.competitors = competitors.filter(c =>
      text.toLowerCase().includes(c.toLowerCase())
    );

    // Detect person names (simple pattern: Title + Capitalized Words)
    const personPattern = /(?:CEO|CTO|CFO|Founder|President|Director)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g;
    let personMatch;
    while ((personMatch = personPattern.exec(text)) !== null) {
      entities.people.push(personMatch[1]);
    }

    // Detect organizations
    const orgPatterns = ['Microsoft', 'Google', 'Amazon', 'Apple', 'Meta', 'OpenAI', 'Anthropic'];
    entities.organizations = orgPatterns.filter(org =>
      text.includes(org)
    );

    // Detect product names (brand + common suffix)
    const productPattern = new RegExp(`${this.config.brandName}\\s+(Dashboard|Analytics|Platform|Pro|Enterprise)`, 'gi');
    let productMatch;
    while ((productMatch = productPattern.exec(text)) !== null) {
      entities.products.push(productMatch[0]);
    }

    return entities;
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const languagePatterns: Record<string, string[]> = {
      en: ['the', 'is', 'are', 'and', 'or', 'for', 'with'],
      es: ['el', 'la', 'es', 'para', 'con', 'que', 'de'],
      de: ['der', 'die', 'das', 'und', 'ist', 'für', 'mit'],
      fr: ['le', 'la', 'est', 'pour', 'avec', 'que', 'de'],
    };

    const lowerText = text.toLowerCase();
    const wordCounts: Record<string, number> = {};

    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      wordCounts[lang] = patterns.filter(word =>
        new RegExp(`\\b${word}\\b`).test(lowerText)
      ).length;
    }

    const detectedLang = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)[0];

    return detectedLang?.[1] > 0 ? detectedLang[0] : 'en';
  }

  private validateSource(content: RawContent): { validated: boolean; flags: string[] } {
    const flags: string[] = [];

    // Check for known platforms
    const knownPlatforms = ['twitter', 'linkedin', 'reddit', 'blog', 'news', 'review', 'article', 'testimonial', 'press'];
    const isKnownPlatform = knownPlatforms.includes(content.source.platform.toLowerCase());

    if (!isKnownPlatform) {
      flags.push('unverified_source');
    }

    // Check for bot-like patterns
    const botPatterns = /BUY NOW|BEST PRICE|!!!+|\b(\w+)\s+\1\s+\1\b/i;
    if (botPatterns.test(content.text)) {
      flags.push('potential_bot');
    }

    return {
      validated: flags.length === 0,
      flags: flags.length > 0 ? flags : undefined as unknown as string[],
    };
  }

  async findDuplicates(mentions: ExtractedMention[]): Promise<DuplicateGroup[]> {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < mentions.length; i++) {
      if (processed.has(mentions[i].id)) continue;

      const group: ExtractedMention[] = [mentions[i]];
      processed.add(mentions[i].id);

      for (let j = i + 1; j < mentions.length; j++) {
        if (processed.has(mentions[j].id)) continue;

        const similarity = this.calculateSimilarity(
          mentions[i].context?.before + mentions[i].matchedTerm + mentions[i].context?.after || '',
          mentions[j].context?.before + mentions[j].matchedTerm + mentions[j].context?.after || ''
        );

        if (similarity > 0.8) {
          group.push(mentions[j]);
          processed.add(mentions[j].id);
        }
      }

      if (group.length > 1) {
        groups.push({
          mentions: group,
          similarity: 1, // Simplified - would calculate average
        });
      }
    }

    return groups;
  }

  calculateSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    if (text1 === text2) return 1;

    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = Array.from(words1).filter(w => words2.has(w)).length;
    const union = new Set([...Array.from(words1), ...Array.from(words2)]).size;

    return intersection / union;
  }

  private updateStats(mentions: ExtractedMention[], processingTimeMs: number): void {
    this.stats.totalProcessed++;
    this.stats.totalMentionsFound += mentions.length;

    if (mentions.length > 0) {
      const avgConfidence = mentions.reduce((sum, m) => sum + m.confidence, 0) / mentions.length;
      const totalSamples = this.stats.totalProcessed;

      this.stats.averageConfidence = (
        (this.stats.averageConfidence * (totalSamples - 1) + avgConfidence) / totalSamples
      );
    }

    this.stats.averageProcessingTimeMs = (
      (this.stats.averageProcessingTimeMs * (this.stats.totalProcessed - 1) + processingTimeMs) /
      this.stats.totalProcessed
    );
  }

  getStats(): ExtractionStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = this.createEmptyStats();
  }

  private createEmptyStats(): ExtractionStats {
    return {
      totalProcessed: 0,
      totalMentionsFound: 0,
      averageConfidence: 0,
      averageProcessingTimeMs: 0,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createMentionExtractionService(
  config: Partial<MentionExtractionConfig> = {}
): MentionExtractionService {
  return new MentionExtractionServiceImpl(config);
}
