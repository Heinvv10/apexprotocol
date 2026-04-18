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
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Grid3x3,
  List,
  Mail,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { useContentCalendar } from "@/hooks/useMarketing";

// Mock content calendar data
const mockContentItems = [
  {
    id: "content_001",
    title: "New Feature Announcement: AI-Powered Insights",
    type: "blog",
    channel: "blog",
    status: "published",
    publishDate: new Date(2026, 0, 10).toISOString(),
    author: "Sarah Williams",
    assignee: "John Doe",
    tags: ["product", "ai", "feature-launch"],
    wordCount: 1200,
    approver: "Jane Smith",
    approvedAt: new Date(2026, 0, 9).toISOString(),
  },
  {
    id: "content_002",
    title: "10 Tips for Better Email Marketing in 2026",
    type: "blog",
    channel: "blog",
    status: "scheduled",
    publishDate: new Date(2026, 0, 18).toISOString(),
    author: "Mike Johnson",
    assignee: "Sarah Williams",
    tags: ["email-marketing", "tips", "best-practices"],
    wordCount: 1500,
    approver: null,
    approvedAt: null,
  },
  {
    id: "content_003",
    title: "LinkedIn: How our customers increased conversions by 40%",
    type: "social",
    channel: "linkedin",
    status: "scheduled",
    publishDate: new Date(2026, 0, 16).toISOString(),
    author: "Sarah Williams",
    assignee: "Mike Johnson",
    tags: ["case-study", "testimonial", "linkedin"],
    wordCount: 280,
    approver: "Jane Smith",
    approvedAt: new Date(2026, 0, 15).toISOString(),
  },
  {
    id: "content_004",
    title: "Twitter: New blog post - AI marketing trends",
    type: "social",
    channel: "twitter",
    status: "scheduled",
    publishDate: new Date(2026, 0, 18).toISOString(),
    author: "John Doe",
    assignee: "Sarah Williams",
    tags: ["blog-promotion", "twitter", "ai"],
    wordCount: 140,
    approver: null,
    approvedAt: null,
  },
  {
    id: "content_005",
    title: "Weekly Newsletter: This Week in Marketing",
    type: "email",
    channel: "email",
    status: "in_review",
    publishDate: new Date(2026, 0, 20).toISOString(),
    author: "Mike Johnson",
    assignee: "John Doe",
    tags: ["newsletter", "weekly", "digest"],
    wordCount: 800,
    approver: "Jane Smith",
    approvedAt: null,
  },
  {
    id: "content_006",
    title: "Product Demo Video: Getting Started Guide",
    type: "video",
    channel: "youtube",
    status: "in_progress",
    publishDate: new Date(2026, 0, 22).toISOString(),
    author: "John Doe",
    assignee: "Mike Johnson",
    tags: ["video", "tutorial", "onboarding"],
    wordCount: 0,
    approver: null,
    approvedAt: null,
  },
  {
    id: "content_007",
    title: "Instagram Reel: Quick Marketing Tip #5",
    type: "social",
    channel: "instagram",
    status: "draft",
    publishDate: new Date(2026, 0, 19).toISOString(),
    author: "Sarah Williams",
    assignee: "Sarah Williams",
    tags: ["instagram", "reel", "tips"],
    wordCount: 50,
    approver: null,
    approvedAt: null,
  },
  {
    id: "content_008",
    title: "Case Study: How Brand X achieved 3x ROI",
    type: "blog",
    channel: "blog",
    status: "draft",
    publishDate: new Date(2026, 0, 25).toISOString(),
    author: "Mike Johnson",
    assignee: "John Doe",
    tags: ["case-study", "roi", "success-story"],
    wordCount: 2000,
    approver: null,
    approvedAt: null,
  },
  {
    id: "content_009",
    title: "LinkedIn: Join our webinar on AI marketing",
    type: "social",
    channel: "linkedin",
    status: "scheduled",
    publishDate: new Date(2026, 0, 21).toISOString(),
    author: "John Doe",
    assignee: "Mike Johnson",
    tags: ["webinar", "event", "linkedin"],
    wordCount: 200,
    approver: "Jane Smith",
    approvedAt: new Date(2026, 0, 20).toISOString(),
  },
  {
    id: "content_010",
    title: "Twitter: Customer success story snippet",
    type: "social",
    channel: "twitter",
    status: "published",
    publishDate: new Date(2026, 0, 12).toISOString(),
    author: "Sarah Williams",
    assignee: "Sarah Williams",
    tags: ["testimonial", "twitter", "social-proof"],
    wordCount: 120,
    approver: "Jane Smith",
    approvedAt: new Date(2026, 0, 11).toISOString(),
  },
  {
    id: "content_011",
    title: "Email: Product update - January features",
    type: "email",
    channel: "email",
    status: "scheduled",
    publishDate: new Date(2026, 0, 23).toISOString(),
    author: "Mike Johnson",
    assignee: "John Doe",
    tags: ["product-update", "email", "features"],
    wordCount: 600,
    approver: "Jane Smith",
    approvedAt: new Date(2026, 0, 22).toISOString(),
  },
  {
    id: "content_012",
    title: "Blog: The Future of AI in Marketing",
    type: "blog",
    channel: "blog",
    status: "in_review",
    publishDate: new Date(2026, 0, 28).toISOString(),
    author: "John Doe",
    assignee: "Sarah Williams",
    tags: ["ai", "future", "trends"],
    wordCount: 1800,
    approver: "Jane Smith",
    approvedAt: null,
  },
];

