"use client";

import * as React from "react";
import {
  FileText,
  Globe,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  Filter,
  Eye,
  Activity,
  Calendar,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useContentWorkflowStore,
  type PublishingHistory,
  type ContentMetrics,
  type ContentItem,
} from "@/stores/content-workflow";
import { format, parseISO } from "date-fns";

interface PublishingDashboardProps {
  className?: string;
}

// Platform configuration with colors and icons
const platformConfig = {
  wordpress: {
    label: "WordPress",
    color: "hsl(210, 100%, 50%)",
    bgColor: "hsl(210, 100%, 50%, 0.1)",
  },
  medium: {
    label: "Medium",
    color: "hsl(140, 70%, 45%)",
    bgColor: "hsl(140, 70%, 45%, 0.1)",
  },
} as const;

// Combined data type for display
interface PublishedContentRow {
  id: string;
  contentId: string;
  title: string;
  platform: "wordpress" | "medium";
  publishedAt: string;
  externalUrl: string;
  externalId: string;
  status: "success" | "failed";
  errorMessage: string | null;
  views: number;
  engagementScore: number;
  lastSyncedAt: string | null;
}

export function PublishingDashboard({ className }: PublishingDashboardProps) {
  const [selectedPlatform, setSelectedPlatform] = React.useState<
    "all" | "wordpress" | "medium"
  >("all");
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Get data from store
  const contentItems = useContentWorkflowStore((state) => state.contentItems);
  const publishingHistory = useContentWorkflowStore(
    (state) => state.publishingHistory
  );
  const metrics = useContentWorkflowStore((state) => state.metrics);
  const isLoading = useContentWorkflowStore((state) => state.historyLoading);
  const error = useContentWorkflowStore((state) => state.error);

  // Combine publishing history with content items and metrics
  const publishedContent: PublishedContentRow[] = React.useMemo(() => {
    return publishingHistory
      .map((history) => {
        const content = contentItems.find((c) => c.id === history.contentId);
        const contentMetrics = metrics.find(
          (m) =>
            m.contentId === history.contentId && m.platform === history.platform
        );

        if (!content) return null;

        return {
          id: history.id,
          contentId: history.contentId,
          title: content.title,
          platform: history.platform,
          publishedAt: history.publishedAt,
          externalUrl: history.externalUrl,
          externalId: history.externalId,
          status: history.status,
          errorMessage: history.errorMessage,
          views: contentMetrics?.views ?? 0,
          engagementScore: contentMetrics?.engagementScore ?? 0,
          lastSyncedAt: contentMetrics?.lastSyncedAt ?? null,
        };
      })
      .filter((item): item is PublishedContentRow => item !== null)
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
  }, [publishingHistory, contentItems, metrics]);

  // Filter by platform
  const filteredContent = React.useMemo(() => {
    if (selectedPlatform === "all") {
      return publishedContent;
    }
    return publishedContent.filter((item) => item.platform === selectedPlatform);
  }, [publishedContent, selectedPlatform]);

  // Handle refresh metrics
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh metrics for all published content
      const uniqueContentIds = Array.from(
        new Set(publishedContent.map((item) => item.contentId))
      );

      await Promise.all(
        uniqueContentIds.map((contentId) =>
          useContentWorkflowStore.getState().refreshMetrics(contentId)
        )
      );
    } catch (err) {
      // Error will be handled by the store
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load publishing history on mount
  React.useEffect(() => {
    const loadHistory = async () => {
      const allContentIds = contentItems.map((item) => item.id);
      if (allContentIds.length === 0) return;

      // In a real implementation, we would have an API endpoint to fetch all publishing history
      // For now, we'll refresh for each content item
      // This could be optimized with a batch endpoint
      await Promise.all(
        allContentIds.map((contentId) =>
          useContentWorkflowStore.getState().refreshPublishingHistory(contentId)
        )
      );
    };

    loadHistory();
  }, [contentItems]);

  // Calculate summary stats
  const stats = React.useMemo(() => {
    return {
      total: filteredContent.length,
      successful: filteredContent.filter((item) => item.status === "success")
        .length,
      failed: filteredContent.filter((item) => item.status === "failed").length,
      totalViews: filteredContent.reduce((sum, item) => sum + item.views, 0),
      avgEngagement:
        filteredContent.length > 0
          ? Math.round(
              filteredContent.reduce(
                (sum, item) => sum + item.engagementScore,
                0
              ) / filteredContent.length
            )
          : 0,
    };
  }, [filteredContent]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.1)",
              color: "hsl(var(--primary))",
            }}
          >
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Publishing Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Track your published content performance
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh Metrics
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card-tertiary p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs">Total Published</span>
          </div>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>

        <div className="card-tertiary p-3">
          <div className="flex items-center gap-2 text-success mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">Successful</span>
          </div>
          <p className="text-2xl font-semibold">{stats.successful}</p>
        </div>

        <div className="card-tertiary p-3">
          <div className="flex items-center gap-2 text-destructive mb-1">
            <XCircle className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">Failed</span>
          </div>
          <p className="text-2xl font-semibold">{stats.failed}</p>
        </div>

        <div className="card-tertiary p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs">Total Views</span>
          </div>
          <p className="text-2xl font-semibold">{stats.totalViews.toLocaleString()}</p>
        </div>

        <div className="card-tertiary p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs">Avg Engagement</span>
          </div>
          <p className="text-2xl font-semibold">{stats.avgEngagement}</p>
        </div>
      </div>

      {/* Platform Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Platform:
        </span>
        <div className="flex gap-2">
          <Button
            variant={selectedPlatform === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPlatform("all")}
          >
            All
          </Button>
          <Button
            variant={selectedPlatform === "wordpress" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPlatform("wordpress")}
          >
            WordPress
          </Button>
          <Button
            variant={selectedPlatform === "medium" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPlatform("medium")}
          >
            Medium
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg border"
          style={{
            backgroundColor: "hsl(var(--destructive) / 0.05)",
            borderColor: "hsl(var(--destructive) / 0.3)",
          }}
        >
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">
            Loading publishing history...
          </span>
        </div>
      )}

      {/* Content Table */}
      {!isLoading && filteredContent.length > 0 && (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="flex items-center px-4 py-3 text-xs font-medium text-muted-foreground border-b">
            <div className="flex-1 min-w-[200px]">Title</div>
            <div className="w-32 text-center">Platform</div>
            <div className="w-40 text-center">Published Date</div>
            <div className="w-24 text-center">Views</div>
            <div className="w-28 text-center">Engagement</div>
            <div className="w-24 text-center">Status</div>
            <div className="w-20" />
          </div>

          {/* Table Body */}
          <div className="space-y-2">
            {filteredContent.map((item) => {
              const config = platformConfig[item.platform];

              return (
                <div
                  key={item.id}
                  className="card-tertiary flex items-center px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  {/* Title */}
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.title}
                    </p>
                    {item.lastSyncedAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Last synced:{" "}
                        {format(parseISO(item.lastSyncedAt), "MMM d, h:mm a")}
                      </p>
                    )}
                  </div>

                  {/* Platform */}
                  <div className="w-32 flex justify-center">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize"
                      style={{
                        backgroundColor: config.bgColor,
                        color: config.color,
                      }}
                    >
                      <Globe className="h-3 w-3 mr-1.5" />
                      {config.label}
                    </span>
                  </div>

                  {/* Published Date */}
                  <div className="w-40 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(parseISO(item.publishedAt), "MMM d, yyyy")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(parseISO(item.publishedAt), "h:mm a")}
                    </p>
                  </div>

                  {/* Views */}
                  <div className="w-24 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {item.views.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Engagement */}
                  <div className="w-28 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {item.engagementScore}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="w-24 flex justify-center">
                    {item.status === "success" ? (
                      <Badge variant="success" className="text-xs">
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Failed
                      </Badge>
                    )}
                  </div>

                  {/* External Link */}
                  <div className="w-20 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on platform"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredContent.length === 0 && (
        <div className="card-secondary flex flex-col items-center justify-center py-12">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{
              backgroundColor: "hsl(var(--muted) / 0.5)",
            }}
          >
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No published content yet
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedPlatform === "all"
              ? "Published content will appear here"
              : `No content published to ${
                  platformConfig[selectedPlatform].label
                } yet`}
          </p>
        </div>
      )}
    </div>
  );
}
