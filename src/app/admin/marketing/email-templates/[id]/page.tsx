"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Copy,
  Mail,
  Eye,
  TrendingUp,
  Users,
  MousePointer,
  AlertCircle,
  Code,
  Monitor,
  Smartphone,
  Download,
  Share2,
  BarChart3,
} from "lucide-react";
import { useEmailTemplate } from "@/hooks/useMarketing";

// Mock template data
const mockEmailTemplates: Record<string, any> = {
  template_001: {
    id: "template_001",
    name: "Welcome Email",
    description: "First email sent to new subscribers",
    subject: "Welcome to {{company_name}}! Here's what to expect",
    preheader: "Thanks for joining us! Let's get started on your journey.",
    category: "onboarding",
    status: "active",
    useCount: 1245,
    openRate: 42.5,
    clickRate: 18.3,
    unsubscribeRate: 0.8,
    bounceRate: 1.2,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["welcome", "onboarding", "high-priority"],
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{company_name}}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00E5CC 0%, #8B5CF6 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #00E5CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to {{company_name}}!</h1>
      <p>We're excited to have you on board</p>
    </div>
    <div class="content">
      <p>Hi {{first_name}},</p>
      <p>Thanks for joining {{company_name}}! We're thrilled to have you as part of our community.</p>
      <p>Here's what you can expect from us:</p>
      <ul>
        <li>Weekly updates with the latest features and tips</li>
        <li>Exclusive content and resources</li>
        <li>Priority support from our team</li>
      </ul>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{onboarding_link}}" class="button">Get Started</a>
      </p>
      <p>If you have any questions, just reply to this email. We're here to help!</p>
      <p>Best regards,<br>The {{company_name}} Team</p>
    </div>
    <div class="footer">
      <p>{{company_name}} | {{company_address}}</p>
      <p><a href="{{unsubscribe_link}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
    variables: [
      { name: "company_name", description: "Your company name", example: "Acme Corp" },
      { name: "first_name", description: "Recipient's first name", example: "John" },
      { name: "onboarding_link", description: "Link to onboarding flow", example: "https://example.com/start" },
      { name: "company_address", description: "Company address", example: "123 Main St, City, State" },
      { name: "unsubscribe_link", description: "Unsubscribe URL", example: "https://example.com/unsubscribe" },
    ],
  },
  template_002: {
    id: "template_002",
    name: "Weekly Newsletter",
    description: "Weekly digest of latest updates and articles",
    subject: "This Week's Highlights: {{date}}",
    preheader: "Your weekly roundup of the best content and updates",
    category: "newsletter",
    status: "active",
    useCount: 2850,
    openRate: 38.7,
    clickRate: 14.2,
    unsubscribeRate: 1.5,
    bounceRate: 0.9,
    createdAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["newsletter", "recurring", "content"],
    htmlContent: "<html><!-- Newsletter template HTML --></html>",
    variables: [
      { name: "date", description: "Current date", example: "January 15, 2026" },
      { name: "featured_article", description: "Featured article title", example: "10 Tips for Success" },
    ],
  },
};

// Mock performance data
const mockPerformanceData: Record<string, any[]> = {
  template_001: [
    { date: "Jan 8", sends: 45, opens: 19, clicks: 8, unsubscribes: 0 },
    { date: "Jan 9", sends: 52, opens: 22, clicks: 10, unsubscribes: 1 },
    { date: "Jan 10", sends: 38, opens: 16, clicks: 7, unsubscribes: 0 },
    { date: "Jan 11", sends: 41, opens: 18, clicks: 7, unsubscribes: 0 },
    { date: "Jan 12", sends: 48, opens: 20, clicks: 9, unsubscribes: 0 },
    { date: "Jan 13", sends: 55, opens: 23, clicks: 10, unsubscribes: 1 },
    { date: "Jan 14", sends: 50, opens: 21, clicks: 9, unsubscribes: 0 },
  ],
};

// Mock usage history
const mockUsageHistory: Record<string, any[]> = {
  template_001: [
    {
      id: "usage_001",
      campaignName: "New Subscriber Welcome Series",
      listName: "Newsletter Subscribers",
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      recipients: 45,
      opens: 19,
      clicks: 8,
      bounces: 1,
      unsubscribes: 0,
    },
    {
      id: "usage_002",
      campaignName: "Premium Onboarding Flow",
      listName: "Premium Customers",
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      recipients: 52,
      opens: 22,
      clicks: 10,
      bounces: 0,
      unsubscribes: 1,
    },
    {
      id: "usage_003",
      campaignName: "New Subscriber Welcome Series",
      listName: "Newsletter Subscribers",
      sentAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      recipients: 38,
      opens: 16,
      clicks: 7,
      bounces: 1,
      unsubscribes: 0,
    },
    {
      id: "usage_004",
      campaignName: "Free Trial Welcome",
      listName: "Free Trial Users",
      sentAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      recipients: 41,
      opens: 18,
      clicks: 7,
      bounces: 0,
      unsubscribes: 0,
    },
    {
      id: "usage_005",
      campaignName: "New Subscriber Welcome Series",
      listName: "Newsletter Subscribers",
      sentAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      recipients: 48,
      opens: 20,
      clicks: 9,
      bounces: 1,
      unsubscribes: 0,
    },
  ],
};

