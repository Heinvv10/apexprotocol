/**
 * Database Seed Script for Apex GEO/AEO Platform
 * Creates comprehensive demo data for all dashboard features
 *
 * Usage: npx tsx scripts/seed.ts
 * Usage: npx tsx scripts/seed.ts --clean (to reset demo data)
 */

import { db, schema } from '../src/lib/db';

import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

config({ path: ".env.local" });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
const shouldClean = process.argv.includes("--clean");

// Generate stable IDs for relationships
const ids = {
  org: createId(),
  users: [createId(), createId()],
  brands: [createId(), createId(), createId()],
};

// Helper to generate dates in the past N days
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Helper to pick random item from array
function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// AI Platforms
const platforms = ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"] as const;
const sentiments = ["positive", "neutral", "negative"] as const;
const promptCategories = ["comparison", "recommendation", "review", "question", "research"];

// Brand-specific data
const brandConfigs = [
  {
    name: "TechFlow Solutions",
    domain: "techflow.io",
    description: "Enterprise SaaS platform for workflow automation and team productivity",
    tagline: "Automate. Collaborate. Accelerate.",
    industry: "Technology",
    logoUrl: "https://ui-avatars.com/api/?name=TF&background=4F46E5&color=fff&size=128",
    keywords: ["workflow automation", "team productivity", "SaaS", "enterprise software"],
    seoKeywords: ["workflow automation software", "team collaboration tools", "enterprise productivity platform"],
    geoKeywords: ["best workflow automation tool", "top productivity software 2024", "enterprise SaaS solutions"],
    competitors: [
      { name: "Monday.com", url: "https://monday.com", reason: "Direct competitor in work management" },
      { name: "Asana", url: "https://asana.com", reason: "Project management overlap" },
      { name: "Notion", url: "https://notion.so", reason: "All-in-one workspace competitor" },
    ],
    valuePropositions: [
      "50% faster project completion",
      "AI-powered task automation",
      "Enterprise-grade security",
    ],
    voice: {
      tone: "professional" as const,
      personality: ["innovative", "reliable", "efficient"],
      targetAudience: "CTOs and IT managers at mid-to-large enterprises",
      keyMessages: ["Transform your workflow", "Built for enterprise scale"],
      avoidTopics: ["competitor bashing", "unrealistic promises"],
    },
    queries: [
      "What's the best workflow automation tool for enterprises?",
      "Compare Monday.com vs TechFlow Solutions",
      "Top SaaS productivity platforms 2024",
      "Which project management tool has the best AI features?",
      "Enterprise workflow automation recommendations",
    ],
  },
  {
    name: "GreenLeaf Organics",
    domain: "greenleaforganics.com",
    description: "Premium organic food delivery service with farm-to-table freshness",
    tagline: "Fresh from farm to your family",
    industry: "Food & Beverage",
    logoUrl: "https://ui-avatars.com/api/?name=GL&background=22C55E&color=fff&size=128",
    keywords: ["organic food", "farm to table", "food delivery", "healthy eating"],
    seoKeywords: ["organic food delivery", "farm fresh produce", "healthy meal delivery"],
    geoKeywords: ["best organic food delivery service", "where to buy organic produce online", "healthiest meal delivery"],
    competitors: [
      { name: "HelloFresh", url: "https://hellofresh.com", reason: "Meal kit delivery competitor" },
      { name: "Thrive Market", url: "https://thrivemarket.com", reason: "Organic food e-commerce" },
      { name: "Imperfect Foods", url: "https://imperfectfoods.com", reason: "Sustainable food delivery" },
    ],
    valuePropositions: [
      "100% certified organic",
      "Same-day farm-to-door delivery",
      "Zero-waste packaging",
    ],
    voice: {
      tone: "friendly" as const,
      personality: ["warm", "sustainable", "health-conscious"],
      targetAudience: "Health-conscious families and environmentally aware consumers",
      keyMessages: ["Nourish your family naturally", "Sustainable from seed to table"],
      avoidTopics: ["processed foods", "non-organic options"],
    },
    queries: [
      "Best organic food delivery services",
      "Where can I get farm-fresh produce delivered?",
      "Compare organic meal kit services",
      "Most sustainable food delivery options",
      "Healthiest meal delivery for families",
    ],
  },
  {
    name: "FinanceHub Pro",
    domain: "financehubpro.com",
    description: "AI-powered personal finance management and investment advisory platform",
    tagline: "Your wealth, intelligently managed",
    industry: "Financial Services",
    logoUrl: "https://ui-avatars.com/api/?name=FH&background=0EA5E9&color=fff&size=128",
    keywords: ["personal finance", "investment management", "AI finance", "wealth management"],
    seoKeywords: ["AI investment advisor", "personal finance app", "wealth management platform"],
    geoKeywords: ["best AI finance app", "top investment management tools", "smartest budgeting app"],
    competitors: [
      { name: "Mint", url: "https://mint.com", reason: "Personal finance management" },
      { name: "Personal Capital", url: "https://personalcapital.com", reason: "Wealth management" },
      { name: "Betterment", url: "https://betterment.com", reason: "Robo-advisor competitor" },
    ],
    valuePropositions: [
      "AI-driven investment insights",
      "Bank-level security (256-bit encryption)",
      "Personalized financial roadmap",
    ],
    voice: {
      tone: "authoritative" as const,
      personality: ["trustworthy", "intelligent", "empowering"],
      targetAudience: "Young professionals and first-time investors seeking smart money management",
      keyMessages: ["Take control of your financial future", "AI that works for your wealth"],
      avoidTopics: ["get rich quick schemes", "guaranteed returns"],
    },
    queries: [
      "Best AI-powered investment apps",
      "Which personal finance app should I use?",
      "Compare robo-advisors 2024",
      "Top budgeting apps with investment features",
      "Is FinanceHub Pro better than Mint?",
    ],
  },
];

