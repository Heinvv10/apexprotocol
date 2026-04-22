/**
 * Top-3 action plan synthesis.
 *
 * The audit produces a flat list of findings; users need to know where
 * to spend the next hour. This function cross-references the three
 * signals Apex already has — per-finding expected score impact, AI
 * platform recognition (brand_mentions), and severity — to surface the
 * three highest-leverage actions.
 *
 * Priority logic (stable across audits):
 *   #1 Highest expected_score_impact finding. The literal "fix this,
 *      your score moves most" choice — grounded in the scoring formula.
 *   #2 Entity-authority finding (Wikidata / Wikipedia) if present AND
 *      at least one AI platform's mention set shows sentiment=negative
 *      or sentiment=unrecognized. These findings specifically unblock
 *      disambiguation; other gains are capped until they're fixed.
 *   #3 Highest-severity remaining finding that overlaps with a low-
 *      recognition platform (mentionRate<50% or negative sentiment).
 *
 * Returns an empty plan when there aren't enough signals (e.g. brand
 * added but no audit yet). Callers should fall back to the flat list.
 */

import type { AuditIssue } from "@/lib/db/schema/audits";

export interface ActionPlanInputs {
  issues: AuditIssue[];
  expectedImpactById: Map<string, number>;
  platformSignals: Array<{
    platform: string;
    mentionRate: number;
    sentiment: "positive" | "neutral" | "negative" | "unrecognized";
  }>;
}

export interface ActionPlanItem {
  rank: 1 | 2 | 3;
  title: string;
  reason: string;
  findingIds: string[];
  expectedScoreImpact?: number;
}

export function buildActionPlan(params: ActionPlanInputs): ActionPlanItem[] {
  const { issues, expectedImpactById, platformSignals } = params;
  if (issues.length === 0) return [];

  const used = new Set<string>();
  const plan: ActionPlanItem[] = [];
  const lowRecognitionPlatforms = platformSignals.filter(
    (p) =>
      p.mentionRate < 50 ||
      p.sentiment === "negative" ||
      p.sentiment === "unrecognized",
  );

  const pick = (
    issue: AuditIssue | undefined,
    reason: string,
  ): ActionPlanItem | null => {
    if (!issue) return null;
    if (used.has(issue.id)) return null;
    used.add(issue.id);
    const impact = expectedImpactById.get(issue.id);
    return {
      rank: (plan.length + 1) as 1 | 2 | 3,
      title: issue.title,
      reason,
      findingIds: [issue.id],
      ...(typeof impact === "number" ? { expectedScoreImpact: impact } : {}),
    };
  };

  // Rank 1 — biggest projected score lift.
  const rankedByImpact = [...issues].sort(
    (a, b) =>
      (expectedImpactById.get(b.id) ?? 0) -
      (expectedImpactById.get(a.id) ?? 0),
  );
  const topImpact = rankedByImpact.find(
    (i) => (expectedImpactById.get(i.id) ?? 0) > 0,
  );
  if (topImpact) {
    const lift = expectedImpactById.get(topImpact.id);
    const item = pick(
      topImpact,
      lift
        ? `Projected to lift the overall score by ~${lift} points — the single highest-leverage fix.`
        : "Highest-leverage remaining finding.",
    );
    if (item) plan.push(item);
  }

  // Rank 2 — entity authority when AI platforms show recognition gaps.
  if (lowRecognitionPlatforms.length > 0) {
    const entityIssue = issues.find(
      (i) =>
        !used.has(i.id) &&
        (i.category === "ai_crawlability" ||
          /wikidata|wikipedia|entity/i.test(i.title)),
    );
    if (entityIssue) {
      const platforms = lowRecognitionPlatforms
        .map((p) => p.platform)
        .slice(0, 3)
        .join(", ");
      const item = pick(
        entityIssue,
        `${platforms} ${lowRecognitionPlatforms.length === 1 ? "shows" : "show"} weak recognition of the brand. This finding directly unblocks disambiguation on AI platforms.`,
      );
      if (item) plan.push(item);
    }
  }

  // Rank 3 — highest-severity remaining finding.
  if (plan.length < 3) {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const remaining = issues
      .filter((i) => !used.has(i.id))
      .sort(
        (a, b) =>
          (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4),
      );
    const next = remaining[0];
    if (next) {
      const item = pick(
        next,
        `Remaining ${next.severity}-severity finding with the most visibility.`,
      );
      if (item) plan.push(item);
    }
  }

  return plan;
}
