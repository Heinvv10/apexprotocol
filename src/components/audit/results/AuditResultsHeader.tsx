"use client";

import * as React from "react";
import { Audit } from "@/hooks/useAudit";

interface AuditResultsHeaderProps {
  audit: Audit;
}

export function AuditResultsHeader({ audit }: AuditResultsHeaderProps) {
  const pagesScanned = audit.pagesScanned || 0;
  const criticalIssues = audit.criticalIssues || 0;

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold">Audit Results</h1>
      <p className="text-muted-foreground">
        {pagesScanned} pages scanned {criticalIssues > 0 && `• ${criticalIssues} critical issues found`}
      </p>
    </div>
  );
}
