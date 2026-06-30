import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  PotentialOpportunity,
  PotentialOpportunityWithInbox,
} from "@/types/potential-opportunity";
import type { Database } from "@/types/database";
import {
  getPaginationRange,
  handleDatabaseError,
  withDevDbFallback,
  type PaginationOptions,
} from "./utils";

const POTENTIAL_SELECT = `
  *,
  inbox:inbox!potential_opportunities_inbox_id_fkey (
    id,
    subject,
    sender_name,
    sender_email,
    date_received,
    body_plain,
    body_html,
    attachments,
    thread_id,
    is_read
  ),
  company:companies!potential_opportunities_company_id_fkey (
    id,
    company_name,
    website,
    logo_url
  )
`;

export async function getPendingPotentialOpportunities(
  options?: PaginationOptions,
) {
  return withDevDbFallback(async () => {
    const supabase = await createClient();
    const { from, to } = getPaginationRange({
      page: options?.page,
      pageSize: options?.pageSize ?? 50,
    });

    const { data, error, count } = await supabase
      .from("potential_opportunities")
      .select(POTENTIAL_SELECT, { count: "exact" })
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      handleDatabaseError(error, "Failed to fetch potential opportunities");
    }

    return {
      data: (data ?? []) as PotentialOpportunityWithInbox[],
      count: count ?? 0,
    };
  }, { data: [] as PotentialOpportunityWithInbox[], count: 0 });
}

export async function getPotentialOpportunityById(id: string) {
  return withDevDbFallback(async () => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("potential_opportunities")
      .select(POTENTIAL_SELECT)
      .eq("id", id)
      .single();

    if (error) {
      handleDatabaseError(error, `Failed to fetch potential opportunity ${id}`);
    }

    return data as PotentialOpportunityWithInbox;
  }, null as unknown as PotentialOpportunityWithInbox);
}

export async function getPotentialOpportunityByInboxId(inboxId: string) {
  return withDevDbFallback(async () => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("potential_opportunities")
      .select(POTENTIAL_SELECT)
      .eq("inbox_id", inboxId)
      .maybeSingle();

    if (error) {
      handleDatabaseError(
        error,
        `Failed to fetch potential opportunity for inbox ${inboxId}`,
      );
    }

    return data as PotentialOpportunityWithInbox | null;
  }, null);
}

export async function countPendingPotentialOpportunities() {
  return withDevDbFallback(async () => {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("potential_opportunities")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    if (error) {
      handleDatabaseError(error, "Failed to count potential opportunities");
    }

    return count ?? 0;
  }, 0);
}

export async function updatePotentialOpportunity(
  id: string,
  input: Database["public"]["Tables"]["potential_opportunities"]["Update"],
) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("potential_opportunities")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    handleDatabaseError(error, `Failed to update potential opportunity ${id}`);
  }

  return data as PotentialOpportunity;
}

export async function getCompanyInboxEmails(companyId: string) {
  return withDevDbFallback(async () => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("potential_opportunities")
      .select(
        `
        id,
        status,
        ai_summary,
        ai_confidence,
        created_at,
        inbox:inbox!potential_opportunities_inbox_id_fkey (
          id,
          subject,
          sender_name,
          sender_email,
          date_received,
          opportunity_id
        )
      `,
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      handleDatabaseError(error, "Failed to fetch company email history");
    }

    return data ?? [];
  }, []);
}
