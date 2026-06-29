import { createAdminClient } from "@/lib/supabase/admin";
import type { InboxEmail } from "@/types/database";
import type { AiClassificationResult } from "./constants";
import { AI_CATEGORY_LABELS } from "./constants";

export async function createOpportunityFromInbox(
  inbox: InboxEmail,
  classification: AiClassificationResult,
  overrides?: {
    companyName?: string;
    category?: string;
  },
) {
  const admin = createAdminClient();

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

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      company_name: companyName,
      website,
    })
    .select()
    .single();

  if (companyError) {
    throw new Error(`Failed to create company: ${companyError.message}`);
  }

  const { data: contact, error: contactError } = await admin
    .from("contacts")
    .insert({
      company_id: company.id,
      full_name: contactName,
      email: inbox.sender_email,
    })
    .select()
    .single();

  if (contactError) {
    throw new Error(`Failed to create contact: ${contactError.message}`);
  }

  const aiCategory =
    overrides?.category || AI_CATEGORY_LABELS[classification.category];

  const { data: opportunity, error: opportunityError } = await admin
    .from("opportunities")
    .insert({
      company_id: company.id,
      contact_id: contact.id,
      subject: inbox.subject,
      email_body: inbox.body_plain ?? inbox.body_html,
      ai_category: aiCategory,
      ai_confidence: classification.confidence,
      opportunity_status: "new",
      notes: classification.summary,
      inbox_id: inbox.id,
    })
    .select()
    .single();

  if (opportunityError) {
    throw new Error(`Failed to create opportunity: ${opportunityError.message}`);
  }

  await admin
    .from("inbox")
    .update({
      opportunity_id: opportunity.id,
      detected_company_name: companyName,
      detected_website: website,
    })
    .eq("id", inbox.id);

  return opportunity;
}
