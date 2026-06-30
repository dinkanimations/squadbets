import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/PageSkeleton";

export default function QuotesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading quotes">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
