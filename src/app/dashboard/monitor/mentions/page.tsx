"use client";

import * as React from "react";
import { ArrowLeft, TrendingUp, TrendingDown, MessageSquare, Sparkles, Settings, ArrowRight, Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { MentionCard, MentionFilters, PlatformId, SentimentType } from "@/components/monitor";
import { Button } from "@/components/ui/button";
import { useMentions, useMentionsByBrand, useRefreshMentions } from "@/hooks/useMonitor";
import { useSelectedBrand } from "@/stores";

// Pagination constants
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Mention interface (for UI display)
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

// Loading state component
function MentionsLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading mentions...</p>
      </div>
    </div>
  );
}

// Helper to calculate hours ago from timestamp
function getHoursAgo(timestamp: string | Date): number {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

// Transform API mention to UI format
function transformMention(apiMention: {
  id: string;
  platform: string;
  response: string;
  sentiment: string;
  createdAt: Date | string;
  citationUrl?: string | null;
  query?: string;
}): Mention {
  return {
    id: apiMention.id,
    platformId: apiMention.platform as PlatformId,
    text: apiMention.response,
    sentiment: apiMention.sentiment as SentimentType,
    timestamp: typeof apiMention.createdAt === "string"
      ? apiMention.createdAt
      : apiMention.createdAt.toISOString(),
    hoursAgo: getHoursAgo(apiMention.createdAt),
    source: apiMention.query,
    sourceUrl: apiMention.citationUrl ?? undefined,
  };
}

export default function MentionsPage() {
  const selectedBrand = useSelectedBrand();

  // Filter state
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<PlatformId[]>([]);
  const [selectedSentiments, setSelectedSentiments] = React.useState<SentimentType[]>([]);
  const [dateRange, setDateRange] = React.useState<"24h" | "7d" | "30d" | "all">("all");

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand?.id, selectedPlatforms, selectedSentiments, dateRange]);

  // Build API filters from UI state
  const apiFilters = React.useMemo(() => {
    const filters: Record<string, string | number | undefined> = {};

    if (selectedBrand?.id) {
      filters.brandId = selectedBrand.id;
    }

    if (selectedPlatforms.length === 1) {
      filters.platform = selectedPlatforms[0];
    }

    if (selectedSentiments.length === 1) {
      filters.sentiment = selectedSentiments[0];
    }

    // Calculate date range
    if (dateRange !== "all") {
      const now = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case "24h":
          startDate.setHours(now.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
      }
      filters.startDate = startDate.toISOString();
    }

    // Add pagination parameters
    filters.limit = pageSize;
    filters.offset = (currentPage - 1) * pageSize;

    return filters;
  }, [selectedBrand?.id, selectedPlatforms, selectedSentiments, dateRange, currentPage, pageSize]);

  // Fetch mentions from API
  const { data: mentionsData, isLoading, error, refetch, isFetching } = useMentions(apiFilters);
  const refreshMentions = useRefreshMentions();

  // Calculate pagination info
  const totalItems = mentionsData?.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Transform API data to UI format
  const mentions: Mention[] = React.useMemo(() => {
    if (!mentionsData?.mentions) return [];
    return mentionsData.mentions.map(transformMention);
  }, [mentionsData]);

  // Handle loading state (only show full loading on initial load)
  if (isLoading && mentions.length === 0) {
    return <MentionsLoadingState />;
  }

  // Handle empty state (no brand selected or no data)
  if (!selectedBrand && mentions.length === 0 && !isLoading) {
    return <MentionsEmptyState />;
  }

  // Calculate stats from current page mentions
  // Note: For accurate totals, we'd need a separate stats endpoint
  const sentimentCounts = mentions.reduce(
    (acc, mention) => {
      acc[mention.sentiment]++;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  const platformCounts = mentions.reduce(
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
      <div className="flex items-center justify-between">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => selectedBrand?.id && refreshMentions.mutate(selectedBrand.id)}
          disabled={refreshMentions.isPending || !selectedBrand}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshMentions.isPending ? "animate-spin" : ""}`} />
          {refreshMentions.isPending ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card-tertiary">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-xs text-muted-foreground">
                Total Mentions
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
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              {totalItems === 0
                ? "No mentions found"
                : `${totalItems} Mention${totalItems !== 1 ? "s" : ""}`}
            </h3>
            {isFetching && !isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
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

        {mentions.length === 0 && !isLoading ? (
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
          <>
            <div className="space-y-4">
              {mentions.map((mention) => (
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Showing {startItem} to {endItem} of {totalItems} mentions
                  </span>
                  <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm text-muted-foreground">
                      Per page:
                    </label>
                    <select
                      id="pageSize"
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-2 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1 || isFetching}
                    className="hidden sm:flex"
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1 || isFetching}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* Page number buttons */}
                    {(() => {
                      const pages = [];
                      const showPages = 5;
                      let start = Math.max(1, currentPage - Math.floor(showPages / 2));
                      const end = Math.min(totalPages, start + showPages - 1);

                      if (end - start + 1 < showPages) {
                        start = Math.max(1, end - showPages + 1);
                      }

                      for (let i = start; i <= end; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={i === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(i)}
                            disabled={isFetching}
                            className="min-w-[36px]"
                          >
                            {i}
                          </Button>
                        );
                      }
                      return pages;
                    })()}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || isFetching}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages || isFetching}
                    className="hidden sm:flex"
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </>
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
