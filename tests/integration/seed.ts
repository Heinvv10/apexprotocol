/**
 * Integration Test Seed Data
 *
 * Provides seed data functions for integration tests.
 * Creates realistic test data for all entity types used in GraphQL resolvers.
 *
 * Usage:
 * ```typescript
 * import { createTestSeedData, cleanupTestData, TEST_IDS } from "./seed";
 *
 * const seedResult = await createTestSeedData(db);
 * // Run tests...
 * await cleanupTestData(db, seedResult);
 * ```
 */

import { eq, and, inArray } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type * as schemaTypes from "../../src/lib/db/schema";

// Use module-level import for schema
type Schema = typeof import("../../src/lib/db/schema");
type Database = NeonHttpDatabase<Schema>;

/**
 * Fixed test IDs for consistent reference in tests
 * These are deterministic to allow assertions in tests
 */
export const TEST_IDS = {
  ORG: "test-org-integration-001",
  USERS: ["test-user-001", "test-user-002"],
  BRANDS: ["test-brand-001", "test-brand-002", "test-brand-003"],
  MENTIONS: [
    "test-mention-001",
    "test-mention-002",
    "test-mention-003",
    "test-mention-004",
    "test-mention-005",
  ],
  RECOMMENDATIONS: [
    "test-rec-001",
    "test-rec-002",
    "test-rec-003",
    "test-rec-004",
    "test-rec-005",
  ],
  AUDITS: ["test-audit-001", "test-audit-002", "test-audit-003"],
  CONTENT: ["test-content-001", "test-content-002", "test-content-003"],
  GEO_SCORE_HISTORY: [
    "test-geo-history-001",
    "test-geo-history-002",
    "test-geo-history-003",
    "test-geo-history-004",
    "test-geo-history-005",
  ],
  INTEGRATIONS: ["test-integration-001", "test-integration-002"],
} as const;

/**
 * Result of seeding test data
 * Contains all created entity IDs for reference and cleanup
 */
export interface SeedResult {
  organization: {
    id: string;
    clerkOrgId: string;
  };
  users: Array<{
    id: string;
    clerkUserId: string;
    email: string;
  }>;
  brands: Array<{
    id: string;
    name: string;
    domain: string;
  }>;
  mentions: Array<{
    id: string;
    brandId: string;
  }>;
  recommendations: Array<{
    id: string;
    brandId: string;
    status: string;
  }>;
  audits: Array<{
    id: string;
    brandId: string;
  }>;
  content: Array<{
    id: string;
    brandId: string;
  }>;
  geoScoreHistory: Array<{
    id: string;
    brandId: string;
    score: number;
  }>;
  integrations: Array<{
    id: string;
    serviceName: string;
    provider: string;
  }>;
}

/**
 * Helper to generate dates in the past
 */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Seed organization data
 */
async function seedOrganization(
  db: Database,
  schema: Schema
): Promise<SeedResult["organization"]> {
  const orgData = {
    id: TEST_IDS.ORG,
    name: "Integration Test Organization",
    slug: "integration-test-org",
    clerkOrgId: `clerk_org_test_${TEST_IDS.ORG}`,
    plan: "professional" as const,
    brandLimit: 10,
    userLimit: 25,
    isActive: true,
    features: [],
    onboardingStatus: {
      brandAdded: true,
      monitoringConfigured: true,
      auditRun: true,
      recommendationsReviewed: true,
      completedAt: new Date().toISOString(),
      dismissedAt: null,
    },
  };

  try {
    // First, check if organization already exists to handle parallel test execution
    const existing = await db
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, TEST_IDS.ORG))
      .limit(1);

    if (existing.length > 0) {
      // Organization exists, just update it
      await db
        .update(schema.organizations)
        .set({ name: orgData.name, isActive: true })
        .where(eq(schema.organizations.id, TEST_IDS.ORG));
    } else {
      // Organization doesn't exist, try to insert
      // Use a try-catch to handle race condition if another test file inserts first
      try {
        await db.insert(schema.organizations).values(orgData);
      } catch (insertError: any) {
        // Check for duplicate key error (can be on error itself or on cause)
        const errorCode = insertError?.code || insertError?.cause?.code;
        const errorMessage = String(insertError?.message || insertError?.cause?.message || '');
        const isDuplicateKey = errorCode === '23505' ||
          errorMessage.includes('duplicate key') ||
          errorMessage.includes('already exists');

        if (isDuplicateKey) {
          // Unique constraint violation - org was created by parallel test, that's ok
          console.log("Organization already exists (parallel test), continuing...");
        } else {
          throw insertError;
        }
      }
    }
  } catch (error) {
    // If it still fails for another reason, log and rethrow
    console.error("Failed to seed organization:", error);
    throw error;
  }

  return {
    id: orgData.id,
    clerkOrgId: orgData.clerkOrgId,
  };
}

