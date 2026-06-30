"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { restoreScheduleVersionAction } from "@/lib/production-schedules/actions";
import { formatScheduleDate } from "@/lib/production-schedules/calculations";
import type { ProductionScheduleVersion } from "@/types/database";

interface ScheduleVersionPanelProps {
  scheduleId: string;
  versions: ProductionScheduleVersion[];
  currentVersion: number;
}

export function ScheduleVersionPanel({
  scheduleId,
  versions,
  currentVersion,
}: ScheduleVersionPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRestore = (version: number) => {
    if (
      !window.confirm(`Restore schedule to version ${version}? This creates a new version.`)
    ) {
      return;
    }

    startTransition(async () => {
      await restoreScheduleVersionAction(scheduleId, version);
      router.refresh();
    });
  };

  if (versions.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Version History"
        description={`Current version: v${currentVersion}`}
      />

      <ul className="space-y-2">
        {versions.map((version) => (
          <li
            key={version.id}
            className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated/40 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted" />
              <span>
                v{version.version} · {formatScheduleDate(version.created_at)}
              </span>
              {version.version === currentVersion && (
                <span className="text-xs text-accent">(current)</span>
              )}
            </div>
            {version.version !== currentVersion && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleRestore(version.version)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
