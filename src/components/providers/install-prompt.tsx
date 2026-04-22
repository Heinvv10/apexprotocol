"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Install app" floating button + iOS Safari manual-install hint.
 *
 * Android / Chrome / Edge: catches the `beforeinstallprompt` event, shows a
 * branded button, and triggers the native install dialog when clicked.
 *
 * iOS Safari: Safari never fires `beforeinstallprompt`, so we detect the
 * user-agent and show a small toast explaining the Share → Add to Home Screen
 * flow instead. Both are dismissible and remember the user's choice in
 * localStorage so we don't nag.
 */

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "apex-install-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const displayMode = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayMode || iosStandalone;
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIos && isSafari;
}

export function InstallPrompt() {
  const [mode, setMode] = useState<"hidden" | "android" | "ios">("hidden");
  const deferredRef = useRef<PromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // storage blocked; continue
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as PromptEvent;
      setMode("android");
    };

    const onInstalled = () => {
      try { localStorage.setItem(DISMISS_KEY, "1"); } catch {
        // ignore
      }
      setMode("hidden");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS fallback — only if no beforeinstallprompt fires within 2s
    let iosTimer: number | null = null;
    if (isIosSafari()) {
      iosTimer = window.setTimeout(() => {
        if (mode === "hidden") setMode("ios");
      }, 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstall = async () => {
    const deferred = deferredRef.current;
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice;
    deferredRef.current = null;
    setMode("hidden");
    if (choice.outcome === "dismissed") {
      try { localStorage.setItem(DISMISS_KEY, "1"); } catch {
        // ignore
      }
    }
  };

  const dismiss = () => {
    setMode("hidden");
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {
      // ignore
    }
  };

  if (mode === "hidden") return null;

  if (mode === "android") {
    return (
      <button
        type="button"
        onClick={handleInstall}
        aria-label="Install Apex app"
        style={{
          position: "fixed",
          right: "calc(16px + env(safe-area-inset-right))",
          bottom: "calc(88px + env(safe-area-inset-bottom))",
          background: "linear-gradient(135deg, #00E5CC 0%, #8B5CF6 100%)",
          color: "#0a0f1a",
          border: "none",
          borderRadius: "9999px",
          padding: "12px 20px",
          font: "600 14px Inter, system-ui, sans-serif",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          boxShadow: "0 10px 28px rgba(0, 229, 204, 0.4)",
          zIndex: 9990,
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M4 21h16" />
        </svg>
        <span>Install app</span>
      </button>
    );
  }

  // iOS Safari manual-install hint
  return (
    <div
      role="dialog"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "16px",
        right: "16px",
        bottom: "calc(16px + env(safe-area-inset-bottom))",
        background: "#141930",
        color: "#f5f6fb",
        padding: "14px 16px",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
        font: "500 14px Inter, system-ui, sans-serif",
        lineHeight: 1.5,
        boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
        zIndex: 9991,
      }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install hint"
        style={{
          float: "right",
          background: "transparent",
          color: "#8a8fa6",
          border: "none",
          fontSize: "20px",
          lineHeight: 1,
          padding: "0 4px",
          cursor: "pointer",
        }}
      >
        ×
      </button>
      Install Apex: tap the <strong style={{ color: "#00E5CC" }}>Share</strong> icon below, then{" "}
      <strong style={{ color: "#00E5CC" }}>Add to Home Screen</strong>.
    </div>
  );
}
