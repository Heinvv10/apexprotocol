"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Eye,
  PenTool,
  Search,
  Lightbulb,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  MessageSquare,
  Cog,
  Building2,
  Target,
  FolderKanban,
  Share2,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Brands",
    href: "/dashboard/brands",
    icon: Building2,
  },
  {
    title: "Portfolios",
    href: "/dashboard/portfolios",
    icon: FolderKanban,
  },
  {
    title: "Monitor",
    href: "/dashboard/monitor",
    icon: Eye,
    // TODO: Badge count should come from actual monitoring data
  },
  {
    title: "Competitive",
    href: "/dashboard/competitive",
    icon: Target,
  },
  {
    title: "Social",
    href: "/dashboard/social",
    icon: Share2,
  },
  {
    title: "People",
    href: "/dashboard/people",
    icon: Users,
  },
  {
    title: "Engine Room",
    href: "/dashboard/engine-room",
    icon: Cog,
  },
  {
    title: "Feedback",
    href: "/dashboard/feedback",
    icon: MessageSquare,
    // TODO: Badge count should come from unread feedback count
  },
  {
    title: "Create",
    href: "/dashboard/create",
    icon: PenTool,
  },
  {
    title: "Audit",
    href: "/dashboard/audit",
    icon: Search,
  },
  {
    title: "Recommendations",
    href: "/dashboard/recommendations",
    icon: Lightbulb,
    // TODO: Badge count should come from pending recommendations count
  },
];

const secondaryNavItems: NavItem[] = [
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Help",
    href: "/dashboard/help",
    icon: HelpCircle,
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "sidebar-nav-item relative group",
          isActive && "active"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className="badge-primary text-[10px]">{item.badge}</span>
            )}
          </>
        )}
        {isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r bg-primary"
            aria-hidden="true"
          />
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="glass-tooltip">
            <div className="flex items-center gap-2">
              {item.title}
              {item.badge && (
                <span className="badge-primary text-[10px]">{item.badge}</span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex flex-col h-screen border-r border-sidebar-border sidebar-gradient transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Logo/Brand */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-primary">
              <Zap className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-gradient">Apex</span>
            )}
          </Link>
        </div>

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          <Separator className="my-4 bg-sidebar-border" />

          <nav className="space-y-1">
            {secondaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </ScrollArea>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className={cn(
              "w-full justify-center transition-all duration-150 ease-in-out",
              !collapsed && "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
