import type { QuoteFull } from "@/lib/database/quotes";
import type { QuoteFormDraft } from "./constants";

export function quoteToFormDraft(quote: QuoteFull): QuoteFormDraft {
  return {
    companyId: quote.company_id ?? "",
    contactId: quote.contact_id ?? "",
    opportunityId: quote.opportunity_id ?? "",
    projectId: quote.project_id ?? "",
    projectTitle: quote.project_title ?? "",
    clientName: quote.client_name ?? "",
    notes: quote.notes ?? "",
    status: quote.quote_status,
    discountType: quote.discount_type,
    discountValue: quote.discount_value,
    deliverables:
      quote.deliverables.length > 0
        ? quote.deliverables.map((d) => ({
            id: d.id,
            title: d.title,
            description: d.description ?? "",
            quantity: d.quantity,
          }))
        : [],
    budgetSections:
      quote.budget_sections.length > 0
        ? quote.budget_sections.map((section) => ({
            id: section.id,
            name: section.name,
            lineItems:
              section.line_items.length > 0
                ? section.line_items.map((item) => ({
                    id: item.id,
                    description: item.description,
                    dayRate: item.day_rate,
                    numDays: item.num_days,
                  }))
                : [],
          }))
        : [],
  };
}
