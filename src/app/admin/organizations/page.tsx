"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Users, Calendar, CheckCircle, XCircle, MoreVertical, Eye, Edit, Ban, CheckCircle2 } from "lucide-react";
import { formatDate, formatTimestamp } from "@/lib/utils/formatters";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "professional" | "enterprise";
  brandLimit: number;
  brandCount: number;
  userLimit: number;
  userCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, [search, planFilter, statusFilter, pagination.page]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        plan: planFilter,
        status: statusFilter,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/organizations?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrganizations(data.organizations);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrganization = async (orgId: string, updates: Partial<Organization>) => {
    try {
      const response = await fetch(`/api/admin/organizations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, updates }),
      });

      const data = await response.json();
      if (data.success) {
        fetchOrganizations();
      }
    } catch (error) {
      console.error("Failed to update organization:", error);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "starter":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "professional":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "enterprise":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Organizations</h1>
          <p className="text-gray-400 mt-1">Manage all organizations and their settings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {pagination.total} Total
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-4 py-2.5 bg-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-red-500/50"
        >
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-red-500/50"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Organization</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Plan</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Users</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Brands</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Created</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Loading organizations...
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No organizations found
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id} className="border-b border-gray-800 hover:bg-background transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{org.name}</div>
                        <div className="text-sm text-gray-500">{org.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPlanBadgeColor(org.plan)}`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{org.userCount} / {org.userLimit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300">
                        {org.brandCount} / {org.brandLimit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {org.isActive ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-400">
                          <XCircle className="w-4 h-4" />
                          <span>Inactive</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDate(org.createdAt, "short")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === org.id ? null : org.id)}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>

                        {actionMenuOpen === org.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-gray-800 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                setSelectedOrg(org);
                                setActionMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                setActionMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Settings
                            </button>
                            {org.isActive ? (
                              <button
                                onClick={() => {
                                  updateOrganization(org.id, { isActive: false });
                                  setActionMenuOpen(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  updateOrganization(org.id, { isActive: true });
                                  setActionMenuOpen(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:bg-gray-800 transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Activate
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && organizations.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <div className="text-sm text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} organizations
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-background border border-gray-800 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                Previous
              </button>
              <div className="text-sm text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-background border border-gray-800 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Organization Details Modal */}
      {selectedOrg && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedOrg(null)}
        >
          <div
            className="bg-card border border-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{selectedOrg.name}</h2>
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${getPlanBadgeColor(selectedOrg.plan)}`}>
                  {selectedOrg.plan}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Close modal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Organization Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-background rounded-lg border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Slug</p>
                <p className="text-sm text-white font-mono">{selectedOrg.slug}</p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {selectedOrg.isActive ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${selectedOrg.isActive ? "text-green-400" : "text-red-400"}`}>
                    {selectedOrg.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-background rounded-lg border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Users</p>
                <p className="text-sm text-white">
                  <span className="text-cyan-400 font-semibold">{selectedOrg.userCount}</span>
                  <span className="text-gray-500"> / {selectedOrg.userLimit} max</span>
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Brands</p>
                <p className="text-sm text-white">
                  <span className="text-cyan-400 font-semibold">{selectedOrg.brandCount}</span>
                  <span className="text-gray-500"> / {selectedOrg.brandLimit} max</span>
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created</p>
                <p className="text-sm text-white">{formatTimestamp(selectedOrg.createdAt)}</p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Updated</p>
                <p className="text-sm text-white">{formatTimestamp(selectedOrg.updatedAt)}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="flex gap-3">
                <select
                  value={selectedOrg.plan}
                  onChange={(e) => {
                    const newPlan = e.target.value as Organization["plan"];
                    updateOrganization(selectedOrg.id, { plan: newPlan });
                    setSelectedOrg({ ...selectedOrg, plan: newPlan });
                  }}
                  className="flex-1 px-3 py-2 bg-background border border-gray-700 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="starter">Starter Plan</option>
                  <option value="professional">Professional Plan</option>
                  <option value="enterprise">Enterprise Plan</option>
                </select>
                <button
                  onClick={() => {
                    updateOrganization(selectedOrg.id, { isActive: !selectedOrg.isActive });
                    setSelectedOrg({ ...selectedOrg, isActive: !selectedOrg.isActive });
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedOrg.isActive
                      ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                      : "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                  }`}
                >
                  {selectedOrg.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
