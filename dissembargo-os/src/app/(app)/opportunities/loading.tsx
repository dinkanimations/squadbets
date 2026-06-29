import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function OpportunitiesLoading() {
  return (
    <>
      <PageHeader
        title="Opportunities"
        description="Loading opportunities..."
      />
      <Card className="animate-pulse space-y-4 p-6">
        <div className="h-9 w-full max-w-md rounded-lg bg-surface-elevated" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-12 rounded-lg bg-surface-elevated"
            />
          ))}
        </div>
      </Card>
    </>
  );
}
