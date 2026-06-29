import type { DiscountType, QuoteStatus } from "@/types/database";

export const QUOTE_STATUSES: QuoteStatus[] = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "expired",
];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
};

export const DISCOUNT_TYPES: DiscountType[] = ["percentage", "fixed"];

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: "Percentage (%)",
  fixed: "Fixed Amount (£)",
};

export const DEFAULT_BUDGET_SECTIONS = [
  "Studio Leads",
  "Design",
  "Modelling",
  "Animation",
  "Lighting",
  "Rendering",
  "Editing",
  "Music",
  "Miscellaneous",
] as const;

export type BudgetLineItemDraft = {
  id: string;
  description: string;
  dayRate: number;
  numDays: number;
};

export type BudgetSectionDraft = {
  id: string;
  name: string;
  lineItems: BudgetLineItemDraft[];
};

export type DeliverableDraft = {
  id: string;
  title: string;
  description: string;
  quantity: number;
};

export type QuoteFormDraft = {
  companyId: string;
  contactId: string;
  opportunityId: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  notes: string;
  status: QuoteStatus;
  discountType: DiscountType;
  discountValue: number;
  deliverables: DeliverableDraft[];
  budgetSections: BudgetSectionDraft[];
};

export function createEmptyLineItem(): BudgetLineItemDraft {
  return {
    id: crypto.randomUUID(),
    description: "",
    dayRate: 0,
    numDays: 0,
  };
}

export function createDefaultBudgetSections(): BudgetSectionDraft[] {
  return DEFAULT_BUDGET_SECTIONS.map((name) => ({
    id: crypto.randomUUID(),
    name,
    lineItems: [createEmptyLineItem()],
  }));
}

export function createEmptyDeliverable(): DeliverableDraft {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    quantity: 1,
  };
}

export function createEmptyQuoteDraft(): QuoteFormDraft {
  return {
    companyId: "",
    contactId: "",
    opportunityId: "",
    projectId: "",
    projectTitle: "",
    clientName: "",
    notes: "",
    status: "draft",
    discountType: "fixed",
    discountValue: 0,
    deliverables: [createEmptyDeliverable()],
    budgetSections: createDefaultBudgetSections(),
  };
}
