"use client";

import Link from "next/link";
import { Share2, Zap, BarChart3, Users, TrendingUp, MessageSquare, Heart, Loader2, AlertCircle, Eye, Target, Activity } from "lucide-react";
import { useSocialSummary } from "@/hooks/useSocial";

// Mock summary data for fallback
const mockSummary = {
  smoScore: 78,
  smoTrend: "up" as const,
  totalFollowers: 125400,
  totalEngagements: 45230,
  avgEngagementRate: 4.2,
  avgSentiment: 72,
  connectedAccounts: 5,
  positiveMentions: 892,
  negativeMentions: 43,
  neutralMentions: 265,
};

export default function SocialMediaPage() {
  // API integration with SWR
  const { summary: apiSummary, isLoading, isError, error } = useSocialSummary("default-brand");

  // Use API data if available, fallback to mock
  const summary = apiSummary?.summary || mockSummary;

  const modules = [
    { title: "Channels", description: "Manage connected accounts", icon: Share2, href: "/admin/social-media/channels", stat: `${summary.connectedAccounts} connected` },
    { title: "Posting", description: "Schedule and publish content", icon: Zap, href: "/admin/social-media/posting", stat: "12 scheduled" },
    { title: "Engagement", description: "Monitor mentions and replies", icon: MessageSquare, href: "/admin/social-media/engagement", stat: `${summary.positiveMentions + summary.negativeMentions + summary.neutralMentions} mentions` },
    { title: "Analytics", description: "Track performance metrics", icon: BarChart3, href: "/admin/social-media/analytics", stat: `${summary.avgEngagementRate}% engagement` },
    { title: "Algorithm Monitoring", description: "Track platform changes", icon: Activity, href: "/admin/social-media/algorithm-monitoring", stat: "4 changes" },
    { title: "Competitor Tracking", description: "Monitor competitor activity", icon: Target, href: "/admin/social-media/competitor-tracking", stat: "5 tracked" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Social Media</h1>
        <p className="text-muted-foreground mt-1">Manage social channels, content, and performance</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <span className="ml-2 text-muted-foreground">Loading social media data...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-6 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Failed to load social media data</h3>
              <p className="text-sm text-muted-foreground">
                {error?.message || "An error occurred while fetching data. Using cached data."}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && (
      <>
      {/* SMO Score Card */}
      <div className="card-primary p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Social Media Optimization Score</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-white">{summary.smoScore}</span>
              <span className="text-lg text-muted-foreground">/100</span>
              <span className={`flex items-center gap-1 text-sm ${summary.smoTrend === "up" ? "text-green-400" : summary.smoTrend === "down" ? "text-red-400" : "text-gray-400"}`}>
                <TrendingUp className={`h-4 w-4 ${summary.smoTrend === "down" ? "rotate-180" : ""}`} />
                {summary.smoTrend === "up" ? "+5.2%" : summary.smoTrend === "down" ? "-2.1%" : "0%"}
              </span>
            </div>
          </div>
          <div className="h-20 w-20 rounded-full border-4 border-cyan-500/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-cyan-400">{summary.smoScore}</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Followers</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.totalFollowers.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Engagements</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.totalEngagements.toLocaleString()}</p>
            </div>
            <Heart className="h-8 w-8 text-pink-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Engagement Rate</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.avgEngagementRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Sentiment</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.avgSentiment}%</p>
              <p className="text-xs text-green-400">Positive</p>
            </div>
            <Eye className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Module Navigation */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Social Media Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(m => (
            <Link key={m.href} href={m.href}>
              <div className="card-secondary p-6 cursor-pointer hover:ring-2 hover:ring-cyan-500/30 transition-all h-full">
                <m.icon className="h-8 w-8 text-cyan-400 mb-3" />
                <h3 className="text-lg font-semibold text-white">{m.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                <p className="text-xs text-cyan-400 mt-2">{m.stat}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
