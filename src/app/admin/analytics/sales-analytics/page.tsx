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
  DollarSign,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
} from "lucide-react";

// Mock sales analytics data
const salesData = {
  pipeline: {
    totalValue: 487000,
    totalChange: 15.3,
    dealCount: 42,
    avgDealSize: 11595,
    avgDealSizeChange: 6.8,
    byStage: [
      { stage: "Prospecting", count: 12, value: 84000, avgAge: 5 },
      { stage: "Qualification", count: 8, value: 96000, avgAge: 12 },
      { stage: "Proposal", count: 6, value: 108000, avgAge: 18 },
      { stage: "Negotiation", count: 5, value: 95000, avgAge: 23 },
      { stage: "Closing", count: 4, value: 72000, avgAge: 28 },
      { stage: "Won", count: 7, value: 32000, avgAge: 15 },
    ],
  },
  conversions: {
    prospectToQualification: 67,
    qualificationToProposal: 75,
    proposalToNegotiation: 83,
    negotiationToClosing: 80,
    closingToWon: 64,
    overallWinRate: 24,
  },
  performance: {
    dealsWon: 18,
    dealsLost: 12,
    avgSalesCycle: 23,
    avgSalesCycleChange: -12.0,
    revenue: 75600,
    revenueChange: 18.4,
  },
  dealSizeDistribution: [
    { range: "$0-$2k", count: 8, value: 12000, percentage: 16 },
    { range: "$2k-$5k", count: 12, value: 42000, percentage: 24 },
    { range: "$5k-$10k", count: 14, value: 98000, percentage: 28 },
    { range: "$10k-$20k", count: 6, value: 84000, percentage: 12 },
    { range: "$20k+", count: 2, value: 52000, percentage: 4 },
  ],
  topPerformers: [
    {
      name: "Sarah Chen",
      dealsWon: 8,
      revenue: 32400,
      avgDealSize: 4050,
      winRate: 72,
      salesCycle: 18,
    },
    {
      name: "Marcus Johnson",
      dealsWon: 6,
      revenue: 28800,
      avgDealSize: 4800,
      winRate: 68,
      salesCycle: 21,
    },
    {
      name: "Emily Rodriguez",
      dealsWon: 4,
      revenue: 14400,
      avgDealSize: 3600,
      winRate: 58,
      salesCycle: 26,
    },
  ],
  lossReasons: [
    { reason: "Price too high", count: 5, percentage: 42 },
    { reason: "Chose competitor", count: 3, percentage: 25 },
    { reason: "No budget", count: 2, percentage: 17 },
    { reason: "Timing not right", count: 1, percentage: 8 },
    { reason: "Other", count: 1, percentage: 8 },
  ],
  forecast: {
    thisMonth: {
      expected: 68000,
      committed: 45000,
      bestCase: 82000,
      worstCase: 38000,
    },
    nextMonth: {
      expected: 74000,
      committed: 52000,
      bestCase: 89000,
      worstCase: 42000,
    },
    nextQuarter: {
      expected: 220000,
      committed: 165000,
      bestCase: 268000,
      worstCase: 142000,
    },
  },
  sourcePerformance: [
    {
      source: "Website",
      leads: 487,
      conversions: 12,
      conversionRate: 2.5,
      revenue: 28800,
      avgDealSize: 2400,
    },
    {
      source: "Referral",
      leads: 124,
      conversions: 8,
      conversionRate: 6.5,
      revenue: 32400,
      avgDealSize: 4050,
    },
    {
      source: "Paid Ads",
      leads: 342,
      conversions: 6,
      conversionRate: 1.8,
      revenue: 14400,
      avgDealSize: 2400,
    },
    {
      source: "Partner",
      leads: 68,
      conversions: 4,
      conversionRate: 5.9,
      revenue: 18000,
      avgDealSize: 4500,
    },
  ],
};

