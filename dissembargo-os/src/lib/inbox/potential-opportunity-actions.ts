"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getInboxEmailById } from "@/lib/database/inbox";
import {
  getPotentialOpportunityById,
  updatePotentialOpportunity,
} from "@/lib/database/potential-opportunities";
import { createOpportunityFromInbox } from "@/lib/ai/create-opportunity-from-inbox";
import {
  classificationFromPotential,
} from "@/lib/ai/create-potential-opportunity";
import { logAiClassificationFeedback } from "@/lib/database/ai-logs";
import { getUser } from "@/lib/auth/session";
import { AI_CATEGORY_LABELS } from "@/lib/ai/constants";
import type { Database } from "@/types/database";

type PotentialOpportunityUpdate =
  Database["public"]["Tables"]["potential_opportunities"]["Update"];

export type PotentialOpportunityActionState = {
  error?: string;
  success?: string;
  opportunityId?: string;
};

async function getCurrentUserId(): Promise<string | null> {
  const { user } = await getUser();
  return user?.id ?? null;
}

export async function acceptPotentialOpportunityAction(
  potentialId: string,
): Promise<PotentialOpportunityActionState> {
  try {
    const potential = await getPotentialOpportunityById(potentialId);

    if (!potential || potential.status !== "pending") {
      return { error: "This potential opportunity is no longer available." };
    }

    const inbox = await getInboxEmailById(potential.inbox_id);
    const classification = classificationFromPotential(potential, inbox);

    const opportunity = await createOpportunityFromInbox(inbox, classification, {
      companyName: potential.company_name,
      category: AI_CATEGORY_LABELS.new_business_opportunity,
      estimatedBudget: potential.estimated_budget,
      requestedDeliverables: potential.deliverables,
    });

    const supabase = await createServiceClient();
    const userId = await getCurrentUserId();

    await updatePotentialOpportunity(potentialId, {
      status: "accepted",
      opportunity_id: opportunity.id,
    } satisfies PotentialOpportunityUpdate);

    await supabase
      .from("inbox")
      .update({
        review_status: "approved",
        opportunity_id: opportunity.id,
      })
      .eq("id", potential.inbox_id);

    await logAiClassificationFeedback({
      inboxId: potential.inbox_id,
      userId: userId ?? potential.user_id,
      originalCategory: "new_business_opportunity",
      correctedCategory: "new_business_opportunity",
      originalConfidence: potential.ai_confidence,
      feedbackAction: "approved",
      companyNameOverride: potential.company_name,
    });

    revalidatePath("/inbox");
    revalidatePath("/opportunities");
    revalidatePath(`/companies/${potential.company_id}`);
    revalidatePath("/");

    return {
      success: "Opportunity created.",
      opportunityId: opportunity.id,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to accept potential opportunity.",
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

    revalidatePath("/inbox");
    revalidatePath("/");

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
      })
      .eq("id", potential.inbox_id);

    revalidatePath("/inbox");
    revalidatePath(`/companies/${company.id}`);

    return { success: `Linked to ${company.company_name}.` };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to merge with company.",
    };
  }
}

export async function acceptAndRedirectAction(potentialId: string) {
  const result = await acceptPotentialOpportunityAction(potentialId);

  if (result.error || !result.opportunityId) {
    return result;
  }

  redirect(`/opportunities/${result.opportunityId}`);
}
