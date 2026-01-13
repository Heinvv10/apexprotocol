import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Brand Voice Learning Service
 *
 * Analyzes existing brand content to create detailed voice profiles
 * that ensure consistent tone, style, and messaging across all generated content.
 */

// Zod Schemas
export const BrandVoiceTrainingDataSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  content: z.string().min(1),
  type: z.enum(['blog_post', 'social_media', 'marketing_copy', 'technical_docs', 'press_release', 'general']),
  platform: z.enum(['website', 'twitter', 'linkedin', 'facebook', 'instagram', 'medium', 'substack', 'general']).optional(),
  metadata: z.object({
    title: z.string().optional(),
    publishedDate: z.date().optional(),
    engagementScore: z.number().min(0).max(1).optional(),
    performanceMetrics: z.record(z.string(), z.number()).optional()
  }).optional(),
  tags: z.array(z.string()).optional()
});

export const BrandVoiceConfigSchema = z.object({
  brandId: z.string(),
  brandName: z.string(),
  minExamplesForAnalysis: z.number().min(1).default(3),
  maxExamplesStored: z.number().min(10).default(100),
  confidenceThreshold: z.number().min(0).max(1).default(0.6),
  enableSentimentAnalysis: z.boolean().default(true),
  enableStyleAnalysis: z.boolean().default(true),
  enableVocabularyExtraction: z.boolean().default(true),
  updateOnNewExamples: z.boolean().default(true)
});

// Type Definitions
export type BrandVoiceTrainingData = z.infer<typeof BrandVoiceTrainingDataSchema>;
export type BrandVoiceConfig = z.infer<typeof BrandVoiceConfigSchema>;

export interface ToneAnalysis {
  primary: string[];
  secondary: string[];
  scores: Record<string, number>;
}

export interface StyleAnalysis {
  formality: number; // 0 = casual, 1 = formal
  complexity: number; // 0 = simple, 1 = complex
  emotionality: number; // 0 = neutral, 1 = emotional
  descriptive: number; // 0 = minimal, 1 = rich
}

export interface VocabularyProfile {
  frequentWords: Array<{ word: string; frequency: number; contexts: string[] }>;
  preferredTerms: string[];
  avoidedTerms: string[];
  industryTerms: string[];
  brandSpecificTerms: string[];
  averageSentenceLength: number;
  averageWordLength: number;
}

export interface MessagingPatterns {
  keyPhrases: string[];
  callToActionStyles: string[];
  openingPatterns: string[];
  closingPatterns: string[];
  transitionWords: string[];
}

export interface PersonalityProfile {
  traits: string[];
  archetypes: string[];
  values: string[];
  differentiators: string[];
}

export interface BrandVoiceAnalysis {
  brandId: string;
  brandName: string;
  tone: ToneAnalysis;
  style: StyleAnalysis;
  vocabulary: VocabularyProfile;
  messaging: MessagingPatterns;
  personality: PersonalityProfile;
  guidelines: string[];
  confidence: number;
  examplesAnalyzed: number;
  lastUpdated: Date;
  version: number;
}

export interface ContentAnalysisResult {
  brandVoiceScore: number;
  toneMatch: number;
  styleMatch: number;
  vocabularyMatch: number;
  recommendations: string[];
  highlights: { text: string; type: 'positive' | 'negative' | 'suggestion' }[];
}

/**
 * Brand Voice Learning Service
 */
export class BrandVoiceService extends EventEmitter {
  private config: BrandVoiceConfig;
  private trainingData: BrandVoiceTrainingData[] = [];
  private analysis: BrandVoiceAnalysis | null = null;
  private initialized: boolean = false;

