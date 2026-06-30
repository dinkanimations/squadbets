import type { QuoteFormDraft } from "./constants";

export function serializeQuoteDraft(draft: QuoteFormDraft): string {
  return JSON.stringify({
    companyId: draft.companyId,
    contactId: draft.contactId,
    opportunityId: draft.opportunityId,
    projectId: draft.projectId,
    projectTitle: draft.projectTitle,
    clientName: draft.clientName,
    version: draft.version,
    notes: draft.notes,
    status: draft.status,
    discountType: draft.discountType,
    discountValue: draft.discountValue,
    expiryDate: draft.expiryDate,
    deliverables: draft.deliverables,
    budgetSections: draft.budgetSections,
  });
}
