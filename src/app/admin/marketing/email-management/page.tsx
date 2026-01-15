"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Search,
  Plus,
  Users,
  Mail,
  TrendingUp,
  AlertCircle,
  Edit,
  Trash2,
  Download,
  Upload,
} from "lucide-react";

// Mock email lists data
const mockEmailLists = [
  {
    id: "list_001",
    name: "Newsletter Subscribers",
    description: "Main newsletter audience - weekly updates",
    subscriberCount: 12450,
    unsubscribeCount: 234,
    bounceCount: 89,
    growthRate: 8.5,
    openRate: 34.2,
    clickRate: 12.8,
    status: "active",
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      listmonkId: "lm_001",
      automation: true,
    },
  },
  {
    id: "list_002",
    name: "Product Updates",
    description: "Users interested in new features and releases",
    subscriberCount: 8920,
    unsubscribeCount: 145,
    bounceCount: 42,
    growthRate: 12.3,
    openRate: 42.5,
    clickRate: 18.6,
    status: "active",
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      listmonkId: "lm_002",
      automation: false,
    },
  },
  {
    id: "list_003",
    name: "Free Trial Users",
    description: "Users currently on free trial - nurture sequence",
    subscriberCount: 3450,
    unsubscribeCount: 67,
    bounceCount: 23,
    growthRate: 15.8,
    openRate: 38.9,
    clickRate: 15.2,
    status: "active",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      listmonkId: "lm_003",
      automation: true,
    },
  },
  {
    id: "list_004",
    name: "Premium Customers",
    description: "Paying customers - exclusive content and updates",
    subscriberCount: 1820,
    unsubscribeCount: 12,
    bounceCount: 5,
    growthRate: 6.2,
    openRate: 52.3,
    clickRate: 24.7,
    status: "active",
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      listmonkId: "lm_004",
      automation: false,
    },
  },
  {
    id: "list_005",
    name: "Webinar Attendees",
    description: "People who attended recent webinars",
    subscriberCount: 2340,
    unsubscribeCount: 34,
    bounceCount: 18,
    growthRate: 0,
    openRate: 28.4,
    clickRate: 9.3,
    status: "inactive",
    createdAt: new Date(Date.now() - 210 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      listmonkId: "lm_005",
      automation: false,
    },
  },
  {
    id: "list_006",
    name: "Blog Subscribers",
    description: "Content marketing audience - blog post notifications",
    subscriberCount: 15680,
    unsubscribeCount: 456,
    bounceCount: 123,
    growthRate: 9.7,
    openRate: 31.8,
    clickRate: 11.4,
    status: "active",
    createdAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      listmonkId: "lm_006",
      automation: true,
    },
  },
];

// Mock recent activity
const mockRecentActivity = [
  {
    id: "activity_001",
    listId: "list_001",
    listName: "Newsletter Subscribers",
    action: "subscriber_added",
    count: 47,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "activity_002",
    listId: "list_003",
    listName: "Free Trial Users",
    action: "bulk_import",
    count: 156,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "activity_003",
    listId: "list_002",
    listName: "Product Updates",
    action: "unsubscribe",
    count: 8,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "activity_004",
    listId: "list_006",
    listName: "Blog Subscribers",
    action: "subscriber_added",
    count: 23,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "activity_005",
    listId: "list_004",
    listName: "Premium Customers",
    action: "list_cleaned",
    count: 5,
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

export default function EmailManagementPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [automationFilter, setAutomationFilter] = useState<string>("all");

  // Calculate stats
  const totalLists = mockEmailLists.length;
  const activeLists = mockEmailLists.filter((list) => list.status === "active").length;
  const totalSubscribers = mockEmailLists.reduce((sum, list) => sum + list.subscriberCount, 0);
  const avgOpenRate =
    totalLists > 0
      ? mockEmailLists.reduce((sum, list) => sum + list.openRate, 0) / totalLists
      : 0;
  const avgClickRate =
    totalLists > 0
      ? mockEmailLists.reduce((sum, list) => sum + list.clickRate, 0) / totalLists
      : 0;
  const totalUnsubscribes = mockEmailLists.reduce((sum, list) => sum + list.unsubscribeCount, 0);

  // Filter lists
  const filteredLists = mockEmailLists.filter((list) => {
    const matchesSearch =
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || list.status === statusFilter;
    const matchesAutomation =
      automationFilter === "all" ||
      (automationFilter === "automated" && list.metadata.automation) ||
      (automationFilter === "manual" && !list.metadata.automation);

    return matchesSearch && matchesStatus && matchesAutomation;
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const now = Date.now();
    const timestamp = new Date(dateString).getTime();
    const diffHours = Math.floor((now - timestamp) / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      subscriber_added: "Subscribers Added",
      bulk_import: "Bulk Import",
      unsubscribe: "Unsubscribes",
      list_cleaned: "List Cleaned",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      subscriber_added: "text-green-400",
      bulk_import: "text-cyan-400",
      unsubscribe: "text-red-400",
      list_cleaned: "text-yellow-400",
    };
    return colors[action] || "text-muted-foreground";
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">Active</span>;
    }
    return <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium">Inactive</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Email Lists</h1>
          <p className="text-muted-foreground mt-1">
            Manage email lists and subscribers across all campaigns
          </p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create List
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-primary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Lists</p>
              <p className="text-2xl font-bold text-white mt-1">
                {totalLists}
              </p>
              <p className="text-xs text-green-400 mt-1">
                {activeLists} active
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="card-primary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Subscribers</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatNumber(totalSubscribers)}
              </p>
              <p className="text-xs text-cyan-400 mt-1">across all lists</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card-primary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Open Rate</p>
              <p className="text-2xl font-bold text-white mt-1">
                {avgOpenRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {avgClickRate.toFixed(1)}% click rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card-primary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unsubscribes</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatNumber(totalUnsubscribes)}
              </p>
              <p className="text-xs text-red-400 mt-1">all time</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-secondary p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search lists by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-background border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={automationFilter} onValueChange={setAutomationFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-background border-border">
              <SelectValue placeholder="Automation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lists</SelectItem>
              <SelectItem value="automated">Automated</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Email Lists Table */}
      <div className="card-secondary">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  List Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Subscribers
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Open Rate
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Click Rate
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Growth
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLists.map((list) => (
                <tr
                  key={list.id}
                  className="border-b border-border hover:bg-background/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/marketing/email-management/${list.id}`)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{list.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {list.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">
                        {formatNumber(list.subscriberCount)}
                      </p>
                      <p className="text-xs text-red-400">
                        {list.unsubscribeCount} unsubscribed
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-cyan-400 font-medium">
                      {list.openRate.toFixed(1)}%
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-purple-400 font-medium">
                      {list.clickRate.toFixed(1)}%
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {list.growthRate > 0 ? (
                      <p className="text-green-400 font-medium">
                        +{list.growthRate.toFixed(1)}%
                      </p>
                    ) : (
                      <p className="text-gray-400 font-medium">0%</p>
                    )}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(list.status)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(list.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
          Showing {filteredLists.length} of {totalLists} email lists
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-secondary p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {mockRecentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <div>
                  <p className="text-sm text-white">
                    <span className="font-medium">{activity.listName}</span> -{" "}
                    <span className={getActionColor(activity.action)}>
                      {getActionLabel(activity.action)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.count} {activity.action === "subscriber_added" ? "new subscribers" : activity.action === "bulk_import" ? "imported" : activity.action === "unsubscribe" ? "unsubscribes" : "records cleaned"}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTime(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
