"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Users, DollarSign, TrendingUp, Target, Calendar, Play, Pause, Archive, Copy, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock campaign data matching the campaigns list
const mockCampaigns = [
  {
    id: "camp_001",
    name: "Q1 2026 Product Launch",
    description: "Launch campaign for new AI features",
    type: "email",
    status: "active",
    budget: 15000,
    leads: 1250,
    opens: 3420,
    clicks: 856,
    conversions: 127,
    revenue: 45600,
    startDate: new Date("2026-01-01").toISOString(),
    endDate: new Date("2026-03-31").toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      subjects: ["Introducing AI-Powered Features", "Transform Your Workflow with AI"],
      abTest: true,
      winner: "A",
    },
  },
  {
    id: "camp_002",
    name: "LinkedIn Lead Gen",
    description: "B2B lead generation via LinkedIn ads",
    type: "social",
    status: "active",
    budget: 8000,
    leads: 420,
    opens: 0,
    clicks: 1280,
    conversions: 52,
    revenue: 18700,
    startDate: new Date("2026-01-10").toISOString(),
    endDate: new Date("2026-02-28").toISOString(),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "camp_003",
    name: "Webinar: GEO Masterclass",
    description: "Educational webinar on GEO best practices",
    type: "webinar",
    status: "scheduled",
    budget: 5000,
    leads: 230,
    opens: 890,
    clicks: 312,
    conversions: 87,
    revenue: 12400,
    startDate: new Date("2026-02-15").toISOString(),
    endDate: new Date("2026-02-15").toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock email performance data
const mockEmailPerformance = {
  camp_001: [
    { date: "Jan 1", sent: 500, opened: 195, clicked: 48, converted: 12 },
    { date: "Jan 8", sent: 500, opened: 210, clicked: 52, converted: 15 },
    { date: "Jan 15", sent: 500, opened: 185, clicked: 45, converted: 10 },
    { date: "Jan 22", sent: 500, opened: 220, clicked: 58, converted: 18 },
  ],
};

// Mock lead sources
const mockLeadSources = {
  camp_001: [
    { source: "Organic Search", count: 420, percentage: 33.6 },
    { source: "Email Campaign", count: 315, percentage: 25.2 },
    { source: "LinkedIn", count: 280, percentage: 22.4 },
    { source: "Referral", count: 155, percentage: 12.4 },
    { source: "Direct", count: 80, percentage: 6.4 },
  ],
};

const campaignTypes = {
  email: { label: "Email", color: "bg-blue-500" },
  social: { label: "Social", color: "bg-purple-500" },
  webinar: { label: "Webinar", color: "bg-green-500" },
  landing_page: { label: "Landing Page", color: "bg-orange-500" },
  retargeting: { label: "Retargeting", color: "bg-pink-500" },
} as const;

const campaignStatuses = {
  draft: { label: "Draft", color: "text-gray-400" },
  scheduled: { label: "Scheduled", color: "text-blue-400" },
  active: { label: "Active", color: "text-green-400" },
  paused: { label: "Paused", color: "text-yellow-400" },
  completed: { label: "Completed", color: "text-cyan-400" },
  archived: { label: "Archived", color: "text-gray-500" },
} as const;

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "performance" | "leads">("overview");

  // Unwrap async params (Next.js 16 pattern)
  const { id } = use(params);

  // Find campaign by ID
  const campaign = mockCampaigns.find((c) => c.id === id) || mockCampaigns[0];
  const emailPerformance = mockEmailPerformance[id as keyof typeof mockEmailPerformance] || [];
  const leadSources = mockLeadSources[id as keyof typeof mockLeadSources] || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const roi = campaign.budget > 0 ? ((campaign.revenue - campaign.budget) / campaign.budget) * 100 : 0;
  const openRate = campaign.leads > 0 ? (campaign.opens / campaign.leads) * 100 : 0;
  const clickRate = campaign.opens > 0 ? (campaign.clicks / campaign.opens) * 100 : 0;
  const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-background/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
            <p className="text-muted-foreground mt-1">{campaign.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === "active" && (
            <Button variant="outline" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button variant="outline" className="border-green-500 text-green-400 hover:bg-green-500/10">
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
            <Copy className="h-4 w-4 mr-2" />
            Clone
          </Button>
          <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold text-white mt-1">
                {campaign.leads.toLocaleString()}
              </p>
              <p className="text-xs text-cyan-400 mt-1">
                {openRate.toFixed(1)}% open rate
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
                {campaign.conversions}
              </p>
              <p className="text-xs text-purple-400 mt-1">
                {conversionRate.toFixed(1)}% conversion rate
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(campaign.revenue)}
              </p>
              <p className="text-xs text-green-400 mt-1">
                {formatCurrency(campaign.budget)} spent
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">ROI</p>
              <p className={`text-2xl font-bold mt-1 ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
              </p>
              <p className="text-xs text-yellow-400 mt-1">
                {clickRate.toFixed(1)}% click rate
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="bg-card-secondary">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="leads">Lead Sources</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Details */}
            <div className="card-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Campaign Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Campaign Type</p>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${campaignTypes[campaign.type as keyof typeof campaignTypes].color} bg-opacity-10 mt-1`}>
                    <div className={`w-2 h-2 rounded-full ${campaignTypes[campaign.type as keyof typeof campaignTypes].color}`} />
                    {campaignTypes[campaign.type as keyof typeof campaignTypes].label}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`text-sm font-medium mt-1 ${campaignStatuses[campaign.status as keyof typeof campaignStatuses].color}`}>
                    {campaignStatuses[campaign.status as keyof typeof campaignStatuses].label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-cyan-400" />
                    <p className="text-sm text-white">
                      {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="text-sm text-white mt-1">{formatCurrency(campaign.budget)}</p>
                </div>
                {campaign.metadata?.subjects && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email Subjects</p>
                    <div className="space-y-1 mt-1">
                      {campaign.metadata.subjects.map((subject, index) => (
                        <p key={index} className="text-sm text-white">
                          {campaign.metadata?.abTest && index === 0 && "(A) "}
                          {campaign.metadata?.abTest && index === 1 && "(B) "}
                          {subject}
                          {campaign.metadata?.winner === "A" && index === 0 && (
                            <span className="ml-2 text-xs text-green-400">✓ Winner</span>
                          )}
                          {campaign.metadata?.winner === "B" && index === 1 && (
                            <span className="ml-2 text-xs text-green-400">✓ Winner</span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Metrics */}
            <div className="card-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Performance Metrics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Emails Sent</p>
                    <p className="text-lg font-semibold text-white mt-1">{campaign.leads.toLocaleString()}</p>
                  </div>
                  <Mail className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Opens</p>
                    <p className="text-lg font-semibold text-white mt-1">
                      {campaign.opens.toLocaleString()}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({openRate.toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                  <div className="text-purple-400">{openRate.toFixed(0)}%</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Clicks</p>
                    <p className="text-lg font-semibold text-white mt-1">
                      {campaign.clicks.toLocaleString()}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({clickRate.toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                  <div className="text-yellow-400">{clickRate.toFixed(0)}%</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-lg font-semibold text-white mt-1">
                      {campaign.conversions}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({conversionRate.toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                  <div className="text-green-400">{conversionRate.toFixed(0)}%</div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-lg font-semibold text-white mt-1">
                      {formatCurrency(campaign.revenue)}
                    </p>
                  </div>
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="card-secondary p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Email Performance Over Time</h2>
            {emailPerformance.length > 0 ? (
              <div className="space-y-3">
                {emailPerformance.map((week, index) => (
                  <div key={index} className="p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-white">{week.date}</p>
                      <p className="text-xs text-muted-foreground">Sent: {week.sent}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Opened</p>
                        <p className="text-lg font-semibold text-cyan-400">{week.opened}</p>
                        <p className="text-xs text-muted-foreground">
                          {((week.opened / week.sent) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Clicked</p>
                        <p className="text-lg font-semibold text-yellow-400">{week.clicked}</p>
                        <p className="text-xs text-muted-foreground">
                          {((week.clicked / week.opened) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Converted</p>
                        <p className="text-lg font-semibold text-green-400">{week.converted}</p>
                        <p className="text-xs text-muted-foreground">
                          {((week.converted / week.clicked) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No performance data available for this campaign.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Lead Sources Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="card-secondary p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Lead Sources</h2>
            {leadSources.length > 0 ? (
              <div className="space-y-3">
                {leadSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{source.source}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500"
                            style={{ width: `${source.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground w-12 text-right">
                          {source.percentage}%
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-semibold text-white">{source.count}</p>
                      <p className="text-xs text-muted-foreground">leads</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No lead source data available for this campaign.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
