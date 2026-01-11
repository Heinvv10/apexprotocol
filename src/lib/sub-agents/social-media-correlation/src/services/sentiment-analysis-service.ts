/**
 * SentimentAnalysisService
 * Multi-dimensional sentiment scoring and emotion classification
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Emotion types
export type EmotionType = 'joy' | 'anger' | 'sadness' | 'fear' | 'surprise' | 'disgust' | 'trust' | 'anticipation';

// Sentiment types
export type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';

// Intensity levels
export type IntensityLevel = 'low' | 'medium' | 'high' | 'extreme';

// Configuration schema
const sentimentConfigSchema = z.object({
  enableEmotionDetection: z.boolean().default(true),
  enableIntensityScoring: z.boolean().default(true),
  confidenceThreshold: z.number().min(0).max(1).default(0.6),
  maxTextLength: z.number().min(100).default(10000),
  cacheTTLMs: z.number().min(0).default(300000), // 5 minutes
  negativeAlertThreshold: z.number().min(-1).max(0).default(-0.6),
});

export type SentimentConfig = z.infer<typeof sentimentConfigSchema>;

// Sentiment result
export interface SentimentResult {
  sentiment: Sentiment;
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  aspects?: AspectSentiment[];
  cached?: boolean;
  error?: string;
}

// Emotion result
export interface EmotionResult {
  emotions: Emotion[];
  dominantEmotion: EmotionType | null;
}

// Individual emotion
export interface Emotion {
  type: EmotionType;
  intensity: number;
  confidence: number;
}

// Aspect-level sentiment
export interface AspectSentiment {
  aspect: string;
  sentiment: Sentiment;
  score: number;
  category: string;
}

// Intensity measurement
export interface IntensityResult {
  intensity: number;
  level: IntensityLevel;
  intensifiers: string[];
}

// Contextual sentiment options
export interface ContextualOptions {
  detectSarcasm?: boolean;
  domain?: string;
  platform?: string;
}

// Contextual sentiment result
export interface ContextualSentimentResult extends SentimentResult {
  sarcasmDetected?: boolean;
  adjustedSentiment?: Sentiment;
}

// Sentiment trend
export interface SentimentTrend {
  direction: 'improving' | 'declining' | 'stable';
  changeRate: number;
  volatility: number;
  shiftDetected: boolean;
  shiftPoint?: Date;
  dataPoints: Array<{ score: number; timestamp: Date }>;
}

// Comparison result
export interface ComparisonResult {
  brandA: { averageScore: number; sentiment: Sentiment };
  brandB: { averageScore: number; sentiment: Sentiment };
  difference: number;
}

// Ranking result
export interface RankingResult {
  brand: string;
  averageScore: number;
  sentiment: Sentiment;
  rank: number;
}

// Batch result with stats
export interface BatchResultWithStats {
  results: SentimentResult[];
  stats: {
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    mixedCount: number;
    averageScore: number;
    averageConfidence: number;
  };
}

// Word lists for sentiment analysis
const POSITIVE_WORDS = new Set([
  'love', 'great', 'amazing', 'wonderful', 'excellent', 'fantastic', 'awesome',
  'good', 'nice', 'beautiful', 'perfect', 'best', 'happy', 'excited', 'brilliant',
  'superb', 'outstanding', 'incredible', 'like', 'enjoy', 'pleased', 'delighted',
  'fire', 'sick', 'lit', 'dope', 'cool', 'stellar', 'remarkable', 'improving'
]);

const NEGATIVE_WORDS = new Set([
  'hate', 'terrible', 'awful', 'bad', 'worst', 'horrible', 'disgusting', 'poor',
  'disappointing', 'frustrating', 'angry', 'furious', 'sad', 'disappointed',
  'revolting', 'pathetic', 'useless', 'broken', 'refund', 'delay', 'slow'
]);

const INTENSIFIERS = new Set([
  'absolutely', 'extremely', 'very', 'really', 'incredibly', 'totally', 'completely',
  'utterly', 'highly', 'deeply', 'so', 'quite', 'especially', 'particularly'
]);

const NEGATION_WORDS = new Set([
  'not', 'never', 'no', 'none', "don't", "doesn't", "didn't", "won't", "wouldn't",
  "couldn't", "shouldn't", "can't", "isn't", "aren't", "wasn't", "weren't"
]);

// Emotion keywords
const EMOTION_KEYWORDS: Record<EmotionType, string[]> = {
  joy: ['happy', 'excited', 'love', 'amazing', 'wonderful', 'delighted', 'thrilled', 'joy', 'pleased'],
  anger: ['furious', 'angry', 'hate', 'rage', 'mad', 'outraged', 'infuriated', 'livid'],
  sadness: ['sad', 'disappointed', 'depressed', 'unhappy', 'sorry', 'heartbroken', 'miserable'],
  fear: ['scared', 'worried', 'afraid', 'anxious', 'terrified', 'nervous', 'frightened'],
  surprise: ['wow', 'surprised', 'shocked', 'amazed', 'astonished', 'stunned', "can't believe"],
  disgust: ['disgusting', 'revolting', 'gross', 'nasty', 'repulsive', 'sickening'],
  trust: ['trust', 'reliable', 'dependable', 'honest', 'faithful', 'confident', 'secure'],
  anticipation: ['excited', "can't wait", 'looking forward', 'anticipate', 'eager', 'hopeful']
};

// Aspect categories - ordered by priority for matching
const ASPECT_CATEGORIES: Record<string, string[]> = {
  product: ['product quality', 'quality', 'product', 'design', 'features', 'durability', 'material'],
  price: ['price point', 'price', 'cost', 'value', 'expensive', 'cheap', 'affordable', 'pricing'],
  service: ['customer service', 'service', 'customer', 'support', 'help', 'staff', 'team'],
  delivery: ['shipping', 'delivery', 'arrived', 'tracking'],
  experience: ['experience', 'easy', 'difficult', 'simple', 'complicated']
};

// Positive and negative emojis
const POSITIVE_EMOJIS = ['😍', '🎉', '❤️', '💕', '👍', '🔥', '⭐', '🌟', '😊', '😃', '🥰', '💯'];
const NEGATIVE_EMOJIS = ['😡', '😤', '😢', '💔', '👎', '😠', '🤬', '😞', '😭', '🙄'];

/**
 * SentimentAnalysisService
 * Multi-dimensional sentiment analysis with emotion detection
 */
