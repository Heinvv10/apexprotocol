"use client";

import * as React from "react";
import Link from "next/link";
import {
  Lightbulb,
  ArrowLeft,
  GripVertical,
  Clock,
  Check,
  X,
  Eye,
  Sparkles,
  BarChart3,
  Zap,
  Target,
  Settings,
  ArrowRight,
  LayoutGrid,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRecommendations, useUpdateRecommendationStatus, useAssignRecommendation, useUpdateRecommendation, RecommendationStatus, RecommendationPriority } from "@/hooks/useRecommendations";
import { useTeamMembers } from "@/hooks/useSettings";
import { useSelectedBrand } from "@/stores";

// Types (matching main recommendations page)
export type Priority = "critical" | "high" | "medium" | "low";
export type RecommendationType = "schema" | "content" | "technical" | "ai-visibility";
export type Status = "pending" | "in_progress" | "completed" | "dismissed";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  type: RecommendationType;
  status: Status;
  impact: number;
  effort: number;
  confidence: number;
  affectedPages: string[];
  suggestedAction: string;
  assigneeId?: string;
}

// Empty state component
function KanbanEmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <LayoutGrid className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">Kanban Board</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">No Recommendations</h3>
          <p className="text-muted-foreground text-sm">
            Run a site audit to generate AI-powered recommendations for improving your GEO score.
          </p>
        </div>

        <Link
          href="/dashboard/audit"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
        >
          <Settings className="w-4 h-4" />
          Run Site Audit
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Column configuration
const columns: { id: Status; title: string; icon: React.ElementType; color: string }[] = [
  { id: "pending", title: "Pending", icon: Eye, color: "text-[hsl(var(--warning))]" },
  { id: "in_progress", title: "In Progress", icon: Clock, color: "text-primary" },
  { id: "completed", title: "Completed", icon: Check, color: "text-success" },
  { id: "dismissed", title: "Dismissed", icon: X, color: "text-muted-foreground" },
];

// Priority badge styles
const priorityConfig: Record<Priority, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-500/10 text-[hsl(var(--error))] border-[hsl(var(--error)/0.2)]" },
  high: { label: "High", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  medium: { label: "Medium", className: "bg-amber-500/10 text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.2)]" },
  low: { label: "Low", className: "bg-green-500/10 text-green-400 border-green-500/20" },
};

// Type icons
const typeConfig: Record<RecommendationType, { label: string; icon: React.ElementType }> = {
  schema: { label: "Schema", icon: Sparkles },
  content: { label: "Content", icon: BarChart3 },
  technical: { label: "Technical", icon: Zap },
  "ai-visibility": { label: "AI Visibility", icon: Target },
};

// Team member type for assignment dropdown
interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
}

