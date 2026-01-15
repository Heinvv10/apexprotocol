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
  Search,
  TrendingUp,
  TrendingDown,
  Globe,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useSEOPlatforms } from "@/hooks/useSEO";

// Mock platform monitoring data
const searchConsoleData = {
  lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  totalImpressions: 45230,
  totalClicks: 3420,
  avgCTR: 7.56,
  avgPosition: 12.4,
  trends: {
    impressions: 18,
    clicks: 12,
    ctr: -3,
    position: -8,
  },
};

const indexingStatus = {
  totalPages: 127,
  indexedPages: 118,
  notIndexed: 9,
  lastCrawled: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  crawlErrors: 3,
  issues: [
    {
      type: "Soft 404",
      pages: 2,
      status: "warning",
      description: "Pages returning 404 content but 200 status code",
    },
    {
      type: "Redirect Error",
      pages: 1,
      status: "warning",
      description: "Redirect chain too long",
    },
    {
      type: "Server Error",
      pages: 6,
      status: "error",
      description: "Pages returning 5xx status codes",
    },
  ],
};

const mobileUsability = {
  score: 94,
  status: "good",
  issues: [
    {
      type: "Clickable elements too close",
      pages: 2,
      severity: "warning",
      description: "Touch targets less than 48px apart",
    },
    {
      type: "Content wider than screen",
      pages: 0,
      severity: "pass",
      description: "No horizontal scrolling detected",
    },
    {
      type: "Text too small to read",
      pages: 1,
      severity: "warning",
      description: "Font size below 12px on mobile",
    },
    {
      type: "Viewport not set",
      pages: 0,
      severity: "pass",
      description: "Viewport meta tag present on all pages",
    },
  ],
};

const searchFeatures = [
  {
    name: "Rich Results",
    status: "active",
    pages: 78,
    impressions: 12400,
    clicks: 890,
    ctr: 7.2,
    types: ["FAQ", "HowTo", "Article"],
  },
  {
    name: "Sitelinks",
    status: "active",
    pages: 1,
    impressions: 8200,
    clicks: 420,
    ctr: 5.1,
    types: ["Homepage"],
  },
  {
    name: "Featured Snippets",
    status: "occasional",
    pages: 23,
    impressions: 5600,
    clicks: 340,
    ctr: 6.1,
    types: ["FAQ", "Tutorial"],
  },
  {
    name: "Knowledge Panel",
    status: "not_eligible",
    pages: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    types: [],
  },
  {
    name: "Video Carousel",
    status: "not_eligible",
    pages: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    types: [],
  },
];

const topQueries = [
  {
    query: "GEO optimization",
    impressions: 8400,
    clicks: 640,
    ctr: 7.6,
    position: 3.2,
    trend: "up",
  },
  {
    query: "AI search optimization",
    impressions: 6200,
    clicks: 480,
    ctr: 7.7,
    position: 4.1,
    trend: "up",
  },
  {
    query: "ChatGPT SEO",
    impressions: 12800,
    clicks: 890,
    ctr: 7.0,
    position: 5.8,
    trend: "down",
  },
  {
    query: "Perplexity AI citations",
    impressions: 3400,
    clicks: 290,
    ctr: 8.5,
    position: 2.3,
    trend: "up",
  },
  {
    query: "generative engine ranking",
    impressions: 5800,
    clicks: 420,
    ctr: 7.2,
    position: 4.5,
    trend: "stable",
  },
];

