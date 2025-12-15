"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthLayout, AuthLogo } from "./auth-layout";

interface SignUpFormProps {
  className?: string;
  onSubmit?: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  socialProviders?: Array<{
    id: string;
    name: string;
    icon: React.ReactNode;
  }>;
}

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export function SignUpForm({ className, onSubmit, socialProviders }: SignUpFormProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [showPasswordRequirements, setShowPasswordRequirements] = React.useState(false);

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string } = {};

    if (!name) {
      newErrors.name = "Name is required";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    const failedRequirements = passwordRequirements.filter((req) => !req.test(password));
    if (failedRequirements.length > 0) {
      newErrors.password = "Please meet all password requirements";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit?.({ name, email, password });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = React.useMemo(() => {
    const passed = passwordRequirements.filter((req) => req.test(password)).length;
    return (passed / passwordRequirements.length) * 100;
  }, [password]);

  return (
    <AuthLayout className={className}>
      <div className="card-primary p-8">
        {/* Logo */}
        <AuthLogo className="mb-8" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name field */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className={cn(
                  "w-full h-11 pl-10 pr-4 rounded-lg",
                  "bg-muted/50 border text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                  "transition-all duration-150",
                  errors.name ? "border-error" : "border-border"
                )}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-error">{errors.name}</p>
            )}
          </div>

          {/* Email field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Work Email
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
                  errors.email ? "border-error" : "border-border"
                )}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-error">{errors.email}</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordRequirements(true)}
                placeholder="Create a strong password"
                className={cn(
                  "w-full h-11 pl-10 pr-11 rounded-lg",
                  "bg-muted/50 border text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                  "transition-all duration-150",
                  errors.password ? "border-error" : "border-border"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password strength indicator */}
            {showPasswordRequirements && password.length > 0 && (
              <div className="space-y-3 pt-2">
                {/* Strength bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      passwordStrength < 50
                        ? "bg-error"
                        : passwordStrength < 100
                          ? "bg-warning"
                          : "bg-success"
                    )}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>

                {/* Requirements checklist */}
                <div className="grid grid-cols-2 gap-1.5">
                  {passwordRequirements.map((req) => {
                    const passed = req.test(password);
                    return (
                      <div
                        key={req.label}
                        className={cn(
                          "flex items-center gap-1.5 text-xs transition-colors",
                          passed ? "text-success" : "text-muted-foreground"
                        )}
                      >
                        <Check
                          className={cn(
                            "w-3 h-3",
                            passed ? "opacity-100" : "opacity-30"
                          )}
                        />
                        {req.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {errors.password && (
              <p className="text-xs text-error">{errors.password}</p>
            )}
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 w-4 h-4 rounded border-border bg-muted/50 text-primary focus:ring-primary/50"
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground">
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
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
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Social providers */}
        {socialProviders && socialProviders.length > 0 && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  Or sign up with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {socialProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className={cn(
                    "h-11 rounded-lg font-medium",
                    "bg-muted/50 border border-border text-foreground",
                    "hover:bg-muted/80 active:bg-muted",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    "transition-all duration-150",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {provider.icon}
                  <span className="text-sm">{provider.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Sign in link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
