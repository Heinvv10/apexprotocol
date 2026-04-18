"use client";

import * as React from "react";
import { Audit } from "@/hooks/useAudit";

interface CategoryScoresGridProps {
  audit: Audit;
}

interface CategoryScore {
  name: string;
  score: number;
  icon: string;
  description: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
}

// The audit engine scores these 5 categories; the UI previously read
// phantom `audit.technicalScore / contentScore / aiReadinessScore`
// fields that aren't populated, producing three 0s and an unrelated
// "Performance" value that was actually the overall score.
const CATEGORY_META: Record<
  string,
  { displayName: string; icon: string; description: string }
> = {
  structure: {
    displayName: "Content Structure",
    icon: "🧱",
    description: "H1-H6 hierarchy and scannable sections",
  },
  schema: {
    displayName: "Schema Markup",
    icon: "⚙️",
    description: "FAQPage / Article / Product JSON-LD",
  },
  clarity: {
    displayName: "Content Clarity",
    icon: "📝",
    description: "Readability and paragraph length",
  },
  metadata: {
    displayName: "Metadata",
    icon: "🏷️",
    description: "Titles, descriptions, canonical tags",
  },
  accessibility: {
    displayName: "Accessibility",
    icon: "♿",
    description: "Alt text, semantic HTML, ARIA",
  },
};

export function CategoryScoresGrid({ audit }: CategoryScoresGridProps) {
  const engineScores = audit.categoryScores ?? [];
  const categories: CategoryScore[] =
    engineScores.length > 0
      ? engineScores.map((c) => {
          const meta =
            CATEGORY_META[c.category] ?? {
              displayName: c.category,
              icon: "📊",
              description: "",
            };
          return {
            name: meta.displayName,
            score: c.score,
            icon: meta.icon,
            description: meta.description,
          };
        })
      : [];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Category Breakdown</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <div key={category.name} className="card-secondary p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-2xl mb-1">{category.icon}</div>
                <div className="font-medium text-sm">{category.name}</div>
                <div className="text-xs text-muted-foreground">{category.description}</div>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                {category.score}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  category.score >= 80 ? "bg-success" :
                  category.score >= 60 ? "bg-warning" :
                  "bg-error"
                }`}
                style={{ width: `${category.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
