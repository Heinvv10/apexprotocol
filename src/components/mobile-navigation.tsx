"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Lightbulb,
  BarChart2,
  Settings,
  User,
  Menu,
  X,
  ChevronRight,
  Monitor,
  FileText,
  Zap,
  Target,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Bottom navigation items (5 icons)
const bottomNavItems = [
  { id: "home", label: "Home", icon: Home, href: "/dashboard" },
  { id: "recommendations", label: "Recs", icon: Lightbulb, href: "/dashboard/recommendations" },
  { id: "score", label: "Score", icon: BarChart2, href: "/dashboard/monitor" },
  { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
  { id: "profile", label: "Profile", icon: User, href: "/dashboard/profile" },
];

// Sidebar menu items for mobile
const sidebarMenuItems = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "Portfolios", icon: FolderKanban, href: "/dashboard/portfolios" },
  { label: "Monitor", icon: Monitor, href: "/dashboard/monitor" },
  { label: "Competitive", icon: Target, href: "/dashboard/competitive" },
  { label: "Create", icon: FileText, href: "/dashboard/create" },
  { label: "Engine Room", icon: Zap, href: "/dashboard/engine-room" },
  { label: "Recommendations", icon: Lightbulb, href: "/dashboard/recommendations" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

// Bottom Navigation Bar
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0D1A]/95 backdrop-blur-lg border-t border-white/10 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-full min-h-[44px] min-w-[44px]",
                "transition-colors duration-150",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Mobile Hamburger Menu Trigger
export function MobileMenuTrigger({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="lg:hidden flex items-center justify-center w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg hover:bg-white/5 transition-colors"
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      {isOpen ? (
        <X className="w-5 h-5 text-foreground" />
      ) : (
        <Menu className="w-5 h-5 text-foreground" />
      )}
    </button>
  );
}

// Mobile Sidebar Drawer
export function MobileSidebarDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  // Close on route change
  React.useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[#0A0D1A] border-r border-white/10",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="apex-logo-icon w-8 h-8">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradMobile)" />
                <defs>
                  <linearGradient id="apexGradMobile" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E5CC"/>
                    <stop offset="1" stopColor="#8B5CF6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              APEX
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-1">
          {sidebarMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg min-h-[44px]",
                  "transition-colors duration-150",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
              </Link>
            );
          })}
        </nav>

        {/* Footer - TODO: Integrate with Clerk user data */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Not signed in</p>
              <p className="text-xs text-muted-foreground truncate">Sign in to continue</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Mobile Header
export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 bg-[#0A0D1A]/95 backdrop-blur-lg border-b border-white/10 safe-area-pt">
        <div className="flex items-center justify-between px-4 h-14">
          <MobileMenuTrigger
            isOpen={isMenuOpen}
            onToggle={() => setIsMenuOpen(!isMenuOpen)}
          />

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="apex-logo-icon w-6 h-6">
              <svg viewBox="0 0 32 32" fill="none">
                <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradHeader)" />
                <defs>
                  <linearGradient id="apexGradHeader" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E5CC"/>
                    <stop offset="1" stopColor="#8B5CF6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              APEX
            </span>
          </div>

          {/* AI Status */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-[10px] text-muted-foreground">AI Active</span>
          </div>
        </div>
      </header>

      <MobileSidebarDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}

// Swipeable card wrapper for recommendations
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
}: SwipeableCardProps) {
  const [startX, setStartX] = React.useState(0);
  const [offsetX, setOffsetX] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);

  const threshold = 80; // Minimum swipe distance

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - startX;
    // Limit the swipe distance
    setOffsetX(Math.max(-150, Math.min(150, diff)));
  };

  const handleTouchEnd = () => {
    if (Math.abs(offsetX) > threshold) {
      if (offsetX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (offsetX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    setOffsetX(0);
    setIsSwiping(false);
  };

  return (
    <div
      className={cn("relative touch-pan-y", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicators */}
      {offsetX > threshold / 2 && (
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-success/20 rounded-l-lg flex items-center justify-center">
          <span className="text-success text-lg">✓</span>
        </div>
      )}
      {offsetX < -threshold / 2 && (
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-error/20 rounded-r-lg flex items-center justify-center">
          <span className="text-error text-lg">✕</span>
        </div>
      )}

      {/* Card content */}
      <div
        className="transition-transform duration-75"
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Bottom sheet for action menus
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-50",
          "bg-[#0A0D1A] rounded-t-2xl border-t border-white/10",
          "transform transition-transform duration-300 ease-out",
          "max-h-[80vh] overflow-y-auto",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-4 pb-3 border-b border-white/10">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div className="p-4 pb-safe">{children}</div>
      </div>
    </>
  );
}
