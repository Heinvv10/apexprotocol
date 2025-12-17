"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Share2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Settings,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { useSelectedBrand } from "@/stores";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
interface OAuthConnection {
  platform: string;
  isConnected: boolean;
  accountId?: string;
  accountName?: string;
  accountHandle?: string;
  profileUrl?: string;
  avatarUrl?: string;
  connectedAt?: string;
  expiresAt?: string | null;
  status: string;
  needsReconnect: boolean;
  displayName: string;
  color: string;
  isImplemented: boolean;
  connectionInfo: {
    title: string;
    description: string;
    requiredPermissions: string[];
  };
}

interface ConnectionsResponse {
  brandId: string;
  connections: OAuthConnection[];
  summary: {
    total: number;
    connected: number;
    needsReconnect: number;
    implemented: number;
  };
}

// Platform icon component
const PlatformIcon = ({ platform, size = "md" }: { platform: string; size?: "sm" | "md" | "lg" }) => {
  const colors: Record<string, string> = {
    linkedin: "bg-[#0A66C2]",
    twitter: "bg-black",
    facebook: "bg-[#1877F2]",
    instagram: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
    youtube: "bg-[#FF0000]",
    tiktok: "bg-black",
  };

  const initials: Record<string, string> = {
    linkedin: "in",
    twitter: "X",
    facebook: "f",
    instagram: "ig",
    youtube: "yt",
    tiktok: "tt",
  };

  const sizes = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-14 h-14 text-sm",
  };

  return (
    <div
      className={`${sizes[size]} rounded-lg flex items-center justify-center text-white font-bold ${colors[platform] || "bg-muted"}`}
    >
      {initials[platform] || platform.charAt(0).toUpperCase()}
    </div>
  );
};

// Hook to fetch connections
function useConnections(brandId: string) {
  return useQuery({
    queryKey: ["social", "connections", brandId],
    queryFn: async (): Promise<ConnectionsResponse> => {
      const res = await fetch(`/api/social/connections?brandId=${brandId}`);
      if (!res.ok) throw new Error("Failed to fetch connections");
      return res.json();
    },
    enabled: !!brandId,
    staleTime: 30 * 1000,
  });
}

