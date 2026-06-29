import { Badge } from "@/components/ui/Badge";
import type { ProjectStatus } from "@/types/database";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/constants";

const STATUS_VARIANTS: Record<
  ProjectStatus,
  "default" | "success" | "warning" | "danger"
> = {
  planning: "default",
  in_progress: "success",
  waiting_for_client: "warning",
  rendering: "warning",
  review: "warning",
  complete: "success",
  archived: "default",
};

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}
