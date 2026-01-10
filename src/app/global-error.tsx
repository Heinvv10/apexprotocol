"use client";

import { FullScreenError } from "@/components/error-boundary";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <FullScreenError error={error} reset={reset} />
      </body>
    </html>
  );
}
