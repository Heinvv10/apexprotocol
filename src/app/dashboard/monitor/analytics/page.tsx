"use client";

import * as React from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Link2,
  Sparkles,
  Settings,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Analytics data point interface
export interface AnalyticsDataPoint {
  date: string;
  displayDate: string;
  chatgpt: number;
  claude: number;
  perplexity: number;
  gemini: number;
  total: number;
}

// Deterministic number formatting (avoids hydration issues)
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Empty state component
function AnalyticsEmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">Analytics Dashboard</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">No Analytics Data Yet</h3>
          <p className="text-muted-foreground text-sm">
            Configure your brand monitoring to start tracking mention trends and platform analytics.
          </p>
        </div>

        <Link
          href="/dashboard/monitor/settings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
        >
          <Settings className="w-4 h-4" />
          Configure Monitoring
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const total = payload.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="glass-tooltip">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground capitalize">{entry.name}</span>
            </div>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
        <div className="border-t border-border mt-2 pt-2 flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold text-primary">{total}</span>
        </div>
      </div>
    </div>
  );
}

// Time range options
type TimeRange = "7d" | "14d" | "30d" | "90d";

const timeRangeLabels: Record<TimeRange, string> = {
  "7d": "7 Days",
  "14d": "14 Days",
  "30d": "30 Days",
  "90d": "90 Days",
};

