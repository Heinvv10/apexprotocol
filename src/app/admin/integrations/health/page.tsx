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
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Search,
  Filter,
  Download,
  AlertCircle,
} from "lucide-react";
import { useIntegrationHealthAdmin } from "@/hooks/useIntegrations";

// Mock integration health data
const integrationHealth = [
  {
    id: "health_001",
    integration: "Mautic",
    status: "healthy",
    uptime: 99.9,
    uptimeChange: 0.1,
    avgResponseTime: 142,
    responseTimeChange: -12,
    errorRate: 0.2,
    errorRateChange: -0.1,
    totalRequests: 45230,
    failedRequests: 91,
    lastIncident: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastCheck: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    metrics: {
      latency: [120, 135, 128, 142, 138, 145, 142],
      errors: [0.3, 0.2, 0.25, 0.2, 0.15, 0.2, 0.2],
      requests: [6500, 6800, 6400, 6700, 6300, 6200, 6330],
    },
    endpoints: [
      { path: "/api/v1/leads", avgTime: 120, errorRate: 0.1, requests: 15000 },
      { path: "/api/v1/campaigns", avgTime: 180, errorRate: 0.3, requests: 8000 },
      { path: "/api/v1/contacts", avgTime: 135, errorRate: 0.2, requests: 12000 },
    ],
  },
  {
    id: "health_002",
    integration: "ListMonk",
    status: "healthy",
    uptime: 99.8,
    uptimeChange: -0.1,
    avgResponseTime: 95,
    responseTimeChange: 5,
    errorRate: 0.1,
    errorRateChange: 0,
    totalRequests: 78450,
    failedRequests: 78,
    lastIncident: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    lastCheck: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    metrics: {
      latency: [90, 92, 88, 95, 93, 97, 95],
      errors: [0.1, 0.1, 0.15, 0.1, 0.1, 0.1, 0.1],
      requests: [11200, 11400, 11100, 11300, 11000, 11500, 11250],
    },
    endpoints: [
      { path: "/api/subscribers", avgTime: 85, errorRate: 0.05, requests: 35000 },
      { path: "/api/campaigns", avgTime: 110, errorRate: 0.15, requests: 25000 },
      { path: "/api/lists", avgTime: 90, errorRate: 0.1, requests: 18450 },
    ],
  },
  {
    id: "health_003",
    integration: "Postiz",
    status: "degraded",
    uptime: 98.2,
    uptimeChange: -1.5,
    avgResponseTime: 320,
    responseTimeChange: 85,
    errorRate: 1.8,
    errorRateChange: 1.2,
    totalRequests: 12340,
    failedRequests: 222,
    lastIncident: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    lastCheck: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    metrics: {
      latency: [220, 245, 280, 320, 350, 310, 320],
      errors: [0.5, 0.8, 1.2, 1.8, 2.1, 1.6, 1.8],
      requests: [1700, 1800, 1750, 1820, 1650, 1900, 1720],
    },
    endpoints: [
      { path: "/api/posts", avgTime: 280, errorRate: 1.5, requests: 6000 },
      { path: "/api/analytics", avgTime: 380, errorRate: 2.3, requests: 4000 },
      { path: "/api/accounts", avgTime: 300, errorRate: 1.6, requests: 2340 },
    ],
  },
  {
    id: "health_004",
    integration: "Neon Database",
    status: "healthy",
    uptime: 99.99,
    uptimeChange: 0,
    avgResponseTime: 15,
    responseTimeChange: -2,
    errorRate: 0.01,
    errorRateChange: 0,
    totalRequests: 234567,
    failedRequests: 23,
    lastIncident: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    lastCheck: new Date(Date.now() - 30 * 1000).toISOString(),
    metrics: {
      latency: [16, 15, 14, 15, 16, 15, 15],
      errors: [0.01, 0.01, 0.02, 0.01, 0.01, 0.01, 0.01],
      requests: [33500, 33800, 33200, 33600, 33400, 33700, 33367],
    },
    endpoints: [
      { path: "SELECT queries", avgTime: 12, errorRate: 0.005, requests: 180000 },
      { path: "INSERT queries", avgTime: 18, errorRate: 0.01, requests: 35000 },
      { path: "UPDATE queries", avgTime: 20, errorRate: 0.02, requests: 19567 },
    ],
  },
  {
    id: "health_005",
    integration: "Upstash Redis",
    status: "healthy",
    uptime: 99.95,
    uptimeChange: 0.05,
    avgResponseTime: 8,
    responseTimeChange: -1,
    errorRate: 0.05,
    errorRateChange: 0,
    totalRequests: 456789,
    failedRequests: 228,
    lastIncident: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastCheck: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    metrics: {
      latency: [9, 8, 7, 8, 8, 9, 8],
      errors: [0.05, 0.05, 0.06, 0.05, 0.04, 0.05, 0.05],
      requests: [65200, 65400, 65100, 65300, 65500, 65600, 65270],
    },
    endpoints: [
      { path: "GET operations", avgTime: 6, errorRate: 0.03, requests: 350000 },
      { path: "SET operations", avgTime: 10, errorRate: 0.07, requests: 80000 },
      { path: "DEL operations", avgTime: 9, errorRate: 0.06, requests: 26789 },
    ],
  },
  {
    id: "health_006",
    integration: "Anthropic API",
    status: "healthy",
    uptime: 99.7,
    uptimeChange: -0.2,
    avgResponseTime: 1850,
    responseTimeChange: 120,
    errorRate: 0.3,
    errorRateChange: 0.1,
    totalRequests: 8945,
    failedRequests: 27,
    lastIncident: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastCheck: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    metrics: {
      latency: [1650, 1720, 1800, 1850, 1900, 1820, 1850],
      errors: [0.2, 0.2, 0.25, 0.3, 0.35, 0.28, 0.3],
      requests: [1270, 1280, 1250, 1290, 1260, 1310, 1285],
    },
    endpoints: [
      { path: "/v1/messages (Sonnet)", avgTime: 1800, errorRate: 0.2, requests: 7500 },
      { path: "/v1/messages (Opus)", avgTime: 2500, errorRate: 0.5, requests: 1200 },
      { path: "/v1/messages (Haiku)", avgTime: 800, errorRate: 0.1, requests: 245 },
    ],
  },
];

