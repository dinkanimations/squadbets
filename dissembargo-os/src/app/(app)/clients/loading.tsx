import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/PageSkeleton";

export default function ClientsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading clients">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
