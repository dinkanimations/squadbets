import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RevenuePipeline } from "@/components/dashboard/RevenuePipeline";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { IndustriesBreakdown } from "@/components/dashboard/IndustriesBreakdown";
import { OpportunitiesByIndustry } from "@/components/dashboard/OpportunitiesByIndustry";
import { UpcomingMilestones } from "@/components/dashboard/UpcomingMilestones";
import { DeliveryDeadlinesWidget } from "@/components/dashboard/DeliveryDeadlinesWidget";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your agency operations and key metrics."
        icon={LayoutDashboard}
      />

      <div className="space-y-6">
        <DashboardStats />

        <div className="grid gap-6 lg:grid-cols-2">
          <RevenuePipeline />
          <UpcomingDeadlines />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <IndustriesBreakdown />
          <OpportunitiesByIndustry />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingMilestones />
          <DeliveryDeadlinesWidget />
        </div>
      </div>
    </>
  );
}
