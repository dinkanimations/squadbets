import Link from "next/link";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { getProjectsDueThisWeek } from "@/lib/database/projects";
import { formatProjectDate } from "@/lib/projects/utils";
import { PROJECT_PRIORITY_LABELS } from "@/lib/projects/constants";
import type { ProjectPriority } from "@/types/database";

const priorityVariant: Record<
  ProjectPriority,
  "default" | "success" | "warning" | "danger"
> = {
  low: "default",
  medium: "default",
  high: "warning",
  urgent: "danger",
};

export async function UpcomingDeadlines() {
  let deadlines: Awaited<ReturnType<typeof getProjectsDueThisWeek>> = [];
  let error = false;

  try {
    deadlines = await getProjectsDueThisWeek(8);
  } catch {
    error = true;
  }

  return (
    <Card className="h-full">
      <CardHeader
        title="Upcoming Deadlines"
        description="Projects due this week"
      />

      {error ? (
        <p className="text-sm text-muted">Unable to load deadlines.</p>
      ) : deadlines.length === 0 ? (
        <p className="text-sm text-muted">No projects due this week.</p>
      ) : (
        <div className="space-y-1">
          {deadlines.map((deadline, index) => (
            <Link
              key={deadline.id}
              href={`/projects/${deadline.id}`}
              className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors duration-200 hover:bg-surface-elevated"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-muted transition-colors duration-200 group-hover:text-accent">
                <Calendar className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {deadline.projectName}
                </p>
                <p className="truncate text-xs text-muted">
                  {deadline.companyName}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs font-medium text-muted">
                  {formatProjectDate(deadline.deliveryDate)}
                </span>
                <Badge
                  variant={
                    priorityVariant[deadline.priority as ProjectPriority] ??
                    "default"
                  }
                >
                  {PROJECT_PRIORITY_LABELS[
                    deadline.priority as ProjectPriority
                  ] ?? deadline.priority}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
