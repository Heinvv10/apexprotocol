"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Bell, Loader2, Check, AlertCircle } from "lucide-react";

// Email digest frequency options
const DIGEST_FREQUENCIES = [
  { code: "none", name: "Disabled" },
  { code: "daily", name: "Daily" },
  { code: "weekly", name: "Weekly" },
];

// Digest hour options (0-23)
const DIGEST_HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, '0')}:00`,
  display: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`,
}));

interface NotificationPreferences {
  emailEnabled: boolean;
  emailDigestFrequency: "none" | "daily" | "weekly";
  emailAddress: string | null;
  inAppEnabled: boolean;
  mentionNotifications: boolean;
  scoreChangeNotifications: boolean;
  recommendationNotifications: boolean;
  importantNotifications: boolean;
  timezone: string;
  digestHour: number;
}

// Page Header Component
function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradNotif)" />
            <defs>
              <linearGradient id="apexGradNotif" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5CC"/>
                <stop offset="1" stopColor="#8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          APEX
        </span>
        <span className="text-xl font-light text-foreground ml-1">Notification Settings</span>
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
          fill="url(#starGradientNotif)"
        />
        <defs>
          <linearGradient id="starGradientNotif" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5CC" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function NotificationPreferencesPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  // Preferences state
  const [emailEnabled, setEmailEnabled] = React.useState(false);
  const [emailDigestFrequency, setEmailDigestFrequency] = React.useState<"none" | "daily" | "weekly">("none");
  const [emailAddress, setEmailAddress] = React.useState("");
  const [inAppEnabled, setInAppEnabled] = React.useState(true);
  const [mentionNotifications, setMentionNotifications] = React.useState(true);
  const [scoreChangeNotifications, setScoreChangeNotifications] = React.useState(true);
  const [recommendationNotifications, setRecommendationNotifications] = React.useState(true);
  const [importantNotifications, setImportantNotifications] = React.useState(true);
  const [timezone, setTimezone] = React.useState("UTC");
  const [digestHour, setDigestHour] = React.useState(9);

  // Dropdown state
  const [frequencyDropdownOpen, setFrequencyDropdownOpen] = React.useState(false);
  const [hourDropdownOpen, setHourDropdownOpen] = React.useState(false);

  // Fetch preferences on mount
  React.useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch("/api/notifications/preferences");
        const data = await response.json();

        if (data.success && data.data) {
          setEmailEnabled(data.data.emailEnabled ?? false);
          setEmailDigestFrequency(data.data.emailDigestFrequency ?? "none");
          setEmailAddress(data.data.emailAddress || "");
          setInAppEnabled(data.data.inAppEnabled ?? true);
          setMentionNotifications(data.data.mentionNotifications ?? true);
          setScoreChangeNotifications(data.data.scoreChangeNotifications ?? true);
          setRecommendationNotifications(data.data.recommendationNotifications ?? true);
          setImportantNotifications(data.data.importantNotifications ?? true);
          setTimezone(data.data.timezone || "UTC");
          setDigestHour(data.data.digestHour ?? 9);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load preferences";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  // Save preferences handler
  const handleSavePreferences = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailEnabled,
          emailDigestFrequency,
          emailAddress: emailAddress || null,
          inAppEnabled,
          mentionNotifications,
          scoreChangeNotifications,
          recommendationNotifications,
          importantNotifications,
          timezone,
          digestHour,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        setErrorMessage(data.error || "Failed to save preferences");
      }
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* APEX Header */}
      <PageHeader />

      {/* Back Button */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/settings?tab=notifications"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="settings-content-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading preferences...</span>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-foreground mb-8">Notification Preferences</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Email Settings */}
              <div className="space-y-6">
                {/* Email Digest Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Email Digest</h3>
                      <p className="text-xs text-muted-foreground">Receive notification summaries via email</p>
                    </div>
                  </div>

                  {/* Email Digest Toggle */}
                  <button
                    className="settings-toggle-row w-full focus-ring-primary"
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    disabled={isLoading}
                    role="switch"
                    aria-checked={emailEnabled}
                    aria-label="Enable email notifications to receive digest emails with notification summaries"
                  >
                    <span className="text-xs text-muted-foreground text-left">Enable email notifications<br/>Receive digest emails with notification summaries</span>
                    <div className={`settings-toggle ${emailEnabled ? "active" : ""}`} aria-hidden="true">
                      <div className="settings-toggle-knob" />
                    </div>
                  </button>

                  {/* Frequency Dropdown - Only show when email is enabled */}
                  {emailEnabled && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span id="digest-frequency-label" className="text-sm text-muted-foreground">Digest Frequency</span>
                        <div className="relative">
                          <button
                            className="settings-dropdown focus-ring-primary"
                            onClick={() => {
                              setFrequencyDropdownOpen(!frequencyDropdownOpen);
                              setHourDropdownOpen(false);
                            }}
                            disabled={isLoading}
                            aria-expanded={frequencyDropdownOpen}
                            aria-haspopup="listbox"
                            aria-labelledby="digest-frequency-label"
                          >
                            <span>{DIGEST_FREQUENCIES.find(f => f.code === emailDigestFrequency)?.name || "Select frequency"}</span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${frequencyDropdownOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                          </button>
                          {frequencyDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-white/10 rounded-lg shadow-lg z-50 py-1" role="listbox" aria-labelledby="digest-frequency-label">
                              {DIGEST_FREQUENCIES.map((freq) => (
                                <button
                                  key={freq.code}
                                  role="option"
                                  aria-selected={emailDigestFrequency === freq.code}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors focus-ring-menu ${emailDigestFrequency === freq.code ? "text-primary" : "text-muted-foreground"}`}
                                  onClick={() => {
                                    setEmailDigestFrequency(freq.code as "none" | "daily" | "weekly");
                                    setFrequencyDropdownOpen(false);
                                  }}
                                >
                                  {freq.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Digest Hour - Only show when frequency is not "none" */}
                      {emailDigestFrequency !== "none" && (
                        <div className="flex items-center justify-between">
                          <span id="delivery-time-label" className="text-sm text-muted-foreground">Delivery Time</span>
                          <div className="relative">
                            <button
                              className="settings-dropdown focus-ring-primary"
                              onClick={() => {
                                setHourDropdownOpen(!hourDropdownOpen);
                                setFrequencyDropdownOpen(false);
                              }}
                              disabled={isLoading}
                              aria-expanded={hourDropdownOpen}
                              aria-haspopup="listbox"
                              aria-labelledby="delivery-time-label"
                            >
                              <span>{DIGEST_HOURS.find(h => h.value === digestHour)?.display || "9:00 AM"}</span>
                              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${hourDropdownOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                            </button>
                            {hourDropdownOpen && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-white/10 rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto" role="listbox" aria-labelledby="delivery-time-label">
                                {DIGEST_HOURS.map((hour) => (
                                  <button
                                    key={hour.value}
                                    role="option"
                                    aria-selected={digestHour === hour.value}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors focus-ring-menu ${digestHour === hour.value ? "text-primary" : "text-muted-foreground"}`}
                                    onClick={() => {
                                      setDigestHour(hour.value);
                                      setHourDropdownOpen(false);
                                    }}
                                  >
                                    {hour.display}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Email Address Override */}
                      <div className="space-y-2">
                        <label htmlFor="email-address-override" className="text-sm text-muted-foreground">Email Address (optional)</label>
                        <input
                          id="email-address-override"
                          type="email"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          placeholder="Override default email"
                          className="settings-input w-full bg-transparent text-foreground placeholder:text-muted-foreground focus-ring-input"
                          disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground/70">
                          Leave blank to use your account email
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* In-App Notifications */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">In-App Notifications</h3>
                  <button
                    className="settings-toggle-row w-full focus-ring-primary"
                    onClick={() => setInAppEnabled(!inAppEnabled)}
                    disabled={isLoading}
                    role="switch"
                    aria-checked={inAppEnabled}
                    aria-label="Enable in-app notifications to show real-time notifications in the dashboard"
                  >
                    <span className="text-xs text-muted-foreground text-left">Enable in-app notifications<br/>Show real-time notifications in the dashboard</span>
                    <div className={`settings-toggle ${inAppEnabled ? "active" : ""}`} aria-hidden="true">
                      <div className="settings-toggle-knob" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Right Column - Notification Types */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Notification Types</h3>
                  <p className="text-xs text-muted-foreground/70">
                    Choose which types of notifications you want to receive
                  </p>

                  {/* Mention Notifications */}
                  <button
                    className="settings-toggle-row w-full focus-ring-primary"
                    onClick={() => setMentionNotifications(!mentionNotifications)}
                    disabled={isLoading}
                    role="switch"
                    aria-checked={mentionNotifications}
                    aria-label="Get notified when your brand is mentioned"
                  >
                    <span className="text-xs text-muted-foreground text-left">Brand mentions<br/>Get notified when your brand is mentioned</span>
                    <div className={`settings-toggle ${mentionNotifications ? "active" : ""}`} aria-hidden="true">
                      <div className="settings-toggle-knob" />
                    </div>
                  </button>

                  {/* Score Change Notifications */}
                  <button
                    className="settings-toggle-row w-full focus-ring-primary"
                    onClick={() => setScoreChangeNotifications(!scoreChangeNotifications)}
                    disabled={isLoading}
                    role="switch"
                    aria-checked={scoreChangeNotifications}
                    aria-label="Alert when your performance scores change"
                  >
                    <span className="text-xs text-muted-foreground text-left">Score changes<br/>Alert when your performance scores change</span>
                    <div className={`settings-toggle ${scoreChangeNotifications ? "active" : ""}`} aria-hidden="true">
                      <div className="settings-toggle-knob" />
                    </div>
                  </button>

                  {/* Recommendation Notifications */}
                  <button
                    className="settings-toggle-row w-full focus-ring-primary"
                    onClick={() => setRecommendationNotifications(!recommendationNotifications)}
                    disabled={isLoading}
                    role="switch"
                    aria-checked={recommendationNotifications}
                    aria-label="Alert for new optimization suggestions"
                  >
                    <span className="text-xs text-muted-foreground text-left">New recommendations<br/>Alert for new optimization suggestions</span>
                    <div className={`settings-toggle ${recommendationNotifications ? "active" : ""}`} aria-hidden="true">
                      <div className="settings-toggle-knob" />
                    </div>
                  </button>

                  {/* Important Notifications */}
                  <button
                    className="settings-toggle-row w-full focus-ring-primary"
                    onClick={() => setImportantNotifications(!importantNotifications)}
                    disabled={isLoading}
                    role="switch"
                    aria-checked={importantNotifications}
                    aria-label="Critical notifications and system alerts"
                  >
                    <span className="text-xs text-muted-foreground text-left">Important alerts<br/>Critical notifications and system alerts</span>
                    <div className={`settings-toggle ${importantNotifications ? "active" : ""}`} aria-hidden="true">
                      <div className="settings-toggle-knob" />
                    </div>
                  </button>
                </div>

                {/* Info Card */}
                <div className="settings-feature-card">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-lg">ðŸ’¡</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Stay informed</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        We recommend keeping important notifications enabled to stay updated on critical changes to your brand presence.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4 mt-8">
              {saveStatus === "success" && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Check className="w-4 h-4" />
                  <span>Preferences saved successfully</span>
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
                onClick={handleSavePreferences}
                disabled={isSaving || isLoading}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Preferences</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Decorative Star */}
      <DecorativeStar />
    </div>
  );
}
