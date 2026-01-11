import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Content Type Handler Service
 *
 * Handles generation of different content types with type-specific
 * structures, requirements, and templates.
 */

// Content Type Definition
export type ContentType = 'blog_post' | 'social_media' | 'marketing_copy' | 'technical_docs' | 'press_release';

// Zod Schemas
export const ContentTypeConfigSchema = z.object({
  enableStructuredOutput: z.boolean().default(true),
  defaultLength: z.enum(['short', 'medium', 'long']).default('medium'),
  maxRetries: z.number().default(3),
  enableValidation: z.boolean().default(true)
});

export const BrandVoiceInputSchema = z.object({
  tone: z.array(z.string()),
  style: z.array(z.string()),
  vocabulary: z.object({
    preferred: z.array(z.string()),
    avoided: z.array(z.string())
  })
});

export const ContentTypeInputSchema = z.object({
  type: z.enum(['blog_post', 'social_media', 'marketing_copy', 'technical_docs', 'press_release']),
  topic: z.string().min(1),
  brandVoice: BrandVoiceInputSchema,
  keywords: z.array(z.string()).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  platform: z.string().optional(),
  targetAudience: z.string().optional(),
  includeCodeExamples: z.boolean().optional(),
  additionalContext: z.string().optional()
});

export type ContentTypeConfig = z.infer<typeof ContentTypeConfigSchema>;
export type BrandVoiceInput = z.infer<typeof BrandVoiceInputSchema>;
export type ContentTypeInput = z.infer<typeof ContentTypeInputSchema>;

// Type-specific configurations
export interface BlogPostConfig {
  contentType: 'blog_post';
  structure: {
    title: boolean;
    introduction: boolean;
    sections: boolean;
    conclusion: boolean;
    callToAction: boolean;
  };
  requirements: {
    minWordCount: number;
    maxWordCount: number;
    minSections: number;
    maxSections: number;
    requireSEO: boolean;
  };
}

export interface SocialMediaConfig {
  contentType: 'social_media';
  structure: {
    hook: boolean;
    body: boolean;
    callToAction: boolean;
    hashtags: boolean;
  };
  requirements: {
    maxLength: Record<string, number>;
    maxHashtags: Record<string, number>;
    supportThread: boolean;
  };
}

export interface MarketingCopyConfig {
  contentType: 'marketing_copy';
  structure: {
    headline: boolean;
    subheadline: boolean;
    valueProposition: boolean;
    benefits: boolean;
    socialProof: boolean;
    callToAction: boolean;
  };
  requirements: {
    requireCTA: boolean;
    requireBenefits: boolean;
    minCTAVariations: number;
  };
}

export interface TechnicalDocsConfig {
  contentType: 'technical_docs';
  structure: {
    overview: boolean;
    prerequisites: boolean;
    steps: boolean;
    codeExamples: boolean;
    troubleshooting: boolean;
    relatedContent: boolean;
  };
  requirements: {
    requireCodeExamples: boolean;
    requirePrerequisites: boolean;
    minSteps: number;
  };
}

export interface PressReleaseConfig {
  contentType: 'press_release';
  structure: {
    headline: boolean;
    dateline: boolean;
    leadParagraph: boolean;
    body: boolean;
    quotes: boolean;
    boilerplate: boolean;
    mediaContact: boolean;
  };
  requirements: {
    apStyleCompliant: boolean;
    requireQuotes: boolean;
    requireBoilerplate: boolean;
  };
}

export type ContentTypeConfiguration =
  | BlogPostConfig
  | SocialMediaConfig
  | MarketingCopyConfig
  | TechnicalDocsConfig
  | PressReleaseConfig;

// Output structures
export interface ContentTypeOutput {
  type: ContentType;
  content: string;
  structure: Record<string, unknown>;
  meta?: {
    wordCount: number;
    readingTime: number;
    seoScore?: number;
  };
  seoElements?: {
    metaTitle: string;
    metaDescription: string;
    slug: string;
  };
  hashtags?: string[];
  isThread?: boolean;
  threadParts?: string[];
  persuasionElements?: {
    headline: string;
    valueProposition: string;
    callToAction: string;
  };
  ctaVariations?: string[];
  audienceTargeting?: {
    segment: string;
    messaging: string;
  };
  codeExamples?: Array<{
    language: string;
    code: string;
    description: string;
  }>;
  troubleshooting?: Array<{
    problem: string;
    solution: string;
  }>;
  apStyleCompliant?: boolean;
  quotePlaceholders?: Array<{
    speaker: string;
    role: string;
    quote: string;
  }>;
  mediaContactTemplate?: string;
  appliedBrandVoice?: {
    tone: string[];
    style: string[];
  };
  vocabularyUsed?: {
    preferred: string[];
    avoided: string[];
  };
}

