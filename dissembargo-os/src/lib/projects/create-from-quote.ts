import { createAdminClient } from "@/lib/supabase/admin";
import { createClientRecord, getClientByCompanyId } from "@/lib/database/clients";
import {
  createProjectRecord,
  saveProjectDeliverables,
} from "@/lib/database/projects";
import { getQuoteFullById, updateQuoteRecord } from "@/lib/database/quotes";
import type { Project } from "@/types/database";

export async function ensureClientForCompany(companyId: string): Promise<string> {
  const existing = await getClientByCompanyId(companyId);
  if (existing) return existing.id;

  const client = await createClientRecord({
    company_id: companyId,
    client_status: "active",
    onboarding_date: new Date().toISOString().split("T")[0],
  });

  return client.id;
}

export async function createProjectFromQuote(
  quoteId: string,
): Promise<Project> {
  const quote = await getQuoteFullById(quoteId);

  if (!quote.company_id) {
    throw new Error("Quote must be linked to a company before creating a project.");
  }

  if (quote.project_id) {
    const supabase = await import("@/lib/supabase/server").then((m) =>
      m.createClient(),
    );
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", quote.project_id)
      .single();
    if (data) return data as Project;
  }

  const clientId = await ensureClientForCompany(quote.company_id);

  const project = await createProjectRecord({
    client_id: clientId,
    company_id: quote.company_id,
    contact_id: quote.contact_id,
    opportunity_id: quote.opportunity_id,
    quote_id: quote.id,
    project_name: quote.project_title?.trim() || `Project ${quote.quote_number}`,
    status: "planning",
    budget: quote.total,
    notes: quote.notes,
  });

  await updateQuoteRecord(quote.id, { project_id: project.id });

  const deliverables = quote.deliverables
    .filter((d) => d.title.trim())
    .map((d, index) => ({
      title: d.title.trim(),
      description: d.description,
      is_complete: false,
      sort_order: index,
    }));

  if (deliverables.length > 0) {
    await saveProjectDeliverables(project.id, deliverables);
  }

  const admin = createAdminClient();

  await admin
    .from("production_schedules")
    .update({ project_id: project.id })
    .eq("quote_id", quote.id)
    .is("project_id", null);

  if (quote.opportunity_id) {
    await admin
      .from("opportunities")
      .update({ opportunity_status: "won" })
      .eq("id", quote.opportunity_id);
  }

  return project;
}
