"use client";

/**
 * Alerts Panel Component
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Displays a sliding panel with all GEO alerts, filters, and actions.
 */

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Filter,
  RefreshCw,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GeoAlertList, AlertBadge } from "./geo-alert-card";
import type { GeoAlert } from "@/lib/db/schema/geo-knowledge-base";
import {
  type GeoAlertType,
  type AlertSeverity,
  getAlertTypeLabel,
} from "@/lib/geo/alert-utils";

interface AlertsSummary {
  unreadCount: number;
  criticalCount: number;
  byType: Record<GeoAlertType, number>;
}

interface AlertsPanelProps {
  alerts: GeoAlert[];
  summary: AlertsSummary;
  isLoading?: boolean;
  onRefresh?: () => void;
  onRead?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onDismissAll?: () => void;
  onMarkAllRead?: () => void;
  onViewDetails?: (alert: GeoAlert) => void;
}

export function AlertsPanel({
  alerts,
  summary,
  isLoading = false,
  onRefresh,
  onRead,
  onDismiss,
  onDismissAll,
  onMarkAllRead,
  onViewDetails,
}: AlertsPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [severityFilter, setSeverityFilter] = React.useState<
    AlertSeverity | "all"
  >("all");
  const [typeFilter, setTypeFilter] = React.useState<GeoAlertType | "all">(
    "all"
  );

  // Filter alerts
  const filteredAlerts = React.useMemo(() => {
    return alerts.filter((alert) => {
      if (severityFilter !== "all" && alert.severity !== severityFilter) {
        return false;
      }
      if (typeFilter !== "all" && alert.alertType !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [alerts, severityFilter, typeFilter]);

  // Group alerts by priority
  const criticalAlerts = filteredAlerts.filter(
    (a) => a.severity === "critical" && a.actionRequired
  );
  const otherAlerts = filteredAlerts.filter(
    (a) => !(a.severity === "critical" && a.actionRequired)
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div>
          <AlertBadge
            count={summary.unreadCount}
            criticalCount={summary.criticalCount}
            onClick={() => setOpen(true)}
          />
        </div>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              GEO Alerts
              {summary.unreadCount > 0 && (
                <Badge variant="secondary">{summary.unreadCount} new</Badge>
              )}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isLoading && "animate-spin")}
                  />
                </Button>
              )}
            </div>
          </div>

          {/* Alert Summary Stats */}
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm">
                {summary.byType.score_impact || 0} Score
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm">
                {summary.byType.algorithm_change || 0} Platform
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-sm">
                {summary.byType.new_opportunity || 0} Opportunity
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Filters */}
        <div className="flex items-center gap-2 p-4 border-b bg-muted/50">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select
            value={severityFilter}
            onValueChange={(v) => setSeverityFilter(v as AlertSeverity | "all")}
          >
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as GeoAlertType | "all")}
          >
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="algorithm_change">Platform Update</SelectItem>
              <SelectItem value="score_impact">Score Change</SelectItem>
              <SelectItem value="competitor_move">Competitor</SelectItem>
              <SelectItem value="new_opportunity">Opportunity</SelectItem>
              <SelectItem value="recommendation_updated">Plan Update</SelectItem>
              <SelectItem value="strategy_deprecated">Strategy Alert</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          {onMarkAllRead && summary.unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-10">
                <TabsTrigger
                  value="all"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  All ({filteredAlerts.length})
                </TabsTrigger>
                <TabsTrigger
                  value="action"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  Action Required ({criticalAlerts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="p-4 mt-0">
                <GeoAlertList
                  alerts={filteredAlerts}
                  onRead={onRead}
                  onDismiss={onDismiss}
                  onViewDetails={onViewDetails}
                  emptyMessage="No alerts match your filters"
                />
              </TabsContent>

              <TabsContent value="action" className="p-4 mt-0">
                <GeoAlertList
                  alerts={criticalAlerts}
                  onRead={onRead}
                  onDismiss={onDismiss}
                  onViewDetails={onViewDetails}
                  emptyMessage="No action required alerts"
                />
              </TabsContent>
            </Tabs>
          )}
        </ScrollArea>

        {/* Footer Actions */}
        {onDismissAll && filteredAlerts.length > 0 && (
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full" onClick={onDismissAll}>
              Dismiss All Visible Alerts
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default AlertsPanel;
