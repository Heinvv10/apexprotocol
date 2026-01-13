"use client";

/**
 * Version Diff Component
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Displays what changed between action plan versions.
 */

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Minus,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VersionChanges, ActionSnapshot } from "@/lib/db/schema/geo-knowledge-base";

// ============================================================================
// Types
// ============================================================================

interface ActionPlanVersion {
  id: string;
  versionNumber: number;
  knowledgeBaseVersion: string;
  generatedAt: Date | string;
  actionsSnapshot: ActionSnapshot[];
  changesFromPrevious?: VersionChanges | null;
  downloadedAt?: Date | string | null;
}

interface VersionDiffProps {
  currentVersion: ActionPlanVersion;
  previousVersion?: ActionPlanVersion | null;
  onDownload?: () => void;
  compact?: boolean;
}

interface VersionHistoryProps {
  versions: ActionPlanVersion[];
  onSelectVersion?: (version: ActionPlanVersion) => void;
  selectedVersion?: number;
  compact?: boolean;
}

interface VersionBadgeProps {
  version: ActionPlanVersion;
  hasChanges: boolean;
  onViewChanges?: () => void;
}

// ============================================================================
// Version Diff Component
// ============================================================================

export function VersionDiff({
  currentVersion,
  previousVersion,
  onDownload,
  compact = false,
}: VersionDiffProps) {
  const [expanded, setExpanded] = React.useState(!compact);
  const changes = currentVersion.changesFromPrevious;

  const hasChanges =
    changes &&
    (changes.addedActions.length > 0 ||
      changes.removedActions.length > 0 ||
      changes.modifiedActions.length > 0);

  const generatedDate = new Date(currentVersion.generatedAt);

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-semibold">
              Action Plan v{currentVersion.versionNumber}.0
            </span>
          </div>
          {hasChanges && (
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Updated
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Hide Changes
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  View Changes
                </>
              )}
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              Download Latest
            </Button>
          )}
        </div>
      </div>

      {/* Version Info */}
      <div className="p-4 flex items-center gap-6 text-sm text-muted-foreground border-b border-border/50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>
            Generated{" "}
            {formatDistanceToNow(generatedDate, { addSuffix: true })}
          </span>
        </div>
        <div>
          <span className="text-foreground">Knowledge Base:</span>{" "}
          {currentVersion.knowledgeBaseVersion}
        </div>
        <div>
          <span className="text-foreground">Actions:</span>{" "}
          {currentVersion.actionsSnapshot.length}
        </div>
      </div>

      {/* Changes Section */}
      {expanded && hasChanges && changes && (
        <div className="p-4 space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-4 text-sm">
            {changes.addedActions.length > 0 && (
              <div className="flex items-center gap-1 text-green-500">
                <Plus className="w-4 h-4" />
                {changes.addedActions.length} added
              </div>
            )}
            {changes.removedActions.length > 0 && (
              <div className="flex items-center gap-1 text-red-500">
                <Minus className="w-4 h-4" />
                {changes.removedActions.length} removed
              </div>
            )}
            {changes.modifiedActions.length > 0 && (
              <div className="flex items-center gap-1 text-amber-500">
                <RefreshCw className="w-4 h-4" />
                {changes.modifiedActions.length} modified
              </div>
            )}
          </div>

          {/* Added Actions */}
          {changes.addedActions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-500 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Actions
              </h4>
              <div className="pl-6 space-y-1">
                {changes.addedActions.map((actionId) => (
                  <div
                    key={actionId}
                    className="text-sm px-2 py-1 bg-green-500/10 rounded border border-green-500/20"
                  >
                    {actionId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed Actions */}
          {changes.removedActions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-500 flex items-center gap-2">
                <Minus className="w-4 h-4" />
                Removed Actions
              </h4>
              <div className="pl-6 space-y-1">
                {changes.removedActions.map((actionId) => (
                  <div
                    key={actionId}
                    className="text-sm px-2 py-1 bg-red-500/10 rounded border border-red-500/20 line-through"
                  >
                    {actionId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modified Actions */}
          {changes.modifiedActions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-500 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Modified Actions
              </h4>
              <div className="pl-6 space-y-2">
                {changes.modifiedActions.map((mod) => (
                  <div
                    key={mod.actionId}
                    className="text-sm px-3 py-2 bg-amber-500/10 rounded border border-amber-500/20"
                  >
                    <div className="font-medium">{mod.actionId}</div>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      {mod.changes.map((change, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500">•</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* No Changes Message */}
      {expanded && !hasChanges && previousVersion && (
        <div className="p-4 text-center text-muted-foreground">
          No changes from previous version.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Version History Component
// ============================================================================

export function VersionHistory({
  versions,
  onSelectVersion,
  selectedVersion,
  compact = false,
}: VersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No version history available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {versions.map((version, idx) => {
        const isSelected = selectedVersion === version.versionNumber;
        const hasChanges =
          version.changesFromPrevious &&
          (version.changesFromPrevious.addedActions.length > 0 ||
            version.changesFromPrevious.removedActions.length > 0 ||
            version.changesFromPrevious.modifiedActions.length > 0);

        const generatedDate = new Date(version.generatedAt);

        return (
          <div
            key={version.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border transition-colors",
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-card/50 hover:bg-muted/50",
              onSelectVersion && "cursor-pointer"
            )}
            onClick={() => onSelectVersion?.(version)}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  idx === 0
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                v{version.versionNumber}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    Version {version.versionNumber}.0
                  </span>
                  {idx === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Latest
                    </Badge>
                  )}
                  {hasChanges && (
                    <Badge
                      variant="outline"
                      className="text-xs text-amber-500 border-amber-500/30"
                    >
                      Updated
                    </Badge>
                  )}
                </div>
                {!compact && (
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(generatedDate, { addSuffix: true })} •{" "}
                    {version.actionsSnapshot.length} actions
                  </div>
                )}
              </div>
            </div>

            {!compact && version.downloadedAt && (
              <Badge variant="outline" className="text-xs">
                Downloaded
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Version Badge Component
// ============================================================================

export function VersionBadge({
  version,
  hasChanges,
  onViewChanges,
}: VersionBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <Badge variant="outline" className="font-mono">
        v{version.versionNumber}.0
      </Badge>
      {hasChanges && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-amber-500"
          onClick={onViewChanges}
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Updated
        </Button>
      )}
    </div>
  );
}

export default VersionDiff;
