"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  TrendingUp,
  TrendingDown,
  Clock,
  Hash,
  Image as ImageIcon,
  Video,
  FileText,
  AlertCircle,
  CheckCircle,
  Zap,
  BarChart3,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";

// Mock algorithm change detection data
const mockAlgorithmChanges = [
  {
    id: "change_001",
    platform: "linkedin",
    detected: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    change: "Video content receiving 40% more reach",
    impact: "high",
    confidence: 92,
    affectedMetrics: ["reach", "engagement"],
    recommendation: "Increase video post frequency by 2x",
  },
  {
    id: "change_002",
    platform: "twitter",
    detected: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    change: "Posts with images getting 25% less engagement",
    impact: "medium",
    confidence: 85,
    affectedMetrics: ["engagement", "likes"],
    recommendation: "Focus on text-only or video posts",
  },
  {
    id: "change_003",
    platform: "instagram",
    detected: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    change: "Carousel posts showing 35% higher save rate",
    impact: "high",
    confidence: 89,
    affectedMetrics: ["saves", "reach"],
    recommendation: "Create more carousel content",
  },
  {
    id: "change_004",
    platform: "youtube",
    detected: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    change: "Shorts format gaining 60% more impressions",
    impact: "high",
    confidence: 94,
    affectedMetrics: ["impressions", "views"],
    recommendation: "Prioritize YouTube Shorts production",
  },
];

// Mock best posting times data
const mockPostingTimes = {
  twitter: [
    { time: "09:00", day: "Weekday", engagement: 4.2, reach: 3200, optimal: true },
    { time: "12:00", day: "Weekday", engagement: 5.8, reach: 4500, optimal: true },
    { time: "17:00", day: "Weekday", engagement: 6.1, reach: 4800, optimal: true },
    { time: "19:00", day: "Weekend", engagement: 5.2, reach: 3900, optimal: true },
    { time: "14:00", day: "Weekend", engagement: 4.7, reach: 3600, optimal: false },
  ],
  linkedin: [
    { time: "08:00", day: "Weekday", engagement: 5.5, reach: 5200, optimal: true },
    { time: "12:00", day: "Weekday", engagement: 6.2, reach: 5800, optimal: true },
    { time: "17:00", day: "Weekday", engagement: 5.9, reach: 5500, optimal: true },
    { time: "10:00", day: "Weekend", engagement: 3.1, reach: 2400, optimal: false },
  ],
  instagram: [
    { time: "11:00", day: "Weekday", engagement: 7.2, reach: 6500, optimal: true },
    { time: "14:00", day: "Weekday", engagement: 6.8, reach: 6200, optimal: true },
    { time: "19:00", day: "Weekday", engagement: 8.1, reach: 7200, optimal: true },
    { time: "20:00", day: "Weekend", engagement: 7.9, reach: 7000, optimal: true },
  ],
  youtube: [
    { time: "14:00", day: "Weekday", engagement: 5.2, reach: 4800, optimal: true },
    { time: "18:00", day: "Weekday", engagement: 6.8, reach: 6200, optimal: true },
    { time: "20:00", day: "Weekday", engagement: 7.5, reach: 6800, optimal: true },
    { time: "15:00", day: "Weekend", engagement: 6.9, reach: 6400, optimal: true },
  ],
  facebook: [
    { time: "09:00", day: "Weekday", engagement: 4.8, reach: 4200, optimal: true },
    { time: "13:00", day: "Weekday", engagement: 5.4, reach: 4800, optimal: true },
    { time: "19:00", day: "Weekday", engagement: 5.9, reach: 5200, optimal: true },
    { time: "12:00", day: "Weekend", engagement: 5.1, reach: 4600, optimal: true },
  ],
};

// Mock hashtag performance data
const mockHashtagPerformance = [
  {
    hashtag: "#MarketingTips",
    platform: "twitter",
    posts: 24,
    reach: 45000,
    engagement: 1850,
    trend: "up",
    change: 15.2,
  },
  {
    hashtag: "#DigitalMarketing",
    platform: "linkedin",
    posts: 18,
    reach: 38000,
    engagement: 1620,
    trend: "up",
    change: 8.5,
  },
  {
    hashtag: "#SocialMediaTips",
    platform: "instagram",
    posts: 32,
    reach: 62000,
    engagement: 3200,
    trend: "up",
    change: 22.3,
  },
  {
    hashtag: "#ContentStrategy",
    platform: "linkedin",
    posts: 15,
    reach: 28000,
    engagement: 1100,
    trend: "stable",
    change: 0,
  },
  {
    hashtag: "#GrowthHacking",
    platform: "twitter",
    posts: 12,
    reach: 18000,
    engagement: 680,
    trend: "down",
    change: -12.5,
  },
];

