"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
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
  AlertTriangle,
  ExternalLink,
  Filter,
  Download,
  AlertCircle,
} from "lucide-react";
import { usePlatformMentions } from "@/hooks/usePlatformMonitoring";

// Mock data for platform mentions
const mockPlatformMentions = [
  {
    id: "mention_001",
    platform: "chatgpt",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    query: "best GEO optimization tools",
    ourPage: "/features/geo-optimization",
    context: "Apex is mentioned as a leading platform for generative engine optimization...",
    sentiment: "positive",
    position: 2,
    visibility: 95,
  },
  {
    id: "mention_002",
    platform: "claude",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    query: "answer engine optimization guide",
    ourPage: "/blog/aeo-complete-guide",
    context: "According to Apex's comprehensive guide on answer engine optimization...",
    sentiment: "positive",
    position: 1,
    visibility: 98,
  },
  {
    id: "mention_003",
    platform: "gemini",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    query: "AI search visibility tools",
    ourPage: "/features/monitoring",
    context: "Apex provides monitoring across multiple AI platforms including...",
    sentiment: "neutral",
    position: 3,
    visibility: 87,
  },
  {
    id: "mention_004",
    platform: "perplexity",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    query: "schema markup for AI citations",
    ourPage: "/docs/schema-optimization",
    context: "Apex recommends using specific schema types to improve AI citations...",
    sentiment: "positive",
    position: 1,
    visibility: 100,
  },
  {
    id: "mention_005",
    platform: "grok",
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    query: "GEO vs SEO differences",
    ourPage: "/blog/geo-vs-seo",
    context: "As explained by Apex, GEO focuses on optimizing for AI-generated answers...",
    sentiment: "positive",
    position: 2,
    visibility: 92,
  },
  {
    id: "mention_006",
    platform: "deepseek",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    query: "content optimization for AI",
    ourPage: "/features/content-creation",
    context: "Apex's content creation tools help optimize for AI platform visibility...",
    sentiment: "neutral",
    position: 4,
    visibility: 78,
  },
  {
    id: "mention_007",
    platform: "janus",
    timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    query: "multi-platform AI monitoring",
    ourPage: "/features/monitoring",
    context: "Apex tracks brand mentions across 7 major AI platforms...",
    sentiment: "positive",
    position: 1,
    visibility: 96,
  },
  {
    id: "mention_008",
    platform: "chatgpt",
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    query: "white-label GEO platform",
    ourPage: "/solutions/white-label",
    context: "Apex offers a fully white-labeled platform for agencies...",
    sentiment: "positive",
    position: 3,
    visibility: 85,
  },
];

// Platform statistics
const mockPlatformStats = [
  { platform: "chatgpt", mentions: 342, avgPosition: 2.3, avgVisibility: 89, trend: 12 },
  { platform: "claude", mentions: 287, avgPosition: 1.8, avgVisibility: 93, trend: 18 },
  { platform: "gemini", mentions: 256, avgPosition: 2.9, avgVisibility: 85, trend: -5 },
  { platform: "perplexity", mentions: 198, avgPosition: 2.1, avgVisibility: 91, trend: 22 },
  { platform: "grok", mentions: 134, avgPosition: 3.2, avgVisibility: 82, trend: 8 },
  { platform: "deepseek", mentions: 89, avgPosition: 3.7, avgVisibility: 76, trend: -12 },
  { platform: "janus", mentions: 67, avgPosition: 2.5, avgVisibility: 88, trend: 15 },
];

// Most cited pages
const mockTopCitedPages = [
  { page: "/features/geo-optimization", citations: 234, avgPosition: 1.8, platforms: ["chatgpt", "claude", "perplexity"] },
  { page: "/blog/aeo-complete-guide", citations: 198, avgPosition: 2.1, platforms: ["claude", "gemini", "chatgpt"] },
  { page: "/features/monitoring", citations: 176, avgPosition: 2.3, platforms: ["chatgpt", "gemini", "janus"] },
  { page: "/docs/schema-optimization", citations: 142, avgPosition: 1.9, platforms: ["perplexity", "claude"] },
  { page: "/blog/geo-vs-seo", citations: 128, avgPosition: 2.7, platforms: ["grok", "chatgpt"] },
];

