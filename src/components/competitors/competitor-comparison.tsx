"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Platform colors
const platformColors = {
  chatgpt: "#10A37F",
  claude: "#D97757",
  gemini: "#4285F4",
  perplexity: "#20B8CD",
};

// Export interface for API integration
export interface CompetitorData {
  id: string;
  name: string;
  logo?: string;
  domain: string;
  geoScore: number;
  geoScoreChange: number;
  mentions: number;
  mentionsChange: number;
  visibility: number;
  visibilityChange: number;
  platforms: {
    chatgpt: number;
    claude: number;
    gemini: number;
    perplexity: number;
  };
  isYou?: boolean;
}

// Empty state component
function CompetitorEmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center max-w-md space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          />
          <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">No Competitors Added</h3>
          <p className="text-muted-foreground text-sm">
            Add competitors to track how your brand compares in AI visibility.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all text-sm">
          <Plus className="w-4 h-4" />
          Add First Competitor
        </button>
      </div>
    </div>
  );
}

// Move SortIcon outside to avoid "Cannot create components during render" error
function SortIcon({
  column,
  sortBy,
  sortDirection,
}: {
  column: "geoScore" | "mentions" | "visibility";
  sortBy: "geoScore" | "mentions" | "visibility";
  sortDirection: "asc" | "desc";
}) {
  if (sortBy !== column) return null;
  return sortDirection === "desc" ? (
    <ChevronDown className="w-3.5 h-3.5" />
  ) : (
    <ChevronUp className="w-3.5 h-3.5" />
  );
}

interface CompetitorComparisonProps {
  className?: string;
  brandId?: string;
  data?: CompetitorData[];
}

