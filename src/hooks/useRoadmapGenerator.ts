import * as React from "react";
import { Audit } from "@/hooks/useAudit";

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  effort: "low" | "medium" | "high";
  estimatedDays: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  category: "geo" | "seo" | "aeo" | "smo" | "ppo";
  phase: 1 | 2 | 3;
  orderInPhase: number;
  expectedScoreImpact: number;
  expectedDaysToComplete: number;
  difficulty: "easy" | "medium" | "hard";
  actionItems: ActionItem[];
  status: "pending" | "in_progress" | "completed";
  completedAt?: string;
  actualScoreImpact?: number;
}

export interface RoadmapPhase {
  phase: 1 | 2 | 3;
  title: string;
  description: string;
  duration: string;
  milestones: Milestone[];
  totalExpectedImpact: number;
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  mode: "leader" | "beat_competitor";
  targetCompetitor?: string;
  currentUnifiedScore: number;
  targetUnifiedScore: number;
  currentGrade: string;
  targetGrade: string;
  estimatedWeeks: number;
  status: "draft" | "active" | "paused" | "completed";
  progressPercentage: number;
  phases: RoadmapPhase[];
  createdAt: string;
  updatedAt: string;
}

export function useRoadmapGenerator(
  audit: Audit | null | undefined,
  mode: "leader" | "beat_competitor" = "leader",
  targetCompetitor?: string
): Roadmap | null {
  return React.useMemo(() => {
    if (!audit) return null;

    // Parse current scores from audit categoryScores array
    const findScore = (category: string, fallback: number) =>
      audit.categoryScores?.find((c) => c.category === category)?.score ?? fallback;
    const currentGeo = findScore("geo", 65);
    const currentSeo = findScore("seo", 72);
    const currentAeo = findScore("aeo", 58);
    const currentSmo = findScore("smo", 64);
    const currentPpo = findScore("ppo", 71);
    const currentUnifiedScore = Math.round(
      (currentGeo + currentSeo + currentAeo + currentSmo + currentPpo) / 5
    );

    // Determine targets based on mode
    let targetUnifiedScore = 88; // Leader threshold
    let title = "Path to Industry Leadership";
    let description =
      "Strategic improvements to become the category leader in your industry";

    if (mode === "beat_competitor" && targetCompetitor) {
      targetUnifiedScore = 82; // Assume competitor at 82
      title = `Beat ${targetCompetitor}`;
      description = `Strategic improvements to outrank ${targetCompetitor} and capture market share`;
    }

    const targetGrade = targetUnifiedScore >= 85 ? "A" : "B+";
    const currentGrade = currentUnifiedScore >= 85 ? "A" : currentUnifiedScore >= 75 ? "B" : "C";

    // Define phases with milestones
    const phases: RoadmapPhase[] = [
      {
        phase: 1,
        title: "Quick Wins (1-2 Weeks)",
        description: "High-impact, low-effort improvements to gain momentum",
        duration: "1-2 weeks",
        totalExpectedImpact: 12,
        milestones: [
          {
            id: "m1-1",
            title: "Add FAQ Schema Markup",
            description:
              "Implement FAQ schema on your top 10 pages to improve GEO and AEO visibility",
            category: "geo",
            phase: 1,
            orderInPhase: 1,
            expectedScoreImpact: 5,
            expectedDaysToComplete: 3,
            difficulty: "easy",
            status: "pending",
            actionItems: [
              {
                id: "a1",
                title: "Audit existing Q&A content",
                description: "Identify FAQ opportunities on top pages",
                completed: false,
                effort: "low",
                estimatedDays: 1,
              },
              {
                id: "a2",
                title: "Add schema.org FAQ markup",
                description: "Implement structured data for Google Rich Results",
                completed: false,
                effort: "medium",
                estimatedDays: 2,
              },
              {
                id: "a3",
                title: "Test in Google Search Console",
                description: "Verify schema validation and request indexing",
                completed: false,
                effort: "low",
                estimatedDays: 1,
              },
            ],
          },
          {
            id: "m1-2",
            title: "Optimize Meta Descriptions",
            description:
              "Rewrite meta descriptions to include primary keywords and CTAs",
            category: "seo",
            phase: 1,
            orderInPhase: 2,
            expectedScoreImpact: 4,
            expectedDaysToComplete: 5,
            difficulty: "easy",
            status: "pending",
            actionItems: [
              {
                id: "a4",
                title: "Audit current meta descriptions",
                description:
                  "Identify pages with missing or thin meta descriptions",
                completed: false,
                effort: "low",
                estimatedDays: 1,
              },
              {
                id: "a5",
                title: "Write optimized descriptions",
                description: "120-160 characters with keyword and CTA",
                completed: false,
                effort: "medium",
                estimatedDays: 3,
              },
              {
                id: "a6",
                title: "Update in CMS",
                description: "Deploy changes to production",
                completed: false,
                effort: "low",
                estimatedDays: 1,
              },
            ],
          },
          {
            id: "m1-3",
            title: "Enable AI Platform Indexing",
            description:
              "Optimize robots.txt and allow AI platform crawlers (Perplexity, Claude, etc.)",
            category: "aeo",
            phase: 1,
            orderInPhase: 3,
            expectedScoreImpact: 3,
            expectedDaysToComplete: 2,
            difficulty: "easy",
            status: "pending",
            actionItems: [
              {
                id: "a7",
                title: "Review robots.txt configuration",
                description: "Check for blocking of AI platform crawlers",
                completed: false,
                effort: "low",
                estimatedDays: 1,
              },
              {
                id: "a8",
                title: "Allow AI crawler access",
                description:
                  "Update robots.txt to permit Perplexity, ClaudeBot, etc.",
                completed: false,
                effort: "low",
                estimatedDays: 1,
              },
            ],
          },
        ],
      },
      {
        phase: 2,
        title: "Month 1 Focus (2-4 Weeks)",
        description:
          "Medium-effort improvements for sustained score growth and authority building",
        duration: "2-4 weeks",
        totalExpectedImpact: 18,
        milestones: [
          {
            id: "m2-1",
            title: "Create Pillar Content Strategy",
            description:
              "Develop 3-5 pillar pages covering your core topics with comprehensive content",
            category: "seo",
            phase: 2,
            orderInPhase: 1,
            expectedScoreImpact: 7,
            expectedDaysToComplete: 14,
            difficulty: "medium",
            status: "pending",
            actionItems: [
              {
                id: "a9",
                title: "Identify pillar topics",
                description: "Select 3-5 core topics with high search volume",
                completed: false,
                effort: "medium",
                estimatedDays: 2,
              },
              {
                id: "a10",
                title: "Create pillar content",
                description:
                  "Write 3000+ word comprehensive guides (3-5 pillars)",
                completed: false,
                effort: "high",
                estimatedDays: 10,
              },
              {
                id: "a11",
                title: "Internal linking strategy",
                description:
                  "Link related content and cluster topics to pillars",
                completed: false,
                effort: "medium",
                estimatedDays: 2,
              },
            ],
          },
          {
            id: "m2-2",
            title: "Build Backlink Profile",
            description:
              "Develop relationships and acquire 20+ quality backlinks from authority sites",
            category: "seo",
            phase: 2,
            orderInPhase: 2,
            expectedScoreImpact: 6,
            expectedDaysToComplete: 21,
            difficulty: "hard",
            status: "pending",
            actionItems: [
              {
                id: "a12",
                title: "Identify link opportunities",
                description: "Find 40+ relevant sites for outreach",
                completed: false,
                effort: "medium",
                estimatedDays: 5,
              },
              {
                id: "a13",
                title: "Personalized outreach",
                description: "Send targeted pitches with unique value props",
                completed: false,
                effort: "high",
                estimatedDays: 12,
              },
              {
                id: "a14",
                title: "Track link acquisition",
                description: "Monitor and verify backlinks in tools",
                completed: false,
                effort: "low",
                estimatedDays: 4,
              },
            ],
          },
          {
            id: "m2-3",
            title: "Social Media Content Calendar",
            description:
              "Create and publish 20 pieces of social content optimized for AI discovery",
            category: "smo",
            phase: 2,
            orderInPhase: 3,
            expectedScoreImpact: 5,
            expectedDaysToComplete: 14,
            difficulty: "medium",
            status: "pending",
            actionItems: [
              {
                id: "a15",
                title: "Plan social content themes",
                description: "Align with pillar topics and audience interests",
                completed: false,
                effort: "medium",
                estimatedDays: 3,
              },
              {
                id: "a16",
                title: "Create 20 pieces of content",
                description: "Mix of educational, promotional, and engagement posts",
                completed: false,
                effort: "high",
                estimatedDays: 10,
              },
              {
                id: "a17",
                title: "Schedule and monitor engagement",
                description: "Post on optimal times and respond to comments",
                completed: false,
                effort: "medium",
                estimatedDays: 1,
              },
            ],
          },
        ],
      },
      {
        phase: 3,
        title: "Ongoing Improvements (Continuous)",
        description:
          "Long-term optimization and maintenance for sustained leadership",
        duration: "Ongoing",
        totalExpectedImpact: 8,
        milestones: [
          {
            id: "m3-1",
            title: "Monthly Content Updates",
            description:
              "Refresh and update top 10 pages with latest data and insights",
            category: "seo",
            phase: 3,
            orderInPhase: 1,
            expectedScoreImpact: 3,
            expectedDaysToComplete: 8,
            difficulty: "medium",
            status: "pending",
            actionItems: [
              {
                id: "a18",
                title: "Identify pages for updates",
                description: "Analyze traffic and ranking trends",
                completed: false,
                effort: "low",
                estimatedDays: 1,
              },
              {
                id: "a19",
                title: "Add fresh content and data",
                description: "Update statistics, case studies, and examples",
                completed: false,
                effort: "medium",
                estimatedDays: 5,
              },
              {
                id: "a20",
                title: "Republish with update date",
                description: "Update published date to signal freshness",
                completed: false,
                effort: "low",
                estimatedDays: 2,
              },
            ],
          },
          {
            id: "m3-2",
            title: "AI Platform Monitoring",
            description:
              "Track mentions across AI platforms and capture new opportunities",
            category: "aeo",
            phase: 3,
            orderInPhase: 2,
            expectedScoreImpact: 3,
            expectedDaysToComplete: 5,
            difficulty: "easy",
            status: "pending",
            actionItems: [
              {
                id: "a21",
                title: "Weekly platform monitoring",
                description: "Check ChatGPT, Claude, Perplexity for brand mentions",
                completed: false,
                effort: "low",
                estimatedDays: 1,
              },
              {
                id: "a22",
                title: "Respond to user feedback",
                description: "Address negative mentions and engage positively",
                completed: false,
                effort: "low",
                estimatedDays: 2,
              },
              {
                id: "a23",
                title: "Optimize based on patterns",
                description:
                  "Identify and fix common objections in AI platform responses",
                completed: false,
                effort: "medium",
                estimatedDays: 2,
              },
            ],
          },
          {
            id: "m3-3",
            title: "Performance Monitoring & Testing",
            description: "Continuous A/B testing and performance optimization",
            category: "ppo",
            phase: 3,
            orderInPhase: 3,
            expectedScoreImpact: 2,
            expectedDaysToComplete: 0,
            difficulty: "easy",
            status: "pending",
            actionItems: [
              {
                id: "a24",
                title: "Core Web Vitals monitoring",
                description:
                  "Track LCP, FID, CLS weekly and optimize as needed",
                completed: false,
                effort: "low",
                estimatedDays: 0,
              },
              {
                id: "a25",
                title: "Monthly performance audit",
                description: "Run Lighthouse and identify optimization opportunities",
                completed: false,
                effort: "medium",
                estimatedDays: 0,
              },
            ],
          },
        ],
      },
    ];

    // Calculate total expected impact
    const totalExpectedImpact = phases.reduce(
      (sum, p) =>
        sum + p.milestones.reduce((msum, m) => msum + m.expectedScoreImpact, 0),
      0
    );
    const projectedScore = Math.min(100, currentUnifiedScore + totalExpectedImpact);
    const estimatedWeeks = Math.ceil(
      phases.reduce(
        (sum, p) =>
          sum +
          p.milestones.reduce((msum, m) => msum + m.expectedDaysToComplete, 0),
        0
      ) / 7
    );

    const roadmap: Roadmap = {
      id: `roadmap-${audit.id}-${mode}`,
      title,
      description,
      mode,
      targetCompetitor,
      currentUnifiedScore,
      targetUnifiedScore,
      currentGrade,
      targetGrade,
      estimatedWeeks,
      status: "active",
      progressPercentage: 0,
      phases,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return roadmap;
  }, [audit, mode, targetCompetitor]);
}
