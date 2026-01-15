"use client";

import React, { useState } from "react";
import { TrendingUp, DollarSign, Clock, Target, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

// Mock pipeline stages
const stages = [
  { id: "lead", name: "Lead", color: "bg-gray-500" },
  { id: "qualified", name: "Qualified", color: "bg-blue-500" },
  { id: "proposal", name: "Proposal", color: "bg-purple-500" },
  { id: "negotiation", name: "Negotiation", color: "bg-yellow-500" },
  { id: "won", name: "Won", color: "bg-green-500" },
  { id: "lost", name: "Lost", color: "bg-red-500" },
];

// Mock deals data
const mockDeals = [
  {
    id: "deal_001",
    name: "Q1 2026 Enterprise License",
    accountId: "acc_001",
    accountName: "TechCorp",
    value: 75000,
    stage: "proposal",
    probability: 65,
    expectedClose: new Date("2026-03-31").toISOString(),
    owner: "Sarah Williams",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "deal_002",
    name: "Additional Seats",
    accountId: "acc_001",
    accountName: "TechCorp",
    value: 50000,
    stage: "negotiation",
    probability: 80,
    expectedClose: new Date("2026-02-28").toISOString(),
    owner: "John Doe",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "deal_003",
    name: "Marketing Automation Package",
    accountId: "acc_002",
    accountName: "Marketing Inc",
    value: 75000,
    stage: "negotiation",
    probability: 75,
    expectedClose: new Date("2026-02-15").toISOString(),
    owner: "Alice Cooper",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "deal_004",
    name: "Consulting Services",
    accountId: "acc_004",
    accountName: "Consulting Group",
    value: 100000,
    stage: "proposal",
    probability: 60,
    expectedClose: new Date("2026-03-15").toISOString(),
    owner: "Bob Smith",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "deal_005",
    name: "Enterprise Support",
    accountId: "acc_004",
    accountName: "Consulting Group",
    value: 50000,
    stage: "won",
    probability: 100,
    expectedClose: new Date("2026-01-10").toISOString(),
    owner: "Sarah Williams",
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "deal_006",
    name: "Training Package",
    accountId: "acc_004",
    accountName: "Consulting Group",
    value: 100000,
    stage: "won",
    probability: 100,
    expectedClose: new Date("2025-12-20").toISOString(),
    owner: "John Doe",
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "deal_007",
    name: "Starter Package",
    accountId: "acc_003",
    accountName: "SalesForce Partners",
    value: 25000,
    stage: "qualified",
    probability: 40,
    expectedClose: new Date("2026-04-30").toISOString(),
    owner: "Alice Cooper",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "deal_008",
    name: "Initial Consultation",
    accountId: "acc_003",
    accountName: "SalesForce Partners",
    value: 10000,
    stage: "lost",
    probability: 0,
    expectedClose: new Date("2025-12-31").toISOString(),
    owner: "Bob Smith",
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function PipelinePage() {
  const [timeFilter, setTimeFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");

  // Filter deals based on filters
  const filteredDeals = mockDeals.filter((deal) => {
    const matchesOwner = ownerFilter === "all" || deal.owner === ownerFilter;

    if (timeFilter === "all") return matchesOwner;

    const now = Date.now();
    const createdAt = new Date(deal.createdAt).getTime();
    const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);

    if (timeFilter === "30days") return matchesOwner && daysDiff <= 30;
    if (timeFilter === "60days") return matchesOwner && daysDiff <= 60;
    if (timeFilter === "90days") return matchesOwner && daysDiff <= 90;

    return matchesOwner;
  });

  // Group deals by stage
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter((deal) => deal.stage === stage.id);
    return acc;
  }, {} as Record<string, typeof mockDeals>);

  // Calculate stats
  const totalDeals = filteredDeals.length;
  const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weightedValue = filteredDeals.reduce(
    (sum, deal) => sum + (deal.value * deal.probability) / 100,
    0
  );
  const wonDeals = dealsByStage.won || [];
  const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
  const winRate =
    totalDeals > 0
      ? (wonDeals.length / (wonDeals.length + (dealsByStage.lost?.length || 0))) * 100
      : 0;

  // Calculate conversion rates
  const conversionRates: Record<string, number> = {};
  for (let i = 0; i < stages.length - 2; i++) {
    const currentStage = stages[i];
    const nextStage = stages[i + 1];
    const currentCount = dealsByStage[currentStage.id]?.length || 0;
    const nextCount = dealsByStage[nextStage.id]?.length || 0;
    const totalInCurrent = currentCount + nextCount;
    conversionRates[currentStage.id] =
      totalInCurrent > 0 ? (nextCount / totalInCurrent) * 100 : 0;
  }

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

  const getDaysInStage = (createdAt: string) => {
    const now = Date.now();
    const created = new Date(createdAt).getTime();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  };

  const owners = Array.from(new Set(mockDeals.map((d) => d.owner)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Sales Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Visualize and track deals through your sales process
          </p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
          + New Deal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Weighted Value</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(weightedValue)}
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Deal Size</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(avgDealSize)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold text-white mt-1">
                {winRate.toFixed(0)}%
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-secondary p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-background border-border">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="60days">Last 60 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-background border-border">
              <SelectValue placeholder="Deal Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {owners.map((owner) => (
                <SelectItem key={owner} value={owner}>
                  {owner}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="card-secondary p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Pipeline Stages</h2>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.filter((s) => s.id !== "lost").map((stage, index) => {
            const deals = dealsByStage[stage.id] || [];
            const stageValue = deals.reduce((sum, deal) => sum + deal.value, 0);
            const conversionRate = conversionRates[stage.id];

            return (
              <React.Fragment key={stage.id}>
                <div className="flex-shrink-0 w-64">
                  <div className="card-tertiary p-4 min-h-[400px]">
                    {/* Stage Header */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                        <h3 className="text-lg font-semibold text-white">
                          {stage.name}
                        </h3>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {deals.length} {deals.length === 1 ? "deal" : "deals"} •{" "}
                        {formatCurrency(stageValue)}
                      </div>
                    </div>

                    {/* Deals */}
                    <div className="space-y-3">
                      {deals.map((deal) => (
                        <Link
                          key={deal.id}
                          href={`/admin/crm/accounts/${deal.accountId}`}
                          className="block p-3 bg-background hover:bg-background/80 rounded-lg border border-border transition-colors"
                        >
                          <div className="font-medium text-white text-sm mb-1">
                            {deal.name}
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {deal.accountName}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-cyan-400 font-medium">
                              {formatCurrency(deal.value)}
                            </span>
                            <span className="text-muted-foreground">
                              {deal.probability}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {getDaysInStage(deal.createdAt)}d in stage
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  {conversionRate !== undefined && (
                    <div className="mt-2 text-center text-sm text-muted-foreground">
                      {conversionRate.toFixed(0)}% conversion
                    </div>
                  )}
                </div>

                {/* Arrow between stages */}
                {index < stages.length - 2 && (
                  <div className="flex items-center justify-center pt-20">
                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Lost Deals Section */}
      {dealsByStage.lost && dealsByStage.lost.length > 0 && (
        <div className="card-secondary p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Lost Deals</h2>
          <div className="space-y-3">
            {dealsByStage.lost.map((deal) => (
              <div
                key={deal.id}
                className="p-4 bg-background rounded-lg border border-border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{deal.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {deal.accountName} • {formatCurrency(deal.value)}
                    </div>
                  </div>
                  <div className="text-sm text-red-400">Lost</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