// Fetch competitor comparison data from API
async function fetchCompetitorComparison(brandId: string): Promise<CompetitorData[]> {
  const response = await fetch(`/api/competitive/comparison?brandId=${brandId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch competitor comparison");
  }
  const json = await response.json();
  return json.data || [];
}

export function CompetitorComparison({ className, brandId, data }: CompetitorComparisonProps) {
  // Fetch competitors from API if brandId is provided
  const { data: apiData, isLoading, error } = useQuery({
    queryKey: ["competitor-comparison", brandId],
    queryFn: () => fetchCompetitorComparison(brandId!),
    enabled: !!brandId && !data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // All hooks must be called before any conditional returns
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<"geoScore" | "mentions" | "visibility">("geoScore");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");

  // Use provided data or API data - memoize to prevent unnecessary re-renders
  const competitors = React.useMemo(
    () => data || apiData || [],
    [data, apiData]
  );

  const sortedCompetitors = React.useMemo(() => {
    return [...competitors].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
    });
  }, [competitors, sortBy, sortDirection]);

  const hasData = competitors.length > 0;

  const toggleSort = React.useCallback((column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  }, [sortBy]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("card-secondary overflow-hidden", className)}>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={cn("card-secondary overflow-hidden", className)}>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <p className="text-error">Failed to load competitor data</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!hasData) {
    return (
      <div className={cn("card-secondary overflow-hidden", className)}>
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Competitor Comparison
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track how your brand compares to competitors
            </p>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors">
            <Plus className="w-4 h-4" />
            Add Competitor
          </button>
        </div>
        <CompetitorEmptyState />
      </div>
    );
  }

  return (
    <div className={cn("card-secondary overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Competitor Comparison
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track how your brand compares to competitors
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors">
          <Plus className="w-4 h-4" />
          Add Competitor
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Brand
              </th>
              <th
                onClick={() => toggleSort("geoScore")}
                className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1">
                  GEO Score
                  <SortIcon column="geoScore" sortBy={sortBy} sortDirection={sortDirection} />
                </div>
              </th>
              <th
                onClick={() => toggleSort("mentions")}
                className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1">
                  Mentions
                  <SortIcon column="mentions" sortBy={sortBy} sortDirection={sortDirection} />
                </div>
              </th>
              <th
                onClick={() => toggleSort("visibility")}
                className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1">
                  Visibility
                  <SortIcon column="visibility" sortBy={sortBy} sortDirection={sortDirection} />
                </div>
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Platform Breakdown
              </th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {sortedCompetitors.map((competitor) => (
              <React.Fragment key={competitor.id}>
                <tr
                  className={cn(
                    "transition-colors",
                    competitor.isYou
                      ? "bg-primary/5"
                      : "hover:bg-white/5"
                  )}
                >
                  {/* Brand */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                          competitor.isYou
                            ? "bg-primary/20 text-primary"
                            : "bg-muted/30 text-foreground"
                        )}
                      >
                        {competitor.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {competitor.name}
                          </span>
                          {competitor.isYou && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {competitor.domain}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* GEO Score */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-foreground">
                        {competitor.geoScore}
                      </span>
                      <ChangeIndicator value={competitor.geoScoreChange} />
                    </div>
                  </td>

                  {/* Mentions */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {competitor.mentions}
                      </span>
                      <ChangeIndicator value={competitor.mentionsChange} />
                    </div>
                  </td>

                  {/* Visibility */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${competitor.visibility}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {competitor.visibility}%
                      </span>
                    </div>
                  </td>

                  {/* Platform Breakdown */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      {Object.entries(competitor.platforms).map(
                        ([platform, score]) => (
                          <div
                            key={platform}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: `${platformColors[platform as keyof typeof platformColors]}20`,
                              color: platformColors[platform as keyof typeof platformColors],
                            }}
                          >
                            <span className="font-medium capitalize">
                              {platform.charAt(0).toUpperCase()}
                            </span>
                            <span>{score}</span>
                          </div>
                        )
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4">
                    <button
                      onClick={() =>
                        setExpandedId(
                          expandedId === competitor.id ? null : competitor.id
                        )
                      }
                      className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expandedId === competitor.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>

                {/* Expanded details */}
                {expandedId === competitor.id && (
                  <tr className="bg-muted/5">
                    <td colSpan={6} className="py-4 px-4">
                      <CompetitorDetails competitor={competitor} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" />
        0
      </span>
    );
  }

  const isPositive = value > 0;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs",
        isPositive ? "text-success" : "text-error"
      )}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {isPositive ? "+" : ""}
      {value}
    </span>
  );
}

function CompetitorDetails({ competitor }: { competitor: CompetitorData }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Platform details */}
      {Object.entries(competitor.platforms).map(([platform, score]) => (
        <div
          key={platform}
          className="card-tertiary p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: `${platformColors[platform as keyof typeof platformColors]}20`,
                color: platformColors[platform as keyof typeof platformColors],
              }}
            >
              {platform.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground capitalize">
              {platform}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">{score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
          <div className="mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${score}%`,
                backgroundColor: platformColors[platform as keyof typeof platformColors],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Compact competitor card for sidebar/widgets
export function CompetitorCard({
  competitor,
  yourScore,
}: {
  competitor: Omit<CompetitorData, "isYou">;
  yourScore: number;
}) {
  const difference = competitor.geoScore - yourScore;
  const isAhead = difference > 0;

  return (
    <div className="card-tertiary p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center text-sm font-bold text-foreground">
            {competitor.name.charAt(0)}
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">
              {competitor.name}
            </span>
            <p className="text-[10px] text-muted-foreground">
              {competitor.domain}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-foreground">
            {competitor.geoScore}
          </div>
          <div
            className={cn(
              "text-[10px] font-medium",
              isAhead ? "text-error" : "text-success"
            )}
          >
            {isAhead ? `+${difference} ahead` : `${Math.abs(difference)} behind`}
          </div>
        </div>
      </div>

      {/* Mini platform breakdown */}
      <div className="flex items-center gap-1">
        {Object.entries(competitor.platforms).map(([platform, score]) => (
          <div
            key={platform}
            className="flex-1 h-1.5 rounded-full"
            style={{
              backgroundColor: `${platformColors[platform as keyof typeof platformColors]}40`,
            }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${score}%`,
                backgroundColor: platformColors[platform as keyof typeof platformColors],
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
