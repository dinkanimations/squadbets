"use client";

import { useMemo, useRef, useState } from "react";
import type { ScheduleMilestone, SchedulePhase } from "@/lib/production-schedules/constants";
import {
  MILESTONE_COLORS,
  MILESTONE_TYPE_LABELS,
} from "@/lib/production-schedules/constants";
import {
  buildTimelineWeeks,
  formatScheduleDate,
  parseDate,
} from "@/lib/production-schedules/calculations";
import { shiftPhaseDates } from "@/lib/production-schedules/generate";
import { Card, CardHeader } from "@/components/ui/Card";

interface ScheduleTimelineProps {
  startDate: string;
  deliveryDate: string;
  phases: SchedulePhase[];
  milestones: ScheduleMilestone[];
  onPhasesChange: (phases: SchedulePhase[]) => void;
  onMilestonesChange: (milestones: ScheduleMilestone[]) => void;
}

const PHASE_COLORS = [
  "#6366f1",
  "#818cf8",
  "#a5b4fc",
  "#4f46e5",
  "#7c3aed",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#ddd6fe",
  "#312e81",
  "#4338ca",
];

export function ScheduleTimeline({
  startDate,
  deliveryDate,
  phases,
  milestones,
  onPhasesChange,
  onMilestonesChange,
}: ScheduleTimelineProps) {
  const weeks = useMemo(
    () => buildTimelineWeeks(startDate, deliveryDate),
    [startDate, deliveryDate],
  );

  const totalDays = useMemo(() => {
    const start = parseDate(startDate);
    const end = parseDate(deliveryDate);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
  }, [startDate, deliveryDate]);

  const dragRef = useRef<{
    phaseId: string;
    startX: number;
    originalStart: string;
  } | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const dayWidth = 28;
  const timelineWidth = totalDays * dayWidth;

  const dateToOffset = (date: string) => {
    const start = parseDate(startDate);
    const target = parseDate(date);
    const days = Math.round((target.getTime() - start.getTime()) / 86400000);
    return days * dayWidth;
  };

  const offsetToDate = (offsetPx: number) => {
    const days = Math.round(offsetPx / dayWidth);
    const start = parseDate(startDate);
    start.setDate(start.getDate() + days);
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, "0");
    const day = String(start.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePhasePointerDown = (
    phase: SchedulePhase,
    event: React.PointerEvent,
  ) => {
    event.preventDefault();
    dragRef.current = {
      phaseId: phase.id,
      startX: event.clientX,
      originalStart: phase.startDate,
    };
    setDraggingId(phase.id);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragRef.current) return;

    const deltaPx = event.clientX - dragRef.current.startX;
    const originalOffset = dateToOffset(dragRef.current.originalStart);
    const newDate = offsetToDate(Math.max(0, originalOffset + deltaPx));

    onPhasesChange(
      phases.map((phase) =>
        phase.id === dragRef.current?.phaseId
          ? shiftPhaseDates(phase, newDate)
          : phase,
      ),
    );
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    setDraggingId(null);
  };

  const handleMilestoneDrag = (
    milestoneId: string,
    event: React.PointerEvent,
  ) => {
    const startX = event.clientX;
    const originalDate =
      milestones.find((m) => m.id === milestoneId)?.date ?? startDate;

    const onMove = (moveEvent: PointerEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      const newDate = offsetToDate(
        Math.max(0, dateToOffset(originalDate) + deltaPx),
      );
      onMilestonesChange(
        milestones.map((milestone) =>
          milestone.id === milestoneId
            ? { ...milestone, date: newDate }
            : milestone,
        ),
      );
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  if (!startDate || !deliveryDate || weeks.length === 0) {
    return (
      <Card>
        <CardHeader title="Timeline" />
        <p className="text-sm text-muted">
          Set start and delivery dates to view the timeline.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Timeline"
        description="Drag phases and milestones to adjust dates. Resize durations in the phase list."
      />

      <div className="overflow-x-auto">
        <div style={{ minWidth: timelineWidth + 160 }}>
          <div
            className="mb-2 grid"
            style={{ gridTemplateColumns: `140px ${timelineWidth}px` }}
          >
            <div />
            <div className="flex border-b border-border">
              {weeks.map((week) => {
                const weekDays =
                  Math.round(
                    (parseDate(week.endDate).getTime() -
                      parseDate(week.startDate).getTime()) /
                      86400000,
                  ) + 1;
                return (
                  <div
                    key={`${week.startDate}-${week.endDate}`}
                    className="border-r border-border px-2 py-2 text-center"
                    style={{ width: weekDays * dayWidth }}
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
          </div>

          <div
            className="relative"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {phases.map((phase, index) => {
              const left = dateToOffset(phase.startDate);
              const width = Math.max(dayWidth, phase.durationDays * dayWidth);

              return (
                <div
                  key={phase.id}
                  className="grid items-center"
                  style={{ gridTemplateColumns: `140px ${timelineWidth}px` }}
                >
                  <p className="truncate pr-3 text-xs font-medium text-foreground">
                    {phase.name}
                  </p>
                  <div className="relative h-10 border-b border-border/50">
                    <div
                      role="button"
                      tabIndex={0}
                      onPointerDown={(e) => handlePhasePointerDown(phase, e)}
                      className={`absolute top-2 flex h-6 cursor-grab items-center rounded-md px-2 text-[10px] font-medium text-white active:cursor-grabbing ${
                        draggingId === phase.id
                          ? "opacity-80 ring-2 ring-accent"
                          : ""
                      }`}
                      style={{
                        left,
                        width,
                        backgroundColor:
                          PHASE_COLORS[index % PHASE_COLORS.length],
                      }}
                      title={`${phase.name}: ${phase.startDate} – ${phase.endDate}`}
                    >
                      <span className="truncate">{phase.durationDays}d</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div
              className="grid"
              style={{ gridTemplateColumns: `140px ${timelineWidth}px` }}
            >
              <p className="pt-2 text-xs font-medium text-muted">Milestones</p>
              <div className="relative h-12 border-t border-border">
                {milestones.map((milestone) => (
                  <button
                    key={milestone.id}
                    type="button"
                    className="absolute top-3 h-4 w-4 -translate-x-1/2 rotate-45 cursor-grab border-2 border-white shadow-sm active:cursor-grabbing"
                    style={{
                      left: dateToOffset(milestone.date) + dayWidth / 2,
                      backgroundColor: milestone.color,
                    }}
                    title={milestone.label}
                    onPointerDown={(e) => handleMilestoneDrag(milestone.id, e)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(MILESTONE_TYPE_LABELS).map(([type, label]) => (
              <div
                key={type}
                className="flex items-center gap-2 text-xs text-muted"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rotate-45"
                  style={{
                    backgroundColor:
                      MILESTONE_COLORS[type as keyof typeof MILESTONE_COLORS],
                  }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
