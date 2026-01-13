"use client";

import * as React from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Filter,
  Search,
  RotateCcw,
  LayoutGrid,
  List,
  Loader2,
  RefreshCw,
  MessageSquare,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  Archive,
  Trash2,
} from "lucide-react";

// Page Header Component
function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradNotifications)" />
            <defs>
              <linearGradient id="apexGradNotifications" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5CC"/>
                <stop offset="1" stopColor="#8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          APEX
        </span>
        <span className="text-xl font-light text-foreground ml-1">Notifications</span>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">Status:</span>
        <span className="text-xs text-primary font-medium">Connected</span>
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
          fill="url(#starGradientNotifications)"
        />
        <defs>
          <linearGradient id="starGradientNotifications" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
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
  useNotifications,
  useMarkAsRead,
  useArchiveNotification,
  useDeleteNotification,
  useMarkAllAsRead,
  type NotificationType,
  type NotificationStatus,
  type Notification,
} from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

// Type badge styles (outlined pills with gray border)
const typeConfig: Record<NotificationType, { label: string; icon: React.ElementType; className: string }> = {
  mention: {
    label: "Mention",
    icon: MessageSquare,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  score_change: {
    label: "Score Change",
    icon: TrendingUp,
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  recommendation: {
    label: "Recommendation",
    icon: Lightbulb,
    className: "bg-amber-500/10 text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.2)]",
  },
  important: {
    label: "Important",
    icon: AlertCircle,
    className: "bg-red-500/10 text-[hsl(var(--error))] border-[hsl(var(--error)/0.2)]",
  },
};

// Status configuration
const statusConfig: Record<NotificationStatus, { label: string; className: string }> = {
  unread: { label: "Unread", className: "text-primary font-medium" },
  read: { label: "Read", className: "text-muted-foreground" },
  archived: { label: "Archived", className: "text-muted-foreground/50" },
};

// Linear-style notification card
function NotificationCard({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const type = typeConfig[notification.type];
  const status = statusConfig[notification.status || "unread"];
  const TypeIcon = type.icon;

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this notification?")) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[#27272A] transition-all duration-200",
        "bg-[#18181B] hover:border-[#3F3F46]",
        notification.status === "read" && "opacity-60",
        notification.status === "archived" && "opacity-40"
      )}
    >
      {/* Card Header - Clickable */}
      <div
        className="p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: Icon + Content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Notification Type Icon */}
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              type.className
            )}>
              <TypeIcon className="w-5 h-5" />
            </div>

            {/* Title + Metadata */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  "text-sm font-medium truncate",
                  status.className
                )}>
                  {notification.title}
                </h3>
                {!notification.isRead && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {notification.message}
              </p>

              {/* Timestamp and Type */}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground/70">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-md border",
                  type.className
                )}>
                  {type.label}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions + Expand Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!notification.isRead && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleMarkAsRead}
              >
                <Check className="w-4 h-4 mr-1" />
                Mark Read
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-0 border-t border-[#27272A]">
          <div className="mt-4 space-y-4">
            {/* Full Message */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Message</h4>
              <p className="text-sm text-foreground">{notification.message}</p>
            </div>
            {notification.metadata && typeof notification.metadata === 'object' && Object.keys(notification.metadata as Record<string, any>).length > 0 ? (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Details</h4>
                <div className="space-y-1">
                  {(notification.metadata as Record<string, any>)?.brandName && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="text-foreground font-medium">{(notification.metadata as Record<string, any>)?.brandName}</span>
                    </div>
                  )}
                  {(notification.metadata as Record<string, any>)?.platform && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Platform:</span>
                      <span className="text-foreground font-medium">{(notification.metadata as Record<string, any>)?.platform}</span>
                    </div>
                  )}
                  {((notification.metadata as Record<string, any>) ?? {}).oldScore !== undefined && ((notification.metadata as Record<string, any>) ?? {}).newScore !== undefined && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Score:</span>
                      <span className="text-foreground font-medium">
                        {((notification.metadata as Record<string, any>) ?? {}).oldScore} â†’ {((notification.metadata as Record<string, any>) ?? {}).newScore}
                      </span>
                    </div>
                  )}
                  {((notification.metadata as Record<string, any>) ?? {}).sentiment && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Sentiment:</span>
                      <span className="text-foreground font-medium capitalize">{(notification.metadata as Record<string, any>)?.sentiment}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Action Link */}
            {(notification.metadata as Record<string, any>)?.linkUrl && (
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = notification.metadata?.linkUrl as string}
                >
                  {((notification.metadata as Record<string, any>) ?? {}).linkText || "View Details"}
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              {!notification.isRead && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAsRead}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Read
                </Button>
              )}
              {!notification.isArchived && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleArchive}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const brand = useSelectedBrand();

  // State
  const [statusFilter, setStatusFilter] = React.useState<NotificationStatus | "all">("all");
  const [typeFilter, setTypeFilter] = React.useState<NotificationType | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
  const limit = 20;

  // Prepare filters for API
  const filters = React.useMemo(() => {
    const f: any = { page, limit };
    if (statusFilter !== "all") f.status = statusFilter;
    if (typeFilter !== "all") f.type = typeFilter;
    return f;
  }, [statusFilter, typeFilter, page, limit]);

  // Hooks
  const { data, isLoading, error, refetch } = useNotifications(filters);
  const markAsReadMutation = useMarkAsRead();
  const archiveMutation = useArchiveNotification();
  const deleteMutation = useDeleteNotification();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notifications = data?.notifications ?? [];
  const total = data?.total ?? 0;
  const unreadCount = data?.unreadCount ?? 0;

  // Filter client-side by search query
  const filteredNotifications = React.useMemo(() => {
    if (!searchQuery) return notifications;
    const query = searchQuery.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);

  // Handlers
  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleArchive = (id: string) => {
    archiveMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleReset = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setSearchQuery("");
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);
  const hasFilters = statusFilter !== "all" || typeFilter !== "all" || searchQuery !== "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with decorative elements */}
      <div className="relative border-b border-[#27272A] bg-gradient-to-b from-background to-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <PageHeader />
        </div>
        <DecorativeStar />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats Bar */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Notifications</div>
            <div className="text-2xl font-bold text-foreground">{total}</div>
          </div>
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-4">
            <div className="text-xs text-muted-foreground mb-1">Unread</div>
            <div className="text-2xl font-bold text-primary">{unreadCount}</div>
          </div>
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-4">
            <div className="text-xs text-muted-foreground mb-1">Read</div>
            <div className="text-2xl font-bold text-muted-foreground">{total - unreadCount}</div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as NotificationStatus | "all");
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-[#27272A] bg-[#18181B] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="archived">Archived</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as NotificationType | "all");
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-[#27272A] bg-[#18181B] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Types</option>
              <option value="mention">Mentions</option>
              <option value="score_change">Score Changes</option>
              <option value="recommendation">Recommendations</option>
              <option value="important">Important</option>
            </select>

            {/* Search */}
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-full md:w-[240px] bg-[#18181B] border-[#27272A]"
              />
            </div>

            {/* Reset Filters */}
            {hasFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-8 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-2">Failed to load notifications</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : "An error occurred"}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          )}

          {!isLoading && !error && filteredNotifications.length === 0 && (
            <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {hasFilters
                  ? "No notifications match your filters. Try adjusting them."
                  : "You're all caught up! No notifications to display."}
              </p>
            </div>
          )}

          {!isLoading && !error && filteredNotifications.length > 0 && (
            <>
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={page === pageNum ? "default" : "ghost"}
                      onClick={() => setPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
