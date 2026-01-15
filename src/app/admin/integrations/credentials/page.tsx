"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Trash2,
  Shield,
  Clock,
  Lock,
  Search,
  Filter,
} from "lucide-react";

// Mock credential data
const credentials = [
  {
    id: "cred_001",
    name: "Mautic API Key",
    integration: "Mautic",
    type: "api_key",
    status: "active",
    keyPreview: "mautic_live_••••••••••••abcd1234",
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastRotated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    rotationPolicy: "manual",
    permissions: ["read:leads", "write:leads", "read:campaigns", "write:campaigns"],
    encrypted: true,
    auditLogs: 2847,
  },
  {
    id: "cred_002",
    name: "ListMonk API Key",
    integration: "ListMonk",
    type: "api_key",
    status: "active",
    keyPreview: "lm_prod_••••••••••••xyz9876",
    createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    lastRotated: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    rotationPolicy: "auto_90d",
    permissions: ["read:subscribers", "write:subscribers", "read:campaigns", "send:campaigns"],
    encrypted: true,
    auditLogs: 15234,
  },
  {
    id: "cred_003",
    name: "Postiz OAuth Token",
    integration: "Postiz",
    type: "oauth_token",
    status: "warning",
    keyPreview: "pz_oauth_••••••••••••def4567",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastRotated: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    rotationPolicy: "auto_60d",
    permissions: ["post:content", "read:analytics", "manage:accounts"],
    encrypted: true,
    auditLogs: 487,
    needsRefresh: true,
  },
  {
    id: "cred_004",
    name: "Neon Database Connection",
    integration: "Neon Database",
    type: "connection_string",
    status: "active",
    keyPreview: "postgres://••••••••••••@neon.tech",
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    lastRotated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    expiresAt: null,
    rotationPolicy: "manual",
    permissions: ["read:all", "write:all"],
    encrypted: true,
    auditLogs: 98765,
  },
  {
    id: "cred_005",
    name: "Upstash Redis URL",
    integration: "Upstash Redis",
    type: "connection_string",
    status: "active",
    keyPreview: "redis://••••••••••••.upstash.io",
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    lastRotated: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    expiresAt: null,
    rotationPolicy: "manual",
    permissions: ["read:all", "write:all", "admin:all"],
    encrypted: true,
    auditLogs: 145678,
  },
  {
    id: "cred_006",
    name: "Anthropic API Key",
    integration: "Anthropic API",
    type: "api_key",
    status: "active",
    keyPreview: "sk-ant-api03-••••••••••••mnop5678",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    lastRotated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
    rotationPolicy: "auto_90d",
    permissions: ["read:models", "write:messages", "read:usage"],
    encrypted: true,
    auditLogs: 234567,
  },
  {
    id: "cred_007",
    name: "Legacy Mautic Key",
    integration: "Mautic",
    type: "api_key",
    status: "expired",
    keyPreview: "mautic_test_••••••••••••old1234",
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    lastRotated: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    rotationPolicy: "manual",
    permissions: ["read:leads"],
    encrypted: true,
    auditLogs: 1456,
  },
];

