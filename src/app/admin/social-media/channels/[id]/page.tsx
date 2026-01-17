"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  Share2,
  TrendingUp,
  TrendingDown,
  Users,
  MessageCircle,
  Heart,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Mock channel detail data
const mockChannels: Record<string, any> = {
  channel_001: {
    id: "channel_001",
    platform: "linkedin",
    accountName: "Apex Marketing",
    handle: "@apex-marketing",
    profileUrl: "https://linkedin.com/company/apex-marketing",
    status: "active",
    followers: 12450,
    followersGrowth: 8.5,
    following: 892,
    postsThisMonth: 18,
    engagement: 4.2,
    engagementGrowth: 12.3,
    avgReach: 3200,
    avgLikes: 85,
    avgComments: 12,
    avgShares: 8,
    impressions: 45600,
    profileViews: 1240,
    lastPost: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    health: "excellent",
    apiQuota: 85,
    postingFrequency: "3-4 per week",
    description: "Professional networking and B2B marketing content",
    audienceInsights: {
      topLocations: ["United States", "United Kingdom", "Canada", "Australia"],
      topIndustries: ["Technology", "Marketing", "Finance", "Healthcare"],
      ageGroups: { "25-34": 35, "35-44": 28, "45-54": 22, "18-24": 15 },
    },
  },
  channel_002: {
    id: "channel_002",
    platform: "twitter",
    accountName: "Apex (@ApexMarketing)",
    handle: "@ApexMarketing",
    profileUrl: "https://twitter.com/ApexMarketing",
    status: "active",
    followers: 8720,
    followersGrowth: 5.2,
    following: 1456,
    postsThisMonth: 42,
    engagement: 2.8,
    engagementGrowth: -2.1,
    avgReach: 1800,
    avgLikes: 45,
    avgComments: 8,
    avgShares: 15,
    impressions: 32400,
    profileViews: 890,
    lastPost: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    connectedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    health: "good",
    apiQuota: 92,
    postingFrequency: "1-2 per day",
    description: "Real-time updates and customer engagement",
    audienceInsights: {
      topLocations: ["United States", "India", "United Kingdom", "Germany"],
      topIndustries: ["Technology", "Startups", "Media", "Marketing"],
      ageGroups: { "25-34": 42, "18-24": 28, "35-44": 18, "45-54": 12 },
    },
  },
  channel_003: {
    id: "channel_003",
    platform: "instagram",
    accountName: "Apex Marketing",
    handle: "@apex.marketing",
    profileUrl: "https://instagram.com/apex.marketing",
    status: "active",
    followers: 15680,
    followersGrowth: 15.7,
    following: 456,
    postsThisMonth: 12,
    engagement: 6.8,
    engagementGrowth: 18.5,
    avgReach: 4500,
    avgLikes: 320,
    avgComments: 25,
    avgShares: 0,
    impressions: 78200,
    profileViews: 2340,
    lastPost: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    health: "excellent",
    apiQuota: 78,
    postingFrequency: "3-4 per week",
    description: "Visual content and brand storytelling",
    audienceInsights: {
      topLocations: ["United States", "Brazil", "United Kingdom", "Mexico"],
      topIndustries: ["Creative", "Fashion", "Lifestyle", "Technology"],
      ageGroups: { "18-24": 38, "25-34": 35, "35-44": 18, "45-54": 9 },
    },
  },
  channel_004: {
    id: "channel_004",
    platform: "youtube",
    accountName: "Apex Marketing Channel",
    handle: "@ApexMarketing",
    profileUrl: "https://youtube.com/@ApexMarketing",
    status: "active",
    followers: 3240,
    followersGrowth: 22.4,
    following: 128,
    postsThisMonth: 4,
    engagement: 8.5,
    engagementGrowth: 25.8,
    avgReach: 8200,
    avgLikes: 95,
    avgComments: 18,
    avgShares: 12,
    impressions: 42800,
    profileViews: 3450,
    lastPost: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    health: "excellent",
    apiQuota: 95,
    postingFrequency: "1 per week",
    description: "Video tutorials, webinars, and product demos",
    audienceInsights: {
      topLocations: ["United States", "India", "United Kingdom", "Canada"],
      topIndustries: ["Technology", "Education", "Marketing", "Business"],
      ageGroups: { "25-34": 40, "35-44": 30, "18-24": 18, "45-54": 12 },
    },
  },
  channel_005: {
    id: "channel_005",
    platform: "facebook",
    accountName: "Apex Marketing Page",
    handle: "ApexMarketingOfficial",
    profileUrl: "https://facebook.com/ApexMarketingOfficial",
    status: "warning",
    followers: 6890,
    followersGrowth: -1.2,
    following: 245,
    postsThisMonth: 8,
    engagement: 1.5,
    engagementGrowth: -8.5,
    avgReach: 1200,
    avgLikes: 28,
    avgComments: 4,
    avgShares: 6,
    impressions: 18500,
    profileViews: 890,
    lastPost: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    health: "needs-attention",
    apiQuota: 45,
    postingFrequency: "2 per week",
    description: "Community engagement and company updates",
    audienceInsights: {
      topLocations: ["United States", "Philippines", "Mexico", "Brazil"],
      topIndustries: ["Small Business", "Retail", "Services", "Marketing"],
      ageGroups: { "35-44": 32, "45-54": 28, "25-34": 25, "55+": 15 },
    },
  },
  channel_006: {
    id: "channel_006",
    platform: "tiktok",
    accountName: "Apex Tips",
    handle: "@apex.tips",
    profileUrl: "https://tiktok.com/@apex.tips",
    status: "inactive",
    followers: 1320,
    followersGrowth: 0,
    following: 89,
    postsThisMonth: 0,
    engagement: 0,
    engagementGrowth: 0,
    avgReach: 0,
    avgLikes: 0,
    avgComments: 0,
    avgShares: 0,
    impressions: 0,
    profileViews: 0,
    lastPost: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    health: "inactive",
    apiQuota: 100,
    postingFrequency: "Inactive",
    description: "Short-form video content and tips",
    audienceInsights: {
      topLocations: ["United States", "United Kingdom", "Australia", "Canada"],
      topIndustries: ["Entertainment", "Marketing", "Technology", "Creative"],
      ageGroups: { "18-24": 55, "25-34": 30, "35-44": 10, "45-54": 5 },
    },
  },
};

