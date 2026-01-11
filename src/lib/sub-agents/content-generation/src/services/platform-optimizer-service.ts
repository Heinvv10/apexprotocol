import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Multi-Platform Content Optimizer Service
 *
 * Optimizes content for different platforms with platform-specific
 * constraints, best practices, and formatting requirements.
 */

// Platform Definitions
export type Platform =
  | 'website'
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'medium'
  | 'substack'
  | 'youtube'
  | 'tiktok'
  | 'threads';

// Zod Schemas
export const PlatformConstraintsSchema = z.object({
  platform: z.enum(['website', 'twitter', 'linkedin', 'facebook', 'instagram', 'medium', 'substack', 'youtube', 'tiktok', 'threads']),
  maxCharacters: z.number().optional(),
  maxHashtags: z.number().optional(),
  maxMentions: z.number().optional(),
  maxLinks: z.number().optional(),
  supportsMarkdown: z.boolean().default(false),
  supportsHTML: z.boolean().default(false),
  supportsEmoji: z.boolean().default(true),
  imageRequired: z.boolean().default(false),
  videoSupported: z.boolean().default(false),
  linkPreviewSupported: z.boolean().default(true),
  schedulingSupported: z.boolean().default(true)
});

export const ContentToOptimizeSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  summary: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
  callToAction: z.string().optional(),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional()
});

export const PlatformOptimizerConfigSchema = z.object({
  enableAutoHashtags: z.boolean().default(true),
  enableAutoMentions: z.boolean().default(false),
  enableEmojiOptimization: z.boolean().default(true),
  enableLinkShortening: z.boolean().default(false),
  maxHashtagsDefault: z.number().default(5),
  preserveOriginalFormatting: z.boolean().default(false),
  targetEngagement: z.enum(['awareness', 'engagement', 'conversion']).default('engagement')
});

// Type Definitions
export type PlatformConstraints = z.infer<typeof PlatformConstraintsSchema>;
export type ContentToOptimize = z.infer<typeof ContentToOptimizeSchema>;
export type PlatformOptimizerConfig = z.infer<typeof PlatformOptimizerConfigSchema>;

export interface OptimizedContent {
  platform: Platform;
  content: string;
  title?: string;
  summary?: string;
  hashtags: string[];
  mentions: string[];
  links: string[];
  callToAction?: string;
  metadata: {
    originalLength: number;
    optimizedLength: number;
    truncated: boolean;
    hashtagsAdded: number;
    formattingChanges: string[];
  };
  platformSpecific: Record<string, unknown>;
  optimizationScore: number;
  warnings: string[];
  suggestions: string[];
}

export interface PlatformBestPractices {
  platform: Platform;
  idealPostLength: { min: number; max: number };
  bestPostingTimes: string[];
  hashtagStrategy: string;
  contentTips: string[];
  engagementTactics: string[];
  avoidList: string[];
}

export interface OptimizationResult {
  success: boolean;
  optimizedContent?: OptimizedContent;
  error?: string;
  processingTime: number;
}

export interface BatchOptimizationResult {
  success: boolean;
  results: Map<Platform, OptimizedContent>;
  failures: Map<Platform, string>;
  processingTime: number;
}

/**
 * Platform Content Optimizer Service
 */
export class PlatformOptimizerService extends EventEmitter {
  private config: PlatformOptimizerConfig;
  private platformConstraints: Map<Platform, PlatformConstraints>;
  private platformBestPractices: Map<Platform, PlatformBestPractices>;

  constructor(config: Partial<PlatformOptimizerConfig> = {}) {
    super();
    this.config = PlatformOptimizerConfigSchema.parse(config);
    this.platformConstraints = this.initializePlatformConstraints();
    this.platformBestPractices = this.initializeBestPractices();
  }

