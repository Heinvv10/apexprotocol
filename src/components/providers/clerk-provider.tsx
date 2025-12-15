"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { ReactNode } from "react";

interface ClerkProviderProps {
  children: ReactNode;
}

// Check if Clerk is configured
const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const IS_CLERK_CONFIGURED = !!CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

// Conditional Clerk provider that handles missing credentials gracefully
export function ClerkProvider({ children }: ClerkProviderProps) {
  // If not configured, just render children without Clerk
  if (!IS_CLERK_CONFIGURED) {
    return <>{children}</>;
  }

  return (
    <BaseClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#4926FA",
          colorBackground: "#0d1224",
          colorInputBackground: "#0E1558",
          colorInputText: "#FAFAFA",
          colorText: "#FAFAFA",
          colorTextSecondary: "#A09DA2",
          colorDanger: "#D4292A",
          colorSuccess: "#17CA29",
          colorWarning: "#FFB020",
          borderRadius: "0.5rem",
        },
        elements: {
          // Root modal container
          rootBox: "font-sans",
          modalBackdrop: "bg-black/60 backdrop-blur-sm",
          modalContent: "bg-[#0d1224] border border-border/50 shadow-2xl",

          // Card styling
          card: "bg-[#0d1224] border border-border/50 shadow-xl",

          // User profile specific
          userProfile: {
            root: "bg-[#0d1224]",
          },
          userProfileBox: "bg-[#0d1224]",

          // Navigation
          navbar: "bg-[#0d1224] border-r border-border/50",
          navbarButton: "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          navbarButtonIcon: "text-muted-foreground",
          navbarMobileMenuButton: "text-foreground",

          // Page content
          pageScrollBox: "bg-[#0d1224]",
          page: "bg-[#0d1224]",

          // Headers
          headerTitle: "text-foreground font-semibold",
          headerSubtitle: "text-muted-foreground",

          // Profile section
          profileSection: "border-b border-border/50",
          profileSectionTitle: "text-foreground font-medium",
          profileSectionTitleText: "text-foreground",
          profileSectionContent: "text-muted-foreground",
          profileSectionPrimaryButton: "text-primary hover:text-primary/80",

          // Accordion/sections
          accordionTriggerButton: "text-foreground hover:bg-muted/50",
          accordionContent: "bg-[#0d1224]",

          // Form elements
          formFieldLabel: "text-foreground text-sm font-medium",
          formFieldInput: "bg-[#0E1558] border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary",
          formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
          formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-medium",
          formButtonReset: "text-muted-foreground hover:text-foreground",

          // Badges and tags
          badge: "bg-primary/20 text-primary border-primary/30",

          // Social buttons
          socialButtonsBlockButton: "bg-muted hover:bg-muted/80 text-foreground border-border/50",
          socialButtonsBlockButtonText: "text-foreground",

          // Actions and links
          footerActionLink: "text-primary hover:text-primary/80",
          identityPreview: "bg-muted/50 border-border/50",
          identityPreviewText: "text-foreground",
          identityPreviewEditButton: "text-primary hover:text-primary/80",

          // Alerts
          alertText: "text-foreground",

          // Avatar
          avatarBox: "border-2 border-primary/30",
          avatarImage: "border-0",

          // Active states
          navbarButtonActive: "bg-primary/20 text-primary",

          // Menu items
          menuButton: "text-foreground hover:bg-muted/50",
          menuItem: "text-foreground hover:bg-muted/50",
          menuList: "bg-[#0d1224] border border-border/50",

          // Scrollbar
          scrollBox: "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
        },
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}
