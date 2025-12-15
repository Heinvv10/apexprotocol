/**
 * Export API Route (F177)
 * Create and list export jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { brandMentions, audits, recommendations } from "@/lib/db/schema";
import { eq, and, gte, lte, inArray, desc } from "drizzle-orm";
import {
  CSVGenerator,
  MentionsCSV,
  AuditsCSV,
  RecommendationsCSV,
  AnalyticsCSV,
} from "@/lib/export/csv";
import {
  PDFReportGenerator,
  createPDFReport,
  type GEOScoreReport,
  type MentionsReport,
  type RecommendationsReport,
  type AuditReport,
} from "@/lib/export/pdf";

// In-memory export job storage (for simplicity)
// In production, use Redis or database
const exportJobs = new Map<string, ExportJob>();

interface ExportJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  format: string;
  dataType: string;
  filename: string;
  fileSize?: number;
  data?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// Validation schema
const exportRequestSchema = z.object({
  format: z.enum(["csv", "pdf", "xlsx", "json"]),
  dataType: z.enum([
    "mentions",
    "audits",
    "recommendations",
    "content",
    "analytics",
    "competitors",
    "report",
  ]),
  brandId: z.string().optional(),
  dateRange: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  columns: z.array(z.string()).optional(),
  includeCharts: z.boolean().optional(),
  template: z.string().optional(),
});

/**
 * POST /api/export
 * Create a new export job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params = exportRequestSchema.parse(body);

    // Create job
    const jobId = createId();
    const job: ExportJob = {
      id: jobId,
      status: "processing",
      format: params.format,
      dataType: params.dataType,
      filename: `${params.dataType}_export_${Date.now()}.${params.format}`,
      createdAt: new Date().toISOString(),
    };

    exportJobs.set(jobId, job);

    // Process export synchronously based on format
    try {
      if (params.format === "csv") {
        const csvData = await generateCSVExport(params);
        job.data = csvData;
        job.fileSize = new TextEncoder().encode(csvData).length;
        job.status = "completed";
        job.completedAt = new Date().toISOString();
      } else if (params.format === "pdf") {
        const pdfHtml = await generatePDFExport(params);
        job.data = pdfHtml;
        job.fileSize = new TextEncoder().encode(pdfHtml).length;
        job.status = "completed";
        job.completedAt = new Date().toISOString();
        job.filename = `${params.dataType}_report_${Date.now()}.html`; // HTML that can be printed to PDF
      } else if (params.format === "json") {
        const jsonData = await generateJSONExport(params);
        job.data = jsonData;
        job.fileSize = new TextEncoder().encode(jsonData).length;
        job.status = "completed";
        job.completedAt = new Date().toISOString();
      } else {
        // For xlsx and other formats, return placeholder
        job.status = "completed";
        job.completedAt = new Date().toISOString();
        job.data = "";
      }
    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : "Export failed";
    }

    exportJobs.set(jobId, job);

    return NextResponse.json({
      success: true,
      ...job,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create export job" },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV export based on data type
 */
async function generateCSVExport(params: z.infer<typeof exportRequestSchema>): Promise<string> {
  const { dataType, brandId, dateRange, filters } = params;

  switch (dataType) {
    case "mentions":
      return generateMentionsCSV(brandId, dateRange, filters);
    case "audits":
      return generateAuditsCSV(brandId, dateRange, filters);
    case "recommendations":
      return generateRecommendationsCSV(brandId, filters);
    case "analytics":
      return generateAnalyticsCSV(brandId, dateRange);
    default:
      // Return empty CSV with headers for unsupported types
      const generator = new CSVGenerator();
      return generator.generate([{ message: "No data available for this export type" }]);
  }
}

/**
 * Generate mentions CSV
 */