  constructor(config: Partial<BrandVoiceConfig>) {
    super();
    this.config = BrandVoiceConfigSchema.parse(config);
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.emit('initializing');

    // Initialize with default analysis
    this.analysis = this.createDefaultAnalysis();

    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Add training examples for brand voice learning
   */
  async addTrainingExamples(examples: BrandVoiceTrainingData[]): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const validatedExamples = examples.map(ex => BrandVoiceTrainingDataSchema.parse(ex));

    // Add to training data with limit enforcement
    this.trainingData.push(...validatedExamples);

    // Enforce max examples limit
    if (this.trainingData.length > this.config.maxExamplesStored) {
      // Keep the most recent and highest performing examples
      this.trainingData = this.prioritizeExamples(this.trainingData);
    }

    this.emit('trainingData:added', { count: validatedExamples.length });

    // Auto-update analysis if enabled and threshold met
    if (this.config.updateOnNewExamples && this.trainingData.length >= this.config.minExamplesForAnalysis) {
      await this.analyzeVoice();
    }
  }

  /**
   * Analyze brand voice from training data
   */
  async analyzeVoice(): Promise<BrandVoiceAnalysis> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.trainingData.length < this.config.minExamplesForAnalysis) {
      this.emit('analysis:insufficient_data', {
        required: this.config.minExamplesForAnalysis,
        current: this.trainingData.length
      });
      return this.analysis!;
    }

    this.emit('analysis:start');

    const allContent = this.trainingData.map(d => d.content);

    // Analyze tone
    const tone = this.analyzeTone(allContent);

    // Analyze style
    const style = this.analyzeStyle(allContent);

    // Extract vocabulary
    const vocabulary = this.extractVocabulary(allContent);

    // Identify messaging patterns
    const messaging = this.identifyMessagingPatterns(allContent);

    // Build personality profile
    const personality = this.buildPersonalityProfile(tone, style, vocabulary);

    // Generate guidelines
    const guidelines = this.generateGuidelines(tone, style, vocabulary, messaging);

    // Calculate confidence
    const confidence = this.calculateConfidence();

    this.analysis = {
      brandId: this.config.brandId,
      brandName: this.config.brandName,
      tone,
      style,
      vocabulary,
      messaging,
      personality,
      guidelines,
      confidence,
      examplesAnalyzed: this.trainingData.length,
      lastUpdated: new Date(),
      version: (this.analysis?.version || 0) + 1
    };

    this.emit('analysis:complete', this.analysis);

    return this.analysis;
  }

  /**
   * Analyze content against brand voice
   */
  analyzeContent(content: string): ContentAnalysisResult {
    if (!this.analysis) {
      return {
        brandVoiceScore: 0.5,
        toneMatch: 0.5,
        styleMatch: 0.5,
        vocabularyMatch: 0.5,
        recommendations: ['Add more training examples to improve analysis'],
        highlights: []
      };
    }

    const toneMatch = this.calculateToneMatch(content);
    const styleMatch = this.calculateStyleMatch(content);
    const vocabularyMatch = this.calculateVocabularyMatch(content);

    const brandVoiceScore = (toneMatch * 0.35 + styleMatch * 0.35 + vocabularyMatch * 0.3);

    const recommendations = this.generateContentRecommendations(
      content,
      toneMatch,
      styleMatch,
      vocabularyMatch
    );

    const highlights = this.identifyHighlights(content);

    return {
      brandVoiceScore,
      toneMatch,
      styleMatch,
      vocabularyMatch,
      recommendations,
      highlights
    };
  }

  /**
   * Get current brand voice analysis
   */
  getAnalysis(): BrandVoiceAnalysis | null {
    return this.analysis;
  }

  /**
   * Get training data summary
   */
  getTrainingDataSummary(): {
    total: number;
    byType: Record<string, number>;
    byPlatform: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};

    this.trainingData.forEach(data => {
      byType[data.type] = (byType[data.type] || 0) + 1;
      const platform = data.platform || 'general';
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;
    });

    return {
      total: this.trainingData.length,
      byType,
      byPlatform
    };
  }

  /**
   * Export voice profile for sharing/backup
   */
  exportProfile(): string {
    return JSON.stringify({
      config: this.config,
      analysis: this.analysis,
      trainingDataSummary: this.getTrainingDataSummary(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import voice profile
   */
  async importProfile(profileJson: string): Promise<void> {
    const profile = JSON.parse(profileJson);

    if (profile.analysis) {
      this.analysis = {
        ...profile.analysis,
        lastUpdated: new Date(profile.analysis.lastUpdated)
      };
    }

    this.emit('profile:imported');
  }

  // Private methods

  private createDefaultAnalysis(): BrandVoiceAnalysis {
    return {
      brandId: this.config.brandId,
      brandName: this.config.brandName,
      tone: {
        primary: ['professional'],
        secondary: ['informative'],
        scores: { professional: 0.5, informative: 0.5 }
      },
      style: {
        formality: 0.5,
        complexity: 0.5,
        emotionality: 0.3,
        descriptive: 0.5
      },
      vocabulary: {
        frequentWords: [],
        preferredTerms: [],
        avoidedTerms: [],
        industryTerms: [],
        brandSpecificTerms: [],
        averageSentenceLength: 15,
        averageWordLength: 5
      },
      messaging: {
        keyPhrases: [],
        callToActionStyles: [],
        openingPatterns: [],
        closingPatterns: [],
        transitionWords: []
      },
      personality: {
        traits: ['trustworthy', 'helpful'],
        archetypes: ['expert'],
        values: [],
        differentiators: []
      },
      guidelines: [],
      confidence: 0.3,
      examplesAnalyzed: 0,
      lastUpdated: new Date(),
      version: 1
    };
  }

  private prioritizeExamples(examples: BrandVoiceTrainingData[]): BrandVoiceTrainingData[] {
    // Sort by engagement score (if available) and recency
    return examples
      .sort((a, b) => {
        const scoreA = a.metadata?.engagementScore || 0.5;
        const scoreB = b.metadata?.engagementScore || 0.5;
        return scoreB - scoreA;
      })
      .slice(0, this.config.maxExamplesStored);
  }

  private analyzeTone(contents: string[]): ToneAnalysis {
    const toneKeywords: Record<string, string[]> = {
      professional: ['expertise', 'solutions', 'strategic', 'industry', 'best practices'],
      casual: ['hey', 'awesome', 'cool', 'fun', 'love'],
      friendly: ['we\'re', 'you\'re', 'together', 'help', 'support'],
      authoritative: ['must', 'should', 'critical', 'essential', 'proven'],
      inspirational: ['transform', 'achieve', 'unlock', 'empower', 'success'],
      humorous: ['joke', 'funny', 'laugh', 'haha', 'amusing'],
      empathetic: ['understand', 'feel', 'challenging', 'support', 'care'],
      innovative: ['cutting-edge', 'breakthrough', 'revolutionary', 'pioneering', 'future']
    };

    const scores: Record<string, number> = {};
    const allText = contents.join(' ').toLowerCase();
    const wordCount = allText.split(/\s+/).length;

    for (const [tone, keywords] of Object.entries(toneKeywords)) {
      let matchCount = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(keyword, 'gi');
        const matches = allText.match(regex);
        matchCount += matches?.length || 0;
      }
      scores[tone] = Math.min(matchCount / (wordCount / 100), 1);
    }

    const sortedTones = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primary = sortedTones.slice(0, 2).map(([tone]) => tone);
    const secondary = sortedTones.slice(2, 4).map(([tone]) => tone);

    return { primary, secondary, scores };
  }

  private analyzeStyle(contents: string[]): StyleAnalysis {
    const allText = contents.join(' ');
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim());
    const words = allText.split(/\s+/).filter(w => w);

    // Formality: Check for contractions, casual language
    const contractionCount = (allText.match(/\b(can't|won't|don't|isn't|aren't|we're|you're|they're|it's|i'm)\b/gi) || []).length;
    const formality = Math.max(0, 1 - (contractionCount / (sentences.length || 1)) * 0.5);

    // Complexity: Average sentence length and word length
    const avgSentenceLength = words.length / (sentences.length || 1);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);
    const complexity = Math.min((avgSentenceLength / 30 + avgWordLength / 10) / 2, 1);

    // Emotionality: Exclamation marks, emotional words
    const exclamations = (allText.match(/!/g) || []).length;
    const emotionalWords = (allText.match(/\b(amazing|incredible|terrible|wonderful|excited|love|hate|fantastic|awful)\b/gi) || []).length;
    const emotionality = Math.min((exclamations + emotionalWords) / (sentences.length || 1), 1);

    // Descriptive: Adjectives and adverbs approximation
    const descriptivePatterns = /\b\w+ly\b|\b(beautiful|large|small|great|excellent|perfect|unique|special)\b/gi;
    const descriptiveMatches = allText.match(descriptivePatterns) || [];
    const descriptive = Math.min(descriptiveMatches.length / (sentences.length || 1) * 0.3, 1);

    return {
      formality,
      complexity,
      emotionality,
      descriptive
    };
  }

  private extractVocabulary(contents: string[]): VocabularyProfile {
    const allText = contents.join(' ').toLowerCase();
    const words = allText.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);

    // Word frequency
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Get frequent words with context
    const frequentWords = Object.entries(frequency)
      .filter(([word]) => !this.isStopWord(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word, freq]) => ({
        word,
        frequency: freq,
        contexts: this.findContexts(allText, word)
      }));

    // Industry terms (words with specific patterns)
    const industryTerms = frequentWords
      .filter(({ word }) => this.isIndustryTerm(word))
      .map(({ word }) => word);

    // Calculate averages
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim());
    const avgSentenceLength = words.length / (sentences.length || 1);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);

    return {
      frequentWords,
      preferredTerms: frequentWords.slice(0, 10).map(fw => fw.word),
      avoidedTerms: [],
      industryTerms,
      brandSpecificTerms: [],
      averageSentenceLength: Math.round(avgSentenceLength),
      averageWordLength: Math.round(avgWordLength * 10) / 10
    };
  }

  private identifyMessagingPatterns(contents: string[]): MessagingPatterns {
    const allContent = contents.join('\n\n');

    // Extract opening patterns (first sentences)
    const openings = contents.map(c => {
      const firstSentence = c.split(/[.!?]/)[0];
      return firstSentence?.trim().slice(0, 50) || '';
    }).filter(o => o.length > 10);

    // Extract closing patterns (last sentences)
    const closings = contents.map(c => {
      const sentences = c.split(/[.!?]/).filter(s => s.trim());
      const lastSentence = sentences[sentences.length - 1];
      return lastSentence?.trim().slice(0, 50) || '';
    }).filter(c => c.length > 10);

    // Find CTA patterns
    const ctaPatterns = allContent.match(/\b(click|sign up|subscribe|learn more|get started|contact us|join|discover|try|start)\b[^.!?]*/gi) || [];

    // Find key phrases (repeated multi-word phrases)
    const keyPhrases = this.extractKeyPhrases(allContent);

    // Transition words
    const transitionMatches = allContent.match(/\b(however|moreover|furthermore|additionally|therefore|consequently|meanwhile|similarly)\b/gi) || [];
    const transitionWords = [...new Set(transitionMatches.map(t => t.toLowerCase()))];

    return {
      keyPhrases: keyPhrases.slice(0, 10),
      callToActionStyles: [...new Set(ctaPatterns.slice(0, 5).map(c => c.trim()))],
      openingPatterns: openings.slice(0, 5),
      closingPatterns: closings.slice(0, 5),
      transitionWords
    };
  }

  private buildPersonalityProfile(
    tone: ToneAnalysis,
    style: StyleAnalysis,
    vocabulary: VocabularyProfile
  ): PersonalityProfile {
    const traits: string[] = [];
    const archetypes: string[] = [];
    const values: string[] = [];

    // Derive traits from tone
    if (tone.scores['professional'] > 0.3) traits.push('professional');
    if (tone.scores['friendly'] > 0.3) traits.push('approachable');
    if (tone.scores['authoritative'] > 0.3) traits.push('confident');
    if (tone.scores['innovative'] > 0.3) traits.push('forward-thinking');
    if (tone.scores['empathetic'] > 0.3) traits.push('caring');

    // Derive archetypes
    if (style.formality > 0.6 && tone.scores['authoritative'] > 0.3) {
      archetypes.push('expert');
    }
    if (tone.scores['inspirational'] > 0.3) {
      archetypes.push('visionary');
    }
    if (tone.scores['friendly'] > 0.4 && style.formality < 0.5) {
      archetypes.push('friend');
    }
    if (tone.scores['empathetic'] > 0.3) {
      archetypes.push('caregiver');
    }

    // Derive values from vocabulary
    const valueWords = vocabulary.frequentWords
      .map(fw => fw.word)
      .filter(w => this.isValueWord(w));
    values.push(...valueWords.slice(0, 5));

    return {
      traits: traits.length > 0 ? traits : ['professional', 'helpful'],
      archetypes: archetypes.length > 0 ? archetypes : ['expert'],
      values: values.length > 0 ? values : ['quality', 'innovation'],
      differentiators: []
    };
  }

  private generateGuidelines(
    tone: ToneAnalysis,
    style: StyleAnalysis,
    vocabulary: VocabularyProfile,
    messaging: MessagingPatterns
  ): string[] {
    const guidelines: string[] = [];

    // Tone guidelines
    guidelines.push(`Maintain a ${tone.primary.join(' and ')} tone in all communications`);

    // Style guidelines
    if (style.formality > 0.6) {
      guidelines.push('Use formal language and avoid contractions');
    } else if (style.formality < 0.4) {
      guidelines.push('Feel free to use conversational language and contractions');
    }

    // Sentence length
    guidelines.push(`Keep sentences around ${vocabulary.averageSentenceLength} words for consistency`);

    // Vocabulary
    if (vocabulary.preferredTerms.length > 0) {
      guidelines.push(`Incorporate key terms: ${vocabulary.preferredTerms.slice(0, 5).join(', ')}`);
    }

    // CTAs
    if (messaging.callToActionStyles.length > 0) {
      guidelines.push(`Use action-oriented CTAs similar to: "${messaging.callToActionStyles[0]}"`);
    }

    return guidelines;
  }

  private calculateConfidence(): number {
    const dataPoints = this.trainingData.length;

    // Base confidence on data quantity
    let confidence = Math.min(dataPoints / 20, 0.5);

    // Boost for diverse content types
    const types = new Set(this.trainingData.map(d => d.type));
    confidence += types.size * 0.05;

    // Boost for high-performing examples
    const avgPerformance = this.trainingData
      .filter(d => d.metadata?.engagementScore)
      .reduce((sum, d) => sum + (d.metadata?.engagementScore || 0), 0) / dataPoints;
    confidence += avgPerformance * 0.2;

    return Math.min(confidence, 0.95);
  }

  private calculateToneMatch(content: string): number {
    if (!this.analysis) return 0.5;

    const contentLower = content.toLowerCase();
    let score = 0.5;

    // Check for primary tone keywords presence
    for (const primaryTone of this.analysis.tone.primary) {
      const toneScore = this.analysis.tone.scores[primaryTone] || 0;
      score += toneScore * 0.2;
    }

    return Math.min(score, 1);
  }

  private calculateStyleMatch(content: string): number {
    if (!this.analysis) return 0.5;

    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const words = content.split(/\s+/);

    const avgSentenceLength = words.length / (sentences.length || 1);
    const targetLength = this.analysis.vocabulary.averageSentenceLength;

    const lengthDiff = Math.abs(avgSentenceLength - targetLength) / targetLength;

    return Math.max(0, 1 - lengthDiff);
  }

  private calculateVocabularyMatch(content: string): number {
    if (!this.analysis) return 0.5;

    const contentLower = content.toLowerCase();
    const preferredTerms = this.analysis.vocabulary.preferredTerms;

    let matchCount = 0;
    for (const term of preferredTerms) {
      if (contentLower.includes(term.toLowerCase())) {
        matchCount++;
      }
    }

    return preferredTerms.length > 0
      ? Math.min(matchCount / preferredTerms.length + 0.3, 1)
      : 0.5;
  }

  private generateContentRecommendations(
    content: string,
    toneMatch: number,
    styleMatch: number,
    vocabularyMatch: number
  ): string[] {
    const recommendations: string[] = [];

    if (toneMatch < 0.6 && this.analysis) {
      recommendations.push(`Adjust tone to be more ${this.analysis.tone.primary.join(' and ')}`);
    }

    if (styleMatch < 0.6 && this.analysis) {
      const targetLength = this.analysis.vocabulary.averageSentenceLength;
      recommendations.push(`Aim for sentence length around ${targetLength} words`);
    }

    if (vocabularyMatch < 0.6 && this.analysis) {
      const terms = this.analysis.vocabulary.preferredTerms.slice(0, 3).join(', ');
      recommendations.push(`Consider incorporating brand terms like: ${terms}`);
    }

    return recommendations;
  }

  private identifyHighlights(content: string): ContentAnalysisResult['highlights'] {
    const highlights: ContentAnalysisResult['highlights'] = [];

    if (this.analysis) {
      // Highlight preferred terms found
      for (const term of this.analysis.vocabulary.preferredTerms) {
        if (content.toLowerCase().includes(term.toLowerCase())) {
          highlights.push({
            text: term,
            type: 'positive'
          });
        }
      }

      // Highlight avoided terms found
      for (const term of this.analysis.vocabulary.avoidedTerms) {
        if (content.toLowerCase().includes(term.toLowerCase())) {
          highlights.push({
            text: term,
            type: 'negative'
          });
        }
      }
    }

    return highlights.slice(0, 10);
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'that', 'this', 'with', 'from', 'your', 'have', 'been',
      'will', 'they', 'their', 'what', 'which', 'when', 'where', 'about',
      'into', 'more', 'some', 'such', 'only', 'other', 'also', 'just',
      'than', 'then', 'could', 'would', 'should', 'these', 'those', 'being'
    ]);
    return stopWords.has(word);
  }

  private isIndustryTerm(word: string): boolean {
    // Check for common industry term patterns
    return word.length > 6 || /^[A-Z]/.test(word);
  }

  private isValueWord(word: string): boolean {
    const valueWords = new Set([
      'quality', 'innovation', 'trust', 'excellence', 'integrity',
      'sustainability', 'transparency', 'collaboration', 'growth',
      'impact', 'community', 'success', 'leadership', 'creativity'
    ]);
    return valueWords.has(word.toLowerCase());
  }

  private findContexts(text: string, word: string): string[] {
    const contexts: string[] = [];
    const regex = new RegExp(`[^.]*\\b${word}\\b[^.]*\\.`, 'gi');
    const matches = text.match(regex) || [];
    return matches.slice(0, 3).map(m => m.trim().slice(0, 100));
  }

  private extractKeyPhrases(text: string): string[] {
    // Simple n-gram extraction for key phrases
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const bigramCount: Record<string, number> = {};

    for (let i = 0; i < words.length - 1; i++) {
      if (!this.isStopWord(words[i]) && !this.isStopWord(words[i + 1])) {
        const bigram = `${words[i]} ${words[i + 1]}`;
        bigramCount[bigram] = (bigramCount[bigram] || 0) + 1;
      }
    }

    return Object.entries(bigramCount)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([phrase]) => phrase);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): BrandVoiceConfig {
    return { ...this.config };
  }
}

/**
 * Factory function
 */
export function createBrandVoiceService(config: Partial<BrandVoiceConfig>): BrandVoiceService {
  return new BrandVoiceService(config);
}
