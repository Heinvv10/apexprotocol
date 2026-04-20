"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { createBrowserClient } from "@/lib/auth/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApexLogoMark, ApexWordmark } from "@/components/ui/apex-logo";

const SignUpSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  acceptTerms: z.literal(true, { message: "Please accept the terms" }),
});

type SignUpValues = z.infer<typeof SignUpSchema>;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.67-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.17v2.84A11 11 0 0 0 12 23Z" fill="#34A853" />
      <path d="M5.85 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.35-2.1V7.07H2.17A11 11 0 0 0 1 12c0 1.77.42 3.45 1.17 4.93l3.68-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.17 7.07l3.68 2.84C6.71 7.3 9.14 5.38 12 5.38Z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.26.73-1.55-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.3-.52-1.48.11-3.08 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.6.24 2.78.12 3.08.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.28 5.69.42.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#00E5CC]/10 blur-[120px]" />
      <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-[#8B5CF6]/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,204,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,204,0.4) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const supabase = createBrowserClient();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { name: "", email: "", password: "", acceptTerms: false as unknown as true },
  });

  async function onSubmit(values: SignUpValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { name: values.name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setServerError(error.message);
        return;
      }
      if (data.user && !data.session) {
        setEmailSent(values.email);
        return;
      }
      router.replace("/onboarding");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function signUpWithProvider(provider: "google" | "github") {
    setServerError(null);
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setServerError(error.message);
      setOauthLoading(null);
    }
  }

  if (emailSent) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4 py-10 overflow-hidden">
        <AmbientBackground />
        <div className="relative w-full max-w-md">
          <div
            className="card-primary rounded-2xl p-8 text-center border border-white/5 shadow-2xl"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(0,229,204,0.08), transparent 55%), #141930",
            }}
          >
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <MailCheck className="size-6" />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to{" "}
              <span className="text-foreground font-medium">{emailSent}</span>. Click the link to
              activate your account.
            </p>
            <Link
              href="/sign-in"
              className="text-primary text-sm hover:text-primary/80 mt-5 inline-block transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4 py-10 overflow-hidden">
      <AmbientBackground />

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <ApexLogoMark size={48} />
          <div className="flex flex-col items-center">
            <ApexWordmark className="text-2xl" />
            <span className="text-xs text-muted-foreground mt-1">AI Visibility Platform</span>
          </div>
        </div>

        <div
          className="card-primary rounded-2xl p-8 shadow-2xl border border-white/5"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(0,229,204,0.08), transparent 55%), radial-gradient(circle at bottom left, rgba(139,92,246,0.05), transparent 55%), #141930",
          }}
        >
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Start tracking your brand across AI search.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10"
              onClick={() => signUpWithProvider("google")}
              disabled={oauthLoading !== null || submitting}
            >
              {oauthLoading === "google" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <GoogleIcon className="size-4" />
              )}
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-10"
              onClick={() => signUpWithProvider("github")}
              disabled={oauthLoading !== null || submitting}
            >
              {oauthLoading === "github" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <GitHubIcon className="size-4" />
              )}
              GitHub
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              or sign up with email
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Jane Doe"
                className="h-10"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="h-10"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="h-10 pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="flex items-start gap-2">
              <input
                id="acceptTerms"
                type="checkbox"
                {...form.register("acceptTerms")}
                className="mt-1 h-4 w-4 rounded border-border/50 bg-input text-primary"
              />
              <Label htmlFor="acceptTerms" className="text-xs text-muted-foreground font-normal leading-5">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:text-primary/80">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:text-primary/80">
                  Privacy Policy
                </Link>
                .
              </Label>
            </div>
            {form.formState.errors.acceptTerms && (
              <p className="text-xs text-destructive">{form.formState.errors.acceptTerms.message}</p>
            )}

            {serverError && (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive"
              >
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full h-10" disabled={submitting || oauthLoading !== null}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </div>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