export default function EmailTemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "performance" | "usage">("preview");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Unwrap async params
  const { id } = use(params);

  // API data with fallback to mock data
  const { template: apiTemplate, isLoading, isError, error } = useEmailTemplate(id);
  const template = apiTemplate || mockEmailTemplates[id] || mockEmailTemplates["template_001"];
  const performanceData = mockPerformanceData[id] || mockPerformanceData["template_001"];
  const usageHistory = mockUsageHistory[id] || mockUsageHistory["template_001"];

  // Safe field access
  const useCount = template.useCount || 0;
  const openRate = template.openRate || 0;
  const clickRate = template.clickRate || 0;
  const unsubscribeRate = template.unsubscribeRate || 0;
  const bounceRate = template.bounceRate || 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    return `${diffDays}d ago`;
  };

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      onboarding: { label: "Onboarding", className: "bg-cyan-500/10 text-cyan-400" },
      newsletter: { label: "Newsletter", className: "bg-purple-500/10 text-purple-400" },
      product: { label: "Product", className: "bg-green-500/10 text-green-400" },
      retention: { label: "Retention", className: "bg-yellow-500/10 text-yellow-400" },
      events: { label: "Events", className: "bg-blue-500/10 text-blue-400" },
      transactional: { label: "Transactional", className: "bg-red-500/10 text-red-400" },
      content: { label: "Content", className: "bg-indigo-500/10 text-indigo-400" },
      promotional: { label: "Promotional", className: "bg-pink-500/10 text-pink-400" },
    };
    const badge = badges[category] || { label: category, className: "bg-gray-500/10 text-gray-400" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading template...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load template</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching the template"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading and no error */}
      {!isLoading && !isError && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/marketing/email-templates")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{template.name}</h1>
              {getCategoryBadge(template.category)}
            </div>
            <p className="text-muted-foreground mt-1">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-[#00E5CC] to-[#8B5CF6] hover:opacity-90">
            <Edit className="h-4 w-4 mr-2" />
            Edit Template
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Uses</p>
              <p className="text-2xl font-bold text-white mt-1">{useCount.toLocaleString()}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Open Rate</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{openRate.toFixed(1)}%</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Click Rate</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{clickRate.toFixed(1)}%</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <MousePointer className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unsubscribe Rate</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{unsubscribeRate.toFixed(1)}%</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="bg-card-secondary border border-border/50">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">HTML Code</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage History</TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <div className="card-secondary p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Template Preview</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={previewDevice === "desktop" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewDevice("desktop")}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </Button>
                <Button
                  variant={previewDevice === "mobile" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewDevice("mobile")}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </Button>
              </div>
            </div>

            {/* Email Subject Preview */}
            <div className="mb-4 p-3 rounded-lg bg-background/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Subject:</p>
              <p className="text-sm font-medium text-white">{template.subject}</p>
              <p className="text-xs text-muted-foreground mt-2 mb-1">Preheader:</p>
              <p className="text-sm text-white/80">{template.preheader}</p>
            </div>

            {/* HTML Preview */}
            <div className={`mx-auto bg-white ${previewDevice === "mobile" ? "max-w-[375px]" : "max-w-[600px]"}`}>
              <iframe
                srcDoc={template.htmlContent}
                className="w-full border border-border/50 rounded-lg"
                style={{ height: previewDevice === "mobile" ? "600px" : "800px" }}
                title="Email Preview"
              />
            </div>

            {/* Template Variables */}
            {template.variables && template.variables.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white mb-3">Template Variables</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {template.variables.map((variable: any) => (
                    <div key={variable.name} className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <code className="text-sm font-mono text-cyan-400">{"{{" + variable.name + "}}"}</code>
                          <p className="text-xs text-muted-foreground mt-1">{variable.description}</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">Example:</p>
                        <p className="text-sm text-white/80 font-mono">{variable.example}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* HTML Code Tab */}
        <TabsContent value="code" className="space-y-4">
          <div className="card-secondary p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">HTML Source Code</h2>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
            </div>
            <div className="bg-background/50 border border-border/50 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-white/80 font-mono whitespace-pre-wrap">{template.htmlContent}</pre>
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="card-secondary p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Performance Over Time</h2>
            <div className="space-y-4">
              {performanceData.map((data: any, index: number) => (
                <div key={index} className="p-3 rounded-lg bg-background/50 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{data.date}</span>
                    <span className="text-xs text-muted-foreground">{data.sends} sends</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Opens</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-semibold text-cyan-400">{data.opens}</p>
                        <span className="text-xs text-muted-foreground">
                          ({((data.opens / data.sends) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-semibold text-green-400">{data.clicks}</p>
                        <span className="text-xs text-muted-foreground">
                          ({((data.clicks / data.sends) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Unsubscribes</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-semibold text-red-400">{data.unsubscribes}</p>
                        <span className="text-xs text-muted-foreground">
                          ({((data.unsubscribes / data.sends) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Usage History Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="card-secondary p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Campaign Usage</h2>
            <div className="space-y-3">
              {usageHistory.map((usage: any) => (
                <div key={usage.id} className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-cyan-500/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{usage.campaignName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sent to {usage.listName} • {formatDate(usage.sentAt)}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(usage.sentAt)}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Recipients</p>
                      <p className="text-sm font-semibold text-white">{usage.recipients}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Opens</p>
                      <p className="text-sm font-semibold text-cyan-400">
                        {usage.opens} ({((usage.opens / usage.recipients) * 100).toFixed(1)}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                      <p className="text-sm font-semibold text-green-400">
                        {usage.clicks} ({((usage.clicks / usage.recipients) * 100).toFixed(1)}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bounces</p>
                      <p className="text-sm font-semibold text-yellow-400">{usage.bounces}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Unsubscribes</p>
                      <p className="text-sm font-semibold text-red-400">{usage.unsubscribes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}
