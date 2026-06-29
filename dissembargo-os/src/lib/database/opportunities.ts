import { createClient } from "@/lib/supabase/server";
import type {
  OpportunityInsert,
  OpportunityStatus,
  OpportunityUpdate,
} from "@/types/database";
import type { OpportunitiesFilter } from "@/lib/opportunities/constants";
import {
  getPaginationRange,
  handleDatabaseError,
} from "./utils";

export async function getOpportunitiesFiltered(filters: OpportunitiesFilter = {}) {
  const supabase = await createClient();
  const { from, to } = getPaginationRange({
    page: filters.page,
    pageSize: filters.pageSize ?? 50,
  });

  let matchingCompanyIds: string[] | undefined;

  if (filters.search?.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;

    const [{ data: companies }, { data: contacts }] = await Promise.all([
      supabase.from("companies").select("id").ilike("company_name", searchTerm),
      supabase.from("contacts").select("id").ilike("full_name", searchTerm),
    ]);

    matchingCompanyIds = companies?.map((company) => company.id);

    const contactIds = contacts?.map((contact) => contact.id) ?? [];
    const searchFilters = [
      `subject.ilike.${searchTerm}`,
      `notes.ilike.${searchTerm}`,
    ];

    if (matchingCompanyIds && matchingCompanyIds.length > 0) {
      searchFilters.push(`company_id.in.(${matchingCompanyIds.join(",")})`);
    }

    if (contactIds.length > 0) {
      searchFilters.push(`contact_id.in.(${contactIds.join(",")})`);
    }

    let query = supabase
      .from("opportunities")
      .select(
        `
        *,
        company:companies (*),
        contact:contacts (*)
      `,
        { count: "exact" },
      )
      .or(searchFilters.join(","))
      .order("created_at", { ascending: filters.sort === "asc" })
      .range(from, to);

    if (filters.status) {
      query = query.eq("opportunity_status", filters.status);
    }

    const { data, error, count } = await query;

    if (error) handleDatabaseError(error, "Failed to fetch opportunities");

    return { data, count: count ?? 0 };
  }

  let query = supabase
    .from("opportunities")
    .select(
      `
      *,
      company:companies (*),
      contact:contacts (*)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: filters.sort === "asc" })
    .range(from, to);

  if (filters.status) {
    query = query.eq("opportunity_status", filters.status);
  }

  const { data, error, count } = await query;

  if (error) handleDatabaseError(error, "Failed to fetch opportunities");

  return { data, count: count ?? 0 };
}

export async function countOpportunities(options?: {
  status?: OpportunityStatus;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true });

  if (options?.status) {
    query = query.eq("opportunity_status", options.status);
  }

  const { count, error } = await query;

  if (error) handleDatabaseError(error, "Failed to count opportunities");

  return count ?? 0;
}

export async function getOpportunityById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      *,
      company:companies (*),
      contact:contacts (*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) handleDatabaseError(error, `Failed to fetch opportunity ${id}`);

  return data;
}

export async function createOpportunity(input: OpportunityInsert) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("opportunities")
    .insert(input)
    .select(
      `
      *,
      company:companies (*),
      contact:contacts (*)
    `,
    )
    .single();

  if (error) handleDatabaseError(error, "Failed to create opportunity");

  return data;
}

export async function updateOpportunity(id: string, input: OpportunityUpdate) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("opportunities")
    .update(input)
    .eq("id", id)
    .select(
      `
      *,
      company:companies (*),
      contact:contacts (*)
    `,
    )
    .single();

  if (error) handleDatabaseError(error, `Failed to update opportunity ${id}`);

  return data;
}

export async function deleteOpportunity(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("opportunities").delete().eq("id", id);

  if (error) handleDatabaseError(error, `Failed to delete opportunity ${id}`);

  return true;
}

export async function updateOpportunityStatus(
  id: string,
  status: OpportunityStatus,
) {
  return updateOpportunity(id, { opportunity_status: status });
}

const PIPELINE_STAGE_GROUPS: Array<{
  stage: string;
  statuses: OpportunityStatus[];
}> = [
  { stage: "Discovery", statuses: ["new", "contacted"] },
  { stage: "Proposal", statuses: ["quote_requested"] },
  { stage: "Negotiation", statuses: ["quote_sent"] },
  { stage: "Closed Won", statuses: ["won"] },
];

export async function getOpportunityPipelineSummary() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select("opportunity_status, estimated_budget")
    .not("opportunity_status", "in", '("lost","archived")');

  if (error) handleDatabaseError(error, "Failed to fetch pipeline summary");

  const rows = data ?? [];
  const totalValue = rows.reduce(
    (sum, row) => sum + Number(row.estimated_budget ?? 0),
    0,
  );

  const stages = PIPELINE_STAGE_GROUPS.map((group) => {
    const matches = rows.filter((row) =>
      group.statuses.includes(row.opportunity_status),
    );
    const amount = matches.reduce(
      (sum, row) => sum + Number(row.estimated_budget ?? 0),
      0,
    );

    return {
      stage: group.stage,
      deals: matches.length,
      amount,
      percentage:
        totalValue > 0 ? Math.round((amount / totalValue) * 100) : 0,
    };
  });

  return { stages, totalValue };
}
