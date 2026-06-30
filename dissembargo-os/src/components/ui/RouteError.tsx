"use client";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import type { LucideIcon } from "lucide-react";

interface RouteErrorProps {
  title: string;
  description: string;
  error: Error & { digest?: string };
  reset: () => void;
  icon?: LucideIcon;
}

export function RouteError({
  title,
  description,
  error,
  reset,
  icon,
}: RouteErrorProps) {
  return (
    <>
      <PageHeader title={title} description={description} icon={icon} />
      <Card className="p-6">
        <div role="alert">
        <p className="text-sm text-danger">
          {error.message || "Something went wrong. Please try again."}
        </p>
        <Button className="mt-4" onClick={reset}>
          Try again
        </Button>
        </div>
      </Card>
    </>
  );
}