export default function ContentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 15)); // January 15, 2026
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  // API data with fallback to mock data
  const { events: apiEvents, isLoading, isError, error } = useContentCalendar();
  const contentItems = apiEvents.length > 0 ? apiEvents : mockContentItems;

  // Calculate stats
  const totalItems = contentItems.length;
  const publishedItems = contentItems.filter((item) => item.status === "published").length;
  const scheduledItems = contentItems.filter((item) => item.status === "scheduled").length;
  const draftItems = contentItems.filter((item) => item.status === "draft").length;
  const inReviewItems = contentItems.filter((item) => item.status === "in_review").length;
  const inProgressItems = contentItems.filter((item) => item.status === "in_progress").length;

  // Calendar helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getContentForDate = (date: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
    return contentItems.filter((item) => {
      const itemAny = item as Record<string, unknown>;
      const dateStr = (itemAny.publishDate || itemAny.scheduledDate) as string | undefined;
      if (!dateStr) return false;
      const itemDate = new Date(dateStr);
      return (
        itemDate.getFullYear() === targetDate.getFullYear() &&
        itemDate.getMonth() === targetDate.getMonth() &&
        itemDate.getDate() === targetDate.getDate()
      );
    });
  };

  // Filter content items
  const filteredItems = contentItems.filter((item) => {
    const itemAny = item as Record<string, unknown>;
    const tags = (itemAny.tags || []) as string[];
    const channel = itemAny.channel as string | undefined;
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesChannel = channelFilter === "all" || channel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const getChannelIcon = (channel: string | undefined) => {
    switch (channel || "blog") {
      case "email":
        return <Mail className="h-3 w-3" />;
      case "twitter":
        return <Twitter className="h-3 w-3" />;
      case "linkedin":
        return <Linkedin className="h-3 w-3" />;
      case "instagram":
        return <Instagram className="h-3 w-3" />;
      case "youtube":
        return <Youtube className="h-3 w-3" />;
      case "blog":
        return <FileText className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getChannelColor = (channel: string | undefined) => {
    const colors: Record<string, string> = {
      email: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      twitter: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      linkedin: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      instagram: "bg-pink-500/10 text-pink-400 border-pink-500/30",
      youtube: "bg-red-500/10 text-red-400 border-red-500/30",
      blog: "bg-green-500/10 text-green-400 border-green-500/30",
    };
    return colors[channel || "blog"] || "bg-gray-500/10 text-gray-400 border-gray-500/30";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Published
          </span>
        );
      case "scheduled":
        return (
          <span className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Scheduled
          </span>
        );
      case "in_review":
        return (
          <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium flex items-center gap-1">
            <Eye className="h-3 w-3" />
            In Review
          </span>
        );
      case "in_progress":
        return (
          <span className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium flex items-center gap-1">
            <Edit className="h-3 w-3" />
            In Progress
          </span>
        );
      case "draft":
        return (
          <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Draft
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading content calendar...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load content calendar</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching calendar events"}
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
          <h1 className="text-3xl font-bold text-white">Content Calendar</h1>
          <p className="text-muted-foreground mt-1">Plan, schedule, and track content across all channels</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent-purple hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          New Content
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold text-white mt-1">{totalItems}</p>
            </div>
            <Calendar className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{publishedItems}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{scheduledItems}</p>
            </div>
            <Clock className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Review</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{inReviewItems}</p>
            </div>
            <Eye className="h-5 w-5 text-yellow-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{inProgressItems}</p>
            </div>
            <Edit className="h-5 w-5 text-purple-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className="text-2xl font-bold text-gray-400 mt-1">{draftItems}</p>
            </div>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card-secondary p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex gap-1 border border-border/50 rounded-lg p-1 bg-background/50">
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className="h-8"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar/List View */}
      {viewMode === "calendar" ? (
        <div className="card-secondary p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[120px] bg-background/30 rounded-lg border border-border/30" />
            ))}

            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const contentForDay = getContentForDate(day);
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`min-h-[120px] p-2 rounded-lg border transition-colors ${
                    isToday
                      ? "bg-cyan-500/5 border-cyan-500/50"
                      : "bg-background/30 border-border/30 hover:border-border/50"
                  }`}
                >
                  <div className={`text-sm font-semibold mb-2 ${isToday ? "text-cyan-400" : "text-white"}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {contentForDay.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className={`px-2 py-1 rounded text-xs border cursor-pointer hover:opacity-80 transition-opacity ${getChannelColor(
                          item.channel
                        )}`}
                        title={item.title}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          {getChannelIcon(item.channel)}
                          <span className="font-medium truncate">{item.title.substring(0, 20)}...</span>
                        </div>
                      </div>
                    ))}
                    {contentForDay.length > 3 && (
                      <div className="text-xs text-muted-foreground px-2">+{contentForDay.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card-secondary p-4">
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-cyan-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-6 w-6 rounded flex items-center justify-center ${getChannelColor(item.channel)}`}>
                        {getChannelIcon(item.channel)}
                      </div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>By {item.author}</span>
                      <span>•</span>
                      <span>Assigned to {item.assignee}</span>
                      {(item.wordCount ?? 0) > 0 && (
                        <>
                          <span>•</span>
                          <span>{item.wordCount} words</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(item.status)}
                    <div className="text-sm text-muted-foreground">
                      <div className="text-right">{formatDate(item.publishDate)}</div>
                      <div className="text-right text-xs">{formatTime(item.publishDate)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex flex-wrap gap-2">
                    {(item.tags || []).map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-full bg-background/50 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No content found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or create new content</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Button>
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