export default function SalesAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Sales Analytics</h1>
          <p className="text-gray-400 mt-2">
            Pipeline health, conversions, and revenue forecasting
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

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <p className="text-sm text-gray-400">Pipeline Value</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-white">
              ${(salesData.pipeline.totalValue / 1000).toFixed(0)}k
            </p>
            <div
              className={`flex items-center text-sm ${
                salesData.pipeline.totalChange > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {salesData.pipeline.totalChange > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(salesData.pipeline.totalChange)}%
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{salesData.pipeline.dealCount} active deals</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Win Rate</p>
          </div>
          <p className="text-3xl font-bold text-white">{salesData.conversions.overallWinRate}%</p>
          <p className="text-xs text-gray-400 mt-2">
            {salesData.performance.dealsWon}W / {salesData.performance.dealsLost}L
          </p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-purple-400" />
            <p className="text-sm text-gray-400">Avg Sales Cycle</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-white">{salesData.performance.avgSalesCycle}d</p>
            <div
              className={`flex items-center text-sm ${
                salesData.performance.avgSalesCycleChange < 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {salesData.performance.avgSalesCycleChange < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              {Math.abs(salesData.performance.avgSalesCycleChange)}%
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">First contact to close</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-yellow-400" />
            <p className="text-sm text-gray-400">Revenue (30d)</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-white">
              ${(salesData.performance.revenue / 1000).toFixed(1)}k
            </p>
            <div
              className={`flex items-center text-sm ${
                salesData.performance.revenueChange > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {salesData.performance.revenueChange > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(salesData.performance.revenueChange)}%
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Closed won deals</p>
        </Card>
      </div>

      {/* Pipeline by Stage */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Pipeline by Stage</h2>
        <div className="space-y-3">
          {salesData.pipeline.byStage.map((stage, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={
                      stage.stage === "Won"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                    }
                  >
                    {stage.stage}
                  </Badge>
                  <span className="text-sm text-gray-400">
                    {stage.count} deals • ${(stage.value / 1000).toFixed(0)}k
                  </span>
                </div>
                <span className="text-xs text-gray-400">Avg age: {stage.avgAge}d</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    stage.stage === "Won" ? "bg-green-500" : "bg-cyan-500"
                  }`}
                  style={{
                    width: `${(stage.value / salesData.pipeline.totalValue) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Stage Conversion Rates */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Stage-to-Stage Conversion Rates</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">Prospect → Qualification</p>
            <p className="text-2xl font-bold text-white">{salesData.conversions.prospectToQualification}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">Qualification → Proposal</p>
            <p className="text-2xl font-bold text-white">{salesData.conversions.qualificationToProposal}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">Proposal → Negotiation</p>
            <p className="text-2xl font-bold text-white">{salesData.conversions.proposalToNegotiation}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">Negotiation → Closing</p>
            <p className="text-2xl font-bold text-white">{salesData.conversions.negotiationToClosing}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">Closing → Won</p>
            <p className="text-2xl font-bold text-white">{salesData.conversions.closingToWon}%</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deal Size Distribution */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Deal Size Distribution</h2>
          <div className="space-y-3">
            {salesData.dealSizeDistribution.map((dist, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{dist.range}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{dist.count} deals</span>
                    <span className="text-sm font-semibold text-white">
                      ${(dist.value / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${(dist.count / salesData.pipeline.dealCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Loss Reasons */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Loss Reasons Analysis</h2>
          <div className="space-y-3">
            {salesData.lossReasons.map((reason, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{reason.reason}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{reason.count} deals</span>
                    <span className="text-sm font-semibold text-white">{reason.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${reason.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue Forecast */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Revenue Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">This Month</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Expected</span>
                <span className="text-sm font-semibold text-white">
                  ${(salesData.forecast.thisMonth.expected / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Committed</span>
                <span className="text-sm font-semibold text-green-400">
                  ${(salesData.forecast.thisMonth.committed / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Best Case</span>
                <span className="text-sm font-semibold text-cyan-400">
                  ${(salesData.forecast.thisMonth.bestCase / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Worst Case</span>
                <span className="text-sm font-semibold text-red-400">
                  ${(salesData.forecast.thisMonth.worstCase / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Next Month</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Expected</span>
                <span className="text-sm font-semibold text-white">
                  ${(salesData.forecast.nextMonth.expected / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Committed</span>
                <span className="text-sm font-semibold text-green-400">
                  ${(salesData.forecast.nextMonth.committed / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Best Case</span>
                <span className="text-sm font-semibold text-cyan-400">
                  ${(salesData.forecast.nextMonth.bestCase / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Worst Case</span>
                <span className="text-sm font-semibold text-red-400">
                  ${(salesData.forecast.nextMonth.worstCase / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Next Quarter</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Expected</span>
                <span className="text-sm font-semibold text-white">
                  ${(salesData.forecast.nextQuarter.expected / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Committed</span>
                <span className="text-sm font-semibold text-green-400">
                  ${(salesData.forecast.nextQuarter.committed / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Best Case</span>
                <span className="text-sm font-semibold text-cyan-400">
                  ${(salesData.forecast.nextQuarter.bestCase / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Worst Case</span>
                <span className="text-sm font-semibold text-red-400">
                  ${(salesData.forecast.nextQuarter.worstCase / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Performers & Source Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Top Performers</h2>
          <div className="space-y-3">
            {salesData.topPerformers.map((performer, idx) => (
              <div key={idx} className="p-3 bg-gray-900/50 rounded">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">{performer.name}</h3>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-400 border-green-500/20"
                  >
                    {performer.winRate}% win rate
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Deals Won</p>
                    <p className="text-white font-semibold">{performer.dealsWon}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Revenue</p>
                    <p className="text-white font-semibold">
                      ${(performer.revenue / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Avg Deal</p>
                    <p className="text-white font-semibold">${performer.avgDealSize}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Cycle</p>
                    <p className="text-white font-semibold">{performer.salesCycle}d</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Source Performance */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Performance by Source</h2>
          <div className="space-y-3">
            {salesData.sourcePerformance.map((source, idx) => (
              <div key={idx} className="p-3 bg-gray-900/50 rounded">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">{source.source}</h3>
                  <Badge
                    variant="outline"
                    className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                  >
                    {source.conversionRate}% conv
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Leads</p>
                    <p className="text-white font-semibold">{source.leads}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Conversions</p>
                    <p className="text-white font-semibold">{source.conversions}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Revenue</p>
                    <p className="text-white font-semibold">
                      ${(source.revenue / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Avg Deal</p>
                    <p className="text-white font-semibold">${source.avgDealSize}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
