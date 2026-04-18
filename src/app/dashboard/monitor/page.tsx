"use client";

import * as React from "react";
import Link from "next/link";
import { Radar, ArrowRight, Bot, Sparkles, AlertCircle, Loader2, RefreshCw, Settings } from "lucide-react";
import { BrandHeader } from "@/components/layout/brand-header";
import { Button } from "@/components/ui/button";
import { FilterSidebar, SmartTable, QueryRow, LiveIndicator, CitationVelocityCard } from "@/components/monitor";
import { useSelectedBrand } from "@/stores";
import { useMentionsByBrand, Mention } from "@/hooks/useMonitor";
import { useRealtimeMonitor, StreamMention } from "@/hooks/useRealtimeMonitor";
import type { PlatformVisibilityScore } from "@/lib/db/schema/audits";

// Transform stream mention to SmartTable QueryRow format
function streamMentionToQueryRow(mention: StreamMention): QueryRow {
  const platformMap: Record<string, QueryRow["platform"]> = {
    chatgpt: "chatgpt",
    claude: "claude",
    gemini: "gemini",
    perplexity: "perplexity",
    grok: "grok",
    deepseek: "grok",
    copilot: "chatgpt",
  };

  return {
    id: mention.id,
    query: mention.query,
    platform: platformMap[mention.platform] || "chatgpt",
    sentiment: mention.sentiment,
    citationStatus: mention.citationUrl ? "cited" : "mentioned",
    timestamp: mention.createdAt,
    response: mention.response,
    url: mention.citationUrl ?? undefined,
    confidence: undefined,
    competitors: [],
  };
}

// Transform API mention to SmartTable QueryRow format
function mentionToQueryRow(mention: Mention): QueryRow {
  // Map platform names to QueryRow platform type
  const platformMap: Record<string, QueryRow["platform"]> = {
    chatgpt: "chatgpt",
    claude: "claude",
    gemini: "gemini",
    perplexity: "perplexity",
    grok: "grok",
    deepseek: "grok", // Map DeepSeek to grok for now (similar styling)
    copilot: "chatgpt", // Map Copilot to chatgpt styling
  };

  return {
    id: mention.id,
    query: mention.query,
    platform: platformMap[mention.platform] || "chatgpt",
    sentiment: mention.sentiment,
    citationStatus: mention.citationUrl ? "cited" : (mention.position != null ? "mentioned" : "not_cited"),
    timestamp: mention.createdAt,
    response: mention.response,
    url: mention.citationUrl ?? undefined,
    confidence: mention.sentimentScore ? Math.round(mention.sentimentScore * 100) : undefined,
    competitors: mention.tags,
  };
}

// Empty filter configuration - will be populated from API/database
const emptyFilterGroups = [
  {
    id: "topics",
    label: "Tracked Topics",
    count: 0,
    options: [],
  },
  {
    id: "entity",
    label: "Entity Types",
    count: 0,
    options: [],
  },
  {
    id: "engines",
    label: "AI Engines",
    count: 0,
    options: [],
  },
];

// Decorative star component
function DecorativeStar() {
  return (
    <div className="decorative-star absolute bottom-8 right-8 w-12 h-12 opacity-60">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradient)"
        />
        <defs>
          <linearGradient id="starGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop style={{ stopColor: "hsl(var(--color-primary))", stopOpacity: 0.6 }} />
            <stop offset="1" style={{ stopColor: "hsl(var(--color-accent-purple))", stopOpacity: 0.3 }} />

          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Prompt to select a brand
function SelectBrandPrompt() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
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
            <Bot className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Select a Brand to View Monitoring</h2>
          <p className="text-muted-foreground">
            Choose a brand from the dropdown in the header to see AI platform mentions and analysis.
          </p>
        </div>
        <Link href="/dashboard/brands">
          <Button size="lg" className="gap-2">
            Manage Brands
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Loading state component
function MonitorLoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]" data-testid="monitor-loading">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading mentions...</p>
      </div>
    </div>
  );
}

// Error state component
function MonitorErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 border border-error/30 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Failed to Load Mentions</h3>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}

