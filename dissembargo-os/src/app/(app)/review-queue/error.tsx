"use client";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default function ReviewQueueError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <PageHeader
        title="Review Queue"
        description="Something went wrong while loading the review queue."
      />
      <Card className="p-6">
        <p className="text-sm text-danger">{error.message}</p>
        <Button className="mt-4" onClick={reset}>
          Try again
        </Button>
      </Card>
    </>
  );
}
