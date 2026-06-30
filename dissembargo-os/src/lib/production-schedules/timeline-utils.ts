import {
  addDays,
  formatDateISO,
  parseDate,
} from "@/lib/production-schedules/calculations";

export const TIMELINE_DAY_WIDTH = 26;
export const TIMELINE_LABEL_WIDTH = 132;

export function dateToTimelineOffset(
  date: string,
  startDate: string,
  dayWidth = TIMELINE_DAY_WIDTH,
): number {
  const start = parseDate(startDate);
  const target = parseDate(date);
  const days = Math.round((target.getTime() - start.getTime()) / 86400000);
  return Math.max(0, days * dayWidth);
}

export function timelineOffsetToDate(
  offsetPx: number,
  startDate: string,
  dayWidth = TIMELINE_DAY_WIDTH,
): string {
  const days = Math.round(offsetPx / dayWidth);
  return formatDateISO(addDays(parseDate(startDate), days));
}

export function durationToWidth(
  durationDays: number,
  dayWidth = TIMELINE_DAY_WIDTH,
): number {
  return Math.max(dayWidth, durationDays * dayWidth);
}

export function snapTimelineOffset(
  offsetPx: number,
  dayWidth = TIMELINE_DAY_WIDTH,
): number {
  return Math.round(offsetPx / dayWidth) * dayWidth;
}
