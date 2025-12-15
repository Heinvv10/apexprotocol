"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Settings,
  BellOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Notification types
type NotificationType = "success" | "warning" | "info" | "alert" | "insight";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  href?: string;
  icon?: React.ElementType;
}

// Export interface for API integration
export type { Notification };

interface NotificationsBellProps {
  initialNotifications?: Notification[];
}

export function NotificationsBell({ initialNotifications }: NotificationsBellProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  // TODO: Fetch notifications from API endpoint
  // const { data: notificationsData } = useQuery(['notifications'], fetchNotifications);
  const [notifications, setNotifications] = React.useState<Notification[]>(initialNotifications || []); // Empty array - no mock data
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getTypeStyles = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "text-success bg-success/10";
      case "warning":
        return "text-warning bg-warning/10";
      case "alert":
        return "text-error bg-error/10";
      case "insight":
        return "text-primary bg-primary/10";
      default:
        return "text-muted-foreground bg-muted/10";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg transition-colors",
          isOpen
            ? "bg-white/10 text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="w-5 h-5" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-error rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium text-primary bg-primary/10 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <BellOff className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notification.icon || Bell;
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "relative group",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    <Link
                      href={notification.href || "#"}
                      onClick={() => {
                        markAsRead(notification.id);
                        setIsOpen(false);
                      }}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                          getTypeStyles(notification.type)
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm font-medium line-clamp-1",
                              notification.read
                                ? "text-foreground/80"
                                : "text-foreground"
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground/60" />
                          <span className="text-[10px] text-muted-foreground/60">
                            {notification.timestamp}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Actions on hover */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between">
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Notification settings
            </Link>
            <Link
              href="/dashboard/feedback"
              onClick={() => setIsOpen(false)}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Notification toast for real-time updates
export function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const Icon = notification.icon || Bell;

  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div className="flex items-start gap-3 p-4 bg-card border border-border/50 rounded-xl shadow-2xl max-w-sm">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            notification.type === "success" && "bg-success/10 text-success",
            notification.type === "warning" && "bg-warning/10 text-warning",
            notification.type === "alert" && "bg-error/10 text-error",
            notification.type === "insight" && "bg-primary/10 text-primary",
            notification.type === "info" && "bg-muted/10 text-muted-foreground"
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {notification.message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
