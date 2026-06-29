import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import type { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({
  title,
  description,
  icon,
}: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} icon={icon} />
      <Card className="flex min-h-[320px] items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Coming soon</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            The {title.toLowerCase()} module is part of the Dissembargo OS
            roadmap. Functionality will be added in a future release.
          </p>
        </div>
      </Card>
    </>
  );
}
