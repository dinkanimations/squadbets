import type { OpportunityStatus } from "@/types/database";

type BadgeVariant = "default" | "success" | "warning" | "danger";

export function getOpportunityStatusVariant(
  status: OpportunityStatus,
): BadgeVariant {
  switch (status) {
    case "won":
      return "success";
    case "lost":
      return "danger";
    case "contacted":
    case "quote_requested":
    case "quote_sent":
      return "warning";
    case "archived":
      return "default";
    case "new":
    default:
      return "default";
  }
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
