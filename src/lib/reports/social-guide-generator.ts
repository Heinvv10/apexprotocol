/**
 * Social Media Guide Generator
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 * Requirements: FR-3.1 through FR-3.6
 *
 * Generates platform-specific social media playbooks with:
 * - LinkedIn optimization (most impactful for Claude/ChatGPT)
 * - Twitter/X optimization (critical for Grok)
 * - YouTube optimization (critical for Gemini)
 * - Content templates for each platform
 * - Posting frequency recommendations
 * - Brand-specific customization
 */

import type { Brand, BrandCompetitor, BrandVoice } from "@/lib/db/schema";

// ============================================================================
// Types
// ============================================================================

/**
 * Supported social media platforms
 */
export type SocialPlatform =
  | "linkedin"
  | "twitter"
  | "youtube"
  | "facebook"
  | "instagram"
  | "tiktok";

/**
 * Platform-specific configuration
 */
export interface PlatformConfig {
  platform: SocialPlatform;
  displayName: string;
  description: string;
  aiPlatformImpact: {
    chatgpt: number; // 0-100 impact score
    claude: number;
    gemini: number;
    perplexity: number;
    grok: number;
    deepseek: number;
    copilot: number;
  };
  priority: "critical" | "high" | "medium" | "low";
}

/**
 * Content template for social media posts
 */
export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  platform: SocialPlatform;
  type: "stat" | "case_study" | "thought_leadership" | "how_to" | "news" | "question" | "announcement";
  template: string;
  variables: string[];
  bestPractices: string[];
  estimatedEngagement: "high" | "medium" | "low";
  postingFrequency: string;
}

/**
 * Platform optimization strategy
 */
export interface PlatformStrategy {
  platform: SocialPlatform;
  config: PlatformConfig;
  whyItMatters: string;
  actions: OptimizationAction[];
  templates: ContentTemplate[];
  postingSchedule: PostingSchedule;
  profileOptimization: ProfileOptimization;
}

/**
 * Individual optimization action
 */
export interface OptimizationAction {
  actionNumber: number;
  title: string;
  description: string;
  steps: string[];
  estimatedTime: string;
  impactScore: number;
}

/**
 * Posting schedule recommendation
 */
export interface PostingSchedule {
  frequency: string;
  bestTimes: string[];
  contentMix: {
    type: string;
    percentage: number;
  }[];
}

/**
 * Profile optimization checklist
 */
export interface ProfileOptimization {
  items: {
    item: string;
    description: string;
    priority: "critical" | "high" | "medium";
    completed?: boolean;
  }[];
}

/**
 * Complete social media guide
 */
export interface SocialMediaGuide {
  brandName: string;
  generatedAt: Date;
  version: string;
  summary: GuideSummary;
  strategies: PlatformStrategy[];
  executiveTakeaways: string[];
  monthlyCalendar: MonthlyCalendarEntry[];
}

/**
 * Guide summary
 */
export interface GuideSummary {
  totalPlatforms: number;
  priorityPlatforms: SocialPlatform[];
  estimatedTimePerWeek: string;
  expectedImpact: string;
}

/**
 * Monthly calendar entry
 */
export interface MonthlyCalendarEntry {
  week: number;
  platform: SocialPlatform;
  contentType: string;
  topic: string;
  template: string;
}

/**
 * Brand data for customization
 */
export interface BrandSocialData {
  name: string;
  industry: string;
  description: string;
  targetAudience?: string;
  competitors?: string[];
  socialHandles?: {
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
    instagram?: string;
  };
}

// ============================================================================
// Platform Configurations
// ============================================================================

/**
 * Platform configurations with AI platform impact scores
 */
