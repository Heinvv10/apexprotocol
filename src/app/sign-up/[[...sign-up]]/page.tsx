import { SignUp } from "@clerk/nextjs";

const CLERK_CONFIGURED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

export default function SignUpPage() {
  if (!CLERK_CONFIGURED) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="card-secondary p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Sign Up</h1>
          <p className="text-muted-foreground mb-4">
            Authentication is not configured. Please set up Clerk credentials.
          </p>
          <a href="/dashboard" className="text-primary hover:underline">
            Continue to Dashboard (Dev Mode)
          </a>
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
