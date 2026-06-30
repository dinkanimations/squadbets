import Link from "next/link";
import { Flag } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { getUpcomingMilestones } from "@/lib/database/production-schedules";
import { formatScheduleDate } from "@/lib/production-schedules/calculations";

export async function UpcomingMilestones() {
  let milestones: Awaited<ReturnType<typeof getUpcomingMilestones>> = [];
  let error = false;

  try {
    milestones = await getUpcomingMilestones(6);
  } catch {
    error = true;
  }

  return (
    <Card className="h-full">
      <CardHeader
        title="Upcoming Milestones"
        description="Next milestones across active schedules"
      />
      {error ? (
        <p className="text-sm text-muted">Unable to load from database.</p>
      ) : milestones.length === 0 ? (
        <p className="text-sm text-muted">No upcoming milestones.</p>
      ) : (
        <ul className="space-y-3">
          {milestones.map((item) => (
            <li key={`${item.scheduleId}-${item.date}-${item.milestoneLabel}`}>
              <Link
                href={`/production-schedules/${item.scheduleId}`}
                className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-surface-elevated/50"
              >
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rotate-45"
                  style={{ backgroundColor: item.milestoneColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.milestoneLabel}
                  </p>
                  <p className="text-xs text-muted">
                    {item.projectTitle} · {formatScheduleDate(item.date)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <Flag className="h-3.5 w-3.5" />
        Colour-coded per milestone
      </div>
    </Card>
  );
}
