/**
 * Expected-score-impact projection per audit finding.
 *
 * The scoring pipeline in scoring.ts is signal-grounded: each category
 * score is a deterministic function of page signals, and the overall is a
 * weighted combination (AUDIT_FACTORS weights in score-decomposition.ts).
 * Fixing a finding flips specific signals, which lifts the category
 * score, which lifts the overall.
 *
 * Rather than attempt to perfectly invert each signal-level scoring rule
 * per finding (brittle), we estimate two things:
 *   - per-category headroom: how much could this category score grow if
 *     every current finding in it were resolved?
 *   - per-finding share: attribute the headroom across findings in that
 *     category, weighted by severity.
 *
 * The output is the projected overall-score delta (0–100 integer) the
 * user should expect from fixing that finding in isolation. The number
 * is deliberately conservative — signal flips rarely yield the full
 * paper-score lift in practice.
 */

import type { AuditIssue, CategoryScore } from "@/lib/db/schema/audits";
import { AUDIT_FACTORS, type FactorKey } from "./score-decomposition";

// Category label the audit engine emits → factor key used in scoring.
function toFactorKey(auditCategory: string): FactorKey | null {
  const c = auditCategory.toLowerCase();
  if (c === "structure") return "structure";
  if (c === "schema") return "schema";
  if (c === "clarity" || c === "content") return "clarity";
  if (c === "metadata") return "metadata";
  if (c === "accessibility") return "accessibility";
  return null;
}

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function projectExpectedImpact(params: {
  issues: AuditIssue[];
  categoryScores: CategoryScore[];
}): Map<string, number> {
  const { issues, categoryScores } = params;
  const result = new Map<string, number>();

  // Group issues by factor key.
  const grouped = new Map<FactorKey, AuditIssue[]>();
  for (const issue of issues) {
    const factor = toFactorKey(issue.category);
    if (!factor) continue;
    const list = grouped.get(factor) ?? [];
    list.push(issue);
    grouped.set(factor, list);
  }

  for (const [factor, group] of grouped) {
    const categoryRow = categoryScores.find((c) => c.category === factor);
    if (!categoryRow) continue;

    // Headroom = how far below 100 the category sits, weighted by the
    // factor's contribution to the overall score. If schema is 15/100
    // and weighs 0.25, fixing it entirely lifts overall by ~0.25 × 85 =
    // 21 points. A conservative 0.7 multiplier accounts for real-world
    // slippage between signal flips and measured score gains.
    const categoryHeadroom =
      ((categoryRow.maxScore - categoryRow.score) / categoryRow.maxScore) *
      100;
    const factorWeight = AUDIT_FACTORS[factor].weight;
    const overallHeadroom = categoryHeadroom * factorWeight * 0.7;

    // Allocate headroom across findings in this category proportional to
    // severity. A critical + a low finding in the same category don't
    // get equal credit.
    const totalSeverityWeight = group.reduce(
      (sum, i) => sum + (SEVERITY_WEIGHT[i.severity] ?? 1),
      0,
    );

    for (const issue of group) {
      const share =
        totalSeverityWeight > 0
          ? (SEVERITY_WEIGHT[issue.severity] ?? 1) / totalSeverityWeight
          : 1 / group.length;
      const delta = Math.round(overallHeadroom * share);
      if (delta > 0) {
        result.set(issue.id, delta);
      }
    }
  }

  return result;
}
