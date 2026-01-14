"use client";

import * as React from "react";
import {
  MapPin,
  Plus,
  Search,
  RefreshCw,
  Globe,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn, formatScore, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LocationCard,
  LocationCardSkeleton,
  type LocationData,
} from "./location-card";
import { ReviewsSummary, type ReviewData, type SentimentStats } from "./reviews-summary";
import { AddLocationDialog } from "./add-location-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

// ============================================================================
// Types
// ============================================================================

interface LocationsSectionProps {
  brandId: string;
  brandName?: string;
  className?: string;
  compact?: boolean;
  maxLocations?: number;
  onViewAll?: () => void;
}

interface LocationsApiResponse {
  data: LocationData[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface SummaryApiResponse {
  brandId: string;
  summary: {
    totalLocations: number;
    totalReviews: number;
    avgRating: number;
    verifiedCount: number;
    googleSyncedCount: number;
    overallScore: number;
  };
  typeBreakdown: Record<string, number>;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  locations: LocationData[];
  lastUpdated: string;
}

interface ReviewsApiResponse {
  reviews: ReviewData[];
  sentimentStats: SentimentStats;
  total: number;
}

interface GooglePlacesStatus {
  googlePlaces: {
    configured: boolean;
    message: string;
  };
}

// ============================================================================
// LocationsSection Component
// ============================================================================

export function LocationsSection({
  brandId,
  brandName,
  className,
  compact = false,
  maxLocations = 6,
  onViewAll,
}: LocationsSectionProps) {
  // State
  const [locations, setLocations] = React.useState<LocationData[]>([]);
  const [reviews, setReviews] = React.useState<ReviewData[]>([]);
  const [sentimentStats, setSentimentStats] = React.useState<SentimentStats | null>(null);
  const [summary, setSummary] = React.useState<SummaryApiResponse["summary"] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [googleConfigured, setGoogleConfigured] = React.useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  // Fetch locations and summary
  const fetchData = React.useCallback(async () => {
    if (!brandId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch locations summary
      const summaryRes = await fetch(`/api/locations?brandId=${brandId}&type=summary`);
      if (summaryRes.ok) {
        const summaryData: SummaryApiResponse = await summaryRes.json();
        setLocations(summaryData.locations || []);
        setSummary(summaryData.summary);
        setSentimentStats(summaryData.sentimentBreakdown);
      }

      // Fetch recent reviews
      const reviewsRes = await fetch(`/api/locations?brandId=${brandId}&type=reviews&limit=5`);
      if (reviewsRes.ok) {
        const reviewsData: ReviewsApiResponse = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
      }

      // Check Google Places configuration
      const configRes = await fetch("/api/locations/sync");
      if (configRes.ok) {
        const configData: GooglePlacesStatus = await configRes.json();
        setGoogleConfigured(configData.googlePlaces.configured);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load locations");
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-discover locations from Google Places
  const handleAutoDiscover = async () => {
    if (!brandId || !googleConfigured) return;

    setIsSyncing(true);
    try {
      const res = await fetch("/api/locations/sync?action=discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId }),
      });

      const data = await res.json();

      if (data.found && data.result) {
        // Sync the discovered location
        const syncRes = await fetch("/api/locations/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandId,
            placeId: data.result.placeId,
            locationType: "headquarters",
            isPrimary: true,
          }),
        });

        if (syncRes.ok) {
          // Refresh data after sync
          await fetchData();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to discover locations");
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync a specific location
  const handleSyncLocation = async (locationId: string) => {
    const location = locations.find((l) => l.id === locationId);
    if (!location?.placeId) return;

    setIsSyncing(true);
    try {
      const res = await fetch("/api/locations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          placeId: location.placeId,
        }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync location");
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter locations by search
  const filteredLocations = locations.filter(
    (loc) =>
      !searchQuery ||
      loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayLocations = filteredLocations.slice(0, maxLocations);
  const hasMore = filteredLocations.length > maxLocations;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Locations</h3>
          </div>
        </div>
        <LoadingState
          title="Loading locations"
          description="Fetching location data..."
          size="md"
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Locations</h3>
          </div>
        </div>
        <ErrorState
          title="Failed to load locations"
          error={error}
          onRetry={fetchData}
          size="md"
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Locations</h3>
            <p className="text-xs text-muted-foreground">
              {summary?.totalLocations || 0} locations â€¢ {summary?.totalReviews || 0} reviews
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {googleConfigured && locations.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoDiscover}
              disabled={isSyncing}
              className="gap-2"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
              Discover
            </Button>
          )}
          {locations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchData}
              disabled={isSyncing}
              className="gap-1"
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats (if not compact) */}
      {!compact && summary && summary.totalLocations > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card-tertiary p-3 text-center">
            <p className="text-2xl font-bold text-primary">
              {/* ðŸŸ¢ WORKING: Using centralized formatScore */}
              {summary.avgRating ? formatScore(summary.avgRating, 1) : "-"}
            </p>
            <p className="text-xs text-muted-foreground">Avg Rating</p>
          </div>
          <div className="card-tertiary p-3 text-center">
            <p className="text-2xl font-bold text-foreground">
              {/* ðŸŸ¢ WORKING: Using centralized formatNumber */}
              {formatNumber(summary.totalReviews || 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Reviews</p>
          </div>
          <div className="card-tertiary p-3 text-center">
            <p className="text-2xl font-bold text-success">
              {summary.verifiedCount || 0}
            </p>
            <p className="text-xs text-muted-foreground">Verified</p>
          </div>
          <div className="card-tertiary p-3 text-center">
            <p className="text-2xl font-bold text-warning">
              {summary.overallScore || 0}
            </p>
            <p className="text-xs text-muted-foreground">Location Score</p>
          </div>
        </div>
      )}

      {/* Search (if multiple locations) */}
      {locations.length > 3 && !compact && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
      )}

      {/* Empty State */}
      {locations.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="No locations found"
          description={
            googleConfigured
              ? `Discover ${brandName || "your brand"}'s locations from Google Places or add them manually.`
              : "Add Google Places API key to enable location discovery, or add locations manually."
          }
          theme="primary"
          variant="card"
          size="md"
          primaryAction={
            googleConfigured
              ? {
                  label: "Discover Locations",
                  icon: Globe,
                  onClick: handleAutoDiscover,
                  disabled: isSyncing,
                  loading: isSyncing,
                }
              : undefined
          }
          secondaryAction={{
            label: "Add Manually",
            icon: Plus,
            onClick: () => setIsAddDialogOpen(true),
            variant: "outline",
          }}
        />
      )}

      {/* Locations Grid */}
      {displayLocations.length > 0 && (
        <div
          className={cn(
            "grid gap-4",
            compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
          )}
        >
          {displayLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              variant={compact ? "compact" : "default"}
              onSync={handleSyncLocation}
            />
          ))}
        </div>
      )}

      {/* View All Button */}
      {hasMore && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full card-tertiary p-3 flex items-center justify-center gap-2 text-sm text-primary hover:bg-primary/5 transition-colors"
        >
          <span>View all {filteredLocations.length} locations</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Reviews Section (if not compact and has reviews) */}
      {!compact && reviews.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          <ReviewsSummary
            reviews={reviews}
            sentimentStats={sentimentStats || undefined}
            totalReviews={summary?.totalReviews}
            avgRating={summary?.avgRating}
            maxReviews={3}
            showViewAll={reviews.length > 3}
          />
        </div>
      )}

      {/* Add Location Dialog */}
      <AddLocationDialog
        brandId={brandId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}

// ============================================================================
// Compact Locations Widget
// ============================================================================

export function LocationsWidget({
  brandId,
  className,
}: {
  brandId: string;
  className?: string;
}) {
  const [data, setData] = React.useState<{
    totalLocations: number;
    avgRating: number;
    totalReviews: number;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/locations?brandId=${brandId}&type=summary`);
        if (res.ok) {
          const json: SummaryApiResponse = await res.json();
          setData({
            totalLocations: json.summary.totalLocations,
            avgRating: json.summary.avgRating,
            totalReviews: json.summary.totalReviews,
          });
        }
      } catch {
        // Silently fail for widget
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, [brandId]);

  if (isLoading || !data || data.totalLocations === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-3 text-sm", className)}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <MapPin className="w-4 h-4" />
        <span>{data.totalLocations} locations</span>
      </div>
      {data.avgRating > 0 && (
        <>
          <span className="text-muted-foreground/50">â€¢</span>
          <div className="flex items-center gap-1">
            <span className="text-warning">â˜…</span>
            {/* ðŸŸ¢ WORKING: Using centralized formatScore and formatNumber */}
            <span>{formatScore(data.avgRating, 1)}</span>
            <span className="text-muted-foreground">
              ({formatNumber(data.totalReviews)})
            </span>
          </div>
        </>
      )}
    </div>
  );
}
