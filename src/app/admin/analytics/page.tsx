"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Activity,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useAnalyticsSummary } from "@/hooks/useAnalytics";

export default function AnalyticsPage() {
  // API data with fallback to mock data
  const { summary, isLoading, isError, error } = useAnalyticsSummary();

  // Mock data for fallback
  const mockSummary = {
    totalRevenue: 485000,
    revenueGrowth: 23.4,
    totalLeads: 1247,
    leadsGrowth: 18.9,
    conversionRate: 12.3,
    conversionGrowth: 5.2,
    avgDealSize: 38900,
    dealSizeGrowth: -3.1,
    topChannels: [
      { channel: "Organic Search", revenue: 185000, leads: 487, conversions: 65 },
      { channel: "Paid Ads", revenue: 142000, leads: 356, conversions: 48 },
      { channel: "Email", revenue: 98000, leads: 267, conversions: 32 },
      { channel: "Social Media", revenue: 60000, leads: 137, conversions: 18 },
    ],
    recentActivity: [
      {
        id: "1",
        type: "deal" as const,
        title: "Enterprise Contract - Acme Corp",
        value: 95000,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        type: "lead" as const,
        title: "New lead from website",
        value: 0,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        type: "campaign" as const,
        title: "Q1 Email Campaign launched",
        value: 15000,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };

  // Use API data if available, otherwise fallback to mock
  const data = summary ?? mockSummary;

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours === 0) return "Just now";
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Overview</h1>
        <p className="text-muted-foreground mt-1">Business intelligence and reporting</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load analytics data</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching analytics summary"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading and no error */}
      {!isLoading && !isError && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <Card className="card-secondary p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <Badge
                  variant="outline"
                  className={
                    data.revenueGrowth >= 0
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }
                >
                  {data.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(data.revenueGrowth).toFixed(1)}%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">
                ${(data.totalRevenue / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </Card>

            {/* Total Leads */}
            <Card className="card-secondary p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <Badge
                  variant="outline"
                  className={
                    data.leadsGrowth >= 0
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }
                >
                  {data.leadsGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(data.leadsGrowth).toFixed(1)}%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">{data.totalLeads.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Total Leads</p>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </Card>

            {/* Conversion Rate */}
            <Card className="card-secondary p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Target className="h-5 w-5 text-purple-400" />
                </div>
                <Badge
                  variant="outline"
                  className={
                    data.conversionGrowth >= 0
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }
                >
                  {data.conversionGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(data.conversionGrowth).toFixed(1)}%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">{data.conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-400">Conversion Rate</p>
              <p className="text-xs text-muted-foreground mt-1">Lead to customer</p>
            </Card>

            {/* Avg Deal Size */}
            <Card className="card-secondary p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <Badge
                  variant="outline"
                  className={
                    data.dealSizeGrowth >= 0
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }
                >
                  {data.dealSizeGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(data.dealSizeGrowth).toFixed(1)}%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">
                ${(data.avgDealSize / 1000).toFixed(1)}K
              </p>
              <p className="text-sm text-gray-400">Avg Deal Size</p>
              <p className="text-xs text-muted-foreground mt-1">Per closed deal</p>
            </Card>
          </div>

          {/* Top Channels */}
          <Card className="card-secondary p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Top Channels</h2>
                <p className="text-sm text-gray-400">Revenue by channel</p>
              </div>
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>

            <div className="space-y-4">
              {data.topChannels.map((channel, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          index === 0
                            ? "bg-cyan-400"
                            : index === 1
                            ? "bg-purple-400"
                            : index === 2
                            ? "bg-green-400"
                            : "bg-blue-400"
                        }`}
                      />
                      <span className="text-sm font-medium text-white">{channel.channel}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400">{channel.leads} leads</span>
                      <span className="text-xs text-gray-400">
                        {channel.conversions} conversions
                      </span>
                      <span className="text-sm font-semibold text-white">
                        ${(channel.revenue / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        index === 0
                          ? "bg-gradient-to-r from-cyan-500 to-cyan-600"
                          : index === 1
                          ? "bg-gradient-to-r from-purple-500 to-purple-600"
                          : index === 2
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : "bg-gradient-to-r from-blue-500 to-blue-600"
                      }`}
                      style={{
                        width: `${(channel.revenue / data.topChannels[0].revenue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Activity */}
            <Card className="card-secondary p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                  <p className="text-sm text-gray-400">Latest events</p>
                </div>
              </div>

              <div className="space-y-3">
                {data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        activity.type === "deal"
                          ? "bg-green-500/10"
                          : activity.type === "lead"
                          ? "bg-cyan-500/10"
                          : "bg-purple-500/10"
                      }`}
                    >
                      {activity.type === "deal" ? (
                        <DollarSign className="h-4 w-4 text-green-400" />
                      ) : activity.type === "lead" ? (
                        <Users className="h-4 w-4 text-cyan-400" />
                      ) : (
                        <Target className="h-4 w-4 text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            activity.type === "deal"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : activity.type === "lead"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          }`}
                        >
                          {activity.type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                    {activity.value > 0 && (
                      <span className="text-sm font-semibold text-white">
                        ${(activity.value / 1000).toFixed(0)}K
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Link href="/admin/analytics/executive-dashboard">
                <Card className="card-tertiary p-4 hover:border-cyan-400/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <BarChart3 className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Executive Dashboard</h3>
                        <p className="text-sm text-gray-400">High-level KPIs</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Card>
              </Link>

              <Link href="/admin/analytics/sales-analytics">
                <Card className="card-tertiary p-4 hover:border-green-400/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <DollarSign className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Sales Analytics</h3>
                        <p className="text-sm text-gray-400">Pipeline and deals</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Card>
              </Link>

              <Link href="/admin/analytics/marketing-analytics">
                <Card className="card-tertiary p-4 hover:border-purple-400/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Target className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Marketing Analytics</h3>
                        <p className="text-sm text-gray-400">Campaigns and ROI</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Card>
              </Link>

              <Link href="/admin/analytics/custom-reports">
                <Card className="card-tertiary p-4 hover:border-blue-400/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Activity className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Custom Reports</h3>
                        <p className="text-sm text-gray-400">Build and schedule</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
