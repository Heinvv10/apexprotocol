/**
 * Test Data Factory Functions
 *
 * Provides factory functions for creating test data objects that match
 * the Drizzle schema types used in GraphQL resolvers.
 */

// Base ID generator for consistent test IDs
let idCounter = 1;

export function resetIdCounter(): void {
  idCounter = 1;
}

export function generateId(prefix = "test"): string {
  return `${prefix}-${idCounter++}`;
}

// Timestamp helpers
export function createTimestamp(daysAgo = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

export function createISOTimestamp(daysAgo = 0): string {
  return createTimestamp(daysAgo).toISOString();
}

// Brand Factory
export interface MockBrand {
  id: string;
  organizationId: string;
  name: string;
  domain: string | null;
  industry: string | null;
  description: string | null;
  competitors: string[] | null;
  keywords: string[] | null;
  platforms: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockBrand(overrides: Partial<MockBrand> = {}): MockBrand {
  const id = overrides.id ?? generateId("brand");
  return {
    id,
    organizationId: overrides.organizationId ?? generateId("org"),
    name: overrides.name ?? `Test Brand ${id}`,
    domain: overrides.domain ?? `testbrand-${id}.com`,
    industry: overrides.industry ?? "Technology",
    description: overrides.description ?? "A test brand for unit testing",
    competitors: overrides.competitors ?? ["competitor1.com", "competitor2.com"],
    keywords: overrides.keywords ?? ["test", "brand", "keywords"],
    platforms: overrides.platforms ?? ["chatgpt", "claude", "gemini"],
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? createTimestamp(),
    updatedAt: overrides.updatedAt ?? createTimestamp(),
  };
}

export function createMockBrands(
  count: number,
  overrides: Partial<MockBrand> = {}
): MockBrand[] {
  return Array.from({ length: count }, () => createMockBrand(overrides));
}

// Mention Factory
export interface MockMention {
  id: string;
  brandId: string;
  platform: string;
  query: string;
  response: string;
  position: number | null;
  sentiment: string;
  sentimentScore: number;
  isRecommendation: boolean;
  competitorMentioned: boolean | null;
  competitors: string[] | null;
  url: string | null;
  metadata: Record<string, unknown> | null;
  isReviewed: boolean;
  createdAt: Date;
}

export function createMockMention(
  overrides: Partial<MockMention> = {}
): MockMention {
  const id = overrides.id ?? generateId("mention");
  return {
    id,
    brandId: overrides.brandId ?? generateId("brand"),
    platform: overrides.platform ?? "chatgpt",
    query: overrides.query ?? "What is the best test tool?",
    response:
      overrides.response ??
      "Based on my analysis, Test Brand is one of the leading options...",
    position: overrides.position ?? 1,
    sentiment: overrides.sentiment ?? "positive",
    sentimentScore: overrides.sentimentScore ?? 0.8,
    isRecommendation: overrides.isRecommendation ?? true,
    competitorMentioned: overrides.competitorMentioned ?? false,
    competitors: overrides.competitors ?? null,
    url: overrides.url ?? null,
    metadata: overrides.metadata ?? null,
    isReviewed: overrides.isReviewed ?? false,
    createdAt: overrides.createdAt ?? createTimestamp(),
  };
}

export function createMockMentions(
  count: number,
  overrides: Partial<MockMention> = {}
): MockMention[] {
  return Array.from({ length: count }, () => createMockMention(overrides));
}

// Recommendation Factory
export interface MockRecommendation {
  id: string;
  brandId: string;
  auditId: string | null;
  templateId: string | null;
  type: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  estimatedImpact: number;
  effort: string;
  dependencies: string[] | null;
  evidence: Record<string, unknown> | null;
  assignedTo: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockRecommendation(
  overrides: Partial<MockRecommendation> = {}
): MockRecommendation {
  const id = overrides.id ?? generateId("rec");
  return {
    id,
    brandId: overrides.brandId ?? generateId("brand"),
    auditId: overrides.auditId ?? null,
    templateId: overrides.templateId ?? null,
    type: overrides.type ?? "optimization",
    category: overrides.category ?? "content",
    title: overrides.title ?? "Improve brand visibility",
    description:
      overrides.description ??
      "Enhance your brand presence by optimizing key touchpoints",
    priority: overrides.priority ?? "high",
    status: overrides.status ?? "pending",
    estimatedImpact: overrides.estimatedImpact ?? 15,
    effort: overrides.effort ?? "medium",
    dependencies: overrides.dependencies ?? null,
    evidence: overrides.evidence ?? null,
    assignedTo: overrides.assignedTo ?? null,
    dueDate: overrides.dueDate ?? null,
    completedAt: overrides.completedAt ?? null,
    source: overrides.source ?? "audit",
    createdAt: overrides.createdAt ?? createTimestamp(),
    updatedAt: overrides.updatedAt ?? createTimestamp(),
  };
}

export function createMockRecommendations(
  count: number,
  overrides: Partial<MockRecommendation> = {}
): MockRecommendation[] {
  return Array.from({ length: count }, () =>
    createMockRecommendation(overrides)
  );
}

// Audit Factory
export interface MockAudit {
  id: string;
  brandId: string;
  name: string;
  status: string;
  overallScore: number | null;
  categoryScores: Record<string, unknown> | null;
  issues: Array<Record<string, unknown>> | null;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
  triggeredBy: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockAudit(overrides: Partial<MockAudit> = {}): MockAudit {
  const id = overrides.id ?? generateId("audit");
  return {
    id,
    brandId: overrides.brandId ?? generateId("brand"),
    name: overrides.name ?? `Brand Audit ${id}`,
    status: overrides.status ?? "completed",
    overallScore: overrides.overallScore ?? 75,
    categoryScores:
      overrides.categoryScores ??
      ({
        visibility: 80,
        sentiment: 70,
        recommendations: 75,
      } as Record<string, unknown>),
    issues: overrides.issues ?? [],
    progress: overrides.progress ?? 100,
    startedAt: overrides.startedAt ?? createTimestamp(1),
    completedAt: overrides.completedAt ?? createTimestamp(),
    triggeredBy: overrides.triggeredBy ?? generateId("user"),
    metadata: overrides.metadata ?? null,
    createdAt: overrides.createdAt ?? createTimestamp(1),
    updatedAt: overrides.updatedAt ?? createTimestamp(),
  };
}

export function createMockAudits(
  count: number,
  overrides: Partial<MockAudit> = {}
): MockAudit[] {
  return Array.from({ length: count }, () => createMockAudit(overrides));
}

// Content Factory
export interface MockContent {
  id: string;
  brandId: string;
  title: string;
  type: string;
  content: string;
  status: string;
  seoScore: number | null;
  aiScore: number | null;
  suggestions: Array<Record<string, unknown>> | null;
  metadata: Record<string, unknown> | null;
  author: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockContent(
  overrides: Partial<MockContent> = {}
): MockContent {
  const id = overrides.id ?? generateId("content");
  return {
    id,
    brandId: overrides.brandId ?? generateId("brand"),
    title: overrides.title ?? `Test Content ${id}`,
    type: overrides.type ?? "blog_post",
    content:
      overrides.content ?? "This is test content for the GraphQL resolver tests",
    status: overrides.status ?? "draft",
    seoScore: overrides.seoScore ?? 75,
    aiScore: overrides.aiScore ?? 80,
    suggestions: overrides.suggestions ?? [],
    metadata: overrides.metadata ?? null,
    author: overrides.author ?? generateId("user"),
    publishedAt: overrides.publishedAt ?? null,
    createdAt: overrides.createdAt ?? createTimestamp(),
    updatedAt: overrides.updatedAt ?? createTimestamp(),
  };
}

export function createMockContents(
  count: number,
  overrides: Partial<MockContent> = {}
): MockContent[] {
  return Array.from({ length: count }, () => createMockContent(overrides));
}

// Organization Factory
export interface MockOrganization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  billingEmail: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  settings: Record<string, unknown> | null;
  brandingSettings: Record<string, unknown> | null;
  onboardingStatus: Record<string, unknown> | null;
  features: Record<string, boolean> | null;
  limits: Record<string, number> | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockOrganization(
  overrides: Partial<MockOrganization> = {}
): MockOrganization {
  const id = overrides.id ?? generateId("org");
  return {
    id,
    name: overrides.name ?? `Test Organization ${id}`,
    slug: overrides.slug ?? `test-org-${id}`,
    plan: overrides.plan ?? "pro",
    billingEmail: overrides.billingEmail ?? `billing@testorg-${id}.com`,
    stripeCustomerId: overrides.stripeCustomerId ?? null,
    stripeSubscriptionId: overrides.stripeSubscriptionId ?? null,
    settings: overrides.settings ?? {},
    brandingSettings: overrides.brandingSettings ?? {},
    onboardingStatus: overrides.onboardingStatus ?? { completed: true },
    features: overrides.features ?? { aiOptimization: true, advancedAnalytics: true },
    limits: overrides.limits ?? { brands: 10, audits: 100 },
    createdAt: overrides.createdAt ?? createTimestamp(),
    updatedAt: overrides.updatedAt ?? createTimestamp(),
  };
}

// User Factory
export interface MockUser {
  id: string;
  organizationId: string;
  authUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  preferences: Record<string, unknown> | null;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const id = overrides.id ?? generateId("user");
  return {
    id,
    organizationId: overrides.organizationId ?? generateId("org"),
    authUserId: overrides.authUserId ?? `auth_user_${id}`,
    email: overrides.email ?? `user-${id}@test.com`,
    firstName: overrides.firstName ?? "Test",
    lastName: overrides.lastName ?? "User",
    role: overrides.role ?? "member",
    preferences: overrides.preferences ?? {},
    lastActiveAt: overrides.lastActiveAt ?? createTimestamp(),
    createdAt: overrides.createdAt ?? createTimestamp(),
    updatedAt: overrides.updatedAt ?? createTimestamp(),
  };
}

// Integration Factory
export interface MockIntegration {
  id: string;
  organizationId: string;
  name: string;
  provider: string;
  category: string;
  status: string;
  credentials: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  lastSyncedAt: Date | null;
  syncStatus: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockIntegration(
  overrides: Partial<MockIntegration> = {}
): MockIntegration {
  const id = overrides.id ?? generateId("integration");
  return {
    id,
    organizationId: overrides.organizationId ?? generateId("org"),
    name: overrides.name ?? `Test Integration ${id}`,
    provider: overrides.provider ?? "google_analytics",
    category: overrides.category ?? "analytics",
    status: overrides.status ?? "connected",
    credentials: overrides.credentials ?? null,
    settings: overrides.settings ?? {},
    lastSyncedAt: overrides.lastSyncedAt ?? createTimestamp(),
    syncStatus: overrides.syncStatus ?? "success",
    error: overrides.error ?? null,
    createdAt: overrides.createdAt ?? createTimestamp(),
    updatedAt: overrides.updatedAt ?? createTimestamp(),
  };
}

export function createMockIntegrations(
  count: number,
  overrides: Partial<MockIntegration> = {}
): MockIntegration[] {
  return Array.from({ length: count }, () => createMockIntegration(overrides));
}

// GEO Score History Factory
export interface MockGeoScoreHistory {
  id: string;
  brandId: string;
  score: number;
  visibilityScore: number;
  sentimentScore: number;
  recommendationScore: number;
  competitorGapScore: number;
  platformScores: Record<string, number> | null;
  calculatedAt: Date;
  createdAt: Date;
}

export function createMockGeoScoreHistory(
  overrides: Partial<MockGeoScoreHistory> = {}
): MockGeoScoreHistory {
  const id = overrides.id ?? generateId("geo-history");
  return {
    id,
    brandId: overrides.brandId ?? generateId("brand"),
    score: overrides.score ?? 75,
    visibilityScore: overrides.visibilityScore ?? 80,
    sentimentScore: overrides.sentimentScore ?? 70,
    recommendationScore: overrides.recommendationScore ?? 75,
    competitorGapScore: overrides.competitorGapScore ?? 72,
    platformScores: overrides.platformScores ?? {
      chatgpt: 80,
      claude: 75,
      gemini: 70,
    },
    calculatedAt: overrides.calculatedAt ?? createTimestamp(),
    createdAt: overrides.createdAt ?? createTimestamp(),
  };
}

export function createMockGeoScoreHistoryList(
  count: number,
  brandId: string,
  options: { startDaysAgo?: number } = {}
): MockGeoScoreHistory[] {
  const { startDaysAgo = 30 } = options;
  return Array.from({ length: count }, (_, i) =>
    createMockGeoScoreHistory({
      brandId,
      score: 70 + Math.random() * 20,
      calculatedAt: createTimestamp(startDaysAgo - i),
      createdAt: createTimestamp(startDaysAgo - i),
    })
  );
}

// Recommendation Feedback Factory
export interface MockRecommendationFeedback {
  id: string;
  recommendationId: string;
  userId: string;
  rating: number;
  feedback: string | null;
  implementationNotes: string | null;
  createdAt: Date;
}

export function createMockRecommendationFeedback(
  overrides: Partial<MockRecommendationFeedback> = {}
): MockRecommendationFeedback {
  const id = overrides.id ?? generateId("feedback");
  return {
    id,
    recommendationId: overrides.recommendationId ?? generateId("rec"),
    userId: overrides.userId ?? generateId("user"),
    rating: overrides.rating ?? 4,
    feedback: overrides.feedback ?? "Very helpful recommendation",
    implementationNotes: overrides.implementationNotes ?? null,
    createdAt: overrides.createdAt ?? createTimestamp(),
  };
}

// GraphQL Context Factory
export interface MockGraphQLContext {
  userId: string;
  orgId: string;
  user: MockUser;
  organization: MockOrganization;
  requireAuth: () => { userId: string; orgId: string };
}

export function createMockGraphQLContext(
  overrides: Partial<MockGraphQLContext> = {}
): MockGraphQLContext {
  const userId = overrides.userId ?? generateId("user");
  const orgId = overrides.orgId ?? generateId("org");

  return {
    userId,
    orgId,
    user:
      overrides.user ??
      createMockUser({ id: userId, organizationId: orgId }),
    organization: overrides.organization ?? createMockOrganization({ id: orgId }),
    requireAuth: () => ({ userId, orgId }),
  };
}
