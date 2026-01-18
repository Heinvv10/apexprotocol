/**
 * Improvement Roadmap Generator
 * Generate prioritized step-by-step roadmaps to beat competitors
 * Part of Enhanced Competitive Intelligence feature
 */

import { db } from "@/lib/db";
import {
  improvementRoadmaps,
  roadmapMilestones,
  roadmapProgressSnapshots,
  type ImprovementRoadmap,
  type NewImprovementRoadmap,
  type RoadmapMilestone,
  type NewRoadmapMilestone,
  type MilestoneActionItem,
  type RoadmapProgressSnapshot,
  type NewRoadmapProgressSnapshot,
} from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import {
  calculateBrandScores,
  calculateCompetitorScores,
  calculateGapAnalysis,
  type BrandScoreResult,
  type CompetitorScoreResult,
} from "./competitor-scoring";

// Roadmap generation options
export interface RoadmapGenerationOptions {
  targetPosition: "leader" | "top3" | "competitive";
  targetCompetitor?: string;
  focusAreas?: Array<"geo" | "seo" | "aeo" | "smo" | "ppo">;
  aiEnhanced?: boolean;
}

// Milestone template for roadmap generation
interface MilestoneTemplate {
  title: string;
  description: string;
  category: "geo" | "seo" | "aeo" | "smo" | "ppo";
  phase: 1 | 2 | 3; // 1 = Quick Wins, 2 = Month 1, 3 = Ongoing
  difficulty: "easy" | "medium" | "hard";
  expectedScoreImpact: number;
  expectedDaysToComplete: number;
  actionItems: Omit<MilestoneActionItem, "id" | "isCompleted" | "completedAt">[];
  condition?: (gap: number) => boolean;
}

