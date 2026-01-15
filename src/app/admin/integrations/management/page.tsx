"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  RefreshCw,
  Settings,
  Activity,
  Zap,
  Database,
  Mail,
  Share2,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useIntegrationConfigsAdmin } from "@/hooks/useIntegrations";

// Platform colors
const platformColors = {
  mautic: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  listmonk: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  postiz: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  neon: "bg-green-500/10 text-green-400 border-green-500/20",
  upstash: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  anthropic: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

// Mock integration data
const integrations = [
  {
    id: "int_001",
    name: "Mautic",
    type: "marketing",
    status: "connected",
    health: "healthy",
    lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    apiHealth: {
      responseTime: 142,
      errorRate: 0.2,
      uptime: 99.9,
    },
    quota: {
      used: 2847,
      limit: 10000,
      percentage: 28.5,
    },
    features: ["Lead Sync", "Campaign Management", "Email Events"],
    version: "4.4.5",
    icon: Activity,
  },
  {
    id: "int_002",
    name: "ListMonk",
    type: "email",
    status: "connected",
    health: "healthy",
    lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    apiHealth: {
      responseTime: 98,
      errorRate: 0.1,
      uptime: 99.95,
    },
    quota: {
      used: 15234,
      limit: 50000,
      percentage: 30.5,
    },
    features: ["Email Lists", "Subscriber Management", "Campaign Delivery"],
    version: "2.5.1",
    icon: Mail,
  },
  {
    id: "int_003",
    name: "Postiz",
    type: "social",
    status: "connected",
    health: "warning",
    lastSync: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    apiHealth: {
      responseTime: 324,
      errorRate: 2.8,
      uptime: 98.5,
    },
    quota: {
      used: 487,
      limit: 1000,
      percentage: 48.7,
    },
    features: ["Post Scheduling", "Engagement Tracking", "Analytics"],
    version: "1.2.3",
    icon: Share2,
  },
  {
    id: "int_004",
    name: "Neon Database",
    type: "database",
    status: "connected",
    health: "healthy",
    lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    apiHealth: {
      responseTime: 45,
      errorRate: 0.05,
      uptime: 99.99,
    },
    quota: {
      used: 2.4,
      limit: 10,
      percentage: 24,
      unit: "GB",
    },
    features: ["PostgreSQL", "Serverless", "Auto-scaling"],
    version: "Serverless",
    icon: Database,
  },
  {
    id: "int_005",
    name: "Upstash Redis",
    type: "cache",
    status: "connected",
    health: "healthy",
    lastSync: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    apiHealth: {
      responseTime: 12,
      errorRate: 0.01,
      uptime: 99.99,
    },
    quota: {
      used: 145678,
      limit: 1000000,
      percentage: 14.6,
      unit: "commands",
    },
    features: ["Caching", "Session Storage", "Rate Limiting"],
    version: "Redis 7.0",
    icon: Zap,
  },
  {
    id: "int_006",
    name: "Anthropic API",
    type: "ai",
    status: "connected",
    health: "healthy",
    lastSync: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    apiHealth: {
      responseTime: 1240,
      errorRate: 0.3,
      uptime: 99.8,
    },
    quota: {
      used: 234567,
      limit: 1000000,
      percentage: 23.5,
      unit: "tokens",
    },
    features: ["Content Generation", "Analysis", "Claude API"],
    version: "Claude 3.5",
    icon: Activity,
  },
];

// Webhook stats
const webhooks = {
  registered: 18,
  active: 15,
  failed: 3,
  deliveryRate: 94.2,
  avgDeliveryTime: 180,
};

// Recent activity
const recentActivity = [
  {
    id: "act_001",
    integration: "Mautic",
    action: "Lead sync completed",
    status: "success",
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    details: "Synced 23 new leads",
  },
  {
    id: "act_002",
    integration: "ListMonk",
    action: "Email campaign sent",
    status: "success",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    details: "Delivered 1,247 emails",
  },
  {
    id: "act_003",
    integration: "Postiz",
    action: "Post scheduled",
    status: "warning",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    details: "Rate limit warning (80% quota used)",
  },
  {
    id: "act_004",
    integration: "Anthropic API",
    action: "Content generated",
    status: "success",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    details: "Generated 3 content pieces",
  },
  {
    id: "act_005",
    integration: "Neon Database",
    action: "Auto-scaling triggered",
    status: "success",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    details: "Scaled up for high traffic",
  },
];

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

function getHealthBadge(health: string) {
  switch (health) {
    case "healthy":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Healthy
        </Badge>
      );
    case "warning":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
          <XCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    default:
      return null;
  }
}

