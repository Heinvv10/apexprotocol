"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Plus,
  Key,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Copy,
  Shield,
} from "lucide-react";
import { formatDate, formatTimestamp } from "@/lib/utils/formatters";
import { useAPIKeys } from "@/hooks/useAdmin";

interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  displayName: string | null;
  type: "anthropic" | "openai" | "serper" | "pinecone" | "custom";
  version: number;
  isActive: boolean;
  lastUsedAt: string | null;
  lastRotatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  maskedKey: string;
}

interface Organization {
  id: string;
  name: string;
}

const API_KEY_TYPES = ["anthropic", "openai", "serper", "pinecone", "custom"] as const;

const TYPE_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  serper: "Serper",
  pinecone: "Pinecone",
  custom: "Custom",
};

// Mock data for fallback
const mockApiKeys: ApiKey[] = [
  {
    id: "1",
    organizationId: "org-1",
    name: "Production OpenAI Key",
    displayName: "Main GPT-4 Key",
    type: "openai",
    version: 3,
    isActive: true,
    lastUsedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    lastRotatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    maskedKey: "sk-...Xk9a",
  },
  {
    id: "2",
    organizationId: "org-1",
    name: "Production Anthropic Key",
    displayName: "Claude API Key",
    type: "anthropic",
    version: 2,
    isActive: true,
    lastUsedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lastRotatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    maskedKey: "sk-ant-...4bCd",
  },
  {
    id: "3",
    organizationId: "org-1",
    name: "Serper Search API",
    displayName: null,
    type: "serper",
    version: 1,
    isActive: true,
    lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastRotatedAt: null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    maskedKey: "srp-...9xYz",
  },
  {
    id: "4",
    organizationId: "org-1",
    name: "Pinecone Vector DB",
    displayName: "Embeddings Storage",
    type: "pinecone",
    version: 1,
    isActive: false,
    lastUsedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastRotatedAt: null,
    expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    maskedKey: "pnc-...3WvU",
  },
  {
    id: "5",
    organizationId: "org-2",
    name: "Custom Analytics API",
    displayName: "Internal Analytics",
    type: "custom",
    version: 1,
    isActive: true,
    lastUsedAt: null,
    lastRotatedAt: null,
    expiresAt: null,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    maskedKey: "cst-...7PqR",
  },
];

const mockOrganizations: Organization[] = [
  { id: "org-1", name: "Apex Technologies" },
  { id: "org-2", name: "Partner Corp" },
];

