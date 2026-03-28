"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConnectedAccounts, type ConnectedAccount } from "@/hooks/useSocial";
import { useSelectedBrand } from "@/stores/brand-store";
import { ConnectChannelModal } from "@/components/social/connect-channel-modal";
import { ChannelSettingsModal } from "@/components/social/channel-settings-modal";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  Share2,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

// Platform configuration
const platformConfig: Record<string, {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}> = {
  linkedin: {
    name: "LinkedIn",
    icon: <Linkedin className="h-6 w-6" />,
    color: "bg-[#0A66C2]/10 text-[#0A66C2]",
    description: "Company pages and personal profiles",
  },
  twitter: {
    name: "Twitter/X",
    icon: <Twitter className="h-6 w-6" />,
    color: "bg-[#1DA1F2]/10 text-[#1DA1F2]",
    description: "Business and personal accounts",
  },
  instagram: {
    name: "Instagram",
    icon: <Instagram className="h-6 w-6" />,
    color: "bg-[#E4405F]/10 text-[#E4405F]",
    description: "Business and creator accounts",
  },
  facebook: {
    name: "Facebook",
    icon: <Facebook className="h-6 w-6" />,
    color: "bg-[#1877F2]/10 text-[#1877F2]",
    description: "Pages and business accounts",
  },
  youtube: {
    name: "YouTube",
    icon: <Youtube className="h-6 w-6" />,
    color: "bg-[#FF0000]/10 text-[#FF0000]",
    description: "Channels and brand accounts",
  },
  tiktok: {
    name: "TikTok",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
    color: "bg-purple-500/10 text-purple-400",
    description: "Business accounts",
  },
};

// All supported platforms
const supportedPlatforms = ["linkedin", "twitter", "instagram", "facebook", "youtube", "tiktok"];

function CustomerChannelsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedBrand = useSelectedBrand();
  const [searchQuery, setSearchQuery] = useState("");
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null);

  // Fetch connected OAuth accounts
  const {
    connectedAccounts,
    isLoading,
    isError,
    error,
    isPlatformConnected,
    getAccountForPlatform,
    disconnect,
    mutate: refreshConnectedAccounts,
  } = useConnectedAccounts(selectedBrand?.id ?? null);

  // Handle OAuth callback success/error messages from URL
  useEffect(() => {
    const success = searchParams.get("success");
    const errorMsg = searchParams.get("error");
    const platform = searchParams.get("platform");
    const account = searchParams.get("account");

    if (success === "connected" && platform) {
      toast.success(`Successfully connected ${platform}${account ? ` as ${account}` : ""}`, {
        description: "Your account is now ready for posting and analytics.",
      });
      router.replace("/dashboard/social/channels");
      refreshConnectedAccounts();
    } else if (errorMsg) {
      toast.error("Connection failed", {
        description: errorMsg,
      });
      router.replace("/dashboard/social/channels");
    }
  }, [searchParams, router, refreshConnectedAccounts]);

  // Handle opening settings modal for a channel
  const handleOpenSettings = (platform: string) => {
    const account = getAccountForPlatform(platform);
    if (account) {
      setSelectedAccount(account);
      setSettingsModalOpen(true);
    }
  };

  // Handle disconnecting an account
  const handleDisconnect = async (platform: string): Promise<boolean> => {
    const success = await disconnect(platform);
    if (success) {
      toast.success(`Disconnected ${platform} account`, {
        description: "The account has been removed from your connected channels.",
      });
    } else {
      toast.error(`Failed to disconnect ${platform}`, {
        description: "Please try again or contact support.",
      });
    }
    return success;
  };

  // Handle reconnecting an account
  const handleReconnect = (platform: string) => {
    setSettingsModalOpen(false);
    setConnectModalOpen(true);
  };

  // Filter platforms by search query
  const filteredPlatforms = supportedPlatforms.filter((platform) => {
    if (!searchQuery) return true;
    const config = platformConfig[platform];
    return (
      platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Get connection status badge
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        );
      case "expired":
        return (
          <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Expired
          </span>
        );
      case "revoked":
      case "error":
        return (
          <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </span>
        );
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Social Channels</h1>
          <p className="text-muted-foreground mt-1">
            Connect and manage your social media accounts
          </p>
        </div>
        <Button
          onClick={() => setConnectModalOpen(true)}
          className="bg-gradient-to-r from-[#00E5CC] to-[#8B5CF6] hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Connect Channel
        </Button>
      </div>

      {/* Connect Channel Modal */}
      <ConnectChannelModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        brandId={selectedBrand?.id ?? null}
        returnUrl="/dashboard/social/channels"
      />

      {/* Channel Settings Modal */}
      <ChannelSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        account={selectedAccount}
        onDisconnect={handleDisconnect}
        onReconnect={handleReconnect}
        onUpdate={() => refreshConnectedAccounts()}
      />

      {/* Error State */}
      {isError && (
        <div className="card-secondary p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load channels</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || "An error occurred while fetching your connected channels"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="card-secondary p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            <p className="ml-3 text-muted-foreground">Loading channels...</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Connected Channels</p>
              <p className="text-2xl font-bold text-white mt-1">
                {connectedAccounts.filter((a) => a.connectionStatus === "active").length}
              </p>
            </div>
            <Share2 className="h-5 w-5 text-cyan-400" />
          </div>
        </div>
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Platforms</p>
              <p className="text-2xl font-bold text-white mt-1">{supportedPlatforms.length}</p>
            </div>
            <ExternalLink className="h-5 w-5 text-purple-400" />
          </div>
        </div>
        <div className="card-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Need Attention</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">
                {
                  connectedAccounts.filter(
                    (a) =>
                      a.connectionStatus === "expired" ||
                      a.connectionStatus === "revoked" ||
                      a.connectionStatus === "error"
                  ).length
                }
              </p>
            </div>
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card-secondary p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search platforms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 border-border/50"
          />
        </div>
      </div>

      {/* Connected Channels */}
      {connectedAccounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Connected Channels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedAccounts.map((account) => {
              const config = platformConfig[account.platform] || {
                name: account.platform,
                icon: <Share2 className="h-6 w-6" />,
                color: "bg-gray-500/10 text-gray-400",
                description: "",
              };

              return (
                <div
                  key={account.id}
                  className="card-tertiary p-4 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-12 w-12 rounded-lg flex items-center justify-center ${config.color}`}
                        >
                          {config.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{config.name}</h3>
                          {account.accountHandle && (
                            <p className="text-sm text-muted-foreground">
                              {account.accountHandle}
                            </p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(account.connectionStatus)}
                    </div>

                    {/* Account Info */}
                    <div className="p-3 rounded-lg bg-background/30 border border-border/50 space-y-2">
                      {account.accountName && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Account: </span>
                          <span className="text-white">{account.accountName}</span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-muted-foreground">Connected: </span>
                        <span className="text-white">{formatDate(account.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {(account.connectionStatus === "expired" ||
                        account.connectionStatus === "revoked" ||
                        account.connectionStatus === "error") && (
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-[#00E5CC] to-[#8B5CF6] hover:opacity-90"
                          onClick={() => handleReconnect(account.platform)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reconnect
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          account.connectionStatus === "active" ? "flex-1" : ""
                        }
                        onClick={() => handleOpenSettings(account.platform)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Platforms */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          {connectedAccounts.length > 0 ? "Add More Channels" : "Available Platforms"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlatforms
            .filter((platform) => !isPlatformConnected(platform))
            .map((platform) => {
              const config = platformConfig[platform];

              return (
                <div
                  key={platform}
                  className="card-tertiary p-4 hover:border-cyan-500/50 transition-colors cursor-pointer"
                  onClick={() => setConnectModalOpen(true)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-12 w-12 rounded-lg flex items-center justify-center ${config.color}`}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{config.name}</h3>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Empty State */}
      {filteredPlatforms.length === 0 && (
        <div className="card-secondary p-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No platforms found</h3>
          <p className="text-muted-foreground">Try a different search term</p>
        </div>
      )}
    </div>
  );
}

import { Suspense } from 'react';
export default function CustomerChannelsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <CustomerChannelsPageInner />
    </Suspense>
  );
}