export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  linkedin: {
    platform: "linkedin",
    displayName: "LinkedIn",
    description: "Professional networking platform with strong AI visibility impact",
    aiPlatformImpact: {
      chatgpt: 85,
      claude: 90,
      gemini: 70,
      perplexity: 80,
      grok: 40,
      deepseek: 60,
      copilot: 75,
    },
    priority: "critical",
  },
  twitter: {
    platform: "twitter",
    displayName: "X (Twitter)",
    description: "Real-time social platform - primary source for Grok AI",
    aiPlatformImpact: {
      chatgpt: 60,
      claude: 55,
      gemini: 50,
      perplexity: 70,
      grok: 95, // Grok is built on X/Twitter data
      deepseek: 45,
      copilot: 50,
    },
    priority: "critical",
  },
  youtube: {
    platform: "youtube",
    displayName: "YouTube",
    description: "Video platform with strong Gemini integration",
    aiPlatformImpact: {
      chatgpt: 65,
      claude: 50,
      gemini: 95, // Gemini has strong YouTube integration
      perplexity: 75,
      grok: 55,
      deepseek: 40,
      copilot: 60,
    },
    priority: "high",
  },
  facebook: {
    platform: "facebook",
    displayName: "Facebook",
    description: "Social network with broad reach but moderate AI impact",
    aiPlatformImpact: {
      chatgpt: 40,
      claude: 35,
      gemini: 45,
      perplexity: 50,
      grok: 35,
      deepseek: 30,
      copilot: 40,
    },
    priority: "medium",
  },
  instagram: {
    platform: "instagram",
    displayName: "Instagram",
    description: "Visual social platform with limited AI citation",
    aiPlatformImpact: {
      chatgpt: 30,
      claude: 25,
      gemini: 40,
      perplexity: 35,
      grok: 30,
      deepseek: 20,
      copilot: 30,
    },
    priority: "low",
  },
  tiktok: {
    platform: "tiktok",
    displayName: "TikTok",
    description: "Short-form video platform with emerging AI impact",
    aiPlatformImpact: {
      chatgpt: 35,
      claude: 25,
      gemini: 50, // Gemini indexes video content
      perplexity: 40,
      grok: 30,
      deepseek: 30,
      copilot: 35,
    },
    priority: "low",
  },
};

// ============================================================================
// Content Templates
// ============================================================================

/**
 * LinkedIn content templates
 */
const LINKEDIN_TEMPLATES: ContentTemplate[] = [
  {
    id: "linkedin-stat",
    name: "Statistic Post",
    description: "Share industry statistics with your insights",
    platform: "linkedin",
    type: "stat",
    template: `📊 [SURPRISING_STAT]

Here's what this means for [AUDIENCE]:
• [INSIGHT_1]
• [INSIGHT_2]
• [INSIGHT_3]

At [BRAND_NAME], we're addressing this by [SOLUTION].

What's your take? 👇`,
    variables: ["SURPRISING_STAT", "AUDIENCE", "INSIGHT_1", "INSIGHT_2", "INSIGHT_3", "BRAND_NAME", "SOLUTION"],
    bestPractices: [
      "Lead with a compelling statistic",
      "Connect to your audience's challenges",
      "Provide 2-3 actionable insights",
      "End with a question to drive engagement",
    ],
    estimatedEngagement: "high",
    postingFrequency: "1-2x per week",
  },
  {
    id: "linkedin-case-study",
    name: "Case Study Post",
    description: "Highlight customer success stories",
    platform: "linkedin",
    type: "case_study",
    template: `🎯 How [CUSTOMER] achieved [RESULT] with [BRAND_NAME]

The challenge: [CHALLENGE]

The solution: [SOLUTION]

The result: [SPECIFIC_METRIC]

Full case study: [LINK]

#[INDUSTRY] #CustomerSuccess`,
    variables: ["CUSTOMER", "RESULT", "BRAND_NAME", "CHALLENGE", "SOLUTION", "SPECIFIC_METRIC", "LINK", "INDUSTRY"],
    bestPractices: [
      "Lead with the impressive result",
      "Keep challenge/solution brief",
      "Include specific metrics",
      "Link to full case study",
    ],
    estimatedEngagement: "high",
    postingFrequency: "2-3x per month",
  },
  {
    id: "linkedin-thought-leadership",
    name: "Thought Leadership Post",
    description: "Share industry insights and perspectives",
    platform: "linkedin",
    type: "thought_leadership",
    template: `I've been thinking about [TOPIC] lately.

Here's what I've observed:

[OBSERVATION_1]

[OBSERVATION_2]

[OBSERVATION_3]

The companies that will thrive in [YEAR] are those that [KEY_INSIGHT].

Agree? Disagree? I'd love to hear your perspective.`,
    variables: ["TOPIC", "OBSERVATION_1", "OBSERVATION_2", "OBSERVATION_3", "YEAR", "KEY_INSIGHT"],
    bestPractices: [
      "Share personal observations",
      "Be specific with examples",
      "Take a clear stance",
      "Invite respectful debate",
    ],
    estimatedEngagement: "high",
    postingFrequency: "1x per week",
  },
  {
    id: "linkedin-how-to",
    name: "How-To Post",
    description: "Share actionable tips and guides",
    platform: "linkedin",
    type: "how_to",
    template: `How to [ACHIEVE_GOAL] in [TIMEFRAME]:

Step 1: [STEP_1]
Step 2: [STEP_2]
Step 3: [STEP_3]
Step 4: [STEP_4]
Step 5: [STEP_5]

Bonus tip: [BONUS_TIP]

Save this post for later ↗️

#[TOPIC] #HowTo`,
    variables: ["ACHIEVE_GOAL", "TIMEFRAME", "STEP_1", "STEP_2", "STEP_3", "STEP_4", "STEP_5", "BONUS_TIP", "TOPIC"],
    bestPractices: [
      "Promise a specific outcome",
      "Keep steps actionable and clear",
      "Include a bonus tip for value",
      "Use save CTA for algorithm boost",
    ],
    estimatedEngagement: "high",
    postingFrequency: "1x per week",
  },
];

