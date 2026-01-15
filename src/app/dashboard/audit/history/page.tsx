"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Globe,
  Sparkles,
  Settings,
  ArrowRight,
  BarChart3,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { cn } from "@/lib/utils";
import { useAuditsByBrand, useRetryAudit, Audit } from "@/hooks/useAudit";
import { useSelectedBrand } from "@/stores";
import { formatDateCustom } from "@/lib/utils/formatters";

// Loading state component
function HistoryLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading audit history...</p>
      </div>
    </div>
  );
}

// Audit data interfaces
export interface HistoricalDataPoint {
  date: string;
  overallScore: number;
  schemaQuality: number;
  contentCompleteness: number;
  aiVisibility: number;
}

export interface AuditHistoryItem {
  id: string;
  date: string;
  score: number;
  change: number;
}

// Empty state component
function HistoryEmptyState() {
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
            <BarChart3 className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">Score History</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">No Audit History</h3>
          <p className="text-muted-foreground text-sm">
            Run your first site audit to start tracking score improvements over time.
          </p>
        </div>

        <Link href="/dashboard/audit">
          <Button size="lg" className="gap-2">
            <Settings className="w-4 h-4" />
            Run First Audit
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// Transform audit data to chart-friendly format
function transformToHistoricalData(audits: Audit[]): HistoricalDataPoint[] {
  // Sort by date (oldest first for chart display)
  const sortedAudits = [...audits]
    .filter((a) => a.status === "completed" && a.overallScore !== undefined)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  return sortedAudits.map((audit) => ({
    date: formatDateCustom(audit.startedAt, {
      month: "short",
      day: "numeric",
    }),
    overallScore: audit.overallScore ?? 0,
    // Map audit sub-scores to chart categories
    schemaQuality: audit.technicalScore ?? audit.overallScore ?? 0,
    contentCompleteness: audit.contentScore ?? audit.overallScore ?? 0,
    aiVisibility: audit.aiReadinessScore ?? audit.overallScore ?? 0,
  }));
}

// Transform audit data to history list format
function transformToAuditHistory(audits: Audit[]): AuditHistoryItem[] {
  // Sort by date (newest first for list display)
  const sortedAudits = [...audits]
    .filter((a) => a.status === "completed" && a.overallScore !== undefined)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return sortedAudits.map((audit, index) => {
    const currentScore = audit.overallScore ?? 0;
    const previousAudit = sortedAudits[index + 1];
    const previousScore = previousAudit?.overallScore ?? 0;
    const change = index === sortedAudits.length - 1 ? 0 : currentScore - previousScore;

    return {
      id: audit.id,
      date: formatDateCustom(audit.startedAt, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      score: currentScore,
      change,
    };
  });
}

export default function AuditHistoryPage() {
  const selectedBrand = useSelectedBrand();

  // Fetch audits from API
  const { data: auditsData, isLoading } = useAuditsByBrand(selectedBrand?.id || "", {
    limit: 100,
    status: "completed",
  });

  // Retry audit mutation
  const retryAuditMutation = useRetryAudit();

  // Handle rerun audit
  const handleRerunAudit = (auditId: string) => {
    retryAuditMutation.mutate(auditId);
  };

  // Transform API data to UI formats
  const historicalData = React.useMemo(() => {
    if (!auditsData?.audits) return [];
    return transformToHistoricalData(auditsData.audits);
  }, [auditsData]);

  const auditHistory = React.useMemo(() => {
    if (!auditsData?.audits) return [];
    return transformToAuditHistory(auditsData.audits);
  }, [auditsData]);

  const hasData = historicalData.length > 0;

  // Compute stats safely
  const currentScore = hasData ? historicalData[historicalData.length - 1].overallScore : 0;
  const previousScore = historicalData.length >= 2 ? historicalData[historicalData.length - 2].overallScore : 0;
  const firstScore = hasData ? historicalData[0].overallScore : 0;
  const totalChange = currentScore - firstScore;

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/audit">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Score History</h2>
              <p className="text-muted-foreground text-sm">
                Track your site&apos;s GEO score improvements over time
              </p>
            </div>
          </div>
        </div>
        <HistoryLoadingState />
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
            <Link href="/dashboard/audit">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Score History</h2>
              <p className="text-muted-foreground text-sm">
                Track your site&apos;s GEO score improvements over time
              </p>
            </div>
          </div>
        </div>
        <HistoryEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/audit">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Score History</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>https://example.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-primary p-4">
          <div className="text-sm text-muted-foreground">Current Score</div>
          <div className="text-3xl font-bold text-primary">{currentScore}</div>
          <div className="flex items-center gap-1 text-sm text-success mt-1">
            <TrendingUp className="h-4 w-4" />
            +{currentScore - previousScore} from last audit
          </div>
        </div>
        <div className="card-secondary p-4">
          <div className="text-sm text-muted-foreground">Total Improvement</div>
          <div className="text-3xl font-bold text-success">+{totalChange}</div>
          <div className="text-sm text-muted-foreground mt-1">
            Since first audit
          </div>
        </div>
        <div className="card-secondary p-4">
          <div className="text-sm text-muted-foreground">Audits Completed</div>
          <div className="text-3xl font-bold">{historicalData.length}</div>
          <div className="text-sm text-muted-foreground mt-1">
            Total audits
          </div>
        </div>
      </div>

      {/* Score Trend Chart */}
      <div className="card-secondary p-6">
        <h3 className="font-semibold mb-4">Score Trend Over Time</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="overallScore"
                name="Overall Score"
                stroke="hsl(var(--primary))"
                fill="url(#colorScore)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sub-Score Comparison Chart */}
      <div className="card-secondary p-6">
        <h3 className="font-semibold mb-4">Sub-Score Breakdown</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="schemaQuality"
                name="Schema Quality"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="contentCompleteness"
                name="Content Completeness"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="aiVisibility"
                name="AI Visibility"
                stroke="hsl(var(--accent-blue))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit History List */}
      <div className="card-secondary p-6">
        <h3 className="font-semibold mb-4">Audit History</h3>
        <div className="space-y-2">
          {auditHistory.map((audit, index) => (
            <div
              key={audit.id}
              className={cn(
                "card-tertiary p-4 flex items-center justify-between group",
                index === 0 && "ring-2 ring-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                  audit.score >= 70 ? "bg-success/20 text-success" :
                  audit.score >= 50 ? "bg-warning/20 text-warning" :
                  "bg-error/20 text-error"
                )}>
                  {audit.score}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{audit.date}</span>
                    {index === 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {audit.change > 0 ? (
                  <div className="flex items-center gap-1 text-sm text-success">
                    <TrendingUp className="h-4 w-4" />
                    +{audit.change}
                  </div>
                ) : audit.change < 0 ? (
                  <div className="flex items-center gap-1 text-sm text-error">
                    <TrendingDown className="h-4 w-4" />
                    {audit.change}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Minus className="h-4 w-4" />
                    First audit
                  </div>
                )}
                <button
                  onClick={() => handleRerunAudit(audit.id)}
                  disabled={retryAuditMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                  title="Rerun this audit"
                >
                  <RotateCcw className={cn("w-3 h-3", retryAuditMutation.isPending && "animate-spin")} />
                  Rerun
                </button>
                <Link href="/dashboard/audit/results">
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
