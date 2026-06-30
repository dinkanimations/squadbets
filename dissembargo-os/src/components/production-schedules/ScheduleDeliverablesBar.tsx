"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ScheduleDeliverablesBarProps {
  deliverables: string[];
  onChange: (deliverables: string[]) => void;
}

export function ScheduleDeliverablesBar({
  deliverables,
  onChange,
}: ScheduleDeliverablesBarProps) {
  const rows = deliverables.length > 0 ? deliverables : [""];

  const update = (index: number, value: string) => {
    const next = [...rows];
    next[index] = value;
    onChange(next);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Deliverables</h2>
          <p className="text-xs text-muted">Shown at the top of the schedule PDF</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange([...rows, ""])}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(event) => update(index, event.target.value)}
              placeholder="e.g. 60s Hero Film"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange(rows.filter((_, rowIndex) => rowIndex !== index))
              }
              disabled={rows.length <= 1}
              aria-label="Remove deliverable"
            >
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
