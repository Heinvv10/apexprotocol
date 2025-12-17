"use client";

import * as React from "react";
import Link from "next/link";
import {
  Lightbulb,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock,
  Sparkles,
  Target,
  Zap,
  BarChart3,
  Filter,
  Search,
  X,
  RotateCcw,
  LayoutGrid,
  List,
  FileSearch,
  AlertCircle,
  Loader2,
  RefreshCw,
  Bot,
} from "lucide-react";

// Page Header Component
function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradRecommendations)" />
            <defs>
              <linearGradient id="apexGradRecommendations" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5CC"/>
                <stop offset="1" stopColor="#8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          APEX
        </span>
        <span className="text-xl font-light text-foreground ml-1">Recommendations</span>
      </div>

      {/* AI Status */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">AI Status:</span>
        <span className="text-xs text-primary font-medium">Active</span>
      </div>
    </div>
  );
}

// Decorative Star Component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientRecommendations)"
        />
        <defs>
          <linearGradient id="starGradientRecommendations" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSelectedBrand } from "@/stores";
import {
  useRecommendationsByBrand,
  useUpdateRecommendationStatus,
  Recommendation as APIRecommendation,
} from "@/hooks/useRecommendations";

// Priority levels with muted semantic colors (Linear-style)
type Priority = "critical" | "high" | "medium" | "low";
type RecommendationType = "schema" | "content" | "technical" | "ai-visibility";
type Status = "pending" | "in_progress" | "completed" | "dismissed";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  type: RecommendationType;
  status: Status;
  impact: number; // 1-10
  effort: number; // 1-10
  confidence: number; // percentage
  affectedPages: string[];
  suggestedAction: string;
}

// Priority badge styles (muted semantic colors on transparent bg)
const priorityConfig: Record<Priority, { label: string; className: string }> = {
  critical: {
    label: "Critical",
    className: "bg-red-500/10 text-[hsl(var(--error))] border-[hsl(var(--error)/0.2)]",
  },
  high: {
    label: "High",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/10 text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.2)]",
  },
  low: {
    label: "Low",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
};

// Type badge styles (outlined pills with gray border)
const typeConfig: Record<RecommendationType, { label: string; icon: React.ElementType }> = {
  schema: { label: "Schema", icon: Sparkles },
  content: { label: "Content", icon: BarChart3 },
  technical: { label: "Technical", icon: Zap },
  "ai-visibility": { label: "AI Visibility", icon: Target },
};

// Status configuration
const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: { label: "Pending", className: "text-muted-foreground" },
  in_progress: { label: "In Progress", className: "text-primary" },
  completed: { label: "Completed", className: "text-success" },
  dismissed: { label: "Dismissed", className: "text-muted-foreground/50" },
};

// Mini progress bar component for metrics
function MetricBar({ value, max = 10 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-muted-foreground/40 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{value}</span>
      </div>
  );
}