// Mock performance data
const mockPerformanceData = [
  { date: "Jan 1", followers: 10200, engagement: 3.8, impressions: 28000 },
  { date: "Jan 8", followers: 10450, engagement: 4.0, impressions: 31000 },
  { date: "Jan 15", followers: 10800, engagement: 3.9, impressions: 29500 },
  { date: "Jan 22", followers: 11200, engagement: 4.2, impressions: 35000 },
  { date: "Jan 29", followers: 11600, engagement: 4.1, impressions: 38000 },
  { date: "Feb 5", followers: 12000, engagement: 4.3, impressions: 42000 },
  { date: "Feb 12", followers: 12450, engagement: 4.2, impressions: 45600 },
];

// Mock recent posts
const mockRecentPosts = [
  {
    id: "post_001",
    content: "New blog post: 10 Tips for Better Email Marketing",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: 45,
    comments: 8,
    shares: 12,
    reach: 1800,
    type: "link",
  },
  {
    id: "post_002",
    content: "Case study: How our customers increased conversions by 40%",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    likes: 85,
    comments: 15,
    shares: 23,
    reach: 3200,
    type: "article",
  },
  {
    id: "post_003",
    content: "Quick marketing tip: Always test your subject lines",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    likes: 62,
    comments: 6,
    shares: 8,
    reach: 2100,
    type: "text",
  },
  {
    id: "post_004",
    content: "Join our webinar next week on AI marketing trends",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    likes: 38,
    comments: 12,
    shares: 15,
    reach: 2800,
    type: "event",
  },
];

const COLORS = ["#00E5CC", "#8B5CF6", "#F59E0B", "#EF4444"];

