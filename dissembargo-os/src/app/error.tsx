"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          {process.env.NEXT_PUBLIC_DISABLE_AUTH !== "true" ? (
            <Link href="/login">
              <Button variant="secondary">Sign in</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
