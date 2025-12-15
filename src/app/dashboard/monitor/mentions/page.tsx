"use client";

import * as React from "react";
import { ArrowLeft, TrendingUp, TrendingDown, MessageSquare, Sparkles, Settings, ArrowRight } from "lucide-react";
import Link from "next/link";
import { MentionCard, MentionFilters, PlatformId, SentimentType } from "@/components/monitor";
import { Button } from "@/components/ui/button";

// Mention interface
export interface Mention {
  id: string;
  platformId: PlatformId;
  text: string;
  sentiment: SentimentType;
  timestamp: string;
  hoursAgo: number;
  source?: string;
  sourceUrl?: string;
}

// Empty state component
function MentionsEmptyState() {
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
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">Brand Mentions</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">No Mentions Yet</h3>
          <p className="text-muted-foreground text-sm">
            Configure your brand monitoring to start tracking how AI platforms mention your brand.
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

export default function MentionsPage() {
  // TODO: Fetch mentions from API endpoint
  // const { data: mentionsData } = useQuery(['mentions'], fetchMentions);
  const [mentions] = React.useState<Mention[]>([]); // Empty array - no mock data
  // Filter state
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<PlatformId[]>([]);
  const [selectedSentiments, setSelectedSentiments] = React.useState<SentimentType[]>([]);
  const [dateRange, setDateRange] = React.useState<"24h" | "7d" | "30d" | "all">("all");

  const hasData = mentions.length > 0;

  // Filter logic
  const filteredMentions = React.useMemo(() => {
    return mentions.filter((mention) => {
      // Platform filter
      if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(mention.platformId)) {
        return false;
      }

      // Sentiment filter
      if (selectedSentiments.length > 0 && !selectedSentiments.includes(mention.sentiment)) {
        return false;
      }

      // Date range filter
      const maxHours = {
        "24h": 24,
        "7d": 168,
        "30d": 720,
        all: Infinity,
      }[dateRange];

      if (mention.hoursAgo > maxHours) {
        return false;
      }

      return true;
    });
  }, [selectedPlatforms, selectedSentiments, dateRange]);

  // Calculate stats from filtered mentions
  const sentimentCounts = filteredMentions.reduce(
    (acc, mention) => {
      acc[mention.sentiment]++;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  const platformCounts = filteredMentions.reduce(
    (acc, mention) => {
      acc[mention.platformId] = (acc[mention.platformId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleClearFilters = () => {
    setSelectedPlatforms([]);
    setSelectedSentiments([]);
    setDateRange("all");
  };

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
          <h2 className="text-2xl font-bold tracking-tight">Brand Mentions</h2>
          <p className="text-muted-foreground">
            Track how your brand is mentioned across AI platforms
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card-tertiary">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredMentions.length}</p>
              <p className="text-xs text-muted-foreground">
                {filteredMentions.length !== mentions.length
                  ? `of ${mentions.length} Mentions`
                  : "Total Mentions"}
              </p>
            </div>
          </div>
        </div>

        <div className="card-tertiary">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{sentimentCounts.positive}</p>
              <p className="text-xs text-muted-foreground">Positive</p>
            </div>
          </div>
        </div>

        <div className="card-tertiary">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
              <span className="text-lg font-bold text-muted-foreground">~</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">{sentimentCounts.neutral}</p>
              <p className="text-xs text-muted-foreground">Neutral</p>
            </div>
          </div>
        </div>

        <div className="card-tertiary">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-error/10">
              <TrendingDown className="h-5 w-5 text-error" />
            </div>
            <div>
              <p className="text-2xl font-bold text-error">{sentimentCounts.negative}</p>
              <p className="text-xs text-muted-foreground">Negative</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-secondary">
        <MentionFilters
          selectedPlatforms={selectedPlatforms}
          selectedSentiments={selectedSentiments}
          dateRange={dateRange}
          onPlatformChange={setSelectedPlatforms}
          onSentimentChange={setSelectedSentiments}
          onDateRangeChange={setDateRange}
          onClearAll={handleClearFilters}
        />
      </div>

      {/* Mentions List */}
      <div className="card-secondary">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {filteredMentions.length === 0
              ? "No mentions found"
              : `${filteredMentions.length} Mention${filteredMentions.length !== 1 ? "s" : ""}`}
          </h3>
          {dateRange !== "all" && (
            <span className="text-sm text-muted-foreground">
              {dateRange === "24h"
                ? "Last 24 hours"
                : dateRange === "7d"
                ? "Last 7 days"
                : "Last 30 days"}
            </span>
          )}
        </div>

        {filteredMentions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No mentions match your current filters.</p>
            <Button
              variant="ghost"
              className="mt-2"
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMentions.map((mention) => (
              <MentionCard
                key={mention.id}
                platformId={mention.platformId}
                text={mention.text}
                sentiment={mention.sentiment}
                timestamp={mention.timestamp}
                source={mention.source}
                sourceUrl={mention.sourceUrl}
              />
            ))}
          </div>
        )}
      </div>

      {/* Platform Breakdown */}
      {Object.keys(platformCounts).length > 0 && (
        <div className="card-secondary">
          <h3 className="text-lg font-semibold mb-4">Mentions by Platform</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(platformCounts).map(([platform, count]) => (
              <div key={platform} className="card-tertiary flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{platform}</span>
                <span className="text-lg font-bold text-primary">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
