import { buildPdfBrandFromSettings } from "@/lib/settings/defaults";
import type { AppSettingsData } from "@/lib/settings/types";
import {
  buildTimelineWeeks,
  daysBetween,
  formatScheduleDate,
  parseDate,
} from "@/lib/production-schedules/calculations";
import {
  resolveMilestoneColor,
  sortMilestones,
} from "@/lib/production-schedules/milestone-utils";
import type { ScheduleFormDraft } from "@/lib/production-schedules/constants";
import type { SchedulePdfData } from "@/lib/pdf/schedule/types";

export type SchedulePreviewMeta = {
  clientName?: string;
  versionNumber?: number;
  createdDate?: string;
};

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

export function buildSchedulePreviewData(
  draft: ScheduleFormDraft,
  settings: AppSettingsData,
  meta: SchedulePreviewMeta = {},
): SchedulePdfData {
  const brand = buildPdfBrandFromSettings(settings);
  const { scheduleData } = draft;
  const startDate = draft.startDate;
  const deliveryDate = draft.deliveryDate;
  const totalDurationDays =
    startDate && deliveryDate ? daysBetween(startDate, deliveryDate) : 0;

  const weeks = buildTimelineWeeks(startDate, deliveryDate).map((week) => ({
    weekNumber: week.weekNumber,
    startDate: week.startDate,
    endDate: week.endDate,
    label: week.label,
    dateLabel: formatScheduleDate(week.startDate),
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
      color: phase.color,
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

  const deliverables = draft.deliverables.filter((item) => item.trim());

  return {
    clientName: draft.clientName.trim() || scheduleData.clientName || meta.clientName || "Client",
    projectTitle: draft.projectTitle.trim() || "Production Schedule",
    versionNumber: meta.versionNumber ?? 1,
    createdDate: meta.createdDate
      ? formatScheduleDate(meta.createdDate)
      : formatScheduleDate(new Date().toISOString()),
    startDate: startDate ? formatScheduleDate(startDate) : "—",
    deliveryDate: deliveryDate ? formatScheduleDate(deliveryDate) : "—",
    reviewRounds: draft.reviewRounds,
    totalDurationDays,
    deliverables,
    notes: draft.notes.trim() || null,
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
