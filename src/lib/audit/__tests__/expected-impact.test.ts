import { describe, expect, it } from "vitest";
import { projectExpectedImpact } from "../expected-impact";
import type { AuditIssue, CategoryScore } from "@/lib/db/schema/audits";

function issue(
  id: string,
  category: AuditIssue["category"],
  severity: AuditIssue["severity"],
): AuditIssue {
  return {
    id,
    category,
    severity,
    title: `issue-${id}`,
    description: "",
    recommendation: "",
    impact: "",
  };
}

const fullBoardCategoryScores: CategoryScore[] = [
  { category: "structure", score: 100, maxScore: 100, issues: 0 },
  { category: "schema", score: 15, maxScore: 100, issues: 3 },
  { category: "clarity", score: 45, maxScore: 100, issues: 1 },
  { category: "metadata", score: 35, maxScore: 100, issues: 1 },
  { category: "accessibility", score: 100, maxScore: 100, issues: 0 },
];

describe("projectExpectedImpact", () => {
  it("gives zero impact for findings whose category is already maxed", () => {
    const issues = [issue("a", "structure", "medium")];
    const map = projectExpectedImpact({
      issues,
      categoryScores: fullBoardCategoryScores,
    });
    expect(map.get("a") ?? 0).toBe(0);
  });

  it("assigns the largest impact to the worst-scoring category", () => {
    const issues = [
      issue("schema-1", "schema", "high"),
      issue("meta-1", "metadata", "high"),
    ];
    const map = projectExpectedImpact({
      issues,
      categoryScores: fullBoardCategoryScores,
    });
    const schemaImpact = map.get("schema-1") ?? 0;
    const metaImpact = map.get("meta-1") ?? 0;
    // Schema has larger headroom (85pts vs 65pts) AND a higher factor weight
    // (0.25 vs 0.15) so it should always out-score metadata.
    expect(schemaImpact).toBeGreaterThan(metaImpact);
    expect(schemaImpact).toBeGreaterThan(0);
  });

  it("splits impact within a category by severity weight", () => {
    const issues = [
      issue("s-critical", "schema", "critical"),
      issue("s-low", "schema", "low"),
    ];
    const map = projectExpectedImpact({
      issues,
      categoryScores: fullBoardCategoryScores,
    });
    const critical = map.get("s-critical") ?? 0;
    const low = map.get("s-low") ?? 0;
    // Critical weight=4, low weight=1 → critical gets ~4× the allocation.
    expect(critical).toBeGreaterThanOrEqual(low * 3);
  });

  it("ignores unknown categories", () => {
    const issues = [issue("x", "ai_crawler", "high")];
    const map = projectExpectedImpact({
      issues,
      categoryScores: fullBoardCategoryScores,
    });
    expect(map.has("x")).toBe(false);
  });

  it("returns conservative numbers — never exceeds the weighted headroom", () => {
    // Schema @ 15/100, factor weight 0.25 → theoretical max overall lift 21,
    // then × 0.7 conservative = ~15. A single schema finding should never
    // exceed this upper bound.
    const issues = [issue("only-schema", "schema", "critical")];
    const map = projectExpectedImpact({
      issues,
      categoryScores: fullBoardCategoryScores,
    });
    expect(map.get("only-schema") ?? 0).toBeLessThanOrEqual(16);
  });
});
