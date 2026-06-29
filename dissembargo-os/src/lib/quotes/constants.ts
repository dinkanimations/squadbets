import type { DiscountType, QuoteStatus } from "@/types/database";
import type { AppSettingsData } from "@/lib/settings/types";
import { defaultExpiryDateFromDays } from "@/lib/settings/utils";

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

export function defaultExpiryDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split("T")[0];
}

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
  expiryDate: string;
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
  return createBudgetSectionsFromNames([...DEFAULT_BUDGET_SECTIONS], {});
}

export function createBudgetSectionsFromNames(
  sectionNames: string[],
  dayRates: Record<string, number>,
): BudgetSectionDraft[] {
  return sectionNames.map((name) => ({
    id: crypto.randomUUID(),
    name,
    lineItems: [
      {
        id: crypto.randomUUID(),
        description: "",
        dayRate: dayRates[name] ?? 0,
        numDays: 0,
      },
    ],
  }));
}

export function createEmptyQuoteDraftFromSettings(
  settings: AppSettingsData,
): QuoteFormDraft {
  return {
    companyId: "",
    contactId: "",
    opportunityId: "",
    projectId: "",
    projectTitle: "",
    clientName: "",
    notes: "",
    status: "draft",
    discountType: settings.defaultDiscountType,
    discountValue: settings.defaultDiscountValue,
    expiryDate: defaultExpiryDateFromDays(settings.quoteValidityDays),
    deliverables: [createEmptyDeliverable()],
    budgetSections: createBudgetSectionsFromNames(
      settings.defaultBudgetSections,
      settings.defaultDayRates,
    ),
  };
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
    expiryDate: defaultExpiryDate(),
    deliverables: [createEmptyDeliverable()],
    budgetSections: createDefaultBudgetSections(),
  };
}
