import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/PageSkeleton";

export default function SettingsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading settings">
      <PageHeaderSkeleton />
      <TableSkeleton rows={4} />
    </div>
  );
}
