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
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  Link2,
  Quote,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Settings,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataRefreshIndicator } from "@/components/monitor";
import { useCitations, CitationData as APICitationData, CitationTrendPoint as APICitationTrendPoint } from "@/hooks/useMonitor";
import { useSelectedBrand } from "@/stores";

// Loading state component
function CitationsLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading citation data...</p>
      </div>
    </div>
  );
}

// Citation data interfaces
export interface CitationData {
  id: string;
  url: string;
  title: string;
  citations: number;
  lastCited: string;
  platforms: {
    chatgpt?: number;
    claude?: number;
    perplexity?: number;
    gemini?: number;
  };
  context: string;
}

export interface CitationTrendPoint {
  date: string;
  citations: number;
}

export interface PlatformComparisonPoint {
  platform: string;
  name: string;
  icon: string;
  color: string;
  citations: number;
}

// Platform configuration
const platformConfig = {
  chatgpt: { color: "#10A37F", icon: "🤖", name: "ChatGPT" },
  claude: { color: "#D97757", icon: "🅰️", name: "Claude" },
  perplexity: { color: "#20B8CD", icon: "✦", name: "Perplexity" },
  gemini: { color: "#4285F4", icon: "✦", name: "Gemini" },
  grok: { color: "#FFFFFF", icon: "X", name: "Grok" },
};

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Empty state component
function CitationsEmptyState() {
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
            <Link2 className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">Citation Tracking</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">No Citations Yet</h3>
          <p className="text-muted-foreground text-sm">
            Configure your brand monitoring to start tracking which AI platforms cite your content.
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

export default function CitationsPage() {
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<"citations" | "recent">("citations");
  const selectedBrand = useSelectedBrand();

  // Fetch citations from API
  const { data: citationsData, isLoading, refetch, isFetching, dataUpdatedAt } = useCitations(selectedBrand?.id);

  // Transform API data to UI format
  const citations: CitationData[] = React.useMemo(() => {
    if (!citationsData?.citations) return [];
    return citationsData.citations.map((c: APICitationData) => ({
      id: c.id,
      url: c.url,
      title: c.title,
      citations: c.citations,
      lastCited: c.lastCited,
      platforms: c.platforms as CitationData["platforms"],
      context: c.context,
    }));
  }, [citationsData]);

  const citationTrendData: CitationTrendPoint[] = React.useMemo(() => {
    if (!citationsData?.trendData) return [];
    return citationsData.trendData;
  }, [citationsData]);

  // Compute platform comparison data from citations
  const platformComparisonData = React.useMemo((): PlatformComparisonPoint[] => {
    if (citations.length === 0) return [];
    const totals: Record<string, number> = {};
    citations.forEach((c) => {
      Object.entries(c.platforms).forEach(([platform, count]) => {
        if (count) totals[platform] = (totals[platform] || 0) + count;
      });
    });
    return Object.entries(totals)
      .map(([platform, count]) => {
        const config = platformConfig[platform as keyof typeof platformConfig];
        return config ? { platform, name: config.name, icon: config.icon, color: config.color, citations: count } : null;
      })
      .filter((p): p is PlatformComparisonPoint => p !== null)
      .sort((a, b) => b.citations - a.citations);
  }, [citations]);

  const hasData = citations.length > 0;

  const sortedCitations = React.useMemo(() => {
    return [...citations].sort((a, b) => {
      if (sortBy === "citations") return b.citations - a.citations;
      return 0; // For "recent", keep original order
    });
  }, [sortBy, citations]);

  const totalCitations = citations.reduce((sum, c) => sum + c.citations, 0);
  const avgCitationsPerPage = hasData ? Math.round(totalCitations / citations.length) : 0;

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/monitor/analytics">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analytics
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Link2 className="h-6 w-6 text-primary" />
                Citation Analysis
              </h2>
              <p className="text-muted-foreground text-sm">
                Track which AI platforms cite your content most frequently
              </p>
            </div>
          </div>
        </div>
        <CitationsLoadingState />
      </div>
    );
  }

  // Show empty state if no data
  if (!hasData) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/monitor/analytics">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analytics
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Link2 className="h-6 w-6 text-primary" />
                Citation Analysis
              </h2>
              <p className="text-muted-foreground text-sm">
                Track which AI platforms cite your content most frequently
              </p>
            </div>
          </div>
        </div>
        <CitationsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/monitor/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Link2 className="h-6 w-6 text-primary" />
              Citation Analysis
            </h2>
            <p className="text-muted-foreground text-sm">
              Track which AI platforms cite your content most frequently
            </p>
          </div>
        </div>

        {/* Refresh Indicator */}
        <DataRefreshIndicator
          lastUpdated={dataUpdatedAt}
          isFetching={isFetching}
          onRefresh={() => refetch()}
          size="sm"
        />
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Total Citations
              </p>
              <p className="text-3xl font-bold mt-1">{formatNumber(totalCitations)}</p>
            </div>
            <Link2 className="h-8 w-8 text-primary opacity-50" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-sm text-success">
            <TrendingUp className="h-4 w-4" />
            <span>+23% vs last month</span>
          </div>
        </div>

        <div className="card-tertiary">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Cited Pages
          </p>
          <p className="text-2xl font-bold mt-1">{citations.length}</p>
        </div>

        <div className="card-tertiary">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Avg Citations/Page
          </p>
          <p className="text-2xl font-bold mt-1">{avgCitationsPerPage}</p>
        </div>

        <div className="card-tertiary">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Top Platform
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{platformComparisonData[0]?.icon}</span>
            <p className="text-2xl font-bold">{platformComparisonData[0]?.name}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Citation Trend */}
        <div className="card-secondary">
          <h3 className="text-lg font-semibold mb-4">Citation Frequency Trend</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={citationTrendData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="citationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5CC" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00E5CC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(240, 25%, 20%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(220, 15%, 50%)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(220, 15%, 50%)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="glass-tooltip">
                        <p className="font-semibold text-foreground">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          {payload[0].value} citations
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="citations"
                  stroke="#00E5CC"
                  strokeWidth={2}
                  fill="url(#citationGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Comparison */}
        <div className="card-secondary">
          <h3 className="text-lg font-semibold mb-4">Platform Comparison</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={platformComparisonData}
                layout="vertical"
                margin={{ top: 5, right: 80, left: 80, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={({ x, y, payload }) => {
                    const item = platformComparisonData.find(
                      (d) => d.name === payload.value
                    );
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
                  width={75}
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
                          <span className="font-semibold text-foreground">
                            {data.name}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(data.citations)} citations
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="citations" radius={[0, 4, 4, 0]} animationDuration={800}>
                  {platformComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top-Cited Content Table */}
      <div className="card-secondary">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Top-Cited Content
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "citations" | "recent")}
              className="bg-card border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="citations">Most Citations</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Content
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                  Citations
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Platform Breakdown
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Last Cited
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCitations.map((citation) => (
                <React.Fragment key={citation.id}>
                  <tr
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() =>
                      setExpandedRow(expandedRow === citation.id ? null : citation.id)
                    }
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 transition-transform ${
                            expandedRow === citation.id ? "rotate-180" : ""
                          }`}
                        >
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{citation.title}</p>
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {citation.url.replace("https://", "").slice(0, 40)}...
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-2xl font-bold text-primary">
                        {citation.citations}
                      </span>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="flex items-center justify-center gap-3">
                        {Object.entries(citation.platforms).map(([platform, count]) => {
                          const config =
                            platformConfig[platform as keyof typeof platformConfig];
                          if (!config) return null;
                          return (
                            <div
                              key={platform}
                              className="flex items-center gap-1"
                              title={`${config.name}: ${count} citations`}
                            >
                              <span className="text-sm">{config.icon}</span>
                              <span
                                className="text-xs font-medium"
                                style={{ color: config.color }}
                              >
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-muted-foreground">
                      {citation.lastCited}
                    </td>
                  </tr>
                  {/* Context Snippet Row */}
                  {expandedRow === citation.id && (
                    <tr className="bg-muted/20">
                      <td colSpan={4} className="py-4 px-4">
                        <div className="flex items-start gap-3 ml-7">
                          <Quote className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground italic">
                              &quot;{citation.context}&quot;
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Sample context snippet from AI responses
                            </p>
                          </div>
                        </div>
                        {/* Mobile Platform Breakdown */}
                        <div className="flex items-center gap-4 mt-4 ml-7 md:hidden">
                          {Object.entries(citation.platforms).map(([platform, count]) => {
                            const config =
                              platformConfig[platform as keyof typeof platformConfig];
                            if (!config) return null;
                            return (
                              <div key={platform} className="flex items-center gap-1">
                                <span className="text-sm">{config.icon}</span>
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: config.color }}
                                >
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
