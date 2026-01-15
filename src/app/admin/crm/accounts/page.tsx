"use client";

import React, { useState } from "react";
import { Search, Building2, Users, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
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
import { useAccounts } from "@/hooks/useCRM";

// Mock accounts data
const mockAccounts = [
  {
    id: "acc_001",
    name: "TechCorp",
    industry: "SaaS",
    size: "250-500",
    location: "San Francisco, CA",
    website: "www.techcorp.com",
    healthScore: 85,
    totalContacts: 3,
    activeDeals: 2,
    totalRevenue: 125000,
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "acc_002",
    name: "Marketing Inc",
    industry: "Marketing",
    size: "100-250",
    location: "New York, NY",
    website: "www.marketinginc.com",
    healthScore: 92,
    totalContacts: 2,
    activeDeals: 1,
    totalRevenue: 75000,
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "acc_003",
    name: "SalesForce Partners",
    industry: "Consulting",
    size: "50-100",
    location: "Austin, TX",
    website: "www.salesforcepartners.com",
    healthScore: 45,
    totalContacts: 1,
    activeDeals: 0,
    totalRevenue: 0,
    lastActivity: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "acc_004",
    name: "Consulting Group",
    industry: "Management Consulting",
    size: "250-500",
    location: "Chicago, IL",
    website: "www.consultinggroup.com",
    healthScore: 88,
    totalContacts: 4,
    activeDeals: 3,
    totalRevenue: 250000,
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function AccountsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");

  // Fetch accounts from API
  const { accounts, isLoading, isError, error } = useAccounts();

  // Use API data if available, fallback to mock data for development
  const allAccounts = accounts.length > 0 ? accounts : mockAccounts;

  // Filter accounts based on search and filters
  const filteredAccounts = allAccounts.filter((account: any) => {
    const matchesSearch =
      searchQuery === "" ||
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry =
      industryFilter === "all" || account.industry === industryFilter;

    const matchesSize = sizeFilter === "all" || account.size === sizeFilter;

    return matchesSearch && matchesIndustry && matchesSize;
  });

  // Calculate stats
  const totalAccounts = allAccounts.length;
  const totalActiveDeals = allAccounts.reduce(
    (sum: number, acc: any) => sum + (acc.activeDeals || 0),
    0
  );
  const totalRevenue = allAccounts.reduce(
    (sum: number, acc: any) => sum + (acc.totalRevenue || 0),
    0
  );
  const avgHealthScore =
    allAccounts.length > 0
      ? allAccounts.reduce((sum: number, acc: any) => sum + (acc.healthScore || 0), 0) /
        allAccounts.length
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

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage company accounts and track engagement
          </p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
          + New Account
        </Button>
      </div>

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load accounts</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching accounts"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading accounts...</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Accounts</p>
              <p className="text-2xl font-bold text-white mt-1">
                {totalAccounts}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Deals</p>
              <p className="text-2xl font-bold text-white mt-1">
                {totalActiveDeals}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Health Score</p>
              <p className="text-2xl font-bold text-white mt-1">
                {Math.round(avgHealthScore)}
              </p>
            </div>
            <Users className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-secondary p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, location..."
              className="pl-10 bg-background border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-background border-border">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="SaaS">SaaS</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Consulting">Consulting</SelectItem>
              <SelectItem value="Management Consulting">
                Management Consulting
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={sizeFilter} onValueChange={setSizeFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-background border-border">
              <SelectValue placeholder="Company Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              <SelectItem value="50-100">50-100</SelectItem>
              <SelectItem value="100-250">100-250</SelectItem>
              <SelectItem value="250-500">250-500</SelectItem>
              <SelectItem value="500+">500+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="card-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Account Name
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Industry
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Size
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Location
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Contacts
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Active Deals
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Revenue
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Health Score
                </th>
                <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAccounts.map((account) => (
                <tr
                  key={account.id}
                  className="hover:bg-background/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/crm/accounts/${account.id}`}
                      className="font-medium text-white hover:text-cyan-400 cursor-pointer"
                    >
                      {account.name}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {account.website}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {account.industry}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {account.size}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {account.location}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {account.totalContacts}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {account.activeDeals}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {formatCurrency(account.totalRevenue)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-medium ${getHealthScoreColor(
                        account.healthScore
                      )}`}
                    >
                      {account.healthScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(account.lastActivity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No accounts found matching your filters.
            </p>
          </div>
        )}

        {filteredAccounts.length > 0 && (
          <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
            Showing {filteredAccounts.length} of {totalAccounts} accounts
          </div>
        )}
      </div>
    </div>
  );
}