/**
 * Seed user data
 */
async function seedUsers(
  db: Database,
  schema: Schema,
  orgId: string
): Promise<SeedResult["users"]> {
  const usersData = [
    {
      id: TEST_IDS.USERS[0],
      clerkUserId: `clerk_user_test_${TEST_IDS.USERS[0]}`,
      organizationId: orgId,
      email: "admin@integration-test.com",
      name: "Test Admin",
      role: "admin" as const,
      isActive: true,
    },
    {
      id: TEST_IDS.USERS[1],
      clerkUserId: `clerk_user_test_${TEST_IDS.USERS[1]}`,
      organizationId: orgId,
      email: "editor@integration-test.com",
      name: "Test Editor",
      role: "editor" as const,
      isActive: true,
    },
  ];

  // Use onConflictDoNothing to handle race conditions from parallel test files
  await db.insert(schema.users).values(usersData).onConflictDoNothing();

  return usersData.map((u) => ({
    id: u.id,
    clerkUserId: u.clerkUserId,
    email: u.email,
  }));
}

/**
 * Seed brand data
 */
async function seedBrands(
  db: Database,
  schema: Schema,
  orgId: string
): Promise<SeedResult["brands"]> {
  const brandsData = [
    {
      id: TEST_IDS.BRANDS[0],
      organizationId: orgId,
      name: "TechFlow Solutions",
      domain: "techflow-test.io",
      description: "Enterprise SaaS for workflow automation",
      tagline: "Automate everything",
      industry: "Technology",
      keywords: ["workflow", "automation", "SaaS"],
      seoKeywords: ["workflow automation software"],
      geoKeywords: ["best workflow tool"],
      competitors: [
        { name: "Monday.com", url: "https://monday.com", reason: "Direct competitor" },
        { name: "Asana", url: "https://asana.com", reason: "PM overlap" },
      ],
      valuePropositions: ["50% faster completion", "AI automation"],
      voice: {
        tone: "professional" as const,
        personality: ["innovative", "reliable"],
        targetAudience: "CTOs and IT managers",
        keyMessages: ["Transform workflow"],
        avoidTopics: ["competitor bashing"],
      },
      visual: {
        primaryColor: "#4F46E5",
        secondaryColor: "#7C3AED",
        accentColor: "#EC4899",
        colorPalette: ["#4F46E5", "#7C3AED"],
        fontFamily: "Inter",
      },
      monitoringEnabled: true,
      monitoringPlatforms: ["chatgpt", "claude", "gemini"],
      isActive: true,
    },
    {
      id: TEST_IDS.BRANDS[1],
      organizationId: orgId,
      name: "GreenLeaf Organics",
      domain: "greenleaf-test.com",
      description: "Premium organic food delivery",
      tagline: "Fresh from farm to family",
      industry: "Food & Beverage",
      keywords: ["organic", "food delivery", "healthy"],
      seoKeywords: ["organic food delivery"],
      geoKeywords: ["best organic delivery"],
      competitors: [
        { name: "HelloFresh", url: "https://hellofresh.com", reason: "Meal kit delivery" },
      ],
      valuePropositions: ["100% organic", "Same-day delivery"],
      voice: {
        tone: "friendly" as const,
        personality: ["warm", "sustainable"],
        targetAudience: "Health-conscious families",
        keyMessages: ["Nourish naturally"],
        avoidTopics: ["processed foods"],
      },
      visual: {
        primaryColor: "#22C55E",
        secondaryColor: "#16A34A",
        accentColor: null,
        colorPalette: ["#22C55E"],
        fontFamily: null,
      },
      monitoringEnabled: true,
      monitoringPlatforms: ["chatgpt", "claude", "perplexity"],
      isActive: true,
    },
    {
      id: TEST_IDS.BRANDS[2],
      organizationId: orgId,
      name: "FinanceHub Pro",
      domain: "financehub-test.com",
      description: "AI-powered personal finance",
      tagline: "Your wealth, intelligently managed",
      industry: "Financial Services",
      keywords: ["finance", "AI", "wealth"],
      seoKeywords: ["AI finance app"],
      geoKeywords: ["best AI finance"],
      competitors: [
        { name: "Mint", url: "https://mint.com", reason: "Personal finance" },
      ],
      valuePropositions: ["AI insights", "Bank-level security"],
      voice: {
        tone: "authoritative" as const,
        personality: ["trustworthy", "intelligent"],
        targetAudience: "Young professionals",
        keyMessages: ["Take control"],
        avoidTopics: ["get rich quick"],
      },
      visual: {
        primaryColor: "#0EA5E9",
        secondaryColor: null,
        accentColor: null,
        colorPalette: [],
        fontFamily: null,
      },
      monitoringEnabled: true,
      monitoringPlatforms: ["chatgpt", "gemini", "grok"],
      isActive: true,
    },
  ];

  // Use onConflictDoNothing to handle race conditions from parallel test files
  await db.insert(schema.brands).values(brandsData).onConflictDoNothing();

  return brandsData.map((b) => ({
    id: b.id,
    name: b.name,
    domain: b.domain,
  }));
}

