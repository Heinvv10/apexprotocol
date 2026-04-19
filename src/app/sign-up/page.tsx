"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBrowserClient } from "@/lib/auth/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SignUpSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  acceptTerms: z.literal(true, { message: "Please accept the terms" }),
});

type SignUpValues = z.infer<typeof SignUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setServerError(error.message);
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4">
        <div className="w-full max-w-md card-primary rounded-2xl p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <span className="text-foreground">{emailSent}</span>.
            Click the link to activate your account.
          </p>
          <Link href="/sign-in" className="text-primary text-sm hover:text-primary/80 mt-4 inline-block">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4">
      <div
        className="w-full max-w-md card-primary rounded-2xl p-8 shadow-2xl"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(0,229,204,0.06), transparent 60%), #141930",
        }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start tracking your brand in AI search.</p>
        </div>

        <div className="space-y-3 mb-5">
          <Button type="button" variant="outline" className="w-full" onClick={() => signUpWithProvider("google")}>
            Continue with Google
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => signUpWithProvider("github")}>
            Continue with GitHub
          </Button>
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or sign up with email</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
            {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
          </div>
          <div className="flex items-start gap-2">
            <input
              id="acceptTerms"
              type="checkbox"
              {...form.register("acceptTerms")}
              className="mt-1 h-4 w-4 rounded border-border/50 bg-input text-primary"
            />
            <Label htmlFor="acceptTerms" className="text-xs text-muted-foreground font-normal">
              I agree to the <Link href="/terms" className="text-primary">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="text-primary">Privacy Policy</Link>.
            </Label>
          </div>
          {form.formState.errors.acceptTerms && (
            <p className="text-xs text-destructive">{form.formState.errors.acceptTerms.message}</p>
          )}

          {serverError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:text-primary/80">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
