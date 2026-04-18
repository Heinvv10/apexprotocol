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
  Search,
  Plus,
  Mail,
  FileText,
  TrendingUp,
  Eye,
  Copy,
  Edit,
  Trash2,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useEmailTemplates } from "@/hooks/useMarketing";

// Mock email templates data
const mockEmailTemplates = [
  {
    id: "template_001",
    name: "Welcome Email",
    description: "First email sent to new subscribers",
    subject: "Welcome to {{company_name}}! Here's what to expect",
    category: "onboarding",
    status: "active",
    useCount: 1245,
    openRate: 42.5,
    clickRate: 18.3,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["welcome", "onboarding", "high-priority"],
  },
  {
    id: "template_002",
    name: "Weekly Newsletter",
    description: "Weekly digest of latest updates and articles",
    subject: "This Week's Highlights: {{date}}",
    category: "newsletter",
    status: "active",
    useCount: 2850,
    openRate: 38.7,
    clickRate: 14.2,
    createdAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["newsletter", "recurring", "content"],
  },
  {
    id: "template_003",
    name: "Product Launch Announcement",
    description: "Template for announcing new product features",
    subject: "Introducing: {{feature_name}} 🚀",
    category: "product",
    status: "active",
    useCount: 456,
    openRate: 51.2,
    clickRate: 28.5,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["product", "announcement", "high-engagement"],
  },
  {
    id: "template_004",
    name: "Re-engagement Campaign",
    description: "Win back inactive subscribers",
    subject: "We miss you! Here's 20% off to come back",
    category: "retention",
    status: "active",
    useCount: 823,
    openRate: 28.4,
    clickRate: 11.7,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["retention", "discount", "re-engagement"],
  },
  {
    id: "template_005",
    name: "Event Invitation",
    description: "Template for webinar and event invitations",
    subject: "You're invited: {{event_name}} on {{event_date}}",
    category: "events",
    status: "active",
    useCount: 267,
    openRate: 45.8,
    clickRate: 32.1,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["events", "webinar", "invitation"],
  },
  {
    id: "template_006",
    name: "Abandoned Cart",
    description: "Reminder for incomplete purchases",
    subject: "Don't forget! Your cart is waiting",
    category: "transactional",
    status: "active",
    useCount: 1567,
    openRate: 55.3,
    clickRate: 38.9,
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["transactional", "cart", "high-conversion"],
  },
  {
    id: "template_007",
    name: "Customer Success Story",
    description: "Showcase customer testimonials and case studies",
    subject: "How {{customer_name}} achieved {{result}}",
    category: "content",
    status: "active",
    useCount: 189,
    openRate: 34.6,
    clickRate: 16.8,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["case-study", "testimonial", "social-proof"],
  },
  {
    id: "template_008",
    name: "Seasonal Sale",
    description: "Holiday and seasonal promotion template",
    subject: "{{season}} Sale: Up to {{discount}}% Off!",
    category: "promotional",
    status: "draft",
    useCount: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: null,
    tags: ["promotional", "seasonal", "discount"],
  },
];

// Mock recent template activity
const mockRecentActivity = [
  {
    id: "activity_001",
    templateId: "template_006",
    templateName: "Abandoned Cart",
    action: "sent",
    recipient: "Premium Customers",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    result: "success",
  },
  {
    id: "activity_002",
    templateId: "template_001",
    templateName: "Welcome Email",
    action: "sent",
    recipient: "Newsletter Subscribers",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    result: "success",
  },
  {
    id: "activity_003",
    templateId: "template_002",
    templateName: "Weekly Newsletter",
    action: "sent",
    recipient: "All Subscribers",
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    result: "success",
  },
  {
    id: "activity_004",
    templateId: "template_005",
    templateName: "Event Invitation",
    action: "sent",
    recipient: "Webinar Attendees",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    result: "success",
  },
  {
    id: "activity_005",
    templateId: "template_008",
    templateName: "Seasonal Sale",
    action: "updated",
    recipient: "-",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    result: "draft",
  },
];

