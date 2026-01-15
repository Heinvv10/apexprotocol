"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAnalyticsDashboard } from "@/hooks/useAnalytics";
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
  DollarSign,
  Users,
  Target,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";

// Mock executive dashboard data
const executiveData = {
  revenue: {
    mrr: 48500,
    mrrChange: 12.5,
    arr: 582000,
    arrChange: 18.2,
    newMRR: 6500,
    expansionMRR: 2800,
    churnMRR: -1200,
  },
  customers: {
    total: 127,
    totalChange: 8.5,
    new: 12,
    churned: 2,
    churnRate: 1.6,
    netNew: 10,
  },
  leads: {
    total: 1847,
    totalChange: 23.4,
    mql: 342,
    sql: 87,
    conversionRate: 25.4,
    avgLeadScore: 68,
  },
  marketing: {
    campaigns: 15,
    campaignsActive: 8,
    engagement: 12.8,
    engagementChange: 3.2,
    costPerLead: 42,
    costPerLeadChange: -8.5,
  },
  sales: {
    pipeline: 487000,
    pipelineChange: 15.3,
    dealsWon: 18,
    avgDealSize: 4200,
    avgDealSizeChange: 6.8,
    salesCycle: 23,
    salesCycleChange: -12.0,
  },
  platforms: {
    mentions: 2847,
    mentionsChange: 34.2,
    visibility: 78.5,
    visibilityChange: 12.1,
    shareOfVoice: 42.3,
    shareOfVoiceChange: 8.5,
  },
  health: {
    customerHealth: 87,
    nps: 68,
    satisfactionScore: 4.6,
    activeUsers: 94,
  },
};

// Mock trend data (last 7 data points)
const trendData = {
  mrr: [42000, 43200, 44500, 45800, 46500, 47200, 48500],
  customers: [105, 110, 115, 118, 122, 125, 127],
  leads: [1200, 1350, 1450, 1580, 1650, 1720, 1847],
  pipeline: [380000, 400000, 420000, 445000, 460000, 475000, 487000],
  mentions: [1800, 1950, 2100, 2300, 2500, 2650, 2847],
};

// Mock key insights
const keyInsights = [
  {
    id: "insight_001",
    type: "positive",
    category: "Revenue",
    title: "Strong MRR Growth",
    description: "MRR increased by 12.5% this month, driven by new customer acquisition and expansion revenue",
    impact: "high",
  },
  {
    id: "insight_002",
    type: "positive",
    category: "Marketing",
    title: "Platform Visibility Surge",
    description: "AI platform mentions increased by 34.2%, highest growth rate in last 6 months",
    impact: "high",
  },
  {
    id: "insight_003",
    type: "warning",
    category: "Sales",
    title: "Pipeline Conversion Slowing",
    description: "Deal velocity down 8% compared to last month, may need sales process optimization",
    impact: "medium",
  },
  {
    id: "insight_004",
    type: "positive",
    category: "Customers",
    title: "Low Churn Rate",
    description: "Churn rate at 1.6%, well below industry average of 5-7%",
    impact: "medium",
  },
  {
    id: "insight_005",
    type: "warning",
    category: "Marketing",
    title: "Lead Quality Needs Attention",
    description: "MQL to SQL conversion rate dropped from 28% to 25.4%",
    impact: "medium",
  },
];

function getInsightBadge(type: string) {
  switch (type) {
    case "positive":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Positive
        </Badge>
      );
    case "warning":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Needs Attention
        </Badge>
      );
    case "negative":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Critical
        </Badge>
      );
    default:
      return null;
  }
}

function getImpactBadge(impact: string) {
  switch (impact) {
    case "high":
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
          High Impact
        </Badge>
      );
    case "medium":
      return (
        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs">
          Medium Impact
        </Badge>
      );
    case "low":
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs">
          Low Impact
        </Badge>
      );
    default:
      return null;
  }
}

