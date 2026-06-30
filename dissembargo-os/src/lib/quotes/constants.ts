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
  "Creative Direction",
  "Design",
  "Modelling",
  "Animation",
  "Lighting",
  "Rendering",
  "Editing",
  "Music",
  "Miscellaneous",
] as const;

export const DEFAULT_SECTION_LINE_ITEMS: Record<string, string[]> = {
  "Creative Direction": ["Creative Director", "Producer"],
};

export const DEFAULT_QUOTE_VERSION = "V1";

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
  version: string;
  notes: string;
  status: QuoteStatus;
  discountType: DiscountType;
  discountValue: number;
  expiryDate: string;
  deliverables: DeliverableDraft[];
  budgetSections: BudgetSectionDraft[];
};

export function createLineItem(
  description = "",
  dayRate = 0,
): BudgetLineItemDraft {
  return {
    id: crypto.randomUUID(),
    description,
    dayRate,
    numDays: 0,
  };
}

export function createEmptyLineItem(): BudgetLineItemDraft {
  return createLineItem();
}

export function createDefaultBudgetSections(): BudgetSectionDraft[] {
  return createBudgetSectionsFromNames([...DEFAULT_BUDGET_SECTIONS], {});
}

function normalizeSectionName(name: string): string {
  return name === "Studio Leads" ? "Creative Direction" : name;
}

export function createBudgetSectionsFromNames(
  sectionNames: string[],
  dayRates: Record<string, number>,
): BudgetSectionDraft[] {
  return sectionNames.map((rawName) => {
    const name = normalizeSectionName(rawName);
    const defaultRoles = DEFAULT_SECTION_LINE_ITEMS[name];

    const lineItems = defaultRoles
      ? defaultRoles.map((role) =>
          createLineItem(role, dayRates[role] ?? dayRates[name] ?? 0),
        )
      : [createLineItem("", dayRates[name] ?? 0)];

    return {
      id: crypto.randomUUID(),
      name,
      lineItems,
    };
  });
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
    version: DEFAULT_QUOTE_VERSION,
    notes: "",
    status: "draft",
    discountType: settings.defaultDiscountType,
    discountValue: settings.defaultDiscountValue,
    expiryDate: defaultExpiryDateFromDays(settings.quoteValidityDays),
    deliverables: [createEmptyDeliverable()],
    budgetSections: createBudgetSectionsFromNames(
      settings.defaultBudgetSections.map(normalizeSectionName),
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
    version: DEFAULT_QUOTE_VERSION,
    notes: "",
    status: "draft",
    discountType: "fixed",
    discountValue: 0,
    expiryDate: defaultExpiryDate(),
    deliverables: [createEmptyDeliverable()],
    budgetSections: createDefaultBudgetSections(),
  };
}