// Priority options for the dropdown
const priorityOptions: { value: Priority; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// Kanban Card Component
function KanbanCard({
  recommendation,
  onDragStart,
  isDragging,
  teamMembers,
  onAssign,
  isAssigning,
  onPriorityChange,
  isPriorityUpdating,
}: {
  recommendation: Recommendation;
  onDragStart: (e: React.DragEvent, id: string) => void;
  isDragging: boolean;
  teamMembers: TeamMember[];
  onAssign: (recommendationId: string, assigneeId: string | null) => void;
  isAssigning: boolean;
  onPriorityChange: (recommendationId: string, priority: Priority) => void;
  isPriorityUpdating: boolean;
}) {
  const priority = priorityConfig[recommendation.priority];
  const type = typeConfig[recommendation.type];
  const TypeIcon = type.icon;

  // Find current assignee
  const currentAssignee = teamMembers.find(
    (m) => m.userId === recommendation.assigneeId || m.id === recommendation.assigneeId
  );

  const handleAssignmentChange = (value: string) => {
    // Prevent drag start when interacting with select
    const newAssigneeId = value === "unassigned" ? null : value;
    onAssign(recommendation.id, newAssigneeId);
  };

  const handlePriorityChange = (value: string) => {
    onPriorityChange(recommendation.id, value as Priority);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, recommendation.id)}
      className={cn(
        "p-3 rounded-lg border border-[#27272A] bg-[#18181B] cursor-grab active:cursor-grabbing",
        "hover:border-[#3F3F46] transition-all duration-150",
        isDragging && "opacity-50 ring-2 ring-primary/50"
      )}
    >
      {/* Drag Handle & Title */}
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground line-clamp-2">
            {recommendation.title}
          </h4>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 mt-2 pl-6">
        {/* Priority Badge with Inline Editing */}
        <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          <Select
            value={recommendation.priority}
            onValueChange={handlePriorityChange}
            disabled={isPriorityUpdating}
          >
            <SelectTrigger
              className={cn(
                "h-auto px-1.5 py-0.5 text-[10px] font-medium rounded border min-w-0 w-auto gap-0.5",
                priority.className,
                "bg-transparent hover:opacity-80 focus:ring-0 focus:ring-offset-0"
              )}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <SelectValue>{priority.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded border text-[10px] font-medium",
                      priorityConfig[option.value].className
                    )}
                  >
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Type */}
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <TypeIcon className="h-3 w-3" />
          {type.label}
        </span>
      </div>

      {/* Impact/Effort */}
      <div className="flex items-center gap-3 mt-2 pl-6 text-[10px] text-muted-foreground">
        <span>Impact: {recommendation.impact}/10</span>
        <span>Effort: {recommendation.effort}/10</span>
      </div>

      {/* Assignment Dropdown */}
      <div className="mt-2 pl-6" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <Select
          value={recommendation.assigneeId || "unassigned"}
          onValueChange={handleAssignmentChange}
          disabled={isAssigning}
        >
          <SelectTrigger
            className="h-7 text-[10px] bg-[#0A0A0B] border-[#27272A] hover:border-[#3F3F46]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 text-muted-foreground" />
              <SelectValue placeholder="Unassigned">
                {currentAssignee ? currentAssignee.name : "Unassigned"}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned" className="text-xs">
              <span className="text-muted-foreground">Unassigned</span>
            </SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.userId || member.id} className="text-xs">
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({
  column,
  recommendations,
  onDragStart,
  onDragOver,
  onDrop,
  draggingId,
  teamMembers,
  onAssign,
  isAssigning,
  onPriorityChange,
  isPriorityUpdating,
}: {
  column: (typeof columns)[0];
  recommendations: Recommendation[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: Status) => void;
  draggingId: string | null;
  teamMembers: TeamMember[];
  onAssign: (recommendationId: string, assigneeId: string | null) => void;
  isAssigning: boolean;
  onPriorityChange: (recommendationId: string, priority: Priority) => void;
  isPriorityUpdating: boolean;
}) {
  const Icon = column.icon;
  const [isOver, setIsOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsOver(false);
    onDrop(e, column.id);
  };

  return (
    <div
      className={cn(
        "flex flex-col min-h-[400px] rounded-xl border border-[#27272A] bg-[#0A0A0B]",
        "transition-all duration-150",
        isOver && "border-primary/50 bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-[#27272A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", column.color)} />
            <span className="font-medium text-sm">{column.title}</span>
          </div>
          <span className="px-2 py-0.5 text-xs rounded-full bg-[#18181B] text-muted-foreground">
            {recommendations.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {recommendations.map((rec) => (
          <KanbanCard
            key={rec.id}
            recommendation={rec}
            onDragStart={onDragStart}
            isDragging={draggingId === rec.id}
            teamMembers={teamMembers}
            onAssign={onAssign}
            isAssigning={isAssigning}
            onPriorityChange={onPriorityChange}
            isPriorityUpdating={isPriorityUpdating}
          />
        ))}
        {recommendations.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/50">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
}

// Loading state component
function KanbanLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading recommendations...</p>
      </div>
    </div>
  );
}

// Transform API recommendation to UI format
function transformRecommendation(apiRec: {
  id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  status: string;
  impact: number;
  effort: string;
  assigneeId?: string;
}): Recommendation {
  // Map API effort to numeric value
  const effortMap: Record<string, number> = { low: 3, medium: 5, high: 8 };

  // Map category to type
  const categoryToType: Record<string, RecommendationType> = {
    technical: "technical",
    content: "content",
    authority: "schema",
    ai_readiness: "ai-visibility",
  };

  return {
    id: apiRec.id,
    title: apiRec.title,
    description: apiRec.description,
    priority: apiRec.priority as Priority,
    type: categoryToType[apiRec.category] || "technical",
    status: apiRec.status as Status,
    impact: apiRec.impact,
    effort: effortMap[apiRec.effort] || 5,
    confidence: 80,
    affectedPages: [],
    suggestedAction: apiRec.description,
    assigneeId: apiRec.assigneeId,
  };
}

export default function KanbanPage() {
  const selectedBrand = useSelectedBrand();
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  // Fetch recommendations from API
  const { data: apiData, isLoading } = useRecommendations(
    selectedBrand?.id ? { brandId: selectedBrand.id, limit: 100 } : { limit: 100 }
  );

  // Fetch team members for assignment dropdown
  const { data: teamMembersData } = useTeamMembers();

  // Mutation hook for status updates
  const updateStatus = useUpdateRecommendationStatus();

  // Mutation hook for assignment updates
  const assignRecommendation = useAssignRecommendation();

  // Mutation hook for priority updates
  const updateRecommendation = useUpdateRecommendation();

  // Transform team members to simple format
  const teamMembers: TeamMember[] = React.useMemo(() => {
    if (!teamMembersData) return [];
    return teamMembersData.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      email: m.email,
      avatar: m.avatar,
    }));
  }, [teamMembersData]);

  // Handle assignment change
  const handleAssign = React.useCallback(
    (recommendationId: string, assigneeId: string | null) => {
      assignRecommendation.mutate({ id: recommendationId, assigneeId });
    },
    [assignRecommendation]
  );

  // Handle priority change
  const handlePriorityChange = React.useCallback(
    (recommendationId: string, priority: Priority) => {
      updateRecommendation.mutate({
        id: recommendationId,
        data: { priority: priority as RecommendationPriority },
      });
    },
    [updateRecommendation]
  );

  // Transform API data to UI format
  const recommendations: Recommendation[] = React.useMemo(() => {
    if (!apiData?.recommendations) return [];
    return apiData.recommendations.map(transformRecommendation);
  }, [apiData]);

  const hasData = recommendations.length > 0;

  // Group recommendations by status
  const getRecommendationsByStatus = (status: Status) =>
    recommendations.filter((rec) => rec.status === status);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: Status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");

    // Call API to update status
    updateStatus.mutate({
      id,
      status: newStatus as RecommendationStatus,
    });
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  // Stats
  const stats = {
    total: recommendations.length,
    pending: recommendations.filter((r) => r.status === "pending").length,
    inProgress: recommendations.filter((r) => r.status === "in_progress").length,
    completed: recommendations.filter((r) => r.status === "completed").length,
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/recommendations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                Kanban Board
              </h2>
              <p className="text-muted-foreground text-sm">
                Drag and drop to change recommendation status
              </p>
            </div>
          </div>
        </div>
        <KanbanLoadingState />
      </div>
    );
  }

  // Show empty state if no data
  if (!hasData) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/recommendations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                Kanban Board
              </h2>
              <p className="text-muted-foreground text-sm">
                Drag and drop to change recommendation status
              </p>
            </div>
          </div>
        </div>
        <KanbanEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6" onDragEnd={handleDragEnd}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/recommendations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              Kanban Board
            </h2>
            <p className="text-muted-foreground text-sm">
              Drag and drop to change recommendation status
            </p>
          </div>
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

      {/* Kanban Board */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            recommendations={getRecommendationsByStatus(column.id)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggingId={draggingId}
            teamMembers={teamMembers}
            onAssign={handleAssign}
            isAssigning={assignRecommendation.isPending}
            onPriorityChange={handlePriorityChange}
            isPriorityUpdating={updateRecommendation.isPending}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground">
        Drag cards between columns to update their status
      </div>
    </div>
  );
}
