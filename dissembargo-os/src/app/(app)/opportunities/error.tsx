"use client";

import { Inbox } from "lucide-react";
import { RouteError } from "@/components/ui/RouteError";

export default function OpportunitiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="Opportunities"
      description="Something went wrong while loading opportunities."
      error={error}
      reset={reset}
      icon={Inbox}
    />
  );
}