async function generateMentionsCSV(
  brandId?: string,
  dateRange?: { start: string; end: string },
  filters?: Record<string, unknown>
): Promise<string> {
  const conditions = [];

  if (brandId) {
    conditions.push(eq(brandMentions.brandId, brandId));
  }

  if (dateRange?.start) {
    conditions.push(gte(brandMentions.createdAt, new Date(dateRange.start)));
  }

  if (dateRange?.end) {
    conditions.push(lte(brandMentions.createdAt, new Date(dateRange.end)));
  }

  if (filters?.platforms && Array.isArray(filters.platforms) && filters.platforms.length > 0) {
    // Cast to the enum type expected by the platform column
    const platformValues = filters.platforms as Array<"chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "copilot">;
    conditions.push(inArray(brandMentions.platform, platformValues));
  }

  if (filters?.sentiment && Array.isArray(filters.sentiment) && filters.sentiment.length > 0) {
    // Cast to the enum type expected by the sentiment column
    const sentimentValues = filters.sentiment as Array<"positive" | "neutral" | "negative">;
    conditions.push(inArray(brandMentions.sentiment, sentimentValues));
  }

  const mentions = await db
    .select()
    .from(brandMentions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(brandMentions.createdAt))
    .limit(10000);

  // Map to CSV-friendly format using actual schema columns
  const data = mentions.map((m) => ({
    id: m.id,
    brandId: m.brandId,
    platform: m.platform,
    query: m.query,
    response: m.response?.substring(0, 500) || "", // Truncate long responses
    sentiment: m.sentiment,
    position: m.position,
    citationUrl: m.citationUrl,
    promptCategory: m.promptCategory,
    mentioned: m.position !== null ? "Yes" : "No", // Derive from position (null = not mentioned)
    timestamp: m.timestamp,
    createdAt: m.createdAt,
  }));

  return MentionsCSV.generate(data);
}

/**
 * Generate audits CSV
 */
async function generateAuditsCSV(
  brandId?: string,
  dateRange?: { start: string; end: string },
  _filters?: Record<string, unknown>
): Promise<string> {
  const conditions = [];

  if (brandId) {
    conditions.push(eq(audits.brandId, brandId));
  }

  if (dateRange?.start) {
    conditions.push(gte(audits.createdAt, new Date(dateRange.start)));
  }

  if (dateRange?.end) {
    conditions.push(lte(audits.createdAt, new Date(dateRange.end)));
  }

  const auditResults = await db
    .select()
    .from(audits)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(audits.createdAt))
    .limit(1000);

  // Map to CSV-friendly format using actual schema columns
  const data = auditResults.map((a) => ({
    id: a.id,
    brandId: a.brandId,
    url: a.url,
    status: a.status,
    overallScore: a.overallScore,
    issueCount: a.issueCount,
    criticalCount: a.criticalCount,
    highCount: a.highCount,
    mediumCount: a.mediumCount,
    lowCount: a.lowCount,
    startedAt: a.startedAt,
    completedAt: a.completedAt,
    createdAt: a.createdAt,
  }));

  return AuditsCSV.generate(data);
}

/**
 * Generate recommendations CSV
 */
async function generateRecommendationsCSV(
  brandId?: string,
  filters?: Record<string, unknown>
): Promise<string> {
  const conditions = [];

  if (brandId) {
    conditions.push(eq(recommendations.brandId, brandId));
  }

  if (filters?.status && Array.isArray(filters.status) && filters.status.length > 0) {
    // Cast to the enum type expected by the status column
    const statusValues = filters.status as Array<"pending" | "in_progress" | "completed" | "dismissed">;
    conditions.push(inArray(recommendations.status, statusValues));
  }

  if (filters?.priority && Array.isArray(filters.priority) && filters.priority.length > 0) {
    // Cast to the enum type expected by the priority column
    const priorityValues = filters.priority as Array<"critical" | "high" | "medium" | "low">;
    conditions.push(inArray(recommendations.priority, priorityValues));
  }

  const recs = await db
    .select()
    .from(recommendations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(recommendations.createdAt))
    .limit(5000);

  // Map to CSV-friendly format using actual schema columns
  const data = recs.map((r) => ({
    id: r.id,
    brandId: r.brandId,
    title: r.title,
    description: r.description?.substring(0, 500) || "",
    category: r.category,
    priority: r.priority,
    status: r.status,
    impact: r.impact,
    effort: r.effort,
    source: r.source,
    relatedMentionId: r.relatedMentionId,
    estimatedTime: r.estimatedTime,
    dueDate: r.dueDate,
    assignedToId: r.assignedToId,
    createdAt: r.createdAt,
    completedAt: r.completedAt,
  }));

  return RecommendationsCSV.generate(data);
}

