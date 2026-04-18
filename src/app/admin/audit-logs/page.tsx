"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Calendar,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
  X,
  ShieldCheck,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuditLogs } from "@/hooks/useAdmin";

interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  actionType: string;
  description: string;
  targetType: string | null;
  targetId: string | null;
  targetName: string | null;
  status: "success" | "failure" | "warning";
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    sessionId?: string;
    requestId?: string;
    duration?: number;
  };
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  errorMessage?: string | null;
  integrityHash?: string;
  previousLogHash?: string | null;
  relatedLogs?: Array<{
    id: string;
    timestamp: string;
    action: string;
    actionType: string;
    description: string;
  }>;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  actor?: string;
  action?: string;
  targetType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface VerificationResult {
  isValid: boolean;
  totalLogs: number;
  logsVerified: number;
  firstBrokenAt?: {
    logId: string;
    position: number;
    expectedHash: string;
    actualHash: string;
    timestamp: string;
  };
  verificationTime: number;
  message: string;
}

// Mock data fallback
const mockAuditLogs: AuditLog[] = [
  {
    id: "al-001",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    actorId: "u1",
    actorName: "John Smith",
    actorEmail: "john@example.com",
    actorRole: "admin",
    action: "user.login",
    actionType: "access",
    description: "User logged in successfully",
    targetType: "session",
    targetId: "sess-001",
    targetName: "Web Session",
    status: "success",
    metadata: { ipAddress: "192.168.1.100", userAgent: "Chrome/120.0", sessionId: "sess-001" },
  },
  {
    id: "al-002",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    actorId: "u2",
    actorName: "Sarah Johnson",
    actorEmail: "sarah@example.com",
    actorRole: "admin",
    action: "api_key.create",
    actionType: "create",
    description: "Created new API key for production environment",
    targetType: "api_key",
    targetId: "key-001",
    targetName: "Production API Key",
    status: "success",
    metadata: { ipAddress: "192.168.1.101" },
  },
  {
    id: "al-003",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    actorId: "u3",
    actorName: "Mike Chen",
    actorEmail: "mike@example.com",
    actorRole: "editor",
    action: "campaign.update",
    actionType: "update",
    description: "Updated Q1 Marketing Campaign budget and schedule",
    targetType: "campaign",
    targetId: "camp-001",
    targetName: "Q1 Marketing Campaign",
    status: "success",
    changes: { before: { budget: 10000 }, after: { budget: 15000 } },
    metadata: { ipAddress: "192.168.1.102" },
  },
  {
    id: "al-004",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    actorId: "u4",
    actorName: "Emily Davis",
    actorEmail: "emily@example.com",
    actorRole: "viewer",
    action: "user.permission_denied",
    actionType: "security",
    description: "Attempted to access admin settings without permission",
    targetType: "settings",
    targetId: "settings-001",
    targetName: "Admin Settings",
    status: "failure",
    errorMessage: "Insufficient permissions to access admin settings",
    metadata: { ipAddress: "192.168.1.103" },
  },
  {
    id: "al-005",
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    actorId: null,
    actorName: "System",
    actorEmail: null,
    actorRole: "system",
    action: "system.backup",
    actionType: "system",
    description: "Automated daily backup completed",
    targetType: null,
    targetId: null,
    targetName: null,
    status: "success",
    metadata: { duration: 1234 },
  },
];

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exporting, setExporting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Build filters for SWR hook
  const filters = {
    search: search || undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    targetType: targetTypeFilter !== "all" ? targetTypeFilter : undefined,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate).toISOString() : undefined,
    page: currentPage,
    limit: 50,
  };

  // API integration with SWR
  const { logs: apiLogs, pagination: apiPagination, isLoading, isError, error, mutate } = useAuditLogs(filters);

  // Use API data if available, fallback to mock
  const logs = apiLogs.length > 0 ? apiLogs as unknown as AuditLog[] : mockAuditLogs;
  const pagination: PaginationData = apiPagination.totalItems > 0
    ? {
        page: apiPagination.currentPage,
        limit: apiPagination.itemsPerPage,
        total: apiPagination.totalItems,
        totalPages: apiPagination.totalPages,
      }
    : {
        page: 1,
        limit: 50,
        total: mockAuditLogs.length,
        totalPages: 1,
      };

  const loading = isLoading;

  const fetchLogDetails = async (logId: string) => {
    try {
      const response = await fetch(`/api/admin/audit-logs/${logId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedLog(data.log);
      }
    } catch (error) {
      console.error("Failed to fetch log details:", error);
    }
  };

  const exportLogs = async (format: "csv" | "json") => {
    try {
      setExporting(true);
      const filters: Filters = {};

      if (search) filters.search = search;
      if (actionFilter !== "all") filters.action = actionFilter;
      if (statusFilter !== "all") filters.status = statusFilter;
      if (targetTypeFilter !== "all") filters.targetType = targetTypeFilter;
      if (startDate) filters.startDate = new Date(startDate).toISOString();
      if (endDate) filters.endDate = new Date(endDate).toISOString();

      const response = await fetch("/api/admin/audit-logs/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, filters }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to export logs:", error);
    } finally {
      setExporting(false);
    }
  };

  const verifyIntegrity = async () => {
    try {
      setVerifying(true);
      setVerificationResult(null);
      setShowVerificationModal(true);

      const response = await fetch("/api/admin/audit-logs/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 1000 }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResult({
          isValid: data.isValid,
          totalLogs: data.totalLogs,
          logsVerified: data.logsVerified,
          firstBrokenAt: data.firstBrokenAt,
          verificationTime: data.verificationTime,
          message: data.message,
        });
      } else {
        setVerificationResult({
          isValid: false,
          totalLogs: 0,
          logsVerified: 0,
          verificationTime: 0,
          message: data.error || "Verification failed",
        });
      }
    } catch (error) {
      console.error("Failed to verify integrity:", error);
      setVerificationResult({
        isValid: false,
        totalLogs: 0,
        logsVerified: 0,
        verificationTime: 0,
        message: "Failed to connect to verification service",
      });
    } finally {
      setVerifying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "failure":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "update":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "delete":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      case "access":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "security":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "system":
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            System Audit Logs
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor and track all system activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="px-4 py-2 bg-card border border-gray-800 rounded-lg text-white hover:border-primary/50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={verifyIntegrity}
            disabled={verifying}
            className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg text-primary hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {verifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Verify Integrity
          </button>
          <button
            onClick={() => exportLogs("csv")}
            disabled={exporting}
            className="px-4 py-2 bg-card border border-gray-800 rounded-lg text-white hover:border-primary/50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => exportLogs("json")}
            disabled={exporting}
            className="px-4 py-2 bg-card border border-gray-800 rounded-lg text-white hover:border-primary/50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Failed to load audit logs</h3>
              <p className="text-sm text-gray-400">
                {error?.message || "An error occurred while fetching data. Using cached data."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Logs</div>
          <div className="text-2xl font-bold text-white mt-1">
            {pagination.total.toLocaleString()}
          </div>
        </div>
        <div className="bg-card border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">This Page</div>
          <div className="text-2xl font-bold text-white mt-1">{logs.length}</div>
        </div>
        <div className="bg-card border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Current Page</div>
          <div className="text-2xl font-bold text-white mt-1">
            {pagination.page} / {pagination.totalPages}
          </div>
        </div>
        <div className="bg-card border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Filters Active</div>
          <div className="text-2xl font-bold text-white mt-1">
            {[
              actionFilter !== "all",
              statusFilter !== "all",
              targetTypeFilter !== "all",
              startDate,
              endDate,
              search,
            ].filter(Boolean).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 bg-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary/50"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="access">Access</option>
            <option value="security">Security</option>
            <option value="system">System</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary/50"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="warning">Warning</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary/50"
          >
            <option value="all">All Targets</option>
            <option value="user">User</option>
            <option value="organization">Organization</option>
            <option value="brand">Brand</option>
            <option value="api_config">API Config</option>
            <option value="system_setting">System Setting</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <label className="text-sm text-gray-400">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Time
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Actor
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Action
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Description
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Target
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Status
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-800 hover:bg-background transition-colors cursor-pointer"
                    onClick={() => fetchLogDetails(log.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-white text-sm">
                        {formatDate(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white text-sm font-medium">
                          {log.actorName || "System"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.actorEmail || log.actorRole || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionBadgeColor(
                          log.actionType
                        )}`}
                      >
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white text-sm max-w-md truncate">
                        {log.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white text-sm">
                          {log.targetType || "-"}
                        </div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">
                          {log.targetName || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="text-sm text-gray-300 capitalize">
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchLogDetails(log.id);
                        }}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} logs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-card border border-gray-800 rounded-lg text-white hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-card border border-gray-800 rounded-lg text-white hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8 z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-card border border-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-gray-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Audit Log Details</h2>
                <div className="text-sm text-gray-400 mt-1">
                  {formatDate(selectedLog.timestamp)}
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Log ID</label>
                  <div className="text-white font-mono text-sm mt-1">
                    {selectedLog.id}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedLog.status)}
                    <span className="text-white capitalize">
                      {selectedLog.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Actor</label>
                  <div className="text-white mt-1">
                    {selectedLog.actorName || "System"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedLog.actorEmail || selectedLog.actorRole || "-"}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Action</label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionBadgeColor(
                        selectedLog.actionType
                      )}`}
                    >
                      {selectedLog.actionType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <div className="text-white mt-1">{selectedLog.description}</div>
              </div>

              {/* Target */}
              {selectedLog.targetType && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Target Type</label>
                    <div className="text-white mt-1">{selectedLog.targetType}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Target Name</label>
                    <div className="text-white mt-1">
                      {selectedLog.targetName || "-"}
                    </div>
                  </div>
                </div>
              )}

              {/* Changes */}
              {selectedLog.changes && (
                <div>
                  <label className="text-sm text-gray-400">Changes</label>
                  <div className="bg-background border border-gray-800 rounded-lg p-4 mt-2">
                    <pre className="text-sm text-white overflow-x-auto">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && (
                <div>
                  <label className="text-sm text-gray-400">Metadata</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {selectedLog.metadata.ipAddress && (
                      <div>
                        <div className="text-xs text-gray-500">IP Address</div>
                        <div className="text-white text-sm">
                          {selectedLog.metadata.ipAddress}
                        </div>
                      </div>
                    )}
                    {selectedLog.metadata.location && (
                      <div>
                        <div className="text-xs text-gray-500">Location</div>
                        <div className="text-white text-sm">
                          {selectedLog.metadata.location}
                        </div>
                      </div>
                    )}
                    {selectedLog.metadata.sessionId && (
                      <div>
                        <div className="text-xs text-gray-500">Session ID</div>
                        <div className="text-white text-sm font-mono">
                          {selectedLog.metadata.sessionId}
                        </div>
                      </div>
                    )}
                    {selectedLog.metadata.duration && (
                      <div>
                        <div className="text-xs text-gray-500">Duration</div>
                        <div className="text-white text-sm">
                          {selectedLog.metadata.duration}ms
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {selectedLog.errorMessage && (
                <div>
                  <label className="text-sm text-gray-400">Error Message</label>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-2">
                    <div className="text-red-400 text-sm">
                      {selectedLog.errorMessage}
                    </div>
                  </div>
                </div>
              )}

              {/* Related Logs */}
              {selectedLog.relatedLogs && selectedLog.relatedLogs.length > 0 && (
                <div>
                  <label className="text-sm text-gray-400">
                    Related Logs ({selectedLog.relatedLogs.length})
                  </label>
                  <div className="bg-background border border-gray-800 rounded-lg mt-2 overflow-hidden">
                    {selectedLog.relatedLogs.map((relatedLog) => (
                      <div
                        key={relatedLog.id}
                        className="border-b border-gray-800 last:border-0 p-4 hover:bg-card transition-colors cursor-pointer"
                        onClick={() => fetchLogDetails(relatedLog.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white text-sm">
                              {relatedLog.description}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(relatedLog.timestamp)}
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionBadgeColor(
                              relatedLog.actionType
                            )}`}
                          >
                            {relatedLog.actionType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Integrity Hash */}
              {selectedLog.integrityHash && (
                <div>
                  <label className="text-sm text-gray-400">Integrity Hash</label>
                  <div className="text-white font-mono text-xs mt-1 break-all">
                    {selectedLog.integrityHash}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Result Modal */}
      {showVerificationModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8 z-50"
          onClick={() => setShowVerificationModal(false)}
        >
          <div
            className="bg-card border border-gray-800 rounded-lg max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-white">Hash Chain Verification</h2>
              </div>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {verifying ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div className="text-white">Verifying hash chain integrity...</div>
                  <div className="text-sm text-gray-400">
                    This may take a few moments for large audit logs
                  </div>
                </div>
              ) : verificationResult ? (
                <div className="space-y-6">
                  {/* Result Status */}
                  <div
                    className={`p-4 rounded-lg border ${
                      verificationResult.isValid
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {verificationResult.isValid ? (
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-400" />
                      )}
                      <div>
                        <div
                          className={`text-lg font-semibold ${
                            verificationResult.isValid ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {verificationResult.isValid
                            ? "Integrity Verified"
                            : "Integrity Compromised"}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {verificationResult.message}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-background border border-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-xs">Total Logs</div>
                      <div className="text-xl font-bold text-white mt-1">
                        {verificationResult.totalLogs.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-background border border-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-xs">Verified</div>
                      <div className="text-xl font-bold text-white mt-1">
                        {verificationResult.logsVerified.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-background border border-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-xs">Time</div>
                      <div className="text-xl font-bold text-white mt-1">
                        {verificationResult.verificationTime}ms
                      </div>
                    </div>
                  </div>

                  {/* Broken Link Details */}
                  {verificationResult.firstBrokenAt && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 space-y-3">
                      <div className="text-red-400 font-medium">
                        Chain Broken at Position #{verificationResult.firstBrokenAt.position}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Log ID: </span>
                          <span className="text-white font-mono">
                            {verificationResult.firstBrokenAt.logId}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Timestamp: </span>
                          <span className="text-white">
                            {formatDate(verificationResult.firstBrokenAt.timestamp)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Expected Hash: </span>
                          <div className="text-white font-mono text-xs break-all mt-1">
                            {verificationResult.firstBrokenAt.expectedHash}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Actual Hash: </span>
                          <div className="text-white font-mono text-xs break-all mt-1">
                            {verificationResult.firstBrokenAt.actualHash}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowVerificationModal(false)}
                      className="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
