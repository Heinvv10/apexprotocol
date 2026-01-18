"use client";

import * as React from "react";
import { AlertTriangle, AlertOctagon, AlertCircle, Info, ChevronRight, Zap, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Audit } from "@/hooks/useAudit";

interface IssueActionCardProps {
  issue: Audit["issues"][0];
  onFixClick: (issue: Audit["issues"][0], actionType: "ai-generate" | "view-guide" | "custom") => void;
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
      return "bg-error/10 border-error/30";
    case "high":
      return "bg-warning/10 border-warning/30";
    case "medium":
      return "bg-cyan-500/10 border-cyan-500/30";
    default:
      return "bg-muted/50 border-border";
  }
}

// Determine what kind of action to suggest based on issue category
function getActionSuggestion(issue: Audit["issues"][0]): { label: string; type: "ai-generate" | "view-guide" | "custom"; icon: React.ReactNode } | null {
  const category = issue.category || "";

  if (category.includes("schema") || category.includes("meta")) {
    return {
      label: "Generate Schema",
      type: "ai-generate",
      icon: <Sparkles className="h-4 w-4" />,
    };
  }

  if (category.includes("content") || category.includes("faq")) {
    return {
      label: "Create Content",
      type: "ai-generate",
      icon: <FileText className="h-4 w-4" />,
    };
  }

  if (category.includes("image") || category.includes("alt")) {
    return {
      label: "Fix Images",
      type: "ai-generate",
      icon: <Zap className="h-4 w-4" />,
    };
  }

  return {
    label: "Fix Issue",
    type: "ai-generate",
    icon: <Zap className="h-4 w-4" />,
  };
}

export function IssueActionCard({ issue, onFixClick }: IssueActionCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const action = getActionSuggestion(issue);

  return (
    <div className={`card-tertiary border transition-all ${getSeverityColor(issue.severity)}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-accent/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            {getSeverityIcon(issue.severity)}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{issue.title}</div>
              {isExpanded && (
                <div className="text-xs text-muted-foreground mt-2 space-y-2">
                  <p>{issue.description}</p>
                  {issue.recommendation && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="font-medium text-foreground mb-1 text-xs">How to fix:</p>
                      <p className="text-xs">{issue.recommendation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
      </button>

      {/* Action Buttons - Show when expanded */}
      {isExpanded && action && (
        <div className="px-4 pb-4 pt-0 flex gap-2 flex-wrap border-t border-border/30">
          <Button
            size="sm"
            variant="default"
            className="gap-2 text-xs h-8"
            onClick={() => onFixClick(issue, action.type)}
          >
            {action.icon}
            {action.label}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 text-xs h-8"
            onClick={() => onFixClick(issue, "view-guide")}
          >
            <FileText className="h-3 w-3" />
            View Guide
          </Button>
        </div>
      )}
    </div>
  );
}
