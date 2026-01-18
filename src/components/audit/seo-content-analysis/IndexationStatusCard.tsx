"use client";

import * as React from "react";
import { Search, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface IndexationReason {
  reason: string;
  pageCount: number;
}

interface IndexationStatusCardProps {
  totalDiscovered: number;
  indexed: number;
  notIndexed: number;
  indexationRate: number;
  reasonsForNonIndexation: IndexationReason[];
}

export function IndexationStatusCard({
  totalDiscovered,
  indexed,
  notIndexed,
  indexationRate,
  reasonsForNonIndexation,
}: IndexationStatusCardProps) {
  const getIndexationStatus = (rate: number) => {
    if (rate >= 90) return { icon: "✅", color: "text-success", label: "Excellent" };
    if (rate >= 75) return { icon: "🟡", color: "text-warning", label: "Good" };
    if (rate >= 50) return { icon: "⚠️", color: "text-error", label: "Poor" };
    return { icon: "❌", color: "text-error", label: "Critical" };
  };

  const status = getIndexationStatus(indexationRate);

  return (
    <div className="card-secondary p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Indexation Status</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Pages discovered vs. indexed by Google, with reasons for non-indexation
        </p>
      </div>

      {/* Overall indexation card */}
      <div className="card-tertiary p-6 border bg-gradient-to-br from-primary/5 to-muted/5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-4xl font-bold text-primary">{indexationRate}%</div>
            <div className="text-sm text-muted-foreground mt-1">Indexation Rate</div>
          </div>
          <div className="flex items-center justify-end">
            <div className="text-center">
              <div className={`text-3xl ${status.color}`}>{status.icon}</div>
              <div className={`text-sm font-semibold ${status.color} mt-1`}>{status.label}</div>
            </div>
          </div>
        </div>

        <Progress value={indexationRate} className="h-3" />

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalDiscovered}</div>
            <div className="text-xs text-muted-foreground mt-1">Discovered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{indexed}</div>
            <div className="text-xs text-muted-foreground mt-1">Indexed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-error">{notIndexed}</div>
            <div className="text-xs text-muted-foreground mt-1">Not Indexed</div>
          </div>
        </div>
      </div>

      {/* Reasons for non-indexation */}
      {reasonsForNonIndexation.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Why Pages Aren't Indexed</h4>
          {reasonsForNonIndexation.map((reason, idx) => (
            <div key={idx} className="card-tertiary p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{reason.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Affects <strong>{reason.pageCount}</strong> page
                    {reason.pageCount > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Fix recommendations */}
              <div className="mt-3 pl-7 text-xs text-muted-foreground space-y-1">
                {reason.reason.includes("Noindex") && (
                  <>
                    <p>✓ Remove noindex meta tag from important pages</p>
                    <p>✓ Verify via Search Console to ensure re-indexing</p>
                  </>
                )}
                {reason.reason.includes("Redirect") && (
                  <>
                    <p>✓ Fix redirect chains (A → B → C should be A → C)</p>
                    <p>✓ Use 301 redirects instead of meta refresh</p>
                  </>
                )}
                {reason.reason.includes("Robots") && (
                  <>
                    <p>✓ Review robots.txt rules</p>
                    <p>✓ Consider moving important content outside blocked paths</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Healthy indexation message */}
      {indexationRate >= 90 && (
        <div className="bg-success/5 border border-success/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            ✅ <strong>Good news!</strong> Your indexation rate is excellent. Google is effectively
            crawling and indexing your content.
          </p>
        </div>
      )}

      {/* Action items */}
      {indexationRate < 90 && (
        <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-foreground">Recommended Actions:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Submit sitemap to Google Search Console</li>
            <li>• Request indexing for critical pages</li>
            <li>• Fix crawl errors reported in Search Console</li>
            <li>• Improve internal linking structure</li>
            <li>• Ensure pages have unique, valuable content</li>
          </ul>
        </div>
      )}
    </div>
  );
}
