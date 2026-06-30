import {
  normalizeScheduleData,
  type ScheduleData,
  type SchedulePhase,
} from "./constants";

export function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysBetween(start: string, end: string): number {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
}

export function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil((diff / (1000 * 60 * 60 * 24) + start.getDay() + 1) / 7);
}

export type TimelineWeek = {
  weekNumber: number;
  startDate: string;
  endDate: string;
  label: string;
};

export function buildTimelineWeeks(
  startDate: string,
  deliveryDate: string,
): TimelineWeek[] {
  const start = parseDate(startDate);
  const end = parseDate(deliveryDate);
  const weeks: TimelineWeek[] = [];

  let cursor = new Date(start);
  while (cursor <= end) {
    const weekStart = new Date(cursor);
    const weekEnd = addDays(cursor, 6);
    if (weekEnd > end) {
      weekEnd.setTime(end.getTime());
    }

    weeks.push({
      weekNumber: getWeekNumber(weekStart),
      startDate: formatDateISO(weekStart),
      endDate: formatDateISO(weekEnd),
      label: `W${getWeekNumber(weekStart)}`,
    });

    cursor = addDays(cursor, 7);
  }

  return weeks;
}

export function phaseOverlapsWeek(
  phase: SchedulePhase,
  week: TimelineWeek,
): boolean {
  const phaseStart = parseDate(phase.startDate);
  const phaseEnd = parseDate(phase.endDate);
  const weekStart = parseDate(week.startDate);
  const weekEnd = parseDate(week.endDate);

  return phaseStart <= weekEnd && phaseEnd >= weekStart;
}

export function dateToWeekIndex(
  date: string,
  weeks: TimelineWeek[],
): number {
  const target = parseDate(date);
  const index = weeks.findIndex((week) => {
    const start = parseDate(week.startDate);
    const end = parseDate(week.endDate);
    return target >= start && target <= end;
  });
  return index >= 0 ? index : 0;
}

export function parseScheduleData(json: unknown): ScheduleData {
  if (!json || typeof json !== "object") {
    return normalizeScheduleData({});
  }

  const data = json as Partial<ScheduleData>;
  return normalizeScheduleData({
    phases: Array.isArray(data.phases) ? data.phases : [],
    milestones: Array.isArray(data.milestones) ? data.milestones : [],
    workingDays: data.workingDays,
    companyHolidays: data.companyHolidays,
    shutdownPeriods: data.shutdownPeriods,
    milestoneLegend: data.milestoneLegend,
  });
}

export type TimelineDay = {
  date: string;
  dayOfWeek: number;
  dayLabel: string;
  dateLabel: string;
  isWorkingDay: boolean;
  isHoliday: boolean;
};

export function buildTimelineDays(
  startDate: string,
  deliveryDate: string,
  workingDays: number[],
  companyHolidays: string[],
): TimelineDay[] {
  const start = parseDate(startDate);
  const end = parseDate(deliveryDate);
  const days: TimelineDay[] = [];
  const holidaySet = new Set(companyHolidays);
  const cursor = new Date(start);

  while (cursor <= end) {
    const date = formatDateISO(cursor);
    const dayOfWeek = cursor.getDay();
    days.push({
      date,
      dayOfWeek,
      dayLabel: cursor.toLocaleDateString("en-GB", { weekday: "narrow" }),
      dateLabel: String(cursor.getDate()),
      isWorkingDay: workingDays.includes(dayOfWeek),
      isHoliday: holidaySet.has(date),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function formatScheduleDate(date: string): string {
  const isoDate = date.includes("T") ? date.split("T")[0] : date;
  return parseDate(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
