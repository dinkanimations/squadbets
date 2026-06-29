import { DEADLINE_ICON, UPCOMING_DEADLINES } from "@/lib/data/dummy";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";

const priorityVariant = {
  high: "danger" as const,
  medium: "warning" as const,
  low: "default" as const,
};

const priorityLabel = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function UpcomingDeadlines() {
  const Icon = DEADLINE_ICON;

  return (
    <Card className="h-full">
      <CardHeader
        title="Upcoming Deadlines"
        description="Projects requiring attention"
      />
      <div className="space-y-1">
        {UPCOMING_DEADLINES.map((deadline, index) => (
          <div
            key={deadline.id}
            className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors duration-200 hover:bg-surface-elevated"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-muted transition-colors duration-200 group-hover:text-accent">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {deadline.title}
              </p>
              <p className="truncate text-xs text-muted">{deadline.client}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-xs font-medium text-muted">
                {deadline.dueDate}
              </span>
              <Badge variant={priorityVariant[deadline.priority]}>
                {priorityLabel[deadline.priority]}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
