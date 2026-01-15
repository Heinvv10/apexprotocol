"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  Plus,
  Users,
  MessageCircle,
  Heart,
  Share2,
  BarChart3,
  Target,
  Eye,
  Zap,
  Calendar,
  Hash,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// Mock competitor data
const mockCompetitors = [
  {
    id: "comp_001",
    name: "SearchableAI",
    website: "searchable.ai",
    platforms: ["twitter", "linkedin", "instagram"],
    totalFollowers: 28500,
    monthlyPosts: 64,
    avgEngagement: 4.8,
    shareOfVoice: 32.5,
    sentiment: "positive",
    topContent: "GEO optimization tips",
    recentActivity: [
      {
        platform: "linkedin",
        content: "New feature launch: AI citation tracking across 7 platforms",
        engagement: { likes: 245, comments: 32, shares: 18 },
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        platform: "twitter",
        content: "How to optimize your content for ChatGPT visibility",
        engagement: { likes: 156, comments: 24, shares: 42 },
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "comp_002",
    name: "AIVisibility Pro",
    website: "aivisibility.com",
    platforms: ["twitter", "linkedin", "youtube"],
    totalFollowers: 19200,
    monthlyPosts: 48,
    avgEngagement: 3.9,
    shareOfVoice: 21.8,
    sentiment: "neutral",
    topContent: "AI search analytics",
    recentActivity: [
      {
        platform: "youtube",
        content: "Complete guide to Answer Engine Optimization (AEO)",
        engagement: { likes: 892, comments: 156, shares: 234 },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "comp_003",
    name: "GEO Masters",
    website: "geomasters.io",
    platforms: ["linkedin", "twitter", "facebook"],
    totalFollowers: 15800,
    monthlyPosts: 52,
    avgEngagement: 4.2,
    shareOfVoice: 18.3,
    sentiment: "positive",
    topContent: "Schema markup best practices",
    recentActivity: [
      {
        platform: "linkedin",
        content: "Case study: 400% increase in AI citations in 60 days",
        engagement: { likes: 312, comments: 48, shares: 27 },
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "comp_004",
    name: "AnswerEngine Insights",
    website: "answerengine.co",
    platforms: ["twitter", "instagram", "youtube"],
    totalFollowers: 12400,
    monthlyPosts: 38,
    avgEngagement: 3.5,
    shareOfVoice: 14.2,
    sentiment: "neutral",
    topContent: "Platform comparison guides",
    recentActivity: [
      {
        platform: "twitter",
        content: "Perplexity vs ChatGPT: Which platform should you optimize for first?",
        engagement: { likes: 98, comments: 15, shares: 22 },
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

// Mock share of voice data
const shareOfVoiceData = [
  { name: "Apex (Us)", value: 13.2, color: "from-cyan-500 to-purple-500" },
  { name: "SearchableAI", value: 32.5, color: "from-blue-500 to-blue-600" },
  { name: "AIVisibility Pro", value: 21.8, color: "from-green-500 to-green-600" },
  { name: "GEO Masters", value: 18.3, color: "from-yellow-500 to-yellow-600" },
  { name: "AnswerEngine Insights", value: 14.2, color: "from-red-500 to-red-600" },
];

// Mock competitive intelligence
const competitiveIntelligence = [
  {
    id: "intel_001",
    type: "opportunity",
    title: "Content gap: YouTube Shorts",
    description: "Competitors posting 40% fewer YouTube Shorts. Opportunity to capture market share.",
    impact: "high",
    competitors: ["SearchableAI", "GEO Masters"],
  },
  {
    id: "intel_002",
    type: "threat",
    title: "SearchableAI expanding to TikTok",
    description: "Main competitor launching TikTok presence with dedicated team.",
    impact: "medium",
    competitors: ["SearchableAI"],
  },
  {
    id: "intel_003",
    type: "opportunity",
    title: "Carousel content underutilized",
    description: "Only 2 competitors using carousel format on LinkedIn. High engagement potential.",
    impact: "medium",
    competitors: ["AIVisibility Pro", "AnswerEngine Insights"],
  },
  {
    id: "intel_004",
    type: "insight",
    title: "Industry hashtag shift",
    description: "#GEO trending 25% higher than #SEO in target audience.",
    impact: "high",
    competitors: ["All"],
  },
];

export default function CompetitorTrackingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <Twitter className="h-3 w-3" />;
      case "linkedin":
        return <Linkedin className="h-3 w-3" />;
      case "instagram":
        return <Instagram className="h-3 w-3" />;
      case "youtube":
        return <Youtube className="h-3 w-3" />;
      case "facebook":
        return <Facebook className="h-3 w-3" />;
      default:
        return <MessageCircle className="h-3 w-3" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: "text-blue-400 bg-blue-500/10",
      linkedin: "text-cyan-400 bg-cyan-500/10",
      instagram: "text-pink-400 bg-pink-500/10",
      youtube: "text-red-400 bg-red-500/10",
      facebook: "text-indigo-400 bg-indigo-500/10",
    };
    return colors[platform] || "text-gray-400 bg-gray-500/10";
  };

  const getIntelligenceIcon = (type: string) => {
    switch (type) {
      case "opportunity":
        return <Target className="h-5 w-5 text-green-400" />;
      case "threat":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Eye className="h-5 w-5 text-cyan-400" />;
    }
  };

  const getIntelligenceBadge = (type: string) => {
    switch (type) {
      case "opportunity":
        return (
          <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
            Opportunity
          </span>
        );
      case "threat":
        return (
          <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
            Threat
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium">
            Insight
          </span>
        );
    }
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

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  const filteredCompetitors = mockCompetitors.filter((comp) =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalFollowers = mockCompetitors.reduce((sum, c) => sum + c.totalFollowers, 0);
  const avgEngagement =
    mockCompetitors.reduce((sum, c) => sum + c.avgEngagement, 0) / mockCompetitors.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Competitor Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor competitor activity and market positioning</p>
        </div>
        <Button className="bg-gradient-to-r from-[#00E5CC] to-[#8B5CF6] hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Add Competitor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tracked Competitors</p>
              <p className="text-2xl font-bold text-white mt-1">{mockCompetitors.length}</p>
            </div>
            <Users className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Our Share of Voice</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-purple-400">13.2%</p>
                <span className="text-xs text-green-400">+2.1%</span>
              </div>
            </div>
            <BarChart3 className="h-5 w-5 text-purple-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Comp Followers</p>
              <p className="text-2xl font-bold text-white mt-1">{(totalFollowers / 1000).toFixed(1)}K</p>
            </div>
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Engagement</p>
              <p className="text-2xl font-bold text-white mt-1">{avgEngagement.toFixed(1)}%</p>
            </div>
            <Heart className="h-5 w-5 text-pink-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Opportunities</p>
              <p className="text-2xl font-bold text-green-400 mt-1">3</p>
            </div>
            <Target className="h-5 w-5 text-green-400" />
          </div>
        </div>
      </div>

      {/* Share of Voice */}
      <div className="card-secondary p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Share of Voice</h2>
        <div className="space-y-4">
          {shareOfVoiceData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-40 text-sm text-white font-medium">{item.name}</div>
              <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full bg-gradient-to-r ${item.color} transition-all`}
                  style={{ width: `${item.value}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-end pr-3 text-sm font-semibold text-white">
                  {item.value}%
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-cyan-400 mb-1">Insight</p>
              <p className="text-sm text-white">
                You're 2.1% ahead of AnswerEngine Insights. Focus on video content to close gap with GEO Masters.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="competitors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="competitors">
            <Users className="h-4 w-4 mr-2" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="intelligence">
            <Target className="h-4 w-4 mr-2" />
            Competitive Intelligence
          </TabsTrigger>
        </TabsList>

        {/* Competitors Tab */}
        <TabsContent value="competitors">
          <div className="space-y-4">
            {/* Search */}
            <div className="card-secondary p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search competitors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0a0f1a] border-white/10"
                />
              </div>
            </div>

            {/* Competitor Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCompetitors.map((competitor) => (
                <div key={competitor.id} className="card-secondary p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">{competitor.name}</h3>
                      <a
                        href={`https://${competitor.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cyan-400 hover:underline"
                      >
                        {competitor.website}
                      </a>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </div>

                  {/* Platforms */}
                  <div className="flex items-center gap-2 mb-4">
                    {competitor.platforms.map((platform) => (
                      <div
                        key={platform}
                        className={`flex items-center gap-1 px-2 py-1 rounded ${getPlatformColor(platform)}`}
                      >
                        {getPlatformIcon(platform)}
                      </div>
                    ))}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Followers</p>
                      <p className="text-lg font-semibold text-white">
                        {(competitor.totalFollowers / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Posts</p>
                      <p className="text-lg font-semibold text-white">{competitor.monthlyPosts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                      <p className="text-lg font-semibold text-white">{competitor.avgEngagement}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Share of Voice</p>
                      <p className="text-2xl font-bold text-purple-400">{competitor.shareOfVoice}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Top Content</p>
                      <p className="text-sm text-white font-medium">{competitor.topContent}</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <p className="text-sm font-semibold text-white mb-2">Recent Activity</p>
                    <div className="space-y-2">
                      {competitor.recentActivity.map((activity, idx) => (
                        <div key={idx} className="card-tertiary p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <div className={`p-1 rounded ${getPlatformColor(activity.platform)}`}>
                              {getPlatformIcon(activity.platform)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-white mb-1">{activity.content}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {activity.engagement.likes}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  {activity.engagement.comments}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Share2 className="h-3 w-3" />
                                  {activity.engagement.shares}
                                </span>
                                <span className="ml-auto">{formatRelativeTime(activity.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Competitive Intelligence Tab */}
        <TabsContent value="intelligence">
          <div className="space-y-4">
            {competitiveIntelligence.map((intel) => (
              <div key={intel.id} className="card-secondary p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-lg">{getIntelligenceIcon(intel.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getIntelligenceBadge(intel.type)}
                      {getImpactBadge(intel.impact)}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{intel.title}</h3>
                    <p className="text-muted-foreground mb-4">{intel.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Affected competitors:</span>
                      <div className="flex items-center gap-2">
                        {intel.competitors.map((comp, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded bg-white/5 text-xs text-white font-medium"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