export default function AnalyticsPage() {
  // TODO: Fetch analytics data from API endpoint
  // const { data: analyticsData } = useQuery(['analytics'], fetchAnalytics);
  const [data] = React.useState<AnalyticsDataPoint[]>([]); // Empty array - no mock data
  const [timeRange, setTimeRange] = React.useState<TimeRange>("30d");

  const hasData = data.length > 0;

  // Filter data based on time range
  const filteredData = React.useMemo(() => {
    const days = parseInt(timeRange);
    return data.slice(-days);
  }, [data, timeRange]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const current = filteredData.slice(-7);
    const previous = filteredData.slice(-14, -7);

    const currentTotal = current.reduce((sum, d) => sum + d.total, 0);
    const previousTotal = previous.reduce((sum, d) => sum + d.total, 0);
    const change = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

    const avgDaily = Math.round(currentTotal / current.length);
    const peak = Math.max(...current.map(d => d.total));

    return {
      total: currentTotal,
      change: Math.round(change),
      avgDaily,
      peak,
    };
  }, [filteredData]);

  // Platform configuration with colors and icons
  const platformConfig = {
    chatgpt: { color: "#10A37F", icon: "🤖", name: "ChatGPT" },
    claude: { color: "#D97757", icon: "🅰️", name: "Claude" },
    perplexity: { color: "#20B8CD", icon: "✦", name: "Perplexity" },
    gemini: { color: "#4285F4", icon: "✦", name: "Gemini" },
  };

  // Platform colors matching the logo/brand
  const platformColors = {
    chatgpt: platformConfig.chatgpt.color,
    claude: platformConfig.claude.color,
    perplexity: platformConfig.perplexity.color,
    gemini: platformConfig.gemini.color,
  };

  // Platform breakdown data for bar chart (sorted by volume descending)
  const platformBreakdownData = React.useMemo(() => {
    return Object.entries(platformConfig)
      .map(([key, config]) => {
        const total = filteredData.reduce(
          (sum, d) => sum + (d[key as keyof typeof d] as number || 0),
          0
        );
        const percentage = stats.total > 0 ? Math.round((total / stats.total) * 100) : 0;
        return {
          platform: key,
          name: config.name,
          icon: config.icon,
          color: config.color,
          total,
          percentage,
          label: `${formatNumber(total)} (${percentage}%)`,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredData, stats, platformConfig]);

  // Sentiment data - TODO: Fetch from database
  // Currently returns empty placeholders until sentiment analysis is implemented
  const sentimentData = React.useMemo(() => {
    // Return empty sentiment data - will be populated from database
    return [
      {
        name: "Positive",
        value: 0,
        color: "hsl(160, 84%, 45%)", // Green
        percentage: 0,
      },
      {
        name: "Neutral",
        value: 0,
        color: "hsl(220, 15%, 50%)", // Grey
        percentage: 0,
      },
      {
        name: "Negative",
        value: 0,
        color: "hsl(0, 72%, 51%)", // Red
        percentage: 0,
      },
    ];
  }, []);

  // Show empty state if no data
  if (!hasData) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/monitor">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Monitor
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Analytics
              </h2>
              <p className="text-muted-foreground text-sm">
                Track brand mention trends over time
              </p>
            </div>
          </div>
        </div>
        <AnalyticsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/monitor">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Monitor
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Analytics
            </h2>
            <p className="text-muted-foreground text-sm">
              Track brand mention trends over time
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/monitor/analytics/citations">
            <Button variant="outline" size="sm">
              <Link2 className="h-4 w-4 mr-2" />
              Citation Analysis
            </Button>
          </Link>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {timeRangeLabels[range]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Total Mentions
              </p>
              <p className="text-3xl font-bold mt-1">{formatNumber(stats.total)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary opacity-50" />
          </div>
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            stats.change >= 0 ? "text-success" : "text-error"
          }`}>
            {stats.change >= 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span>{Math.abs(stats.change)}% vs previous period</span>
          </div>
        </div>

        <div className="card-tertiary">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Avg Daily Mentions
          </p>
          <p className="text-2xl font-bold mt-1">{stats.avgDaily}</p>
        </div>

        <div className="card-tertiary">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Peak Day
          </p>
          <p className="text-2xl font-bold mt-1">{stats.peak}</p>
        </div>

        <div className="card-tertiary">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Time Range
            </p>
          </div>
          <p className="text-2xl font-bold mt-1">{timeRangeLabels[timeRange]}</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="card-secondary">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Mentions Over Time</h3>
          <div className="flex items-center gap-4 text-xs">
            {Object.entries(platformColors).map(([platform, color]) => (
              <div key={platform} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground capitalize">{platform}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradientChatGPT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={platformColors.chatgpt} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={platformColors.chatgpt} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientClaude" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={platformColors.claude} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={platformColors.claude} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientPerplexity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={platformColors.perplexity} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={platformColors.perplexity} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientGemini" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={platformColors.gemini} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={platformColors.gemini} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(240, 25%, 20%)"
                vertical={false}
              />

              <XAxis
                dataKey="displayDate"
                stroke="hsl(220, 15%, 50%)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
              />

              <YAxis
                stroke="hsl(220, 15%, 50%)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={-10}
                tickFormatter={(value) => `${value}`}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="chatgpt"
                stackId="1"
                stroke={platformColors.chatgpt}
                strokeWidth={2}
                fill="url(#gradientChatGPT)"
              />
              <Area
                type="monotone"
                dataKey="claude"
                stackId="1"
                stroke={platformColors.claude}
                strokeWidth={2}
                fill="url(#gradientClaude)"
              />
              <Area
                type="monotone"
                dataKey="perplexity"
                stackId="1"
                stroke={platformColors.perplexity}
                strokeWidth={2}
                fill="url(#gradientPerplexity)"
              />
              <Area
                type="monotone"
                dataKey="gemini"
                stackId="1"
                stroke={platformColors.gemini}
                strokeWidth={2}
                fill="url(#gradientGemini)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Platform Breakdown - Horizontal Bar Chart */}
      <div className="card-secondary">
        <h3 className="text-lg font-semibold mb-4">Platform Breakdown</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={platformBreakdownData}
              layout="vertical"
              margin={{ top: 5, right: 120, left: 100, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={({ x, y, payload }) => {
                  const item = platformBreakdownData.find(d => d.name === payload.value);
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={-10}
                        y={0}
                        dy={5}
                        textAnchor="end"
                        fill="hsl(220, 15%, 70%)"
                        fontSize={13}
                        fontWeight={500}
                      >
                        {item?.icon} {payload.value}
                      </text>
                    </g>
                  );
                }}
                width={95}
              />
              <Tooltip
                cursor={{ fill: "hsl(240, 25%, 15%)", fillOpacity: 0.5 }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="glass-tooltip">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{data.icon}</span>
                        <span className="font-semibold text-foreground">{data.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(data.total)} mentions
                      </p>
                      <p className="text-sm font-medium" style={{ color: data.color }}>
                        {data.percentage}% of total
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="total"
                radius={[0, 4, 4, 0]}
                animationDuration={800}
              >
                {platformBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="label"
                  position="right"
                  fill="hsl(220, 15%, 70%)"
                  fontSize={12}
                  fontWeight={500}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-secondary">
          <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="glass-tooltip">
                        <p className="font-semibold text-foreground">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(data.value)} mentions
                        </p>
                        <p className="text-sm font-medium text-primary">
                          {data.percentage}%
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {formatNumber(sentimentData.reduce((sum, d) => sum + d.value, 0))}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total
                </p>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            {sentimentData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
                <span className="text-sm font-medium">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment Breakdown Cards */}
        <div className="space-y-4">
          {sentimentData.map((item) => (
            <div
              key={item.name}
              className="card-tertiary flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="font-medium">{item.name} Mentions</p>
                  <p className="text-sm text-muted-foreground">
                    {item.percentage}% of total sentiment
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold">{formatNumber(item.value)}</p>
            </div>
          ))}

          {/* Sentiment Insight */}
          <div className="card-primary">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-success">Positive Trend</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your brand sentiment is predominantly positive at{" "}
                  {sentimentData[0].percentage}%. Keep up the great work!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
