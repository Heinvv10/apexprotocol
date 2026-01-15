"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Plus,
  Search,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  TrendingUp,
  Users,
  MessageCircle,
  Heart,
  Share2,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  BarChart3,
  Zap,
} from "lucide-react";

// Mock social media channels data
const mockChannels = [
  {
    id: "channel_001",
    platform: "linkedin",
    accountName: "Apex Marketing",
    handle: "@apex-marketing",
    status: "active",
    followers: 12450,
    followersGrowth: 8.5,
    postsThisMonth: 18,
    engagement: 4.2,
    engagementGrowth: 12.3,
    avgReach: 3200,
    avgLikes: 85,
    avgComments: 12,
    avgShares: 8,
    lastPost: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    health: "excellent",
    apiQuota: 85,
    postingFrequency: "3-4 per week",
  },
  {
    id: "channel_002",
    platform: "twitter",
    accountName: "Apex (@ApexMarketing)",
    handle: "@ApexMarketing",
    status: "active",
    followers: 8720,
    followersGrowth: 5.2,
    postsThisMonth: 42,
    engagement: 2.8,
    engagementGrowth: -2.1,
    avgReach: 1800,
    avgLikes: 45,
    avgComments: 8,
    avgShares: 15,
    lastPost: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    connectedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    health: "good",
    apiQuota: 92,
    postingFrequency: "1-2 per day",
  },
  {
    id: "channel_003",
    platform: "instagram",
    accountName: "Apex Marketing",
    handle: "@apex.marketing",
    status: "active",
    followers: 15680,
    followersGrowth: 15.7,
    postsThisMonth: 12,
    engagement: 6.8,
    engagementGrowth: 18.5,
    avgReach: 4500,
    avgLikes: 320,
    avgComments: 25,
    avgShares: 0,
    lastPost: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    health: "excellent",
    apiQuota: 78,
    postingFrequency: "3-4 per week",
  },
  {
    id: "channel_004",
    platform: "youtube",
    accountName: "Apex Marketing Channel",
    handle: "@ApexMarketing",
    status: "active",
    followers: 3240,
    followersGrowth: 22.4,
    postsThisMonth: 4,
    engagement: 8.5,
    engagementGrowth: 25.8,
    avgReach: 1200,
    avgLikes: 95,
    avgComments: 18,
    avgShares: 12,
    lastPost: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    health: "excellent",
    apiQuota: 65,
    postingFrequency: "1 per week",
  },
  {
    id: "channel_005",
    platform: "facebook",
    accountName: "Apex Marketing Page",
    handle: "ApexMarketingOfficial",
    status: "warning",
    followers: 6890,
    followersGrowth: -1.2,
    postsThisMonth: 8,
    engagement: 1.5,
    engagementGrowth: -8.5,
    avgReach: 980,
    avgLikes: 28,
    avgComments: 4,
    avgShares: 6,
    lastPost: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    health: "needs-attention",
    apiQuota: 95,
    postingFrequency: "2 per week",
  },
  {
    id: "channel_006",
    platform: "tiktok",
    accountName: "Apex Tips",
    handle: "@apex.tips",
    status: "inactive",
    followers: 1250,
    followersGrowth: 0,
    postsThisMonth: 0,
    engagement: 0,
    engagementGrowth: 0,
    avgReach: 0,
    avgLikes: 0,
    avgComments: 0,
    avgShares: 0,
    lastPost: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    health: "inactive",
    apiQuota: 100,
    postingFrequency: "Not posting",
  },
];

// Mock recent activity
const mockRecentActivity = [
  {
    id: "activity_001",
    platform: "twitter",
    action: "posted",
    content: "New blog post: 10 Tips for Better Email Marketing",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    engagement: { likes: 12, comments: 3, shares: 5 },
  },
  {
    id: "activity_002",
    platform: "linkedin",
    action: "posted",
    content: "Case study: How our customers increased conversions by 40%",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    engagement: { likes: 45, comments: 8, shares: 12 },
  },
  {
    id: "activity_003",
    platform: "instagram",
    action: "posted",
    content: "Quick marketing tip: Always test your subject lines",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    engagement: { likes: 156, comments: 12, shares: 0 },
  },
  {
    id: "activity_004",
    platform: "youtube",
    action: "published",
    content: "Product Demo: Getting Started with Apex",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    engagement: { likes: 48, comments: 15, shares: 8 },
  },
  {
    id: "activity_005",
    platform: "facebook",
    action: "posted",
    content: "Join our webinar next week on AI marketing trends",
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    engagement: { likes: 18, comments: 4, shares: 6 },
  },
];