// Generate realistic mentions for a brand
function generateMentions(brandId: string, brandConfig: typeof brandConfigs[0]): schema.NewBrandMention[] {
  const mentions: schema.NewBrandMention[] = [];

  // Generate 60 mentions spread over 30 days
  for (let i = 0; i < 60; i++) {
    const platform = randomItem(platforms);
    const sentiment = randomItem(sentiments);
    const daysBack = Math.floor(Math.random() * 30);
    const query = randomItem(brandConfig.queries);

    // Generate realistic response based on sentiment
    const responses: Record<string, string[]> = {
      positive: [
        `${brandConfig.name} is highly recommended for ${brandConfig.industry.toLowerCase()}. Their ${brandConfig.valuePropositions[0]} makes them stand out from competitors.`,
        `Based on user reviews and features, ${brandConfig.name} offers excellent value. Key strengths include ${brandConfig.keywords.slice(0, 2).join(" and ")}.`,
        `I'd recommend ${brandConfig.name} - they're known for ${brandConfig.tagline.toLowerCase()} and have strong customer satisfaction ratings.`,
      ],
      neutral: [
        `${brandConfig.name} is one option in the ${brandConfig.industry.toLowerCase()} space. They offer ${brandConfig.keywords[0]} services, similar to ${brandConfig.competitors[0].name}.`,
        `There are several options including ${brandConfig.name}, ${brandConfig.competitors[0].name}, and ${brandConfig.competitors[1].name}. Each has different strengths.`,
        `${brandConfig.name} provides ${brandConfig.description.toLowerCase()}. Consider your specific needs when comparing options.`,
      ],
      negative: [
        `While ${brandConfig.name} has some features, users have reported ${brandConfig.competitors[0].name} offers better value in this category.`,
        `${brandConfig.name} may not be the best choice if you're looking for ${brandConfig.keywords[2]}. Consider alternatives like ${brandConfig.competitors[1].name}.`,
        `Some users prefer ${brandConfig.competitors[0].name} over ${brandConfig.name} due to pricing and feature differences.`,
      ],
    };

    const position = sentiment === "positive" ? Math.floor(Math.random() * 3) + 1 :
                     sentiment === "neutral" ? Math.floor(Math.random() * 3) + 3 :
                     Math.floor(Math.random() * 4) + 5;

    mentions.push({
      id: createId(),
      brandId,
      platform,
      query,
      response: randomItem(responses[sentiment]),
      sentiment,
      position: Math.random() > 0.3 ? position : null, // 70% have position
      citationUrl: Math.random() > 0.6 ? `https://${brandConfig.domain}` : null, // 40% have citation
      competitors: brandConfig.competitors.slice(0, 2).map((c, idx) => ({
        name: c.name,
        position: position + idx + 1,
        sentiment: randomItem(sentiments),
      })),
      promptCategory: randomItem(promptCategories),
      topics: brandConfig.keywords.slice(0, Math.floor(Math.random() * 3) + 1),
      metadata: {
        modelVersion: platform === "chatgpt" ? "gpt-4" : platform === "claude" ? "claude-3" : "latest",
        responseLength: Math.floor(Math.random() * 500) + 100,
        confidenceScore: Math.random() * 0.3 + 0.7, // 0.7-1.0
      },
      timestamp: daysAgo(daysBack),
    });
  }

  return mentions;
}