// Predefined milestone templates
const MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  // GEO Quick Wins (Phase 1)
  {
    title: "Add FAQ Schema Markup",
    description: "Implement FAQ structured data to improve visibility in AI responses",
    category: "geo",
    phase: 1,
    difficulty: "easy",
    expectedScoreImpact: 5,
    expectedDaysToComplete: 3,
    actionItems: [
      { title: "Identify top 10 FAQ questions from customer support", order: 1 },
      { title: "Write clear, concise answers for each question", order: 2 },
      { title: "Add FAQ schema markup to relevant pages", order: 3 },
      { title: "Test with Google Rich Results Test", order: 4 },
    ],
    condition: (gap) => gap < 0,
  },
  {
    title: "Optimize Content for AI Citations",
    description: "Structure content to be easily cited by AI platforms",
    category: "geo",
    phase: 1,
    difficulty: "medium",
    expectedScoreImpact: 7,
    expectedDaysToComplete: 7,
    actionItems: [
      { title: "Audit top 5 pages for citation opportunities", order: 1 },
      { title: "Add clear, factual statements with sources", order: 2 },
      { title: "Include statistics and data points", order: 3 },
      { title: "Use bullet points and numbered lists", order: 4 },
      { title: "Add author expertise signals (bio, credentials)", order: 5 },
    ],
    condition: (gap) => gap < -5,
  },

  // SEO Quick Wins (Phase 1)
  {
    title: "Fix Critical Meta Tags",
    description: "Ensure all pages have optimized title tags and meta descriptions",
    category: "seo",
    phase: 1,
    difficulty: "easy",
    expectedScoreImpact: 4,
    expectedDaysToComplete: 2,
    actionItems: [
      { title: "Export list of all pages missing meta tags", order: 1 },
      { title: "Write unique titles (50-60 chars) for each page", order: 2 },
      { title: "Write compelling descriptions (150-160 chars)", order: 3 },
      { title: "Implement changes and verify with SEO tool", order: 4 },
    ],
    condition: (gap) => gap < 0,
  },
  {
    title: "Implement Core Web Vitals Fixes",
    description: "Improve page speed and user experience metrics",
    category: "seo",
    phase: 1,
    difficulty: "medium",
    expectedScoreImpact: 6,
    expectedDaysToComplete: 5,
    actionItems: [
      { title: "Run PageSpeed Insights on top 10 pages", order: 1 },
      { title: "Optimize image sizes and formats", order: 2 },
      { title: "Implement lazy loading for images", order: 3 },
      { title: "Minimize JavaScript blocking time", order: 4 },
      { title: "Re-test and document improvements", order: 5 },
    ],
    condition: (gap) => gap < -5,
  },

  // AEO Quick Wins (Phase 1)
  {
    title: "Create Conversational Content",
    description: "Add content that directly answers common questions",
    category: "aeo",
    phase: 1,
    difficulty: "easy",
    expectedScoreImpact: 5,
    expectedDaysToComplete: 4,
    actionItems: [
      { title: "Research top questions in your industry", order: 1 },
      { title: "Create direct answer content for each", order: 2 },
      { title: "Structure with clear headers and summaries", order: 3 },
      { title: "Add internal links to related content", order: 4 },
    ],
    condition: (gap) => gap < 0,
  },

  // SMO Quick Wins (Phase 1)
  {
    title: "Establish Consistent Posting Schedule",
    description: "Create and maintain regular social media presence",
    category: "smo",
    phase: 1,
    difficulty: "easy",
    expectedScoreImpact: 4,
    expectedDaysToComplete: 3,
    actionItems: [
      { title: "Audit current posting frequency across platforms", order: 1 },
      { title: "Create content calendar for next 30 days", order: 2 },
      { title: "Schedule posts using social media tool", order: 3 },
      { title: "Set up engagement monitoring", order: 4 },
    ],
    condition: (gap) => gap < 0,
  },

  // PPO Quick Wins (Phase 1)
  {
    title: "Optimize Executive LinkedIn Profiles",
    description: "Enhance leadership visibility through LinkedIn optimization",
    category: "ppo",
    phase: 1,
    difficulty: "easy",
    expectedScoreImpact: 3,
    expectedDaysToComplete: 2,
    actionItems: [
      { title: "Update executive headshots and banners", order: 1 },
      { title: "Rewrite headlines with expertise keywords", order: 2 },
      { title: "Add relevant skills and certifications", order: 3 },
      { title: "Request recommendations from peers", order: 4 },
    ],
    condition: (gap) => gap < 0,
  },

  // GEO Month 1 (Phase 2)
  {
    title: "Build Authority Content Cluster",
    description: "Create comprehensive content hub on core topic",
    category: "geo",
    phase: 2,
    difficulty: "hard",
    expectedScoreImpact: 10,
    expectedDaysToComplete: 21,
    actionItems: [
      { title: "Identify core topic with high AI visibility potential", order: 1 },
      { title: "Create pillar page (3000+ words, comprehensive)", order: 2 },
      { title: "Write 5-7 supporting articles", order: 3 },
      { title: "Implement internal linking structure", order: 4 },
      { title: "Add schema markup to all pages", order: 5 },
      { title: "Promote content through outreach", order: 6 },
    ],
    condition: (gap) => gap < -10,
  },
  {
    title: "Develop Proprietary Research",
    description: "Create original research and data that gets cited",
    category: "geo",
    phase: 2,
    difficulty: "hard",
    expectedScoreImpact: 12,
    expectedDaysToComplete: 30,
    actionItems: [
      { title: "Identify research topic with high citation potential", order: 1 },
      { title: "Design and conduct survey/research", order: 2 },
      { title: "Analyze and visualize results", order: 3 },
      { title: "Write comprehensive research report", order: 4 },
      { title: "Create press release and outreach plan", order: 5 },
      { title: "Share findings with industry publications", order: 6 },
    ],
    condition: (gap) => gap < -15,
  },

  // SEO Month 1 (Phase 2)
  {
    title: "Comprehensive Schema Implementation",
    description: "Implement all relevant schema types across the site",
    category: "seo",
    phase: 2,
    difficulty: "medium",
    expectedScoreImpact: 8,
    expectedDaysToComplete: 14,
    actionItems: [
      { title: "Audit current schema implementation", order: 1 },
      { title: "Identify missing schema types for your industry", order: 2 },
      { title: "Implement Organization and LocalBusiness schema", order: 3 },
      { title: "Add Product/Service schema where applicable", order: 4 },
      { title: "Implement Article schema for blog posts", order: 5 },
      { title: "Test all implementations with validators", order: 6 },
    ],
    condition: (gap) => gap < -5,
  },

  // AEO Month 1 (Phase 2)
  {
    title: "Build Question-Answer Database",
    description: "Create comprehensive Q&A resource that AI can reference",
    category: "aeo",
    phase: 2,
    difficulty: "medium",
    expectedScoreImpact: 8,
    expectedDaysToComplete: 14,
    actionItems: [
      { title: "Compile 50+ industry-relevant questions", order: 1 },
      { title: "Write authoritative answers for each", order: 2 },
      { title: "Organize by topic/category", order: 3 },
      { title: "Add FAQ schema to Q&A pages", order: 4 },
      { title: "Create interconnected links between Q&As", order: 5 },
    ],
    condition: (gap) => gap < -8,
  },

  // SMO Month 1 (Phase 2)
  {
    title: "Launch Social Media Campaign",
    description: "Execute strategic campaign to boost engagement and followers",
    category: "smo",
    phase: 2,
    difficulty: "medium",
    expectedScoreImpact: 7,
    expectedDaysToComplete: 21,
    actionItems: [
      { title: "Define campaign goals and KPIs", order: 1 },
      { title: "Create campaign content calendar", order: 2 },
      { title: "Design campaign visuals and assets", order: 3 },
      { title: "Launch and monitor daily", order: 4 },
      { title: "Engage with all comments and shares", order: 5 },
      { title: "Analyze results and document learnings", order: 6 },
    ],
    condition: (gap) => gap < -10,
  },

  // PPO Month 1 (Phase 2)
  {
    title: "Launch Thought Leadership Series",
    description: "Establish executives as industry thought leaders",
    category: "ppo",
    phase: 2,
    difficulty: "medium",
    expectedScoreImpact: 6,
    expectedDaysToComplete: 30,
    actionItems: [
      { title: "Identify 3-4 key topics for executives", order: 1 },
      { title: "Create LinkedIn article publishing schedule", order: 2 },
      { title: "Write and publish weekly articles", order: 3 },
      { title: "Engage with comments and discussions", order: 4 },
      { title: "Cross-promote on company channels", order: 5 },
    ],
    condition: (gap) => gap < -8,
  },

  // Ongoing Improvements (Phase 3)
  {
    title: "Continuous Content Optimization",
    description: "Regularly update and improve existing content",
    category: "geo",
    phase: 3,
    difficulty: "medium",
    expectedScoreImpact: 3,
    expectedDaysToComplete: 7,
    actionItems: [
      { title: "Monthly content audit for top pages", order: 1 },
      { title: "Update statistics and references", order: 2 },
      { title: "Improve content based on AI citation patterns", order: 3 },
      { title: "Add new internal links", order: 4 },
    ],
    condition: () => true,
  },
  {
    title: "Monitor and Respond to Algorithm Changes",
    description: "Stay updated on AI platform changes and adapt",
    category: "aeo",
    phase: 3,
    difficulty: "easy",
    expectedScoreImpact: 2,
    expectedDaysToComplete: 3,
    actionItems: [
      { title: "Set up AI platform change monitoring", order: 1 },
      { title: "Weekly review of citation patterns", order: 2 },
      { title: "Adjust content strategy as needed", order: 3 },
    ],
    condition: () => true,
  },
  {
    title: "Regular Social Engagement",
    description: "Maintain consistent social media presence and engagement",
    category: "smo",
    phase: 3,
    difficulty: "easy",
    expectedScoreImpact: 2,
    expectedDaysToComplete: 7,
    actionItems: [
      { title: "Daily engagement with followers", order: 1 },
      { title: "Weekly content creation and scheduling", order: 2 },
      { title: "Monthly performance review and adjustment", order: 3 },
    ],
    condition: () => true,
  },
];

