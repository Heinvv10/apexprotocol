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
  RefreshCw,
  Play,
  Trash2,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Clock,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useWebhooksAdmin } from "@/hooks/useIntegrations";

// Mock webhook data
const webhooks = [
  {
    id: "wh_001",
    integration: "Mautic",
    name: "Lead Created",
    endpoint: "https://apex.com/api/webhooks/mautic",
    events: ["lead.created", "lead.updated", "lead.deleted"],
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    deliveryRate: 98.5,
    totalDeliveries: 2847,
    failedDeliveries: 43,
    avgResponseTime: 142,
    retryPolicy: "exponential",
    maxRetries: 3,
  },
  {
    id: "wh_002",
    integration: "Mautic",
    name: "Email Events",
    endpoint: "https://apex.com/api/webhooks/mautic",
    events: ["email.sent", "email.opened", "email.clicked", "email.bounced"],
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    deliveryRate: 99.2,
    totalDeliveries: 15234,
    failedDeliveries: 122,
    avgResponseTime: 98,
    retryPolicy: "exponential",
    maxRetries: 3,
  },
  {
    id: "wh_003",
    integration: "ListMonk",
    name: "Subscriber Events",
    endpoint: "https://apex.com/api/webhooks/listmonk",
    events: ["subscriber.created", "subscriber.updated", "subscriber.bounced"],
    status: "active",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    deliveryRate: 97.8,
    totalDeliveries: 4521,
    failedDeliveries: 99,
    avgResponseTime: 156,
    retryPolicy: "exponential",
    maxRetries: 3,
  },
  {
    id: "wh_004",
    integration: "ListMonk",
    name: "Campaign Events",
    endpoint: "https://apex.com/api/webhooks/listmonk",
    events: ["campaign.sent", "campaign.delivered"],
    status: "active",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    deliveryRate: 99.5,
    totalDeliveries: 1247,
    failedDeliveries: 6,
    avgResponseTime: 87,
    retryPolicy: "exponential",
    maxRetries: 3,
  },
  {
    id: "wh_005",
    integration: "Postiz",
    name: "Post Events",
    endpoint: "https://apex.com/api/webhooks/postiz",
    events: ["post.published", "post.failed", "engagement.received"],
    status: "warning",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    deliveryRate: 89.2,
    totalDeliveries: 487,
    failedDeliveries: 53,
    avgResponseTime: 324,
    retryPolicy: "exponential",
    maxRetries: 3,
  },
  {
    id: "wh_006",
    integration: "Anthropic API",
    name: "Usage Events",
    endpoint: "https://apex.com/api/webhooks/anthropic",
    events: ["usage.logged", "quota.warning"],
    status: "paused",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    deliveryRate: 100,
    totalDeliveries: 234,
    failedDeliveries: 0,
    avgResponseTime: 1240,
    retryPolicy: "linear",
    maxRetries: 5,
  },
];

// Mock delivery history
const deliveryHistory = [
  {
    id: "del_001",
    webhookId: "wh_001",
    webhookName: "Lead Created",
    integration: "Mautic",
    event: "lead.created",
    status: "success",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    responseTime: 142,
    statusCode: 200,
    attempt: 1,
    payload: { leadId: "lead_123", email: "john@example.com" },
  },
  {
    id: "del_002",
    webhookId: "wh_002",
    webhookName: "Email Events",
    integration: "Mautic",
    event: "email.opened",
    status: "success",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    responseTime: 98,
    statusCode: 200,
    attempt: 1,
    payload: { emailId: "email_456", leadId: "lead_123" },
  },
  {
    id: "del_003",
    webhookId: "wh_003",
    webhookName: "Subscriber Events",
    integration: "ListMonk",
    event: "subscriber.created",
    status: "success",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    responseTime: 156,
    statusCode: 200,
    attempt: 1,
    payload: { subscriberId: "sub_789", email: "jane@example.com" },
  },
  {
    id: "del_004",
    webhookId: "wh_005",
    webhookName: "Post Events",
    integration: "Postiz",
    event: "post.published",
    status: "failed",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    responseTime: 5000,
    statusCode: 500,
    attempt: 3,
    error: "Timeout: Request exceeded 5000ms",
    payload: { postId: "post_321", platform: "linkedin" },
  },
  {
    id: "del_005",
    webhookId: "wh_004",
    webhookName: "Campaign Events",
    integration: "ListMonk",
    event: "campaign.sent",
    status: "success",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    responseTime: 87,
    statusCode: 200,
    attempt: 1,
    payload: { campaignId: "camp_654", recipients: 1247 },
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

function getStatusBadge(status: string) {
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
    case "paused":
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
          Paused
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return null;
  }
}

function getDeliveryStatusBadge(status: string) {
  switch (status) {
    case "success":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
          Success
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
          Failed
        </Badge>
      );
    case "retrying":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
          Retrying
        </Badge>
      );
    default:
      return null;
  }
}