// Generate recommendations for a brand
function generateRecommendations(brandId: string, brandConfig: typeof brandConfigs[0]): schema.NewRecommendation[] {
  const categories = [
    "technical_seo",
    "content_optimization",
    "schema_markup",
    "citation_building",
    "brand_consistency",
    "competitor_analysis",
    "content_freshness",
    "authority_building",
  ] as const;

  const priorities = ["critical", "high", "medium", "low"] as const;
  const statuses = ["pending", "in_progress", "completed", "dismissed"] as const;
  const efforts = ["quick_win", "moderate", "major"] as const;
  const impacts = ["high", "medium", "low"] as const;
  const sources = ["audit", "monitoring", "content", "manual"] as const;

  // Helper to convert simple step strings to ImplementationStep objects
  const toSteps = (steps: string[]): schema.ImplementationStep[] =>
    steps.map((instruction, index) => ({
      stepNumber: index + 1,
      instruction,
    }));

  const recommendationTemplates = [
    {
      category: "schema_markup" as const,
      title: "Add Organization Schema",
      description: "Your website is missing Organization schema markup, which helps AI systems understand your brand identity.",
      steps: toSteps(["Create Organization JSON-LD", "Add to website header", "Validate with Google Rich Results Test"]),
      priority: "high" as const,
      effort: "quick_win" as const,
      impact: "high" as const,
    },
    {
      category: "schema_markup" as const,
      title: "Implement FAQ Schema",
      description: "Add FAQ schema to your frequently asked questions to increase chances of AI citation.",
      steps: toSteps(["Identify top 10 FAQs", "Format as FAQ schema", "Deploy to FAQ page"]),
      priority: "high" as const,
      effort: "moderate" as const,
      impact: "high" as const,
    },
    {
      category: "content_optimization" as const,
      title: "Optimize for Question-Based Queries",
      description: "Create content that directly answers common questions in your industry.",
      steps: toSteps(["Research question keywords", "Create Q&A content sections", "Structure with proper headers"]),
      priority: "medium" as const,
      effort: "moderate" as const,
      impact: "high" as const,
    },
    {
      category: "citation_building" as const,
      title: "Build Authoritative Backlinks",
      description: "Increase domain authority through quality backlinks from industry publications.",
      steps: toSteps(["Identify target publications", "Create linkable assets", "Outreach to editors"]),
      priority: "medium" as const,
      effort: "major" as const,
      impact: "high" as const,
    },
    {
      category: "technical_seo" as const,
      title: "Improve Core Web Vitals",
      description: "Your LCP score needs improvement for better AI crawlability.",
      steps: toSteps(["Optimize images", "Implement lazy loading", "Reduce server response time"]),
      priority: "high" as const,
      effort: "moderate" as const,
      impact: "medium" as const,
    },
    {
      category: "brand_consistency" as const,
      title: "Standardize Brand Mentions",
      description: "Ensure consistent brand name usage across all platforms and content.",
      steps: toSteps(["Audit existing content", "Create brand style guide", "Update inconsistent mentions"]),
      priority: "medium" as const,
      effort: "moderate" as const,
      impact: "medium" as const,
    },
    {
      category: "competitor_analysis" as const,
      title: `Analyze ${brandConfig.competitors[0].name} Content Strategy`,
      description: `Study competitor content that's getting cited by AI to identify gaps.`,
      steps: toSteps(["Monitor competitor mentions", "Identify content gaps", "Create superior content"]),
      priority: "medium" as const,
      effort: "moderate" as const,
      impact: "medium" as const,
    },
    {
      category: "content_freshness" as const,
      title: "Update Outdated Content",
      description: "Several pages haven't been updated in 6+ months, reducing AI citation probability.",
      steps: toSteps(["Identify stale content", "Update with current data", "Add publish dates"]),
      priority: "medium" as const,
      effort: "moderate" as const,
      impact: "medium" as const,
    },
    {
      category: "authority_building" as const,
      title: "Publish Industry Research",
      description: "Create original research content to establish thought leadership.",
      steps: toSteps(["Conduct industry survey", "Analyze and visualize data", "Publish and promote report"]),
      priority: "low" as const,
      effort: "major" as const,
      impact: "high" as const,
    },
    {
      category: "technical_seo" as const,
      title: "Fix Broken Internal Links",
      description: "Found 12 broken internal links that hurt crawlability.",
      steps: toSteps(["Run link audit", "Fix or redirect broken links", "Verify crawl health"]),
      priority: "high" as const,
      effort: "quick_win" as const,
      impact: "medium" as const,
    },
  ];

  const recommendations: schema.NewRecommendation[] = [];

  // Create 25 recommendations per brand
  for (let i = 0; i < 25; i++) {
    const template = recommendationTemplates[i % recommendationTemplates.length];
    const status = i < 5 ? "completed" : i < 10 ? "in_progress" : i < 20 ? "pending" : "dismissed";
    const daysBack = Math.floor(Math.random() * 30);

    recommendations.push({
      id: createId(),
      brandId,
      auditId: null, // Will link some to audits later
      assignedToId: null,
      title: template.title + (i >= recommendationTemplates.length ? ` (${i - recommendationTemplates.length + 2})` : ""),
      description: template.description,
      category: template.category,
      priority: template.priority,
      status: status as typeof statuses[number],
      effort: template.effort,
      impact: template.impact,
      estimatedTime: template.effort === "quick_win" ? "30 minutes" : template.effort === "moderate" ? "2-4 hours" : "1-2 days",
      source: randomItem(sources),
      relatedMentionId: null,
      steps: template.steps,
      notes: status === "completed" ? "Implemented successfully" : null,
      dueDate: status === "pending" ? daysAgo(-7) : null, // Due in 7 days
      completedAt: status === "completed" ? daysAgo(daysBack) : null,
      dismissedAt: status === "dismissed" ? daysAgo(daysBack) : null,
      createdAt: daysAgo(daysBack + 5),
    });
  }

  return recommendations;
}

