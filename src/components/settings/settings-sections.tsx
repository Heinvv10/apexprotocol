"use client";

import * as React from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Check, Copy, Eye, EyeOff, Upload, Trash2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAPIKeys, useCreateAPIKey, useRevokeAPIKey } from "@/hooks/useSettings";

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
  const notifications = [
    { id: "mentions", label: "New brand mentions", description: "Get notified when your brand is mentioned", enabled: true },
    { id: "citations", label: "Citation alerts", description: "Alert when cited by AI platforms", enabled: true },
    { id: "competitors", label: "Competitor activity", description: "Track competitor mentions", enabled: false },
    { id: "weekly", label: "Weekly digest", description: "Summary of weekly performance", enabled: true },
    { id: "recommendations", label: "New recommendations", description: "Alert for new optimization suggestions", enabled: true },
  ];

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
                  defaultChecked={notification.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted/30 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          ))}
        </div>
      </div>
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
            { color: "#00E5CC", name: "Cyan" },
            { color: "#8B5CF6", name: "Purple" },
            { color: "#3B82F6", name: "Blue" },
            { color: "#22C55E", name: "Green" },
            { color: "#F59E0B", name: "Amber" },
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
  const integrations = [
    { id: "slack", name: "Slack", description: "Send notifications to Slack channels", connected: true, icon: "S" },
    { id: "zapier", name: "Zapier", description: "Automate workflows with Zapier", connected: false, icon: "Z" },
    { id: "hubspot", name: "HubSpot", description: "Sync data with HubSpot CRM", connected: true, icon: "H" },
    { id: "analytics", name: "Google Analytics", description: "Track website analytics", connected: false, icon: "A" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect APEX with your favorite tools
        </p>
      </div>

      <div className="grid gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="card-tertiary flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center font-bold text-foreground">
                {integration.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {integration.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {integration.description}
                </p>
              </div>
            </div>
            <Button
              variant={integration.connected ? "outline" : "default"}
              size="sm"
              className={integration.connected ? "" : "gradient-primary text-white"}
            >
              {integration.connected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        ))}
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
}

interface ApiKeysSectionProps {
  apiKeys?: ApiKeyData[];
}

// API Keys Section - Wired to API hooks
export function ApiKeysSection({ apiKeys: propKeys }: ApiKeysSectionProps) {
  const { data: apiKeysData, isLoading } = useAPIKeys();
  const createKeyMutation = useCreateAPIKey();
  const revokeKeyMutation = useRevokeAPIKey();

  const [showKeys, setShowKeys] = React.useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = React.useState<string | null>(null);

  // Transform API data to component format (with prop fallback)
  const keys: ApiKeyData[] = React.useMemo(() => {
    if (propKeys) return propKeys;
    if (!apiKeysData) return [];
    return apiKeysData.map(key => ({
      id: key.id,
      name: key.name,
      key: key.keyPrefix + "..." + "••••••••", // Only prefix available, full key shown once on creation
      created: key.createdAt ? new Date(key.createdAt).toLocaleDateString() : "Unknown",
      lastUsed: key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never",
      status: key.status === "active" ? "active" : "inactive",
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
    if (!newKeyName.trim()) return;
    try {
      const result = await createKeyMutation.mutateAsync({
        name: newKeyName,
        permissions: ["read", "write"],
        expiresIn: "90d",
      });
      // Show the newly created key (only shown once!)
      setNewlyCreatedKey(result.key);
      setNewKeyName("");
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
            <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your API keys for programmatic access to APEX
            </p>
          </div>
        </div>
        <div className="card-tertiary flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading API keys...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your API keys for programmatic access to APEX
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
          Create New Key
        </Button>
      </div>

      {/* Create Key Dialog */}
      {showCreateDialog && (
        <div className="card-tertiary border-l-4 border-l-primary">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-foreground">Create New API Key</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Give your key a descriptive name to identify it later.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => {
              setShowCreateDialog(false);
              setNewKeyName("");
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
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production Server, Development"
                className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <Button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim() || createKeyMutation.isPending}
                className="gradient-primary text-white"
              >
                {createKeyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
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

      {/* Usage Stats - TODO: Fetch from API usage tracking */}
      <div className="card-tertiary">
        <h3 className="text-sm font-medium text-foreground mb-4">API Usage This Month</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">--</p>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">--</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">--</p>
            <p className="text-xs text-muted-foreground">Avg Latency</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/60 text-center mt-3">
          Usage data will appear once API keys are active
        </p>
      </div>
    </div>
  );
}

// Default placeholder section
export function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This section is coming soon
        </p>
      </div>
      <div className="card-tertiary flex items-center justify-center py-12">
        <p className="text-muted-foreground">Content will be available soon</p>
      </div>
    </div>
  );
}
