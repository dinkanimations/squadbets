"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getInboxEmailById } from "@/lib/database/inbox";
import {
  getPotentialOpportunityById,
  updatePotentialOpportunity,
} from "@/lib/database/potential-opportunities";
import { classificationFromPotential } from "@/lib/ai/create-potential-opportunity";
import { logAiClassificationFeedback } from "@/lib/database/ai-logs";
import { getUser } from "@/lib/auth/session";
import {
  findOrCreateCompany,
  findOrCreateContact,
} from "@/lib/company-intelligence/find-or-create-company";
import { ensureProspectClientForCompany } from "@/lib/database/clients";
import { logPipelineEvent } from "@/lib/ai/pipeline-logger";
import type { Database } from "@/types/database";

type PotentialOpportunityUpdate =
  Database["public"]["Tables"]["potential_opportunities"]["Update"];

export type PotentialOpportunityActionState = {
  error?: string;
  success?: string;
  companyId?: string;
  clientId?: string;
  quoteUrl?: string;
};

async function getCurrentUserId(): Promise<string | null> {
  const { user } = await getUser();
  return user?.id ?? null;
}

/** Create a Company from a potential opportunity — does NOT create a Client. */
export async function convertPotentialToCompanyAction(
  potentialId: string,
): Promise<PotentialOpportunityActionState> {
  try {
    const potential = await getPotentialOpportunityById(potentialId);

    if (!potential || potential.status !== "pending") {
      return { error: "This potential opportunity is no longer available." };
    }

    const inbox = await getInboxEmailById(potential.inbox_id);
    const classification = classificationFromPotential(potential, inbox);

    const company = await findOrCreateCompany({
      companyName: potential.company_name,
      website: potential.company_website,
      emailBody: inbox.body_plain ?? inbox.body_html,
      senderEmail: inbox.sender_email,
    });

    const contact = await findOrCreateContact(
      company.id,
      potential.contact_name || classification.contact_name || "Unknown Contact",
      potential.contact_email || classification.contact_email,
    );

    const supabase = await createServiceClient();

    await updatePotentialOpportunity(potentialId, {
      company_id: company.id,
      contact_id: contact.id,
      company_name: company.company_name,
      company_website: company.website,
      status: "converted",
    } satisfies PotentialOpportunityUpdate);

    await supabase
      .from("inbox")
      .update({
        company_id: company.id,
        detected_company_name: company.company_name,
        detected_website: company.website,
        review_status: "approved",
      })
      .eq("id", potential.inbox_id);

    await logPipelineEvent({
      userId: potential.user_id,
      inboxId: potential.inbox_id,
      stage: "company_linked",
      message: `Converted to company: ${company.company_name}`,
      metadata: { companyId: company.id, potentialId },
    });

    const userId = await getCurrentUserId();
    await logAiClassificationFeedback({
      inboxId: potential.inbox_id,
      userId: userId ?? potential.user_id,
      originalCategory: "new_business_opportunity",
      correctedCategory: "new_business_opportunity",
      originalConfidence: potential.ai_confidence,
      feedbackAction: "approved",
      companyNameOverride: company.company_name,
    });

    revalidatePath("/potential-opportunities");
    revalidatePath(`/companies/${company.id}`);
    revalidatePath("/companies");

    return {
      success: `Company created: ${company.company_name}`,
      companyId: company.id,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to convert to company.",
    };
  }
}

/**
 * Manually promote a company to Client. Normally happens after quote acceptance —
 * this action is for explicit user control.
 */
export async function convertPotentialToClientAction(
  potentialId: string,
): Promise<PotentialOpportunityActionState> {
  try {
    const potential = await getPotentialOpportunityById(potentialId);

    if (!potential || potential.status === "dismissed") {
      return { error: "This potential opportunity is no longer available." };
    }

    let companyId = potential.company_id;

    if (!companyId) {
      const companyResult = await convertPotentialToCompanyAction(potentialId);
      if (companyResult.error || !companyResult.companyId) {
        return {
          error:
            companyResult.error ??
            "Create a company first before converting to client.",
        };
      }
      companyId = companyResult.companyId;
    }

    const clientId = await ensureProspectClientForCompany(companyId);

    await logPipelineEvent({
      userId: potential.user_id,
      inboxId: potential.inbox_id,
      stage: "client_created",
      message: "Company promoted to client",
      metadata: { companyId, clientId, potentialId },
    });

    revalidatePath("/potential-opportunities");
    revalidatePath("/clients");
    revalidatePath(`/companies/${companyId}`);

    return {
      success: "Company converted to client.",
      companyId,
      clientId,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to convert to client.",
    };
  }
}

