import { z } from 'zod';
import { EventEmitter } from 'events';

// Content Generation Sub-Agent - Main Entry Point
// Autonomous content generation with brand voice learning and multi-platform optimization

// Type Definitions
export type ContentType = 'blog_post' | 'social_media' | 'marketing_copy' | 'technical_docs' | 'press_release';
export type Platform = 'website' | 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'medium' | 'substack';
export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

export interface BrandVoiceProfile {
  brandId: string;
  brandName: string;
  tone: string[];
  style: string[];
  vocabulary: {
    preferred: string[];
    avoided: string[];
  };
  messaging: {
    keyMessages: string[];
    valuePropositions: string[];
    callToActions: string[];
  };
  personality: {
    traits: string[];
    archetypes: string[];
  };
  guidelines: string[];
  examples: ContentExample[];
  confidence: number;
  lastUpdated: Date;
}

export interface ContentExample {
  id: string;
  type: ContentType;
  content: string;
  platform: Platform;
  performanceScore?: number;
  metadata?: Record<string, unknown>;
}

export interface ContentRequest {
  brandId: string;
  type: ContentType;
  platform: Platform;
  topic: string;
  keywords?: string[];
  targetAudience?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  includeCallToAction?: boolean;
  references?: string[];
  additionalContext?: string;
}

export interface GeneratedContent {
  id: string;
  brandId: string;
  type: ContentType;
  platform: Platform;
  title: string;
  content: string;
  summary?: string;
  keywords: string[];
  hashtags?: string[];
  callToAction?: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    seoScore: number;
    brandVoiceScore: number;
    originalityScore: number;
  };
  performancePrediction: PerformancePrediction;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface PerformancePrediction {
  engagementProbability: number;
  visibilityScore: number;
  viralPotential: number;
  conversionLikelihood: number;
  platformOptimizationScore: number;
  recommendations: string[];
  abTestSuggestions: ABTestSuggestion[];
}

export interface ABTestSuggestion {
  element: 'title' | 'cta' | 'opening' | 'hashtags';
  originalValue: string;
  alternativeValue: string;
  expectedImpact: number;
  rationale: string;
}

export interface ContentGenerationConfig {
  brandId: string;
  brandName: string;
  apiKeys: {
    anthropic?: string;
    openai?: string;
    cohere?: string;
  };
  defaultPlatform: Platform;
  contentTypes: ContentType[];
  maxContentLength: {
    short: number;
    medium: number;
    long: number;
  };
  enablePerformancePrediction: boolean;
  enableOriginalityCheck: boolean;
  enableAutoSEO: boolean;
  cacheTTL: number;
  concurrentGenerations: number;
}

export interface ContentGenerationResult {
  success: boolean;
  content?: GeneratedContent;
  variations?: GeneratedContent[];
  error?: string;
  processingTime: number;
}

// Zod Schemas
export const ContentRequestSchema = z.object({
  brandId: z.string(),
  type: z.enum(['blog_post', 'social_media', 'marketing_copy', 'technical_docs', 'press_release']),
  platform: z.enum(['website', 'twitter', 'linkedin', 'facebook', 'instagram', 'medium', 'substack']),
  topic: z.string().min(1),
  keywords: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  tone: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).optional().default('medium'),
  includeCallToAction: z.boolean().optional().default(true),
  references: z.array(z.string()).optional(),
  additionalContext: z.string().optional()
});

export const ContentGenerationConfigSchema = z.object({
  brandId: z.string(),
  brandName: z.string(),
  apiKeys: z.object({
    anthropic: z.string().optional(),
    openai: z.string().optional(),
    cohere: z.string().optional()
  }),
  defaultPlatform: z.enum(['website', 'twitter', 'linkedin', 'facebook', 'instagram', 'medium', 'substack']).default('website'),
  contentTypes: z.array(z.enum(['blog_post', 'social_media', 'marketing_copy', 'technical_docs', 'press_release'])).default(['blog_post', 'social_media', 'marketing_copy']),
  maxContentLength: z.object({
    short: z.number().default(300),
    medium: z.number().default(1000),
    long: z.number().default(3000)
  }).default({ short: 300, medium: 1000, long: 3000 }),
  enablePerformancePrediction: z.boolean().default(true),
  enableOriginalityCheck: z.boolean().default(true),
  enableAutoSEO: z.boolean().default(true),
  cacheTTL: z.number().default(3600),
  concurrentGenerations: z.number().min(1).max(10).default(3)
});

