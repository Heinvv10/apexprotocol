"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Trash2, User, Puzzle, Bell, Users, CreditCard, Key, Loader2, Check, AlertCircle, X, Upload, ExternalLink, Palette } from "lucide-react";
import { BrandHeader } from "@/components/layout/brand-header";
import { ApiKeysSection, IntegrationsSection, NotificationsSection } from "@/components/settings/settings-sections";
import { BrandingSection } from "@/components/settings/branding-section";
// useUserSafe replaced by Zustand store after Plan 3
import { useAuthStore } from "@/stores/auth";
const useUserSafe = () => ({ user: useAuthStore((s) => s.user), isLoaded: true, isSignedIn: !!useAuthStore((s) => s.user) });
import { formatDate } from "@/lib/utils/formatters";

// Available languages
const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
];

// Available timezones
const TIMEZONES = [
  { code: "UTC", name: "UTC (Coordinated Universal Time)" },
  { code: "America/New_York", name: "Eastern Time (ET)" },
  { code: "America/Chicago", name: "Central Time (CT)" },
  { code: "America/Denver", name: "Mountain Time (MT)" },
  { code: "America/Los_Angeles", name: "Pacific Time (PT)" },
  { code: "Europe/London", name: "London (GMT)" },
  { code: "Europe/Paris", name: "Paris (CET)" },
  { code: "Asia/Tokyo", name: "Tokyo (JST)" },
  { code: "Asia/Shanghai", name: "Shanghai (CST)" },
  { code: "Australia/Sydney", name: "Sydney (AEST)" },
  { code: "Africa/Johannesburg", name: "Johannesburg (SAST)" },
];

// Settings navigation items
const settingsNav = [
  { id: "general", label: "General", icon: User },
  { id: "branding", label: "Branding & Theme", icon: Palette },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
];

interface OrganizationSettings {
  name: string;
  branding: {
    themeId: string;
    primaryColor: string;
    accentColor: string;
    logoUrl: string | null;
    logoDarkUrl: string | null;
    faviconUrl: string | null;
    appName: string | null;
    tagline: string | null;
    customDomain: string | null;
    supportEmail: string | null;
    showPoweredBy: boolean;
    customFooterText: string | null;
  };
  settings: {
    timezone: string;
    dateFormat: string;
    defaultLanguage: string;
  };
}

// Team Management Section Component
interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  lastActiveAt: string | null;
  createdAt: string;
}

