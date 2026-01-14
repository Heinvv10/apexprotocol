"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, Play, StopCircle, RotateCcw, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditJob {
  id: string;
  brandId: string;
  url: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  overallScore?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  duration?: number;
  errorMessage?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  completed: "bg-green-500/20 text-green-600 border-green-500/30",
  failed: "bg-red-500/20 text-red-600 border-red-500/30",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  in_progress: <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
  failed: <AlertCircle className="h-4 w-4" />,
};

export default function AuditJobsDashboard() {
  const [jobs, setJobs] = React.useState<AuditJob[]>([]);
  const [pagination, setPagination] = React.useState<PaginationData>({
    page: 0,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(null);

  const fetchJobs = React.useCallback(async (page: number = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/admin/dashboard/audit-jobs?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch audit jobs: ${response.statusText}`);
      }

      const data = await response.json();
      setJobs(data.data.jobs);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchJobs(0);
  }, [fetchJobs]);

  const handleAction = async (jobId: string, action: "cancel" | "retry") => {
    setActionInProgress(jobId);

    try {
      const response = await fetch("/api/admin/dashboard/audit-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action }),
      });

      if (!response.ok) {
        throw new Error("Failed to perform action");
      }

      // Refresh the list
      await fetchJobs(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return STATUS_COLORS[status] || "bg-gray-500/20 text-gray-600";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Audit Job Monitoring</h1>
        <p className="text-muted-foreground">
          Monitor and manage audit job execution, cancel stuck jobs, and retry failures
        </p>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-primary">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{pagination.total}</div>
                <p className="text-sm text-muted-foreground">Total Audits</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-primary">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">
                  {jobs.filter(j => j.status === "pending").length}
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-primary">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">
                  {jobs.filter(j => j.status === "in_progress").length}
                </div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-primary">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">
                  {jobs.filter(j => j.status === "failed").length}
                </div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="card-secondary p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Filters</h2>
        </div>

        <div className="flex gap-4 items-end">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Filter by Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => fetchJobs(0)} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card-secondary p-4 border-red-500/30 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-500 mb-1">Error</h3>
            <p className="text-sm text-red-500/80">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      )}

      {/* Job List */}
      {!isLoading && jobs.length > 0 && (
        <div className="card-secondary p-6 space-y-4">
          <h2 className="font-semibold mb-4">Audit Jobs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-muted">
                  <th className="text-left py-3 px-4 font-semibold">URL</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-right py-3 px-4 font-semibold">Score</th>
                  <th className="text-right py-3 px-4 font-semibold">Duration</th>
                  <th className="text-right py-3 px-4 font-semibold">Created</th>
                  <th className="text-right py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-muted/30 hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono text-xs truncate">
                      {job.url.replace(/^https?:\/\//, "")}
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded border ${getStatusBadgeColor(job.status)}`}>
                        {STATUS_ICONS[job.status]}
                        <span className="capitalize">{job.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {job.overallScore !== undefined ? (
                        <span className={job.overallScore >= 70 ? "text-green-500" : job.overallScore >= 50 ? "text-yellow-500" : "text-red-500"}>
                          {job.overallScore}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {job.duration ? `${(job.duration).toFixed(1)}s` : "-"}
                    </td>
                    <td className="py-3 px-4 text-right text-xs">
                      {new Date(job.createdAt).toLocaleDateString()} {new Date(job.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {job.status === "in_progress" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction(job.id, "cancel")}
                            disabled={actionInProgress === job.id}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            {actionInProgress === job.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <StopCircle className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        {job.status === "failed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction(job.id, "retry")}
                            disabled={actionInProgress === job.id}
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                          >
                            {actionInProgress === job.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-muted">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page + 1} of {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchJobs(pagination.page - 1)}
                  disabled={pagination.page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchJobs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && jobs.length === 0 && (
        <div className="card-secondary p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">No Audit Jobs Found</h3>
          <p className="text-muted-foreground">
            {statusFilter !== "all" ? "No jobs match the selected filter" : "No audit jobs have been created yet"}
          </p>
        </div>
      )}
    </div>
  );
}
