"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { saveScheduleDefaultsAction } from "@/lib/settings/actions";
import { MILESTONE_TYPE_LABELS, MILESTONE_TYPES } from "@/lib/production-schedules/constants";
import type { AppSettingsData } from "@/lib/settings/types";
import type { MilestoneType } from "@/types/database";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ScheduleDefaultsFormProps {
  settings: AppSettingsData;
}

export function ScheduleDefaultsForm({ settings }: ScheduleDefaultsFormProps) {
  const router = useRouter();
  const [phases, setPhases] = useState(settings.defaultPhases);
  const [phaseWeights, setPhaseWeights] = useState(settings.phaseWeights);
  const [milestones, setMilestones] = useState<MilestoneType[]>(
    settings.defaultMilestones,
  );
  const [reviewRounds, setReviewRounds] = useState(settings.defaultReviewRounds);
  const [durationDays, setDurationDays] = useState(
    settings.defaultScheduleDurationDays,
  );
  const [workingDays, setWorkingDays] = useState(settings.workingDays);
  const [holidays, setHolidays] = useState(settings.companyHolidays);
  const [newPhase, setNewPhase] = useState("");
  const [newHoliday, setNewHoliday] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleWorkingDay = (day: number) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const toggleMilestone = (type: MilestoneType) => {
    setMilestones((prev) =>
      prev.includes(type) ? prev.filter((m) => m !== type) : [...prev, type],
    );
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await saveScheduleDefaultsAction(
        JSON.stringify({
          defaultPhases: phases,
          phaseWeights,
          defaultMilestones: milestones,
          defaultReviewRounds: reviewRounds,
          defaultScheduleDurationDays: durationDays,
          workingDays,
          companyHolidays: holidays,
        }),
      );
      if (result.error) setError(result.error);
      else {
        setSuccess(result.success ?? "Schedule defaults saved.");
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardHeader
        title="Production Schedule Defaults"
        description="Defaults applied when creating new production schedules"
      />

      {(error || success) && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
          }`}
        >
          {error ?? success}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Default Review Rounds"
          type="number"
          min="1"
          max="10"
          value={reviewRounds}
          onChange={(e) => setReviewRounds(Number(e.target.value) || 1)}
        />
        <Input
          label="Default Duration (days)"
          type="number"
          min="7"
          value={durationDays}
          onChange={(e) => setDurationDays(Number(e.target.value) || 42)}
        />
      </div>

      <div className="mt-6">
        <h4 className="mb-3 text-sm font-medium text-foreground">
          Working Days
        </h4>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleWorkingDay(index)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                workingDays.includes(index)
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="mb-3 text-sm font-medium text-foreground">
          Default Production Phases
        </h4>
        <div className="mb-3 flex gap-2">
          <Input
            value={newPhase}
            onChange={(e) => setNewPhase(e.target.value)}
            placeholder="Phase name"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const name = newPhase.trim();
              if (!name) return;
              setPhases([...phases, name]);
              setPhaseWeights({ ...phaseWeights, [name]: 1 });
              setNewPhase("");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {phases.map((phase, index) => (
            <div key={`${phase}-${index}`} className="flex items-center gap-2">
              <span className="w-40 truncate text-sm">{phase}</span>
              <Input
                type="number"
                min="1"
                placeholder="Weight"
                value={phaseWeights[phase] ?? 1}
                onChange={(e) =>
                  setPhaseWeights({
                    ...phaseWeights,
                    [phase]: Number(e.target.value) || 1,
                  })
                }
                className="w-24"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPhases(phases.filter((_, i) => i !== index));
                  const next = { ...phaseWeights };
                  delete next[phase];
                  setPhaseWeights(next);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="mb-3 text-sm font-medium text-foreground">
          Default Milestones
        </h4>
        <div className="flex flex-wrap gap-2">
          {MILESTONE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleMilestone(type)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                milestones.includes(type)
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted"
              }`}
            >
              {MILESTONE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="mb-3 text-sm font-medium text-foreground">
          Company Holidays
        </h4>
        <div className="mb-3 flex gap-2">
          <Input
            type="date"
            value={newHoliday}
            onChange={(e) => setNewHoliday(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!newHoliday || holidays.includes(newHoliday)) return;
              setHolidays([...holidays, newHoliday].sort());
              setNewHoliday("");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {holidays.map((date) => (
            <button
              key={date}
              type="button"
              onClick={() => setHolidays(holidays.filter((d) => d !== date))}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-danger hover:text-danger"
            >
              {date} ×
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Button type="button" disabled={isPending} onClick={handleSave}>
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Schedule Defaults"}
        </Button>
      </div>
    </Card>
  );
}
