"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { Bell, Search, User, LogOut, CreditCard, Users } from "lucide-react";

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
import { ThemeToggle } from "./theme-toggle";
import { BrandSelector } from "./brand-selector";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Dashboard" }: HeaderProps) {
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();
  const { signOut, openUserProfile } = useClerk();
  const { user } = useUser();

  // Prevent hydration mismatch for dropdowns
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const handleProfile = () => {
    openUserProfile();
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 header-gradient">
      {/* Left side - Brand Selector and Page title */}
      <div className="flex items-center gap-4">
        <BrandSelector />
        <div className="h-6 w-px bg-border hidden sm:block" />
        <h1 className="text-xl font-semibold hidden sm:block">{title}</h1>
      </div>

      {/* Center - Search (optional, can be hidden on certain pages) */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg"
              >
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-tooltip">
              <DropdownMenuLabel>
                {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "My Account"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings/billing")} className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings/team")} className="cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                Team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-error cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" disabled>
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <span className="sr-only">User menu</span>
          </Button>
        )}
      </div>
    </header>
  );
}
