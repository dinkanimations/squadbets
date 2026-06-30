"use client";

import { ClipboardCheck } from "lucide-react";
import { RouteError } from "@/components/ui/RouteError";

export default function ReviewQueueError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="Needs Review"
      description="Something went wrong while loading the needs review queue."
      error={error}
      reset={reset}
      icon={ClipboardCheck}
    />
  );
}
