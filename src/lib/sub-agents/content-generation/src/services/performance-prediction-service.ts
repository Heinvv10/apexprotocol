import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Performance Prediction Service
 *
 * Predicts content performance across platforms, generates A/B test
 * suggestions, and provides optimization recommendations.
 */

// Platform and Content Type definitions
export type Platform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'medium' | 'substack' | 'website';
export type ContentType = 'blog_post' | 'social_media' | 'marketing_copy' | 'technical_docs' | 'press_release';
export type ABTestElement = 'title' | 'cta' | 'opening' | 'hashtags';

// Zod Schemas
export const PerformancePredictionConfigSchema = z.object({
  enableABTestSuggestions: z.boolean().default(true),
  maxSuggestions: z.number().default(5),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
  includeHistoricalComparison: z.boolean().default(true)
});

export const ContentAnalysisInputSchema = z.object({
  content: z.string().min(1),
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'medium', 'substack', 'website']),
  contentType: z.enum(['blog_post', 'social_media', 'marketing_copy', 'technical_docs', 'press_release']),
  title: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  callToAction: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  industry: z.string().optional()
});

export type PerformancePredictionConfig = z.infer<typeof PerformancePredictionConfigSchema>;
export type ContentAnalysisInput = z.infer<typeof ContentAnalysisInputSchema>;

// A/B Test Suggestion
export interface ABTestSuggestion {
  element: ABTestElement;
  originalValue: string;
  alternativeValue: string;
  expectedImpact: number; // -100 to 100
  rationale: string;
}

// Engagement Factors
export interface EngagementFactors {
  contentLength: {
    score: number;
    optimal: boolean;
    recommendation?: string;
  };
  hashtagEffectiveness?: {
    score: number;
    count: number;
    quality: 'low' | 'medium' | 'high';
  };
  emotionalAppeal: number;
  ctaStrength?: {
    score: number;
    clarity: 'low' | 'medium' | 'high';
    urgency: 'low' | 'medium' | 'high';
  };
  readability: {
    score: number;
    level: string;
  };
  visualAppeal: number;
}

// Platform Insights
export interface PlatformInsights {
  platform: Platform;
  bestPractices: string[];
  idealPostingTimes: string[];
  audienceExpectations: string[];
  competitiveAdvantages: string[];
}

// Recommendation
export interface Recommendation {
  text: string;
  priority: 'low' | 'medium' | 'high';
  category: 'content' | 'format' | 'timing' | 'engagement' | 'seo';
  expectedImpact: number;
}

// Benchmark Comparison
export interface BenchmarkComparison {
  industryAverage: number;
  percentile: number;
  topPerformers: number;
  comparison: 'below' | 'average' | 'above' | 'excellent';
}

// Performance Prediction
export interface PerformancePrediction {
  engagementProbability: number;
  visibilityScore: number;
  viralPotential: number;
  conversionLikelihood: number;
  platformOptimizationScore: number;
  engagementFactors: EngagementFactors;
  timingRecommendations: string[];
  abTestSuggestions?: ABTestSuggestion[];
  platformInsights: PlatformInsights;
  recommendations: Recommendation[];
  benchmarkComparison: BenchmarkComparison;
  confidence: number;
  lowConfidenceWarning?: string;
}

// Prediction Result
export interface PredictionResult {
  success: boolean;
  prediction?: PerformancePrediction;
  error?: string;
  processingTime: number;
  metadata: {
    analyzedAt: Date;
    platform: Platform;
    contentType: ContentType;
    contentLength: number;
  };
}

/**
 * Performance Prediction Service
 */
export class PerformancePredictionService extends EventEmitter {
  private config: PerformancePredictionConfig;

  // Platform character limits
  private platformLimits: Record<Platform, number> = {
    twitter: 280,
    linkedin: 3000,
    facebook: 63206,
    instagram: 2200,
    medium: 100000,
    substack: 100000,
    website: 100000
  };

  // Ideal post lengths (characters)
  private idealPostLengths: Record<Platform, { min: number; max: number }> = {
    twitter: { min: 71, max: 100 },
    linkedin: { min: 150, max: 1300 },
    facebook: { min: 40, max: 80 },
    instagram: { min: 138, max: 150 },
    medium: { min: 1600, max: 2400 },
    substack: { min: 1600, max: 2400 },
    website: { min: 1000, max: 3000 }
  };

