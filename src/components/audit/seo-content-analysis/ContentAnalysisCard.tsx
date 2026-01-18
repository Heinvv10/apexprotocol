"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ContentPage {
  url: string;
  wordCount: number;
  readabilityScore: number;
  readabilityGrade: string;
  htagHierarchy: "valid" | "partial" | "invalid";
  keywordDensity: number;
}

interface ContentAnalysisCardProps {
  pages: ContentPage[];
  averageWordCount: number;
  averageReadability: number;
  shortPages: number;
  poorReadability: number;
}

export function ContentAnalysisCard({
  pages,
  averageWordCount,
  averageReadability,
  shortPages,
  poorReadability,
}: ContentAnalysisCardProps) {
  const getReadabilityStatus = (score: number) => {
    if (score >= 80) return { icon: "✅", color: "text-success", label: "Excellent" };
    if (score >= 70) return { icon: "🟡", color: "text-warning", label: "Good" };
    if (score >= 60) return { icon: "⚠️", color: "text-error", label: "Fair" };
    return { icon: "❌", color: "text-error", label: "Poor" };
  };

  const getHierarchyStatus = (hierarchy: string) => {
    switch (hierarchy) {
      case "valid":
        return { icon: "✅", color: "text-success" };
      case "partial":
        return { icon: "🟡", color: "text-warning" };
      default:
        return { icon: "❌", color: "text-error" };
    }
  };

  return (
    <div className="card-secondary p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Content Quality Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Word count, readability, and structural analysis across discovered pages
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-tertiary p-3 text-center">
          <div className="text-2xl font-bold text-primary">{averageWordCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Avg Words</div>
        </div>
        <div className="card-tertiary p-3 text-center">
          <div className="text-2xl font-bold text-success">{averageReadability}</div>
          <div className="text-xs text-muted-foreground mt-1">Readability</div>
        </div>
        <div className="card-tertiary p-3 text-center">
          <div className={`text-2xl font-bold ${shortPages > 0 ? "text-warning" : "text-success"}`}>
            {pages.length - shortPages}/{pages.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Quality Pages</div>
        </div>
        <div className="card-tertiary p-3 text-center">
          <div className={`text-2xl font-bold ${poorReadability > 0 ? "text-error" : "text-success"}`}>
            {poorReadability}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Poor Read.</div>
        </div>
      </div>

      {/* Pages breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Pages Analyzed</h4>
        {pages.map((page, idx) => {
          const readStatus = getReadabilityStatus(page.readabilityScore);
          const hierarchyStatus = getHierarchyStatus(page.htagHierarchy);
          return (
            <div key={idx} className="card-tertiary p-3 border rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{page.url}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{page.wordCount} words</span>
                    <span>•</span>
                    <span className={`${readStatus.color} font-medium`}>
                      {page.readabilityGrade}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg ${readStatus.color}`}>{readStatus.icon}</div>
                  <div className="text-xs text-muted-foreground mt-1">{readStatus.label}</div>
                </div>
              </div>

              {/* Readability bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Readability</span>
                  <span className="font-semibold">{page.readabilityScore}</span>
                </div>
                <Progress value={page.readabilityScore} className="h-2" />
              </div>

              {/* Details row */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <span className={hierarchyStatus.color}>{hierarchyStatus.icon}</span>
                  <span>H-tags: {page.htagHierarchy}</span>
                </div>
                <span>Keyword density: {page.keywordDensity.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      {(shortPages > 0 || poorReadability > 0) && (
        <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-foreground">Content Improvement Opportunities:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {shortPages > 0 && (
              <li className="flex gap-2">
                <span className="text-warning flex-shrink-0">•</span>
                <span>
                  {shortPages} page{shortPages > 1 ? "s" : ""} below 300 words - expand for better
                  SEO
                </span>
              </li>
            )}
            {poorReadability > 0 && (
              <li className="flex gap-2">
                <span className="text-warning flex-shrink-0">•</span>
                <span>
                  {poorReadability} page{poorReadability > 1 ? "s" : ""} with poor readability -
                  simplify language
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Best practices tip */}
      <div className="bg-success/5 border border-success/20 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> Target 1,000-2,500 words per page and aim for 60+ readability
          score for optimal SEO and AI citation potential.
        </p>
      </div>
    </div>
  );
}
