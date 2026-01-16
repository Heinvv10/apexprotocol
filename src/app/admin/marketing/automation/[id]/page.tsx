"use client";

import React, { use, useState } from "react";
import { ArrowLeft, Play, Pause, Copy, Edit, Users, TrendingUp, Mail, Target, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSequence } from "@/hooks/useMarketing";

// Mock sequences data (same as automation page)
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

// Mock email details for sequences
const mockEmailDetails = {
  seq_001: [
    { id: "email_001", name: "Welcome Email", subject: "Welcome to Apex!", position: 1, delay: 0, openRate: 45.2, clickRate: 12.8 },
    { id: "email_002", name: "Getting Started", subject: "Your First Steps with Apex", position: 2, delay: 86400000, openRate: 38.5, clickRate: 10.2 },
    { id: "email_003", name: "Feature Highlights", subject: "Discover Apex Features", position: 3, delay: 172800000, openRate: 32.1, clickRate: 8.5 },
    { id: "email_004", name: "Success Stories", subject: "How Others Use Apex", position: 4, delay: 259200000, openRate: 28.7, clickRate: 7.2 },
    { id: "email_005", name: "Next Steps", subject: "Take Your Apex Journey Further", position: 5, delay: 345600000, openRate: 25.3, clickRate: 6.8 },
  ],
  seq_002: [
    { id: "email_006", name: "Platform Overview", subject: "Getting Started with Your Account", position: 1, delay: 86400000, openRate: 52.3, clickRate: 18.5 },
    { id: "email_007", name: "Key Features", subject: "Unlock the Power of Apex", position: 2, delay: 259200000, openRate: 48.1, clickRate: 16.2 },
    { id: "email_008", name: "Best Practices", subject: "Pro Tips for Success", position: 3, delay: 432000000, openRate: 42.5, clickRate: 14.8 },
  ],
};

// Mock enrolled leads
const mockEnrolledLeads = {
  seq_001: [
    { id: "lead_001", name: "Sarah Williams", email: "sarah@example.com", currentStep: 3, enrolledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: "active" },
    { id: "lead_002", name: "John Doe", email: "john@example.com", currentStep: 5, enrolledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), status: "completed" },
    { id: "lead_003", name: "Alice Cooper", email: "alice@example.com", currentStep: 2, enrolledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: "active" },
    { id: "lead_004", name: "Bob Smith", email: "bob@example.com", currentStep: 4, enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), status: "active" },
    { id: "lead_005", name: "Emma Johnson", email: "emma@example.com", currentStep: 1, enrolledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: "paused" },
  ],
};

