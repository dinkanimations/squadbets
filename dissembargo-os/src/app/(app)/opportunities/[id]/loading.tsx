import { Card } from "@/components/ui/Card";

export default function OpportunityDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-40 rounded bg-surface-elevated" />
      <div className="h-8 w-2/3 max-w-lg rounded bg-surface-elevated" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="h-48">
            <span className="sr-only">Loading</span>
          </Card>
          <Card className="h-32">
            <span className="sr-only">Loading</span>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="h-28">
            <span className="sr-only">Loading</span>
          </Card>
          <Card className="h-24">
            <span className="sr-only">Loading</span>
          </Card>
          <Card className="h-48">
            <span className="sr-only">Loading</span>
          </Card>
        </div>
      </div>
    </div>
  );
}
