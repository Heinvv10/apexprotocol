"use client";

import * as React from "react";
import { createBrowserClient } from "@/lib/auth/supabase-browser";
import { useAuthStore } from "@/stores/auth";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Eye, EyeOff, Upload, Trash2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAPIKeys, useCreateAPIKey, useRevokeAPIKey, useNotificationPreferences, useUpdateNotificationPreferences, useIntegrations } from "@/hooks/useSettings";
import { formatDate } from "@/lib/utils/formatters";

// Fetch API usage stats
interface ApiUsageStats {
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number | null;
}

async function fetchApiUsageStats(): Promise<ApiUsageStats> {
  const response = await fetch("/api/usage/api-stats");
  if (!response.ok) {
    throw new Error("Failed to fetch API usage stats");
  }
  const json = await response.json();
  return json.data;
}

// Export interface for API integration
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatarInitials: string;
  apiKey?: string;
}

interface ProfileSectionProps {
  profile?: UserProfile;
}

// Profile Section - Wired to Clerk for user data
export function ProfileSection({ profile }: ProfileSectionProps) {
  const { user, isLoaded: userLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const { data: apiKeysData, isLoading: apiKeysLoading } = useAPIKeys();

  const [showApiKey, setShowApiKey] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Get user data from Clerk (with prop fallback)
  const firstName = profile?.firstName ?? user?.firstName ?? "";
  const lastName = profile?.lastName ?? user?.lastName ?? "";
  const email = profile?.email ?? user?.primaryEmailAddress?.emailAddress ?? "";
  const avatarUrl = user?.imageUrl;
  const avatarInitials = profile?.avatarInitials ??
    (firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : "");

  // Get primary API key for display (use first active key)
  const primaryApiKey = profile?.apiKey ??
    apiKeysData?.find(k => k.status === "active")?.keyPrefix ?? "";

  const copyToClipboard = () => {
    if (!primaryApiKey) return;
    navigator.clipboard.writeText(primaryApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle opening Clerk's profile management
  const handleManageProfile = () => {
    openUserProfile();
  };

  // Loading state
  if (!userLoaded && !profile) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal information and preferences
          </p>
        </div>
        <div className="card-tertiary flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Avatar Section */}
      <div className="card-tertiary">
        <h3 className="text-sm font-medium text-foreground mb-4">Profile Photo</h3>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${firstName} ${lastName}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
              {avatarInitials || "?"}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleManageProfile}>
              <Upload className="w-4 h-4 mr-2" />
              Change Photo
            </Button>
            {avatarUrl && (
              <Button variant="ghost" size="sm" className="text-error hover:text-error" onClick={handleManageProfile}>
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="card-tertiary">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">Personal Information</h3>
          <Button variant="ghost" size="sm" onClick={handleManageProfile} className="text-xs">
            <ExternalLink className="w-3 h-3 mr-1" />
            Edit in Clerk
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              readOnly
              className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm focus:outline-none cursor-not-allowed opacity-70"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              readOnly
              className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm focus:outline-none cursor-not-allowed opacity-70"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm focus:outline-none cursor-not-allowed opacity-70"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-3">
          Profile information is managed through Clerk. Click &quot;Edit in Clerk&quot; to make changes.
        </p>
      </div>

      {/* API Key */}
      <div className="card-tertiary">
        <h3 className="text-sm font-medium text-foreground mb-4">API Key</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border/50 flex items-center">
            {apiKeysLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <code className="text-sm text-foreground font-mono">
                {primaryApiKey ? (showApiKey ? `${primaryApiKey}...` : "•".repeat(12) + "...") : "No API key configured"}
              </code>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowApiKey(!showApiKey)}
            disabled={!primaryApiKey}
          >
            {showApiKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={copyToClipboard} disabled={!primaryApiKey}>
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {primaryApiKey
            ? "Use this key to authenticate API requests. Keep it secret!"
            : "Create an API key in the API Keys section to enable programmatic access."}
        </p>
      </div>

      {/* Manage Profile Button */}
      <div className="flex justify-end">
        <Button className="gradient-primary text-white" onClick={handleManageProfile}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Manage Profile
        </Button>
      </div>
    </div>
  );
}

// Notifications Section
export function NotificationsSection() {
  const { data: preferences, isLoading, error } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  // Map API preferences to UI notification items
  const getNotificationItems = () => {
    if (!preferences) return [];
    return [
      {
        id: "mentionNotifications",
        label: "New brand mentions",
        description: "Get notified when your brand is mentioned",
        enabled: preferences.mentionNotifications
      },
      {
        id: "scoreChangeNotifications",
        label: "Score change alerts",
        description: "Alert when your GEO score changes significantly",
        enabled: preferences.scoreChangeNotifications
      },
      {
        id: "recommendationNotifications",
        label: "New recommendations",
        description: "Alert for new optimization suggestions",
        enabled: preferences.recommendationNotifications
      },
      {
        id: "importantNotifications",
        label: "Important updates",
        description: "Critical platform and competitor alerts",
        enabled: preferences.importantNotifications
      },
      {
        id: "emailDigest",
        label: "Email digest",
        description: `${preferences.emailDigestFrequency === "none" ? "Disabled" : `${preferences.emailDigestFrequency.charAt(0).toUpperCase() + preferences.emailDigestFrequency.slice(1)} summary of performance`}`,
        enabled: preferences.emailDigestFrequency !== "none"
      },
    ];
  };

  const handleToggle = (id: string, currentEnabled: boolean) => {
    if (id === "emailDigest") {
      // Toggle between weekly and none for email digest
      updatePreferences.mutate({
        emailDigestFrequency: currentEnabled ? "none" : "weekly"
      });
    } else {
      // Toggle boolean preferences
      updatePreferences.mutate({
        [id]: !currentEnabled
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure how and when you receive alerts
          </p>
        </div>
        <div className="card-tertiary">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted/30 rounded" />
                  <div className="h-3 w-48 bg-muted/20 rounded" />
                </div>
                <div className="w-11 h-6 bg-muted/30 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure how and when you receive alerts
          </p>
        </div>
        <div className="card-tertiary">
          <div className="text-center py-8">
            <p className="text-sm text-red-400">Failed to load notification preferences</p>
            <p className="text-xs text-muted-foreground mt-1">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    );
  }

  const notifications = getNotificationItems();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure how and when you receive alerts
        </p>
      </div>

      <div className="card-tertiary">
        <h3 className="text-sm font-medium text-foreground mb-4">Email Notifications</h3>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-center justify-between py-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {notification.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {notification.description}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notification.enabled}
                  onChange={() => handleToggle(notification.id, notification.enabled)}
                  disabled={updatePreferences.isPending}
                  className="sr-only peer"
                />
                <div className={cn(
                  "w-11 h-6 bg-muted/30 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary",
                  updatePreferences.isPending && "opacity-50 cursor-not-allowed"
                )} />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Email Settings */}
      {preferences?.emailEnabled && (
        <div className="card-tertiary">
          <h3 className="text-sm font-medium text-foreground mb-4">Email Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email address</span>
              <span className="text-sm text-foreground">{preferences.emailAddress || "Not configured"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Timezone</span>
              <span className="text-sm text-foreground">{preferences.timezone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Digest time</span>
              <span className="text-sm text-foreground">{preferences.digestHour}:00</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Appearance Section
export function AppearanceSection() {
  const [theme, setTheme] = React.useState("dark");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize the look and feel of your dashboard
        </p>
      </div>

      <div className="card-tertiary">
        <h3 className="text-sm font-medium text-foreground mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {["light", "dark", "system"].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "p-4 rounded-lg border transition-all text-center",
                theme === t
                  ? "border-primary bg-primary/10"
                  : "border-border/50 hover:border-primary/50"
              )}
            >
              <div
                className={cn(
                  "w-full h-12 rounded-md mb-2",
                  t === "light" ? "bg-white" : t === "dark" ? "bg-[#0D1025]" : "bg-gradient-to-r from-white to-[#0D1025]"
                )}
              />
              <span className="text-sm font-medium capitalize text-foreground">
                {t}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card-tertiary">
        <h3 className="text-sm font-medium text-foreground mb-4">Accent Color</h3>
        <div className="flex gap-3">
          {[
            { color: "hsl(var(--color-primary))", name: "Cyan" },
            { color: "hsl(var(--color-accent-purple))", name: "Purple" },
            { color: "hsl(var(--color-info))", name: "Blue" },
            { color: "hsl(var(--color-success))", name: "Green" },
            { color: "hsl(var(--color-warning))", name: "Amber" },
          ].map((accent) => (
            <button
              key={accent.color}
              className="w-10 h-10 rounded-full ring-2 ring-offset-2 ring-offset-bg-base hover:ring-primary transition-all"
              style={{ backgroundColor: accent.color }}
              title={accent.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Integrations Section
export function IntegrationsSection() {
  const { data, isLoading, error } = useIntegrations();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const handleConnect = (integrationId: string) => {
    // Navigate to integration-specific configuration
    // This could open a modal or navigate to a dedicated page
    console.log("Connect integration:", integrationId);
    // TODO: Implement integration-specific OAuth flows
  };

  const handleDisconnect = (integrationId: string) => {
    // Disconnect integration
    console.log("Disconnect integration:", integrationId);
    // TODO: Call specific disconnect endpoint
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect APEX with your favorite tools
          </p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-tertiary flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted/30" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted/30 rounded" />
                  <div className="h-3 w-40 bg-muted/20 rounded" />
                </div>
              </div>
              <div className="h-8 w-20 bg-muted/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect APEX with your favorite tools
          </p>
        </div>
        <div className="card-tertiary text-center py-8">
          <p className="text-sm text-red-400">Failed to load integrations</p>
          <p className="text-xs text-muted-foreground mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const integrations = data?.integrations || [];
  const categories = data?.categories || [];
  const summary = data?.summary || { total: 0, connected: 0, available: 0 };

  const filteredIntegrations = selectedCategory
    ? integrations.filter((i) => i.category === selectedCategory)
    : integrations;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect APEX with your favorite tools
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-tertiary p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{summary.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="card-tertiary p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{summary.connected}</p>
          <p className="text-xs text-muted-foreground">Connected</p>
        </div>
        <div className="card-tertiary p-3 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{summary.available}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className={selectedCategory === null ? "gradient-primary text-white" : ""}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className={selectedCategory === cat.id ? "gradient-primary text-white" : ""}
          >
            {cat.name} ({cat.count})
          </Button>
        ))}
      </div>

      {/* Integrations List */}
      <div className="grid gap-4">
        {filteredIntegrations.map((integration) => (
          <div
            key={integration.id}
            className="card-tertiary flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-foreground",
                integration.connected ? "bg-primary/20" : "bg-muted/30"
              )}>
                {integration.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {integration.name}
                  </p>
                  {integration.connected && (
                    <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {integration.description}
                </p>
              </div>
            </div>
            {integration.configurable ? (
              <Button
                variant={integration.connected ? "outline" : "default"}
                size="sm"
                onClick={() => integration.connected
                  ? handleDisconnect(integration.id)
                  : handleConnect(integration.id)
                }
                className={integration.connected ? "" : "gradient-primary text-white"}
              >
                {integration.connected ? "Disconnect" : "Connect"}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground px-3 py-1.5">Coming Soon</span>
            )}
          </div>
        ))}

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No integrations in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Export interface for API integration
export interface ApiKeyData {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: "active" | "inactive";
  type?: string; // Service type: anthropic, openai, serper, pinecone, custom
}

interface ApiKeysSectionProps {
  apiKeys?: ApiKeyData[];
}

// API Keys Section - Wired to API hooks
export function ApiKeysSection({ apiKeys: propKeys }: ApiKeysSectionProps) {
  const { data: apiKeysData, isLoading } = useAPIKeys();
  const createKeyMutation = useCreateAPIKey();
  const revokeKeyMutation = useRevokeAPIKey();

  // Fetch API usage stats
  const { data: apiStats, isLoading: statsLoading } = useQuery({
    queryKey: ["api-usage-stats"],
    queryFn: fetchApiUsageStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const [showKeys, setShowKeys] = React.useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState("");
  const [newKeyType, setNewKeyType] = React.useState<"anthropic" | "openai" | "serper" | "pinecone" | "custom">("custom");
  const [newKeyValue, setNewKeyValue] = React.useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = React.useState<string | null>(null);

  // Transform API data to component format (with prop fallback)
  const keys: ApiKeyData[] = React.useMemo(() => {
    if (propKeys) return propKeys;
    if (!apiKeysData) return [];
    return apiKeysData.map(key => ({
      id: key.id,
      name: key.name,
      key: key.keyPrefix || "***", // keyPrefix from hook transformation
      created: formatDate(key.createdAt, "short"),
      lastUsed: key.lastUsedAt ? formatDate(key.lastUsedAt, "short") : "Never",
      status: key.isActive ? "active" : "inactive",
      type: key.type,
    }));
  }, [propKeys, apiKeysData]);

  const hasKeys = keys.length > 0;

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const copyToClipboard = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string): string => {
    if (key.length < 16) return "•".repeat(key.length);
    return key.substring(0, 12) + "•".repeat(Math.max(0, key.length - 16)) + key.substring(key.length - 4);
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) return;
    try {
      const result = await createKeyMutation.mutateAsync({
        name: newKeyName,
        type: newKeyType,
        key: newKeyValue,
      });
      // Show the newly created key (masked for confirmation)
      setNewlyCreatedKey(result.key);
      setNewKeyName("");
      setNewKeyValue("");
      setNewKeyType("custom");
    } catch {
      // Error is handled by mutation state
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }
    try {
      await revokeKeyMutation.mutateAsync(keyId);
    } catch {
      // Error is handled by mutation state
    }
  };

  // Loading state
  if (isLoading && !propKeys) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Service API Keys</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage API keys for external services (AI providers, search, etc.)
            </p>
          </div>
        </div>
        <div className="card-tertiary flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading service keys...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Service API Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage API keys for external services (AI providers, search, etc.)
          </p>
        </div>
        <Button
          className="gradient-primary text-white"
          onClick={() => setShowCreateDialog(true)}
          disabled={createKeyMutation.isPending}
        >
          {createKeyMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <span className="mr-2">+</span>
          )}
          Add Service Key
        </Button>
      </div>

      {/* Create Key Dialog */}
      {showCreateDialog && (
        <div className="card-tertiary border-l-4 border-l-primary">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-foreground">Add External Service Key</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Configure an API key for an external service like Claude, OpenAI, or other providers.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => {
              setShowCreateDialog(false);
              setNewKeyName("");
              setNewKeyType("custom");
              setNewKeyValue("");
              setNewlyCreatedKey(null);
            }} className="h-8 w-8">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          {newlyCreatedKey ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                <p className="text-sm font-medium text-success mb-2">API Key Created!</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Copy this key now. You won&apos;t be able to see it again!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 rounded bg-muted/30 text-xs font-mono break-all">
                    {newlyCreatedKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(newlyCreatedKey);
                      setCopiedKey("new");
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                  >
                    {copiedKey === "new" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewlyCreatedKey(null);
                }}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production Claude Key"
                    className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Service Type
                  </label>
                  <select
                    value={newKeyType}
                    onChange={(e) => setNewKeyType(e.target.value as typeof newKeyType)}
                    className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="openai">OpenAI (GPT)</option>
                    <option value="serper">Serper (Search)</option>
                    <option value="pinecone">Pinecone (Vector DB)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  API Key
                </label>
                <input
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="sk-..."
                  className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Your API key will be encrypted and stored securely.
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateKey}
                  disabled={!newKeyName.trim() || !newKeyValue.trim() || createKeyMutation.isPending}
                  className="gradient-primary text-white"
                >
                  {createKeyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Add API Key
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Notice */}
      <div className="card-tertiary border-l-4 border-l-warning">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
            <span className="text-warning text-lg">⚠️</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Keep your API keys secure</p>
            <p className="text-xs text-muted-foreground mt-1">
              Never share your API keys in public repositories or client-side code.
              Rotate keys regularly and revoke any compromised keys immediately.
            </p>
          </div>
        </div>
      </div>

      {/* API Keys List */}
      <div className="space-y-3">
        {!hasKeys ? (
          <div className="card-tertiary flex items-center justify-center py-8">
            <div className="text-center">
              <span className="text-4xl mb-3 block">🔑</span>
              <p className="text-sm text-muted-foreground">No API keys configured</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Create a new key to get started</p>
            </div>
          </div>
        ) : keys.map((apiKey) => (
          <div
            key={apiKey.id}
            className={cn(
              "card-tertiary",
              apiKey.status === "inactive" && "opacity-60"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-primary text-lg">🔑</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{apiKey.name}</p>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        apiKey.status === "active"
                          ? "bg-success/20 text-success"
                          : "bg-muted/30 text-muted-foreground"
                      )}
                    >
                      {apiKey.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created {apiKey.created} • Last used {apiKey.lastUsed}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleKeyVisibility(apiKey.id)}
                  className="h-8 w-8"
                >
                  {showKeys[apiKey.id] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                  className="h-8 w-8"
                >
                  {copiedKey === apiKey.id ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-error hover:text-error hover:bg-error/10"
                  onClick={() => handleRevokeKey(apiKey.id)}
                  disabled={revokeKeyMutation.isPending || apiKey.status === "inactive"}
                >
                  {revokeKeyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* API Key Value */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-9 px-3 rounded-lg bg-muted/20 border border-border/30 flex items-center overflow-hidden">
                <code className="text-xs text-foreground/80 font-mono truncate">
                  {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Stats - Wired to API */}
      <div className="card-tertiary">
        <h3 className="text-sm font-medium text-foreground mb-4">API Usage This Month</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            {statsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
            ) : (
              <p className="text-2xl font-bold text-primary">
                {apiStats?.totalRequests?.toLocaleString() ?? "--"}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </div>
          <div className="text-center">
            {statsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-success mx-auto" />
            ) : (
              <p className="text-2xl font-bold text-success">
                {apiStats?.successRate != null ? `${apiStats.successRate}%` : "--"}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
          <div className="text-center">
            {statsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-warning mx-auto" />
            ) : (
              <p className="text-2xl font-bold text-warning">
                {apiStats?.avgLatencyMs != null ? `${apiStats.avgLatencyMs}ms` : "N/A"}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Avg Latency</p>
          </div>
        </div>
        {hasKeys ? (
          <p className="text-xs text-muted-foreground/60 text-center mt-3">
            Usage data is updated in real-time
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60 text-center mt-3">
            Create an API key to start tracking usage
          </p>
        )}
      </div>
    </div>
  );
}

// Default placeholder section - used as fallback for sections not yet implemented
export function PlaceholderSection({
  title,
  description = "This feature is currently being developed",
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {description}
        </p>
      </div>
      <div className="card-tertiary flex flex-col items-center justify-center py-12 text-center">
        {Icon && (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-primary/60" />
          </div>
        )}
        <p className="text-muted-foreground font-medium">Feature in Development</p>
        <p className="text-muted-foreground/60 text-sm mt-1 max-w-md">
          We&apos;re working on bringing this feature to you. Check back soon for updates.
        </p>
      </div>
    </div>
  );
}
