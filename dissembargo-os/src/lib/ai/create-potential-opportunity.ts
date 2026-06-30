import { createServiceClient } from "@/lib/supabase/service";
import type { InboxEmail, Json } from "@/types/database";
import type { PotentialOpportunity } from "@/types/potential-opportunity";
import type { AiClassificationResult } from "./constants";
import {
  findOrCreateCompany,
  findOrCreateContact,
} from "@/lib/company-intelligence/find-or-create-company";
import { enrichCompanyForOpportunity } from "@/lib/company-intelligence/enrich-company";

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

  const contactName =
    classification.contact_name || inbox.sender_name || "Unknown Contact";

  const contactEmail =
    classification.contact_email || inbox.sender_email || null;

  const website =
    classification.website || inbox.detected_website || null;

  const company = await findOrCreateCompany({
    companyName,
    website,
    emailBody: inbox.body_plain ?? inbox.body_html,
    senderEmail: inbox.sender_email,
  });

  const contact = await findOrCreateContact(
    company.id,
    contactName,
    contactEmail,
  );

  const { data, error } = await supabase
    .from("potential_opportunities")
    .upsert(
      {
        user_id: inbox.user_id,
        inbox_id: inbox.id,
        company_id: company.id,
        contact_id: contact.id,
        status: "pending",
        company_name: company.company_name,
        contact_name: contact.full_name,
        contact_email: contact.email,
        contact_phone: classification.contact_phone,
        company_website: company.website ?? website,
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
    throw new Error(`Failed to create potential opportunity: ${error.message}`);
  }

  await supabase
    .from("inbox")
    .update({
      detected_company_name: company.company_name,
      detected_website: company.website ?? website,
      review_status: "pending_review",
    })
    .eq("id", inbox.id);

  void enrichCompanyForOpportunity({
    companyId: company.id,
    companyName: company.company_name,
    website: company.website ?? website,
    emailBody: inbox.body_plain ?? inbox.body_html,
    senderEmail: inbox.sender_email,
  });

  return data as PotentialOpportunity;
}

export function classificationFromPotential(
  potential: PotentialOpportunity,
  inbox: InboxEmail,
): AiClassificationResult {
  const stored = potential.extraction_json as Partial<AiClassificationResult>;

  return {
    category: "new_business_opportunity",
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
  };
}