/**
 * Seed brand mentions data
 */
async function seedMentions(
  db: Database,
  schema: Schema,
  brandIds: string[]
): Promise<SeedResult["mentions"]> {
  const platforms = ["chatgpt", "claude", "gemini", "perplexity", "grok"] as const;
  const sentiments = ["positive", "neutral", "negative"] as const;

  const mentionsData = TEST_IDS.MENTIONS.map((id, idx) => ({
    id,
    brandId: brandIds[idx % brandIds.length], // Distribute across brands
    platform: platforms[idx % platforms.length],
    query: `What is the best ${idx % 2 === 0 ? "workflow" : "finance"} tool?`,
    response: `Based on analysis, ${idx % 2 === 0 ? "TechFlow" : "FinanceHub"} is recommended...`,
    sentiment: sentiments[idx % sentiments.length],
    position: idx + 1,
    citationUrl: idx % 2 === 0 ? "https://example.com/test" : null,
    competitors: [
      { name: "Competitor A", position: idx + 2, sentiment: "neutral" as const },
    ],
    promptCategory: idx % 2 === 0 ? "recommendation" : "comparison",
    topics: ["technology", "software"],
    metadata: {
      modelVersion: "test-v1",
      responseLength: 250,
      confidenceScore: 0.85,
    },
    timestamp: daysAgo(idx),
  }));

  // Use onConflictDoNothing to handle race conditions from parallel test files
  await db.insert(schema.brandMentions).values(mentionsData).onConflictDoNothing();

  return mentionsData.map((m) => ({
    id: m.id,
    brandId: m.brandId,
  }));
}

/**
 * Seed recommendations data
 */
async function seedRecommendations(
  db: Database,
  schema: Schema,
  brandIds: string[]
): Promise<SeedResult["recommendations"]> {
  const categories = [
    "technical_seo",
    "content_optimization",
    "schema_markup",
    "citation_building",
    "brand_consistency",
  ] as const;
  const priorities = ["critical", "high", "medium", "low"] as const;
  const statuses = ["pending", "in_progress", "completed", "dismissed"] as const;
  const efforts = ["quick_win", "moderate", "major"] as const;
  const impacts = ["high", "medium", "low"] as const;
  const sources = ["audit", "monitoring", "content", "manual"] as const;

  const recsData = TEST_IDS.RECOMMENDATIONS.map((id, idx) => ({
    id,
    brandId: brandIds[idx % brandIds.length],
    auditId: null,
    assignedToId: null,
    title: `Test Recommendation ${idx + 1}`,
    description: `This is test recommendation #${idx + 1} for integration testing`,
    category: categories[idx % categories.length],
    priority: priorities[idx % priorities.length],
    status: statuses[idx % statuses.length],
    effort: efforts[idx % efforts.length],
    impact: impacts[idx % impacts.length],
    estimatedTime: idx % 2 === 0 ? "30 minutes" : "2 hours",
    source: sources[idx % sources.length],
    relatedMentionId: null,
    steps: ["Step 1", "Step 2", "Step 3"],
    notes: idx === 2 ? "Implemented successfully" : null,
    dueDate: idx === 0 ? daysAgo(-7) : null, // Due in 7 days for first one
    completedAt: idx === 2 ? daysAgo(1) : null, // Completed 1 day ago for third
    dismissedAt: idx === 3 ? daysAgo(2) : null, // Dismissed 2 days ago for fourth
    createdAt: daysAgo(10 + idx),
  }));

  // Use onConflictDoNothing to handle race conditions from parallel test files
  await db.insert(schema.recommendations).values(recsData).onConflictDoNothing();

  return recsData.map((r) => ({
    id: r.id,
    brandId: r.brandId,
    status: r.status,
  }));
}

