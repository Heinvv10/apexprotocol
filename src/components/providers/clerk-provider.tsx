"use client";

import { ClerkProvider as BaseClerkProvider, useUser as useUserBase } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { ReactNode } from "react";
import { useContext, createContext } from "react";

interface ClerkProviderProps {
  children: ReactNode;
}

// Check if Clerk is configured
const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const IS_CLERK_CONFIGURED = !!CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

// Create a context for Clerk availability
const ClerkAvailabilityContext = createContext<{ isAvailable: boolean }>({ isAvailable: IS_CLERK_CONFIGURED });

// Export a safe useUser hook that handles missing Clerk gracefully
export function useUserSafe() {
  const { isAvailable } = useContext(ClerkAvailabilityContext);

  if (!isAvailable) {
    // Return a default value when Clerk is not configured
    return {
      user: null,
      isLoaded: true,
      isSignedIn: false,
    };
  }

  // If Clerk is available, use the real hook
  return useUserBase();
}

// Conditional Clerk provider that handles missing credentials gracefully
export function ClerkProvider({ children }: ClerkProviderProps) {
  // If not configured, provide the children with context indicating Clerk is unavailable
  if (!IS_CLERK_CONFIGURED) {
    return (
      <ClerkAvailabilityContext.Provider value={{ isAvailable: false }}>
        {children}
      </ClerkAvailabilityContext.Provider>
    );
  }

  return (
    <BaseClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      signInForceRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/dashboard"}
      signUpForceRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "/onboarding"}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in"}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up"}
      appearance={{
        baseTheme: dark,
        variables: {
          // Align Clerk UI with Apex design system (dark theme).
          // Clerk's variables API does not accept CSS custom properties, so
          // we mirror the palette values here. Keep in sync with
          // src/styles/themes/brand/apex.css on rebrand.
          colorPrimary: "hsl(var(--color-primary))",        // --palette-cyan-500 — Apex primary
          colorBackground: "hsl(var(--color-surface))",     // --palette-neutral-850 — surface base
          colorInputBackground: "#101828",// --palette-neutral-650 — input surface
          colorInputText: "#FFFFFF",      // --color-foreground
          colorText: "#FFFFFF",           // --color-foreground
          colorTextSecondary: "#94A3B8",  // --color-text-secondary
          colorDanger: "hsl(var(--color-error))",         // --color-error
          colorSuccess: "hsl(var(--color-success))",        // --color-success
          colorWarning: "hsl(var(--color-warning))",        // --color-warning
          borderRadius: "0.75rem",         // --radius base
        },
        elements: {
          // Prefer Tailwind semantic classes so Clerk tracks design-system
          // token changes automatically. Fall back to bg-card / bg-popover
          // for Clerk slots that Tailwind doesn't already style.
          rootBox: "font-sans",
          modalBackdrop: "bg-black/60 backdrop-blur-sm",
          modalContent: "bg-card border border-border/50 shadow-2xl",

          card: "bg-card border border-border/50 shadow-xl",

          userProfile: { root: "bg-popover" },
          userProfileBox: "bg-popover",

          navbar: "bg-popover border-r border-border/50",
          navbarButton: "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          navbarButtonIcon: "text-muted-foreground",
          navbarMobileMenuButton: "text-foreground",

          pageScrollBox: "bg-popover",
          page: "bg-popover",

          headerTitle: "text-foreground font-semibold",
          headerSubtitle: "text-muted-foreground",

          profileSection: "border-b border-border/50",
          profileSectionTitle: "text-foreground font-medium",
          profileSectionTitleText: "text-foreground",
          profileSectionContent: "text-muted-foreground",
          profileSectionPrimaryButton: "text-primary hover:text-primary/80",

          accordionTriggerButton: "text-foreground hover:bg-muted/50",
          accordionContent: "bg-popover",

          formFieldLabel: "text-foreground text-sm font-medium",
          formFieldInput: "bg-input border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary",
          formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
          formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-medium",
          formButtonReset: "text-muted-foreground hover:text-foreground",

          badge: "bg-primary/20 text-primary border-primary/30",

          socialButtonsBlockButton: "bg-muted hover:bg-muted/80 text-foreground border-border/50",
          socialButtonsBlockButtonText: "text-foreground",

          footerActionLink: "text-primary hover:text-primary/80",
          identityPreview: "bg-muted/50 border-border/50",
          identityPreviewText: "text-foreground",
          identityPreviewEditButton: "text-primary hover:text-primary/80",

          alertText: "text-foreground",

          avatarBox: "border-2 border-primary/30",
          avatarImage: "border-0",

          navbarButtonActive: "bg-primary/20 text-primary",

          menuButton: "text-foreground hover:bg-muted/50",
          menuItem: "text-foreground hover:bg-muted/50",
          menuList: "bg-popover border border-border/50",

          scrollBox: "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
        },
      }}
    >
      <ClerkAvailabilityContext.Provider value={{ isAvailable: true }}>
        {children}
      </ClerkAvailabilityContext.Provider>
    </BaseClerkProvider>
  );
}
