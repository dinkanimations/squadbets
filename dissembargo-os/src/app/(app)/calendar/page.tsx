import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { UpcomingMilestones } from "@/components/dashboard/UpcomingMilestones";
import { DeliveryDeadlinesWidget } from "@/components/dashboard/DeliveryDeadlinesWidget";

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        description="Upcoming project deadlines and production milestones."
        icon={Calendar}
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingDeadlines />
          <UpcomingMilestones />
        </div>
        <DeliveryDeadlinesWidget />
      </div>
    </>
  );
}
