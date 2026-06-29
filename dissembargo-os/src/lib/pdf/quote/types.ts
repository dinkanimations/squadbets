import type { DiscountType } from "@/types/database";
import type { PdfBrandConfig } from "@/lib/settings/types";

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
  tagline: string;
  email: string;
  website: string;
  address: string;
  terms: string[];
  brand: PdfBrandConfig;
  deliverables: QuotePdfDeliverable[];
  budgetSections: QuotePdfBudgetSection[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  grandTotal: number;
};
