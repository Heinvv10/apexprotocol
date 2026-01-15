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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  AlertCircle,
  Search,
  Plus,
} from "lucide-react";

// Mock competitor data
const competitors = [
  {
    id: "comp_001",
    name: "SearchableAI",
    mentions: 812,
    avgPosition: 1.9,
    avgVisibility: 91,
    shareOfVoice: 32.5,
    trend: 15,
    topPlatforms: ["chatgpt", "claude", "perplexity"],
    topQueries: ["GEO optimization", "AI search tracking", "answer engine optimization"],
  },
  {
    id: "comp_002",
    name: "AIVisibility Pro",
    mentions: 546,
    avgPosition: 2.4,
    avgVisibility: 87,
    shareOfVoice: 21.8,
    trend: 8,
    topPlatforms: ["gemini", "chatgpt", "grok"],
    topQueries: ["AI visibility tools", "GEO platform", "citation tracking"],
  },
  {
    id: "comp_003",
    name: "GEO Masters",
    mentions: 458,
    avgPosition: 2.7,
    avgVisibility: 83,
    shareOfVoice: 18.3,
    trend: -3,
    topPlatforms: ["perplexity", "claude"],
    topQueries: ["generative engine optimization", "AI search optimization"],
  },
  {
    id: "comp_004",
    name: "AnswerEngine Insights",
    mentions: 356,
    avgPosition: 3.1,
    avgVisibility: 79,
    shareOfVoice: 14.2,
    trend: -8,
    topPlatforms: ["chatgpt", "deepseek"],
    topQueries: ["answer engine tracking", "AEO tools"],
  },
];

// Share of voice data (includes us)
const shareOfVoiceData = [
  { name: "SearchableAI", value: 32.5, color: "from-blue-500 to-blue-600", isUs: false },
  { name: "AIVisibility Pro", value: 21.8, color: "from-green-500 to-green-600", isUs: false },
  { name: "GEO Masters", value: 18.3, color: "from-yellow-500 to-yellow-600", isUs: false },
  { name: "AnswerEngine Insights", value: 14.2, color: "from-red-500 to-red-600", isUs: false },
  { name: "Apex (Us)", value: 13.2, color: "from-cyan-500 to-purple-500", isUs: true },
];

// Competitive gaps
const competitiveGaps = [
  {
    id: "gap_001",
    query: "AI platform monitoring best practices",
    competitors: ["SearchableAI", "AIVisibility Pro"],
    avgPosition: 1.5,
    opportunity: "high",
    reasoning: "High-volume query where competitors rank #1-2 but we're not cited",
  },
  {
    id: "gap_002",
    query: "GEO vs traditional SEO comparison",
    competitors: ["GEO Masters"],
    avgPosition: 2.0,
    opportunity: "high",
    reasoning: "Educational content gap - competitor dominates this comparison query",
  },
  {
    id: "gap_003",
    query: "answer engine optimization pricing",
    competitors: ["SearchableAI", "AnswerEngine Insights"],
    avgPosition: 2.3,
    opportunity: "medium",
    reasoning: "Commercial intent query where competitors appear but we don't",
  },
  {
    id: "gap_004",
    query: "multi-platform citation tracking",
    competitors: ["AIVisibility Pro"],
    avgPosition: 1.8,
    opportunity: "medium",
    reasoning: "Feature-specific query where competitor has strong presence",
  },
];

// Competitive wins (queries where we now appear)
const competitiveWins = [
  {
    id: "win_001",
    query: "white-label GEO platform",
    ourPosition: 1,
    competitorsBeat: ["SearchableAI", "GEO Masters"],
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    impact: "high",
  },
  {
    id: "win_002",
    query: "AI search optimization for agencies",
    ourPosition: 2,
    competitorsBeat: ["AIVisibility Pro"],
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    impact: "medium",
  },
  {
    id: "win_003",
    query: "GEO content creation tools",
    ourPosition: 1,
    competitorsBeat: ["AnswerEngine Insights"],
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    impact: "medium",
  },
];

