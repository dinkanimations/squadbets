import type { MilestoneType, ScheduleStatus } from "@/types/database";
import type { AppSettingsData } from "@/lib/settings/types";

export const SCHEDULE_STATUSES: ScheduleStatus[] = ["draft", "active", "archived"];

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  draft: "Draft",
  active: "In Production",
  archived: "Archived",
};

export const DEFAULT_PHASES = [
  "Scoping",
  "Look Development",
  "Design",
  "Product Check",
  "Animation",
  "Lighting",
  "Compositing",
  "Rendering",
  "Final Delivery",
] as const;

export const PHASE_COLORS = [
  "#6366f1",
  "#818cf8",
  "#4f46e5",
  "#7c3aed",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#312e81",
  "#4338ca",
  "#a5b4fc",
  "#ddd6fe",
];

export const MILESTONE_TYPES: MilestoneType[] = [
  "kick_off",
  "wip_review",
  "client_feedback",
  "client_approval",
  "final_delivery",
];

export const MILESTONE_TYPE_LABELS: Record<MilestoneType, string> = {
  kick_off: "Kick Off",
  wip_review: "WIP to Client",
  client_feedback: "Client Feedback Due",
  client_approval: "Client Approval Due",
  final_delivery: "Delivery",
};

export const MILESTONE_COLORS: Record<MilestoneType, string> = {
  kick_off: "#6366f1",
  wip_review: "#818cf8",
  client_feedback: "#fbbf24",
  client_approval: "#34d399",
  final_delivery: "#f87171",
};

export const PHASE_WEIGHTS: Record<string, number> = {
  Scoping: 1,
  "Look Development": 2,
  Design: 2,
  "Product Check": 1,
  Animation: 4,
  Lighting: 2,
  Compositing: 2,
  Rendering: 2,
  "Final Delivery": 1,
};

export const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5];

export type SchedulePhase = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  sortOrder: number;
  notes: string;
  color: string;
};

export type ScheduleMilestone = {
  id: string;
  type: MilestoneType;
  label: string;
  date: string;
  sortOrder: number;
  notes: string;
  color?: string;
};

export type ScheduleShutdownPeriod = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  color: string;
};

export type ScheduleData = {
  phases: SchedulePhase[];
  milestones: ScheduleMilestone[];
  workingDays: number[];
  companyHolidays: string[];
  shutdownPeriods: ScheduleShutdownPeriod[];
  milestoneLegend: Partial<Record<MilestoneType, string>>;
  clientName?: string;
};

export type ScheduleFormDraft = {
  companyId: string;
  opportunityId: string;
  quoteId: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  startDate: string;
  deliveryDate: string;
  reviewRounds: number;
  deliverables: string[];
  notes: string;
  status: ScheduleStatus;
  scheduleData: ScheduleData;
};

export function normalizeScheduleData(data: Partial<ScheduleData>): ScheduleData {
  return {
    phases: (data.phases ?? []).map((phase, index) => ({
      ...phase,
      color: phase.color ?? PHASE_COLORS[index % PHASE_COLORS.length],
    })),
    milestones: (data.milestones ?? []).map((milestone) => ({
      ...milestone,
      color: milestone.color ?? MILESTONE_COLORS[milestone.type],
    })),
    workingDays: data.workingDays?.length
      ? data.workingDays
      : [...DEFAULT_WORKING_DAYS],
    companyHolidays: data.companyHolidays ?? [],
    shutdownPeriods: data.shutdownPeriods ?? [],
    milestoneLegend: {
      ...MILESTONE_COLORS,
      ...(data.milestoneLegend ?? {}),
    },
  };
}

export function createEmptyScheduleData(): ScheduleData {
  return normalizeScheduleData({
    phases: [],
    milestones: [],
    workingDays: [...DEFAULT_WORKING_DAYS],
    companyHolidays: [],
    shutdownPeriods: [],
    milestoneLegend: { ...MILESTONE_COLORS },
  });
}

export function createEmptyScheduleDraft(): ScheduleFormDraft {
  const today = new Date();
  const delivery = new Date(today);
  delivery.setDate(delivery.getDate() + 42);
  const startDate = today.toISOString().split("T")[0];
  const deliveryDate = delivery.toISOString().split("T")[0];

  return {
    companyId: "",
    opportunityId: "",
    quoteId: "",
    projectId: "",
    projectTitle: "",
    clientName: "",
    startDate,
    deliveryDate,
    reviewRounds: 2,
    deliverables: [""],
    notes: "",
    status: "draft",
    scheduleData: createEmptyScheduleData(),
  };
}

export function createEmptyScheduleDraftFromSettings(
  settings: AppSettingsData,
): ScheduleFormDraft {
  const today = new Date();
  const delivery = new Date(today);
  delivery.setDate(delivery.getDate() + settings.defaultScheduleDurationDays);
  const startDate = today.toISOString().split("T")[0];
  const deliveryDate = delivery.toISOString().split("T")[0];

  return {
    companyId: "",
    opportunityId: "",
    quoteId: "",
    projectId: "",
    projectTitle: "",
    clientName: "",
    startDate,
    deliveryDate,
    reviewRounds: settings.defaultReviewRounds,
    deliverables: [""],
    notes: "",
    status: "draft",
    scheduleData: createEmptyScheduleData(),
  };
}

export function createEmptyPhase(
  startDate: string,
  sortOrder: number,
  color?: string,
): SchedulePhase {
  return {
    id: crypto.randomUUID(),
    name: "New Phase",
    startDate,
    endDate: startDate,
    durationDays: 1,
    sortOrder,
    notes: "",
    color: color ?? PHASE_COLORS[sortOrder % PHASE_COLORS.length],
  };
}

export function createEmptyMilestone(
  date: string,
  sortOrder: number,
  type: MilestoneType = "wip_review",
): ScheduleMilestone {
  return {
    id: crypto.randomUUID(),
    type,
    label: MILESTONE_TYPE_LABELS[type],
    date,
    sortOrder,
    notes: "",
    color: MILESTONE_COLORS[type],
  };
}

export function createShutdownPeriod(
  startDate: string,
  endDate: string,
): ScheduleShutdownPeriod {
  return {
    id: crypto.randomUUID(),
    label: "Company Shutdown",
    startDate,
    endDate,
    color: "rgba(248, 113, 113, 0.25)",
  };
}