export default function WebhooksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [integrationFilter, setIntegrationFilter] = useState("all");
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);

  // API data with fallback to mock data
  const { webhooks: apiWebhooks, isLoading, isError, error } = useWebhooksAdmin();

  // Use API data if available, otherwise use mock
  const data = apiWebhooks && apiWebhooks.length > 0
    ? apiWebhooks
    : webhooks;

  // Filter webhooks
  const filteredWebhooks = data.filter((webhook) => {
    const searchMatch =
      searchQuery === "" ||
      webhook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      webhook.integration.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter === "all" || webhook.status === statusFilter;
    const integrationMatch =
      integrationFilter === "all" || webhook.integration === integrationFilter;
    return searchMatch && statusMatch && integrationMatch;
  });

  // Filter delivery history by selected webhook
  const filteredDeliveryHistory = selectedWebhook
    ? deliveryHistory.filter((d) => d.webhookId === selectedWebhook)
    : deliveryHistory;

  // Calculate summary stats
  const totalWebhooks = data.length;
  const activeWebhooks = data.filter((w) => w.status === "active").length;
  const totalDeliveries = data.reduce((sum, w) => sum + w.totalDeliveries, 0);
  const failedDeliveries = data.reduce((sum, w) => sum + w.failedDeliveries, 0);
  const avgDeliveryRate =
    data.length > 0 ? data.reduce((sum, w) => sum + w.deliveryRate, 0) / data.length : 0;
  const avgResponseTime =
    data.length > 0 ? data.reduce((sum, w) => sum + w.avgResponseTime, 0) / data.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Webhook Management</h1>
          <p className="text-gray-400 mt-2">
            Monitor and manage webhook deliveries and subscriptions
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Zap className="h-4 w-4 mr-2" />
          Register Webhook
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
            <span className="ml-3 text-gray-400">Loading webhooks...</span>
          </div>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-8 bg-gray-800/50 border-gray-700 border-red-500/50">
          <div className="flex items-center justify-center text-red-400">
            <AlertCircle className="h-8 w-8 mr-3" />
            <div>
              <p className="font-semibold">Failed to load webhooks</p>
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
            <Zap className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Total Webhooks</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalWebhooks}</p>
          <p className="text-xs text-gray-400 mt-1">{activeWebhooks} active</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="text-sm text-gray-400">Total Deliveries</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalDeliveries.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">All time</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-gray-400">Failed Deliveries</p>
          </div>
          <p className="text-3xl font-bold text-white">{failedDeliveries}</p>
          <p className="text-xs text-gray-400 mt-1">{((failedDeliveries / totalDeliveries) * 100).toFixed(1)}% failure rate</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-gray-400">Avg Delivery Rate</p>
          </div>
          <p className="text-3xl font-bold text-white">{avgDeliveryRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">Success rate</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-purple-400" />
            <p className="text-sm text-gray-400">Avg Response</p>
          </div>
          <p className="text-3xl font-bold text-white">{avgResponseTime.toFixed(0)}ms</p>
          <p className="text-xs text-gray-400 mt-1">Response time</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search webhooks by name or integration..."
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
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>

            <Select value={integrationFilter} onValueChange={setIntegrationFilter}>
              <SelectTrigger className="w-[160px] bg-gray-900 border-gray-700">
                <SelectValue placeholder="Integration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Integrations</SelectItem>
                <SelectItem value="Mautic">Mautic</SelectItem>
                <SelectItem value="ListMonk">ListMonk</SelectItem>
                <SelectItem value="Postiz">Postiz</SelectItem>
                <SelectItem value="Anthropic API">Anthropic API</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Webhook List */}
      <div className="space-y-3">
        {filteredWebhooks.map((webhook) => (
          <Card key={webhook.id} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{webhook.name}</h3>
                  {getStatusBadge(webhook.status)}
                  <Badge
                    variant="outline"
                    className="bg-purple-500/10 text-purple-400 border-purple-500/20"
                  >
                    {webhook.integration}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <code className="text-sm text-cyan-400 bg-gray-900/50 px-2 py-1 rounded">
                    {webhook.endpoint}
                  </code>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Delivery Rate</p>
                    <p className="text-sm font-semibold text-white">{webhook.deliveryRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Deliveries</p>
                    <p className="text-sm font-semibold text-white">
                      {webhook.totalDeliveries.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Failed</p>
                    <p className="text-sm font-semibold text-red-400">{webhook.failedDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Avg Response</p>
                    <p className="text-sm font-semibold text-white">{webhook.avgResponseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Last Triggered</p>
                    <p className="text-sm font-semibold text-white">
                      {formatTimestamp(webhook.lastTriggered)}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">Events</p>
                  <div className="flex flex-wrap gap-1">
                    {webhook.events.map((event) => (
                      <Badge
                        key={event}
                        variant="outline"
                        className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs"
                      >
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Retry Policy: {webhook.retryPolicy}</span>
                  <span>•</span>
                  <span>Max Retries: {webhook.maxRetries}</span>
                  <span>•</span>
                  <span>Created: {formatTimestamp(webhook.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWebhook(webhook.id === selectedWebhook ? null : webhook.id)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Play className="h-4 w-4" />
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

      {/* Delivery History */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Recent Deliveries {selectedWebhook && "(Filtered)"}
          </h3>
          {selectedWebhook && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedWebhook(null)}
              className="text-cyan-400"
            >
              Clear Filter
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {filteredDeliveryHistory.map((delivery) => (
            <div
              key={delivery.id}
              className="flex items-start justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-700"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {delivery.status === "success" && (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                  {delivery.status === "failed" && <XCircle className="h-4 w-4 text-red-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{delivery.webhookName}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400">{delivery.integration}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <code className="text-xs text-cyan-400">{delivery.event}</code>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>Response: {delivery.responseTime}ms</span>
                    <span>•</span>
                    <span>Status: {delivery.statusCode}</span>
                    <span>•</span>
                    <span>Attempt: {delivery.attempt}</span>
                    {delivery.error && (
                      <>
                        <span>•</span>
                        <span className="text-red-400">{delivery.error}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getDeliveryStatusBadge(delivery.status)}
                <span className="text-xs text-gray-400">{formatTimestamp(delivery.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {filteredWebhooks.length === 0 && (
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <div className="text-center">
            <Zap className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">No webhooks found</h3>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </Card>
      )}
      </>
      )}
    </div>
  );
}
