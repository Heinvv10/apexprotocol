"use client";

import * as React from "react";
import Link from "next/link";
import { BrandHeader } from "@/components/layout/brand-header";
import {
  Brain,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  Bot,
  TrendingUp,
  MessageSquare,
  FileText,
  Lightbulb,
  RefreshCw,
  Clock,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/formatters";
import { useSelectedBrand } from "@/stores";
import {
  useInsightsStore,
  useCurrentAnalysis,
  useIsAnalyzing,
  useAnalysisError,
  useHistory,
  useIsLoadingHistory,
  useHistoryError,
  usePlatformLoading,
} from "@/stores/insights-store";
import { QueryInput } from "@/components/insights/query-input";
import { PlatformGrid } from "@/components/insights/platform-grid";

// ============================================================================
// Decorative Components
// ============================================================================

function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientInsights)"
        />
        <defs>
          <linearGradient
            id="starGradientInsights"
            x1="0"
            y1="0"
            x2="48"
            y2="48"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="hsl(var(--color-primary))" stopOpacity="0.6" />
            <stop offset="1" stopColor="hsl(var(--color-accent-purple))" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
          filter: "blur(80px)",
          animation: "pulse-glow 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-48 -left-32 w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)",
          filter: "blur(100px)",
          animation: "pulse-glow 10s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute top-1/3 left-1/2 w-64 h-64 rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "pulse-glow 6s ease-in-out infinite 2s",
        }}
      />
    </div>
  );
}

// ============================================================================
// Page Header
// ============================================================================

// ============================================================================
// Select Brand Prompt
// ============================================================================