/**
 * Twitter/X content templates
 */
const TWITTER_TEMPLATES: ContentTemplate[] = [
  {
    id: "twitter-thread",
    name: "Thread Format",
    description: "Multi-tweet thread for detailed topics",
    platform: "twitter",
    type: "how_to",
    template: `🧵 [TOPIC_HOOK]

Here's everything you need to know:

1/ [POINT_1]

2/ [POINT_2]

3/ [POINT_3]

4/ [POINT_4]

5/ [CONCLUSION]

Like + RT if you found this useful!`,
    variables: ["TOPIC_HOOK", "POINT_1", "POINT_2", "POINT_3", "POINT_4", "CONCLUSION"],
    bestPractices: [
      "Start with a compelling hook",
      "Keep each tweet under 280 characters",
      "Number tweets for clarity",
      "End with engagement CTA",
    ],
    estimatedEngagement: "high",
    postingFrequency: "2-3x per week",
  },
  {
    id: "twitter-news",
    name: "News Commentary",
    description: "Share industry news with your take",
    platform: "twitter",
    type: "news",
    template: `[NEWS_HEADLINE]

My take:

[YOUR_PERSPECTIVE]

What this means for [AUDIENCE]:
→ [IMPLICATION]`,
    variables: ["NEWS_HEADLINE", "YOUR_PERSPECTIVE", "AUDIENCE", "IMPLICATION"],
    bestPractices: [
      "React quickly to news",
      "Add unique perspective",
      "Keep it concise",
      "Use relevant hashtags",
    ],
    estimatedEngagement: "medium",
    postingFrequency: "Daily when news breaks",
  },
  {
    id: "twitter-question",
    name: "Engagement Question",
    description: "Drive engagement with questions",
    platform: "twitter",
    type: "question",
    template: `[QUESTION]

A) [OPTION_A]
B) [OPTION_B]
C) [OPTION_C]
D) [OTHER]

Reply with your answer 👇`,
    variables: ["QUESTION", "OPTION_A", "OPTION_B", "OPTION_C", "OTHER"],
    bestPractices: [
      "Ask relevant industry questions",
      "Keep options clear",
      "Engage with replies",
      "Share results later",
    ],
    estimatedEngagement: "high",
    postingFrequency: "1-2x per week",
  },
];

/**
 * YouTube content templates
 */