export async function createQuoteFromPotentialAction(
  potentialId: string,
): Promise<PotentialOpportunityActionState> {
  try {
    const potential = await getPotentialOpportunityById(potentialId);

    if (!potential || potential.status === "dismissed") {
      return { error: "This potential opportunity is no longer available." };
    }

    let companyId = potential.company_id;

    if (!companyId) {
      const companyResult = await convertPotentialToCompanyAction(potentialId);
      if (companyResult.error || !companyResult.companyId) {
        return { error: companyResult.error ?? "Failed to create company." };
      }
      companyId = companyResult.companyId;
    }

    const params = new URLSearchParams({
      companyId,
      potentialId,
    });
    if (potential.contact_id) {
      params.set("contactId", potential.contact_id);
    }

    return {
      success: "Redirecting to quote builder…",
      quoteUrl: `/quotes/new?${params.toString()}`,
      companyId,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to start quote.",
    };
  }
}

export async function dismissPotentialOpportunityAction(
  potentialId: string,
): Promise<PotentialOpportunityActionState> {
  try {
    const potential = await getPotentialOpportunityById(potentialId);

    if (!potential || potential.status !== "pending") {
      return { error: "This potential opportunity is no longer available." };
    }

    const supabase = await createServiceClient();
    const userId = await getCurrentUserId();

    await updatePotentialOpportunity(potentialId, {
      status: "dismissed",
    } satisfies PotentialOpportunityUpdate);

    await supabase
      .from("inbox")
      .update({ review_status: "rejected" })
      .eq("id", potential.inbox_id);

    await logAiClassificationFeedback({
      inboxId: potential.inbox_id,
      userId: userId ?? potential.user_id,
      originalCategory: "new_business_opportunity",
      correctedCategory: "new_business_opportunity",
      originalConfidence: potential.ai_confidence,
      feedbackAction: "rejected",
    });

    revalidatePath("/potential-opportunities");
    revalidatePath("/inbox");

    return { success: "Potential opportunity dismissed." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to dismiss potential opportunity.",
    };
  }
}

export async function mergePotentialOpportunityCompanyAction(
  potentialId: string,
  companyId: string,
): Promise<PotentialOpportunityActionState> {
  try {
    const potential = await getPotentialOpportunityById(potentialId);

    if (!potential || potential.status !== "pending") {
      return { error: "This potential opportunity is no longer available." };
    }

    const supabase = await createServiceClient();

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, company_name, website")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return { error: "Company not found." };
    }

    await updatePotentialOpportunity(potentialId, {
      company_id: company.id,
      company_name: company.company_name,
      company_website: company.website,
    } satisfies PotentialOpportunityUpdate);

    await supabase
      .from("inbox")
      .update({
        detected_company_name: company.company_name,
        detected_website: company.website,
        company_id: company.id,
      })
      .eq("id", potential.inbox_id);

    revalidatePath("/potential-opportunities");
    revalidatePath(`/companies/${company.id}`);

    return { success: `Linked to ${company.company_name}.`, companyId: company.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to merge with company.",
    };
  }
}

export async function convertToCompanyAndRedirectAction(potentialId: string) {
  const result = await convertPotentialToCompanyAction(potentialId);
  if (result.error || !result.companyId) return result;
  redirect(`/companies/${result.companyId}`);
}

export async function createQuoteAndRedirectAction(potentialId: string) {
  const result = await createQuoteFromPotentialAction(potentialId);
  if (result.error || !result.quoteUrl) return result;
  redirect(result.quoteUrl);
}

/** @deprecated Use convertPotentialToCompanyAction */
export async function acceptPotentialOpportunityAction(potentialId: string) {
  return convertPotentialToCompanyAction(potentialId);
}

export async function acceptAndRedirectAction(potentialId: string) {
  return convertToCompanyAndRedirectAction(potentialId);
}