/**
 * Seed audits data
 */
async function seedAudits(
  db: Database,
  schema: Schema,
  brandIds: string[]
): Promise<SeedResult["audits"]> {
  const auditStatuses = ["completed", "in_progress", "pending"] as const;
  const auditsData = TEST_IDS.AUDITS.map((id, idx) => ({
    id,
    brandId: brandIds[idx % brandIds.length],
    triggeredById: null,
    url: `https://${idx === 0 ? "techflow" : idx === 1 ? "greenleaf" : "financehub"}-test.com`,
    status: auditStatuses[idx] as typeof auditStatuses[number],
    overallScore: idx === 0 ? 75 : idx === 1 ? 65 : null,
    categoryScores:
      idx === 0
        ? [
            { category: "Structure", score: 20, maxScore: 25, issues: 1 },
            { category: "Schema", score: 15, maxScore: 25, issues: 2 },
            { category: "Clarity", score: 18, maxScore: 20, issues: 0 },
            { category: "Metadata", score: 12, maxScore: 15, issues: 1 },
            { category: "Accessibility", score: 10, maxScore: 15, issues: 1 },
          ]
        : null,
    issues:
      idx === 0
        ? [
            {
              id: "issue-1",
              category: "schema",
              severity: "high" as const,
              title: "Missing FAQ Schema",
              description: "No FAQ schema detected",
              recommendation: "Add FAQ schema",
              impact: "AI systems may not cite FAQ content",
            },
          ]
        : null,
    issueCount: idx === 0 ? 5 : 0,
    criticalCount: 0,
    highCount: idx === 0 ? 1 : 0,
    mediumCount: idx === 0 ? 3 : 0,
    lowCount: idx === 0 ? 1 : 0,
    recommendations: idx === 0 ? ["Add schema", "Improve speed"] : [],
    metadata: {
      userAgent: "Apex-Crawler/1.0",
      viewport: { width: 1920, height: 1080 },
      timing: { totalDuration: 3500, fetchTime: 1500, analysisTime: 2000 },
      pageInfo: { title: "Test Page", metaDescription: "Test description", h1Count: 1, wordCount: 1500 },
      pagesAnalyzed: 1,
      grade: idx === 0 ? "B" : "C",
    },
    startedAt: idx !== 2 ? daysAgo(idx) : null,
    completedAt: idx === 0 ? daysAgo(0) : null,
    createdAt: daysAgo(idx + 1),
  }));

  // Use onConflictDoNothing to handle race conditions from parallel test files
  await db.insert(schema.audits).values(auditsData).onConflictDoNothing();

  return auditsData.map((a) => ({
    id: a.id,
    brandId: a.brandId,
  }));
}

/**
 * Seed content data
 */
async function seedContent(
  db: Database,
  schema: Schema,
  brandIds: string[],
  userId: string
): Promise<SeedResult["content"]> {
  const contentTypes = ["blog_post", "landing_page", "faq"] as const;
  const contentStatuses = ["draft", "review", "published"] as const;

  const contentData = TEST_IDS.CONTENT.map((id, idx) => ({
    id,
    brandId: brandIds[idx % brandIds.length],
    authorId: userId,
    title: `Test Content ${idx + 1}`,
    type: contentTypes[idx % contentTypes.length],
    content: `<p>This is test content body for item ${idx + 1}. It contains multiple paragraphs of text for testing purposes.</p><p>Second paragraph with more details about the topic.</p>`,
    summary: `Summary for test content ${idx + 1}`,
    targetKeywords: ["test", "integration", "content"],
    status: contentStatuses[idx % contentStatuses.length],
    seoScore: idx === 2 ? 85 : 70 + idx * 5,
    readabilityScore: 75 + idx * 3,
    aiScore: idx === 2 ? 90 : 65 + idx * 10,
    wordCount: 500 + idx * 100,
    suggestions:
      idx < 2
        ? [
            { type: "seo", suggestion: "Add more keywords", priority: "medium" },
          ]
        : [],
    metadata: {
      lastOptimized: idx === 2 ? new Date().toISOString() : null,
      optimizationCount: idx === 2 ? 2 : 0,
    },
    publishedAt: idx === 2 ? daysAgo(5) : null,
    createdAt: daysAgo(10 - idx),
  }));

  // Use onConflictDoNothing to handle race conditions from parallel test files
  await db.insert(schema.content).values(contentData).onConflictDoNothing();

  return contentData.map((c) => ({
    id: c.id,
    brandId: c.brandId,
  }));
}