// Mock recent alerts
const recentAlerts = [
  {
    id: "alert_001",
    integration: "Postiz",
    severity: "warning",
    type: "High Error Rate",
    message: "Error rate increased to 1.8% (threshold: 1.0%)",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: "alert_002",
    integration: "Postiz",
    severity: "warning",
    type: "Slow Response Time",
    message: "Average response time: 320ms (threshold: 250ms)",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: "alert_003",
    integration: "Anthropic API",
    severity: "info",
    type: "Response Time Increase",
    message: "Response time increased by 120ms over 7 days",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    acknowledged: true,
  },
  {
    id: "alert_004",
    integration: "ListMonk",
    severity: "info",
    type: "Uptime Drop",
    message: "Uptime decreased to 99.8% from 99.9%",
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    acknowledged: true,
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "healthy":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Healthy
        </Badge>
      );
    case "degraded":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Degraded
        </Badge>
      );
    case "down":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
          <XCircle className="h-3 w-3 mr-1" />
          Down
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
          Unknown
        </Badge>
      );
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
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
    case "info":
      return (
        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
          <Activity className="h-3 w-3 mr-1" />
          Info
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
          Unknown
        </Badge>
      );
  }
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function IntegrationHealthPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  // API data with fallback to mock data
  const { health, isLoading, isError, error } = useIntegrationHealthAdmin();

  // Use API data if available, otherwise use mock
  const data = health?.integrations && health.integrations.length > 0
    ? health.integrations
    : integrationHealth;
  const alerts = health?.alerts && health.alerts.length > 0
    ? health.alerts
    : recentAlerts;

  // Filter integrations
  const filteredIntegrations = data.filter((integration) => {
    const searchMatch =
      searchQuery === "" ||
      integration.integration.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch = statusFilter === "all" || integration.status === statusFilter;

    return searchMatch && statusMatch;
  });

  // Calculate summary stats
  const totalIntegrations = data.length;
  const healthyCount = data.filter((i) => i.status === "healthy").length;
  const degradedCount = data.filter((i) => i.status === "degraded").length;
  const downCount = data.filter((i) => i.status === "down").length;
  const avgUptime =
    data.reduce((sum, i) => sum + i.uptime, 0) / data.length;
  const avgResponseTime =
    data.reduce((sum, i) => sum + i.avgResponseTime, 0) / data.length;
  const totalRequests = data.reduce((sum, i) => sum + i.totalRequests, 0);
  const totalErrors = data.reduce((sum, i) => sum + i.failedRequests, 0);
  const avgErrorRate = (totalErrors / totalRequests) * 100;
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length;

  // Filter alerts by selected integration
  const filteredAlerts = selectedIntegration
    ? alerts.filter((a) => a.integration === selectedIntegration)
    : alerts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Integration Health</h1>
          <p className="text-gray-400 mt-2">
            Monitor API response times, error rates, and uptime
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Download className="h-4 w-4 mr-2" />
          Export Health Report
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
            <span className="ml-3 text-gray-400">Loading integration health data...</span>
          </div>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-8 bg-gray-800/50 border-gray-700 border-red-500/50">
          <div className="flex items-center justify-center text-red-400">
            <AlertCircle className="h-8 w-8 mr-3" />
            <div>
              <p className="font-semibold">Failed to load integration health data</p>
              <p className="text-sm text-gray-400">{error?.message || "Please try again later"}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content */}
      {!isLoading && !isError && (
      <>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Integrations</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalIntegrations}</p>
          <p className="text-xs text-gray-400 mt-1">
            {healthyCount} healthy, {degradedCount} degraded
          </p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <p className="text-sm text-gray-400">Avg Uptime</p>
          </div>
          <p className="text-3xl font-bold text-white">{avgUptime.toFixed(2)}%</p>
          <p className="text-xs text-gray-400 mt-1">Last 7 days</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-purple-400" />
            <p className="text-sm text-gray-400">Avg Response</p>
          </div>
          <p className="text-3xl font-bold text-white">{Math.round(avgResponseTime)}ms</p>
          <p className="text-xs text-gray-400 mt-1">Across all endpoints</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-gray-400">Error Rate</p>
          </div>
          <p className="text-3xl font-bold text-white">{avgErrorRate.toFixed(2)}%</p>
          <p className="text-xs text-gray-400 mt-1">
            {totalErrors.toLocaleString()} of {totalRequests.toLocaleString()}
          </p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <p className="text-sm text-gray-400">Active Alerts</p>
          </div>
          <p className="text-3xl font-bold text-white">{activeAlerts}</p>
          <p className="text-xs text-gray-400 mt-1">Require attention</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search integrations..."
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
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="degraded">Degraded</SelectItem>
                <SelectItem value="down">Down</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Integration Health Cards */}
      <div className="space-y-3">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <Activity className="h-6 w-6 text-cyan-400 mt-1" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">
                      {integration.integration}
                    </h3>
                    {getStatusBadge(integration.status)}
                  </div>
                  <p className="text-xs text-gray-400">
                    Last checked: {formatTimestamp(integration.lastCheck)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedIntegration(
                      selectedIntegration === integration.integration
                        ? null
                        : integration.integration
                    )
                  }
                >
                  {selectedIntegration === integration.integration
                    ? "Hide Details"
                    : "View Details"}
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Uptime</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-semibold text-white">{integration.uptime}%</p>
                  {integration.uptimeChange !== 0 && (
                    <div
                      className={`flex items-center text-xs ${
                        integration.uptimeChange > 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {integration.uptimeChange > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(integration.uptimeChange)}%
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Avg Response</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-semibold text-white">
                    {integration.avgResponseTime}ms
                  </p>
                  {integration.responseTimeChange !== 0 && (
                    <div
                      className={`flex items-center text-xs ${
                        integration.responseTimeChange < 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {integration.responseTimeChange < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {Math.abs(integration.responseTimeChange)}ms
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Error Rate</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-semibold text-white">{integration.errorRate}%</p>
                  {integration.errorRateChange !== 0 && (
                    <div
                      className={`flex items-center text-xs ${
                        integration.errorRateChange < 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {integration.errorRateChange < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {Math.abs(integration.errorRateChange)}%
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Total Requests</p>
                <p className="text-lg font-semibold text-white">
                  {integration.totalRequests.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Failed Requests</p>
                <p className="text-lg font-semibold text-white">
                  {integration.failedRequests.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Endpoint Details (expanded view) */}
            {selectedIntegration === integration.integration && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-white mb-3">Endpoint Performance</h4>
                <div className="space-y-2">
                  {integration.endpoints.map((endpoint, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-900/50 rounded"
                    >
                      <div className="flex-1">
                        <code className="text-sm text-cyan-400">{endpoint.path}</code>
                      </div>
                      <div className="grid grid-cols-3 gap-6 text-right">
                        <div>
                          <p className="text-xs text-gray-400">Response Time</p>
                          <p className="text-sm font-semibold text-white">{endpoint.avgTime}ms</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Error Rate</p>
                          <p className="text-sm font-semibold text-white">
                            {endpoint.errorRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Requests</p>
                          <p className="text-sm font-semibold text-white">
                            {endpoint.requests.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-1">
                    Last Incident: {formatTimestamp(integration.lastIncident)}
                  </p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Recent Alerts */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
          {selectedIntegration && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIntegration(null)}
            >
              Show All Alerts
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded ${
                  alert.acknowledged ? "bg-gray-900/30" : "bg-gray-900/50"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getSeverityBadge(alert.severity)}
                    <Badge
                      variant="outline"
                      className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs"
                    >
                      {alert.integration}
                    </Badge>
                    <span className="text-xs text-gray-400">{alert.type}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-1">{alert.message}</p>
                  <p className="text-xs text-gray-400">{formatTimestamp(alert.timestamp)}</p>
                </div>
                {!alert.acknowledged && (
                  <Button variant="ghost" size="sm">
                    Acknowledge
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No active alerts</p>
            </div>
          )}
        </div>
      </Card>

      {filteredIntegrations.length === 0 && (
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <div className="text-center">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">No integrations found</h3>
            <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        </Card>
      )}
      </>
      )}
    </div>
  );
}
