import { Suspense } from "react";
import { Clapperboard } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { SchedulesTable } from "@/components/production-schedules/SchedulesTable";
import { SchedulesToolbar } from "@/components/production-schedules/SchedulesToolbar";
import { getSchedulesFiltered } from "@/lib/database/production-schedules";

interface SchedulesPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function ProductionSchedulesPage({
  searchParams,
}: SchedulesPageProps) {
  const params = await searchParams;
  const { data: schedules } = await getSchedulesFiltered({
    search: params.search,
  });

  return (
    <>
      <PageHeader
        title="Production Schedules"
        description="Plan and coordinate animation and creative production timelines."
        icon={Clapperboard}
      />

      <Suspense fallback={null}>
        <SchedulesToolbar />
      </Suspense>

      {schedules.length > 0 ? (
        <SchedulesTable schedules={schedules} />
      ) : (
        <EmptyState
          title={params.search ? "No matching schedules" : "No schedules yet"}
          description={
            params.search
              ? "Try adjusting your search criteria."
              : "Create your first production schedule to plan phases and milestones."
          }
          action={
            !params.search ? (
              <Link href="/production-schedules/new">
                <Button>New Schedule</Button>
              </Link>
            ) : undefined
          }
        />
      )}
    </>
  );
}
