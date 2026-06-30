import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/PageSkeleton";

export default function CompaniesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading companies">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
