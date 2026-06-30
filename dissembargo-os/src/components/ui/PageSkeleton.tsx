import { Card } from "@/components/ui/Card";

export function SkeletonBar({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-surface-elevated ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2" aria-hidden="true">
      <SkeletonBar className="h-8 w-48" />
      <SkeletonBar className="h-4 w-96 max-w-full" />
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse space-y-3 p-6">
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="h-8 w-16" />
          <SkeletonBar className="h-3 w-32" />
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card className="animate-pulse overflow-hidden p-0" aria-hidden="true">
      <div className="border-b border-border px-6 py-4">
        <div className="flex gap-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBar key={index} className="h-4 w-20" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-8 border-b border-border px-6 py-4 last:border-b-0"
        >
          <SkeletonBar className="h-4 w-40" />
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="h-4 w-20" />
          <SkeletonBar className="h-4 w-16" />
        </div>
      ))}
    </Card>
  );
}

export function CardListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <Card className="animate-pulse space-y-4 p-6" aria-hidden="true">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <SkeletonBar className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBar className="h-4 w-2/3" />
            <SkeletonBar className="h-3 w-1/3" />
          </div>
          <SkeletonBar className="h-4 w-16" />
        </div>
      ))}
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={8} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CardListSkeleton />
        <CardListSkeleton />
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="animate-pulse space-y-4 p-6 lg:col-span-2" aria-hidden="true">
          <SkeletonBar className="h-6 w-1/2" />
          <SkeletonBar className="h-4 w-full" />
          <SkeletonBar className="h-4 w-5/6" />
          <SkeletonBar className="h-4 w-4/6" />
        </Card>
        <Card className="animate-pulse space-y-4 p-6" aria-hidden="true">
          <SkeletonBar className="h-5 w-24" />
          <SkeletonBar className="h-4 w-full" />
          <SkeletonBar className="h-4 w-full" />
        </Card>
      </div>
    </div>
  );
}