  // Best posting times by platform
  private bestPostingTimes: Record<Platform, string[]> = {
    twitter: ['9:00 AM', '12:00 PM', '5:00 PM'],
    linkedin: ['7:00 AM', '12:00 PM', '5:00 PM'],
    facebook: ['1:00 PM', '4:00 PM', '8:00 PM'],
    instagram: ['11:00 AM', '1:00 PM', '7:00 PM'],
    medium: ['8:00 AM', '11:00 AM', '2:00 PM'],
    substack: ['8:00 AM', '11:00 AM', '2:00 PM'],
    website: ['9:00 AM', '2:00 PM', '7:00 PM']
  };

  constructor(config: Partial<PerformancePredictionConfig> = {}) {
    super();
    this.config = PerformancePredictionConfigSchema.parse(config);
  }

  /**
   * Predict content performance
   */
  async predict(input: ContentAnalysisInput): Promise<PredictionResult> {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedInput = ContentAnalysisInputSchema.safeParse(input);
      if (!validatedInput.success) {
        this.emit('prediction:error', { error: validatedInput.error.message });
        return this.createErrorResult(input, validatedInput.error.message, startTime);
      }

      const { content, platform, contentType, title, hashtags, callToAction, keywords, industry } = validatedInput.data;

      this.emit('prediction:start', { platform, contentType, contentLength: content.length });

      // Analyze engagement factors
      const engagementFactors = this.analyzeEngagementFactors(content, platform, hashtags, callToAction);

      // Calculate scores
      const engagementProbability = this.calculateEngagementProbability(content, platform, engagementFactors);
      const visibilityScore = this.calculateVisibilityScore(content, platform, keywords || []);
      const viralPotential = this.calculateViralPotential(content, platform, engagementFactors);
      const conversionLikelihood = this.calculateConversionLikelihood(content, callToAction);
      const platformOptimizationScore = this.calculatePlatformOptimization(content, platform);

      // Generate timing recommendations
      const timingRecommendations = this.generateTimingRecommendations(platform);

      // Generate A/B test suggestions if enabled
      let abTestSuggestions: ABTestSuggestion[] | undefined;
      if (this.config.enableABTestSuggestions) {
        abTestSuggestions = this.generateABTestSuggestions(content, title, callToAction);
      }

      // Get platform insights
      const platformInsights = this.getPlatformInsights(platform);

      // Generate recommendations
      const recommendations = this.generateRecommendations(content, platform, engagementFactors);

      // Get benchmark comparison
      const benchmarkComparison = this.getBenchmarkComparison(engagementProbability, industry);

      // Calculate confidence
      const confidence = this.calculateConfidence(content, platform);
      const lowConfidenceWarning = confidence < this.config.confidenceThreshold * 100
        ? `Prediction confidence is below threshold (${confidence.toFixed(1)}% < ${this.config.confidenceThreshold * 100}%)`
        : undefined;

      const prediction: PerformancePrediction = {
        engagementProbability,
        visibilityScore,
        viralPotential,
        conversionLikelihood,
        platformOptimizationScore,
        engagementFactors,
        timingRecommendations,
        abTestSuggestions,
        platformInsights,
        recommendations,
        benchmarkComparison,
        confidence,
        lowConfidenceWarning
      };

      this.emit('prediction:complete', { platform, engagementProbability });

      return {
        success: true,
        prediction,
        processingTime: Date.now() - startTime,
        metadata: {
          analyzedAt: new Date(),
          platform,
          contentType,
          contentLength: content.length
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('prediction:error', { error: errorMessage });
      return this.createErrorResult(input, errorMessage, startTime);
    }
  }

  /**
   * Predict performance for multiple content pieces
   */
  async predictBatch(inputs: ContentAnalysisInput[]): Promise<PredictionResult[]> {
    const results: PredictionResult[] = [];

    for (const input of inputs) {
      const result = await this.predict(input);
      results.push(result);
    }

    return results;
  }

  // Private methods

  private createErrorResult(
    input: ContentAnalysisInput,
    error: string,
    startTime: number
  ): PredictionResult {
    return {
      success: false,
      error,
      processingTime: Date.now() - startTime,
      metadata: {
        analyzedAt: new Date(),
        platform: input.platform || 'twitter',
        contentType: input.contentType || 'social_media',
        contentLength: input.content?.length || 0
      }
    };
  }

  private analyzeEngagementFactors(
    content: string,
    platform: Platform,
    hashtags?: string[],
    callToAction?: string
  ): EngagementFactors {
    const contentLength = content.length;
    const ideal = this.idealPostLengths[platform];

    // Content length analysis
    const lengthScore = this.calculateLengthScore(contentLength, ideal.min, ideal.max);
    const isOptimal = contentLength >= ideal.min && contentLength <= ideal.max;

    // Hashtag effectiveness
    let hashtagEffectiveness;
    if (hashtags && hashtags.length > 0) {
      const hashtagScore = Math.min(100, hashtags.length * 15);
      hashtagEffectiveness = {
        score: hashtagScore,
        count: hashtags.length,
        quality: hashtagScore > 70 ? 'high' as const : hashtagScore > 40 ? 'medium' as const : 'low' as const
      };
    }

    // Emotional appeal (based on exclamation marks, emojis, emotional words)
    const emotionalAppeal = this.calculateEmotionalAppeal(content);

    // CTA strength
    let ctaStrength;
    if (callToAction) {
      const ctaScore = this.calculateCTAScore(callToAction);
      ctaStrength = {
        score: ctaScore,
        clarity: ctaScore > 70 ? 'high' as const : ctaScore > 40 ? 'medium' as const : 'low' as const,
        urgency: callToAction.match(/now|today|limited|urgent/i) ? 'high' as const : 'medium' as const
      };
    }

    // Readability
    const readability = this.calculateReadability(content);

    // Visual appeal (based on formatting, emojis, bullet points)
    const visualAppeal = this.calculateVisualAppeal(content);

    return {
      contentLength: {
        score: lengthScore,
        optimal: isOptimal,
        recommendation: isOptimal ? undefined : `Ideal length for ${platform} is ${ideal.min}-${ideal.max} characters`
      },
      hashtagEffectiveness,
      emotionalAppeal,
      ctaStrength,
      readability,
      visualAppeal
    };
  }

  private calculateLengthScore(actual: number, min: number, max: number): number {
    if (actual >= min && actual <= max) {
      return 100;
    }
    if (actual < min) {
      return Math.max(0, 100 - ((min - actual) / min) * 100);
    }
    return Math.max(0, 100 - ((actual - max) / max) * 50);
  }

  private calculateEmotionalAppeal(content: string): number {
    let score = 50; // Base score

    // Exclamation marks (moderate impact)
    const exclamations = (content.match(/!/g) || []).length;
    score += Math.min(exclamations * 5, 15);

    // Emojis (positive impact)
    const emojis = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    score += Math.min(emojis * 3, 15);

    // Emotional words
    const emotionalWords = ['amazing', 'incredible', 'exciting', 'love', 'thrilled', 'fantastic', 'awesome', 'brilliant'];
    const emotionalCount = emotionalWords.filter(word => content.toLowerCase().includes(word)).length;
    score += emotionalCount * 5;

    // Questions (engagement driver)
    const questions = (content.match(/\?/g) || []).length;
    score += Math.min(questions * 5, 10);

    return Math.min(100, score);
  }

  private calculateCTAScore(cta: string): number {
    let score = 50;

    // Action verbs
    const actionVerbs = ['click', 'sign up', 'get', 'download', 'try', 'start', 'join', 'discover', 'learn', 'buy'];
    if (actionVerbs.some(verb => cta.toLowerCase().includes(verb))) {
      score += 20;
    }

    // Urgency words
    const urgencyWords = ['now', 'today', 'limited', 'exclusive', 'free', 'instant'];
    if (urgencyWords.some(word => cta.toLowerCase().includes(word))) {
      score += 15;
    }

    // Length (shorter is better for CTA)
    if (cta.length <= 20) {
      score += 10;
    } else if (cta.length > 50) {
      score -= 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateReadability(content: string): { score: number; level: string } {
    const words = content.split(/\s+/).length;
    const sentences = (content.match(/[.!?]+/g) || []).length || 1;
    const avgWordsPerSentence = words / sentences;

    // Simplified readability scoring
    let score: number;
    let level: string;

    if (avgWordsPerSentence <= 15) {
      score = 90;
      level = 'Easy';
    } else if (avgWordsPerSentence <= 20) {
      score = 75;
      level = 'Moderate';
    } else if (avgWordsPerSentence <= 25) {
      score = 60;
      level = 'Somewhat Difficult';
    } else {
      score = 40;
      level = 'Difficult';
    }

    return { score, level };
  }

  private calculateVisualAppeal(content: string): number {
    let score = 50;

    // Line breaks (structure)
    const lineBreaks = (content.match(/\n/g) || []).length;
    score += Math.min(lineBreaks * 3, 15);

    // Bullet points
    const bullets = (content.match(/^[-•*]/gm) || []).length;
    score += Math.min(bullets * 5, 15);

    // Emojis as visual elements
    const emojis = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]/gu) || []).length;
    score += Math.min(emojis * 2, 10);

    // Headers (## or **bold**)
    const headers = (content.match(/^#+\s|^\*\*[^*]+\*\*/gm) || []).length;
    score += Math.min(headers * 5, 10);

    return Math.min(100, score);
  }

  private calculateEngagementProbability(
    content: string,
    platform: Platform,
    factors: EngagementFactors
  ): number {
    // Weighted average of factors
    const weights = {
      contentLength: 0.25,
      emotionalAppeal: 0.20,
      readability: 0.20,
      visualAppeal: 0.15,
      hashtagEffectiveness: 0.10,
      ctaStrength: 0.10
    };

    let score = 0;
    score += factors.contentLength.score * weights.contentLength;
    score += factors.emotionalAppeal * weights.emotionalAppeal;
    score += factors.readability.score * weights.readability;
    score += factors.visualAppeal * weights.visualAppeal;

    if (factors.hashtagEffectiveness) {
      score += factors.hashtagEffectiveness.score * weights.hashtagEffectiveness;
    } else {
      score += 50 * weights.hashtagEffectiveness; // Neutral if no hashtags
    }

    if (factors.ctaStrength) {
      score += factors.ctaStrength.score * weights.ctaStrength;
    } else {
      score += 50 * weights.ctaStrength; // Neutral if no CTA
    }

    return Math.round(score);
  }

  private calculateVisibilityScore(content: string, platform: Platform, keywords: string[]): number {
    let score = 60; // Base visibility

    // Keyword presence
    const keywordCount = keywords.filter(kw => content.toLowerCase().includes(kw.toLowerCase())).length;
    score += keywordCount * 5;

    // Content length (longer content often ranks better)
    if (content.length > 500) score += 10;
    if (content.length > 1000) score += 5;

    // Platform-specific boosts
    if (['medium', 'substack', 'website'].includes(platform)) {
      score += 10; // SEO-friendly platforms
    }

    return Math.min(100, Math.round(score));
  }

  private calculateViralPotential(
    content: string,
    platform: Platform,
    factors: EngagementFactors
  ): number {
    let score = 30; // Base viral potential (most content doesn't go viral)

    // High emotional appeal boosts viral potential
    if (factors.emotionalAppeal > 70) score += 20;

    // Visual content indicators
    if (factors.visualAppeal > 70) score += 10;

    // Shareable indicators
    if (content.includes('thread') || content.includes('🧵')) score += 10;
    if (content.match(/[\u{1F4AF}]/u)) score += 5; // 💯 emoji

    // Platform-specific viral potential
    if (['twitter', 'tiktok', 'instagram'].includes(platform)) {
      score += 10; // Higher viral potential platforms
    }

    return Math.min(100, Math.round(score));
  }

  private calculateConversionLikelihood(content: string, callToAction?: string): number {
    let score = 40; // Base conversion rate

    // Has CTA
    if (callToAction) {
      score += 20;

      // Strong CTA
      if (/now|today|free|instant/i.test(callToAction)) {
        score += 15;
      }
    }

    // Content has conversion-oriented language
    const conversionWords = ['sign up', 'subscribe', 'get started', 'learn more', 'try', 'demo', 'free'];
    const conversionCount = conversionWords.filter(word => content.toLowerCase().includes(word)).length;
    score += conversionCount * 5;

    return Math.min(100, Math.round(score));
  }

  private calculatePlatformOptimization(content: string, platform: Platform): number {
    const limit = this.platformLimits[platform];
    const ideal = this.idealPostLengths[platform];

    let score = 60;

    // Length optimization
    if (content.length <= limit) {
      score += 20;
      if (content.length >= ideal.min && content.length <= ideal.max) {
        score += 15;
      }
    }

    // Platform-specific optimizations
    if (platform === 'twitter' && content.length <= 280) score += 5;
    if (platform === 'linkedin' && content.includes('\n\n')) score += 5; // Good formatting

    return Math.min(100, score);
  }

  private generateTimingRecommendations(platform: Platform): string[] {
    const times = this.bestPostingTimes[platform];
    return [
      `Best posting times for ${platform}: ${times.join(', ')}`,
      'Consider your specific audience\'s timezone',
      'Test different times and track performance'
    ];
  }

  private generateABTestSuggestions(
    content: string,
    title?: string,
    callToAction?: string
  ): ABTestSuggestion[] {
    const suggestions: ABTestSuggestion[] = [];

    // Title suggestions
    if (title) {
      suggestions.push({
        element: 'title',
        originalValue: title,
        alternativeValue: this.generateAlternativeTitle(title),
        expectedImpact: 10 + Math.random() * 20,
        rationale: 'Testing a more action-oriented title may increase click-through rates'
      });
    }

    // CTA suggestions
    if (callToAction) {
      suggestions.push({
        element: 'cta',
        originalValue: callToAction,
        alternativeValue: this.generateAlternativeCTA(callToAction),
        expectedImpact: 5 + Math.random() * 15,
        rationale: 'A/B testing different CTA variations can improve conversion rates'
      });
    }

    // Opening suggestions
    const opening = content.substring(0, 50);
    suggestions.push({
      element: 'opening',
      originalValue: opening,
      alternativeValue: this.generateAlternativeOpening(opening),
      expectedImpact: 5 + Math.random() * 10,
      rationale: 'Testing different hooks can improve initial engagement'
    });

    return suggestions.slice(0, this.config.maxSuggestions);
  }

  private generateAlternativeTitle(title: string): string {
    // Simple title variation
    if (!title.startsWith('How')) {
      return `How to ${title.toLowerCase()}`;
    }
    return `The Ultimate Guide to ${title.replace(/^How to /i, '')}`;
  }

  private generateAlternativeCTA(cta: string): string {
    const alternatives: Record<string, string> = {
      'sign up': 'Get Started Free',
      'learn more': 'Discover Now',
      'click here': 'Start Exploring',
      'buy now': 'Claim Your Offer',
      'subscribe': 'Join Now'
    };

    const ctaLower = cta.toLowerCase();
    for (const [original, alternative] of Object.entries(alternatives)) {
      if (ctaLower.includes(original)) {
        return alternative;
      }
    }

    return `${cta} Today →`;
  }

  private generateAlternativeOpening(opening: string): string {
    if (!opening.includes('?')) {
      return `Ever wondered why ${opening.toLowerCase()}...`;
    }
    return `Here's what you need to know: ${opening}`;
  }

  private getPlatformInsights(platform: Platform): PlatformInsights {
    const insights: Record<Platform, Omit<PlatformInsights, 'platform'>> = {
      twitter: {
        bestPractices: [
          'Keep posts under 280 characters',
          'Use 1-2 relevant hashtags',
          'Engage with replies quickly',
          'Use visuals to increase engagement'
        ],
        idealPostingTimes: this.bestPostingTimes.twitter,
        audienceExpectations: ['Quick updates', 'Real-time engagement', 'Trending topics'],
        competitiveAdvantages: ['Viral potential', 'Real-time reach', 'Thread format for long content']
      },
      linkedin: {
        bestPractices: [
          'Use professional tone',
          'Include industry insights',
          'Add line breaks for readability',
          'Share thought leadership content'
        ],
        idealPostingTimes: this.bestPostingTimes.linkedin,
        audienceExpectations: ['Professional value', 'Industry news', 'Career insights'],
        competitiveAdvantages: ['B2B reach', 'Professional network', 'Long-form content support']
      },
      facebook: {
        bestPractices: [
          'Post native video content',
          'Ask engaging questions',
          'Use Facebook Live for real-time engagement',
          'Optimize for mobile viewing'
        ],
        idealPostingTimes: this.bestPostingTimes.facebook,
        audienceExpectations: ['Community content', 'Personal stories', 'Local updates'],
        competitiveAdvantages: ['Wide demographic reach', 'Group engagement', 'Event promotion']
      },
      instagram: {
        bestPractices: [
          'Use high-quality visuals',
          'Leverage Stories and Reels',
          'Use 20-30 relevant hashtags',
          'Engage with comments'
        ],
        idealPostingTimes: this.bestPostingTimes.instagram,
        audienceExpectations: ['Visual content', 'Lifestyle imagery', 'Behind-the-scenes'],
        competitiveAdvantages: ['Visual storytelling', 'Younger demographic', 'Shopping integration']
      },
      medium: {
        bestPractices: [
          'Write long-form quality content',
          'Use compelling headlines',
          'Add relevant images',
          'Submit to publications'
        ],
        idealPostingTimes: this.bestPostingTimes.medium,
        audienceExpectations: ['In-depth analysis', 'Expert insights', 'Quality writing'],
        competitiveAdvantages: ['SEO benefits', 'Publication reach', 'Thought leadership']
      },
      substack: {
        bestPractices: [
          'Build subscriber relationships',
          'Maintain consistent publishing',
          'Offer exclusive content',
          'Engage in comments'
        ],
        idealPostingTimes: this.bestPostingTimes.substack,
        audienceExpectations: ['Newsletter content', 'Exclusive insights', 'Personal voice'],
        competitiveAdvantages: ['Direct audience relationship', 'Monetization options', 'Email delivery']
      },
      website: {
        bestPractices: [
          'Optimize for SEO',
          'Use structured headings',
          'Include internal links',
          'Add meta descriptions'
        ],
        idealPostingTimes: this.bestPostingTimes.website,
        audienceExpectations: ['Comprehensive content', 'Resource value', 'Professional quality'],
        competitiveAdvantages: ['Full control', 'SEO ownership', 'Brand building']
      }
    };

    return {
      platform,
      ...insights[platform]
    };
  }

  private generateRecommendations(
    content: string,
    platform: Platform,
    factors: EngagementFactors
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Content length recommendation
    if (!factors.contentLength.optimal) {
      recommendations.push({
        text: factors.contentLength.recommendation || 'Optimize content length',
        priority: 'high',
        category: 'content',
        expectedImpact: 15
      });
    }

    // Emotional appeal recommendation
    if (factors.emotionalAppeal < 50) {
      recommendations.push({
        text: 'Add more engaging language or emojis to increase emotional appeal',
        priority: 'medium',
        category: 'engagement',
        expectedImpact: 10
      });
    }

    // Readability recommendation
    if (factors.readability.score < 60) {
      recommendations.push({
        text: 'Simplify sentences for better readability',
        priority: 'medium',
        category: 'content',
        expectedImpact: 8
      });
    }

    // Visual appeal recommendation
    if (factors.visualAppeal < 50) {
      recommendations.push({
        text: 'Add formatting elements like bullet points or line breaks',
        priority: 'low',
        category: 'format',
        expectedImpact: 5
      });
    }

    // Hashtag recommendation
    if (!factors.hashtagEffectiveness && ['twitter', 'instagram', 'linkedin'].includes(platform)) {
      recommendations.push({
        text: 'Add relevant hashtags to increase discoverability',
        priority: 'medium',
        category: 'seo',
        expectedImpact: 12
      });
    }

    // CTA recommendation
    if (!factors.ctaStrength) {
      recommendations.push({
        text: 'Add a clear call-to-action to drive engagement',
        priority: 'high',
        category: 'engagement',
        expectedImpact: 15
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }

  private getBenchmarkComparison(engagementProbability: number, industry?: string): BenchmarkComparison {
    // Simulated industry benchmarks
    const industryAverage = industry ? 55 + Math.random() * 10 : 50;
    const topPerformers = 85 + Math.random() * 10;

    // Calculate percentile
    const percentile = Math.min(99, Math.max(1, Math.round(
      (engagementProbability / topPerformers) * 100
    )));

    // Determine comparison level
    let comparison: 'below' | 'average' | 'above' | 'excellent';
    if (engagementProbability < industryAverage - 10) {
      comparison = 'below';
    } else if (engagementProbability < industryAverage + 10) {
      comparison = 'average';
    } else if (engagementProbability < topPerformers - 10) {
      comparison = 'above';
    } else {
      comparison = 'excellent';
    }

    return {
      industryAverage: Math.round(industryAverage),
      percentile,
      topPerformers: Math.round(topPerformers),
      comparison
    };
  }

  private calculateConfidence(content: string, platform: Platform): number {
    // Base confidence
    let confidence = 60;

    // More content = more confidence in analysis
    if (content.length > 100) confidence += 10;
    if (content.length > 500) confidence += 10;

    // Platform-specific confidence (some platforms have more predictable patterns)
    if (['twitter', 'linkedin'].includes(platform)) {
      confidence += 10;
    }

    // Add some variation
    confidence += Math.random() * 10;

    return Math.min(95, Math.max(50, confidence));
  }
}

/**
 * Factory function
 */
export function createPerformancePredictionService(
  config: Partial<PerformancePredictionConfig> = {}
): PerformancePredictionService {
  return new PerformancePredictionService(config);
}
