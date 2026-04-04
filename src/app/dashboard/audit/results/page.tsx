"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Download, Share2, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Import result components
import { AuditResultsHeader } from "@/components/audit/results/AuditResultsHeader";
import { OverallScoreCard } from "@/components/audit/results/OverallScoreCard";
import { IssueSummaryCard } from "@/components/audit/results/IssueSummaryCard";
import { CategoryScoresGrid } from "@/components/audit/results/CategoryScoresGrid";
import { IssuesTimeline } from "@/components/audit/results/IssuesTimeline";
import { RecommendationsList } from "@/components/audit/results/RecommendationsList";
import { QuickWinsSection } from "@/components/audit/results/QuickWinsSection";
import { PerformanceDeepDive } from "@/components/audit/results/PerformanceDeepDive";
import { AIReadinessDeepDive } from "@/components/audit/results/AIReadinessDeepDive";
import { SEOContentAnalysisDeepDive } from "@/components/audit/results/SEOContentAnalysisDeepDive";
import { CompetitorComparisonDeepDive } from "@/components/audit/results/CompetitorComparisonDeepDive";

// Import hook
import { useAudit, useExportAuditReport } from "@/hooks/useAudit";

function AuditResultsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auditId = searchParams.get("id");

  // State for export menu
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const [shareMessage, setShareMessage] = React.useState("");

  // Fetch audit data
  const { data: audit, isLoading, error } = useAudit(auditId || "");
  const { mutate: exportReport, isPending: isExporting } = useExportAuditReport();

  // Handle export
  const handleExport = (format: "pdf" | "json" | "csv") => {
    if (!auditId) return;
    exportReport({ auditId, format });
    setShowExportMenu(false);
  };

  // Handle share
  const handleShare = () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/audit/results?id=${auditId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareMessage("Link copied to clipboard!");
      setTimeout(() => setShareMessage(""), 3000);
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading audit results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !audit) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md">
          <AlertCircle className="h-8 w-8 text-error" />
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Audit not found</h2>
            <p className="text-muted-foreground mb-4">
              {error?.message || "The audit results could not be loaded."}
            </p>
          </div>
          <Link href="/dashboard/audit">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to audits
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/audit">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-foreground">{audit.url}</h1>
              <p className="text-xs text-muted-foreground">
                Scanned on {new Date(audit.startedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {shareMessage && (
              <span className="text-sm text-success mr-2">{shareMessage}</span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 card-secondary border rounded-lg shadow-lg p-2 z-20">
                  <button
                    onClick={() => handleExport("pdf")}
                    className="w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors text-sm"
                  >
                    📄 Export as PDF
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    className="w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors text-sm"
                  >
                    📋 Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport("csv")}
                    className="w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors text-sm"
                  >
                    📊 Export as CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <AuditResultsHeader audit={audit} />

        {/* Overall Score */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <OverallScoreCard audit={audit} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Issue Summary */}
            <IssueSummaryCard audit={audit} />

            {/* Quick Wins */}
            <QuickWinsSection audit={audit} />
          </div>
        </div>

        {/* Category Scores */}
        <CategoryScoresGrid audit={audit} />

        {/* Issues by Severity */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Issues by Severity</h2>
          <IssuesTimeline audit={audit} />
        </div>

        {/* Performance Deep Dive - Phase 4 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Performance Deep Dive</h2>
          <PerformanceDeepDive audit={audit} />
        </div>

        {/* AI Readiness Deep Dive - Phase 5 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">AI Readiness Analysis</h2>
          <AIReadinessDeepDive audit={audit} />
        </div>

        {/* SEO Content Analysis - Phase 6 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">SEO Content Analysis</h2>
          <SEOContentAnalysisDeepDive audit={audit} />
        </div>

        {/* Competitor Comparison - Phase 7 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Competitive Analysis</h2>
          <CompetitorComparisonDeepDive audit={audit} />
        </div>

        {/* Recommendations */}
        <RecommendationsList audit={audit} />
      </div>
    </div>
  );
}

import { Suspense } from "react";
export default function AuditResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <AuditResultsPageInner />
    </Suspense>
  );
}
