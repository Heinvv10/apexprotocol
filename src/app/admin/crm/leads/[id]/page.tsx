"use client";

import React, { useState } from "react";
import { ArrowLeft, Mail, Phone, Building2, Zap, Calendar, MapPin, Edit2, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock leads data - will be replaced with API call
const mockLeads = [
  {
    id: "lead_001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@techcorp.com",
    phone: "+1 (555) 123-4567",
    company: "TechCorp",
    title: "VP of Marketing",
    website: "www.techcorp.com",
    industry: "SaaS",
    companySize: "250-500",
    source: "website" as const,
    status: "mql" as const,
    leadScore: 75,
    mqlScore: 82,
    sqlScore: 45,
    tags: ["hot-lead", "decision-maker", "budget-approved"],
    timezone: "EST",
    notes: "Very interested in our platform. Has mentioned budget already allocated for Q1 2026.",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_002",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@marketinginc.com",
    phone: "+1 (555) 987-6543",
    company: "Marketing Inc",
    title: "Marketing Director",
    website: "www.marketinginc.com",
    industry: "Marketing",
    companySize: "100-250",
    source: "referral" as const,
    status: "sql" as const,
    leadScore: 92,
    mqlScore: 95,
    sqlScore: 88,
    tags: ["qualified", "budget-approved"],
    timezone: "CST",
    notes: "Ready to move forward with demo. Wants to schedule next week.",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_003",
    firstName: "Robert",
    lastName: "Johnson",
    email: "robert.j@salesforce.com",
    phone: "+1 (555) 456-7890",
    company: "SalesForce Partners",
    title: "Sales Manager",
    website: "www.salesforcepartners.com",
    industry: "Enterprise Software",
    companySize: "500+",
    source: "email" as const,
    status: "new" as const,
    leadScore: 32,
    mqlScore: 25,
    sqlScore: 15,
    tags: ["new-lead"],
    timezone: "PST",
    notes: "Early stage inquiry. Needs to understand pricing and features.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_004",
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.w@consulting.co",
    phone: "+1 (555) 234-5678",
    company: "Consulting Group",
    title: "Chief Strategy Officer",
    website: "www.consultinggroup.com",
    industry: "Management Consulting",
    companySize: "250-500",
    source: "webinar" as const,
    status: "proposal" as const,
    leadScore: 88,
    mqlScore: 92,
    sqlScore: 85,
    tags: ["hot-lead", "decision-maker", "budget-approved"],
    timezone: "EST",
    notes: "Requested custom proposal. Company is ready to sign in Q1 2026.",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

const mockInteractions = {
  lead_001: [
    {
      id: "int_001",
      type: "email" as const,
      subject: "Re: Demo Request",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Opened email - clicked on demo link",
      opens: 1,
    },
    {
      id: "int_002",
      type: "email" as const,
      subject: "Welcome to our platform",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Opened email - no clicks",
      opens: 3,
    },
    {
      id: "int_003",
      type: "call" as const,
      subject: "Discovery Call",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      description: "30-min call with sales rep",
      opens: 0,
    },
    {
      id: "int_004",
      type: "email" as const,
      subject: "Initial Outreach",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: "First email sent",
      opens: 2,
    },
  ],
  lead_002: [
    {
      id: "int_201",
      type: "call" as const,
      subject: "Product Demo",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      description: "90-minute product demo with stakeholders",
      opens: 0,
    },
    {
      id: "int_202",
      type: "email" as const,
      subject: "Follow-up: Demo Questions",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Answered pricing and integration questions",
      opens: 5,
    },
  ],
  lead_003: [
    {
      id: "int_301",
      type: "email" as const,
      subject: "Cold Outreach",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Initial email sent with product overview",
      opens: 1,
    },
  ],
  lead_004: [
    {
      id: "int_401",
      type: "email" as const,
      subject: "Webinar: AI-Powered Growth",
      date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      description: "Attended webinar, marked as interested",
      opens: 1,
    },
    {
      id: "int_402",
      type: "call" as const,
      subject: "Custom Proposal Discussion",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      description: "60-minute call to discuss custom features and pricing",
      opens: 0,
    },
    {
      id: "int_403",
      type: "email" as const,
      subject: "Proposal Sent",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Custom proposal emailed, awaiting feedback",
      opens: 3,
    },
  ],
};

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

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getInteractionIcon(type: string) {
  switch (type) {
    case "email":
      return <Mail className="h-4 w-4" />;
    case "call":
      return <Phone className="h-4 w-4" />;
    default:
      return <Zap className="h-4 w-4" />;
  }
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "interactions" | "notes">("overview");

  // Find lead by ID, fallback to first lead if not found
  const leadDetail = mockLeads.find((lead) => lead.id === params.id) || mockLeads[0];
  const interactions = mockInteractions[params.id as keyof typeof mockInteractions] || [];

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
            <h1 className="text-3xl font-bold">
              {leadDetail.firstName} {leadDetail.lastName}
            </h1>
            <p className="text-muted-foreground mt-1">{leadDetail.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button className="bg-cyan-500 hover:bg-cyan-600">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Lead
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Change Status</DropdownMenuItem>
              <DropdownMenuItem>Assign to Team Member</DropdownMenuItem>
              <DropdownMenuItem>Add Tags</DropdownMenuItem>
              <DropdownMenuItem className="text-red-400">Delete Lead</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Status and Score Card */}
          <div className="card-secondary p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-muted-foreground text-sm mb-2">Status</div>
                <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${statusColors[leadDetail.status]}`}>
                  {statusLabels[leadDetail.status]}
                </span>
              </div>
              <div>
                <div className="text-muted-foreground text-sm mb-2">Lead Score</div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                      style={{ width: `${leadDetail.leadScore}%` }}
                    />
                  </div>
                  <span className="font-bold text-lg">{leadDetail.leadScore}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              <div>
                <div className="text-muted-foreground text-xs mb-1">MQL Score</div>
                <div className="text-xl font-bold">{leadDetail.mqlScore}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">SQL Score</div>
                <div className="text-xl font-bold">{leadDetail.sqlScore}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Days in Pipeline</div>
                <div className="text-xl font-bold">
                  {Math.floor(
                    (new Date().getTime() - new Date(leadDetail.createdAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="card-secondary p-6 space-y-4">
            <h2 className="text-lg font-semibold">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-cyan-400" />
                <div>
                  <div className="text-muted-foreground text-sm">Email</div>
                  <a href={`mailto:${leadDetail.email}`} className="text-cyan-400 hover:text-cyan-300">
                    {leadDetail.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-cyan-400" />
                <div>
                  <div className="text-muted-foreground text-sm">Phone</div>
                  <a href={`tel:${leadDetail.phone}`} className="hover:text-cyan-400">
                    {leadDetail.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-cyan-400" />
                <div>
                  <div className="text-muted-foreground text-sm">Company</div>
                  <p>{leadDetail.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <div>
                  <div className="text-muted-foreground text-sm">Timezone</div>
                  <p>{leadDetail.timezone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs for Interactions */}
          <div className="card-secondary">
            <div className="border-b border-white/10">
              <div className="flex gap-0">
                {["overview", "interactions", "notes"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as "overview" | "interactions" | "notes")}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-cyan-500 text-cyan-400"
                        : "border-transparent text-muted-foreground hover:text-white"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-muted-foreground text-sm mb-1">Title</div>
                      <p>{leadDetail.title}</p>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm mb-1">Industry</div>
                      <p>{leadDetail.industry}</p>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm mb-1">Company Size</div>
                      <p>{leadDetail.companySize} employees</p>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm mb-1">Website</div>
                      <a href={`https://${leadDetail.website}`} className="text-cyan-400 hover:text-cyan-300">
                        {leadDetail.website}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "interactions" && (
                <div className="space-y-4">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="flex gap-4 pb-4 border-b border-white/5 last:border-0">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-cyan-400">
                          {getInteractionIcon(interaction.type)}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{interaction.subject}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{interaction.description}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(interaction.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-4">
                  <p className="text-muted-foreground">{leadDetail.notes}</p>
                  <Button variant="outline" className="border-white/20 mt-4">
                    Add Note
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags Card */}
          <div className="card-secondary p-6">
            <h3 className="font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {leadDetail.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-cyan-400 hover:text-cyan-300">
              + Add Tag
            </Button>
          </div>

          {/* Timeline Summary */}
          <div className="card-secondary p-6">
            <h3 className="font-semibold mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Lead Created</div>
                <p>{formatDate(leadDetail.createdAt)}</p>
              </div>
              <div>
                <div className="text-muted-foreground">Last Activity</div>
                <p>{formatDate(leadDetail.lastActivity)}</p>
              </div>
              <div>
                <div className="text-muted-foreground">Total Interactions</div>
                <p>{interactions.length}</p>
              </div>
            </div>
          </div>

          {/* Source Card */}
          <div className="card-secondary p-6">
            <h3 className="font-semibold mb-3">Lead Source</h3>
            <p className="text-cyan-400 font-medium capitalize">{leadDetail.source}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