export default function ExecutiveDashboardPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [lastUpdated] = useState(new Date().toISOString());

  // Fetch analytics dashboard data from API
  const { dashboard, isLoading, isError, error } = useAnalyticsDashboard(null);

  // Use API data if available, fallback to mock data
  const hasDashboardData = dashboard && dashboard.geoScore > 0;
  const allData = hasDashboardData ? dashboard : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Executive Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Key metrics, trends, and insights at a glance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] bg-gray-900 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Calendar className="h-4 w-4" />
        <span>Last updated: {new Date(lastUpdated).toLocaleString()}</span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load dashboard data</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching analytics data"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-400" />
          Revenue Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Monthly Recurring Revenue</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">
                ${(executiveData.revenue.mrr / 1000).toFixed(1)}k
              </p>
              <div
                className={`flex items-center text-sm ${
                  executiveData.revenue.mrrChange > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {executiveData.revenue.mrrChange > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(executiveData.revenue.mrrChange)}%
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ARR: ${(executiveData.revenue.arr / 1000).toFixed(0)}k (↑
              {executiveData.revenue.arrChange}%)
            </p>
          </Card>

          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">New MRR</p>
            <p className="text-3xl font-bold text-white">
              ${(executiveData.revenue.newMRR / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-gray-400 mt-2">From new customers</p>
          </Card>

          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Expansion MRR</p>
            <p className="text-3xl font-bold text-white">
              ${(executiveData.revenue.expansionMRR / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-gray-400 mt-2">From upgrades</p>
          </Card>

          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Churn MRR</p>
            <p className="text-3xl font-bold text-red-400">
              ${(Math.abs(executiveData.revenue.churnMRR) / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-gray-400 mt-2">Revenue lost</p>
          </Card>
        </div>
      </div>

      {/* Customer Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-400" />
          Customer Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Total Customers</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">{executiveData.customers.total}</p>
              <div
                className={`flex items-center text-sm ${
                  executiveData.customers.totalChange > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {executiveData.customers.totalChange > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(executiveData.customers.totalChange)}%
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Net new: +{executiveData.customers.netNew} this month
            </p>
          </Card>

          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">New Customers</p>
            <p className="text-3xl font-bold text-white">{executiveData.customers.new}</p>
            <p className="text-xs text-gray-400 mt-2">This month</p>
          </Card>

          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Churned Customers</p>
            <p className="text-3xl font-bold text-red-400">{executiveData.customers.churned}</p>
            <p className="text-xs text-gray-400 mt-2">This month</p>
          </Card>

          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Churn Rate</p>
            <p className="text-3xl font-bold text-white">{executiveData.customers.churnRate}%</p>
            <p className="text-xs text-green-400 mt-2">Below industry avg (5-7%)</p>
          </Card>
        </div>
      </div>

      {/* Lead & Marketing Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-400" />
          Lead & Marketing Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Total Leads</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">
                {(executiveData.leads.total / 1000).toFixed(1)}k
              </p>
              <div
                className={`flex items-center text-sm ${
                  executiveData.leads.totalChange > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {executiveData.leads.totalChange > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(executiveData.leads.totalChange)}%
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Avg score: {executiveData.leads.avgLeadScore}</p>
          </Card>

          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">MQL</p>
            <p className="text-3xl font-bold text-white">{executiveData.leads.mql}</p>
            <p className="text-xs text-gray-400 mt-2">Marketing qualified</p>
          </Card>

          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">SQL</p>
            <p className="text-3xl font-bold text-white">{executiveData.leads.sql}</p>
            <p className="text-xs text-gray-400 mt-2">Sales qualified</p>
          </Card>

          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Conversion Rate</p>
            <p className="text-3xl font-bold text-white">{executiveData.leads.conversionRate}%</p>
            <p className="text-xs text-gray-400 mt-2">MQL to SQL</p>
          </Card>

          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Cost per Lead</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">${executiveData.marketing.costPerLead}</p>
              <div
                className={`flex items-center text-sm ${
                  executiveData.marketing.costPerLeadChange < 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {executiveData.marketing.costPerLeadChange < 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                {Math.abs(executiveData.marketing.costPerLeadChange)}%
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Marketing efficiency</p>
          </Card>
        </div>
      </div>

      {/* Sales & Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-yellow-400" />
            Sales Metrics
          </h2>
          <div className="space-y-3">
            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Pipeline Value</p>
                <div
                  className={`flex items-center text-sm ${
                    executiveData.sales.pipelineChange > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {executiveData.sales.pipelineChange > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(executiveData.sales.pipelineChange)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                ${(executiveData.sales.pipeline / 1000).toFixed(0)}k
              </p>
            </Card>

            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Deals Won This Month</p>
              <p className="text-2xl font-bold text-white">{executiveData.sales.dealsWon}</p>
            </Card>

            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Avg Deal Size</p>
                <div
                  className={`flex items-center text-sm ${
                    executiveData.sales.avgDealSizeChange > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {executiveData.sales.avgDealSizeChange > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(executiveData.sales.avgDealSizeChange)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-white">${executiveData.sales.avgDealSize}</p>
            </Card>

            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Avg Sales Cycle</p>
                <div
                  className={`flex items-center text-sm ${
                    executiveData.sales.salesCycleChange < 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {executiveData.sales.salesCycleChange < 0 ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  {Math.abs(executiveData.sales.salesCycleChange)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{executiveData.sales.salesCycle} days</p>
            </Card>
          </div>
        </div>

        {/* Platform Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            Platform Metrics (AI Visibility)
          </h2>
          <div className="space-y-3">
            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">AI Platform Mentions</p>
                <div
                  className={`flex items-center text-sm ${
                    executiveData.platforms.mentionsChange > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {executiveData.platforms.mentionsChange > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(executiveData.platforms.mentionsChange)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                {(executiveData.platforms.mentions / 1000).toFixed(1)}k
              </p>
            </Card>

            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Visibility Score</p>
                <div
                  className={`flex items-center text-sm ${
                    executiveData.platforms.visibilityChange > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {executiveData.platforms.visibilityChange > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(executiveData.platforms.visibilityChange)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{executiveData.platforms.visibility}%</p>
            </Card>

            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Share of Voice</p>
                <div
                  className={`flex items-center text-sm ${
                    executiveData.platforms.shareOfVoiceChange > 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {executiveData.platforms.shareOfVoiceChange > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(executiveData.platforms.shareOfVoiceChange)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                {executiveData.platforms.shareOfVoice}%
              </p>
            </Card>

            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Customer Health Score</p>
              <p className="text-2xl font-bold text-white">{executiveData.health.customerHealth}/100</p>
              <p className="text-xs text-gray-400 mt-2">
                NPS: {executiveData.health.nps} | Satisfaction: {executiveData.health.satisfactionScore}/5
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-400" />
          Key Insights & Recommendations
        </h2>
        <div className="space-y-3">
          {keyInsights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-start gap-3 p-3 bg-gray-900/50 rounded"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getInsightBadge(insight.type)}
                  {getImpactBadge(insight.impact)}
                  <Badge
                    variant="outline"
                    className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs"
                  >
                    {insight.category}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{insight.title}</h3>
                <p className="text-sm text-gray-400">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