// Mock content type performance data
const mockContentTypePerformance = {
  twitter: [
    { type: "Text Only", posts: 45, avgEngagement: 3.8, avgReach: 2800, trend: "stable" },
    { type: "Text + Image", posts: 38, avgEngagement: 4.2, avgReach: 3200, trend: "down" },
    { type: "Text + Video", posts: 22, avgEngagement: 5.6, avgReach: 4100, trend: "up" },
    { type: "Text + Link", posts: 18, avgEngagement: 2.9, avgReach: 2200, trend: "stable" },
  ],
  linkedin: [
    { type: "Text Only", posts: 28, avgEngagement: 4.5, avgReach: 3800, trend: "stable" },
    { type: "Text + Image", posts: 34, avgEngagement: 5.2, avgReach: 4400, trend: "stable" },
    { type: "Text + Video", posts: 18, avgEngagement: 7.8, avgReach: 6200, trend: "up" },
    { type: "Document", posts: 12, avgEngagement: 6.1, avgReach: 5000, trend: "up" },
  ],
  instagram: [
    { type: "Single Image", posts: 42, avgEngagement: 6.8, avgReach: 5800, trend: "stable" },
    { type: "Carousel", posts: 28, avgEngagement: 8.9, avgReach: 7200, trend: "up" },
    { type: "Video", posts: 24, avgEngagement: 7.2, avgReach: 6400, trend: "stable" },
    { type: "Reels", posts: 18, avgEngagement: 9.8, avgReach: 8900, trend: "up" },
  ],
  youtube: [
    { type: "Long Form (10+ min)", posts: 8, avgEngagement: 6.2, avgReach: 5800, trend: "stable" },
    { type: "Medium (5-10 min)", posts: 12, avgEngagement: 5.8, avgReach: 5200, trend: "stable" },
    { type: "Short (< 5 min)", posts: 15, avgEngagement: 4.9, avgReach: 4400, trend: "down" },
    { type: "Shorts", posts: 32, avgEngagement: 8.5, avgReach: 9200, trend: "up" },
  ],
  facebook: [
    { type: "Text Only", posts: 22, avgEngagement: 3.9, avgReach: 3200, trend: "stable" },
    { type: "Text + Image", posts: 38, avgEngagement: 4.8, avgReach: 3900, trend: "stable" },
    { type: "Text + Video", posts: 18, avgEngagement: 6.2, avgReach: 5100, trend: "up" },
    { type: "Live Video", posts: 6, avgEngagement: 7.8, avgReach: 6400, trend: "up" },
  ],
};

