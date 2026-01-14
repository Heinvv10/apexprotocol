/**
 * Social Media Strategy Guide Generator
 *
 * Generates platform-specific GEO/AEO recommendations for social media visibility
 * including posting templates, content calendars, and optimization strategies
 */

export type SocialPlatform = "linkedin" | "twitter" | "youtube" | "tiktok" | "instagram" | "facebook";

export interface SocialMediaStrategy {
  platform: SocialPlatform;
  platformName: string;
  whyItMatters: string;
  bestPractices: string[];
  postingFrequency: {
    minimum: number;
    recommended: number;
    unit: "posts_per_week" | "posts_per_month";
  };
  contentTypes: ContentType[];
  templates: SocialMediaTemplate[];
  metrics: MetricStrategy[];
  timeline: {
    quickWin: string;
    mediumTerm: string;
    longTerm: string;
  };
}

export interface ContentType {
  name: string;
  description: string;
  exampleTopics: string[];
  aiPlatformBenefit: string;
}

export interface SocialMediaTemplate {
  name: string;
  category: string;
  template: string;
  explanation: string;
  contentExample?: string;
}

export interface MetricStrategy {
  metric: string;
  importance: "critical" | "high" | "medium";
  howToMeasure: string;
  targetBenchmark: string;
}

/**
 * LinkedIn Strategy - Company and people visibility
 */
