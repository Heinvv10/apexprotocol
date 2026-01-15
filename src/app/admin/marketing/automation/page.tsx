"use client";

import React, { useState } from "react";
import { Search, Play, Pause, Users, TrendingUp, Mail, Clock, Copy, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useSequences } from "@/hooks/useMarketing";

// Mock email sequences data
const mockSequences = [
  {
    id: "seq_001",
    name: "Welcome Series",
    description: "5-email welcome sequence for new subscribers",
    isTemplate: true,
    emailIds: ["email_001", "email_002", "email_003", "email_004", "email_005"],
    triggerType: "immediate",
    triggerDelay: 0,
    enrollmentCount: 850,
    conversionCount: 127,
    conversionRate: 14.9,
    isActive: true,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seq_002",
    name: "Product Onboarding",
    description: "Help new users get started with the platform",
    isTemplate: true,
    emailIds: ["email_006", "email_007", "email_008"],
    triggerType: "delayed",
    triggerDelay: 86400000, // 1 day
    enrollmentCount: 420,
    conversionCount: 95,
    conversionRate: 22.6,
    isActive: true,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seq_003",
    name: "Re-engagement Campaign",
    description: "Win back inactive subscribers",
    isTemplate: true,
    emailIds: ["email_009", "email_010", "email_011", "email_012"],
    triggerType: "behavior",
    triggerDelay: 0,
    enrollmentCount: 320,
    conversionCount: 28,
    conversionRate: 8.8,
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seq_004",
    name: "Lead Nurture",
    description: "Educate leads about product features",
    isTemplate: false,
    emailIds: ["email_013", "email_014", "email_015", "email_016", "email_017"],
    triggerType: "event",
    triggerDelay: 0,
    enrollmentCount: 650,
    conversionCount: 118,
    conversionRate: 18.2,
    isActive: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seq_005",
    name: "Upgrade Promotion",
    description: "Encourage free users to upgrade to paid plans",
    isTemplate: false,
    emailIds: ["email_018", "email_019", "email_020"],
    triggerType: "delayed",
    triggerDelay: 604800000, // 7 days
    enrollmentCount: 280,
    conversionCount: 42,
    conversionRate: 15.0,
    isActive: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seq_006",
    name: "Trial Expiration",
    description: "Remind users before their trial expires",
    isTemplate: false,
    emailIds: ["email_021", "email_022", "email_023"],
    triggerType: "event",
    triggerDelay: 0,
    enrollmentCount: 190,
    conversionCount: 45,
    conversionRate: 23.7,
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock automation logs for recent activity
const mockAutomationLogs = [
  {
    id: "log_001",
    leadId: "lead_001",
    leadName: "Sarah Williams",
    sequenceId: "seq_001",
    sequenceName: "Welcome Series",
    action: "enrolled",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: "log_002",
    leadId: "lead_002",
    leadName: "John Doe",
    sequenceId: "seq_002",
    sequenceName: "Product Onboarding",
    action: "completed",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: "log_003",
    leadId: "lead_003",
    leadName: "Alice Cooper",
    sequenceId: "seq_004",
    sequenceName: "Lead Nurture",
    action: "enrolled",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  },
  {
    id: "log_004",
    leadId: "lead_004",
    leadName: "Bob Smith",
    sequenceId: "seq_006",
    sequenceName: "Trial Expiration",
    action: "enrolled",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
  },
  {
    id: "log_005",
    leadId: "lead_005",
    leadName: "Emma Johnson",
    sequenceId: "seq_001",
    sequenceName: "Welcome Series",
    action: "paused",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
  },
];

export default function AutomationPage() {
  // API data with fallback to mock data
  const { sequences: apiSequences, isLoading, isError, error } = useSequences();
  const sequences = apiSequences.length > 0 ? apiSequences : mockSequences;

  const [searchQuery, setSearchQuery] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter sequences
  const filteredSequences = sequences.filter((seq) => {
    const matchesSearch =
      searchQuery === "" ||
      seq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (seq.description && seq.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTrigger =
      triggerFilter === "all" || seq.trigger === triggerFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && seq.status === "active") ||
      (statusFilter === "inactive" && seq.status !== "active");

    return matchesSearch && matchesTrigger && matchesStatus;
  });

  // Calculate stats with safe field access
  const totalSequences = sequences.length;
  const activeSequences = sequences.filter((s) => s.status === "active").length;
  const totalEnrollments = sequences.reduce(
    (sum, s) => sum + (s.stats?.subscribers || 0),
    0
  );
  const totalConversions = sequences.reduce(
    (sum, s) => sum + (s.stats?.conversions || 0),
    0
  );
  const avgConversionRate =
    totalSequences > 0
      ? sequences.reduce((sum, s) => sum + (s.stats?.conversionRate || 0), 0) /
        totalSequences
      : 0;

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

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      immediate: "Immediate",
      delayed: "Delayed",
      event: "Event-based",
      behavior: "Behavior-based",
    };
    return labels[type] || type;
  };

  const getTriggerColor = (type: string) => {
    const colors: Record<string, string> = {
      immediate: "bg-green-500",
      delayed: "bg-blue-500",
      event: "bg-purple-500",
      behavior: "bg-orange-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      enrolled: "text-green-400",
      completed: "text-cyan-400",
      paused: "text-yellow-400",
      unenrolled: "text-red-400",
      resumed: "text-blue-400",
    };
    return colors[action] || "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Email Automation</h1>
          <p className="text-muted-foreground mt-1">
            Manage email sequences and automated workflows
          </p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
          <Plus className="h-4 w-4 mr-2" />
          New Sequence
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading sequences...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load sequences</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching sequences"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !isError && (
        <>
          {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Sequences</p>
              <p className="text-2xl font-bold text-white mt-1">
                {activeSequences}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                of {totalSequences} total
              </p>
            </div>
            <Mail className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
              <p className="text-2xl font-bold text-white mt-1">
                {totalEnrollments.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                across all sequences
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Conversions</p>
              <p className="text-2xl font-bold text-white mt-1">
                {totalConversions.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {avgConversionRate.toFixed(1)}% avg rate
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recent Activity</p>
              <p className="text-2xl font-bold text-white mt-1">
                {mockAutomationLogs.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                in last 24 hours
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-secondary p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sequences..."
              className="pl-10 bg-background border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={triggerFilter} onValueChange={setTriggerFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-background border-border">
              <SelectValue placeholder="Trigger Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Triggers</SelectItem>
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
              <SelectItem value="event">Event-based</SelectItem>
              <SelectItem value="behavior">Behavior-based</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-background border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sequences Table */}
      <div className="card-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Sequence Name
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Trigger
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Emails
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Enrollments
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Conversions
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Conv. Rate
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSequences.map((sequence) => {
                const emailCount = sequence.emails?.length || 0;
                const subscribers = sequence.stats?.subscribers || 0;
                const conversions = sequence.stats?.conversions || 0;
                const conversionRate = sequence.stats?.conversionRate || 0;
                const isActive = sequence.status === "active";

                return (
                  <tr
                    key={sequence.id}
                    className="hover:bg-background/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/marketing/automation/${sequence.id}`}
                        className="font-medium text-white hover:text-cyan-400"
                      >
                        {sequence.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {sequence.description || "No description"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Sequence
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded text-white ${getTriggerColor(
                          sequence.trigger
                        )}`}
                      >
                        {getTriggerLabel(sequence.trigger)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {emailCount} emails
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {subscribers.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {conversions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-green-400">
                        {conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isActive ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-cyan-400"
                        >
                          {isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-cyan-400"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSequences.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No sequences found matching your filters.
            </p>
          </div>
        )}

        {filteredSequences.length > 0 && (
          <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
            Showing {filteredSequences.length} of {totalSequences} sequences
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card-secondary p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {mockAutomationLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <div className={`font-medium ${getActionColor(log.action)}`}>
                  {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                </div>
                <div className="text-sm text-muted-foreground">•</div>
                <div className="text-sm text-white">{log.leadName}</div>
                <div className="text-sm text-muted-foreground">•</div>
                <div className="text-sm text-muted-foreground">
                  {log.sequenceName}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTime(log.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
