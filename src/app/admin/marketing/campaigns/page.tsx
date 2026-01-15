"use client";

import React, { useState } from "react";
import { Search, TrendingUp, DollarSign, Target, Users, Play, Pause, Archive, Copy } from "lucide-react";
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

// Mock campaigns data based on marketing.ts schema
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
  {
    id: "camp_004",
    name: "Content Hub Launch",
    description: "Launch of resource center landing page",
    type: "landing_page",
    status: "active",
    budget: 12000,
    leads: 840,
    opens: 0,
    clicks: 2140,
    conversions: 156,
    revenue: 32800,
    startDate: new Date("2025-12-01").toISOString(),
    endDate: new Date("2026-01-31").toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "camp_005",
    name: "Holiday Email Series",
    description: "End of year promotional email campaign",
    type: "email",
    status: "completed",
    budget: 6000,
    leads: 2100,
    opens: 5820,
    clicks: 1240,
    conversions: 310,
    revenue: 78500,
    startDate: new Date("2025-11-20").toISOString(),
    endDate: new Date("2025-12-31").toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "camp_006",
    name: "Customer Retargeting",
    description: "Re-engagement campaign for inactive users",
    type: "retargeting",
    status: "paused",
    budget: 4500,
    leads: 320,
    opens: 1120,
    clicks: 267,
    conversions: 45,
    revenue: 8900,
    startDate: new Date("2026-01-05").toISOString(),
    endDate: new Date("2026-02-05").toISOString(),
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

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

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter campaigns based on search and filters
  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    const matchesSearch =
      searchQuery === "" ||
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || campaign.type === typeFilter;
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate stats
  const totalCampaigns = mockCampaigns.length;
  const activeCampaigns = mockCampaigns.filter((c) => c.status === "active").length;
  const totalLeads = mockCampaigns.reduce((sum, c) => sum + c.leads, 0);
  const totalRevenue = mockCampaigns.reduce((sum, c) => sum + c.revenue, 0);
  const totalBudget = mockCampaigns.reduce((sum, c) => sum + c.budget, 0);
  const avgROI = totalBudget > 0 ? ((totalRevenue - totalBudget) / totalBudget) * 100 : 0;
  const avgConversionRate =
    filteredCampaigns.length > 0
      ? (filteredCampaigns.reduce((sum, c) => sum + (c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0), 0) /
          filteredCampaigns.length)
      : 0;

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

  const getStatusColor = (status: keyof typeof campaignStatuses) => {
    return campaignStatuses[status].color;
  };

  const getTypeColor = (type: keyof typeof campaignTypes) => {
    return campaignTypes[type].color;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage marketing campaigns across all channels
          </p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
          + New Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold text-white mt-1">
                {totalCampaigns}
              </p>
              <p className="text-xs text-cyan-400 mt-1">
                {activeCampaigns} active
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold text-white mt-1">
                {totalLeads.toLocaleString()}
              </p>
              <p className="text-xs text-purple-400 mt-1">
                {(totalLeads / totalCampaigns).toFixed(0)} avg per campaign
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-xs text-green-400 mt-1">
                {avgROI.toFixed(0)}% ROI
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Conversion</p>
              <p className="text-2xl font-bold text-white mt-1">
                {avgConversionRate.toFixed(1)}%
              </p>
              <p className="text-xs text-yellow-400 mt-1">
                across all campaigns
              </p>
            </div>
            <Target className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-secondary p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-10 bg-background border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-background border-border">
              <SelectValue placeholder="Campaign Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="webinar">Webinar</SelectItem>
              <SelectItem value="landing_page">Landing Page</SelectItem>
              <SelectItem value="retargeting">Retargeting</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-background border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="card-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Campaign Name
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Leads
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Conversions
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Revenue
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  ROI
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Duration
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCampaigns.map((campaign) => {
                const roi = campaign.budget > 0 ? ((campaign.revenue - campaign.budget) / campaign.budget) * 100 : 0;
                const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0;

                return (
                  <tr
                    key={campaign.id}
                    className="hover:bg-background/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/marketing/campaigns/${campaign.id}`}
                        className="font-medium text-white hover:text-cyan-400 cursor-pointer"
                      >
                        {campaign.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {campaign.description}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${getTypeColor(campaign.type as keyof typeof campaignTypes)} bg-opacity-10`}>
                        <div className={`w-2 h-2 rounded-full ${getTypeColor(campaign.type as keyof typeof campaignTypes)}`} />
                        {campaignTypes[campaign.type as keyof typeof campaignTypes].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${getStatusColor(campaign.status as keyof typeof campaignStatuses)}`}>
                        {campaignStatuses[campaign.status as keyof typeof campaignStatuses].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {campaign.leads.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {campaign.conversions}
                      <div className="text-xs text-muted-foreground">
                        {conversionRate.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {formatCurrency(campaign.revenue)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(campaign.startDate)}
                      <div className="text-xs">
                        to {formatDate(campaign.endDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {campaign.status === "active" && (
                          <button className="text-yellow-400 hover:text-yellow-300">
                            <Pause className="h-4 w-4" />
                          </button>
                        )}
                        {campaign.status === "paused" && (
                          <button className="text-green-400 hover:text-green-300">
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button className="text-cyan-400 hover:text-cyan-300">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-300">
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No campaigns found matching your filters.
            </p>
          </div>
        )}

        {filteredCampaigns.length > 0 && (
          <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
            Showing {filteredCampaigns.length} of {totalCampaigns} campaigns
          </div>
        )}
      </div>
    </div>
  );
}
