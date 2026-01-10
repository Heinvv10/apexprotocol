"use client";

import { PageError } from "@/components/error-boundary";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return <PageError error={error} reset={reset} />;
}
