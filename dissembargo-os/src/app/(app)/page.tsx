import { Suspense } from "react";
import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RevenuePipeline } from "@/components/dashboard/RevenuePipeline";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { IndustriesBreakdown } from "@/components/dashboard/IndustriesBreakdown";
import { OpportunitiesByIndustry } from "@/components/dashboard/OpportunitiesByIndustry";
import { UpcomingMilestones } from "@/components/dashboard/UpcomingMilestones";
import { DeliveryDeadlinesWidget } from "@/components/dashboard/DeliveryDeadlinesWidget";
import {
  CardListSkeleton,
  StatGridSkeleton,
} from "@/components/ui/PageSkeleton";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your agency operations and key metrics."
        icon={LayoutDashboard}
      />

      <div className="space-y-6">
        <Suspense fallback={<StatGridSkeleton count={8} />}>
          <DashboardStats />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<CardListSkeleton />}>
            <RevenuePipeline />
          </Suspense>
          <Suspense fallback={<CardListSkeleton />}>
            <UpcomingDeadlines />
          </Suspense>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<CardListSkeleton />}>
            <IndustriesBreakdown />
          </Suspense>
          <Suspense fallback={<CardListSkeleton />}>
            <OpportunitiesByIndustry />
          </Suspense>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<CardListSkeleton />}>
            <UpcomingMilestones />
          </Suspense>
          <Suspense fallback={<CardListSkeleton />}>
            <DeliveryDeadlinesWidget />
          </Suspense>
        </div>
      </div>
    </>
  );
}
