"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Target,
  BarChart3,
  Calendar,
  Plus,
} from "lucide-react";

// Mock keyword tracking data
const keywords = [
  {
    id: "kw_001",
    keyword: "GEO optimization",
    currentPosition: 1,
    previousPosition: 2,
    trend: "up",
    searchVolume: 2400,
    difficulty: 68,
    traffic: 847,
    clicks: 412,
    ctr: 48.6,
    impressions: 1250,
    addedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    lastChecked: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    url: "/features/geo-optimization",
    category: "product",
  },
  {
    id: "kw_002",
    keyword: "AI search optimization",
    currentPosition: 3,
    previousPosition: 3,
    trend: "stable",
    searchVolume: 1800,
    difficulty: 72,
    traffic: 523,
    clicks: 287,
    ctr: 54.9,
    impressions: 895,
    addedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastChecked: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    url: "/blog/getting-started-with-geo",
    category: "content",
  },
  {
    id: "kw_003",
    keyword: "ChatGPT SEO",
    currentPosition: 5,
    previousPosition: 4,
    trend: "down",
    searchVolume: 3200,
    difficulty: 78,
    traffic: 612,
    clicks: 342,
    ctr: 55.9,
    impressions: 1123,
    addedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastChecked: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    url: "/blog/chatgpt-seo-guide",
    category: "content",
  },
  {
    id: "kw_004",
    keyword: "Perplexity AI citations",
    currentPosition: 2,
    previousPosition: 5,
    trend: "up",
    searchVolume: 980,
    difficulty: 54,
    traffic: 234,
    clicks: 145,
    ctr: 61.9,
    impressions: 456,
    addedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastChecked: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    url: "/features/citation-tracking",
    category: "product",
  },
  {
    id: "kw_005",
    keyword: "generative engine ranking",
    currentPosition: 4,
    previousPosition: 6,
    trend: "up",
    searchVolume: 1500,
    difficulty: 65,
    traffic: 387,
    clicks: 198,
    ctr: 51.2,
    impressions: 723,
    addedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    lastChecked: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    url: "/blog/generative-engine-ranking",
    category: "content",
  },
  {
    id: "kw_006",
    keyword: "AI content optimization",
    currentPosition: 8,
    previousPosition: 7,
    trend: "down",
    searchVolume: 2100,
    difficulty: 71,
    traffic: 298,
    clicks: 167,
    ctr: 56.0,
    impressions: 534,
    addedDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    lastChecked: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    url: "/features/content-optimizer",
    category: "product",
  },
];

// Keyword opportunities (not currently tracked)
const opportunities = [
  {
    keyword: "Claude AI SEO",
    searchVolume: 1200,
    difficulty: 58,
    estimatedTraffic: 340,
    reason: "High relevance, low competition",
    priority: "high",
  },
  {
    keyword: "Gemini search optimization",
    searchVolume: 890,
    difficulty: 52,
    estimatedTraffic: 267,
    reason: "Growing search volume (+120% MoM)",
    priority: "high",
  },
  {
    keyword: "AI search ranking factors",
    searchVolume: 1800,
    difficulty: 74,
    estimatedTraffic: 412,
    reason: "High search volume, relevant audience",
    priority: "medium",
  },
  {
    keyword: "answer engine optimization",
    searchVolume: 650,
    difficulty: 48,
    estimatedTraffic: 198,
    reason: "Low competition, high conversion intent",
    priority: "high",
  },
];

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

