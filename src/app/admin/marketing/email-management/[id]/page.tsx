"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Mail,
  AlertCircle,
  Search,
  Download,
  Upload,
  UserPlus,
  Edit,
  Trash2,
  BarChart3,
} from "lucide-react";

// Mock email lists data (same as parent page)
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

// Mock subscribers data by list
const mockSubscribers: Record<string, any[]> = {
  list_001: [
    {
      id: "sub_001",
      email: "sarah.williams@example.com",
      name: "Sarah Williams",
      status: "active",
      subscribedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      lastEmailSent: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      emailsReceived: 45,
      emailsOpened: 23,
      emailsClicked: 8,
    },
    {
      id: "sub_002",
      email: "john.doe@example.com",
      name: "John Doe",
      status: "active",
      subscribedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      lastEmailSent: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      emailsReceived: 38,
      emailsOpened: 31,
      emailsClicked: 15,
    },
    {
      id: "sub_003",
      email: "alice.cooper@example.com",
      name: "Alice Cooper",
      status: "bounced",
      subscribedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      lastEmailSent: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      emailsReceived: 30,
      emailsOpened: 12,
      emailsClicked: 3,
    },
    {
      id: "sub_004",
      email: "bob.smith@example.com",
      name: "Bob Smith",
      status: "active",
      subscribedAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
      lastEmailSent: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      emailsReceived: 25,
      emailsOpened: 18,
      emailsClicked: 9,
    },
    {
      id: "sub_005",
      email: "emma.johnson@example.com",
      name: "Emma Johnson",
      status: "unsubscribed",
      subscribedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      lastEmailSent: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      emailsReceived: 20,
      emailsOpened: 5,
      emailsClicked: 1,
    },
  ],
};

// Mock performance data by list
const mockPerformanceData: Record<string, any> = {
  list_001: {
    last30Days: {
      emailsSent: 12450,
      opened: 4255,
      clicked: 1594,
      bounced: 89,
      unsubscribed: 12,
    },
    byWeek: [
      { week: "Week 1", sent: 3100, opened: 1085, clicked: 410 },
      { week: "Week 2", sent: 3150, opened: 1102, clicked: 425 },
      { week: "Week 3", sent: 3000, opened: 1020, clicked: 380 },
      { week: "Week 4", sent: 3200, opened: 1048, clicked: 379 },
    ],
  },
};

