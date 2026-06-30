import type { ScheduleFull } from "@/lib/database/production-schedules";
import {
  buildTimelineWeeks,
  daysBetween,
  parseDate,
  parseScheduleData,
} from "@/lib/production-schedules/calculations";
import {
  resolveMilestoneColor,
  sortMilestones,
} from "@/lib/production-schedules/milestone-utils";
import { getPdfBrand } from "@/lib/settings/loader";
import { formatPdfDate } from "@/lib/pdf/quote/styles";
import { PDF_PHASE_COLORS } from "./constants";
import type { SchedulePdfData } from "./types";

function daysFromStart(startDate: string, targetDate: string): number {
  const start = parseDate(startDate);
  const target = parseDate(targetDate);
  return Math.max(
    0,
    Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function toPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

export async function buildSchedulePdfData(
  schedule: ScheduleFull,
): Promise<SchedulePdfData> {
  const brand = await getPdfBrand();
  const scheduleData = parseScheduleData(schedule.schedule_json);
  const startDate = schedule.start_date ?? "";
  const deliveryDate = schedule.delivery_date ?? "";
  const totalDurationDays =
    startDate && deliveryDate ? daysBetween(startDate, deliveryDate) : 0;

  const weeks = buildTimelineWeeks(startDate, deliveryDate).map((week) => ({
    weekNumber: week.weekNumber,
    startDate: week.startDate,
    endDate: week.endDate,
    label: week.label,
    dateLabel: formatPdfDate(week.startDate),
    widthPercent: toPercent(
      daysBetween(week.startDate, week.endDate),
      totalDurationDays,
    ),
  }));

  const phases = scheduleData.phases.map((phase) => {
    const offsetDays = daysFromStart(startDate, phase.startDate);
    return {
      id: phase.id,
      name: phase.name,
      startDate: phase.startDate,
      endDate: phase.endDate,
      durationDays: phase.durationDays,
      color: phase.color ?? PDF_PHASE_COLORS[0],
      leftPercent: toPercent(offsetDays, totalDurationDays),
      widthPercent: toPercent(phase.durationDays, totalDurationDays),
    };
  });

  const milestones = sortMilestones(scheduleData.milestones)
    .filter((milestone) => milestone.visibleInPdf !== false)
    .map((milestone) => ({
      id: milestone.id,
      type: milestone.type,
      label: milestone.label,
      date: milestone.date,
      color: resolveMilestoneColor(milestone, scheduleData.milestoneLegend),
      leftPercent: toPercent(
        daysFromStart(startDate, milestone.date),
        totalDurationDays,
      ),
      shape: milestone.shape ?? "diamond",
      icon: milestone.icon ?? null,
      visibleInPdf: milestone.visibleInPdf !== false,
      notes: milestone.notes,
      sortOrder: milestone.sortOrder,
    }));

  const deliverables = (schedule.deliverables ?? []).filter((item) =>
    item.trim(),
  );

  return {
    clientName: schedule.company?.company_name ?? "Client",
    projectTitle: schedule.project_title || "Production Schedule",
    versionNumber: schedule.current_version,
    createdDate: formatPdfDate(schedule.created_at),
    startDate: startDate ? formatPdfDate(startDate) : "—",
    deliveryDate: deliveryDate ? formatPdfDate(deliveryDate) : "—",
    reviewRounds: schedule.review_rounds,
    totalDurationDays,
    deliverables,
    notes: schedule.notes,
    agencyName: brand.agencyName,
    tagline: brand.tagline,
    email: brand.email,
    website: brand.website,
    brand,
    weeks,
    phases,
    milestones,
  };
}