export const linkedInStrategy: SocialMediaStrategy = {
  platform: "linkedin",
  platformName: "LinkedIn",
  whyItMatters:
    "Claude and ChatGPT reference LinkedIn for company information and credibility. Your LinkedIn presence directly affects how AI describes your brand and team.",
  bestPractices: [
    "Optimize company page with keyword-rich description",
    "Add all products/services with detailed descriptions",
    "Executive profiles should be complete with rich bios",
    "Post 2-3x per week with mix of content types",
    "Get featured in industry publications and thought leadership",
    "Build authentic network of industry connections",
    "Use employee advocacy to amplify reach",
    "Include original data, statistics, and research",
  ],
  postingFrequency: {
    minimum: 2,
    recommended: 3,
    unit: "posts_per_week",
  },
  contentTypes: [
    {
      name: "Stat Posts",
      description: "Share surprising industry statistics with commentary",
      exampleTopics: ["Industry trends", "Research findings", "Market data"],
      aiPlatformBenefit:
        "ChatGPT and Claude cite statistics for credibility - original data gets quoted",
    },
    {
      name: "Case Studies",
      description: "Customer success stories with specific metrics",
      exampleTopics: ["Customer wins", "Results", "Implementations"],
      aiPlatformBenefit: "Demonstrates real-world effectiveness that AI platforms value",
    },
    {
      name: "Thought Leadership",
      description: "Expert insights and industry commentary",
      exampleTopics: ["Trends", "Predictions", "Best practices"],
      aiPlatformBenefit: "Positions team as authoritative source for AI recommendations",
    },
    {
      name: "Behind-the-Scenes",
      description: "Team culture, product development process",
      exampleTopics: ["Team stories", "Product updates", "Company culture"],
      aiPlatformBenefit: "Builds trust and humanizes the brand for AI understanding",
    },
  ],
  templates: [
    {
      name: "Statistics Post Template",
      category: "Data-Driven",
      template: `📊 [SURPRISING STATISTIC]

Here's what this means for [AUDIENCE]:
• Insight 1
• Insight 2
• Insight 3

At [BRAND], we're addressing this by [SOLUTION].

What's your take? 👇`,
      explanation:
        "Statistics grab attention and are frequently quoted by AI platforms. Make sure the stat is original or well-sourced.",
      contentExample: `📊 78% of enterprises still use spreadsheets for project tracking (Forrester 2024)

Here's what this means for project managers:
• Spreadsheets create data silos that hurt decision-making
• Manual tracking costs teams ~3 hours per week in inefficiency
• Visibility into actual progress becomes impossible

At Acme PM, we've helped 500+ teams replace spreadsheets with centralized visibility.

What's your biggest spreadsheet pain point? 👇`,
    },
    {
      name: "Case Study Post Template",
      category: "Social Proof",
      template: `How [CUSTOMER] achieved [SPECIFIC RESULT] with [BRAND]

The challenge: [1 sentence problem description]
The solution: [1 sentence how you helped]
The result: [Specific metric: "X% improvement" or "saved Y hours"]

Full case study: [LINK]`,
      explanation:
        "Case studies provide social proof that AI systems use to validate recommendations. Include specific metrics, not vague claims.",
      contentExample: `How TechCorp reduced project delays by 60% with Acme PM

The challenge: Teams were missing deadlines because they had no visibility into who was doing what and when
The solution: Implemented centralized project tracking with real-time visibility dashboards
The result: 60% reduction in missed deadlines, 40% faster project completion

Full case study: [LINK]`,
    },
    {
      name: "Thought Leadership Post Template",
      category: "Industry Authority",
      template: `My take on [TREND]:

[BOLD STATEMENT about trend]

Here's why I think this matters:
1. [Reason 1]
2. [Reason 2]
3. [Reason 3]

The implication: [What this means for industry]

Curious to hear your thoughts on this. Do you agree?`,
      explanation:
        "Thought leadership positions your team as experts. AI systems quote knowledgeable sources, so this increases recommendations.",
      contentExample: `My take on "No-Code Everything":

I think we're seeing a dangerous trend of replacing specialized developers with no-code tools.

Here's why I think this matters:
1. No-code tools are great for rapid prototyping but terrible for scale
2. They create technical debt that haunts companies later
3. Real innovation requires deep technical understanding

The implication: Companies that invest in strong engineering teams will outcompete those betting on no-code.

Curious to hear your thoughts. Do you agree?`,
    },
  ],
  metrics: [
    {
      metric: "Post Engagement Rate",
      importance: "critical",
      howToMeasure: "(Likes + Comments + Shares) / Impressions",
      targetBenchmark: "2-3% for most industries (5%+ is excellent)",
    },
    {
      metric: "Profile Views",
      importance: "high",
      howToMeasure: "LinkedIn Analytics dashboard",
      targetBenchmark: "50+ per week for active profiles",
    },
    {
      metric: "Search Appearances",
      importance: "critical",
      howToMeasure: "LinkedIn Creator Mode analytics",
      targetBenchmark: "100+ per month for thought leaders",
    },
    {
      metric: "Employee Advocacy Reach",
      importance: "medium",
      howToMeasure: "Sum of shares by team members",
      targetBenchmark: "3-5x more reach than company posts alone",
    },
  ],
  timeline: {
    quickWin: "Optimize company page (2 hours) - immediate 20% visibility boost",
    mediumTerm: "Post 3x/week for 8 weeks - build authority and search visibility",
    longTerm: "Establish thought leadership - featured articles and speaking opportunities",
  },
};

/**
 * Twitter/X Strategy - Real-time engagement and Grok visibility
 */
