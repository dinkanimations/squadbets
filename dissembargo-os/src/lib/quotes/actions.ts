"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContactsByCompanyId } from "@/lib/database/contacts";
import { getAllCompanies } from "@/lib/database/companies";
import { getOpportunitiesFiltered } from "@/lib/database/opportunities";
import {
  archiveQuote,
  createQuoteRecord,
  generateQuoteNumber,
  getQuoteFullById,
  saveQuoteChildren,
  updateQuoteRecord,
} from "@/lib/database/quotes";
import {
  calculateDiscountAmount,
  calculateGrandTotal,
  calculateLineTotal,
  calculateSubtotal,
} from "@/lib/quotes/calculations";
import type {
  BudgetSectionDraft,
  DeliverableDraft,
} from "@/lib/quotes/constants";
import type { DiscountType, QuoteStatus } from "@/types/database";

export type QuoteActionState = {
  error?: string;
  success?: string;
};

export type QuotePayload = {
  companyId: string;
  contactId: string | null;
  opportunityId: string | null;
  projectId: string | null;
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

function parsePayload(raw: string): QuotePayload {
  const parsed = JSON.parse(raw) as QuotePayload;

  if (!parsed.companyId?.trim()) {
    throw new Error("Company is required.");
  }

  return parsed;
}

function buildTotals(payload: QuotePayload) {
  const subtotal = calculateSubtotal(payload.budgetSections);
  const discount = calculateDiscountAmount(
    subtotal,
    payload.discountType,
    payload.discountValue,
  );
  const total = calculateGrandTotal(
    subtotal,
    payload.discountType,
    payload.discountValue,
  );

  return { subtotal, discount, total };
}

function mapChildren(payload: QuotePayload) {
  const deliverables = payload.deliverables
    .filter((d) => d.title.trim() || d.description.trim())
    .map((d, index) => ({
      title: d.title.trim() || "Untitled deliverable",
      description: d.description.trim() || null,
      quantity: d.quantity || 1,
      sort_order: index,
    }));

  const sections = payload.budgetSections.map((section, sectionIndex) => ({
    name: section.name,
    sort_order: sectionIndex,
    line_items: section.lineItems
      .filter((item) => item.description.trim() || item.dayRate || item.numDays)
      .map((item, itemIndex) => ({
        description: item.description.trim() || "Line item",
        day_rate: item.dayRate,
        num_days: item.numDays,
        total_cost: calculateLineTotal(item.dayRate, item.numDays),
        sort_order: itemIndex,
      })),
  }));

  return { deliverables, sections };
}

export async function getCompaniesForQuoteAction() {
  return getAllCompanies();
}

export async function getContactsForQuoteAction(companyId: string) {
  if (!companyId) return [];
  return getContactsByCompanyId(companyId);
}

export async function getOpportunitiesForQuoteAction(companyId: string) {
  if (!companyId) return [];

  const { data } = await getOpportunitiesFiltered({ pageSize: 100 });
  return data.filter((opp) => opp.company_id === companyId);
}

export async function createQuoteAction(
  payloadJson: string,
): Promise<{ id?: string; quoteNumber?: string; error?: string }> {
  try {
    const payload = parsePayload(payloadJson);
    const { subtotal, discount, total } = buildTotals(payload);
    const quoteNumber = await generateQuoteNumber();
    const { deliverables, sections } = mapChildren(payload);

    const quote = await createQuoteRecord({
      quote_number: quoteNumber,
      company_id: payload.companyId,
      contact_id: payload.contactId,
      opportunity_id: payload.opportunityId,
      project_id: payload.projectId,
      project_title: payload.projectTitle.trim() || null,
      client_name: payload.clientName.trim() || null,
      notes: payload.notes.trim() || null,
      expiry_date: payload.expiryDate || null,
      quote_status: payload.status,
      subtotal,
      discount,
      discount_type: payload.discountType,
      discount_value: payload.discountValue,
      total,
    });

    await saveQuoteChildren(quote.id, deliverables, sections);

    revalidatePath("/quotes");
    revalidatePath("/");

    return { id: quote.id, quoteNumber: quote.quote_number };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create quote.",
    };
  }
}

export async function updateQuoteAction(
  quoteId: string,
  payloadJson: string,
): Promise<QuoteActionState> {
  try {
    const payload = parsePayload(payloadJson);
    const existing = await getQuoteFullById(quoteId);
    const { subtotal, discount, total } = buildTotals(payload);
    const { deliverables, sections } = mapChildren(payload);

    await updateQuoteRecord(quoteId, {
      company_id: payload.companyId,
      contact_id: payload.contactId,
      opportunity_id: payload.opportunityId,
      project_id: payload.projectId,
      project_title: payload.projectTitle.trim() || null,
      client_name: payload.clientName.trim() || null,
      notes: payload.notes.trim() || null,
      expiry_date: payload.expiryDate || null,
      quote_status: payload.status,
      subtotal,
      discount,
      discount_type: payload.discountType,
      discount_value: payload.discountValue,
      total,
    });

    await saveQuoteChildren(quoteId, deliverables, sections);

    if (
      payload.status === "approved" &&
      existing.quote_status !== "approved" &&
      !payload.projectId &&
      !existing.project_id
    ) {
      const { createProjectFromQuote } = await import(
        "@/lib/projects/create-from-quote"
      );
      await createProjectFromQuote(quoteId);
    }

    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quoteId}`);
    revalidatePath("/projects");
    revalidatePath("/");

    return { success: "Quote saved successfully." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to save quote.",
    };
  }
}

export async function duplicateQuoteAction(
  quoteId: string,
): Promise<{ id?: string; quoteNumber?: string; error?: string }> {
  try {
    const source = await getQuoteFullById(quoteId);
    const quoteNumber = await generateQuoteNumber();

    const quote = await createQuoteRecord({
      quote_number: quoteNumber,
      company_id: source.company_id,
      contact_id: source.contact_id,
      opportunity_id: source.opportunity_id,
      project_id: source.project_id,
      project_title: source.project_title,
      client_name: source.client_name,
      notes: source.notes,
      expiry_date: source.expiry_date,
      quote_status: "draft",
      subtotal: source.subtotal,
      discount: source.discount,
      discount_type: source.discount_type,
      discount_value: source.discount_value,
      total: source.total,
    });

    const deliverables = source.deliverables.map((d) => ({
      title: d.title,
      description: d.description,
      quantity: d.quantity,
      sort_order: d.sort_order,
    }));

    const sections = source.budget_sections.map((section) => ({
      name: section.name,
      sort_order: section.sort_order,
      line_items: section.line_items.map((item) => ({
        description: item.description,
        day_rate: item.day_rate,
        num_days: item.num_days,
        total_cost: item.total_cost,
        sort_order: item.sort_order,
      })),
    }));

    await saveQuoteChildren(quote.id, deliverables, sections);

    revalidatePath("/quotes");
    revalidatePath("/");

    return { id: quote.id, quoteNumber: quote.quote_number };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to duplicate quote.",
    };
  }
}

export async function archiveQuoteAction(
  quoteId: string,
): Promise<QuoteActionState> {
  try {
    await archiveQuote(quoteId);
    revalidatePath("/quotes");
    revalidatePath("/");
    redirect("/quotes");
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to archive quote.",
    };
  }
}
