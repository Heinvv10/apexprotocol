/**
 * GraphQL Schema (F137)
 * Full GraphQL schema for GEO/AEO platform with queries, mutations, and subscriptions
 */

import { createSchema, createYoga, YogaInitialContext } from "graphql-yoga";
import { auth } from "@clerk/nextjs/server";

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

// Database-connected resolvers
// TODO: Replace with actual database queries using Drizzle ORM
const resolvers = {
  Query: {
    // Brand resolvers
    // TODO: Implement database query - SELECT * FROM brands WHERE id = $1
    brand: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      return null; // Returns null until database is connected
    },
    // TODO: Implement database query - SELECT * FROM brands WHERE org_id = $1 LIMIT $2
    brands: async (_: unknown, args: { first?: number; search?: string }, context: GraphQLContext) => {
      context.requireAuth();
      return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null, total: 0 } };
    },
    // TODO: Implement database query - SELECT * FROM brands WHERE domain = $1
    brandByDomain: async (_: unknown, { domain }: { domain: string }, context: GraphQLContext) => {
      context.requireAuth();
      return null;
    },

    // Mention resolvers
    // TODO: Implement database query - SELECT * FROM mentions WHERE id = $1
    mention: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      return null;
    },
    // TODO: Implement database query - SELECT * FROM mentions WHERE brand_id = $1
    mentions: async (_: unknown, args: unknown, context: GraphQLContext) => {
      context.requireAuth();
      return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null, total: 0 }, stats: null };
    },

    // GEO Score resolvers
    // TODO: Implement database query - SELECT * FROM geo_scores WHERE brand_id = $1 ORDER BY calculated_at DESC LIMIT 1
    geoScore: async (_: unknown, { brandId }: { brandId: string }, context: GraphQLContext) => {
      context.requireAuth();
      return null;
    },
    // TODO: Implement database query - SELECT * FROM geo_score_history WHERE brand_id = $1 ORDER BY date DESC LIMIT $2
    geoScoreHistory: async (_: unknown, { brandId, days }: { brandId: string; days?: number }, context: GraphQLContext) => {
      context.requireAuth();
      return [];
    },

    // Recommendation resolvers
    // TODO: Implement database query - SELECT * FROM recommendations WHERE id = $1
    recommendation: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      return null;
    },
    // TODO: Implement database query - SELECT * FROM recommendations WHERE brand_id = $1
    recommendations: async (_: unknown, args: unknown, context: GraphQLContext) => {
      context.requireAuth();
      return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null, total: 0 } };
    },

    // Audit resolvers
    // TODO: Implement database query - SELECT * FROM audits WHERE id = $1
    audit: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      return null;
    },
    // TODO: Implement database query - SELECT * FROM audits WHERE brand_id = $1 LIMIT $2
    audits: async (_: unknown, { brandId, first }: { brandId: string; first?: number }, context: GraphQLContext) => {
      context.requireAuth();
      return [];
    },

    // Content resolvers
    // TODO: Implement database query - SELECT * FROM content WHERE id = $1
    content: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      return null;
    },
    // TODO: Implement database query - SELECT * FROM content WHERE brand_id = $1
    contents: async (_: unknown, args: unknown, context: GraphQLContext) => {
      context.requireAuth();
      return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null, total: 0 } };
    },

    // Subscription/Billing resolvers
    // TODO: Implement database query - SELECT * FROM subscriptions WHERE org_id = $1
    subscription: async (_: unknown, __: unknown, context: GraphQLContext) => {
      context.requireAuth();
      return null;
    },
    // TODO: Implement database query - SELECT * FROM subscription_plans
    subscriptionPlans: async () => [],

    // Integration resolvers
    // TODO: Implement database query - SELECT * FROM integrations WHERE org_id = $1
    integrations: async (_: unknown, __: unknown, context: GraphQLContext) => {
      context.requireAuth();
      return [];
    },
    // TODO: Implement database query - SELECT * FROM integrations WHERE id = $1
    integration: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      return null;
    },

    // Analytics resolvers
    // TODO: Implement analytics aggregation query from database
    analytics: async (_: unknown, { brandId, period }: { brandId: string; period?: string }, context: GraphQLContext) => {
      context.requireAuth();
      return {
        period: period || "7d",
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        geoScore: { current: 0, previous: 0, change: 0, trend: "flat" },
        mentions: { total: 0, change: 0, byPlatform: {}, bySentiment: {}, topQueries: [] },
        recommendations: { total: 0, completed: 0, inProgress: 0, pending: 0, avgImpact: 0 },
        content: { total: 0, published: 0, avgSeoScore: 0, avgAiScore: 0 },
      };
    },
    // TODO: Implement platform comparison query from database
    comparePlatforms: async (_: unknown, { brandId }: { brandId: string }, context: GraphQLContext) => {
      context.requireAuth();
      return {};
    },
    // TODO: Implement competitor analysis query from database
    competitorAnalysis: async (_: unknown, { brandId }: { brandId: string }, context: GraphQLContext) => {
      context.requireAuth();
      return { competitors: [], yourBrand: null, opportunities: [] };
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
      // TODO: Fetch user details from database
      return {
        id: user.userId,
        email: null,
        name: null,
        organizationId: user.orgId || user.userId,
        role: "user",
      };
    },
  },

  Mutation: {
    // Brand mutations
    // TODO: Implement INSERT INTO brands
    createBrand: async (_: unknown, { input }: { input: unknown }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Database connection required");
    },
    // TODO: Implement UPDATE brands SET ... WHERE id = $1
    updateBrand: async (_: unknown, { id, input }: { id: string; input: unknown }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Database connection required");
    },
    // TODO: Implement DELETE FROM brands WHERE id = $1
    deleteBrand: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Database connection required");
    },

    // Mention mutations
    // TODO: Implement mention refresh via scraping service
    refreshMentions: async (_: unknown, { brandId, platforms }: { brandId: string; platforms?: string[] }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Scraping service connection required");
    },
    // TODO: Implement UPDATE mentions SET reviewed = true WHERE id = $1
    markMentionReviewed: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Database connection required");
    },

    // GEO Score mutations
    // TODO: Implement GEO score calculation service
    calculateGeoScore: async (_: unknown, { brandId }: { brandId: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: GEO score service connection required");
    },

    // Recommendation mutations
    // TODO: Implement UPDATE recommendations SET status = $2 WHERE id = $1
    updateRecommendationStatus: async (_: unknown, { id, status }: { id: string; status: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Database connection required");
    },
    // TODO: Implement UPDATE recommendations SET assigned_to = $2 WHERE id = $1
    assignRecommendation: async (_: unknown, { id, userId }: { id: string; userId: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Database connection required");
    },
    // TODO: Implement INSERT INTO recommendation_feedback
    submitRecommendationFeedback: async (_: unknown, { id, input }: { id: string; input: unknown }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Database connection required");
    },
    // TODO: Implement AI-powered recommendation generation
    generateRecommendations: async (_: unknown, { brandId }: { brandId: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: AI service connection required");
    },

    // Audit mutations
    // TODO: Implement audit job queue
    startAudit: async (_: unknown, { brandId, url }: { brandId: string; url: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Audit service connection required");
    },
    // TODO: Implement audit job cancellation
    cancelAudit: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Audit service connection required");
    },

    // Content mutations
    // TODO: Implement INSERT INTO content
    createContent: async (_: unknown, { input }: { input: unknown }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Database connection required");
    },
    // TODO: Implement UPDATE content SET ... WHERE id = $1
    updateContent: async (_: unknown, { id, input }: { id: string; input: unknown }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Database connection required");
    },
    // TODO: Implement DELETE FROM content WHERE id = $1
    deleteContent: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Database connection required");
    },
    // TODO: Implement AI content optimization
    optimizeContent: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: AI service connection required");
    },
    // TODO: Implement UPDATE content SET status = 'published' WHERE id = $1
    publishContent: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Database connection required");
    },

    // Subscription mutations
    // TODO: Implement Stripe checkout session creation
    createCheckoutSession: async (_: unknown, { planId, billingCycle }: { planId: string; billingCycle: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Stripe integration required");
    },
    // TODO: Implement Stripe subscription update
    changePlan: async (_: unknown, { planId }: { planId: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Stripe integration required");
    },
    // TODO: Implement Stripe subscription cancellation
    cancelSubscription: async (_: unknown, { immediately }: { immediately?: boolean }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Stripe integration required");
    },

    // Integration mutations
    // TODO: Implement integration OAuth flow
    connectIntegration: async (_: unknown, { type, config }: { type: string; config: unknown }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Integration service required");
    },
    // TODO: Implement integration disconnection
    disconnectIntegration: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Database connection required");
    },
    // TODO: Implement integration sync
    syncIntegration: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      context.requireAuth();
      throw new Error("Not implemented: Integration service required");
    },
  },

  // Field resolvers
  Brand: {
    // TODO: Implement SELECT * FROM mentions WHERE brand_id = $1
    mentions: async (parent: { id: string }) => ({ edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null, total: 0 }, stats: null }),
    // TODO: Implement SELECT * FROM recommendations WHERE brand_id = $1
    recommendations: async (parent: { id: string }) => [],
    // TODO: Implement SELECT * FROM audits WHERE brand_id = $1
    audits: async (parent: { id: string }) => [],
    // TODO: Implement SELECT * FROM geo_scores WHERE brand_id = $1 ORDER BY calculated_at DESC LIMIT 1
    geoScore: async (parent: { id: string }) => null,
    // TODO: Implement aggregated stats query
    stats: async (parent: { id: string }) => ({ totalMentions: 0, positiveMentions: 0, negativeMentions: 0, avgSentiment: 0, mentionsTrend: 0, recommendationCount: 0, completedRecommendations: 0 }),
  },

  Mention: {
    // TODO: Implement SELECT * FROM brands WHERE id = $1
    brand: async (parent: { brandId: string }) => null,
  },

  Recommendation: {
    // TODO: Implement SELECT * FROM brands WHERE id = $1
    brand: async (parent: { brandId: string }) => null,
    feedback: async () => [],
  },

  Audit: {
    // TODO: Implement SELECT * FROM brands WHERE id = $1
    brand: async (parent: { brandId: string }) => null,
  },

  Content: {
    // TODO: Implement SELECT * FROM brands WHERE id = $1
    brand: async (parent: { brandId: string }) => null,
  },

  GEOScore: {
    // TODO: Implement SELECT * FROM geo_score_history WHERE brand_id = $1 ORDER BY date DESC LIMIT $2
    history: async (parent: { brandId: string }, { days }: { days?: number }) => [],
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

