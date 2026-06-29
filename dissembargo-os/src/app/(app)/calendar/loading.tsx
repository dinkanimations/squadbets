import { PageHeaderSkeleton, CardListSkeleton } from "@/components/ui/PageSkeleton";

export default function CalendarLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading calendar">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <CardListSkeleton />
        <CardListSkeleton />
      </div>
    </div>
  );
}
