import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/PageSkeleton";

export default function SchedulesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading production schedules">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
