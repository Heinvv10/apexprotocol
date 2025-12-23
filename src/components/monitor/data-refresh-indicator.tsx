"use client";

import * as React from "react";
import { RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataRefreshIndicatorProps {
  /**
   * Timestamp when the data was last updated (from React Query's dataUpdatedAt)
   */
  lastUpdated?: number;
  /**
   * Whether data is currently being fetched
   */
  isFetching: boolean;
  /**
   * Function to manually trigger a refetch
   */
  onRefresh: () => void;
  /**
   * Whether the refresh button should be disabled (e.g., when no brand is selected)
   */
  disabled?: boolean;
  /**
   * Optional className for additional styling
   */
  className?: string;
  /**
   * Size variant for the component
   */
  size?: "sm" | "default";
}

/**
 * Format a timestamp into a relative time string
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 5) {
    return "Just now";
  } else if (seconds < 60) {
    return `${seconds}s ago`;
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    // Format as date/time for older data
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
}

/**
 * Component that displays the last updated timestamp and a manual refresh button.
 * Used across monitor pages to provide consistent data freshness indicators.
 */
export function DataRefreshIndicator({
  lastUpdated,
  isFetching,
  onRefresh,
  disabled = false,
  className = "",
  size = "default",
}: DataRefreshIndicatorProps) {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // Update the relative time display every minute
  React.useEffect(() => {
    const interval = setInterval(forceUpdate, 60000);
    return () => clearInterval(interval);
  }, []);

  const isSmall = size === "sm";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Last Updated Timestamp */}
      {lastUpdated && (
        <div className={`flex items-center gap-1.5 text-muted-foreground ${isSmall ? "text-xs" : "text-sm"}`}>
          <Clock className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
          <span>
            Updated {formatRelativeTime(lastUpdated)}
          </span>
        </div>
      )}

      {/* Refresh Button */}
      <Button
        variant="outline"
        size={isSmall ? "sm" : "sm"}
        onClick={onRefresh}
        disabled={disabled || isFetching}
        className={isSmall ? "h-7 px-2" : ""}
      >
        <RefreshCw className={`${isSmall ? "h-3 w-3" : "h-4 w-4"} ${isFetching ? "animate-spin" : ""} ${!isSmall ? "mr-2" : ""}`} />
        {!isSmall && (isFetching ? "Refreshing..." : "Refresh")}
      </Button>
    </div>
  );
}

/**
 * Compact inline version that only shows the timestamp without button
 */
export function LastUpdatedTimestamp({
  lastUpdated,
  isFetching,
  className = "",
}: {
  lastUpdated?: number;
  isFetching?: boolean;
  className?: string;
}) {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    const interval = setInterval(forceUpdate, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!lastUpdated) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      {isFetching ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Updating...</span>
        </>
      ) : (
        <>
          <Clock className="h-3 w-3" />
          <span>Updated {formatRelativeTime(lastUpdated)}</span>
        </>
      )}
    </span>
  );
}
