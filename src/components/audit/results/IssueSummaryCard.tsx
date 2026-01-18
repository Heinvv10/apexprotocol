"use client";

import * as React from "react";
import { AlertTriangle, AlertCircle, AlertOctagon, Info } from "lucide-react";
import { Audit } from "@/hooks/useAudit";

interface IssueSummaryCardProps {
  audit: Audit;
}

export function IssueSummaryCard({ audit }: IssueSummaryCardProps) {
  const issues = audit.issues || [];

  const critical = issues.filter(i => i.severity === "critical").length;
  const high = issues.filter(i => i.severity === "high").length;
  const medium = issues.filter(i => i.severity === "medium").length;
  const low = issues.filter(i => i.severity === "low").length;

  const total = critical + high + medium + low;

  return (
    <div className="card-primary p-6">
      <h3 className="font-semibold text-lg mb-6">Issue Summary</h3>

      <div className="space-y-4">
        {/* Critical */}
        <div className="flex items-center justify-between p-3 bg-error/10 rounded-lg border border-error/20">
          <div className="flex items-center gap-3">
            <AlertOctagon className="h-5 w-5 text-error" />
            <span className="font-medium">Critical</span>
          </div>
          <span className="text-2xl font-bold text-error">{critical}</span>
        </div>

        {/* High */}
        <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span className="font-medium">High</span>
          </div>
          <span className="text-2xl font-bold text-warning">{high}</span>
        </div>

        {/* Medium */}
        <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-cyan-500" />
            <span className="font-medium">Medium</span>
          </div>
          <span className="text-2xl font-bold text-cyan-500">{medium}</span>
        </div>

        {/* Low */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Low</span>
          </div>
          <span className="text-2xl font-bold text-muted-foreground">{low}</span>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20 mt-6">
          <span className="font-semibold">Total Issues</span>
          <span className="text-2xl font-bold text-primary">{total}</span>
        </div>
      </div>
    </div>
  );
}
