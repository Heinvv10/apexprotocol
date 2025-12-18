"use client";

import * as React from "react";
import { ArrowLeft, Search, TrendingUp, BarChart3, AlertCircle, Sparkles, Settings, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { PromptPerformanceTable, SearchPrompt, PlatformId } from "@/components/monitor";
import { Button } from "@/components/ui/button";
import { usePrompts, SearchPromptResponse } from "@/hooks/useMonitor";
import { useSelectedBrand } from "@/stores";

// Loading state component
function PromptsLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading prompt data...</p>
      </div>
    </div>
  );
}

// Transform API response to UI format
function transformPrompt(apiPrompt: SearchPromptResponse): SearchPrompt {
  return {
    id: apiPrompt.id,
    promptText: apiPrompt.promptText,
    platforms: apiPrompt.platforms as PlatformId[],
    frequency: apiPrompt.frequency,
    trend: apiPrompt.trend,
    trendValue: apiPrompt.trendValue,
    sentiment: apiPrompt.sentiment,
    lastSeen: apiPrompt.lastSeen,
  };
}

// Empty state component
function PromptsEmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Search className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">Prompt Tracking</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">No Prompts Tracked Yet</h3>
          <p className="text-muted-foreground text-sm">
            Configure your brand monitoring to start tracking which search prompts trigger your brand mentions.
          </p>
        </div>

        <Link
          href="/dashboard/monitor/settings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
        >
          <Settings className="w-4 h-4" />
          Configure Monitoring
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function PromptsPage() {
  const selectedBrand = useSelectedBrand();

  // Fetch prompts from API
  const { data: promptsData, isLoading } = usePrompts(selectedBrand?.id);

  // Transform API data to UI format
  const prompts: SearchPrompt[] = React.useMemo(() => {
    if (!promptsData?.prompts) return [];
    return promptsData.prompts.map(transformPrompt);
  }, [promptsData]);

  const hasData = prompts.length > 0;

  // Calculate stats from prompts
  const totalPrompts = prompts.length;
  const totalFrequency = prompts.reduce((sum, p) => sum + p.frequency, 0);
  const positivePrompts = prompts.filter((p) => p.sentiment === "positive").length;
  const trendingUpPrompts = prompts.filter((p) => p.trend === "up").length;

  const handleExport = () => {
    // Create CSV content
    const headers = ["Prompt", "Platforms", "Frequency", "Trend", "Sentiment", "Last Seen"];
    const rows = prompts.map((p) => [
      `"${p.promptText}"`,
      p.platforms.join(", "),
      p.frequency,
      `${p.trend} (${p.trendValue}%)`,
      p.sentiment,
      p.lastSeen,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompt-performance.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/monitor">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Search Prompt Performance</h2>
            <p className="text-muted-foreground">
              Track which search queries trigger your brand mentions across AI platforms
            </p>
          </div>
        </div>
        <PromptsLoadingState />
      </div>
    );
  }

  // Show empty state if no data
  if (!hasData) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/monitor">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Search Prompt Performance</h2>
            <p className="text-muted-foreground">
              Track which search queries trigger your brand mentions across AI platforms
            </p>
          </div>
        </div>
        <PromptsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/monitor">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Search Prompt Performance</h2>
          <p className="text-muted-foreground">
            Track which search queries trigger your brand mentions across AI platforms
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card-tertiary">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPrompts}</p>
              <p className="text-xs text-muted-foreground">Tracked Prompts</p>
            </div>
          </div>
        </div>

        <div className="card-tertiary">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-blue/10">
              <BarChart3 className="h-5 w-5 text-accent-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalFrequency.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Mentions</p>
            </div>
          </div>
        </div>

        <div className="card-tertiary">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{trendingUpPrompts}</p>
              <p className="text-xs text-muted-foreground">Trending Up</p>
            </div>
          </div>
        </div>

        <div className="card-tertiary">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
              <AlertCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{positivePrompts}</p>
              <p className="text-xs text-muted-foreground">Positive Sentiment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="card-secondary bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0 mt-0.5">
            <Search className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Understanding Search Prompt Performance</h4>
            <p className="text-sm text-muted-foreground mt-1">
              This view shows which user search queries are triggering mentions of your brand across
              AI platforms. Use this data to understand what types of questions drive AI visibility
              and optimize your content strategy accordingly.
            </p>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="card-secondary">
        <h3 className="text-lg font-semibold mb-6">Prompt Performance Data</h3>
        <PromptPerformanceTable prompts={prompts} onExport={handleExport} />
      </div>

      {/* Tips Section */}
      <div className="card-secondary">
        <h3 className="text-lg font-semibold mb-3">Optimization Tips</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Focus on high-frequency prompts with positive sentiment to maintain visibility
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Address prompts with negative sentiment by improving related content
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Monitor trending prompts to identify emerging opportunities
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Use the export feature to track performance over time
          </li>
        </ul>
      </div>
    </div>
  );
}
