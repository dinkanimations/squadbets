import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { getDeliveryDeadlines } from "@/lib/database/production-schedules";
import { formatScheduleDate } from "@/lib/production-schedules/calculations";

export async function DeliveryDeadlinesWidget() {
  let deadlines: Awaited<ReturnType<typeof getDeliveryDeadlines>> = [];
  let error = false;

  try {
    deadlines = await getDeliveryDeadlines(6);
  } catch {
    error = true;
  }

  return (
    <Card className="h-full">
      <CardHeader
        title="Delivery Deadlines"
        description="Upcoming project delivery dates"
      />
      {error ? (
        <p className="text-sm text-muted">Unable to load from database.</p>
      ) : deadlines.length === 0 ? (
        <p className="text-sm text-muted">No upcoming delivery deadlines.</p>
      ) : (
        <ul className="space-y-3">
          {deadlines.map((item) => (
            <li key={item.id}>
              <Link
                href={`/production-schedules/${item.id}`}
                className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-surface-elevated/50"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.projectTitle}
                  </p>
                  <p className="text-xs text-muted">{item.companyName}</p>
                </div>
                <span className="text-sm font-medium text-accent">
                  {formatScheduleDate(item.deliveryDate)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <CalendarClock className="h-3.5 w-3.5" />
        Sorted by nearest deadline
      </div>
    </Card>
  );
}
