"use client";

import * as React from "react";
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Pause,
  Trash2,
  ChevronDown,
  ChevronUp,
  Timer,
  Cpu,
  Database,
  Search,
  Filter,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useJobs,
  useRetryJob,
  usePauseJob,
  useResumeJob,
  useCancelJob,
  useRefreshJobs,
  type Job,
  type JobStatus,
  type JobType,
} from "@/hooks/useJobs";

const statusConfig: Record<
  JobStatus,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  queued: {
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    label: "Queued",
  },
  running: {
    icon: Play,
    color: "text-primary",
    bgColor: "bg-primary/20",
    label: "Running",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/20",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    color: "text-error",
    bgColor: "bg-error/20",
    label: "Failed",
  },
  paused: {
    icon: Pause,
    color: "text-warning",
    bgColor: "bg-warning/20",
    label: "Paused",
  },
};

const typeConfig: Record<
  JobType,
  { icon: React.ElementType; color: string; label: string }
> = {
  scan: { icon: Search, color: "text-primary", label: "Scan" },
  audit: { icon: Cpu, color: "text-accent-blue", label: "Audit" },
  content: { icon: Database, color: "text-success", label: "Content" },
  export: { icon: Database, color: "text-warning", label: "Export" },
  sync: { icon: RefreshCw, color: "text-accent-pink", label: "Sync" },
};

const priorityColors = {
  low: "text-muted-foreground",
  normal: "text-foreground",
  high: "text-warning",
  critical: "text-error",
};

interface JobDashboardProps {
  className?: string;
}