  /**
   * Optimize content for a specific platform
   */
  async optimize(
    content: ContentToOptimize,
    platform: Platform
  ): Promise<OptimizationResult> {
    const startTime = Date.now();

    try {
      const validatedContent = ContentToOptimizeSchema.parse(content);
      const constraints = this.getConstraints(platform);

      this.emit('optimization:start', { platform, contentLength: validatedContent.content.length });

      // Apply platform-specific optimizations
      let optimizedText = validatedContent.content;
      const formattingChanges: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // 1. Format conversion
      optimizedText = this.convertFormatting(optimizedText, platform, constraints);
      if (optimizedText !== validatedContent.content) {
        formattingChanges.push('formatting_converted');
      }

      // 2. Length optimization
      const originalLength = optimizedText.length;
      const truncated = this.needsTruncation(optimizedText, constraints);
      if (truncated) {
        optimizedText = this.truncateContent(optimizedText, constraints, platform);
        formattingChanges.push('content_truncated');
        warnings.push(`Content truncated from ${originalLength} to ${optimizedText.length} characters`);
      }

      // 3. Hashtag optimization
      let hashtags = validatedContent.hashtags || [];
      if (this.config.enableAutoHashtags) {
        hashtags = this.optimizeHashtags(hashtags, validatedContent.keywords || [], platform, constraints);
      }

      // 4. Link optimization
      let links = validatedContent.links || [];
      links = this.optimizeLinks(links, constraints);

      // 5. Emoji optimization
      if (this.config.enableEmojiOptimization) {
        optimizedText = this.optimizeEmojis(optimizedText, platform);
      }

      // 6. CTA optimization
      const callToAction = this.optimizeCTA(validatedContent.callToAction, platform);

      // 7. Platform-specific enhancements
      const platformSpecific = this.applyPlatformEnhancements(optimizedText, platform);
      if (platformSpecific.modifiedContent) {
        optimizedText = platformSpecific.modifiedContent;
        delete platformSpecific.modifiedContent;
      }

      // Generate suggestions
      suggestions.push(...this.generateSuggestions(optimizedText, platform, constraints));

      // Calculate optimization score
      const optimizationScore = this.calculateOptimizationScore(
        optimizedText,
        hashtags,
        platform,
        constraints
      );

      const optimizedContent: OptimizedContent = {
        platform,
        content: optimizedText,
        title: this.optimizeTitle(validatedContent.title, platform),
        summary: validatedContent.summary,
        hashtags,
        mentions: validatedContent.mentions || [],
        links,
        callToAction,
        metadata: {
          originalLength,
          optimizedLength: optimizedText.length,
          truncated,
          hashtagsAdded: hashtags.length - (validatedContent.hashtags?.length || 0),
          formattingChanges
        },
        platformSpecific,
        optimizationScore,
        warnings,
        suggestions
      };

      this.emit('optimization:complete', { platform, score: optimizationScore });

      return {
        success: true,
        optimizedContent,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('optimization:error', { platform, error: errorMessage });

      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Optimize content for multiple platforms at once
   */
  async optimizeForMultiplePlatforms(
    content: ContentToOptimize,
    platforms: Platform[]
  ): Promise<BatchOptimizationResult> {
    const startTime = Date.now();
    const results = new Map<Platform, OptimizedContent>();
    const failures = new Map<Platform, string>();

    this.emit('batch:start', { platforms: platforms.length });

    for (const platform of platforms) {
      const result = await this.optimize(content, platform);
      if (result.success && result.optimizedContent) {
        results.set(platform, result.optimizedContent);
      } else {
        failures.set(platform, result.error || 'Unknown error');
      }
    }

    this.emit('batch:complete', { success: results.size, failed: failures.size });

    return {
      success: failures.size === 0,
      results,
      failures,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Get platform constraints
   */
  getConstraints(platform: Platform): PlatformConstraints {
    return this.platformConstraints.get(platform) || this.getDefaultConstraints(platform);
  }

  /**
   * Get platform best practices
   */
  getBestPractices(platform: Platform): PlatformBestPractices | undefined {
    return this.platformBestPractices.get(platform);
  }

  /**
   * Get all supported platforms
   */
  getSupportedPlatforms(): Platform[] {
    return Array.from(this.platformConstraints.keys());
  }

  /**
   * Validate content for platform
   */
  validateForPlatform(content: string, platform: Platform): {
    valid: boolean;
    issues: string[];
    score: number;
  } {
    const constraints = this.getConstraints(platform);
    const issues: string[] = [];
    let score = 100;

    // Check length
    if (constraints.maxCharacters && content.length > constraints.maxCharacters) {
      issues.push(`Content exceeds maximum length (${content.length}/${constraints.maxCharacters})`);
      score -= 30;
    }

    // Check hashtags
    const hashtagCount = (content.match(/#\w+/g) || []).length;
    if (constraints.maxHashtags && hashtagCount > constraints.maxHashtags) {
      issues.push(`Too many hashtags (${hashtagCount}/${constraints.maxHashtags})`);
      score -= 10;
    }

    // Check links
    const linkCount = (content.match(/https?:\/\/\S+/g) || []).length;
    if (constraints.maxLinks && linkCount > constraints.maxLinks) {
      issues.push(`Too many links (${linkCount}/${constraints.maxLinks})`);
      score -= 10;
    }

    return {
      valid: issues.length === 0,
      issues,
      score: Math.max(0, score)
    };
  }

  // Private methods

  private initializePlatformConstraints(): Map<Platform, PlatformConstraints> {
    const constraints = new Map<Platform, PlatformConstraints>();

    constraints.set('twitter', {
      platform: 'twitter',
      maxCharacters: 280,
      maxHashtags: 3,
      maxMentions: 5,
      maxLinks: 1,
      supportsMarkdown: false,
      supportsHTML: false,
      supportsEmoji: true,
      imageRequired: false,
      videoSupported: true,
      linkPreviewSupported: true,
      schedulingSupported: true
    });

    constraints.set('linkedin', {
      platform: 'linkedin',
      maxCharacters: 3000,
      maxHashtags: 5,
      maxMentions: 10,
      maxLinks: 3,
      supportsMarkdown: false,
      supportsHTML: false,
      supportsEmoji: true,
      imageRequired: false,
      videoSupported: true,
      linkPreviewSupported: true,
      schedulingSupported: true
    });

    constraints.set('facebook', {
      platform: 'facebook',
      maxCharacters: 63206,
      maxHashtags: 3,
      maxMentions: 50,
      maxLinks: 5,
      supportsMarkdown: false,
      supportsHTML: false,
      supportsEmoji: true,
      imageRequired: false,
      videoSupported: true,
      linkPreviewSupported: true,
      schedulingSupported: true
    });

    constraints.set('instagram', {
      platform: 'instagram',
      maxCharacters: 2200,
      maxHashtags: 30,
      maxMentions: 20,
      maxLinks: 0, // Links only in bio
      supportsMarkdown: false,
      supportsHTML: false,
      supportsEmoji: true,
      imageRequired: true,
      videoSupported: true,
      linkPreviewSupported: false,
      schedulingSupported: true
    });

    constraints.set('medium', {
      platform: 'medium',
      maxCharacters: undefined,
      maxHashtags: 5,
      supportsMarkdown: true,
      supportsHTML: true,
      supportsEmoji: true,
      imageRequired: false,
      videoSupported: true,
      linkPreviewSupported: true,
      schedulingSupported: true
    });

    constraints.set('substack', {
      platform: 'substack',
      maxCharacters: undefined,
      maxHashtags: 3,
      supportsMarkdown: true,
      supportsHTML: true,
      supportsEmoji: true,
      imageRequired: false,
      videoSupported: true,
      linkPreviewSupported: true,
      schedulingSupported: true
    });

    constraints.set('website', {
      platform: 'website',
      maxCharacters: undefined,
      supportsMarkdown: true,
      supportsHTML: true,
      supportsEmoji: true,
      imageRequired: false,
      videoSupported: true,
      linkPreviewSupported: true,
      schedulingSupported: false
    });

    constraints.set('youtube', {
      platform: 'youtube',
      maxCharacters: 5000, // Description
      maxHashtags: 15,
      supportsMarkdown: false,
      supportsHTML: false,
      supportsEmoji: true,
      imageRequired: false,
      videoSupported: true,
      linkPreviewSupported: false,
      schedulingSupported: true
    });

    constraints.set('tiktok', {
      platform: 'tiktok',
      maxCharacters: 2200,
      maxHashtags: 5,
      supportsMarkdown: false,
      supportsHTML: false,
      supportsEmoji: true,
      imageRequired: false,
      videoSupported: true,
      linkPreviewSupported: false,
      schedulingSupported: true
    });

    constraints.set('threads', {
      platform: 'threads',
      maxCharacters: 500,
      maxHashtags: 5,
      supportsMarkdown: false,
      supportsHTML: false,
      supportsEmoji: true,
      imageRequired: false,
      videoSupported: true,
      linkPreviewSupported: true,
      schedulingSupported: false
    });

    return constraints;
  }

  private initializeBestPractices(): Map<Platform, PlatformBestPractices> {
    const practices = new Map<Platform, PlatformBestPractices>();

    practices.set('twitter', {
      platform: 'twitter',
      idealPostLength: { min: 71, max: 100 },
      bestPostingTimes: ['9am', '12pm', '5pm'],
      hashtagStrategy: 'Use 1-2 relevant hashtags, avoid hashtag stuffing',
      contentTips: [
        'Start with a hook',
        'Use thread format for longer content',
        'Include a clear CTA',
        'Engage with replies'
      ],
      engagementTactics: [
        'Ask questions',
        'Use polls',
        'Share user-generated content',
        'Respond quickly to comments'
      ],
      avoidList: [
        'Excessive hashtags',
        'All caps',
        'Too many links',
        'Controversial topics without clear stance'
      ]
    });

    practices.set('linkedin', {
      platform: 'linkedin',
      idealPostLength: { min: 150, max: 1300 },
      bestPostingTimes: ['7am', '12pm', '5pm'],
      hashtagStrategy: 'Use 3-5 industry-relevant hashtags',
      contentTips: [
        'Lead with value',
        'Use line breaks for readability',
        'Share professional insights',
        'Include personal stories'
      ],
      engagementTactics: [
        'Ask for opinions',
        'Tag relevant connections',
        'Comment on industry news',
        'Share carousel posts'
      ],
      avoidList: [
        'Overly promotional content',
        'Irrelevant hashtags',
        'Negative commentary',
        'Personal drama'
      ]
    });

    practices.set('instagram', {
      platform: 'instagram',
      idealPostLength: { min: 138, max: 150 },
      bestPostingTimes: ['11am', '1pm', '7pm'],
      hashtagStrategy: 'Use 20-30 relevant hashtags, mix popular and niche',
      contentTips: [
        'High-quality visuals required',
        'Use Stories for engagement',
        'Carousel posts perform well',
        'Write compelling captions'
      ],
      engagementTactics: [
        'Use interactive stickers in Stories',
        'Respond to comments',
        'Collaborate with others',
        'Post consistently'
      ],
      avoidList: [
        'Low-quality images',
        'Irrelevant hashtags',
        'Broken links in bio',
        'Inconsistent posting'
      ]
    });

    practices.set('facebook', {
      platform: 'facebook',
      idealPostLength: { min: 40, max: 80 },
      bestPostingTimes: ['1pm', '4pm', '8pm'],
      hashtagStrategy: 'Use 1-2 hashtags sparingly',
      contentTips: [
        'Native video performs best',
        'Ask questions',
        'Use Facebook Live',
        'Share community content'
      ],
      engagementTactics: [
        'Create polls',
        'Share behind-the-scenes',
        'Respond to comments quickly',
        'Use Groups for community'
      ],
      avoidList: [
        'Engagement bait',
        'Excessive posting',
        'Links without context',
        'Controversial clickbait'
      ]
    });

    practices.set('medium', {
      platform: 'medium',
      idealPostLength: { min: 1600, max: 2400 },
      bestPostingTimes: ['8am', '11am', '2pm'],
      hashtagStrategy: 'Use up to 5 tags that match your topic',
      contentTips: [
        'Strong opening hook',
        'Use subheadings',
        'Include images',
        'End with clear takeaways'
      ],
      engagementTactics: [
        'Respond to comments',
        'Clap for others',
        'Submit to publications',
        'Cross-promote'
      ],
      avoidList: [
        'Clickbait titles',
        'Thin content',
        'No formatting',
        'Plagiarism'
      ]
    });

    return practices;
  }

  private getDefaultConstraints(platform: Platform): PlatformConstraints {
    return {
      platform,
      maxCharacters: undefined,
      supportsMarkdown: false,
      supportsHTML: false,
      supportsEmoji: true,
      imageRequired: false,
      videoSupported: true,
      linkPreviewSupported: true,
      schedulingSupported: true
    };
  }

  private convertFormatting(
    content: string,
    platform: Platform,
    constraints: PlatformConstraints
  ): string {
    let formatted = content;

    // Convert markdown to plain text if not supported
    if (!constraints.supportsMarkdown && !constraints.supportsHTML) {
      // Remove markdown headers
      formatted = formatted.replace(/^#{1,6}\s*/gm, '');
      // Remove bold/italic
      formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '$1');
      formatted = formatted.replace(/\*([^*]+)\*/g, '$1');
      formatted = formatted.replace(/__([^_]+)__/g, '$1');
      formatted = formatted.replace(/_([^_]+)_/g, '$1');
      // Remove links markdown
      formatted = formatted.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      // Remove bullet points
      formatted = formatted.replace(/^[-*•]\s/gm, '');
    }

    // Platform-specific formatting
    if (platform === 'linkedin') {
      // Add line breaks for readability
      formatted = formatted.replace(/([.!?])\s+/g, '$1\n\n');
    }

    if (platform === 'twitter') {
      // Remove excessive newlines
      formatted = formatted.replace(/\n{3,}/g, '\n\n');
    }

    return formatted.trim();
  }

  private needsTruncation(content: string, constraints: PlatformConstraints): boolean {
    return !!(constraints.maxCharacters && content.length > constraints.maxCharacters);
  }

  private truncateContent(
    content: string,
    constraints: PlatformConstraints,
    platform: Platform
  ): string {
    if (!constraints.maxCharacters) return content;

    const maxLength = constraints.maxCharacters;

    // Try to truncate at sentence boundary
    if (content.length <= maxLength) return content;

    const truncated = content.substring(0, maxLength - 3);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclamation = truncated.lastIndexOf('!');

    const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);

    if (lastSentenceEnd > maxLength * 0.6) {
      return content.substring(0, lastSentenceEnd + 1);
    }

    // Truncate at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      return content.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  private optimizeHashtags(
    existingHashtags: string[],
    keywords: string[],
    platform: Platform,
    constraints: PlatformConstraints
  ): string[] {
    const maxHashtags = constraints.maxHashtags || this.config.maxHashtagsDefault;
    let hashtags = [...existingHashtags];

    // Add keyword-based hashtags if under limit
    if (hashtags.length < maxHashtags && keywords.length > 0) {
      const keywordHashtags = keywords
        .filter(kw => !hashtags.some(h => h.toLowerCase().includes(kw.toLowerCase())))
        .map(kw => `#${kw.replace(/\s+/g, '')}`)
        .slice(0, maxHashtags - hashtags.length);

      hashtags.push(...keywordHashtags);
    }

    // Ensure proper formatting
    hashtags = hashtags.map(h => {
      if (!h.startsWith('#')) return `#${h}`;
      return h;
    });

    // Remove duplicates
    hashtags = [...new Set(hashtags.map(h => h.toLowerCase()))];

    // Limit to max
    return hashtags.slice(0, maxHashtags);
  }

  private optimizeLinks(links: string[], constraints: PlatformConstraints): string[] {
    if (constraints.maxLinks === undefined) return links;
    if (constraints.maxLinks === 0) return []; // Platform doesn't support links (e.g., Instagram)
    return links.slice(0, constraints.maxLinks);
  }

  private optimizeEmojis(content: string, platform: Platform): string {
    // Platform-specific emoji handling
    if (platform === 'linkedin') {
      // Add professional emojis at key points
      if (content.includes('Key takeaway:') || content.includes('Key insight:')) {
        content = content.replace(/(Key takeaway:|Key insight:)/g, '💡 $1');
      }
    }

    if (platform === 'twitter') {
      // Ensure not too many emojis for professional content
      const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
      if (emojiCount > 5 && this.config.targetEngagement !== 'awareness') {
        // Remove excessive emojis - keep first few
        let count = 0;
        content = content.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, (match) => {
          count++;
          return count <= 3 ? match : '';
        });
      }
    }

    return content;
  }

  private optimizeCTA(cta: string | undefined, platform: Platform): string | undefined {
    if (!cta) return undefined;

    // Platform-specific CTA optimization
    const ctaPatterns: Record<Platform, string[]> = {
      twitter: ['Learn more:', 'Click link:', '👇'],
      linkedin: ['Share your thoughts below', 'Comment with your experience', 'Follow for more'],
      instagram: ['Link in bio', 'DM for details', 'Save this post'],
      facebook: ['Learn more', 'Sign up', 'Shop now'],
      medium: ['Follow me for more', 'Clap if helpful', 'Leave a comment'],
      substack: ['Subscribe for updates', 'Share with a friend', 'Leave a comment'],
      website: ['Contact us', 'Learn more', 'Get started'],
      youtube: ['Subscribe', 'Like this video', 'Comment below'],
      tiktok: ['Follow for more', 'Duet this', 'Comment'],
      threads: ['Reply with your thoughts', 'Share if you agree', 'Follow for more']
    };

    // If CTA doesn't match platform style, suggest appropriate one
    const platformCTAs = ctaPatterns[platform] || [];
    if (platformCTAs.length > 0 && !platformCTAs.some(p => cta.toLowerCase().includes(p.toLowerCase()))) {
      // Return original but could enhance
      return cta;
    }

    return cta;
  }

  private optimizeTitle(title: string | undefined, platform: Platform): string | undefined {
    if (!title) return undefined;

    // Platform-specific title optimization
    if (platform === 'twitter' && title.length > 50) {
      // Shorten for Twitter
      return title.substring(0, 47) + '...';
    }

    if (platform === 'medium' || platform === 'substack') {
      // Ensure title is compelling
      if (title.length < 20 && !title.includes(':')) {
        return `${title}: A Comprehensive Guide`;
      }
    }

    return title;
  }

  private applyPlatformEnhancements(
    content: string,
    platform: Platform
  ): Record<string, unknown> & { modifiedContent?: string } {
    const enhancements: Record<string, unknown> & { modifiedContent?: string } = {};

    switch (platform) {
      case 'linkedin':
        // Add hook and structure
        if (!content.startsWith('🚀') && !content.startsWith('💡') && !content.startsWith('📊')) {
          enhancements.suggestedOpener = 'Consider starting with an emoji hook';
        }
        // Check for paragraph breaks
        if (!content.includes('\n\n')) {
          enhancements.modifiedContent = content.replace(/([.!?])\s+(?=[A-Z])/g, '$1\n\n');
        }
        break;

      case 'twitter':
        // Add thread indicator if long
        if (content.length > 200) {
          enhancements.threadSuggested = true;
        }
        break;

      case 'instagram':
        // Ensure visual-first mindset
        enhancements.visualRequired = true;
        enhancements.suggestedImageStyle = 'carousel or single high-quality image';
        break;

      case 'medium':
      case 'substack':
        // Check for proper article structure
        enhancements.articleStructure = {
          hasIntro: content.length > 100,
          hasHeadings: /^#{1,3}\s/m.test(content),
          hasBullets: /^[-*]\s/m.test(content)
        };
        break;
    }

    return enhancements;
  }

  private generateSuggestions(
    content: string,
    platform: Platform,
    constraints: PlatformConstraints
  ): string[] {
    const suggestions: string[] = [];
    const bestPractices = this.getBestPractices(platform);

    if (bestPractices) {
      const { idealPostLength } = bestPractices;
      if (content.length < idealPostLength.min) {
        suggestions.push(`Consider expanding content to at least ${idealPostLength.min} characters for better engagement`);
      } else if (content.length > idealPostLength.max) {
        suggestions.push(`Content may perform better if shortened to around ${idealPostLength.max} characters`);
      }
    }

    // Check for questions
    if (!content.includes('?') && this.config.targetEngagement === 'engagement') {
      suggestions.push('Consider adding a question to encourage engagement');
    }

    // Check for CTA
    if (!/click|sign up|learn|discover|follow|share|comment/i.test(content)) {
      suggestions.push('Add a clear call-to-action');
    }

    return suggestions;
  }

  private calculateOptimizationScore(
    content: string,
    hashtags: string[],
    platform: Platform,
    constraints: PlatformConstraints
  ): number {
    let score = 70; // Base score

    const bestPractices = this.getBestPractices(platform);

    // Length optimization (±15 points)
    if (bestPractices) {
      const { idealPostLength } = bestPractices;
      if (content.length >= idealPostLength.min && content.length <= idealPostLength.max) {
        score += 15;
      } else if (content.length >= idealPostLength.min * 0.8 && content.length <= idealPostLength.max * 1.2) {
        score += 7;
      }
    }

    // Hashtag optimization (±10 points)
    if (constraints.maxHashtags) {
      const hashtagRatio = hashtags.length / constraints.maxHashtags;
      if (hashtagRatio >= 0.5 && hashtagRatio <= 1) {
        score += 10;
      } else if (hashtagRatio > 0 && hashtagRatio < 0.5) {
        score += 5;
      }
    }

    // Has CTA (±5 points)
    if (/click|sign up|learn|discover|follow|share|comment/i.test(content)) {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }
}

/**
 * Factory function
 */
export function createPlatformOptimizerService(
  config: Partial<PlatformOptimizerConfig> = {}
): PlatformOptimizerService {
  return new PlatformOptimizerService(config);
}