const topPages = [
  {
    url: "/features/geo-optimization",
    impressions: 9200,
    clicks: 720,
    ctr: 7.8,
    position: 2.1,
    trend: "up",
  },
  {
    url: "/blog/getting-started-with-geo",
    impressions: 7400,
    clicks: 560,
    ctr: 7.6,
    position: 3.4,
    trend: "up",
  },
  {
    url: "/blog/chatgpt-seo-guide",
    impressions: 11200,
    clicks: 780,
    ctr: 7.0,
    position: 5.2,
    trend: "down",
  },
  {
    url: "/features/citation-tracking",
    impressions: 4100,
    clicks: 340,
    ctr: 8.3,
    position: 2.8,
    trend: "up",
  },
  {
    url: "/pricing",
    impressions: 6800,
    clicks: 520,
    ctr: 7.6,
    position: 3.9,
    trend: "stable",
  },
];

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours === 0) return "Just now";
  if (diffHours === 1) return "1h ago";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function PlatformMonitoringPage() {
  const [dateRange, setDateRange] = useState("30d");

  // API data with fallback to mock data
  const { platforms, isLoading, isError, error } = useSEOPlatforms();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Platform Monitoring</h1>
          <p className="text-gray-400 mt-2">
            Google Search visibility, indexing, and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] bg-gray-900 border-gray-700">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="border-gray-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading platform data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load platform data</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching SEO platforms"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading and no error */}
      {!isLoading && !isError && (
        <>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Total Impressions</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatNumber(searchConsoleData.totalImpressions)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {searchConsoleData.trends.impressions > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">
                  +{searchConsoleData.trends.impressions}%
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">
                  {searchConsoleData.trends.impressions}%
                </span>
              </>
            )}
            <span className="text-xs text-gray-400 ml-1">vs last period</span>
          </div>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-purple-400" />
            <p className="text-sm text-gray-400">Total Clicks</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatNumber(searchConsoleData.totalClicks)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {searchConsoleData.trends.clicks > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">
                  +{searchConsoleData.trends.clicks}%
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">
                  {searchConsoleData.trends.clicks}%
                </span>
              </>
            )}
            <span className="text-xs text-gray-400 ml-1">vs last period</span>
          </div>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <p className="text-sm text-gray-400">Avg CTR</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {searchConsoleData.avgCTR}%
          </p>
          <div className="flex items-center gap-1 mt-1">
            {searchConsoleData.trends.ctr > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">
                  +{searchConsoleData.trends.ctr}%
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">
                  {searchConsoleData.trends.ctr}%
                </span>
              </>
            )}
            <span className="text-xs text-gray-400 ml-1">vs last period</span>
          </div>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Avg Position</p>
          </div>
          <p className="text-3xl font-bold text-white">
            #{searchConsoleData.avgPosition}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {searchConsoleData.trends.position < 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">
                  {searchConsoleData.trends.position}%
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">
                  +{searchConsoleData.trends.position}%
                </span>
              </>
            )}
            <span className="text-xs text-gray-400 ml-1">vs last period</span>
          </div>
        </Card>
      </div>

      {/* Indexing Status */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Indexing Status</h3>
          <Badge variant="outline" className="bg-gray-700/50 text-gray-300 border-gray-600">
            Last crawled: {formatTimestamp(indexingStatus.lastCrawled)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">Total Pages</p>
            <p className="text-3xl font-bold text-white">{indexingStatus.totalPages}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Indexed</p>
            <p className="text-3xl font-bold text-green-400">
              {indexingStatus.indexedPages}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {((indexingStatus.indexedPages / indexingStatus.totalPages) * 100).toFixed(1)}%
              of total
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Not Indexed</p>
            <p className="text-3xl font-bold text-yellow-400">
              {indexingStatus.notIndexed}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {indexingStatus.crawlErrors} crawl errors
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-white mb-3">Indexing Issues</p>
          <div className="space-y-2">
            {indexingStatus.issues.map((issue, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {issue.status === "error" ? (
                    <XCircle className="h-5 w-5 text-red-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{issue.type}</p>
                    <p className="text-xs text-gray-400">{issue.description}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    issue.status === "error"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  }
                >
                  {issue.pages} {issue.pages === 1 ? "page" : "pages"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Mobile Usability */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Smartphone className="h-6 w-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Mobile Usability</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Score:</span>
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-400 border-green-500/20"
            >
              {mobileUsability.score}/100
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          {mobileUsability.issues.map((issue, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700"
            >
              <div className="flex items-center gap-3">
                {issue.severity === "pass" ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{issue.type}</p>
                  <p className="text-xs text-gray-400">{issue.description}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  issue.severity === "pass"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : issue.pages > 0
                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                }
              >
                {issue.severity === "pass"
                  ? "Passed"
                  : `${issue.pages} ${issue.pages === 1 ? "issue" : "issues"}`}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Search Features */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Search Feature Eligibility</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchFeatures.map((feature) => (
            <Card key={feature.name} className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-white">{feature.name}</h4>
                <Badge
                  variant="outline"
                  className={
                    feature.status === "active"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : feature.status === "occasional"
                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                  }
                >
                  {feature.status === "active"
                    ? "Active"
                    : feature.status === "occasional"
                      ? "Occasional"
                      : "Not Eligible"}
                </Badge>
              </div>

              {feature.status !== "not_eligible" ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Impressions</p>
                      <p className="text-sm font-semibold text-white">
                        {formatNumber(feature.impressions)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Clicks</p>
                      <p className="text-sm font-semibold text-white">
                        {formatNumber(feature.clicks)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">CTR</p>
                    <p className="text-sm font-semibold text-cyan-400">{feature.ctr}%</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Active Types</p>
                    <div className="flex flex-wrap gap-1">
                      {feature.types.map((type) => (
                        <Badge
                          key={type}
                          variant="outline"
                          className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs"
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">
                  Not currently eligible for this search feature
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Top Queries */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Top Performing Queries</h3>
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="space-y-3">
            {topQueries.map((query, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-white">{query.query}</p>
                    {query.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : query.trend === "down" ? (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Impressions</p>
                      <p className="text-sm font-semibold text-white">
                        {formatNumber(query.impressions)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Clicks</p>
                      <p className="text-sm font-semibold text-white">
                        {formatNumber(query.clicks)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">CTR</p>
                      <p className="text-sm font-semibold text-cyan-400">{query.ctr}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Position</p>
                      <p className="text-sm font-semibold text-white">#{query.position}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Pages */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Top Performing Pages</h3>
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="space-y-3">
            {topPages.map((page, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm text-cyan-400">{page.url}</code>
                    {page.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : page.trend === "down" ? (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-6 w-6 p-0"
                      asChild
                    >
                      <a href={page.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Impressions</p>
                      <p className="text-sm font-semibold text-white">
                        {formatNumber(page.impressions)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Clicks</p>
                      <p className="text-sm font-semibold text-white">
                        {formatNumber(page.clicks)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">CTR</p>
                      <p className="text-sm font-semibold text-cyan-400">{page.ctr}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Position</p>
                      <p className="text-sm font-semibold text-white">#{page.position}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}
