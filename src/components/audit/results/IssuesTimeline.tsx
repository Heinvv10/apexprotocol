"use client";

import * as React from "react";
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Audit } from "@/hooks/useAudit";
import { IssueActionCard } from "./IssueActionCard";
import { IssueFixModal } from "./IssueFixModal";

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

export function IssuesTimeline({ audit }: IssuesTimelineProps) {
  const [selectedIssue, setSelectedIssue] = React.useState<Audit["issues"][0] | null>(null);
  const [modalAction, setModalAction] = React.useState<"ai-generate" | "view-guide" | "custom" | null>(null);

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

  const handleFixClick = (issue: Audit["issues"][0], actionType: "ai-generate" | "view-guide" | "custom") => {
    setSelectedIssue(issue);
    setModalAction(actionType);
  };

  return (
    <>
      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.severity}>
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              {getSeverityIcon(group.severity)}
              {group.label} ({group.issues.length})
            </div>

            <div className="space-y-2">
              {group.issues.map((issue) => (
                <IssueActionCard
                  key={issue.id}
                  issue={issue}
                  onFixClick={handleFixClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fix Modal */}
      <IssueFixModal
        issue={selectedIssue}
        actionType={modalAction}
        auditUrl={audit.url}
        isOpen={selectedIssue !== null}
        onClose={() => {
          setSelectedIssue(null);
          setModalAction(null);
        }}
      />
    </>
  );
}
