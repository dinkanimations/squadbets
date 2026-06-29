import type { MilestoneType, ScheduleStatus } from "@/types/database";

export const SCHEDULE_STATUSES: ScheduleStatus[] = ["draft", "active", "archived"];

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  draft: "Draft",
  active: "In Production",
  archived: "Archived",
};

export const DEFAULT_PHASES = [
  "Scoping",
  "Research",
  "Look Development",
  "Design",
  "Modelling",
  "Animation",
  "Lighting",
  "Rendering",
  "Compositing",
  "Client Review",
  "Final Delivery",
] as const;

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
  client_approval: "Client Approval",
  final_delivery: "Final Delivery",
};

export const MILESTONE_COLORS: Record<MilestoneType, string> = {
  kick_off: "#6366f1",
  wip_review: "#818cf8",
  client_feedback: "#fbbf24",
  client_approval: "#34d399",
  final_delivery: "#f87171",
};

/** Relative weights for auto-distributing phase duration. */
export const PHASE_WEIGHTS: Record<string, number> = {
  Scoping: 1,
  Research: 1,
  "Look Development": 2,
  Design: 2,
  Modelling: 3,
  Animation: 4,
  Lighting: 2,
  Rendering: 2,
  Compositing: 2,
  "Client Review": 1,
  "Final Delivery": 1,
};

export type SchedulePhase = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  sortOrder: number;
  notes: string;
};

export type ScheduleMilestone = {
  id: string;
  type: MilestoneType;
  label: string;
  date: string;
  sortOrder: number;
  notes: string;
};

export type ScheduleData = {
  phases: SchedulePhase[];
  milestones: ScheduleMilestone[];
};

export type ScheduleFormDraft = {
  companyId: string;
  opportunityId: string;
  quoteId: string;
  projectId: string;
  projectTitle: string;
  startDate: string;
  deliveryDate: string;
  reviewRounds: number;
  deliverables: string[];
  notes: string;
  status: ScheduleStatus;
  scheduleData: ScheduleData;
};

export function createEmptyScheduleDraft(): ScheduleFormDraft {
  const today = new Date();
  const delivery = new Date(today);
  delivery.setDate(delivery.getDate() + 42);

  return {
    companyId: "",
    opportunityId: "",
    quoteId: "",
    projectId: "",
    projectTitle: "",
    startDate: today.toISOString().split("T")[0],
    deliveryDate: delivery.toISOString().split("T")[0],
    reviewRounds: 2,
    deliverables: [""],
    notes: "",
    status: "draft",
    scheduleData: { phases: [], milestones: [] },
  };
}
