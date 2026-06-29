"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default function OpportunitiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageHeader
        title="Opportunities"
        description="Something went wrong while loading opportunities."
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
