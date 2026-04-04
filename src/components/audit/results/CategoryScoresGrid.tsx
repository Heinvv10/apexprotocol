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

export function CategoryScoresGrid({ audit }: CategoryScoresGridProps) {
  const categories: CategoryScore[] = [
    {
      name: "Technical SEO",
      score: audit.technicalScore || 0,
      icon: "⚙️",
      description: "Schema, meta tags, crawlability"
    },
    {
      name: "Performance",
      score: (((audit as unknown as Record<string, unknown>).performanceScore ?? audit.overallScore) || 0) as number,
      icon: "⚡",
      description: "Web Vitals and load times"
    },
    {
      name: "Content Quality",
      score: audit.contentScore || 0,
      icon: "📝",
      description: "Readability and structure"
    },
    {
      name: "AI Readiness",
      score: audit.aiReadinessScore || 0,
      icon: "🤖",
      description: "Citation potential and relevance"
    }
  ];

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