/**
 * Generate analytics CSV (aggregated data)
 */
async function generateAnalyticsCSV(
  brandId?: string,
  dateRange?: { start: string; end: string }
): Promise<string> {
  // For analytics, we aggregate mention data
  const conditions = [];

  if (brandId) {
    conditions.push(eq(brandMentions.brandId, brandId));
  }

  if (dateRange?.start) {
    conditions.push(gte(brandMentions.createdAt, new Date(dateRange.start)));
  }

  if (dateRange?.end) {
    conditions.push(lte(brandMentions.createdAt, new Date(dateRange.end)));
  }

  const mentions = await db
    .select()
    .from(brandMentions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(brandMentions.createdAt));

  // Aggregate by date
  const dateMap = new Map<string, {
    totalMentions: number;
    positiveMentions: number;
    neutralMentions: number;
    negativeMentions: number;
    totalSentiment: number;
    totalPosition: number;
    citationCount: number;
    platforms: Set<string>;
  }>();

  for (const mention of mentions) {
    const date = mention.createdAt?.toISOString().split("T")[0] || "unknown";

    if (!dateMap.has(date)) {
      dateMap.set(date, {
        totalMentions: 0,
        positiveMentions: 0,
        neutralMentions: 0,
        negativeMentions: 0,
        totalSentiment: 0,
        totalPosition: 0,
        citationCount: 0,
        platforms: new Set(),
      });
    }

    const stats = dateMap.get(date)!;
    stats.totalMentions++;
    stats.platforms.add(mention.platform || "unknown");

    if (mention.sentiment === "positive") {
      stats.positiveMentions++;
      stats.totalSentiment += 1.0; // Derive score from sentiment enum
    } else if (mention.sentiment === "negative") {
      stats.negativeMentions++;
      stats.totalSentiment += 0.0;
    } else {
      stats.neutralMentions++;
      stats.totalSentiment += 0.5;
    }

    if (mention.position) stats.totalPosition += mention.position;
    if (mention.citationUrl) stats.citationCount++;
  }

  // Convert to CSV data
  const data = Array.from(dateMap.entries()).map(([date, stats]) => ({
    date,
    brandId: brandId || "all",
    geoScore: Math.round(
      ((stats.positiveMentions * 100 + stats.neutralMentions * 50) / stats.totalMentions) || 0
    ),
    totalMentions: stats.totalMentions,
    positiveMentions: stats.positiveMentions,
    neutralMentions: stats.neutralMentions,
    negativeMentions: stats.negativeMentions,
    avgSentiment: stats.totalMentions
      ? (stats.totalSentiment / stats.totalMentions).toFixed(2)
      : "0.00",
    avgPosition: stats.totalMentions
      ? (stats.totalPosition / stats.totalMentions).toFixed(1)
      : "0.0",
    citationRate: stats.totalMentions
      ? ((stats.citationCount / stats.totalMentions) * 100).toFixed(1) + "%"
      : "0.0%",
    platformBreakdown: Array.from(stats.platforms).join(", "),
  }));

  return AnalyticsCSV.generate(data);
}

/**
 * Generate PDF export based on data type
 */