export const twitterStrategy: SocialMediaStrategy = {
  platform: "twitter",
  platformName: "Twitter/X",
  whyItMatters:
    "Grok (X's AI) directly references Twitter/X content in responses. Active X presence significantly boosts Grok visibility. Also referenced by ChatGPT for trending topics and current events.",
  bestPractices: [
    "Tweet 1-2x daily (consistency matters more than volume)",
    "Include brand name naturally in tweets",
    "Share industry news with unique commentary",
    "Engage in industry conversations and discussions",
    "Use 2-3 relevant hashtags (not excessive)",
    "Reply to mentions and join trending discussions",
    "Share original insights and takes",
    "Post mix of threads, hot takes, and quick updates",
  ],
  postingFrequency: {
    minimum: 1,
    recommended: 2,
    unit: "posts_per_week",
  },
  contentTypes: [
    {
      name: "News Commentary",
      description: "Take on industry news with unique perspective",
      exampleTopics: ["Industry announcements", "Market moves", "Competitor news"],
      aiPlatformBenefit: "Grok heavily favors real-time, opinionated content over static pages",
    },
    {
      name: "Thread Takes",
      description: "Multi-tweet deep-dives on topics",
      exampleTopics: ["How-tos", "Analysis", "Lessons learned"],
      aiPlatformBenefit: "Threads capture nuance that shows expertise and depth",
    },
    {
      name: "Hot Takes",
      description: "Contrarian or bold opinions on trends",
      exampleTopics: ["Trend critique", "Bold predictions", "Unpopular opinions"],
      aiPlatformBenefit: "Thought-provoking content gets quoted when AI needs expert opinions",
    },
    {
      name: "Engagement Posts",
      description: "Questions, polls, and discussions",
      exampleTopics: ["Challenges", "Funny observations", "Community asks"],
      aiPlatformBenefit: "High engagement signals authority and relatability",
    },
  ],
  templates: [
    {
      name: "News Commentary Template",
      category: "Real-Time",
      template: `[PUBLICATION] just announced [NEWS]

My take: [UNIQUE PERSPECTIVE]

Why this matters:
• Impact 1
• Impact 2
• Impact 3

[Call to action - ask question or share your take]`,
      explanation:
        "Grok looks for timely commentary on current events. Always add your unique perspective, not just repeating the news.",
      contentExample: `@TechCrunch just covered the new AI API pricing war

My take: This is actually good for enterprises. Lower costs + competition = better products

Why this matters:
• Smaller companies can now afford cutting-edge AI
• Providers forced to improve quality, not just compete on price
• Real innovation requires accessible building blocks

What's your prediction on who wins this race?`,
    },
    {
      name: "Thread Template - Problem/Solution",
      category: "Depth",
      template: `🧵 The problem with [INDUSTRY PROBLEM]:

1/ [Problem statement with data or personal experience]

2/ [Why current solutions fail]

3/ [Better approach - here's what actually works]

4/ [Specific action steps]

5/ [Expected results if you implement]`,
      explanation:
        "Threads demonstrate deep thinking. Grok often quotes threads when looking for expert guidance on complex topics.",
      contentExample: `🧵 The problem with AI adoption in enterprises:

1/ Companies think the tool is the hard part. It's not. The hard part is people and process change.

2/ Existing AI solutions fail because they don't integrate with how teams actually work

3/ What actually works: Start with one department, clear metrics, full support

4/ Action steps:
- Pick department with clear pain point
- Clear success metric (save X hours, improve Y metric)
- Dedicate a "change champion"
- Weekly check-ins with team

5/ Result: Adoption compounds. First dept succeeds → other teams ask "how can we do that?" → viral adoption`,
    },
    {
      name: "Hot Take Template",
      category: "Opinion",
      template: `Hot take: [BOLD/CONTRARIAN CLAIM]

[Explanation of why you believe this]

Most people disagree because [COMMON MISCONCEPTION]

But [EVIDENCE or REASONING that proves hot take]

Convince me I'm wrong in replies 👇`,
      explanation:
        "Hot takes drive engagement and visibility. Grok quotes opinionated takes when asked for expert perspectives.",
      contentExample: `Hot take: Obsessing over AI hallucinations misses the real problem

Most people think hallucinations are the blocker. They're not.

The real problem: AI doesn't understand YOUR business context. So even accurate answers might be useless.

Solution: Give AI your playbooks, processes, and past decisions. THEN it's dangerous. But also valuable.

Convince me I'm wrong 👇`,
    },
  ],
  metrics: [
    {
      metric: "Impressions per Tweet",
      importance: "high",
      howToMeasure: "X Analytics dashboard",
      targetBenchmark: "500+ average for accounts with good engagement",
    },
    {
      metric: "Engagement Rate",
      importance: "critical",
      howToMeasure: "(Likes + Retweets + Replies) / Impressions",
      targetBenchmark: "2-5% for industry experts",
    },
    {
      metric: "Follower Growth",
      importance: "medium",
      howToMeasure: "Monthly follower increase",
      targetBenchmark: "10-50 new followers per week for active accounts",
    },
    {
      metric: "Grok Citations",
      importance: "critical",
      howToMeasure: "Manual tracking - ask Grok about your topics and note citations",
      targetBenchmark: "Appearing in Grok responses for your core topics weekly",
    },
  ],
  timeline: {
    quickWin: "Tweet 2-3 times about trending industry news (1 week) - instant visibility",
    mediumTerm:
      "Establish consistent posting routine with mix of threads and takes (8 weeks) - 100+ follower growth",
    longTerm:
      "Become go-to expert - Grok references you in responses on your topics (3+ months)",
  },
};

