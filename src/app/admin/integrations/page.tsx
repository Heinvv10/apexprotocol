"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ArrowLeft,
  Linkedin,
  RefreshCw
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
interface LinkedInOAuthStatus {
  isConnected: boolean;
  accountInfo: {
    accountId: string;
    accountName: string;
    accountEmail?: string;
    profileUrl?: string;
  } | null;
  connectedAt?: string;
  connectedBy?: string;
  expiresAt?: string;
  isExpired?: boolean;
  needsReconnect?: boolean;
}

// Hook to fetch LinkedIn OAuth status
function useLinkedInOAuth() {
  return useQuery({
    queryKey: ["settings", "oauth", "linkedin"],
    queryFn: async (): Promise<LinkedInOAuthStatus> => {
      const res = await fetch("/api/settings/oauth/linkedin");
      if (!res.ok) throw new Error("Failed to fetch LinkedIn OAuth status");
      return res.json();
    },
  });
}

// Page Header
function PageHeader() {
  return (
    <div className="flex items-center gap-4 mb-8">
      <Link
        href="/admin"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin</span>
      </Link>
    </div>
  );
}

// LinkedIn OAuth Card
function LinkedInOAuthCard({ status }: { status: LinkedInOAuthStatus }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/oauth/linkedin", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to disconnect LinkedIn");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "oauth", "linkedin"] });
    },
  });

  const handleConnect = () => {
    // Redirect to LinkedIn OAuth authorize endpoint
    window.location.href = "/api/settings/oauth/linkedin/authorize";
  };

  const handleDisconnect = () => {
    if (confirm("Are you sure you want to disconnect LinkedIn? This will stop automatic people enrichment.")) {
      disconnectMutation.mutate();
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white font-bold">
            <Linkedin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">LinkedIn</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your LinkedIn profile to automatically enrich people data across all brands
            </p>

            {status.isConnected && status.accountInfo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Connected as {status.accountInfo.accountName}</span>
                </div>
                {status.accountInfo.accountEmail && (
                  <div className="text-sm text-muted-foreground">
                    {status.accountInfo.accountEmail}
                  </div>
                )}
                {status.accountInfo.profileUrl && (
                  <a
                    href={status.accountInfo.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    View Profile
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {status.connectedAt && (
                  <div className="text-xs text-muted-foreground">
                    Connected: {new Date(status.connectedAt).toLocaleDateString()}
                  </div>
                )}
                {status.expiresAt && (
                  <div className="text-xs text-muted-foreground">
                    Expires: {new Date(status.expiresAt).toLocaleDateString()}
                  </div>
                )}
                {status.needsReconnect && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Connection expired - please reconnect</span>
                  </div>
                )}
              </div>
            )}

            {!status.isConnected && (
              <div className="text-sm text-muted-foreground">
                Not connected. Click "Connect LinkedIn" to enable automatic people enrichment.
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {status.isConnected ? (
            <>
              {status.needsReconnect && (
                <button
                  onClick={handleConnect}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reconnect
                </button>
              )}
              <button
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {disconnectMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Disconnect
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-[#0A66C2] text-white rounded-md hover:bg-[#0A66C2]/90 transition-colors flex items-center gap-2"
            >
              <Linkedin className="w-4 h-4" />
              Connect LinkedIn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Component that uses useSearchParams
function IntegrationsContent() {
  const searchParams = useSearchParams();
  const { data: linkedInStatus, isLoading, error } = useLinkedInOAuth();

  // Handle OAuth callback messages
  React.useEffect(() => {
    const oauthSuccess = searchParams.get("oauth_success");
    const oauthError = searchParams.get("oauth_error");

    if (oauthSuccess === "linkedin_connected") {
      // Show success message (you can use a toast notification here)
      console.log("LinkedIn connected successfully!");
    }

    if (oauthError) {
      // Show error message
      console.error("OAuth error:", oauthError);
    }
  }, [searchParams]);

  return (
    <>
      <PageHeader />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-muted-foreground">
          Connect external services to enhance Apex functionality
        </p>
      </div>

      {/* OAuth Success/Error Messages */}
      {searchParams.get("oauth_success") && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
          <CheckCircle2 className="w-5 h-5" />
          <span>LinkedIn connected successfully!</span>
        </div>
      )}

      {searchParams.get("oauth_error") && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <XCircle className="w-5 h-5" />
          <span>Error connecting LinkedIn: {searchParams.get("oauth_error")}</span>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">OAuth Connections</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Global OAuth connections used system-wide for data enrichment
          </p>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              Failed to load LinkedIn OAuth status
            </div>
          )}

          {linkedInStatus && <LinkedInOAuthCard status={linkedInStatus} />}
        </div>
      </div>
    </>
  );
}

// Main Page Component
export default function IntegrationsSettingsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <IntegrationsContent />
      </Suspense>
    </div>
  );
}
