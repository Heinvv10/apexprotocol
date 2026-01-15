"use client";

import React, { useState, use } from "react";
import { ArrowLeft, Building2, Globe, MapPin, Users, DollarSign, TrendingUp, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Mock accounts data (same as list page)
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
    description: "Leading provider of cloud-based SaaS solutions for enterprise customers.",
    employees: 350,
    founded: 2018,
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
    description: "Full-service marketing agency specializing in digital transformation.",
    employees: 150,
    founded: 2015,
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
    description: "Salesforce implementation and consulting services.",
    employees: 75,
    founded: 2020,
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
    description: "Strategic management consulting for Fortune 500 companies.",
    employees: 420,
    founded: 2012,
  },
];

// Mock contacts for each account
const mockContacts: Record<string, any[]> = {
  acc_001: [
    {
      id: "lead_001",
      name: "John Doe",
      title: "VP of Marketing",
      email: "john.doe@techcorp.com",
      phone: "+1 (555) 123-4567",
      status: "mql" as const,
      leadScore: 75,
    },
    {
      id: "lead_005",
      name: "Alice Cooper",
      title: "CTO",
      email: "alice.c@techcorp.com",
      phone: "+1 (555) 123-4568",
      status: "sql" as const,
      leadScore: 82,
    },
    {
      id: "lead_006",
      name: "Bob Smith",
      title: "Product Manager",
      email: "bob.s@techcorp.com",
      phone: "+1 (555) 123-4569",
      status: "new" as const,
      leadScore: 35,
    },
  ],
  acc_002: [
    {
      id: "lead_002",
      name: "Jane Smith",
      title: "Marketing Director",
      email: "jane.smith@marketinginc.com",
      phone: "+1 (555) 987-6543",
      status: "sql" as const,
      leadScore: 92,
    },
    {
      id: "lead_007",
      name: "Carol White",
      title: "Creative Director",
      email: "carol.w@marketinginc.com",
      phone: "+1 (555) 987-6544",
      status: "mql" as const,
      leadScore: 68,
    },
  ],
  acc_003: [
    {
      id: "lead_003",
      name: "Robert Johnson",
      title: "Lead Consultant",
      email: "robert.j@salesforcepartners.com",
      phone: "+1 (555) 555-1234",
      status: "new" as const,
      leadScore: 32,
    },
  ],
  acc_004: [
    {
      id: "lead_004",
      name: "Sarah Williams",
      title: "Chief Strategy Officer",
      email: "sarah.w@consulting.co",
      phone: "+1 (555) 234-5678",
      status: "proposal" as const,
      leadScore: 88,
    },
    {
      id: "lead_008",
      name: "David Brown",
      title: "Managing Director",
      email: "david.b@consulting.co",
      phone: "+1 (555) 234-5679",
      status: "sql" as const,
      leadScore: 85,
    },
    {
      id: "lead_009",
      name: "Emma Davis",
      title: "Senior Consultant",
      email: "emma.d@consulting.co",
      phone: "+1 (555) 234-5680",
      status: "mql" as const,
      leadScore: 72,
    },
    {
      id: "lead_010",
      name: "Frank Miller",
      title: "Business Analyst",
      email: "frank.m@consulting.co",
      phone: "+1 (555) 234-5681",
      status: "new" as const,
      leadScore: 45,
    },
  ],
};

