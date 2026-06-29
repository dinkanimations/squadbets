import type { MilestoneType } from "@/types/database";

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
  type: MilestoneType;
  label: string;
  date: string;
  color: string;
  leftPercent: number;
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
  weeks: SchedulePdfWeek[];
  phases: SchedulePdfPhase[];
  milestones: SchedulePdfMilestone[];
};
