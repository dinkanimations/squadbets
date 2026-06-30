import type { MilestoneShape } from "@/lib/production-schedules/constants";
import { milestoneShapeClass } from "@/lib/production-schedules/milestone-utils";

interface MilestoneMarkerProps {
  color: string;
  shape?: MilestoneShape;
  icon?: string | null;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function MilestoneMarker({
  color,
  shape = "diamond",
  icon,
  label,
  size = "md",
  className = "",
}: MilestoneMarkerProps) {
  const dimension = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  if (icon?.trim()) {
    return (
      <span
        className={`inline-flex items-center justify-center text-xs font-bold ${className}`}
        style={{ color }}
        title={label}
      >
        {icon}
      </span>
    );
  }

  return (
    <span
      className={`inline-block border border-white shadow-sm ${dimension} ${milestoneShapeClass(shape)} ${className}`}
      style={{ backgroundColor: color }}
      title={label}
    />
  );
}
