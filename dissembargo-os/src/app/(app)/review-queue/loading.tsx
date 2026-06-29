import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ReviewQueueLoading() {
  return (
    <>
      <PageHeader title="Review Queue" description="Loading review queue..." />
      <Card className="animate-pulse space-y-3 p-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-12 rounded-lg bg-surface-elevated" />
        ))}
      </Card>
    </>
  );
}