// Hook to disconnect a platform
function useDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ brandId, platform }: { brandId: string; platform: string }) => {
      const res = await fetch(`/api/social/connections?brandId=${brandId}&platform=${platform}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["social", "connections", variables.brandId] });
    },
  });
}

// Connection Status Badge
function StatusBadge({ status, needsReconnect }: { status: string; needsReconnect: boolean }) {
  if (needsReconnect) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
        <AlertTriangle className="w-3 h-3" />
        Reconnect
      </span>
    );
  }

  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
        <CheckCircle2 className="w-3 h-3" />
        Connected
      </span>
    );
  }

  if (status === "error" || status === "revoked") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">
        <XCircle className="w-3 h-3" />
        Error
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground">
      Not Connected
    </span>
  );
}

// Connection Card
function ConnectionCard({
  connection,
  brandId,
  onConnect,
  onDisconnect,
}: {
  connection: OAuthConnection;
  brandId: string;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const { isConnected, accountHandle, accountName, profileUrl, displayName, isImplemented, connectionInfo, needsReconnect } =
    connection;

  return (
    <div className={`card-secondary p-5 ${!isImplemented ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-4">
        <PlatformIcon platform={connection.platform} size="lg" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-foreground">{displayName}</h3>
            <StatusBadge status={connection.status} needsReconnect={needsReconnect} />
          </div>

          {isConnected && accountHandle ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">@{accountHandle}</span>
                {profileUrl && (
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                {needsReconnect ? (
                  <button
                    onClick={onConnect}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-sm font-medium hover:bg-warning/20 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reconnect
                  </button>
                ) : (
                  <button
                    onClick={onDisconnect}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 text-error text-sm font-medium hover:bg-error/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{connectionInfo.description}</p>
              {isImplemented ? (
                <button
                  onClick={onConnect}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Connect {displayName}
                </button>
              ) : (
                <span className="text-xs text-muted-foreground/70">Coming soon</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// OAuth Status Toast (shows when redirected back from OAuth)
function OAuthStatusToast() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = React.useState(false);

  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const platform = searchParams.get("platform");
  const account = searchParams.get("account");
  const message = searchParams.get("message");

  React.useEffect(() => {
    if (success || error) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (!visible) return null;

  if (success === "true") {
    return (
      <div className="fixed top-4 right-4 z-50 p-4 rounded-lg bg-success/20 border border-success/30 text-success flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300">
        <CheckCircle2 className="w-5 h-5" />
        <div>
          <p className="font-medium">Successfully connected!</p>
          <p className="text-sm opacity-80">
            {platform} account {account ? `@${account}` : ""} is now linked.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed top-4 right-4 z-50 p-4 rounded-lg bg-error/20 border border-error/30 text-error flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300">
        <XCircle className="w-5 h-5" />
        <div>
          <p className="font-medium">Connection failed</p>
          <p className="text-sm opacity-80">{message || `Failed to connect ${platform || "account"}`}</p>
        </div>
      </div>
    );
  }

  return null;
}

// Main Page
export default function SocialSettingsPage() {
  const selectedBrand = useSelectedBrand();
  const brandId = selectedBrand?.id || "";

  const { data, isLoading, error, refetch } = useConnections(brandId);
  const disconnect = useDisconnect();

  const handleConnect = (platform: string) => {
    // Redirect to OAuth initiation endpoint
    window.location.href = `/api/oauth/${platform}?brandId=${brandId}`;
  };

  const handleDisconnect = (platform: string) => {
    if (confirm(`Are you sure you want to disconnect ${platform}?`)) {
      disconnect.mutate({ brandId, platform });
    }
  };

  // No brand selected
  if (!selectedBrand) {
    return (
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
        <div className="flex-1 flex items-center justify-center min-h-[500px]">
          <div className="text-center max-w-md space-y-4">
            <Share2 className="w-16 h-16 text-primary/40 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Select a Brand</h2>
            <p className="text-muted-foreground">
              Choose a brand from the header dropdown to manage social connections.
            </p>
            <Link
              href="/dashboard/brands"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 font-medium hover:bg-primary/20 transition-all"
            >
              Manage Brands
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
        <div className="flex-1 flex items-center justify-center min-h-[500px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
        <div className="flex-1 flex items-center justify-center min-h-[500px]">
          <div className="text-center max-w-md space-y-4">
            <XCircle className="w-16 h-16 text-error/40 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Failed to Load</h2>
            <p className="text-muted-foreground">{(error as Error).message}</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const connections = data?.connections || [];
  const summary = data?.summary || { total: 0, connected: 0, needsReconnect: 0, implemented: 0 };

  return (
    <div className="space-y-6">
      <OAuthStatusToast />

      {/* Back Link */}
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      {/* Header */}
      <div className="card-primary p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-1">Social Media Connections</h1>
            <p className="text-muted-foreground">
              Connect your social media accounts to monitor brand presence and engagement.
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{summary.connected}</div>
            <div className="text-sm text-muted-foreground">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{summary.needsReconnect}</div>
            <div className="text-sm text-muted-foreground">Need Attention</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">{summary.implemented}</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </div>
        </div>
      </div>

      {/* Connection Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Platform Connections
        </h2>

        <div className="grid gap-4">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.platform}
              connection={connection}
              brandId={brandId}
              onConnect={() => handleConnect(connection.platform)}
              onDisconnect={() => handleDisconnect(connection.platform)}
            />
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="card-tertiary p-6">
        <h3 className="text-sm font-medium text-foreground mb-2">Need Help?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Learn how to set up social media integrations and get the most out of Apex social monitoring.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://docs.apex.io/social-integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View Documentation
          </a>
          <a
            href="mailto:support@apex.io"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
