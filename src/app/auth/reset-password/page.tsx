"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBrowserClient } from "@/lib/auth/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RequestSchema = z.object({ email: z.string().email("Enter a valid email") });
const NewPasswordSchema = z.object({
  password: z.string().min(8, "At least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

type RequestValues = z.infer<typeof RequestSchema>;
type NewPasswordValues = z.infer<typeof NewPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReset = searchParams.get("type") === "recovery";
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const supabase = createBrowserClient();

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
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/reset-password?type=recovery`,
    });
    if (error) setServerError(error.message);
    else setEmailSent(values.email);
  }

  async function setNewPassword(values: NewPasswordValues) {
    setServerError(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError(error.message);
    } else {
      router.replace("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-md card-primary rounded-2xl p-8 shadow-2xl">
      <h1 className="text-2xl font-semibold text-foreground mb-2">
        {isReset ? "Set a new password" : "Reset your password"}
      </h1>

      {emailSent ? (
        <p className="text-sm text-muted-foreground">
          We sent a recovery link to <span className="text-foreground">{emailSent}</span>.
          Open the email to continue.
        </p>
      ) : isReset ? (
        <form onSubmit={newPasswordForm.handleSubmit(setNewPassword)} className="space-y-4 mt-4">
          <div className="space-y-1">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...newPasswordForm.register("password")} />
            {newPasswordForm.formState.errors.password && (
              <p className="text-xs text-destructive">{newPasswordForm.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" autoComplete="new-password" {...newPasswordForm.register("confirm")} />
            {newPasswordForm.formState.errors.confirm && (
              <p className="text-xs text-destructive">{newPasswordForm.formState.errors.confirm.message}</p>
            )}
          </div>
          {serverError && <div className="text-sm text-destructive">{serverError}</div>}
          <Button type="submit" className="w-full">Update password</Button>
        </form>
      ) : (
        <form onSubmit={requestForm.handleSubmit(requestReset)} className="space-y-4 mt-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...requestForm.register("email")} />
            {requestForm.formState.errors.email && (
              <p className="text-xs text-destructive">{requestForm.formState.errors.email.message}</p>
            )}
          </div>
          {serverError && <div className="text-sm text-destructive">{serverError}</div>}
          <Button type="submit" className="w-full">Send reset link</Button>
          <p className="text-sm text-muted-foreground text-center">
            <Link href="/sign-in" className="text-primary hover:text-primary/80">Back to sign in</Link>
          </p>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4">
      <Suspense fallback={<div className="w-full max-w-md card-primary rounded-2xl p-8 shadow-2xl h-48" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