function SelectBrandPrompt() {
  return (
    <div className="relative min-h-[400px]">
      <BackgroundOrbs />
      <div className="relative z-10 flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-lg space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div
              className="absolute inset-0 rounded-full opacity-20"
              style={{
                background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Brain className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Select a Brand to View AI Insights
            </h2>
            <p className="text-muted-foreground">
              Choose a brand from the dropdown in the header to analyze how different AI platforms
              (ChatGPT, Claude, Gemini, Perplexity) surface your content.
            </p>
          </div>
          <Link
            href="/dashboard/brands"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/30 font-medium hover:bg-primary/20 transition-all"
          >
            Manage Brands
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Query Input Section is now a separate component (QueryInput)
// imported from @/components/insights/query-input

// Platform Cards Grid is now a separate component (PlatformGrid)
// imported from @/components/insights/platform-grid

// ============================================================================
// Summary Stats
// ============================================================================

function SummaryStats() {
  const currentAnalysis = useCurrentAnalysis();

  if (!currentAnalysis?.summary) return null;

  const { summary } = currentAnalysis;

  return (
    <div className="card-secondary p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Analysis Summary</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{summary.averageScore}</div>
            <div className="text-xs text-muted-foreground">Avg. Score</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent-purple" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{summary.totalCitations}</div>
            <div className="text-xs text-muted-foreground">Total Citations</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{summary.totalMentions}</div>
            <div className="text-xs text-muted-foreground">Total Mentions</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-success" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {summary.platformsAnalyzed}
              {typeof summary.platformsRequested === "number" && (
                <span className="text-base font-normal text-muted-foreground ml-1">
                  / {summary.platformsRequested}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Platforms with data
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// What We Analyze Section
// ============================================================================

function WhatWeAnalyzeSection() {
  return (
    <div className="card-secondary p-6">
      <h3 className="font-semibold mb-4">What We Analyze</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-tertiary p-4">
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-medium">Visibility Score</div>
          <div className="text-sm text-muted-foreground">
            How prominently your brand appears in AI responses (0-100)
          </div>
        </div>
        <div className="card-tertiary p-4">
          <div className="text-2xl mb-2">📊</div>
          <div className="font-medium">Content Performance</div>
          <div className="text-sm text-muted-foreground">
            Which content types work best per platform
          </div>
        </div>
        <div className="card-tertiary p-4">
          <div className="text-2xl mb-2">📝</div>
          <div className="font-medium">Citation Patterns</div>
          <div className="text-sm text-muted-foreground">
            How each platform references your content
          </div>
        </div>
        <div className="card-tertiary p-4">
          <div className="text-2xl mb-2">💡</div>
          <div className="font-medium">Recommendations</div>
          <div className="text-sm text-muted-foreground">
            Platform-specific optimization suggestions
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Recent Analyses History
// ============================================================================

function RecentAnalysesSection() {
  const history = useHistory();
  const isLoadingHistory = useIsLoadingHistory();
  const historyError = useHistoryError();
  const fetchHistory = useInsightsStore((state) => state.fetchHistory);
  const loadHistoryEntry = useInsightsStore((state) => state.loadHistoryEntry);
  const selectedBrand = useSelectedBrand();

  React.useEffect(() => {
    if (selectedBrand?.id) {
      fetchHistory(selectedBrand.id);
    }
  }, [selectedBrand?.id, fetchHistory]);

  const handleRerun = (entry: typeof history[0]) => {
    loadHistoryEntry(entry);
    // Scroll to top to show the query input
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoadingHistory) {
    return (
      <div className="card-secondary p-6">
        <h3 className="font-semibold mb-4">Recent Analyses</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-tertiary p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (historyError) {
    return (
      <div className="card-secondary p-6">
        <h3 className="font-semibold mb-4">Recent Analyses</h3>
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-error" />
          <p className="text-sm text-error mb-4">{historyError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedBrand && fetchHistory(selectedBrand.id)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="card-secondary p-6">
        <h3 className="font-semibold mb-4">Recent Analyses</h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
            <Brain className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            No completed analyses yet. Run a query above to analyze your
            brand&apos;s visibility across AI platforms — results appear here
            once each platform responds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-secondary p-6">
      <h3 className="font-semibold mb-4">Recent Analyses</h3>
      <div className="space-y-2">
        {history.slice(0, 5).map((entry) => (
          <div
            key={entry.id}
            className="card-tertiary p-4 hover:bg-accent/50 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground mb-1 truncate">{entry.queryText}</div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(entry.createdAt, "short")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    {entry.summary.platformsAnalyzed} platforms
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                {entry.status === "completed" ? (
                  <>
                    <div className="text-lg font-bold text-foreground">
                      {entry.summary.averageScore}
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </>
                ) : entry.status === "pending" ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-error" />
                )}
                {/* Rerun Button */}
                <button
                  onClick={() => handleRerun(entry)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium flex items-center gap-1"
                  title="Rerun this analysis"
                >
                  <RotateCcw className="w-3 h-3" />
                  Rerun
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function InsightsPage() {
  const selectedBrand = useSelectedBrand();
  const currentAnalysis = useCurrentAnalysis();
  const analysisError = useAnalysisError();

  if (!selectedBrand) {
    return (
      <div className="space-y-6 relative">
        <BrandHeader pageName="AI Insights" />
        <SelectBrandPrompt />
        <DecorativeStar />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <BrandHeader pageName="AI Insights" />

      <div className="relative min-h-full pb-8">
        <BackgroundOrbs />

        <div className="relative z-10 space-y-6">
          {/* Query Input Section */}
          <QueryInput />

          {/* Error State */}
          {analysisError && (
            <div className="card-secondary p-6 border-error/30">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                <div>
                  <div className="font-medium text-error mb-1">Analysis Failed</div>
                  <div className="text-sm text-muted-foreground">{analysisError}</div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {currentAnalysis && <SummaryStats />}

          {/* Platform Cards Grid */}
          {currentAnalysis && <PlatformGrid />}

          {/* What We Analyze (shown when no analysis) */}
          {!currentAnalysis && <WhatWeAnalyzeSection />}

          {/* Recent Analyses */}
          <RecentAnalysesSection />
        </div>
      </div>

      <DecorativeStar />
    </div>
  );
}
