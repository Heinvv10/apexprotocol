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
} from "lucide-react";

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

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [
    search,
    actionFilter,
    statusFilter,
    targetTypeFilter,
    startDate,
    endDate,
    pagination.page,
  ]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (actionFilter !== "all") params.append("action", actionFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (targetTypeFilter !== "all")
        params.append("targetType", targetTypeFilter);
      if (startDate) params.append("startDate", new Date(startDate).toISOString());
      if (endDate) params.append("endDate", new Date(endDate).toISOString());

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-[#0a0f1a] p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#00E5CC]" />
            System Audit Logs
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor and track all system activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportLogs("csv")}
            disabled={exporting}
            className="px-4 py-2 bg-[#141930] border border-gray-800 rounded-lg text-white hover:border-[#00E5CC]/50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => exportLogs("json")}
            disabled={exporting}
            className="px-4 py-2 bg-[#141930] border border-gray-800 rounded-lg text-white hover:border-[#00E5CC]/50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141930] border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Logs</div>
          <div className="text-2xl font-bold text-white mt-1">
            {pagination.total.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#141930] border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">This Page</div>
          <div className="text-2xl font-bold text-white mt-1">{logs.length}</div>
        </div>
        <div className="bg-[#141930] border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Current Page</div>
          <div className="text-2xl font-bold text-white mt-1">
            {pagination.page} / {pagination.totalPages}
          </div>
        </div>
        <div className="bg-[#141930] border border-gray-800 rounded-lg p-4">
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
              className="w-full pl-10 pr-4 py-2.5 bg-[#141930] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5CC]/50"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#141930] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#00E5CC]/50"
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
            className="px-4 py-2.5 bg-[#141930] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#00E5CC]/50"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="warning">Warning</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#141930] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#00E5CC]/50"
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
              className="px-3 py-2 bg-[#141930] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#00E5CC]/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-[#141930] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#00E5CC]/50"
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
      <div className="bg-[#141930] border border-gray-800 rounded-lg overflow-hidden">
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
                    className="border-b border-gray-800 hover:bg-[#0a0f1a] transition-colors cursor-pointer"
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
                        className="text-[#00E5CC] hover:text-[#00E5CC]/80 transition-colors"
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
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-[#141930] border border-gray-800 rounded-lg text-white hover:border-[#00E5CC]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-[#141930] border border-gray-800 rounded-lg text-white hover:border-[#00E5CC]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="bg-[#141930] border border-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#141930] border-b border-gray-800 p-6 flex items-center justify-between">
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
                  <div className="bg-[#0a0f1a] border border-gray-800 rounded-lg p-4 mt-2">
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
                  <div className="bg-[#0a0f1a] border border-gray-800 rounded-lg mt-2 overflow-hidden">
                    {selectedLog.relatedLogs.map((relatedLog) => (
                      <div
                        key={relatedLog.id}
                        className="border-b border-gray-800 last:border-0 p-4 hover:bg-[#141930] transition-colors cursor-pointer"
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
    </div>
  );
}
