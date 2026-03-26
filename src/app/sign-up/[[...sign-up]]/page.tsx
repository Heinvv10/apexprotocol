"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

// Dynamically import SignUp to avoid build-time errors when Clerk is not configured
const SignUp = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.SignUp),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
);

export default function SignUpPage() {
  const router = useRouter();
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

  // Auto-redirect to dashboard in dev mode without Clerk
  useEffect(() => {
    if (!hasClerk) {
      router.replace("/dashboard");
    }
  }, [hasClerk, router]);

  if (!hasClerk) {
    return (
      <AuthLayout>
        <div className="card-secondary p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Dev Mode</h1>
          <p className="text-muted-foreground mb-4">
            Redirecting to dashboard...
          </p>
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Logo/Brand Header */}
      <div className="flex flex-col items-center mb-8">
        <Link href="/" className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl gradient-primary shadow-lg shadow-primary/25">
            <Zap className="h-7 w-7 text-white" />
          </div>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-gradient">Apex</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI Visibility Platform</p>
      </div>

      {/* Sign Up Form */}
      <div className="card-secondary overflow-hidden">
        <SignUp
          forceRedirectUrl="/onboarding"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-transparent shadow-none p-0 gap-6",
              header: "gap-1 pb-0",
              headerTitle: "text-xl font-semibold text-foreground",
              headerSubtitle: "text-sm text-muted-foreground",
              socialButtons: "gap-2",
              socialButtonsBlockButton:
                "bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/30 text-foreground transition-all duration-150",
              socialButtonsBlockButtonText: "font-medium",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground text-xs",
              formFieldLabel: "text-sm font-medium text-foreground",
              formFieldInput:
                "bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-lg h-11",
              formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11 rounded-lg transition-all duration-150 shadow-lg shadow-primary/25",
              footerAction: "pt-4",
              footerActionText: "text-muted-foreground text-sm",
              footerActionLink: "text-primary hover:text-primary/80 font-medium",
              identityPreviewEditButton: "text-primary hover:text-primary/80",
              formResendCodeLink: "text-primary hover:text-primary/80",
              alert: "bg-error/10 border-error/30 text-error",
              alertText: "text-error",
              formFieldErrorText: "text-error text-xs",
              formFieldSuccessText: "text-success text-xs",
              // Hide Clerk branding in dev mode
              footer: "hidden",
            },
            layout: {
              socialButtonsPlacement: "top",
              showOptionalFields: true,
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>

      {/* Footer Links */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
