"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
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
        baseTheme: undefined,
        variables: {
          colorPrimary: "#4926FA",
          colorBackground: "#02030F",
          colorInputBackground: "#0E1558",
          colorInputText: "#FAFAFA",
          colorText: "#FAFAFA",
          colorTextSecondary: "#A09DA2",
        },
        elements: {
          card: "bg-card border border-border",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "bg-muted hover:bg-muted/80 text-foreground",
          formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
          footerActionLink: "text-primary hover:text-primary/80",
        },
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}