export default function EmailListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "subscribers" | "performance">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Unwrap async params
  const { id } = use(params);

  // Find the list and related data
  const list = mockEmailLists.find((l) => l.id === id) || mockEmailLists[0];
  const subscribers = mockSubscribers[id] || mockSubscribers["list_001"];
  const performanceData = mockPerformanceData[id] || mockPerformanceData["list_001"];

  // Filter subscribers
  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch =
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">Active</span>;
      case "bounced":
        return <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">Bounced</span>;
      case "unsubscribed":
        return <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium">Unsubscribed</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium">{status}</span>;
    }
  };

  const calculateEngagementRate = (opened: number, received: number) => {
    if (received === 0) return 0;
    return (opened / received) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/marketing/email-management")}
            className="text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{list.name}</h1>
            <p className="text-muted-foreground mt-1">{list.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-border text-white hover:bg-background/50">
            <Edit className="w-4 h-4 mr-2" />
            Edit List
          </Button>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Subscribers
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-primary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Subscribers</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatNumber(list.subscriberCount)}
              </p>
              <p className="text-xs text-green-400 mt-1">
                +{list.growthRate.toFixed(1)}% growth
              </p>
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
                {list.openRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                across all campaigns
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
              <p className="text-sm text-muted-foreground">Click Rate</p>
              <p className="text-2xl font-bold text-white mt-1">
                {list.clickRate.toFixed(1)}%
              </p>
              <p className="text-xs text-cyan-400 mt-1">
                {(list.clickRate / list.openRate * 100).toFixed(1)}% of opens
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
                {formatNumber(list.unsubscribeCount)}
              </p>
              <p className="text-xs text-red-400 mt-1">
                {((list.unsubscribeCount / list.subscriberCount) * 100).toFixed(2)}% rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-background border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* List Details */}
            <div className="card-secondary p-6">
              <h3 className="text-lg font-semibold text-white mb-4">List Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-white">
                    {list.status === "active" ? (
                      <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Automation</span>
                  <span className="text-white">
                    {list.metadata.automation ? (
                      <span className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-medium">
                        Manual
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-white">{formatDate(list.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">ListMonk ID</span>
                  <span className="text-white font-mono text-sm">
                    {list.metadata.listmonkId}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Bounce Count</span>
                  <span className="text-red-400 font-medium">{list.bounceCount}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="card-secondary p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Last 30 Days</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Emails Sent</span>
                    <span className="text-white font-medium">
                      {formatNumber(performanceData.last30Days.emailsSent)}
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Opened</span>
                    <span className="text-cyan-400 font-medium">
                      {formatNumber(performanceData.last30Days.opened)} (
                      {((performanceData.last30Days.opened / performanceData.last30Days.emailsSent) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full"
                      style={{
                        width: `${(performanceData.last30Days.opened / performanceData.last30Days.emailsSent) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Clicked</span>
                    <span className="text-purple-400 font-medium">
                      {formatNumber(performanceData.last30Days.clicked)} (
                      {((performanceData.last30Days.clicked / performanceData.last30Days.emailsSent) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${(performanceData.last30Days.clicked / performanceData.last30Days.emailsSent) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Bounced</span>
                    <span className="text-red-400 font-medium">
                      {formatNumber(performanceData.last30Days.bounced)} (
                      {((performanceData.last30Days.bounced / performanceData.last30Days.emailsSent) * 100).toFixed(2)}%)
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${(performanceData.last30Days.bounced / performanceData.last30Days.emailsSent) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Unsubscribed</span>
                    <span className="text-gray-400 font-medium">
                      {formatNumber(performanceData.last30Days.unsubscribed)} (
                      {((performanceData.last30Days.unsubscribed / performanceData.last30Days.emailsSent) * 100).toFixed(2)}%)
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full"
                      style={{
                        width: `${(performanceData.last30Days.unsubscribed / performanceData.last30Days.emailsSent) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-6 mt-6">
          {/* Filters */}
          <div className="card-secondary p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or name..."
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
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" className="border-border text-white hover:bg-background/50">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" className="border-border text-white hover:bg-background/50">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="card-secondary">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Subscriber
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Subscribed
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Emails Received
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Engagement
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Last Email
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-border hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{sub.name}</p>
                          <p className="text-xs text-muted-foreground">{sub.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(sub.status)}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(sub.subscribedAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{sub.emailsReceived}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-cyan-400 text-sm font-medium">
                            {sub.emailsOpened} opens
                          </p>
                          <p className="text-purple-400 text-xs">
                            {sub.emailsClicked} clicks
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(sub.lastEmailSent)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                          >
                            <BarChart3 className="w-4 h-4" />
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
              Showing {filteredSubscribers.length} of {subscribers.length} subscribers
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="card-secondary p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Weekly Performance</h3>
            <div className="space-y-4">
              {performanceData.byWeek.map((week: any, index: number) => (
                <div key={index} className="p-4 rounded-lg bg-background/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">{week.week}</h4>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Sent: </span>
                        <span className="text-white font-medium">
                          {formatNumber(week.sent)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Opened: </span>
                        <span className="text-cyan-400 font-medium">
                          {formatNumber(week.opened)} (
                          {((week.opened / week.sent) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Clicked: </span>
                        <span className="text-purple-400 font-medium">
                          {formatNumber(week.clicked)} (
                          {((week.clicked / week.sent) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-background rounded-full h-3">
                      <div
                        className="bg-cyan-500 h-3 rounded-full"
                        style={{ width: `${(week.opened / week.sent) * 100}%` }}
                      />
                    </div>
                    <div className="flex-1 bg-background rounded-full h-3">
                      <div
                        className="bg-purple-500 h-3 rounded-full"
                        style={{ width: `${(week.clicked / week.sent) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
