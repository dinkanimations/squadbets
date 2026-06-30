import { createServiceClient } from "@/lib/supabase/service";
import type { InboxEmail } from "@/types/database";
import type { PotentialOpportunity } from "@/types/potential-opportunity";
import type { AiClassificationResult } from "./constants";
import { AI_CATEGORY_LABELS } from "./constants";
import { createOpportunityFromInbox } from "./create-opportunity-from-inbox";
import { logPipelineEvent } from "./pipeline-logger";
import { ensureProspectClientForCompany } from "@/lib/database/clients";

export async function getExistingOpportunityForInbox(
  inboxId: string,
): Promise<{ id: string } | null> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select("id")
    .eq("inbox_id", inboxId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function autoCreateOpportunityFromInbox(
  inbox: InboxEmail,
  classification: AiClassificationResult,
  potential: PotentialOpportunity,
): Promise<{ opportunityId: string | null; created: boolean }> {
  if (potential.item_type !== "new_opportunity") {
    return { opportunityId: null, created: false };
  }

  const supabase = await createServiceClient();

  if (inbox.opportunity_id) {
    return { opportunityId: inbox.opportunity_id, created: false };
  }

  const existing = await getExistingOpportunityForInbox(inbox.id);
  if (existing) {
    await supabase
      .from("inbox")
      .update({ opportunity_id: existing.id })
      .eq("id", inbox.id);

    return { opportunityId: existing.id, created: false };
  }

  const opportunity = await createOpportunityFromInbox(inbox, classification, {
    companyId: potential.company_id ?? undefined,
    contactId: potential.contact_id ?? undefined,
    companyName: potential.company_name,
    category: AI_CATEGORY_LABELS.new_business_opportunity,
    estimatedBudget: potential.estimated_budget,
    requestedDeliverables: potential.deliverables,
  });

  if (potential.company_id) {
    await ensureProspectClientForCompany(potential.company_id);

    await logPipelineEvent({
      userId: inbox.user_id,
      inboxId: inbox.id,
      stage: "client_created",
      message: `Prospect client ensured for ${potential.company_name}`,
      metadata: { companyId: potential.company_id },
    });
  }

  await supabase
    .from("potential_opportunities")
    .update({
      status: "accepted",
      opportunity_id: opportunity.id,
    })
    .eq("id", potential.id);

  await supabase
    .from("inbox")
    .update({
      review_status: "auto_created",
      opportunity_id: opportunity.id,
      company_id: potential.company_id,
    })
    .eq("id", inbox.id);

  await logPipelineEvent({
    userId: inbox.user_id,
    inboxId: inbox.id,
    stage: "opportunity_created",
    message: `Auto-created opportunity from ${inbox.subject ?? "email"}`,
    metadata: {
      opportunityId: opportunity.id,
      companyId: potential.company_id,
      confidence: classification.confidence,
    },
  });

  return { opportunityId: opportunity.id, created: true };
}
