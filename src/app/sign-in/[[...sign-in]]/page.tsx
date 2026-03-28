"use client";

import dynamic from "next/dynamic";
import { Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";

const SignIn = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.SignIn),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
);

export default function SignInPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center mb-8">
        <Link href="/" className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl gradient-primary shadow-lg shadow-primary/25">
            <Zap className="h-7 w-7 text-white" />
          </div>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-gradient">ApexGEO</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI Visibility Platform</p>
      </div>

      <div className="card-secondary overflow-hidden">
        <SignIn
          forceRedirectUrl="/dashboard"
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
