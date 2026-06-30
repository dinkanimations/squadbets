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
  wip_review: "WIP Review",
  client_feedback: "Client Feedback",
  client_approval: "Client Approval / Sign-off",
  final_delivery: "Delivery",
};

export const MILESTONE_COLORS: Record<MilestoneType, string> = {
  kick_off: "#3b82f6",
  wip_review: "#a855f7",
  client_feedback: "#eab308",
  client_approval: "#22c55e",
  final_delivery: "#ef4444",
};

export const MILESTONE_SHAPES = ["diamond", "circle", "square"] as const;

export type MilestoneShape = (typeof MILESTONE_SHAPES)[number];

export const MILESTONE_SHAPE_LABELS: Record<MilestoneShape, string> = {
  diamond: "Diamond",
  circle: "Circle",
  square: "Square",
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
  /** @deprecated Legacy type hint — colour and label are user-controlled */
  type?: MilestoneType;
  label: string;
  date: string;
  sortOrder: number;
  notes: string;
  color: string;
  icon?: string | null;
  shape?: MilestoneShape;
  visibleInPdf?: boolean;
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
    milestones: (data.milestones ?? []).map((milestone, index) =>
      normalizeMilestone(milestone, index, data.milestoneLegend),
    ),
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

export function normalizeMilestone(
  milestone: Partial<ScheduleMilestone> & { id: string },
  index: number,
  milestoneLegend?: Partial<Record<MilestoneType, string>>,
): ScheduleMilestone {
  const type = milestone.type;
  const color =
    milestone.color?.trim() ||
    (type && milestoneLegend?.[type]) ||
    (type ? MILESTONE_COLORS[type] : "#6366f1");

  return {
    id: milestone.id,
    type,
    label: milestone.label ?? "Milestone",
    date: milestone.date ?? new Date().toISOString().split("T")[0],
    sortOrder: milestone.sortOrder ?? index,
    notes: milestone.notes ?? "",
    color,
    icon: milestone.icon ?? null,
    shape: milestone.shape ?? "diamond",
    visibleInPdf: milestone.visibleInPdf !== false,
  };
}

export function createEmptyMilestone(
  date: string,
  sortOrder: number,
  overrides?: Partial<
    Pick<ScheduleMilestone, "label" | "color" | "type" | "shape" | "icon">
  >,
): ScheduleMilestone {
  const type = overrides?.type ?? "wip_review";
  return normalizeMilestone(
    {
      id: crypto.randomUUID(),
      type,
      label: overrides?.label ?? "New Milestone",
      date,
      sortOrder,
      color: overrides?.color ?? MILESTONE_COLORS[type],
      shape: overrides?.shape ?? "diamond",
      icon: overrides?.icon ?? null,
      ...overrides,
    },
    sortOrder,
  );
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
