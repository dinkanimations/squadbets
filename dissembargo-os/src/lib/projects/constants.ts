import type { ProjectPriority, ProjectStatus } from "@/types/database";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "in_progress",
  "waiting_for_client",
  "rendering",
  "review",
  "complete",
  "archived",
];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  waiting_for_client: "Waiting for Client",
  rendering: "Rendering",
  review: "Review",
  complete: "Complete",
  archived: "Archived",
};

export const PROJECT_PRIORITIES: ProjectPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export type ProjectFormDraft = {
  projectName: string;
  companyId: string;
  contactId: string;
  opportunityId: string;
  quoteId: string;
  status: ProjectStatus;
  startDate: string;
  deliveryDate: string;
  producer: string;
  teamMembers: string[];
  priority: ProjectPriority;
  budget: number;
  notes: string;
};

export function createEmptyProjectDraft(): ProjectFormDraft {
  const today = new Date();
  const delivery = new Date(today);
  delivery.setDate(delivery.getDate() + 42);

  return {
    projectName: "",
    companyId: "",
    contactId: "",
    opportunityId: "",
    quoteId: "",
    status: "planning",
    startDate: today.toISOString().split("T")[0],
    deliveryDate: delivery.toISOString().split("T")[0],
    producer: "",
    teamMembers: [],
    priority: "medium",
    budget: 0,
    notes: "",
  };
}

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export const MAX_FILE_SIZE = 100 * 1024 * 1024;
