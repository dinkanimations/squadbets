"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en" className="dark h-full">
      <body className="flex min-h-full items-center justify-center bg-background p-6 text-foreground">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted">
            An unexpected error occurred. Please try again or return to the
            dashboard.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <Link href="/">
              <Button variant="secondary">Go to dashboard</Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