const YOUTUBE_TEMPLATES: ContentTemplate[] = [
  {
    id: "youtube-tutorial",
    name: "Tutorial Video",
    description: "Educational how-to content",
    platform: "youtube",
    type: "how_to",
    template: `Title: How to [ACHIEVE_GOAL] - Complete Guide [YEAR]

Description:
In this video, you'll learn how to [ACHIEVE_GOAL] step by step.

⏰ Timestamps:
0:00 - Introduction
[TIME_1] - [SECTION_1]
[TIME_2] - [SECTION_2]
[TIME_3] - [SECTION_3]
[TIME_4] - Summary

🔗 Resources mentioned:
- [RESOURCE_1]
- [RESOURCE_2]

👉 Subscribe for more [TOPIC] content!

#[TOPIC] #Tutorial #[INDUSTRY]`,
    variables: ["ACHIEVE_GOAL", "YEAR", "TIME_1", "SECTION_1", "TIME_2", "SECTION_2", "TIME_3", "SECTION_3", "TIME_4", "RESOURCE_1", "RESOURCE_2", "TOPIC", "INDUSTRY"],
    bestPractices: [
      "Include year for freshness",
      "Add timestamps for navigation",
      "Include resource links",
      "Use relevant hashtags",
    ],
    estimatedEngagement: "high",
    postingFrequency: "1-2x per week",
  },
  {
    id: "youtube-explainer",
    name: "Explainer Video",
    description: "Explain concepts or products",
    platform: "youtube",
    type: "thought_leadership",
    template: `Title: What is [TOPIC]? [TOPIC] Explained Simply

Description:
Want to understand [TOPIC]? This video breaks it down in simple terms.

In this video:
✅ What [TOPIC] means
✅ Why it matters for [AUDIENCE]
✅ How to get started

About [BRAND_NAME]:
[BRAND_DESCRIPTION]

Subscribe: [CHANNEL_LINK]

#[TOPIC] #Explained #[INDUSTRY]`,
    variables: ["TOPIC", "AUDIENCE", "BRAND_NAME", "BRAND_DESCRIPTION", "CHANNEL_LINK", "INDUSTRY"],
    bestPractices: [
      "Use 'Explained' in title for search",
      "Cover what, why, how",
      "Include brand info",
      "Add call to subscribe",
    ],
    estimatedEngagement: "high",
    postingFrequency: "1x per week",
  },
];

// ============================================================================
// Strategy Generators
// ============================================================================

/**
 * Generate LinkedIn optimization strategy
 */
function generateLinkedInStrategy(brandData: BrandSocialData): PlatformStrategy {
  return {
    platform: "linkedin",
    config: PLATFORM_CONFIGS.linkedin,
    whyItMatters: `Claude and ChatGPT reference LinkedIn for company and people information. Your LinkedIn presence directly affects how AI describes ${brandData.name}.`,
    actions: [
      {
        actionNumber: 1,
        title: "Optimize Company Page",
        description: "Update your LinkedIn company page with keyword-rich descriptions",
        steps: [
          "Update 'About' section with your brand definition and key services",
          "Add all products/services with detailed descriptions",
          "Upload a professional banner with your value proposition",
          "Add website link and contact information",
          "Post 2-3x per week minimum",
        ],
        estimatedTime: "2 hours",
        impactScore: 85,
      },
      {
        actionNumber: 2,
        title: "Executive Visibility Program",
        description: "Boost visibility of key executives to enhance brand credibility",
        steps: [
          "Ensure CEO/Founders have complete, optimized profiles",
          "Post thought leadership content weekly",
          "Engage with industry conversations and influencers",
          "Get featured in industry publications",
          "Connect with industry leaders and potential partners",
        ],
        estimatedTime: "4 hours/week",
        impactScore: 90,
      },
      {
        actionNumber: 3,
        title: "Content Strategy Implementation",
        description: "Create a consistent content calendar",
        steps: [
          "Post mix of thought leadership, case studies, and tips",
          "Include brand name naturally in posts",
          "Use relevant industry hashtags",
          "Engage with comments within 2 hours",
          "Share employee spotlights and company culture",
        ],
        estimatedTime: "5 hours/week",
        impactScore: 80,
      },
    ],
    templates: LINKEDIN_TEMPLATES,
    postingSchedule: {
      frequency: "3-5 posts per week",
      bestTimes: [
        "Tuesday-Thursday: 8-10 AM",
        "Tuesday-Thursday: 12-1 PM",
        "Wednesday: 5-6 PM",
      ],
      contentMix: [
        { type: "Thought Leadership", percentage: 30 },
        { type: "Industry News/Commentary", percentage: 25 },
        { type: "Case Studies/Results", percentage: 20 },
        { type: "How-To/Tips", percentage: 15 },
        { type: "Company Culture", percentage: 10 },
      ],
    },
    profileOptimization: {
      items: [
        { item: "Complete 'About' section (2000 chars)", description: "Include brand definition, services, and differentiators", priority: "critical" },
        { item: "Add all products/services", description: "Each with description and benefits", priority: "critical" },
        { item: "Upload professional banner", description: "Include tagline or value proposition", priority: "high" },
        { item: "Add specialties", description: "Include all relevant industry keywords", priority: "high" },
        { item: "Enable 'Follow' button", description: "Make it easy for visitors to follow", priority: "medium" },
        { item: "Add locations", description: "Help with local search visibility", priority: "medium" },
      ],
    },
  };
}