export default function KeywordTrackingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [trendFilter, setTrendFilter] = useState("all");

  // Filter keywords
  const filteredKeywords = keywords.filter((kw) => {
    const searchMatch =
      searchQuery === "" ||
      kw.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kw.url.toLowerCase().includes(searchQuery.toLowerCase());

    const categoryMatch = categoryFilter === "all" || kw.category === categoryFilter;

    const trendMatch = trendFilter === "all" || kw.trend === trendFilter;

    return searchMatch && categoryMatch && trendMatch;
  });

  // Calculate summary stats
  const avgPosition =
    keywords.reduce((sum, kw) => sum + kw.currentPosition, 0) / keywords.length;
  const totalTraffic = keywords.reduce((sum, kw) => sum + kw.traffic, 0);
  const totalClicks = keywords.reduce((sum, kw) => sum + kw.clicks, 0);
  const avgCTR = keywords.reduce((sum, kw) => sum + kw.ctr, 0) / keywords.length;
  const improvingKeywords = keywords.filter((kw) => kw.trend === "up").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Keyword Tracking</h1>
          <p className="text-gray-400 mt-2">
            Monitor keyword rankings and search performance
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Keyword
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Tracked Keywords</p>
          </div>
          <p className="text-3xl font-bold text-white">{keywords.length}</p>
          <p className="text-xs text-gray-400 mt-1">{improvingKeywords} improving</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <p className="text-sm text-gray-400">Avg Position</p>
          </div>
          <p className="text-3xl font-bold text-white">#{avgPosition.toFixed(1)}</p>
          <p className="text-xs text-gray-400 mt-1">Across all keywords</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            <p className="text-sm text-gray-400">Total Traffic</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalTraffic.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Total Clicks</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalClicks.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">From search results</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-yellow-400" />
            <p className="text-sm text-gray-400">Avg CTR</p>
          </div>
          <p className="text-3xl font-bold text-white">{avgCTR.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">Click-through rate</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search keywords or URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px] bg-gray-900 border-gray-700">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="content">Content</SelectItem>
            </SelectContent>
          </Select>

          <Select value={trendFilter} onValueChange={setTrendFilter}>
            <SelectTrigger className="w-[140px] bg-gray-900 border-gray-700">
              <SelectValue placeholder="Trend" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trends</SelectItem>
              <SelectItem value="up">Improving</SelectItem>
              <SelectItem value="stable">Stable</SelectItem>
              <SelectItem value="down">Declining</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Keyword List */}
      <div className="space-y-3">
        {filteredKeywords.map((kw) => (
          <Card key={kw.id} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{kw.keyword}</h3>
                  <Badge
                    variant="outline"
                    className={
                      kw.category === "product"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }
                  >
                    {kw.category.toUpperCase()}
                  </Badge>
                  {kw.trend === "up" && (
                    <div className="flex items-center gap-1 text-green-400">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        +{kw.previousPosition - kw.currentPosition}
                      </span>
                    </div>
                  )}
                  {kw.trend === "down" && (
                    <div className="flex items-center gap-1 text-red-400">
                      <TrendingDown className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        -{kw.currentPosition - kw.previousPosition}
                      </span>
                    </div>
                  )}
                </div>
                <code className="text-sm text-cyan-400">{kw.url}</code>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">#{kw.currentPosition}</p>
                <p className="text-xs text-gray-400">Current position</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Search Volume</p>
                <p className="text-sm font-semibold text-white">
                  {kw.searchVolume.toLocaleString()}/mo
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Difficulty</p>
                <p className="text-sm font-semibold text-white">{kw.difficulty}/100</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Traffic</p>
                <p className="text-sm font-semibold text-white">{kw.traffic}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Clicks</p>
                <p className="text-sm font-semibold text-white">{kw.clicks}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">CTR</p>
                <p className="text-sm font-semibold text-white">{kw.ctr.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Last Checked</p>
                <p className="text-sm font-semibold text-white">
                  {formatTimestamp(kw.lastChecked)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredKeywords.length === 0 && (
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <div className="text-center">
            <Target className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">No keywords found</h3>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </Card>
      )}

      {/* Keyword Opportunities */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Keyword Opportunities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp, idx) => (
            <Card key={idx} className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{opp.keyword}</h3>
                  <p className="text-sm text-gray-400">{opp.reason}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    opp.priority === "high"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  }
                >
                  {opp.priority.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Volume</p>
                  <p className="text-sm font-semibold text-white">
                    {opp.searchVolume.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Difficulty</p>
                  <p className="text-sm font-semibold text-white">{opp.difficulty}/100</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Est. Traffic</p>
                  <p className="text-sm font-semibold text-white">{opp.estimatedTraffic}</p>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Track Keyword
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