export default function CompetitorVisibilityPage() {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState("overview");

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

  const getOpportunityColor = (opportunity: string) => {
    const colors = {
      high: "text-red-400 bg-red-400/10 border-red-400/20",
      medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
      low: "text-green-400 bg-green-400/10 border-green-400/20",
    };
    return colors[opportunity as keyof typeof colors] || "text-gray-400 bg-gray-400/10 border-gray-400/20";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Calculate our ranking vs competitors
  const allCompetitorsWithUs = [
    ...competitors,
    {
      id: "us",
      name: "Apex (Us)",
      mentions: 330,
      avgPosition: 2.4,
      avgVisibility: 86,
      shareOfVoice: 13.2,
      trend: 12,
      topPlatforms: ["claude", "perplexity", "janus"],
      topQueries: ["white-label GEO", "AI visibility monitoring"],
    },
  ].sort((a, b) => b.mentions - a.mentions);

  const ourRank = allCompetitorsWithUs.findIndex((c) => c.id === "us") + 1;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Competitor Visibility</h1>
          <p className="text-gray-400">
            Monitor competitor mentions and calculate share of voice across AI platforms
          </p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Add Competitor
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Our Rank</span>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">#{ourRank}</div>
          <div className="text-gray-400 text-sm">of {allCompetitorsWithUs.length} tracked</div>
        </div>

        <div className="card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Our Share of Voice</span>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">13.2%</div>
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+2.1% vs last month</span>
          </div>
        </div>

        <div className="card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Competitive Gaps</span>
            <AlertCircle className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{competitiveGaps.length}</div>
          <div className="text-gray-400 text-sm">
            {competitiveGaps.filter((g) => g.opportunity === "high").length} high priority
          </div>
        </div>

        <div className="card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Recent Wins</span>
            <Award className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{competitiveWins.length}</div>
          <div className="text-gray-400 text-sm">Last 7 days</div>
        </div>
      </div>

      {/* Share of Voice Visualization */}
      <div className="card-secondary">
        <h2 className="text-xl font-semibold text-white mb-4">Share of Voice</h2>
        <p className="text-gray-400 text-sm mb-4">
          Percentage of total mentions across all tracked competitors and platforms
        </p>

        <div className="space-y-3">
          {shareOfVoiceData.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${item.isUs ? "text-cyan-400" : "text-white"}`}>
                  {item.name}
                </span>
                <span className="text-white font-bold">{item.value}%</span>
              </div>
              <div className="w-full bg-[#0a0f1a] rounded-full h-3">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="bg-[#141930] border border-white/10">
          <TabsTrigger value="overview">Competitors</TabsTrigger>
          <TabsTrigger value="gaps">Competitive Gaps</TabsTrigger>
          <TabsTrigger value="wins">Our Wins</TabsTrigger>
        </TabsList>

        {/* Competitors Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="card-secondary">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Tracked Competitors</h2>
              <Select value={selectedCompetitor} onValueChange={setSelectedCompetitor}>
                <SelectTrigger className="w-48 bg-[#0a0f1a] border-white/10">
                  <SelectValue placeholder="All competitors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Competitors</SelectItem>
                  {competitors.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {competitors
                .filter((comp) => selectedCompetitor === "all" || comp.id === selectedCompetitor)
                .map((comp, index) => (
                  <div key={comp.id} className="card-tertiary">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-gray-500 w-8">#{index + 1}</div>
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-1">{comp.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{comp.mentions} mentions</span>
                            <span>•</span>
                            <span>Pos: {comp.avgPosition}</span>
                            <span>•</span>
                            <span>{comp.avgVisibility}% visibility</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Share of Voice</div>
                          <div className="text-2xl font-bold text-white">{comp.shareOfVoice}%</div>
                        </div>
                        <div
                          className={`flex items-center gap-1 ${
                            comp.trend > 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {comp.trend > 0 ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                          <span className="font-semibold">{Math.abs(comp.trend)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Top Platforms</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {comp.topPlatforms.map((platform) => (
                            <span
                              key={platform}
                              className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPlatformIcon(
                                platform
                              )} bg-white/5`}
                            >
                              {getPlatformName(platform)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Top Queries</div>
                        <div className="flex flex-wrap gap-2">
                          {comp.topQueries.map((query, qIndex) => (
                            <span
                              key={qIndex}
                              className="px-2 py-1 rounded-full text-xs bg-white/5 text-gray-300"
                            >
                              {query}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </TabsContent>

        {/* Competitive Gaps Tab */}
        <TabsContent value="gaps" className="space-y-4">
          <div className="card-secondary">
            <h2 className="text-xl font-semibold text-white mb-4">Competitive Gaps</h2>
            <p className="text-gray-400 text-sm mb-4">
              Queries where competitors rank but we don't appear
            </p>

            <div className="space-y-3">
              {competitiveGaps.map((gap) => (
                <div key={gap.id} className="card-tertiary">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{gap.query}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium uppercase border ${getOpportunityColor(
                            gap.opportunity
                          )}`}
                        >
                          {gap.opportunity} priority
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{gap.reasoning}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-400">Their Avg Position</div>
                      <div className="text-2xl font-bold text-red-400">#{gap.avgPosition}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-2">Competitors Ranking</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {gap.competitors.map((comp) => (
                        <span
                          key={comp}
                          className="px-3 py-1 rounded-full text-sm bg-red-400/10 text-red-400 border border-red-400/20"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Our Wins Tab */}
        <TabsContent value="wins" className="space-y-4">
          <div className="card-secondary">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Competitive Wins</h2>
            <p className="text-gray-400 text-sm mb-4">
              New queries where we now appear and outrank competitors
            </p>

            <div className="space-y-3">
              {competitiveWins.map((win) => (
                <div key={win.id} className="card-tertiary">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{win.query}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium uppercase border ${getOpportunityColor(
                            win.impact
                          )}`}
                        >
                          {win.impact} impact
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{formatDate(win.date)}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-400">Our Position</div>
                      <div className="text-3xl font-bold text-green-400">#{win.ourPosition}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-2">Competitors Outranked</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {win.competitorsBeat.map((comp) => (
                        <span
                          key={comp}
                          className="px-3 py-1 rounded-full text-sm bg-green-400/10 text-green-400 border border-green-400/20"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
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
