"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Code2,
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  displayName: string | null;
  version: number;
  isActive: boolean;
  lastUsedAt: string | null;
  lastRotatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  maskedKey: string;
}

interface GeneratedKey {
  id: string;
  name: string;
  displayName: string | null;
  version: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  key: string;
  maskedKey: string;
}

export default function DeveloperSettingsPage() {
  // State management
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Modal states
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generatedKeyModalOpen, setGeneratedKeyModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Form state
  const [keyName, setKeyName] = useState("");
  const [keyDisplayName, setKeyDisplayName] = useState("");
  const [keyExpiration, setKeyExpiration] = useState("");

  // Generated key state (shown once)
  const [generatedKey, setGeneratedKey] = useState<GeneratedKey | null>(null);
  const [copied, setCopied] = useState(false);

  // Processing state
  const [submitting, setSubmitting] = useState(false);

  // Fetch user's API keys
  const fetchApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/api-keys");
      const data = await response.json();

      if (data.success) {
        setApiKeys(data.apiKeys);
      } else {
        setError(data.error || "Failed to fetch API keys");
      }
    } catch {
      setError("Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  // Generate new API key
  const handleGenerate = async () => {
    if (!keyName.trim()) {
      setError("Please enter a name for your API key");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName.trim(),
          displayName: keyDisplayName.trim() || null,
          expiresAt: keyExpiration || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGenerateModalOpen(false);
        setGeneratedKey(data.apiKey);
        setGeneratedKeyModalOpen(true);
        resetFormData();
        await fetchApiKeys();
      } else {
        if (response.status === 429) {
          setError(data.details || "Rate limit exceeded. Please try again later.");
        } else {
          setError(data.error || "Failed to generate API key");
        }
      }
    } catch {
      setError("Failed to generate API key");
    } finally {
      setSubmitting(false);
    }
  };

  // Update API key name
  const handleUpdate = async () => {
    if (!selectedKey) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/user/api-keys/${selectedKey.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName.trim() || undefined,
          displayName: keyDisplayName.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditModalOpen(false);
        setSelectedKey(null);
        resetFormData();
        await fetchApiKeys();
      } else {
        setError(data.error || "Failed to update API key");
      }
    } catch {
      setError("Failed to update API key");
    } finally {
      setSubmitting(false);
    }
  };

  // Revoke API key
  const handleRevoke = async () => {
    if (!selectedKey) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/user/api-keys/${selectedKey.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setRevokeModalOpen(false);
        setSelectedKey(null);
        await fetchApiKeys();
      } else {
        setError(data.error || "Failed to revoke API key");
      }
    } catch {
      setError("Failed to revoke API key");
    } finally {
      setSubmitting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  // Helper functions
  const resetFormData = () => {
    setKeyName("");
    setKeyDisplayName("");
    setKeyExpiration("");
  };

  const openEditModal = (key: ApiKey) => {
    setSelectedKey(key);
    setKeyName(key.name);
    setKeyDisplayName(key.displayName || "");
    setEditModalOpen(true);
    setActionMenuOpen(null);
  };

  const openRevokeModal = (key: ApiKey) => {
    setSelectedKey(key);
    setRevokeModalOpen(true);
    setActionMenuOpen(null);
  };

  const openDetailsModal = (key: ApiKey) => {
    setSelectedKey(key);
    setDetailsModalOpen(true);
    setActionMenuOpen(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (key: ApiKey) => {
    const now = new Date();
    const expiresAt = key.expiresAt ? new Date(key.expiresAt) : null;
    const isExpired = expiresAt && expiresAt < now;

    if (!key.isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle className="w-3.5 h-3.5" />
          Revoked
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          Expired
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
        <CheckCircle className="w-3.5 h-3.5" />
        Active
      </span>
    );
  };

  const activeKeysCount = apiKeys.filter((k) => k.isActive).length;

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <Code2 className="w-7 h-7 text-primary" />
            Developer Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your API keys for programmatic access to the Apex platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            {activeKeysCount} Active {activeKeysCount === 1 ? "Key" : "Keys"}
          </div>
          <button
            onClick={() => {
              resetFormData();
              setError(null);
              setGenerateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate API Key
          </button>
        </div>
      </div>

      {/* Rate Limit Notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Rate Limit Notice</p>
          <p className="text-amber-400/80 mt-1">
            You can generate up to 10 API keys per hour. Each key is shown only once when generated - make sure to copy it immediately.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            &times;
          </button>
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Your API Keys
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground">Key</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground">Created</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground">Last Used</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    Loading API keys...
                  </td>
                </tr>
              ) : apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Key className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p>No API keys yet</p>
                    <p className="text-sm mt-1">Generate your first API key to get started</p>
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-foreground">{key.name}</div>
                        {key.displayName && (
                          <div className="text-sm text-muted-foreground">{key.displayName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded">
                        {key.maskedKey}
                      </code>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(key)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatDate(key.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never used"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === key.id ? null : key.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>

                        {actionMenuOpen === key.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-white/10 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => openDetailsModal(key)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-white/5 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => openEditModal(key)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-white/5 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Rename
                            </button>
                            {key.isActive && (
                              <button
                                onClick={() => openRevokeModal(key)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Revoke Key
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
      </div>

      {/* API Usage Info */}
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Using Your API Key</h3>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Include your API key in the Authorization header of your requests:
          </p>
          <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
            <code>Authorization: Bearer apx_your_api_key_here</code>
          </div>
          <p className="text-xs text-muted-foreground">
            Keep your API keys secure. Do not share them in public repositories or client-side code.
          </p>
        </div>
      </div>

      {/* Generate API Key Modal */}
      {generateModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setGenerateModalOpen(false);
            setError(null);
          }}
        >
          <div
            className="bg-card border border-white/10 rounded-xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-foreground">Generate API Key</h2>
            </div>

            {error && (
              <div className="mx-4 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={keyDisplayName}
                  onChange={(e) => setKeyDisplayName(e.target.value)}
                  placeholder="A friendly description for this key"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Expiration (optional)
                </label>
                <input
                  type="date"
                  value={keyExpiration}
                  onChange={(e) => setKeyExpiration(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for a non-expiring key
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border-t border-white/10">
              <button
                onClick={handleGenerate}
                disabled={submitting || !keyName.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Generating..." : "Generate Key"}
              </button>
              <button
                onClick={() => {
                  setGenerateModalOpen(false);
                  setError(null);
                }}
                className="px-4 py-2.5 bg-white/5 text-foreground rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Key Modal (shown once) */}
      {generatedKeyModalOpen && generatedKey && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {}}
        >
          <div className="bg-card border border-white/10 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                API Key Generated
              </h2>
            </div>

            <div className="p-4 space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Important: Save Your Key Now</p>
                  <p className="text-amber-400/80 mt-1">
                    This is the only time you will see this API key. Copy it now and store it securely.
                    You will not be able to see it again.
                  </p>
                </div>
              </div>

              {/* Key Name */}
              <div>
                <p className="text-sm text-muted-foreground">Key Name</p>
                <p className="text-foreground font-medium">{generatedKey.name}</p>
              </div>

              {/* The API Key */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Your API Key</p>
                <div className="relative">
                  <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-green-400 break-all pr-12">
                    {generatedKey.key}
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedKey.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-400 mt-2">Copied to clipboard!</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => {
                  setGeneratedKeyModalOpen(false);
                  setGeneratedKey(null);
                }}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                I&apos;ve Saved My Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedKey && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setEditModalOpen(false);
            setSelectedKey(null);
            setError(null);
          }}
        >
          <div
            className="bg-card border border-white/10 rounded-xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-foreground">Rename API Key</h2>
            </div>

            {error && (
              <div className="mx-4 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <input
                  type="text"
                  value={keyDisplayName}
                  onChange={(e) => setKeyDisplayName(e.target.value)}
                  placeholder="A friendly description"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border-t border-white/10">
              <button
                onClick={handleUpdate}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedKey(null);
                  setError(null);
                }}
                className="px-4 py-2.5 bg-white/5 text-foreground rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {revokeModalOpen && selectedKey && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setRevokeModalOpen(false);
            setSelectedKey(null);
            setError(null);
          }}
        >
          <div
            className="bg-card border border-white/10 rounded-xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-foreground">Revoke API Key</h2>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to revoke <strong className="text-foreground">{selectedKey.name}</strong>?
              </p>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Warning</p>
                  <p className="text-red-400/80 mt-1">
                    This action cannot be undone. Any applications using this API key will immediately
                    lose access.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 border-t border-white/10">
              <button
                onClick={handleRevoke}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Revoking..." : "Revoke Key"}
              </button>
              <button
                onClick={() => {
                  setRevokeModalOpen(false);
                  setSelectedKey(null);
                  setError(null);
                }}
                className="px-4 py-2.5 bg-white/5 text-foreground rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModalOpen && selectedKey && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setDetailsModalOpen(false);
            setSelectedKey(null);
          }}
        >
          <div
            className="bg-card border border-white/10 rounded-xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-foreground">{selectedKey.name}</h2>
              <button
                onClick={() => {
                  setDetailsModalOpen(false);
                  setSelectedKey(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                &times;
              </button>
            </div>

            <div className="p-4 space-y-4">
              {selectedKey.displayName && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-foreground">{selectedKey.displayName}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Masked Key</p>
                <code className="block mt-1 font-mono text-sm bg-white/5 px-3 py-2 rounded">
                  {selectedKey.maskedKey}
                </code>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(selectedKey)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-foreground">{formatDate(selectedKey.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-foreground">{formatDate(selectedKey.updatedAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Last Used</p>
                  <p className="text-foreground">
                    {selectedKey.lastUsedAt ? formatDate(selectedKey.lastUsedAt) : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="text-foreground">
                    {selectedKey.expiresAt ? formatDate(selectedKey.expiresAt) : "Never"}
                  </p>
                </div>
              </div>

              {selectedKey.lastRotatedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Rotated</p>
                  <p className="text-foreground">{formatDate(selectedKey.lastRotatedAt)}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="text-foreground">v{selectedKey.version}</p>
              </div>
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