export default function AlgorithmMonitoringPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [timeRange, setTimeRange] = useState("30d");

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      linkedin: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      instagram: "text-pink-400 bg-pink-500/10 border-pink-500/30",
      youtube: "text-red-400 bg-red-500/10 border-red-500/30",
      facebook: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    };
    return colors[platform] || "text-gray-400 bg-gray-500/10 border-gray-500/30";
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high":
        return (
          <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
            High Impact
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium">
            Medium Impact
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
            Low Impact
          </span>
        );
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  const filteredChanges =
    selectedPlatform === "all"
      ? mockAlgorithmChanges
      : mockAlgorithmChanges.filter((c) => c.platform === selectedPlatform);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Algorithm Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Track platform behavior changes and optimize your posting strategy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] bg-[#0a0f1a] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Changes Detected</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-white">{mockAlgorithmChanges.length}</p>
                <span className="text-xs text-green-400">+2 this week</span>
              </div>
            </div>
            <AlertCircle className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-white">90%</p>
                <span className="text-xs text-green-400">High accuracy</span>
              </div>
            </div>
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Impact</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-red-400">3</p>
                <span className="text-xs text-muted-foreground">Require action</span>
              </div>
            </div>
            <Zap className="h-5 w-5 text-red-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Platforms Monitored</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-white">5</p>
                <span className="text-xs text-green-400">All active</span>
              </div>
            </div>
            <BarChart3 className="h-5 w-5 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Platform Filter */}
      <div className="card-secondary p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Filter by Platform:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPlatform("all")}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedPlatform === "all"
                  ? "bg-white/5 border-cyan-500/50 text-cyan-400"
                  : "bg-transparent border-white/10 text-muted-foreground hover:bg-white/5"
              }`}
            >
              All Platforms
            </button>
            {["twitter", "linkedin", "instagram", "youtube", "facebook"].map((platform) => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                  selectedPlatform === platform
                    ? `bg-white/5 border-cyan-500/50 ${getPlatformColor(platform).split(" ")[0]}`
                    : "bg-transparent border-white/10 text-muted-foreground hover:bg-white/5"
                }`}
              >
                {getPlatformIcon(platform)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Algorithm Changes */}
      <div className="card-secondary p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Recent Algorithm Changes ({filteredChanges.length})
        </h2>
        <div className="space-y-4">
          {filteredChanges.map((change) => (
            <div key={change.id} className="card-tertiary">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded border ${getPlatformColor(change.platform)}`}
                    >
                      {getPlatformIcon(change.platform)}
                      <span className="text-sm font-medium capitalize">{change.platform}</span>
                    </div>
                    {getImpactBadge(change.impact)}
                    <span className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                      {change.confidence}% confidence
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatRelativeTime(change.detected)}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{change.change}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span>Affected: {change.affectedMetrics.join(", ")}</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                    <Zap className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-cyan-400 mb-1">Recommendation</p>
                      <p className="text-sm text-white">{change.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs for Detailed Analysis */}
      <Tabs defaultValue="posting-times" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posting-times">
            <Clock className="h-4 w-4 mr-2" />
            Best Posting Times
          </TabsTrigger>
          <TabsTrigger value="hashtags">
            <Hash className="h-4 w-4 mr-2" />
            Hashtag Performance
          </TabsTrigger>
          <TabsTrigger value="content-types">
            <FileText className="h-4 w-4 mr-2" />
            Content Types
          </TabsTrigger>
        </TabsList>

        {/* Best Posting Times */}
        <TabsContent value="posting-times">
          <div className="card-secondary p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Optimal Posting Times by Platform</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(mockPostingTimes).map(([platform, times]) => (
                <div key={platform} className="card-tertiary">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${getPlatformColor(platform)}`}>
                      {getPlatformIcon(platform)}
                      <span className="font-semibold capitalize">{platform}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {times.map((time, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          time.optimal ? "bg-green-500/5 border border-green-500/20" : "bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className={`h-4 w-4 ${time.optimal ? "text-green-400" : "text-muted-foreground"}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{time.time}</span>
                              <span className="text-xs text-muted-foreground">{time.day}</span>
                              {time.optimal && (
                                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                                  Optimal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <div className="text-white font-medium">{time.engagement}%</div>
                            <div className="text-xs text-muted-foreground">Engagement</div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">{time.reach.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Reach</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Hashtag Performance */}
        <TabsContent value="hashtags">
          <div className="card-secondary p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Top Performing Hashtags</h2>
            <div className="space-y-3">
              {mockHashtagPerformance.map((hashtag, idx) => (
                <div key={idx} className="card-tertiary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Hash className="h-5 w-5 text-cyan-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-white">{hashtag.hashtag}</span>
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded border ${getPlatformColor(hashtag.platform)}`}>
                            {getPlatformIcon(hashtag.platform)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{hashtag.posts} posts</span>
                          <span>{hashtag.reach.toLocaleString()} reach</span>
                          <span>{hashtag.engagement.toLocaleString()} engagement</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(hashtag.trend)}
                      <span
                        className={`text-sm font-semibold ${
                          hashtag.trend === "up"
                            ? "text-green-400"
                            : hashtag.trend === "down"
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {hashtag.change > 0 ? "+" : ""}
                        {hashtag.change}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Content Type Performance */}
        <TabsContent value="content-types">
          <div className="card-secondary p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Content Type Performance by Platform</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(mockContentTypePerformance).map(([platform, contentTypes]) => (
                <div key={platform} className="card-tertiary">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${getPlatformColor(platform)}`}>
                      {getPlatformIcon(platform)}
                      <span className="font-semibold capitalize">{platform}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {contentTypes.map((content, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          {content.type.includes("Video") || content.type.includes("Shorts") || content.type.includes("Reels") ? (
                            <Video className="h-4 w-4 text-purple-400" />
                          ) : content.type.includes("Image") || content.type.includes("Carousel") ? (
                            <ImageIcon className="h-4 w-4 text-cyan-400" />
                          ) : (
                            <FileText className="h-4 w-4 text-blue-400" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{content.type}</span>
                              {getTrendIcon(content.trend)}
                            </div>
                            <div className="text-xs text-muted-foreground">{content.posts} posts</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="text-sm font-semibold text-white">{content.avgEngagement}%</div>
                            <div className="text-xs text-muted-foreground">Engagement</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{content.avgReach.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Reach</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
