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
  // Get unique categories from issues
  const categoryRecommendations: Record<string, string[]> = {};

  if (audit.issues) {
    audit.issues.forEach((issue) => {
      if (issue.recommendation) {
        const category = issue.category || "other";
        if (!categoryRecommendations[category]) {
          categoryRecommendations[category] = [];
        }
        if (!categoryRecommendations[category].includes(issue.recommendation)) {
          categoryRecommendations[category].push(issue.recommendation);
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
              <ul className="space-y-2">
                {recs.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
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
