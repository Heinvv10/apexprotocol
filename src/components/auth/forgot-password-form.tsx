"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthLayout, AuthLogo } from "./auth-layout";

interface ForgotPasswordFormProps {
  className?: string;
  onSubmit?: (email: string) => Promise<void>;
}

export function ForgotPasswordForm({ className, onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");

  const validateEmail = () => {
    if (!email) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      await onSubmit?.(email);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout className={className}>
        <div className="card-primary p-8 text-center">
          {/* Success icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-2">
            Check your email
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a password reset link to{" "}
            <span className="text-foreground font-medium">{email}</span>
          </p>

          <button
            onClick={() => setIsSubmitted(false)}
            className={cn(
              "w-full h-11 rounded-lg font-medium",
              "bg-muted/50 border border-border text-foreground",
              "hover:bg-muted/80 active:bg-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              "transition-all duration-150",
              "flex items-center justify-center gap-2"
            )}
          >
            Resend email
          </button>

          <Link
            href="/sign-in"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout className={className}>
      <div className="card-primary p-8">
        {/* Logo */}
        <AuthLogo className="mb-6" />

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Forgot your password?
          </h2>
          <p className="text-sm text-muted-foreground">
            No worries, we&apos;ll send you reset instructions.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={cn(
                  "w-full h-11 pl-10 pr-4 rounded-lg",
                  "bg-muted/50 border text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                  "transition-all duration-150",
                  error ? "border-error" : "border-border"
                )}
              />
            </div>
            {error && (
              <p className="text-xs text-error">{error}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full h-11 rounded-lg font-medium",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:bg-primary/80",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
              "transition-all duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Reset password"
            )}
          </button>
        </form>

        {/* Back to sign in */}
        <div className="mt-6 text-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
