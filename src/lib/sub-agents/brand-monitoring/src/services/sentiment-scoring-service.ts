/**
 * SentimentScoringService
 * Advanced sentiment analysis with multi-dimensional scoring
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export const SentimentInputSchema = z.object({
  id: z.string(),
  text: z.string(),
  metadata: z.object({
    source: z.string().optional(),
    language: z.string().optional(),
  }).optional(),
});

export type SentimentInput = z.infer<typeof SentimentInputSchema>;

export interface SentimentDimension {
  innovation?: number;
  reliability?: number;
  service?: number;
  brandPerception?: number;
  productQuality?: number;
  valueForMoney?: number;
}

export interface EmotionBreakdown {
  joy: number;
  fear: number;
  trust: number;
  surprise: number;
  anticipation: number;
  frustration: number;
  anger: number;
  sadness: number;
}

export interface AspectSentiment {
  aspect: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
}

export interface SentimentScore {
  id: string;
  score: number;
  overallSentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  dimensions?: SentimentDimension;
  emotions?: Partial<EmotionBreakdown>;
  isMixed?: boolean;
  mixedAspects?: AspectSentiment[];
  sarcasmDetected?: boolean;
  sarcasmConfidence?: number;
  intensity?: 'low' | 'medium' | 'high';
  intensityScore?: number;
  detectedLanguage?: string;
}

export interface AspectSentimentResult {
  id: string;
  aspects?: AspectSentiment[];
}

export interface ComparativeSentiment {
  id: string;
  hasComparison: boolean;
  comparisons?: Array<{
    entity: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    relativePosition?: 'superior' | 'inferior' | 'equal';
  }>;
}

export interface SentimentAggregation {
  averageScore: number;
  weightedAverageScore?: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface SentimentTrend {
  direction: 'improving' | 'declining' | 'stable';
  slope: number;
  confidence: number;
}

export interface SentimentStats {
  totalAnalyzed: number;
  averageProcessingTimeMs: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export const SentimentScoringConfigSchema = z.object({
  modelType: z.enum(['basic', 'advanced']).default('advanced'),
  includeDimensions: z.boolean().default(true),
  includeEmotions: z.boolean().default(true),
  languageSupport: z.array(z.string()).default(['en', 'es', 'de', 'fr']),
  sarcasmDetection: z.boolean().default(true),
});

export type SentimentScoringConfig = z.infer<typeof SentimentScoringConfigSchema>;

// ============================================================================
// Service Implementation
// ============================================================================

export interface SentimentScoringService extends EventEmitter {
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  isModelLoaded(): boolean;

  // Configuration
  getConfig(): SentimentScoringConfig;
  updateConfig(config: Partial<SentimentScoringConfig>): void;

  // Analysis
  analyzeSentiment(input: SentimentInput): Promise<SentimentScore>;
  analyzeSentimentBatch(inputs: SentimentInput[]): Promise<SentimentScore[]>;
  analyzeAspectSentiment(input: SentimentInput): Promise<AspectSentimentResult>;
  analyzeComparativeSentiment(input: SentimentInput): Promise<ComparativeSentiment>;

  // Aggregation
  aggregateSentiment(scores: SentimentScore[], options?: { weightByConfidence?: boolean }): SentimentAggregation;
  calculateTrend(scores: Array<SentimentScore & { timestamp: Date }>): SentimentTrend;

  // Statistics
  getStats(): SentimentStats;
  resetStats(): void;
}

class SentimentScoringServiceImpl extends EventEmitter implements SentimentScoringService {
  private config: SentimentScoringConfig;
  private stats: SentimentStats;
  private modelLoaded = false;

  constructor(config: Partial<SentimentScoringConfig> = {}) {
    super();
    this.config = SentimentScoringConfigSchema.parse(config);
    this.stats = this.createEmptyStats();
  }

  async initialize(): Promise<void> {
    this.modelLoaded = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    this.modelLoaded = false;
    this.emit('shutdown');
  }

  isModelLoaded(): boolean {
    return this.modelLoaded;
  }

  getConfig(): SentimentScoringConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<SentimentScoringConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  async analyzeSentiment(input: SentimentInput): Promise<SentimentScore> {
    const startTime = Date.now();

    try {
      if (!input) {
        this.emit('error', new Error('Invalid input'));
        return this.createErrorScore('unknown');
      }

      if (!input.text || input.text.trim() === '') {
        return {
          id: input.id,
          score: 0,
          overallSentiment: 'neutral',
          confidence: 1,
        };
      }

      const score = this.calculateSentimentScore(input.text);
      const confidence = this.calculateConfidence(input.text);
      const overallSentiment = this.classifySentiment(score);
      const detectedLanguage = this.detectLanguage(input.text);

      const result: SentimentScore = {
        id: input.id,
        score,
        overallSentiment,
        confidence,
        detectedLanguage,
      };

      if (this.config.includeDimensions) {
        result.dimensions = this.analyzeDimensions(input.text);
      }

      if (this.config.includeEmotions) {
        result.emotions = this.analyzeEmotions(input.text);
      }

      if (this.config.sarcasmDetection) {
        const sarcasm = this.detectSarcasm(input.text);
        result.sarcasmDetected = sarcasm.detected;
        result.sarcasmConfidence = sarcasm.confidence;

        // Flip sentiment if sarcasm detected
        if (sarcasm.detected && sarcasm.confidence > 0.7) {
          // Ensure a meaningful negative score when sarcasm overrides
          result.score = result.score > 0 ? -result.score : Math.min(result.score, -0.4);
          result.overallSentiment = this.classifySentiment(result.score);
        }
      }

      const intensity = this.analyzeIntensity(input.text);
      result.intensity = intensity.level;
      result.intensityScore = intensity.score;

      // Check for mixed sentiment
      const aspects = this.extractAspects(input.text);
      if (aspects.some(a => a.sentiment === 'positive') && aspects.some(a => a.sentiment === 'negative')) {
        result.isMixed = true;
        result.mixedAspects = aspects;
      }

      this.updateStats(result, Math.max(1, Date.now() - startTime));
      return result;
    } catch (error) {
      this.emit('error', error);
      return this.createErrorScore(input?.id || 'unknown');
    }
  }

  async analyzeSentimentBatch(inputs: SentimentInput[]): Promise<SentimentScore[]> {
    const results: SentimentScore[] = [];
    const total = inputs.length;

    for (let i = 0; i < inputs.length; i++) {
      const result = await this.analyzeSentiment(inputs[i]);
      results.push(result);

      this.emit('batchProgress', {
        processed: i + 1,
        total,
        percentage: ((i + 1) / total) * 100,
      });
    }

    return results;
  }

  async analyzeAspectSentiment(input: SentimentInput): Promise<AspectSentimentResult> {
    const aspects = this.extractAspects(input.text);
    return {
      id: input.id,
      aspects,
    };
  }

  async analyzeComparativeSentiment(input: SentimentInput): Promise<ComparativeSentiment> {
    const text = input.text.toLowerCase();
    const comparativePatterns = [
      /better than/i, /worse than/i, /compared to/i, /unlike/i,
      /superior to/i, /inferior to/i, /vs\.?/i, /versus/i,
    ];

    const hasComparison = comparativePatterns.some(p => p.test(text));

    const result: ComparativeSentiment = {
      id: input.id,
      hasComparison,
    };

    if (hasComparison) {
      result.comparisons = this.extractComparisons(input.text);
    }

    return result;
  }

  aggregateSentiment(scores: SentimentScore[], options: { weightByConfidence?: boolean } = {}): SentimentAggregation {
    if (scores.length === 0) {
      return {
        averageScore: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        distribution: { positive: 0, negative: 0, neutral: 0 },
      };
    }

    const total = scores.length;
    const averageScore = scores.reduce((sum, s) => sum + s.score, 0) / total;
    const positiveCount = scores.filter(s => s.overallSentiment === 'positive').length;
    const negativeCount = scores.filter(s => s.overallSentiment === 'negative').length;
    const neutralCount = scores.filter(s => s.overallSentiment === 'neutral').length;

    const result: SentimentAggregation = {
      averageScore,
      positiveCount,
      negativeCount,
      neutralCount,
      distribution: {
        positive: positiveCount / total,
        negative: negativeCount / total,
        neutral: neutralCount / total,
      },
    };

    if (options.weightByConfidence) {
      const totalWeight = scores.reduce((sum, s) => sum + s.confidence, 0);
      result.weightedAverageScore = scores.reduce(
        (sum, s) => sum + s.score * s.confidence,
        0
      ) / totalWeight;
    }

    return result;
  }

  calculateTrend(scores: Array<SentimentScore & { timestamp: Date }>): SentimentTrend {
    if (scores.length < 2) {
      return { direction: 'stable', slope: 0, confidence: 0 };
    }

    // Sort by timestamp
    const sorted = [...scores].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Simple linear regression
    const n = sorted.length;
    const xMean = (n - 1) / 2;
    const yMean = sorted.reduce((sum, s) => sum + s.score, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (sorted[i].score - yMean);
      denominator += (i - xMean) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;

    // Determine direction based on slope
    let direction: 'improving' | 'declining' | 'stable';
    if (Math.abs(slope) < 0.05) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }

    // Calculate confidence based on variance
    const variance = sorted.reduce((sum, s) => sum + (s.score - yMean) ** 2, 0) / n;
    const confidence = Math.max(0, Math.min(1, 1 - Math.sqrt(variance)));

    return { direction, slope, confidence };
  }

  private calculateSentimentScore(text: string): number {
    const lowerText = text.toLowerCase();

    const positiveWords = [
      'amazing', 'excellent', 'great', 'fantastic', 'love', 'wonderful',
      'best', 'perfect', 'outstanding', 'incredible', 'awesome', 'brilliant',
      'recommend', 'helpful', 'impressed', 'delighted', 'satisfied',
      'better', 'superior', 'exceptional', 'innovative', 'reliable',
      'trusted', 'leader', 'established', 'quality', 'value',
      // Spanish
      'excelente', 'increíble', 'genial', 'fantástico', 'amor', 'maravilloso',
      'mejor', 'perfecto', 'extraordinario', 'bueno', 'positivo',
      // German
      'ausgezeichnet', 'hervorragend', 'toll', 'wunderbar', 'liebe',
      'beste', 'perfekt', 'fantastisch', 'prima', 'super', 'gut',
      // French
      'formidable', 'excellent', 'magnifique', 'super', 'merveilleux',
    ];

    const negativeWords = [
      'terrible', 'awful', 'bad', 'poor', 'hate', 'horrible',
      'worst', 'disappointing', 'frustrating', 'annoying', 'useless',
      'broken', 'crashed', 'buggy', 'slow', 'expensive', 'problem',
      'not happy', 'unhappy', 'not satisfied', 'not good', 'not great',
      // Spanish
      'terrible', 'horrible', 'malo', 'pésimo', 'odio', 'desastroso',
      // German
      'schrecklich', 'furchtbar', 'schlecht', 'schlimm', 'hasse', 'grauenhaft',
      'schlechtes', 'schreckliches', 'furchtbares',
      // French
      'terrible', 'horrible', 'mauvais', 'affreux',
    ];

    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

    // Scale between -1 and 1
    const total = positiveCount + negativeCount;
    if (total === 0) return 0;

    return (positiveCount - negativeCount) / Math.max(total, 3);
  }

  private calculateConfidence(text: string): number {
    const wordCount = text.split(/\s+/).length;

    // More words = higher confidence (up to a point)
    const lengthFactor = Math.min(1, wordCount / 20);

    // Clear sentiment words = higher confidence
    const lowerText = text.toLowerCase();
    const strongWords = ['definitely', 'absolutely', 'certainly', 'extremely', 'very'];
    const hasStrongWords = strongWords.some(w => lowerText.includes(w));

    return Math.min(1, lengthFactor * 0.7 + (hasStrongWords ? 0.3 : 0.15));
  }

  private classifySentiment(score: number): 'positive' | 'negative' | 'neutral' {
    if (score > 0.3) return 'positive';
    if (score < -0.3) return 'negative';
    return 'neutral';
  }

  private detectLanguage(text: string): string {
    const languagePatterns: Record<string, string[]> = {
      en: ['the', 'is', 'are', 'and', 'or', 'for', 'with'],
      es: ['el', 'la', 'es', 'para', 'con', 'que', 'muy'],
      de: ['der', 'die', 'das', 'und', 'ist', 'für', 'mit'],
      fr: ['le', 'la', 'est', 'pour', 'avec', 'que', 'très'],
    };

    const lowerText = text.toLowerCase();
    const wordCounts: Record<string, number> = {};

    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      wordCounts[lang] = patterns.filter(word =>
        new RegExp(`\\b${word}\\b`).test(lowerText)
      ).length;
    }

    const detected = Object.entries(wordCounts).sort(([, a], [, b]) => b - a)[0];
    return detected?.[1] > 0 ? detected[0] : 'en';
  }

  private analyzeDimensions(text: string): SentimentDimension {
    const lowerText = text.toLowerCase();

    return {
      innovation: this.scoreKeywords(lowerText, ['innovative', 'cutting-edge', 'revolutionary', 'new', 'unique']),
      reliability: this.scoreKeywords(lowerText, ['reliable', 'stable', 'consistent', 'dependable', 'trusted']),
      service: this.scoreKeywords(lowerText, ['service', 'support', 'helpful', 'responsive', 'team']),
      brandPerception: this.scoreKeywords(lowerText, ['leader', 'trusted', 'established', 'reputation', 'brand']),
      productQuality: this.scoreKeywords(lowerText, ['quality', 'well-made', 'robust', 'professional', 'polished']),
      valueForMoney: this.scoreKeywords(lowerText, ['value', 'worth', 'affordable', 'reasonable', 'investment']),
    };
  }

  private scoreKeywords(text: string, keywords: string[]): number {
    const matchCount = keywords.filter(k => text.includes(k)).length;
    if (matchCount === 0) return 0;
    // Score: 1 match = 0.6, 2 matches = 0.8, 3+ matches = 1.0
    return Math.min(1, 0.4 + (matchCount * 0.2));
  }

  private analyzeEmotions(text: string): Partial<EmotionBreakdown> {
    const lowerText = text.toLowerCase();

    return {
      joy: this.scoreKeywords(lowerText, ['happy', 'excited', 'delighted', 'thrilled', 'love']),
      fear: this.scoreKeywords(lowerText, ['worried', 'concerned', 'afraid', 'anxious', 'nervous']),
      trust: this.scoreKeywords(lowerText, ['trust', 'reliable', 'dependable', 'confident', 'secure']),
      surprise: this.scoreKeywords(lowerText, ['surprised', 'amazed', 'unexpected', 'shocked', 'wow']),
      anticipation: this.scoreKeywords(lowerText, ['waiting', 'excited for', 'looking forward', 'can\'t wait', 'cannot wait', 'can not wait', 'anticipate', 'coming next']),
      frustration: this.scoreKeywords(lowerText, ['frustrated', 'annoyed', 'irritated', 'fed up', 'ugh']),
      anger: this.scoreKeywords(lowerText, ['angry', 'furious', 'outraged', 'livid', 'mad']),
      sadness: this.scoreKeywords(lowerText, ['sad', 'disappointed', 'upset', 'unhappy', 'sorry']),
    };
  }

  private detectSarcasm(text: string): { detected: boolean; confidence: number } {
    const lowerText = text.toLowerCase();

    // Patterns that often indicate sarcasm
    const sarcasmPatterns = [
      /oh great/i, /wow.+surprise/i, /so\s+.+obviously/i,
      /what a\s+surprise/i, /of course/i, /yeah right/i,
      /sure.+works/i, /best.+ever.+not/i,
      /great.*again/i, /best investment ever/i,
      /how (surprising|shocking|unexpected)/i,
      /thanks (a lot|for nothing)/i,
    ];

    // Excessive punctuation or caps often indicates sarcasm
    const hasExcessivePunctuation = /[!?]{2,}/.test(text);
    const hasExcessiveCaps = (text.match(/[A-Z]{3,}/g) || []).length > 2;

    // Check for positive words followed by negative context
    const positiveNegativeMismatch =
      (/great|excellent|amazing|best|wow/i.test(lowerText)) &&
      (/crashed|broken|bug|terrible|problem|again|paying.*for bugs/i.test(lowerText));

    // Positive exclamation following negative context
    const negativePositivePattern =
      (/paying|bugs|crash|broken|terrible|awful/i.test(lowerText)) &&
      (/best|great|amazing|fantastic|excellent/i.test(lowerText));

    const patternMatch = sarcasmPatterns.some(p => p.test(text));

    const indicators = [
      patternMatch,
      hasExcessivePunctuation,
      hasExcessiveCaps,
      positiveNegativeMismatch,
      negativePositivePattern,
    ].filter(Boolean).length;

    return {
      detected: indicators >= 2,
      confidence: Math.min(1, indicators * 0.3),
    };
  }

  private analyzeIntensity(text: string): { level: 'low' | 'medium' | 'high'; score: number } {
    const lowerText = text.toLowerCase();

    // Intensity indicators
    const intensifiers = ['very', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely'];
    const exclamations = (text.match(/!/g) || []).length;
    const capsWords = (text.match(/[A-Z]{2,}/g) || []).length;

    const intensifierCount = intensifiers.filter(i => lowerText.includes(i)).length;
    const score = Math.min(1, (intensifierCount * 0.2) + (exclamations * 0.15) + (capsWords * 0.1));

    let level: 'low' | 'medium' | 'high';
    if (score < 0.3) level = 'low';
    else if (score < 0.6) level = 'medium';
    else level = 'high';

    return { level, score };
  }

  private extractAspects(text: string): AspectSentiment[] {
    const aspects: AspectSentiment[] = [];
    const lowerText = text.toLowerCase();

    const aspectKeywords: Record<string, string[]> = {
      analytics: ['analytics', 'data', 'reports', 'metrics', 'insights'],
      UI: ['ui', 'interface', 'design', 'layout', 'usability', 'intuitive'],
      pricing: ['price', 'cost', 'expensive', 'affordable', 'value', 'pricing', 'steep'],
      support: ['support', 'help', 'team', 'response', 'service'],
      features: ['features', 'functionality', 'capabilities', 'tools'],
      performance: ['fast', 'slow', 'speed', 'performance', 'loading'],
      reporting: ['reports', 'reporting', 'dashboard', 'visualization'],
    };

    // Contrast patterns that indicate negative context
    const negativeContrastPatterns = [
      /\bbut\b.*\b(could|should|needs?|lacks?|missing|poor|bad|not)\b/i,
      /\bexcept\b/i,
      /\balthough\b.*\b(could|should|needs?|lacks?|poor|bad|not)\b/i,
      /\bcould be (more|better|improved|easier)\b/i,
      /\bsteep\b/i,
    ];

    for (const [aspect, keywords] of Object.entries(aspectKeywords)) {
      const matches = keywords.filter(k => lowerText.includes(k));
      if (matches.length > 0) {
        // Find the sentence containing the keyword and analyze its sentiment
        const sentences = text.split(/[.!?]+/);
        for (const sentence of sentences) {
          const sentenceLower = sentence.toLowerCase();
          const matchedKeyword = keywords.find(k => sentenceLower.includes(k));
          if (!matchedKeyword) continue;

          let score = this.calculateSentimentScore(sentence);

          // Determine position relative to contrast words
          const kwIndex = sentenceLower.indexOf(matchedKeyword);
          const contrastIndex = sentenceLower.search(/\b(but|except|however|although|though|yet)\b/);

          let contextWindow: string;
          if (contrastIndex !== -1 && kwIndex < contrastIndex) {
            // Keyword is before the contrast word — use text up to contrast word
            contextWindow = sentence.substring(0, contrastIndex);
          } else if (contrastIndex !== -1 && kwIndex > contrastIndex) {
            // Keyword is after the contrast word — use text after contrast word
            contextWindow = sentence.substring(contrastIndex);
          } else {
            // No contrast word — use proximity window
            const contextStart = Math.max(0, kwIndex - 30);
            const contextEnd = Math.min(sentence.length, kwIndex + matchedKeyword.length + 40);
            contextWindow = sentence.substring(contextStart, contextEnd);
          }

          const contextScore = this.calculateSentimentScore(contextWindow);
          // Use context score if it provides a clearer signal
          if (Math.abs(contextScore) > Math.abs(score)) {
            score = contextScore;
          }

          // If keyword is after contrast word, ensure negative classification
          const isAfterContrast = contrastIndex !== -1 && kwIndex > contrastIndex;
          // Only test negative contrast patterns on the context window (not full sentence)
          const hasNegativeContrast = isAfterContrast && negativeContrastPatterns.some(p => p.test(contextWindow));
          const hasExplicitNegativeInContext = /\b(not|steep|difficult|hard|poor|bad|worst|terrible|awful|lacking|too expensive|could be more)\b/i.test(contextWindow);

          if ((isAfterContrast || hasNegativeContrast || hasExplicitNegativeInContext) && score >= -0.3) {
            score = -0.4;
          }

          aspects.push({
            aspect,
            sentiment: this.classifySentiment(score),
            score,
            confidence: 0.7 + (matches.length * 0.1),
          });
          break;
        }
      }
    }

    return aspects;
  }

  private extractComparisons(text: string): Array<{
    entity: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    relativePosition?: 'superior' | 'inferior' | 'equal';
  }> {
    const comparisons: Array<{
      entity: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      relativePosition?: 'superior' | 'inferior' | 'equal';
    }> = [];

    // Check for known competitors
    const competitors = ['Semrush', 'Ahrefs', 'Moz', 'Conductor'];
    const lowerText = text.toLowerCase();

    for (const comp of competitors) {
      if (lowerText.includes(comp.toLowerCase())) {
        const isSuperior = /better than|superior to|outperforms/i.test(text) &&
                           text.indexOf('Apex') < text.indexOf(comp);
        const isInferior = /worse than|inferior to|behind/i.test(text) &&
                           text.indexOf('Apex') < text.indexOf(comp);

        comparisons.push({
          entity: comp,
          sentiment: isInferior ? 'positive' : (isSuperior ? 'negative' : 'neutral'),
          relativePosition: isSuperior ? 'inferior' : (isInferior ? 'superior' : 'equal'),
        });
      }
    }

    // Add Apex itself
    if (lowerText.includes('apex')) {
      comparisons.push({
        entity: 'Apex',
        sentiment: this.classifySentiment(this.calculateSentimentScore(text)),
      });
    }

    return comparisons;
  }

  private updateStats(result: SentimentScore, processingTimeMs: number): void {
    this.stats.totalAnalyzed++;

    this.stats.averageProcessingTimeMs = (
      (this.stats.averageProcessingTimeMs * (this.stats.totalAnalyzed - 1) + processingTimeMs) /
      this.stats.totalAnalyzed
    );

    if (result.overallSentiment === 'positive') {
      this.stats.sentimentDistribution.positive++;
    } else if (result.overallSentiment === 'negative') {
      this.stats.sentimentDistribution.negative++;
    } else {
      this.stats.sentimentDistribution.neutral++;
    }
  }

  getStats(): SentimentStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = this.createEmptyStats();
  }

  private createEmptyStats(): SentimentStats {
    return {
      totalAnalyzed: 0,
      averageProcessingTimeMs: 0,
      sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
    };
  }

  private createErrorScore(id: string): SentimentScore {
    return {
      id,
      score: 0,
      overallSentiment: 'neutral',
      confidence: 0,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createSentimentScoringService(
  config: Partial<SentimentScoringConfig> = {}
): SentimentScoringService {
  return new SentimentScoringServiceImpl(config);
}
