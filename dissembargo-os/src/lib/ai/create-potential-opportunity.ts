import { createServiceClient } from "@/lib/supabase/service";
import type { InboxEmail, Json } from "@/types/database";
import type {
  InboxItemType,
  PotentialOpportunity,
} from "@/types/potential-opportunity";
import type { AiClassificationResult } from "./constants";
import {
  findOrCreateCompany,
  findOrCreateContact,
} from "@/lib/company-intelligence/find-or-create-company";
import { enrichCompanyForOpportunity } from "@/lib/company-intelligence/enrich-company";
import {
  resolveInboxEntityLinks,
  updateCompanyLastContact,
} from "./link-inbox-entities";
import { logPipelineEvent } from "./pipeline-logger";

async function upsertInboxItem(
  inbox: InboxEmail,
  classification: AiClassificationResult,
  itemType: InboxItemType,
  fields: {
    companyId: string | null;
    contactId: string | null;
    companyName: string;
    companyWebsite: string | null;
    contactName: string | null;
    contactEmail: string | null;
    linkedOpportunityId?: string | null;
    linkedQuoteId?: string | null;
    linkedProjectId?: string | null;
  },
): Promise<PotentialOpportunity> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("potential_opportunities")
    .upsert(
      {
        user_id: inbox.user_id,
        inbox_id: inbox.id,
        company_id: fields.companyId,
        contact_id: fields.contactId,
        status: "pending",
        item_type: itemType,
        company_name: fields.companyName,
        contact_name: fields.contactName,
        contact_email: fields.contactEmail,
        contact_phone: classification.contact_phone,
        company_website: fields.companyWebsite,
        project_name: classification.project_name,
        project_description: classification.project_description,
        deliverables: classification.requested_deliverables,
        estimated_budget: classification.estimated_budget,
        deadline: classification.deadline,
        location: classification.location,
        ai_summary: classification.summary,
        ai_confidence: classification.confidence,
        ai_reasoning: classification.reasoning,
        linked_opportunity_id: fields.linkedOpportunityId ?? null,
        linked_quote_id: fields.linkedQuoteId ?? null,
        linked_project_id: fields.linkedProjectId ?? null,
        extraction_json: classification as unknown as Json,
      },
      { onConflict: "inbox_id" },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to stage inbox item: ${error.message}`);
  }

  await supabase
    .from("inbox")
    .update({
      company_id: fields.companyId,
      opportunity_id: fields.linkedOpportunityId ?? null,
      linked_quote_id: fields.linkedQuoteId ?? null,
      linked_project_id: fields.linkedProjectId ?? null,
      detected_company_name: fields.companyName,
      detected_website: fields.companyWebsite,
      review_status: "pending_review",
    })
    .eq("id", inbox.id);

  if (fields.companyId) {
    await updateCompanyLastContact(fields.companyId, inbox.date_received);
  }

  return data as PotentialOpportunity;
}

export async function createPotentialOpportunityFromInbox(
  inbox: InboxEmail,
  classification: AiClassificationResult,
): Promise<PotentialOpportunity> {
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

  await logPipelineEvent({
    userId: inbox.user_id,
    inboxId: inbox.id,
    stage: "company_linked",
    message: `Company linked: ${company.company_name}`,
    metadata: { companyId: company.id },
  });

  const contact = await findOrCreateContact(
    company.id,
    contactName,
    contactEmail,
  );

  const potential = await upsertInboxItem(inbox, classification, "new_opportunity", {
    companyId: company.id,
    contactId: contact.id,
    companyName: company.company_name,
    companyWebsite: company.website ?? website,
    contactName: contact.full_name,
    contactEmail: contact.email,
  });

  void enrichCompanyForOpportunity({
    companyId: company.id,
    companyName: company.company_name,
    website: company.website ?? website,
    emailBody: inbox.body_plain ?? inbox.body_html,
    senderEmail: inbox.sender_email,
  });

  return potential;
}

export async function createClientCommunicationFromInbox(
  inbox: InboxEmail,
  classification: AiClassificationResult,
): Promise<PotentialOpportunity> {
  const links = await resolveInboxEntityLinks(inbox, classification);

  let companyId = links.companyId;
  let contactId = links.contactId;
  let companyName =
    links.companyName ||
    classification.company_name ||
    inbox.detected_company_name ||
    inbox.sender_name ||
    "Unknown Company";

  const website = classification.website || inbox.detected_website || null;

  if (!companyId) {
    const company = await findOrCreateCompany({
      companyName,
      website,
      emailBody: inbox.body_plain ?? inbox.body_html,
      senderEmail: inbox.sender_email,
    });
    companyId = company.id;
    companyName = company.company_name;

    if (!contactId) {
      const contact = await findOrCreateContact(
        company.id,
        links.contactName || classification.contact_name || inbox.sender_name || "Unknown Contact",
        links.contactEmail || classification.contact_email || inbox.sender_email,
      );
      contactId = contact.id;
    }

    await supabaseMarkExistingClient(companyId);
  } else if (!contactId) {
    const contact = await findOrCreateContact(
      companyId,
      links.contactName || classification.contact_name || inbox.sender_name || "Unknown Contact",
      links.contactEmail || classification.contact_email || inbox.sender_email,
    );
    contactId = contact.id;
  }

  return upsertInboxItem(inbox, classification, "client_communication", {
    companyId,
    contactId,
    companyName,
    companyWebsite: website,
    contactName:
      links.contactName || classification.contact_name || inbox.sender_name,
    contactEmail:
      links.contactEmail || classification.contact_email || inbox.sender_email,
    linkedOpportunityId: links.opportunityId,
    linkedQuoteId: links.quoteId,
    linkedProjectId: links.projectId,
  });
}

async function supabaseMarkExistingClient(companyId: string) {
  const supabase = await createServiceClient();
  await supabase
    .from("companies")
    .update({ is_existing_client: true })
    .eq("id", companyId);
}

export function classificationFromPotential(
  potential: PotentialOpportunity,
  inbox: InboxEmail,
): AiClassificationResult {
  const stored = potential.extraction_json as Partial<AiClassificationResult>;

  return {
    category:
      potential.item_type === "client_communication"
        ? "existing_client"
        : "new_business_opportunity",
    routing_intent:
      potential.item_type === "client_communication"
        ? "existing_client_communication"
        : "new_business_enquiry",
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
