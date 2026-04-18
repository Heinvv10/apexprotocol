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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useConnectedAccounts, type ConnectedAccount } from "@/hooks/useSocial";
import {
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  Share2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// Platform configuration
const platformConfig: Record<string, {
  name: string;
  icon: React.ReactNode;
  color: string;
  charLimit: number;
  supportsText: boolean;
  requiresMedia: boolean;
}> = {
  linkedin: {
    name: "LinkedIn",
    icon: <Linkedin className="h-5 w-5" />,
    color: "bg-[#0A66C2]/10 text-[#0A66C2]",
    charLimit: 3000,
    supportsText: true,
    requiresMedia: false,
  },
  twitter: {
    name: "Twitter/X",
    icon: <Twitter className="h-5 w-5" />,
    color: "bg-[#1DA1F2]/10 text-[#1DA1F2]",
    charLimit: 280,
    supportsText: true,
    requiresMedia: false,
  },
  instagram: {
    name: "Instagram",
    icon: <Instagram className="h-5 w-5" />,
    color: "bg-[#E4405F]/10 text-[#E4405F]",
    charLimit: 2200,
    supportsText: true,
    requiresMedia: true,
  },
  facebook: {
    name: "Facebook",
    icon: <Facebook className="h-5 w-5" />,
    color: "bg-[#1877F2]/10 text-[#1877F2]",
    charLimit: 63206,
    supportsText: true,
    requiresMedia: false,
  },
  youtube: {
    name: "YouTube",
    icon: <Youtube className="h-5 w-5" />,
    color: "bg-[#FF0000]/10 text-[#FF0000]",
    charLimit: 5000,
    supportsText: false,
    requiresMedia: true,
  },
  tiktok: {
    name: "TikTok",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
    color: "bg-purple-500/10 text-purple-400",
    charLimit: 2200,
    supportsText: false,
    requiresMedia: true,
  },
};

interface PublishResult {
  success: boolean;
  platform: string;
  platformPostId?: string;
  postUrl?: string;
  error?: string;
}

interface PublishToSocialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string | null;
  initialContent?: string;
  contentTitle?: string;
  link?: string;
  onPublishComplete?: (results: Record<string, PublishResult>) => void;
}

export function PublishToSocialModal({
  open,
  onOpenChange,
  brandId,
  initialContent = "",
  contentTitle,
  link,
  onPublishComplete,
}: PublishToSocialModalProps) {
  const [content, setContent] = useState(initialContent);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<Record<string, PublishResult> | null>(null);

  // Fetch connected accounts
  const {
    connectedAccounts,
    isLoading,
  } = useConnectedAccounts(brandId);

  // Filter to only active accounts that support text posts
  const availableAccounts = connectedAccounts.filter(
    (account) =>
      account.connectionStatus === "active" &&
      platformConfig[account.platform]?.supportsText
  );

  // Toggle platform selection
  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  // Get character count status
  const getCharStatus = (platform: string) => {
    const config = platformConfig[platform];
    if (!config) return { ok: true, count: content.length };
    const ok = content.length <= config.charLimit;
    return { ok, count: content.length, limit: config.charLimit };
  };

  // Check if can publish
  const canPublish =
    content.trim().length > 0 &&
    selectedPlatforms.length > 0 &&
    selectedPlatforms.every((p) => getCharStatus(p).ok);

  // Handle publish
  const handlePublish = async () => {
    if (!brandId || !canPublish) return;

    setPublishing(true);
    setResults(null);

    try {
      const response = await fetch("/api/social/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId,
          platforms: selectedPlatforms,
          content: {
            text: content,
            link: link,
            linkTitle: contentTitle,
          },
        }),
      });

      const data = await response.json();

      if (data.results) {
        setResults(data.results);

        // Count successes
        const successCount = Object.values(data.results as Record<string, PublishResult>).filter(
          (r) => r.success
        ).length;
        const failCount = selectedPlatforms.length - successCount;

        if (successCount > 0 && failCount === 0) {
          toast.success(`Published to ${successCount} platform(s)`, {
            description: "Your content is now live!",
          });
        } else if (successCount > 0) {
          toast.warning(`Published to ${successCount}, failed on ${failCount}`, {
            description: "Some platforms had errors.",
          });
        } else {
          toast.error("Publishing failed", {
            description: "Could not publish to any platform.",
          });
        }

        onPublishComplete?.(data.results);
      } else if (data.error) {
        toast.error("Publishing failed", {
          description: data.error,
        });
      }
    } catch (error) {
      toast.error("Publishing failed", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setPublishing(false);
    }
  };

  // Reset state when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setContent(initialContent);
      setSelectedPlatforms([]);
      setResults(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Share2 className="h-5 w-5 text-cyan-400" />
            Publish to Social Media
          </DialogTitle>
          <DialogDescription>
            Share your content across connected social media platforms.
          </DialogDescription>
        </DialogHeader>

        {/* Results View */}
        {results && (
          <div className="space-y-4 py-4">
            <h4 className="text-sm font-medium text-white">Publishing Results</h4>
            <div className="space-y-2">
              {Object.entries(results).map(([platform, result]) => {
                const config = platformConfig[platform];
                return (
                  <div
                    key={platform}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-red-500/10 border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config?.color || "bg-gray-500/10"}`}>
                          {config?.icon || <Share2 className="h-4 w-4" />}
                        </div>
                        <span className="font-medium text-white">
                          {config?.name || platform}
                        </span>
                      </div>
                      {result.success ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          {result.postUrl && (
                            <a
                              href={result.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-400" />
                          <span className="text-xs text-red-400">{result.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}

        {/* Publishing Form */}
        {!results && (
          <>
            <div className="space-y-4 py-4">
              {/* Content Editor */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Content</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What would you like to share?"
                  className="min-h-[120px] bg-background/50 border-border/50"
                />
                {contentTitle && (
                  <p className="text-xs text-muted-foreground">
                    Sharing: <span className="text-cyan-400">{contentTitle}</span>
                  </p>
                )}
              </div>

              {/* Platform Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Select Platforms
                </label>
                {isLoading ? (
                  <div className="flex items-center gap-2 p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Loading connected accounts...
                    </span>
                  </div>
                ) : availableAccounts.length === 0 ? (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">No connected accounts available</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connect social accounts in Channels to publish content.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableAccounts.map((account) => {
                      const config = platformConfig[account.platform];
                      const isSelected = selectedPlatforms.includes(account.platform);
                      const charStatus = getCharStatus(account.platform);

                      return (
                        <div
                          key={account.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "border-cyan-500 bg-cyan-500/10"
                              : "border-border/50 hover:border-border"
                          }`}
                          onClick={() => togglePlatform(account.platform)}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => togglePlatform(account.platform)}
                            />
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config?.color || "bg-gray-500/10"}`}>
                              {config?.icon || <Share2 className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {config?.name || account.platform}
                              </p>
                              {account.accountHandle && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {account.accountHandle}
                                </p>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="mt-2 text-xs">
                              <span
                                className={
                                  charStatus.ok ? "text-muted-foreground" : "text-red-400"
                                }
                              >
                                {charStatus.count}/{charStatus.limit} characters
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={publishing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!canPublish || publishing}
                className="bg-gradient-to-r from-primary to-accent-purple hover:opacity-90"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish to {selectedPlatforms.length || "Selected"} Platform
                    {selectedPlatforms.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