// Empty state component for when no monitoring is configured
function MonitorEmptyState() {
  const aiPlatforms = [
    { name: "ChatGPT", color: "#10A37F" },
    { name: "Claude", color: "#D97757" },
    { name: "Gemini", color: "#4285F4" },
    { name: "Perplexity", color: "#20B8CD" },
    { name: "Grok", color: "#FFFFFF" },
    { name: "DeepSeek", color: "#6366F1" },
  ];

  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-lg space-y-8">
        {/* Animated icon */}
        <div className="relative mx-auto w-24 h-24">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          />
          <div className="relative w-24 h-24 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Radar className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">AI Monitoring</span>
        </div>

        {/* Title and description */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            No Monitoring Configured Yet
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Set up your brand profile and monitoring keywords to start tracking how AI platforms mention your brand in real-time.
          </p>
        </div>

        {/* AI Platforms preview */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">
            Platforms you can monitor
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {aiPlatforms.map((platform) => (
              <div
                key={platform.name}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2"
              >
                <Bot className="w-3.5 h-3.5" style={{ color: platform.color }} />
                <span className="text-xs text-muted-foreground">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(0,229,204,0.3)] hover:shadow-[0_0_35px_rgba(0,229,204,0.4)]"
        >
          <Settings className="w-5 h-5" />
          Configure Monitoring
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Platform score card configuration
const platformConfig = [
  { key: "chatgpt" as const, emoji: "🤖", name: "ChatGPT", color: "#10A37F" },
  { key: "claude" as const, emoji: "🧠", name: "Claude", color: "#D97757" },
  { key: "gemini" as const, emoji: "💎", name: "Gemini", color: "#4285F4" },
  { key: "perplexity" as const, emoji: "🔍", name: "Perplexity", color: "#20B8CD" },
  { key: "grok" as const, emoji: "⚡", name: "Grok", color: "#FFFFFF" },
  { key: "deepseek" as const, emoji: "🌊", name: "DeepSeek", color: "#6366F1" },
  { key: "copilot" as const, emoji: "✈️", name: "Copilot", color: "#0078D4" },
];

function PlatformScoreCards({ platformScores }: { platformScores: PlatformVisibilityScore[] }) {
  // Create a map for quick lookup
  const scoresMap = React.useMemo(() => {
    const map = new Map<string, PlatformVisibilityScore>();
    platformScores.forEach((score) => map.set(score.platform, score));
    return map;
  }, [platformScores]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {platformConfig.map((platform) => {
        const score = scoresMap.get(platform.key);
        const hasData = score !== undefined;

        // Generate mock recent scores for sparkline (latest 3 data points)
        // In production, this would come from historical data
        const recentScores = hasData
          ? [
              Math.max(0, score.score - 5),
              Math.max(0, score.score - 2),
              score.score,
            ]
          : [];

        return (
          <CitationVelocityCard
            key={platform.key}
            platform={platform.name}
            emoji={platform.emoji}
            scores={recentScores}
            // "stable" implies a measurement happened. When hasData is
            // false the card is in its pre-monitoring state — pass
            // "empty" so the child shows a neutral "—" instead of
            // fabricating a trend direction.
            trend={hasData ? score.trend : "empty"}
          />
        );
      })}
    </div>
  );
}

export default function MonitorPage() {
  // Get selected brand from global state
  const selectedBrand = useSelectedBrand();

  // Real-time monitoring connection
  const {
    mentions: realtimeMentions,
    isConnected,
    error: realtimeError,
  } = useRealtimeMonitor({
    enabled: !!selectedBrand,
    maxMentions: 50,
  });

  // Fetch mentions for selected brand
  const {
    data: mentionsResponse,
    isLoading,
    error,
    refetch,
  } = useMentionsByBrand(selectedBrand?.id || "", {
    limit: 50,
    sort: "createdAt",
    order: "desc",
  });

  // Transform mentions to QueryRow format for SmartTable
  // Merge realtime mentions with API data, prioritizing realtime
  const queries: QueryRow[] = React.useMemo(() => {
    const apiQueries = mentionsResponse?.mentions?.map(mentionToQueryRow) || [];
    const realtimeQueries = realtimeMentions
      .filter((rm) => !selectedBrand || rm.brandId === selectedBrand.id)
      .map(streamMentionToQueryRow);

    // Merge: realtime first, then API (excluding duplicates)
    const realtimeIds = new Set(realtimeQueries.map((q) => q.id));
    const uniqueApiQueries = apiQueries.filter((q) => !realtimeIds.has(q.id));

    return [...realtimeQueries, ...uniqueApiQueries];
  }, [mentionsResponse, realtimeMentions, selectedBrand]);

  // Build dynamic filter groups from mention data
  const filterGroups = React.useMemo(() => {
    if (!mentionsResponse?.mentions?.length) return emptyFilterGroups;

    // Extract unique platforms
    const platforms = [...new Set(mentionsResponse.mentions.map((m) => m.platform))];
    // Extract unique sentiments
    const sentiments = [...new Set(mentionsResponse.mentions.map((m) => m.sentiment))];

    return [
      {
        id: "topics",
        label: "Tracked Topics",
        count: 0,
        options: [],
      },
      {
        id: "entity",
        label: "Sentiment",
        count: sentiments.length,
        options: sentiments.map((s) => ({
          id: s,
          label: s.charAt(0).toUpperCase() + s.slice(1),
          count: mentionsResponse.mentions.filter((m) => m.sentiment === s).length,
        })),
      },
      {
        id: "engines",
        label: "AI Engines",
        count: platforms.length,
        options: platforms.map((p) => ({
          id: p,
          label: p.charAt(0).toUpperCase() + p.slice(1),
          count: mentionsResponse.mentions.filter((m) => m.platform === p).length,
        })),
      },
    ];
  }, [mentionsResponse]);

  const [selectedFilters, setSelectedFilters] = React.useState<Record<string, string[]>>({
    topics: [],
    entity: [],
    engines: [],
  });

  const handleFilterChange = (groupId: string, optionId: string, checked: boolean) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [groupId]: checked
        ? [...(prev[groupId] || []), optionId]
        : (prev[groupId] || []).filter((id) => id !== optionId),
    }));
  };

  const handleClearAll = () => {
    setSelectedFilters({
      topics: [],
      entity: [],
      engines: [],
    });
  };

  // Filter queries based on selected filters
  const filteredQueries = React.useMemo(() => {
    if (!selectedFilters.engines.length && !selectedFilters.entity.length) {
      return queries;
    }

    return queries.filter((q) => {
      const matchesEngine = !selectedFilters.engines.length || selectedFilters.engines.includes(q.platform);
      const matchesSentiment = !selectedFilters.entity.length || selectedFilters.entity.includes(q.sentiment);
      return matchesEngine && matchesSentiment;
    });
  }, [queries, selectedFilters]);

  // Determine current state
  const noBrandSelected = !selectedBrand;
  const hasData = filteredQueries.length > 0;

  return (
    <div className="space-y-6 relative">
      {/* Header Row: APEX branding + Live Status */}
      <BrandHeader
        pageName="Monitor"
        aiStatus={false}
        rightSlot={
          <div className="flex items-center gap-4">
            <LiveIndicator isConnected={isConnected} size="md" />
            {realtimeError && (
              <span className="text-xs text-error">
                {realtimeError.message}
              </span>
            )}
          </div>
        }
      />

      {/* Platform Score Cards */}
      {selectedBrand && !isLoading && (
        <PlatformScoreCards platformScores={[]} />
      )}

      {/* Main Content */}
      {noBrandSelected ? (
        <SelectBrandPrompt />
      ) : isLoading ? (
        <MonitorLoadingState />
      ) : error ? (
        <MonitorErrorState error={error as Error} onRetry={() => refetch()} />
      ) : hasData ? (
        <div className="flex gap-6">
          {/* Filter Sidebar - only show when there's data */}
          <FilterSidebar
            filters={filterGroups}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
          />

          {/* Live Query Analysis Section */}
          <div className="flex-1 min-w-0">
            <div className="card-secondary p-6">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Live Query Analysis</h3>
                <span className="text-sm text-muted-foreground">
                  {filteredQueries.length} mention{filteredQueries.length !== 1 ? "s" : ""}
                  {selectedBrand && ` for ${selectedBrand.name}`}
                </span>
              </div>

              {/* Smart Table Badge */}
              <div className="mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  Smart Table
                </span>
              </div>

              {/* Table */}
              <SmartTable data={filteredQueries} />
            </div>
          </div>
        </div>
      ) : (
        <MonitorEmptyState />
      )}

      {/* Decorative Star */}
      <DecorativeStar />
    </div>
  );
}