export default function SocialMediaChannelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const channelId = params.id as string;
  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "audience" | "settings">("overview");

  // Get channel data from mock
  const channel = mockChannels[channelId];

  // Handle channel not found
  if (!channel) {
    return (
      <div className="p-6">
        <div className="card-secondary p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Channel Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The social media channel you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push("/admin/social-media/channels")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Channels
          </Button>
        </div>
      </div>
    );
  }

  const getPlatformIcon = (platform: string, size: string = "h-6 w-6") => {
    switch (platform) {
      case "twitter":
        return <Twitter className={size} />;
      case "linkedin":
        return <Linkedin className={size} />;
      case "instagram":
        return <Instagram className={size} />;
      case "youtube":
        return <Youtube className={size} />;
      case "facebook":
        return <Facebook className={size} />;
      default:
        return <Share2 className={size} />;
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: "bg-blue-500/10 text-blue-400",
      linkedin: "bg-cyan-500/10 text-cyan-400",
      instagram: "bg-pink-500/10 text-pink-400",
      youtube: "bg-red-500/10 text-red-400",
      facebook: "bg-indigo-500/10 text-indigo-400",
      tiktok: "bg-purple-500/10 text-purple-400",
    };
    return colors[platform] || "bg-gray-500/10 text-gray-400";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Active
          </span>
        );
      case "warning":
        return (
          <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Warning
          </span>
        );
      case "inactive":
        return (
          <span className="px-3 py-1 rounded-full bg-gray-500/10 text-gray-400 text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case "excellent":
        return (
          <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
            Excellent
          </span>
        );
      case "good":
        return (
          <span className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium">
            Good
          </span>
        );
      case "needs-attention":
        return (
          <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium">
            Needs Attention
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const ageGroupData = channel.audienceInsights?.ageGroups
    ? Object.entries(channel.audienceInsights.ageGroups).map(([name, value]) => ({
        name,
        value: value as number,
      }))
    : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/social-media/channels")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${getPlatformColor(channel.platform)}`}>
              {getPlatformIcon(channel.platform, "h-7 w-7")}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{channel.accountName}</h1>
                {getStatusBadge(channel.status)}
              </div>
              <p className="text-muted-foreground mt-1">{channel.handle}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(channel.profileUrl, "_blank")}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Profile
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50 pb-2">
        {["overview", "posts", "audience", "settings"].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab as any)}
            className={activeTab === tab ? "bg-cyan-500/20 text-cyan-400" : ""}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-secondary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Followers</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-bold text-white">{formatNumber(channel.followers)}</p>
                    <span className={`text-xs flex items-center gap-1 ${channel.followersGrowth > 0 ? "text-green-400" : "text-red-400"}`}>
                      {channel.followersGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {channel.followersGrowth > 0 ? "+" : ""}{channel.followersGrowth}%
                    </span>
                  </div>
                </div>
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
            </div>

            <div className="card-secondary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-bold text-white">{channel.engagement}%</p>
                    <span className={`text-xs flex items-center gap-1 ${channel.engagementGrowth > 0 ? "text-green-400" : "text-red-400"}`}>
                      {channel.engagementGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {channel.engagementGrowth > 0 ? "+" : ""}{channel.engagementGrowth}%
                    </span>
                  </div>
                </div>
                <Heart className="h-5 w-5 text-pink-400" />
              </div>
            </div>

            <div className="card-secondary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Impressions</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-bold text-white">{formatNumber(channel.impressions)}</p>
                    <span className="text-xs text-green-400">+12%</span>
                  </div>
                </div>
                <Eye className="h-5 w-5 text-purple-400" />
              </div>
            </div>

            <div className="card-secondary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Posts This Month</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-bold text-white">{channel.postsThisMonth}</p>
                    <span className="text-xs text-muted-foreground">{channel.postingFrequency}</span>
                  </div>
                </div>
                <MessageCircle className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="card-secondary p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Over Time</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141930",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="followers"
                    stroke="#00E5CC"
                    fill="#00E5CC"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channel Info & Recent Posts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Channel Info */}
            <div className="card-secondary p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Channel Info</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm text-white mt-1">{channel.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Following</p>
                    <p className="text-sm font-medium text-white mt-1">{formatNumber(channel.following)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Profile Views</p>
                    <p className="text-sm font-medium text-white mt-1">{formatNumber(channel.profileViews)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Reach</p>
                    <p className="text-sm font-medium text-white mt-1">{formatNumber(channel.avgReach)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">API Quota</p>
                    <p className="text-sm font-medium text-white mt-1">{channel.apiQuota}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Health Status</p>
                  <div className="mt-2">{getHealthBadge(channel.health)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Connected</p>
                  <p className="text-sm text-white mt-1">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {new Date(channel.connectedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Post</p>
                  <p className="text-sm text-white mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {formatDate(channel.lastPost)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="lg:col-span-2 card-secondary p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Posts</h3>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {mockRecentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-lg bg-background/30 border border-border/50 hover:border-cyan-500/50 transition-colors"
                  >
                    <p className="text-sm text-white mb-2">{post.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{formatDate(post.timestamp)}</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1 text-pink-400">
                          <Heart className="h-3 w-3" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1 text-cyan-400">
                          <MessageCircle className="h-3 w-3" />
                          {post.comments}
                        </span>
                        <span className="flex items-center gap-1 text-purple-400">
                          <Share2 className="h-3 w-3" />
                          {post.shares}
                        </span>
                        <span className="flex items-center gap-1 text-green-400">
                          <Eye className="h-3 w-3" />
                          {formatNumber(post.reach)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-tertiary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Likes</p>
                  <p className="text-2xl font-bold text-pink-400 mt-1">{channel.avgLikes}</p>
                </div>
                <Heart className="h-8 w-8 text-pink-400/30" />
              </div>
            </div>
            <div className="card-tertiary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Comments</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-1">{channel.avgComments}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-cyan-400/30" />
              </div>
            </div>
            <div className="card-tertiary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Shares</p>
                  <p className="text-2xl font-bold text-purple-400 mt-1">{channel.avgShares}</p>
                </div>
                <Share2 className="h-8 w-8 text-purple-400/30" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">All Posts</h3>
            <Button className="bg-gradient-to-r from-[#00E5CC] to-[#8B5CF6] hover:opacity-90">
              Create Post
            </Button>
          </div>
          <div className="card-secondary p-4">
            <div className="space-y-3">
              {mockRecentPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-lg bg-background/30 border border-border/50 hover:border-cyan-500/50 transition-colors"
                >
                  <p className="text-white mb-3">{post.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{formatDate(post.timestamp)}</span>
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-2 text-pink-400">
                        <Heart className="h-4 w-4" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-2 text-cyan-400">
                        <MessageCircle className="h-4 w-4" />
                        {post.comments}
                      </span>
                      <span className="flex items-center gap-2 text-purple-400">
                        <Share2 className="h-4 w-4" />
                        {post.shares}
                      </span>
                      <span className="flex items-center gap-2 text-green-400">
                        <Eye className="h-4 w-4" />
                        {formatNumber(post.reach)} reach
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audience Tab */}
      {activeTab === "audience" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Audience Insights</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Distribution */}
            <div className="card-secondary p-4">
              <h4 className="text-sm font-medium text-white mb-4">Age Distribution</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ageGroupData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ageGroupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#141930",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {ageGroupData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground">{entry.name}: {entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Locations */}
            <div className="card-secondary p-4">
              <h4 className="text-sm font-medium text-white mb-4">Top Locations</h4>
              <div className="space-y-3">
                {channel.audienceInsights?.topLocations?.map((location: string, index: number) => (
                  <div key={location} className="flex items-center justify-between">
                    <span className="text-sm text-white">{location}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full bg-background/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
                          style={{ width: `${100 - index * 20}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{100 - index * 20}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Industries */}
            <div className="card-secondary p-4">
              <h4 className="text-sm font-medium text-white mb-4">Top Industries</h4>
              <div className="space-y-3">
                {channel.audienceInsights?.topIndustries?.map((industry: string, index: number) => (
                  <div key={industry} className="flex items-center justify-between">
                    <span className="text-sm text-white">{industry}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full bg-background/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green-400 to-cyan-400"
                          style={{ width: `${90 - index * 15}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{90 - index * 15}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement by Time */}
            <div className="card-secondary p-4">
              <h4 className="text-sm font-medium text-white mb-4">Engagement by Time</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#141930",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="engagement" fill="#00E5CC" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Channel Settings</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-secondary p-4 space-y-4">
              <h4 className="text-sm font-medium text-white">Connection Status</h4>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getPlatformColor(channel.platform)}`}>
                    {getPlatformIcon(channel.platform)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{channel.accountName}</p>
                    <p className="text-xs text-muted-foreground">{channel.handle}</p>
                  </div>
                </div>
                {getStatusBadge(channel.status)}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-red-400 border-red-500/50 hover:bg-red-500/10">
                  Disconnect
                </Button>
              </div>
            </div>

            <div className="card-secondary p-4 space-y-4">
              <h4 className="text-sm font-medium text-white">API Quota</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Usage</span>
                  <span className="text-white">{channel.apiQuota}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-background/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
                    style={{ width: `${channel.apiQuota}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Resets in 24 hours</p>
              </div>
            </div>

            <div className="card-secondary p-4 space-y-4">
              <h4 className="text-sm font-medium text-white">Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">New mentions</span>
                  <div className="w-10 h-6 rounded-full bg-cyan-500 flex items-center justify-end px-1">
                    <div className="w-4 h-4 rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">Engagement alerts</span>
                  <div className="w-10 h-6 rounded-full bg-cyan-500 flex items-center justify-end px-1">
                    <div className="w-4 h-4 rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">Weekly reports</span>
                  <div className="w-10 h-6 rounded-full bg-gray-600 flex items-center justify-start px-1">
                    <div className="w-4 h-4 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card-secondary p-4 space-y-4">
              <h4 className="text-sm font-medium text-white">Automation</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">Auto-respond to mentions</span>
                  <div className="w-10 h-6 rounded-full bg-gray-600 flex items-center justify-start px-1">
                    <div className="w-4 h-4 rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">Schedule posts</span>
                  <div className="w-10 h-6 rounded-full bg-cyan-500 flex items-center justify-end px-1">
                    <div className="w-4 h-4 rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">AI content suggestions</span>
                  <div className="w-10 h-6 rounded-full bg-cyan-500 flex items-center justify-end px-1">
                    <div className="w-4 h-4 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-secondary p-4 border-red-500/20 bg-red-500/5">
            <h4 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h4>
            <p className="text-xs text-muted-foreground mb-4">
              These actions are irreversible. Please be certain before proceeding.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-red-400 border-red-500/50 hover:bg-red-500/10">
                Delete Channel Data
              </Button>
              <Button variant="outline" size="sm" className="text-red-400 border-red-500/50 hover:bg-red-500/10">
                Remove Channel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
