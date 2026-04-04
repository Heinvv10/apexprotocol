/**
 * Recommendations Engine Core (F106)
 * Algorithm combining monitor + audit data to generate recommendations
 */

import { createId } from "@paralleldrive/cuid2";
import {
  Recommendation,
  RecommendationSource,
  RecommendationCategory,
  ActionItem,
  RecommendationMetadata,
} from "./types";
import {
  calculatePriorityScore,
  getPriorityLevel,
  calculateImpactScore,
  calculateEffortScore,
  calculateUrgencyScore,
  calculateConfidenceScore,
  sortByPriority,
  DEFAULT_WEIGHTS,
} from "./priority-scoring";

// Input data types
export interface MonitorData {
  brandId: string;
  platform: string;
  mentions: MentionData[];
  sentiment: SentimentData;
  competitors: CompetitorData[];
  timestamp: Date;
}

export interface MentionData {
  id: string;
  platform: string;
  query: string;
  mentioned: boolean;
  position?: number;
  context?: string;
  sentiment?: "positive" | "neutral" | "negative" | "unrecognized";
  timestamp: Date;
}

export interface SentimentData {
  overall: "positive" | "neutral" | "negative" | "unrecognized";
  score: number; // -1 to 1
  breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface CompetitorData {
  name: string;
  mentions: number;
  avgPosition: number;
  sentiment: number;
}

export interface AuditData {
  brandId: string;
  url: string;
  overallScore: number;
  categoryScores: CategoryScore[];
  issues: AuditIssue[];
  timestamp: Date;
}

export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
}

export interface AuditIssue {
  id: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  recommendation: string;
  impact: string;
}

// Engine configuration
export interface EngineConfig {
  maxRecommendations?: number;
  minConfidence?: number;
  priorityThreshold?: number;
  includeCategories?: RecommendationCategory[];
  excludeCategories?: RecommendationCategory[];
}

const DEFAULT_CONFIG: Required<EngineConfig> = {
  maxRecommendations: 50,
  minConfidence: 30,
  priorityThreshold: 0,
  includeCategories: ["schema", "content", "technical", "seo", "voice", "entity", "qa"],
  excludeCategories: [],
};

/**
 * Main Recommendations Engine class
 */
export class RecommendationsEngine {
  private config: Required<EngineConfig>;
  private recommendations: Recommendation[] = [];

