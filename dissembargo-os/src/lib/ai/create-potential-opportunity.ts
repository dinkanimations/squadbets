import { createServiceClient } from "@/lib/supabase/service";
import type { InboxEmail, Json } from "@/types/database";
import type { PotentialOpportunity } from "@/types/potential-opportunity";
import type { AiClassificationResult } from "./constants";
import { logPipelineEvent } from "./pipeline-logger";

export async function createPotentialOpportunityFromInbox(
  inbox: InboxEmail,
  classification: AiClassificationResult,
): Promise<PotentialOpportunity> {
  const supabase = await createServiceClient();

  const companyName =
    classification.company_name ||
    inbox.detected_company_name ||
    inbox.sender_name ||
    "Unknown Company";

  const { data, error } = await supabase
    .from("potential_opportunities")
    .upsert(
      {
        user_id: inbox.user_id,
        inbox_id: inbox.id,
        company_id: null,
        contact_id: null,
        status: "pending",
        item_type: "new_opportunity",
        company_name: companyName,
        contact_name:
          classification.contact_name || inbox.sender_name || "Unknown Contact",
        contact_email:
          classification.contact_email || inbox.sender_email || null,
        contact_phone: classification.contact_phone,
        company_website:
          classification.website || inbox.detected_website || null,
        project_name: classification.project_name,
        project_description: classification.project_description,
        deliverables: classification.requested_deliverables,
        estimated_budget: classification.estimated_budget,
        deadline: classification.deadline,
        location: classification.location,
        ai_summary: classification.summary,
        ai_confidence: classification.confidence,
        ai_reasoning: classification.reasoning,
        extraction_json: classification as unknown as Json,
      },
      { onConflict: "inbox_id" },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to stage potential opportunity: ${error.message}`);
  }

  await supabase
    .from("inbox")
    .update({
      detected_company_name: companyName,
      detected_website: classification.website || inbox.detected_website,
    })
    .eq("id", inbox.id);

  await logPipelineEvent({
    userId: inbox.user_id,
    inboxId: inbox.id,
    stage: "potential_opportunity_created",
    message: `Staged potential opportunity: ${companyName}`,
    metadata: { potentialId: data.id },
  });

  return data as PotentialOpportunity;
}

export function classificationFromPotential(
  potential: PotentialOpportunity,
  inbox: InboxEmail,
): AiClassificationResult {
  const stored = potential.extraction_json as Partial<AiClassificationResult>;

  return {
    route: "potential_opportunity",
    confidence: potential.ai_confidence,
    summary: potential.ai_summary,
    reasoning: potential.ai_reasoning ?? "",
    signature: stored.signature ?? inbox.ai_signature,
    company_name: potential.company_name,
    contact_name: potential.contact_name,
    contact_email: potential.contact_email,
    contact_phone: potential.contact_phone,
    website: potential.company_website,
    project_name: potential.project_name,
    project_description: potential.project_description,
    estimated_budget: potential.estimated_budget,
    requested_deliverables: potential.deliverables,
    deadline: potential.deadline,
    location: potential.location,
    freelancer_name: null,
    freelancer_email: null,
    role: null,
    skills: null,
    software: null,
    portfolio_url: null,
    linkedin_url: null,
    day_rate: null,
    availability: null,
    notes: null,
    ...stored,
  };
}
