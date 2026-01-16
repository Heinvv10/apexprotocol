"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Heart,
  MessageSquare,
  Share2,
  Eye,
  Calendar,
  Download,
  AlertCircle,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
} from "lucide-react";
import { useSocialMetrics } from "@/hooks/useSocial";

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalFollowers: 45678,
    followerGrowth: 12.5,
    totalEngagement: 23456,
    engagementRate: 4.8,
    totalReach: 234567,
    reachGrowth: 8.3,
    totalImpressions: 456789,
    impressionsGrowth: 15.2,
  },
  platformBreakdown: [
    {
      platform: "linkedin",
      followers: 18234,
      growth: 15.2,
      engagement: 8901,
      engagementRate: 5.2,
      posts: 24,
    },
    {
      platform: "twitter",
      followers: 12456,
      growth: 8.7,
      engagement: 7234,
      engagementRate: 4.1,
      posts: 48,
    },
    {
      platform: "instagram",
      followers: 9876,
      growth: 18.3,
      engagement: 5432,
      engagementRate: 6.8,
      posts: 32,
    },
    {
      platform: "facebook",
      followers: 3456,
      growth: 5.4,
      engagement: 1567,
      engagementRate: 3.2,
      posts: 16,
    },
    {
      platform: "youtube",
      followers: 1656,
      growth: 22.1,
      engagement: 322,
      engagementRate: 7.9,
      posts: 8,
    },
  ],
  topPosts: [
    {
      id: "post_001",
      platform: "linkedin",
      content: "Excited to announce our latest AI-powered content optimization features! 🚀",
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      engagement: {
        likes: 287,
        comments: 45,
        shares: 67,
        views: 8934,
      },
    },
    {
      id: "post_002",
      platform: "instagram",
      content: "Behind the scenes: Our team building the future of AI content optimization 💡✨",
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      engagement: {
        likes: 524,
        comments: 89,
        shares: 34,
        views: 12456,
      },
    },
    {
      id: "post_003",
      platform: "twitter",
      content: "Did you know? 65% of consumers now discover brands through AI assistants. Is your brand optimized for AI visibility?",
      publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      engagement: {
        likes: 198,
        comments: 32,
        shares: 89,
        views: 6734,
      },
    },
  ],
  engagementTrends: [
    { date: "Jan 8", likes: 1234, comments: 234, shares: 456, views: 12345 },
    { date: "Jan 9", likes: 1456, comments: 267, shares: 512, views: 13456 },
    { date: "Jan 10", likes: 1678, comments: 298, shares: 589, views: 14567 },
    { date: "Jan 11", likes: 1523, comments: 256, shares: 534, views: 13789 },
    { date: "Jan 12", likes: 1789, comments: 312, shares: 623, views: 15678 },
    { date: "Jan 13", likes: 1901, comments: 334, shares: 678, views: 16234 },
    { date: "Jan 14", likes: 2034, comments: 356, shares: 712, views: 17123 },
  ],
};

export default function SocialAnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [platformFilter, setPlatformFilter] = useState("all");

  // Fetch metrics from API
  const { metrics, isLoading, isError, error } = useSocialMetrics(null);

  // Use mock data (API transform not implemented yet)
  // TODO: Implement proper API data transformation when backend is ready
  const analytics = mockAnalytics;

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      linkedin: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      instagram: "text-pink-400 bg-pink-500/10 border-pink-500/30",
      facebook: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
      youtube: "text-red-400 bg-red-500/10 border-red-500/30",
    };
    return colors[platform] || "text-gray-400 bg-gray-500/10 border-gray-500/30";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "less than 1h ago";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Social Analytics</h1>
          <p className="text-muted-foreground mt-1">Track performance across all platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] bg-gray-900 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load analytics</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching social media analytics"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Followers</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatNumber(analytics.overview.totalFollowers)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400">+{analytics.overview.followerGrowth}%</span>
              </div>
            </div>
            <Users className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Engagement</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatNumber(analytics.overview.totalEngagement)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-cyan-400">{analytics.overview.engagementRate}% rate</span>
              </div>
            </div>
            <Heart className="h-5 w-5 text-pink-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Reach</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatNumber(analytics.overview.totalReach)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400">+{analytics.overview.reachGrowth}%</span>
              </div>
            </div>
            <Eye className="h-5 w-5 text-purple-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Impressions</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatNumber(analytics.overview.totalImpressions)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400">+{analytics.overview.impressionsGrowth}%</span>
              </div>
            </div>
            <BarChart3 className="h-5 w-5 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="card-secondary p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Platform Performance</h2>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {analytics.platformBreakdown
            .filter((p: any) => platformFilter === "all" || p.platform === platformFilter)
            .map((platform: any) => (
              <div key={platform.platform} className="card-tertiary p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${getPlatformColor(platform.platform)}`}>
                      {getPlatformIcon(platform.platform)}
                      <span className="text-sm font-medium capitalize">{platform.platform}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-6 flex-1">
                      <div>
                        <p className="text-xs text-muted-foreground">Followers</p>
                        <p className="text-lg font-semibold text-white">{formatNumber(platform.followers)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Growth</p>
                        <div className="flex items-center gap-1">
                          {platform.growth > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-400" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-400" />
                          )}
                          <span className={`text-sm font-semibold ${platform.growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {platform.growth > 0 ? '+' : ''}{platform.growth}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                        <p className="text-lg font-semibold text-white">{formatNumber(platform.engagement)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rate</p>
                        <p className="text-lg font-semibold text-cyan-400">{platform.engagementRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Posts</p>
                    <p className="text-lg font-semibold text-white">{platform.posts}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="card-secondary p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Top Performing Posts</h2>
        <div className="space-y-4">
          {analytics.topPosts.map((post: any, index: number) => (
            <div key={post.id} className="card-tertiary p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                      #{index + 1} Top Post
                    </Badge>
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-md border ${getPlatformColor(post.platform)}`}>
                      {getPlatformIcon(post.platform)}
                      <span className="text-xs font-medium capitalize">{post.platform}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatTimestamp(post.publishedAt)}
                    </div>
                  </div>

                  <p className="text-sm text-white leading-relaxed mb-3">{post.content}</p>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-400" />
                      <span className="text-white">{formatNumber(post.engagement.views)}</span>
                      <span className="text-muted-foreground">views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-400" />
                      <span className="text-white">{post.engagement.likes}</span>
                      <span className="text-muted-foreground">likes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-400" />
                      <span className="text-white">{post.engagement.comments}</span>
                      <span className="text-muted-foreground">comments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-green-400" />
                      <span className="text-white">{post.engagement.shares}</span>
                      <span className="text-muted-foreground">shares</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