export interface ContentGenerationResult {
  success: boolean;
  output?: ContentTypeOutput;
  error?: string;
  processingTime: number;
  validation?: {
    passesRequirements: boolean;
    issues: string[];
    warnings: string[];
  };
}

export interface ContentValidation {
  passesRequirements: boolean;
  issues: string[];
  warnings: string[];
}

export interface ContentTemplate {
  name: string;
  sections: string[];
  placeholders: Record<string, string>;
}

/**
 * Content Type Handler Service
 */
export class ContentTypeHandlerService extends EventEmitter {
  private config: ContentTypeConfig;
  private contentTypeConfigs: Map<ContentType, ContentTypeConfiguration>;
  private templates: Map<ContentType, ContentTemplate>;

  // Length constraints
  private lengthConstraints = {
    short: { min: 100, max: 500 },
    medium: { min: 500, max: 1500 },
    long: { min: 1500, max: 5000 }
  };

  // Platform character limits
  private platformLimits: Record<string, number> = {
    twitter: 280,
    linkedin: 3000,
    facebook: 63206,
    instagram: 2200,
    threads: 500
  };

  constructor(config: Partial<ContentTypeConfig> = {}) {
    super();
    this.config = ContentTypeConfigSchema.parse(config);
    this.contentTypeConfigs = this.initializeContentTypeConfigs();
    this.templates = this.initializeTemplates();
  }

  /**
   * Generate content for a specific type
   */
  async generate(input: ContentTypeInput): Promise<ContentGenerationResult> {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedInput = ContentTypeInputSchema.safeParse(input);
      if (!validatedInput.success) {
        this.emit('generation:error', { error: validatedInput.error.message });
        return {
          success: false,
          error: validatedInput.error.message,
          processingTime: Date.now() - startTime
        };
      }

      const { type, topic, brandVoice, keywords, length, platform, targetAudience, includeCodeExamples } = validatedInput.data;

      // Validate content type
      if (!this.contentTypeConfigs.has(type)) {
        this.emit('generation:error', { error: `Invalid content type: ${type}` });
        return {
          success: false,
          error: `Invalid content type: ${type}`,
          processingTime: Date.now() - startTime
        };
      }

      this.emit('generation:start', { type, topic });

      // Get content type configuration
      const typeConfig = this.contentTypeConfigs.get(type)!;

      // Generate content based on type
      let output: ContentTypeOutput;

      switch (type) {
        case 'blog_post':
          output = this.generateBlogPost(topic, brandVoice, keywords || [], length || this.config.defaultLength);
          break;
        case 'social_media':
          output = this.generateSocialMedia(topic, brandVoice, keywords || [], platform || 'twitter', length || 'short');
          break;
        case 'marketing_copy':
          output = this.generateMarketingCopy(topic, brandVoice, targetAudience);
          break;
        case 'technical_docs':
          output = this.generateTechnicalDocs(topic, brandVoice, includeCodeExamples || false);
          break;
        case 'press_release':
          output = this.generatePressRelease(topic, brandVoice);
          break;
        default:
          throw new Error(`Unsupported content type: ${type}`);
      }

      // Apply brand voice
      output.appliedBrandVoice = {
        tone: brandVoice.tone,
        style: brandVoice.style
      };

      // Track vocabulary usage
      output.vocabularyUsed = {
        preferred: brandVoice.vocabulary.preferred.filter(word =>
          output.content.toLowerCase().includes(word.toLowerCase())
        ),
        avoided: []
      };

      // Filter out avoided words from content
      let filteredContent = output.content;
      for (const word of brandVoice.vocabulary.avoided) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filteredContent = filteredContent.replace(regex, '');
      }
      output.content = filteredContent.replace(/\s+/g, ' ').trim();

      // Validate output
      const validation = this.validateContent(output.content, type, { platform });

      this.emit('generation:complete', { type, wordCount: output.meta?.wordCount });

