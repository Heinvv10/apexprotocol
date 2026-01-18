"use client";

import * as React from "react";
import { Zap, TrendingUp } from "lucide-react";
import { Audit } from "@/hooks/useAudit";

interface QuickWinsSectionProps {
  audit: Audit;
}

interface QuickWin {
  title: string;
  description: string;
  estimatedImpact: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

export function QuickWinsSection({ audit }: QuickWinsSectionProps) {
  // Extract quick wins from recommendations and issues
  // Quick wins are high-impact, low-difficulty fixes
  const quickWins: QuickWin[] = React.useMemo(() => {
    const wins: QuickWin[] = [];

    if (audit.issues) {
      audit.issues.forEach((issue) => {
        // Identify quick wins based on severity and recommendation presence
        if (issue.recommendation && (issue.severity === "high" || issue.severity === "critical")) {
          // Map issue severity to estimated impact points
          const impactMap: Record<string, number> = {
            critical: 15,
            high: 10,
            medium: 5,
            low: 2,
          };

          wins.push({
            title: issue.title,
            description: issue.recommendation,
            estimatedImpact: impactMap[issue.severity] || 5,
            difficulty: issue.severity === "critical" ? "medium" : "easy",
            category: issue.category || "other",
          });
        }
      });
    }

    // Sort by impact and return top 5
    return wins.sort((a, b) => b.estimatedImpact - a.estimatedImpact).slice(0, 5);
  }, [audit.issues]);

  if (quickWins.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-warning" />
        <h2 className="text-lg font-semibold">Quick Wins</h2>
        <span className="text-sm text-muted-foreground">High impact, easy to fix</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {quickWins.map((win, idx) => (
          <div key={idx} className="card-secondary p-4 border-l-2 border-l-warning">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm leading-tight flex-1">{win.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{win.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs font-semibold text-warning flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{win.estimatedImpact} pts
                </span>
                <span className="text-xs px-2 py-1 bg-warning/10 text-warning rounded">
                  {win.difficulty}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