export default function AdminApiKeysPage() {
  // SWR hook for API data
  const { keys: apiKeysData, organizations: apiOrganizations, isLoading, isError, error: apiError, mutate } = useAPIKeys();

  // Use API data if available, otherwise fall back to mock data
  const apiKeys = apiKeysData.length > 0
    ? apiKeysData as unknown as ApiKey[]
    : mockApiKeys;
  const organizations = apiOrganizations.length > 0
    ? apiOrganizations as unknown as Organization[]
    : mockOrganizations;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Modal states
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rotateModalOpen, setRotateModalOpen] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    organizationId: "",
    name: "",
    displayName: "",
    type: "openai" as (typeof API_KEY_TYPES)[number],
    apiKey: "",
    expiresAt: "",
  });

  // Rotation form state
  const [rotationData, setRotationData] = useState({
    newApiKey: "",
    gracePeriodMinutes: 0,
    reason: "",
  });

  // Processing state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter API keys client-side
  const filteredApiKeys = apiKeys.filter((key) => {
    const matchesSearch = search === "" ||
      key.name.toLowerCase().includes(search.toLowerCase()) ||
      (key.displayName && key.displayName.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "all" || key.type === typeFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && key.isActive) ||
      (statusFilter === "inactive" && !key.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  // Create new API key
  const handleCreate = async () => {
    if (!formData.organizationId || !formData.name || !formData.apiKey) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: formData.organizationId,
          name: formData.name,
          displayName: formData.displayName || null,
          type: formData.type,
          apiKey: formData.apiKey,
          expiresAt: formData.expiresAt || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCreateModalOpen(false);
        resetFormData();
        mutate(); // Refresh data via SWR
      } else {
        setError(data.error || "Failed to create API key");
      }
    } catch {
      setError("Failed to create API key");
    } finally {
      setSubmitting(false);
    }
  };

  // Update API key
  const handleUpdate = async () => {
    if (!selectedKey) return;

    try {
      setSubmitting(true);
      setError(null);

      const updatePayload: Record<string, unknown> = {};
      if (formData.name !== selectedKey.name) updatePayload.name = formData.name;
      if (formData.displayName !== (selectedKey.displayName || ""))
        updatePayload.displayName = formData.displayName || null;
      if (formData.type !== selectedKey.type) updatePayload.type = formData.type;
      if (formData.apiKey) updatePayload.apiKey = formData.apiKey;
      if (formData.expiresAt !== (selectedKey.expiresAt?.split("T")[0] || ""))
        updatePayload.expiresAt = formData.expiresAt || null;

      const response = await fetch(`/api/admin/api-keys/${selectedKey.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (data.success) {
        setEditModalOpen(false);
        setSelectedKey(null);
        resetFormData();
        mutate(); // Refresh data via SWR
      } else {
        setError(data.error || "Failed to update API key");
      }
    } catch {
      setError("Failed to update API key");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete/revoke API key
  const handleDelete = async (force: boolean = false) => {
    if (!selectedKey) return;

    try {
      setSubmitting(true);
      setError(null);

      const url = force
        ? `/api/admin/api-keys/${selectedKey.id}?force=true`
        : `/api/admin/api-keys/${selectedKey.id}`;

      const response = await fetch(url, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setDeleteModalOpen(false);
        setSelectedKey(null);
        mutate(); // Refresh data via SWR
      } else {
        setError(data.error || "Failed to delete API key");
      }
    } catch {
      setError("Failed to delete API key");
    } finally {
      setSubmitting(false);
    }
  };

  // Rotate API key
  const handleRotate = async () => {
    if (!selectedKey || !rotationData.newApiKey) {
      setError("New API key is required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/admin/api-keys/${selectedKey.id}/rotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newApiKey: rotationData.newApiKey,
          gracePeriodMinutes: rotationData.gracePeriodMinutes,
          reason: rotationData.reason || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRotateModalOpen(false);
        setSelectedKey(null);
        setRotationData({ newApiKey: "", gracePeriodMinutes: 0, reason: "" });
        mutate(); // Refresh data via SWR
      } else {
        setError(data.error || "Failed to rotate API key");
      }
    } catch {
      setError("Failed to rotate API key");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle API key active status
  const toggleKeyStatus = async (key: ApiKey) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${key.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !key.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        mutate(); // Refresh data via SWR
      } else {
        setError(data.error || "Failed to update API key status");
      }
    } catch {
      setError("Failed to update API key status");
    } finally {
      setActionMenuOpen(null);
    }
  };

  // Helper functions
  const resetFormData = () => {
    setFormData({
      organizationId: "",
      name: "",
      displayName: "",
      type: "openai",
      apiKey: "",
      expiresAt: "",
    });
  };

  const openEditModal = (key: ApiKey) => {
    setSelectedKey(key);
    setFormData({
      organizationId: key.organizationId,
      name: key.name,
      displayName: key.displayName || "",
      type: key.type,
      apiKey: "",
      expiresAt: key.expiresAt ? key.expiresAt.split("T")[0] : "",
    });
    setEditModalOpen(true);
    setActionMenuOpen(null);
  };

  const openRotateModal = (key: ApiKey) => {
    setSelectedKey(key);
    setRotationData({ newApiKey: "", gracePeriodMinutes: 0, reason: "" });
    setRotateModalOpen(true);
    setActionMenuOpen(null);
  };

  const openDeleteModal = (key: ApiKey) => {
    setSelectedKey(key);
    setDeleteModalOpen(true);
    setActionMenuOpen(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusBadge = (key: ApiKey) => {
    const now = new Date();
    const expiresAt = key.expiresAt ? new Date(key.expiresAt) : null;
    const isExpired = expiresAt && expiresAt < now;

    if (!key.isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20">
          <XCircle className="w-3.5 h-3.5" />
          Revoked
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-orange-500/10 text-orange-400 border-orange-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          Expired
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-green-500/10 text-green-400 border-green-500/20">
        <CheckCircle className="w-3.5 h-3.5" />
        Active
      </span>
    );
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "anthropic":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "openai":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "serper":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "pinecone":
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
          <h1 className="text-3xl font-bold text-white">API Keys</h1>
          <p className="text-gray-400 mt-1">Manage external service API keys (OpenAI, Anthropic, etc.)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => mutate()}
            className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
            {filteredApiKeys.length} Keys
          </div>
          <button
            onClick={() => {
              resetFormData();
              setError(null);
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add API Key
          </button>
        </div>
      </div>

      {/* API Error State */}
      {isError && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Failed to load API keys</span>
          </div>
          <p className="text-red-400/80 text-sm mt-1">
            {apiError?.message || "An error occurred while fetching data. Showing cached data."}
          </p>
        </div>
      )}

      {/* Local Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            &times;
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search API keys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#141930] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#141930] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Types</option>
          {API_KEY_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#141930] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Revoked</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#141930] border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Key</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Version</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Last Rotated</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && filteredApiKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Loading API keys...
                  </td>
                </tr>
              ) : filteredApiKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <Key className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    No API keys found
                  </td>
                </tr>
              ) : (
                filteredApiKeys.map((key) => (
                  <tr key={key.id} className="border-b border-gray-800 hover:bg-[#0a0f1a] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{key.name}</div>
                        {key.displayName && (
                          <div className="text-sm text-gray-500">{key.displayName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeBadgeColor(key.type)}`}
                      >
                        {TYPE_LABELS[key.type] || key.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                          {key.maskedKey}
                        </code>
                        <button
                          onClick={() => copyToClipboard(key.maskedKey)}
                          className="p-1 hover:bg-gray-800 rounded transition-colors"
                          title="Copy masked key"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400">v{key.version}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(key)}</td>
                    <td className="px-6 py-4">
                      {key.lastRotatedAt ? (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {formatDate(key.lastRotatedAt, "short")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === key.id ? null : key.id)}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>

                        {actionMenuOpen === key.id && (
                          <div className="absolute right-0 top-full mt-1 w-56 bg-[#0a0f1a] border border-gray-800 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                setSelectedKey(key);
                                setActionMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => openEditModal(key)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 hover:bg-gray-800 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            {key.isActive && (
                              <button
                                onClick={() => openRotateModal(key)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-400 hover:bg-gray-800 transition-colors"
                              >
                                <RefreshCw className="w-4 h-4" />
                                Rotate Key
                              </button>
                            )}
                            <button
                              onClick={() => toggleKeyStatus(key)}
                              className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-800 transition-colors ${
                                key.isActive ? "text-orange-400" : "text-green-400"
                              }`}
                            >
                              <Shield className="w-4 h-4" />
                              {key.isActive ? "Revoke" : "Reactivate"}
                            </button>
                            <button
                              onClick={() => openDeleteModal(key)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Permanently
                            </button>
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
      </div>

      {/* Details Modal */}
      {selectedKey && !editModalOpen && !deleteModalOpen && !rotateModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedKey(null)}
        >
          <div
            className="bg-[#141930] border border-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedKey.name}</h2>
              <button onClick={() => setSelectedKey(null)} className="text-gray-400 hover:text-white">
                &times;
              </button>
            </div>
            <div className="space-y-4 text-gray-300">
              {selectedKey.displayName && (
                <div>
                  <p className="text-sm text-gray-500">Display Name</p>
                  <p className="font-medium">{selectedKey.displayName}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{TYPE_LABELS[selectedKey.type]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Version</p>
                  <p className="font-medium">v{selectedKey.version}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Masked Key</p>
                <code className="block mt-1 font-mono text-sm bg-gray-800/50 px-3 py-2 rounded">
                  {selectedKey.maskedKey}
                </code>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-1">{getStatusBadge(selectedKey)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatTimestamp(selectedKey.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{formatTimestamp(selectedKey.updatedAt)}</p>
                </div>
              </div>
              {selectedKey.lastRotatedAt && formatTimestamp(selectedKey.lastRotatedAt) !== "N/A" && (
                <div>
                  <p className="text-sm text-gray-500">Last Rotated</p>
                  <p className="font-medium">{formatTimestamp(selectedKey.lastRotatedAt)}</p>
                </div>
              )}
              {selectedKey.lastUsedAt && formatTimestamp(selectedKey.lastUsedAt) !== "N/A" && (
                <div>
                  <p className="text-sm text-gray-500">Last Used</p>
                  <p className="font-medium">{formatTimestamp(selectedKey.lastUsedAt)}</p>
                </div>
              )}
              {selectedKey.expiresAt && formatTimestamp(selectedKey.expiresAt) !== "N/A" && (
                <div>
                  <p className="text-sm text-gray-500">Expires At</p>
                  <p className="font-medium">{formatTimestamp(selectedKey.expiresAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setCreateModalOpen(false);
            setError(null);
          }}
        >
          <div
            className="bg-[#141930] border border-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Add API Key</h2>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setError(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">Select organization...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Production OpenAI Key"
                    className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Optional friendly name"
                    className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as (typeof API_KEY_TYPES)[number] })
                  }
                  className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                >
                  {API_KEY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The key will be encrypted before storage and cannot be retrieved later.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Expires At</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create API Key"}
                </button>
                <button
                  onClick={() => {
                    setCreateModalOpen(false);
                    setError(null);
                  }}
                  className="px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedKey && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setEditModalOpen(false);
            setSelectedKey(null);
            setError(null);
          }}
        >
          <div
            className="bg-[#141930] border border-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Edit API Key</h2>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedKey(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as (typeof API_KEY_TYPES)[number] })
                  }
                  className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                >
                  {API_KEY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New API Key (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Leave blank to keep current key"
                  className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Expires At</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedKey(null);
                    setError(null);
                  }}
                  className="px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rotate Modal */}
      {rotateModalOpen && selectedKey && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setRotateModalOpen(false);
            setSelectedKey(null);
            setError(null);
          }}
        >
          <div
            className="bg-[#141930] border border-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Rotate API Key</h2>
              <button
                onClick={() => {
                  setRotateModalOpen(false);
                  setSelectedKey(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-4">
              <p className="text-sm">
                <strong>Key Rotation</strong> replaces the current key (v{selectedKey.version}) with a new one.
                Optionally set a grace period to keep the old key active during transition.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New API Key <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={rotationData.newApiKey}
                  onChange={(e) => setRotationData({ ...rotationData, newApiKey: e.target.value })}
                  placeholder="Enter new API key"
                  className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Grace Period (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10080"
                  value={rotationData.gracePeriodMinutes}
                  onChange={(e) =>
                    setRotationData({ ...rotationData, gracePeriodMinutes: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set to 0 for immediate rotation. Max: 10080 minutes (7 days).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason (optional)</label>
                <input
                  type="text"
                  value={rotationData.reason}
                  onChange={(e) => setRotationData({ ...rotationData, reason: e.target.value })}
                  placeholder="e.g., Scheduled rotation, key compromise"
                  className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleRotate}
                  disabled={submitting || !rotationData.newApiKey}
                  className="flex-1 px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${submitting ? "animate-spin" : ""}`} />
                  {submitting ? "Rotating..." : "Rotate Key"}
                </button>
                <button
                  onClick={() => {
                    setRotateModalOpen(false);
                    setSelectedKey(null);
                    setError(null);
                  }}
                  className="px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedKey && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setDeleteModalOpen(false);
            setSelectedKey(null);
            setError(null);
          }}
        >
          <div
            className="bg-[#141930] border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Delete API Key</h2>
            <p className="text-gray-300 mb-4">
              Are you sure you want to permanently delete <strong>{selectedKey.name}</strong>?
            </p>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
              <p className="text-sm">
                <strong>Warning:</strong> This action cannot be undone. The key will be permanently removed
                from the system.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDelete(true)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Deleting..." : "Delete Permanently"}
              </button>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedKey(null);
                  setError(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close action menu on outside click */}
      {actionMenuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setActionMenuOpen(null)} />
      )}
    </div>
  );
}