/**
 * Generate improvement roadmap for a brand
 */
export async function generateRoadmap(
  brandId: string,
  options: RoadmapGenerationOptions = { targetPosition: "competitive" }
): Promise<ImprovementRoadmap & { milestones: RoadmapMilestone[] }> {
  // Get gap analysis to understand where improvements are needed
  const gapAnalysis = await calculateGapAnalysis(brandId);
  const { brandScore, competitorScores } = gapAnalysis;

  // Determine target score based on position goal
  let targetUnifiedScore: number;
  let targetGrade: string;

  switch (options.targetPosition) {
    case "leader":
      const maxCompetitorScore = Math.max(...competitorScores.map(c => c.unifiedScore), 0);
      targetUnifiedScore = Math.max(maxCompetitorScore + 5, 85);
      targetGrade = targetUnifiedScore >= 90 ? "A" : "B+";
      break;
    case "top3":
      const sortedScores = [...competitorScores.map(c => c.unifiedScore)].sort((a, b) => b - a);
      targetUnifiedScore = sortedScores[2] || sortedScores[0] || brandScore.unifiedScore + 10;
      targetGrade = targetUnifiedScore >= 80 ? "B" : "C+";
      break;
    case "competitive":
    default:
      const avgScore = competitorScores.length > 0
        ? competitorScores.reduce((sum, c) => sum + c.unifiedScore, 0) / competitorScores.length
        : 70;
      targetUnifiedScore = Math.round(avgScore + 5);
      targetGrade = targetUnifiedScore >= 75 ? "C+" : "C";
  }

  // Calculate gaps per category
  const avgCompetitorScores = {
    geo: competitorScores.length > 0
      ? competitorScores.reduce((sum, c) => sum + c.geoScore, 0) / competitorScores.length
      : 60,
    seo: competitorScores.length > 0
      ? competitorScores.reduce((sum, c) => sum + c.seoScore, 0) / competitorScores.length
      : 60,
    aeo: competitorScores.length > 0
      ? competitorScores.reduce((sum, c) => sum + c.aeoScore, 0) / competitorScores.length
      : 60,
    smo: competitorScores.length > 0
      ? competitorScores.reduce((sum, c) => sum + c.smoScore, 0) / competitorScores.length
      : 60,
    ppo: competitorScores.length > 0
      ? competitorScores.reduce((sum, c) => sum + c.ppoScore, 0) / competitorScores.length
      : 60,
  };

  const gaps = {
    geo: brandScore.geoScore - avgCompetitorScores.geo,
    seo: brandScore.seoScore - avgCompetitorScores.seo,
    aeo: brandScore.aeoScore - avgCompetitorScores.aeo,
    smo: brandScore.smoScore - avgCompetitorScores.smo,
    ppo: brandScore.ppoScore - avgCompetitorScores.ppo,
  };

  // Filter templates based on conditions and focus areas
  const focusAreas = options.focusAreas || ["geo", "seo", "aeo", "smo", "ppo"];
  const applicableTemplates = MILESTONE_TEMPLATES.filter(template => {
    if (!focusAreas.includes(template.category)) return false;
    if (template.condition && !template.condition(gaps[template.category])) return false;
    return true;
  });

  // Prioritize milestones
  const prioritizedMilestones = prioritizeMilestones(applicableTemplates, gaps, options);

  // Estimate total weeks
  const totalDays = prioritizedMilestones.reduce((sum, m) => sum + m.expectedDaysToComplete, 0);
  const estimatedWeeks = Math.ceil(totalDays / 7);

  // Create roadmap in database
  const roadmapId = createId();
  const roadmapData: NewImprovementRoadmap = {
    id: roadmapId,
    brandId,
    title: getRoadmapTitle(options),
    description: getRoadmapDescription(brandScore, targetUnifiedScore, options),
    targetCompetitor: options.targetCompetitor,
    targetPosition: options.targetPosition,
    currentUnifiedScore: brandScore.unifiedScore,
    targetUnifiedScore,
    currentGrade: brandScore.grade,
    targetGrade,
    estimatedWeeks,
    status: "draft",
    progressPercentage: 0,
    generatedByAi: options.aiEnhanced || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(improvementRoadmaps).values(roadmapData);

  // Create milestones in database
  const milestones: RoadmapMilestone[] = [];

  for (let i = 0; i < prioritizedMilestones.length; i++) {
    const template = prioritizedMilestones[i];
    const milestoneId = createId();

    const actionItems: MilestoneActionItem[] = template.actionItems.map((item, idx) => ({
      id: createId(),
      title: item.title,
      description: item.description,
      isCompleted: false,
      order: item.order,
    }));

    const milestoneData: NewRoadmapMilestone = {
      id: milestoneId,
      roadmapId,
      title: template.title,
      description: template.description,
      category: template.category,
      phase: template.phase,
      orderInPhase: i,
      expectedScoreImpact: template.expectedScoreImpact,
      expectedDaysToComplete: template.expectedDaysToComplete,
      difficulty: template.difficulty,
      actionItems,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(roadmapMilestones).values(milestoneData);
    milestones.push(milestoneData as RoadmapMilestone);
  }

  return {
    ...roadmapData,
    milestones,
  } as ImprovementRoadmap & { milestones: RoadmapMilestone[] };
}

/**
 * Prioritize milestones based on impact and effort
 */
function prioritizeMilestones(
  templates: MilestoneTemplate[],
  gaps: Record<string, number>,
  options: RoadmapGenerationOptions
): MilestoneTemplate[] {
  return templates
    .map(template => {
      // Calculate priority score
      const impactWeight = template.expectedScoreImpact;
      const effortWeight = template.difficulty === "easy" ? 3 : template.difficulty === "medium" ? 2 : 1;
      const gapWeight = Math.abs(gaps[template.category]) / 10;
      const phaseWeight = template.phase === 1 ? 3 : template.phase === 2 ? 2 : 1;

      const priorityScore = impactWeight * effortWeight * (1 + gapWeight) * phaseWeight;

      return { template, priorityScore };
    })
    .sort((a, b) => {
      // Sort by phase first, then by priority score
      if (a.template.phase !== b.template.phase) {
        return a.template.phase - b.template.phase;
      }
      return b.priorityScore - a.priorityScore;
    })
    .map(item => item.template);
}

/**
 * Get roadmap title based on options
 */
function getRoadmapTitle(options: RoadmapGenerationOptions): string {
  if (options.targetCompetitor) {
    return `Improvement Plan to Beat ${options.targetCompetitor}`;
  }

  switch (options.targetPosition) {
    case "leader":
      return "Roadmap to Industry Leadership";
    case "top3":
      return "Path to Top 3 Position";
    case "competitive":
    default:
      return "Competitive Improvement Roadmap";
  }
}

/**
 * Get roadmap description
 */
function getRoadmapDescription(
  brandScore: BrandScoreResult,
  targetScore: number,
  options: RoadmapGenerationOptions
): string {
  const scoreDiff = targetScore - brandScore.unifiedScore;

  if (options.targetCompetitor) {
    return `Strategic roadmap to surpass ${options.targetCompetitor} by improving your unified score by ${scoreDiff} points.`;
  }

  switch (options.targetPosition) {
    case "leader":
      return `Comprehensive plan to achieve industry leadership position with a target unified score of ${targetScore}.`;
    case "top3":
      return `Focused improvement plan to reach top 3 competitive position, targeting ${scoreDiff} point improvement.`;
    case "competitive":
    default:
      return `Balanced improvement roadmap to strengthen your competitive position across all score categories.`;
  }
}

/**
 * Get active roadmap for a brand
 */
export async function getActiveRoadmap(
  brandId: string
): Promise<(ImprovementRoadmap & { milestones: RoadmapMilestone[] }) | null> {
  const roadmap = await db.query.improvementRoadmaps.findFirst({
    where: and(
      eq(improvementRoadmaps.brandId, brandId),
      eq(improvementRoadmaps.status, "active")
    ),
  });

  if (!roadmap) return null;

  const milestones = await db.query.roadmapMilestones.findMany({
    where: eq(roadmapMilestones.roadmapId, roadmap.id),
    orderBy: [asc(roadmapMilestones.phase), asc(roadmapMilestones.orderInPhase)],
  });

  return { ...roadmap, milestones };
}

/**
 * Get roadmap by ID
 */
export async function getRoadmapById(
  roadmapId: string
): Promise<(ImprovementRoadmap & { milestones: RoadmapMilestone[] }) | null> {
  const roadmap = await db.query.improvementRoadmaps.findFirst({
    where: eq(improvementRoadmaps.id, roadmapId),
  });

  if (!roadmap) return null;

  const milestones = await db.query.roadmapMilestones.findMany({
    where: eq(roadmapMilestones.roadmapId, roadmap.id),
    orderBy: [asc(roadmapMilestones.phase), asc(roadmapMilestones.orderInPhase)],
  });

  return { ...roadmap, milestones };
}

/**
 * Update roadmap status
 */
export async function updateRoadmapStatus(
  roadmapId: string,
  status: "draft" | "active" | "paused" | "completed"
): Promise<void> {
  const updates: Partial<ImprovementRoadmap> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "active") {
    updates.startedAt = new Date();
  } else if (status === "completed") {
    updates.completedAt = new Date();
    updates.progressPercentage = 100;
  }

  await db
    .update(improvementRoadmaps)
    .set(updates)
    .where(eq(improvementRoadmaps.id, roadmapId));
}

/**
 * Update milestone status
 */
export async function updateMilestoneStatus(
  milestoneId: string,
  status: "pending" | "in_progress" | "completed" | "skipped",
  actualScoreImpact?: number
): Promise<void> {
  const updates: Partial<RoadmapMilestone> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "completed") {
    updates.completedAt = new Date();
    if (actualScoreImpact !== undefined) {
      updates.actualScoreImpact = actualScoreImpact;
    }
  }

  await db
    .update(roadmapMilestones)
    .set(updates)
    .where(eq(roadmapMilestones.id, milestoneId));

  // Update roadmap progress
  const milestone = await db.query.roadmapMilestones.findFirst({
    where: eq(roadmapMilestones.id, milestoneId),
  });

  if (milestone) {
    await updateRoadmapProgress(milestone.roadmapId);
  }
}

