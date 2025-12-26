"use client";

/**
 * PlatformMetricsCard Component
 *
 * Displays social media metrics for a single platform.
 * Shows follower count, engagement rate, and scan status.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Loader2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Platform icon components
import {
  Twitter,
  Youtube,
  Facebook,
} from "lucide-react";

interface PlatformMetricsCardProps {
  platform: "twitter" | "youtube" | "facebook";
  handle: string;
  data?: {
    followerCount: number;
    followingCount?: number;
    engagementRate: number;
    avgLikes?: number;
    avgComments?: number;
    avgShares?: number;
    postCount?: number;
    postFrequency?: number;
    mentionsCount?: number;
    sentiment?: {
      positive: number;
      neutral: number;
      negative: number;
    };
    profileUrl?: string;
    avatarUrl?: string;
    displayName?: string;
    isVerified?: boolean;
  };
  scanStatus?: "pending" | "scanning" | "success" | "partial" | "failed";
  lastScanned?: Date | string | null;
  onRescan?: () => void;
  isLoading?: boolean;
  className?: string;
}

const PLATFORM_CONFIG = {
  twitter: {
    name: "Twitter / X",
    icon: Twitter,
    color: "text-[#1DA1F2]",
    bgColor: "bg-[#1DA1F2]/10",
    borderColor: "border-[#1DA1F2]/20",
    urlPrefix: "https://twitter.com/",
    followerLabel: "Followers",
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    color: "text-[#FF0000]",
    bgColor: "bg-[#FF0000]/10",
    borderColor: "border-[#FF0000]/20",
    urlPrefix: "https://youtube.com/@",
    followerLabel: "Subscribers",
  },
  facebook: {
    name: "Facebook",
    icon: Facebook,
    color: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]/10",
    borderColor: "border-[#1877F2]/20",
    urlPrefix: "https://facebook.com/",
    followerLabel: "Followers",
  },
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Never";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function getEngagementTrend(rate: number): "up" | "down" | "neutral" {
  // Placeholder - would compare to previous period
  if (rate > 3) return "up";
  if (rate < 1) return "down";
  return "neutral";
}

export function PlatformMetricsCard({
  platform,
  handle,
  data,
  scanStatus = "pending",
  lastScanned,
  onRescan,
  isLoading = false,
  className,
}: PlatformMetricsCardProps) {
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;
  const hasData = data && data.followerCount > 0;
  const engagementTrend = data ? getEngagementTrend(data.engagementRate) : "neutral";

  const profileUrl = data?.profileUrl || `${config.urlPrefix}${handle}`;

  return (
    <div
      className={cn(
        "card-secondary rounded-lg p-4 relative overflow-hidden",
        config.borderColor,
        "border",
        className
      )}
    >
      {/* Platform Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg", config.bgColor)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>
          <div>
            <h3 className="font-medium text-sm">{config.name}</h3>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary focus-ring-primary rounded flex items-center gap-1 w-fit"
              aria-label={`View ${config.name} profile for @${handle}`}
            >
              @{handle}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {scanStatus === "success" && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {scanStatus === "partial" && (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
          {scanStatus === "failed" && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          {scanStatus === "scanning" && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </div>
      </div>

      {/* Main Metrics */}
      {hasData ? (
        <div className="space-y-4">
          {/* Follower Count */}
          <div>
            <p className="text-2xl font-bold">
              {formatNumber(data.followerCount)}
            </p>
            <p className="text-xs text-muted-foreground">{config.followerLabel}</p>
          </div>

          {/* Engagement Rate */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">
                {data.engagementRate.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">Engagement Rate</p>
            </div>
            <div className="flex items-center gap-1">
              {engagementTrend === "up" && (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
              {engagementTrend === "down" && (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              {engagementTrend === "neutral" && (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Additional Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
            <div className="text-center">
              <p className="text-sm font-medium">{formatNumber(data.avgLikes || 0)}</p>
              <p className="text-xs text-muted-foreground">Avg Likes</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{formatNumber(data.avgComments || 0)}</p>
              <p className="text-xs text-muted-foreground">Avg Comments</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{data.mentionsCount || 0}</p>
              <p className="text-xs text-muted-foreground">Mentions</p>
            </div>
          </div>

          {/* Sentiment Bar (if mentions exist) */}
          {data.sentiment && data.mentionsCount && data.mentionsCount > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1">Mention Sentiment</p>
              <div className="h-2 rounded-full overflow-hidden flex bg-muted">
                {data.sentiment.positive > 0 && (
                  <div
                    className="bg-green-500"
                    style={{
                      width: `${(data.sentiment.positive / data.mentionsCount) * 100}%`,
                    }}
                  />
                )}
                {data.sentiment.neutral > 0 && (
                  <div
                    className="bg-gray-400"
                    style={{
                      width: `${(data.sentiment.neutral / data.mentionsCount) * 100}%`,
                    }}
                  />
                )}
                {data.sentiment.negative > 0 && (
                  <div
                    className="bg-red-500"
                    style={{
                      width: `${(data.sentiment.negative / data.mentionsCount) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {scanStatus === "scanning" ? "Scanning..." : "No data available"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click rescan to fetch latest metrics
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Last scan: {formatDate(lastScanned)}</span>
        </div>
        {onRescan && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRescan}
            disabled={isLoading || scanStatus === "scanning"}
            className="h-7 px-2 text-xs"
          >
            {isLoading || scanStatus === "scanning" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            <span className="ml-1">Rescan</span>
          </Button>
        )}
      </div>
    </div>
  );
}

// Grid container for multiple platform cards
interface PlatformMetricsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function PlatformMetricsGrid({ children, className }: PlatformMetricsGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {children}
    </div>
  );
}
