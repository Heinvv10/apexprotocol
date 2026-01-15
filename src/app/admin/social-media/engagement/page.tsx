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
  MessageCircle,
  Heart,
  Share2,
  Search,
  Filter,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Smile,
  Frown,
  Meh,
  Reply,
  Star,
  UserPlus,
  Clock,
} from "lucide-react";

// Mock engagement data
const mockMentions = [
  {
    id: "mention_001",
    platform: "twitter",
    author: "John Doe",
    authorHandle: "@johndoe",
    authorAvatar: "JD",
    content: "Just tried @apex-marketing and I'm blown away! The GEO insights are incredible. 🚀",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    engagement: { likes: 24, replies: 5, shares: 3 },
    isLead: true,
    leadScore: 85,
    replied: false,
  },
  {
    id: "mention_002",
    platform: "linkedin",
    author: "Sarah Johnson",
    authorHandle: "sarah-johnson-cmo",
    authorAvatar: "SJ",
    content: "Looking for a reliable GEO platform. Has anyone tried @apex-marketing? Worth the investment?",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    sentiment: "neutral",
    engagement: { likes: 8, replies: 12, shares: 0 },
    isLead: true,
    leadScore: 72,
    replied: true,
  },
  {
    id: "mention_003",
    platform: "twitter",
    author: "Mike Chen",
    authorHandle: "@mikechen",
    authorAvatar: "MC",
    content: "The @apex-marketing dashboard could use better mobile responsiveness. Otherwise solid product.",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    sentiment: "neutral",
    engagement: { likes: 15, replies: 4, shares: 1 },
    isLead: false,
    leadScore: 0,
    replied: true,
  },
  {
    id: "mention_004",
    platform: "instagram",
    author: "Emily Rodriguez",
    authorHandle: "@emilymarketing",
    authorAvatar: "ER",
    content: "Amazing results with @apex-marketing! Our AI visibility increased 300% in just 2 months 📈",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    engagement: { likes: 156, replies: 23, shares: 12 },
    isLead: false,
    leadScore: 0,
    replied: false,
  },
  {
    id: "mention_005",
    platform: "linkedin",
    author: "David Williams",
    authorHandle: "david-williams-ceo",
    authorAvatar: "DW",
    content: "Disappointed with @apex-marketing support response time. 48 hours for a critical issue is too long.",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sentiment: "negative",
    engagement: { likes: 3, replies: 8, shares: 0 },
    isLead: false,
    leadScore: 0,
    replied: true,
  },
  {
    id: "mention_006",
    platform: "twitter",
    author: "Lisa Anderson",
    authorHandle: "@lisadigital",
    authorAvatar: "LA",
    content: "Can someone explain how @apex-marketing differs from traditional SEO tools? Genuinely curious.",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    sentiment: "neutral",
    engagement: { likes: 42, replies: 18, shares: 5 },
    isLead: true,
    leadScore: 68,
    replied: false,
  },
  {
    id: "mention_007",
    platform: "youtube",
    author: "Tech Reviews Pro",
    authorHandle: "@techreviewspro",
    authorAvatar: "TR",
    content: "Comprehensive review: @apex-marketing is a game-changer for AI search optimization. Highly recommend!",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    sentiment: "positive",
    engagement: { likes: 892, replies: 156, shares: 234 },
    isLead: false,
    leadScore: 0,
    replied: true,
  },
  {
    id: "mention_008",
    platform: "facebook",
    author: "Marketing Professionals Group",
    authorHandle: "marketing-pros",
    authorAvatar: "MP",
    content: "Anyone using @apex-marketing for their agency clients? What's your experience been like?",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    sentiment: "neutral",
    engagement: { likes: 28, replies: 34, shares: 6 },
    isLead: true,
    leadScore: 79,
    replied: false,
  },
];

const mockResponseTemplates = [
  {
    id: "template_001",
    name: "Thank You (Positive)",
    content: "Thank you so much for the kind words! We're thrilled you're seeing great results. Feel free to reach out if you ever need any assistance. 🚀",
  },
  {
    id: "template_002",
    name: "Feature Question",
    content: "Great question! {Feature} works by {explanation}. Would you like to schedule a quick demo to see it in action?",
  },
  {
    id: "template_003",
    name: "Support Issue",
    content: "We're sorry to hear about your experience. We take support seriously and will look into this immediately. Can you DM us your ticket number?",
  },
  {
    id: "template_004",
    name: "Comparison Question",
    content: "Great question! Unlike traditional SEO, we focus on AI-powered search engines like ChatGPT, Claude, and Gemini. Happy to provide a detailed comparison—would you like to chat?",
  },
  {
    id: "template_005",
    name: "Lead Nurture",
    content: "We'd love to help you explore this further! Would you be interested in a personalized demo to see how we can help your specific use case?",
  },
];