/**
 * Update action item status within a milestone
 */
export async function updateActionItemStatus(
  milestoneId: string,
  actionItemId: string,
  isCompleted: boolean
): Promise<void> {
  const milestone = await db.query.roadmapMilestones.findFirst({
    where: eq(roadmapMilestones.id, milestoneId),
  });

  if (!milestone) return;

  const actionItems = (milestone.actionItems || []) as MilestoneActionItem[];
  const updatedItems = actionItems.map(item => {
    if (item.id === actionItemId) {
      return {
        ...item,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
      };
    }
    return item;
  });

  await db
    .update(roadmapMilestones)
    .set({
      actionItems: updatedItems,
      updatedAt: new Date(),
    })
    .where(eq(roadmapMilestones.id, milestoneId));
}

/**
 * Update roadmap progress percentage
 */
async function updateRoadmapProgress(roadmapId: string): Promise<void> {
  const milestones = await db.query.roadmapMilestones.findMany({
    where: eq(roadmapMilestones.roadmapId, roadmapId),
  });

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(
    m => m.status === "completed" || m.status === "skipped"
  ).length;

  const progressPercentage = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  await db
    .update(improvementRoadmaps)
    .set({
      progressPercentage,
      updatedAt: new Date(),
    })
    .where(eq(improvementRoadmaps.id, roadmapId));
}