export default function SequenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "emails" | "enrollments">("overview");

  // Unwrap async params
  const { id } = use(params);

  // API data with fallback to mock data
  const { sequence: apiSequence, isLoading, isError, error } = useSequence(id);
  const sequence = apiSequence || mockSequences.find((s) => s.id === id) || mockSequences[0];

  const emails = mockEmailDetails[id as keyof typeof mockEmailDetails] || [];
  const enrolledLeads = mockEnrolledLeads[id as keyof typeof mockEnrolledLeads] || [];

  // Safe field access - handle both API format (stats object) and mock format (flat fields)
  const sequenceAny = sequence as Record<string, unknown>;
  const statsObj = sequenceAny.stats as Record<string, number> | undefined;
  const subscribers = statsObj?.subscribers || (sequenceAny.enrollmentCount as number) || 0;
  const conversions = statsObj?.conversions || (sequenceAny.conversionCount as number) || 0;
  const conversionRate = statsObj?.conversionRate || (sequenceAny.conversionRate as number) || 0;
  const sent = statsObj?.sent || 0;
  const opened = statsObj?.opened || 0;
  const clicked = statsObj?.clicked || 0;
  const openRate = statsObj?.openRate || 0;
  const clickRate = statsObj?.clickRate || 0;
  const emailCount = (sequenceAny.emails as unknown[])?.length || (sequenceAny.emailIds as string[])?.length || 0;
  const isActive = sequenceAny.status === "active" || sequenceAny.isActive === true;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDelay = (ms: number) => {
    if (ms === 0) return "Immediately";
    const days = ms / (1000 * 60 * 60 * 24);
    if (days === 1) return "1 day";
    if (days < 1) return `${Math.floor(ms / (1000 * 60 * 60))} hours`;
    return `${Math.floor(days)} days`;
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "text-green-400",
      completed: "text-cyan-400",
      paused: "text-yellow-400",
    };
    return colors[status] || "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{sequence.name}</h1>
            <p className="text-muted-foreground mt-1">{sequence.description || "No description"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className={
              isActive
                ? "border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                : "border-green-500 text-green-400 hover:bg-green-500/10"
            }
          >
            {isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            )}
          </Button>
          <Button variant="outline" className="border-border text-white">
            <Copy className="h-4 w-4 mr-2" />
            Clone
          </Button>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading sequence details...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load sequence</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching sequence details"}
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
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
              <p className="text-2xl font-bold text-white mt-1">
                {subscribers.toLocaleString()}
              </p>
              <p className="text-xs text-cyan-400 mt-1">
                {enrolledLeads.filter((l) => l.status === "active").length} active
              </p>
            </div>
            <Users className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold text-white mt-1">
                {conversions.toLocaleString()}
              </p>
              <p className="text-xs text-green-400 mt-1">
                {conversionRate.toFixed(1)}% rate
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Emails in Sequence</p>
              <p className="text-2xl font-bold text-white mt-1">
                {emailCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">total emails</p>
            </div>
            <Mail className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Open Rate</p>
              <p className="text-2xl font-bold text-white mt-1">
                {emails.length > 0
                  ? (
                      emails.reduce((sum, e) => sum + e.openRate, 0) / emails.length
                    ).toFixed(1)
                  : "0.0"}
                %
              </p>
              <p className="text-xs text-muted-foreground mt-1">across all emails</p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="bg-card-secondary">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emails">Email Sequence</TabsTrigger>
          <TabsTrigger value="enrollments">Enrolled Leads</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sequence Details */}
            <div className="card-secondary p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Sequence Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  {sequence.isTemplate ? (
                    <span className="text-sm mt-1 inline-block px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      Template
                    </span>
                  ) : (
                    <span className="text-sm mt-1 inline-block px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Custom
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trigger Type</p>
                  <span
                    className={`text-sm mt-1 inline-block px-2 py-1 rounded text-white ${getTriggerColor(
                      sequence.triggerType || "immediate"
                    )}`}
                  >
                    {getTriggerLabel(sequence.triggerType || "immediate")}
                  </span>
                </div>
                {(sequence.triggerDelay ?? 0) > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Trigger Delay</p>
                    <p className="text-white mt-1">{formatDelay(sequence.triggerDelay ?? 0)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {sequence.isActive ? (
                    <span className="text-sm mt-1 inline-block px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      Active
                    </span>
                  ) : (
                    <span className="text-sm mt-1 inline-block px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      Inactive
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-white mt-1">{formatDate(sequence.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="card-secondary p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Enrollment Rate</span>
                    <span className="text-white font-medium">
                      {subscribers > 0 ? "100%" : "0%"}
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full"
                      style={{
                        width: subscribers > 0 ? "100%" : "0%",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <span className="text-white font-medium">
                      {conversionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(conversionRate, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Active Leads</span>
                    <span className="text-white font-medium">
                      {enrolledLeads.filter((l) => l.status === "active").length} /{" "}
                      {enrolledLeads.length}
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${
                          enrolledLeads.length > 0
                            ? (enrolledLeads.filter((l) => l.status === "active").length /
                                enrolledLeads.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Avg Email Performance</span>
                    <span className="text-white font-medium">
                      {emails.length > 0
                        ? (
                            emails.reduce((sum, e) => sum + e.openRate, 0) / emails.length
                          ).toFixed(1)
                        : "0.0"}
                      % open
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${
                          emails.length > 0
                            ? emails.reduce((sum, e) => sum + e.openRate, 0) / emails.length
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Email Sequence Tab */}
        <TabsContent value="emails" className="space-y-4">
          <div className="card-secondary p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Email Sequence Flow</h3>
            <div className="space-y-4">
              {emails.map((email, index) => (
                <div key={email.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-medium text-sm">
                      {email.position}
                    </div>
                    {index < emails.length - 1 && (
                      <div className="w-0.5 h-16 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 card-tertiary p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{email.name}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDelay(email.delay)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{email.subject}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Open Rate: </span>
                        <span className="text-cyan-400 font-medium">
                          {email.openRate.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Click Rate: </span>
                        <span className="text-purple-400 font-medium">
                          {email.clickRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Enrolled Leads Tab */}
        <TabsContent value="enrollments" className="space-y-4">
          <div className="card-secondary overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                      Lead Name
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                      Current Step
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                      Enrolled
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrolledLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-white">{lead.name}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {lead.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        Email {lead.currentStep} of {emailCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-background rounded-full h-2">
                            <div
                              className="bg-cyan-500 h-2 rounded-full"
                              style={{
                                width: `${(lead.currentStep / emailCount) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round((lead.currentStep / emailCount) * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(lead.enrolledAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {enrolledLeads.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No leads enrolled in this sequence yet.</p>
              </div>
            )}

            {enrolledLeads.length > 0 && (
              <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
                Showing {enrolledLeads.length} enrolled leads
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}