// Generate audits for a brand
function generateAudits(brandId: string, brandConfig: typeof brandConfigs[0]): schema.NewAudit[] {
  const audits: schema.NewAudit[] = [];

  // Create 5 audits per brand
  for (let i = 0; i < 5; i++) {
    const daysBack = i * 7; // One audit per week
    const score = Math.floor(Math.random() * 30) + 50 + (i * 5); // Improving over time

    audits.push({
      id: createId(),
      brandId,
      triggeredById: null,
      url: `https://${brandConfig.domain}`,
      status: "completed",
      overallScore: Math.min(score, 95),
      categoryScores: [
        { category: "Structure", score: Math.floor(score * 0.9), maxScore: 25, issues: Math.floor(Math.random() * 3) },
        { category: "Schema", score: Math.floor(score * 0.7), maxScore: 25, issues: Math.floor(Math.random() * 4) + 1 },
        { category: "Clarity", score: Math.floor(score * 0.85), maxScore: 20, issues: Math.floor(Math.random() * 2) },
        { category: "Metadata", score: Math.floor(score * 0.95), maxScore: 15, issues: Math.floor(Math.random() * 2) },
        { category: "Accessibility", score: Math.floor(score * 0.8), maxScore: 15, issues: Math.floor(Math.random() * 3) },
      ],
      issues: [
        {
          id: createId(),
          category: "schema",
          severity: "high" as const,
          title: "Missing FAQ Schema",
          description: "No FAQ schema detected on the page",
          recommendation: "Add FAQ schema for better AI visibility",
          impact: "AI systems may not cite FAQ content",
        },
        {
          id: createId(),
          category: "content",
          severity: "medium" as const,
          title: "Thin Content Sections",
          description: "Some sections have less than 100 words",
          recommendation: "Expand content with more detailed information",
          impact: "May reduce authority signals",
        },
      ],
      issueCount: 7 - i,
      criticalCount: i < 3 ? 1 : 0,
      highCount: 2 - Math.floor(i / 2),
      mediumCount: 3 - Math.floor(i / 2),
      lowCount: 1,
      recommendations: [
        "Add Organization schema",
        "Implement FAQ markup",
        "Improve page load speed",
      ],
      metadata: {
        userAgent: "Apex-Crawler/1.0",
        viewport: { width: 1920, height: 1080 },
        timing: {
          totalDuration: Math.floor(Math.random() * 5000) + 3000,
          fetchTime: Math.floor(Math.random() * 2000) + 1000,
          analysisTime: Math.floor(Math.random() * 2000) + 1000,
        },
        pageInfo: {
          title: `${brandConfig.name} - ${brandConfig.tagline}`,
          metaDescription: brandConfig.description,
          h1Count: 1,
          wordCount: Math.floor(Math.random() * 2000) + 1000,
        },
        pagesAnalyzed: 1,
        grade: score >= 80 ? "A" : score >= 60 ? "B" : "C",
      },
      startedAt: daysAgo(daysBack),
      completedAt: daysAgo(daysBack),
      createdAt: daysAgo(daysBack),
    });
  }

  return audits;
}