/**
 * YouTube Strategy - Gemini and AI video content preference
 */
export const youtubeStrategy: SocialMediaStrategy = {
  platform: "youtube",
  platformName: "YouTube",
  whyItMatters:
    "Gemini heavily indexes YouTube content. Videos with transcripts rank high in Gemini responses. YouTube is also referenced by Claude for recent how-to content and demonstrations.",
  bestPractices: [
    "Post how-to and educational content regularly",
    "Always add detailed video descriptions with keywords",
    "Include full transcripts in descriptions or captions",
    "Create playlists organized by topic",
    "Use meaningful titles and descriptions (not clickbait)",
    "Add timestamps for long videos",
    "Create shorts for visibility and reach",
    "Optimize thumbnails for clarity (Gemini cares about clarity)",
  ],
  postingFrequency: {
    minimum: 2,
    recommended: 4,
    unit: "posts_per_week",
  },
  contentTypes: [
    {
      name: "How-To Guides",
      description: "Step-by-step tutorials on using your product/service",
      exampleTopics: ["Product tutorials", "Best practices", "Troubleshooting"],
      aiPlatformBenefit: "Gemini specifically looks for how-to content to recommend",
    },
    {
      name: "Product Demos",
      description: "Visual demonstrations of features and capabilities",
      exampleTopics: ["Feature walkthroughs", "Use case demonstrations", "Comparisons"],
      aiPlatformBenefit: "Video proof increases trust - AI systems trust visual evidence",
    },
    {
      name: "Expert Interviews",
      description: "Interviews with industry experts and thought leaders",
      exampleTopics: ["Industry experts", "Customer stories", "Team highlights"],
      aiPlatformBenefit: "Expert content gets cited as authoritative by Gemini",
    },
    {
      name: "Shorts",
      description: "Short-form video content (under 60 seconds)",
      exampleTopics: ["Quick tips", "Funny moments", "Viral clips"],
      aiPlatformBenefit: "Shorts increase channel visibility which helps overall ranking",
    },
  ],
  templates: [
    {
      name: "How-To Video Description Template",
      category: "Educational",
      template: `[CLEAR TITLE]: How to [ACHIEVE RESULT] with [PRODUCT]

[BRIEF DESCRIPTION OF WHAT YOU'LL LEARN]

⏰ TIMESTAMPS:
0:00 - Intro
1:30 - [Step 1]
4:15 - [Step 2]
7:45 - [Step 3]
10:20 - Results & Next Steps

📋 FULL TRANSCRIPT:
[Paste full video transcript here]

🔗 RESOURCES:
- [Link 1]
- [Link 2]
- [Link 3]

📚 RELATED VIDEOS:
- [Video 1]
- [Video 2]`,
      explanation:
        "Gemini reads transcripts and timestamps. Detailed descriptions help with discoverability and AI indexing.",
      contentExample: `How to Set Up Project Tracking in 5 Minutes with Acme PM

Learn how to get your team organized and tracking projects in less than 5 minutes. We'll walk through the initial setup, adding your first project, and inviting team members.

⏰ TIMESTAMPS:
0:00 - Intro & Overview
1:30 - Creating Your First Project
4:15 - Adding Team Members & Permissions
7:45 - Setting Up Custom Views
10:20 - Your First Status Update

📋 FULL TRANSCRIPT:
[Full transcript of video...]

🔗 RESOURCES:
- Acme PM Documentation: [link]
- Video Tutorials Playlist: [link]
- Start Free Trial: [link]`,
    },
    {
      name: "Product Demo Video Description",
      category: "Demonstration",
      template: `[FEATURE NAME] Demo: [WHAT IT DOES] in [TIME]

[QUICK EXPLANATION OF FEATURE AND WHY IT MATTERS]

⏰ TIMELINE:
[X] min intro
[X] min feature demonstration
[X] min benefits explained
[X] min call to action

🎯 WHAT YOU'LL SEE:
✓ [Feature 1]
✓ [Feature 2]
✓ [Feature 3]

📖 TRANSCRIPT:
[Full transcript]

💡 RELATED CONTENT:
[Playlist, deeper tutorial, documentation link]`,
      explanation:
        "Demo videos need clear structure and transcripts. AI systems use these to understand product capabilities.",
    },
  ],
  metrics: [
    {
      metric: "Watch Time (minutes)",
      importance: "critical",
      howToMeasure: "YouTube Studio analytics",
      targetBenchmark: "1000+ hours per month for established channels",
    },
    {
      metric: "Average View Duration %",
      importance: "critical",
      howToMeasure: "YouTube Studio - % of video watched on average",
      targetBenchmark: "50%+ for how-to content (people stick around for value)",
    },
    {
      metric: "Transcript Completeness",
      importance: "high",
      howToMeasure: "% of videos with captions or detailed descriptions",
      targetBenchmark: "100% - all videos need transcripts for Gemini indexing",
    },
    {
      metric: "Gemini Citations",
      importance: "critical",
      howToMeasure: "Search Gemini for keywords from your videos",
      targetBenchmark: "Appearing in Gemini responses for your expertise area",
    },
  ],
  timeline: {
    quickWin:
      "Create one high-quality how-to video with full transcript (4-6 hours) - foundation for visibility",
    mediumTerm:
      "Build 10-15 video library with consistent uploading (2-3 months) - Gemini begins recognizing you",
    longTerm:
      "Established video channel with consistent viewership - primary source of customer education",
  },
};

