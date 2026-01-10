"use client";

import * as React from "react";
import {
  MapPin,
  Phone,
  Globe,
  Mail,
  Clock,
  Building2,
  Star,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn, formatLocationType as formatLocationTypeCentralized, formatLastSynced as formatLastSyncedCentralized } from "@/lib/utils";
import { RatingBadge, RatingBadgeCompact } from "./rating-badge";

// ============================================================================
// Types
// ============================================================================

export interface LocationData {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationType?: string | null;
  isPrimary?: boolean | null;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  categories?: string[] | null;
  priceLevel?: number | null;
  isVerified?: boolean | null;
  isActive?: boolean | null;
  placeId?: string | null;
  lastSyncedAt?: string | null;
  createdAt?: string;
}

interface LocationCardProps {
  location: LocationData;
  onSync?: (locationId: string) => void;
  onView?: (locationId: string) => void;
  onEdit?: (locationId: string) => void;
  isLoading?: boolean;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

// ðŸŸ¢ WORKING: Migrated to centralized formatters
// formatLocationType now uses the centralized version from @/lib/utils
function formatLocationType(type: string | null | undefined): string {
  // Use centralized formatter with custom default
  return formatLocationTypeCentralized(type) === "Unknown" ? "Location" : formatLocationTypeCentralized(type);
}

// ðŸŸ¢ WORKING: Custom address formatter (includes country, not in centralized version)
function formatAddress(location: LocationData): string {
  const parts = [
    location.address,
    location.city,
    location.state,
    location.postalCode,
    location.country,
  ].filter(Boolean);
  return parts.join(", ") || "No address provided";
}

// ðŸŸ¢ WORKING: Enhanced last synced formatter with custom messaging
function formatLastSynced(date: string | null | undefined): string {
  // Use centralized formatter but with custom "Never synced" default
  const formatted = formatLastSyncedCentralized(date);

  if (!date || formatted === "Never") return "Never synced";

  // Enhanced formatting for sync status
  const syncDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - syncDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Synced today";
  if (diffDays === 1) return "Synced yesterday";
  if (diffDays < 7) return `Synced ${diffDays} days ago`;
  if (diffDays < 30) return `Synced ${Math.floor(diffDays / 7)} weeks ago`;
  return `Synced ${syncDate.toLocaleDateString()}`;
}

function getPriceLevelDisplay(level: number | null | undefined): string {
  if (level === null || level === undefined) return "";
  return "$".repeat(level + 1);
}

// ============================================================================
// Location Type Badge
// ============================================================================

function LocationTypeBadge({
  type,
  isPrimary,
}: {
  type: string | null | undefined;
  isPrimary: boolean | null | undefined;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          "bg-primary/10 text-primary border border-primary/20"
        )}
      >
        <Building2 className="w-3 h-3" />
        {formatLocationType(type)}
      </span>
      {isPrimary && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
          Primary
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Verification Badge
// ============================================================================

function VerificationBadge({
  isVerified,
  placeId,
}: {
  isVerified: boolean | null | undefined;
  placeId: string | null | undefined;
}) {
  if (isVerified) {
    return (
      <div className="flex items-center gap-1 text-success text-xs">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Verified</span>
      </div>
    );
  }
  if (placeId) {
    return (
      <div className="flex items-center gap-1 text-primary text-xs">
        <Globe className="w-3.5 h-3.5" />
        <span>Google Synced</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground text-xs">
      <XCircle className="w-3.5 h-3.5" />
      <span>Not synced</span>
    </div>
  );
}

// ============================================================================
// LocationCard Component
// ============================================================================

export function LocationCard({
  location,
  onSync,
  onView,
  onEdit,
  isLoading = false,
  variant = "default",
  className,
}: LocationCardProps) {
  // Compact variant
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "card-tertiary p-3 hover:border-primary/30 transition-colors cursor-pointer",
          className
        )}
        onClick={() => onView?.(location.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-sm text-foreground truncate">
                {location.name}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {location.city}
                {location.state ? `, ${location.state}` : ""}
              </p>
            </div>
          </div>
          {location.rating && (
            <RatingBadgeCompact rating={location.rating} />
          )}
        </div>
      </div>
    );
  }

  // Default and detailed variants
  return (
    <div
      className={cn(
        "card-secondary p-4 hover:border-primary/30 transition-colors",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {location.name}
              </h3>
              {!location.isActive && (
                <span className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                  Inactive
                </span>
              )}
            </div>
            <LocationTypeBadge
              type={location.locationType}
              isPrimary={location.isPrimary}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onSync && location.placeId && (
            <button
              onClick={() => onSync(location.id)}
              disabled={isLoading}
              className={cn(
                "p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors",
                isLoading && "animate-spin"
              )}
              title="Sync with Google Places"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onView && (
            <button
              onClick={() => onView(location.id)}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="View details"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Rating */}
      {location.rating !== null && location.rating !== undefined && (
        <div className="mb-3">
          <RatingBadge
            rating={location.rating}
            reviewCount={location.reviewCount ?? undefined}
            size="md"
            showStars
            showCount
          />
        </div>
      )}

      {/* Address */}
      <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{formatAddress(location)}</span>
      </div>

      {/* Contact Info (detailed variant only) */}
      {variant === "detailed" && (
        <div className="space-y-2 mb-3">
          {location.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <a
                href={`tel:${location.phone}`}
                className="hover:text-primary transition-colors"
              >
                {location.phone}
              </a>
            </div>
          )}
          {location.website && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              <a
                href={location.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors truncate"
              >
                {location.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {location.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <a
                href={`mailto:${location.email}`}
                className="hover:text-primary transition-colors"
              >
                {location.email}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {location.categories && location.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {location.categories.slice(0, 3).map((category, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs bg-muted/50 text-muted-foreground rounded"
            >
              {category.replace(/_/g, " ")}
            </span>
          ))}
          {location.categories.length > 3 && (
            <span className="px-2 py-0.5 text-xs bg-muted/50 text-muted-foreground rounded">
              +{location.categories.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <VerificationBadge
          isVerified={location.isVerified}
          placeId={location.placeId}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {location.priceLevel !== null && location.priceLevel !== undefined && (
            <span className="font-medium">
              {getPriceLevelDisplay(location.priceLevel)}
            </span>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatLastSynced(location.lastSyncedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LocationCardSkeleton
// ============================================================================

export function LocationCardSkeleton({
  variant = "default",
}: {
  variant?: "default" | "compact" | "detailed";
}) {
  if (variant === "compact") {
    return (
      <div className="card-tertiary p-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
          <div className="h-6 w-12 bg-muted rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-secondary p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded-full" />
        </div>
      </div>
      <div className="h-6 w-32 bg-muted rounded mb-3" />
      <div className="h-4 w-full bg-muted rounded mb-3" />
      <div className="flex justify-between pt-3 border-t border-border/50">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    </div>
  );
}

// ============================================================================
// LocationGrid
// ============================================================================

export function LocationGrid({
  locations,
  onSync,
  onView,
  onEdit,
  isLoading,
  variant = "default",
  className,
}: {
  locations: LocationData[];
  onSync?: (locationId: string) => void;
  onView?: (locationId: string) => void;
  onEdit?: (locationId: string) => void;
  isLoading?: boolean;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid gap-4",
          variant === "compact"
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          className
        )}
      >
        {[...Array(6)].map((_, i) => (
          <LocationCardSkeleton key={i} variant={variant} />
        ))}
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="card-secondary p-8 text-center">
        <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No locations found
        </h3>
        <p className="text-sm text-muted-foreground">
          Add locations manually or sync from Google Places.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4",
        variant === "compact"
          ? "grid-cols-1"
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {locations.map((location) => (
        <LocationCard
          key={location.id}
          location={location}
          onSync={onSync}
          onView={onView}
          onEdit={onEdit}
          variant={variant}
        />
      ))}
    </div>
  );
}
