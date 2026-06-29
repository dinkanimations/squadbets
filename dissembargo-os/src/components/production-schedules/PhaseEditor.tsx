"use client";

import type { SchedulePhase } from "@/lib/production-schedules/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { resizePhase } from "@/lib/production-schedules/generate";

interface PhaseEditorProps {
  phases: SchedulePhase[];
  onChange: (phases: SchedulePhase[]) => void;
}

export function PhaseEditor({ phases, onChange }: PhaseEditorProps) {
  const update = (id: string, patch: Partial<SchedulePhase>) => {
    onChange(
      phases.map((phase) => (phase.id === id ? { ...phase, ...patch } : phase)),
    );
  };

  const updateDuration = (id: string, days: number) => {
    onChange(
      phases.map((phase) =>
        phase.id === id ? resizePhase(phase, days) : phase,
      ),
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...phases];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((phase, i) => ({ ...phase, sortOrder: i })));
  };

  const add = () => {
    const last = phases[phases.length - 1];
    const startDate = last?.endDate ?? new Date().toISOString().split("T")[0];
    onChange([
      ...phases,
      {
        id: crypto.randomUUID(),
        name: "New Phase",
        startDate,
        endDate: startDate,
        durationDays: 1,
        sortOrder: phases.length,
        notes: "",
      },
    ]);
  };

  const remove = (id: string) => {
    if (phases.length <= 1) return;
    onChange(phases.filter((phase) => phase.id !== id));
  };

  return (
    <Card>
      <CardHeader
        title="Production Phases"
        description="Add, remove, reorder, and adjust phase durations"
        action={
          <Button type="button" variant="secondary" size="sm" onClick={add}>
            <Plus className="h-4 w-4" />
            Add Phase
          </Button>
        }
      />

      <div className="space-y-3">
        {phases.map((phase, index) => (
          <div
            key={phase.id}
            className="grid gap-3 rounded-lg border border-border bg-surface-elevated/40 p-4 sm:grid-cols-[1fr_100px_120px_auto]"
          >
            <Input
              label={index === 0 ? "Phase" : undefined}
              value={phase.name}
              onChange={(e) => update(phase.id, { name: e.target.value })}
            />
            <Input
              label={index === 0 ? "Days" : undefined}
              type="number"
              min="1"
              step="1"
              value={phase.durationDays}
              onChange={(e) =>
                updateDuration(phase.id, Number(e.target.value) || 1)
              }
            />
            <div className={index === 0 ? "pt-6" : ""}>
              <p className="text-xs text-muted">
                {phase.startDate} → {phase.endDate}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 ${index === 0 ? "pt-5" : ""}`}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => move(index, 1)}
                disabled={index === phases.length - 1}
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(phase.id)}
                disabled={phases.length <= 1}
                aria-label="Remove phase"
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