function TeamSection() {
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("viewer");
  const [isInviting, setIsInviting] = React.useState(false);

  React.useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings/team");
      const data = await response.json();
      if (data.success) {
        setTeamMembers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setIsInviting(true);
      const response = await fetch("/api/settings/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await response.json();
      if (data.success) {
        setInviteEmail("");
        fetchTeamMembers();
      }
    } catch (error) {
      console.error("Failed to invite team member:", error);
    } finally {
      setIsInviting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "editor": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Team Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your team members and their access levels
        </p>
      </div>

      {/* Invite Form */}
      <form onSubmit={handleInvite} className="card-secondary p-4 flex gap-3">
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Enter email to invite..."
          className="flex-1 px-3 py-2 bg-background/50 border border-white/10 rounded-lg text-foreground text-sm focus:border-primary focus:outline-none"
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          className="px-3 py-2 bg-background/50 border border-white/10 rounded-lg text-foreground text-sm focus:border-primary focus:outline-none"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={isInviting || !inviteEmail}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
        </button>
      </form>

      {/* Team Members List */}
      <div className="card-secondary rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-medium text-foreground">Team Members ({teamMembers.length})</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">No team members yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Invite people to collaborate</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {teamMembers.map((member) => (
              <div key={member.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {member.avatarUrl ? (
                      <Image src={member.avatarUrl} alt={member.name || member.email} width={40} height={40} className="rounded-full" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.name || member.email}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(member.role)}`}>
                    {member.role}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${member.isActive ? "bg-emerald-500" : "bg-gray-500"}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Billing Section Component
interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface UsageData {
  mentions: { used: number; limit: number };
  audits: { used: number; limit: number };
  aiTokens: { used: number; limit: number };
  contentPieces: { used: number; limit: number };
}

function BillingSection() {
  const [subscription, setSubscription] = React.useState<SubscriptionData | null>(null);
  const [usage, setUsage] = React.useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setIsLoading(true);
      const [subRes, usageRes] = await Promise.all([
        fetch("/api/billing?action=subscription"),
        fetch("/api/billing?action=usage"),
      ]);
      const subData = await subRes.json();
      const usageData = await usageRes.json();

      if (subData.subscription) {
        setSubscription(subData.subscription);
      }
      if (usageData.usage) {
        setUsage(usageData.usage);
      }
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });
      const data = await response.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "pro": case "professional": return "text-purple-400";
      case "enterprise": return "text-cyan-400";
      default: return "text-gray-400";
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-primary";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Billing & Plan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription and view usage
        </p>
      </div>

      {/* Current Plan */}
      <div className="card-secondary p-6 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Plan</p>
            <h3 className={`text-2xl font-bold ${getPlanColor(subscription?.plan || "free")}`}>
              {(() => {
                // When subscription.plan is undefined, the old `charAt(0) + (slice(1) || "ree")`
                // pattern rendered literally "undefinedree" because undefined + "ree" coerces.
                const plan = subscription?.plan || "free";
                return plan.charAt(0).toUpperCase() + plan.slice(1);
              })()}
            </h3>
            {subscription?.status && (
              <p className="text-sm text-muted-foreground mt-1">
                Status: <span className="text-emerald-400 capitalize">{subscription.status}</span>
              </p>
            )}
            {subscription?.currentPeriodEnd && (
              <p className="text-xs text-muted-foreground mt-2">
                {subscription.cancelAtPeriodEnd
                  ? "Cancels on "
                  : "Renews on "}
                {formatDate(subscription.currentPeriodEnd, "short")}
              </p>
            )}
          </div>
          <button
            onClick={handleManageBilling}
            className="px-4 py-2 bg-white/5 border border-white/10 text-foreground rounded-lg text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            Manage Billing
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <div className="card-secondary p-6 rounded-lg">
          <h3 className="text-sm font-medium text-foreground mb-4">Usage This Period</h3>
          <div className="space-y-4">
            {[
              { label: "Brand Mentions", key: "mentions" as const },
              { label: "Site Audits", key: "audits" as const },
              { label: "AI Tokens", key: "aiTokens" as const },
              { label: "Content Pieces", key: "contentPieces" as const },
            ].map(({ label, key }) => {
              const item = usage[key];
              if (!item) return null;
              const percentage = getUsagePercentage(item.used, item.limit);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground">
                      {item.used.toLocaleString()} / {item.limit === -1 ? "Unlimited" : item.limit.toLocaleString()}
                    </span>
                  </div>
                  {item.limit !== -1 && (
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getUsageColor(percentage)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {subscription?.plan !== "enterprise" && (
        <div className="card-primary p-6 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Upgrade Your Plan</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get more features and higher limits with a premium plan
              </p>
            </div>
            <button
              onClick={() => window.location.href = "/dashboard/settings/upgrade"}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              View Plans
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Decorative star component
function DecorativeStar() {
  return (
    <div className="absolute bottom-8 right-8 w-12 h-12 opacity-60 pointer-events-none">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 0L26.5 21.5L48 24L26.5 26.5L24 48L21.5 26.5L0 24L21.5 21.5L24 0Z"
          fill="url(#starGradientSettings)"
        />
        <defs>
          <linearGradient id="starGradientSettings" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(var(--color-primary))" stopOpacity="0.6"/>
            <stop offset="1" stopColor="hsl(var(--color-accent-purple))" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function SettingsClient() {
  const { user, isLoaded: isUserLoaded } = useUserSafe();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read tab from URL query parameter, default to "general"
  const tabParam = searchParams.get("tab");
  const [activeSection, setActiveSection] = React.useState(tabParam || "general");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  // Form state
  const [brandName, setBrandName] = React.useState("");
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [timezone, setTimezone] = React.useState("UTC");
  const [language, setLanguage] = React.useState("en");

  // Privacy settings state
  const [shareUsageData, setShareUsageData] = React.useState(false);
  const [aiModelFeedback, setAiModelFeedback] = React.useState(false);
  const [marketingComms, setMarketingComms] = React.useState(false);

  // Dropdown state
  const [languageDropdownOpen, setLanguageDropdownOpen] = React.useState(false);
  const [timezoneDropdownOpen, setTimezoneDropdownOpen] = React.useState(false);

  // Brand modal state
  const [brandModalOpen, setBrandModalOpen] = React.useState(false);
  const [primaryColor, setPrimaryColor] = React.useState("#00E5CC");
  const [accentColor, setAccentColor] = React.useState("#8B5CF6");
  const [appName, setAppName] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  
  // Organization branding settings (for Branding & Theme section)
  const [orgSettings, setOrgSettings] = React.useState<OrganizationSettings>({
    name: "",
    branding: {
      themeId: "apexgeo-default",
      primaryColor: "hsl(var(--color-primary))",
      accentColor: "hsl(var(--color-accent-purple))",
      logoUrl: null,
      logoDarkUrl: null,
      faviconUrl: null,
      appName: null,
      tagline: null,
      customDomain: null,
      supportEmail: null,
      showPoweredBy: true,
      customFooterText: null,
    },
    settings: {
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      defaultLanguage: "en",
    },
  });

  // Sync activeSection with URL when tab param changes
  React.useEffect(() => {
    if (tabParam && tabParam !== activeSection) {
      setActiveSection(tabParam);
    }
  }, [tabParam]);

  // Update URL when activeSection changes
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    router.replace(`/dashboard/settings?tab=${section}`, { scroll: false });
  };

  // Fetch organization settings on mount
  React.useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings/organization");
        const data = await response.json();

        if (data.success && data.data) {
          setBrandName(data.data.name || "");
          setWebsiteUrl(data.data.branding?.customDomain || "");
          setTimezone(data.data.settings?.timezone || "UTC");
          setLanguage(data.data.settings?.defaultLanguage || "en");
          // Privacy settings
          setShareUsageData(data.data.settings?.shareUsageData ?? false);
          setAiModelFeedback(data.data.settings?.aiModelFeedback ?? false);
          setMarketingComms(data.data.settings?.marketingComms ?? false);
          // Branding
          setPrimaryColor(data.data.branding?.primaryColor || "#4926FA");
          setAccentColor(data.data.branding?.accentColor || "#D82F71");
          setAppName(data.data.branding?.appName || "");
          setLogoUrl(data.data.branding?.logoUrl || null);
        }
      } catch (err) {
        // Settings not found - use defaults
        const message = err instanceof Error ? err.message : "Failed to load settings";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logos");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setLogoUrl(data.data.url);
      } else {
        setErrorMessage(data.error || "Failed to upload logo");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Save settings handler
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/settings/organization", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: brandName,
          branding: {
            customDomain: websiteUrl || null,
            primaryColor,
            accentColor,
            appName: appName || null,
            logoUrl: logoUrl || null,
          },
          settings: {
            timezone,
            defaultLanguage: language,
            shareUsageData,
            aiModelFeedback,
            marketingComms,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        setErrorMessage(data.error || "Failed to save settings");
      }
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* APEX Header */}
      <BrandHeader pageName="Settings" />

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Settings Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="settings-sidebar-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">APEX Settings</h2>
            <nav className="space-y-1">
              {settingsNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`settings-nav-item focus-ring-primary ${isActive ? "active" : ""}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="settings-content-card">
            {/* Render different sections based on active navigation */}
            {activeSection === "api-keys" && <ApiKeysSection />}
            {activeSection === "integrations" && <IntegrationsSection />}
            {activeSection === "notifications" && <NotificationsSection />}
            
            {/* Branding & Theme Section */}
            {activeSection === "branding" && (
              <>
                <h1 className="text-2xl font-semibold text-foreground mb-8">Branding & Theme</h1>
                <BrandingSection
                  branding={orgSettings.branding as any}
                  onUpdate={async (updates: unknown) => {
                    // TODO: Save to API
                    setOrgSettings(prev => ({
                      ...prev,
                      branding: { ...(prev.branding as Record<string, unknown>), ...(updates as Record<string, unknown>) } as never,
                    }));
                  }}
                />
              </>
            )}

            {/* General Settings (default) */}
            {activeSection === "general" && (
              <>
                <h1 className="text-2xl font-semibold text-foreground mb-8">General Settings</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Profile Section - Integrated with Clerk */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {isUserLoaded && user ? (
                      <>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-accent-purple/30 flex items-center justify-center border border-white/10 overflow-hidden">
                          {user.imageUrl ? (
                            <Image
                              src={user.imageUrl}
                              alt={user.fullName || "Profile"}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-foreground font-medium">
                            {user.fullName || user.firstName || "User"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {user.email || "No email"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-accent-purple/30 flex items-center justify-center border border-white/10 animate-pulse">
                          <User className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                          <div className="h-4 w-48 bg-white/5 rounded mt-1 animate-pulse" />
                        </div>
                      </>
                    )}
                  </div>
                  <Link
                    href="/user-profile"
                    className="settings-edit-btn flex items-center gap-1.5"
                  >
                    <span>Edit Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <p className="text-xs text-muted-foreground/70">
                  {isUserLoaded && user
                    ? `Signed in since ${formatDate(user.createdAt, "short")}`
                    : "Loading profile information..."}
                </p>

                {/* Brand Name */}
                <div className="space-y-3">
                  <label htmlFor="brand-name" className="text-sm font-medium text-foreground">Brand Name</label>
                  <input
                    id="brand-name"
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Enter your brand name"
                    className="settings-input w-full bg-transparent text-foreground placeholder:text-muted-foreground focus-ring-input"
                    disabled={isLoading}
                  />
                </div>

                {/* Website URL */}
                <div className="space-y-3">
                  <label htmlFor="website-url" className="text-sm font-medium text-foreground">Website URL</label>
                  <input
                    id="website-url"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="settings-input w-full bg-transparent text-foreground placeholder:text-muted-foreground focus-ring-input"
                    disabled={isLoading}
                  />
                </div>

                {/* Localization */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Localization</h3>

                  <div className="space-y-3">
                    {/* Language Dropdown */}
                    <div className="flex items-center justify-between">
                      <span id="language-label" className="text-sm text-muted-foreground">Language</span>
                      <div className="relative">
                        <button
                          className="settings-dropdown focus-ring-primary"
                          onClick={() => {
                            setLanguageDropdownOpen(!languageDropdownOpen);
                            setTimezoneDropdownOpen(false);
                          }}
                          disabled={isLoading}
                          aria-expanded={languageDropdownOpen}
                          aria-haspopup="listbox"
                          aria-labelledby="language-label"
                        >
                          <span>{LANGUAGES.find(l => l.code === language)?.name || "Select language"}</span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${languageDropdownOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                        </button>
                        {languageDropdownOpen && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-white/10 rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto" role="listbox" aria-labelledby="language-label">
                            {LANGUAGES.map((lang) => (
                              <button
                                key={lang.code}
                                role="option"
                                aria-selected={language === lang.code}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors focus-ring-menu ${language === lang.code ? "text-primary" : "text-muted-foreground"}`}
                                onClick={() => {
                                  setLanguage(lang.code);
                                  setLanguageDropdownOpen(false);
                                }}
                              >
                                {lang.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timezone Dropdown */}
                    <div className="flex items-center justify-between">
                      <span id="timezone-label" className="text-sm text-muted-foreground">Timezone</span>
                      <div className="relative">
                        <button
                          className="settings-dropdown focus-ring-primary"
                          onClick={() => {
                            setTimezoneDropdownOpen(!timezoneDropdownOpen);
                            setLanguageDropdownOpen(false);
                          }}
                          disabled={isLoading}
                          aria-expanded={timezoneDropdownOpen}
                          aria-haspopup="listbox"
                          aria-labelledby="timezone-label"
                        >
                          <span>{TIMEZONES.find(t => t.code === timezone)?.name || "Select timezone"}</span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${timezoneDropdownOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                        </button>
                        {timezoneDropdownOpen && (
                          <div className="absolute right-0 top-full mt-1 w-64 bg-card border border-white/10 rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto" role="listbox" aria-labelledby="timezone-label">
                            {TIMEZONES.map((tz) => (
                              <button
                                key={tz.code}
                                role="option"
                                aria-selected={timezone === tz.code}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors focus-ring-menu ${timezone === tz.code ? "text-primary" : "text-muted-foreground"}`}
                                onClick={() => {
                                  setTimezone(tz.code);
                                  setTimezoneDropdownOpen(false);
                                }}
                              >
                                {tz.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data & Privacy */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Data & Privacy</h3>
                  <p className="text-xs text-muted-foreground/70">
                    Manage your data preferences and privacy settings.
                    Deleting your account will remove all associated data.
                  </p>
                  <button className="settings-delete-btn">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Brand Preview Card */}
                <div className="settings-feature-card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-foreground font-medium">Brand Preview</h3>
                      <p className="text-xs text-muted-foreground">How your brand appears in AI responses</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}33` }}>
                      <span style={{ color: primaryColor }} className="text-xl">⟨⟩</span>
                    </div>
                  </div>
                  <div className="settings-preview-image">
                    <div
                      className="flex items-center justify-center gap-3 h-32 rounded-lg overflow-hidden border border-white/5"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}22, ${accentColor}22)` }}
                    >
                      {logoUrl && (
                        <img
                          src={logoUrl}
                          alt="Brand logo"
                          className="w-12 h-12 object-contain"
                        />
                      )}
                      {appName ? (
                        <span className="text-lg font-semibold text-foreground">{appName}</span>
                      ) : !logoUrl ? (
                        <span className="text-sm text-muted-foreground/70">No brand configured</span>
                      ) : null}
                    </div>
                    <button
                      className="text-xs text-primary hover:text-primary/80 mt-2"
                      onClick={() => setBrandModalOpen(true)}
                    >
                      Configure Brand
                    </button>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    Privacy Settings
                  </h3>

                  <div className="space-y-3">
                    <button
                      className="settings-toggle-row w-full focus-ring-primary"
                      onClick={() => setShareUsageData(!shareUsageData)}
                      disabled={isLoading}
                      role="switch"
                      aria-checked={shareUsageData}
                      aria-label="Share anonymous usage data to help improve the platform"
                    >
                      <span className="text-xs text-muted-foreground text-left">Share anonymous usage data<br/>Help improve the platform</span>
                      <div className={`settings-toggle ${shareUsageData ? "active" : ""}`} aria-hidden="true">
                        <div className="settings-toggle-knob" />
                      </div>
                    </button>

                    <button
                      className="settings-toggle-row w-full focus-ring-primary"
                      onClick={() => setAiModelFeedback(!aiModelFeedback)}
                      disabled={isLoading}
                      role="switch"
                      aria-checked={aiModelFeedback}
                      aria-label="Allow AI to learn from your usage for model feedback"
                    >
                      <span className="text-xs text-muted-foreground text-left">AI model feedback<br/>Allow AI to learn from your usage</span>
                      <div className={`settings-toggle ${aiModelFeedback ? "active" : ""}`} aria-hidden="true">
                        <div className="settings-toggle-knob" />
                      </div>
                    </button>

                    <button
                      className="settings-toggle-row w-full focus-ring-primary"
                      onClick={() => setMarketingComms(!marketingComms)}
                      disabled={isLoading}
                      role="switch"
                      aria-checked={marketingComms}
                      aria-label="Receive product updates and marketing communications"
                    >
                      <span className="text-xs text-muted-foreground text-left">Marketing communications<br/>Receive product updates and tips</span>
                      <div className={`settings-toggle ${marketingComms ? "active" : ""}`} aria-hidden="true">
                        <div className="settings-toggle-knob" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4 mt-8">
              {saveStatus === "success" && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Check className="w-4 h-4" />
                  <span>Settings saved successfully</span>
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMessage || "Failed to save"}</span>
                </div>
              )}
              <button
                className="settings-save-btn flex items-center gap-2 focus-ring-offset"
                onClick={handleSaveSettings}
                disabled={isSaving || isLoading}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
              </>
            )}

            {/* Team Management Section */}
            {activeSection === "team" && (
              <TeamSection />
            )}

            {/* Billing Section */}
            {activeSection === "billing" && (
              <BillingSection />
            )}
          </div>
        </div>
      </div>

      {/* Decorative Star */}
      <DecorativeStar />

      {/* Brand Configuration Modal */}
      {brandModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="brand-modal-title">
          <div className="bg-card border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 id="brand-modal-title" className="text-lg font-semibold text-foreground">Configure Brand</h2>
              <button
                onClick={() => setBrandModalOpen(false)}
                aria-label="Close brand configuration modal"
                className="p-1 rounded hover:bg-white/10 transition-colors focus-ring-primary"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Logo</label>
                <div className="flex items-center gap-4">
                  {/* Logo Preview */}
                  <div
                    className="w-20 h-20 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}22, ${accentColor}22)` }}
                    aria-hidden="true"
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Brand logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground/70" />
                    )}
                  </div>
                  {/* Upload Button */}
                  <div className="flex-1 space-y-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      aria-label="Upload brand logo"
                      className="hidden"
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="w-full px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-foreground hover:bg-white/10 transition-colors flex items-center justify-center gap-2 focus-ring-primary"
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>{logoUrl ? "Change Logo" : "Upload Logo"}</span>
                        </>
                      )}
                    </button>
                    {logoUrl && (
                      <button
                        onClick={() => setLogoUrl(null)}
                        className="w-full px-4 py-1.5 text-xs text-error hover:text-error/80 transition-colors focus-ring-destructive"
                      >
                        Remove Logo
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground/70">PNG, JPG, GIF, WebP or SVG. Max 5MB.</p>
                  </div>
                </div>
              </div>

              {/* App Name */}
              <div className="space-y-2">
                <label htmlFor="app-name" className="text-sm font-medium text-foreground">App Name</label>
                <input
                  id="app-name"
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Your brand name"
                  className="settings-input w-full bg-transparent text-foreground placeholder:text-muted-foreground focus-ring-input"
                />
              </div>

              {/* Primary Color */}
              <div className="space-y-2">
                <label htmlFor="primary-color" className="text-sm font-medium text-foreground">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    id="primary-color-picker"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    aria-label="Select primary color"
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent focus-ring-primary"
                  />
                  <input
                    id="primary-color"
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#4926FA"
                    className="settings-input flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus-ring-input uppercase"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <label htmlFor="accent-color" className="text-sm font-medium text-foreground">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    id="accent-color-picker"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    aria-label="Select accent color"
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent focus-ring-primary"
                  />
                  <input
                    id="accent-color"
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#D82F71"
                    className="settings-input flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus-ring-input uppercase"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Preview</label>
                <div
                  className="h-20 rounded-lg flex items-center justify-center gap-3 border border-white/10"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}44, ${accentColor}44)` }}
                >
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="w-10 h-10 object-contain"
                    />
                  )}
                  <span className="font-semibold text-foreground">{appName || "Your Brand"}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
              <button
                onClick={() => setBrandModalOpen(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-ring-primary rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => setBrandModalOpen(false)}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus-ring-offset"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
