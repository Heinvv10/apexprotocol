"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Unlink,
  RefreshCw,
  CalendarDays,
  Shield,
} from "lucide-react";
import type { ConnectedAccount } from "@/hooks/useSocial";

interface ChannelSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: ConnectedAccount | null;
  onDisconnect: (platform: string) => Promise<boolean>;
  onReconnect: (platform: string) => void;
}

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case "twitter":
      return <Twitter className="h-6 w-6" />;
    case "linkedin":
      return <Linkedin className="h-6 w-6" />;
    case "instagram":
      return <Instagram className="h-6 w-6" />;
    case "youtube":
      return <Youtube className="h-6 w-6" />;
    case "facebook":
      return <Facebook className="h-6 w-6" />;
    case "tiktok":
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      );
    default:
      return <ExternalLink className="h-6 w-6" />;
  }
};

const getPlatformColor = (platform: string) => {
  const colors: Record<string, string> = {
    twitter: "bg-blue-500/10 text-blue-400",
    linkedin: "bg-cyan-500/10 text-cyan-400",
    instagram: "bg-pink-500/10 text-pink-400",
    youtube: "bg-red-500/10 text-red-400",
    facebook: "bg-indigo-500/10 text-indigo-400",
    tiktok: "bg-purple-500/10 text-purple-400",
  };
  return colors[platform] || "bg-gray-500/10 text-gray-400";
};

const getStatusInfo = (status: string | null) => {
  switch (status) {
    case "active":
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-400" />,
        label: "Active",
        description: "Connection is healthy and working",
        className: "bg-green-500/10 text-green-400",
      };
    case "expired":
      return {
        icon: <Clock className="h-4 w-4 text-yellow-400" />,
        label: "Expired",
        description: "Token has expired, please reconnect",
        className: "bg-yellow-500/10 text-yellow-400",
      };
    case "revoked":
      return {
        icon: <Unlink className="h-4 w-4 text-red-400" />,
        label: "Revoked",
        description: "Access was revoked, please reconnect",
        className: "bg-red-500/10 text-red-400",
      };
    case "error":
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-400" />,
        label: "Error",
        description: "There was an error with this connection",
        className: "bg-red-500/10 text-red-400",
      };
    case "pending":
      return {
        icon: <Clock className="h-4 w-4 text-blue-400" />,
        label: "Pending",
        description: "Connection is being established",
        className: "bg-blue-500/10 text-blue-400",
      };
    default:
      return {
        icon: <AlertCircle className="h-4 w-4 text-gray-400" />,
        label: "Unknown",
        description: "Status unknown",
        className: "bg-gray-500/10 text-gray-400",
      };
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function ChannelSettingsModal({
  open,
  onOpenChange,
  account,
  onDisconnect,
  onReconnect,
}: ChannelSettingsModalProps) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  if (!account) return null;

  const statusInfo = getStatusInfo(account.connectionStatus);
  const platformName = account.platformInfo?.displayName || account.platform;
  const needsReconnect = account.connectionStatus === "expired" || account.connectionStatus === "revoked" || account.connectionStatus === "error";

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const success = await onDisconnect(account.platform);
      if (success) {
        setShowDisconnectConfirm(false);
        onOpenChange(false);
      }
    } finally {
      setDisconnecting(false);
    }
  };

  const handleReconnect = () => {
    onReconnect(account.platform);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getPlatformColor(account.platform)}`}>
                {getPlatformIcon(account.platform)}
              </div>
              <div>
                <span>{platformName} Settings</span>
                {account.accountHandle && (
                  <p className="text-sm font-normal text-muted-foreground">
                    {account.accountHandle}
                  </p>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              Manage your {platformName} connection settings and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Account Info */}
            <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
              <h4 className="text-sm font-medium text-white">Account Information</h4>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Account Name</p>
                  <p className="text-white font-medium">{account.accountName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Handle</p>
                  <p className="text-white font-medium">{account.accountHandle || "N/A"}</p>
                </div>
              </div>

              {account.profileUrl && (
                <a
                  href={account.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Profile
                </a>
              )}
            </div>

            {/* Connection Status */}
            <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
              <h4 className="text-sm font-medium text-white">Connection Status</h4>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {statusInfo.icon}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{statusInfo.description}</p>

              {account.lastError && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">{account.lastError}</p>
                  {account.lastErrorAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Error occurred: {formatDate(account.lastErrorAt)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Connection Details */}
            <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
              <h4 className="text-sm font-medium text-white">Connection Details</h4>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>Connected: {formatDate(account.createdAt)}</span>
                </div>
                {account.expiresAt && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Expires: {formatDate(account.expiresAt)}</span>
                  </div>
                )}
                {account.scopes && account.scopes.length > 0 && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4 mt-0.5" />
                    <div>
                      <span>Permissions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {account.scopes.slice(0, 5).map((scope) => (
                          <span
                            key={scope}
                            className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs"
                          >
                            {scope.split(".").pop() || scope}
                          </span>
                        ))}
                        {account.scopes.length > 5 && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 text-xs">
                            +{account.scopes.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {needsReconnect ? (
              <Button
                onClick={handleReconnect}
                className="bg-gradient-to-r from-[#00E5CC] to-[#8B5CF6] hover:opacity-90"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reconnect Account
              </Button>
            ) : (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setShowDisconnectConfirm(true)}
            >
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectConfirm} onOpenChange={setShowDisconnectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {platformName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke access to your {platformName} account. You will no longer
              be able to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Post content to this account</li>
                <li>View analytics for this account</li>
                <li>Schedule posts for this account</li>
              </ul>
              <p className="mt-2">You can always reconnect later.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="bg-red-500 hover:bg-red-600"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