  constructor(config: EngineConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate recommendations from monitor and audit data
   */
  async generateRecommendations(
    brandId: string,
    monitorData: MonitorData[] = [],
    auditData: AuditData | null = null
  ): Promise<Recommendation[]> {
    this.recommendations = [];

    // Process monitor data
    for (const monitor of monitorData) {
      this.processMonitorData(brandId, monitor);
    }

    // Process audit data
    if (auditData) {
      this.processAuditData(brandId, auditData);
    }

    // Generate cross-data insights
    if (monitorData.length > 0 && auditData) {
      this.generateCrossInsights(brandId, monitorData, auditData);
    }

    // Filter and sort recommendations
    let filtered = this.filterRecommendations();
    filtered = sortByPriority(filtered);

    // Limit results
    return filtered.slice(0, this.config.maxRecommendations);
  }

  /**
   * Process monitor data to generate recommendations
   */
  private processMonitorData(brandId: string, data: MonitorData): void {
    // Check for low mention rate
    const mentionRate = data.mentions.filter((m) => m.mentioned).length / data.mentions.length;
    if (mentionRate < 0.3) {
      this.addRecommendation({
        brandId,
        source: "monitor",
        category: "content",
        title: `Low mention rate on ${data.platform}`,
        description: `Your brand is only mentioned in ${Math.round(mentionRate * 100)}% of relevant queries on ${data.platform}. This indicates a significant gap in AI visibility.`,
        impactFactors: {
          severityLevel: mentionRate < 0.1 ? "critical" : "high",
          aiPlatformCount: 1,
          potentialTrafficGain: Math.round((0.5 - mentionRate) * 100),
        },
        effortFactors: {
          technicalComplexity: "moderate",
          timeRequirement: "days",
        },
        urgencyFactors: {
          competitorActivity: true,
        },
        confidenceFactors: {
          dataPoints: data.mentions.length,
          dataRecency: "daily",
        },
        actionItems: [
          {
            title: "Audit existing content for AI optimization",
            description: "Review your content strategy for structured data and clear answers",
          },
          {
            title: "Create FAQ content targeting common queries",
            description: "Develop content that directly answers questions in your domain",
          },
          {
            title: "Implement schema markup",
            description: "Add structured data to help AI engines understand your content",
          },
        ],
        aiPlatforms: [data.platform],
        metadata: { sourceData: { platform: data.platform, mentionRate } },
      });
    }

    // Check for negative sentiment
    if (data.sentiment.overall === "negative" || data.sentiment.score < -0.3) {
      this.addRecommendation({
        brandId,
        source: "monitor",
        category: "content",
        title: `Negative sentiment detected on ${data.platform}`,
        description: `Brand mentions on ${data.platform} have a negative sentiment score of ${data.sentiment.score.toFixed(2)}. This could impact how AI engines present your brand.`,
        impactFactors: {
          severityLevel: data.sentiment.score < -0.5 ? "high" : "medium",
          aiPlatformCount: 1,
        },
        effortFactors: {
          technicalComplexity: "complex",
          timeRequirement: "weeks",
        },
        urgencyFactors: {
          isTimeSensitive: true,
        },
        confidenceFactors: {
          dataPoints: data.mentions.length,
          sourceReliability: 80,
        },
        actionItems: [
          {
            title: "Analyze negative mention sources",
            description: "Identify the root causes of negative sentiment",
          },
          {
            title: "Develop response strategy",
            description: "Create content to address concerns and improve perception",
          },
          {
            title: "Monitor sentiment changes",
            description: "Track sentiment improvements over time",
          },
        ],
        aiPlatforms: [data.platform],
        metadata: { sourceData: { platform: data.platform, sentiment: data.sentiment } },
      });
    }

    // Check competitor outperformance
    for (const competitor of data.competitors) {
      if (competitor.mentions > data.mentions.filter((m) => m.mentioned).length * 1.5) {
        this.addRecommendation({
          brandId,
          source: "monitor",
          category: "entity",
          title: `${competitor.name} outperforming on ${data.platform}`,
          description: `Competitor ${competitor.name} has ${competitor.mentions} mentions vs your ${data.mentions.filter((m) => m.mentioned).length} on ${data.platform}.`,
          impactFactors: {
            severityLevel: "high",
            competitiveGap: Math.min(100, (competitor.mentions / Math.max(1, data.mentions.filter((m) => m.mentioned).length)) * 30),
          },
          effortFactors: {
            technicalComplexity: "moderate",
            timeRequirement: "days",
          },
          urgencyFactors: {
            competitorActivity: true,
          },
          confidenceFactors: {
            dataPoints: data.mentions.length,
            crossValidated: true,
          },
          actionItems: [
            {
              title: `Analyze ${competitor.name}'s content strategy`,
              description: "Review competitor content to identify successful patterns",
            },
            {
              title: "Identify content gaps",
              description: "Find topics where competitor is present but you're not",
            },
            {
              title: "Create competitive content",
              description: "Develop content to compete in underrepresented areas",
            },
          ],
          aiPlatforms: [data.platform],
          metadata: { sourceData: { competitor, platform: data.platform } },
        });
      }
    }
  }

  /**
   * Process audit data to generate recommendations
   */
  private processAuditData(brandId: string, data: AuditData): void {
    // Process each audit issue
    for (const issue of data.issues) {
      this.addRecommendation({
        brandId,
        source: "audit",
        category: this.mapAuditCategory(issue.category),
        title: issue.title,
        description: issue.description,
        impactFactors: {
          severityLevel: issue.severity,
          reachPercentage: this.estimateReachFromSeverity(issue.severity),
        },
        effortFactors: {
          technicalComplexity: this.estimateComplexityFromCategory(issue.category),
          codeChangesRequired: ["schema", "structure", "performance"].includes(issue.category),
        },
        urgencyFactors: {
          isTimeSensitive: issue.severity === "critical",
        },
        confidenceFactors: {
          dataRecency: "realtime",
          sourceReliability: 95,
        },
        actionItems: [
          {
            title: issue.recommendation,
            description: issue.impact,
          },
        ],
        relatedIssues: [issue.id],
        metadata: { sourceData: { auditUrl: data.url, issueCategory: issue.category } },
      });
    }

    // Check for low category scores
    for (const category of data.categoryScores) {
      const percentage = (category.score / category.maxScore) * 100;
      if (percentage < 50) {
        this.addRecommendation({
          brandId,
          source: "audit",
          category: this.mapAuditCategory(category.category),
          title: `Low ${category.category} score: ${Math.round(percentage)}%`,
          description: `Your ${category.category} score is ${category.score}/${category.maxScore}. This indicates significant room for improvement in this area.`,
          impactFactors: {
            severityLevel: percentage < 25 ? "critical" : "high",
            reachPercentage: 100 - percentage,
          },
          effortFactors: {
            technicalComplexity: "moderate",
            timeRequirement: "days",
          },
          urgencyFactors: {
            isTimeSensitive: percentage < 25,
          },
          confidenceFactors: {
            dataRecency: "realtime",
            sourceReliability: 90,
          },
          actionItems: this.getCategoryImprovementActions(category.category),
          metadata: { sourceData: { category, auditUrl: data.url } },
        });
      }
    }

    // Overall score recommendation
    if (data.overallScore < 60) {
      this.addRecommendation({
        brandId,
        source: "audit",
        category: "technical",
        title: `Overall AI readability needs improvement: ${data.overallScore}/100`,
        description: `Your site's AI readability score is ${data.overallScore}/100. Focus on the highest-impact improvements to boost this score.`,
        impactFactors: {
          severityLevel: data.overallScore < 40 ? "critical" : "high",
          potentialTrafficGain: Math.round((100 - data.overallScore) * 0.5),
        },
        effortFactors: {
          technicalComplexity: "complex",
          timeRequirement: "weeks",
        },
        urgencyFactors: {
          isTimeSensitive: data.overallScore < 40,
        },
        confidenceFactors: {
          dataRecency: "realtime",
          sourceReliability: 95,
        },
        actionItems: [
          {
            title: "Address critical issues first",
            description: "Fix all critical and high severity issues before moving to lower priority items",
          },
          {
            title: "Improve schema markup",
            description: "Add structured data for your key content types",
          },
          {
            title: "Optimize content structure",
            description: "Ensure clear headings, concise paragraphs, and proper formatting",
          },
        ],
        metadata: { sourceData: { overallScore: data.overallScore, auditUrl: data.url } },
      });
    }
  }

  /**
   * Generate cross-data insights from both monitor and audit
   */
  private generateCrossInsights(
    brandId: string,
    monitorData: MonitorData[],
    auditData: AuditData
  ): void {
    // Calculate overall mention rate across platforms
    let totalMentions = 0;
    let totalQueries = 0;
    const platforms = new Set<string>();

    for (const monitor of monitorData) {
      totalMentions += monitor.mentions.filter((m) => m.mentioned).length;
      totalQueries += monitor.mentions.length;
      platforms.add(monitor.platform);
    }

    const overallMentionRate = totalQueries > 0 ? totalMentions / totalQueries : 0;
    const schemaScore = auditData.categoryScores.find((c) => c.category === "schema");
    const schemaPercentage = schemaScore
      ? (schemaScore.score / schemaScore.maxScore) * 100
      : 0;

    // Correlation: low schema + low mentions
    if (schemaPercentage < 50 && overallMentionRate < 0.3) {
      this.addRecommendation({
        brandId,
        source: "content",
        category: "schema",
        title: "Schema markup directly impacting AI visibility",
        description: `Your schema score (${Math.round(schemaPercentage)}%) correlates with low AI mention rate (${Math.round(overallMentionRate * 100)}%). Improving schema markup is likely to increase AI visibility.`,
        impactFactors: {
          severityLevel: "critical",
          aiPlatformCount: platforms.size,
          potentialTrafficGain: Math.round((0.5 - overallMentionRate) * 150),
        },
        effortFactors: {
          technicalComplexity: "moderate",
          timeRequirement: "days",
          codeChangesRequired: true,
        },
        urgencyFactors: {
          isTimeSensitive: true,
          competitorActivity: true,
        },
        confidenceFactors: {
          dataPoints: totalQueries,
          crossValidated: true,
          sourceReliability: 90,
        },
        actionItems: [
          {
            title: "Implement Organization schema",
            description: "Add structured data for your brand identity",
          },
          {
            title: "Add FAQ schema for common questions",
            description: "Mark up Q&A content for featured snippets",
          },
          {
            title: "Implement Article/Product schemas",
            description: "Add appropriate schema for your main content types",
          },
        ],
        aiPlatforms: Array.from(platforms),
        metadata: {
          sourceData: {
            schemaPercentage,
            overallMentionRate,
            platformCount: platforms.size,
          },
        },
      });
    }

    // Voice optimization opportunity
    const clarityScore = auditData.categoryScores.find((c) => c.category === "clarity");
    if (clarityScore && (clarityScore.score / clarityScore.maxScore) < 0.6) {
      this.addRecommendation({
        brandId,
        source: "voice",
        category: "voice",
        title: "Content not optimized for voice search",
        description: `Your content clarity score (${Math.round((clarityScore.score / clarityScore.maxScore) * 100)}%) suggests poor voice search compatibility. Voice-friendly content tends to perform better in AI responses.`,
        impactFactors: {
          severityLevel: "high",
          aiPlatformCount: platforms.size,
        },
        effortFactors: {
          technicalComplexity: "moderate",
          timeRequirement: "days",
        },
        urgencyFactors: {
          trendingTopic: true, // Voice search is trending
        },
        confidenceFactors: {
          dataRecency: "realtime",
          sourceReliability: 85,
        },
        actionItems: [
          {
            title: "Simplify sentence structure",
            description: "Use shorter sentences and simpler words for voice compatibility",
          },
          {
            title: "Add conversational Q&A content",
            description: "Create content that answers questions naturally",
          },
          {
            title: "Optimize for featured snippets",
            description: "Structure content to be easily extracted by AI",
          },
        ],
        aiPlatforms: Array.from(platforms),
        metadata: { sourceData: { clarityScore } },
      });
    }
  }

  /**
   * Add a recommendation to the list
   */
  private addRecommendation(params: {
    brandId: string;
    source: RecommendationSource;
    category: RecommendationCategory;
    title: string;
    description: string;
    impactFactors: Parameters<typeof calculateImpactScore>[0];
    effortFactors: Parameters<typeof calculateEffortScore>[0];
    urgencyFactors: Parameters<typeof calculateUrgencyScore>[0];
    confidenceFactors: Parameters<typeof calculateConfidenceScore>[0];
    actionItems: Array<{ title: string; description: string }>;
    codeSnippet?: string;
    relatedIssues?: string[];
    aiPlatforms?: string[];
    metadata?: { sourceData?: Record<string, unknown> };
  }): void {
    const impact = calculateImpactScore(params.impactFactors);
    const effort = calculateEffortScore(params.effortFactors);
    const urgency = calculateUrgencyScore(params.urgencyFactors);
    const confidence = calculateConfidenceScore(params.confidenceFactors);

    const priorityScore = calculatePriorityScore(
      impact.score,
      effort.score,
      urgency,
      confidence,
      DEFAULT_WEIGHTS
    );

    const priority = getPriorityLevel(priorityScore);

    const actionItems: ActionItem[] = params.actionItems.map((item, index) => ({
      id: createId(),
      order: index + 1,
      title: item.title,
      description: item.description,
      completed: false,
    }));

    const metadata: RecommendationMetadata = {
      generatedBy: "recommendations-engine-v1",
      sourceData: params.metadata?.sourceData,
      lastUpdated: new Date(),
      version: 1,
    };

    const recommendation: Recommendation = {
      id: createId(),
      brandId: params.brandId,
      source: params.source,
      category: params.category,
      priority,
      priorityScore,
      title: params.title,
      description: params.description,
      impact,
      effort,
      urgency,
      confidence,
      actionItems,
      metadata,
      codeSnippet: params.codeSnippet,
      relatedIssues: params.relatedIssues,
      aiPlatforms: params.aiPlatforms,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.recommendations.push(recommendation);
  }

  /**
   * Filter recommendations based on config
   */
  private filterRecommendations(): Recommendation[] {
    return this.recommendations.filter((rec) => {
      // Confidence filter
      if (rec.confidence < this.config.minConfidence) {
        return false;
      }

      // Priority threshold filter
      if (rec.priorityScore < this.config.priorityThreshold) {
        return false;
      }

      // Category inclusion filter
      if (
        this.config.includeCategories.length > 0 &&
        !this.config.includeCategories.includes(rec.category)
      ) {
        return false;
      }

      // Category exclusion filter
      if (this.config.excludeCategories.includes(rec.category)) {
        return false;
      }

      return true;
    });
  }

  // Helper methods

  private mapAuditCategory(category: string): RecommendationCategory {
    const mapping: Record<string, RecommendationCategory> = {
      schema: "schema",
      meta: "seo",
      content: "content",
      structure: "technical",
      links: "technical",
      images: "technical",
      performance: "technical",
      accessibility: "technical",
      clarity: "content",
      metadata: "seo",
    };
    return mapping[category] || "technical";
  }

  private estimateReachFromSeverity(severity: string): number {
    const mapping: Record<string, number> = {
      critical: 90,
      high: 70,
      medium: 50,
      low: 30,
    };
    return mapping[severity] || 50;
  }

  private estimateComplexityFromCategory(
    category: string
  ): "simple" | "moderate" | "complex" | "expert" {
    const mapping: Record<string, "simple" | "moderate" | "complex" | "expert"> = {
      meta: "simple",
      content: "moderate",
      schema: "moderate",
      structure: "complex",
      links: "simple",
      images: "simple",
      performance: "complex",
      accessibility: "moderate",
    };
    return mapping[category] || "moderate";
  }

  private getCategoryImprovementActions(category: string): Array<{ title: string; description: string }> {
    const actions: Record<string, Array<{ title: string; description: string }>> = {
      schema: [
        { title: "Add Organization schema", description: "Implement schema.org Organization markup" },
        { title: "Add FAQ schema", description: "Mark up Q&A content with FAQPage schema" },
        { title: "Validate existing schema", description: "Test and fix any schema validation errors" },
      ],
      structure: [
        { title: "Improve heading hierarchy", description: "Ensure proper H1-H6 structure" },
        { title: "Add semantic HTML", description: "Use article, section, nav elements" },
        { title: "Optimize content layout", description: "Improve readability and scannability" },
      ],
      clarity: [
        { title: "Simplify language", description: "Use shorter sentences and simpler words" },
        { title: "Add clear headings", description: "Break content into scannable sections" },
        { title: "Include summary paragraphs", description: "Add TL;DR sections for AI extraction" },
      ],
      metadata: [
        { title: "Optimize title tags", description: "Create unique, descriptive titles" },
        { title: "Improve meta descriptions", description: "Write compelling summaries" },
        { title: "Add Open Graph tags", description: "Implement social sharing metadata" },
      ],
      accessibility: [
        { title: "Add alt text to images", description: "Describe all images for accessibility" },
        { title: "Improve color contrast", description: "Ensure text is readable" },
        { title: "Add ARIA labels", description: "Improve screen reader support" },
      ],
    };
    return actions[category] || [
      { title: `Improve ${category}`, description: `Address issues in the ${category} category` },
    ];
  }
}

/**
 * Create a new recommendations engine instance
 */
export function createRecommendationsEngine(config?: EngineConfig): RecommendationsEngine {
  return new RecommendationsEngine(config);
}

/**
 * Quick function to generate recommendations
 */
export async function generateRecommendations(
  brandId: string,
  monitorData: MonitorData[] = [],
  auditData: AuditData | null = null,
  config?: EngineConfig
): Promise<Recommendation[]> {
  const engine = createRecommendationsEngine(config);
  return engine.generateRecommendations(brandId, monitorData, auditData);
}
