import type { QuoteFull } from "@/lib/database/quotes";
import {
  calculateDiscountAmount,
  calculateGrandTotal,
  calculateLineTotal,
} from "@/lib/quotes/calculations";
import { getPdfBrand, getQuoteValidityDays, getDefaultTerms } from "@/lib/settings/loader";
import type { QuotePdfData } from "./types";
import { formatPdfDate } from "./styles";

async function resolveExpiryDate(quote: QuoteFull): Promise<string> {
  if (quote.expiry_date) {
    return formatPdfDate(quote.expiry_date);
  }

  const validityDays = await getQuoteValidityDays();
  const created = new Date(quote.created_at);
  created.setDate(created.getDate() + validityDays);
  return formatPdfDate(created);
}

export async function buildQuotePdfData(quote: QuoteFull): Promise<QuotePdfData> {
  const brand = await getPdfBrand();
  const terms = await getDefaultTerms();
  const budgetSections = quote.budget_sections
    .map((section) => {
      const lines = section.line_items
        .filter(
          (item) =>
            item.description.trim() ||
            item.day_rate > 0 ||
            item.num_days > 0,
        )
        .map((item) => ({
          description: item.description.trim() || "—",
          dayRate: item.day_rate,
          numDays: item.num_days,
          total: calculateLineTotal(item.day_rate, item.num_days),
        }));

      if (lines.length === 0) return null;

      return {
        name: section.name,
        lines,
        sectionTotal: lines.reduce((sum, line) => sum + line.total, 0),
      };
    })
    .filter((section): section is NonNullable<typeof section> => section !== null);

  const deliverables = quote.deliverables
    .filter((d) => d.title.trim() || d.description?.trim())
    .map((d) => ({
      title: d.title.trim() || "Deliverable",
      description: d.description,
      quantity: d.quantity,
    }));

  const subtotal = quote.subtotal;
  const discountAmount = calculateDiscountAmount(
    subtotal,
    quote.discount_type,
    quote.discount_value,
  );
  const grandTotal = calculateGrandTotal(
    subtotal,
    quote.discount_type,
    quote.discount_value,
  );

  return {
    quoteNumber: quote.quote_number,
    clientName: quote.client_name ?? quote.company?.company_name ?? "Client",
    projectTitle: quote.project_title ?? "Project Quotation",
    issueDate: formatPdfDate(quote.created_at),
    expiryDate: await resolveExpiryDate(quote),
    notes: quote.notes,
    agencyName: brand.agencyName,
    tagline: brand.tagline,
    email: brand.email,
    website: brand.website,
    address: brand.address,
    terms,
    brand,
    deliverables,
    budgetSections,
    subtotal,
    discountType: quote.discount_type,
    discountValue: quote.discount_value,
    discountAmount,
    grandTotal,
  };
}
