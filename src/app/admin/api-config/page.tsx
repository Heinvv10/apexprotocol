"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Settings,
  MoreVertical,
  Eye,
  Trash2,
  Power,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";

interface ApiIntegration {
  id: string;
  serviceName: string;
  provider: string;
  description: string | null;
  category: "ai_models" | "search_apis" | "analytics";
  status: "configured" | "not_configured" | "disabled" | "error";
  isEnabled: boolean;
  config: {
    apiKey?: string;
    endpoint?: string;
    model?: string;
    maxTokens?: number;
    [key: string]: any;
  };
  lastVerified: string | null;
  lastError: string | null;
  usageThisMonth: number;
  quotaRemaining: number | null;
  rateLimit: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export default function AdminApiConfigPage() {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedIntegration, setSelectedIntegration] = useState<ApiIntegration | null>(null);
  const [configureIntegration, setConfigureIntegration] = useState<ApiIntegration | null>(null);
  const [deleteIntegration, setDeleteIntegration] = useState<ApiIntegration | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form state for configuration
  const [formData, setFormData] = useState({
    serviceName: "",
    provider: "",
    category: "ai_models" as "ai_models" | "search_apis" | "analytics",
    description: "",
    apiKey: "",
    endpoint: "",
    model: "",
    maxTokens: "",
  });

