import type { MilestoneType } from "@/types/database";
import type { PdfBrandConfig } from "@/lib/settings/types";
import type { MilestoneShape } from "@/lib/production-schedules/constants";

export type SchedulePdfPhase = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  color: string;
  leftPercent: number;
  widthPercent: number;
};

export type SchedulePdfMilestone = {
  id: string;
  type?: MilestoneType;
  label: string;
  date: string;
  color: string;
  leftPercent: number;
  shape: MilestoneShape;
  icon?: string | null;
  visibleInPdf: boolean;
  notes?: string;
  sortOrder: number;
};

export type SchedulePdfWeek = {
  weekNumber: number;
  startDate: string;
  endDate: string;
  label: string;
  dateLabel: string;
  widthPercent: number;
};

export type SchedulePdfData = {
  clientName: string;
  projectTitle: string;
  versionNumber: number;
  createdDate: string;
  startDate: string;
  deliveryDate: string;
  reviewRounds: number;
  totalDurationDays: number;
  deliverables: string[];
  notes: string | null;
  agencyName: string;
  tagline: string;
  email: string;
  website: string;
  brand: PdfBrandConfig;
  weeks: SchedulePdfWeek[];
  phases: SchedulePdfPhase[];
  milestones: SchedulePdfMilestone[];
};
