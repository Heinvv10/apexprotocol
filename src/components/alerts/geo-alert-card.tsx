"use client";

/**
 * GEO Alert Card Component
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Displays a single GEO alert with:
 * - Severity indicator
 * - Alert type badge
 * - Affected platforms
 * - Suggested actions
 * - Read/Dismiss actions
 */

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Bell,
  X,
  Check,
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GeoAlert } from "@/lib/db/schema/geo-knowledge-base";
import {
  getSeverityColorClass,
  getAlertTypeLabel,
  getPlatformDisplayName,
  type AlertSeverity,
  type GeoAlertType,
} from "@/lib/geo/alert-utils";

interface GeoAlertCardProps {
  alert: GeoAlert;
  onRead?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onViewDetails?: (alert: GeoAlert) => void;
  compact?: boolean;
}

export function GeoAlertCard({
  alert,
  onRead,
  onDismiss,
  onViewDetails,
  compact = false,
}: GeoAlertCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const severity = alert.severity as AlertSeverity;
  const alertType = alert.alertType as GeoAlertType;
  const isUnread = !alert.readAt;
  const hasActions = alert.suggestedActions && alert.suggestedActions.length > 0;

  // Get severity icon
  const SeverityIcon = {
    critical: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[severity] || Bell;

  // Format relative time
  const timeAgo = formatDistanceToNow(new Date(alert.createdAt), {
    addSuffix: true,
  });

  // Handle read action
  const handleRead = () => {
    if (onRead && isUnread) {
      onRead(alert.id);
    }
  };

  // Handle dismiss action
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(alert.id);
    }
  };

  // Handle click on card
  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(alert);
    }
    handleRead();
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
          getSeverityColorClass(severity),
          isUnread && "bg-opacity-20"
        )}
        onClick={handleCardClick}
      >
        <SeverityIcon className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{alert.title}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        getSeverityColorClass(severity),
        isUnread && "ring-2 ring-offset-2 ring-offset-background",
        isUnread && severity === "critical" && "ring-red-500/50",
        isUnread && severity === "warning" && "ring-amber-500/50",
        isUnread && severity === "info" && "ring-blue-500/50"
      )}
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={handleCardClick}
      >
        <div
          className={cn(
            "p-2 rounded-full shrink-0",
            severity === "critical" && "bg-red-500/20",
            severity === "warning" && "bg-amber-500/20",
            severity === "info" && "bg-blue-500/20"
          )}
        >
          <SeverityIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className="text-xs">
              {getAlertTypeLabel(alertType)}
            </Badge>
            {alert.actionRequired && (
              <Badge variant="destructive" className="text-xs">
                Action Required
              </Badge>
            )}
            {isUnread && (
              <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                New
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-foreground mb-1">{alert.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {alert.description}
          </p>

          {/* Affected Platforms */}
          {alert.affectedPlatforms && alert.affectedPlatforms.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Platforms:</span>
              <div className="flex gap-1 flex-wrap">
                {(alert.affectedPlatforms as string[]).slice(0, 4).map((platform) => (
                  <Badge key={platform} variant="secondary" className="text-xs">
                    {getPlatformDisplayName(platform)}
                  </Badge>
                ))}
                {alert.affectedPlatforms.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{alert.affectedPlatforms.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {hasActions && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded content - Suggested Actions */}
      {expanded && hasActions && (
        <div className="border-t px-4 py-3 bg-background/50">
          <h4 className="text-sm font-medium mb-2">Suggested Actions:</h4>
          <ul className="space-y-2">
            {(alert.suggestedActions as string[]).map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>

          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => onViewDetails(alert)}
            >
              View Details
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Alert List Component
 */
interface GeoAlertListProps {
  alerts: GeoAlert[];
  onRead?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onViewDetails?: (alert: GeoAlert) => void;
  emptyMessage?: string;
  compact?: boolean;
}

export function GeoAlertList({
  alerts,
  onRead,
  onDismiss,
  onViewDetails,
  emptyMessage = "No alerts to display",
  compact = false,
}: GeoAlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {alerts.map((alert) => (
        <GeoAlertCard
          key={alert.id}
          alert={alert}
          onRead={onRead}
          onDismiss={onDismiss}
          onViewDetails={onViewDetails}
          compact={compact}
        />
      ))}
    </div>
  );
}

/**
 * Alert Badge Component (for navbar/header)
 */
interface AlertBadgeProps {
  count: number;
  criticalCount?: number;
  onClick?: () => void;
}

export function AlertBadge({ count, criticalCount = 0, onClick }: AlertBadgeProps) {
  if (count === 0) {
    return (
      <Button variant="ghost" size="icon" onClick={onClick}>
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={onClick}
    >
      <Bell className="h-5 w-5" />
      <span
        className={cn(
          "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-xs font-bold",
          criticalCount > 0
            ? "bg-red-500 text-white"
            : "bg-primary text-primary-foreground"
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    </Button>
  );
}

export default GeoAlertCard;