// Mock audit log entries
const auditLogs = [
  {
    id: "audit_001",
    credentialId: "cred_001",
    credentialName: "Mautic API Key",
    action: "key_used",
    actor: "system@apex.com",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ipAddress: "192.168.1.100",
    userAgent: "Apex/1.0",
    success: true,
  },
  {
    id: "audit_002",
    credentialId: "cred_002",
    credentialName: "ListMonk API Key",
    action: "key_used",
    actor: "system@apex.com",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    ipAddress: "192.168.1.100",
    userAgent: "Apex/1.0",
    success: true,
  },
  {
    id: "audit_003",
    credentialId: "cred_003",
    credentialName: "Postiz OAuth Token",
    action: "token_refreshed",
    actor: "admin@apex.com",
    timestamp: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    ipAddress: "192.168.1.105",
    userAgent: "Chrome/120.0",
    success: true,
  },
  {
    id: "audit_004",
    credentialId: "cred_006",
    credentialName: "Anthropic API Key",
    action: "key_rotated",
    actor: "admin@apex.com",
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    ipAddress: "192.168.1.105",
    userAgent: "Chrome/120.0",
    success: true,
  },
  {
    id: "audit_005",
    credentialId: "cred_007",
    credentialName: "Legacy Mautic Key",
    action: "key_expired",
    actor: "system@apex.com",
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    ipAddress: "N/A",
    userAgent: "System",
    success: true,
  },
];

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatExpiryDate(expiresAt: string | null) {
  if (!expiresAt) return "Never";
  const date = new Date(expiresAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Expired";
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  return `${Math.floor(diffDays / 30)}mo`;
}

function getStatusBadge(status: string, needsRefresh?: boolean) {
  if (needsRefresh) {
    return (
      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Needs Refresh
      </Badge>
    );
  }

  switch (status) {
    case "active":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case "warning":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    default:
      return null;
  }
}

function getTypeBadge(type: string) {
  const colors = {
    api_key: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    oauth_token: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    connection_string: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  const labels = {
    api_key: "API Key",
    oauth_token: "OAuth Token",
    connection_string: "Connection String",
  };

  return (
    <Badge variant="outline" className={colors[type as keyof typeof colors]}>
      {labels[type as keyof typeof labels]}
    </Badge>
  );
}

export default function CredentialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);

  // Filter credentials
  const filteredCredentials = credentials.filter((cred) => {
    const searchMatch =
      searchQuery === "" ||
      cred.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.integration.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter === "all" || cred.status === statusFilter;
    const typeMatch = typeFilter === "all" || cred.type === typeFilter;
    return searchMatch && statusMatch && typeMatch;
  });

  // Filter audit logs by selected credential
  const filteredAuditLogs = selectedCredential
    ? auditLogs.filter((log) => log.credentialId === selectedCredential)
    : auditLogs;

  // Calculate summary stats
  const totalCredentials = credentials.length;
  const activeCredentials = credentials.filter((c) => c.status === "active").length;
  const expiredCredentials = credentials.filter((c) => c.status === "expired").length;
  const needsRotation = credentials.filter(
    (c) => c.needsRefresh || (c.expiresAt && new Date(c.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  ).length;
  const encryptedCredentials = credentials.filter((c) => c.encrypted).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Credential Management</h1>
          <p className="text-gray-400 mt-2">
            Securely manage API keys, OAuth tokens, and connection strings
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Key className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Total Credentials</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalCredentials}</p>
          <p className="text-xs text-gray-400 mt-1">{activeCredentials} active</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="text-sm text-gray-400">Active</p>
          </div>
          <p className="text-3xl font-bold text-white">{activeCredentials}</p>
          <p className="text-xs text-gray-400 mt-1">{((activeCredentials / totalCredentials) * 100).toFixed(0)}% of total</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <p className="text-sm text-gray-400">Needs Rotation</p>
          </div>
          <p className="text-3xl font-bold text-white">{needsRotation}</p>
          <p className="text-xs text-gray-400 mt-1">Requires attention</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-gray-400">Expired</p>
          </div>
          <p className="text-3xl font-bold text-white">{expiredCredentials}</p>
          <p className="text-xs text-gray-400 mt-1">Needs cleanup</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-purple-400" />
            <p className="text-sm text-gray-400">Encrypted</p>
          </div>
          <p className="text-3xl font-bold text-white">{encryptedCredentials}</p>
          <p className="text-xs text-gray-400 mt-1">AES-256 encryption</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search credentials by name or integration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-gray-900 border-gray-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="api_key">API Keys</SelectItem>
                <SelectItem value="oauth_token">OAuth Tokens</SelectItem>
                <SelectItem value="connection_string">Connection Strings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Credential List */}
      <div className="space-y-3">
        {filteredCredentials.map((credential) => (
          <Card key={credential.id} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{credential.name}</h3>
                  {getStatusBadge(credential.status, credential.needsRefresh)}
                  {getTypeBadge(credential.type)}
                  <Badge
                    variant="outline"
                    className="bg-purple-500/10 text-purple-400 border-purple-500/20"
                  >
                    {credential.integration}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <code className="text-sm text-cyan-400 bg-gray-900/50 px-3 py-1 rounded font-mono">
                    {showKey[credential.id] ? "sk-ant-api03-1234567890abcdef1234567890abcdef" : credential.keyPreview}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setShowKey({ ...showKey, [credential.id]: !showKey[credential.id] })}
                  >
                    {showKey[credential.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Copy className="h-3 w-3" />
                  </Button>
                  {credential.encrypted && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Encrypted
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Last Used</p>
                    <p className="text-sm font-semibold text-white">
                      {formatTimestamp(credential.lastUsed)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Last Rotated</p>
                    <p className="text-sm font-semibold text-white">
                      {formatTimestamp(credential.lastRotated)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Expires In</p>
                    <p className={`text-sm font-semibold ${
                      credential.expiresAt && new Date(credential.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        ? "text-yellow-400"
                        : "text-white"
                    }`}>
                      {formatExpiryDate(credential.expiresAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Rotation Policy</p>
                    <p className="text-sm font-semibold text-white">
                      {credential.rotationPolicy === "manual" ? "Manual" : credential.rotationPolicy.replace("auto_", "Auto ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Audit Logs</p>
                    <p className="text-sm font-semibold text-white">
                      {credential.auditLogs.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {credential.permissions.map((permission) => (
                      <Badge
                        key={permission}
                        variant="outline"
                        className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs"
                      >
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Created: {formatTimestamp(credential.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCredential(credential.id === selectedCredential ? null : credential.id)}
                >
                  <Clock className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Audit Log */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Audit Log {selectedCredential && "(Filtered)"}
          </h3>
          {selectedCredential && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCredential(null)}
              className="text-cyan-400"
            >
              Clear Filter
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {filteredAuditLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-700"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {log.success ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{log.credentialName}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <code className="text-xs text-cyan-400">{log.action.replace("_", " ")}</code>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>By: {log.actor}</span>
                    <span>•</span>
                    <span>IP: {log.ipAddress}</span>
                    <span>•</span>
                    <span>{log.userAgent}</span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400">{formatTimestamp(log.timestamp)}</span>
            </div>
          ))}
        </div>
      </Card>

      {filteredCredentials.length === 0 && (
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <div className="text-center">
            <Key className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">No credentials found</h3>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
