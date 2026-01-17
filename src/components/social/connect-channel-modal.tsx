"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  ExternalLink,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  available: boolean;
  comingSoon?: boolean;
}

const platforms: Platform[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin className="h-6 w-6" />,
    color: "text-[#0A66C2]",
    bgColor: "bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20",
    description: "Personal profiles and company pages",
    available: true,
  },
  {
    id: "twitter",
    name: "Twitter/X",
    icon: <Twitter className="h-6 w-6" />,
    color: "text-[#1DA1F2]",
    bgColor: "bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20",
    description: "Personal and business accounts",
    available: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="h-6 w-6" />,
    color: "text-[#E4405F]",
    bgColor: "bg-[#E4405F]/10 hover:bg-[#E4405F]/20",
    description: "Business and creator accounts",
    available: true,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook className="h-6 w-6" />,
    color: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]/10 hover:bg-[#1877F2]/20",
    description: "Pages and business accounts",
    available: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: <Youtube className="h-6 w-6" />,
    color: "text-[#FF0000]",
    bgColor: "bg-[#FF0000]/10 hover:bg-[#FF0000]/20",
    description: "Channels and brand accounts",
    available: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
    color: "text-white",
    bgColor: "bg-black/20 hover:bg-black/30",
    description: "Business accounts",
    available: true,
  },
];

interface ConnectChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string | null;
  returnUrl?: string;
}

export function ConnectChannelModal({
  open,
  onOpenChange,
  brandId,
  returnUrl = "/admin/social-media/channels",
}: ConnectChannelModalProps) {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (platformId: string) => {
    const platform = platforms.find((p) => p.id === platformId);
    if (!platform?.available) return;

    if (!brandId) {
      setError("Please select a brand first");
      return;
    }

    setSelectedPlatform(platformId);
    setConnecting(true);
    setError(null);

    try {
      // Call the OAuth initialization API
      const response = await fetch("/api/social/oauth/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: platformId,
          brandId,
          returnUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate connection");
      }

      if (data.authUrl) {
        // Redirect to OAuth authorization page
        window.location.href = data.authUrl;
      } else if (data.message) {
        // Show success message and close modal
        setConnecting(false);
        onOpenChange(false);
        // Refresh the page to show the new channel
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setConnecting(false);
      setSelectedPlatform(null);
    }
  };

  const handleClose = () => {
    if (!connecting) {
      setSelectedPlatform(null);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white">Connect a Social Channel</DialogTitle>
          <DialogDescription>
            Select a platform to connect your social media account. You&apos;ll be
            redirected to authorize Apex to manage your posts and analytics.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 py-4">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handleConnect(platform.id)}
              disabled={!platform.available || connecting}
              className={`
                relative p-4 rounded-lg border border-border/50 transition-all
                ${platform.bgColor}
                ${!platform.available ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                ${selectedPlatform === platform.id && connecting ? "ring-2 ring-cyan-500" : ""}
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={platform.color}>
                  {selectedPlatform === platform.id && connecting ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    platform.icon
                  )}
                </div>
                <span className="font-medium text-white">{platform.name}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {platform.description}
                </span>
              </div>
              {platform.comingSoon && (
                <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-500/20 text-purple-400">
                  Coming Soon
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
            <span>
              We only request permissions needed to post and view analytics. We never
              post without your explicit approval.
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <ExternalLink className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              You can disconnect any channel at any time from the channel settings.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={connecting}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
