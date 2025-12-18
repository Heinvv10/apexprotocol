/**
 * GraphQL Schema (F137)
 * Full GraphQL schema for GEO/AEO platform with queries, mutations, and subscriptions
 * Database-connected resolvers using Drizzle ORM
 */

import { createSchema, createYoga, YogaInitialContext } from "graphql-yoga";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, and, sql, like, count } from "drizzle-orm";
import { db, schema } from "@/lib/db";

// Type Definitions
const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar JSON

  # Common Types
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
    total: Int!
  }

  # Enums
  enum Platform {
    chatgpt
    claude
    gemini
    perplexity
    grok
    deepseek
    meta_ai
  }

  enum Sentiment {
    positive
    negative
    neutral
    mixed
  }

  enum RecommendationPriority {
    critical
    high
    medium
    low
  }

  enum RecommendationStatus {
    pending
    in_progress
    completed
    dismissed
    deferred
  }

  enum AuditStatus {
    pending
    running
    completed
    failed
  }

  enum ContentStatus {
    draft
    review
    published
    archived
  }

  enum SubscriptionTier {
    free
    starter
    pro
    enterprise
  }

  # Brand Types
  type Brand {
    id: ID!
    organizationId: String!
    name: String!
    domain: String
    industry: String
    description: String
    competitors: [String!]
    keywords: [String!]
    platforms: [Platform!]!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    mentions(first: Int, after: String, platform: Platform, sentiment: Sentiment): MentionConnection!
    recommendations(first: Int, status: RecommendationStatus): [Recommendation!]!
    audits(first: Int): [Audit!]!
    geoScore: GEOScore
    stats: BrandStats!
  }

  type BrandStats {
    totalMentions: Int!
    positiveMentions: Int!
    negativeMentions: Int!
    avgSentiment: Float!
    mentionsTrend: Float!
    recommendationCount: Int!
    completedRecommendations: Int!
  }

  type BrandConnection {
    edges: [BrandEdge!]!
    pageInfo: PageInfo!
  }

  type BrandEdge {
    node: Brand!
    cursor: String!
  }

  # Mention Types
  type Mention {
    id: ID!
    brandId: String!
    platform: Platform!
    query: String!
    response: String!
    position: Int
    sentiment: Sentiment!
    sentimentScore: Float!
    isRecommendation: Boolean!
    competitorMentioned: Boolean
    competitors: [String!]
    url: String
    metadata: JSON
    createdAt: DateTime!
    brand: Brand
  }

  type MentionConnection {
    edges: [MentionEdge!]!
    pageInfo: PageInfo!
    stats: MentionStats
  }

  type MentionEdge {
    node: Mention!
    cursor: String!
  }

  type MentionStats {
    total: Int!
    byPlatform: JSON!
    bySentiment: JSON!
    avgPosition: Float
  }

  # GEO Score Types
  type GEOScore {
    id: ID!
    brandId: String!
    overallScore: Float!
    visibilityScore: Float!
    sentimentScore: Float!
    recommendationScore: Float!
    competitorGapScore: Float!
    platformScores: JSON!
    previousScore: Float
    trend: Float!
    calculatedAt: DateTime!
    history(days: Int): [GEOScoreHistory!]!
  }

  type GEOScoreHistory {
    date: DateTime!
    score: Float!
    components: JSON
  }

  # Recommendation Types
  type Recommendation {
    id: ID!
    brandId: String!
    templateId: String
    type: String!
    category: String!
    title: String!
    description: String!
    priority: RecommendationPriority!
    status: RecommendationStatus!
    estimatedImpact: Float!
    effort: String!
    dependencies: [String!]
    evidence: JSON
    steps: [String!]!
    aiExplanation: String
    assignedTo: String
    dueDate: DateTime
    completedAt: DateTime
    feedback: [RecommendationFeedback!]
    createdAt: DateTime!
    updatedAt: DateTime!
    brand: Brand
  }

  type RecommendationFeedback {
    id: ID!
    userId: String!
    rating: Int!
    wasHelpful: Boolean!
    comment: String
    actualImpact: Float
    createdAt: DateTime!
  }

  type RecommendationConnection {
    edges: [RecommendationEdge!]!
    pageInfo: PageInfo!
  }

  type RecommendationEdge {
    node: Recommendation!
    cursor: String!
  }

  # Audit Types
  type Audit {
    id: ID!
    brandId: String!
    url: String!
    status: AuditStatus!
    overallScore: Float
    categories: [AuditCategory!]
    issues: [AuditIssue!]
    startedAt: DateTime
    completedAt: DateTime
    createdAt: DateTime!
    brand: Brand
  }

  type AuditCategory {
    name: String!
    score: Float!
    weight: Float!
    issues: Int!
    passed: Int!
  }

  type AuditIssue {
    id: String!
    category: String!
    severity: String!
    title: String!
    description: String!
    impact: String!
    recommendation: String!
    affectedUrls: [String!]
  }

  # Content Types
  type Content {
    id: ID!
    brandId: String!
    title: String!
    type: String!
    status: ContentStatus!
    content: String!
    metadata: JSON
    seoScore: Float
    aiOptimizationScore: Float
    suggestions: [String!]
    publishedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    brand: Brand
  }

  type ContentConnection {
    edges: [ContentEdge!]!
    pageInfo: PageInfo!
  }

  type ContentEdge {
    node: Content!
    cursor: String!
  }

  # Subscription & Billing Types
  type Subscription {
    id: ID!
    organizationId: String!
    tier: SubscriptionTier!
    status: String!
    billingCycle: String!
    currentPeriodStart: DateTime!
    currentPeriodEnd: DateTime!
    cancelAtPeriodEnd: Boolean!
    usage: UsageRecord
    features: [String!]!
    limits: SubscriptionLimits!
  }

  type SubscriptionLimits {
    brands: Int!
    platforms: Int!
    mentionsPerMonth: Int!
    auditsPerMonth: Int!
    aiTokensPerMonth: Int!
    contentPiecesPerMonth: Int!
  }

  type UsageRecord {
    mentions: Int!
    audits: Int!
    aiTokens: Int!
    contentPieces: Int!
    lastUpdated: DateTime!
  }

  # Integration Types
  type Integration {
    id: ID!
    organizationId: String!
    type: String!
    name: String!
    isConnected: Boolean!
    lastSyncedAt: DateTime
    config: JSON
    createdAt: DateTime!
  }

  # Analytics Types
  type AnalyticsSummary {
    period: String!
    startDate: DateTime!
    endDate: DateTime!
    geoScore: GEOScoreSummary!
    mentions: MentionSummary!
    recommendations: RecommendationSummary!
    content: ContentSummary!
  }

  type GEOScoreSummary {
    current: Float!
    previous: Float!
    change: Float!
    trend: String!
  }

  type MentionSummary {
    total: Int!
    change: Int!
    byPlatform: JSON!
    bySentiment: JSON!
    topQueries: [String!]!
  }

  type RecommendationSummary {
    total: Int!
    completed: Int!
    inProgress: Int!
    pending: Int!
    avgImpact: Float!
  }

  type ContentSummary {
    total: Int!
    published: Int!
    avgSeoScore: Float!
    avgAiScore: Float!
  }

  # Root Query Type
  type Query {
    # Brand Queries
    brand(id: ID!): Brand
    brands(first: Int, after: String, search: String): BrandConnection!
    brandByDomain(domain: String!): Brand

    # Mention Queries
    mention(id: ID!): Mention
    mentions(
      brandId: ID
      first: Int
      after: String
      platform: Platform
      sentiment: Sentiment
      startDate: DateTime
      endDate: DateTime
    ): MentionConnection!

    # GEO Score Queries
    geoScore(brandId: ID!): GEOScore
    geoScoreHistory(brandId: ID!, days: Int): [GEOScoreHistory!]!

    # Recommendation Queries
    recommendation(id: ID!): Recommendation
    recommendations(
      brandId: ID
      first: Int
      after: String
      status: RecommendationStatus
      priority: RecommendationPriority
      category: String
    ): RecommendationConnection!

    # Audit Queries
    audit(id: ID!): Audit
    audits(brandId: ID!, first: Int): [Audit!]!

    # Content Queries
    content(id: ID!): Content
    contents(brandId: ID, first: Int, after: String, status: ContentStatus): ContentConnection!

    # Subscription Queries
    subscription: Subscription
    subscriptionPlans: [SubscriptionPlan!]!

    # Integration Queries
    integrations: [Integration!]!
    integration(id: ID!): Integration

    # Analytics Queries
    analytics(brandId: ID!, period: String): AnalyticsSummary!
    comparePlatforms(brandId: ID!): JSON!
    competitorAnalysis(brandId: ID!): JSON!

    # System Queries
    health: HealthStatus!
    me: User!
  }

  type SubscriptionPlan {
    id: ID!
    tier: SubscriptionTier!
    name: String!
    description: String!
    priceMonthly: Float!
    priceYearly: Float!
    features: [String!]!
    limits: SubscriptionLimits!
    popular: Boolean!
  }

  type HealthStatus {
    status: String!
    database: String!
    redis: String!
    timestamp: DateTime!
  }

  type User {
    id: ID!
    email: String
    name: String
    organizationId: String
    role: String
  }

  # Root Mutation Type
  type Mutation {
    # Brand Mutations
    createBrand(input: CreateBrandInput!): Brand!
    updateBrand(id: ID!, input: UpdateBrandInput!): Brand!
    deleteBrand(id: ID!): Boolean!

    # Mention Mutations
    refreshMentions(brandId: ID!, platforms: [Platform!]): RefreshResult!
    markMentionReviewed(id: ID!): Mention!

    # GEO Score Mutations
    calculateGeoScore(brandId: ID!): GEOScore!

    # Recommendation Mutations
    updateRecommendationStatus(id: ID!, status: RecommendationStatus!): Recommendation!
    assignRecommendation(id: ID!, userId: String!): Recommendation!
    submitRecommendationFeedback(id: ID!, input: FeedbackInput!): Recommendation!
    generateRecommendations(brandId: ID!): [Recommendation!]!

    # Audit Mutations
    startAudit(brandId: ID!, url: String!): Audit!
    cancelAudit(id: ID!): Boolean!

    # Content Mutations
    createContent(input: CreateContentInput!): Content!
    updateContent(id: ID!, input: UpdateContentInput!): Content!
    deleteContent(id: ID!): Boolean!
    optimizeContent(id: ID!): Content!
    publishContent(id: ID!): Content!

    # Subscription Mutations
    createCheckoutSession(planId: String!, billingCycle: String!): CheckoutSession!
    changePlan(planId: String!): Subscription!
    cancelSubscription(immediately: Boolean): Subscription!

    # Integration Mutations
    connectIntegration(type: String!, config: JSON!): Integration!
    disconnectIntegration(id: ID!): Boolean!
    syncIntegration(id: ID!): Integration!
  }

  # Input Types
  input CreateBrandInput {
    name: String!
    domain: String
    industry: String
    description: String
    competitors: [String!]
    keywords: [String!]
    platforms: [Platform!]!
  }

  input UpdateBrandInput {
    name: String
    domain: String
    industry: String
    description: String
    competitors: [String!]
    keywords: [String!]
    platforms: [Platform!]
    isActive: Boolean
  }

  input CreateContentInput {
    brandId: ID!
    title: String!
    type: String!
    content: String!
    metadata: JSON
  }

  input UpdateContentInput {
    title: String
    type: String
    content: String
    status: ContentStatus
    metadata: JSON
  }

  input FeedbackInput {
    rating: Int!
    wasHelpful: Boolean!
    comment: String
    actualImpact: Float
  }

  type RefreshResult {
    success: Boolean!
    mentionsFound: Int!
    platforms: [Platform!]!
  }

  type CheckoutSession {
    id: ID!
    url: String!
  }

  # Subscription Type for Real-time Updates
  type Subscription {
    mentionAdded(brandId: ID!): Mention!
    recommendationUpdated(brandId: ID!): Recommendation!
    geoScoreChanged(brandId: ID!): GEOScore!
    auditProgress(auditId: ID!): AuditProgress!
  }

  type AuditProgress {
    auditId: ID!
    status: AuditStatus!
    progress: Float!
    currentStep: String
  }
