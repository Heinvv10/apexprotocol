"use client";

import * as React from "react";
import Link from "next/link";
import {
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  Users,
  MessageCircle,
  Heart,
  Eye,
  CheckCircle,
  Plus,
  ExternalLink,
  BarChart3,
  Smile,
  Frown,
  Meh,
  Radar,
} from "lucide-react";
import { useSelectedBrand } from "@/stores";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ServiceScanResults, ScanBrandButton } from "@/components/social";

// Helper to extract handle from URL
function extractHandleFromUrl(url: string, platform: string): string | null {
  if (!url) return null;

  try {
    // Remove trailing slashes and clean up
    const cleanUrl = url.replace(/\/+$/, "");

    // Platform-specific extraction patterns
    const patterns: Record<string, RegExp[]> = {
      twitter: [
        /twitter\.com\/(@?\w+)/i,
        /x\.com\/(@?\w+)/i,
      ],
      youtube: [
        /youtube\.com\/@([^\/\?]+)/i,
        /youtube\.com\/channel\/([^\/\?]+)/i,
        /youtube\.com\/c\/([^\/\?]+)/i,
        /youtube\.com\/user\/([^\/\?]+)/i,
      ],
      facebook: [
        /facebook\.com\/([^\/\?]+)/i,
        /fb\.com\/([^\/\?]+)/i,
      ],
      linkedin: [
        /linkedin\.com\/company\/([^\/\?]+)/i,
        /linkedin\.com\/in\/([^\/\?]+)/i,
      ],
      instagram: [
        /instagram\.com\/([^\/\?]+)/i,
      ],
    };

    const platformPatterns = patterns[platform.toLowerCase()];
    if (!platformPatterns) {
      // Fallback: try to extract last path segment
      const lastSegment = cleanUrl.split("/").filter(Boolean).pop();
      return lastSegment || null;
    }

    for (const pattern of platformPatterns) {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/^@/, ""); // Remove @ prefix
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Get handles map from brand social links
function getSocialHandles(socialLinks: Record<string, string> | undefined): Record<string, string> {
  if (!socialLinks) return {};

  const handles: Record<string, string> = {};
  const supportedPlatforms = ["twitter", "youtube", "facebook"];

  for (const [platform, url] of Object.entries(socialLinks)) {
    const normalizedPlatform = platform.toLowerCase();
    if (supportedPlatforms.includes(normalizedPlatform)) {
      const handle = extractHandleFromUrl(url, normalizedPlatform);
      if (handle) {
        handles[normalizedPlatform] = handle;
      }
    }
  }

  return handles;
}

// Platform icons (simple colored circles with initials as fallback)
const PlatformIcon = ({ platform, className }: { platform: string; className?: string }) => {
  const colors: Record<string, string> = {
    linkedin: "bg-[#0A66C2]",
    twitter: "bg-[#1DA1F2]",
    facebook: "bg-[#1877F2]",
    instagram: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
    youtube: "bg-[#FF0000]",
    tiktok: "bg-black",
    github: "bg-[#333]",
    threads: "bg-black",
  };

  const initials: Record<string, string> = {
    linkedin: "in",
    twitter: "X",
    facebook: "f",
    instagram: "ig",
    youtube: "yt",
    tiktok: "tt",
    github: "gh",
    threads: "@",
  };

  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${colors[platform] || "bg-muted"} ${className}`}>
      {initials[platform] || platform.charAt(0).toUpperCase()}
    </div>
  );
};

// Types
interface SocialSummary {
  brandId: string;
  brandName: string;
  summary: {
    smoScore: number;
    smoTrend: "up" | "down" | "stable";
    totalFollowers: number;
    totalEngagements: number;
    avgEngagementRate: number;
    avgSentiment: number;
    connectedAccounts: number;
    positiveMentions: number;
    negativeMentions: number;
    neutralMentions: number;
  };
  breakdown: {
    reach: number;
    engagement: number;
    sentiment: number;
    growth: number;
    consistency: number;
  };
  lastUpdated: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  accountHandle: string;
  accountName: string;
  profileUrl: string;
  avatarUrl?: string;
  followersCount: number;
  postsCount: number;
  engagementRate: number;
  isActive: boolean;
  isVerified: boolean;
  connectionStatus: string;
  lastSyncedAt: string;
}

interface SocialMention {
  id: string;
  platform: string;
  authorHandle: string;
  authorName: string;
  content: string;
  sentiment: "positive" | "neutral" | "negative";
  engagementLikes: number;
  engagementShares: number;
  engagementComments: number;
  postTimestamp: string;
  postUrl?: string;
}

// API hooks
function useSocialSummary(brandId: string) {
  return useQuery({
    queryKey: ["social", "summary", brandId],
    queryFn: async (): Promise<SocialSummary> => {
      const res = await fetch(`/api/social?brandId=${brandId}&type=summary`);
      if (!res.ok) throw new Error("Failed to fetch social summary");
      return res.json();
    },
    enabled: !!brandId,
    staleTime: 60 * 1000,
  });
}

function useSocialAccounts(brandId: string) {
  return useQuery({
    queryKey: ["social", "accounts", brandId],
    queryFn: async () => {
      const res = await fetch(`/api/social?brandId=${brandId}&type=accounts`);
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
    enabled: !!brandId,
    staleTime: 60 * 1000,
  });
}

function useSocialMentions(brandId: string) {
  return useQuery({
    queryKey: ["social", "mentions", brandId],
    queryFn: async () => {
      const res = await fetch(`/api/social?brandId=${brandId}&type=mentions`);
      if (!res.ok) throw new Error("Failed to fetch mentions");
      return res.json();
    },
    enabled: !!brandId,
    staleTime: 60 * 1000,
  });
}

// Select brand prompt
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
            <Share2 className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Select a Brand to View Social Analytics</h2>
          <p className="text-muted-foreground">
            Choose a brand from the dropdown in the header to analyze social media presence.
          </p>
        </div>
        <Link
          href="/dashboard/brands"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/30 font-medium hover:bg-primary/20 transition-all"
        >
          Manage Brands
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Loading state
function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Analyzing social media presence...</p>
      </div>
    </div>
  );
}

// Error state
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 border border-error/30 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Failed to Load Social Data</h3>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}

// SMO Score Gauge Component
function SMOScoreGauge({ value, trend, breakdown }: {
  value: number;
  trend: "up" | "down" | "stable";
  breakdown: { reach: number; engagement: number; sentiment: number; growth: number; consistency: number };
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-error" : "text-muted-foreground";
  const trendBg = trend === "up" ? "bg-success/10" : trend === "down" ? "bg-error/10" : "bg-muted/20";

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-warning";
    return "text-error";
  };

  const getGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
  };

  return (
    <div className="card-primary p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Share2 className="w-full h-full text-primary" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Social Media Score (SMO)</h3>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${trendBg}`}>
            <TrendIcon className={`w-3 h-3 ${trendColor}`} />
            <span className={`text-xs font-medium ${trendColor}`}>
              {trend === "up" ? "Rising" : trend === "down" ? "Falling" : "Stable"}
            </span>
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <span className={`text-5xl font-bold ${getScoreColor(value)}`}>{value}</span>
          <span className={`text-2xl font-semibold ${getScoreColor(value)}`}>{getGrade(value)}</span>
        </div>

        {/* Score breakdown bars */}
        <div className="space-y-2 pt-2">
          {[
            { label: "Reach", value: breakdown.reach, weight: "25%" },
            { label: "Engagement", value: breakdown.engagement, weight: "30%" },
            { label: "Sentiment", value: breakdown.sentiment, weight: "20%" },
            { label: "Growth", value: breakdown.growth, weight: "15%" },
            { label: "Consistency", value: breakdown.consistency, weight: "10%" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20">{item.label}</span>
              <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent-purple rounded-full transition-all duration-500"
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "stable";
  color?: "primary" | "warning" | "error" | "success";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary border-primary/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    error: "bg-error/10 text-error border-error/30",
    success: "bg-success/10 text-success border-success/30",
  };

  return (
    <div className="card-secondary p-5">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className="text-xs text-muted-foreground">
            {trend === "up" && <TrendingUp className="w-4 h-4 text-success" />}
            {trend === "down" && <TrendingDown className="w-4 h-4 text-error" />}
            {trend === "stable" && <Minus className="w-4 h-4" />}
          </div>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {subValue && <div className="text-xs text-muted-foreground/70">{subValue}</div>}
      </div>
    </div>
  );
}

// Platform Account Card
function PlatformAccountCard({ account }: { account: SocialAccount }) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="card-tertiary p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start gap-3">
        <PlatformIcon platform={account.platform} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {account.accountName || account.accountHandle}
            </span>
            {account.isVerified && (
              <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            )}
          </div>
          <div className="text-xs text-muted-foreground">@{account.accountHandle}</div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3 h-3" />
              {formatNumber(account.followersCount)}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <BarChart3 className="w-3 h-3" />
              {(account.engagementRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <a
          href={account.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

// Social Mention Card
function MentionCard({ mention }: { mention: SocialMention }) {
  const SentimentIcon = mention.sentiment === "positive" ? Smile : mention.sentiment === "negative" ? Frown : Meh;
  const sentimentColor = mention.sentiment === "positive"
    ? "text-success bg-success/10"
    : mention.sentiment === "negative"
    ? "text-error bg-error/10"
    : "text-muted-foreground bg-muted/20";

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  return (
    <div className="card-tertiary p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start gap-3">
        <PlatformIcon platform={mention.platform} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {mention.authorName || mention.authorHandle}
              </span>
              <span className="text-xs text-muted-foreground">
                @{mention.authorHandle}
              </span>
            </div>
            <div className={`p-1 rounded-full ${sentimentColor}`}>
              <SentimentIcon className="w-3 h-3" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {mention.content}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground/70">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {mention.engagementLikes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {mention.engagementComments}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="w-3 h-3" />
                {mention.engagementShares}
              </span>
            </div>
            <span>{formatTimeAgo(mention.postTimestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sentiment Summary Card
function SentimentSummary({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total = positive + neutral + negative;
  const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;
  const negativePercent = total > 0 ? Math.round((negative / total) * 100) : 0;

  return (
    <div className="card-secondary p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Sentiment Analysis</h3>
      <div className="space-y-4">
        {/* Visual bar */}
        <div className="h-4 rounded-full overflow-hidden flex">
          {positivePercent > 0 && (
            <div
              className="bg-success transition-all duration-500"
              style={{ width: `${positivePercent}%` }}
            />
          )}
          {neutralPercent > 0 && (
            <div
              className="bg-muted-foreground/50 transition-all duration-500"
              style={{ width: `${neutralPercent}%` }}
            />
          )}
          {negativePercent > 0 && (
            <div
              className="bg-error transition-all duration-500"
              style={{ width: `${negativePercent}%` }}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Smile className="w-4 h-4 text-success" />
              <span className="text-lg font-bold text-success">{positivePercent}%</span>
            </div>
            <div className="text-xs text-muted-foreground">Positive ({positive})</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Meh className="w-4 h-4 text-muted-foreground" />
              <span className="text-lg font-bold text-muted-foreground">{neutralPercent}%</span>
            </div>
            <div className="text-xs text-muted-foreground">Neutral ({neutral})</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Frown className="w-4 h-4 text-error" />
              <span className="text-lg font-bold text-error">{negativePercent}%</span>
            </div>
            <div className="text-xs text-muted-foreground">Negative ({negative})</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function SocialPage() {
  const selectedBrand = useSelectedBrand();
  const brandId = selectedBrand?.id || "";
  const queryClient = useQueryClient();

  // Extract social handles from brand's socialLinks
  const socialHandles = React.useMemo(
    () => getSocialHandles(selectedBrand?.socialLinks as Record<string, string> | undefined),
    [selectedBrand?.socialLinks]
  );

  const hasSocialHandles = Object.keys(socialHandles).length > 0;

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useSocialSummary(brandId);

  const { data: accountsData } = useSocialAccounts(brandId);
  const { data: mentionsData } = useSocialMentions(brandId);

  // Callback when scan completes - invalidate relevant queries
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleScanComplete = React.useCallback((_results?: unknown) => {
    // Invalidate scan results and summary queries to refetch fresh data
    queryClient.invalidateQueries({ queryKey: ["social", "scan-results", brandId] });
    queryClient.invalidateQueries({ queryKey: ["social", "summary", brandId] });
  }, [queryClient, brandId]);

  // Handle states
  if (!selectedBrand) {
    return (
      <div className="space-y-6 relative">
        <PageHeader />
        <SelectBrandPrompt />
        <DecorativeStar />
      </div>
    );
  }

  if (summaryLoading) {
    return (
      <div className="space-y-6 relative">
        <PageHeader />
        <LoadingState />
        <DecorativeStar />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="space-y-6 relative">
        <PageHeader />
        <ErrorState error={summaryError as Error} onRetry={() => refetchSummary()} />
        <DecorativeStar />
      </div>
    );
  }

  const accounts: SocialAccount[] = accountsData?.accounts || [];
  const mentions: SocialMention[] = mentionsData?.mentions || [];
  const summaryData = summary?.summary || {
    smoScore: 0,
    smoTrend: "stable" as const,
    totalFollowers: 0,
    totalEngagements: 0,
    avgEngagementRate: 0,
    avgSentiment: 0,
    connectedAccounts: 0,
    positiveMentions: 0,
    negativeMentions: 0,
    neutralMentions: 0,
  };
  const breakdown = summary?.breakdown || {
    reach: 0,
    engagement: 0,
    sentiment: 50,
    growth: 50,
    consistency: 0,
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6 relative">
      <PageHeader />

      <div className="space-y-6">
        {/* Top Row - SMO Score and Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SMOScoreGauge value={summaryData.smoScore} trend={summaryData.smoTrend} breakdown={breakdown} />

          <StatCard
            icon={Users}
            label="Total Followers"
            value={formatNumber(summaryData.totalFollowers)}
            subValue={`Across ${summaryData.connectedAccounts} platforms`}
            color="primary"
          />

          <StatCard
            icon={Heart}
            label="Total Engagements"
            value={formatNumber(summaryData.totalEngagements)}
            subValue={`${(summaryData.avgEngagementRate * 100).toFixed(2)}% avg rate`}
            color="success"
          />

          <StatCard
            icon={Eye}
            label="Social Mentions"
            value={formatNumber(summaryData.positiveMentions + summaryData.neutralMentions + summaryData.negativeMentions)}
            subValue="Last 30 days"
            color={summaryData.negativeMentions > summaryData.positiveMentions ? "warning" : "success"}
          />
        </div>

        {/* Service Scanner Results - Public Data (No OAuth Required) */}
        {hasSocialHandles && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Platform Analytics</h2>
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-primary/10 rounded-full">
                  Public Data
                </span>
              </div>
              <ScanBrandButton
                brandId={brandId}
                handles={{
                  twitter: socialHandles.twitter,
                  youtube: socialHandles.youtube,
                  facebook: socialHandles.facebook,
                }}
                onScanComplete={handleScanComplete}
              />
            </div>
            <ServiceScanResults
              brandId={brandId}
              handles={{
                twitter: socialHandles.twitter,
                youtube: socialHandles.youtube,
                facebook: socialHandles.facebook,
              }}
            />
          </div>
        )}

        {/* No Social Handles Configured */}
        {!hasSocialHandles && (
          <div className="card-secondary p-6 text-center">
            <Radar className="w-12 h-12 text-primary/40 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Social Handles Configured</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Add your brand&apos;s social media links to enable automatic scanning of public metrics from Twitter, YouTube, and Facebook.
            </p>
            <Link
              href={`/dashboard/brands/${brandId}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Social Links
            </Link>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connected Accounts */}
          <div className="card-secondary p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Connected Accounts</h2>
              </div>
              <button className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-3 h-3" />
                Connect
              </button>
            </div>

            {accounts.length === 0 ? (
              <div className="text-center py-8">
                <Share2 className="w-12 h-12 text-primary/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No social accounts connected</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Connect your social accounts to start monitoring
                </p>
                <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/20 transition-all">
                  <Plus className="w-4 h-4" />
                  Connect Account
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {accounts.map((account) => (
                  <PlatformAccountCard key={account.id} account={account} />
                ))}
              </div>
            )}
          </div>

          {/* Sentiment Analysis */}
          <SentimentSummary
            positive={summaryData.positiveMentions}
            neutral={summaryData.neutralMentions}
            negative={summaryData.negativeMentions}
          />

          {/* Recent Mentions */}
          <div className="card-secondary p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-accent-purple" />
                <h2 className="text-lg font-semibold text-foreground">Recent Mentions</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {mentions.length} recent
              </span>
            </div>

            {mentions.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-accent-purple/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No recent mentions</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Mentions will appear here when your brand is discussed
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {mentions.slice(0, 10).map((mention) => (
                  <MentionCard key={mention.id} mention={mention} />
                ))}
                {mentions.length > 10 && (
                  <button className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors">
                    View all {mentions.length} mentions
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Row */}
        {summaryData.smoScore < 70 && (
          <div className="card-secondary p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-warning" />
              <h2 className="text-lg font-semibold text-foreground">Recommendations to Improve SMO</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {breakdown.reach < 50 && (
                <div className="card-tertiary p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Grow Your Audience</h4>
                  <p className="text-xs text-muted-foreground">
                    Focus on consistent content and engagement to grow your follower base across platforms.
                  </p>
                </div>
              )}
              {breakdown.engagement < 50 && (
                <div className="card-tertiary p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Boost Engagement</h4>
                  <p className="text-xs text-muted-foreground">
                    Post more interactive content and respond to comments to improve engagement rates.
                  </p>
                </div>
              )}
              {breakdown.consistency < 50 && (
                <div className="card-tertiary p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Post Consistently</h4>
                  <p className="text-xs text-muted-foreground">
                    Aim for 3-5 posts per week across your main platforms to maintain visibility.
                  </p>
                </div>
              )}
              {breakdown.sentiment < 60 && (
                <div className="card-tertiary p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Improve Sentiment</h4>
                  <p className="text-xs text-muted-foreground">
                    Address negative feedback promptly and focus on positive brand messaging.
                  </p>
                </div>
              )}
              {summaryData.connectedAccounts < 3 && (
                <div className="card-tertiary p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Connect More Platforms</h4>
                  <p className="text-xs text-muted-foreground">
                    Connect additional social accounts for comprehensive monitoring and better insights.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <DecorativeStar />
    </div>
  );
}

// Decorative Star Component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientSocial)"
        />
        <defs>
          <linearGradient id="starGradientSocial" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Page Header Component
function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradSocial)" />
            <defs>
              <linearGradient id="apexGradSocial" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5CC"/>
                <stop offset="1" stopColor="#8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          APEX
        </span>
        <span className="text-xl font-light text-foreground ml-1">Social</span>
      </div>

      {/* AI Status */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">AI Status:</span>
        <span className="text-xs text-primary font-medium">Active</span>
      </div>
    </div>
  );
}
