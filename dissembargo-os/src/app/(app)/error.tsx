"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="Error"
      description="Something went wrong while loading this page."
      error={error}
      reset={reset}
    />
  );
}