// Mock deals for each account
const mockDeals: Record<string, any[]> = {
  acc_001: [
    {
      id: "deal_001",
      name: "Q1 2026 Enterprise License",
      value: 75000,
      stage: "proposal" as const,
      probability: 65,
      expectedClose: "2026-03-31",
      owner: "Sarah Johnson",
    },
    {
      id: "deal_002",
      name: "Additional Seats",
      value: 50000,
      stage: "negotiation" as const,
      probability: 80,
      expectedClose: "2026-02-28",
      owner: "Mike Chen",
    },
  ],
  acc_002: [
    {
      id: "deal_003",
      name: "Marketing Automation Setup",
      value: 75000,
      stage: "proposal" as const,
      probability: 70,
      expectedClose: "2026-02-15",
      owner: "Sarah Johnson",
    },
  ],
  acc_003: [],
  acc_004: [
    {
      id: "deal_004",
      name: "Strategic Consulting Package",
      value: 150000,
      stage: "negotiation" as const,
      probability: 85,
      expectedClose: "2026-01-31",
      owner: "Sarah Johnson",
    },
    {
      id: "deal_005",
      name: "Training Program",
      value: 50000,
      stage: "proposal" as const,
      probability: 60,
      expectedClose: "2026-03-15",
      owner: "Mike Chen",
    },
    {
      id: "deal_006",
      name: "Implementation Services",
      value: 50000,
      stage: "qualification" as const,
      probability: 40,
      expectedClose: "2026-04-30",
      owner: "Sarah Johnson",
    },
  ],
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "new":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "mql":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "sql":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    case "proposal":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "negotiation":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "closed-won":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "qualification":
      return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const getHealthScoreColor = (score: number) => {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
};

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "contacts" | "deals">("overview");

  // Unwrap async params
  const { id } = use(params);

  // Find account by ID
  const account = mockAccounts.find((acc) => acc.id === id) || mockAccounts[0];
  const contacts = mockContacts[id] || [];
  const deals = mockDeals[id] || [];

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

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
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
            <h1 className="text-3xl font-bold text-white">{account.name}</h1>
            <p className="text-muted-foreground mt-1">{account.industry}</p>
          </div>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
          Edit Account
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-secondary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                  <p className={`text-2xl font-bold mt-1 ${getHealthScoreColor(account.healthScore)}`}>
                    {account.healthScore}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-cyan-400" />
              </div>
            </div>

            <div className="card-secondary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Contacts</p>
                  <p className="text-2xl font-bold text-white mt-1">{account.totalContacts}</p>
                </div>
                <Users className="h-6 w-6 text-purple-400" />
              </div>
            </div>

            <div className="card-secondary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatCurrency(account.totalRevenue)}</p>
                </div>
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card-secondary">
            <div className="border-b border-border px-4">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-3 border-b-2 transition-colors ${
                    activeTab === "overview"
                      ? "border-cyan-500 text-cyan-400"
                      : "border-transparent text-muted-foreground hover:text-white"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("contacts")}
                  className={`py-3 border-b-2 transition-colors ${
                    activeTab === "contacts"
                      ? "border-cyan-500 text-cyan-400"
                      : "border-transparent text-muted-foreground hover:text-white"
                  }`}
                >
                  Contacts ({contacts.length})
                </button>
                <button
                  onClick={() => setActiveTab("deals")}
                  className={`py-3 border-b-2 transition-colors ${
                    activeTab === "deals"
                      ? "border-cyan-500 text-cyan-400"
                      : "border-transparent text-muted-foreground hover:text-white"
                  }`}
                >
                  Active Deals ({deals.length})
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Industry</p>
                        <p className="text-white mt-1">{account.industry}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company Size</p>
                        <p className="text-white mt-1">{account.size} employees</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="text-white mt-1">{account.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Website</p>
                        <a
                          href={`https://${account.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 mt-1 inline-block"
                        >
                          {account.website}
                        </a>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Founded</p>
                        <p className="text-white mt-1">{account.founded}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Employees</p>
                        <p className="text-white mt-1">{account.employees}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-muted-foreground">{account.description}</p>
                  </div>
                </div>
              )}

              {activeTab === "contacts" && (
                <div className="space-y-4">
                  {contacts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No contacts found</p>
                  ) : (
                    contacts.map((contact) => (
                      <div key={contact.id} className="card-tertiary p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link
                              href={`/admin/crm/leads/${contact.id}`}
                              className="text-white font-medium hover:text-cyan-400"
                            >
                              {contact.name}
                            </Link>
                            <p className="text-sm text-muted-foreground mt-1">{contact.title}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                              >
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </a>
                              <a
                                href={`tel:${contact.phone}`}
                                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </a>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeColor(
                                contact.status
                              )}`}
                            >
                              {contact.status.toUpperCase()}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Score: <span className="text-white font-medium">{contact.leadScore}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "deals" && (
                <div className="space-y-4">
                  {deals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No active deals</p>
                  ) : (
                    deals.map((deal) => (
                      <div key={deal.id} className="card-tertiary p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{deal.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">Owner: {deal.owner}</p>
                            <p className="text-sm text-muted-foreground">
                              Expected Close: {formatDate(deal.expectedClose)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <p className="text-lg font-bold text-white">{formatCurrency(deal.value)}</p>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeColor(
                                deal.stage
                              )}`}
                            >
                              {deal.stage.toUpperCase()}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {deal.probability}% probability
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card-secondary p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Deals</span>
                <span className="text-white font-medium">{account.activeDeals}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deal Value</span>
                <span className="text-white font-medium">
                  {formatCurrency(deals.reduce((sum, deal) => sum + deal.value, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Activity</span>
                <span className="text-white font-medium">{formatDate(account.lastActivity)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-white font-medium">{formatDate(account.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Top Contacts */}
          <div className="card-secondary p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Key Contacts</h3>
            <div className="space-y-3">
              {contacts.slice(0, 3).map((contact) => (
                <Link
                  key={contact.id}
                  href={`/admin/crm/leads/${contact.id}`}
                  className="block hover:bg-background/50 p-2 rounded transition-colors"
                >
                  <p className="text-white font-medium">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.title}</p>
                </Link>
              ))}
              {contacts.length > 3 && (
                <button
                  onClick={() => setActiveTab("contacts")}
                  className="text-sm text-cyan-400 hover:text-cyan-300 w-full text-left"
                >
                  View all {contacts.length} contacts →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