/**
 * Seed GEO score history data
 */
async function seedGeoScoreHistory(
  db: Database,
  schema: Schema,
  brandIds: string[]
): Promise<SeedResult["geoScoreHistory"]> {
  const historyData = TEST_IDS.GEO_SCORE_HISTORY.map((id, idx) => ({
    id,
    brandId: brandIds[0], // All history for first brand
    overallScore: 70 + idx * 5, // Scores from 70-90 showing improvement
    visibilityScore: 65 + idx * 6,
    sentimentScore: 72 + idx * 4,
    recommendationScore: 68 + idx * 5,
    platformScores: {
      chatgpt: 75 + idx * 4,
      claude: 70 + idx * 5,
      gemini: 65 + idx * 6,
    },
    trend: (idx === 0 ? "stable" : idx > 2 ? "up" : "down") as "up" | "down" | "stable",
    createdAt: daysAgo((TEST_IDS.GEO_SCORE_HISTORY.length - idx) * 7),
  }));

  // Use onConflictDoNothing to handle race conditions from parallel test files
  await db.insert(schema.geoScoreHistory).values(historyData).onConflictDoNothing();

  return historyData.map((h) => ({
    id: h.id,
    brandId: h.brandId,
    score: h.overallScore,
  }));
}

/**
 * Seed API integrations data
 */
async function seedIntegrations(
  db: Database,
  schema: Schema,
  orgId: string
): Promise<SeedResult["integrations"]> {
  const integrationsData: typeof schema.apiIntegrations.$inferInsert[] = TEST_IDS.INTEGRATIONS.map((id, idx) => ({
    id,
    serviceName: idx === 0 ? "Google Analytics" : "Google Search Console",
    provider: idx === 0 ? "google_analytics" : "google_search_console",
    category: "analytics" as const,
    status: (idx === 0 ? "configured" : "not_configured") as "configured" | "not_configured",
    isEnabled: idx === 0,
    config: idx === 0 ? {
      apiKey: "test-key-001",
      endpoint: "https://analytics.googleapis.com",
    } : {},
    lastVerified: idx === 0 ? daysAgo(1) : null,
    usageThisMonth: idx === 0 ? 150 : 0,
    createdAt: daysAgo(30 - idx * 10),
    updatedAt: daysAgo(idx),
  }));

  // Use onConflictDoNothing to handle race conditions from parallel test files
  await db.insert(schema.apiIntegrations).values(integrationsData).onConflictDoNothing();

  return integrationsData.map((i) => ({
    id: i.id as string, // id is always defined from TEST_IDS
    serviceName: i.serviceName,
    provider: i.provider,
  })) as SeedResult["integrations"];
}

/**
 * Create all test seed data
 * This is the main function to call for seeding
 */
export async function createTestSeedData(db: Database): Promise<SeedResult> {
  // Import schema dynamically to avoid circular dependencies
  const schema = await import("../../src/lib/db/schema");

  // Create organization first
  const organization = await seedOrganization(db, schema);

  // Create users in the organization
  const users = await seedUsers(db, schema, organization.id);

  // Create brands for the organization
  const brands = await seedBrands(db, schema, organization.id);
  const brandIds = brands.map((b) => b.id);

  // Create mentions for brands
  const mentions = await seedMentions(db, schema, brandIds);

  // Create recommendations for brands
  const recommendations = await seedRecommendations(db, schema, brandIds);

  // Create audits for brands
  const audits = await seedAudits(db, schema, brandIds);

  // Create content for brands
  const content = await seedContent(db, schema, brandIds, users[0].id);

  // Create GEO score history for brands
  const geoScoreHistory = await seedGeoScoreHistory(db, schema, brandIds);

  // Create integrations for organization
  const integrations = await seedIntegrations(db, schema, organization.id);

  return {
    organization,
    users,
    brands,
    mentions,
    recommendations,
    audits,
    content,
    geoScoreHistory,
    integrations,
  };
}

/**
 * Clean up test data from database
 * Deletes data in reverse order to respect foreign key constraints
 */