export default function SocialMediaChannelsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  // Calculate stats
  const totalChannels = mockChannels.length;
  const activeChannels = mockChannels.filter((c) => c.status === "active").length;
  const totalFollowers = mockChannels.reduce((sum, c) => sum + c.followers, 0);
  const avgEngagement =
    mockChannels.length > 0
      ? mockChannels.reduce((sum, c) => sum + c.engagement, 0) / mockChannels.length
      : 0;
  const totalPosts = mockChannels.reduce((sum, c) => sum + c.postsThisMonth, 0);

  // Filter channels
  const filteredChannels = mockChannels.filter((channel) => {
    const matchesSearch =
      searchQuery === "" ||
      channel.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.platform.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || channel.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || channel.platform === platformFilter;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <Twitter className="h-5 w-5" />;
      case "linkedin":
        return <Linkedin className="h-5 w-5" />;
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "youtube":
        return <Youtube className="h-5 w-5" />;
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      default:
        return <Share2 className="h-5 w-5" />;
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
          <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        );
      case "warning":
        return (
          <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Warning
          </span>
        );
      case "inactive":
        return (
          <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Inactive
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium">
            {status}
          </span>
        );
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
      case "inactive":
        return (
          <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium">
            Inactive
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium">
            {health}
          </span>
        );
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Social Media Channels</h1>
          <p className="text-muted-foreground mt-1">Manage your social media presence across platforms</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push("/admin/social-media/compose")}
            className="bg-gradient-to-r from-[#00E5CC] to-[#8B5CF6] hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Connect Channel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Channels</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-white">{totalChannels}</p>
                <span className="text-xs text-green-400">{activeChannels} active</span>
              </div>
            </div>
            <Share2 className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Followers</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-white">{formatNumber(totalFollowers)}</p>
                <span className="text-xs text-green-400">+8.2%</span>
              </div>
            </div>
            <Users className="h-5 w-5 text-purple-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Engagement</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-white">{avgEngagement.toFixed(1)}%</p>
                <span className="text-xs text-green-400">+5.3%</span>
              </div>
            </div>
            <Heart className="h-5 w-5 text-pink-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Posts This Month</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-white">{totalPosts}</p>
                <span className="text-xs text-green-400">+12%</span>
              </div>
            </div>
            <MessageCircle className="h-5 w-5 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Channel Health</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-green-400">Good</p>
              </div>
            </div>
            <Zap className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-secondary p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels by name, handle, or platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background/50 border-border/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background/50 border-border/50">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChannels.map((channel) => (
          <div
            key={channel.id}
            className="card-tertiary p-4 hover:border-cyan-500/50 transition-colors cursor-pointer"
            onClick={() => router.push(`/admin/social-media/channels/${channel.id}`)}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${getPlatformColor(channel.platform)}`}>
                    {getPlatformIcon(channel.platform)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{channel.accountName}</h3>
                    <p className="text-sm text-muted-foreground">{channel.handle}</p>
                  </div>
                </div>
                {getStatusBadge(channel.status)}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Followers</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-lg font-bold text-white">{formatNumber(channel.followers)}</p>
                    <span className={`text-xs ${channel.followersGrowth > 0 ? "text-green-400" : "text-red-400"}`}>
                      {channel.followersGrowth > 0 ? "+" : ""}
                      {channel.followersGrowth.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-lg font-bold text-white">{channel.engagement.toFixed(1)}%</p>
                    <span className={`text-xs ${channel.engagementGrowth > 0 ? "text-green-400" : "text-red-400"}`}>
                      {channel.engagementGrowth > 0 ? "+" : ""}
                      {channel.engagementGrowth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="p-3 rounded-lg bg-background/30 border border-border/50">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Likes</p>
                    <p className="text-sm font-semibold text-pink-400">{channel.avgLikes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Comments</p>
                    <p className="text-sm font-semibold text-cyan-400">{channel.avgComments}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Shares</p>
                    <p className="text-sm font-semibold text-purple-400">{channel.avgShares}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  <span>Posts: </span>
                  <span className="text-white font-medium">{channel.postsThisMonth} this month</span>
                </div>
                <div>
                  <span>Health: </span>
                  {getHealthBadge(channel.health)}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="text-xs text-muted-foreground">
                  Last post: {formatDate(channel.lastPost)}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8" onClick={(e) => {
                    e.stopPropagation();
                  }}>
                    <Settings className="h-3 w-3 mr-1" />
                    Settings
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8" onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/social-media/channels/${channel.id}`);
                  }}>
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Analytics
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredChannels.length === 0 && (
        <div className="card-secondary p-12 text-center">
          <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No channels found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your filters or connect a new channel</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Connect Channel
          </Button>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card-secondary p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {mockRecentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getPlatformColor(activity.platform)}`}>
                  {getPlatformIcon(activity.platform)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{activity.content}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-pink-400">
                  <Heart className="h-4 w-4" />
                  <span>{activity.engagement.likes}</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-400">
                  <MessageCircle className="h-4 w-4" />
                  <span>{activity.engagement.comments}</span>
                </div>
                {activity.engagement.shares > 0 && (
                  <div className="flex items-center gap-1 text-purple-400">
                    <Share2 className="h-4 w-4" />
                    <span>{activity.engagement.shares}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
