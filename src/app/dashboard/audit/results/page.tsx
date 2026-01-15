"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Wrench,
  Globe,
  Code,
  FileText,
  Bot,
  Sparkles,
  Settings,
  ArrowRight,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeoScoreGauge } from "@/components/dashboard/geo-score-gauge";
import { cn } from "@/lib/utils";
import { useAuditsByBrand, useAudit, Audit, AuditIssue } from "@/hooks/useAudit";
import { useSelectedBrand } from "@/stores";
import { formatDateCustom } from "@/lib/utils/formatters";
import { useQuickExport } from "@/hooks/useExport";
import { Download } from "lucide-react";

// Audit result data interfaces
export interface SubScore {
  score: number;
  max: number;
  label: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  affectedPages: string[];
}

export interface AuditResult {
  url: string;
  auditDate: string;
  overallScore: number;
  subScores: {
    schemaQuality: SubScore;
    contentCompleteness: SubScore;
    aiVisibility: SubScore;
  };
  issues: {
    critical: Issue[];
    high: Issue[];
    medium: Issue[];
    low: Issue[];
  };
}

// Loading state component
function ResultsLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading audit results...</p>
      </div>
    </div>
  );
}

// Transform API audit to UI format
function transformAuditToResult(audit: Audit, issues: AuditIssue[]): AuditResult {
  // Group issues by severity
  const groupedIssues = {
    critical: [] as Issue[],
    high: [] as Issue[],
    medium: [] as Issue[],
    low: [] as Issue[],
  };

  issues.forEach((issue) => {
    const transformedIssue: Issue = {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      affectedPages: issue.url ? [issue.url] : [],
    };

    if (issue.severity === "critical") {
      groupedIssues.critical.push(transformedIssue);
    } else if (issue.severity === "high") {
      groupedIssues.high.push(transformedIssue);
    } else if (issue.severity === "medium") {
      groupedIssues.medium.push(transformedIssue);
    } else {
      groupedIssues.low.push(transformedIssue);
    }
  });

  return {
    url: audit.url,
    auditDate: formatDateCustom(audit.startedAt, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    overallScore: audit.overallScore ?? 0,
    subScores: {
      schemaQuality: {
        score: audit.technicalScore ?? Math.round((audit.overallScore ?? 0) * 0.33),
        max: 100,
        label: "Schema Quality",
      },
      contentCompleteness: {
        score: audit.contentScore ?? Math.round((audit.overallScore ?? 0) * 0.33),
        max: 100,
        label: "Content Completeness",
      },
      aiVisibility: {
        score: audit.aiReadinessScore ?? Math.round((audit.overallScore ?? 0) * 0.34),
        max: 100,
        label: "AI Visibility",
      },
    },
    issues: groupedIssues,
  };
}

// Empty state component
function ResultsEmptyState() {
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
            <ClipboardList className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">Audit Results</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">No Audit Results</h3>
          <p className="text-muted-foreground text-sm">
            Run a site audit to see your GEO score, sub-scores, and recommendations for improvement.
          </p>
        </div>

        <Link href="/dashboard/audit">
          <Button size="lg" className="gap-2">
            <Settings className="w-4 h-4" />
            Run Site Audit
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

type IssueSeverity = "critical" | "high" | "medium" | "low";

const severityConfig: Record<IssueSeverity, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  critical: {
    icon: AlertCircle,
    color: "text-error",
    bgColor: "bg-error/10",
    label: "Critical",
  },
  high: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    label: "High",
  },
  medium: {
    icon: Info,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "Medium",
  },
  low: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    label: "Low",
  },
};

