"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Key,
  Flag,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Share2,
  Search,
  Network,
  BookOpen,
  Zap,
  ChevronDown,
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
  children?: NavItem[];
}

// System Management Section (existing)
const systemNavItems: NavItem[] = [
  {
    title: "Organizations",
    href: "/admin/organizations",
    icon: Building2,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "API Config",
    href: "/admin/api-config",
    icon: Key,
  },
  {
    title: "Audit Logs",
    href: "/admin/audit-logs",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

// Operations Management Section (Phase 0+)
const operationsNavItems: NavItem[] = [
  {
    title: "CRM",
    href: "/admin/crm",
    icon: TrendingUp,
    children: [
      { title: "Leads", href: "/admin/crm/leads", icon: BookOpen },
      { title: "Accounts", href: "/admin/crm/accounts", icon: Building2 },
      { title: "Pipeline", href: "/admin/crm/pipeline", icon: BarChart3 },
    ],
  },
  {
    title: "Marketing",
    href: "/admin/marketing",
    icon: Zap,
    children: [
      { title: "Campaigns", href: "/admin/marketing/campaigns", icon: Zap },
      { title: "Automation", href: "/admin/marketing/automation", icon: TrendingUp },
      { title: "Email Lists", href: "/admin/marketing/email-management", icon: FileText },
    ],
  },
  {
    title: "Social Media",
    href: "/admin/social-media",
    icon: Share2,
    children: [
      { title: "Channels", href: "/admin/social-media/channels", icon: Share2 },
      { title: "Posting", href: "/admin/social-media/posting", icon: Zap },
      { title: "Analytics", href: "/admin/social-media/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "SEO",
    href: "/admin/seo",
    icon: Search,
  },
  {
    title: "Integrations",
    href: "/admin/integrations",
    icon: Network,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
];

const adminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function AdminSidebar({ collapsed = false, onCollapsedChange }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({});

  const toggleSection = (href: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [href]: !prev[href]
    }));
  };

  const NavLink = ({ item, indent = false }: { item: NavItem; indent?: boolean }) => {
    const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(`${item.href}/`));
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections[item.href];

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
          "text-muted-foreground hover:text-foreground hover:bg-white/5",
          isActive && "text-red-400 bg-red-500/10 hover:bg-red-500/15",
          indent && "ml-4"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400 rounded">
                {item.badge}
              </span>
            )}
          </>
        )}
        {isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r bg-red-500"
            aria-hidden="true"
          />
        )}
      </Link>
    );

    if (hasChildren) {
      const toggleButton = (
        <button
          onClick={() => !collapsed && toggleSection(item.href)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
            "text-muted-foreground hover:text-foreground hover:bg-white/5",
            isActive && "text-red-400 bg-red-500/10 hover:bg-red-500/15"
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">{item.title}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-150",
                  isExpanded && "rotate-180"
                )}
              />
            </>
          )}
        </button>
      );

      if (collapsed) {
        return (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{toggleButton}</TooltipTrigger>
            <TooltipContent side="right" className="glass-tooltip">
              {item.title}
            </TooltipContent>
          </Tooltip>
        );
      }

      return (
        <div>
          {toggleButton}
          {isExpanded && !collapsed && (
            <div className="space-y-1 mt-1">
              {item.children?.map(child => (
                <NavLink key={child.href} item={child} indent />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="glass-tooltip">
            <div className="flex items-center gap-2">
              {item.title}
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400 rounded">
                  {item.badge}
                </span>
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
          "flex flex-col h-screen border-r transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
        style={{
          backgroundColor: "hsl(var(--color-surface))",
          borderColor: "rgba(239, 68, 68, 0.15)",
        }}
      >
        {/* Logo/Brand */}
        <div
          className="flex items-center h-16 px-4 border-b"
          style={{ borderColor: "rgba(239, 68, 68, 0.15)" }}
        >
          <Link href="/admin" className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: "linear-gradient(135deg, hsl(var(--color-error)) 0%, #DC2626 100%)" }}
            >
              <Shield className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-semibold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  Admin
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Back to Dashboard Link */}
        <div className="px-3 py-3">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            {!collapsed && <span>Back to Dashboard</span>}
          </Link>
        </div>

        <Separator className="mx-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)" }} />

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {/* Dashboard */}
            {adminNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}

            {/* Operations Section */}
            {!collapsed && (
              <div className="pt-4">
                <p className="text-xs font-semibold text-muted-foreground px-3 mb-2 uppercase">
                  Operations
                </p>
              </div>
            )}
            {operationsNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}

            {/* System Section */}
            {!collapsed && (
              <div className="pt-4">
                <p className="text-xs font-semibold text-muted-foreground px-3 mb-2 uppercase">
                  System
                </p>
              </div>
            )}
            {systemNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </ScrollArea>

        {/* Super Admin Badge */}
        {!collapsed && (
          <div className="px-3 py-3">
            <div
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <Shield className="h-3.5 w-3.5 text-red-400" />
              <span className="text-red-400">SUPER ADMIN</span>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <div
          className="p-3 border-t"
          style={{ borderColor: "rgba(239, 68, 68, 0.15)" }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className={cn(
              "w-full justify-center transition-all duration-150 ease-in-out hover:bg-white/5",
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
