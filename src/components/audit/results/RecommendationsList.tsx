"use client";

import * as React from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Audit } from "@/hooks/useAudit";

interface RecommendationsListProps {
  audit: Audit;
}

export function RecommendationsList({ audit }: RecommendationsListProps) {
  // Get recommendations with associated issues
  interface RecommendationWithIssue {
    recommendation: string;
    category: string;
    issues: Audit["issues"];
  }

  const categoryRecommendations: Record<string, RecommendationWithIssue[]> = {};

  if (audit.issues) {
    audit.issues.forEach((issue) => {
      if (issue.recommendation) {
        const category = issue.category || "other";
        if (!categoryRecommendations[category]) {
          categoryRecommendations[category] = [];
        }

        // Check if this recommendation already exists
        const existing = categoryRecommendations[category].find(r => r.recommendation === issue.recommendation);
        if (existing) {
          existing.issues?.push(issue);
        } else {
          categoryRecommendations[category].push({
            recommendation: issue.recommendation,
            category,
            issues: [issue],
          });
        }
      }
    });
  }

  const categoryLabels: Record<string, string> = {
    technical: "Technical SEO",
    content: "Content Quality",
    structure: "Page Structure",
    schema: "Schema Markup",
    meta: "Meta Tags",
    links: "Links",
    images: "Images",
    performance: "Performance",
    accessibility: "Accessibility",
    security: "Security",
    other: "Other",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recommendations</h2>
        <span className="text-sm text-muted-foreground">
          {Object.values(categoryRecommendations).flat().length} actionable items
        </span>
      </div>

      {Object.entries(categoryRecommendations).length === 0 ? (
        <div className="card-primary p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="text-muted-foreground">No recommendations at this time. Great job!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(categoryRecommendations).map(([category, recs]) => (
            <div key={category} className="card-secondary p-4">
              <h3 className="font-semibold text-sm mb-3">
                {categoryLabels[category] || category}
              </h3>
              <div className="space-y-3">
                {recs.map((rec, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 pb-3 border-b border-border/50 last:pb-0 last:border-b-0">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">{rec.recommendation}</p>
                        {rec.issues?.length > 1 && (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            Affects {rec.issues?.length} issue{rec.issues?.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link href={`/dashboard/create?context=${encodeURIComponent(JSON.stringify({ recommendation: rec.recommendation, issues: rec.issues, auditUrl: audit.url }))}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs flex-shrink-0 whitespace-nowrap"
                      >
                        Fix Now
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link href="/dashboard/create">
        <Button className="w-full gap-2">
          <span>Generate Content to Fix Issues</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
