"use client";

import * as React from "react";
import { AlertOctagon, AlertTriangle, AlertCircle, Info, ChevronRight } from "lucide-react";
import { Audit } from "@/hooks/useAudit";

interface IssuesTimelineProps {
  audit: Audit;
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "critical":
      return <AlertOctagon className="h-4 w-4 text-error" />;
    case "high":
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "medium":
      return <AlertCircle className="h-4 w-4 text-cyan-500" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-error/10 border-error/30 hover:bg-error/15";
    case "high":
      return "bg-warning/10 border-warning/30 hover:bg-warning/15";
    case "medium":
      return "bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/15";
    default:
      return "bg-muted/50 border-border hover:bg-accent";
  }
}

export function IssuesTimeline({ audit }: IssuesTimelineProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const issues = audit.issues || [];

  // Group by severity
  const critical = issues.filter(i => i.severity === "critical");
  const high = issues.filter(i => i.severity === "high");
  const medium = issues.filter(i => i.severity === "medium");
  const low = issues.filter(i => i.severity === "low");

  const grouped = [
    { severity: "critical", label: "Critical", issues: critical },
    { severity: "high", label: "High", issues: high },
    { severity: "medium", label: "Medium", issues: medium },
    { severity: "low", label: "Low", issues: low },
  ].filter(g => g.issues.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.severity}>
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            {getSeverityIcon(group.severity)}
            {group.label} ({group.issues.length})
          </div>

          <div className="space-y-2">
            {group.issues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setExpandedId(expandedId === issue.id ? null : issue.id)}
                className={`w-full text-left card-tertiary p-4 border transition-colors cursor-pointer ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1">{issue.title}</div>
                    {expandedId === issue.id && (
                      <div className="text-xs text-muted-foreground mt-2 space-y-2">
                        <p>{issue.description}</p>
                        {issue.recommendation && (
                          <div>
                            <div className="font-medium text-foreground mb-1">Recommendation:</div>
                            <p>{issue.recommendation}</p>
                          </div>
                        )}
                        {issue.affectedPages && issue.affectedPages.length > 0 && (
                          <div>
                            <div className="font-medium text-foreground mb-1">Affected pages ({issue.affectedPages.length}):</div>
                            <ul className="list-disc list-inside">
                              {issue.affectedPages.slice(0, 3).map((page) => (
                                <li key={page}>{page}</li>
                              ))}
                              {issue.affectedPages.length > 3 && (
                                <li>+{issue.affectedPages.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                      expandedId === issue.id ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