export async function cleanupTestData(
  db: Database,
  seedResult?: SeedResult
): Promise<void> {
  const schema = await import("../../src/lib/db/schema");

  try {
    // Delete in reverse order of creation to respect FK constraints

    // Integrations
    if (seedResult?.integrations?.length) {
      await db
        .delete(schema.apiIntegrations)
        .where(
          inArray(
            schema.apiIntegrations.id,
            seedResult.integrations.map((i) => i.id)
          )
        );
    }

    // GEO Score History
    if (seedResult?.geoScoreHistory?.length) {
      await db
        .delete(schema.geoScoreHistory)
        .where(
          inArray(
            schema.geoScoreHistory.id,
            seedResult.geoScoreHistory.map((h) => h.id)
          )
        );
    }

    // Content
    if (seedResult?.content?.length) {
      await db
        .delete(schema.content)
        .where(inArray(schema.content.id, seedResult.content.map((c) => c.id)));
    }

    // Audits
    if (seedResult?.audits?.length) {
      await db
        .delete(schema.audits)
        .where(inArray(schema.audits.id, seedResult.audits.map((a) => a.id)));
    }

    // Recommendations
    if (seedResult?.recommendations?.length) {
      await db
        .delete(schema.recommendations)
        .where(
          inArray(
            schema.recommendations.id,
            seedResult.recommendations.map((r) => r.id)
          )
        );
    }

    // Mentions
    if (seedResult?.mentions?.length) {
      await db
        .delete(schema.brandMentions)
        .where(
          inArray(schema.brandMentions.id, seedResult.mentions.map((m) => m.id))
        );
    }

    // Brands
    if (seedResult?.brands?.length) {
      await db
        .delete(schema.brands)
        .where(inArray(schema.brands.id, seedResult.brands.map((b) => b.id)));
    }

    // Users
    if (seedResult?.users?.length) {
      await db
        .delete(schema.users)
        .where(inArray(schema.users.id, seedResult.users.map((u) => u.id)));
    }

    // Organization (this should cascade delete related data anyway)
    if (seedResult?.organization) {
      await db
        .delete(schema.organizations)
        .where(eq(schema.organizations.id, seedResult.organization.id));
    }
  } catch (error) {
    // Log but don't throw - cleanup failures shouldn't break tests
    console.warn("Cleanup warning:", error);
  }
}

/**
 * Quick seed helpers for specific test scenarios
 */
export const seedHelpers = {
  /**
   * Seed a single brand with all related data
   */
  async seedBrandWithData(
    db: Database,
    brandId: string,
    orgId: string
  ): Promise<{ brandId: string; mentionIds: string[]; recIds: string[] }> {
    const schema = await import("../../src/lib/db/schema");

    // Create brand
    await db.insert(schema.brands).values({
      id: brandId,
      organizationId: orgId,
      name: `Quick Test Brand ${brandId}`,
      domain: `${brandId}.test.com`,
      industry: "Technology",
      isActive: true,
      monitoringEnabled: true,
      monitoringPlatforms: ["chatgpt"],
    });

    // Create a few mentions
    const mentionIds = [`${brandId}-mention-1`, `${brandId}-mention-2`];
    await db.insert(schema.brandMentions).values(
      mentionIds.map((id, idx) => ({
        id,
        brandId,
        platform: "chatgpt" as const,
        query: "Test query",
        response: "Test response",
        sentiment: (idx === 0 ? "positive" : "neutral") as "positive" | "neutral",
        timestamp: new Date(),
      }))
    );

    // Create a few recommendations
    const recIds = [`${brandId}-rec-1`, `${brandId}-rec-2`];
    await db.insert(schema.recommendations).values(
      recIds.map((id, idx) => ({
        id,
        brandId,
        title: `Recommendation ${idx + 1}`,
        description: "Test description",
        category: "content_optimization" as const,
        priority: "medium" as const,
        status: (idx === 0 ? "pending" : "completed") as "pending" | "completed",
        effort: "moderate" as const,
        impact: "medium" as const,
        source: "manual" as const,
      }))
    );

    return { brandId, mentionIds, recIds };
  },

  /**
   * Clean up a quick-seeded brand
   */
  async cleanupQuickBrand(db: Database, brandId: string): Promise<void> {
    const schema = await import("../../src/lib/db/schema");

    await db
      .delete(schema.recommendations)
      .where(eq(schema.recommendations.brandId, brandId));
    await db
      .delete(schema.brandMentions)
      .where(eq(schema.brandMentions.brandId, brandId));
    await db.delete(schema.brands).where(eq(schema.brands.id, brandId));
  },
};