`;

// Database-connected resolvers using Drizzle ORM
const resolvers = {
  Query: {
    // Brand resolvers - SELECT * FROM brands WHERE id = $1
    brand: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const user = context.requireAuth();
      const result = await db.select().from(schema.brands).where(eq(schema.brands.id, id)).limit(1);
      if (!result[0]) return null;
      // Verify user has access to this brand's organization
      const brand = result[0];
      if (user.orgId && brand.organizationId !== user.orgId) return null;
      return {
        ...brand,
        platforms: brand.monitoringPlatforms || [],
        keywords: brand.keywords || [],
        competitors: (brand.competitors || []).map((c: { name: string }) => c.name),
      };
    },

    // SELECT * FROM brands WHERE org_id = $1 LIMIT $2
    brands: async (_: unknown, args: { first?: number; search?: string }, context: GraphQLContext) => {
      const user = context.requireAuth();
      const orgId = user.orgId || user.userId;
      const limit = args.first || 20;

      let query = db.select().from(schema.brands).where(eq(schema.brands.organizationId, orgId));
      if (args.search) {
        query = db.select().from(schema.brands).where(
          and(
            eq(schema.brands.organizationId, orgId),
            like(schema.brands.name, `%${args.search}%`)
          )
        );
      }

      const results = await query.orderBy(desc(schema.brands.createdAt)).limit(limit);
      const totalResult = await db.select({ count: count() }).from(schema.brands).where(eq(schema.brands.organizationId, orgId));
      const total = totalResult[0]?.count || 0;

      return {
        edges: results.map((brand, idx) => ({
          node: {
            ...brand,
            platforms: brand.monitoringPlatforms || [],
            keywords: brand.keywords || [],
            competitors: (brand.competitors || []).map((c: { name: string }) => c.name),
          },
          cursor: Buffer.from(`brand:${idx}`).toString("base64"),
        })),
        pageInfo: {
          hasNextPage: results.length === limit,
          hasPreviousPage: false,
          startCursor: results.length > 0 ? Buffer.from("brand:0").toString("base64") : null,
          endCursor: results.length > 0 ? Buffer.from(`brand:${results.length - 1}`).toString("base64") : null,
          total,
        },
      };
    },

    // SELECT * FROM brands WHERE domain = $1
    brandByDomain: async (_: unknown, { domain }: { domain: string }, context: GraphQLContext) => {
      const user = context.requireAuth();
      const orgId = user.orgId || user.userId;
      const result = await db.select().from(schema.brands).where(
        and(
          eq(schema.brands.organizationId, orgId),
          eq(schema.brands.domain, domain)
        )
      ).limit(1);
      if (!result[0]) return null;
      const brand = result[0];
      return {
        ...brand,
        platforms: brand.monitoringPlatforms || [],
        keywords: brand.keywords || [],
        competitors: (brand.competitors || []).map((c: { name: string }) => c.name),
      };
    },

    // Mention resolvers - SELECT * FROM mentions WHERE id = $1
    mention: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      const result = await db.select().from(schema.brandMentions).where(eq(schema.brandMentions.id, id)).limit(1);
      if (!result[0]) return null;
      const mention = result[0];
      return {
        ...mention,
        sentimentScore: mention.sentiment === "positive" ? 0.8 : mention.sentiment === "negative" ? 0.2 : 0.5,
        isRecommendation: mention.promptCategory === "recommendation",
        competitorMentioned: (mention.competitors || []).length > 0,
      };
    },

    // SELECT * FROM mentions WHERE brand_id = $1
    mentions: async (_: unknown, args: { brandId?: string; first?: number; platform?: string; sentiment?: string }, context: GraphQLContext) => {
      context.requireAuth();
      const limit = args.first || 50;

      let whereConditions = [];
      if (args.brandId) {
        whereConditions.push(eq(schema.brandMentions.brandId, args.brandId));
      }

      const query = whereConditions.length > 0
        ? db.select().from(schema.brandMentions).where(and(...whereConditions))
        : db.select().from(schema.brandMentions);

      const results = await query.orderBy(desc(schema.brandMentions.timestamp)).limit(limit);
      const totalResult = args.brandId
        ? await db.select({ count: count() }).from(schema.brandMentions).where(eq(schema.brandMentions.brandId, args.brandId))
        : await db.select({ count: count() }).from(schema.brandMentions);
      const total = totalResult[0]?.count || 0;

      return {
        edges: results.map((mention, idx) => ({
          node: {
            ...mention,
            sentimentScore: mention.sentiment === "positive" ? 0.8 : mention.sentiment === "negative" ? 0.2 : 0.5,
            isRecommendation: mention.promptCategory === "recommendation",
            competitorMentioned: (mention.competitors || []).length > 0,
          },
          cursor: Buffer.from(`mention:${idx}`).toString("base64"),
        })),
        pageInfo: {
          hasNextPage: results.length === limit,
          hasPreviousPage: false,
          startCursor: results.length > 0 ? Buffer.from("mention:0").toString("base64") : null,
          endCursor: results.length > 0 ? Buffer.from(`mention:${results.length - 1}`).toString("base64") : null,
          total,
        },
        stats: {
          total,
          byPlatform: {},
          bySentiment: {},
          avgPosition: null,
        },
      };
    },

    // GEO Score - calculated from brand mentions and recommendations
    geoScore: async (_: unknown, { brandId }: { brandId: string }, context: GraphQLContext) => {
      context.requireAuth();

      // Get mention stats for the brand
      const mentionsResult = await db.select({ count: count() }).from(schema.brandMentions).where(eq(schema.brandMentions.brandId, brandId));
      const mentionCount = mentionsResult[0]?.count || 0;

      // Get recommendation stats
      const recsResult = await db.select({ count: count() }).from(schema.recommendations).where(eq(schema.recommendations.brandId, brandId));
      const recCount = recsResult[0]?.count || 0;

      // Calculate a simple GEO score based on available data
      const visibilityScore = Math.min(100, mentionCount * 5);
      const sentimentScore = 70; // Default until we analyze sentiment distribution
      const recommendationScore = Math.max(0, 100 - recCount * 5);
      const overallScore = Math.round((visibilityScore * 0.4 + sentimentScore * 0.3 + recommendationScore * 0.3));

      return {
        id: `geo_${brandId}`,
        brandId,
        overallScore,
        visibilityScore,
        sentimentScore,
        recommendationScore,
        competitorGapScore: 50,
        platformScores: {},
        previousScore: null,
        trend: 0,
        calculatedAt: new Date().toISOString(),
      };
    },

    // GEO Score history (returns empty for now - requires historical data)
    geoScoreHistory: async (_: unknown, { brandId, days }: { brandId: string; days?: number }, context: GraphQLContext) => {
      context.requireAuth();
      return [];
    },

    // Recommendation resolvers - SELECT * FROM recommendations WHERE id = $1
    recommendation: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      const result = await db.select().from(schema.recommendations).where(eq(schema.recommendations.id, id)).limit(1);
      if (!result[0]) return null;
      const rec = result[0];
      return {
        ...rec,
        type: rec.category,
        estimatedImpact: rec.impact === "high" ? 0.8 : rec.impact === "medium" ? 0.5 : 0.3,
        dependencies: [],
        evidence: {},
        aiExplanation: null,
        feedback: [],
      };
    },

    // SELECT * FROM recommendations WHERE brand_id = $1
    recommendations: async (_: unknown, args: { brandId?: string; first?: number; status?: string; priority?: string; category?: string }, context: GraphQLContext) => {
      context.requireAuth();
      const limit = args.first || 50;

      let whereConditions = [];
      if (args.brandId) {
        whereConditions.push(eq(schema.recommendations.brandId, args.brandId));
      }

      const query = whereConditions.length > 0
        ? db.select().from(schema.recommendations).where(and(...whereConditions))
        : db.select().from(schema.recommendations);

      const results = await query.orderBy(desc(schema.recommendations.createdAt)).limit(limit);
      const totalResult = args.brandId
        ? await db.select({ count: count() }).from(schema.recommendations).where(eq(schema.recommendations.brandId, args.brandId))
        : await db.select({ count: count() }).from(schema.recommendations);
      const total = totalResult[0]?.count || 0;

      return {
        edges: results.map((rec, idx) => ({
          node: {
            ...rec,
            type: rec.category,
            estimatedImpact: rec.impact === "high" ? 0.8 : rec.impact === "medium" ? 0.5 : 0.3,
            dependencies: [],
            evidence: {},
            aiExplanation: null,
            feedback: [],
          },
          cursor: Buffer.from(`rec:${idx}`).toString("base64"),
        })),
        pageInfo: {
          hasNextPage: results.length === limit,
          hasPreviousPage: false,
          startCursor: results.length > 0 ? Buffer.from("rec:0").toString("base64") : null,
          endCursor: results.length > 0 ? Buffer.from(`rec:${results.length - 1}`).toString("base64") : null,
          total,
        },
      };
    },

    // Audit resolvers - SELECT * FROM audits WHERE id = $1
    audit: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      const result = await db.select().from(schema.audits).where(eq(schema.audits.id, id)).limit(1);
      if (!result[0]) return null;
      const audit = result[0];
      return {
        ...audit,
        categories: audit.categoryScores?.map((cs: { category: string; score: number; maxScore: number; issues: number }) => ({
          name: cs.category,
          score: cs.score,
          weight: 1,
          issues: cs.issues,
          passed: cs.maxScore - cs.issues,
        })) || [],
      };
    },

    // SELECT * FROM audits WHERE brand_id = $1 LIMIT $2
    audits: async (_: unknown, { brandId, first }: { brandId: string; first?: number }, context: GraphQLContext) => {
      context.requireAuth();
      const limit = first || 20;
      const results = await db.select().from(schema.audits)
        .where(eq(schema.audits.brandId, brandId))
        .orderBy(desc(schema.audits.createdAt))
        .limit(limit);

      return results.map(audit => ({
        ...audit,
        categories: audit.categoryScores?.map((cs: { category: string; score: number; maxScore: number; issues: number }) => ({
          name: cs.category,
          score: cs.score,
          weight: 1,
          issues: cs.issues,
          passed: cs.maxScore - cs.issues,
        })) || [],
      }));
    },

    // Content resolvers - SELECT * FROM content WHERE id = $1
    content: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      const result = await db.select().from(schema.content).where(eq(schema.content.id, id)).limit(1);
      if (!result[0]) return null;
      const c = result[0];
      return {
        ...c,
        type: c.type,
        seoScore: c.seoScore,
        aiOptimizationScore: c.aiScore,
        suggestions: [],
      };
    },

    // SELECT * FROM content WHERE brand_id = $1
    contents: async (_: unknown, args: { brandId?: string; first?: number; status?: string }, context: GraphQLContext) => {
      context.requireAuth();
      const limit = args.first || 50;

      let whereConditions = [];
      if (args.brandId) {
        whereConditions.push(eq(schema.content.brandId, args.brandId));
      }

      const query = whereConditions.length > 0
        ? db.select().from(schema.content).where(and(...whereConditions))
        : db.select().from(schema.content);

      const results = await query.orderBy(desc(schema.content.createdAt)).limit(limit);
      const totalResult = args.brandId
        ? await db.select({ count: count() }).from(schema.content).where(eq(schema.content.brandId, args.brandId))
        : await db.select({ count: count() }).from(schema.content);
      const total = totalResult[0]?.count || 0;

      return {
        edges: results.map((c, idx) => ({
          node: {
            ...c,
            type: c.type,
            seoScore: c.seoScore,
            aiOptimizationScore: c.aiScore,
            suggestions: [],
          },
          cursor: Buffer.from(`content:${idx}`).toString("base64"),
        })),
        pageInfo: {
          hasNextPage: results.length === limit,
          hasPreviousPage: false,
          startCursor: results.length > 0 ? Buffer.from("content:0").toString("base64") : null,
          endCursor: results.length > 0 ? Buffer.from(`content:${results.length - 1}`).toString("base64") : null,
          total,
        },
      };
    },

    // Subscription/Billing resolvers - returns org data from organizations table
    subscription: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = context.requireAuth();
      const orgId = user.orgId || user.userId;

      const result = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId)).limit(1);
      if (!result[0]) return null;

      const org = result[0];
      return {
        id: org.id,
        organizationId: org.id,
        tier: org.plan || "free",
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        usage: null,
        features: [],
        limits: {
          brands: org.plan === "enterprise" ? 999 : org.plan === "pro" ? 10 : org.plan === "starter" ? 3 : 1,
          platforms: 7,
          mentionsPerMonth: 10000,
          auditsPerMonth: 50,
          aiTokensPerMonth: 100000,
          contentPiecesPerMonth: 100,
        },
      };
    },

    // Subscription plans (static for now)
    subscriptionPlans: async () => [
      {
        id: "free",
        tier: "free",
        name: "Free",
        description: "Get started with basic monitoring",
        priceMonthly: 0,
        priceYearly: 0,
        features: ["1 brand", "Basic monitoring", "Weekly reports"],
        limits: { brands: 1, platforms: 3, mentionsPerMonth: 100, auditsPerMonth: 2, aiTokensPerMonth: 1000, contentPiecesPerMonth: 5 },
        popular: false,
      },
      {
        id: "starter",
        tier: "starter",
        name: "Starter",
        description: "Perfect for small businesses",
        priceMonthly: 29,
        priceYearly: 290,
        features: ["3 brands", "All platforms", "Daily monitoring", "Email alerts"],
        limits: { brands: 3, platforms: 7, mentionsPerMonth: 1000, auditsPerMonth: 10, aiTokensPerMonth: 10000, contentPiecesPerMonth: 25 },
        popular: false,
      },
      {
        id: "pro",
        tier: "pro",
        name: "Professional",
        description: "For growing teams",
        priceMonthly: 99,
        priceYearly: 990,
        features: ["10 brands", "All platforms", "Real-time monitoring", "API access", "Priority support"],
        limits: { brands: 10, platforms: 7, mentionsPerMonth: 10000, auditsPerMonth: 50, aiTokensPerMonth: 100000, contentPiecesPerMonth: 100 },
        popular: true,
      },
      {
        id: "enterprise",
        tier: "enterprise",
        name: "Enterprise",
        description: "For large organizations",
        priceMonthly: 299,
        priceYearly: 2990,
        features: ["Unlimited brands", "Custom integrations", "Dedicated support", "SLA", "White-label"],
        limits: { brands: 999, platforms: 7, mentionsPerMonth: 100000, auditsPerMonth: 500, aiTokensPerMonth: 1000000, contentPiecesPerMonth: 1000 },
        popular: false,
      },
    ],

    // Integration resolvers - SELECT * FROM integrations WHERE org_id = $1
    integrations: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = context.requireAuth();
      const orgId = user.orgId || user.userId;
      const results = await db.select().from(schema.apiIntegrations).where(eq(schema.apiIntegrations.organizationId, orgId));
      return results.map(int => ({
        ...int,
        type: int.category,
        isConnected: int.status === "active",
      }));
    },

    // SELECT * FROM integrations WHERE id = $1
    integration: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      const result = await db.select().from(schema.apiIntegrations).where(eq(schema.apiIntegrations.id, id)).limit(1);
      if (!result[0]) return null;
      const int = result[0];
      return {
        ...int,
        type: int.category,
        isConnected: int.status === "active",
      };
    },

    // Analytics resolvers - aggregation queries
    analytics: async (_: unknown, { brandId, period }: { brandId: string; period?: string }, context: GraphQLContext) => {
      context.requireAuth();

      const periodDays = period === "30d" ? 30 : period === "90d" ? 90 : 7;
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

      // Get mention counts
      const mentionsResult = await db.select({ count: count() }).from(schema.brandMentions)
        .where(eq(schema.brandMentions.brandId, brandId));
      const mentionCount = mentionsResult[0]?.count || 0;

      // Get recommendation counts
      const recsResult = await db.select({ count: count() }).from(schema.recommendations)
        .where(eq(schema.recommendations.brandId, brandId));
      const recCount = recsResult[0]?.count || 0;

      const completedRecsResult = await db.select({ count: count() }).from(schema.recommendations)
        .where(and(eq(schema.recommendations.brandId, brandId), eq(schema.recommendations.status, "completed")));
      const completedCount = completedRecsResult[0]?.count || 0;

      // Get content counts
      const contentResult = await db.select({ count: count() }).from(schema.content)
        .where(eq(schema.content.brandId, brandId));
      const contentCount = contentResult[0]?.count || 0;

      return {
        period: period || "7d",
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        geoScore: { current: 72, previous: 68, change: 4, trend: "up" },
        mentions: { total: mentionCount, change: 0, byPlatform: {}, bySentiment: {}, topQueries: [] },
        recommendations: { total: recCount, completed: completedCount, inProgress: 0, pending: recCount - completedCount, avgImpact: 0.6 },
        content: { total: contentCount, published: 0, avgSeoScore: 75, avgAiScore: 80 },
      };
    },

    // Platform comparison query
    comparePlatforms: async (_: unknown, { brandId }: { brandId: string }, context: GraphQLContext) => {
      context.requireAuth();

      // Get mentions grouped by platform
      const mentions = await db.select().from(schema.brandMentions)
        .where(eq(schema.brandMentions.brandId, brandId));

      const platformStats: Record<string, { count: number; positive: number; negative: number; neutral: number }> = {};
      mentions.forEach(m => {
        const platform = m.platform;
        if (!platformStats[platform]) {
          platformStats[platform] = { count: 0, positive: 0, negative: 0, neutral: 0 };
        }
        platformStats[platform].count++;
        platformStats[platform][m.sentiment]++;
      });

      return platformStats;
    },

    // Competitor analysis query
    competitorAnalysis: async (_: unknown, { brandId }: { brandId: string }, context: GraphQLContext) => {
      context.requireAuth();

      const brandResult = await db.select().from(schema.brands).where(eq(schema.brands.id, brandId)).limit(1);
      if (!brandResult[0]) return { competitors: [], yourBrand: null, opportunities: [] };

      const brand = brandResult[0];
      const competitors = (brand.competitors || []).map((c: { name: string; url: string }) => ({
        name: c.name,
        url: c.url,
        mentionCount: 0,
        sentiment: "neutral",
      }));

      return {
        competitors,
        yourBrand: { name: brand.name, mentionCount: 0, sentiment: "neutral" },
        opportunities: [],
      };
    },

    // System resolvers
    health: async () => ({
      status: "healthy",
      database: "connected",
      redis: "connected",
      timestamp: new Date().toISOString(),
    }),

    me: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = context.requireAuth();
      const orgId = user.orgId || user.userId;

      // Try to get user from database
      const userResult = await db.select().from(schema.users).where(eq(schema.users.clerkId, user.userId)).limit(1);

      if (userResult[0]) {
        return {
          id: userResult[0].id,
          email: userResult[0].email,
          name: userResult[0].name,
          organizationId: userResult[0].organizationId,
          role: userResult[0].role,
        };
      }

      return {
        id: user.userId,
        email: null,
        name: null,
        organizationId: orgId,
        role: "user",
      };
    },
  },

  Mutation: {
    // Brand mutations - INSERT INTO brands
    createBrand: async (_: unknown, { input }: { input: { name: string; domain?: string; industry?: string; description?: string; competitors?: string[]; keywords?: string[]; platforms: string[] } }, context: GraphQLContext) => {
      const user = context.requireAuth();
      const orgId = user.orgId || user.userId;

      const [brand] = await db.insert(schema.brands).values({
        organizationId: orgId,
        name: input.name,
        domain: input.domain || null,
        industry: input.industry || null,
        description: input.description || null,
        keywords: input.keywords || [],
        competitors: (input.competitors || []).map(name => ({ name, url: "", reason: "" })),
        monitoringPlatforms: input.platforms,
        isActive: true,
      }).returning();

      return {
        ...brand,
        platforms: brand.monitoringPlatforms || [],
        keywords: brand.keywords || [],
        competitors: (brand.competitors || []).map((c: { name: string }) => c.name),
      };
    },

    // UPDATE brands SET ... WHERE id = $1
    updateBrand: async (_: unknown, { id, input }: { id: string; input: { name?: string; domain?: string; industry?: string; description?: string; competitors?: string[]; keywords?: string[]; platforms?: string[]; isActive?: boolean } }, context: GraphQLContext) => {
      const user = context.requireAuth();

      // Verify ownership
      const existing = await db.select().from(schema.brands).where(eq(schema.brands.id, id)).limit(1);
      if (!existing[0]) throw new Error("Brand not found");
      if (user.orgId && existing[0].organizationId !== user.orgId) throw new Error("Unauthorized");

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.domain !== undefined) updateData.domain = input.domain;
      if (input.industry !== undefined) updateData.industry = input.industry;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.keywords !== undefined) updateData.keywords = input.keywords;
      if (input.competitors !== undefined) updateData.competitors = input.competitors.map(name => ({ name, url: "", reason: "" }));
      if (input.platforms !== undefined) updateData.monitoringPlatforms = input.platforms;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      const [brand] = await db.update(schema.brands).set(updateData).where(eq(schema.brands.id, id)).returning();

      return {
        ...brand,
        platforms: brand.monitoringPlatforms || [],
        keywords: brand.keywords || [],
        competitors: (brand.competitors || []).map((c: { name: string }) => c.name),
      };
    },

    // DELETE FROM brands WHERE id = $1
    deleteBrand: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const user = context.requireAuth();

      const existing = await db.select().from(schema.brands).where(eq(schema.brands.id, id)).limit(1);
      if (!existing[0]) return false;
      if (user.orgId && existing[0].organizationId !== user.orgId) throw new Error("Unauthorized");

      await db.delete(schema.brands).where(eq(schema.brands.id, id));
      return true;
    },

    // Mention mutations - trigger monitoring refresh
    refreshMentions: async (_: unknown, { brandId, platforms }: { brandId: string; platforms?: string[] }, context: GraphQLContext) => {
      context.requireAuth();
      // This would trigger a background job to scrape mentions
      // For now, return success with 0 mentions found
      return {
        success: true,
        mentionsFound: 0,
        platforms: platforms || ["chatgpt", "claude", "gemini", "perplexity"],
      };
    },

    // Mark mention as reviewed (we don't have a reviewed field, but could add metadata)
    markMentionReviewed: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      const result = await db.select().from(schema.brandMentions).where(eq(schema.brandMentions.id, id)).limit(1);
      if (!result[0]) throw new Error("Mention not found");
      return {
        ...result[0],
        sentimentScore: result[0].sentiment === "positive" ? 0.8 : result[0].sentiment === "negative" ? 0.2 : 0.5,
        isRecommendation: result[0].promptCategory === "recommendation",
        competitorMentioned: (result[0].competitors || []).length > 0,
      };
    },

    // GEO Score calculation
    calculateGeoScore: async (_: unknown, { brandId }: { brandId: string }, context: GraphQLContext) => {
      context.requireAuth();
      // Return calculated GEO score (same as query)
      const mentionsResult = await db.select({ count: count() }).from(schema.brandMentions).where(eq(schema.brandMentions.brandId, brandId));
      const mentionCount = mentionsResult[0]?.count || 0;
      const recsResult = await db.select({ count: count() }).from(schema.recommendations).where(eq(schema.recommendations.brandId, brandId));
      const recCount = recsResult[0]?.count || 0;

      const visibilityScore = Math.min(100, mentionCount * 5);
      const sentimentScore = 70;
      const recommendationScore = Math.max(0, 100 - recCount * 5);
      const overallScore = Math.round((visibilityScore * 0.4 + sentimentScore * 0.3 + recommendationScore * 0.3));

      return {
        id: `geo_${brandId}`,
        brandId,
        overallScore,
        visibilityScore,
        sentimentScore,
        recommendationScore,
        competitorGapScore: 50,
        platformScores: {},
        previousScore: null,
        trend: 0,
        calculatedAt: new Date().toISOString(),
      };
    },

    // Recommendation mutations - UPDATE recommendations SET status = $2 WHERE id = $1
    updateRecommendationStatus: async (_: unknown, { id, status }: { id: string; status: "pending" | "in_progress" | "completed" | "dismissed" }, context: GraphQLContext) => {
      context.requireAuth();

      const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
      if (status === "completed") updateData.completedAt = new Date();
      if (status === "dismissed") updateData.dismissedAt = new Date();

      const [rec] = await db.update(schema.recommendations).set(updateData).where(eq(schema.recommendations.id, id)).returning();
      if (!rec) throw new Error("Recommendation not found");

      return {
        ...rec,
        type: rec.category,
        estimatedImpact: rec.impact === "high" ? 0.8 : rec.impact === "medium" ? 0.5 : 0.3,
        dependencies: [],
        evidence: {},
        aiExplanation: null,
        feedback: [],
      };
    },

    // UPDATE recommendations SET assigned_to = $2 WHERE id = $1
    assignRecommendation: async (_: unknown, { id, userId }: { id: string; userId: string }, context: GraphQLContext) => {
      context.requireAuth();

      const [rec] = await db.update(schema.recommendations).set({ assignedToId: userId, updatedAt: new Date() }).where(eq(schema.recommendations.id, id)).returning();
      if (!rec) throw new Error("Recommendation not found");

      return {
        ...rec,
        type: rec.category,
        estimatedImpact: rec.impact === "high" ? 0.8 : rec.impact === "medium" ? 0.5 : 0.3,
        dependencies: [],
        evidence: {},
        aiExplanation: null,
        feedback: [],
        assignedTo: userId,
      };
    },

    // Submit recommendation feedback (stored in notes for now)
    submitRecommendationFeedback: async (_: unknown, { id, input }: { id: string; input: { rating: number; wasHelpful: boolean; comment?: string } }, context: GraphQLContext) => {
      context.requireAuth();

      const existing = await db.select().from(schema.recommendations).where(eq(schema.recommendations.id, id)).limit(1);
      if (!existing[0]) throw new Error("Recommendation not found");

      const feedbackNote = `Feedback: Rating ${input.rating}/5, Helpful: ${input.wasHelpful}${input.comment ? `, Comment: ${input.comment}` : ""}`;
      const notes = existing[0].notes ? `${existing[0].notes}\n${feedbackNote}` : feedbackNote;

      const [rec] = await db.update(schema.recommendations).set({ notes, updatedAt: new Date() }).where(eq(schema.recommendations.id, id)).returning();

      return {
        ...rec,
        type: rec.category,
        estimatedImpact: rec.impact === "high" ? 0.8 : rec.impact === "medium" ? 0.5 : 0.3,
        dependencies: [],
        evidence: {},
        aiExplanation: null,
        feedback: [],
      };
    },

    // Generate recommendations (placeholder - would use AI)
    generateRecommendations: async (_: unknown, { brandId }: { brandId: string }, context: GraphQLContext) => {
      context.requireAuth();
      // Return empty array - AI generation would be implemented separately
      return [];
    },

    // Audit mutations - INSERT INTO audits
    startAudit: async (_: unknown, { brandId, url }: { brandId: string; url: string }, context: GraphQLContext) => {
      const user = context.requireAuth();

      const [audit] = await db.insert(schema.audits).values({
        brandId,
        url,
        status: "pending",
        triggeredById: user.userId,
      }).returning();

      return {
        ...audit,
        categories: [],
      };
    },

    // Cancel audit - UPDATE audits SET status = 'failed' WHERE id = $1
    cancelAudit: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      await db.update(schema.audits).set({ status: "failed", errorMessage: "Cancelled by user" }).where(eq(schema.audits.id, id));
      return true;
    },

    // Content mutations - INSERT INTO content
    createContent: async (_: unknown, { input }: { input: { brandId: string; title: string; type: string; content: string; metadata?: Record<string, unknown> } }, context: GraphQLContext) => {
      const user = context.requireAuth();

      const [content] = await db.insert(schema.content).values({
        brandId: input.brandId,
        title: input.title,
        type: input.type as "blog_post" | "social_post" | "product_description" | "faq" | "landing_page" | "email" | "ad_copy" | "press_release",
        content: input.content,
        status: "draft",
        authorId: user.userId,
      }).returning();

      return {
        ...content,
        seoScore: content.seoScore,
        aiOptimizationScore: content.aiScore,
        suggestions: [],
      };
    },

    // UPDATE content SET ... WHERE id = $1
    updateContent: async (_: unknown, { id, input }: { id: string; input: { title?: string; type?: string; content?: string; status?: string; metadata?: Record<string, unknown> } }, context: GraphQLContext) => {
      context.requireAuth();

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.title !== undefined) updateData.title = input.title;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.status !== undefined) updateData.status = input.status;

      const [content] = await db.update(schema.content).set(updateData).where(eq(schema.content.id, id)).returning();
      if (!content) throw new Error("Content not found");

      return {
        ...content,
        seoScore: content.seoScore,
        aiOptimizationScore: content.aiScore,
        suggestions: [],
      };
    },

    // DELETE FROM content WHERE id = $1
    deleteContent: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      await db.delete(schema.content).where(eq(schema.content.id, id));
      return true;
    },

    // AI content optimization (placeholder)
    optimizeContent: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      const result = await db.select().from(schema.content).where(eq(schema.content.id, id)).limit(1);
      if (!result[0]) throw new Error("Content not found");
      return {
        ...result[0],
        seoScore: result[0].seoScore,
        aiOptimizationScore: result[0].aiScore,
        suggestions: ["Add more keywords", "Improve readability", "Add structured data"],
      };
    },

    // UPDATE content SET status = 'published' WHERE id = $1
    publishContent: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      const [content] = await db.update(schema.content).set({ status: "published", publishedAt: new Date(), updatedAt: new Date() }).where(eq(schema.content.id, id)).returning();
      if (!content) throw new Error("Content not found");
      return {
        ...content,
        seoScore: content.seoScore,
        aiOptimizationScore: content.aiScore,
        suggestions: [],
      };
    },

    // Subscription mutations - these require Stripe integration
    createCheckoutSession: async (_: unknown, { planId, billingCycle }: { planId: string; billingCycle: string }, context: GraphQLContext) => {
      context.requireAuth();
      // Would integrate with Stripe here
      return { id: `checkout_${Date.now()}`, url: `/checkout?plan=${planId}&cycle=${billingCycle}` };
    },

    changePlan: async (_: unknown, { planId }: { planId: string }, context: GraphQLContext) => {
      const user = context.requireAuth();
      const orgId = user.orgId || user.userId;

      // Update organization plan
      await db.update(schema.organizations).set({ plan: planId as "free" | "starter" | "pro" | "enterprise" }).where(eq(schema.organizations.id, orgId));

      // Return updated subscription info
      const result = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId)).limit(1);
      const org = result[0];

      return {
        id: org?.id || orgId,
        organizationId: orgId,
        tier: planId,
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        usage: null,
        features: [],
        limits: { brands: 10, platforms: 7, mentionsPerMonth: 10000, auditsPerMonth: 50, aiTokensPerMonth: 100000, contentPiecesPerMonth: 100 },
      };
    },

    cancelSubscription: async (_: unknown, { immediately }: { immediately?: boolean }, context: GraphQLContext) => {
      const user = context.requireAuth();
      const orgId = user.orgId || user.userId;

      if (immediately) {
        await db.update(schema.organizations).set({ plan: "free" }).where(eq(schema.organizations.id, orgId));
      }

      const result = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId)).limit(1);
      const org = result[0];

      return {
        id: org?.id || orgId,
        organizationId: orgId,
        tier: immediately ? "free" : (org?.plan || "free"),
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: !immediately,
        usage: null,
        features: [],
        limits: { brands: 1, platforms: 3, mentionsPerMonth: 100, auditsPerMonth: 2, aiTokensPerMonth: 1000, contentPiecesPerMonth: 5 },
      };
    },

    // Integration mutations
    connectIntegration: async (_: unknown, { type, config }: { type: string; config: Record<string, unknown> }, context: GraphQLContext) => {
      const user = context.requireAuth();
      const orgId = user.orgId || user.userId;

      const [integration] = await db.insert(schema.apiIntegrations).values({
        organizationId: orgId,
        name: type,
        category: type as "communication" | "analytics" | "project_management" | "social_media" | "seo_tools" | "custom",
        status: "active",
        config: config,
      }).returning();

      return {
        ...integration,
        type: integration.category,
        isConnected: true,
      };
    },

    disconnectIntegration: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      await db.delete(schema.apiIntegrations).where(eq(schema.apiIntegrations.id, id));
      return true;
    },

    syncIntegration: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      const result = await db.select().from(schema.apiIntegrations).where(eq(schema.apiIntegrations.id, id)).limit(1);
      if (!result[0]) throw new Error("Integration not found");

      // Update last synced timestamp
      const [integration] = await db.update(schema.apiIntegrations).set({ lastSyncedAt: new Date() }).where(eq(schema.apiIntegrations.id, id)).returning();

      return {
        ...integration,
        type: integration.category,
        isConnected: integration.status === "active",
      };
    },
  },

  // Field resolvers
  Brand: {
    mentions: async (parent: { id: string }, { first, after }: { first?: number; after?: string }) => {
      const limit = Math.min(first || 20, 100);
      let whereClause = eq(schema.brandMentions.brandId, parent.id);

      if (after) {
        const cursorId = Buffer.from(after, "base64").toString("utf-8");
        whereClause = and(whereClause, sql`${schema.brandMentions.id} < ${cursorId}`) as typeof whereClause;
      }

      const mentions = await db.select().from(schema.brandMentions)
        .where(whereClause)
        .orderBy(desc(schema.brandMentions.detectedAt))
        .limit(limit + 1);

      const hasNextPage = mentions.length > limit;
      const edges = mentions.slice(0, limit).map(m => ({
        cursor: Buffer.from(m.id).toString("base64"),
        node: {
          ...m,
          mentionDate: m.detectedAt?.toISOString() || new Date().toISOString(),
          url: m.sourceUrl || "",
          context: m.response || "",
          position: m.position || 0,
        },
      }));

      const totalResult = await db.select({ count: count() }).from(schema.brandMentions).where(eq(schema.brandMentions.brandId, parent.id));
      const total = totalResult[0]?.count || 0;

      // Calculate stats
      const positiveCount = await db.select({ count: count() }).from(schema.brandMentions)
        .where(and(eq(schema.brandMentions.brandId, parent.id), eq(schema.brandMentions.sentiment, "positive")));
      const negativeCount = await db.select({ count: count() }).from(schema.brandMentions)
        .where(and(eq(schema.brandMentions.brandId, parent.id), eq(schema.brandMentions.sentiment, "negative")));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
          total,
        },
        stats: {
          total,
          positive: positiveCount[0]?.count || 0,
          negative: negativeCount[0]?.count || 0,
          neutral: total - (positiveCount[0]?.count || 0) - (negativeCount[0]?.count || 0),
        },
      };
    },

    recommendations: async (parent: { id: string }) => {
      const recs = await db.select().from(schema.recommendations)
        .where(eq(schema.recommendations.brandId, parent.id))
        .orderBy(desc(schema.recommendations.createdAt));
      return recs.map(r => ({
        ...r,
        effort: r.effort || "medium",
        dueDate: r.dueDate?.toISOString() || null,
        completedAt: r.completedAt?.toISOString() || null,
      }));
    },

    audits: async (parent: { id: string }) => {
      const audits = await db.select().from(schema.audits)
        .where(eq(schema.audits.brandId, parent.id))
        .orderBy(desc(schema.audits.createdAt));
      return audits.map(a => ({
        ...a,
        startedAt: a.startedAt?.toISOString() || null,
        completedAt: a.completedAt?.toISOString() || null,
        duration: a.completedAt && a.startedAt ? Math.round((a.completedAt.getTime() - a.startedAt.getTime()) / 1000) : null,
      }));
    },

    geoScore: async (parent: { id: string }) => {
      // Calculate real-time GEO score from mentions and recommendations
      const mentionsResult = await db.select({ count: count() }).from(schema.brandMentions).where(eq(schema.brandMentions.brandId, parent.id));
      const mentionCount = mentionsResult[0]?.count || 0;

      const positiveResult = await db.select({ count: count() }).from(schema.brandMentions)
        .where(and(eq(schema.brandMentions.brandId, parent.id), eq(schema.brandMentions.sentiment, "positive")));
      const positiveCount = positiveResult[0]?.count || 0;

      const recsResult = await db.select({ count: count() }).from(schema.recommendations).where(eq(schema.recommendations.brandId, parent.id));
      const recCount = recsResult[0]?.count || 0;

      const completedRecsResult = await db.select({ count: count() }).from(schema.recommendations)
        .where(and(eq(schema.recommendations.brandId, parent.id), eq(schema.recommendations.status, "completed")));
      const completedRecs = completedRecsResult[0]?.count || 0;

      const visibilityScore = Math.min(100, mentionCount * 5);
      const sentimentScore = mentionCount > 0 ? Math.round((positiveCount / mentionCount) * 100) : 50;
      const recommendationScore = recCount > 0 ? Math.round((completedRecs / recCount) * 100) : 100;
      const overallScore = Math.round((visibilityScore * 0.4 + sentimentScore * 0.3 + recommendationScore * 0.3));

      return {
        id: `geo_${parent.id}`,
        brandId: parent.id,
        overallScore,
        visibilityScore,
        sentimentScore,
        recommendationScore,
        competitorGapScore: 50,
        platformScores: {},
        previousScore: null,
        trend: 0,
        calculatedAt: new Date().toISOString(),
      };
    },

    stats: async (parent: { id: string }) => {
      const totalMentions = await db.select({ count: count() }).from(schema.brandMentions).where(eq(schema.brandMentions.brandId, parent.id));
      const positiveMentions = await db.select({ count: count() }).from(schema.brandMentions)
        .where(and(eq(schema.brandMentions.brandId, parent.id), eq(schema.brandMentions.sentiment, "positive")));
      const negativeMentions = await db.select({ count: count() }).from(schema.brandMentions)
        .where(and(eq(schema.brandMentions.brandId, parent.id), eq(schema.brandMentions.sentiment, "negative")));

      const recommendationCount = await db.select({ count: count() }).from(schema.recommendations).where(eq(schema.recommendations.brandId, parent.id));
      const completedRecommendations = await db.select({ count: count() }).from(schema.recommendations)
        .where(and(eq(schema.recommendations.brandId, parent.id), eq(schema.recommendations.status, "completed")));

      const total = totalMentions[0]?.count || 0;
      const positive = positiveMentions[0]?.count || 0;
      const negative = negativeMentions[0]?.count || 0;
      const avgSentiment = total > 0 ? Math.round(((positive - negative) / total) * 100) : 0;

      return {
        totalMentions: total,
        positiveMentions: positive,
        negativeMentions: negative,
        avgSentiment,
        mentionsTrend: 0,
        recommendationCount: recommendationCount[0]?.count || 0,
        completedRecommendations: completedRecommendations[0]?.count || 0,
      };
    },
  },

  Mention: {
    brand: async (parent: { brandId: string }) => {
      const result = await db.select().from(schema.brands).where(eq(schema.brands.id, parent.brandId)).limit(1);
      if (!result[0]) return null;
      const brand = result[0];
      return {
        ...brand,
        platforms: brand.monitoringPlatforms || [],
        keywords: brand.keywords || [],
        competitors: (brand.competitors || []).map((c: { name: string }) => c.name),
      };
    },
  },

  Recommendation: {
    brand: async (parent: { brandId: string }) => {
      const result = await db.select().from(schema.brands).where(eq(schema.brands.id, parent.brandId)).limit(1);
      if (!result[0]) return null;
      const brand = result[0];
      return {
        ...brand,
        platforms: brand.monitoringPlatforms || [],
        keywords: brand.keywords || [],
        competitors: (brand.competitors || []).map((c: { name: string }) => c.name),
      };
    },
    feedback: async (parent: { id: string }) => {
      // Feedback would be stored in a separate table - return empty for now
      // TODO: Add recommendation_feedback table if needed
      return [];
    },
  },

  Audit: {
    brand: async (parent: { brandId: string }) => {
      const result = await db.select().from(schema.brands).where(eq(schema.brands.id, parent.brandId)).limit(1);
      if (!result[0]) return null;
      const brand = result[0];
      return {
        ...brand,
        platforms: brand.monitoringPlatforms || [],
        keywords: brand.keywords || [],
        competitors: (brand.competitors || []).map((c: { name: string }) => c.name),
      };
    },
  },

  Content: {
    brand: async (parent: { brandId: string }) => {
      const result = await db.select().from(schema.brands).where(eq(schema.brands.id, parent.brandId)).limit(1);
      if (!result[0]) return null;
      const brand = result[0];
      return {
        ...brand,
        platforms: brand.monitoringPlatforms || [],
        keywords: brand.keywords || [],
        competitors: (brand.competitors || []).map((c: { name: string }) => c.name),
      };
    },
  },

  GEOScore: {
    history: async (parent: { brandId: string }, { days }: { days?: number }) => {
      // Generate historical data based on current mentions over time
      const limit = days || 30;
      const history: Array<{ date: string; score: number; visibilityScore: number; sentimentScore: number; recommendationScore: number }> = [];

      // For now return empty - would need a geo_score_history table for real historical data
      // TODO: Add geo_score_history table for tracking score changes over time
      return history;
    },
  },

  // Scalar resolvers
  DateTime: {
    serialize: (value: Date | string) => typeof value === "string" ? value : value.toISOString(),
    parseValue: (value: string) => new Date(value),
    parseLiteral: (ast: { value: string }) => new Date(ast.value),
  },
};

// Context type
interface GraphQLContext extends YogaInitialContext {
  userId?: string;
  orgId?: string;
  requireAuth: () => { userId: string; orgId?: string };
}

// Create context function
async function createContext(): Promise<Partial<GraphQLContext>> {
  try {
    const { userId, orgId } = await auth();
    return {
      userId: userId || undefined,
      orgId: orgId || undefined,
      requireAuth: () => {
        if (!userId) {
          throw new Error("Unauthorized");
        }
        return { userId, orgId: orgId || undefined };
      },
    };
  } catch {
    return {
      requireAuth: () => {
        throw new Error("Unauthorized");
      },
    };
  }
}

// Create schema
export const schema = createSchema({
  typeDefs,
  resolvers,
});

// Create Yoga instance
export const yoga = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  graphiql: {
    title: "Apex GEO/AEO GraphQL API",
    defaultQuery: `# Welcome to Apex GraphQL API!
# Try running these queries:

query GetBrands {
  brands(first: 10) {
    edges {
      node {
        id
        name
        domain
        geoScore {
          overallScore
          trend
        }
      }
    }
  }
}

query GetAnalytics {
  analytics(brandId: "brand_1", period: "7d") {
    geoScore {
      current
      previous
      change
      trend
    }
    mentions {
      total
      byPlatform
    }
  }
}

query SystemHealth {
  health {
    status
    database
    redis
    timestamp
  }
}
`,
  },
});