export default function EmailTemplatesPage() {
  const router = useRouter();

  // API data with fallback to mock data
  const { templates: apiTemplates, isLoading, isError, error } = useEmailTemplates();
  const templates = apiTemplates.length > 0 ? apiTemplates : mockEmailTemplates;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Calculate stats with safe field access
  const totalTemplates = templates.length;
  const activeTemplates = templates.filter((t) => t.category !== "draft").length;
  const draftTemplates = templates.filter((t) => t.category === "draft" || t.category === "custom").length;
  const avgOpenRate =
    totalTemplates > 0
      ? templates.reduce((sum, t) => sum + (t.openRate || 0), 0) / totalTemplates
      : 0;
  const avgClickRate =
    totalTemplates > 0
      ? templates.reduce((sum, t) => sum + (t.clickRate || 0), 0) / totalTemplates
      : 0;
  const totalUses = templates.reduce((sum, t) => sum + (t.useCount || 0), 0);

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const tags = template.tags || [];
    const description = template.description || "";
    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || template.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatRelativeTime = (dateString: string) => {
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

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      onboarding: { label: "Onboarding", className: "bg-cyan-500/10 text-cyan-400" },
      newsletter: { label: "Newsletter", className: "bg-purple-500/10 text-purple-400" },
      product: { label: "Product", className: "bg-green-500/10 text-green-400" },
      retention: { label: "Retention", className: "bg-yellow-500/10 text-yellow-400" },
      events: { label: "Events", className: "bg-blue-500/10 text-blue-400" },
      transactional: { label: "Transactional", className: "bg-red-500/10 text-red-400" },
      content: { label: "Content", className: "bg-indigo-500/10 text-indigo-400" },
      promotional: { label: "Promotional", className: "bg-pink-500/10 text-pink-400" },
    };
    const badge = badges[category] || { label: category, className: "bg-gray-500/10 text-gray-400" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
            Active
          </span>
        );
      case "draft":
        return (
          <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium">
            Draft
          </span>
        );
      case "archived":
        return (
          <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium">
            Archived
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

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      sent: "text-green-400",
      updated: "text-cyan-400",
      created: "text-purple-400",
      archived: "text-yellow-400",
    };
    return colors[action] || "text-muted-foreground";
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "sent":
        return <Mail className="h-4 w-4" />;
      case "updated":
        return <Edit className="h-4 w-4" />;
      case "created":
        return <Plus className="h-4 w-4" />;
      case "archived":
        return <Trash2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Email Templates</h1>
          <p className="text-muted-foreground mt-1">Create, manage, and optimize your email templates</p>
        </div>
        <Button
          onClick={() => router.push("/admin/marketing/email-templates/new")}
          className="bg-gradient-to-r from-primary to-accent-purple hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading email templates...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load email templates</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching email templates"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading and no error */}
      {!isLoading && !isError && (
        <>
          {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Templates</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-white">{totalTemplates}</p>
                <span className="text-xs text-green-400">{activeTemplates} active</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Uses</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-white">{totalUses.toLocaleString()}</p>
                <span className="text-xs text-green-400">+12.5%</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Open Rate</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-white">{avgOpenRate.toFixed(1)}%</p>
                <span className="text-xs text-green-400">+2.3%</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Click Rate</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-white">{avgClickRate.toFixed(1)}%</p>
                <span className="text-xs text-green-400">+1.8%</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-secondary p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates by name, subject, or tags..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background/50 border-border/50">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="retention">Retention</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="transactional">Transactional</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="card-tertiary p-4 hover:border-cyan-500/50 transition-colors cursor-pointer group">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                </div>
                {getStatusBadge(template.status || "active")}
              </div>

              {/* Subject Line */}
              <div className="p-2 rounded bg-background/50 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                <p className="text-sm text-white/80 font-mono">{template.subject}</p>
              </div>

              {/* Category and Tags */}
              <div className="flex flex-wrap gap-2">
                {getCategoryBadge(template.category)}
                {(template.tags || []).slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full bg-background/50 text-muted-foreground text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {(template.tags || []).length > 2 && (
                  <span className="px-2 py-1 rounded-full bg-background/50 text-muted-foreground text-xs">
                    +{(template.tags || []).length - 2}
                  </span>
                )}
              </div>

              {/* Metrics */}
              {template.status === "active" && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Uses</p>
                    <p className="text-sm font-semibold text-white">{(template.useCount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Open Rate</p>
                    <p className="text-sm font-semibold text-cyan-400">{(template.openRate || 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Click Rate</p>
                    <p className="text-sm font-semibold text-purple-400">{(template.clickRate || 0).toFixed(1)}%</p>
                  </div>
                </div>
              )}

              {/* Last Used */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Last used: {formatDate(template.lastUsed || null)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => router.push(`/admin/marketing/email-templates/${template.id}`)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicate
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-xs text-red-400 hover:text-red-300">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="card-secondary p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your filters or create a new template</p>
          <Button onClick={() => router.push("/admin/marketing/email-templates/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card-secondary p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Template Activity</h2>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {mockRecentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/50">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg bg-background/50 flex items-center justify-center ${getActionColor(activity.action)}`}>
                  {getActionIcon(activity.action)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {activity.templateName}
                    <span className="text-muted-foreground ml-2">
                      {activity.action}
                      {activity.recipient !== "-" && ` to ${activity.recipient}`}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.timestamp)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activity.result === "success" && (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
                {activity.result === "draft" && (
                  <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium">
                    Draft
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