/**
 * Generate Twitter/X optimization strategy
 */
function generateTwitterStrategy(brandData: BrandSocialData): PlatformStrategy {
  return {
    platform: "twitter",
    config: PLATFORM_CONFIGS.twitter,
    whyItMatters: `Grok (X's AI) directly references Twitter/X content. Being active on X significantly increases your visibility in Grok responses about ${brandData.name}.`,
    actions: [
      {
        actionNumber: 1,
        title: "Optimize Profile",
        description: "Make your Twitter profile AI-friendly",
        steps: [
          "Write a clear bio with brand definition",
          "Use your official brand name as display name",
          "Pin your best-performing or most important tweet",
          "Add website link",
          "Use branded profile and header images",
        ],
        estimatedTime: "30 minutes",
        impactScore: 75,
      },
      {
        actionNumber: 2,
        title: "Daily Engagement Strategy",
        description: "Build consistent presence for Grok visibility",
        steps: [
          "Tweet 1-2x daily with brand-relevant content",
          "Share industry news with your commentary",
          "Engage in industry conversations with replies",
          "Use relevant hashtags (2-3 per tweet)",
          "Retweet and quote-tweet industry leaders",
        ],
        estimatedTime: "30 minutes/day",
        impactScore: 90,
      },
      {
        actionNumber: 3,
        title: "Thread Strategy",
        description: "Create in-depth content through threads",
        steps: [
          "Publish 1-2 educational threads per week",
          "Start with a compelling hook",
          "Include brand name naturally within thread",
          "Add visuals or data to increase engagement",
          "End with a clear CTA",
        ],
        estimatedTime: "2 hours/week",
        impactScore: 85,
      },
    ],
    templates: TWITTER_TEMPLATES,
    postingSchedule: {
      frequency: "1-2 tweets daily",
      bestTimes: [
        "Weekdays: 8-9 AM",
        "Weekdays: 12-1 PM",
        "Weekdays: 5-6 PM",
      ],
      contentMix: [
        { type: "Industry Commentary", percentage: 35 },
        { type: "Educational Threads", percentage: 25 },
        { type: "Engagement/Questions", percentage: 20 },
        { type: "Product/Company Updates", percentage: 10 },
        { type: "Retweets/Curated Content", percentage: 10 },
      ],
    },
    profileOptimization: {
      items: [
        { item: "Clear brand bio (160 chars)", description: "Include what you do and for whom", priority: "critical" },
        { item: "Official brand name", description: "Use consistent brand name across platforms", priority: "critical" },
        { item: "Website link", description: "Link to your main website", priority: "high" },
        { item: "Pinned tweet", description: "Pin your best content or key message", priority: "high" },
        { item: "Professional images", description: "Use branded profile and header", priority: "medium" },
      ],
    },
  };
}

/**
 * Generate YouTube optimization strategy
 */