async function cleanExistingData() {
  console.log("Cleaning existing demo data...");
  const existingOrg = await db.query.organizations.findFirst({
    where: (org, { eq }) => eq(org.slug, "apex-demo"),
  });
  if (existingOrg) {
    const existingBrands = await db.query.brands.findMany({
      where: (brand, { eq }) => eq(brand.organizationId, existingOrg.id),
    });
    for (const brand of existingBrands) {
      await db.delete(schema.brandMentions).where(eq(schema.brandMentions.brandId, brand.id)).catch(() => {});
      await db.delete(schema.recommendations).where(eq(schema.recommendations.brandId, brand.id)).catch(() => {});
      await db.delete(schema.audits).where(eq(schema.audits.brandId, brand.id)).catch(() => {});
    }
    await db.delete(schema.brands).where(eq(schema.brands.organizationId, existingOrg.id)).catch(() => {});
    await db.delete(schema.users).where(eq(schema.users.organizationId, existingOrg.id)).catch(() => {});
    await db.delete(schema.organizations).where(eq(schema.organizations.id, existingOrg.id)).catch(() => {});
    console.log("Demo data removed");
  }
}

async function seed() {
  console.log("Starting comprehensive database seed...");
  console.log("This will create 3 brands with 60 mentions, 25 recommendations, and 5 audits each.\n");

  try {
    const existingOrg = await db.query.organizations.findFirst({
      where: (org, { eq }) => eq(org.slug, "apex-demo"),
    });

    if (existingOrg && !shouldClean) {
      console.log("Demo data already exists! Use --clean to reset.");
      return;
    }

    if (shouldClean) await cleanExistingData();

    // Create organization
    console.log("Creating organization...");
    await db.insert(schema.organizations).values({
      id: ids.org,
      name: "Apex Demo Company",
      slug: "apex-demo",
      plan: "professional",
      brandLimit: 10,
      userLimit: 25,
      isActive: true,
      onboardingStatus: {
        brandAdded: true,
        monitoringConfigured: true,
        auditRun: true,
        recommendationsReviewed: true,
        completedAt: new Date().toISOString(),
        dismissedAt: null,
      },
    });

    // Create users
    console.log("Creating users...");
    await db.insert(schema.users).values([
      {
        id: ids.users[0],
        authUserId: "user_demo_admin_" + createId().slice(0, 8),
        organizationId: ids.org,
        email: "admin@apex-demo.com",
        name: "Alex Thompson",
        role: "admin",
        isActive: true,
      },
      {
        id: ids.users[1],
        authUserId: "user_demo_editor_" + createId().slice(0, 8),
        organizationId: ids.org,
        email: "editor@apex-demo.com",
        name: "Jordan Lee",
        role: "editor",
        isActive: true,
      },
    ]);

    // Create brands with full data
    console.log("Creating brands with full configuration...");
    for (let i = 0; i < brandConfigs.length; i++) {
      const config = brandConfigs[i];
      const brandId = ids.brands[i];

      await db.insert(schema.brands).values({
        id: brandId,
        organizationId: ids.org,
        name: config.name,
        domain: config.domain,
        description: config.description,
        tagline: config.tagline,
        industry: config.industry,
        logoUrl: config.logoUrl,
        keywords: config.keywords,
        seoKeywords: config.seoKeywords,
        geoKeywords: config.geoKeywords,
        competitors: config.competitors,
        valuePropositions: config.valuePropositions,
        voice: config.voice,
        visual: {
          primaryColor: "#4F46E5",
          secondaryColor: "#7C3AED",
          accentColor: "#EC4899",
          colorPalette: ["#4F46E5", "#7C3AED", "#EC4899", "#06B6D4"],
          fontFamily: "Inter",
        },
        confidence: {
          overall: 0.85,
          perField: {
            name: 1.0,
            description: 0.9,
            industry: 0.95,
            competitors: 0.8,
          },
        },
        monitoringEnabled: true,
        monitoringPlatforms: ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"],
        isActive: true,
      });

      console.log(`  Created brand: ${config.name}`);

      // Create mentions
      console.log(`  Creating mentions for ${config.name}...`);
      const mentions = generateMentions(brandId, config);
      // Insert in batches of 20
      for (let j = 0; j < mentions.length; j += 20) {
        await db.insert(schema.brandMentions).values(mentions.slice(j, j + 20));
      }
      console.log(`    Created ${mentions.length} mentions`);

      // Create recommendations
      console.log(`  Creating recommendations for ${config.name}...`);
      const recs = generateRecommendations(brandId, config);
      await db.insert(schema.recommendations).values(recs);
      console.log(`    Created ${recs.length} recommendations`);

      // Create audits
      console.log(`  Creating audits for ${config.name}...`);
      const audits = generateAudits(brandId, config);
      await db.insert(schema.audits).values(audits);
      console.log(`    Created ${audits.length} audits`);
    }

    console.log("\n✅ Seed completed successfully!");
    console.log("\nSummary:");
    console.log("  - 1 organization (apex-demo)");
    console.log("  - 2 users");
    console.log("  - 3 brands with full configuration");
    console.log("  - 180 mentions (60 per brand)");
    console.log("  - 75 recommendations (25 per brand)");
    console.log("  - 15 audits (5 per brand)");

  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