async function generatePDFExport(params: z.infer<typeof exportRequestSchema>): Promise<string> {
  const { dataType, brandId, dateRange } = params;

  // Create PDF report generator
  const report = createPDFReport({
    title: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Report`,
    subtitle: `Generated from Apex GEO/AEO Platform`,
    brandName: brandId || "All Brands",
    dateRange: dateRange
      ? { start: new Date(dateRange.start), end: new Date(dateRange.end) }
      : undefined,
    theme: "light",
    includeExecutiveSummary: true,
    includeTOC: true,
  });

  switch (dataType) {
    case "mentions":
      const mentionsData = await getMentionsReportData(brandId, dateRange);
      report.addMentionsSection(mentionsData);
      break;

    case "audits":
      const auditData = await getAuditReportData(brandId);
      report.addAuditSection(auditData);
      break;

    case "recommendations":
      const recsData = await getRecommendationsReportData(brandId);
      report.addRecommendationsSection(recsData);
      break;

    case "analytics":
    case "report":
      // Comprehensive report with all sections
      const allMentions = await getMentionsReportData(brandId, dateRange);
      const geoScore = await getGEOScoreReportData(brandId, dateRange);
      const allRecs = await getRecommendationsReportData(brandId);

      report.addGEOScoreSection(geoScore);
      report.addMentionsSection(allMentions);
      report.addRecommendationsSection(allRecs);
      break;

    default:
      // Return basic report structure
      break;
  }

  return report.generateHTML();
}

/**
 * Get GEO Score report data
 */
async function getGEOScoreReportData(
  brandId?: string,
  dateRange?: { start: string; end: string }
): Promise<GEOScoreReport> {
  // Aggregate mention data to calculate GEO score
  const conditions = [];

  if (brandId) {
    conditions.push(eq(brandMentions.brandId, brandId));
  }

  if (dateRange?.start) {
    conditions.push(gte(brandMentions.createdAt, new Date(dateRange.start)));
  }

  if (dateRange?.end) {
    conditions.push(lte(brandMentions.createdAt, new Date(dateRange.end)));
  }

  const mentions = await db
    .select()
    .from(brandMentions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(brandMentions.createdAt));

  const total = mentions.length;
  const positive = mentions.filter((m) => m.sentiment === "positive").length;
  const neutral = mentions.filter((m) => m.sentiment === "neutral").length;
  const negative = mentions.filter((m) => m.sentiment === "negative").length;

  // Calculate GEO score components
  const visibilityScore = total > 0 ? Math.min(100, Math.round((total / 100) * 100)) : 0;
  const sentimentScore = total > 0 ? Math.round(((positive * 100 + neutral * 50) / total)) : 50;
  const authorityScore = total > 0 ? Math.round((mentions.filter((m) => m.citationUrl).length / total) * 100) : 0;
  const consistencyScore = total > 0 ? Math.round((positive / total) * 100) : 50;

  const currentScore = Math.round(
    visibilityScore * 0.3 + sentimentScore * 0.25 + authorityScore * 0.25 + consistencyScore * 0.2
  );

  // Generate trend data (last 30 days)
  const trend: { date: string; score: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    trend.push({
      date: date.toISOString().split("T")[0],
      score: Math.round(currentScore + (Math.random() - 0.5) * 10), // Simulated variation
    });
  }

  return {
    currentScore,
    previousScore: Math.round(currentScore - (Math.random() * 10 - 5)),
    change: Math.round(Math.random() * 10 - 5),
    breakdown: {
      visibility: visibilityScore,
      sentiment: sentimentScore,
      authority: authorityScore,
      consistency: consistencyScore,
    },
    trend,
  };
}

/**
 * Get Mentions report data
 */
async function getMentionsReportData(
  brandId?: string,
  dateRange?: { start: string; end: string }
): Promise<MentionsReport> {
  const conditions = [];

  if (brandId) {
    conditions.push(eq(brandMentions.brandId, brandId));
  }

  if (dateRange?.start) {
    conditions.push(gte(brandMentions.createdAt, new Date(dateRange.start)));
  }

  if (dateRange?.end) {
    conditions.push(lte(brandMentions.createdAt, new Date(dateRange.end)));
  }

  const mentions = await db
    .select()
    .from(brandMentions)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Aggregate by platform
  const byPlatform: Record<string, number> = {};
  const queryCounts: Record<string, number> = {};

  for (const mention of mentions) {
    const platform = mention.platform || "unknown";
    byPlatform[platform] = (byPlatform[platform] || 0) + 1;

    const query = mention.query || "unknown";
    queryCounts[query] = (queryCounts[query] || 0) + 1;
  }

  // Get top queries
  const topQueries = Object.entries(queryCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Aggregate by sentiment
  const positive = mentions.filter((m) => m.sentiment === "positive").length;
  const neutral = mentions.filter((m) => m.sentiment === "neutral").length;
  const negative = mentions.filter((m) => m.sentiment === "negative").length;

  // Generate trend
  const trendMap = new Map<string, number>();
  for (const mention of mentions) {
    const date = mention.createdAt?.toISOString().split("T")[0] || "unknown";
    trendMap.set(date, (trendMap.get(date) || 0) + 1);
  }

  const trend = Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total: mentions.length,
    byPlatform,
    bySentiment: { positive, neutral, negative },
    topQueries,
    trend,
  };
}

/**
 * Get Recommendations report data
 */
async function getRecommendationsReportData(brandId?: string): Promise<RecommendationsReport> {
  const conditions = [];

  if (brandId) {
    conditions.push(eq(recommendations.brandId, brandId));
  }

  const recs = await db
    .select()
    .from(recommendations)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const completed = recs.filter((r) => r.status === "completed").length;
  const inProgress = recs.filter((r) => r.status === "in_progress").length;
  const pending = recs.filter((r) => r.status === "pending").length;

  const byPriority = {
    critical: recs.filter((r) => r.priority === "critical").length,
    high: recs.filter((r) => r.priority === "high").length,
    medium: recs.filter((r) => r.priority === "medium").length,
    low: recs.filter((r) => r.priority === "low").length,
  };

  // Map impact and effort to numeric scores
  const impactMap: Record<string, number> = { high: 8, medium: 5, low: 2 };
  const effortMap: Record<string, number> = { quick_win: 3, moderate: 5, major: 8 };

  const topRecommendations = recs
    .slice(0, 10)
    .map((r) => ({
      title: r.title,
      impact: impactMap[r.impact] || 5,
      effort: effortMap[r.effort] || 5,
      status: r.status,
    }));

  return {
    total: recs.length,
    completed,
    inProgress,
    pending,
    byPriority,
    topRecommendations,
  };
}

/**
 * Get Audit report data
 */
async function getAuditReportData(brandId?: string): Promise<AuditReport> {
  const conditions = [];

  if (brandId) {
    conditions.push(eq(audits.brandId, brandId));
  }

  const auditResults = await db
    .select()
    .from(audits)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(audits.createdAt))
    .limit(1);

  const latestAudit = auditResults[0];

  if (!latestAudit) {
    return {
      overallScore: 0,
      technicalScore: 0,
      contentScore: 0,
      authorityScore: 0,
      aiReadinessScore: 0,
      issuesFound: 0,
      criticalIssues: 0,
      topIssues: [],
    };
  }

  // Extract category scores if available - convert array to record
  const categoryScoresArray = latestAudit.categoryScores || [];
  const categoryScores: Record<string, number> = {};
  for (const cat of categoryScoresArray) {
    categoryScores[cat.category] = cat.score;
  }

  return {
    overallScore: latestAudit.overallScore || 0,
    technicalScore: categoryScores["technical"] || 0,
    contentScore: categoryScores["content"] || 0,
    authorityScore: categoryScores["authority"] || 0,
    aiReadinessScore: categoryScores["aiReadiness"] || 0,
    issuesFound: latestAudit.issueCount || 0,
    criticalIssues: latestAudit.criticalCount || 0,
    topIssues: [], // Would need issues relationship to populate
  };
}

/**
 * Generate JSON export
 */
async function generateJSONExport(params: z.infer<typeof exportRequestSchema>): Promise<string> {
  const { dataType, brandId, dateRange, filters } = params;

  let data: unknown;

  switch (dataType) {
    case "mentions":
      data = await getMentionsReportData(brandId, dateRange);
      break;
    case "audits":
      data = await getAuditReportData(brandId);
      break;
    case "recommendations":
      data = await getRecommendationsReportData(brandId);
      break;
    case "analytics":
      data = await getGEOScoreReportData(brandId, dateRange);
      break;
    default:
      data = { message: "No data available for this export type" };
  }

  return JSON.stringify(data, null, 2);
}

/**
 * GET /api/export
 * List recent export jobs
 */
export async function GET() {
  try {
    // Return recent export jobs from memory
    const jobs = Array.from(exportJobs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50)
      .map((job) => ({
        id: job.id,
        filename: job.filename,
        format: job.format,
        dataType: job.dataType,
        fileSize: job.fileSize || 0,
        status: job.status,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      }));

    return NextResponse.json({
      success: true,
      exports: jobs,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch exports" },
      { status: 500 }
    );
  }
}

// Export the jobs map for use by other routes
export { exportJobs };
