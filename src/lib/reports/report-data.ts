/**
 * Report Data Fetcher
 * Fetches all data needed for PDF report generation
 */

import { db } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  brands,
  organizations,
  audits,
  recommendations,
  brandMentions,
  type Brand,
  type Organization,
  type Audit,
  type Recommendation,
} from "@/lib/db/schema";

/** Platform mention count */
export interface PlatformMentionCount {
  platform: string;
  count: number;
  cited: boolean;
}

/** Category score from audit */
export interface CategoryScoreData {
  name: string;
  score: number;
  maxScore: number;
}

/** Audit issue data */
export interface AuditIssueData {
  title: string;
  severity: string;
  description: string;
}

/** Recommendation data for report */
export interface RecommendationData {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  effort: string;
  impact: string;
  category: string;
}

/** Full report data structure */
export interface ReportData {
  // Brand info
  brand: {
    id: string;
    name: string;
    domain: string | null;
    logoUrl: string | null;
    industry: string | null;
  } | null;

  // Organization info
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
  } | null;

  // Latest audit data
  audit: {
    id: string;
    overallScore: number | null;
    categoryScores: CategoryScoreData[];
    issues: AuditIssueData[];
    completedAt: string | null;
  } | null;

  // Top 5 recommendations
  recommendations: RecommendationData[];

  // Platform mentions
  platformMentions: PlatformMentionCount[];

  // Report metadata
  generatedAt: string;
}

/**
 * Get letter grade from score
 */
export function getLetterGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

/**
 * Get summary text based on score
 */
export function getScoreSummary(score: number, brandName: string): string {
  if (score >= 90) {
    return `${brandName} demonstrates excellent AI visibility with strong presence across major platforms. Continue maintaining current optimization strategies.`;
  }
  if (score >= 75) {
    return `${brandName} has good AI visibility with room for improvement. Focus on the recommended optimizations to reach the next level.`;
  }
  if (score >= 60) {
    return `${brandName} has moderate AI visibility. Significant opportunities exist to improve presence across AI platforms.`;
  }
  if (score >= 45) {
    return `${brandName} has limited AI visibility. Immediate action is recommended on critical optimizations to improve discoverability.`;
  }
  return `${brandName} has minimal AI visibility. Comprehensive optimization is required to establish presence in AI-powered search.`;
}

/**
 * Fetch all report data for a brand
 */
export async function getReportData(
  brandId: string,
  orgId: string
): Promise<ReportData> {
  // Fetch brand, org, audit, recommendations, and mentions in parallel
  const [brandResult, orgResult, auditResult, recsResult, mentionsResult] =
    await Promise.all([
      // Brand
      db.select().from(brands).where(eq(brands.id, brandId)).limit(1),

      // Organization
      db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1),

      // Latest completed audit
      db
        .select()
        .from(audits)
        .where(eq(audits.brandId, brandId))
        .orderBy(desc(audits.completedAt))
        .limit(1),

      // Top 5 recommendations by priority
      db
        .select()
        .from(recommendations)
        .where(eq(recommendations.brandId, brandId))
        .orderBy(
          sql`CASE
            WHEN ${recommendations.priority} = 'critical' THEN 1
            WHEN ${recommendations.priority} = 'high' THEN 2
            WHEN ${recommendations.priority} = 'medium' THEN 3
            ELSE 4
          END`
        )
        .limit(5),

      // Platform mention counts
      db
        .select({
          platform: brandMentions.platform,
          count: sql<number>`COUNT(*)::int`,
          hasCitation: sql<boolean>`bool_or(${brandMentions.citationUrl} IS NOT NULL)`,
        })
        .from(brandMentions)
        .where(eq(brandMentions.brandId, brandId))
        .groupBy(brandMentions.platform),
    ]);

  // Parse brand data
  const brandData = brandResult[0];
  const brand = brandData
    ? {
        id: brandData.id,
        name: brandData.name,
        domain: brandData.domain,
        logoUrl: brandData.logoUrl,
        industry: brandData.industry,
      }
    : null;

  // Parse organization data
  const orgData = orgResult[0];
  const branding = orgData?.branding as { logoUrl?: string } | null;
  const organization = orgData
    ? {
        id: orgData.id,
        name: orgData.name,
        logoUrl: branding?.logoUrl ?? null,
      }
    : null;

  // Parse audit data
  const auditData = auditResult[0];
  const audit = auditData
    ? {
        id: auditData.id,
        overallScore: auditData.overallScore,
        categoryScores: ((auditData.categoryScores ?? []) as unknown as CategoryScoreData[]),
        issues: ((auditData.issues ?? []) as unknown as AuditIssueData[]),
        completedAt: auditData.completedAt ? auditData.completedAt.toISOString() : null,
      }
    : null;

  // Parse recommendations
  const recommendationsData: RecommendationData[] = recsResult.map((rec) => ({
    id: rec.id,
    title: rec.title,
    description: rec.description,
    priority: rec.priority,
    status: rec.status,
    effort: rec.effort,
    impact: rec.impact,
    category: rec.category,
  }));

  // Define all platforms with default values
  const allPlatforms = [
    "chatgpt",
    "claude",
    "gemini",
    "perplexity",
    "grok",
    "deepseek",
    "copilot",
  ];

  // Parse platform mentions
  const mentionMap = new Map<
    string,
    { count: number; hasCitation: boolean }
  >();
  mentionsResult.forEach((m) => {
    mentionMap.set(m.platform, {
      count: m.count,
      hasCitation: m.hasCitation,
    });
  });

  const platformMentions: PlatformMentionCount[] = allPlatforms.map(
    (platform) => {
      const data = mentionMap.get(platform);
      return {
        platform,
        count: data?.count ?? 0,
        cited: data?.hasCitation ?? false,
      };
    }
  );

  return {
    brand,
    organization,
    audit,
    recommendations: recommendationsData,
    platformMentions,
    generatedAt: new Date().toISOString(),
  };
}