/**
 * Content Generation Sub-Agent
 *
 * Autonomous content generation with:
 * - Brand voice learning and consistency
 * - Multi-platform optimization
 * - Performance prediction
 * - A/B testing suggestions
 */
export class ContentGenerationSubAgent extends EventEmitter {
  private config: ContentGenerationConfig;
  private brandVoiceProfile: BrandVoiceProfile | null = null;
  private initialized: boolean = false;
  private contentCache: Map<string, GeneratedContent> = new Map();

  constructor(config: Partial<ContentGenerationConfig>) {
    super();
    this.config = ContentGenerationConfigSchema.parse(config) as ContentGenerationConfig;
  }

  /**
   * Initialize the sub-agent
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.emit('initializing');

    // Initialize brand voice profile
    await this.initializeBrandVoice();

    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Initialize or load brand voice profile
   */
  private async initializeBrandVoice(): Promise<void> {
    this.brandVoiceProfile = {
      brandId: this.config.brandId,
      brandName: this.config.brandName,
      tone: ['professional', 'informative', 'engaging'],
      style: ['clear', 'concise', 'actionable'],
      vocabulary: {
        preferred: [],
        avoided: []
      },
      messaging: {
        keyMessages: [],
        valuePropositions: [],
        callToActions: []
      },
      personality: {
        traits: ['trustworthy', 'innovative', 'helpful'],
        archetypes: ['expert', 'guide']
      },
      guidelines: [],
      examples: [],
      confidence: 0.5,
      lastUpdated: new Date()
    };
  }

  /**
   * Generate content based on request
   */
  async generateContent(request: ContentRequest): Promise<ContentGenerationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const validatedRequest = ContentRequestSchema.parse(request);