  useEffect(() => {
    fetchIntegrations();
  }, [search, statusFilter, categoryFilter]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        category: categoryFilter,
      });

      const response = await fetch(`/api/admin/api-config?${params}`);
      const data = await response.json();

      if (data.success) {
        setIntegrations(data.integrations);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateIntegration = async (id: string, updates: Partial<ApiIntegration>) => {
    try {
      const response = await fetch(`/api/admin/api-config/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        fetchIntegrations();
      } else {
        alert(data.error || "Failed to update integration");
      }
    } catch (error) {
      console.error("Failed to update integration:", error);
      alert("Failed to update integration");
    }
  };

  const testConnection = async (config: any) => {
    if (!configureIntegration) return;

    try {
      setTestingConnection(true);
      setTestResult(null);

      const response = await fetch(`/api/admin/api-config/${configureIntegration.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.success ? data.message : data.error,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: "Connection test failed",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    if (!configureIntegration) return;

    try {
      const config = {
        apiKey: formData.apiKey,
        endpoint: formData.endpoint,
        model: formData.model,
        maxTokens: formData.maxTokens ? parseInt(formData.maxTokens) : undefined,
      };

      const response = await fetch(`/api/admin/api-config/${configureIntegration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();
      if (data.success) {
        setConfigureIntegration(null);
        setFormData({
          serviceName: "",
          provider: "",
          category: "ai_models",
          description: "",
          apiKey: "",
          endpoint: "",
          model: "",
          maxTokens: "",
        });
        setTestResult(null);
        fetchIntegrations();
      } else {
        alert(data.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Failed to save configuration:", error);
      alert("Failed to save configuration");
    }
  };

  const handleDelete = async () => {
    if (!deleteIntegration) return;

    try {
      const response = await fetch(`/api/admin/api-config/${deleteIntegration.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setDeleteIntegration(null);
        fetchIntegrations();
      } else {
        alert(data.error || "Failed to delete integration");
      }
    } catch (error) {
      console.error("Failed to delete integration:", error);
      alert("Failed to delete integration");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "configured":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "not_configured":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      case "disabled":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "error":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "configured":
        return <CheckCircle className="w-4 h-4" />;
      case "not_configured":
        return <AlertCircle className="w-4 h-4" />;
      case "disabled":
        return <XCircle className="w-4 h-4" />;
      case "error":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "ai_models":
        return "AI Models";
      case "search_apis":
        return "Search APIs";
      case "analytics":
        return "Analytics";
      default:
        return category;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">API Integrations</h1>
          <p className="text-gray-400 mt-1">Manage external AI service configurations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
            {integrations.length} Integrations
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#141930] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#141930] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Status</option>
          <option value="configured">Configured</option>
          <option value="not_configured">Not Configured</option>
          <option value="disabled">Disabled</option>
          <option value="error">Error</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#141930] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {getCategoryLabel(cat)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#141930] border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Service Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Provider</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Category</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Last Verified</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Enabled</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Loading integrations...
                  </td>
                </tr>
              ) : integrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No integrations found
                  </td>
                </tr>
              ) : (
                integrations.map((integration) => (
                  <tr key={integration.id} className="border-b border-gray-800 hover:bg-[#0a0f1a] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{integration.serviceName}</div>
                      {integration.description && (
                        <div className="text-sm text-gray-500">{integration.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{integration.provider}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-purple-500/10 text-purple-400 border-purple-500/20">
                        {getCategoryLabel(integration.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(integration.status)}`}>
                        {getStatusIcon(integration.status)}
                        {integration.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {integration.lastVerified ? (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{new Date(integration.lastVerified).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => updateIntegration(integration.id, { isEnabled: !integration.isEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          integration.isEnabled ? "bg-cyan-500" : "bg-gray-700"
                        }`}
                        role="switch"
                        aria-checked={integration.isEnabled}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            integration.isEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === integration.id ? null : integration.id)}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>

                        {actionMenuOpen === integration.id && (
                          <div className="absolute right-0 top-full mt-1 w-56 bg-[#0a0f1a] border border-gray-800 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                setConfigureIntegration(integration);
                                setFormData({
                                  serviceName: integration.serviceName,
                                  provider: integration.provider,
                                  category: integration.category,
                                  description: integration.description || "",
                                  apiKey: "",
                                  endpoint: integration.config.endpoint || "",
                                  model: integration.config.model || "",
                                  maxTokens: integration.config.maxTokens?.toString() || "",
                                });
                                setActionMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 hover:bg-gray-800 transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                              Configure
                            </button>
                            <button
                              onClick={() => {
                                setSelectedIntegration(integration);
                                setActionMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                setDeleteIntegration(integration);
                                setActionMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
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

      {/* Configuration Modal */}
      {configureIntegration && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setConfigureIntegration(null);
            setTestResult(null);
          }}
        >
          <div
            className="bg-[#141930] border border-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Configure {configureIntegration.serviceName}</h2>
              <button
                onClick={() => {
                  setConfigureIntegration(null);
                  setTestResult(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key *</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-ant-api03-..."
                  className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Endpoint URL</label>
                <input
                  type="text"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  placeholder="https://api.anthropic.com/v1"
                  className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="claude-3-5-sonnet-20241022"
                    className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData({ ...formData, maxTokens: e.target.value })}
                    placeholder="4096"
                    className="w-full px-4 py-2.5 bg-[#0a0f1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`p-4 rounded-lg border ${testResult.success ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    <span className="font-medium">{testResult.message}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => testConnection({ apiKey: formData.apiKey, endpoint: formData.endpoint })}
                  disabled={!formData.apiKey || testingConnection}
                  className="px-4 py-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {testingConnection ? "Testing..." : "Test Connection"}
                </button>

                <button
                  onClick={saveConfiguration}
                  disabled={!formData.apiKey}
                  className="flex-1 px-4 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Configuration
                </button>

                <button
                  onClick={() => {
                    setConfigureIntegration(null);
                    setTestResult(null);
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

      {/* Details Modal */}
      {selectedIntegration && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedIntegration(null)}
        >
          <div
            className="bg-[#141930] border border-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedIntegration.serviceName}</h2>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <p className="text-sm text-gray-500">Provider</p>
                <p className="font-medium">{selectedIntegration.provider}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{getCategoryLabel(selectedIntegration.category)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{selectedIntegration.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">API Key</p>
                <p className="font-mono font-medium">{selectedIntegration.config.apiKey || "Not configured"}</p>
              </div>
              {selectedIntegration.config.endpoint && (
                <div>
                  <p className="text-sm text-gray-500">Endpoint</p>
                  <p className="font-medium">{selectedIntegration.config.endpoint}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Usage This Month</p>
                  <p className="font-medium">{selectedIntegration.usageThisMonth.toLocaleString()}</p>
                </div>
                {selectedIntegration.quotaRemaining !== null && (
                  <div>
                    <p className="text-sm text-gray-500">Quota Remaining</p>
                    <p className="font-medium">{selectedIntegration.quotaRemaining.toLocaleString()}</p>
                  </div>
                )}
              </div>
              {selectedIntegration.rateLimit && (
                <div>
                  <p className="text-sm text-gray-500">Rate Limit</p>
                  <p className="font-medium">{selectedIntegration.rateLimit}</p>
                </div>
              )}
              {selectedIntegration.lastError && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-gray-500 mb-1">Last Error</p>
                  <p className="text-red-400">{selectedIntegration.lastError}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{new Date(selectedIntegration.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteIntegration && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setDeleteIntegration(null)}
        >
          <div
            className="bg-[#141930] border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Delete Integration</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <strong>{deleteIntegration.serviceName}</strong>? This action cannot be undone.
            </p>
            {deleteIntegration.status === "configured" && (
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 mb-6">
                <p className="text-sm">⚠️ Warning: This integration is currently configured and may be in use.</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteIntegration(null)}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
