import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/PageSkeleton";

export default function ProjectsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading projects">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
