"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Trash2, User, Puzzle, Bell, Users, CreditCard, Key, Loader2, Check, AlertCircle, X, Upload, ExternalLink } from "lucide-react";
import { ApiKeysSection, IntegrationsSection, NotificationsSection } from "@/components/settings/settings-sections";
import { useUser } from "@clerk/nextjs";

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
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
];

interface OrganizationSettings {
  name: string;
  branding: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    appName: string | null;
    customDomain: string | null;
  };
  settings: {
    timezone: string;
    dateFormat: string;
    defaultLanguage: string;
  };
}

// Page Header Component
function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradSettings)" />
            <defs>
              <linearGradient id="apexGradSettings" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5CC"/>
                <stop offset="1" stopColor="#8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          APEX
        </span>
        <span className="text-xl font-light text-foreground ml-1">Settings</span>
      </div>

      {/* AI Status */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">AI Status:</span>
        <span className="text-xs text-primary font-medium">Active</span>
      </div>
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
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function SettingsClient() {
  const { user, isLoaded: isUserLoaded } = useUser();
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
  const [primaryColor, setPrimaryColor] = React.useState("#4926FA");
  const [accentColor, setAccentColor] = React.useState("#D82F71");
  const [appName, setAppName] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

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
      <PageHeader />

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
                            {user.primaryEmailAddress?.emailAddress || "No email"}
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
                    ? `Signed in since ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}`
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

            {/* Placeholder for other sections */}
            {(activeSection === "team" || activeSection === "billing") && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{activeSection === "team" ? "Team Management" : "Billing & Plan"}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    This section is coming soon
                  </p>
                </div>
                <div className="card-tertiary flex items-center justify-center py-12">
                  <p className="text-muted-foreground/70">Content will be available soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Star */}
      <DecorativeStar />

      {/* Brand Configuration Modal */}
      {brandModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
