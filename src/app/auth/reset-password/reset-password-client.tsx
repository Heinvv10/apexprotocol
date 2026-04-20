"use client";


import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const RequestSchema = z.object({ email: z.string().email("Enter a valid email") });
const NewPasswordSchema = z.object({
  password: z.string().min(8, "At least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

type RequestValues = z.infer<typeof RequestSchema>;
type NewPasswordValues = z.infer<typeof NewPasswordSchema>;

function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#00E5CC]/10 blur-[120px]" />
      <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-[#8B5CF6]/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={
          {
            backgroundImage:
              "linear-gradient(rgba(0,229,204,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,204,0.4) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          } satisfies React.CSSProperties
        }
      />
    </div>
  );
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="card-primary rounded-2xl p-8 shadow-2xl border border-white/5"
      style={
        {
          background:
            "radial-gradient(circle at top right, rgba(0,229,204,0.08), transparent 55%), radial-gradient(circle at bottom left, rgba(139,92,246,0.05), transparent 55%), #141930",
        } satisfies React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReset = searchParams.get("type") === "recovery";
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessionReady, setSessionReady] = useState(!isReset);
  // Access token pulled from the #hash on recovery redirects — used directly
  // as a Bearer token against gotrue so we bypass @supabase/ssr's cookie-
  // store which does not pick up implicit-flow hash fragments.
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const supabase = useMemo(() => createBrowserClient(), []);

  // gotrue's /auth/v1/verify redirects here with tokens in the URL hash
  // (#access_token=…&refresh_token=…&type=recovery). Capture them client-
  // side so the submit handler can call /auth/v1/user directly.
  useEffect(() => {
    if (!isReset || typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) { setSessionReady(true); return; }
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    if (accessToken) {
      setRecoveryToken(accessToken);
      // Strip the tokens from the URL so a refresh doesn't re-consume them
      // and so they don't leak into browser history / referer headers.
      window.history.replaceState(null, "", `${window.location.pathname}?type=recovery`);
    }
    setSessionReady(true);
  }, [isReset]);

  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(RequestSchema),
    defaultValues: { email: "" },
  });
  const newPasswordForm = useForm<NewPasswordValues>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  async function requestReset(values: RequestValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/reset-password?type=recovery`,
      });
      if (error) setServerError(error.message);
      else setEmailSent(values.email);
    } finally {
      setSubmitting(false);
    }
  }

  async function setNewPassword(values: NewPasswordValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      // Fall back to a direct gotrue call with the recovery access token when
      // we have one — this bypasses the cookie-backed session that the SSR
      // client can't populate from a URL hash fragment.
      if (recoveryToken) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const res = await fetch(`${url}/auth/v1/user`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${recoveryToken}`,
            apikey: anon ?? "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: values.password }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { msg?: string; error_description?: string };
          setServerError(body.msg ?? body.error_description ?? `Update failed (${res.status})`);
          return;
        }
        router.replace("/sign-in?reset=ok");
        router.refresh();
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        setServerError(error.message);
      } else {
        router.replace("/dashboard");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (emailSent) {
    return (
      <AuthCard>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <MailCheck className="size-6" />
        </div>
        <h1 className="text-xl font-semibold text-foreground text-center mb-2">Check your email</h1>
        <p className="text-sm text-muted-foreground text-center">
          We sent a recovery link to{" "}
          <span className="text-foreground font-medium">{emailSent}</span>. Open the email to continue.
        </p>
        <div className="mt-5 text-center">
          <Link
            href="/sign-in"
            className="text-primary text-sm hover:text-primary/80 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">
          {isReset ? "Set a new password" : "Reset your password"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isReset
            ? "Choose a strong password you haven't used before."
            : "We'll email you a link to reset your password."}
        </p>
      </div>

      {isReset && !sessionReady ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="size-5 animate-spin mr-2" />
          <span className="text-sm">Verifying recovery link…</span>
        </div>
      ) : isReset ? (
        <form onSubmit={newPasswordForm.handleSubmit(setNewPassword)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="h-10 pr-10"
                {...newPasswordForm.register("password")}
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
            {newPasswordForm.formState.errors.password && (
              <p className="text-xs text-destructive">
                {newPasswordForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter password"
                className="h-10 pr-10"
                {...newPasswordForm.register("confirm")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {newPasswordForm.formState.errors.confirm && (
              <p className="text-xs text-destructive">
                {newPasswordForm.formState.errors.confirm.message}
              </p>
            )}
          </div>
          {serverError && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}
          <Button type="submit" className="w-full h-10" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={requestForm.handleSubmit(requestReset)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="h-10"
              {...requestForm.register("email")}
            />
            {requestForm.formState.errors.email && (
              <p className="text-xs text-destructive">{requestForm.formState.errors.email.message}</p>
            )}
          </div>
          {serverError && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}
          <Button type="submit" className="w-full h-10" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordClient() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4 py-10 overflow-hidden">
      <AmbientBackground />
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-6">
          <ApexLogoMark size={48} />
          <div className="flex flex-col items-center">
            <ApexWordmark className="text-2xl" />
            <span className="text-xs text-muted-foreground mt-1">AI Visibility Platform</span>
          </div>
        </div>
        <Suspense
          fallback={
            <div
              className="card-primary rounded-2xl p-8 shadow-2xl border border-white/5 h-48"
              style={
                {
                  background:
                    "radial-gradient(circle at top right, rgba(0,229,204,0.08), transparent 55%), #141930",
                } satisfies React.CSSProperties
              }
            />
          }
        >
          <ResetPasswordForm />
        </Suspense>
        <p className="text-sm text-muted-foreground text-center mt-6">
          Remembered it?{" "}
          <Link
            href="/sign-in"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
