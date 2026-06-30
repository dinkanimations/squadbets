"use client";

import type { ScheduleMilestone } from "@/lib/production-schedules/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Plus, Trash2 } from "lucide-react";
import { createEmptyMilestone } from "@/lib/production-schedules/constants";

interface MilestoneEditorProps {
  milestones: ScheduleMilestone[];
  onChange: (milestones: ScheduleMilestone[]) => void;
}

export function MilestoneEditor({
  milestones,
  onChange,
}: MilestoneEditorProps) {
  const update = (id: string, patch: Partial<ScheduleMilestone>) => {
    onChange(
      milestones.map((milestone) =>
        milestone.id === id ? { ...milestone, ...patch } : milestone,
      ),
    );
  };

  const add = () => {
    onChange([
      ...milestones,
      createEmptyMilestone(
        new Date().toISOString().split("T")[0],
        milestones.length,
      ),
    ]);
  };

  const remove = (id: string) => {
    onChange(milestones.filter((milestone) => milestone.id !== id));
  };

  return (
    <Card>
      <CardHeader
        title="Milestones"
        description="Colour-coded project milestones"
        action={
          <Button type="button" variant="secondary" size="sm" onClick={add}>
            <Plus className="h-4 w-4" />
            Add Milestone
          </Button>
        }
      />

      <div className="space-y-3">
        {milestones.map((milestone, index) => (
          <div
            key={milestone.id}
            className="grid gap-3 rounded-lg border border-border bg-surface-elevated/40 p-4 sm:grid-cols-[auto_1fr_140px_140px_auto]"
          >
            <div
              className="mt-6 h-3 w-3 rounded-full"
              style={{ backgroundColor: milestone.color }}
              title={milestone.label}
            />
            <Input
              label={index === 0 ? "Label" : undefined}
              value={milestone.label}
              onChange={(e) => update(milestone.id, { label: e.target.value })}
            />
            <Input
              label={index === 0 ? "Date" : undefined}
              type="date"
              value={milestone.date}
              onChange={(e) => update(milestone.id, { date: e.target.value })}
            />
            <div className={index === 0 ? "pt-5" : ""}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(milestone.id)}
                aria-label="Remove milestone"
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
