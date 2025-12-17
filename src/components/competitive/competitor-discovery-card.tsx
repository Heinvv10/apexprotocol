"use client";

import * as React from "react";
import {
  Search,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Loader2,
  Users,
  AlertCircle,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiscoverySuggestionItem } from "./discovery-suggestion-item";

// Types
export interface DiscoveredCompetitor {
  id: string;
  competitorName: string;
  competitorDomain: string | null;
  discoveryMethod: "keyword_overlap" | "ai_co_occurrence" | "industry_match" | "search_overlap" | "manual";
  confidenceScore: number;
  keywordOverlap: number | null;
  aiCoOccurrence: number | null;
  industryMatch: boolean | null;
  sharedKeywords: string[];
  coOccurrenceQueries: string[];
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
}

interface CompetitorDiscoveryCardProps {
  brandId: string;
  className?: string;
}

// Empty state component
function DiscoveryEmptyState({ onDiscover }: { onDiscover: () => void }) {
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
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">Discover Competitors</h3>
          <p className="text-muted-foreground text-sm">
            Our AI analyzes your brand mentions and keywords to automatically discover
            competitors you might be missing.
          </p>
        </div>

        <button
          onClick={onDiscover}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all text-sm"
        >
          <Search className="w-4 h-4" />
          Start Discovery
        </button>
      </div>
    </div>
  );
}

// Loading state
function DiscoveryLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center animate-pulse">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">Analyzing Your Market</h3>
          <p className="text-muted-foreground text-sm">
            Scanning AI mentions and keyword patterns to discover competitors...
          </p>
        </div>
      </div>
    </div>
  );
}

export function CompetitorDiscoveryCard({ brandId, className }: CompetitorDiscoveryCardProps) {
  const [discoveries, setDiscoveries] = React.useState<DiscoveredCompetitor[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDiscovering, setIsDiscovering] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showConfirmed, setShowConfirmed] = React.useState(false);

  // Fetch existing discoveries on mount
  React.useEffect(() => {
    fetchDiscoveries();
  }, [brandId]);

  const fetchDiscoveries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/competitive/discover?brandId=${brandId}&status=pending`
      );
      if (!response.ok) throw new Error("Failed to fetch discoveries");
      const data = await response.json();
      setDiscoveries(data.competitors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const runDiscovery = async () => {
    setIsDiscovering(true);
    setError(null);
    try {
      const response = await fetch("/api/competitive/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          options: {
            minConfidenceScore: 0.4,
            maxResults: 20,
            lookbackDays: 90,
            storeResults: true,
          },
        }),
      });
      if (!response.ok) throw new Error("Failed to run discovery");
      const data = await response.json();
      setDiscoveries(data.competitors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleConfirm = async (discoveryId: string) => {
    try {
      const response = await fetch("/api/competitive/discover/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          discoveryId,
          action: "confirm",
        }),
      });
      if (!response.ok) throw new Error("Failed to confirm");

      // Update local state
      setDiscoveries(prev =>
        prev.map(d =>
          d.id === discoveryId ? { ...d, status: "confirmed" as const } : d
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm");
    }
  };

  const handleReject = async (discoveryId: string, reason?: string) => {
    try {
      const response = await fetch("/api/competitive/discover/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          discoveryId,
          action: "reject",
          rejectionReason: reason,
        }),
      });
      if (!response.ok) throw new Error("Failed to reject");

      // Remove from local state
      setDiscoveries(prev => prev.filter(d => d.id !== discoveryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    }
  };

  const pendingDiscoveries = discoveries.filter(d => d.status === "pending");
  const confirmedDiscoveries = discoveries.filter(d => d.status === "confirmed");
  const hasDiscoveries = discoveries.length > 0;

  return (
    <div className={cn("card-secondary overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Competitor Discovery
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              AI-powered competitor identification
            </p>
          </div>
        </div>
        <button
          onClick={runDiscovery}
          disabled={isDiscovering}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          {isDiscovering ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isDiscovering ? "Discovering..." : "Re-scan"}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-error/10 border border-error/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <DiscoveryLoadingState />
      ) : isDiscovering ? (
        <DiscoveryLoadingState />
      ) : !hasDiscoveries ? (
        <DiscoveryEmptyState onDiscover={runDiscovery} />
      ) : (
        <div className="p-4 space-y-4">
          {/* Pending discoveries */}
          {pendingDiscoveries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Suggested Competitors
                  <span className="px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                    {pendingDiscoveries.length}
                  </span>
                </h4>
              </div>
              <div className="space-y-2">
                {pendingDiscoveries.map((discovery) => (
                  <DiscoverySuggestionItem
                    key={discovery.id}
                    discovery={discovery}
                    onConfirm={() => handleConfirm(discovery.id)}
                    onReject={(reason) => handleReject(discovery.id, reason)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Confirmed discoveries */}
          {confirmedDiscoveries.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowConfirmed(!showConfirmed)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Check className="w-4 h-4 text-success" />
                Recently Added ({confirmedDiscoveries.length})
                {showConfirmed ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showConfirmed && (
                <div className="space-y-2 pl-6">
                  {confirmedDiscoveries.map((discovery) => (
                    <div
                      key={discovery.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-success/5 border border-success/20"
                    >
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-sm font-bold text-success">
                        {discovery.competitorName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {discovery.competitorName}
                        </p>
                        {discovery.competitorDomain && (
                          <p className="text-xs text-muted-foreground truncate">
                            {discovery.competitorDomain}
                          </p>
                        )}
                      </div>
                      <Check className="w-4 h-4 text-success" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No pending state */}
          {pendingDiscoveries.length === 0 && confirmedDiscoveries.length > 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                All suggestions reviewed. Click &quot;Re-scan&quot; to discover more competitors.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
