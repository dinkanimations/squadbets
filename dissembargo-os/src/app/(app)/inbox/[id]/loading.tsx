import { Card } from "@/components/ui/Card";

export default function InboxDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-32 rounded bg-surface-elevated" />
      <div className="h-8 w-2/3 max-w-xl rounded bg-surface-elevated" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-64 lg:col-span-2">
          <span className="sr-only">Loading</span>
        </Card>
        <Card className="h-48">
          <span className="sr-only">Loading</span>
        </Card>
      </div>
    </div>
  );
}
