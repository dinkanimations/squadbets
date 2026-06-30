"use client";

import { Mail } from "lucide-react";
import { RouteError } from "@/components/ui/RouteError";

export default function InboxError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="Inbox"
      description="Something went wrong while loading your inbox."
      error={error}
      reset={reset}
      icon={Mail}
    />
  );
}
