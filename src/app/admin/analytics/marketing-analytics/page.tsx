"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Mail,
  Users,
  Target,
  DollarSign,
  MousePointerClick,
  Eye,
  Send,
  RefreshCw,
  Download,
  AlertCircle,
} from "lucide-react";
import { useMarketingMetrics } from "@/hooks/useAnalytics";

// Mock marketing analytics data
const marketingData = {
  overview: {
    totalSpend: 28500,
    totalSpendChange: 12.3,
    leadsGenerated: 1847,
    leadsGeneratedChange: 23.4,
    costPerLead: 15.43,
    costPerLeadChange: -8.9,
    roi: 3.2,
    roiChange: 15.6,
  },
  emailPerformance: {
    totalSent: 45230,
    openRate: 24.5,
    openRateChange: 2.3,
    clickRate: 3.8,
    clickRateChange: 0.5,
    unsubscribeRate: 0.4,
    unsubscribeRateChange: -0.1,
    bounceRate: 1.2,
    bounceRateChange: 0.2,
  },
  campaignPerformance: [
    {
      id: "camp_001",
      name: "Q1 Product Launch",
      type: "email",
      status: "completed",
      spend: 8500,
      leads: 487,
      conversions: 24,
      revenue: 57600,
      roi: 6.8,
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "camp_002",
      name: "Webinar Series",
      type: "webinar",
      status: "active",
      spend: 6200,
      leads: 342,
      conversions: 18,
      revenue: 43200,
      roi: 7.0,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "camp_003",
      name: "Content Marketing",
      type: "content",
      status: "active",
      spend: 4800,
      leads: 624,
      conversions: 12,
      revenue: 28800,
      roi: 6.0,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "camp_004",
      name: "Paid Social Ads",
      type: "social",
      status: "active",
      spend: 5400,
      leads: 234,
      conversions: 8,
      revenue: 19200,
      roi: 3.6,
      startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "camp_005",
      name: "Partner Co-Marketing",
      type: "partner",
      status: "completed",
      spend: 3600,
      leads: 160,
      conversions: 14,
      revenue: 33600,
      roi: 9.3,
      startDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  channelPerformance: [
    {
      channel: "Email",
      spend: 12400,
      leads: 847,
      conversions: 42,
      revenue: 100800,
      roi: 8.1,
      costPerLead: 14.64,
    },
    {
      channel: "Paid Ads",
      spend: 8200,
      leads: 423,
      conversions: 18,
      revenue: 43200,
      roi: 5.3,
      costPerLead: 19.39,
    },
    {
      channel: "Content",
      spend: 4800,
      leads: 342,
      conversions: 12,
      revenue: 28800,
      roi: 6.0,
      costPerLead: 14.04,
    },
    {
      channel: "Webinars",
      spend: 3100,
      leads: 235,
      conversions: 15,
      revenue: 36000,
      roi: 11.6,
      costPerLead: 13.19,
    },
  ],
  contentPerformance: [
    {
      title: "Ultimate Guide to GEO Optimization",
      type: "Blog Post",
      views: 8420,
      leads: 124,
      conversions: 8,
      conversionRate: 6.5,
      publishedDays: 12,
    },
    {
      title: "AI Search Best Practices Webinar",
      type: "Webinar",
      views: 542,
      leads: 87,
      conversions: 12,
      conversionRate: 13.8,
      publishedDays: 8,
    },
    {
      title: "ChatGPT Visibility Case Study",
      type: "Case Study",
      views: 3240,
      leads: 68,
      conversions: 5,
      conversionRate: 7.4,
      publishedDays: 20,
    },
    {
      title: "Platform Comparison Whitepaper",
      type: "Whitepaper",
      views: 1820,
      leads: 92,
      conversions: 9,
      conversionRate: 9.8,
      publishedDays: 15,
    },
    {
      title: "GEO Quick Start Template",
      type: "Template",
      views: 5640,
      leads: 156,
      conversions: 6,
      conversionRate: 3.8,
      publishedDays: 5,
    },
  ],
  audienceGrowth: {
    totalContacts: 12847,
    newThisMonth: 487,
    activeSubscribers: 11234,
    unsubscribedThisMonth: 52,
    growthRate: 3.9,
  },
  funnelMetrics: {
    visitors: 45230,
    leads: 1847,
    mql: 342,
    sql: 87,
    customers: 24,
    visitorToLeadRate: 4.1,
    leadToMqlRate: 18.5,
    mqlToSqlRate: 25.4,
    sqlToCustomerRate: 27.6,
  },
};

function formatCurrency(amount: number) {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount}`;
}

function formatDate(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function MarketingAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [campaignFilter, setCampaignFilter] = useState("all");

  // API data with fallback to mock data
  const { metrics, isLoading, isError, error } = useMarketingMetrics();

  // Use API data if available, otherwise use mock
  const data = metrics ?? marketingData;

  // Filter campaigns
  const filteredCampaigns = data.campaignPerformance.filter((campaign) => {
    if (campaignFilter === "all") return true;
    if (campaignFilter === "active") return campaign.status === "active";
    if (campaignFilter === "completed") return campaign.status === "completed";
    return campaign.type === campaignFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Marketing Analytics</h1>
          <p className="text-gray-400 mt-2">
            Campaign performance, ROI, and channel effectiveness
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] bg-gray-900 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-gray-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading marketing metrics...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load marketing metrics</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching marketing metrics"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading and no error */}
      {!isLoading && !isError && (
        <>
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Spend</p>
            <DollarSign className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-white">
              {formatCurrency(data.overview.totalSpend)}
            </p>
            <div className="flex items-center gap-1 text-sm">
              {data.overview.totalSpendChange > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-red-400" />
                  <span className="text-red-400">
                    {data.overview.totalSpendChange}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-green-400" />
                  <span className="text-green-400">
                    {Math.abs(data.overview.totalSpendChange)}%
                  </span>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Leads Generated</p>
            <Users className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-white">
              {data.overview.leadsGenerated.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-green-400">
                {data.overview.leadsGeneratedChange}%
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Cost per Lead</p>
            <Target className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-white">
              ${data.overview.costPerLead.toFixed(2)}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <TrendingDown className="h-4 w-4 text-green-400" />
              <span className="text-green-400">
                {Math.abs(data.overview.costPerLeadChange)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Avg across channels</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Marketing ROI</p>
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-white">
              {data.overview.roi.toFixed(1)}x
            </p>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-green-400">
                {data.overview.roiChange}%
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Revenue / Spend</p>
        </Card>
      </div>

      {/* Email Performance Metrics */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Email Performance</h2>
          <Mail className="h-5 w-5 text-cyan-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Sent</p>
            <p className="text-2xl font-bold text-white">
              {data.emailPerformance.totalSent.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Open Rate</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">
                {data.emailPerformance.openRate}%
              </p>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-green-400">
                  {data.emailPerformance.openRateChange}%
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Click Rate</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">
                {data.emailPerformance.clickRate}%
              </p>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-green-400">
                  {data.emailPerformance.clickRateChange}%
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Unsub Rate</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">
                {data.emailPerformance.unsubscribeRate}%
              </p>
              <div className="flex items-center gap-1 text-xs">
                <TrendingDown className="h-3 w-3 text-green-400" />
                <span className="text-green-400">
                  {Math.abs(data.emailPerformance.unsubscribeRateChange)}%
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Bounce Rate</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">
                {data.emailPerformance.bounceRate}%
              </p>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-red-400" />
                <span className="text-red-400">
                  {data.emailPerformance.bounceRateChange}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Campaign Performance */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Campaign Performance</h2>
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-[140px] bg-gray-900 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="webinar">Webinar</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="content">Content</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{campaign.name}</h3>
                    <Badge
                      variant="outline"
                      className={
                        campaign.status === "active"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      }
                    >
                      {campaign.status.toUpperCase()}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-purple-500/10 text-purple-400 border-purple-500/20"
                    >
                      {campaign.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400">
                    {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">ROI</p>
                  <p className="text-2xl font-bold text-green-400">{campaign.roi.toFixed(1)}x</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Spend</p>
                  <p className="text-sm font-semibold text-white">
                    {formatCurrency(campaign.spend)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Leads</p>
                  <p className="text-sm font-semibold text-white">{campaign.leads}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Conversions</p>
                  <p className="text-sm font-semibold text-white">{campaign.conversions}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Revenue</p>
                  <p className="text-sm font-semibold text-white">
                    {formatCurrency(campaign.revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Cost/Lead</p>
                  <p className="text-sm font-semibold text-white">
                    ${(campaign.spend / campaign.leads).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Channel Performance and Content Performance side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Channel Performance</h2>
          <div className="space-y-3">
            {data.channelPerformance.map((channel, index) => (
              <div key={index} className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">{channel.channel}</h3>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-400 border-green-500/20"
                  >
                    {channel.roi.toFixed(1)}x ROI
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400 mb-1">Spend</p>
                    <p className="font-semibold text-white">{formatCurrency(channel.spend)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Leads</p>
                    <p className="font-semibold text-white">{channel.leads}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">CPL</p>
                    <p className="font-semibold text-white">${channel.costPerLead.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Content Performance */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Top Content Performance</h2>
          <div className="space-y-3">
            {data.contentPerformance.map((content, index) => (
              <div key={index} className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{content.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs"
                      >
                        {content.type}
                      </Badge>
                      <span className="text-xs text-gray-400">{content.publishedDays}d ago</span>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-lg font-bold text-green-400">
                      {content.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400 mb-1">Views</p>
                    <p className="font-semibold text-white">
                      {content.views.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Leads</p>
                    <p className="font-semibold text-white">{content.leads}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Conv</p>
                    <p className="font-semibold text-white">{content.conversions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Marketing Funnel and Audience Growth side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketing Funnel */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Marketing Funnel</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm text-gray-400">Visitors</span>
                </div>
                <span className="text-lg font-bold text-white">
                  {data.funnelMetrics.visitors.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-cyan-500 h-3 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm text-gray-400">Leads</span>
                  <Badge
                    variant="outline"
                    className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs"
                  >
                    {data.funnelMetrics.visitorToLeadRate}%
                  </Badge>
                </div>
                <span className="text-lg font-bold text-white">
                  {data.funnelMetrics.leads.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-cyan-500 h-3 rounded-full"
                  style={{
                    width: `${(data.funnelMetrics.leads / data.funnelMetrics.visitors) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-400">MQL</span>
                  <Badge
                    variant="outline"
                    className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs"
                  >
                    {data.funnelMetrics.leadToMqlRate}%
                  </Badge>
                </div>
                <span className="text-lg font-bold text-white">
                  {data.funnelMetrics.mql.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full"
                  style={{
                    width: `${(data.funnelMetrics.mql / data.funnelMetrics.visitors) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-400">SQL</span>
                  <Badge
                    variant="outline"
                    className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs"
                  >
                    {data.funnelMetrics.mqlToSqlRate}%
                  </Badge>
                </div>
                <span className="text-lg font-bold text-white">
                  {data.funnelMetrics.sql.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full"
                  style={{
                    width: `${(data.funnelMetrics.sql / data.funnelMetrics.visitors) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-400">Customers</span>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-400 border-green-500/20 text-xs"
                  >
                    {data.funnelMetrics.sqlToCustomerRate}%
                  </Badge>
                </div>
                <span className="text-lg font-bold text-white">
                  {data.funnelMetrics.customers.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{
                    width: `${(data.funnelMetrics.customers / data.funnelMetrics.visitors) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Audience Growth */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Audience Growth</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Total Contacts</p>
              <p className="text-3xl font-bold text-white">
                {data.audienceGrowth.totalContacts.toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">New This Month</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold text-green-400">
                    +{data.audienceGrowth.newThisMonth}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Unsubscribed</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold text-red-400">
                    -{data.audienceGrowth.unsubscribedThisMonth}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Active Subscribers</p>
              <p className="text-2xl font-bold text-white">
                {data.audienceGrowth.activeSubscribers.toLocaleString()}
              </p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full"
                  style={{
                    width: `${(data.audienceGrowth.activeSubscribers / data.audienceGrowth.totalContacts) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {((data.audienceGrowth.activeSubscribers / data.audienceGrowth.totalContacts) * 100).toFixed(1)}% of total
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Growth Rate</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-lg font-bold text-green-400">
                    {data.audienceGrowth.growthRate}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Month over month</p>
            </div>
          </div>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}
