"use client";

import Link from "next/link";
import { Zap, TrendingUp, FileText, AlertCircle } from "lucide-react";
import { useMarketingOverview } from "@/hooks/useMarketing";

export default function MarketingPage() {
  // API data with fallback
  const { overview, isLoading, isError, error } = useMarketingOverview();

  const modules = [
    { title: "Campaigns", icon: Zap, href: "/admin/marketing/campaigns" },
    { title: "Automation", icon: TrendingUp, href: "/admin/marketing/automation" },
    { title: "Email Lists", icon: FileText, href: "/admin/marketing/email-management" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing</h1>
        <p className="text-muted-foreground mt-1">Manage campaigns and automation</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading marketing overview...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load marketing overview</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching marketing data"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading and no error */}
      {!isLoading && !isError && (
        <>
          {/* Stats Cards */}
          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card-secondary p-4">
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold text-white mt-1">{overview.totalCampaigns || 0}</p>
              </div>
              <div className="card-secondary p-4">
                <p className="text-sm text-muted-foreground">Active Sequences</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{overview.activeSequences || 0}</p>
              </div>
              <div className="card-secondary p-4">
                <p className="text-sm text-muted-foreground">Email Lists</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">{overview.emailLists || 0}</p>
              </div>
              <div className="card-secondary p-4">
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{(overview.totalSubscribers || 0).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Module Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modules.map(m => (
              <Link key={m.href} href={m.href}>
                <div className="card-secondary p-6 cursor-pointer hover:ring-2 hover:ring-red-500/30 transition-all">
                  <m.icon className="h-8 w-8 text-red-400 mb-3" />
                  <h3 className="text-lg font-semibold">{m.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
