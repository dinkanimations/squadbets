"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  MILESTONE_TYPE_LABELS,
  MILESTONE_TYPES,
  createEmptyMilestone,
  createEmptyPhase,
  createShutdownPeriod,
  type ScheduleData,
  type ScheduleMilestone,
  type SchedulePhase,
  type ScheduleShutdownPeriod,
} from "@/lib/production-schedules/constants";
import {
  buildTimelineDays,
  buildTimelineWeeks,
  formatScheduleDate,
} from "@/lib/production-schedules/calculations";
import {
  resizePhaseFromStart,
  resizePhaseToEnd,
  shiftPhaseDates,
} from "@/lib/production-schedules/generate";
import {
  TIMELINE_DAY_WIDTH,
  TIMELINE_LABEL_WIDTH,
  dateToTimelineOffset,
  durationToWidth,
  snapTimelineOffset,
  timelineOffsetToDate,
} from "@/lib/production-schedules/timeline-utils";
import type { MilestoneType } from "@/types/database";

interface ScheduleTimelineEditorProps {
  startDate: string;
  deliveryDate: string;
  scheduleData: ScheduleData;
  onChange: (scheduleData: ScheduleData) => void;
}

type DragMode =
  | { kind: "phase-move"; phaseId: string; startX: number; originalStart: string }
  | { kind: "phase-resize-start"; phaseId: string; startX: number; originalStart: string }
  | { kind: "phase-resize-end"; phaseId: string; startX: number; originalEnd: string }
  | { kind: "milestone-move"; milestoneId: string; startX: number; originalDate: string };

const DAY_WIDTH = TIMELINE_DAY_WIDTH;