export class SentimentAnalysisService extends EventEmitter {
  private config: SentimentConfig;
  private cache: Map<string, { result: SentimentResult; timestamp: number }> = new Map();
  private isShutdown: boolean = false;

  constructor(config: Partial<SentimentConfig> = {}) {
    super();
    this.config = sentimentConfigSchema.parse(config);
  }

  getConfig(): SentimentConfig {
    return { ...this.config };
  }

  // Basic sentiment analysis
  analyzeSentiment(text: string): SentimentResult {
    // Check cache
    const cached = this.getFromCache(text);
    if (cached) {
      return { ...cached, cached: true };
    }

    const lowerText = text.toLowerCase();
    const words = this.tokenize(lowerText);

    let positiveScore = 0;
    let negativeScore = 0;
    let hasNegation = false;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const prevWord = words[i - 1];

      // Check for negation
      if (NEGATION_WORDS.has(prevWord || '')) {
        hasNegation = true;
      }

      // Check for intensifiers
      const intensifierBoost = INTENSIFIERS.has(prevWord || '') ? 0.5 : 0;

      if (POSITIVE_WORDS.has(word)) {
        if (hasNegation) {
          negativeScore += 1 + intensifierBoost;
          hasNegation = false;
        } else {
          positiveScore += 1 + intensifierBoost;
        }
      } else if (NEGATIVE_WORDS.has(word)) {
        if (hasNegation) {
          positiveScore += 0.5; // Double negative = weak positive
          hasNegation = false;
        } else {
          negativeScore += 1 + intensifierBoost;
        }
      }
    }

    // Check for capitalization (emphasis)
    const capsWords = text.match(/\b[A-Z]{2,}\b/g) || [];
    for (const capsWord of capsWords) {
      const lowerCaps = capsWord.toLowerCase();
      if (POSITIVE_WORDS.has(lowerCaps)) positiveScore += 0.5;
      if (NEGATIVE_WORDS.has(lowerCaps)) negativeScore += 0.5;
    }

    // Count exclamation marks
    const exclamations = (text.match(/!/g) || []).length;
    if (positiveScore > negativeScore) positiveScore += exclamations * 0.2;
    else if (negativeScore > positiveScore) negativeScore += exclamations * 0.2;

    // Calculate raw score
    const total = positiveScore + negativeScore;
    let score = total > 0 ? (positiveScore - negativeScore) / Math.max(positiveScore, negativeScore) : 0;