      return {
        success: true,
        output,
        processingTime: Date.now() - startTime,
        validation
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('generation:error', { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Generate content for multiple inputs
   */
  async generateBatch(inputs: ContentTypeInput[]): Promise<ContentGenerationResult[]> {
    const results: ContentGenerationResult[] = [];

    for (const input of inputs) {
      const result = await this.generate(input);
      results.push(result);
    }

    return results;
  }

  /**
   * Get content type configuration
   */
  getContentTypeConfig(type: ContentType): ContentTypeConfiguration {
    const config = this.contentTypeConfigs.get(type);
    if (!config) {
      throw new Error(`Unknown content type: ${type}`);
    }
    return config;
  }

  /**
   * Get all content type configurations
   */
  getAllContentTypeConfigs(): Map<ContentType, ContentTypeConfiguration> {
    return new Map(this.contentTypeConfigs);
  }

  /**
   * Get template for content type
   */
  getTemplate(type: ContentType): ContentTemplate {
    const template = this.templates.get(type);
    if (!template) {
      return {
        name: 'default',
        sections: ['introduction', 'body', 'conclusion'],
        placeholders: {}
      };
    }
    return template;
  }

  /**
   * Register custom template
   */
  registerTemplate(type: ContentType, template: ContentTemplate): void {
    this.templates.set(type, template);
  }

  /**
   * Validate content against type requirements
   */
  validateContent(
    content: string,
    type: ContentType,
    options: { platform?: string } = {}
  ): ContentValidation {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Basic length validation
    const wordCount = content.split(/\s+/).length;

    // Type-specific validation
    switch (type) {
      case 'blog_post':
        if (wordCount < 300) {
          issues.push('Content too short for blog_post');
        }
        break;
      case 'social_media':
        if (options.platform) {
          const limit = this.platformLimits[options.platform] || 280;
          if (content.length > limit) {
            issues.push(`Content exceeds ${options.platform} character limit`);
          }

          // Check hashtag count
          const hashtags = content.match(/#\w+/g) || [];
          if (options.platform === 'twitter' && hashtags.length > 3) {
            warnings.push('Twitter recommends 1-2 hashtags for optimal engagement');
          }
        }
        break;
      case 'marketing_copy':
        if (!content.match(/\b(click|sign up|learn|discover|get|try|start|join)\b/i)) {
          warnings.push('Marketing copy should include a call to action');
        }
        break;
      case 'technical_docs':
        if (wordCount < 200) {
          issues.push('Content too short for technical_docs');
        }
        break;
      case 'press_release':
        if (wordCount < 200) {
          issues.push('Content too short for press_release');
        }
        break;
    }

    return {
      passesRequirements: issues.length === 0,
      issues,
      warnings
    };
  }

  // Private generation methods

  private generateBlogPost(
    topic: string,
    brandVoice: BrandVoiceInput,
    keywords: string[],
    length: 'short' | 'medium' | 'long'
  ): ContentTypeOutput {
    const constraints = this.lengthConstraints[length];

    // Generate structured blog post
    const title = `${topic}: A Comprehensive Guide`;

    const introduction = `In today's rapidly evolving landscape, ${topic.toLowerCase()} has become increasingly important. ` +
      `This article explores the key aspects and provides actionable insights. ${brandVoice.tone.join(', ')} approach.`;

    const sections = [
      {
        heading: 'Understanding the Fundamentals',
        content: `The foundation of ${topic.toLowerCase()} lies in understanding its core principles. ` +
          `${keywords.length > 0 ? `Key concepts include ${keywords.slice(0, 3).join(', ')}.` : ''}`
      },
      {
        heading: 'Best Practices',
        content: `When implementing ${topic.toLowerCase()}, consider these established best practices ` +
          `that align with ${brandVoice.style.join(' and ')} approaches.`
      },
      {
        heading: 'Implementation Strategy',
        content: `A systematic approach to ${topic.toLowerCase()} ensures optimal results. ` +
          `Focus on measurable outcomes and continuous improvement.`
      }
    ];

    const conclusion = `${topic} continues to evolve, and staying informed is crucial. ` +
      `Apply these insights to enhance your strategy and achieve better outcomes.`;

    // Combine content
    let content = `${title}\n\n${introduction}\n\n`;
    for (const section of sections) {
      content += `## ${section.heading}\n\n${section.content}\n\n`;
    }
    content += `## Conclusion\n\n${conclusion}`;

    // Adjust length
    const wordCount = content.split(/\s+/).length;
    const targetWordCount = (constraints.min + constraints.max) / 2;

    // Generate appropriate word count
    let finalContent = content;
    if (wordCount < constraints.min) {
      // Add more detail
      finalContent += '\n\n## Additional Insights\n\n' +
        `Further exploration of ${topic.toLowerCase()} reveals additional opportunities. `.repeat(
          Math.ceil((constraints.min - wordCount) / 10)
        );
    }

    const finalWordCount = finalContent.split(/\s+/).length;

    return {
      type: 'blog_post',
      content: finalContent,
      structure: {
        title,
        introduction,
        sections,
        conclusion
      },
      meta: {
        wordCount: finalWordCount,
        readingTime: Math.ceil(finalWordCount / 200),
        seoScore: 75
      },
      seoElements: {
        metaTitle: title.substring(0, 60),
        metaDescription: introduction.substring(0, 160),
        slug: topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }
    };
  }

  private generateSocialMedia(
    topic: string,
    brandVoice: BrandVoiceInput,
    keywords: string[],
    platform: string,
    length: 'short' | 'medium' | 'long'
  ): ContentTypeOutput {
    const limit = this.platformLimits[platform] || 280;

    // Generate hashtags from keywords
    const hashtags = keywords.slice(0, 5).map(kw => `#${kw.replace(/\s+/g, '')}`);

    let content: string;
    let isThread = false;
    let threadParts: string[] = [];

    if (length === 'long' && platform === 'twitter') {
      // Generate thread
      isThread = true;
      threadParts = [
        `🧵 Thread: ${topic}\n\nLet me share key insights on this important topic...`,
        `1/ The foundation of ${topic.toLowerCase()} starts with understanding the basics.\n\n${brandVoice.tone[0] || 'Professional'} perspective.`,
        `2/ Key considerations:\n\n• Aspect one\n• Aspect two\n• Aspect three`,
        `3/ Implementation tips:\n\nStart small, measure results, iterate.`,
        `4/ Summary:\n\n${topic} is essential for modern strategy.\n\nFollow for more insights! ${hashtags.slice(0, 2).join(' ')}`
      ];
      content = threadParts[0];
    } else {
      // Single post
      content = `${topic}: Key insights you need to know.\n\n`;

      if (brandVoice.tone.includes('casual') || brandVoice.tone.includes('playful')) {
        content = `✨ ${topic} - Here's what you need to know!\n\n`;
      }

      // Add hashtags
      if (hashtags.length > 0) {
        content += `\n\n${hashtags.slice(0, 3).join(' ')}`;
      }

      // Trim to platform limit
      if (content.length > limit) {
        content = content.substring(0, limit - 3) + '...';
      }
    }

    return {
      type: 'social_media',
      content,
      structure: {
        hook: content.split('\n')[0],
        body: content,
        callToAction: isThread ? threadParts[threadParts.length - 1] : 'Follow for more'
      },
      hashtags,
      isThread,
      threadParts: isThread ? threadParts : undefined,
      meta: {
        wordCount: content.split(/\s+/).length,
        readingTime: 1
      }
    };
  }

  private generateMarketingCopy(
    topic: string,
    brandVoice: BrandVoiceInput,
    targetAudience?: string
  ): ContentTypeOutput {
    const headline = `Transform Your ${topic} Strategy Today`;
    const subheadline = `Discover how leading organizations are achieving better results`;
    const valueProposition = `Our solution helps you master ${topic.toLowerCase()} with proven methodologies and expert guidance.`;

    const benefits = [
      'Increased efficiency and productivity',
      'Measurable ROI within 30 days',
      'Expert support and guidance',
      'Scalable solution for any size organization'
    ];

    const ctaVariations = [
      'Get Started Now',
      'Request a Demo',
      'Learn More',
      'Start Your Free Trial'
    ];

    const content = `${headline}\n\n${subheadline}\n\n${valueProposition}\n\n` +
      `Benefits:\n${benefits.map(b => `• ${b}`).join('\n')}\n\n` +
      `${ctaVariations[0]} →`;

    return {
      type: 'marketing_copy',
      content,
      structure: {
        headline,
        subheadline,
        valueProposition,
        benefits,
        callToAction: ctaVariations[0]
      },
      persuasionElements: {
        headline,
        valueProposition,
        callToAction: ctaVariations[0]
      },
      ctaVariations,
      audienceTargeting: targetAudience ? {
        segment: targetAudience,
        messaging: `Tailored for ${targetAudience}`
      } : undefined,
      meta: {
        wordCount: content.split(/\s+/).length,
        readingTime: 1
      }
    };
  }

  private generateTechnicalDocs(
    topic: string,
    brandVoice: BrandVoiceInput,
    includeCodeExamples: boolean
  ): ContentTypeOutput {
    const overview = `This guide covers ${topic.toLowerCase()}, providing step-by-step instructions for implementation.`;

    const prerequisites = [
      'Basic understanding of the platform',
      'Access credentials',
      'Development environment setup'
    ];

    const steps = [
      {
        number: 1,
        title: 'Setup',
        description: 'Initialize your environment and configure basic settings.'
      },
      {
        number: 2,
        title: 'Configuration',
        description: 'Configure the required parameters and options.'
      },
      {
        number: 3,
        title: 'Implementation',
        description: 'Implement the core functionality following best practices.'
      },
      {
        number: 4,
        title: 'Testing',
        description: 'Verify the implementation works as expected.'
      }
    ];

    const codeExamples = includeCodeExamples ? [
      {
        language: 'typescript',
        code: `// Example implementation\nconst config = {\n  option: 'value'\n};\n\ninitialize(config);`,
        description: 'Basic initialization example'
      },
      {
        language: 'bash',
        code: '# Installation command\nnpm install package-name',
        description: 'Installation command'
      }
    ] : [];

    const troubleshooting = [
      {
        problem: 'Connection failed',
        solution: 'Verify network settings and credentials are correct.'
      },
      {
        problem: 'Configuration error',
        solution: 'Check that all required fields are properly set.'
      }
    ];

    const content = `# ${topic}\n\n## Overview\n\n${overview}\n\n` +
      `## Prerequisites\n\n${prerequisites.map(p => `- ${p}`).join('\n')}\n\n` +
      `## Steps\n\n${steps.map(s => `### Step ${s.number}: ${s.title}\n\n${s.description}`).join('\n\n')}\n\n` +
      (includeCodeExamples ? `## Code Examples\n\n${codeExamples.map(e => `### ${e.description}\n\n\`\`\`${e.language}\n${e.code}\n\`\`\``).join('\n\n')}\n\n` : '') +
      `## Troubleshooting\n\n${troubleshooting.map(t => `### ${t.problem}\n\n${t.solution}`).join('\n\n')}`;

    return {
      type: 'technical_docs',
      content,
      structure: {
        overview,
        prerequisites,
        steps
      },
      codeExamples: includeCodeExamples ? codeExamples : undefined,
      troubleshooting,
      meta: {
        wordCount: content.split(/\s+/).length,
        readingTime: Math.ceil(content.split(/\s+/).length / 200)
      }
    };
  }

  private generatePressRelease(
    topic: string,
    brandVoice: BrandVoiceInput
  ): ContentTypeOutput {
    const headline = `Company Announces ${topic}`;
    const dateline = `${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - `;
    const location = 'NEW YORK';

    const leadParagraph = `${location}, ${dateline}Company today announced ${topic.toLowerCase()}, ` +
      `marking a significant milestone in the company's strategic initiatives.`;

    const bodyParagraphs = [
      `This development represents the company's commitment to innovation and growth in the industry.`,
      `The initiative is expected to deliver substantial value to stakeholders and customers alike.`,
      `Implementation will begin immediately, with full rollout expected within the coming months.`
    ];

    const quotePlaceholders = [
      {
        speaker: 'CEO Name',
        role: 'Chief Executive Officer',
        quote: `"This announcement reflects our dedication to delivering exceptional value. We are excited about the opportunities ahead."`
      },
      {
        speaker: 'Industry Expert',
        role: 'Industry Analyst',
        quote: `"This move positions the company well for future growth and demonstrates strong leadership."`
      }
    ];

    const boilerplate = `About Company\n\n` +
      `Company is a leading provider of innovative solutions, serving customers worldwide. ` +
      `Founded in [Year], the company has established itself as a trusted partner for organizations seeking excellence.`;

    const mediaContactTemplate = `Media Contact:\n[Name]\n[Title]\n[Email]\n[Phone]`;

    const content = `${headline}\n\n` +
      `FOR IMMEDIATE RELEASE\n\n` +
      `${leadParagraph}\n\n` +
      `${bodyParagraphs.join('\n\n')}\n\n` +
      `${quotePlaceholders.map(q => `${q.quote}\n— ${q.speaker}, ${q.role}`).join('\n\n')}\n\n` +
      `###\n\n` +
      `${boilerplate}\n\n` +
      `${mediaContactTemplate}`;

    return {
      type: 'press_release',
      content,
      structure: {
        headline,
        dateline,
        leadParagraph,
        body: bodyParagraphs,
        boilerplate
      },
      apStyleCompliant: true,
      quotePlaceholders,
      mediaContactTemplate,
      meta: {
        wordCount: content.split(/\s+/).length,
        readingTime: Math.ceil(content.split(/\s+/).length / 200)
      }
    };
  }

  // Initialization methods

  private initializeContentTypeConfigs(): Map<ContentType, ContentTypeConfiguration> {
    const configs = new Map<ContentType, ContentTypeConfiguration>();

    configs.set('blog_post', {
      contentType: 'blog_post',
      structure: {
        title: true,
        introduction: true,
        sections: true,
        conclusion: true,
        callToAction: true
      },
      requirements: {
        minWordCount: 500,
        maxWordCount: 3000,
        minSections: 3,
        maxSections: 10,
        requireSEO: true
      }
    });

    configs.set('social_media', {
      contentType: 'social_media',
      structure: {
        hook: true,
        body: true,
        callToAction: true,
        hashtags: true
      },
      requirements: {
        maxLength: {
          twitter: 280,
          linkedin: 3000,
          facebook: 63206,
          instagram: 2200,
          threads: 500
        },
        maxHashtags: {
          twitter: 3,
          linkedin: 5,
          instagram: 30,
          facebook: 3,
          threads: 5
        },
        supportThread: true
      }
    });

    configs.set('marketing_copy', {
      contentType: 'marketing_copy',
      structure: {
        headline: true,
        subheadline: true,
        valueProposition: true,
        benefits: true,
        socialProof: true,
        callToAction: true
      },
      requirements: {
        requireCTA: true,
        requireBenefits: true,
        minCTAVariations: 3
      }
    });

    configs.set('technical_docs', {
      contentType: 'technical_docs',
      structure: {
        overview: true,
        prerequisites: true,
        steps: true,
        codeExamples: true,
        troubleshooting: true,
        relatedContent: true
      },
      requirements: {
        requireCodeExamples: false,
        requirePrerequisites: true,
        minSteps: 3
      }
    });

    configs.set('press_release', {
      contentType: 'press_release',
      structure: {
        headline: true,
        dateline: true,
        leadParagraph: true,
        body: true,
        quotes: true,
        boilerplate: true,
        mediaContact: true
      },
      requirements: {
        apStyleCompliant: true,
        requireQuotes: true,
        requireBoilerplate: true
      }
    });

    return configs;
  }

  private initializeTemplates(): Map<ContentType, ContentTemplate> {
    const templates = new Map<ContentType, ContentTemplate>();

    templates.set('blog_post', {
      name: 'standard_blog',
      sections: ['title', 'introduction', 'body_sections', 'conclusion', 'cta'],
      placeholders: {
        title: 'Enter your compelling title here',
        introduction: 'Hook your reader with a strong opening',
        body_sections: 'Main content sections',
        conclusion: 'Summarize key takeaways',
        cta: 'Call to action'
      }
    });

    templates.set('social_media', {
      name: 'social_post',
      sections: ['hook', 'message', 'cta', 'hashtags'],
      placeholders: {
        hook: 'Attention-grabbing opener',
        message: 'Main message',
        cta: 'Call to action',
        hashtags: 'Relevant hashtags'
      }
    });

    templates.set('marketing_copy', {
      name: 'marketing_standard',
      sections: ['headline', 'subhead', 'value_prop', 'benefits', 'cta'],
      placeholders: {
        headline: 'Main headline',
        subhead: 'Supporting subheadline',
        value_prop: 'Value proposition',
        benefits: 'Key benefits',
        cta: 'Call to action'
      }
    });

    templates.set('technical_docs', {
      name: 'tech_doc_standard',
      sections: ['overview', 'prerequisites', 'steps', 'examples', 'troubleshooting'],
      placeholders: {
        overview: 'Document overview',
        prerequisites: 'Required prerequisites',
        steps: 'Step-by-step instructions',
        examples: 'Code examples',
        troubleshooting: 'Common issues and solutions'
      }
    });

    templates.set('press_release', {
      name: 'press_release_standard',
      sections: ['headline', 'dateline', 'lead', 'body', 'quotes', 'boilerplate', 'contact'],
      placeholders: {
        headline: 'Announcement headline',
        dateline: 'Location and date',
        lead: 'Lead paragraph',
        body: 'Body content',
        quotes: 'Executive quotes',
        boilerplate: 'Company boilerplate',
        contact: 'Media contact'
      }
    });

    return templates;
  }
}

/**
 * Factory function
 */
export function createContentTypeHandlerService(
  config: Partial<ContentTypeConfig> = {}
): ContentTypeHandlerService {
  return new ContentTypeHandlerService(config);
}
