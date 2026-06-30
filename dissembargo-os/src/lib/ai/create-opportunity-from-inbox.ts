import { createServiceClient } from "@/lib/supabase/service";
import type { InboxEmail } from "@/types/database";
import type { AiClassificationResult } from "./constants";
import { AI_CATEGORY_LABELS } from "./constants";
import {
  findOrCreateCompany,
  findOrCreateContact,
} from "@/lib/company-intelligence/find-or-create-company";
import { enrichCompanyForOpportunity } from "@/lib/company-intelligence/enrich-company";

export async function createOpportunityFromInbox(
  inbox: InboxEmail,
  classification: AiClassificationResult,
  overrides?: {
    companyId?: string;
    contactId?: string;
    companyName?: string;
    category?: string;
    estimatedBudget?: number | null;
    requestedDeliverables?: string | null;
  },
) {
  const supabase = await createServiceClient();

  const companyName =
    overrides?.companyName?.trim() ||
    classification.company_name ||
    inbox.detected_company_name ||
    inbox.sender_name ||
    "Unknown Company";

  const contactName =
    classification.contact_name || inbox.sender_name || "Unknown Contact";

  const website =
    classification.website || inbox.detected_website || null;

  let companyId = overrides?.companyId ?? inbox.company_id ?? null;
  let contactId = overrides?.contactId ?? null;

  if (!companyId) {
    const company = await findOrCreateCompany({
      companyName,
      website,
      emailBody: inbox.body_plain ?? inbox.body_html,
      senderEmail: inbox.sender_email,
    });
    companyId = company.id;
  }

  if (!contactId) {
    const contact = await findOrCreateContact(
      companyId,
      contactName,
      classification.contact_email || inbox.sender_email,
    );
    contactId = contact.id;
  }

  const aiCategory =
    overrides?.category || AI_CATEGORY_LABELS[classification.category];

  const estimatedBudget =
    overrides?.estimatedBudget ?? classification.estimated_budget ?? null;

  const requestedDeliverables =
    overrides?.requestedDeliverables ??
    classification.requested_deliverables ??
    null;

  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .insert({
      company_id: companyId,
      contact_id: contactId,
      subject: inbox.subject,
      email_body: inbox.body_plain ?? inbox.body_html,
      ai_category: aiCategory,
      ai_confidence: classification.confidence,
      opportunity_status: "new",
      notes: [
        classification.summary,
        classification.project_description,
      ]
        .filter(Boolean)
        .join("\n\n"),
      estimated_budget: estimatedBudget,
      requested_deliverables: requestedDeliverables,
      inbox_id: inbox.id,
    })
    .select()
    .single();

  if (opportunityError) {
    throw new Error(`Failed to create opportunity: ${opportunityError.message}`);
  }

  await supabase
    .from("inbox")
    .update({
      opportunity_id: opportunity.id,
      company_id: companyId,
      detected_company_name: companyName,
      detected_website: website,
    })
    .eq("id", inbox.id);

  void enrichCompanyForOpportunity({
    companyId,
    companyName,
    website,
    emailBody: inbox.body_plain ?? inbox.body_html,
    senderEmail: inbox.sender_email,
  });

  return opportunity;
}
