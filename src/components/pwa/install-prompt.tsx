"use client";

import * as React from "react";
import { Download, X, Smartphone, Monitor, Share } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptProps {
  className?: string;
}

export function InstallPrompt({ className }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed previously
    const wasDismissed = localStorage.getItem("apex-pwa-dismissed");
    if (wasDismissed) {
      const dismissedAt = parseInt(wasDismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show iOS prompt after a delay
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("apex-pwa-dismissed", Date.now().toString());
  };

  if (isInstalled || dismissed || !showPrompt) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        className
      )}
    >
      <div className="relative p-4 rounded-xl bg-card border border-border shadow-lg">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* App icon */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent-pink flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-white">A</span>
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-base font-semibold text-foreground">
              Install Apex
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 mb-3">
              {isIOS
                ? "Add to your home screen for the best experience"
                : "Install our app for faster access and offline support"}
            </p>

            {isIOS ? (
              <IOSInstallInstructions />
            ) : (
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="grid grid-cols-3 gap-2 text-center">
            <BenefitItem icon={Smartphone} label="Works offline" />
            <BenefitItem icon={Download} label="Faster loading" />
            <BenefitItem icon={Monitor} label="Full screen" />
          </div>
        </div>
      </div>
    </div>
  );
}

function IOSInstallInstructions() {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-muted/20 flex items-center justify-center text-[10px] font-medium">
          1
        </div>
        <span className="flex items-center gap-1">
          Tap <Share className="w-3.5 h-3.5 text-primary" /> Share button
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-muted/20 flex items-center justify-center text-[10px] font-medium">
          2
        </div>
        <span>Scroll and tap "Add to Home Screen"</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-muted/20 flex items-center justify-center text-[10px] font-medium">
          3
        </div>
        <span>Tap "Add" to install</span>
      </div>
    </div>
  );
}

function BenefitItem({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// Compact install button for header
export function InstallButton({ className }: { className?: string }) {
  const [canInstall, setCanInstall] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);

  React.useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  if (!canInstall) return null;

  return (
    <button
      onClick={handleInstall}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
        "bg-primary/10 text-primary text-sm font-medium",
        "hover:bg-primary/20 transition-colors",
        className
      )}
    >
      <Download className="w-4 h-4" />
      Install
    </button>
  );
}

// Hook for checking PWA install status
export function usePWAInstallStatus() {
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [canInstall, setCanInstall] = React.useState(false);

  React.useEffect(() => {
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);

    const handleBeforeInstallPrompt = () => {
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  return { isInstalled, canInstall };
}
