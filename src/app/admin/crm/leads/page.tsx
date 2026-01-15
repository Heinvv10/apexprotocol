"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, Plus, Trash2, Download, MoreHorizontal, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLeads } from "@/hooks/useCRM";

// Mock data - will be replaced with API call
const mockLeads = [
  {
    id: "lead_001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@techcorp.com",
    company: "TechCorp",
    phone: "+1 (555) 123-4567",
    source: "website" as const,
    status: "mql" as const,
    leadScore: 75,
    mqlScore: 82,
    sqlScore: 45,
    emailOpens: 3,
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_002",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@marketinginc.com",
    company: "Marketing Inc",
    phone: "+1 (555) 987-6543",
    source: "referral" as const,
    status: "sql" as const,
    leadScore: 92,
    mqlScore: 95,
    sqlScore: 88,
    emailOpens: 7,
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_003",
    firstName: "Robert",
    lastName: "Johnson",
    email: "robert.j@salesforce.com",
    company: "SalesForce Partners",
    phone: "+1 (555) 456-7890",
    source: "email" as const,
    status: "new" as const,
    leadScore: 32,
    mqlScore: 25,
    sqlScore: 15,
    emailOpens: 1,
    lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_004",
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.w@consulting.co",
    company: "Consulting Group",
    phone: "+1 (555) 234-5678",
    source: "webinar" as const,
    status: "proposal" as const,
    leadScore: 88,
    mqlScore: 92,
    sqlScore: 85,
    emailOpens: 12,
    lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

const statusLabels = {
  new: "New",
  mql: "MQL",
  sql: "SQL",
  proposal: "Proposal",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost",
};

const statusColors = {
  new: "bg-blue-500/20 text-blue-400",
  mql: "bg-purple-500/20 text-purple-400",
  sql: "bg-cyan-500/20 text-cyan-400",
  proposal: "bg-amber-500/20 text-amber-400",
  "closed-won": "bg-green-500/20 text-green-400",
  "closed-lost": "bg-red-500/20 text-red-400",
};

const sourceLabels = {
  website: "Website",
  email: "Email",
  referral: "Referral",
  webinar: "Webinar",
  advertising: "Advertising",
  "cold-outreach": "Cold Outreach",
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getScorePercentage(score: number) {
  const normalized = Math.min(100, Math.max(0, score));
  return normalized;
}

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"name" | "score" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch leads from API
  const { leads, isLoading, isError, error } = useLeads();

  // Use API data if available, fallback to mock data for development
  const allLeads = leads.length > 0 ? leads : mockLeads;

  // Filter and search logic
  const filteredLeads = useMemo(() => {
    let filtered = allLeads.filter((lead: any) => {
      const matchesSearch =
        searchTerm === "" ||
        lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || lead.status === statusFilter;
      const matchesSource = !sourceFilter || lead.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === "name") {
        compareValue = `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        );
      } else if (sortBy === "score") {
        compareValue = a.leadScore - b.leadScore;
      } else {
        const dateA = new Date(a.lastActivity).getTime();
        const dateB = new Date(b.lastActivity).getTime();
        compareValue = dateA - dateB;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [allLeads, searchTerm, statusFilter, sourceFilter, sortBy, sortOrder]);

  const stats = {
    total: allLeads.length,
    new: allLeads.filter((l: any) => l.status === "new").length,
    mql: allLeads.filter((l: any) => l.status === "mql").length,
    sql: allLeads.filter((l: any) => l.status === "sql").length,
  };

  const toggleLeadSelection = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">Manage your sales leads and track pipeline progress</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600">
          <Plus className="h-4 w-4 mr-2" />
          New Lead
        </Button>
      </div>

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load leads</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching leads"}
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
            <p className="ml-3 text-muted-foreground">Loading leads...</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="card-secondary p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10"
            />
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-white/20 whitespace-nowrap">
                <ChevronDown className="h-4 w-4 mr-2" />
                Status {statusFilter && `(${statusFilter})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                All Statuses
              </DropdownMenuItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={statusFilter === value ? "bg-white/10" : ""}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Source Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-white/20 whitespace-nowrap">
                <ChevronDown className="h-4 w-4 mr-2" />
                Source {sourceFilter && `(${sourceFilter})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSourceFilter(null)}>
                All Sources
              </DropdownMenuItem>
              {Object.entries(sourceLabels).map(([value, label]) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setSourceFilter(value)}
                  className={sourceFilter === value ? "bg-white/10" : ""}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {(searchTerm || statusFilter || sourceFilter) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter(null);
                setSourceFilter(null);
              }}
              className="text-muted-foreground hover:text-white"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-tertiary p-4">
          <div className="text-muted-foreground text-sm">Total</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="card-tertiary p-4">
          <div className="text-muted-foreground text-sm">New</div>
          <div className="text-2xl font-bold mt-1">{stats.new}</div>
        </div>
        <div className="card-tertiary p-4">
          <div className="text-muted-foreground text-sm">MQL</div>
          <div className="text-2xl font-bold mt-1">{stats.mql}</div>
        </div>
        <div className="card-tertiary p-4">
          <div className="text-muted-foreground text-sm">SQL</div>
          <div className="text-2xl font-bold mt-1">{stats.sql}</div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded border-white/20"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-white"
                  onClick={() => {
                    setSortBy("name");
                    setSortOrder(sortBy === "name" && sortOrder === "asc" ? "desc" : "asc");
                  }}
                >
                  Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Company</th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-white"
                  onClick={() => {
                    setSortBy("score");
                    setSortOrder(sortBy === "score" && sortOrder === "asc" ? "desc" : "asc");
                  }}
                >
                  Score {sortBy === "score" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Source</th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-white"
                  onClick={() => {
                    setSortBy("date");
                    setSortOrder(sortBy === "date" && sortOrder === "asc" ? "desc" : "asc");
                  }}
                >
                  Last Activity {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="text-muted-foreground">No leads found</div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        className="rounded border-white/20"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/admin/crm/leads/${lead.id}`} className="hover:text-cyan-400 cursor-pointer">
                        {lead.firstName} {lead.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{lead.email}</td>
                    <td className="px-4 py-3 text-sm">{lead.company}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-12 h-2 bg-white/10 rounded-full overflow-hidden"
                          title={`Lead: ${lead.leadScore}, MQL: ${lead.mqlScore}, SQL: ${lead.sqlScore}`}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                            style={{
                              width: `${getScorePercentage(lead.leadScore)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{lead.leadScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[lead.status]}`}>
                        {statusLabels[lead.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{sourceLabels[lead.source] || lead.source}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(lead.lastActivity)}</td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Assign to...</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/2.5">
          <div className="text-sm text-muted-foreground">
            {selectedLeads.size > 0 && `${selectedLeads.size} selected`}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {filteredLeads.length} of {mockLeads.length} leads
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