function generateYouTubeStrategy(brandData: BrandSocialData): PlatformStrategy {
  return {
    platform: "youtube",
    config: PLATFORM_CONFIGS.youtube,
    whyItMatters: `Gemini specifically indexes YouTube content. Video content with transcripts significantly improves ${brandData.name}'s visibility in Gemini responses.`,
    actions: [
      {
        actionNumber: 1,
        title: "Channel Setup",
        description: "Create and optimize your YouTube presence",
        steps: [
          "Create YouTube channel if you don't have one",
          "Write keyword-rich channel description",
          "Add channel keywords/tags",
          "Create custom channel banner",
          "Set up channel sections by topic",
        ],
        estimatedTime: "2 hours",
        impactScore: 70,
      },
      {
        actionNumber: 2,
        title: "Video Content Strategy",
        description: "Create AI-optimized video content",
        steps: [
          "Post how-to videos for your product/service",
          "Create explainer videos for industry concepts",
          "Add detailed descriptions with timestamps",
          "Include full transcripts in descriptions",
          "Use keyword-rich titles with year",
        ],
        estimatedTime: "4-8 hours/video",
        impactScore: 95,
      },
      {
        actionNumber: 3,
        title: "SEO Optimization",
        description: "Optimize videos for AI discovery",
        steps: [
          "Add relevant tags to all videos",
          "Create playlists by topic",
          "Add cards and end screens",
          "Enable closed captions",
          "Create custom thumbnails",
        ],
        estimatedTime: "30 minutes/video",
        impactScore: 80,
      },
    ],
    templates: YOUTUBE_TEMPLATES,
    postingSchedule: {
      frequency: "1-2 videos per week",
      bestTimes: [
        "Thursday: 2-4 PM",
        "Friday: 2-4 PM",
        "Saturday: 9-11 AM",
      ],
      contentMix: [
        { type: "How-To/Tutorials", percentage: 40 },
        { type: "Explainer Videos", percentage: 25 },
        { type: "Industry Updates", percentage: 15 },
        { type: "Case Studies/Results", percentage: 10 },
        { type: "Behind the Scenes", percentage: 10 },
      ],
    },
    profileOptimization: {
      items: [
        { item: "Keyword-rich channel description", description: "Include brand definition and content topics", priority: "critical" },
        { item: "Channel keywords", description: "Add relevant industry keywords", priority: "critical" },
        { item: "Custom channel banner", description: "Professional branding with value proposition", priority: "high" },
        { item: "Channel trailer", description: "Welcome video for new visitors", priority: "high" },
        { item: "Organized playlists", description: "Group content by topic", priority: "medium" },
      ],
    },
  };
}

// ============================================================================
// Main Generator Functions
// ============================================================================

/**
 * Generate a complete social media guide for a brand
 */
export function generateSocialMediaGuide(brandData: BrandSocialData): SocialMediaGuide {
  const strategies: PlatformStrategy[] = [
    generateLinkedInStrategy(brandData),
    generateTwitterStrategy(brandData),
    generateYouTubeStrategy(brandData),
  ];

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  strategies.sort((a, b) => priorityOrder[a.config.priority] - priorityOrder[b.config.priority]);

  const priorityPlatforms = strategies
    .filter(s => s.config.priority === "critical" || s.config.priority === "high")
    .map(s => s.platform);

  return {
    brandName: brandData.name,
    generatedAt: new Date(),
    version: "1.0.0",
    summary: {
      totalPlatforms: strategies.length,
      priorityPlatforms,
      estimatedTimePerWeek: "10-15 hours",
      expectedImpact: "+15-25 GEO points with consistent execution",
    },
    strategies,
    executiveTakeaways: [
      `LinkedIn is critical for ${brandData.name}'s AI visibility - Claude and ChatGPT use it as a primary source`,
      `Twitter/X directly feeds Grok AI - active presence required for Grok visibility`,
      `YouTube is indexed heavily by Gemini - video content significantly improves visibility`,
      `Consistent posting (3-5x/week on LinkedIn, daily on Twitter) is key to maintaining AI visibility`,
      `Include your brand name naturally in all posts to reinforce AI recognition`,
    ],
    monthlyCalendar: generateMonthlyCalendar(brandData, strategies),
  };
}

/**
 * Generate a monthly content calendar
 */