export function ScheduleTimelineEditor({
  startDate,
  deliveryDate,
  scheduleData,
  onChange,
}: ScheduleTimelineEditorProps) {
  const {
    phases,
    milestones,
    workingDays,
    companyHolidays,
    shutdownPeriods,
    milestoneLegend,
  } = scheduleData;

  const dragRef = useRef<DragMode | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const weeks = useMemo(
    () => buildTimelineWeeks(startDate, deliveryDate),
    [startDate, deliveryDate],
  );

  const days = useMemo(
    () => buildTimelineDays(startDate, deliveryDate, workingDays, companyHolidays),
    [startDate, deliveryDate, workingDays, companyHolidays],
  );

  const timelineWidth = days.length * DAY_WIDTH;

  const updateSchedule = (patch: Partial<ScheduleData>) => {
    onChange({ ...scheduleData, ...patch });
  };

  const updatePhases = (next: SchedulePhase[]) => {
    updateSchedule({ phases: next });
  };

  const updateMilestones = (next: ScheduleMilestone[]) => {
    updateSchedule({ milestones: next });
  };

  const offsetToDate = (offsetPx: number) =>
    timelineOffsetToDate(offsetPx, startDate, DAY_WIDTH);

  const dateToOffset = (date: string) =>
    dateToTimelineOffset(date, startDate, DAY_WIDTH);

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const deltaPx = snapTimelineOffset(
      event.clientX - drag.startX,
      DAY_WIDTH,
    );

    if (drag.kind === "phase-move") {
      const newDate = offsetToDate(
        Math.max(0, dateToOffset(drag.originalStart) + deltaPx),
      );
      updatePhases(
        phases.map((phase) =>
          phase.id === drag.phaseId ? shiftPhaseDates(phase, newDate) : phase,
        ),
      );
      return;
    }

    if (drag.kind === "phase-resize-start") {
      const newDate = offsetToDate(
        Math.max(0, dateToOffset(drag.originalStart) + deltaPx),
      );
      updatePhases(
        phases.map((phase) =>
          phase.id === drag.phaseId
            ? resizePhaseFromStart(phase, newDate)
            : phase,
        ),
      );
      return;
    }

    if (drag.kind === "phase-resize-end") {
      const phase = phases.find((item) => item.id === drag.phaseId);
      if (!phase) return;
      const newEnd = offsetToDate(
        Math.max(
          dateToOffset(phase.startDate),
          dateToOffset(drag.originalEnd) + deltaPx,
        ),
      );
      updatePhases(
        phases.map((item) =>
          item.id === drag.phaseId ? resizePhaseToEnd(item, newEnd) : item,
        ),
      );
      return;
    }

    if (drag.kind === "milestone-move") {
      const newDate = offsetToDate(
        Math.max(0, dateToOffset(drag.originalDate) + deltaPx),
      );
      updateMilestones(
        milestones.map((milestone) =>
          milestone.id === drag.milestoneId
            ? { ...milestone, date: newDate }
            : milestone,
        ),
      );
    }
  };

  const endDrag = () => {
    dragRef.current = null;
    setActiveId(null);
  };

  const addPhase = () => {
    const last = phases[phases.length - 1];
    const start = last?.endDate ?? startDate;
    updatePhases([...phases, createEmptyPhase(start, phases.length)]);
  };

  const duplicatePhase = (phaseId: string) => {
    const source = phases.find((phase) => phase.id === phaseId);
    if (!source) return;
    const duplicate: SchedulePhase = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name} Copy`,
      sortOrder: phases.length,
    };
    updatePhases([...phases, duplicate]);
  };

  const removePhase = (phaseId: string) => {
    if (phases.length <= 1) return;
    updatePhases(phases.filter((phase) => phase.id !== phaseId));
  };

  const addMilestone = () => {
    updateMilestones([
      ...milestones,
      createEmptyMilestone(startDate, milestones.length),
    ]);
  };

  const removeMilestone = (milestoneId: string) => {
    updateMilestones(milestones.filter((m) => m.id !== milestoneId));
  };

  const toggleWorkingDay = (day: number) => {
    const next = workingDays.includes(day)
      ? workingDays.filter((value) => value !== day)
      : [...workingDays, day].sort();
    updateSchedule({ workingDays: next });
  };

  const addHoliday = () => {
    if (!startDate) return;
    updateSchedule({
      companyHolidays: [...companyHolidays, startDate],
    });
  };

  const addShutdown = () => {
    updateSchedule({
      shutdownPeriods: [
        ...shutdownPeriods,
        createShutdownPeriod(startDate, startDate),
      ],
    });
  };

  if (!startDate || !deliveryDate) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted">
        Set start and delivery dates to build the timeline.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Production Timeline
            </h2>
            <p className="text-xs text-muted">
              Drag to move · Drag edges to resize · Click labels to rename
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={addPhase}>
              <Plus className="h-4 w-4" />
              Phase
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addMilestone}
            >
              <Plus className="h-4 w-4" />
              Milestone
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto p-3">
          <div style={{ minWidth: timelineWidth + TIMELINE_LABEL_WIDTH }}>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `${TIMELINE_LABEL_WIDTH}px ${timelineWidth}px`,
              }}
            >
              <div />
              <div className="border-b border-border">
                <div className="flex">
                  {weeks.map((week) => {
                    const weekDayCount =
                      buildTimelineDays(
                        week.startDate,
                        week.endDate,
                        workingDays,
                        companyHolidays,
                      ).length || 1;
                    return (
                      <div
                        key={`${week.startDate}-${week.endDate}`}
                        className="border-r border-border px-1 py-2 text-center"
                        style={{ width: weekDayCount * DAY_WIDTH }}
                      >
                        <p className="text-xs font-medium text-foreground">
                          {week.label}
                        </p>
                        <p className="text-[10px] text-muted">
                          {formatScheduleDate(week.startDate)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex border-t border-border/60">
                  {days.map((day) => (
                    <div
                      key={day.date}
                      className={`border-r border-border/40 px-0.5 py-1 text-center ${
                        !day.isWorkingDay || day.isHoliday
                          ? "bg-surface-elevated/80"
                          : ""
                      }`}
                      style={{ width: DAY_WIDTH }}
                    >
                      <p className="text-[9px] text-muted">{day.dayLabel}</p>
                      <p className="text-[10px] font-medium text-foreground">
                        {day.dateLabel}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="relative"
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
            >
              <div
                className="pointer-events-none absolute inset-0 grid"
                style={{
                  gridTemplateColumns: `${TIMELINE_LABEL_WIDTH}px ${timelineWidth}px`,
                }}
              >
                <div />
                <div className="relative">
                  {days.map((day, index) => (
                    <div
                      key={`bg-${day.date}`}
                      className={`absolute top-0 bottom-0 border-r border-border/20 ${
                        !day.isWorkingDay || day.isHoliday
                          ? "bg-muted/10"
                          : ""
                      }`}
                      style={{
                        left: index * DAY_WIDTH,
                        width: DAY_WIDTH,
                      }}
                    />
                  ))}
                  {shutdownPeriods.map((period) => (
                    <div
                      key={period.id}
                      className="absolute top-0 bottom-0 rounded-sm"
                      style={{
                        left: dateToOffset(period.startDate),
                        width: durationToWidth(
                          Math.max(
                            1,
                            Math.round(
                              (dateToOffset(period.endDate) -
                                dateToOffset(period.startDate)) /
                                DAY_WIDTH,
                            ) + 1,
                          ),
                          DAY_WIDTH,
                        ),
                        backgroundColor: period.color,
                      }}
                      title={period.label}
                    />
                  ))}
                </div>
              </div>

              {phases.map((phase) => {
                const left = dateToOffset(phase.startDate);
                const width = durationToWidth(phase.durationDays, DAY_WIDTH);

                return (
                  <div
                    key={phase.id}
                    className="relative grid items-center"
                    style={{
                      gridTemplateColumns: `${TIMELINE_LABEL_WIDTH}px ${timelineWidth}px`,
                    }}
                  >
                    <div className="flex items-center gap-1 pr-2">
                      <input
                        value={phase.name}
                        onChange={(event) =>
                          updatePhases(
                            phases.map((item) =>
                              item.id === phase.id
                                ? { ...item, name: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className="min-w-0 flex-1 bg-transparent text-xs font-medium text-foreground focus:outline-none"
                      />
                      <div className="flex shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicatePhase(phase.id)}
                          aria-label="Duplicate phase"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePhase(phase.id)}
                          disabled={phases.length <= 1}
                          aria-label="Delete phase"
                        >
                          <Trash2 className="h-3 w-3 text-danger" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative h-11 border-b border-border/40">
                      <div
                        className={`absolute top-2 flex h-7 items-center rounded-md text-[10px] font-medium text-white ${
                          activeId === phase.id ? "ring-2 ring-accent" : ""
                        }`}
                        style={{
                          left,
                          width,
                          backgroundColor: phase.color,
                        }}
                      >
                        <button
                          type="button"
                          className="h-full w-2 shrink-0 cursor-ew-resize rounded-l-md bg-black/20"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            dragRef.current = {
                              kind: "phase-resize-start",
                              phaseId: phase.id,
                              startX: event.clientX,
                              originalStart: phase.startDate,
                            };
                            setActiveId(phase.id);
                            event.currentTarget.setPointerCapture(event.pointerId);
                          }}
                        />
                        <button
                          type="button"
                          className="flex h-full min-w-0 flex-1 cursor-grab items-center justify-center px-1 active:cursor-grabbing"
                          onPointerDown={(event) => {
                            dragRef.current = {
                              kind: "phase-move",
                              phaseId: phase.id,
                              startX: event.clientX,
                              originalStart: phase.startDate,
                            };
                            setActiveId(phase.id);
                            event.currentTarget.setPointerCapture(event.pointerId);
                          }}
                        >
                          <span className="truncate">{phase.durationDays}d</span>
                        </button>
                        <input
                          type="color"
                          value={phase.color}
                          onChange={(event) =>
                            updatePhases(
                              phases.map((item) =>
                                item.id === phase.id
                                  ? { ...item, color: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="h-5 w-5 shrink-0 cursor-pointer border-0 bg-transparent p-0"
                          title="Phase colour"
                        />
                        <button
                          type="button"
                          className="h-full w-2 shrink-0 cursor-ew-resize rounded-r-md bg-black/20"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            dragRef.current = {
                              kind: "phase-resize-end",
                              phaseId: phase.id,
                              startX: event.clientX,
                              originalEnd: phase.endDate,
                            };
                            setActiveId(phase.id);
                            event.currentTarget.setPointerCapture(event.pointerId);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div
                className="grid"
                style={{
                  gridTemplateColumns: `${TIMELINE_LABEL_WIDTH}px ${timelineWidth}px`,
                }}
              >
                <p className="py-2 text-xs font-medium text-muted">Milestones</p>
                <div className="relative h-16 border-t border-border">
                  {milestones.map((milestone) => {
                    const left = dateToOffset(milestone.date);
                    const color =
                      milestone.color ??
                      milestoneLegend[milestone.type] ??
                      "#6366f1";

                    return (
                      <div
                        key={milestone.id}
                        className="absolute top-3"
                        style={{ left: left + DAY_WIDTH / 2 }}
                      >
                        <button
                          type="button"
                          className={`group -translate-x-1/2 cursor-grab rounded border-2 border-white px-1.5 py-0.5 text-[9px] font-medium text-white shadow-sm active:cursor-grabbing ${
                            activeId === milestone.id ? "ring-2 ring-accent" : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onPointerDown={(event) => {
                            dragRef.current = {
                              kind: "milestone-move",
                              milestoneId: milestone.id,
                              startX: event.clientX,
                              originalDate: milestone.date,
                            };
                            setActiveId(milestone.id);
                            event.currentTarget.setPointerCapture(event.pointerId);
                          }}
                        >
                          <span className="max-w-[72px] truncate">
                            {milestone.label}
                          </span>
                        </button>
                        <div className="mt-1 flex -translate-x-1/2 justify-center gap-1">
                          <input
                            type="color"
                            value={color}
                            onChange={(event) =>
                              updateMilestones(
                                milestones.map((item) =>
                                  item.id === milestone.id
                                    ? { ...item, color: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMilestone(milestone.id)}
                            aria-label="Delete milestone"
                          >
                            <Trash2 className="h-3 w-3 text-danger" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Legend</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MILESTONE_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <input
                type="color"
                value={milestoneLegend[type] ?? "#6366f1"}
                onChange={(event) =>
                  updateSchedule({
                    milestoneLegend: {
                      ...milestoneLegend,
                      [type]: event.target.value,
                    },
                  })
                }
                className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="text-xs text-muted">
                {MILESTONE_TYPE_LABELS[type]}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {milestones.map((milestone) => (
            <div key={`edit-${milestone.id}`} className="flex flex-wrap gap-2">
              <select
                value={milestone.type}
                onChange={(event) =>
                  updateMilestones(
                    milestones.map((item) =>
                      item.id === milestone.id
                        ? {
                            ...item,
                            type: event.target.value as MilestoneType,
                          }
                        : item,
                    ),
                  )
                }
                className="h-8 rounded-md border border-border bg-surface-elevated px-2 text-xs"
              >
                {MILESTONE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {MILESTONE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <input
                value={milestone.label}
                onChange={(event) =>
                  updateMilestones(
                    milestones.map((item) =>
                      item.id === milestone.id
                        ? { ...item, label: event.target.value }
                        : item,
                    ),
                  )
                }
                className="h-8 min-w-0 flex-1 rounded-md border border-border bg-surface-elevated px-2 text-xs"
                placeholder="Milestone label"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Working Calendar
        </h3>
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ["Sun", 0],
            ["Mon", 1],
            ["Tue", 2],
            ["Wed", 3],
            ["Thu", 4],
            ["Fri", 5],
            ["Sat", 6],
          ].map(([label, day]) => (
            <button
              key={String(day)}
              type="button"
              onClick={() => toggleWorkingDay(Number(day))}
              className={`rounded-md border px-2 py-1 text-xs ${
                workingDays.includes(Number(day))
                  ? "border-accent/40 bg-accent/10 text-foreground"
                  : "border-border bg-surface-elevated text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={addHoliday}>
            Add Holiday
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={addShutdown}>
            Add Shutdown Period
          </Button>
        </div>

        {companyHolidays.length > 0 && (
          <div className="mb-3 space-y-1">
            <p className="text-xs font-medium text-muted">Public holidays</p>
            {companyHolidays.map((holiday, index) => (
              <div key={`${holiday}-${index}`} className="flex gap-2">
                <input
                  type="date"
                  value={holiday}
                  onChange={(event) => {
                    const next = [...companyHolidays];
                    next[index] = event.target.value;
                    updateSchedule({ companyHolidays: next });
                  }}
                  className="h-8 rounded-md border border-border bg-surface-elevated px-2 text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateSchedule({
                      companyHolidays: companyHolidays.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {shutdownPeriods.map((period) => (
          <ShutdownEditor
            key={period.id}
            period={period}
            onChange={(next) =>
              updateSchedule({
                shutdownPeriods: shutdownPeriods.map((item) =>
                  item.id === period.id ? next : item,
                ),
              })
            }
            onRemove={() =>
              updateSchedule({
                shutdownPeriods: shutdownPeriods.filter(
                  (item) => item.id !== period.id,
                ),
              })
            }
          />
        ))}
      </section>
    </div>
  );
}

function ShutdownEditor({
  period,
  onChange,
  onRemove,
}: {
  period: ScheduleShutdownPeriod;
  onChange: (period: ScheduleShutdownPeriod) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mt-2 grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto_auto_auto]">
      <input
        value={period.label}
        onChange={(event) => onChange({ ...period, label: event.target.value })}
        className="h-8 rounded-md border border-border bg-surface-elevated px-2 text-xs"
        placeholder="Shutdown label"
      />
      <input
        type="date"
        value={period.startDate}
        onChange={(event) => onChange({ ...period, startDate: event.target.value })}
        className="h-8 rounded-md border border-border bg-surface-elevated px-2 text-xs"
      />
      <input
        type="date"
        value={period.endDate}
        onChange={(event) => onChange({ ...period, endDate: event.target.value })}
        className="h-8 rounded-md border border-border bg-surface-elevated px-2 text-xs"
      />
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={period.color.startsWith("#") ? period.color : "#f87171"}
          onChange={(event) => onChange({ ...period, color: event.target.value })}
          className="h-8 w-8 cursor-pointer border-0 bg-transparent p-0"
        />
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5 text-danger" />
        </Button>
      </div>
    </div>
  );
}
