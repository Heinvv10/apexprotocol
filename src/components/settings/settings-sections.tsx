"use client";

import * as React from "react";
import { Check, Copy, Eye, EyeOff, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

// Profile Section
export function ProfileSection({ profile }: ProfileSectionProps) {
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // TODO: Fetch profile from API endpoint
  // const { data: profile } = useQuery(['userProfile'], fetchUserProfile);
  const apiKey = profile?.apiKey || ""; // Empty string - no mock data

  const copyToClipboard = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
            JD
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button variant="ghost" size="sm" className="text-error hover:text-error">
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="card-tertiary">
        <h3 className="text-sm font-medium text-foreground mb-4">Personal Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              First Name
            </label>
            <input
              type="text"
              defaultValue=""
              placeholder="Enter first name"
              className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              defaultValue=""
              placeholder="Enter last name"
              className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              defaultValue=""
              placeholder="Enter email address"
              className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="card-tertiary">
        <h3 className="text-sm font-medium text-foreground mb-4">API Key</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border/50 flex items-center">
            <code className="text-sm text-foreground font-mono">
              {apiKey ? (showApiKey ? apiKey : "•".repeat(apiKey.length)) : "No API key configured"}
            </code>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={copyToClipboard}>
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Use this key to authenticate API requests. Keep it secret!
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="gradient-primary text-white">Save Changes</Button>
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

// API Keys Section
export function ApiKeysSection({ apiKeys }: ApiKeysSectionProps) {
  const [showKeys, setShowKeys] = React.useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  // TODO: Fetch API keys from API endpoint
  // const { data: apiKeysData } = useQuery(['apiKeys'], fetchApiKeys);
  const keys = apiKeys || []; // Empty array - no mock data
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
    // Show first 12 chars, mask the rest
    return key.substring(0, 12) + "•".repeat(key.length - 16) + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your API keys for programmatic access to APEX
          </p>
        </div>
        <Button className="gradient-primary text-white">
          <span className="mr-2">+</span>
          Create New Key
        </Button>
      </div>

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
                >
                  <Trash2 className="w-4 h-4" />
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