function generateMonthlyCalendar(
  brandData: BrandSocialData,
  strategies: PlatformStrategy[]
): MonthlyCalendarEntry[] {
  const calendar: MonthlyCalendarEntry[] = [];
  const contentTypes = [
    { type: "Industry News", template: "Share and comment on recent industry developments" },
    { type: "How-To Guide", template: "Educational content solving customer problems" },
    { type: "Case Study", template: "Customer success story with specific results" },
    { type: "Data/Research", template: "Original statistics or survey findings" },
  ];

  for (let week = 1; week <= 4; week++) {
    strategies.forEach(strategy => {
      const content = contentTypes[(week - 1) % contentTypes.length];
      calendar.push({
        week,
        platform: strategy.platform,
        contentType: content.type,
        topic: `${brandData.industry} ${content.type.toLowerCase()}`,
        template: content.template,
      });
    });
  }

  return calendar;
}

/**
 * Get platform strategy by platform
 */
export function getPlatformStrategy(
  brandData: BrandSocialData,
  platform: SocialPlatform
): PlatformStrategy | null {
  switch (platform) {
    case "linkedin":
      return generateLinkedInStrategy(brandData);
    case "twitter":
      return generateTwitterStrategy(brandData);
    case "youtube":
      return generateYouTubeStrategy(brandData);
    default:
      return null;
  }
}

/**
 * Get all content templates for a platform
 */
export function getContentTemplates(platform: SocialPlatform): ContentTemplate[] {
  switch (platform) {
    case "linkedin":
      return LINKEDIN_TEMPLATES;
    case "twitter":
      return TWITTER_TEMPLATES;
    case "youtube":
      return YOUTUBE_TEMPLATES;
    default:
      return [];
  }
}

/**
 * Get platform config
 */
export function getPlatformConfig(platform: SocialPlatform): PlatformConfig {
  return PLATFORM_CONFIGS[platform];
}

/**
 * Get priority platforms for AI visibility
 */
export function getPriorityPlatforms(): SocialPlatform[] {
  return Object.values(PLATFORM_CONFIGS)
    .filter(config => config.priority === "critical" || config.priority === "high")
    .map(config => config.platform);
}

/**
 * Calculate total AI platform impact for a given social platform
 */
export function calculateTotalAIImpact(platform: SocialPlatform): number {
  const config = PLATFORM_CONFIGS[platform];
  const scores = Object.values(config.aiPlatformImpact);
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

/**
 * Generate posting schedule for a platform
 */
export function getPostingSchedule(platform: SocialPlatform): PostingSchedule {
  const strategyMap: Partial<Record<SocialPlatform, PlatformStrategy>> = {
    linkedin: generateLinkedInStrategy({ name: "Brand", industry: "Technology", description: "Test" }),
    twitter: generateTwitterStrategy({ name: "Brand", industry: "Technology", description: "Test" }),
    youtube: generateYouTubeStrategy({ name: "Brand", industry: "Technology", description: "Test" }),
  };

  const strategy = strategyMap[platform];

  return strategy?.postingSchedule || {
    frequency: "Unknown",
    bestTimes: [],
    contentMix: [],
  };
}

/**
 * Fill a template with brand-specific data
 */
export function fillTemplate(
  template: ContentTemplate,
  variables: Record<string, string>
): string {
  let filledContent = template.template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `[${key}]`;
    filledContent = filledContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), value);
  }

  return filledContent;
}

/**
 * Convert brand data from database to social data format
 */
export function brandToSocialData(brand: Partial<Brand>): BrandSocialData {
  // Extract competitor names from BrandCompetitor objects
  const competitorNames = brand.competitors
    ? brand.competitors.map((c) => c.name)
    : [];

  // Extract social handles from socialLinks JSON field
  const socialLinks = brand.socialLinks || {};

  return {
    name: brand.name || "Unknown Brand",
    industry: brand.industry || "Technology",
    description: brand.description || "",
    targetAudience: brand.voice?.targetAudience || undefined,
    competitors: competitorNames,
    socialHandles: {
      linkedin: socialLinks.linkedin || undefined,
      twitter: socialLinks.twitter || undefined,
      youtube: socialLinks.youtube || undefined,
      facebook: socialLinks.facebook || undefined,
      instagram: socialLinks.instagram || undefined,
    },
  };
}