    // Apply intensity scaling - more sentiment words = more extreme score
    const intensityScale = Math.min(1, total / 3);
    score = score * (0.5 + intensityScale * 0.5);

    // Clamp to -1 to 1 range
    score = Math.max(-1, Math.min(1, score));

    // Determine sentiment
    let sentiment: Sentiment;
    let aspects: AspectSentiment[] | undefined;

    if (positiveScore > 0 && negativeScore > 0 && Math.abs(positiveScore - negativeScore) < Math.max(positiveScore, negativeScore) * 0.8) {
      sentiment = 'mixed';
      // For mixed sentiment, also extract aspects
      aspects = this.analyzeAspectSentiment(text).aspects;
    } else if (score > 0.3) {
      sentiment = 'positive';
    } else if (score < -0.3) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    // Calculate confidence
    const confidence = Math.min(0.95, (total / words.length) * 2 + 0.4);

    const result: SentimentResult = {
      sentiment,
      score,
      confidence,
      aspects,
      cached: false
    };

    // Emit events
    this.emit('sentiment:analyzed', result);
    if (score < this.config.negativeAlertThreshold) {
      this.emit('sentiment:negative-alert', { text, result });
    }

    // Cache result
    this.setCache(text, result);

    return result;
  }

  // Emotion detection
  analyzeEmotions(text: string): EmotionResult {
    const lowerText = text.toLowerCase();
    const emotions: Emotion[] = [];

    // Check for intensifiers and caps in the entire text
    const hasIntensifier = Array.from(INTENSIFIERS).some(i => lowerText.includes(i));
    const hasCaps = /[A-Z]{2,}/.test(text);
    const hasExclamation = text.includes('!');
    const globalBoost = (hasIntensifier ? 0.3 : 0) + (hasCaps ? 0.2 : 0) + (hasExclamation ? 0.1 : 0);

    for (const [emotionType, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      let matches = 0;
      let totalIntensity = 0;

      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          matches++;
          // Check for intensifiers before the keyword
          const intensified = INTENSIFIERS.has(this.getWordBefore(lowerText, keyword));
          totalIntensity += intensified ? 1.5 : 1;
        }
      }

      if (matches > 0) {
        // Base intensity + global boost, normalized
        const baseIntensity = Math.min(1, (totalIntensity / keywords.length) * 3 + globalBoost);
        emotions.push({
          type: emotionType as EmotionType,
          intensity: baseIntensity,
          confidence: Math.min(0.95, matches / keywords.length * 2 + 0.3)
        });
      }
    }

    // Sort by intensity
    emotions.sort((a, b) => b.intensity - a.intensity);

    return {
      emotions,
      dominantEmotion: emotions.length > 0 ? emotions[0].type : null
    };
  }

  // Aspect-based sentiment
  analyzeAspectSentiment(text: string): { aspects: AspectSentiment[] } {
    const lowerText = text.toLowerCase();
    const aspects: AspectSentiment[] = [];

    // Split text into clauses (separated by , ; but and or)
    const clauses = text.split(/[,;]|\s+but\s+|\s+and\s+|\s+or\s+/i);

    for (const [category, keywords] of Object.entries(ASPECT_CATEGORIES)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          // Find the clause containing this aspect
          const clauseWithAspect = clauses.find(c => c.toLowerCase().includes(keyword));
          if (clauseWithAspect) {
            const sentimentResult = this.analyzeSentiment(clauseWithAspect);

            aspects.push({
              aspect: keyword,
              sentiment: sentimentResult.sentiment,
              score: sentimentResult.score,
              category
            });
          }
          break; // One aspect per category
        }
      }
    }

    return { aspects };
  }

  // Intensity measurement
  measureIntensity(text: string): IntensityResult {
    const lowerText = text.toLowerCase();
    const words = this.tokenize(lowerText);
    const foundIntensifiers: string[] = [];

    let intensityScore = 0;

    for (const word of words) {
      if (INTENSIFIERS.has(word)) {
        foundIntensifiers.push(word);
        intensityScore += 1;
      }
    }

    // Check for capitalization
    const capsWords = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
    intensityScore += capsWords * 0.5;

    // Check for exclamation marks
    const exclamations = (text.match(/!/g) || []).length;
    intensityScore += exclamations * 0.3;

    // Normalize to 0-1
    const intensity = Math.min(1, intensityScore / 5);

    // Determine level
    let level: IntensityLevel;
    if (intensity < 0.25) level = 'low';
    else if (intensity < 0.5) level = 'medium';
    else if (intensity < 0.75) level = 'high';
    else level = 'extreme';

    return {
      intensity,
      level,
      intensifiers: foundIntensifiers
    };
  }

  // Contextual sentiment analysis
  analyzeContextualSentiment(text: string, options: ContextualOptions): ContextualSentimentResult {
    const lowerText = text.toLowerCase();

    // Detect sarcasm
    let sarcasmDetected = false;
    if (options.detectSarcasm) {
      sarcasmDetected = this.detectSarcasm(lowerText);
    }

    // Check for emojis
    const hasPositiveEmoji = POSITIVE_EMOJIS.some(e => text.includes(e));
    const hasNegativeEmoji = NEGATIVE_EMOJIS.some(e => text.includes(e));

    // Adjust for domain/platform context
    let contextAdjustedText = text;
    if (options.domain === 'social-media' || options.platform === 'twitter') {
      // Convert slang to sentiment
      contextAdjustedText = contextAdjustedText
        .replace(/\bsick\b/gi, 'amazing')
        .replace(/\bfire\b/gi, 'great')
        .replace(/\blit\b/gi, 'awesome')
        .replace(/\bdope\b/gi, 'excellent');
    }

    const baseResult = this.analyzeSentiment(contextAdjustedText);

    // Adjust for emojis
    let adjustedScore = baseResult.score;
    if (hasPositiveEmoji) adjustedScore += 0.2;
    if (hasNegativeEmoji) adjustedScore -= 0.2;
    adjustedScore = Math.max(-1, Math.min(1, adjustedScore));

    // Determine adjusted sentiment
    let adjustedSentiment: Sentiment;

    // For sarcasm, always flip to negative (sarcasm with positive words = actually negative)
    if (sarcasmDetected) {
      adjustedSentiment = 'negative';
      adjustedScore = -Math.abs(adjustedScore) || -0.5; // Force negative score
    } else {
      // Recalculate sentiment based on emoji-adjusted score
      if (adjustedScore > 0.3) adjustedSentiment = 'positive';
      else if (adjustedScore < -0.3) adjustedSentiment = 'negative';
      else adjustedSentiment = 'neutral';
    }

    return {
      ...baseResult,
      sentiment: adjustedSentiment,
      score: adjustedScore,
      sarcasmDetected,
      adjustedSentiment
    };
  }

  // Batch analysis
  async analyzeBatch(texts: string[]): Promise<SentimentResult[]> {
    return texts.map(text => {
      if (!text || text.trim() === '') {
        return {
          sentiment: 'neutral' as Sentiment,
          score: 0,
          confidence: 0,
          error: 'Empty text provided'
        };
      }
      return this.analyzeSentiment(text);
    });
  }

  async analyzeBatchWithStats(texts: string[]): Promise<BatchResultWithStats> {
    const results = await this.analyzeBatch(texts);

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let mixedCount = 0;
    let totalScore = 0;
    let totalConfidence = 0;

    for (const result of results) {
      if (!result.error) {
        totalScore += result.score;
        totalConfidence += result.confidence;

        switch (result.sentiment) {
          case 'positive': positiveCount++; break;
          case 'negative': negativeCount++; break;
          case 'neutral': neutralCount++; break;
          case 'mixed': mixedCount++; break;
        }
      }
    }

    const validCount = results.filter(r => !r.error).length;

    return {
      results,
      stats: {
        positiveCount,
        negativeCount,
        neutralCount,
        mixedCount,
        averageScore: validCount > 0 ? totalScore / validCount : 0,
        averageConfidence: validCount > 0 ? totalConfidence / validCount : 0
      }
    };
  }

  // Sentiment trends
  calculateSentimentTrend(dataPoints: Array<{ text: string; timestamp: Date }>): SentimentTrend {
    if (dataPoints.length < 2) {
      return {
        direction: 'stable',
        changeRate: 0,
        volatility: 0,
        shiftDetected: false,
        dataPoints: []
      };
    }

    // Sort by timestamp
    const sorted = [...dataPoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Analyze each point
    const scores = sorted.map(dp => ({
      score: this.analyzeSentiment(dp.text).score,
      timestamp: dp.timestamp
    }));

    // Calculate average change rate
    let totalChange = 0;
    let shiftDetected = false;
    let shiftPoint: Date | undefined;
    const differences: number[] = [];

    for (let i = 1; i < scores.length; i++) {
      const diff = scores[i].score - scores[i - 1].score;
      totalChange += diff;
      differences.push(Math.abs(diff));

      // Detect significant shift (more than 0.8 change)
      if (Math.abs(diff) > 0.8 && !shiftDetected) {
        shiftDetected = true;
        shiftPoint = scores[i].timestamp;
      }
    }

    const changeRate = totalChange / (scores.length - 1);

    // Calculate volatility (average of absolute differences)
    // High volatility means big swings between consecutive points
    const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    // Normalize by dividing by 2 (max possible swing from -1 to 1)
    const volatility = Math.min(1, avgDiff);

    // Determine direction
    let direction: 'improving' | 'declining' | 'stable';
    if (changeRate > 0.1) direction = 'improving';
    else if (changeRate < -0.1) direction = 'declining';
    else direction = 'stable';

    // Emit shift event if detected
    if (shiftDetected) {
      this.emit('sentiment:shift', { shiftPoint, changeRate });
    }

    return {
      direction,
      changeRate,
      volatility,
      shiftDetected,
      shiftPoint,
      dataPoints: scores
    };
  }

  // Comparative analysis
  compareSentiment(textsA: string[], textsB: string[]): ComparisonResult {
    const scoresA = textsA.map(t => this.analyzeSentiment(t).score);
    const scoresB = textsB.map(t => this.analyzeSentiment(t).score);

    const avgA = scoresA.reduce((a, b) => a + b, 0) / scoresA.length;
    const avgB = scoresB.reduce((a, b) => a + b, 0) / scoresB.length;

    const getSentiment = (score: number): Sentiment => {
      if (score > 0.3) return 'positive';
      if (score < -0.3) return 'negative';
      return 'neutral';
    };

    return {
      brandA: { averageScore: avgA, sentiment: getSentiment(avgA) },
      brandB: { averageScore: avgB, sentiment: getSentiment(avgB) },
      difference: avgA - avgB
    };
  }

  rankBySentiment(brandsData: Record<string, string[]>): RankingResult[] {
    const rankings: RankingResult[] = [];

    for (const [brand, texts] of Object.entries(brandsData)) {
      const scores = texts.map(t => this.analyzeSentiment(t).score);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      const sentiment: Sentiment = avgScore > 0.3 ? 'positive' : avgScore < -0.3 ? 'negative' : 'neutral';

      rankings.push({
        brand,
        averageScore: avgScore,
        sentiment,
        rank: 0
      });
    }

    // Sort by average score descending
    rankings.sort((a, b) => b.averageScore - a.averageScore);

    // Assign ranks
    rankings.forEach((r, i) => r.rank = i + 1);

    return rankings;
  }

  // Helper methods
  private tokenize(text: string): string[] {
    // Remove punctuation and split into words
    return text.toLowerCase()
      .replace(/[.,!?;:'"()]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  private getWordBefore(text: string, word: string): string {
    const index = text.indexOf(word);
    if (index <= 0) return '';

    const before = text.substring(0, index).trim();
    const words = before.split(/\s+/);
    return words[words.length - 1] || '';
  }

  private getContextAround(text: string, keyword: string): string {
    const index = text.indexOf(keyword);
    if (index === -1) return text;

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + keyword.length + 50);

    return text.substring(start, end);
  }

  private detectSarcasm(text: string): boolean {
    // Simple sarcasm detection heuristics
    const sarcasmIndicators = [
      /oh great/i,
      /just what i needed/i,
      /how wonderful/i,
      /yeah right/i,
      /sure thing/i,
      /that's just great/i,
      /another .* just what/i
    ];

    return sarcasmIndicators.some(pattern => pattern.test(text));
  }

  // Cache methods
  private getFromCache(text: string): SentimentResult | null {
    const key = this.hashText(text);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.config.cacheTTLMs) {
      return cached.result;
    }

    return null;
  }

  private setCache(text: string, result: SentimentResult): void {
    const key = this.hashText(text);
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  private hashText(text: string): string {
    // Simple hash for cache key
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  // Lifecycle
  shutdown(): void {
    this.isShutdown = true;
    this.cache.clear();
    this.emit('shutdown');
  }
}

/**
 * Factory function to create SentimentAnalysisService
 */
export function createSentimentAnalysisService(
  config: Partial<SentimentConfig> = {}
): SentimentAnalysisService {
  return new SentimentAnalysisService(config);
}