function IssueCard({ issue, severity }: { issue: Issue; severity: IssueSeverity }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className="card-tertiary overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-3 hover:bg-accent/30 transition-colors text-left"
      >
        <div className={cn("p-2 rounded-lg", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{issue.title}</div>
          <div className="text-sm text-muted-foreground line-clamp-1">
            {issue.description}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {issue.affectedPages.length} page{issue.affectedPages.length !== 1 ? "s" : ""}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground mt-3 mb-3">
            {issue.description}
          </p>
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Affected Pages
            </div>
            {issue.affectedPages.map((page) => (
              <div
                key={page}
                className="flex items-center justify-between p-2 rounded bg-background/50"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  {page}
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Wrench className="h-3 w-3 mr-1" />
                  Fix
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubScoreCard({
  label,
  score,
  max,
  icon: Icon,
}: {
  label: string;
  score: number;
  max: number;
  icon: React.ElementType;
}) {
  const percentage = Math.round((score / max) * 100);

  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 80) return { bg: "#22C55E", text: "text-success" }; // green
    if (percentage >= 60) return { bg: "#00E5CC", text: "text-primary" }; // cyan
    if (percentage >= 40) return { bg: "#F59E0B", text: "text-warning" }; // amber
    return { bg: "#EF4444", text: "text-error" }; // red
  };

  const colorInfo = getColor();

  return (
    <div className="card-secondary p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>

      {/* Score - centered vertically */}
      <div className="flex-1 flex items-center">
        <div className="flex items-baseline gap-1">
          <span className={cn("text-5xl font-bold", colorInfo.text)}>{score}</span>
          <span className="text-lg text-muted-foreground">/ {max}</span>
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div className="mt-auto pt-3">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              backgroundColor: colorInfo.bg,
            }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {percentage}% score
        </div>
      </div>
    </div>
  );
}

function AuditResultsContent() {
  const [expandedSections, setExpandedSections] = React.useState<IssueSeverity[]>(["critical", "high"]);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportStatus, setExportStatus] = React.useState<string | null>(null);
  const selectedBrand = useSelectedBrand();
  const searchParams = useSearchParams();
  const auditIdFromUrl = searchParams.get("id");
  const { exportAndDownload, isLoading: isExportLoading } = useQuickExport();

  // Export handler
  const handleExport = async () => {
    if (!selectedBrand?.id) return;

    setIsExporting(true);
    setExportStatus("Generating report...");

    try {
      await exportAndDownload(
        {
          format: "pdf",
          dataType: "audits",
          brandId: selectedBrand.id,
        },
        (status) => {
          if (status === "processing") {
            setExportStatus("Processing...");
          } else if (status === "completed") {
            setExportStatus("Download starting...");
          }
        }
      );
      setExportStatus(null);
    } catch (error) {
      console.error("Export failed:", error);
      setExportStatus("Export failed");
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // If we have an audit ID from URL, fetch that specific audit
  const { data: specificAudit, isLoading: isLoadingSpecificAudit } = useAudit(
    auditIdFromUrl || "",
    { enabled: !!auditIdFromUrl }
  );

  // Otherwise, fetch audits for the brand - get the most recent completed audit
  const { data: auditsData, isLoading: isLoadingAudits } = useAuditsByBrand(
    selectedBrand?.id || "",
    { limit: 1, status: "completed" }
  );

  // Get the audit to display - prefer specific audit from URL, fallback to latest
  const latestAudit = auditIdFromUrl && specificAudit ? specificAudit : auditsData?.audits?.[0];

  // Transform embedded issues to AuditIssue format
  const embeddedIssues: AuditIssue[] = React.useMemo(() => {
    if (!latestAudit?.issues) return [];
    return latestAudit.issues.map((issue) => ({
      id: issue.id,
      auditId: latestAudit.id,
      category: issue.category as AuditIssue["category"],
      severity: issue.severity,
      type: issue.category,
      title: issue.title,
      description: issue.description,
      url: issue.url || (issue.affectedPages?.[0]),
      recommendation: issue.recommendation || "",
      impact: issue.impact || "",
      effort: "medium" as const,
      status: "open" as const,
    }));
  }, [latestAudit]);

  // Transform to UI format - use embedded issues from audit
  const auditResult = React.useMemo<AuditResult | null>(() => {
    if (!latestAudit) return null;
    return transformAuditToResult(latestAudit, embeddedIssues);
  }, [latestAudit, embeddedIssues]);

  const isLoading = (auditIdFromUrl ? isLoadingSpecificAudit : isLoadingAudits);
  const hasData = auditResult !== null;

  const toggleSection = (severity: IssueSeverity) => {
    setExpandedSections((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
  };

  const severityOrder: IssueSeverity[] = ["critical", "high", "medium", "low"];

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
              <h2 className="text-2xl font-bold tracking-tight">Audit Results</h2>
              <p className="text-muted-foreground text-sm">
                View detailed analysis and recommendations for your site
              </p>
            </div>
          </div>
        </div>
        <ResultsLoadingState />
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
              <h2 className="text-2xl font-bold tracking-tight">Audit Results</h2>
              <p className="text-muted-foreground text-sm">
                View detailed analysis and recommendations for your site
              </p>
            </div>
          </div>
        </div>
        <ResultsEmptyState />
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
            <h2 className="text-2xl font-bold tracking-tight">Audit Results</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>{auditResult.url}</span>
              <span className="text-xs">• {auditResult.auditDate}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || isExportLoading}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {exportStatus || "Exporting..."}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
          <Button>Re-run Audit</Button>
        </div>
      </div>

      {/* Main Score + Sub Scores */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Large GEO Score Gauge */}
        <div className="card-primary p-6 flex flex-col items-center justify-center">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Overall GEO Score
          </div>
          <GeoScoreGauge
            score={auditResult.overallScore}
            size="lg"
            showLabel
            showGrade
            animated
          />
        </div>

        {/* Sub Score Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <SubScoreCard
            label={auditResult.subScores.schemaQuality.label}
            score={auditResult.subScores.schemaQuality.score}
            max={auditResult.subScores.schemaQuality.max}
            icon={Code}
          />
          <SubScoreCard
            label={auditResult.subScores.contentCompleteness.label}
            score={auditResult.subScores.contentCompleteness.score}
            max={auditResult.subScores.contentCompleteness.max}
            icon={FileText}
          />
          <SubScoreCard
            label={auditResult.subScores.aiVisibility.label}
            score={auditResult.subScores.aiVisibility.score}
            max={auditResult.subScores.aiVisibility.max}
            icon={Bot}
          />
        </div>
      </div>

      {/* Issues by Severity */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Issues Found</h3>

        {severityOrder.map((severity) => {
          const issues = auditResult.issues[severity];
          const config = severityConfig[severity];
          const Icon = config.icon;
          const isExpanded = expandedSections.includes(severity);

          if (issues.length === 0) return null;

          return (
            <div key={severity} className="card-secondary overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(severity)}
                className="w-full p-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", config.bgColor)}>
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{config.label} Issues</div>
                    <div className="text-sm text-muted-foreground">
                      {issues.length} issue{issues.length !== 1 ? "s" : ""} found
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* Expandable Issue List */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {issues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} severity={severity} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function AuditResultsPage() {
  return (
    <React.Suspense fallback={<ResultsLoadingState />}>
      <AuditResultsContent />
    </React.Suspense>
  );
}
