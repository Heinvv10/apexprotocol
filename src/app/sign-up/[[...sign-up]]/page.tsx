"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Dynamically import SignUp to avoid build-time errors when Clerk is not configured
const SignUp = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.SignUp),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="card-secondary p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Dev Mode</h1>
          <p className="text-muted-foreground mb-4">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-card border border-border shadow-lg",
              headerTitle: "text-2xl font-bold text-foreground",
              headerSubtitle: "text-muted-foreground",
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-primary-foreground font-medium",
              formFieldInput:
                "bg-muted border-border text-foreground placeholder:text-muted-foreground",
              formFieldLabel: "text-foreground",
              footerActionLink: "text-primary hover:text-primary/80",
              identityPreviewEditButton: "text-primary hover:text-primary/80",
              formResendCodeLink: "text-primary hover:text-primary/80",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