function getStatusBadge(status: string) {
  if (status === "connected") {
    return (
      <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
        Connected
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
      Disconnected
    </Badge>
  );
}

export default function IntegrationManagementPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // API data with fallback to mock data
  const { integrations: apiIntegrations, isLoading, isError, error } = useIntegrationConfigsAdmin();

  // Use API data if available, otherwise use mock
  const data = apiIntegrations && apiIntegrations.length > 0
    ? apiIntegrations.map((int) => ({
        ...int,
        // Map API fields to expected UI structure
        status: int.status === "active" ? "connected" : "disconnected",
        health: int.status === "active" ? "healthy" : "warning",
        lastSync: int.lastConfigured || new Date().toISOString(),
        apiHealth: {
          responseTime: 100,
          errorRate: 0.1,
          uptime: 99.9,
        },
        quota: {
          used: 0,
          limit: 10000,
          percentage: 0,
          unit: "requests",
        },
        features: int.features || [],
        version: "1.0",
        icon: Activity,
      }))
    : integrations;

  // Filter integrations
  const filteredIntegrations = data.filter((integration) => {
    const statusMatch = filterStatus === "all" || integration.status === filterStatus;
    const typeMatch = filterType === "all" || integration.type === filterType;
    return statusMatch && typeMatch;
  });

  // Calculate summary stats
  const totalIntegrations = data.length;
  const connectedIntegrations = data.filter((i) => i.status === "connected").length;
  const healthyIntegrations = data.filter((i) => i.health === "healthy").length;
  const warningIntegrations = data.filter((i) => i.health === "warning").length;
  const avgResponseTime = data.length > 0
    ? data.reduce((sum, i) => sum + i.apiHealth.responseTime, 0) / data.length
    : 0;
  const avgUptime = data.length > 0
    ? data.reduce((sum, i) => sum + i.apiHealth.uptime, 0) / data.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Integration Management</h1>
          <p className="text-gray-400 mt-2">
            Monitor and manage all third-party integrations
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Settings className="h-4 w-4 mr-2" />
          Configure Integrations
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
            <span className="ml-3 text-gray-400">Loading integration data...</span>
          </div>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-8 bg-gray-800/50 border-gray-700 border-red-500/50">
          <div className="flex items-center justify-center text-red-400">
            <AlertCircle className="h-8 w-8 mr-3" />
            <div>
              <p className="font-semibold">Failed to load integrations</p>
              <p className="text-sm text-gray-400">{error?.message || "Please try again later"}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content - Only show when not loading and no error */}
      {!isLoading && !isError && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Total Integrations</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalIntegrations}</p>
          <p className="text-xs text-gray-400 mt-1">{connectedIntegrations} connected</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="text-sm text-gray-400">Healthy</p>
          </div>
          <p className="text-3xl font-bold text-white">{healthyIntegrations}</p>
          <p className="text-xs text-gray-400 mt-1">
            {((healthyIntegrations / totalIntegrations) * 100).toFixed(0)}% uptime
          </p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <p className="text-sm text-gray-400">Warnings</p>
          </div>
          <p className="text-3xl font-bold text-white">{warningIntegrations}</p>
          <p className="text-xs text-gray-400 mt-1">Need attention</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            <p className="text-sm text-gray-400">Avg Response</p>
          </div>
          <p className="text-3xl font-bold text-white">{avgResponseTime.toFixed(0)}ms</p>
          <p className="text-xs text-gray-400 mt-1">API latency</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">System Uptime</p>
          </div>
          <p className="text-3xl font-bold text-white">{avgUptime.toFixed(2)}%</p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </Card>
      </div>

      {/* Webhook Stats */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Webhook Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Registered</p>
            <p className="text-2xl font-bold text-white">{webhooks.registered}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-400">{webhooks.active}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-400">{webhooks.failed}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Delivery Rate</p>
            <p className="text-2xl font-bold text-cyan-400">{webhooks.deliveryRate}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Avg Delivery</p>
            <p className="text-2xl font-bold text-purple-400">{webhooks.avgDeliveryTime}ms</p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Status:</span>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] bg-gray-900 border-gray-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="disconnected">Disconnected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Type:</span>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px] bg-gray-900 border-gray-700">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="cache">Cache</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIntegrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card key={integration.id} className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                    <p className="text-sm text-gray-400">v{integration.version}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(integration.status)}
                  {getHealthBadge(integration.health)}
                </div>
              </div>

              {/* API Health Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Response Time</p>
                  <p className="text-sm font-semibold text-white">
                    {integration.apiHealth.responseTime}ms
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Error Rate</p>
                  <p className="text-sm font-semibold text-white">
                    {integration.apiHealth.errorRate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Uptime</p>
                  <p className="text-sm font-semibold text-white">
                    {integration.apiHealth.uptime}%
                  </p>
                </div>
              </div>

              {/* Quota Usage */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">
                    Quota Usage: {integration.quota.percentage.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-400">
                    {integration.quota.used.toLocaleString()} / {integration.quota.limit.toLocaleString()}{" "}
                    {integration.quota.unit || "requests"}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      integration.quota.percentage > 80
                        ? "bg-gradient-to-r from-red-500 to-orange-500"
                        : integration.quota.percentage > 50
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : "bg-gradient-to-r from-cyan-500 to-purple-500"
                    }`}
                    style={{ width: `${integration.quota.percentage}%` }}
                  />
                </div>
              </div>

              {/* Features */}
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Features</p>
                <div className="flex flex-wrap gap-1">
                  {integration.features.map((feature) => (
                    <Badge
                      key={feature}
                      variant="outline"
                      className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>Last sync: {formatTimestamp(integration.lastSync)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-700"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {activity.status === "success" && (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                  {activity.status === "warning" && (
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  )}
                  {activity.status === "error" && <XCircle className="h-4 w-4 text-red-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{activity.integration}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-sm text-gray-400">{activity.action}</span>
                  </div>
                  <p className="text-xs text-gray-400">{activity.details}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{formatTimestamp(activity.timestamp)}</span>
            </div>
          ))}
        </div>
      </Card>

          {filteredIntegrations.length === 0 && (
            <Card className="p-8 bg-gray-800/50 border-gray-700">
              <div className="text-center">
                <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">No integrations found</h3>
                <p className="text-sm text-gray-400">
                  Try adjusting your filter criteria
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
