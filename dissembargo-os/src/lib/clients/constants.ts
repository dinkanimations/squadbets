import type { ClientStatus } from "@/types/database";

export const CLIENT_STATUSES: ClientStatus[] = [
  "prospect",
  "onboarding",
  "active",
  "inactive",
  "churned",
];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  prospect: "Prospect",
  onboarding: "Onboarding",
  active: "Active",
  inactive: "Inactive",
  churned: "Churned",
};

export function formatClientDate(date: string | null): string {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