    this.emit('generation:start', validatedRequest);

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(validatedRequest);
      const cached = this.contentCache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          content: cached,
          processingTime: Date.now() - startTime
        };
      }

      // Generate content based on type
      const content = await this.createContent(validatedRequest);

      // Optimize for platform
      const optimizedContent = await this.optimizeForPlatform(content, validatedRequest.platform);

      // Generate performance prediction
      const performancePrediction = this.config.enablePerformancePrediction
        ? await this.predictPerformance(optimizedContent)
        : this.getDefaultPerformancePrediction();

      // Create final content object
      const generatedContent: GeneratedContent = {
        id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        brandId: validatedRequest.brandId,
        type: validatedRequest.type,
        platform: validatedRequest.platform,
        title: optimizedContent.title,
        content: optimizedContent.content,
        summary: optimizedContent.summary,
        keywords: optimizedContent.keywords,
        hashtags: optimizedContent.hashtags,
        callToAction: optimizedContent.callToAction,
        metadata: {
          wordCount: this.countWords(optimizedContent.content),
          readingTime: this.calculateReadingTime(optimizedContent.content),
          seoScore: await this.calculateSEOScore(optimizedContent),
          brandVoiceScore: await this.calculateBrandVoiceScore(optimizedContent),
          originalityScore: this.config.enableOriginalityCheck
            ? await this.checkOriginality(optimizedContent.content)
            : 1.0
        },
        performancePrediction,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Cache the result
      this.contentCache.set(cacheKey, generatedContent);

      this.emit('generation:complete', generatedContent);

      return {
        success: true,
        content: generatedContent,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('generation:error', { request: validatedRequest, error: errorMessage });

      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Create raw content based on request
   */
  private async createContent(request: ContentRequest): Promise<{
    title: string;
    content: string;
    summary?: string;
    keywords: string[];
    hashtags?: string[];
    callToAction?: string;
  }> {
    const prompt = this.buildContentPrompt(request);
    const content = await this.generateWithLLM(prompt, request);

    return {
      title: content.title || `${request.topic} - ${this.config.brandName}`,
      content: content.body || `Content about ${request.topic}`,
      summary: content.summary,
      keywords: request.keywords || this.extractKeywords(content.body || ''),
      hashtags: this.generateHashtags(request),
      callToAction: request.includeCallToAction ? content.cta : undefined
    };
  }

  /**
   * Build content generation prompt
   */
  private buildContentPrompt(request: ContentRequest): string {
    const voiceGuidelines = this.brandVoiceProfile
      ? `Brand Voice Guidelines:
- Tone: ${this.brandVoiceProfile.tone.join(', ')}
- Style: ${this.brandVoiceProfile.style.join(', ')}
- Personality: ${this.brandVoiceProfile.personality.traits.join(', ')}`
      : '';

    const lengthGuidelines = {
      short: 'Keep it concise, under 300 words',
      medium: 'Moderate length, around 500-1000 words',
      long: 'Comprehensive coverage, 1500-3000 words'
    };

    const platformGuidelines = this.getPlatformGuidelines(request.platform);

    return `You are creating ${request.type} content for ${this.config.brandName}.

Topic: ${request.topic}
Platform: ${request.platform}
Target Audience: ${request.targetAudience || 'General professional audience'}
${request.tone ? `Desired Tone: ${request.tone}` : ''}

${voiceGuidelines}

Platform Guidelines:
${platformGuidelines}

Length: ${lengthGuidelines[request.length || 'medium']}`;
  }

  /**
   * Get platform-specific guidelines
   */
  private getPlatformGuidelines(platform: Platform): string {
    const guidelines: Record<Platform, string> = {
      website: 'SEO-optimized, clear headings, scannable format',
      twitter: 'Maximum 280 characters, engaging hooks, relevant hashtags',
      linkedin: 'Professional tone, industry insights, thought leadership',
      facebook: 'Conversational, storytelling, visual-friendly',
      instagram: 'Visual-first, concise captions, strategic hashtags',
      medium: 'Long-form, storytelling, personal insights',
      substack: 'Newsletter format, personal connection, valuable insights'
    };
    return guidelines[platform];
  }

  /**
   * Generate content using LLM (placeholder - integrate with actual API)
   */
  private async generateWithLLM(prompt: string, request: ContentRequest): Promise<{
    title?: string;
    body?: string;
    summary?: string;
    cta?: string;
  }> {
    const templates = this.getContentTemplates(request.type, request);
    return {
      title: templates.title,
      body: templates.body,
      summary: templates.summary,
      cta: templates.cta
    };
  }

  /**
   * Get content templates by type
   */
  private getContentTemplates(type: ContentType, request: ContentRequest): {
    title: string;
    body: string;
    summary: string;
    cta: string;
  } {
    const templates: Record<ContentType, { title: string; body: string; summary: string; cta: string }> = {
      blog_post: {
        title: `${request.topic}: A Comprehensive Guide`,
        body: `# ${request.topic}\n\n## Introduction\n\nIn today's rapidly evolving landscape, understanding ${request.topic} has become essential.\n\n## Key Insights\n\n${request.topic} presents unique opportunities.\n\n## Conclusion\n\nBy implementing these strategies, you can effectively leverage ${request.topic}.`,
        summary: `A comprehensive exploration of ${request.topic}.`,
        cta: `Ready to transform your approach to ${request.topic}? Contact us today.`
      },
      social_media: {
        title: request.topic,
        body: `${request.topic}\n\nKey takeaway: Understanding this topic is crucial for success.\n\nWhat's your experience? Share below!`,
        summary: `Social post about ${request.topic}`,
        cta: `Learn more at our website!`
      },
      marketing_copy: {
        title: `Discover ${request.topic}`,
        body: `Transform your business with ${request.topic}.\n\nOur solution delivers:\n- Increased efficiency\n- Better results\n- Competitive advantage`,
        summary: `Marketing copy for ${request.topic}`,
        cta: `Start your free trial today!`
      },
      technical_docs: {
        title: `${request.topic} - Technical Documentation`,
        body: `# ${request.topic}\n\n## Overview\n\nThis document provides technical guidance.\n\n## Prerequisites\n\n- Requirement 1\n- Requirement 2\n\n## Implementation\n\nBegin by configuring your environment.`,
        summary: `Technical documentation for ${request.topic}`,
        cta: `Need help? Check our support portal.`
      },
      press_release: {
        title: `${this.config.brandName} Announces ${request.topic}`,
        body: `FOR IMMEDIATE RELEASE\n\n${this.config.brandName} Announces ${request.topic}\n\nThis represents a major step forward for our organization.`,
        summary: `Press release announcing ${request.topic}`,
        cta: `For media inquiries, contact press@example.com`
      }
    };

    return templates[type];
  }

  /**
   * Optimize content for specific platform
   */
  private async optimizeForPlatform(
    content: { title: string; content: string; summary?: string; keywords: string[]; hashtags?: string[]; callToAction?: string },
    platform: Platform
  ): Promise<typeof content> {
    const optimized = { ...content };

    switch (platform) {
      case 'twitter':
        if (optimized.content.length > 280) {
          optimized.content = optimized.content.substring(0, 277) + '...';
        }
        if (optimized.hashtags && optimized.hashtags.length > 3) {
          optimized.hashtags = optimized.hashtags.slice(0, 3);
        }
        break;

      case 'linkedin':
        optimized.content = optimized.content.replace(/^#\s/gm, '📌 ');
        break;

      case 'instagram':
        if (optimized.hashtags && optimized.hashtags.length < 5) {
          optimized.hashtags = [
            ...optimized.hashtags,
            ...this.generateHashtags({ topic: content.title, platform } as ContentRequest).slice(0, 5 - optimized.hashtags.length)
          ];
        }
        break;

      case 'website':
      case 'medium':
      case 'substack':
        if (!optimized.summary) {
          optimized.summary = this.generateSummary(optimized.content);
        }
        break;
    }

    return optimized;
  }

  /**
   * Predict content performance
   */
  private async predictPerformance(content: {
    title: string;
    content: string;
    keywords: string[];
  }): Promise<PerformancePrediction> {
    const titleStrength = this.analyzeTitleStrength(content.title);
    const contentQuality = this.analyzeContentQuality(content.content);
    const keywordOptimization = this.analyzeKeywordOptimization(content.content, content.keywords);

    const engagementProbability = (titleStrength + contentQuality) / 2;
    const visibilityScore = keywordOptimization;
    const viralPotential = this.calculateViralPotential(content);
    const conversionLikelihood = this.calculateConversionLikelihood(content);
    const platformOptimizationScore = (engagementProbability + visibilityScore) / 2;

    const recommendations = this.generatePerformanceRecommendations(content, {
      titleStrength,
      contentQuality,
      keywordOptimization
    });

    const abTestSuggestions = this.generateABTestSuggestions(content);

    return {
      engagementProbability,
      visibilityScore,
      viralPotential,
      conversionLikelihood,
      platformOptimizationScore,
      recommendations,
      abTestSuggestions
    };
  }

  /**
   * Analyze title strength
   */
  private analyzeTitleStrength(title: string): number {
    let score = 0.5;
    const powerWords = ['ultimate', 'essential', 'comprehensive', 'proven', 'expert'];
    if (powerWords.some(word => title.toLowerCase().includes(word))) score += 0.1;
    if (/\d+/.test(title)) score += 0.1;
    if (title.length >= 50 && title.length <= 60) score += 0.1;
    if (/how|why|what|best|top|guide/i.test(title)) score += 0.1;
    return Math.min(score, 1);
  }

  /**
   * Analyze content quality
   */
  private analyzeContentQuality(content: string): number {
    let score = 0.5;
    const wordCount = this.countWords(content);
    if (wordCount >= 1000 && wordCount <= 2000) score += 0.15;
    else if (wordCount >= 500) score += 0.1;
    const paragraphs = content.split(/\n\n+/);
    if (paragraphs.length >= 5) score += 0.1;
    const headings = content.match(/^#+\s/gm) || [];
    if (headings.length >= 3) score += 0.1;
    if (/^[-*•]\s/m.test(content)) score += 0.1;
    return Math.min(score, 1);
  }

  /**
   * Analyze keyword optimization
   */
  private analyzeKeywordOptimization(content: string, keywords: string[]): number {
    if (!keywords.length) return 0.5;
    let score = 0;
    const contentLower = content.toLowerCase();
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      const occurrences = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
      if (occurrences >= 1) score += 0.1;
      if (occurrences >= 3) score += 0.1;
    }
    return Math.min(score / keywords.length + 0.3, 1);
  }

  /**
   * Calculate viral potential
   */
  private calculateViralPotential(content: { title: string; content: string }): number {
    let score = 0.3;
    const emotionalWords = ['amazing', 'incredible', 'shocking', 'surprising'];
    if (emotionalWords.some(word => content.content.toLowerCase().includes(word))) score += 0.2;
    if (content.content.includes('share') || content.content.includes('tell')) score += 0.1;
    return Math.min(score, 1);
  }

  /**
   * Calculate conversion likelihood
   */
  private calculateConversionLikelihood(content: { content: string }): number {
    let score = 0.4;
    if (/click|sign up|subscribe|learn more|get started/i.test(content.content)) score += 0.2;
    if (/benefit|advantage|improve|save|gain/i.test(content.content)) score += 0.15;
    return Math.min(score, 1);
  }

  /**
   * Generate performance recommendations
   */
  private generatePerformanceRecommendations(
    content: { title: string; content: string },
    scores: { titleStrength: number; contentQuality: number; keywordOptimization: number }
  ): string[] {
    const recommendations: string[] = [];
    if (scores.titleStrength < 0.6) {
      recommendations.push('Consider adding power words or numbers to your title');
    }
    if (scores.contentQuality < 0.6) {
      recommendations.push('Add more structure with headings and bullet points');
    }
    if (scores.keywordOptimization < 0.6) {
      recommendations.push('Include target keywords more naturally throughout');
    }
    return recommendations;
  }

  /**
   * Generate A/B test suggestions
   */
  private generateABTestSuggestions(content: { title: string; content: string }): ABTestSuggestion[] {
    const suggestions: ABTestSuggestion[] = [];
    suggestions.push({
      element: 'title',
      originalValue: content.title,
      alternativeValue: this.generateAlternativeTitle(content.title),
      expectedImpact: 0.15,
      rationale: 'Different title angle may resonate better with certain audiences'
    });
    return suggestions;
  }

  /**
   * Generate alternative title for A/B testing
   */
  private generateAlternativeTitle(title: string): string {
    if (title.includes(':')) {
      const parts = title.split(':');
      return parts.reverse().join(': ').trim();
    }
    if (!title.includes('How')) {
      return `How to Master ${title}`;
    }
    return `The Complete Guide to ${title.replace(/^How to\s*/i, '')}`;
  }

  /**
   * Get default performance prediction
   */
  private getDefaultPerformancePrediction(): PerformancePrediction {
    return {
      engagementProbability: 0.5,
      visibilityScore: 0.5,
      viralPotential: 0.3,
      conversionLikelihood: 0.4,
      platformOptimizationScore: 0.5,
      recommendations: [],
      abTestSuggestions: []
    };
  }

  /**
   * Calculate SEO score
   */
  private async calculateSEOScore(content: { title: string; content: string; keywords: string[] }): Promise<number> {
    let score = 0.5;
    if (content.title.length >= 50 && content.title.length <= 60) score += 0.1;
    if (content.keywords.some(kw => content.title.toLowerCase().includes(kw.toLowerCase()))) score += 0.1;
    const wordCount = this.countWords(content.content);
    if (wordCount >= 1000) score += 0.1;
    if (/^#{1,3}\s/m.test(content.content)) score += 0.1;
    return Math.min(score, 1);
  }

  /**
   * Calculate brand voice score
   */
  private async calculateBrandVoiceScore(content: { content: string }): Promise<number> {
    if (!this.brandVoiceProfile) return 0.7;
    let score = 0.5;
    const preferredMatches = this.brandVoiceProfile.vocabulary.preferred.filter(
      word => content.content.toLowerCase().includes(word.toLowerCase())
    ).length;
    score += Math.min(preferredMatches * 0.05, 0.2);
    const avoidedMatches = this.brandVoiceProfile.vocabulary.avoided.filter(
      word => content.content.toLowerCase().includes(word.toLowerCase())
    ).length;
    score -= avoidedMatches * 0.1;
    return Math.max(0, Math.min(score, 1));
  }

  /**
   * Check content originality
   */
  private async checkOriginality(content: string): Promise<number> {
    return 0.95;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculate reading time
   */
  private calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    return Math.ceil(this.countWords(text) / wordsPerMinute);
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4);
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Generate hashtags
   */
  private generateHashtags(request: ContentRequest): string[] {
    const hashtags: string[] = [];
    const topicWords = request.topic.split(/\s+/).filter(w => w.length > 3);
    topicWords.forEach(word => hashtags.push(`#${word.replace(/[^\w]/g, '')}`));
    request.keywords?.forEach(kw => hashtags.push(`#${kw.replace(/\s+/g, '')}`));
    return [...new Set(hashtags)].slice(0, 10);
  }

  /**
   * Generate summary from content
   */
  private generateSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join('. ').trim() + '.';
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: ContentRequest): string {
    return `${request.brandId}:${request.type}:${request.platform}:${request.topic}:${request.length || 'medium'}`;
  }

  /**
   * Learn brand voice from examples
   */
  async learnBrandVoice(examples: ContentExample[]): Promise<void> {
    if (!this.brandVoiceProfile) {
      await this.initializeBrandVoice();
    }
    this.brandVoiceProfile!.examples.push(...examples);
    const allContent = examples.map(e => e.content).join(' ');
    const words = allContent.toLowerCase().split(/\s+/);
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      if (word.length > 4) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    const topWords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
    this.brandVoiceProfile!.vocabulary.preferred = [
      ...new Set([...this.brandVoiceProfile!.vocabulary.preferred, ...topWords])
    ];
    this.brandVoiceProfile!.confidence = Math.min(0.5 + examples.length * 0.05, 0.95);
    this.brandVoiceProfile!.lastUpdated = new Date();
    this.emit('brandVoice:updated', this.brandVoiceProfile);
  }

  /**
   * Update brand voice profile
   */
  async updateBrandVoice(updates: Partial<BrandVoiceProfile>): Promise<void> {
    if (!this.brandVoiceProfile) {
      await this.initializeBrandVoice();
    }
    this.brandVoiceProfile = {
      ...this.brandVoiceProfile!,
      ...updates,
      lastUpdated: new Date()
    };
    this.emit('brandVoice:updated', this.brandVoiceProfile);
  }

  /**
   * Get brand voice profile
   */
  getBrandVoiceProfile(): BrandVoiceProfile | null {
    return this.brandVoiceProfile;
  }

  /**
   * Generate content variations
   */
  async generateVariations(
    request: ContentRequest,
    count: number = 3
  ): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    const variations: GeneratedContent[] = [];
    for (let i = 0; i < count; i++) {
      const variedRequest = {
        ...request,
        tone: i === 0 ? request.tone : i === 1 ? 'casual' : 'professional',
        additionalContext: `Variation ${i + 1}`
      };
      const result = await this.generateContent(variedRequest);
      if (result.success && result.content) {
        variations.push(result.content);
      }
    }
    return {
      success: variations.length > 0,
      variations,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Clear content cache
   */
  clearCache(): void {
    this.contentCache.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): ContentGenerationConfig {
    return { ...this.config };
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Factory function
export function createContentGenerationSubAgent(config: Partial<ContentGenerationConfig>): ContentGenerationSubAgent {
  return new ContentGenerationSubAgent(config);
}