export default function EngagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [leadFilter, setLeadFilter] = useState("all");
  const [selectedMention, setSelectedMention] = useState<string | null>(null);

  // Calculate stats
  const totalMentions = mockMentions.length;
  const positiveMentions = mockMentions.filter((m) => m.sentiment === "positive").length;
  const negativeMentions = mockMentions.filter((m) => m.sentiment === "negative").length;
  const neutralMentions = mockMentions.filter((m) => m.sentiment === "neutral").length;
  const unrepliedMentions = mockMentions.filter((m) => !m.replied).length;
  const leadMentions = mockMentions.filter((m) => m.isLead).length;

  // Filter mentions
  const filteredMentions = mockMentions.filter((mention) => {
    const matchesSearch =
      searchQuery === "" ||
      mention.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mention.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mention.authorHandle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSentiment = sentimentFilter === "all" || mention.sentiment === sentimentFilter;
    const matchesPlatform = platformFilter === "all" || mention.platform === platformFilter;
    const matchesLead =
      leadFilter === "all" ||
      (leadFilter === "leads" && mention.isLead) ||
      (leadFilter === "non-leads" && !mention.isLead);
    return matchesSearch && matchesSentiment && matchesPlatform && matchesLead;
  });

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
        return <MessageCircle className="h-4 w-4" />;
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

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <Smile className="h-4 w-4 text-green-400" />;
      case "negative":
        return <Frown className="h-4 w-4 text-red-400" />;
      default:
        return <Meh className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return (
          <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium flex items-center gap-1">
            <Smile className="h-3 w-3" />
            Positive
          </span>
        );
      case "negative":
        return (
          <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium flex items-center gap-1">
            <Frown className="h-3 w-3" />
            Negative
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium flex items-center gap-1">
            <Meh className="h-3 w-3" />
            Neutral
          </span>
        );
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Social Media Engagement</h1>
        <p className="text-muted-foreground mt-1">Track mentions, replies, and lead opportunities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Mentions</p>
              <p className="text-2xl font-bold text-white mt-1">{totalMentions}</p>
            </div>
            <MessageCircle className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Positive</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{positiveMentions}</p>
            </div>
            <Smile className="h-5 w-5 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Neutral</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{neutralMentions}</p>
            </div>
            <Meh className="h-5 w-5 text-yellow-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Negative</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{negativeMentions}</p>
            </div>
            <Frown className="h-5 w-5 text-red-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Needs Reply</p>
              <p className="text-2xl font-bold text-white mt-1">{unrepliedMentions}</p>
            </div>
            <Clock className="h-5 w-5 text-orange-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Potential Leads</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{leadMentions}</p>
            </div>
            <UserPlus className="h-5 w-5 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-secondary p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mentions, authors, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0a0f1a] border-white/10"
              />
            </div>
          </div>
          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-[#0a0f1a] border-white/10">
              <SelectValue placeholder="Sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-[#0a0f1a] border-white/10">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>
          <Select value={leadFilter} onValueChange={setLeadFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-[#0a0f1a] border-white/10">
              <SelectValue placeholder="Lead Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mentions</SelectItem>
              <SelectItem value="leads">Potential Leads</SelectItem>
              <SelectItem value="non-leads">Non-Leads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mentions List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentions Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Recent Mentions ({filteredMentions.length})
            </h2>
            <Button size="sm" variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>

          {filteredMentions.map((mention) => (
            <div
              key={mention.id}
              className={`card-tertiary cursor-pointer transition-all hover:border-cyan-500/50 ${
                selectedMention === mention.id ? "border-cyan-500/50 bg-white/5" : ""
              }`}
              onClick={() => setSelectedMention(mention.id)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">{mention.authorAvatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{mention.author}</span>
                      <span className="text-sm text-muted-foreground">{mention.authorHandle}</span>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded border ${getPlatformColor(mention.platform)}`}>
                        {getPlatformIcon(mention.platform)}
                      </div>
                      {mention.isLead && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Lead {mention.leadScore}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(mention.timestamp)}
                    </span>
                  </div>
                  <p className="text-white mb-3">{mention.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-muted-foreground text-sm">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {mention.engagement.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {mention.engagement.replies}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-4 w-4" />
                        {mention.engagement.shares}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSentimentBadge(mention.sentiment)}
                      {mention.replied ? (
                        <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Replied
                        </span>
                      ) : (
                        <Button size="sm" variant="outline">
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions & Response Templates */}
        <div className="space-y-4">
          <div className="card-secondary p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Response Templates</h3>
            <div className="space-y-2">
              {mockResponseTemplates.map((template) => (
                <button
                  key={template.id}
                  className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <div className="font-medium text-white text-sm mb-1">{template.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{template.content}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card-secondary p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Sentiment Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smile className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400"
                      style={{ width: `${(positiveMentions / totalMentions) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white w-12 text-right">
                    {Math.round((positiveMentions / totalMentions) * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Meh className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-white">Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${(neutralMentions / totalMentions) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white w-12 text-right">
                    {Math.round((neutralMentions / totalMentions) * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Frown className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-white">Negative</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400"
                      style={{ width: `${(negativeMentions / totalMentions) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white w-12 text-right">
                    {Math.round((negativeMentions / totalMentions) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-secondary p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Lead Capture</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Leads Captured</span>
                <span className="text-xl font-bold text-purple-400">{leadMentions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Lead Score</span>
                <span className="text-xl font-bold text-white">
                  {Math.round(
                    mockMentions.filter((m) => m.isLead).reduce((sum, m) => sum + m.leadScore, 0) /
                      leadMentions
                  )}
                </span>
              </div>
              <div className="pt-3 border-t border-white/10">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:opacity-90">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Export Leads to CRM
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