/**
 * Create progress snapshot
 */
export async function createProgressSnapshot(
  roadmapId: string,
  brandId: string
): Promise<void> {
  const brandScore = await calculateBrandScores(brandId);
  const roadmap = await getRoadmapById(roadmapId);

  if (!roadmap) return;

  const competitorScores = await calculateCompetitorScores(brandId);
  const allScores = [
    brandScore.unifiedScore,
    ...competitorScores.map(c => c.unifiedScore),
  ].sort((a, b) => b - a);
  const rankAmongCompetitors = allScores.indexOf(brandScore.unifiedScore) + 1;

  const completedMilestones = roadmap.milestones.filter(
    m => m.status === "completed"
  ).length;

  const snapshot: NewRoadmapProgressSnapshot = {
    id: createId(),
    roadmapId,
    snapshotDate: new Date().toISOString().split("T")[0],
    geoScore: brandScore.geoScore,
    seoScore: brandScore.seoScore,
    aeoScore: brandScore.aeoScore,
    smoScore: brandScore.smoScore,
    ppoScore: brandScore.ppoScore,
    unifiedScore: brandScore.unifiedScore,
    grade: brandScore.grade,
    milestonesCompleted: completedMilestones,
    milestonesTotal: roadmap.milestones.length,
    rankAmongCompetitors,
    createdAt: new Date(),
  };

  await db.insert(roadmapProgressSnapshots).values(snapshot);
}

/**
 * Get progress snapshots for a roadmap
 */
export async function getProgressSnapshots(
  roadmapId: string
): Promise<RoadmapProgressSnapshot[]> {
  return db.query.roadmapProgressSnapshots.findMany({
    where: eq(roadmapProgressSnapshots.roadmapId, roadmapId),
    orderBy: asc(roadmapProgressSnapshots.snapshotDate),
  });
}

/**
 * Get all roadmaps for a brand
 */
export async function getBrandRoadmaps(
  brandId: string
): Promise<ImprovementRoadmap[]> {
  return db.query.improvementRoadmaps.findMany({
    where: eq(improvementRoadmaps.brandId, brandId),
    orderBy: desc(improvementRoadmaps.createdAt),
  });
}
