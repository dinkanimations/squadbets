import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card } from "./Card";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

export function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
}: StatCardProps) {
  return (
    <Card hover className="group">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p
            className={cn(
              "text-xs font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-danger",
              changeType === "neutral" && "text-muted",
            )}
          >
            {change}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-elevated text-muted transition-colors duration-200 group-hover:text-accent">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </Card>
  );
}
