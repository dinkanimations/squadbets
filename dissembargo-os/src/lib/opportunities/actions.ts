"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCompany, getAllCompanies } from "@/lib/database/companies";
import { createContact, getContactsByCompanyId } from "@/lib/database/contacts";
import {
  createOpportunity,
  deleteOpportunity,
  updateOpportunity,
  updateOpportunityStatus,
} from "@/lib/database/opportunities";
import type { OpportunityStatus } from "@/types/database";

export type OpportunityActionState = {
  error?: string;
  success?: string;
};

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

async function resolveCompanyAndContact(formData: FormData) {
  const companyMode = String(formData.get("companyMode") ?? "existing");
  const contactMode = String(formData.get("contactMode") ?? "none");

  let companyId = String(formData.get("companyId") ?? "").trim();

  if (companyMode === "new") {
    const companyName = String(formData.get("companyName") ?? "").trim();
    if (!companyName) {
      throw new Error("Company name is required.");
    }

    const company = await createCompany({ company_name: companyName });
    companyId = company.id;
  } else if (!companyId) {
    throw new Error("Please select a company.");
  }

  let contactId: string | null = null;

  if (contactMode === "existing") {
    contactId = String(formData.get("contactId") ?? "").trim() || null;
  } else if (contactMode === "new") {
    const fullName = String(formData.get("contactName") ?? "").trim();
    if (!fullName) {
      throw new Error("Contact name is required when creating a new contact.");
    }

    const contact = await createContact({
      company_id: companyId,
      full_name: fullName,
      email: String(formData.get("contactEmail") ?? "").trim() || null,
      phone: String(formData.get("contactPhone") ?? "").trim() || null,
      role: String(formData.get("contactRole") ?? "").trim() || null,
    });
    contactId = contact.id;
  }

  return { companyId, contactId };
}

function parseOpportunityFields(formData: FormData) {
  return {
    subject: String(formData.get("subject") ?? "").trim() || null,
    email_body: String(formData.get("emailBody") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    estimated_budget: parseOptionalNumber(formData.get("estimatedBudget")),
    opportunity_status: (String(formData.get("status") ?? "new") ||
      "new") as OpportunityStatus,
    ai_category: String(formData.get("aiCategory") ?? "").trim() || null,
    ai_confidence: parseOptionalNumber(formData.get("aiConfidence")),
  };
}

export async function getContactsForCompanyAction(companyId: string) {
  if (!companyId) return [];
  return getContactsByCompanyId(companyId);
}

export async function getCompaniesForFormAction() {
  return getAllCompanies();
}

export async function createOpportunityAction(
  _prevState: OpportunityActionState,
  formData: FormData,
): Promise<OpportunityActionState> {
  let opportunityId: string | null = null;

  try {
    const { companyId, contactId } = await resolveCompanyAndContact(formData);
    const fields = parseOpportunityFields(formData);

    const opportunity = await createOpportunity({
      company_id: companyId,
      contact_id: contactId,
      ...fields,
    });

    opportunityId = opportunity.id;
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create opportunity.",
    };
  }

  revalidatePath("/opportunities");
  revalidatePath("/");
  redirect(`/opportunities/${opportunityId}`);
}

export async function updateOpportunityAction(
  _prevState: OpportunityActionState,
  formData: FormData,
): Promise<OpportunityActionState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Opportunity ID is required." };

  try {
    const { companyId, contactId } = await resolveCompanyAndContact(formData);
    const fields = parseOpportunityFields(formData);

    await updateOpportunity(id, {
      company_id: companyId,
      contact_id: contactId,
      ...fields,
    });

    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${id}`);
    revalidatePath("/");

    return { success: "Opportunity updated successfully." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update opportunity.",
    };
  }
}

export async function updateOpportunityStatusAction(
  id: string,
  status: OpportunityStatus,
): Promise<OpportunityActionState> {
  try {
    await updateOpportunityStatus(id, status);
    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${id}`);
    revalidatePath("/");
    return { success: "Status updated." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update status.",
    };
  }
}

export async function deleteOpportunityAction(
  id: string,
): Promise<OpportunityActionState> {
  try {
    await deleteOpportunity(id);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete opportunity.",
    };
  }

  revalidatePath("/opportunities");
  revalidatePath("/");
  redirect("/opportunities");
}
