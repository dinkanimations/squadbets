import { buildPdfBrandFromSettings } from "@/lib/settings/defaults";
import type { AppSettingsData } from "@/lib/settings/types";
import {
  calculateDiscountAmount,
  calculateGrandTotal,
  calculateLineTotal,
  calculateSectionTotal,
  calculateSubtotal,
  formatCurrency,
  formatQuoteDate,
} from "@/lib/quotes/calculations";
import type { QuoteFormDraft } from "@/lib/quotes/constants";
import type { QuotePdfData } from "@/lib/pdf/quote/types";

export type QuotePreviewMeta = {
  quoteNumber?: string;
  issueDate?: string;
  expiryDate?: string;
};

export function buildQuotePreviewData(
  draft: QuoteFormDraft,
  settings: AppSettingsData,
  meta: QuotePreviewMeta = {},
): QuotePdfData {
  const brand = buildPdfBrandFromSettings(settings);
  const subtotal = calculateSubtotal(draft.budgetSections);
  const discountAmount = calculateDiscountAmount(
    subtotal,
    draft.discountType,
    draft.discountValue,
  );
  const grandTotal = calculateGrandTotal(
    subtotal,
    draft.discountType,
    draft.discountValue,
  );

  const budgetSections = draft.budgetSections
    .map((section) => {
      const lines = section.lineItems
        .filter(
          (item) =>
            item.description.trim() || item.dayRate > 0 || item.numDays > 0,
        )
        .map((item) => ({
          description: item.description.trim() || "—",
          dayRate: item.dayRate,
          numDays: item.numDays,
          total: calculateLineTotal(item.dayRate, item.numDays),
        }));

      if (lines.length === 0) return null;

      return {
        name: section.name,
        lines,
        sectionTotal: calculateSectionTotal(section),
      };
    })
    .filter((section): section is NonNullable<typeof section> => section !== null);

  const deliverables = draft.deliverables
    .filter((item) => item.title.trim() || item.description.trim())
    .map((item) => ({
      title: item.title.trim() || "Deliverable",
      description: item.description.trim() || null,
      quantity: item.quantity || 1,
    }));

  const issueDate = meta.issueDate
    ? formatQuoteDate(meta.issueDate)
    : formatQuoteDate(new Date().toISOString());

  const expiryDate = draft.expiryDate
    ? formatQuoteDate(draft.expiryDate)
    : meta.expiryDate
      ? formatQuoteDate(meta.expiryDate)
      : issueDate;

  return {
    quoteNumber: meta.quoteNumber ?? "DRAFT",
    version: draft.version.trim() || null,
    clientName: draft.clientName.trim() || "Client",
    projectTitle: draft.projectTitle.trim() || "Project Quotation",
    issueDate,
    expiryDate,
    notes: draft.notes.trim() || null,
    agencyName: brand.agencyName,
    tagline: brand.tagline,
    email: brand.email,
    website: brand.website,
    address: brand.address,
    terms: settings.defaultTerms,
    brand,
    deliverables,
    budgetSections,
    subtotal,
    discountType: draft.discountType,
    discountValue: draft.discountValue,
    discountAmount,
    grandTotal,
  };
}

export { formatCurrency };
