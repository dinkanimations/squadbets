import type { TimelineWeek } from "./calculations";
import {
  buildTimelineWeeks,
  dateToWeekIndex,
  formatDateISO,
  parseDate,
} from "./calculations";
import {
  MILESTONE_COLORS,
  type MilestoneShape,
  type ScheduleMilestone,
} from "./constants";
import type { MilestoneType } from "@/types/database";

export function resolveMilestoneColor(
  milestone: ScheduleMilestone,
  milestoneLegend?: Partial<Record<MilestoneType, string>>,
): string {
  if (milestone.color?.trim()) return milestone.color;
  if (milestone.type && milestoneLegend?.[milestone.type]) {
    return milestoneLegend[milestone.type]!;
  }
  if (milestone.type) return MILESTONE_COLORS[milestone.type];
  return "#6366f1";
}

export function snapDateToWeekStart(
  date: string,
  scheduleStartDate: string,
  scheduleEndDate: string,
): string {
  const weeks = buildTimelineWeeks(scheduleStartDate, scheduleEndDate);
  if (weeks.length === 0) return date;

  const target = parseDate(date);
  for (const week of weeks) {
    const weekStart = parseDate(week.startDate);
    const weekEnd = parseDate(week.endDate);
    if (target >= weekStart && target <= weekEnd) {
      return week.startDate;
    }
  }

  const firstWeekStart = parseDate(weeks[0].startDate);
  const lastWeekEnd = parseDate(weeks[weeks.length - 1].endDate);
  if (target < firstWeekStart) return weeks[0].startDate;
  if (target > lastWeekEnd) return weeks[weeks.length - 1].startDate;
  return date;
}

export function sortMilestones(milestones: ScheduleMilestone[]): ScheduleMilestone[] {
  return [...milestones].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.date.localeCompare(b.date);
  });
}

export type MilestoneWeekPlacement = {
  milestone: ScheduleMilestone;
  weekIndex: number;
  indexInWeek: number;
  weekCount: number;
};

export function placeMilestonesByWeek(
  milestones: ScheduleMilestone[],
  weeks: TimelineWeek[],
): MilestoneWeekPlacement[] {
  const sorted = sortMilestones(milestones);
  const weekBuckets = new Map<number, ScheduleMilestone[]>();

  for (const milestone of sorted) {
    const weekIndex = weeks.length
      ? dateToWeekIndex(milestone.date, weeks)
      : 0;
    const bucket = weekBuckets.get(weekIndex) ?? [];
    bucket.push(milestone);
    weekBuckets.set(weekIndex, bucket);
  }

  const placements: MilestoneWeekPlacement[] = [];

  for (const [weekIndex, bucket] of weekBuckets.entries()) {
    bucket.forEach((milestone, indexInWeek) => {
      placements.push({
        milestone,
        weekIndex,
        indexInWeek,
        weekCount: bucket.length,
      });
    });
  }

  return placements;
}

export function reorderMilestones(
  milestones: ScheduleMilestone[],
  milestoneId: string,
  direction: "up" | "down",
): ScheduleMilestone[] {
  const sorted = sortMilestones(milestones);
  const index = sorted.findIndex((milestone) => milestone.id === milestoneId);
  if (index < 0) return milestones;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= sorted.length) return milestones;

  const next = [...sorted];
  [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  return next.map((milestone, sortOrder) => ({ ...milestone, sortOrder }));
}

export function milestoneShapeClass(shape: MilestoneShape = "diamond"): string {
  switch (shape) {
    case "circle":
      return "rounded-full";
    case "square":
      return "rounded-sm";
    default:
      return "rotate-45 rounded-sm";
  }
}

export function formatMilestoneWeekLabel(
  date: string,
  weeks: TimelineWeek[],
): string {
  const weekIndex = weeks.length ? dateToWeekIndex(date, weeks) : -1;
  if (weekIndex < 0 || !weeks[weekIndex]) {
    return formatDateISO(parseDate(date));
  }
  return weeks[weekIndex].label;
}
