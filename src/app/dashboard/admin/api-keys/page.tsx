"use client";

/**
 * Admin API Keys Management Page
 * Allows admins to configure universal API keys for all users
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Save, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface ApiKeyConfig {
  provider: "openai" | "anthropic" | "gemini";
  label: string;
  placeholder: string;
  configured: boolean;
  maskedKey?: string;
  updatedAt?: string;
}

// Page Header Component
function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradAdmin)" />
            <defs>
              <linearGradient id="apexGradAdmin" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5CC"/>
                <stop offset="1" stopColor="#8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          APEX
        </span>
        <span className="text-xl font-light text-foreground ml-1">Admin</span>
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

export default function AdminApiKeysPage() {
  const [keys, setKeys] = React.useState<ApiKeyConfig[]>([
    { provider: "openai", label: "OpenAI API Key", placeholder: "sk-proj-...", configured: false },
    { provider: "anthropic", label: "Anthropic API Key", placeholder: "sk-ant-api...", configured: false },
    { provider: "gemini", label: "Google Gemini API Key", placeholder: "AIzaSy...", configured: false },
  ]);

  const [inputValues, setInputValues] = React.useState<Record<string, string>>({
    openai: "",
    anthropic: "",
    gemini: "",
  });

  const [showKeys, setShowKeys] = React.useState<Record<string, boolean>>({
    openai: false,
    anthropic: false,
    gemini: false,
  });

  const [loading, setLoading] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<Record<string, "success" | "error" | null>>({
    openai: null,
    anthropic: null,
    gemini: null,
  });

  // Load existing keys on mount
  React.useEffect(() => {
    loadApiKeys();
  }, []);

  async function loadApiKeys() {
    try {
      const response = await fetch("/api/admin/universal-api-keys");
      const data = await response.json();

      if (data.success && data.keys) {
        setKeys((prev) =>
          prev.map((key) => {
            const configured = data.keys.find((k: any) => k.provider === key.provider);
            if (configured) {
              return {
                ...key,
                configured: true,
                maskedKey: configured.maskedKey,
                updatedAt: configured.updatedAt,
              };
            }
            return key;
          })
        );
      }
    } catch (error) {
      console.error("Error loading API keys:", error);
    }
  }

  async function saveApiKey(provider: "openai" | "anthropic" | "gemini") {
    const apiKey = inputValues[provider];

    if (!apiKey || apiKey.trim().length === 0) {
      setSaveStatus((prev) => ({ ...prev, [provider]: "error" }));
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [provider]: null })), 3000);
      return;
    }

    setLoading(true);
    setSaveStatus((prev) => ({ ...prev, [provider]: null }));

    try {
      const response = await fetch("/api/admin/universal-api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveStatus((prev) => ({ ...prev, [provider]: "success" }));
        setInputValues((prev) => ({ ...prev, [provider]: "" }));
        setShowKeys((prev) => ({ ...prev, [provider]: false }));

        // Reload to get updated masked key
        await loadApiKeys();

        // Clear success message after 3 seconds
        setTimeout(() => setSaveStatus((prev) => ({ ...prev, [provider]: null })), 3000);
      } else {
        throw new Error(data.error || "Failed to save API key");
      }
    } catch (error) {
      console.error(`Error saving ${provider} API key:`, error);
      setSaveStatus((prev) => ({ ...prev, [provider]: "error" }));
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [provider]: null })), 3000);
    } finally {
      setLoading(false);
    }
  }

  async function deleteApiKey(provider: "openai" | "anthropic" | "gemini") {
    if (!confirm(`Are you sure you want to remove the ${provider.toUpperCase()} API key?`)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/universal-api-keys?provider=${provider}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await loadApiKeys();
      } else {
        throw new Error(data.error || "Failed to delete API key");
      }
    } catch (error) {
      console.error(`Error deleting ${provider} API key:`, error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* APEX Header */}
      <PageHeader />

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Universal API Keys</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure API keys that all users will use for AI platform integrations
        </p>
      </div>

      {/* API Keys Grid */}
      <div className="grid gap-6">
        {keys.map((keyConfig) => (
          <Card key={keyConfig.provider} className="p-6 card-secondary">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{keyConfig.label}</h3>
                  {keyConfig.configured && keyConfig.maskedKey && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {keyConfig.maskedKey}
                    </p>
                  )}
                </div>
                {keyConfig.configured ? (
                  <span className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-xs text-yellow-400">
                    <AlertCircle className="w-4 h-4" />
                    Not configured
                  </span>
                )}
              </div>

              {/* Input */}
              <div className="space-y-2">
                <Label htmlFor={`${keyConfig.provider}-key`}>
                  {keyConfig.configured ? "Update API Key" : "Enter API Key"}
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={`${keyConfig.provider}-key`}
                      type={showKeys[keyConfig.provider] ? "text" : "password"}
                      placeholder={keyConfig.placeholder}
                      value={inputValues[keyConfig.provider]}
                      onChange={(e) =>
                        setInputValues((prev) => ({
                          ...prev,
                          [keyConfig.provider]: e.target.value,
                        }))
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowKeys((prev) => ({
                          ...prev,
                          [keyConfig.provider]: !prev[keyConfig.provider],
                        }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showKeys[keyConfig.provider] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    onClick={() => saveApiKey(keyConfig.provider)}
                    disabled={loading || !inputValues[keyConfig.provider]}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  {keyConfig.configured && (
                    <Button
                      variant="outline"
                      onClick={() => deleteApiKey(keyConfig.provider)}
                      disabled={loading}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* Save Status */}
              {saveStatus[keyConfig.provider] === "success" && (
                <p className="text-xs text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  API key saved successfully
                </p>
              )}
              {saveStatus[keyConfig.provider] === "error" && (
                <p className="text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  Failed to save API key
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Security Notice */}
      <Card className="p-6 border-primary/20 bg-primary/5">
        <div className="space-y-2">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            Security Notice
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
            <li>API keys are encrypted using AES-256-GCM before storage</li>
            <li>Only administrators can view or modify universal API keys</li>
            <li>All users will use these keys for AI platform integrations</li>
            <li>Changes take effect immediately for all users</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
