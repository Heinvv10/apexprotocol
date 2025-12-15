/**
 * Export Hooks (F177, F178)
 * Wire CSV Export and PDF Export buttons to generator APIs
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganizationId } from "@/stores/auth";

// =============================================================================
// Types
// =============================================================================

export type ExportFormat = "csv" | "pdf" | "xlsx" | "json";
export type ExportStatus = "pending" | "processing" | "completed" | "failed";

export type ExportDataType =
  | "mentions"
  | "audits"
  | "recommendations"
  | "content"
  | "analytics"
  | "competitors"
  | "report";

export interface ExportOptions {
  format: ExportFormat;
  dataType: ExportDataType;
  brandId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, unknown>;
  columns?: string[];
  includeCharts?: boolean;
  template?: string;
}

export interface ExportJob {
  id: string;
  status: ExportStatus;
  format: ExportFormat;
  dataType: ExportDataType;
  filename: string;
  fileSize?: number;
  downloadUrl?: string;
  expiresAt?: string;
  progress?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  dataTypes: ExportDataType[];
  format: ExportFormat;
  sections: string[];
  isDefault: boolean;
}

export interface ExportHistoryItem {
  id: string;
  filename: string;
  format: ExportFormat;
  dataType: ExportDataType;
  fileSize: number;
  downloadCount: number;
  createdAt: string;
  expiresAt: string;
}

// =============================================================================
// API Functions
// =============================================================================

async function createExportJob(options: ExportOptions): Promise<ExportJob> {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create export job");
  }
  return response.json();
}

async function fetchExportStatus(jobId: string): Promise<ExportJob> {
  const response = await fetch(`/api/export/${jobId}/status`);
  if (!response.ok) {
    throw new Error("Failed to fetch export status");
  }
  return response.json();
}

// =============================================================================
// CSV Export Hooks (F177)
// =============================================================================

/**
 * Hook to export data as CSV
 */
export function useExportCSV() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      dataType,
      brandId,
      dateRange,
      filters,
      columns,
    }: {
      dataType: ExportDataType;
      brandId?: string;
      dateRange?: { start: string; end: string };
      filters?: Record<string, unknown>;
      columns?: string[];
    }) => {
      const options: ExportOptions = {
        format: "csv",
        dataType,
        brandId,
        dateRange,
        filters,
        columns,
      };
      return createExportJob(options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["export", "history", orgId] });
    },
  });
}

/**
 * Hook to export mentions as CSV
 */
export function useExportMentionsCSV() {
  const exportCSV = useExportCSV();

  return useMutation({
    mutationFn: async ({
      brandId,
      dateRange,
      platforms,
      sentiment,
    }: {
      brandId: string;
      dateRange?: { start: string; end: string };
      platforms?: string[];
      sentiment?: string[];
    }) => {
      return exportCSV.mutateAsync({
        dataType: "mentions",
        brandId,
        dateRange,
        filters: { platforms, sentiment },
        columns: [
          "date",
          "platform",
          "content",
          "sentiment",
          "source",
          "reach",
        ],
      });
    },
  });
}

/**
 * Hook to export recommendations as CSV
 */
export function useExportRecommendationsCSV() {
  const exportCSV = useExportCSV();

  return useMutation({
    mutationFn: async ({
      brandId,
      status,
      priority,
    }: {
      brandId: string;
      status?: string[];
      priority?: string[];
    }) => {
      return exportCSV.mutateAsync({
        dataType: "recommendations",
        brandId,
        filters: { status, priority },
        columns: [
          "title",
          "description",
          "priority",
          "status",
          "category",
          "impact",
          "createdAt",
        ],
      });
    },
  });
}

/**
 * Hook to export audit results as CSV
 */
export function useExportAuditCSV() {
  const exportCSV = useExportCSV();

  return useMutation({
    mutationFn: async ({
      auditId,
      brandId,
      includeIssues = true,
    }: {
      auditId?: string;
      brandId: string;
      includeIssues?: boolean;
    }) => {
      return exportCSV.mutateAsync({
        dataType: "audits",
        brandId,
        filters: { auditId, includeIssues },
        columns: [
          "category",
          "item",
          "score",
          "status",
          "issue",
          "recommendation",
        ],
      });
    },
  });
}

// =============================================================================
// PDF Export Hooks (F178)
// =============================================================================

/**
 * Hook to export/generate PDF report
 */
export function useExportPDF() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      dataType,
      brandId,
      dateRange,
      template,
      includeCharts = true,
    }: {
      dataType: ExportDataType;
      brandId?: string;
      dateRange?: { start: string; end: string };
      template?: string;
      includeCharts?: boolean;
    }) => {
      const options: ExportOptions = {
        format: "pdf",
        dataType,
        brandId,
        dateRange,
        template,
        includeCharts,
      };
      return createExportJob(options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["export", "history", orgId] });
    },
  });
}

/**
 * Hook to generate audit report PDF
 */
export function useGenerateAuditReport() {
  const exportPDF = useExportPDF();

  return useMutation({
    mutationFn: async ({
      auditId,
      brandId,
      template = "comprehensive",
    }: {
      auditId: string;
      brandId: string;
      template?: "executive" | "comprehensive" | "technical";
    }) => {
      return exportPDF.mutateAsync({
        dataType: "report",
        brandId,
        template: `audit-${template}`,
        includeCharts: true,
      });
    },
  });
}

/**
 * Hook to generate analytics report PDF
 */
