"use client";

import * as React from "react";
import { createContext, useContext, useCallback, useState } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Toast types
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  // Convenience methods
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 5000;

    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Convenience methods
  const success = useCallback(
    (title: string, description?: string) =>
      addToast({ type: "success", title, description }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) =>
      addToast({ type: "error", title, description }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) =>
      addToast({ type: "warning", title, description }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) =>
      addToast({ type: "info", title, description }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast Container
// ðŸŸ¢ WORKING: Added ARIA attributes for accessibility
function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  // Use aria-live='assertive' if any error toast is present, otherwise 'polite'
  const hasErrorToast = toasts.some((toast) => toast.type === "error");
  const ariaLive = hasErrorToast ? "assertive" : "polite";

  return (
    <div
      role="region"
      aria-live={ariaLive}
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// Individual Toast Item
// ðŸŸ¢ WORKING: ARIA attributes for full screen reader accessibility
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isExiting, setIsExiting] = React.useState(false);
  const toastRef = React.useRef<HTMLDivElement>(null);

  const handleClose = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Add Escape key handler for keyboard accessibility
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle Escape key when toast or its children are focused
      if (
        event.key === "Escape" &&
        toastRef.current &&
        toastRef.current.contains(document.activeElement)
      ) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  const config = {
    success: {
      icon: CheckCircle,
      iconColor: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30",
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-error",
      bgColor: "bg-error/10",
      borderColor: "border-error/30",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
    },
    info: {
      icon: Info,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
  }[toast.type];

  const Icon = config.icon;

  // Use role='alert' for errors/warnings (urgent), role='status' for info/success
  const role = toast.type === "error" || toast.type === "warning" ? "alert" : "status";

  // Use aria-live='assertive' for errors, 'polite' for others
  const ariaLive = toast.type === "error" ? "assertive" : "polite";

  // Create descriptive aria-label combining type, title, and description
  const ariaLabel = toast.description
    ? `${toast.type}: ${toast.title}. ${toast.description}`
    : `${toast.type}: ${toast.title}`;

  return (
    <div
      ref={toastRef}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      aria-label={ariaLabel}
      className={cn(
        "pointer-events-auto p-4 rounded-lg border shadow-lg backdrop-blur-sm",
        "transform transition-all duration-200",
        config.bgColor,
        config.borderColor,
        isExiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100 animate-slide-in-right"
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.iconColor)} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{toast.title}</p>
          {toast.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {toast.description}
            </p>
          )}
        </div>

        <button
          onClick={handleClose}
          aria-label="Close notification"
          className={cn(
            "flex-shrink-0 p-1 rounded transition-colors",
            "hover:bg-white/10",
            // Focus indicators for keyboard navigation
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            "focus:ring-primary/50 focus:ring-offset-transparent"
          )}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// Global styles for animation
const ToastStyles = () => (
  <style jsx global>{`
    @keyframes slide-in-right {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in-right {
      animation: slide-in-right 0.2s ease-out;
    }
  `}</style>
);

// Export a standalone Toaster component that can be added to layouts
export function Toaster() {
  return (
    <>
      <ToastStyles />
    </>
  );
}
