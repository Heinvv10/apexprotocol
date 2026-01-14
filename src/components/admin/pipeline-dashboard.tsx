"use client";

/**
 * Pipeline Monitoring Dashboard Component
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Admin dashboard for monitoring and managing the GEO update pipeline:
 * - View pipeline run history
 * - Trigger manual pipeline runs
 * - Monitor platform behavior changes
 * - View knowledge base update status
 */

import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Activity,
  Database,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types for pipeline data
interface PipelineRun {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  status: "running" | "completed" | "failed";
  dryRun: boolean;
  phases: {
    collection: PhaseResult;
    analysis: PhaseResult;
    update: PhaseResult;
    alerting: PhaseResult;
  };
  summary: {
    platformsAnalyzed: number;
    changesDetected: number;
    practicesUpdated: number;
    alertsGenerated: number;
  };
  error?: string;
}

interface PhaseResult {
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  itemsProcessed?: number;
  errors?: number;
  details?: string[];
}

interface PlatformMetrics {
  platform: string;
  lastChecked: Date;
  citationPattern: {
    current: number;
    previous: number;
    trend: "up" | "down" | "stable";
  };
  contentPreference: string[];
  healthScore: number;
}

interface PipelineDashboardProps {
  lastRun?: PipelineRun | null;
  runHistory: PipelineRun[];
  platformMetrics: PlatformMetrics[];
  isRunning: boolean;
  onTriggerRun: (options: { dryRun: boolean; platforms?: string[] }) => void;
  onRefresh: () => void;
}

export function PipelineDashboard({
  lastRun,
  runHistory,
  platformMetrics,
  isRunning,
  onTriggerRun,
  onRefresh,
}: PipelineDashboardProps) {
  const [dryRun, setDryRun] = React.useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<string[]>([]);
  const [expandedRun, setExpandedRun] = React.useState<string | null>(null);

  const platforms = [
    "chatgpt",
    "claude",
    "gemini",
    "perplexity",
    "grok",
    "deepseek",
  ];

  const handleTriggerRun = () => {
    onTriggerRun({
      dryRun,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
    });
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GEO Update Pipeline</h2>
          <p className="text-muted-foreground">
            Monitor and manage the dynamic adaptability system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={isRunning}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isRunning && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {lastRun?.status === "completed" ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : lastRun?.status === "failed" ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : lastRun?.status === "running" ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              ) : (
                <Clock className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-2xl font-bold">
                {lastRun
                  ? formatDistanceToNow(new Date(lastRun.startedAt), {
                      addSuffix: true,
                    })
                  : "Never"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Changes Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold">
                {lastRun?.summary.changesDetected ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Practices Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {lastRun?.summary.practicesUpdated ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alerts Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold">
                {lastRun?.summary.alertsGenerated ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trigger Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Trigger Pipeline Run
          </CardTitle>
          <CardDescription>
            Manually trigger the GEO update pipeline to detect platform changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
            <Label htmlFor="dry-run">Dry Run (no database changes)</Label>
          </div>

          <div className="space-y-2">
            <Label>Select Platforms (optional - all if none selected)</Label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform}
                    checked={selectedPlatforms.includes(platform)}
                    onCheckedChange={() => togglePlatform(platform)}
                  />
                  <Label htmlFor={platform} className="capitalize">
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleTriggerRun}
            disabled={isRunning}
            className="w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Pipeline Run
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Platform Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Platform Monitoring Status
          </CardTitle>
          <CardDescription>
            Current citation patterns and health scores for each AI platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platformMetrics.map((metric) => (
              <div
                key={metric.platform}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="capitalize font-medium w-24">
                    {metric.platform}
                  </div>
                  <Badge
                    variant={
                      metric.healthScore >= 80
                        ? "default"
                        : metric.healthScore >= 60
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    Health: {metric.healthScore}%
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>Citation:</span>
                    <span
                      className={cn(
                        "font-medium",
                        metric.citationPattern.trend === "up" && "text-green-500",
                        metric.citationPattern.trend === "down" && "text-red-500"
                      )}
                    >
                      {metric.citationPattern.current}%
                    </span>
                    {metric.citationPattern.trend === "up" && (
                      <ChevronUp className="w-4 h-4 text-green-500" />
                    )}
                    {metric.citationPattern.trend === "down" && (
                      <ChevronDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs">
                    Last checked:{" "}
                    {formatDistanceToNow(new Date(metric.lastChecked), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Run History */}
      <Card>
        <CardHeader>
          <CardTitle>Run History</CardTitle>
          <CardDescription>
            Recent pipeline executions and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {runHistory.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No pipeline runs recorded yet
              </p>
            ) : (
              runHistory.map((run) => (
                <Collapsible
                  key={run.id}
                  open={expandedRun === run.id}
                  onOpenChange={() =>
                    setExpandedRun(expandedRun === run.id ? null : run.id)
                  }
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {run.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : run.status === "failed" ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        )}
                        <div>
                          <div className="font-medium">
                            {format(
                              new Date(run.startedAt),
                              "MMM d, yyyy HH:mm"
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {run.dryRun && (
                              <Badge variant="outline" className="mr-2">
                                Dry Run
                              </Badge>
                            )}
                            {run.summary.changesDetected} changes,{" "}
                            {run.summary.alertsGenerated} alerts
                          </div>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 transition-transform",
                          expandedRun === run.id && "rotate-180"
                        )}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 border-x border-b rounded-b-lg bg-muted/30 space-y-3">
                      {/* Phase breakdown */}
                      {Object.entries(run.phases).map(([phase, result]) => (
                        <div key={phase} className="flex items-center gap-3">
                          <div className="w-24 capitalize text-sm">{phase}</div>
                          <div className="flex-1">
                            <Progress
                              value={
                                result.status === "completed"
                                  ? 100
                                  : result.status === "running"
                                  ? 50
                                  : 0
                              }
                              className="h-2"
                            />
                          </div>
                          <Badge
                            variant={
                              result.status === "completed"
                                ? "default"
                                : result.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {result.status}
                          </Badge>
                        </div>
                      ))}

                      {/* Error message if failed */}
                      {run.error && (
                        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                          {run.error}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PipelineDashboard;
