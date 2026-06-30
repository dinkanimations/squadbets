"use client";

import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  MILESTONE_SHAPES,
  MILESTONE_SHAPE_LABELS,
  createEmptyMilestone,
  type MilestoneShape,
  type ScheduleMilestone,
} from "@/lib/production-schedules/constants";
import {
  formatMilestoneWeekLabel,
  milestoneShapeClass,
  reorderMilestones,
  sortMilestones,
} from "@/lib/production-schedules/milestone-utils";
import type { TimelineWeek } from "@/lib/production-schedules/calculations";

interface MilestoneLegendEditorProps {
  milestones: ScheduleMilestone[];
  weeks: TimelineWeek[];
  startDate: string;
  onChange: (milestones: ScheduleMilestone[]) => void;
}

export function MilestoneLegendEditor({
  milestones,
  weeks,
  startDate,
  onChange,
}: MilestoneLegendEditorProps) {
  const sorted = sortMilestones(milestones);

  const update = (id: string, patch: Partial<ScheduleMilestone>) => {
    onChange(
      milestones.map((milestone) =>
        milestone.id === id ? { ...milestone, ...patch } : milestone,
      ),
    );
  };

  const remove = (id: string) => {
    onChange(
      milestones
        .filter((milestone) => milestone.id !== id)
        .map((milestone, index) => ({ ...milestone, sortOrder: index })),
    );
  };

  const add = () => {
    onChange([
      ...milestones,
      createEmptyMilestone(startDate, milestones.length),
    ]);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Milestones</h3>
          <p className="text-xs text-muted">
            Add, rename, colour and reorder milestones. Drag markers on the
            timeline to set dates (snaps to week start).
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus className="h-4 w-4" />
          Add milestone
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted">
          No milestones yet. Add milestones to place them on the timeline and
          PDF legend.
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((milestone, index) => (
            <div
              key={milestone.id}
              className="rounded-lg border border-border bg-surface-elevated/40 p-3"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex flex-col gap-1 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() =>
                      onChange(reorderMilestones(milestones, milestone.id, "up"))
                    }
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === sorted.length - 1}
                    onClick={() =>
                      onChange(
                        reorderMilestones(milestones, milestone.id, "down"),
                      )
                    }
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                <div
                  className={`mt-1 h-4 w-4 shrink-0 border border-white shadow-sm ${milestoneShapeClass(milestone.shape)}`}
                  style={{ backgroundColor: milestone.color }}
                  title={milestone.label}
                />

                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    label={index === 0 ? "Title" : undefined}
                    value={milestone.label}
                    onChange={(event) =>
                      update(milestone.id, { label: event.target.value })
                    }
                  />
                  <Input
                    label={index === 0 ? "Date" : undefined}
                    type="date"
                    value={milestone.date}
                    onChange={(event) =>
                      update(milestone.id, { date: event.target.value })
                    }
                  />
                  <div>
                    {index === 0 ? (
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Week
                      </span>
                    ) : null}
                    <p className="flex h-10 items-center rounded-md border border-border bg-surface px-3 text-xs text-muted">
                      {formatMilestoneWeekLabel(milestone.date, weeks)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        {index === 0 ? "Colour" : "\u00a0"}
                      </span>
                      <input
                        type="color"
                        value={milestone.color}
                        onChange={(event) =>
                          update(milestone.id, { color: event.target.value })
                        }
                        className="h-10 w-full cursor-pointer rounded-md border border-border bg-surface-elevated"
                      />
                    </div>
                    <Select
                      label={index === 0 ? "Shape" : undefined}
                      value={milestone.shape ?? "diamond"}
                      onChange={(event) =>
                        update(milestone.id, {
                          shape: event.target.value as MilestoneShape,
                        })
                      }
                      options={MILESTONE_SHAPES.map((shape) => ({
                        value: shape,
                        label: MILESTONE_SHAPE_LABELS[shape],
                      }))}
                      className="min-w-[110px]"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-1">
                  <Input
                    label={index === 0 ? "Icon" : undefined}
                    value={milestone.icon ?? ""}
                    onChange={(event) =>
                      update(milestone.id, {
                        icon: event.target.value || null,
                      })
                    }
                    placeholder="◆"
                    className="w-16"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-5"
                    onClick={() =>
                      update(milestone.id, {
                        visibleInPdf: milestone.visibleInPdf === false,
                      })
                    }
                    aria-label={
                      milestone.visibleInPdf === false
                        ? "Show in PDF"
                        : "Hide from PDF"
                    }
                    title={
                      milestone.visibleInPdf === false
                        ? "Hidden from PDF"
                        : "Visible in PDF"
                    }
                  >
                    {milestone.visibleInPdf === false ? (
                      <EyeOff className="h-4 w-4 text-muted" />
                    ) : (
                      <Eye className="h-4 w-4 text-success" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-5"
                    onClick={() => remove(milestone.id)}
                    aria-label="Delete milestone"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </div>

              <Textarea
                label={index === 0 ? "Notes" : undefined}
                value={milestone.notes}
                onChange={(event) =>
                  update(milestone.id, { notes: event.target.value })
                }
                rows={2}
                className="mt-2"
                placeholder="Description or notes for this milestone"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