export default function OurVisibilityPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");

  // API data with fallback to mock data
  const {
    mentions: apiMentions,
    platformStats: apiPlatformStats,
    topCitedPages: apiTopCitedPages,
    totalMentions: apiTotalMentions,
    avgVisibility: apiAvgVisibility,
    isLoading,
    isError,
    error,
  } = usePlatformMentions();

  // Use API data if available, otherwise fallback to mock
  const mentions = apiMentions.length > 0 ? apiMentions : mockPlatformMentions;
  const platformStats = apiPlatformStats.length > 0 ? apiPlatformStats : mockPlatformStats;
  const topCitedPages = apiTopCitedPages.length > 0 ? apiTopCitedPages : mockTopCitedPages;

  // Filter mentions
  const filteredMentions = mentions.filter((mention) => {
    const platformMatch = selectedPlatform === "all" || mention.platform === selectedPlatform;
    const searchMatch = searchQuery === "" ||
      mention.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mention.ourPage.toLowerCase().includes(searchQuery.toLowerCase());
    const sentimentMatch = sentimentFilter === "all" || mention.sentiment === sentimentFilter;
    return platformMatch && searchMatch && sentimentMatch;
  });

  const getPlatformIcon = (platform: string) => {
    const colors = {
      chatgpt: "text-green-400",
      claude: "text-amber-400",
      gemini: "text-blue-400",
      perplexity: "text-cyan-400",
      grok: "text-purple-400",
      deepseek: "text-pink-400",
      janus: "text-indigo-400",
    };
    return colors[platform as keyof typeof colors] || "text-gray-400";
  };

  const getPlatformName = (platform: string) => {
    const names = {
      chatgpt: "ChatGPT",
      claude: "Claude",
      gemini: "Gemini",
      perplexity: "Perplexity",
      grok: "Grok",
      deepseek: "DeepSeek",
      janus: "Janus",
    };
    return names[platform as keyof typeof names] || platform;
  };

  const getSentimentColor = (sentiment: string) => {
    const colors = {
      positive: "text-green-400 bg-green-400/10",
      neutral: "text-yellow-400 bg-yellow-400/10",
      negative: "text-red-400 bg-red-400/10",
    };
    return colors[sentiment as keyof typeof colors] || "text-gray-400 bg-gray-400/10";
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Calculate total stats with safe access
  const totalMentions = apiTotalMentions || platformStats.reduce((sum, stat) => sum + (stat.mentions || 0), 0);
  const avgVisibility = apiAvgVisibility || Math.round(
    platformStats.reduce((sum, stat) => sum + (stat.avgVisibility || 0), 0) / (platformStats.length || 1)
  );
  const topPlatform = platformStats.length > 0
    ? platformStats.reduce((max, stat) => (stat.mentions || 0) > (max.mentions || 0) ? stat : max)
    : { platform: "chatgpt", mentions: 0, avgPosition: 0, avgVisibility: 0, trend: 0 };

  return (
    <div className="space-y-6 p-6">
      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading platform visibility data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load platform visibility data</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching platform mentions"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading and no error */}
      {!isLoading && !isError && (
        <>
          {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Our Visibility</h1>
          <p className="text-gray-400">
            Track how AI platforms cite our content across all 7 platforms
          </p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Mentions</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{totalMentions}</div>
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+12% vs last week</span>
          </div>
        </div>

        <div className="card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg Visibility Score</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{avgVisibility}%</div>
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+5 points</span>
          </div>
        </div>

        <div className="card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Top Platform</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1 capitalize">
            {getPlatformName(topPlatform.platform)}
          </div>
          <div className="text-gray-400 text-sm">
            {topPlatform.mentions} mentions
          </div>
        </div>

        <div className="card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg Position</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">2.4</div>
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Improved from 2.9</span>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="card-secondary">
        <h2 className="text-xl font-semibold text-white mb-4">Platform Breakdown</h2>
        <div className="space-y-3">
          {platformStats.map((stat) => (
            <div key={stat.platform} className="flex items-center gap-4">
              <div className="w-32">
                <span className={`font-medium capitalize ${getPlatformIcon(stat.platform)}`}>
                  {getPlatformName(stat.platform)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-background rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500`}
                      style={{ width: `${(stat.mentions / totalMentions) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-medium w-16 text-right">{stat.mentions}</span>
                </div>
              </div>
              <div className="w-24 text-right text-gray-400">
                Pos: {stat.avgPosition}
              </div>
              <div className="w-24 text-right text-gray-400">
                {stat.avgVisibility}% vis
              </div>
              <div className={`w-20 text-right flex items-center justify-end gap-1 ${
                stat.trend > 0 ? "text-green-400" : "text-red-400"
              }`}>
                {stat.trend > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(stat.trend)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Cited Pages */}
      <div className="card-secondary">
        <h2 className="text-xl font-semibold text-white mb-4">Most Cited Pages</h2>
        <div className="space-y-3">
          {topCitedPages.map((page, index) => (
            <div key={page.page} className="flex items-center gap-4 p-3 bg-background rounded-lg">
              <div className="text-2xl font-bold text-gray-500 w-8">#{index + 1}</div>
              <div className="flex-1">
                <div className="text-white font-medium mb-1">{page.page}</div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>{page.citations} citations</span>
                  <span>•</span>
                  <span>Avg pos: {page.avgPosition}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {page.platforms.map((platform) => (
                      <span
                        key={platform}
                        className={`capitalize text-xs ${getPlatformIcon(platform)}`}
                      >
                        {getPlatformName(platform)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card-secondary">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-white">Recent Mentions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search mentions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background border-white/10 pl-10"
            />
          </div>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="bg-background border-white/10">
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="chatgpt">ChatGPT</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="perplexity">Perplexity</SelectItem>
              <SelectItem value="grok">Grok</SelectItem>
              <SelectItem value="deepseek">DeepSeek</SelectItem>
              <SelectItem value="janus">Janus</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger className="bg-background border-white/10">
              <SelectValue placeholder="All sentiments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mentions List */}
        <div className="space-y-3">
          {filteredMentions.map((mention) => (
            <div key={mention.id} className="card-tertiary">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`font-medium capitalize ${getPlatformIcon(mention.platform)}`}>
                    {getPlatformName(mention.platform)}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 text-sm">{formatTimestamp(mention.timestamp)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getSentimentColor(mention.sentiment)}`}>
                    {mention.sentiment}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Position</div>
                    <div className="text-lg font-bold text-white">#{mention.position}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Visibility</div>
                    <div className="text-lg font-bold text-cyan-400">{mention.visibility}%</div>
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <span className="text-gray-400 text-sm">Query: </span>
                <span className="text-white">{mention.query}</span>
              </div>

              <div className="mb-2">
                <span className="text-gray-400 text-sm">Our Page: </span>
                <span className="text-cyan-400 hover:underline cursor-pointer">{mention.ourPage}</span>
              </div>

              <div className="p-3 bg-background rounded-lg border border-white/5">
                <span className="text-gray-400 text-sm">Citation: </span>
                <p className="text-gray-300 text-sm mt-1">{mention.context}</p>
              </div>
            </div>
          ))}
        </div>

        {filteredMentions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No mentions found matching your filters
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
