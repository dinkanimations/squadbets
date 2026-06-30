import { createAdminClient } from "@/lib/supabase/admin";
import type { InboxEmail } from "@/types/database";
import type { AiClassificationResult } from "./constants";

export type InboxEntityLinks = {
  companyId: string | null;
  contactId: string | null;
  opportunityId: string | null;
  quoteId: string | null;
  projectId: string | null;
  companyName: string | null;
  contactName: string | null;
  contactEmail: string | null;
};

const QUOTE_NUMBER_PATTERN = /\b(?:quote|quotation|ref|#)\s*[:#-]?\s*([A-Z0-9][-A-Z0-9]{2,})\b/i;

async function findContactByEmail(email: string | null) {
  if (!email) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("contacts")
    .select("id, company_id, full_name, email, company:companies(company_name)")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  return data;
}

async function findThreadLinks(
  inbox: InboxEmail,
): Promise<Partial<InboxEntityLinks>> {
  if (!inbox.thread_id) return {};

  const admin = createAdminClient();
  const { data } = await admin
    .from("inbox")
    .select(
      "company_id, opportunity_id, linked_quote_id, linked_project_id, detected_company_name",
    )
    .eq("user_id", inbox.user_id)
    .eq("thread_id", inbox.thread_id)
    .neq("id", inbox.id)
    .order("date_received", { ascending: false })
    .limit(5);

  for (const row of data ?? []) {
    if (row.company_id || row.opportunity_id || row.linked_quote_id || row.linked_project_id) {
      return {
        companyId: row.company_id,
        opportunityId: row.opportunity_id,
        quoteId: row.linked_quote_id,
        projectId: row.linked_project_id,
        companyName: row.detected_company_name,
      };
    }
  }

  return {};
}

async function findQuoteByReference(text: string | null) {
  if (!text) return null;

  const match = text.match(QUOTE_NUMBER_PATTERN);
  if (!match?.[1]) return null;

  const admin = createAdminClient();
  const ref = match[1];
  const { data } = await admin
    .from("quotes")
    .select("id, company_id, opportunity_id, project_title")
    .or(`quote_number.ilike.%${ref}%,project_title.ilike.%${ref}%`)
    .limit(1)
    .maybeSingle();

  return data;
}

async function findRecentOpportunityForCompany(companyId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("opportunities")
    .select("id")
    .eq("company_id", companyId)
    .in("opportunity_status", ["new", "contacted", "quote_requested", "quote_sent"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

async function findCompanyByName(name: string | null) {
  if (!name?.trim()) return null;

  const admin = createAdminClient();
  const term = name.trim();
  const { data } = await admin
    .from("companies")
    .select("id, company_name")
    .eq("status", "active")
    .ilike("company_name", term)
    .limit(1)
    .maybeSingle();

  return data;
}

export async function resolveInboxEntityLinks(
  inbox: InboxEmail,
  classification: AiClassificationResult,
): Promise<InboxEntityLinks> {
  const threadLinks = await findThreadLinks(inbox);
  const contact = await findContactByEmail(
    classification.contact_email || inbox.sender_email,
  );
  const quote = await findQuoteByReference(
    `${inbox.subject ?? ""} ${inbox.body_plain ?? ""}`,
  );

  let companyId =
    threadLinks.companyId ??
    contact?.company_id ??
    quote?.company_id ??
    null;

  let contactId = contact?.id ?? null;
  let opportunityId =
    threadLinks.opportunityId ?? quote?.opportunity_id ?? null;
  let quoteId = threadLinks.quoteId ?? quote?.id ?? null;
  let projectId = threadLinks.projectId ?? null;

  let companyName =
    threadLinks.companyName ??
    classification.company_name ??
    inbox.detected_company_name ??
    (contact?.company as { company_name?: string } | null)?.company_name ??
    null;

  let contactName =
    classification.contact_name ?? contact?.full_name ?? inbox.sender_name ?? null;

  let contactEmail =
    classification.contact_email ?? contact?.email ?? inbox.sender_email ?? null;

  if (!companyId && companyName) {
    const byName = await findCompanyByName(companyName);
    if (byName) {
      companyId = byName.id;
      companyName = byName.company_name;
    }
  }

  if (companyId && !opportunityId) {
    const recentOpportunity = await findRecentOpportunityForCompany(companyId);
    opportunityId = recentOpportunity?.id ?? null;
  }

  if (companyId && opportunityId && !projectId) {
    const admin = createAdminClient();
    const { data: project } = await admin
      .from("projects")
      .select("id")
      .eq("company_id", companyId)
      .in("status", ["planning", "in_progress", "waiting_for_client", "rendering", "review"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    projectId = project?.id ?? null;
  }

  return {
    companyId,
    contactId,
    opportunityId,
    quoteId,
    projectId,
    companyName,
    contactName,
    contactEmail,
  };
}

export async function updateCompanyLastContact(
  companyId: string,
  contactAt: string,
) {
  const admin = createAdminClient();

  const { data: company } = await admin
    .from("companies")
    .select("last_contact_at")
    .eq("id", companyId)
    .single();

  if (
    company?.last_contact_at &&
    new Date(company.last_contact_at) >= new Date(contactAt)
  ) {
    return;
  }

  await admin
    .from("companies")
    .update({ last_contact_at: contactAt })
    .eq("id", companyId);
}