export function useGenerateAnalyticsReport() {
  const exportPDF = useExportPDF();

  return useMutation({
    mutationFn: async ({
      brandId,
      dateRange,
      sections,
    }: {
      brandId: string;
      dateRange: { start: string; end: string };
      sections?: string[];
    }) => {
      return exportPDF.mutateAsync({
        dataType: "analytics",
        brandId,
        dateRange,
        template: "analytics-report",
        includeCharts: true,
      });
    },
  });
}

/**
 * Hook to generate competitor analysis report PDF
 */
export function useGenerateCompetitorReport() {
  const exportPDF = useExportPDF();

  return useMutation({
    mutationFn: async ({
      brandId,
      competitorIds,
    }: {
      brandId: string;
      competitorIds: string[];
    }) => {
      return exportPDF.mutateAsync({
        dataType: "competitors",
        brandId,
        template: "competitor-analysis",
        includeCharts: true,
      });
    },
  });
}

// =============================================================================
// Export Status Hooks
// =============================================================================

/**
 * Hook to poll export job status
 */
export function useExportJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["export", "job", jobId],
    queryFn: () => fetchExportStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") {
        return false; // Stop polling
      }
      return 2000; // Poll every 2 seconds
    },
  });
}

/**
 * Hook to download completed export
 */
export function useDownloadExport() {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/export/${jobId}/download`);
      if (!response.ok) {
        throw new Error("Failed to download export");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "export";

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true, filename };
    },
  });
}

// =============================================================================
// Export History Hooks
// =============================================================================

/**
 * Hook to fetch export history
 */
export function useExportHistory(limit: number = 20) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["export", "history", orgId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/export/history?limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch export history");
      }
      const data = await response.json();
      return data.exports as ExportHistoryItem[];
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to delete export from history
 */
export function useDeleteExport() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (exportId: string) => {
      const response = await fetch(`/api/export/${exportId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete export");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["export", "history", orgId] });
    },
  });
}

// =============================================================================
// Report Templates Hooks
// =============================================================================

/**
 * Hook to fetch available report templates
 */
export function useReportTemplates() {
  return useQuery({
    queryKey: ["export", "templates"],
    queryFn: async () => {
      const response = await fetch("/api/export/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch report templates");
      }
      const data = await response.json();
      return data.templates as ReportTemplate[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to create custom report template
 */
export function useCreateReportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Omit<ReportTemplate, "id">) => {
      const response = await fetch("/api/export/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
      if (!response.ok) {
        throw new Error("Failed to create report template");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["export", "templates"] });
    },
  });
}

// =============================================================================
// XLSX Export Hook
// =============================================================================

/**
 * Hook to export data as XLSX (Excel)
 */
export function useExportXLSX() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      dataType,
      brandId,
      dateRange,
      filters,
      sheets,
    }: {
      dataType: ExportDataType;
      brandId?: string;
      dateRange?: { start: string; end: string };
      filters?: Record<string, unknown>;
      sheets?: string[];
    }) => {
      const options: ExportOptions = {
        format: "xlsx",
        dataType,
        brandId,
        dateRange,
        filters,
      };
      return createExportJob(options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["export", "history", orgId] });
    },
  });
}

// =============================================================================
// Scheduled Reports Hooks
// =============================================================================

export interface ScheduledReport {
  id: string;
  name: string;
  template: string;
  schedule: "daily" | "weekly" | "monthly";
  recipients: string[];
  brandId: string;
  lastSentAt?: string;
  nextSendAt: string;
  isActive: boolean;
}

/**
 * Hook to fetch scheduled reports
 */
export function useScheduledReports() {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["export", "scheduled", orgId],
    queryFn: async () => {
      const response = await fetch("/api/export/scheduled");
      if (!response.ok) {
        throw new Error("Failed to fetch scheduled reports");
      }
      const data = await response.json();
      return data.reports as ScheduledReport[];
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to create scheduled report
 */
export function useCreateScheduledReport() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (report: Omit<ScheduledReport, "id" | "lastSentAt" | "nextSendAt">) => {
      const response = await fetch("/api/export/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (!response.ok) {
        throw new Error("Failed to create scheduled report");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["export", "scheduled", orgId] });
    },
  });
}

/**
 * Hook to update scheduled report
 */
export function useUpdateScheduledReport() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ScheduledReport> & { id: string }) => {
      const response = await fetch(`/api/export/scheduled/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update scheduled report");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["export", "scheduled", orgId] });
    },
  });
}

/**
 * Hook to delete scheduled report
 */
export function useDeleteScheduledReport() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/export/scheduled/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete scheduled report");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["export", "scheduled", orgId] });
    },
  });
}

// =============================================================================
// Quick Export Utilities
// =============================================================================

/**
 * Combined hook for quick exports (commonly used patterns)
 */
export function useQuickExport() {
  const exportCSV = useExportCSV();
  const exportPDF = useExportPDF();
  const download = useDownloadExport();

  const exportAndDownload = async (
    options: ExportOptions,
    onProgress?: (status: ExportStatus) => void
  ) => {
    let job: ExportJob;

    if (options.format === "csv" || options.format === "xlsx") {
      job = await exportCSV.mutateAsync(options);
    } else {
      job = await exportPDF.mutateAsync(options);
    }

    // Poll until complete
    while (job.status === "pending" || job.status === "processing") {
      await new Promise((r) => setTimeout(r, 2000));
      const response = await fetch(`/api/export/${job.id}/status`);
      job = await response.json();
      if (onProgress) {
        onProgress(job.status);
      }
    }

    if (job.status === "completed") {
      await download.mutateAsync(job.id);
      return { success: true, job };
    }

    throw new Error(job.error || "Export failed");
  };

  return {
    exportAndDownload,
    isLoading: exportCSV.isPending || exportPDF.isPending || download.isPending,
  };
}
