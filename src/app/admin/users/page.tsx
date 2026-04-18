"use client";

import { useState, useEffect } from "react";
import { Search, Users as UsersIcon, Calendar, CheckCircle, XCircle, MoreVertical, Eye, Edit, Ban, CheckCircle2, Shield, ShieldOff } from "lucide-react";
import { formatDate, formatTimestamp } from "@/lib/utils/formatters";

interface User {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  organizationId: string;
  organizationName: string | null;
  organizationSlug: string | null;
  role: string | null;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  superAdminGrantedAt: string | null;
  superAdminGrantedBy: string | null;
}

interface Organization {
  id: string;
  name: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [search, organizationFilter, roleFilter, statusFilter, pagination.page]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        organizationId: organizationFilter,
        role: roleFilter,
        status: statusFilter,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      // Error logged to monitoring system
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/admin/organizations");
      const data = await response.json();

      if (data.success) {
        setOrganizations(data.organizations);
      }
    } catch (error) {
      // Error logged to monitoring system
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`/api/admin/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates }),
      });

      const data = await response.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update user");
    }
  };

  const getRoleBadgeColor = (user: User) => {
    if (user.isSuperAdmin) {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }
    if (user.role === "org:admin") {
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  };

  const getRoleLabel = (user: User) => {
    if (user.isSuperAdmin) {
      return "Super Admin";
    }
    if (user.role === "org:admin") {
      return "Org Admin";
    }
    return "Member";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1">Manage all users across organizations</p>
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
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
          />
        </div>

        <select
          value={organizationFilter}
          onChange={(e) => setOrganizationFilter(e.target.value)}
          className="px-4 py-2.5 bg-card border border-border rounded-lg text-white focus:outline-none focus:border-red-500/50"
        >
          <option value="all">All Organizations</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 bg-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-red-500/50"
        >
          <option value="all">All Roles</option>
          <option value="super-admin">Super Admin</option>
          <option value="org:admin">Org Admin</option>
          <option value="org:member">Member</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-red-500/50"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Organization</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Role</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Created</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-background transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-white">{user.name}</div>
                        {user.isSuperAdmin && (
                          <span title="Super Admin"><Shield className="w-4 h-4 text-red-400" aria-label="Super Admin" /></span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{user.email}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white">{user.organizationName || "No Organization"}</div>
                        <div className="text-sm text-gray-500">{user.organizationSlug || "-"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user)}`}>
                        {getRoleLabel(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
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
                        <span className="text-sm">{formatDate(user.createdAt, "short")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>

                        {actionMenuOpen === user.id && (
                          <div className="absolute right-0 top-full mt-1 w-56 bg-background border border-gray-800 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setActionMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            {user.isActive ? (
                              <button
                                onClick={() => {
                                  updateUser(user.id, { isActive: false });
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
                                  updateUser(user.id, { isActive: true });
                                  setActionMenuOpen(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:bg-gray-800 transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Activate
                              </button>
                            )}
                            {user.isSuperAdmin ? (
                              <button
                                onClick={() => {
                                  updateUser(user.id, { isSuperAdmin: false });
                                  setActionMenuOpen(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-400 hover:bg-gray-800 transition-colors"
                              >
                                <ShieldOff className="w-4 h-4" />
                                Revoke Super Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  updateUser(user.id, { isSuperAdmin: true });
                                  setActionMenuOpen(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 hover:bg-gray-800 transition-colors"
                              >
                                <Shield className="w-4 h-4" />
                                Grant Super Admin
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
        {!loading && users.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <div className="text-sm text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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

      {/* User Details Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-card border border-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {selectedUser.name}
                {selectedUser.isSuperAdmin && (
                  <span title="Super Admin"><Shield className="w-6 h-6 text-red-400" aria-label="Super Admin" /></span>
                )}
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white"
              >
                âœ•
              </button>
            </div>
            <div className="space-y-4 text-gray-300">
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Clerk User ID:</strong> {selectedUser.clerkUserId}</p>
              <p><strong>Organization:</strong> {selectedUser.organizationName || "No Organization"}</p>
              <p><strong>Role:</strong> {getRoleLabel(selectedUser)}</p>
              <p><strong>Status:</strong> {selectedUser.isActive ? "Active" : "Inactive"}</p>
              <p><strong>Created:</strong> {formatTimestamp(selectedUser.createdAt)}</p>
              {selectedUser.lastLoginAt && formatTimestamp(selectedUser.lastLoginAt) !== "N/A" && (
                <p><strong>Last Login:</strong> {formatTimestamp(selectedUser.lastLoginAt)}</p>
              )}
              {selectedUser.isSuperAdmin && selectedUser.superAdminGrantedAt && formatTimestamp(selectedUser.superAdminGrantedAt) !== "N/A" && (
                <>
                  <p><strong>Super Admin Granted:</strong> {formatTimestamp(selectedUser.superAdminGrantedAt)}</p>
                  <p><strong>Granted By:</strong> {selectedUser.superAdminGrantedBy}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