export function JobDashboard({ className }: JobDashboardProps) {
  const [statusFilter, setStatusFilter] = React.useState<JobStatus | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  // Fetch jobs from API
  const { data, isLoading, error } = useJobs({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Mutations for job actions
  const retryJob = useRetryJob();
  const pauseJob = usePauseJob();
  const resumeJob = useResumeJob();
  const cancelJob = useCancelJob();
  const refreshJobs = useRefreshJobs();

  // Use API stats or default
  const stats = data?.stats ?? {
    queued: 0,
    running: 0,
    completed: 0,
    failed: 0,
  };

  // Filter and sort jobs
  const filteredJobs = React.useMemo(() => {
    let result = [...(data?.jobs ?? [])];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.name.toLowerCase().includes(query) ||
          j.type.toLowerCase().includes(query) ||
          j.createdBy.toLowerCase().includes(query)
      );
    }

    // Sort by priority
    result.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return sortOrder === "desc" ? diff : -diff;
    });

    return result;
  }, [data?.jobs, searchQuery, sortOrder]);

  const handleRetry = (jobId: string) => {
    const job = data?.jobs.find((j) => j.id === jobId);
    retryJob.mutate({ jobId, queueName: job?.queueName });
  };

  const handlePause = (jobId: string) => {
    const job = data?.jobs.find((j) => j.id === jobId);
    pauseJob.mutate({ jobId, queueName: job?.queueName });
  };

  const handleResume = (jobId: string) => {
    const job = data?.jobs.find((j) => j.id === jobId);
    resumeJob.mutate({ jobId, queueName: job?.queueName });
  };

  const handleCancel = (jobId: string) => {
    const job = data?.jobs.find((j) => j.id === jobId);
    cancelJob.mutate({ jobId, queueName: job?.queueName });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("card-secondary p-8 text-center", className)}>
        <AlertTriangle className="w-8 h-8 text-error mx-auto mb-2" />
        <p className="text-error">Failed to load jobs</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <button
          onClick={() => refreshJobs()}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Job Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor and manage background jobs
          </p>
        </div>
        <button
          onClick={() => refreshJobs()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Queued"
          value={stats.queued}
          icon={Clock}
          color="text-muted-foreground"
        />
        <StatCard
          label="Running"
          value={stats.running}
          icon={Play}
          color="text-primary"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          color="text-success"
        />
        <StatCard
          label="Failed"
          value={stats.failed}
          icon={XCircle}
          color="text-error"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-muted/20 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as JobStatus | "all")
            }
            className="px-3 py-2 bg-muted/20 border border-border/50 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Status</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {/* Sort */}
        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="flex items-center gap-1 px-3 py-2 bg-muted/20 border border-border/50 rounded-lg text-sm text-foreground hover:bg-muted/30 transition-colors"
        >
          Priority
          {sortOrder === "desc" ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Job List */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="card-secondary p-8 text-center">
            <p className="text-muted-foreground">No jobs found</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onRetry={handleRetry}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={handleCancel}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="card-tertiary p-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-muted/20", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function JobCard({
  job,
  onRetry,
  onPause,
  onResume,
  onCancel,
}: {
  job: Job;
  onRetry: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const status = statusConfig[job.status];
  const type = typeConfig[job.type];
  const StatusIcon = status.icon;
  const TypeIcon = type.icon;

  return (
    <div
      className={cn(
        "card-secondary overflow-hidden transition-all",
        job.status === "failed" && "border-error/30"
      )}
    >
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Status indicator */}
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              status.bgColor
            )}
          >
            <StatusIcon className={cn("w-5 h-5", status.color)} />
          </div>

          {/* Job info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-foreground truncate">
                {job.name}
              </h4>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
                  priorityColors[job.priority],
                  job.priority === "critical" && "bg-error/20",
                  job.priority === "high" && "bg-warning/20"
                )}
              >
                {job.priority}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TypeIcon className={cn("w-3 h-3", type.color)} />
                {type.label}
              </span>
              <span className={cn("flex items-center gap-1", status.color)}>
                {status.label}
              </span>
              {job.duration && (
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {job.duration}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar for running jobs */}
          {job.status === "running" && job.progress !== undefined && (
            <div className="w-24 hidden sm:block">
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-right">
                {job.progress}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {job.status === "failed" && job.retryCount < job.maxRetries && (
              <button
                onClick={() => onRetry(job.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/20 text-error text-xs font-medium hover:bg-error/30 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
            {job.status === "running" && (
              <button
                onClick={() => onPause(job.id)}
                className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            {job.status === "paused" && (
              <button
                onClick={() => onResume(job.id)}
                className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            {(job.status === "queued" || job.status === "paused") && (
              <button
                onClick={() => onCancel(job.id)}
                className="p-1.5 rounded-lg hover:bg-error/20 text-muted-foreground hover:text-error transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {job.status === "failed" && job.errorMessage && (
          <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-error/10 border border-error/20">
            <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-error">{job.errorMessage}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Retry {job.retryCount}/{job.maxRetries}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/30">
          <div className="pt-3 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground mb-1">Created By</p>
              <p className="text-foreground">{job.createdBy}</p>
            </div>
            {job.startedAt && (
              <div>
                <p className="text-muted-foreground mb-1">Started At</p>
                <p className="text-foreground">
                  {new Date(job.startedAt).toLocaleString()}
                </p>
              </div>
            )}
            {job.completedAt && (
              <div>
                <p className="text-muted-foreground mb-1">Completed At</p>
                <p className="text-foreground">
                  {new Date(job.completedAt).toLocaleString()}
                </p>
              </div>
            )}
            {job.metadata && (
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">Metadata</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(job.metadata).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-1 rounded bg-muted/20 text-foreground"
                    >
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact widget for sidebar
export function JobQueueWidget({ className }: { className?: string }) {
  const { data, isLoading } = useJobs({ limit: 10 });

  const activeJobs = React.useMemo(
    () =>
      (data?.jobs ?? []).filter(
        (j) => j.status === "running" || j.status === "queued"
      ),
    [data?.jobs]
  );
  const failedJobs = React.useMemo(
    () => (data?.jobs ?? []).filter((j) => j.status === "failed"),
    [data?.jobs]
  );

  if (isLoading) {
    return (
      <div className={cn("card-tertiary p-3", className)}>
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-tertiary p-3", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-foreground">Job Queue</span>
        <span className="text-[10px] text-muted-foreground">
          {activeJobs.length} active
        </span>
      </div>

      <div className="space-y-2">
        {/* Active jobs indicator */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            activeJobs.length > 0 ? "bg-primary animate-pulse" : "bg-muted"
          )} />
          <span className="text-xs text-foreground">
            {activeJobs.length} jobs in queue
          </span>
        </div>

        {/* Failed jobs warning */}
        {failedJobs.length > 0 && (
          <div className="flex items-center gap-2 text-error">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs">
              {failedJobs.length} failed job{failedJobs.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Recent activity */}
        {activeJobs.slice(0, 2).map((job) => (
          <div key={job.id} className="text-xs text-muted-foreground truncate">
            {job.name}
            {job.progress !== undefined && (
              <span className="ml-1 text-primary">{job.progress}%</span>
            )}
          </div>
        ))}

        {/* Empty state */}
        {activeJobs.length === 0 && failedJobs.length === 0 && (
          <p className="text-xs text-muted-foreground">No active jobs</p>
        )}
      </div>
    </div>
  );
}
