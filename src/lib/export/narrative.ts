/**
 * Report Insights Narrative Generator (Phase 4.4)
 *
 * Produces a structured, human-readable narrative summarizing report data.
 * Designed to be embedded in PDF, PPTX, and Markdown exports.
 *
 * Template-based (deterministic) — no external LLM call, so it stays cheap
 * and reproducible for scheduled reports.
 */

import type {
  GEOScoreReport,
  MentionsReport,
  RecommendationsReport,
  AuditReport,
} from "./pdf";

export interface NarrativeInput {
  brandName: string;
  dateRange?: { start: Date; end: Date };
  geo?: GEOScoreReport;
  mentions?: MentionsReport;
  recommendations?: RecommendationsReport;
  audit?: AuditReport;
}

export interface InsightsNarrative {
  headline: string;
  executive: string;
  sections: Array<{ heading: string; body: string }>;
  bullets: string[];
  keyTakeaway: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function pct(v: number): string {
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function scoreVerdict(change: number): string {
  if (change > 10) return "a substantial improvement";
  if (change > 3) return "a meaningful gain";
  if (change > 0) return "a slight lift";
  if (change === 0) return "no movement";
  if (change > -3) return "a minor slip";
  if (change > -10) return "a concerning decline";
  return "a major regression";
}

function buildGeoSection(brandName: string, geo: GEOScoreReport): {
  heading: string;
  body: string;
  bullets: string[];
} {
  const verdict = scoreVerdict(geo.change);
  const pctChange =
    geo.previousScore > 0 ? (geo.change / geo.previousScore) * 100 : 0;

  const strengths = Object.entries(geo.breakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([k]) => k);
  const weaknesses = Object.entries(geo.breakdown)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 2)
    .map(([k]) => k);

  const body = `${brandName}'s GEO score is ${geo.currentScore} (${pct(pctChange)} vs ${geo.previousScore}) — ${verdict}. The strongest components are ${strengths.join(" and ")}, while ${weaknesses.join(" and ")} are dragging the composite down.`;

  const bullets: string[] = [
    `GEO score ${geo.currentScore >= 80 ? "is strong" : geo.currentScore >= 60 ? "is developing" : "needs work"}: ${geo.currentScore}/100`,
    `${geo.change >= 0 ? "Improvement" : "Decline"} of ${Math.abs(geo.change)} points period-over-period`,
  ];
  if (weaknesses.length > 0) {
    bullets.push(`Focus area: ${weaknesses[0]} (lowest component)`);
  }

  return { heading: "GEO Score Trajectory", body, bullets };
}

function buildMentionsSection(
  brandName: string,
  mentions: MentionsReport,
): { heading: string; body: string; bullets: string[] } {
  const totalSentiment =
    mentions.bySentiment.positive +
    mentions.bySentiment.neutral +
    mentions.bySentiment.negative;
  const positiveRate =
    totalSentiment > 0 ? (mentions.bySentiment.positive / totalSentiment) * 100 : 0;
  const negativeRate =
    totalSentiment > 0 ? (mentions.bySentiment.negative / totalSentiment) * 100 : 0;

  const topPlatform = Object.entries(mentions.byPlatform).sort(
    ([, a], [, b]) => b - a,
  )[0];
  const platformLine = topPlatform
    ? `${topPlatform[0]} leads mentions with ${topPlatform[1]}, followed by ${Object.entries(
        mentions.byPlatform,
      )
        .sort(([, a], [, b]) => b - a)
        .slice(1, 3)
        .map(([k, v]) => `${k} (${v})`)
        .join(" and ") || "minimal activity elsewhere"}.`
    : "Mention distribution is flat across platforms.";

  const body = `${brandName} received ${mentions.total} mentions over this window. Sentiment skews ${
    positiveRate >= 60
      ? "strongly positive"
      : positiveRate >= 40
        ? "mixed-to-positive"
        : negativeRate >= 30
          ? "concerningly negative"
          : "largely neutral"
  } (${positiveRate.toFixed(0)}% positive, ${negativeRate.toFixed(0)}% negative). ${platformLine}`;

  const bullets: string[] = [
    `Total mentions: ${mentions.total}`,
    `Positive: ${positiveRate.toFixed(0)}% · Negative: ${negativeRate.toFixed(0)}%`,
  ];
  if (mentions.topQueries.length > 0) {
    bullets.push(`Top query: "${mentions.topQueries[0].query}" (${mentions.topQueries[0].count} hits)`);
  }

  return { heading: "Mention & Sentiment Landscape", body, bullets };
}

function buildRecommendationsSection(
  recommendations: RecommendationsReport,
): { heading: string; body: string; bullets: string[] } {
  const completionRate =
    recommendations.total > 0
      ? (recommendations.completed / recommendations.total) * 100
      : 0;
  const criticalOpen = recommendations.byPriority.critical;
  const highOpen = recommendations.byPriority.high;

  const tone =
    criticalOpen > 0
      ? "Critical work is outstanding — prioritize these first."
      : highOpen > 2
        ? "Several high-priority items need attention this week."
        : "The recommendations backlog is under control.";

  const body = `${recommendations.total} recommendations generated; ${recommendations.completed} completed (${completionRate.toFixed(0)}%). ${recommendations.inProgress} are in progress, ${recommendations.pending} pending. ${tone}`;

  const bullets: string[] = [
    `Completion rate: ${completionRate.toFixed(0)}% (${recommendations.completed}/${recommendations.total})`,
    `Open critical: ${criticalOpen} · Open high: ${highOpen}`,
  ];
  if (recommendations.topRecommendations.length > 0) {
    bullets.push(`Next action: ${recommendations.topRecommendations[0].title}`);
  }

  return { heading: "Recommendations Pipeline", body, bullets };
}

function buildAuditSection(audit: AuditReport): {
  heading: string;
  body: string;
  bullets: string[];
} {
  const readiness =
    audit.aiReadinessScore >= 80
      ? "AI-ready"
      : audit.aiReadinessScore >= 60
        ? "partially AI-optimized"
        : "needs AI-optimization work";

  const body = `The technical audit scored ${audit.overallScore}/100 overall. Your site is ${readiness} with an AI readiness score of ${audit.aiReadinessScore}. ${audit.issuesFound} issues identified (${audit.criticalIssues} critical).`;

  const bullets: string[] = [
    `Overall score: ${audit.overallScore}/100`,
    `AI readiness: ${audit.aiReadinessScore}/100 — ${readiness}`,
    `${audit.criticalIssues} critical issues need immediate attention`,
  ];

  return { heading: "Technical Audit Findings", body, bullets };
}

export function generateInsightsNarrative(
  input: NarrativeInput,
): InsightsNarrative {
  const dateWindow = input.dateRange
    ? ` for ${formatDate(input.dateRange.start)} – ${formatDate(input.dateRange.end)}`
    : "";

  const sections: InsightsNarrative["sections"] = [];
  const allBullets: string[] = [];

  let headlineFragment = "Steady progress";
  let takeawayFragment = "Maintain the current cadence and review next period.";

  if (input.geo) {
    const sec = buildGeoSection(input.brandName, input.geo);
    sections.push({ heading: sec.heading, body: sec.body });
    allBullets.push(...sec.bullets);
    if (input.geo.change <= -10) {
      headlineFragment = "Visibility alert";
      takeawayFragment =
        "Diagnose the biggest GEO score contributors this week and ship at least one remediation.";
    } else if (input.geo.change >= 10) {
      headlineFragment = "Strong momentum";
      takeawayFragment = "Double down on the tactics driving this lift.";
    }
  }

  if (input.mentions) {
    const sec = buildMentionsSection(input.brandName, input.mentions);
    sections.push({ heading: sec.heading, body: sec.body });
    allBullets.push(...sec.bullets);
  }

  if (input.recommendations) {
    const sec = buildRecommendationsSection(input.recommendations);
    sections.push({ heading: sec.heading, body: sec.body });
    allBullets.push(...sec.bullets);
    if (input.recommendations.byPriority.critical > 0) {
      takeawayFragment =
        "Clear the critical recommendations this week — they're blocking visibility gains.";
    }
  }

  if (input.audit) {
    const sec = buildAuditSection(input.audit);
    sections.push({ heading: sec.heading, body: sec.body });
    allBullets.push(...sec.bullets);
  }

  const headline = `${headlineFragment} — ${input.brandName} report${dateWindow}`;

  const executive =
    sections.length === 0
      ? `${input.brandName} report${dateWindow}. Insufficient data to generate detailed insights — run a full scan first.`
      : sections
          .slice(0, 2)
          .map((s) => s.body)
          .join(" ");

  return {
    headline,
    executive,
    sections,
    bullets: allBullets.slice(0, 8),
    keyTakeaway: takeawayFragment,
  };
}

/**
 * Render narrative as Markdown for inline embedding in text exports.
 */
export function narrativeToMarkdown(n: InsightsNarrative): string {
  const sectionMd = n.sections
    .map((s) => `## ${s.heading}\n\n${s.body}`)
    .join("\n\n");
  const bulletsMd = n.bullets.map((b) => `- ${b}`).join("\n");
  return [
    `# ${n.headline}`,
    "",
    `> ${n.executive}`,
    "",
    sectionMd,
    "",
    "## Key Signals",
    "",
    bulletsMd,
    "",
    `**Takeaway:** ${n.keyTakeaway}`,
    "",
  ].join("\n");
}
