"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/auth/supabase-browser";
import { useAuthStore } from "@/stores/auth";
import { Bell, Search, User, LogOut, Shield, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({ title = "Admin Dashboard" }: AdminHeaderProps) {
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();
  
  // Safe Clerk hooks usage (handles when Clerk is not configured)
  let signOut: (() => Promise<void>) | undefined;
  let openUserProfile: (() => void) | undefined;
  let user: any = null;

  try {
    const supabase = createBrowserClient();
    const userData = useUser();
    signOut = supabase.auth.signOut;
    openUserProfile = () => { window.location.href = "/settings"; };
    user = userData.user;
  } catch (error) {
    // Clerk not configured - use dev mode defaults
    console.warn("[AdminHeader] Clerk not configured, using dev mode");
  }

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
    }
    router.push("/sign-in");
  };

  const handleProfile = () => {
    if (openUserProfile) {
      openUserProfile();
    }
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between h-16 px-6"
      style={{
        backgroundColor: "hsl(var(--color-surface))",
        borderBottom: "1px solid rgba(239, 68, 68, 0.15)",
      }}
    >
      {/* Left side - Admin badge and page title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "hsl(var(--color-error))",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <Shield className="h-3 w-3" />
            ADMIN MODE
          </span>
        </div>
        <div className="h-6 w-px bg-border/30 hidden sm:block" />
        <h1 className="text-xl font-semibold text-foreground hidden sm:block">{title}</h1>
      </div>

      {/* Center - Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search organizations, users..."
            className="w-full pl-10 bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-red-500/50"
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Back to Dashboard */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg hover:bg-white/5">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Menu */}
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-white/5"
              >
                <div
                  className="flex items-center justify-center h-7 w-7 rounded-full"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    color: "hsl(var(--color-error))",
                  }}
                >
                  <User className="h-4 w-4" />
                </div>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Super Admin"}</span>
                  <span className="text-xs font-normal text-muted-foreground">Super Administrator</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer">
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" disabled>
            <div
              className="flex items-center justify-center h-7 w-7 rounded-full"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "hsl(var(--color-error))",
              }}
            >
              <User className="h-4 w-4" />
            </div>
            <span className="sr-only">User menu</span>
          </Button>
        )}
      </div>
    </header>
  );
}