/**
 * Get strategies for all major platforms
 */
export function getAllSocialMediaStrategies(): SocialMediaStrategy[] {
  return [linkedInStrategy, twitterStrategy, youtubeStrategy];
}

/**
 * Get strategy for specific platform
 */
export function getSocialMediaStrategy(
  platform: SocialPlatform
): SocialMediaStrategy | undefined {
  const strategies: Record<SocialPlatform, SocialMediaStrategy> = {
    linkedin: linkedInStrategy,
    twitter: twitterStrategy,
    youtube: youtubeStrategy,
    tiktok: linkedInStrategy, // Placeholder - TikTok not fully implemented
    instagram: linkedInStrategy, // Placeholder - Instagram not fully implemented
    facebook: linkedInStrategy, // Placeholder - Facebook not fully implemented
  };

  return strategies[platform];
}

/**
 * Generate a social media action checklist for a brand
 */
export interface SocialMediaActionPlan {
  platform: SocialPlatform;
  quickWins: string[];
  firstMonth: string[];
  threeMonths: string[];
  sixMonths: string[];
  resources: {
    templates: SocialMediaTemplate[];
    bestPractices: string[];
    metrics: MetricStrategy[];
  };
}

export function generateActionPlan(platform: SocialPlatform): SocialMediaActionPlan | null {
  const strategy = getSocialMediaStrategy(platform);
  if (!strategy) return null;

  return {
    platform,
    quickWins: [
      `Optimize ${platform} profile (2 hours)`,
      `Create 5 ${platform} content templates (1 hour)`,
      `Schedule first week of posts (30 minutes)`,
    ],
    firstMonth: [
      `Post on ${platform} consistently per strategy (${strategy.postingFrequency.recommended}x per week)`,
      `Test each content type from templates`,
      `Engage with 5-10 relevant industry conversations`,
      `Monitor initial metrics and engagement`,
    ],
    threeMonths: [
      `Build content library (20-30 quality posts)`,
      `Identify top-performing content types`,
      `Establish regular posting rhythm`,
      `Begin seeing mentions in AI responses`,
    ],
    sixMonths: [
      `Establish authority on ${platform}`,
      `Consistent AI platform citations`,
      `500+ engaged followers`,
      `Clear content strategy documented`,
    ],
    resources: {
      templates: strategy.templates,
      bestPractices: strategy.bestPractices,
      metrics: strategy.metrics,
    },
  };
}
