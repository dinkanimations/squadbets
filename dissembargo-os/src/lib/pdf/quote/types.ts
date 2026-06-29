import type { DiscountType } from "@/types/database";

export type QuotePdfDeliverable = {
  title: string;
  description: string | null;
  quantity: number;
};

export type QuotePdfBudgetLine = {
  description: string;
  dayRate: number;
  numDays: number;
  total: number;
};

export type QuotePdfBudgetSection = {
  name: string;
  lines: QuotePdfBudgetLine[];
  sectionTotal: number;
};

export type QuotePdfData = {
  quoteNumber: string;
  clientName: string;
  projectTitle: string;
  issueDate: string;
  expiryDate: string;
  notes: string | null;
  agencyName: string;
  deliverables: QuotePdfDeliverable[];
  budgetSections: QuotePdfBudgetSection[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  grandTotal: number;
};
