"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Calendar,
  Clock,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Edit,
  Trash2,
  Send,
  Eye,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { useSocialPosts } from "@/hooks/useSocial";

// Mock post data
const mockPosts = [
  {
    id: "post_001",
    platform: "linkedin",
    content: "Excited to announce our latest AI-powered content optimization features! 🚀 Now you can automatically optimize your content for ChatGPT, Claude, and other AI platforms. #GEO #AEO #AIOptimization",
    mediaUrls: [],
    status: "scheduled" as const,
    scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    author: "Marketing Team",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "post_002",
    platform: "twitter",
    content: "Did you know? 65% of consumers now discover brands through AI assistants. Is your brand optimized for AI visibility? Learn more in our latest guide 👉 [link]",
    mediaUrls: [],
    status: "scheduled" as const,
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    author: "Content Team",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "post_003",
    platform: "linkedin",
    content: "Case study alert! 📊 See how TechCorp increased their AI visibility by 240% in just 3 months using our platform. Download the full case study: [link]",
    mediaUrls: [],
    status: "published" as const,
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    engagement: {
      likes: 124,
      comments: 18,
      shares: 32,
      views: 3847,
    },
    author: "Marketing Team",
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "post_004",
    platform: "instagram",
    content: "Behind the scenes: Our team building the future of AI content optimization 💡✨ #TechLife #Innovation #GEO",
    mediaUrls: [],
    status: "published" as const,
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    engagement: {
      likes: 287,
      comments: 45,
      shares: 12,
      views: 5432,
    },
    author: "Social Team",
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "post_005",
    platform: "twitter",
    content: "Quick tip: Add FAQ schema to your content to increase AI citation rates by up to 42%! Here's how: [link] #SEO #GEO #ContentOptimization",
    mediaUrls: [],
    status: "draft" as const,
    author: "Content Team",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

export default function PostingPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  // Fetch posts from API
  const { posts, isLoading, isError, error } = useSocialPosts(null);

  // Use API data if available, fallback to mock data
  const allPosts = posts.length > 0 ? posts : mockPosts;

  // Calculate stats
  const totalPosts = allPosts.length;
  const scheduledPosts = allPosts.filter((p: any) => p.status === "scheduled").length;
  const publishedPosts = allPosts.filter((p: any) => p.status === "published").length;
  const draftPosts = allPosts.filter((p: any) => p.status === "draft").length;

  // Filter posts
  const filteredPosts = allPosts.filter((post: any) => {
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || post.platform === platformFilter;
    return matchesStatus && matchesPlatform;
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      linkedin: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      instagram: "text-pink-400 bg-pink-500/10 border-pink-500/30",
      facebook: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
      youtube: "text-red-400 bg-red-500/10 border-red-500/30",
    };
    return colors[platform] || "text-gray-400 bg-gray-500/10 border-gray-500/30";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
            Published
          </Badge>
        );
      case "scheduled":
        return (
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            Scheduled
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/30">
            Draft
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
    const diffDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (diffMs > 0) {
      // Future date (scheduled)
      if (diffHours < 1) return "in less than 1h";
      if (diffHours < 24) return `in ${diffHours}h`;
      return `in ${diffDays}d`;
    } else {
      // Past date (published)
      if (diffHours < 1) return "less than 1h ago";
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Social Posting</h1>
          <p className="text-muted-foreground mt-1">Schedule and publish content across platforms</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading posts...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load posts</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching social posts"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Posts</p>
              <p className="text-2xl font-bold text-white mt-1">{totalPosts}</p>
            </div>
            <BarChart3 className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{scheduledPosts}</p>
            </div>
            <Clock className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{publishedPosts}</p>
            </div>
            <Send className="h-5 w-5 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className="text-2xl font-bold text-gray-400 mt-1">{draftPosts}</p>
            </div>
            <Edit className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post: any) => (
          <div key={post.id} className="card-secondary p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-md border ${getPlatformColor(post.platform)}`}>
                    {getPlatformIcon(post.platform)}
                    <span className="text-xs font-medium capitalize">{post.platform}</span>
                  </div>
                  {getStatusBadge(post.status)}
                  {post.scheduledFor && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(post.scheduledFor)}
                    </div>
                  )}
                  {post.publishedAt && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatTimestamp(post.publishedAt)}
                    </div>
                  )}
                </div>

                <p className="text-sm text-white leading-relaxed mb-2">{post.content}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>By {post.author}</span>
                  {post.engagement && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-3">
                        <span>{post.engagement.views.toLocaleString()} views</span>
                        <span>{post.engagement.likes} likes</span>
                        <span>{post.engagement.comments} comments</span>
                        <span>{post.engagement.shares} shares</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && !isLoading && (
        <div className="card-secondary p-12 text-center">
          <p className="text-muted-foreground">No posts found matching your filters</p>
        </div>
      )}
    </div>
  );
}
