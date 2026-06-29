"use client";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default function InboxError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <PageHeader
        title="Inbox"
        description="Something went wrong while loading your inbox."
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
