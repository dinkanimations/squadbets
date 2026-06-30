import { Badge } from "@/components/ui/Badge";
import type { ScheduleStatus } from "@/types/database";
import { SCHEDULE_STATUS_LABELS } from "@/lib/production-schedules/constants";

const VARIANTS: Record<
  ScheduleStatus,
  "default" | "success" | "warning" | "danger"
> = {
  draft: "default",
  active: "success",
  archived: "default",
};

export function ScheduleStatusBadge({ status }: { status: ScheduleStatus }) {
  return (
    <Badge variant={VARIANTS[status]}>{SCHEDULE_STATUS_LABELS[status]}</Badge>
  );
}
