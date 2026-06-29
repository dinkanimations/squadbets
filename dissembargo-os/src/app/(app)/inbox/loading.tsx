import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function InboxLoading() {
  return (
    <>
      <PageHeader title="Inbox" description="Loading emails..." />
      <Card className="animate-pulse space-y-3 p-0">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-20 border-b border-border px-6 py-4 last:border-b-0"
          >
            <div className="h-4 w-1/3 rounded bg-surface-elevated" />
            <div className="mt-2 h-4 w-2/3 rounded bg-surface-elevated" />
          </div>
        ))}
      </Card>
    </>
  );
}