// Linear-style recommendation card
function RecommendationCard({
  recommendation,
  onStatusChange,
}: {
  recommendation: Recommendation;
  onStatusChange: (id: string, newStatus: Status) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const priority = priorityConfig[recommendation.priority];
  const type = typeConfig[recommendation.type];
  const status = statusConfig[recommendation.status];
  const TypeIcon = type.icon;

  const handleStatusChange = (newStatus: Status, e: React.MouseEvent) => {
    e.stopPropagation();
    onStatusChange(recommendation.id, newStatus);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[#27272A] transition-all duration-200",
        "bg-[#18181B] hover:border-[#3F3F46]",
        recommendation.status === "completed" && "opacity-60",
        recommendation.status === "dismissed" && "opacity-40"
      )}
    >
      {/* Card Header - Clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-4 text-left"
      >
        {/* Expand Icon */}
        <div className="mt-0.5 text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-medium text-foreground leading-tight">
              {recommendation.title}
            </h3>
            {/* Priority Badge */}
            <span
              className={cn(
                "shrink-0 px-2 py-0.5 text-xs font-medium rounded-full border",
                priority.className
              )}
            >
              {priority.label}
            </span>
          </div>

          {/* Description (truncated) */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {recommendation.description}
          </p>

          {/* Meta Row */}
          <div className="flex items-center gap-4 pt-1">
            {/* Type Badge */}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-muted-foreground border border-[#3F3F46] rounded-full">
              <TypeIcon className="h-3 w-3" />
              {type.label}
            </span>

            {/* Status */}
            <span className={cn("text-xs", status.className)}>
              {recommendation.status === "in_progress" && (
                <Clock className="inline h-3 w-3 mr-1" />
              )}
              {recommendation.status === "completed" && (
                <Check className="inline h-3 w-3 mr-1" />
              )}
              {status.label}
            </span>

            {/* Metrics - Subtle inline display */}
            <div className="hidden sm:flex items-center gap-4 ml-auto text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                Impact: <MetricBar value={recommendation.impact} />
              </span>
              <span className="flex items-center gap-1">
                Effort: <MetricBar value={recommendation.effort} />
              </span>
              <span>{recommendation.confidence}% confident</span>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Content - Smooth animation */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 pt-0 pl-12 space-y-4 border-t border-[#27272A]">
          {/* Full Description */}
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              {recommendation.description}
            </p>
          </div>

          {/* Metrics (shown on mobile in expanded view) */}
          <div className="sm:hidden flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              Impact: <MetricBar value={recommendation.impact} />
            </span>
            <span className="flex items-center gap-1">
              Effort: <MetricBar value={recommendation.effort} />
            </span>
            <span>{recommendation.confidence}% confident</span>
          </div>

          {/* Suggested Action */}
          <div className="p-3 rounded-lg bg-[#0A0A0B] border border-[#27272A]">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Suggested Action
            </div>
            <p className="text-sm text-foreground">
              {recommendation.suggestedAction}
            </p>
          </div>

          {/* Affected Pages */}
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Affected Pages ({recommendation.affectedPages.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendation.affectedPages.map((page) => (
                <span
                  key={page}
                  className="px-2 py-1 text-xs bg-[#0A0A0B] border border-[#27272A] rounded text-muted-foreground"
                >
                  {page}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons - Ghost style with actual functionality */}
          <div className="flex items-center gap-2 pt-2">
            {recommendation.status === "pending" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs hover:bg-success/10 hover:text-success"
                  onClick={(e) => handleStatusChange("completed", e)}
                >
                  <Check className="h-3 w-3 mr-1.5" />
                  Mark Complete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs hover:bg-primary/10 hover:text-primary"
                  onClick={(e) => handleStatusChange("in_progress", e)}
                >
                  <Clock className="h-3 w-3 mr-1.5" />
                  Start Working
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs hover:bg-muted/50 text-muted-foreground"
                  onClick={(e) => handleStatusChange("dismissed", e)}
                >
                  <X className="h-3 w-3 mr-1.5" />
                  Dismiss
                </Button>
              </>
            )}
            {recommendation.status === "in_progress" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs hover:bg-success/10 hover:text-success"
                  onClick={(e) => handleStatusChange("completed", e)}
                >
                  <Check className="h-3 w-3 mr-1.5" />
                  Mark Complete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs hover:bg-muted/50 text-muted-foreground"
                  onClick={(e) => handleStatusChange("pending", e)}
                >
                  <RotateCcw className="h-3 w-3 mr-1.5" />
                  Reset to Pending
                </Button>
              </>
            )}
            {recommendation.status === "completed" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs hover:bg-muted/50 text-muted-foreground"
                onClick={(e) => handleStatusChange("pending", e)}
              >
                <RotateCcw className="h-3 w-3 mr-1.5" />
                Reopen
              </Button>
            )}
            {recommendation.status === "dismissed" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs hover:bg-muted/50 text-muted-foreground"
                onClick={(e) => handleStatusChange("pending", e)}
              >
                <RotateCcw className="h-3 w-3 mr-1.5" />
                Restore
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs hover:bg-accent/50 ml-auto"
            >
              View Details
              <ArrowUpRight className="h-3 w-3 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Filter tabs (Outcrowd-style pill-shaped)
const filterTabs = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

const priorityTabs = [
  { id: "all", label: "All Priorities" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

// Transform API recommendation to UI Recommendation format
function apiToUIRecommendation(rec: APIRecommendation): Recommendation {
  // Map category to type
  const categoryToType: Record<string, RecommendationType> = {
    technical: "technical",
    content: "content",
    authority: "schema", // Map authority to schema
    ai_readiness: "ai-visibility",
  };

  // Map effort string to number
  const effortToNumber: Record<string, number> = {
    low: 3,
    medium: 5,
    high: 8,
  };

  return {
    id: rec.id,
    title: rec.title,
    description: rec.description,
    priority: rec.priority,
    type: categoryToType[rec.category] || "technical",
    status: rec.status,
    impact: rec.impact,
    effort: effortToNumber[rec.effort] || 5,
    confidence: 85, // Default confidence since API doesn't provide it
    affectedPages: [], // Not in API response
    suggestedAction: rec.actionUrl || "Review and implement this recommendation",
  };
}

// Prompt to select a brand
function SelectBrandPrompt() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-lg space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center">
            <Bot className="w-10 h-10 text-accent-purple" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Select a Brand to View Recommendations</h2>
          <p className="text-muted-foreground">
            Choose a brand from the dropdown in the header to see AI-powered recommendations.
          </p>
        </div>
        <Link
          href="/dashboard/brands"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-purple/10 text-accent-purple border border-accent-purple/30 font-medium hover:bg-accent-purple/20 transition-all"
        >
          Manage Brands
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Loading state component
function RecommendationsLoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[500px]" data-testid="recommendations-loading">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-accent-purple animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading recommendations...</p>
      </div>
    </div>
  );
}

// Error state component
function RecommendationsErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 border border-error/30 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Failed to Load Recommendations</h3>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-purple text-white font-medium hover:bg-accent-purple/90 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}

// Empty state component for when no recommendations exist
function RecommendationsEmptyState() {
  const features = [
    { icon: Target, title: "Schema Optimization", description: "Add structured data for better AI comprehension" },
    { icon: BarChart3, title: "Content Analysis", description: "Identify thin content and improve depth" },
    { icon: Zap, title: "Technical Fixes", description: "Fix issues affecting AI crawlability" },
  ];

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-lg space-y-8">
        {/* Animated icon */}
        <div className="relative mx-auto w-24 h-24">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          />
          <div className="relative w-24 h-24 rounded-2xl bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center">
            <Lightbulb className="w-12 h-12 text-accent-purple" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-purple/10 border border-accent-purple/30">
          <Sparkles className="w-4 h-4 text-accent-purple animate-pulse" />
          <span className="text-sm text-accent-purple font-medium">Smart Recommendations</span>
        </div>

        {/* Title and description */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            No Recommendations Yet
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Run your first site audit to get personalized AI-powered recommendations
            for improving your GEO score and AI visibility.
          </p>
        </div>

        {/* What you'll get */}
        <div className="grid gap-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-accent-purple" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{feature.title}</div>
                <div className="text-xs text-muted-foreground">{feature.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Link
          href="/dashboard/audit"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-purple text-white font-medium hover:bg-accent-purple/90 transition-all shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.4)]"
        >
          <FileSearch className="w-5 h-5" />
          Run First Audit
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  // Get selected brand from global state
  const selectedBrand = useSelectedBrand();

  // Fetch recommendations for selected brand
  const {
    data: recommendationsResponse,
    isLoading,
    error,
    refetch,
  } = useRecommendationsByBrand(selectedBrand?.id || "", {
    limit: 50,
    sort: "priority",
    order: "desc",
  });

  // Status update mutation
  const updateStatusMutation = useUpdateRecommendationStatus();

  // Transform API recommendations to UI format
  const recommendations: Recommendation[] = React.useMemo(() => {
    if (!recommendationsResponse?.recommendations) return [];
    return recommendationsResponse.recommendations.map(apiToUIRecommendation);
  }, [recommendationsResponse]);

  const [statusFilter, setStatusFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Handle status change using mutation
  const handleStatusChange = (id: string, newStatus: Status) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  // Filter recommendations
  const filteredRecommendations = recommendations.filter((rec) => {
    const matchesStatus = statusFilter === "all" || rec.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || rec.priority === priorityFilter;
    const matchesSearch =
      searchQuery === "" ||
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Stats
  const stats = {
    total: recommendations.length,
    pending: recommendations.filter((r) => r.status === "pending").length,
    inProgress: recommendations.filter((r) => r.status === "in_progress").length,
    completed: recommendations.filter((r) => r.status === "completed").length,
    critical: recommendations.filter((r) => r.priority === "critical" && r.status === "pending").length,
  };

  // Determine current state
  const noBrandSelected = !selectedBrand;
  const hasData = recommendations.length > 0;

  // State 1: No brand selected
  if (noBrandSelected) {
    return (
      <div className="space-y-6 relative">
        <PageHeader />
        <SelectBrandPrompt />
        <DecorativeStar />
      </div>
    );
  }

  // State 2: Loading
  if (isLoading) {
    return (
      <div className="space-y-6 relative">
        <PageHeader />
        <RecommendationsLoadingState />
        <DecorativeStar />
      </div>
    );
  }

  // State 3: Error
  if (error) {
    return (
      <div className="space-y-6 relative">
        <PageHeader />
        <RecommendationsErrorState error={error as Error} onRetry={() => refetch()} />
        <DecorativeStar />
      </div>
    );
  }

  // State 4: No data (empty state)
  if (!hasData) {
    return (
      <div className="space-y-6 relative">
        <PageHeader />
        <RecommendationsEmptyState />
        <DecorativeStar />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Page Header */}
      <PageHeader />

      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#18181B] border border-[#27272A]">
          <Button variant="ghost" size="sm" className="h-8 px-3 bg-primary/20 text-primary">
            <List className="h-4 w-4 mr-1.5" />
            List
          </Button>
          <Link href="/dashboard/recommendations/kanban">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-muted-foreground hover:text-foreground">
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Kanban
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card-tertiary">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="card-tertiary">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Pending</div>
          <div className="text-2xl font-bold text-warning mt-1">{stats.pending}</div>
        </div>
        <div className="card-tertiary">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">In Progress</div>
          <div className="text-2xl font-bold text-primary mt-1">{stats.inProgress}</div>
        </div>
        <div className="card-tertiary">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Completed</div>
          <div className="text-2xl font-bold text-success mt-1">{stats.completed}</div>
        </div>
      </div>

      {/* Critical Alert */}
      {stats.critical > 0 && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-[hsl(var(--error)/0.2)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[hsl(var(--error)/0.2)]">
              <Lightbulb className="h-4 w-4 text-[hsl(var(--error))]" />
            </div>
            <div>
              <div className="font-medium text-[hsl(var(--error))]">
                {stats.critical} Critical Recommendation{stats.critical !== 1 ? "s" : ""} Pending
              </div>
              <div className="text-sm text-[hsl(var(--error))]/70">
                Address these first for maximum GEO score improvement
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recommendations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#18181B] border-[#27272A]"
          />
        </div>

        {/* Status Filter - Pill-shaped tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#18181B] border border-[#27272A]">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150",
                statusFilter === tab.id
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-[#27272A]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 px-3 rounded-lg text-sm bg-[#18181B] border border-[#27272A] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {priorityTabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {filteredRecommendations.length === 0 ? (
          <div className="card-secondary p-8 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <div className="text-muted-foreground">
              No recommendations match your filters
            </div>
          </div>
        ) : (
          filteredRecommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* Results Count */}
      {filteredRecommendations.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredRecommendations.length} of {recommendations.length} recommendations
        </div>
      )}

      {/* Decorative Star */}
      <DecorativeStar />
    </div>
  );
}
